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
postgresql://postgres.etztlxlfgoqbgwyaozwf:[DRom@29011725]@aws-0-sa-east-1.pooler.supabase.com:6543/postgres
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

### Passo 1: Sistema de Design Unificado

O DromeBoard possui um **Design System completo** baseado nos elementos oficiais:

```html
<!-- Importar o design system em todas as páginas -->
<link rel="stylesheet" href="../shared/drome-design-system.css">
<script src="../shared/drome-design-system.js"></script>
```

**Características do Design System:**
- ✅ **CSS Variables**: Todas as cores, espaçamentos e tipografia padronizados
- ✅ **Classes Utilitárias**: Sistema completo de utilities (padding, margin, flex, grid)
- ✅ **Componentes Reutilizáveis**: Botões, cards, modais, formulários padronizados
- ✅ **Grid System**: Sistema responsivo de 12 colunas
- ✅ **Tema Escuro/Claro**: Suporte nativo com toggle automático
- ✅ **Animações**: Transições e animações padronizadas

### Passo 2: Configurar URLs da API

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

### Passo 3: Sistema de Design - Uso Prático

**Exemplos de Classes Utilitárias:**

```html
<!-- Layout com Grid System -->
<div class="drome-container drome-grid drome-grid-cols-12 drome-gap-6">
    <div class="drome-col-span-4 drome-bg-white drome-p-6 drome-rounded-lg drome-shadow-md">
        <h2 class="drome-h2 drome-text-primary drome-mb-4">Card 1</h2>
        <p class="drome-text-gray-600">Conteúdo do card</p>
    </div>
</div>

<!-- Botões Padronizados -->
<button class="drome-btn drome-btn-primary drome-mr-2">Salvar</button>
<button class="drome-btn drome-btn-secondary">Cancelar</button>

<!-- Formulário com Classes Utilitárias -->
<form class="drome-space-y-4">
    <div class="drome-form-group">
        <label class="drome-label">Nome:</label>
        <input type="text" class="drome-input" placeholder="Digite o nome">
    </div>
</form>
```

**Paleta de Cores Disponível:**
- **Primary**: `var(--primary)` - #6366f1 (Azul principal)
- **Secondary**: `var(--secondary)` - #f43f5e (Rosa secundário)
- **Success**: `var(--success)` - #10b981 (Verde sucesso)
- **Warning**: `var(--warning)` - #f59e0b (Amarelo aviso)
- **Danger**: `var(--danger)` - #ef4444 (Vermelho erro)
- **Escalas Completas**: blue-50 até blue-900, gray-50 até gray-900, etc.

### Passo 4: Testar Login

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
├── 📁 shared/                      # Sistema de Design e Componentes
│   ├── 🎨 drome-design-system.css # Design System completo
│   ├── ⚡ drome-design-system.js  # Utilitários JavaScript
│   ├── 🎨 global-styles-new.css   # Estilos globais do dashboard
│   └── 🎨 global-styles.css       # Estilos legados
│
└── 📁 Elementos Oficial/          # Kit de UI Oficial (Referência)
    ├── 🧩 Kit Elements Buttons.html
    ├── 📅 Kit Elements Calendar.html
    ├── 🧩 Kit Elements Components.html
    ├── 📋 Kit Elements Kanban.html
    ├── 🧭 Kit Elements Navegation.html
    ├── 🔔 Kit Elements Notifications.html
    ├── 🎨 Kit Elements V2-1.html
    ├── 📝 Kit Elements Wireframes.html
    ├── 🎨 Kit Elements-2-2.html
    ├── 📐 Layout Extension.html
    ├── 🎨 Template Moderno.html
    └── 🎨 UI Kit Elements V2.html
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
    
    <!-- Design System (OBRIGATÓRIO) -->
    <link rel="stylesheet" href="../shared/drome-design-system.css">
    <link rel="stylesheet" href="novo-modulo.css">
</head>
<body>
    <div class="drome-container drome-py-6">
        <!-- Header do Módulo -->
        <div class="drome-flex drome-items-center drome-justify-between drome-mb-6">
            <div>
                <h1 class="drome-h1 drome-text-gray-900 drome-mb-2">Novo Módulo</h1>
                <p class="drome-text-gray-600">Descrição do módulo</p>
            </div>
            <button class="drome-btn drome-btn-primary">
                <i class="fas fa-plus drome-mr-2"></i>
                Nova Ação
            </button>
        </div>
        
        <!-- Conteúdo Principal -->
        <div class="drome-grid drome-grid-cols-12 drome-gap-6">
            <!-- Card Principal -->
            <div class="drome-col-span-8">
                <div class="drome-card">
                    <div class="drome-card-header">
                        <h3 class="drome-h3">Conteúdo Principal</h3>
                    </div>
                    <div class="drome-card-body">
                        <!-- Conteúdo do módulo -->
                    </div>
                </div>
            </div>
            
            <!-- Sidebar -->
            <div class="drome-col-span-4">
                <div class="drome-card">
                    <div class="drome-card-header">
                        <h4 class="drome-h4">Ações Rápidas</h4>
                    </div>
                    <div class="drome-card-body drome-space-y-3">
                        <button class="drome-btn drome-btn-outline drome-w-full">Ação 1</button>
                        <button class="drome-btn drome-btn-outline drome-w-full">Ação 2</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <!-- Scripts -->
    <script src="../shared/drome-design-system.js"></script>
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
        this.setupTheme();
        this.loadData();
        this.setupEventListeners();
    }
    
    checkPermissions() {
        const userData = JSON.parse(localStorage.getItem('userData'));
        if (!userData || !userData.permissions[this.name]) {
            window.dromeDesignSystem.notifications.show({
                type: 'error',
                title: 'Acesso Negado',
                message: 'Você não tem permissão para acessar este módulo'
            });
            setTimeout(() => {
                window.location.href = '../core/dashboard.html';
            }, 2000);
            return false;
        }
        return true;
    }
    
    setupTheme() {
        // O design system já cuida do tema automaticamente
        console.log(`Tema atual: ${window.dromeDesignSystem.getCurrentTheme()}`);
    }
    
    loadData() {
        // Exemplo de carregamento com loading state
        this.showLoading();
        
        fetch('../api/novo-modulo.php')
            .then(response => response.json())
            .then(data => {
                this.renderData(data);
                this.hideLoading();
            })
            .catch(error => {
                console.error('Erro ao carregar dados:', error);
                this.hideLoading();
                window.dromeDesignSystem.notifications.show({
                    type: 'error',
                    title: 'Erro',
                    message: 'Erro ao carregar dados do módulo'
                });
            });
    }
    
    setupEventListeners() {
        // Usando event delegation com classes do design system
        document.addEventListener('click', (e) => {
            if (e.target.matches('.drome-btn[data-action="nova-acao"]')) {
                this.handleNovaAcao();
            }
        });
    }
    
    showLoading() {
        const loadingHtml = `
            <div class="drome-flex drome-items-center drome-justify-center drome-p-8" id="loading-state">
                <div class="drome-animate-spin drome-w-8 drome-h-8 drome-border-4 drome-border-primary drome-border-t-transparent drome-rounded-full"></div>
                <span class="drome-ml-3 drome-text-gray-600">Carregando...</span>
            </div>
        `;
        document.querySelector('.drome-card-body').innerHTML = loadingHtml;
    }
    
    hideLoading() {
        const loading = document.getElementById('loading-state');
        if (loading) loading.remove();
    }
    
    handleNovaAcao() {
        // Exemplo de modal usando o design system
        const modal = window.dromeDesignSystem.modal.create({
            title: 'Nova Ação',
            content: `
                <div class="drome-space-y-4">
                    <div class="drome-form-group">
                        <label class="drome-label">Nome:</label>
                        <input type="text" class="drome-input" id="nome-acao" placeholder="Digite o nome">
                    </div>
                    <div class="drome-form-group">
                        <label class="drome-label">Descrição:</label>
                        <textarea class="drome-textarea" id="desc-acao" rows="3"></textarea>
                    </div>
                </div>
            `,
            buttons: [
                {
                    text: 'Cancelar',
                    class: 'drome-btn-secondary',
                    action: () => window.dromeDesignSystem.modal.close(modal)
                },
                {
                    text: 'Salvar',
                    class: 'drome-btn-primary',
                    action: () => this.salvarAcao(modal)
                }
            ]
        });
    }
    
    salvarAcao(modal) {
        const nome = document.getElementById('nome-acao').value;
        const desc = document.getElementById('desc-acao').value;
        
        if (!nome) {
            window.dromeDesignSystem.notifications.show({
                type: 'warning',
                title: 'Atenção',
                message: 'Nome é obrigatório'
            });
            return;
        }
        
        // Enviar dados para API
        fetch('../api/novo-modulo.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ nome, desc })
        })
        .then(response => response.json())
        .then(data => {
            window.dromeDesignSystem.modal.close(modal);
            window.dromeDesignSystem.notifications.show({
                type: 'success',
                title: 'Sucesso',
                message: 'Ação criada com sucesso!'
            });
            this.loadData(); // Recarregar dados
        })
        .catch(error => {
            console.error('Erro:', error);
            window.dromeDesignSystem.notifications.show({
                type: 'error',
                title: 'Erro',
                message: 'Erro ao salvar ação'
            });
        });
    }
    
    renderData(data) {
        // Renderizar dados usando classes do design system
        const html = data.map(item => `
            <div class="drome-card drome-mb-4">
                <div class="drome-card-body">
                    <h5 class="drome-h5 drome-mb-2">${item.nome}</h5>
                    <p class="drome-text-gray-600 drome-mb-3">${item.descricao}</p>
                    <div class="drome-flex drome-gap-2">
                        <button class="drome-btn drome-btn-sm drome-btn-outline" data-action="editar" data-id="${item.id}">
                            <i class="fas fa-edit drome-mr-1"></i>Editar
                        </button>
                        <button class="drome-btn drome-btn-sm drome-btn-danger" data-action="excluir" data-id="${item.id}">
                            <i class="fas fa-trash drome-mr-1"></i>Excluir
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
        
        document.querySelector('.drome-card-body').innerHTML = html || '<p class="drome-text-gray-500 drome-text-center drome-p-8">Nenhum item encontrado</p>';
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

### Logs e Debug

```javascript
// Debug do Design System
window.DROME_DEBUG = {
    enabled: true,
    log: function(message, data) {
        if (this.enabled) {
            console.log(`[DromeBoard Debug] ${message}`, data);
        }
    },
    
    // Verificar tema atual
    checkTheme: function() {
        const theme = window.dromeDesignSystem.getCurrentTheme();
        console.log('Tema atual:', theme);
        return theme;
    },
    
    // Verificar CSS Variables
    checkVariables: function() {
        const root = getComputedStyle(document.documentElement);
        const vars = {
            primary: root.getPropertyValue('--primary'),
            secondary: root.getPropertyValue('--secondary'),
            success: root.getPropertyValue('--success'),
            warning: root.getPropertyValue('--warning'),
            danger: root.getPropertyValue('--danger')
        };
        console.log('CSS Variables:', vars);
        return vars;
    },
    
    // Verificar userData
    checkUserData: function() {
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        console.log('User Data:', userData);
        return userData;
    }
};

// Usar no console do navegador:
// DROME_DEBUG.checkTheme()
// DROME_DEBUG.checkVariables()
// DROME_DEBUG.checkUserData()
```

### Verificação do Design System

```javascript
// Teste rápido do Design System
function testDesignSystem() {
    console.log('=== Teste do Design System ===');
    
    // 1. Verificar se o design system foi carregado
    if (typeof window.dromeDesignSystem !== 'undefined') {
        console.log('✅ Design System carregado');
    } else {
        console.log('❌ Design System não encontrado');
        return;
    }
    
    // 2. Verificar tema
    const theme = window.dromeDesignSystem.getCurrentTheme();
    console.log(`✅ Tema atual: ${theme}`);
    
    // 3. Verificar CSS Variables
    const root = getComputedStyle(document.documentElement);
    const primaryColor = root.getPropertyValue('--primary').trim();
    console.log(`✅ Cor primária: ${primaryColor}`);
    
    // 4. Teste de notificação
    if (window.dromeDesignSystem.notifications) {
        window.dromeDesignSystem.notifications.show({
            type: 'success',
            title: 'Teste',
            message: 'Design System funcionando!'
        });
        console.log('✅ Sistema de notificações funcionando');
    }
    
    // 5. Verificar classes utilitárias
    const testElement = document.createElement('div');
    testElement.className = 'drome-p-4 drome-bg-primary drome-text-white drome-rounded-lg';
    if (testElement.className.includes('drome-p-4')) {
        console.log('✅ Classes utilitárias disponíveis');
    }
    
    console.log('=== Fim do Teste ===');
}

// Executar no console: testDesignSystem()
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
- [ ] **Verificar Design System** - Testar tema claro/escuro
- [ ] **Otimizar CSS** - Minificar arquivos em produção
- [ ] **Validar Responsividade** - Testar em diferentes dispositivos

### Segurança

- [ ] Senhas hashadas (bcrypt)
- [ ] Validação de entrada nos forms
- [ ] Proteção contra SQL injection (PDO)
- [ ] Headers de segurança configurados
- [ ] Arquivos sensíveis protegidos
- [ ] Logs de auditoria habilitados
- [ ] **CSP Headers** - Content Security Policy para CSS/JS
- [ ] **Design System** - Sanitização de inputs em componentes

---

## 🎨 Guia Rápido do Design System

### Classes Mais Utilizadas

```css
/* Layout */
.drome-container        /* Container responsivo */
.drome-grid             /* Display grid */
.drome-grid-cols-12     /* 12 colunas */
.drome-flex             /* Display flex */
.drome-items-center     /* Align items center */
.drome-justify-between  /* Justify content space-between */

/* Espaçamentos */
.drome-p-4             /* Padding 1rem */
.drome-m-4             /* Margin 1rem */
.drome-space-y-4       /* Gap vertical entre filhos */
.drome-gap-6           /* Gap 1.5rem em grid/flex */

/* Cores */
.drome-bg-primary      /* Background cor primária */
.drome-text-primary    /* Texto cor primária */
.drome-text-gray-600   /* Texto cinza médio */

/* Componentes */
.drome-btn             /* Botão base */
.drome-btn-primary     /* Botão primário */
.drome-card            /* Card container */
.drome-input           /* Input padrão */

/* Responsividade */
.drome-sm-hidden       /* Oculto em mobile */
.drome-lg-grid-cols-4  /* 4 colunas em desktop */
```

### Componentes Prontos

```html
<!-- Botão com Loading -->
<button class="drome-btn drome-btn-primary" data-loading="false">
    <span class="drome-loading-icon drome-hidden">
        <div class="drome-animate-spin drome-w-4 drome-h-4 drome-border-2 drome-border-white drome-border-t-transparent drome-rounded-full"></div>
    </span>
    <span class="drome-btn-text">Salvar</span>
</button>

<!-- Card com Header -->
<div class="drome-card">
    <div class="drome-card-header">
        <h3 class="drome-h3">Título</h3>
        <button class="drome-btn drome-btn-sm drome-btn-outline">Ação</button>
    </div>
    <div class="drome-card-body">
        Conteúdo
    </div>
</div>

<!-- Formulário -->
<form class="drome-space-y-4">
    <div class="drome-form-group">
        <label class="drome-label">Email:</label>
        <input type="email" class="drome-input" required>
    </div>
    <div class="drome-form-group">
        <label class="drome-label">Senha:</label>
        <input type="password" class="drome-input" required>
    </div>
    <button type="submit" class="drome-btn drome-btn-primary drome-w-full">
        Entrar
    </button>
</form>
```

---

## 📞 Suporte

Para dúvidas ou problemas:

1. Verifique este guia primeiro
2. Consulte os logs de erro
3. Execute scripts de diagnóstico
4. Entre em contato com o desenvolvedor

**Desenvolvedor**: Jean Petri - jeanpetri@gmail.com

---

**DromeBoard v2.0** - Sistema de Dashboard Modular com Design System Completo
*Última atualização: 6 de agosto de 2025*

---

## 📊 Resumo de Funcionalidades Implementadas

### ✅ **Sistema de Design Completo**
- **1.700+ linhas de CSS** com design system padronizado
- **CSS Variables** para todas as cores e espaçamentos
- **Classes utilitárias** completas (spacing, layout, typography)
- **Componentes reutilizáveis** (botões, cards, modais, formulários)
- **Grid system responsivo** de 12 colunas
- **Tema escuro/claro** com toggle automático
- **Animações e transições** padronizadas
- **JavaScript component library** com API unificada

### ✅ **Backend Robusto**
- **APIs PHP** com PDO e prepared statements
- **Sistema de autenticação** direto com banco
- **Controle de permissões** granular por módulo/unidade
- **Cache inteligente** com TTL configurável
- **Logs e auditoria** completos
- **Conexão Supabase** configurada e funcionando

### ✅ **Frontend Modular**
- **Arquitetura modular** com carregamento dinâmico
- **SPA experience** com roteamento inteligente
- **Responsividade total** mobile-first
- **Performance otimizada** com lazy loading
- **Template system** para novos módulos

### ✅ **Template Base Implementado** (NOVO!)
- **Template HTML base** completo em `shared/templates/`
- **BaseTemplate JavaScript class** com funcionalidades padrão
- **Exemplo prático** com CRUD completo implementado
- **Documentação completa** de uso e customização
- **Sistema de herança** para novos módulos

### ✅ **Componentes JavaScript** (NOVO!)
- **DromeDesignSystem.button** - Sistema de botões completo
- **DromeDesignSystem.card** - Cards com ações e hover effects
- **DromeDesignSystem.navigation** - Sidebar e breadcrumbs
- **DromeDesignSystem.modal** - Modais responsivos
- **DromeDesignSystem.notifications** - Sistema de notificações
- **DromeDesignSystem.components** - Dropdown, tooltip, accordion
- **DromeDesignSystem.utils** - Utilitários e helpers

### ✅ **Experiência do Usuário**
- **Interface moderna** baseada em Material Design
- **Navegação intuitiva** com breadcrumbs
- **Feedback visual** com notificações
- **Acessibilidade** com suporte a screen readers
- **Consistência visual** através do template base

---

## 🎯 **O que foi Implementado Recentemente** (6 de agosto de 2025)

### **1. Sistema de Templates Base**
Criado template HTML base reutilizável que inclui:
- Layout padrão completo (sidebar, header, main, footer)
- Autenticação automática
- Navegação dinâmica baseada em permissões
- Breadcrumbs automáticos
- Sistema de tema claro/escuro
- Responsividade total

### **2. JavaScript Component Library**
Implementada biblioteca completa de componentes JavaScript:
- API unificada para criação de modais, notificações, cards
- Sistema de botões com loading states
- Componentes avançados (dropdown, tooltip, accordion)
- Integração perfeita com o CSS do design system

### **3. Exemplo Prático Completo**
Criado exemplo funcional que demonstra:
- Como usar o template base
- CRUD completo com modais
- Sistema de filtros e busca
- Notificações em tempo real
- Estados de loading
- Validação de formulários

### **4. Documentação Técnica**
Adicionada documentação completa incluindo:
- Guia de uso do template base
- API JavaScript documentada
- Exemplos de implementação
- Checklist de qualidade
- Padrões de desenvolvimento
