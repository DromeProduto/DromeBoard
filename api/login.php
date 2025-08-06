<?php
session_start();
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Responder a preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Verificar se é POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método não permitido']);
    exit;
}

try {
    // Incluir conexão com banco
    require_once 'database.php';

    // Ler dados JSON do corpo da requisição
    $json = file_get_contents('php://input');
    $data = json_decode($json, true);

    // Validar dados recebidos
    if (!isset($data['email']) || !isset($data['password'])) {
        throw new Exception('Email e senha são obrigatórios');
    }

    $email = filter_var(trim($data['email']), FILTER_VALIDATE_EMAIL);
    $password = trim($data['password']);

    if (!$email) {
        throw new Exception('Email inválido');
    }

    if (empty($password)) {
        throw new Exception('Senha não pode estar vazia');
    }

    // Conectar ao banco
    $database = new Database();
    $db = $database->getConnection();

    // Autenticar diretamente na tabela users
    $query = "SELECT u.*, r.name as role_name, r.display_name as role_display_name, r.level as role_level 
              FROM users u 
              LEFT JOIN roles r ON u.role_id = r.id 
              WHERE u.email = :email AND u.is_active = true";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(':email', $email);
    $stmt->execute();
    
    $user = $stmt->fetch();

    if (!$user) {
        throw new Exception('Usuário não encontrado ou inativo');
    }

    // Verificar senha (assumindo password_hash/password_verify)
    if (password_verify($password, $user['password'])) {
        // Senha correta - buscar unidades do usuário
        $unitsQuery = "SELECT un.* FROM units un 
                       JOIN user_units uu ON un.id = uu.unit_id 
                       WHERE uu.user_id = :user_id AND uu.is_active = true AND un.is_active = true";
        
        $unitsStmt = $db->prepare($unitsQuery);
        $unitsStmt->bindParam(':user_id', $user['id']);
        $unitsStmt->execute();
        $units = $unitsStmt->fetchAll();

        // Buscar módulos disponíveis
        $modulesQuery = "SELECT DISTINCT m.* FROM modules m
                        JOIN unit_modules um ON m.id = um.module_id
                        JOIN user_units uu ON um.unit_id = uu.unit_id
                        WHERE uu.user_id = :user_id 
                          AND m.is_active = true 
                          AND um.is_active = true 
                          AND uu.is_active = true
                        ORDER BY m.order_index";
        
        $modulesStmt = $db->prepare($modulesQuery);
        $modulesStmt->bindParam(':user_id', $user['id']);
        $modulesStmt->execute();
        $modules = $modulesStmt->fetchAll();

        // Atualizar último login
        $updateQuery = "UPDATE users SET last_login = NOW() WHERE id = :user_id";
        $updateStmt = $db->prepare($updateQuery);
        $updateStmt->bindParam(':user_id', $user['id']);
        $updateStmt->execute();

        // Criar sessão
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['user_email'] = $user['email'];
        $_SESSION['user_name'] = $user['name'];
        $_SESSION['user_role'] = $user['role_name'];
        $_SESSION['role_level'] = $user['role_level'];
        $_SESSION['logged_in'] = true;

        // Resposta de sucesso
        echo json_encode([
            'success' => true,
            'message' => 'Login realizado com sucesso',
            'user' => [
                'id' => $user['id'],
                'name' => $user['name'],
                'email' => $user['email'],
                'phone' => $user['phone'],
                'role_name' => $user['role_name'],
                'role_display_name' => $user['role_display_name'],
                'role_level' => $user['role_level'],
                'units' => $units,
                'modules' => $modules
            ],
            'redirect' => '../core/dashboard.html'
        ]);
    } else {
        http_response_code(401);
        echo json_encode([
            'success' => false,
            'message' => 'Senha incorreta'
        ]);
    }

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>
