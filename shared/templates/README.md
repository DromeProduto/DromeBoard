# Template Base - DromeBoard

## 📋 Visão Geral

O template base (`shared/templates/base.html`) é um modelo HTML completo e reutilizável que utiliza o design system do DromeBoard. Ele fornece uma estrutura consistente para todos os módulos do sistema.

## 🏗️ Estrutura do Template

### **Layout Principal:**
```
┌─────────────────────────────────┐
│           Sidebar               │  Header
├─────────────────────────────────┤
│  Navigation │    Main Content   │
│     Menu    │                   │
│             │    Page Content   │
│             │                   │
├─────────────┴───────────────────┤
│           Footer                │
└─────────────────────────────────┘
```

### **Componentes Incluídos:**

#### **1. Sidebar**
- ✅ Logo e título do sistema
- ✅ Navegação dinâmica baseada em permissões
- ✅ Toggle collapse responsivo
- ✅ Informações do usuário
- ✅ Toggle de tema claro/escuro
- ✅ Botão de logout

#### **2. Header**
- ✅ Breadcrumbs dinâmicos
- ✅ Botão de notificações
- ✅ Dropdown de perfil (mobile)
- ✅ Responsivo

#### **3. Main Content**
- ✅ Page header com título e descrição
- ✅ Área para ações da página
- ✅ Área para estatísticas/métricas
- ✅ Container principal de conteúdo

#### **4. Footer**
- ✅ Copyright
- ✅ Versão do sistema
- ✅ Status de conexão

## 🚀 Como Usar o Template

### **1. Cópia Base**
```bash
# Copie o template para seu módulo
cp shared/templates/base.html modules/seu-modulo/seu-modulo.html
```

### **2. Personalização de Variáveis**
Substitua as variáveis no HTML:

```html
<!-- Antes -->
<title>{{pageTitle}} - DromeBoard</title>
<link rel="stylesheet" href="{{moduleStyles}}">
<script src="{{moduleScript}}"></script>

<!-- Depois -->
<title>Gestão de Usuários - DromeBoard</title>
<link rel="stylesheet" href="gestao-usuarios.css">
<script src="gestao-usuarios.js"></script>
```

### **3. Exemplo de Implementação**

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Gestão de Usuários - DromeBoard</title>
    
    <!-- Design System -->
    <link rel="stylesheet" href="../shared/drome-design-system.css">
    <link rel="stylesheet" href="../shared/global-styles-new.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    
    <!-- Módulo específico -->
    <link rel="stylesheet" href="gestao-usuarios.css">
    
    <meta name="description" content="Gerencie usuários do sistema DromeBoard">
</head>
<body class="drome-bg-gray-50 dark:drome-bg-gray-900">
    <!-- Todo o conteúdo do template base aqui -->
    
    <!-- Script específico do módulo -->
    <script src="gestao-usuarios.js"></script>
</body>
</html>
```

## ⚙️ JavaScript do Template Base

### **Classe BaseTemplate**

A classe `BaseTemplate` fornece funcionalidades padrão:

```javascript
// Acessível globalmente
window.baseTemplate = new BaseTemplate();

// Métodos disponíveis:
baseTemplate.updatePageHeader('Novo Título', 'Nova descrição');
baseTemplate.addPageAction('<button class="drome-btn">Nova Ação</button>');
baseTemplate.updateMainContent('<div>Novo conteúdo</div>');
baseTemplate.showPageStats([
    { value: '150', label: 'Total de Usuários', color: 'primary' },
    { value: '12', label: 'Novos Hoje', color: 'success' }
]);
```

### **Funcionalidades Automáticas:**

- ✅ **Autenticação**: Verifica login automaticamente
- ✅ **Navegação**: Carrega menu baseado em permissões
- ✅ **Tema**: Gerencia tema claro/escuro
- ✅ **Breadcrumbs**: Atualiza navegação automaticamente
- ✅ **Responsividade**: Adapta sidebar para mobile
- ✅ **Logout**: Modal de confirmação

## 🎨 Personalização de Módulos

### **1. JavaScript do Módulo**

Crie uma classe para seu módulo que extend ou utilize o template base:

```javascript
// gestao-usuarios.js
class GestaoUsuarios {
    constructor() {
        this.init();
    }
    
    init() {
        // Aguarda o template base carregar
        if (window.baseTemplate) {
            this.setupModule();
        } else {
            document.addEventListener('DOMContentLoaded', () => {
                setTimeout(() => this.setupModule(), 100);
            });
        }
    }
    
    setupModule() {
        // Personaliza o header da página
        baseTemplate.updatePageHeader(
            'Gestão de Usuários',
            'Gerencie usuários e suas permissões no sistema'
        );
        
        // Adiciona ações específicas
        baseTemplate.addPageAction(`
            <button class="drome-btn drome-btn-primary" onclick="gestaoUsuarios.novoUsuario()">
                <i class="fas fa-plus drome-mr-2"></i>
                Novo Usuário
            </button>
        `);
        
        // Carrega dados e interface
        this.loadData();
        this.setupEventListeners();
    }
    
    loadData() {
        // Sua lógica de carregamento
        fetch('../api/users.php')
            .then(response => response.json())
            .then(data => {
                this.renderUsers(data);
                this.updateStats(data);
            });
    }
    
    updateStats(data) {
        baseTemplate.showPageStats([
            { value: data.length.toString(), label: 'Total de Usuários', color: 'primary' },
            { value: data.filter(u => u.active).length.toString(), label: 'Usuários Ativos', color: 'success' },
            { value: data.filter(u => !u.active).length.toString(), label: 'Usuários Inativos', color: 'warning' }
        ]);
    }
    
    renderUsers(users) {
        const html = `
            <div class="drome-card">
                <div class="drome-card-header">
                    <h3 class="drome-h3">Lista de Usuários</h3>
                </div>
                <div class="drome-card-body">
                    <!-- Sua tabela/lista de usuários -->
                </div>
            </div>
        `;
        
        baseTemplate.updateMainContent(html);
    }
    
    novoUsuario() {
        // Modal para novo usuário
        const modal = window.dromeDesignSystem.modal.create({
            title: 'Novo Usuário',
            content: `
                <form class="drome-space-y-4">
                    <div class="drome-form-group">
                        <label class="drome-label">Nome:</label>
                        <input type="text" class="drome-input" required>
                    </div>
                    <!-- Mais campos -->
                </form>
            `,
            buttons: [
                { text: 'Cancelar', class: 'secondary' },
                { text: 'Salvar', class: 'primary', action: () => this.salvarUsuario() }
            ]
        });
    }
    
    setupEventListeners() {
        // Seus event listeners específicos
    }
}

// Inicializa o módulo
window.gestaoUsuarios = new GestaoUsuarios();
```

### **2. CSS do Módulo**

```css
/* gestao-usuarios.css */

/* Estilos específicos do módulo */
.users-table {
    /* Suas customizações usando o design system */
}

.user-card {
    @apply drome-card drome-p-4 drome-mb-4;
}

/* Utilize as classes do design system sempre que possível */
```

## 📱 Responsividade

O template é totalmente responsivo:

- **Desktop (≥1024px)**: Layout completo com sidebar expandida
- **Tablet (768px-1023px)**: Sidebar colapsível
- **Mobile (<768px)**: Sidebar overlay + menu mobile

### **Breakpoints:**

```css
/* Mobile first - classes utilitárias disponíveis */
.drome-sm-hidden     /* Oculto em mobile */
.drome-md-grid-cols-2 /* 2 colunas em tablet */
.drome-lg-flex       /* Flex em desktop */
```

## 🔧 Configurações Avançadas

### **1. Customizar Navegação**

```javascript
// No seu módulo, você pode personalizar a navegação
baseTemplate.customNavigation = [
    { name: 'sub-item', label: 'Sub Item', icon: 'fas fa-cog', href: '#' }
];
```

### **2. Status de Conexão**

```javascript
// Atualizar status de conexão
document.getElementById('connection-status').innerHTML = `
    <div class="drome-w-2 drome-h-2 drome-bg-red-500 drome-rounded-full"></div>
    Offline
`;
```

### **3. Notificações Personalizadas**

```javascript
// Substituir método de notificações
baseTemplate.showNotifications = function() {
    // Sua lógica personalizada
};
```

## ✅ Checklist de Implementação

### **Ao criar um novo módulo:**

- [ ] Copiar `shared/templates/base.html`
- [ ] Substituir variáveis `{{pageTitle}}`, `{{moduleStyles}}`, `{{moduleScript}}`
- [ ] Criar arquivo CSS específico do módulo
- [ ] Criar arquivo JS específico do módulo
- [ ] Implementar classe JavaScript que use `baseTemplate`
- [ ] Testar responsividade
- [ ] Testar autenticação e permissões
- [ ] Testar tema claro/escuro

### **Verificações de qualidade:**

- [ ] Design consistente com o sistema
- [ ] Performance otimizada
- [ ] Acessibilidade (navegação por teclado)
- [ ] SEO básico (títulos, meta tags)
- [ ] Tratamento de erros
- [ ] Loading states adequados

## 🎯 Benefícios do Template

### **✅ Consistência:**
- Layout uniforme em todos os módulos
- Componentes padronizados
- Experiência de usuário consistente

### **✅ Produtividade:**
- Setup rápido de novos módulos
- Funcionalidades básicas já implementadas
- Menos código duplicado

### **✅ Manutenibilidade:**
- Mudanças centralizadas no design system
- Estrutura organizada e documentada
- Fácil debugging e atualizações

### **✅ Performance:**
- CSS/JS otimizados
- Loading inteligente de recursos
- Cache management integrado

---

## 📞 Suporte

Para dúvidas sobre o template base:

1. Consulte esta documentação
2. Verifique exemplos em `modules/`
3. Teste no console: `window.baseTemplate`
4. Entre em contato com a equipe de desenvolvimento

**Template Base v2.0** - DromeBoard Design System
*Última atualização: 6 de agosto de 2025*
