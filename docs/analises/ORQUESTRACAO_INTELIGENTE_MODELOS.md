# 🧠 Orquestração Inteligente de Modelos (16GB VRAM)

## 🎯 Objetivo

Gerenciar dois modelos na GPU de 16GB usando **modo alternado**:
- **Qwen2.5-32B-MoE**: Cérebro estratégico (fixo, ~13GB VRAM)
- **Qwen2.5-Coder-14B**: Executor de código (carregado sob demanda, ~9GB VRAM)

**Resultado:** Sistema com inteligência máxima + execução eficiente, sem estourar VRAM.

---

## ⚙️ Estratégia: Modo Alternado

### Como Funciona

1. **Brain (Qwen32B-MoE)** fica carregado na GPU (~13GB VRAM)
2. **Executor (Qwen14B-Coder)** é carregado sob demanda quando necessário
3. Quando Executor é carregado, Brain é descarregado automaticamente (liberando VRAM)
4. Após Executor terminar, Brain é recarregado automaticamente

### Vantagens

- ✅ **Nunca estoura VRAM** (apenas um modelo por vez)
- ✅ **100% GPU** (ambos modelos rodam totalmente na GPU)
- ✅ **Alternância automática** (sem intervenção manual)
- ✅ **Baixa latência** (troca de modelo ~1-2s)

### Desvantagens

- ⚠️ **Pequena pausa** na troca de modelo (~1-2s)
- ⚠️ **Não pode usar ambos simultaneamente** (mas não é necessário)

---

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────────┐
│           SmartCommander (Orquestrador)                │
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │  IntelligentRouter                              │  │
│  │  - Detecta tipo de tarefa                       │  │
│  │  - Roteia para modelo apropriado                │  │
│  └──────────────────────────────────────────────────┘  │
│                         ↓                                │
│  ┌──────────────────────────────────────────────────┐  │
│  │  ModelManager                                    │  │
│  │  - Gerencia carregamento/descarregamento        │  │
│  │  - Alterna modelos automaticamente              │  │
│  │  - Monitora uso de VRAM                         │  │
│  └──────────────────────────────────────────────────┘  │
│                         ↓                                │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Qwen2.5-32B-MoE (Brain)                        │  │
│  │  - Raciocínio estratégico                       │  │
│  │  - Planejamento multi-etapas                    │  │
│  │  - Tool calling                                 │  │
│  │  VRAM: ~13GB (fixo)                             │  │
│  └──────────────────────────────────────────────────┘  │
│                         ↓                                │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Qwen2.5-Coder-14B (Executor)                   │  │
│  │  - Geração de código                            │  │
│  │  - Execução de código                           │  │
│  │  - Debugging                                    │  │
│  │  VRAM: ~9GB (carregado sob demanda)            │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## 📊 Detecção de Tarefas

### Tarefas → Brain (Qwen32B-MoE)
- ✅ Planejamento estratégico
- ✅ Raciocínio complexo
- ✅ Tool calling
- ✅ Auto-reflexão
- ✅ Conversas

### Tarefas → Executor (Qwen14B-Coder)
- ✅ Geração de código
- ✅ Execução de código
- ✅ Debugging
- ✅ Refatoração

---

## 🚀 Uso

### Código Python

```python
from super_agent.core.smart_commander import create_smart_commander

# Criar commander inteligente
commander = create_smart_commander(
    brain_model="qwen2.5-32b-instruct-moe-rtx",
    executor_model="qwen2.5-coder:14b",
)

# Processar mensagem (rota automaticamente)
response = await commander.process_message(
    "Planeje uma tarefa complexa e depois execute o código necessário"
)

# Ver status
status = commander.get_status()
print(f"Modelo atual: {status['current_model']}")
print(f"VRAM usada: {status['vram_used_gb']:.2f}GB")
```

### Detecção Automática

```python
# Tarefa estratégica → Brain
response = await commander.process_message("Analise e planeje uma solução")

# Tarefa de código → Executor
response = await commander.process_message("Crie um script Python que soma números")

# Tarefa híbrida → Brain planeja, Executor executa
response = await commander.process_message(
    "Planeje e execute uma tarefa complexa"
)
```

---

## 🔧 Configuração

### Variáveis de Ambiente

```env
# Modelo cérebro estratégico
DEFAULT_MODEL=qwen2.5-32b-instruct-moe-rtx

# Modelo executor de código
EXECUTOR_MODEL=qwen2.5-coder:14b

# Ollama
OLLAMA_BASE_URL=http://localhost:11434
```

### Instalação de Modelos

```bash
# Instalar Brain (Qwen32B-MoE)
scripts\setup_qwen32b_moe_rtx.bat

# Instalar Executor (Qwen14B-Coder)
ollama pull qwen2.5-coder:14b
```

---

## 📈 Monitoramento

### Status do Gerenciador

```python
from super_agent.core.model_manager import get_model_manager

manager = get_model_manager()
status = manager.get_status()

print(f"Modelo atual: {status['current_model']}")
print(f"Papel: {status['current_role']}")
print(f"VRAM usada: {status['vram_used_gb']:.2f}GB / {status['vram_total_gb']:.2f}GB")
print(f"Brain carregado: {status['brain_loaded']}")
print(f"Executor carregado: {status['executor_loaded']}")
```

### Verificar VRAM

```bash
# Windows
nvidia-smi

# Linux
nvidia-smi
```

**VRAM esperada:**
- Brain carregado: ~13GB
- Executor carregado: ~9GB
- **Nunca estoura 16GB** (modo alternado)

---

## 🎯 Casos de Uso

### 1. Tarefa Estratégica
```
Usuário: "Analise e planeje uma solução para X"
→ Router detecta: PLANNING
→ Usa Brain (Qwen32B-MoE)
→ Resposta: Plano detalhado
```

### 2. Tarefa de Código
```
Usuário: "Crie um script Python que faz X"
→ Router detecta: CODE
→ Alterna para Executor (Qwen14B-Coder)
→ Resposta: Código gerado e executado
```

### 3. Tarefa Híbrida
```
Usuário: "Planeje e execute uma tarefa complexa"
→ Router detecta: PLANNING
→ Usa Brain para planejar
→ Router detecta: EXECUTION
→ Alterna para Executor para executar
→ Resposta: Tarefa planejada e executada
```

---

## 🐛 Troubleshooting

### Erro: "out of memory"
```bash
# Verificar VRAM
nvidia-smi

# Se estourar, verificar se ambos modelos estão carregados
# O gerenciador deve alternar automaticamente
```

### Modelo não alterna
```bash
# Verificar se gerenciador está ativo
python -c "from super_agent.core.model_manager import get_model_manager; print(get_model_manager().get_status())"
```

### Latência alta na troca
```bash
# Verificar se Ollama está otimizado
ollama --version

# Verificar se modelos estão instalados
ollama list
```

---

## ✅ Conclusão

**Orquestração Inteligente = Inteligência Máxima + Eficiência Máxima**

- 🧠 **Brain (Qwen32B-MoE)**: Cérebro estratégico fixo
- 🚀 **Executor (Qwen14B-Coder)**: Executor carregado sob demanda
- 💾 **VRAM Total**: ~13GB (Brain) ou ~9GB (Executor) = nunca estoura 16GB
- 🎯 **Resultado**: Sistema com inteligência tipo GPT-4-turbo + execução local eficiente

---

**Status:** ✅ Orquestração inteligente implementada e pronta para uso!

