# DromeBoard

Sistema de Dashboard Modular para Gestão de Negócios

## 📊 Sobre o Projeto

DromeBoard é um sistema de dashboard modular desenvolvido para gerenciamento de unidades de negócio, usuários e análise de resultados. O sistema oferece uma arquitetura flexível que permite diferentes níveis de acesso e módulos específicos por unidade.

## 🏗️ Arquitetura

### Estrutura de Diretórios
```
DromeBoard/
├── api/                    # Backend APIs (PHP)
│   ├── database.php       # Configuração do banco
│   ├── login.php         # Autenticação
│   ├── users.php         # Gestão de usuários
│   ├── units.php         # Gestão de unidades
│   └── ...
├── auth/                  # Sistema de autenticação
├── core/                  # Núcleo do sistema
├── modules/               # Módulos funcionais
│   ├── dashboard-home/
│   ├── gestao-usuarios/
│   ├── gestao-unidades/
│   └── resultados/
├── assets/               # Recursos estáticos
└── shared/              # Componentes compartilhados
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

## 📄 Licença

Este projeto está sob a licença [MIT](LICENSE).

## 👥 Equipe

- **Jean Petri** - Desenvolvedor Principal - jeanpetri@gmail.com

---

**DromeProduto** - Soluções em Gestão de Negócios
