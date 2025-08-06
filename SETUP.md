# DromeBoard - Guia de Configuração e Estrutura

## 📋 Índice

1. [Visão Geral da Estrutura](#visão-geral-da-estrutura)
2. [Pré-requisitos](#pré-requisitos)
3. [Configuração do Banco de Dados](#configuração-do-banco-de-dados)
4. [Configuração do Backend](#configuração-do-backend)
5. [Configuração do Frontend](#configuração-do-frontend)
6. [Estrutura de Arquivos Detalhada](#estrutura-de-arquivos-detalhada)
7. [Sistema de Autenticação](#sistema-de-autenticação)
8. [Módulos e Permissões](#módulos-e-permissões)
9. [Troubleshooting](#troubleshooting)

---

## 🏗️ Visão Geral da Estrutura

O DromeBoard é um sistema de dashboard modular com arquitetura em camadas:

```
┌─────────────────────────────────────┐
│           FRONTEND (JS/HTML/CSS)    │
├─────────────────────────────────────┤
│           BACKEND (PHP APIs)        │
├─────────────────────────────────────┤
│           DATABASE (PostgreSQL)     │
└─────────────────────────────────────┘
```

### Fluxo de Dados:
```
Login → Autenticação → Dashboard → Módulos → APIs → Banco de Dados
```

---

## 🔧 Pré-requisitos

### Sistema Operacional
- macOS, Linux ou Windows
- PHP 7.4 ou superior
- Servidor web (Apache/Nginx ou servidor local)
- Git

### Banco de Dados
- PostgreSQL 12+ ou Supabase
- Credenciais de acesso configuradas

### Ferramentas de Desenvolvimento
- Editor de código (VS Code recomendado)
- Terminal/Command Line
- Navegador web moderno

---

## 🗄️ Configuração do Banco de Dados

### Passo 1: Configurar Conexão Supabase

```sql
-- String de conexão padrão:
postgresql://postgres.etztlxlfgoqbgwyaozwf:[SUA-SENHA]@aws-0-sa-east-1.pooler.supabase.com:6543/postgres
```

### Passo 2: Executar Script de Criação

Execute o arquivo `Banco de Dados.sql` no seu cliente PostgreSQL:

```bash
# Via psql
psql -h aws-0-sa-east-1.pooler.supabase.com -p 6543 -U postgres.etztlxlfgoqbgwyaozwf -d postgres -f "Banco de Dados.sql"

# Ou através do Supabase Dashboard
# Cole o conteúdo do arquivo na aba SQL Editor
```

### Passo 3: Verificar Estrutura Criada

```sql
-- Verificar se todas as tabelas foram criadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Resultado esperado:
-- modules
-- roles  
-- units
-- unit_modules
-- user_module_permissions
-- user_units
-- users
-- resultados (se existir)
```

### Passo 4: Inserir Dados Iniciais

```sql
-- 1. Criar roles padrão
INSERT INTO roles (name, display_name, level, description) VALUES
('super_admin', 'Super Administrador', 100, 'Acesso total ao sistema'),
('admin', 'Administrador', 50, 'Administrador de unidade'),
('atendente', 'Atendente', 10, 'Usuário operacional')
ON CONFLICT (name) DO NOTHING;

-- 2. Criar unidade principal
INSERT INTO units (name, code, address, phone, email, is_active) VALUES
('MB Drome', 'mb-drome', 'Endereço Principal', '(00) 0000-0000', 'contato@drome.com', true)
ON CONFLICT (code) DO NOTHING;

-- 3. Criar usuário super admin
INSERT INTO users (email, password, name, role_id, is_active) VALUES
('admin@dromeflow.com', 
 '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- senha: password (use password_hash() em PHP)
 'Super Admin Sistema',
 (SELECT id FROM roles WHERE name = 'super_admin'),
 true)
ON CONFLICT (email) DO NOTHING;

-- IMPORTANTE: Para criar senhas em PHP use:
-- $hashedPassword = password_hash('suasenha', PASSWORD_DEFAULT);
-- No banco sempre armazene o hash, nunca a senha em texto plano

-- 4. Criar módulos básicos
INSERT INTO modules (name, display_name, description, icon, route, required_role, order_index, is_active) VALUES
('dashboard', 'Dashboard', 'Página inicial com métricas', 'fas fa-tachometer-alt', '/dashboard', 'atendente', 1, true),
('resultados', 'Resultados', 'Upload e análise de dados', 'fas fa-chart-line', '/resultados', 'atendente', 2, true),
('usuarios', 'Gestão de Usuários', 'Gerenciar usuários', 'fas fa-users', '/usuarios', 'admin', 3, true),
('unidades', 'Gestão de Unidades', 'Gerenciar unidades', 'fas fa-building', '/unidades', 'super_admin', 4, true)
ON CONFLICT (name) DO NOTHING;

-- 5. Associar usuário admin à unidade principal
INSERT INTO user_units (user_id, unit_id, assigned_by, is_active)
SELECT 
    u.id,
    un.id,
    u.id,
    true
FROM users u, units un
WHERE u.email = 'admin@dromeflow.com' 
  AND un.code = 'mb-drome'
ON CONFLICT (user_id, unit_id) DO NOTHING;

-- 6. Habilitar módulos para a unidade
INSERT INTO unit_modules (unit_id, module_id, enabled_by, is_active)
SELECT 
    un.id,
    m.id,
    (SELECT id FROM users WHERE email = 'admin@dromeflow.com'),
    true
FROM units un, modules m
WHERE un.code = 'mb-drome' AND m.is_active = true
ON CONFLICT (unit_id, module_id) DO NOTHING;
```

---

## ⚙️ Configuração do Backend

### Passo 1: Configurar Conexão com Banco

Edite o arquivo `api/database.php`:

```php
<?php
class Database {
    private $host = "aws-0-sa-east-1.pooler.supabase.com";
    private $port = "6543";
    private $db_name = "postgres";
    private $username = "postgres.etztlxlfgoqbgwyaozwf";
    private $password = "DRom@29011725"; // ALTERE AQUI
    private $conn;
    
    public function getConnection() {
        $this->conn = null;
        
        try {
            $dsn = "pgsql:host=" . $this->host . 
                   ";port=" . $this->port . 
                   ";dbname=" . $this->db_name;
                   
            $this->conn = new PDO($dsn, $this->username, $this->password);
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $this->conn->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        } catch(PDOException $exception) {
            error_log("Connection error: " . $exception->getMessage());
            return null;
        }
        
        return $this->conn;
    }
}
?>
```

### Passo 2: Testar Conexão

Crie um arquivo temporário `test_connection.php`:

```php
<?php
require_once 'api/database.php';

$database = new Database();
$db = $database->getConnection();

if ($db) {
    echo "✅ Conexão com banco estabelecida com sucesso!\n";
    
    // Testar consulta
    $query = "SELECT COUNT(*) as total FROM users";
    $stmt = $db->prepare($query);
    $stmt->execute();
    $result = $stmt->fetch();
    
    echo "📊 Total de usuários: " . $result['total'] . "\n";
} else {
    echo "❌ Erro na conexão com o banco\n";
}
?>
```

Execute: `php test_connection.php`

### Passo 3: Configurar Headers CORS (se necessário)

Adicione no início de cada arquivo da API:

```php
<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit(0);
}
?>
```

---

## 🎨 Configuração do Frontend

### Passo 1: Configurar URLs da API

Edite o arquivo `core/api-config.js`:

```javascript
// Configuração das URLs da API
const API_CONFIG = {
    BASE_URL: 'http://localhost/DromeBoard/api/', // Ajuste conforme seu ambiente
    ENDPOINTS: {
        LOGIN: 'login.php',
        LOGOUT: 'logout.php',
        USERS: 'users.php',
        UNITS: 'units.php',
        MODULES: 'modules.php',
        METRICS: 'metrics.php'
    },
    TIMEOUT: 10000 // 10 segundos
};

// Função auxiliar para construir URLs
function getApiUrl(endpoint) {
    return API_CONFIG.BASE_URL + API_CONFIG.ENDPOINTS[endpoint];
}
```

### Passo 2: Configurar Sistema de Cache

O arquivo `core/cache-manager.js` já está configurado, mas você pode ajustar:

```javascript
const CACHE_CONFIG = {
    TTL: 300000, // 5 minutos em millisegundos
    MAX_SIZE: 100, // Máximo de itens no cache
    PREFIX: 'dromeflow_' // Prefixo para localStorage
};
```

### Passo 3: Testar Login

1. Acesse `auth/login.html`
2. Use as credenciais:
   - **Email**: `admin@dromeflow.com`
   - **Senha**: `password`

---

## 📁 Estrutura de Arquivos Detalhada

```
DromeBoard/
├── 📄 README.md                    # Documentação principal
├── 📄 SETUP.md                     # Este guia de configuração
├── 📄 .gitignore                   # Arquivos ignorados pelo Git
├── 📄 Banco de Dados.sql           # Script de criação do banco
│
├── 📁 api/                         # Backend - APIs PHP
│   ├── 🔗 database.php            # Classe de conexão com banco
│   ├── 🔐 login.php               # API de autenticação
│   ├── 🚪 logout.php              # API de logout
│   ├── 👥 users.php               # CRUD de usuários
│   ├── 🏢 units.php               # CRUD de unidades
│   ├── 🧩 modules.php             # Gestão de módulos
│   └── 📊 metrics.php             # API de métricas
│
├── 📁 auth/                        # Sistema de Autenticação
│   ├── 🎨 auth.css                # Estilos do login
│   ├── ⚡ auth.js                 # Lógica de autenticação
│   └── 🌐 login.html              # Página de login
│
├── 📁 core/                        # Núcleo do Sistema
│   ├── ⚙️ api-config.js           # Configuração das APIs
│   ├── 💾 cache-manager.js        # Gerenciador de cache
│   ├── 🎛️ dashboard-core.js       # Lógica central do dashboard
│   ├── 🌐 dashboard.html          # Dashboard principal
│   └── 🔄 module-loader.js        # Carregador dinâmico de módulos
│
├── 📁 modules/                     # Módulos Funcionais
│   ├── 📁 dashboard-home/         # Página inicial
│   │   ├── 🎨 dashboard-home.css
│   │   ├── ⚡ dashboard-home.js
│   │   └── 🌐 dashboard.html
│   ├── 📁 gestao-usuarios/        # Gestão de usuários
│   │   ├── 🎨 gestao-usuarios.css
│   │   ├── ⚡ gestao-usuarios.js
│   │   └── 🌐 gestao-usuarios.html
│   ├── 📁 gestao-unidades/        # Gestão de unidades
│   │   ├── 🎨 gestao-unidades.css
│   │   ├── ⚡ gestao-unidades.js
│   │   └── 🌐 gestao-unidades.html
│   └── 📁 resultados/             # Upload e análise de dados
│       ├── 🎨 resultados.css
│       ├── ⚡ resultados.js
│       └── 🌐 resultados.html
│
├── 📁 assets/                      # Recursos Estáticos
│   ├── 📁 fonts/                  # Fontes customizadas
│   └── 📁 images/                 # Imagens e ícones
│       └── 📁 icons/
│
└── 📁 shared/                      # Componentes Compartilhados
    └── (componentes reutilizáveis)
```

---

## 🔐 Sistema de Autenticação

O DromeBoard utiliza um sistema de autenticação **direto com a tabela `users`**, sem dependências de sistemas externos de auth. É simples, eficiente e totalmente controlado.

### Fluxo de Login Implementado

```mermaid
graph TD
    A[Usuário acessa login.html] --> B[Insere email/senha]
    B --> C[auth.js valida campos]
    C --> D[Envia POST para api/login.php]
    D --> E[login.php consulta tabela users]
    E --> F{Usuário válido e ativo?}
    F -->|Sim| G[Verifica senha com password_verify]
    G --> H{Senha correta?}
    H -->|Sim| I[Busca unidades e módulos do usuário]
    I --> J[Cria sessão PHP]
    J --> K[Retorna dados completos do usuário]
    K --> L[Frontend salva no localStorage]
    L --> M[Redireciona para dashboard.html]
    H -->|Não| N[Retorna erro 401]
    F -->|Não| N
    N --> O[Exibe mensagem de erro]
```

### Query de Autenticação

```sql
-- Busca usuário com role
SELECT u.*, r.name as role_name, r.display_name as role_display_name, r.level as role_level 
FROM users u 
LEFT JOIN roles r ON u.role_id = r.id 
WHERE u.email = :email AND u.is_active = true;

-- Busca unidades do usuário
SELECT un.* FROM units un 
JOIN user_units uu ON un.id = uu.unit_id 
WHERE uu.user_id = :user_id AND uu.is_active = true AND un.is_active = true;

-- Busca módulos disponíveis
SELECT DISTINCT m.* FROM modules m
JOIN unit_modules um ON m.id = um.module_id
JOIN user_units uu ON um.unit_id = uu.unit_id
WHERE uu.user_id = :user_id 
  AND m.is_active = true 
  AND um.is_active = true 
  AND uu.is_active = true
ORDER BY m.order_index;
```

### Estrutura de Dados do Usuário

```javascript
// Dados salvos no localStorage após login
const userData = {
    id: "uuid",
    name: "Nome do Usuário",
    email: "email@exemplo.com",
    role: {
        name: "admin",
        display_name: "Administrador",
        level: 50
    },
    units: [
        {
            id: "uuid",
            name: "MB Drome",
            code: "mb-drome"
        }
    ],
    permissions: {
        dashboard: true,
        usuarios: true,
        unidades: false
    }
};
```

### Verificação de Permissões

```javascript
// Em cada módulo, verificar permissões:
function checkPermissions() {
    const userData = JSON.parse(localStorage.getItem('userData'));
    
    if (!userData) {
        window.location.href = '../auth/login.html';
        return false;
    }
    
    const currentModule = getCurrentModuleName();
    
    if (!userData.permissions[currentModule]) {
        alert('Você não tem permissão para acessar este módulo');
        window.location.href = '../core/dashboard.html';
        return false;
    }
    
    return true;
}
```

---

## 🧩 Módulos e Permissões

### Estrutura de um Módulo

Cada módulo segue o padrão:

```
modules/nome-modulo/
├── nome-modulo.html     # Interface do usuário
├── nome-modulo.js       # Lógica e funcionalidades
└── nome-modulo.css      # Estilos específicos
```

### Criando um Novo Módulo

1. **Criar estrutura de arquivos**:
```bash
mkdir modules/novo-modulo
touch modules/novo-modulo/novo-modulo.html
touch modules/novo-modulo/novo-modulo.js
touch modules/novo-modulo/novo-modulo.css
```

2. **Inserir no banco**:
```sql
INSERT INTO modules (name, display_name, description, icon, route, required_role, order_index, is_active) 
VALUES 
('novo-modulo', 'Novo Módulo', 'Descrição do módulo', 'fas fa-icon', '/novo-modulo', 'atendente', 10, true);
```

3. **Habilitar para unidades**:
```sql
INSERT INTO unit_modules (unit_id, module_id, enabled_by, is_active)
SELECT u.id, m.id, (SELECT id FROM users WHERE email = 'admin@dromeflow.com'), true
FROM units u, modules m 
WHERE m.name = 'novo-modulo' AND u.is_active = true;
```

### Template de Módulo

```html
<!-- novo-modulo.html -->
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Novo Módulo - DromeBoard</title>
    <link rel="stylesheet" href="novo-modulo.css">
</head>
<body>
    <div class="module-container">
        <h1>Novo Módulo</h1>
        <div class="module-content">
            <!-- Conteúdo do módulo -->
        </div>
    </div>
    <script src="novo-modulo.js"></script>
</body>
</html>
```

```javascript
// novo-modulo.js
class NovoModulo {
    constructor() {
        this.name = 'novo-modulo';
        this.init();
    }
    
    init() {
        if (!this.checkPermissions()) return;
        this.loadData();
        this.setupEventListeners();
    }
    
    checkPermissions() {
        const userData = JSON.parse(localStorage.getItem('userData'));
        return userData && userData.permissions[this.name];
    }
    
    loadData() {
        // Carregar dados do módulo
    }
    
    setupEventListeners() {
        // Configurar eventos
    }
}

// Inicializar módulo quando a página carregar
document.addEventListener('DOMContentLoaded', function() {
    new NovoModulo();
});
```

---

## 🔧 Configuração de Servidor

### Servidor Local (PHP Built-in)

```bash
# Na pasta do projeto
php -S localhost:8000

# Acessar em: http://localhost:8000/auth/login.html
```

### Apache Configuration

```apache
# .htaccess na raiz do projeto
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^api/(.*)$ api/$1 [L]

# Headers CORS
Header always set Access-Control-Allow-Origin "*"
Header always set Access-Control-Allow-Methods "POST, GET, OPTIONS"
Header always set Access-Control-Allow-Headers "Content-Type, Authorization"
```

### Nginx Configuration

```nginx
server {
    listen 80;
    server_name localhost;
    root /path/to/DromeBoard;
    index index.html;
    
    location / {
        try_files $uri $uri/ =404;
    }
    
    location /api/ {
        try_files $uri $uri/ /api/index.php?$query_string;
    }
    
    location ~ \.php$ {
        fastcgi_pass 127.0.0.1:9000;
        fastcgi_index index.php;
        include fastcgi_params;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
    }
}
```

---

## 🔍 Troubleshooting

### Problemas Comuns

#### 1. **Erro de Conexão com Banco**
```
Sintoma: "Connection error" ou página em branco
Solução:
- Verificar credenciais em api/database.php
- Testar conexão com test_connection.php
- Verificar firewall/rede
```

#### 2. **Login não Funciona**
```
Sintoma: "Usuário ou senha inválidos"
Soluções:
- Verificar se usuário existe: SELECT * FROM users WHERE email = 'admin@dromeflow.com';
- Verificar hash da senha
- Verificar logs do servidor
```

#### 3. **Módulos não Carregam**
```
Sintoma: Sidebar vazia ou módulos não aparecem
Soluções:
- Verificar permissões: SELECT * FROM user_module_permissions WHERE user_id = 'user_id';
- Verificar se módulos estão ativos: SELECT * FROM modules WHERE is_active = true;
- Verificar unit_modules
```

#### 4. **Erro de CORS**
```
Sintoma: "Access to fetch blocked by CORS policy"
Soluções:
- Adicionar headers CORS nos arquivos PHP
- Configurar .htaccess/nginx
- Usar servidor local adequado
```

### Scripts de Diagnóstico

```sql
-- Verificar estrutura completa do usuário
SELECT 
    u.name,
    u.email,
    r.display_name as role,
    string_agg(un.name, ', ') as unidades,
    u.is_active
FROM users u
LEFT JOIN roles r ON u.role_id = r.id
LEFT JOIN user_units uu ON u.id = uu.user_id AND uu.is_active = true
LEFT JOIN units un ON uu.unit_id = un.id
WHERE u.email = 'admin@dromeflow.com'
GROUP BY u.id, u.name, u.email, r.display_name, u.is_active;

-- Verificar módulos disponíveis para usuário
SELECT 
    m.name,
    m.display_name,
    m.required_role,
    um.is_active as habilitado_unidade
FROM modules m
LEFT JOIN unit_modules um ON m.id = um.module_id
LEFT JOIN user_units uu ON um.unit_id = uu.unit_id
LEFT JOIN users u ON uu.user_id = u.id
WHERE u.email = 'admin@dromeflow.com'
  AND m.is_active = true
ORDER BY m.order_index;
```

### Logs Úteis

```javascript
// Adicionar em core/dashboard-core.js para debug
window.DASHFLOW_DEBUG = {
    enabled: true,
    log: function(message, data) {
        if (this.enabled) {
            console.log(`[DromeBoard Debug] ${message}`, data);
        }
    }
};
```

---

## ✅ Lista de Verificação Final

### Antes de Colocar em Produção

- [ ] Alterar senha padrão do usuário admin
- [ ] Configurar HTTPS
- [ ] Verificar permissões de arquivos
- [ ] Fazer backup do banco de dados
- [ ] Testar todos os módulos
- [ ] Configurar logs de erro
- [ ] Verificar performance
- [ ] Documentar customizações

### Segurança

- [ ] Senhas hashadas (bcrypt)
- [ ] Validação de entrada nos forms
- [ ] Proteção contra SQL injection (PDO)
- [ ] Headers de segurança configurados
- [ ] Arquivos sensíveis protegidos
- [ ] Logs de auditoria habilitados

---

## 📞 Suporte

Para dúvidas ou problemas:

1. Verifique este guia primeiro
2. Consulte os logs de erro
3. Execute scripts de diagnóstico
4. Entre em contato com o desenvolvedor

**Desenvolvedor**: Jean Petri - jeanpetri@gmail.com

---

**DromeBoard v1.0** - Sistema de Dashboard Modular
*Última atualização: 6 de agosto de 2025*
