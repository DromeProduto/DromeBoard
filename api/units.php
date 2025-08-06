<?php
require_once '../config/database.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

$action = $_GET['action'] ?? $_POST['action'] ?? 'list';

// Log para debug
error_log('Action recebida: ' . $action);
error_log('Método: ' . $_SERVER['REQUEST_METHOD']);

try {
    switch ($action) {
        case 'list':
        case 'get':
            getUnits();
            break;
        case 'users':
            getUnitUsers();
            break;
        case 'create':
            createUnit();
            break;
        case 'update':
            updateUnit();
            break;
        case 'delete':
            deleteUnit();
            break;
        case 'toggle_module':
            toggleUnitModule();
            break;
        case 'test':
            echo json_encode(['success' => true, 'message' => 'Test endpoint working']);
            break;
        default:
            throw new Exception('Ação não encontrada: ' . $action);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}

function getUnitUsers() {
    if (!isset($_GET['unit_id'])) {
        throw new Exception('ID da unidade é obrigatório');
    }
    
    $unit_id = $_GET['unit_id'];
    $database = new Database();
    $pdo = $database->getConnection();
    
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
            uu.created_at as assigned_at,
            uu.assigned_by,
            uu.is_active as assignment_active
        FROM users u
        LEFT JOIN roles r ON u.role_id = r.id
        INNER JOIN user_units uu ON u.id = uu.user_id
        WHERE uu.unit_id = ? 
            AND uu.is_active = true
            AND u.is_active = true
        ORDER BY uu.created_at DESC
    ";
    
    try {
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$unit_id]);
        $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Formatar dados
        foreach ($users as &$user) {
            $user['created_at_formatted'] = date('d/m/Y H:i', strtotime($user['created_at']));
            $user['last_login_formatted'] = $user['last_login'] ? date('d/m/Y H:i', strtotime($user['last_login'])) : 'Nunca';
            $user['assigned_at_formatted'] = date('d/m/Y H:i', strtotime($user['assigned_at']));
        }
        
        echo json_encode([
            'success' => true,
            'message' => 'Usuários da unidade carregados com sucesso',
            'data' => ['users' => $users]
        ]);
        
    } catch (Exception $e) {
        error_log('Erro ao buscar usuários da unidade: ' . $e->getMessage());
        throw new Exception('Erro ao carregar usuários da unidade: ' . $e->getMessage());
    }
}

function getUnits() {
    error_log('=== getUnits chamada ===');
    
    try {
        $database = new Database();
        $pdo = $database->getConnection();
        
        if (!$pdo) {
            throw new Exception('Falha na conexão com o banco de dados');
        }
        
        // **CORREÇÃO:** Query para trazer todas as unidades (ativas e inativas)
        $sql = "
            SELECT 
                u.id,
                u.name,
                u.code,
                u.address,
                u.phone,
                u.email,
                u.is_active,
                u.created_at,
                u.updated_at
            FROM units u
            ORDER BY u.is_active DESC, u.name ASC
        ";
        
        error_log('Executando query SQL: ' . $sql);
        
        $stmt = $pdo->prepare($sql);
        $result = $stmt->execute();
        
        if (!$result) {
            $errorInfo = $stmt->errorInfo();
            error_log('Erro SQL: ' . json_encode($errorInfo));
            throw new Exception('Erro na consulta SQL: ' . $errorInfo[2]);
        }
        
        $units = $stmt->fetchAll(PDO::FETCH_ASSOC);
        error_log('Unidades encontradas: ' . count($units));
        
        // **CORREÇÃO:** Para cada unidade, buscar módulos habilitados
        foreach ($units as &$unit) {
            error_log('Processando unidade: ' . $unit['name']);
            
            // Buscar módulos habilitados para esta unidade
            $modulesSql = "
                SELECT m.id
                FROM unit_modules um
                INNER JOIN modules m ON um.module_id = m.id
                WHERE um.unit_id = ? AND um.is_active = true
            ";
            
            try {
                $modulesStmt = $pdo->prepare($modulesSql);
                $modulesStmt->execute([$unit['id']]);
                $unit['enabled_modules'] = $modulesStmt->fetchAll(PDO::FETCH_COLUMN, 0);
                error_log('Módulos para ' . $unit['name'] . ': ' . count($unit['enabled_modules']));
            } catch (Exception $e) {
                error_log('Erro ao buscar módulos para unidade ' . $unit['id'] . ': ' . $e->getMessage());
                $unit['enabled_modules'] = [];
            }
        }
        
        // **CORREÇÃO:** Formato de resposta consistente
        echo json_encode([
            'success' => true,
            'message' => 'Unidades carregadas com sucesso',
            'units' => $units,
            'total' => count($units)
        ], JSON_PRETTY_PRINT);
        
    } catch (Exception $e) {
        error_log('Erro em getUnits: ' . $e->getMessage());
        echo json_encode([
            'success' => false,
            'message' => 'Erro ao carregar unidades: ' . $e->getMessage(),
            'units' => [],
            'total' => 0
        ]);
    }
}

function createUnit() {
    error_log('=== createUnit chamada ===');
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        error_log('Erro: Input vazio ou inválido');
        throw new Exception('Dados inválidos');
    }
    
    error_log('Input recebido: ' . json_encode($input));
    
    // Validar campos obrigatórios
    if (empty($input['name'])) {
        throw new Exception('Nome da unidade é obrigatório');
    }
    
    if (empty($input['code'])) {
        throw new Exception('Código da unidade é obrigatório');
    }
    
    $database = new Database();
    $pdo = $database->getConnection();
    
    // Verificar se o código já existe
    $checkSql = "SELECT id FROM units WHERE code = ?";
    $checkStmt = $pdo->prepare($checkSql);
    $checkStmt->execute([$input['code']]);
    if ($checkStmt->fetch()) {
        throw new Exception('Código já existe');
    }
    
    $pdo->beginTransaction();
    
    try {
        // Inserir unidade com RETURNING para PostgreSQL
        $sql = "
            INSERT INTO units (name, code, address, phone, email, is_active)
            VALUES (?, ?, ?, ?, ?, ?)
            RETURNING id
        ";
        
        // Processar o valor boolean
        $isActiveValue = $input['is_active'] ?? true;
        $isActiveForDB = ($isActiveValue === true || $isActiveValue === 'true' || $isActiveValue === 1 || $isActiveValue === '1');
        
        $stmt = $pdo->prepare($sql);
        $result = $stmt->execute([
            $input['name'],
            $input['code'],
            !empty($input['address']) ? $input['address'] : null,
            !empty($input['phone']) ? $input['phone'] : null,
            !empty($input['email']) ? $input['email'] : null,
            $isActiveForDB
        ]);
        
        if (!$result) {
            $errorInfo = $stmt->errorInfo();
            error_log('Erro SQL: ' . json_encode($errorInfo));
            throw new Exception('Erro ao inserir unidade: ' . $errorInfo[2]);
        }
        
        // Obter o ID retornado
        $unitRow = $stmt->fetch(PDO::FETCH_ASSOC);
        $unitId = $unitRow['id'];
        error_log('Unidade criada com ID: ' . $unitId);
        
        // Inserir módulos habilitados
        if (isset($input['enabled_modules']) && is_array($input['enabled_modules'])) {
            foreach ($input['enabled_modules'] as $moduleId) {
                $modulesSql = "
                    INSERT INTO unit_modules (unit_id, module_id, is_active)
                    VALUES (?, ?, true)
                ";
                $modulesStmt = $pdo->prepare($modulesSql);
                $modulesStmt->execute([$unitId, $moduleId]);
            }
        }
        
        $pdo->commit();
        
        echo json_encode([
            'success' => true,
            'message' => 'Unidade criada com sucesso',
            'unit_id' => $unitId
        ]);
        
    } catch (Exception $e) {
        $pdo->rollBack();
        error_log('Erro na transação: ' . $e->getMessage());
        throw $e;
    }
}

function updateUnit() {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input || !isset($input['id'])) {
        throw new Exception('ID da unidade é obrigatório');
    }
    
    // Log para debug
    error_log('Dados recebidos na API: ' . json_encode($input));
    error_log('is_active original: ' . var_export($input['is_active'] ?? 'não definido', true));
    
    // Verificar e limpar campos vazios que podem causar problemas
    $cleanedInput = [];
    foreach ($input as $key => $value) {
        if ($value === '' || $value === null) {
            if ($key === 'is_active') {
                $cleanedInput[$key] = true; // Default para true se vazio
            } else {
                $cleanedInput[$key] = null; // Para outros campos, usar null
            }
        } else {
            $cleanedInput[$key] = $value;
        }
    }
    
    error_log('Dados limpos: ' . json_encode($cleanedInput));
    
    $database = new Database();
    $pdo = $database->getConnection();
    
    // Verificar se o código já existe (exceto para esta unidade)
    if (!empty($cleanedInput['code'])) {
        $checkSql = "SELECT id FROM units WHERE code = ? AND id != ?";
        $checkStmt = $pdo->prepare($checkSql);
        $checkStmt->execute([$cleanedInput['code'], $cleanedInput['id']]);
        if ($checkStmt->fetch()) {
            throw new Exception('Código já existe');
        }
    }
    
    $pdo->beginTransaction();
    
    try {
        // Atualizar unidade
        $sql = "
            UPDATE units 
            SET name = ?, code = ?, address = ?, phone = ?, email = ?, is_active = ?, updated_at = NOW()
            WHERE id = ?
        ";
        
        // Processar o valor boolean
        $isActiveValue = $cleanedInput['is_active'];
        
        // Converter para inteiro (PostgreSQL aceita 0/1 para boolean)
        if ($isActiveValue === true || $isActiveValue === 'true' || $isActiveValue === 1 || $isActiveValue === '1') {
            $isActiveForDB = 1;
        } else if ($isActiveValue === false || $isActiveValue === 'false' || $isActiveValue === 0 || $isActiveValue === '0') {
            $isActiveForDB = 0;
        } else {
            $isActiveForDB = 1; // Default to true if unclear
        }
        
        error_log('is_active original: ' . var_export($isActiveValue, true));
        error_log('is_active processado: ' . var_export($isActiveForDB, true));
        
        $stmt = $pdo->prepare($sql);
        $executeResult = $stmt->execute([
            $cleanedInput['name'],
            $cleanedInput['code'],
            $cleanedInput['address'],
            $cleanedInput['phone'],
            $cleanedInput['email'],
            $isActiveForDB,
            $cleanedInput['id']
        ]);
        
        error_log('Execução SQL resultado: ' . var_export($executeResult, true));
        
        // Remover módulos antigos
        $deleteSql = "DELETE FROM unit_modules WHERE unit_id = ?";
        $deleteStmt = $pdo->prepare($deleteSql);
        $deleteStmt->execute([$cleanedInput['id']]);
        
        // Inserir novos módulos habilitados
        if (isset($input['enabled_modules']) && is_array($input['enabled_modules'])) {
            foreach ($input['enabled_modules'] as $moduleId) {
                $modulesSql = "
                    INSERT INTO unit_modules (unit_id, module_id, is_active)
                    VALUES (?, ?, true)
                ";
                $modulesStmt = $pdo->prepare($modulesSql);
                $modulesStmt->execute([$cleanedInput['id'], $moduleId]);
            }
        }
        
        $pdo->commit();
        
        echo json_encode([
            'success' => true,
            'message' => 'Unidade atualizada com sucesso'
        ]);
        
    } catch (Exception $e) {
        $pdo->rollBack();
        throw $e;
    }
}

function deleteUnit() {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input || !isset($input['id'])) {
        throw new Exception('ID da unidade é obrigatório');
    }
    
    $database = new Database();
    $pdo = $database->getConnection();
    
    $pdo->beginTransaction();
    
    try {
        // Verificar se há usuários vinculados
        $checkUsersSql = "SELECT COUNT(*) FROM user_units WHERE unit_id = ?";
        $checkUsersStmt = $pdo->prepare($checkUsersSql);
        $checkUsersStmt->execute([$input['id']]);
        $userCount = $checkUsersStmt->fetchColumn();
        
        if ($userCount > 0) {
            throw new Exception('Não é possível excluir esta unidade pois há usuários vinculados a ela');
        }
        
        // Excluir módulos da unidade
        $deleteModulesSql = "DELETE FROM unit_modules WHERE unit_id = ?";
        $deleteModulesStmt = $pdo->prepare($deleteModulesSql);
        $deleteModulesStmt->execute([$input['id']]);
        
        // Marcar unidade como inativa (soft delete)
        $sql = "UPDATE units SET is_active = false, updated_at = NOW() WHERE id = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$input['id']]);
        
        $pdo->commit();
        
        echo json_encode([
            'success' => true,
            'message' => 'Unidade excluída com sucesso'
        ]);
        
    } catch (Exception $e) {
        $pdo->rollBack();
        throw $e;
    }
}

function toggleUnitModule() {
    error_log("Toggle module function called");
    
    $input = json_decode(file_get_contents('php://input'), true);
    error_log("Input received: " . json_encode($input));
    
    if (!$input || !isset($input['unit_id']) || !isset($input['module_id']) || !isset($input['is_active'])) {
        $error = 'Dados obrigatórios: unit_id, module_id, is_active';
        error_log("Validation error: " . $error);
        throw new Exception($error);
    }
    
    error_log("Validation passed, proceeding with database operation");
    
    $database = new Database();
    $pdo = $database->getConnection();
    
    $pdo->beginTransaction();
    
    try {
        if ($input['is_active']) {
            // Ativar módulo: inserir ou atualizar para ativo
            $sql = "
                INSERT INTO unit_modules (unit_id, module_id, is_active, enabled_at, created_at)
                VALUES (?, ?, true, NOW(), NOW())
                ON CONFLICT (unit_id, module_id) 
                DO UPDATE SET 
                    is_active = true,
                    enabled_at = NOW()
            ";
        } else {
            // Desativar módulo: atualizar para inativo
            $sql = "
                INSERT INTO unit_modules (unit_id, module_id, is_active, disabled_at, created_at)
                VALUES (?, ?, false, NOW(), NOW())
                ON CONFLICT (unit_id, module_id) 
                DO UPDATE SET 
                    is_active = false,
                    disabled_at = NOW()
            ";
        }
        
        $stmt = $pdo->prepare($sql);
        $result = $stmt->execute([$input['unit_id'], $input['module_id']]);
        
        if (!$result) {
            throw new Exception('Erro ao alterar módulo da unidade');
        }
        
        $pdo->commit();
        
        echo json_encode([
            'success' => true,
            'message' => $input['is_active'] ? 'Módulo ativado' : 'Módulo desativado'
        ]);
        
    } catch (Exception $e) {
        $pdo->rollBack();
        throw $e;
    }
}
?>
