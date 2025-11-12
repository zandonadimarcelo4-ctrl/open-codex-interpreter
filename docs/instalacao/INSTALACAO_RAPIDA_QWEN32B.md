# ⚡ Instalação Rápida: Qwen2.5-32B-MoE (Cérebro Estratégico)

## 🎯 Objetivo

Instalar e configurar o **Qwen2.5-32B-Instruct-MoE (Q4_K_M)** como cérebro estratégico do sistema.

**Por quê?**
- ✅ **Mais inteligente** que todos os outros modelos que cabem em 16GB
- ✅ **Raciocínio tipo GPT-4-turbo** (offline)
- ✅ **Suporta function calling** nativo
- ✅ **Cabe perfeitamente** em 16GB VRAM (RTX 4080 Super)
- ✅ **Arquitetura MoE**: apenas 2-4 especialistas ativam por token (economia de VRAM)

---

## 🚀 Instalação (5 minutos)

### Windows
```bash
# Executar script automático
scripts\setup_qwen32b_moe_rtx.bat
```

### Linux/macOS
```bash
# Instalar modelo base
ollama pull qwen2.5:32b

# Criar modelo customizado
ollama create qwen2.5-32b-instruct-moe-rtx -f Modelfile.qwen2.5-32b-instruct-moe-rtx
```

---

## 🔧 Configuração

### 1. Atualizar `.env`
```env
# Modelo cérebro estratégico
DEFAULT_MODEL=qwen2.5-32b-instruct-moe-rtx

# Modelo executor (opcional, para código rápido)
EXECUTOR_MODEL=deepseek-coder-v2-lite:instruct
```

### 2. Reiniciar o servidor
```bash
# Parar o servidor atual (Ctrl+C)
# Reiniciar o servidor
npm run dev
```

---

## ✅ Verificação

### Verificar se está instalado
```bash
ollama list | grep qwen2.5-32b
```

### Testar o modelo
```bash
ollama run qwen2.5-32b-instruct-moe-rtx "Hello, como você está? Pode me ajudar a planejar uma tarefa complexa?"
```

### Verificar uso de VRAM
```bash
# Windows
nvidia-smi

# Linux
nvidia-smi
```

**VRAM esperada:** ~12-14GB (deixa ~2-4GB livres)

---

## 📊 Comparação de Modelos

| Modelo | Inteligência | VRAM | Tool Calling | Velocidade | Recomendado para |
|--------|--------------|------|--------------|------------|------------------|
| **qwen2.5-32b-instruct-moe-rtx** | **🧠 148** | **~13GB** | **✅ Nativo** | **⚙️ Média** | **Cérebro estratégico** |
| qwen2.5:14b | 🧠 141 | ~9GB | ✅ Nativo | 🚀 Rápida | Alternativa |
| qwen2.5:7b | 🧠 138 | ~4GB | ✅ Nativo | 🚀 Muito rápida | Testes rápidos |
| llama3.2:3b | 🧠 135 | ~2GB | ✅ Nativo | 🚀 Muito rápida | Desenvolvimento |

---

## 🐛 Troubleshooting

### Erro: "model not found"
```bash
# Instalar modelo base primeiro
ollama pull qwen2.5:32b

# Criar modelo customizado
ollama create qwen2.5-32b-instruct-moe-rtx -f Modelfile.qwen2.5-32b-instruct-moe-rtx
```

### Erro: "out of memory"
```bash
# Verificar VRAM disponível
nvidia-smi

# Se não tiver 16GB, usar modelo menor
DEFAULT_MODEL=qwen2.5:14b
```

### Erro: "still does not support tools"
```bash
# Verificar versão do Ollama
ollama --version

# Atualizar Ollama (precisa ser >= 0.1.0)
# Windows: Baixar de https://ollama.ai
# Linux: sudo apt update && sudo apt upgrade ollama
```

### Modelo muito lento
```bash
# Reduzir contexto (mais rápido, menos inteligente)
# Editar Modelfile.qwen2.5-32b-instruct-moe-rtx
PARAMETER num_ctx 4096  # Reduzir de 8192 para 4096

# Recriar modelo
ollama create qwen2.5-32b-instruct-moe-rtx -f Modelfile.qwen2.5-32b-instruct-moe-rtx
```

---

## 🎯 Arquitetura Híbrida (Recomendada)

### Cérebro Estratégico: Qwen32B-MoE
- **Uso:** Raciocínio, planejamento, tool-calling, auto-reflexão
- **VRAM:** ~12-14GB
- **Velocidade:** Média (compensa com inteligência)

### Executor Rápido: DeepSeek-Lite
- **Uso:** Geração de código, execução, debugging
- **VRAM:** ~8.5GB (carregado sob demanda)
- **Velocidade:** Rápida

**Resultado:** Sistema com inteligência tipo GPT-4-turbo + execução local eficiente.

---

## 📝 Notas

- **MoE (Mixture of Experts):** Apenas 2-4 especialistas ativam por token
- **Economia de VRAM:** Consumo efetivo ~12-14GB (não 32GB)
- **Performance:** Similar a GPT-4-turbo em raciocínio e código
- **Tool calling:** Suporte nativo via JSON/function-calling
- **Velocidade:** Média (devido ao tamanho, mas compensa com inteligência)

---

**Pronto! Agora você tem o modelo mais inteligente possível rodando na sua RTX 4080 Super!** 🎉

