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
    // Destruir sessão
    if (session_status() === PHP_SESSION_ACTIVE) {
        // Limpar todas as variáveis de sessão
        $_SESSION = array();
        
        // Destruir cookie de sessão se existir
        if (ini_get("session.use_cookies")) {
            $params = session_get_cookie_params();
            setcookie(session_name(), '', time() - 42000,
                $params["path"], $params["domain"],
                $params["secure"], $params["httponly"]
            );
        }
        
        // Destruir a sessão
        session_destroy();
    }
    
    echo json_encode([
        'success' => true,
        'message' => 'Logout realizado com sucesso',
        'redirect' => 'login.html'
    ]);
    
} catch (Exception $e) {
    error_log("Erro no logout: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'Erro interno do servidor'
    ]);
}
?>
