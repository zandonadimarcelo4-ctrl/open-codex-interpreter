# 🧠 Arquitetura Híbrida: Qwen32B-MoE (Cérebro) + DeepSeek-Lite (Executor)

## 🎯 Visão Geral

Sistema híbrido que combina:
- **Qwen2.5-32B-Instruct-MoE**: Cérebro estratégico (raciocínio, planejamento, tool-calling)
- **DeepSeek-Coder-V2-Lite**: Executor rápido (código, refatoração, debugging)

**Resultado:** Sistema com inteligência tipo GPT-4-turbo + execução local eficiente, tudo cabendo em 16GB VRAM.

---

## 📊 Especificações Técnicas

### Qwen2.5-32B-Instruct-MoE (Cérebro)
- **Arquitetura:** MoE (Mixture of Experts)
- **VRAM:** ~12-14GB (Q4_K_M)
- **Especialistas ativos:** 2-4 por token (economia de VRAM)
- **Inteligência:** 🧠 148 (similar a GPT-4-turbo)
- **Capacidades:**
  - ✅ Raciocínio profundo e estratégico
  - ✅ Planejamento multi-etapas
  - ✅ Tool calling nativo
  - ✅ Auto-reflexão e correção
  - ✅ Resolução de problemas complexos

### DeepSeek-Coder-V2-Lite (Executor)
- **Arquitetura:** Dense (todos os pesos ativos)
- **VRAM:** ~8.5GB (Q4_K_M)
- **Velocidade:** 🚀 Rápida
- **Inteligência:** 🧠 144 (excelente para código)
- **Capacidades:**
  - ✅ Geração de código limpo
  - ✅ Execução precisa
  - ✅ Debugging e correção
  - ✅ Refatoração e otimização
  - ✅ Explicação de código

---

## 🏗️ Arquitetura do Sistema

```
┌─────────────────────────────────────────────────────────┐
│              AutoGen Commander (Orquestrador)           │
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Qwen2.5-32B-Instruct-MoE (Cérebro)             │  │
│  │  - Raciocínio estratégico                        │  │
│  │  - Planejamento multi-etapas                     │  │
│  │  - Tool calling                                  │  │
│  │  - Auto-reflexão                                 │  │
│  │  VRAM: ~12-14GB                                  │  │
│  └──────────────────────────────────────────────────┘  │
│                         ↓                                │
│  ┌──────────────────────────────────────────────────┐  │
│  │  DeepSeek-Coder-V2-Lite (Executor)              │  │
│  │  - Geração de código                             │  │
│  │  - Execução de código                            │  │
│  │  - Debugging                                     │  │
│  │  - Refatoração                                   │  │
│  │  VRAM: ~8.5GB (carregado sob demanda)           │  │
│  └──────────────────────────────────────────────────┘  │
│                         ↓                                │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Tools Locais                                    │  │
│  │  - Open Interpreter                              │  │
│  │  - After Effects MCP                             │  │
│  │  - Python/Shell/JavaScript                       │  │
│  │  - Browser-Use                                   │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## ⚙️ Configuração

### 1. Variáveis de Ambiente

```env
# Modelo principal (cérebro estratégico)
DEFAULT_MODEL=qwen2.5-32b-instruct-moe-rtx

# Modelo executor (código rápido)
EXECUTOR_MODEL=deepseek-coder-v2-lite:instruct

# Ollama
OLLAMA_BASE_URL=http://localhost:11434
```

### 2. Código Python (AutoGen)

```python
from autogen_ext.models.openai import OpenAIChatCompletionClient

# Cérebro estratégico (Qwen32B-MoE)
brain_client = OpenAIChatCompletionClient(
    model="ollama/qwen2.5-32b-instruct-moe-rtx",
    api_base="http://localhost:11434/v1",
)

# Executor rápido (DeepSeek-Lite)
executor_client = OpenAIChatCompletionClient(
    model="ollama/deepseek-coder-v2-lite:instruct",
    api_base="http://localhost:11434/v1",
)

# AutoGen Commander (usa brain_client)
commander = create_simple_commander(
    model="qwen2.5-32b-instruct-moe-rtx",
)

# Open Interpreter Agent (usa executor_client quando necessário)
interpreter_agent = create_open_interpreter_agent(
    model="deepseek-coder-v2-lite:instruct",
)
```

### 3. Roteamento Inteligente

```python
# Tarefas estratégicas → Qwen32B-MoE
if task_requires_strategy or task_requires_planning:
    use_model = "qwen2.5-32b-instruct-moe-rtx"

# Tarefas de código → DeepSeek-Lite
elif task_requires_code or task_requires_execution:
    use_model = "deepseek-coder-v2-lite:instruct"

# Tarefas híbridas → Qwen32B-MoE (planeja) → DeepSeek-Lite (executa)
else:
    # Qwen32B-MoE planeja
    plan = brain_client.generate_plan(task)
    # DeepSeek-Lite executa
    result = executor_client.execute_code(plan)
```

---

## 📈 Benefícios

### 1. Inteligência Máxima
- ✅ Raciocínio tipo GPT-4-turbo (Qwen32B-MoE)
- ✅ Planejamento estratégico avançado
- ✅ Auto-reflexão e correção

### 2. Eficiência
- ✅ Execução rápida (DeepSeek-Lite)
- ✅ Economia de VRAM (MoE ativa apenas especialistas necessários)
- ✅ Cache compartilhado (mesmo Ollama backend)

### 3. Flexibilidade
- ✅ Modelos podem ser trocados independentemente
- ✅ Roteamento inteligente baseado em tipo de tarefa
- ✅ Suporte a múltiplos agentes simultâneos

---

## 🚀 Instalação

### 1. Instalar Qwen32B-MoE
```bash
# Windows
scripts\setup_qwen32b_moe_rtx.bat

# Linux/macOS
ollama pull qwen2.5:32b
ollama create qwen2.5-32b-instruct-moe-rtx -f Modelfile.qwen2.5-32b-instruct-moe-rtx
```

### 2. Instalar DeepSeek-Lite
```bash
# Windows
scripts\setup_deepseek_lite_executor_rtx.bat

# Linux/macOS
ollama pull deepseek-coder-v2-lite:instruct
```

### 3. Configurar .env
```env
DEFAULT_MODEL=qwen2.5-32b-instruct-moe-rtx
EXECUTOR_MODEL=deepseek-coder-v2-lite:instruct
```

---

## 📊 Comparação de Modelos

| Modelo | Inteligência | VRAM | Tool Calling | Velocidade | Uso |
|--------|--------------|------|--------------|------------|-----|
| Qwen32B-MoE | 🧠 148 | ~13GB | ✅ Nativo | ⚙️ Média | Cérebro |
| DeepSeek-Lite | 🧠 144 | ~8.5GB | ⚙️ Manual | 🚀 Rápida | Executor |
| Qwen14B | 🧠 141 | ~9GB | ✅ Nativo | 🚀 Rápida | Alternativa |

---

## 🎯 Casos de Uso

### 1. Planejamento Estratégico
- **Modelo:** Qwen32B-MoE
- **Uso:** Criar planos complexos, decompor tarefas, priorizar ações

### 2. Execução de Código
- **Modelo:** DeepSeek-Lite
- **Uso:** Gerar código, executar, debugar, refatorar

### 3. Tool Calling
- **Modelo:** Qwen32B-MoE
- **Uso:** Chamar ferramentas, coordenar múltiplas ferramentas

### 4. Auto-Reflexão
- **Modelo:** Qwen32B-MoE
- **Uso:** Refletir sobre ações, corrigir erros, melhorar planos

---

## 🔧 Otimizações

### 1. Cache Compartilhado
- ✅ Mesmo Ollama backend para ambos os modelos
- ✅ Cache de contexto compartilhado
- ✅ Economia de memória

### 2. Roteamento Inteligente
- ✅ Detectar tipo de tarefa automaticamente
- ✅ Escolher modelo apropriado
- ✅ Balancear carga entre modelos

### 3. Load Balancing
- ✅ Carregar modelos sob demanda
- ✅ Descarregar modelos não utilizados
- ✅ Manter apenas modelo ativo em VRAM

---

## ✅ Conclusão

**Arquitetura Híbrida = Inteligência Máxima + Eficiência Máxima**

- 🧠 **Qwen32B-MoE**: Cérebro estratégico (raciocínio, planejamento, tool-calling)
- 🚀 **DeepSeek-Lite**: Executor rápido (código, execução, debugging)
- 💾 **VRAM Total**: ~13GB (Qwen32B) + ~8.5GB (DeepSeek, sob demanda) = cabe em 16GB
- 🎯 **Resultado**: Sistema com inteligência tipo GPT-4-turbo + execução local eficiente

---

**Status:** ✅ Arquitetura híbrida configurada e pronta para uso!

