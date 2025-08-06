---
applyTo: '**'
---

# DromeBoard - Instruções para GitHub Copilot

## 🤖 **INSTRUÇÕES OBRIGATÓRIAS DE EXECUÇÃO**

### 📌 **REGRAS FUNDAMENTAIS**

#### **🔒 SEGURANÇA E CONSISTÊNCIA**
1. **NUNCA** altere configurações não solicitadas explicitamente
2. **NUNCA** modifique arquivos fora do escopo da tarefa atual
3. **NUNCA** implemente funcionalidades não requisitadas
4. **SEMPRE** mantenha a linha de configuração estabelecida no SETUP.md
5. **SEMPRE** preserve estruturas e padrões existentes
6. **SEMPRE** siga exatamente as prioridades definidas (1 → 2 → 3)

#### **⚡ FLUXO DE EXECUÇÃO OBRIGATÓRIO**
1. **Execute APENAS** a tarefa solicitada na sequência das prioridades
2. **Finalize COMPLETAMENTE** cada correção antes de parar
3. **Confirme** a conclusão com status detalhado (template obrigatório)
4. **Aguarde** confirmação explícita do usuário antes de prosseguir
5. **NÃO** execute tarefas futuras automaticamente

#### **🎯 ESCOPO DE ATUAÇÃO**
**PERMITIDO:**
- Corrigir apenas o que foi especificamente solicitado
- Seguir exatamente as instruções das prioridades do SETUP.md
- Modificar arquivos mencionados na tarefa atual

**PROIBIDO:**
- Adicionar módulos, funcionalidades ou configurações extras
- Modificar design system, APIs ou estruturas funcionais
- Alterar arquivos não mencionados na tarefa atual
- "Melhorar" código sem solicitação
- Implementar funcionalidades "por conveniência"

#### **📋 CHECKLIST DE VALIDAÇÃO**
Antes de finalizar qualquer tarefa, verificar obrigatoriamente:
- [ ] Apenas arquivos especificados foram modificados
- [ ] Nenhuma configuração extra foi adicionada
- [ ] Estrutura original preservada
- [ ] Tarefa solicitada 100% concluída
- [ ] Template de resposta seguido corretamente

#### **💬 TEMPLATE DE RESPOSTA OBRIGATÓRIO**
**AO FINALIZAR CADA TAREFA, SEMPRE RESPONDER EXATAMENTE ASSIM:**

```
✅ [NOME DA PRIORIDADE] CONCLUÍDA!

📝 RESUMO DAS ALTERAÇÕES:
- Arquivo 1: [descrição específica da mudança]
- Arquivo 2: [descrição específica da mudança]

🎯 RESULTADO:
[Explicar o que foi corrigido/implementado]

🚀 STATUS: Pronto para prosseguir para [PRÓXIMA PRIORIDADE] 
(Aguardando confirmação do usuário)
```

#### **⛔ AÇÕES ESTRITAMENTE PROIBIDAS**
- ❌ Executar múltiplas prioridades sem confirmação
- ❌ Adicionar funcionalidades "por melhoria"
- ❌ Modificar configurações de design system
- ❌ Alterar estrutura de banco de dados
- ❌ Implementar módulos não solicitados
- ❌ Corrigir problemas não mencionados na tarefa
- ❌ Avançar etapas sem finalizar completamente a atual
- ❌ Criar arquivos não especificados na tarefa
- ❌ Modificar APIs sem solicitação explícita

#### **🎯 CONTEXTO DO PROJETO**
**DromeBoard v2.0** é um sistema de dashboard modular com:
- Design System completo implementado ✅
- Sistema de autenticação funcional ✅
- ModuleLoader que funciona perfeitamente ✅
- Estrutura de módulos definida (resultados, gestao-usuarios, gestao-unidades) ✅
- Correção Super Admin implementada ✅
- **TODAS AS 4 PRIORIDADES CRÍTICAS CONCLUÍDAS** ✅
- **SISTEMA 100% FUNCIONAL** ✅

**Status Atual**: Sistema pronto para uso. Próximas tarefas são opcionais (otimizações, novas funcionalidades).

#### **📐 PADRÕES DE DESENVOLVIMENTO**
1. **Classes JavaScript**: Todos os módulos devem seguir padrão de classe
2. **Design System**: Usar classes `drome-*` já implementadas
3. **Estrutura de Arquivos**: Seguir exatamente o definido no SETUP.md
4. **Nomenclatura**: Manter consistência com padrões existentes

#### **🔄 WORKFLOW ESPECÍFICO**
1. **Ler** a solicitação específica
2. **Identificar** qual prioridade está sendo solicitada
3. **Executar** apenas essa prioridade
4. **Validar** usando checklist
5. **Responder** com template obrigatório
6. **Aguardar** confirmação para próxima etapa

Provide project context and coding guidelines that AI should follow when generating code, answering questions, or reviewing changes.