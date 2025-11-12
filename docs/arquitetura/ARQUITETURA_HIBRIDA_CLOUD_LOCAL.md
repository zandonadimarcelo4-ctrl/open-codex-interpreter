# 🧠 Arquitetura Híbrida: Ollama Cloud + Local com Fallback Automático

## 🎯 Visão Geral

> **"Ollama Cloud como cérebro principal, modelos locais como fallback"**

Arquitetura híbrida que combina:
- **Ollama Cloud** (cérebro principal) - raciocínio profundo, planejamento complexo
- **Modelos locais** (fallback) - continuidade, offline, execução rápida
- **Fallback automático** - se Cloud falhar, usa Local automaticamente

---

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────────┐
│           HybridCommander (Orquestrador)                │
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │  IntelligentRouter                              │  │
│  │  - Detecta tipo de tarefa                       │  │
│  │  - Roteia para modelo apropriado                │  │
│  └──────────────────────────────────────────────────┘  │
│                         ↓                                │
│  ┌──────────────────────────────────────────────────┐  │
│  │  HybridModelManager                             │  │
│  │  - Gerencia Cloud e Local                       │  │
│  │  - Fallback automático                          │  │
│  │  - Verificação de disponibilidade               │  │
│  └──────────────────────────────────────────────────┘  │
│                         ↓                                │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Ollama Cloud (Cérebro Principal)               │  │
│  │  - qwen3-coder:480b-cloud                       │  │
│  │  - deepseek-v3.1:671b-cloud                     │  │
│  │  - Raciocínio profundo, planejamento complexo   │  │
│  │  - Contexto: 128K+ tokens                       │  │
│  └──────────────────────────────────────────────────┘  │
│                         ↓                                │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Ollama Local (Fallback)                        │  │
│  │  - Qwen2.5-32B-MoE (Brain)                     │  │
│  │  - DeepSeek-Coder-V2-Lite (Executor)           │  │
│  │  - UIGEN-T1-Qwen-14 (UI)                       │  │
│  │  - Continuidade, offline, execução rápida      │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## 🔄 Fluxo de Fallback Automático

### **1. Tentativa Inicial (Cloud)**
```
Usuário: "Planeje uma tarefa complexa"
→ HybridCommander: Tenta Ollama Cloud
→ Cloud disponível? ✅
→ Resposta: Plano detalhado (Cloud)
```

### **2. Fallback Automático (Local)**
```
Usuário: "Planeje uma tarefa complexa"
→ HybridCommander: Tenta Ollama Cloud
→ Cloud não disponível? ❌ (timeout, erro, quota)
→ Fallback automático: Usa Ollama Local
→ Resposta: Plano detalhado (Local)
```

### **3. Fallback por Tipo de Tarefa**
```
Usuário: "Execute código Python"
→ HybridCommander: Detecta tipo de tarefa (execution)
→ Roteia para Executor Local (mais rápido)
→ Resposta: Código executado (Local)
```

---

## ⚙️ Configuração

### **Variáveis de Ambiente**

```env
# Ollama Cloud (Cérebro Principal)
OLLAMA_CLOUD_ENABLED=true
OLLAMA_CLOUD_MODEL=qwen3-coder:480b-cloud
OLLAMA_CLOUD_API_KEY=
OLLAMA_CLOUD_BASE_URL=https://api.ollama.cloud/v1

# Ollama Local (Fallback)
OLLAMA_BASE_URL=http://localhost:11434
DEFAULT_MODEL=qwen2.5-32b-instruct-moe-rtx
EXECUTOR_MODEL=networkjohnny/deepseek-coder-v2-lite-base-q4_k_m-gguf
EXECUTOR_UI_MODEL=MHKetbi/UIGEN-T1-Qwen-14:q4_K_S

# Fallback Automático
FALLBACK_ENABLED=true
```

### **Modelos Cloud Disponíveis**

1. **qwen3-coder:480b-cloud**
   - Especializado em código e agentes
   - Tool-calling nativo
   - Velocidade: ~15-25 t/s
   - Ideal para: Automação técnica, execução de ferramentas

2. **deepseek-v3.1:671b-cloud**
   - Raciocínio analítico profundo
   - Planejamento avançado
   - Velocidade: ~8-12 t/s
   - Ideal para: Planejamento complexo, análise profunda

---

## 🚀 Uso

### **Código Python**

```python
from super_agent.core.hybrid_commander import create_hybrid_commander

# Criar commander híbrido
commander = create_hybrid_commander(
    cloud_model="qwen3-coder:480b-cloud",
    cloud_api_key="",  # Opcional para free tier
    cloud_enabled=True,
    fallback_enabled=True,
)

# Processar mensagem (fallback automático)
response = await commander.process_message(
    "Planeje uma tarefa complexa e depois execute o código necessário"
)

# Ver status
status = commander.get_status()
print(f"Cloud disponível: {status['cloud_available']}")
print(f"Local disponível: {status['local_available']}")
print(f"Fallback habilitado: {status['fallback_enabled']}")
```

### **Fallback Automático**

```python
# Tentativa 1: Cloud
try:
    response = await commander.process_message("Tarefa complexa")
except Exception as e:
    # Fallback automático para Local
    logger.warning(f"Cloud falhou: {e}")
    # Sistema automaticamente usa Local
```

---

## 📊 Comparação: Cloud vs Local

| Aspecto | Ollama Cloud | Ollama Local |
|---------|--------------|--------------|
| **Raciocínio** | 🧠 Profundo (480B-671B) | ⚙️ Razoável (32B) |
| **Velocidade** | ⚠️ Mais lento (~10-25 t/s) | ⚡ Rápido (~50-100 t/s) |
| **Contexto** | ✅ Enorme (128K+ tokens) | ⚙️ Médio (32K tokens) |
| **Offline** | ❌ Requer internet | ✅ Totalmente offline |
| **Custo** | ⚠️ Limitado (quota) | 💰 Zero |
| **Privacidade** | ⚠️ Dados na Cloud | ✅ Dados locais |
| **Disponibilidade** | ⚠️ Dependente de serviço | ✅ Sempre disponível |

---

## 🎯 Quando Usar Cloud vs Local

### **Cloud (Ollama Cloud)**
- ✅ Planejamento complexo multi-etapas
- ✅ Raciocínio profundo e análise
- ✅ Contexto muito longo (128K+ tokens)
- ✅ Tarefas que requerem máxima inteligência

### **Local (Ollama Local)**
- ✅ Execução de código rápida
- ✅ Tarefas simples e diretas
- ✅ Modo offline
- ✅ Privacidade máxima
- ✅ Fallback quando Cloud não disponível

---

## 🔧 Benefícios da Arquitetura Híbrida

### **1. Inteligência Máxima**
- 🧠 **Ollama Cloud** fornece raciocínio profundo (480B-671B)
- ⚙️ **Modelos locais** fornecem continuidade e execução rápida

### **2. Continuidade Garantida**
- ✅ **Fallback automático** - se Cloud falhar, usa Local
- ✅ **Modo offline** - funciona sem internet
- ✅ **Nunca trava** - sempre tem fallback

### **3. Custo Otimizado**
- 💰 **Cloud apenas para tarefas complexas** - economiza quota
- 💰 **Local para tarefas simples** - zero custo
- 💰 **Fallback inteligente** - usa Local quando possível

### **4. Privacidade**
- 🔐 **Dados sensíveis** - usa Local (offline)
- 🔐 **Dados não sensíveis** - usa Cloud (raciocínio profundo)
- 🔐 **Controle total** - você decide quando usar Cloud

---

## 📥 Configuração da Ollama Cloud

### **1. Criar Conta Ollama Cloud**
1. Acesse [https://ollama.com/cloud](https://ollama.com/cloud)
2. Crie uma conta (Free, Pro, ou Max)
3. Obtenha API key (se necessário)

### **2. Configurar API Key**
```env
OLLAMA_CLOUD_API_KEY=your_api_key_here
```

### **3. Habilitar Cloud**
```env
OLLAMA_CLOUD_ENABLED=true
OLLAMA_CLOUD_MODEL=qwen3-coder:480b-cloud
```

### **4. Testar Conexão**
```python
from super_agent.core.hybrid_model_manager import get_hybrid_model_manager

manager = get_hybrid_model_manager()
status = manager.get_status()

print(f"Cloud disponível: {status['cloud_available']}")
print(f"Local disponível: {status['local_available']}")
```

---

## 🎯 Exemplos de Uso

### **Exemplo 1: Planejamento Complexo (Cloud)**
```python
# Tarefa: Planejar fluxo de edição de vídeo
response = await commander.process_message(
    "Planeje um fluxo completo de edição de vídeo no After Effects"
)
# → Usa Cloud (raciocínio profundo)
# → Resposta: Plano detalhado multi-etapas
```

### **Exemplo 2: Execução de Código (Local)**
```python
# Tarefa: Executar código Python
response = await commander.process_message(
    "Execute um código Python que soma números"
)
# → Usa Local (execução rápida)
# → Resposta: Código executado
```

### **Exemplo 3: Fallback Automático**
```python
# Tarefa: Tarefa complexa (Cloud falha)
response = await commander.process_message(
    "Planeje uma tarefa complexa"
)
# → Tenta Cloud (falha)
# → Fallback automático: Usa Local
# → Resposta: Plano detalhado (Local)
```

---

## 🐛 Troubleshooting

### **Erro: "Cloud não disponível"**
```bash
# Verificar conexão com Ollama Cloud
curl https://api.ollama.cloud/v1/models

# Verificar API key
echo $OLLAMA_CLOUD_API_KEY

# Verificar configuração
python -c "from super_agent.core.hybrid_model_manager import get_hybrid_model_manager; print(get_hybrid_model_manager().get_status())"
```

### **Erro: "Fallback não funciona"**
```bash
# Verificar se Local está disponível
curl http://localhost:11434/api/tags

# Verificar se fallback está habilitado
echo $FALLBACK_ENABLED

# Verificar logs
python -c "import logging; logging.basicConfig(level=logging.DEBUG)"
```

### **Erro: "Timeout"**
```env
# Aumentar timeout
OLLAMA_CLOUD_TIMEOUT=60
OLLAMA_LOCAL_TIMEOUT=120
```

---

## ✅ Conclusão

**Arquitetura híbrida = Inteligência máxima + Continuidade garantida**

- 🧠 **Ollama Cloud**: Cérebro principal (raciocínio profundo)
- ⚙️ **Ollama Local**: Fallback (continuidade, offline)
- 🔄 **Fallback automático**: Nunca trava, sempre funciona
- 💰 **Custo otimizado**: Cloud apenas para tarefas complexas
- 🔐 **Privacidade**: Controle total sobre dados

---

**Status**: ✅ Arquitetura híbrida implementada e pronta para uso!

