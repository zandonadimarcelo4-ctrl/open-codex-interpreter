# 🧠 Guia Completo: Ollama Cloud + Local com Fallback

## 📊 Visão Geral

> **"Ollama Cloud como cérebro principal, modelos locais como fallback"**

Arquitetura híbrida que combina:
- **Ollama Cloud** (cérebro principal) - modelos enormes (480B-671B), raciocínio profundo
- **Modelos locais** (fallback) - continuidade, offline, execução rápida
- **Fallback automático** - se Cloud falhar, usa Local automaticamente

---

## 🌐 Ollama Cloud: O que é?

### **Características**
- ✅ **Modelos enormes** (480B-671B) que não cabem em GPUs pessoais
- ✅ **Hardware datacenter** - execução rápida em hardware profissional
- ✅ **Mesma API do Ollama** - compatível com Ollama local
- ✅ **Privacidade** - Ollama não retém ou registra suas consultas
- ✅ **Economia de bateria** - não usa GPU local

### **Modelos Disponíveis**
1. **qwen3-coder:480b-cloud** ⭐ **RECOMENDADO**
   - Especializado em código e agentes
   - Tool-calling nativo
   - Ideal para: Automação técnica, execução de ferramentas

2. **deepseek-v3.1:671b-cloud**
   - Raciocínio analítico profundo
   - Planejamento avançado
   - Ideal para: Planejamento complexo, análise profunda

3. **gpt-oss:120b-cloud**
   - Modelo geral de alta qualidade
   - Boa para: Tarefas gerais, raciocínio

4. **kimi-k2:1t-cloud**
   - Modelo enorme (1T parâmetros)
   - Ideal para: Tarefas extremamente complexas

5. **glm-4.6:cloud**
   - Modelo geral
   - Boa para: Tarefas gerais

6. **minimax-m2:cloud**
   - Modelo geral
   - Boa para: Tarefas gerais

---

## 💰 Planos Ollama Cloud

| Plano | Preço | Uso | Ideal para |
|-------|-------|-----|------------|
| **Free** | $0 | Limitado | Testes, desenvolvimento |
| **Pro** | $20/mês | Mais uso | Uso moderado |
| **Max** | $100/mês | 5x mais que Pro | Uso intensivo |

**Limites:**
- Free: Limitado (horas/dia)
- Pro: Mais uso
- Max: 5x mais uso que Pro

**Próximos:** Pricing baseado em uso (metered) em breve

---

## 🔧 Configuração

### **1. Criar Conta Ollama Cloud**
1. Acesse [https://ollama.com/cloud](https://ollama.com/cloud)
2. Crie uma conta (Free, Pro, ou Max)
3. Faça login: `ollama signin`

### **2. Configurar API Key (Opcional)**
```bash
# Gerar API key em https://ollama.com
export OLLAMA_API_KEY=your_api_key_here
```

### **3. Configurar Variáveis de Ambiente**
```env
# Ollama Cloud
OLLAMA_CLOUD_ENABLED=true
OLLAMA_CLOUD_MODEL=qwen3-coder:480b-cloud
OLLAMA_API_KEY=your_api_key_here
OLLAMA_CLOUD_BASE_URL=https://ollama.com

# Fallback automático
FALLBACK_ENABLED=true
```

### **4. Testar Conexão**
```bash
# Via CLI
ollama run qwen3-coder:480b-cloud "Hello, world!"

# Via API
curl https://ollama.com/api/tags \
  -H "Authorization: Bearer $OLLAMA_API_KEY"
```

---

## 🚀 Uso

### **Via CLI**
```bash
# Fazer login
ollama signin

# Executar modelo Cloud
ollama run qwen3-coder:480b-cloud "Planeje uma tarefa complexa"
```

### **Via API (Python)**
```python
import os
from ollama import Client

client = Client(
    host="https://ollama.com",
    headers={'Authorization': 'Bearer ' + os.environ.get('OLLAMA_API_KEY')}
)

messages = [
    {'role': 'user', 'content': 'Planeje uma tarefa complexa'},
]

for part in client.chat('qwen3-coder:480b-cloud', messages=messages, stream=True):
    print(part['message']['content'], end='', flush=True)
```

### **Via AutoGen (HybridCommander)**
```python
from super_agent.core.hybrid_commander import create_hybrid_commander

# Criar commander híbrido
commander = create_hybrid_commander(
    cloud_model="qwen3-coder:480b-cloud",
    cloud_api_key=os.getenv("OLLAMA_API_KEY"),
    cloud_enabled=True,
    fallback_enabled=True,
)

# Processar mensagem (fallback automático)
response = await commander.process_message(
    "Planeje uma tarefa complexa e depois execute o código necessário"
)
```

---

## 🔄 Fallback Automático

### **Como Funciona**

1. **Tentativa Inicial (Cloud)**
   ```
   Usuário: "Planeje uma tarefa complexa"
   → HybridCommander: Tenta Ollama Cloud
   → Cloud disponível? ✅
   → Resposta: Plano detalhado (Cloud)
   ```

2. **Fallback Automático (Local)**
   ```
   Usuário: "Planeje uma tarefa complexa"
   → HybridCommander: Tenta Ollama Cloud
   → Cloud não disponível? ❌ (timeout, erro, quota)
   → Fallback automático: Usa Ollama Local
   → Resposta: Plano detalhado (Local)
   ```

3. **Fallback por Tipo de Tarefa**
   ```
   Usuário: "Execute código Python"
   → HybridCommander: Detecta tipo de tarefa (execution)
   → Roteia para Executor Local (mais rápido)
   → Resposta: Código executado (Local)
   ```

---

## 📊 Comparação: Cloud vs Local

| Aspecto | Ollama Cloud | Ollama Local |
|---------|--------------|--------------|
| **Modelos** | 480B-671B (enormes) | 32B (médio) |
| **Raciocínio** | 🧠 Profundo | ⚙️ Razoável |
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
- ✅ Quando GPU local não é suficiente

### **Local (Ollama Local)**
- ✅ Execução de código rápida
- ✅ Tarefas simples e diretas
- ✅ Modo offline
- ✅ Privacidade máxima
- ✅ Fallback quando Cloud não disponível
- ✅ Quando quota Cloud está esgotada

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

## 🐛 Troubleshooting

### **Erro: "Cloud não disponível"**
```bash
# Verificar login
ollama signin

# Verificar conexão
curl https://ollama.com/api/tags \
  -H "Authorization: Bearer $OLLAMA_API_KEY"

# Verificar API key
echo $OLLAMA_API_KEY
```

### **Erro: "API key inválida"**
```bash
# Gerar nova API key em https://ollama.com
export OLLAMA_API_KEY=your_new_api_key

# Atualizar .env
echo "OLLAMA_API_KEY=your_new_api_key" >> .env
```

### **Erro: "Quota esgotada"**
```bash
# Verificar plano Ollama Cloud
# Free: Limitado (horas/dia)
# Pro: Mais uso ($20/mês)
# Max: 5x mais uso ($100/mês)

# Fallback automático usa Local quando quota esgotada
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

- 🧠 **Ollama Cloud**: Cérebro principal (raciocínio profundo, 480B-671B)
- ⚙️ **Ollama Local**: Fallback (continuidade, offline, execução rápida)
- 🔄 **Fallback automático**: Nunca trava, sempre funciona
- 💰 **Custo otimizado**: Cloud apenas para tarefas complexas
- 🔐 **Privacidade**: Controle total sobre dados

---

## 📚 Referências

- [Ollama Cloud Documentation](https://docs.ollama.com/cloud)
- [Ollama Cloud Website](https://ollama.com/cloud)
- [ARQUITETURA_HIBRIDA_CLOUD_LOCAL.md](./ARQUITETURA_HIBRIDA_CLOUD_LOCAL.md)
- [THINKING_VS_INTELIGENCIA.md](./THINKING_VS_INTELIGENCIA.md)

---

**Status**: ✅ Guia completo, configuração pronta, pronto para uso!

