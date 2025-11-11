# ⚠️ IMPORTANTE: AutoGen v2 (Python) Comanda TUDO - Sem Conflitos

## 🎯 Princípio Fundamental

**AutoGen v2 (Python) é o ÚNICO orquestrador do sistema.**

Todas as execuções, ferramentas, agentes e operações devem passar pelo AutoGen v2 Python.

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────────┐
│                    TypeScript (Frontend)                 │
│  - Interface do usuário                                 │
│  - Comunicação WebSocket                                │
│  - Roteamento de mensagens                              │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ Chama
                     ↓
┌─────────────────────────────────────────────────────────┐
│              autogen_v2_bridge.ts (TypeScript)          │
│  - Ponte TypeScript → Python                            │
│  - Serializa requisições                                │
│  - Deserializa respostas                                │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ spawn("python", ["autogen_v2_orchestrator.py"])
                     ↓
┌─────────────────────────────────────────────────────────┐
│         AutoGen v2 Python (SuperAgentOrchestrator)      │
│  ⚠️ ÚNICO ORQUESTRADOR - COMANDO TUDO                   │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Agentes AutoGen v2:                             │  │
│  │  - Generator Agent (geração de código)           │  │
│  │  - Critic Agent (revisão e validação)            │  │
│  │  - Planner Agent (planejamento de tarefas)       │  │
│  │  - Executor Agent (execução de código)           │  │
│  │  - UFO Agent (automação GUI)                     │  │
│  │  - Multimodal Agent (análise visual)             │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Ferramentas (via Agent Tools):                  │  │
│  │  - Open Interpreter (execução de código)         │  │
│  │  - UFO (automação GUI)                           │  │
│  │  - Browser-Use (navegação web)                   │  │
│  │  - After Effects MCP (edição de vídeo)           │  │
│  │  - ChromaDB (memória)                            │  │
│  │  - Sistema Cognitivo ANIMA                       │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Memória ChromaDB:                               │  │
│  │  - Armazenamento persistente                     │  │
│  │  - Busca semântica                               │  │
│  │  - Contexto de conversas                         │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## ✅ O Que AutoGen v2 Controla

### 1. **Agentes**
- ✅ Generator Agent (geração de código)
- ✅ Critic Agent (revisão e validação)
- ✅ Planner Agent (planejamento de tarefas)
- ✅ Executor Agent (execução de código)
- ✅ UFO Agent (automação GUI)
- ✅ Multimodal Agent (análise visual)

### 2. **Ferramentas**
- ✅ Open Interpreter (execução de código Python/JavaScript/Shell)
- ✅ UFO (automação GUI Windows)
- ✅ Browser-Use (navegação web com Playwright)
- ✅ After Effects MCP (edição de vídeo)
- ✅ ChromaDB (memória persistente)
- ✅ Sistema Cognitivo ANIMA (emoções, memória, raciocínio)

### 3. **Execuções**
- ✅ Execução de código (Python, JavaScript, Shell, etc.)
- ✅ Comandos do sistema (abrir apps, executar comandos)
- ✅ Operações de arquivos (ler, escrever, editar, deletar)
- ✅ Navegação web (buscar, preencher formulários, extrair dados)
- ✅ Automação GUI (clicar, digitar, navegar interfaces)
- ✅ Edição de vídeo (After Effects)

## ❌ O Que NÃO Deve Ser Feito Diretamente no TypeScript

### ❌ **NÃO execute código diretamente**
```typescript
// ❌ ERRADO - Não faça isso!
const { executeCode } = await import("./code_executor");
await executeCode(code, "python");
```

### ❌ **NÃO chame ferramentas diretamente**
```typescript
// ❌ ERRADO - Não faça isso!
const { executeShell } = await import("./code_executor");
await executeShell("notepad");
```

### ❌ **NÃO use Open Interpreter diretamente**
```typescript
// ❌ ERRADO - Não faça isso!
import interpreter from "open-interpreter";
interpreter.chat("Write code");
```

## ✅ Como Fazer Corretamente

### ✅ **Use AutoGen v2 Python para TUDO**
```typescript
// ✅ CORRETO - Use AutoGen v2
import { executeWithAutoGenV2 } from "./autogen_v2_bridge";

const result = await executeWithAutoGenV2({
  task: "Write a Python function to calculate fibonacci",
  intent: { type: "action", confidence: 0.9 },
  context: {},
  model: "deepseek-coder-v2-16b-q4_k_m-rtx",
});

// AutoGen v2 Python:
// 1. Roteia para o agente apropriado (Generator Agent)
// 2. Gera código usando Ollama
// 3. Executa código usando Executor Agent + Open Interpreter
// 4. Valida resultado usando Critic Agent
// 5. Armazena na memória ChromaDB
// 6. Retorna resultado
```

## 📋 Fluxo de Execução

### 1. **Requisição do Usuário**
```
Usuário → TypeScript → autogen_v2_bridge.ts
```

### 2. **Ponte TypeScript → Python**
```
autogen_v2_bridge.ts → spawn("python", ["autogen_v2_orchestrator.py"])
```

### 3. **AutoGen v2 Python Orquestra TUDO**
```
SuperAgentOrchestrator:
  1. Analisa tarefa
  2. Seleciona agentes apropriados
  3. Cria plano (se necessário)
  4. Executa usando Team (RoundRobinTeam)
  5. Agentes usam ferramentas (Open Interpreter, UFO, etc.)
  6. Armazena na memória ChromaDB
  7. Retorna resultado
```

### 4. **Resposta ao Usuário**
```
AutoGen v2 Python → autogen_v2_bridge.ts → TypeScript → Usuário
```

## 🔧 Configuração

### Variáveis de Ambiente

```bash
# Ollama
OLLAMA_BASE_URL=http://localhost:11434
DEFAULT_MODEL=deepseek-coder-v2-16b-q4_k_m-rtx

# AutoGen v2
AUTOGEN_V2_ENABLED=true
AUTOGEN_V2_MEMORY_ENABLED=true
AUTOGEN_V2_OPEN_INTERPRETER_ENABLED=true
AUTOGEN_V2_UFO_ENABLED=false  # Desabilitado por enquanto (sem sandbox)
```

### Dependências Python

```bash
pip install autogen-agentchat autogen-ext[ollama] chromadb
```

## 🚨 Regras Críticas

### 1. **Nunca Execute Código Diretamente no TypeScript**
- ❌ Não use `code_executor.ts` diretamente
- ❌ Não use `executeCode()`, `executeShell()`, etc. diretamente
- ✅ Use AutoGen v2 Python via `autogen_v2_bridge.ts`

### 2. **Nunca Chame Ferramentas Diretamente**
- ❌ Não use Open Interpreter diretamente
- ❌ Não use UFO diretamente
- ❌ Não use Browser-Use diretamente
- ✅ Use AutoGen v2 Python que orquestra todas as ferramentas

### 3. **Nunca Gerencie Memória Diretamente**
- ❌ Não use ChromaDB diretamente do TypeScript
- ✅ Use AutoGen v2 Python que gerencia memória através dos agentes

### 4. **Fallback Apenas para Conversas Simples**
- ✅ Fallback TypeScript é permitido APENAS para conversas/perguntas simples
- ❌ Ações/comandos DEVEM usar AutoGen v2 Python (obrigatório)

## 📝 Exemplos

### Exemplo 1: Gerar e Executar Código

```typescript
// ✅ CORRETO
const result = await executeWithAutoGenV2({
  task: "Write a Python function to calculate fibonacci numbers and test it",
  intent: { type: "action", actionType: "code", confidence: 0.9 },
  context: {},
  model: "deepseek-coder-v2-16b-q4_k_m-rtx",
});

// AutoGen v2 Python:
// 1. Planner Agent cria plano
// 2. Generator Agent gera código
// 3. Executor Agent executa código (via Open Interpreter)
// 4. Critic Agent valida resultado
// 5. Armazena na memória ChromaDB
// 6. Retorna resultado completo
```

### Exemplo 2: Abrir Aplicativo

```typescript
// ✅ CORRETO
const result = await executeWithAutoGenV2({
  task: "Open Notepad",
  intent: { type: "action", actionType: "system", confidence: 0.9 },
  context: {},
  model: "deepseek-coder-v2-16b-q4_k_m-rtx",
});

// AutoGen v2 Python:
// 1. Planner Agent identifica ação
// 2. Executor Agent executa comando (via Open Interpreter)
// 3. Retorna resultado
```

### Exemplo 3: Conversa Simples (Fallback Permitido)

```typescript
// ✅ CORRETO (Fallback permitido para conversas)
if (intent.type === "conversation" || intent.type === "question") {
  // Usar fallback TypeScript (mais rápido para conversas)
  const response = await callOllamaChat(messages, model);
  return response;
} else {
  // Usar AutoGen v2 Python (obrigatório para ações)
  const result = await executeWithAutoGenV2({ task, intent, context });
  return result.result;
}
```

## 🐛 Troubleshooting

### Erro: "AutoGen v2 não disponível"

1. **Verificar dependências Python**:
   ```bash
   pip install autogen-agentchat autogen-ext[ollama] chromadb
   ```

2. **Verificar se o script existe**:
   ```bash
   ls super_agent/core/autogen_v2_orchestrator.py
   ```

3. **Verificar se Python está no PATH**:
   ```bash
   python --version
   ```

### Erro: "ImportError: cannot import name 'AssistantAgent'"

1. **Instalar AutoGen v2**:
   ```bash
   pip install autogen-agentchat autogen-ext[ollama]
   ```

2. **Verificar versão**:
   ```bash
   pip show autogen-agentchat
   ```

### Erro: "AutoGen v2 timeout"

1. **Aumentar timeout** (em `autogen_v2_bridge.ts`):
   ```typescript
   const timeout = 10 * 60 * 1000; // 10 minutos
   ```

2. **Verificar se Ollama está respondendo**:
   ```bash
   curl http://localhost:11434/api/tags
   ```

## ✅ Checklist

- [x] AutoGen v2 Python é o único orquestrador
- [x] TypeScript não executa código diretamente
- [x] TypeScript não chama ferramentas diretamente
- [x] Tudo passa pelo AutoGen v2 Python
- [x] Fallback TypeScript apenas para conversas simples
- [x] Ações/comandos obrigatoriamente usam AutoGen v2 Python
- [x] Memória ChromaDB gerenciada pelo AutoGen v2 Python
- [x] Open Interpreter controlado pelo AutoGen v2 Python
- [x] UFO controlado pelo AutoGen v2 Python
- [x] Browser-Use controlado pelo AutoGen v2 Python

## 📚 Referências

- **AutoGen v2 Documentation**: https://microsoft.github.io/autogen/docs/
- **SuperAgentOrchestrator**: `super_agent/core/orchestrator.py`
- **AutoGen v2 Bridge**: `autogen_agent_interface/server/utils/autogen_v2_bridge.ts`
- **AutoGen v2 Orchestrator Script**: `super_agent/core/autogen_v2_orchestrator.py`

---

**Última atualização**: Janeiro 2025  
**Status**: ✅ **AUTOGEN V2 COMANDA TUDO - SEM CONFLITOS**

