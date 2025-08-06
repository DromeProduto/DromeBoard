<?php
require_once '../config/database.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST');
header('Access-Control-Allow-Headers: Content-Type');

$action = $_GET['action'] ?? 'list';

try {
    switch ($action) {
        case 'list':
            getModules();
            break;
        case 'by_unit':
            getModulesByUnit();
            break;
        default:
            throw new Exception('Ação não reconhecida');
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}

function getModules() {
    $database = new Database();
    $pdo = $database->getConnection();
    
    $sql = "
        SELECT id, name, display_name, description, icon, required_role, order_index
        FROM modules 
        WHERE is_active = true
        ORDER BY order_index ASC, display_name ASC
    ";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute();
    $modules = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'modules' => $modules
    ]);
}

function getModulesByUnit() {
    $unit_id = $_GET['unit_id'] ?? null;
    
    if (!$unit_id) {
        throw new Exception('unit_id é obrigatório');
    }
    
    $database = new Database();
    $pdo = $database->getConnection();
    
    // Buscar módulos ativos para a unidade específica
    $sql = "
        SELECT 
            m.id, 
            m.name, 
            m.display_name, 
            m.description, 
            m.icon, 
            m.required_role, 
            m.order_index,
            m.route,
            m.parent_module,
            COALESCE(um.is_active, false) as unit_module_active
        FROM modules m
        LEFT JOIN unit_modules um ON m.id = um.module_id AND um.unit_id = ?
        WHERE m.is_active = true 
        AND (um.is_active = true OR um.is_active IS NULL)
        ORDER BY m.order_index ASC, m.display_name ASC
    ";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$unit_id]);
    $modules = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Filtrar apenas módulos que estão ativos para a unidade
    $activeModules = array_filter($modules, function($module) {
        return $module['unit_module_active'] == true;
    });
    
    echo json_encode([
        'success' => true,
        'modules' => array_values($activeModules),
        'unit_id' => $unit_id
    ]);
}
?>
