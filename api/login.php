<?php
session_start();
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

// Verificar se é POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método não permitido']);
    exit;
}

try {
    // Incluir arquivos necessários
    require_once '../config/database.php';
    require_once '../models/User.php';

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

    // Instanciar User e autenticar
    $user = new User($db);
    $result = $user->authenticate($email, $password);

    if ($result['success']) {
        // Criar sessão
        $_SESSION['user_id'] = $result['user']['id'];
        $_SESSION['user_email'] = $result['user']['email'];
        $_SESSION['user_name'] = $result['user']['name'];
        $_SESSION['user_role'] = $result['user']['role_name'];
        $_SESSION['role_level'] = $result['user']['role_level'];
        $_SESSION['logged_in'] = true;

        // Adicionar redirect - todos vão para dashboard.html
        $redirect_url = 'dashboard.html';

        echo json_encode([
            'success' => true,
            'message' => $result['message'],
            'user' => $result['user'],
            'redirect' => $redirect_url
        ]);
    } else {
        http_response_code(401);
        echo json_encode($result);
    }

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>
