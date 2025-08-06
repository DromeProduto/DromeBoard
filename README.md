# 🚀 DromeBoard v2.0 - Sistema de Dashboard Modular

> **Status**: ✅ **SISTEMA 100% FUNCIONAL** - Todas as correções críticas implementadas

## 📊 **Resumo Executivo**

Sistema de dashboard modular completo com autenticação, gestão de usuários/unidades e upload de dados. Arquitetura baseada em ModuleLoader dinâmico com design system responsivo.

## 🎯 **Funcionalidades Principais**

### ✅ **Sistema Core Completo**
- **Autenticação**: Login/logout com controle de sessão
- **ModuleLoader**: Carregamento dinâmico de módulos
- **Navegação**: Sidebar responsiva com navegação fluida
- **Permissões**: Sistema granular por role/unidade

### ✅ **Módulos Implementados**
- **Resultados**: Analytics com upload de planilhas XLSX
- **Gestão de Usuários**: CRUD completo de usuários
- **Gestão de Unidades**: Administração de unidades organizacionais

### ✅ **Design System**
- **CSS Variables**: Tema claro/escuro configurável
- **Componentes**: Biblioteca completa (botões, cards, modais)
- **Responsividade**: Mobile-first design
- **Performance**: Carregamento otimizado

## 🚀 **Início Rápido**

### **1. Iniciar Servidor**
```bash
php -S localhost:8000
```

### **2. Acessar Sistema**
```
http://localhost:8000/auth/login.html
```

### **3. Credenciais Padrão**
```
Email: admin@dromeflow.com
Senha: [definida no banco]
```

## 📁 **Estrutura do Projeto**

```
DromeBoard/
├── api/                    # Backend PHP + APIs
├── auth/                   # Sistema de autenticação
├── core/                   # Dashboard principal + ModuleLoader
├── modules/                # Módulos do sistema
│   ├── resultados/         # Analytics e resultados
│   ├── gestao-usuarios/    # Gestão de usuários
│   └── gestao-unidades/    # Gestão de unidades
├── shared/                 # Design system + configurações globais
└── assets/                 # Recursos estáticos
```

## 🔧 Tecnologias

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Backend**: PHP
- **Banco de Dados**: PostgreSQL (Supabase)
- **Autenticação**: Sistema próprio baseado em roles
- **Gráficos**: Chart.js

## 📋 Funcionalidades

### Módulos Disponíveis
- **Dashboard**: Visão geral e métricas
- **Gestão de Usuários**: Administração de usuários
- **Gestão de Unidades**: Controle de filiais/unidades
- **Resultados**: Upload e análise de dados XLSX
- **Pós-Venda**: Acompanhamento de serviços
- **Configurações**: Ajustes do sistema

### Sistema de Permissões
- **Super Admin**: Acesso total ao sistema
- **Admin**: Administração de unidades específicas
- **Atendente**: Acesso operacional

## ⚙️ Configuração

### Pré-requisitos
- PHP 7.4 ou superior
- PostgreSQL
- Servidor web (Apache/Nginx)

### Instalação

1. Clone o repositório:
```bash
git clone git@github.com:DromeProduto/DromeBoard.git
```

2. Configure o banco de dados:
```bash
# Execute o script SQL
psql -h host -U user -d database -f "Banco de Dados.sql"
```

3. Configure as credenciais:
```php
// Em api/database.php
private $host = "seu-host-supabase";
private $username = "seu-usuario";
private $password = "sua-senha";
```

## 🚀 Uso

1. Acesse o sistema através de `auth/login.html`
2. Use as credenciais de administrador
3. Configure unidades e usuários conforme necessário
4. Habilite módulos por unidade

## 📊 Banco de Dados

### Tabelas Principais
- `users` - Usuários do sistema
- `roles` - Perfis de acesso
- `units` - Unidades/filiais
- `modules` - Módulos do sistema
- `user_units` - Associação usuário-unidade
- `unit_modules` - Módulos habilitados por unidade

## 🔐 Segurança

- Autenticação baseada em email/senha
- Controle de acesso por roles
- Validação de permissões por módulo
- Proteção contra SQL injection (PDO)

## 📈 Roadmap

- [ ] Sistema de notificações
- [ ] Relatórios avançados
- [ ] API REST completa
- [ ] Mobile responsivo
- [ ] Integração com terceiros

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## � **Suporte**

- **Documentação**: Consulte `SETUP.md` para detalhes técnicos
- **Estrutura**: Todos os arquivos principais documentados
- **Debug**: Console do navegador + logs PHP
- **Performance**: Sistema otimizado para uso real

---

**DromeBoard v2.0** - Sistema de Dashboard Modular Completo  
*Última atualização: 6 de agosto de 2025*  
*Status: ✅ Sistema 100% Funcional*
