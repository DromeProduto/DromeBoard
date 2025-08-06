# DromeBoard - Configuração MCP GitHub

## 📋 Visão Geral

Este projeto está configurado para usar o Model Context Protocol (MCP) do GitHub, que permite integração avançada com repositórios, issues, pull requests e automações.

## 🚀 Configuração Inicial

### 1. Executar Script de Setup

```bash
./setup-mcp.sh
```

### 2. Obter GitHub Personal Access Token

1. Acesse: https://github.com/settings/tokens
2. Clique em "Generate new token (classic)"
3. Configure as seguintes permissões:
   - ✅ **repo** - Acesso completo a repositórios
   - ✅ **workflow** - Para GitHub Actions
   - ✅ **read:org** - Para organizações
   - ✅ **read:user** - Informações do usuário
   - ✅ **project** - Para GitHub Projects

### 3. Configurar Token

O token será solicitado automaticamente quando o MCP for usado. Mantenha-o seguro e não compartilhe.

## 🛠️ Funcionalidades Disponíveis

### Repositórios
- Criar, listar e gerenciar repositórios
- Acessar informações de commits e branches
- Gerenciar configurações do repositório

### Issues e Pull Requests
- Criar, editar e comentar em issues
- Criar e revisar pull requests
- Gerenciar labels e milestones

### GitHub Actions
- Executar workflows
- Monitorar status de builds
- Acessar logs de execução

### Colaboração
- Gerenciar colaboradores
- Configurar webhooks
- Acessar estatísticas do projeto

## 📁 Estrutura de Arquivos

```
DromeBoard/
├── .mcp-config.json    # Configuração do MCP
├── setup-mcp.sh       # Script de configuração
└── docs/
    └── MCP_GITHUB.md   # Esta documentação
```

## 🔧 Configuração Avançada

### Variáveis de Ambiente

```bash
# Token do GitHub (necessário)
export GITHUB_PERSONAL_ACCESS_TOKEN="seu_token_aqui"

# Opcional: configurar organização padrão
export GITHUB_DEFAULT_ORG="DromeProduto"

# Opcional: configurar repositório padrão
export GITHUB_DEFAULT_REPO="DromeBoard"
```

### Arquivo .env (Opcional)

Crie um arquivo `.env` na raiz do projeto:

```env
GITHUB_PERSONAL_ACCESS_TOKEN=seu_token_aqui
GITHUB_DEFAULT_ORG=DromeProduto
GITHUB_DEFAULT_REPO=DromeBoard
```

## 🎯 Casos de Uso para DromeBoard

### 1. Automação de Releases
- Criar tags e releases automaticamente
- Gerar changelog baseado em commits
- Notificar equipe sobre novas versões

### 2. Gestão de Issues
- Criar issues para bugs automaticamente
- Sincronizar issues com sistema de gestão interno
- Gerar relatórios de progresso

### 3. CI/CD Integration
- Triggerar builds após push
- Deploy automático em diferentes ambientes
- Testes automatizados

### 4. Code Review
- Análise automática de código
- Sugestões de melhoria
- Verificação de padrões de código

## 🔍 Troubleshooting

### Erro: "Token inválido"
- Verifique se o token tem as permissões corretas
- Confirme se o token não expirou
- Teste o token manualmente via API do GitHub

### Erro: "Servidor MCP não encontrado"
- Execute novamente: `npm install -g @modelcontextprotocol/server-github`
- Verifique se Node.js está atualizado

### Erro: "Permissão negada"
- Verifique se o token tem acesso ao repositório
- Confirme se você é colaborador do repositório

## 📚 Recursos Adicionais

- [Documentação MCP](https://modelcontextprotocol.io/)
- [GitHub API](https://docs.github.com/en/rest)
- [GitHub Personal Access Tokens](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token)

## 🔒 Segurança

- ⚠️ **NUNCA** commit o token no código
- Use variáveis de ambiente ou arquivos .env
- Adicione `.env` ao `.gitignore`
- Revogue tokens desnecessários regularmente
- Use tokens com escopo mínimo necessário

---

**DromeBoard v2.0** - Sistema com Integração GitHub MCP
*Última atualização: 6 de agosto de 2025*
