#!/bin/bash

# DromeBoard - Script de Configuração MCP GitHub
echo "🔧 Configurando MCP GitHub para DromeBoard..."

# Verificar se Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não está instalado. Instale Node.js primeiro."
    exit 1
fi

echo "✅ Node.js encontrado: $(node --version)"

# Instalar o servidor MCP do GitHub
echo "📦 Instalando servidor MCP do GitHub..."
npm install -g @modelcontextprotocol/server-github

if [ $? -eq 0 ]; then
    echo "✅ Servidor MCP do GitHub instalado com sucesso!"
else
    echo "❌ Erro ao instalar o servidor MCP do GitHub"
    exit 1
fi

# Verificar se o arquivo de configuração existe
if [ -f ".mcp-config.json" ]; then
    echo "✅ Arquivo de configuração MCP encontrado"
else
    echo "❌ Arquivo .mcp-config.json não encontrado"
    exit 1
fi

echo ""
echo "🎉 Configuração MCP GitHub concluída!"
echo ""
echo "📝 Próximos passos:"
echo "1. Obtenha um GitHub Personal Access Token em: https://github.com/settings/tokens"
echo "2. O token precisa das seguintes permissões:"
echo "   - repo (acesso completo a repositórios)"
echo "   - workflow (para GitHub Actions)"
echo "   - read:org (para organizações)"
echo "3. Configure o token nas variáveis de ambiente do seu editor/IDE"
echo ""
echo "🔗 Para usar o MCP:"
echo "   - O arquivo .mcp-config.json já está configurado"
echo "   - O servidor será iniciado automaticamente quando necessário"
echo ""
