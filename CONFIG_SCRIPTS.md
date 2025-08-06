# Scripts de Configuração Automática - DromeBoard

Este arquivo contém scripts para automatizar a configuração inicial do DromeBoard.

## 🔧 Script de Configuração Completa do Banco

```sql
-- ====================================
-- DROMEBOARD - CONFIGURAÇÃO COMPLETA
-- ====================================

-- 1. Criar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Função para atualizar timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 3. Limpar dados existentes (CUIDADO EM PRODUÇÃO)
-- TRUNCATE TABLE user_module_permissions CASCADE;
-- TRUNCATE TABLE unit_modules CASCADE;
-- TRUNCATE TABLE user_units CASCADE;
-- TRUNCATE TABLE users CASCADE;
-- TRUNCATE TABLE modules CASCADE;
-- TRUNCATE TABLE units CASCADE;
-- TRUNCATE TABLE roles CASCADE;

-- 4. Inserir roles padrão
INSERT INTO roles (name, display_name, level, description) VALUES
('super_admin', 'Super Administrador', 100, 'Acesso total ao sistema - pode gerenciar tudo'),
('admin', 'Administrador', 50, 'Administrador de unidade - pode gerenciar sua unidade'),
('manager', 'Gerente', 30, 'Gerente operacional - acesso a relatórios e gestão'),
('atendente', 'Atendente', 10, 'Usuário operacional - acesso básico aos módulos')
ON CONFLICT (name) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    level = EXCLUDED.level,
    description = EXCLUDED.description;

-- 5. Inserir unidades padrão
INSERT INTO units (name, code, address, phone, email, is_active) VALUES
('MB Drome', 'mb-drome', 'Endereço Matriz - Centro', '(11) 99999-0001', 'drome@empresa.com', true),
('MB Londrina', 'mb-londrina', 'Endereço Londrina - Centro', '(43) 99999-0002', 'londrina@empresa.com', true),
('MB Jaragua', 'mb-jaragua', 'Endereço Jaragua - Centro', '(11) 99999-0003', 'jaragua@empresa.com', true),
('MB Teresina', 'mb-teresina', 'Endereço Teresina - Centro', '(86) 99999-0004', 'teresina@empresa.com', false),
('MB Teste', 'mb-teste', 'Unidade para Testes', '(00) 00000-0000', 'teste@empresa.com', true),
('Unidade Matriz', 'matriz', 'Sede Principal da Empresa', '(11) 99999-0000', 'matriz@empresa.com', true)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    address = EXCLUDED.address,
    phone = EXCLUDED.phone,
    email = EXCLUDED.email,
    is_active = EXCLUDED.is_active;

-- 6. Inserir módulos do sistema
INSERT INTO modules (name, display_name, description, icon, route, required_role, order_index, is_active, parent_module) VALUES
('dashboard', 'Dashboard', 'Página inicial com métricas gerais', 'fas fa-tachometer-alt', '/dashboard', 'atendente', 1, true, NULL),
('unidades', 'Gestão de Unidades', 'Gerenciar unidades e filiais', 'fas fa-building', '/unidades', 'super_admin', 2, true, NULL),
('usuarios', 'Gestão de Usuários', 'Gerenciar usuários do sistema', 'fas fa-users', '/usuarios', 'super_admin', 3, true, NULL),
('pos_venda', 'Pós-Venda', 'Acompanhamento de serviços pós-venda', 'fas fa-headset', '/pos-venda', 'atendente', 4, true, NULL),
('recrutamento', 'Recrutamento', 'Gestão de processos seletivos', 'fas fa-user-plus', '/recrutamento', 'admin', 5, false, NULL),
('relatorios', 'Relatórios', 'Relatórios gerenciais e operacionais', 'fas fa-chart-bar', '/relatorios', 'admin', 6, false, NULL),
('agenda', 'Agenda', 'Sistema de agendamentos', 'fas fa-calendar-alt', '/agenda', 'atendente', 7, false, NULL),
('clientes', 'Clientes', 'Gestão de clientes', 'fas fa-user-friends', '/clientes', 'admin', 8, false, NULL),
('gestao-sistema', 'Gestão do Sistema', 'Configurações avançadas do sistema', 'fas fa-cogs', '/sistema', 'super_admin', 9, true, NULL),
('configuracoes', 'Configurações', 'Configurações gerais', 'fas fa-wrench', '/config', 'super_admin', 10, true, NULL),
('resultados', 'Resultados', 'Upload e análise de planilhas de resultados', 'fas fa-chart-line', '/resultados', 'atendente', 11, true, NULL)
ON CONFLICT (name) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    description = EXCLUDED.description,
    icon = EXCLUDED.icon,
    route = EXCLUDED.route,
    required_role = EXCLUDED.required_role,
    order_index = EXCLUDED.order_index,
    is_active = EXCLUDED.is_active;

-- 7. Criar usuários padrão
INSERT INTO users (email, password, name, role_id, is_active, phone) VALUES
-- Super Admin (senha: admin123)
('admin@dromeflow.com', 
 '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 
 'Super Administrador Sistema',
 (SELECT id FROM roles WHERE name = 'super_admin'),
 true, '(11) 99999-9999'),

-- Admin Jean Petri (senha: jean123)
('jeanpetri@gmail.com', 
 '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
 'Jean Petri',
 (SELECT id FROM roles WHERE name = 'super_admin'),
 true, '(11) 99999-8888'),

-- Admin Londrina (senha: londrina123) 
('admin.londrina@empresa.com',
 '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
 'Administrador Londrina',
 (SELECT id FROM roles WHERE name = 'admin'),
 true, '(43) 99999-7777'),

-- Admin Teresina (senha: teresina123)
('admin.teresina@empresa.com',
 '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
 'Administrador Teresina', 
 (SELECT id FROM roles WHERE name = 'admin'),
 true, '(86) 99999-6666'),

-- Atendente Teste (senha: teste123)
('atendente@teste.com',
 '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
 'Atendente Teste',
 (SELECT id FROM roles WHERE name = 'atendente'),
 true, '(00) 00000-0000')
ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    role_id = EXCLUDED.role_id,
    is_active = EXCLUDED.is_active,
    phone = EXCLUDED.phone;

-- 8. Associar super admins a todas as unidades
INSERT INTO user_units (user_id, unit_id, assigned_by, is_active)
SELECT 
    u.id as user_id,
    un.id as unit_id,
    u.id as assigned_by,
    true
FROM users u
CROSS JOIN units un
JOIN roles r ON u.role_id = r.id
WHERE r.name = 'super_admin' 
  AND un.is_active = true
ON CONFLICT (user_id, unit_id) DO UPDATE SET
    is_active = true,
    assigned_at = NOW();

-- 9. Associar admins às suas unidades específicas
INSERT INTO user_units (user_id, unit_id, assigned_by, is_active) VALUES
-- Admin Londrina -> MB Londrina
((SELECT id FROM users WHERE email = 'admin.londrina@empresa.com'),
 (SELECT id FROM units WHERE code = 'mb-londrina'),
 (SELECT id FROM users WHERE email = 'admin@dromeflow.com'),
 true),

-- Admin Teresina -> MB Teresina  
((SELECT id FROM users WHERE email = 'admin.teresina@empresa.com'),
 (SELECT id FROM units WHERE code = 'mb-teresina'),
 (SELECT id FROM users WHERE email = 'admin@dromeflow.com'),
 true),

-- Atendente Teste -> MB Teste
((SELECT id FROM users WHERE email = 'atendente@teste.com'),
 (SELECT id FROM units WHERE code = 'mb-teste'),
 (SELECT id FROM users WHERE email = 'admin@dromeflow.com'),
 true)
ON CONFLICT (user_id, unit_id) DO UPDATE SET
    is_active = true,
    assigned_at = NOW();

-- 10. Habilitar módulos básicos para todas as unidades ativas
INSERT INTO unit_modules (unit_id, module_id, enabled_by, is_active)
SELECT 
    un.id as unit_id,
    m.id as module_id,
    (SELECT id FROM users WHERE email = 'admin@dromeflow.com') as enabled_by,
    true
FROM units un
CROSS JOIN modules m
WHERE un.is_active = true 
  AND m.is_active = true
  AND m.name IN ('dashboard', 'pos_venda', 'resultados')
ON CONFLICT (unit_id, module_id) DO UPDATE SET
    is_active = true,
    enabled_at = NOW();

-- 11. Habilitar módulos administrativos apenas para unidades principais
INSERT INTO unit_modules (unit_id, module_id, enabled_by, is_active)
SELECT 
    un.id as unit_id,
    m.id as module_id,
    (SELECT id FROM users WHERE email = 'admin@dromeflow.com') as enabled_by,
    true
FROM units un
CROSS JOIN modules m
WHERE un.name IN ('MB Drome', 'Unidade Matriz')
  AND un.is_active = true
  AND m.is_active = true
  AND m.name IN ('unidades', 'usuarios', 'gestao-sistema', 'configuracoes')
ON CONFLICT (unit_id, module_id) DO UPDATE SET
    is_active = true,
    enabled_at = NOW();

-- 12. Verificações finais
SELECT 'CONFIGURAÇÃO CONCLUÍDA!' as status;

-- Mostrar resumo
SELECT 
    'Roles criados' as item,
    COUNT(*) as quantidade
FROM roles
UNION ALL
SELECT 'Unidades criadas', COUNT(*) FROM units
UNION ALL
SELECT 'Unidades ativas', COUNT(*) FROM units WHERE is_active = true
UNION ALL
SELECT 'Módulos criados', COUNT(*) FROM modules
UNION ALL
SELECT 'Módulos ativos', COUNT(*) FROM modules WHERE is_active = true
UNION ALL
SELECT 'Usuários criados', COUNT(*) FROM users
UNION ALL
SELECT 'Usuários ativos', COUNT(*) FROM users WHERE is_active = true
UNION ALL
SELECT 'Associações usuário-unidade', COUNT(*) FROM user_units WHERE is_active = true
UNION ALL
SELECT 'Módulos habilitados', COUNT(*) FROM unit_modules WHERE is_active = true;

-- Mostrar usuários e suas unidades
SELECT 
    u.name as usuario,
    u.email,
    r.display_name as role,
    string_agg(un.name, ', ' ORDER BY un.name) as unidades_acesso
FROM users u
LEFT JOIN roles r ON u.role_id = r.id
LEFT JOIN user_units uu ON u.id = uu.user_id AND uu.is_active = true
LEFT JOIN units un ON uu.unit_id = un.id
WHERE u.is_active = true
GROUP BY u.id, u.name, u.email, r.display_name, r.level
ORDER BY r.level DESC, u.name;
```

## 🔐 Script de Reset de Senhas

```sql
-- ====================================
-- RESET DE SENHAS PADRÃO
-- ====================================

-- ATENÇÃO: Use apenas em desenvolvimento!
-- Em produção, sempre use senhas seguras e únicas

UPDATE users SET password = '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi' 
WHERE email IN (
    'admin@dromeflow.com',
    'jeanpetri@gmail.com', 
    'admin.londrina@empresa.com',
    'admin.teresina@empresa.com',
    'atendente@teste.com'
);

-- Senha para todos: password
SELECT 'Senhas resetadas para: password' as status;
```

## 📊 Scripts de Validação

```sql
-- ====================================
-- VALIDAÇÃO COMPLETA DO SISTEMA
-- ====================================

-- 1. Verificar estrutura de tabelas
SELECT 
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as colunas
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 2. Verificar integridade referencial
SELECT 
    'users -> roles' as relacao,
    COUNT(*) as total,
    COUNT(r.id) as com_referencia
FROM users u
LEFT JOIN roles r ON u.role_id = r.id
UNION ALL
SELECT 
    'user_units -> users',
    COUNT(*),
    COUNT(u.id)
FROM user_units uu
LEFT JOIN users u ON uu.user_id = u.id
UNION ALL
SELECT 
    'user_units -> units',
    COUNT(*),
    COUNT(un.id)
FROM user_units uu
LEFT JOIN units un ON uu.unit_id = un.id
UNION ALL
SELECT 
    'unit_modules -> units',
    COUNT(*),
    COUNT(un.id)
FROM unit_modules um
LEFT JOIN units un ON um.unit_id = un.id
UNION ALL
SELECT 
    'unit_modules -> modules',
    COUNT(*),
    COUNT(m.id)
FROM unit_modules um
LEFT JOIN modules m ON um.module_id = m.id;

-- 3. Verificar usuários sem unidades
SELECT 
    u.name,
    u.email,
    r.display_name as role,
    'SEM UNIDADES ASSOCIADAS' as problema
FROM users u
LEFT JOIN roles r ON u.role_id = r.id
LEFT JOIN user_units uu ON u.id = uu.user_id AND uu.is_active = true
WHERE u.is_active = true 
  AND uu.user_id IS NULL;

-- 4. Verificar unidades sem módulos
SELECT 
    un.name,
    un.code,
    'SEM MÓDULOS HABILITADOS' as problema
FROM units un
LEFT JOIN unit_modules um ON un.id = um.unit_id AND um.is_active = true
WHERE un.is_active = true 
  AND um.unit_id IS NULL;

-- 5. Verificar permissões por role
SELECT 
    r.display_name as role,
    r.level,
    COUNT(DISTINCT m.id) as modulos_permitidos,
    string_agg(DISTINCT m.display_name, ', ' ORDER BY m.display_name) as modulos
FROM roles r
LEFT JOIN modules m ON (
    (r.name = 'super_admin') OR 
    (r.name = 'admin' AND m.required_role IN ('admin', 'atendente')) OR
    (r.name = 'atendente' AND m.required_role = 'atendente')
) AND m.is_active = true
GROUP BY r.id, r.display_name, r.level
ORDER BY r.level DESC;

-- 6. Status geral do sistema
SELECT 
    'STATUS GERAL DO DROMEBOARD' as titulo,
    NOW() as verificado_em;

SELECT 
    CASE 
        WHEN (SELECT COUNT(*) FROM users WHERE is_active = true) > 0 
             AND (SELECT COUNT(*) FROM units WHERE is_active = true) > 0
             AND (SELECT COUNT(*) FROM modules WHERE is_active = true) > 0
             AND (SELECT COUNT(*) FROM user_units WHERE is_active = true) > 0
             AND (SELECT COUNT(*) FROM unit_modules WHERE is_active = true) > 0
        THEN '✅ SISTEMA CONFIGURADO CORRETAMENTE'
        ELSE '❌ SISTEMA COM PROBLEMAS'
    END as status_sistema;
```

## 🔄 Script de Backup

```sql
-- ====================================
-- BACKUP DOS DADOS CONFIGURADOS
-- ====================================

-- Gerar script de inserção dos dados atuais
-- Execute este comando para gerar backup dos dados:

\copy roles TO 'backup_roles.csv' WITH CSV HEADER;
\copy units TO 'backup_units.csv' WITH CSV HEADER;
\copy modules TO 'backup_modules.csv' WITH CSV HEADER;
\copy users TO 'backup_users.csv' WITH CSV HEADER;
\copy user_units TO 'backup_user_units.csv' WITH CSV HEADER;
\copy unit_modules TO 'backup_unit_modules.csv' WITH CSV HEADER;
```

## 🧹 Script de Limpeza (CUIDADO!)

```sql
-- ====================================
-- LIMPEZA COMPLETA - APENAS DESENVOLVIMENTO!
-- ====================================

-- ⚠️ ATENÇÃO: Este script apaga TODOS os dados
-- Use apenas em ambiente de desenvolvimento

DO $$ 
BEGIN
    -- Desabilitar verificação de chaves estrangeiras
    SET session_replication_role = replica;
    
    -- Limpar dados na ordem correta
    TRUNCATE TABLE user_module_permissions CASCADE;
    TRUNCATE TABLE unit_modules CASCADE;
    TRUNCATE TABLE user_units CASCADE;
    TRUNCATE TABLE users CASCADE;
    TRUNCATE TABLE modules CASCADE;
    TRUNCATE TABLE units CASCADE;
    TRUNCATE TABLE roles CASCADE;
    
    -- Reabilitar verificação de chaves estrangeiras
    SET session_replication_role = DEFAULT;
    
    RAISE NOTICE 'Limpeza concluída. Execute o script de configuração completa.';
END $$;
```

## 🚀 Como Usar os Scripts

### 1. Configuração Inicial Completa
```bash
# Execute o script principal
psql -h host -U user -d database -f configuracao_completa.sql
```

### 2. Apenas Validação
```bash
# Execute apenas a parte de validação
psql -h host -U user -d database -c "$(grep -A 50 'VALIDAÇÃO COMPLETA' configuracao_completa.sql)"
```

### 3. Reset de Senhas (Desenvolvimento)
```bash
# Execute o reset de senhas
psql -h host -U user -d database -c "$(grep -A 10 'RESET DE SENHAS' configuracao_completa.sql)"
```

### 4. Backup dos Dados
```bash
# Criar backup
pg_dump -h host -U user -d database --data-only > backup_dromeboard.sql
```

---

**⚠️ AVISOS IMPORTANTES:**

1. **Senhas Padrão**: Todas as senhas são `password` - ALTERE EM PRODUÇÃO!
2. **Limpeza**: Scripts de limpeza apagam TODOS os dados
3. **Backup**: Sempre faça backup antes de executar scripts
4. **Produção**: Teste em ambiente de desenvolvimento primeiro

---

**DromeBoard** - Scripts de Configuração v1.0
*Última atualização: 6 de agosto de 2025*
