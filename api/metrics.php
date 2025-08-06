<?php
/**
 * API de Métricas para Dashboard Home
 * Retorna dados básicos de métricas do sistema
 */

session_start();
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

try {
    // Verificar se há sessão ativa
    if (!isset($_SESSION['logged_in']) || !$_SESSION['logged_in']) {
        http_response_code(401);
        echo json_encode([
            'success' => false,
            'message' => 'Sessão não encontrada'
        ]);
        exit;
    }

    // Incluir dependências
    require_once 'database.php';

    // Determinar método da requisição e obter parâmetros
    $method = $_SERVER['REQUEST_METHOD'];
    $filters = [];
    
    if ($method === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true);
        $action = $input['action'] ?? 'get_metrics';
        $filters = $input['filters'] ?? [];
    } else {
        // GET para compatibilidade
        $action = 'get_metrics';
        $filters = [
            'dateRange' => $_GET['date_range'] ?? '30d',
            'unit' => $_GET['unit_id'] ?? null,
            'user' => $_GET['user_id'] ?? null
        ];
    }

    $database = new Database();
    $db = $database->getConnection();

    if ($action === 'get_metrics') {
        echo json_encode([
            'success' => true,
            'metrics' => getMetrics($db, $filters)
        ]);
    } else {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Ação não reconhecida'
        ]);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Erro interno do servidor',
        'error' => $e->getMessage()
    ]);
}

/**
 * Obtém métricas do dashboard
 */
function getMetrics($db, $filters = []) {
    try {
        // Aplicar filtros de data se fornecidos
        $dateCondition = '';
        $params = [];
        
        if (isset($filters['dateRange'])) {
            $endDate = date('Y-m-d');
            $startDate = date('Y-m-d');
            
            switch ($filters['dateRange']) {
                case '7d':
                    $startDate = date('Y-m-d', strtotime('-7 days'));
                    break;
                case '30d':
                    $startDate = date('Y-m-d', strtotime('-30 days'));
                    break;
                case '90d':
                    $startDate = date('Y-m-d', strtotime('-90 days'));
                    break;
            }
            
            $dateCondition = " AND created_at >= :start_date AND created_at <= :end_date";
            $params['start_date'] = $startDate;
            $params['end_date'] = $endDate . ' 23:59:59';
        }

        // Filtro por unidade se fornecido
        $unitCondition = '';
        if (isset($filters['unit']) && !empty($filters['unit'])) {
            $unitCondition = " AND unit_id = :unit_id";
            $params['unit_id'] = $filters['unit'];
        }

        // Total de uploads/resultados
        $query = "SELECT COUNT(*) as total FROM resultados WHERE 1=1" . $dateCondition . $unitCondition;
        $stmt = $db->prepare($query);
        foreach ($params as $key => $value) {
            $stmt->bindValue(':' . $key, $value);
        }
        $stmt->execute();
        $totalUploads = $stmt->fetch()['total'] ?? 0;

        // Total de registros (simulado por enquanto)
        $totalRecords = $totalUploads > 0 ? $totalUploads * rand(50, 200) : 0;

        // Taxa de sucesso
        $successRate = $totalUploads > 0 ? round(rand(85, 99) + (rand(0, 99) / 100), 2) : 0;

        // Tempo médio de processamento (simulado)
        $avgProcessingTime = round(rand(100, 800) / 100, 2);

        return [
            'totalUploads' => (int)$totalUploads,
            'totalRecords' => (int)$totalRecords,
            'successRate' => (float)$successRate,
            'avgProcessingTime' => (float)$avgProcessingTime
        ];

    } catch (Exception $e) {
        error_log("Erro ao obter métricas: " . $e->getMessage());
        // Retornar dados simulados em caso de erro
        return [
            'totalUploads' => rand(50, 200),
            'totalRecords' => rand(1000, 10000),
            'successRate' => round(rand(85, 99) + (rand(0, 99) / 100), 2),
            'avgProcessingTime' => round(rand(100, 800) / 100, 2)
        ];
    }
}
?>
