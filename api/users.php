<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once '../config/database.php';

class UsersAPI {
    private $pdo;
    
    public function __construct() {
        $database = new Database();
        $this->pdo = $database->getConnection();
    }
    
    public function handleRequest() {
        $method = $_SERVER['REQUEST_METHOD'];
        $action = $_GET['action'] ?? '';
        
        try {
            switch ($method) {
                case 'GET':
                    if ($action === 'roles') {
                        $this->getRoles();
                    } elseif ($action === 'units') {
                        $this->getUnits();
                    } else {
                        $this->getUsers();
                    }
                    break;
                case 'POST':
                    if ($action === 'create') {
                        $this->createUser();
                    } elseif ($action === 'update') {
                        $this->updateUser();
                    } elseif ($action === 'delete') {
                        $this->deleteUser();
                    } elseif ($action === 'reset-password') {
                        $this->resetPassword();
                    }
                    break;
                default:
                    $this->sendResponse(false, 'Método não permitido', null, 405);
            }
        } catch (Exception $e) {
            $this->sendResponse(false, 'Erro interno: ' . $e->getMessage(), null, 500);
        }
    }
    
    private function getUsers() {
        // Verificar se está filtrando por unidade específica
        $unit_id = isset($_GET['unit_id']) ? (int)$_GET['unit_id'] : null;
        
        if ($unit_id) {
            // Query para usuários de uma unidade específica
            $sql = "
                SELECT 
                    u.id,
                    u.name,
                    u.email,
                    u.phone,
                    u.is_active,
                    u.last_login,
                    u.created_at,
                    u.role_id,
                    r.display_name as role_name,
                    r.level as role_level,
                    uu.created_at as assigned_at
                FROM users u
                LEFT JOIN roles r ON u.role_id = r.id
                INNER JOIN user_units uu ON u.id = uu.user_id
                WHERE u.email != 'admin@dashflow.com' 
                    AND uu.unit_id = ? 
                    AND uu.is_active = true
                ORDER BY uu.created_at DESC
            ";
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([$unit_id]);
            $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Format dates
            foreach ($users as &$user) {
                $user['created_at_formatted'] = date('d/m/Y H:i', strtotime($user['created_at']));
                $user['last_login_formatted'] = $user['last_login'] ? date('d/m/Y H:i', strtotime($user['last_login'])) : 'Nunca';
                $user['assigned_at_formatted'] = date('d/m/Y H:i', strtotime($user['assigned_at']));
            }
            
            $this->sendResponse(true, 'Usuários da unidade carregados com sucesso', ['users' => $users]);
        } else {
            // Query para todos os usuários (comportamento original)
            $sql = "
                SELECT 
                    u.id,
                    u.name,
                    u.email,
                    u.phone,
                    u.is_active,
                    u.last_login,
                    u.created_at,
                    u.role_id,
                    r.display_name as role_name,
                    r.level as role_level,
                    (
                        SELECT COUNT(uu.unit_id) 
                        FROM user_units uu 
                        WHERE uu.user_id = u.id AND uu.is_active = true
                    ) as assigned_units,
                    (
                        SELECT string_agg(un.name, ', ') 
                        FROM user_units uu 
                        JOIN units un ON uu.unit_id = un.id 
                        WHERE uu.user_id = u.id AND uu.is_active = true
                    ) as unit_names
                FROM users u
                LEFT JOIN roles r ON u.role_id = r.id
                WHERE u.email != 'admin@dashflow.com'
                ORDER BY u.created_at DESC
            ";
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute();
            $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Format dates and additional info
            foreach ($users as &$user) {
                $user['created_at_formatted'] = date('d/m/Y H:i', strtotime($user['created_at']));
                $user['last_login_formatted'] = $user['last_login'] ? date('d/m/Y H:i', strtotime($user['last_login'])) : 'Nunca';
                $user['assigned_units'] = (int)$user['assigned_units'];
            }
            
            $this->sendResponse(true, 'Usuários carregados com sucesso', ['users' => $users]);
        }
    }
    
    private function getRoles() {
        $sql = "SELECT id, name, display_name, level, description FROM roles ORDER BY level DESC";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute();
        $roles = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $this->sendResponse(true, 'Roles carregados com sucesso', ['roles' => $roles]);
    }
    
    private function getUnits() {
        $sql = "SELECT id, name, code FROM units WHERE is_active = true ORDER BY name";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute();
        $units = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $this->sendResponse(true, 'Unidades carregadas com sucesso', ['units' => $units]);
    }
    
    private function createUser() {
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$this->validateUserInput($input)) {
            $this->sendResponse(false, 'Dados inválidos');
            return;
        }
        
        // Check if email already exists
        $sql = "SELECT id FROM users WHERE email = ?";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$input['email']]);
        
        if ($stmt->fetch()) {
            $this->sendResponse(false, 'Email já está em uso');
            return;
        }
        
        $this->pdo->beginTransaction();
        
        try {
            // Create user
            $sql = "
                INSERT INTO users (name, email, password, phone, role_id, is_active) 
                VALUES (?, ?, ?, ?, ?, ?) RETURNING id
            ";
            
            $hashedPassword = password_hash($input['password'] ?? '123456', PASSWORD_DEFAULT);
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([
                $input['name'],
                $input['email'],
                $hashedPassword,
                $input['phone'] ?? null,
                $input['role_id'],
                $input['is_active'] ?? true
            ]);
            
            $result = $stmt->fetch();
            $userId = $result['id'];
            
            // Assign units if provided
            if (!empty($input['assigned_units'])) {
                $this->assignUnitsToUser($userId, $input['assigned_units']);
            }
            
            $this->pdo->commit();
            $this->sendResponse(true, 'Usuário criado com sucesso', ['user_id' => $userId]);
            
        } catch (Exception $e) {
            $this->pdo->rollBack();
            $this->sendResponse(false, 'Erro ao criar usuário: ' . $e->getMessage());
        }
    }
    
    private function updateUser() {
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($input['id']) || !$this->validateUserInput($input, false)) {
            $this->sendResponse(false, 'Dados inválidos');
            return;
        }
        
        // Check if email is already used by another user
        $sql = "SELECT id FROM users WHERE email = ? AND id != ?";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$input['email'], $input['id']]);
        
        if ($stmt->fetch()) {
            $this->sendResponse(false, 'Email já está em uso por outro usuário');
            return;
        }
        
        $this->pdo->beginTransaction();
        
        try {
            // Update user
            $sql = "
                UPDATE users 
                SET name = ?, email = ?, phone = ?, role_id = ?, is_active = ?, updated_at = NOW()
                WHERE id = ?
            ";
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([
                $input['name'],
                $input['email'],
                $input['phone'] ?? null,
                $input['role_id'],
                $input['is_active'] ?? true,
                $input['id']
            ]);
            
            // Update password if provided
            if (!empty($input['password'])) {
                $sql = "UPDATE users SET password = ? WHERE id = ?";
                $stmt = $this->pdo->prepare($sql);
                $stmt->execute([
                    password_hash($input['password'], PASSWORD_DEFAULT),
                    $input['id']
                ]);
            }
            
            // Update unit assignments
            if (isset($input['assigned_units'])) {
                // Remove existing assignments
                $sql = "DELETE FROM user_units WHERE user_id = ?";
                $stmt = $this->pdo->prepare($sql);
                $stmt->execute([$input['id']]);
                
                // Add new assignments
                if (!empty($input['assigned_units'])) {
                    $this->assignUnitsToUser($input['id'], $input['assigned_units']);
                }
            }
            
            $this->pdo->commit();
            $this->sendResponse(true, 'Usuário atualizado com sucesso');
            
        } catch (Exception $e) {
            $this->pdo->rollBack();
            $this->sendResponse(false, 'Erro ao atualizar usuário: ' . $e->getMessage());
        }
    }
    
    private function deleteUser() {
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($input['id'])) {
            $this->sendResponse(false, 'ID do usuário é obrigatório');
            return;
        }
        
        try {
            // Soft delete - just deactivate the user
            $sql = "UPDATE users SET is_active = false, updated_at = NOW() WHERE id = ?";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([$input['id']]);
            
            if ($stmt->rowCount() > 0) {
                $this->sendResponse(true, 'Usuário desativado com sucesso');
            } else {
                $this->sendResponse(false, 'Usuário não encontrado');
            }
            
        } catch (Exception $e) {
            $this->sendResponse(false, 'Erro ao desativar usuário: ' . $e->getMessage());
        }
    }
    
    private function resetPassword() {
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($input['id'])) {
            $this->sendResponse(false, 'ID do usuário é obrigatório');
            return;
        }
        
        try {
            $newPassword = $input['new_password'] ?? '123456';
            $hashedPassword = password_hash($newPassword, PASSWORD_DEFAULT);
            
            $sql = "UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([$hashedPassword, $input['id']]);
            
            if ($stmt->rowCount() > 0) {
                $this->sendResponse(true, 'Senha resetada com sucesso', ['new_password' => $newPassword]);
            } else {
                $this->sendResponse(false, 'Usuário não encontrado');
            }
            
        } catch (Exception $e) {
            $this->sendResponse(false, 'Erro ao resetar senha: ' . $e->getMessage());
        }
    }
    
    private function assignUnitsToUser($userId, $unitIds) {
        foreach ($unitIds as $unitId) {
            $sql = "
                INSERT INTO user_units (user_id, unit_id, assigned_by, is_active) 
                VALUES (?, ?, ?, true)
                ON CONFLICT (user_id, unit_id) 
                DO UPDATE SET is_active = true, assigned_at = NOW()
            ";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([$userId, $unitId, null]); // assigned_by would be current user in real scenario
        }
    }
    
    private function validateUserInput($input, $isCreate = true) {
        if ($isCreate) {
            return isset($input['name']) && isset($input['email']) && isset($input['role_id']) &&
                   !empty(trim($input['name'])) && !empty(trim($input['email'])) && !empty($input['role_id']);
        } else {
            return isset($input['name']) && isset($input['email']) && isset($input['role_id']) &&
                   !empty(trim($input['name'])) && !empty(trim($input['email'])) && !empty($input['role_id']);
        }
    }
    
    private function sendResponse($success, $message, $data = null, $httpCode = 200) {
        http_response_code($httpCode);
        echo json_encode([
            'success' => $success,
            'message' => $message,
            'data' => $data
        ]);
        exit;
    }
}

$api = new UsersAPI();
$api->handleRequest();
?>
