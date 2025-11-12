# 🚀 Guia: Quantização do DeepSeek-Coder-V2:16b

## 📋 Visão Geral

Este guia mostra como usar o modelo **DeepSeek-Coder-V2:16b** oficial do Ollama e como quantizá-lo para versões ainda mais leves.

---

## 🎯 Opções Disponíveis

### 1. **Modelo Oficial do Ollama (Recomendado)**

O modelo oficial `deepseek-coder-v2:16b` já vem quantizado pelo Ollama:
- **Tamanho**: 8.9GB
- **Context Window**: 160K tokens
- **Quantização**: Automática (otimizada pelo Ollama)

**Uso:**
```bash
# Baixar modelo oficial
ollama pull deepseek-coder-v2:16b

# Usar Modelfile otimizado
ollama create deepseek-coder-v2-16b-optimized -f Modelfile.deepseek-coder-v2-16b

# Testar
ollama run deepseek-coder-v2-16b-optimized "Write a Python function to calculate fibonacci"
```

---

### 2. **Quantização Manual (Versões Mais Leves)**

Se você precisa de versões ainda mais leves, pode quantizar manualmente usando `llama.cpp`:

#### Opções de Quantização:

| Quantização | Tamanho | Qualidade | VRAM | Uso Recomendado |
|-------------|---------|-----------|------|-----------------|
| **Q4_K_M** | ~5GB | 95% | ~6GB | **Recomendado** (melhor equilíbrio) |
| **Q3_K_M** | ~4GB | 90% | ~5GB | Sistemas com memória limitada |
| **Q2_K** | ~3GB | 85% | ~4GB | Sistemas muito limitados |

---

## 🔧 Método 1: Usar Modelo Oficial (Mais Fácil)

### Passo 1: Baixar Modelo

```bash
ollama pull deepseek-coder-v2:16b
```

### Passo 2: Criar Modelfile Otimizado

```bash
# Usar Modelfile pré-configurado
ollama create deepseek-coder-v2-16b-optimized -f Modelfile.deepseek-coder-v2-16b
```

### Passo 3: Testar

```bash
ollama run deepseek-coder-v2-16b-optimized "Write a Python function to reverse a string"
```

---

## 🔧 Método 2: Quantização Manual (Versões Mais Leves)

### Pré-requisitos

1. **Ollama instalado**
2. **llama.cpp compilado**
3. **Modelo baixado do Ollama**

### Passo 1: Instalar Dependências

```bash
# Clonar llama.cpp
git clone https://github.com/ggerganov/llama.cpp.git
cd llama.cpp

# Compilar (Linux/macOS)
make

# Compilar (Windows)
cmake -B build
cmake --build build --config Release
```

### Passo 2: Localizar Modelo do Ollama

O modelo do Ollama está em:
- **Linux/macOS**: `~/.ollama/models/`
- **Windows**: `C:\Users\<user>\.ollama\models\`

```bash
# Encontrar arquivo do modelo
find ~/.ollama/models -name "*deepseek-coder-v2*16b*" -type f
```

### Passo 3: Quantizar Manualmente

```bash
# Quantizar para Q4_K_M (recomendado)
./llama.cpp/quantize \
  ~/.ollama/models/.../model.gguf \
  ./models/deepseek-coder-v2-16b-q4_k_m.gguf \
  Q4_K_M

# Quantizar para Q3_K_M (mais leve)
./llama.cpp/quantize \
  ~/.ollama/models/.../model.gguf \
  ./models/deepseek-coder-v2-16b-q3_k_m.gguf \
  Q3_K_M

# Quantizar para Q2_K (muito leve)
./llama.cpp/quantize \
  ~/.ollama/models/.../model.gguf \
  ./models/deepseek-coder-v2-16b-q2_k.gguf \
  Q2_K
```

### Passo 4: Criar Modelfile para Quantização

```bash
# Criar Modelfile para Q4_K_M
cat > Modelfile.deepseek-coder-v2-16b-q4_k_m << 'EOF'
FROM ./models/deepseek-coder-v2-16b-q4_k_m.gguf

SYSTEM """You are DeepSeek Coder V2, an expert AI assistant specialized in programming and code generation."""

TEMPLATE """<|start_header_id|>system<|end_header_id|>

{{ .System }}<|eot_id|><|start_header_id|>user<|end_header_id|>

{{ .Prompt }}<|eot_id|><|start_header_id|>assistant<|end_header_id|>

{{ .Response }}<|eot_id|>"""

PARAMETER temperature 0.2
PARAMETER top_p 0.9
PARAMETER top_k 40
PARAMETER num_ctx 16384
PARAMETER num_predict 4096
PARAMETER repeat_penalty 1.1
PARAMETER repeat_last_n 64
PARAMETER num_thread -1
PARAMETER num_batch 512
PARAMETER num_gpu -1
PARAMETER stop "<|start_header_id|>"
PARAMETER stop "<|end_header_id|>"
PARAMETER stop "<|eot_id|>"
PARAMETER stop "```"
PARAMETER penalize_newline false
EOF
```

### Passo 5: Criar Modelo no Ollama

```bash
ollama create deepseek-coder-v2-16b-q4_k_m -f Modelfile.deepseek-coder-v2-16b-q4_k_m
```

---

## 🚀 Método 3: Script Automatizado (Recomendado)

### Linux/macOS

```bash
# Tornar script executável
chmod +x scripts/quantize_deepseek_coder_v2.sh

# Executar
./scripts/quantize_deepseek_coder_v2.sh
```

### Windows

```powershell
# Executar script Python
python scripts/quantize_deepseek_coder_v2.py
```

O script irá:
1. ✅ Verificar se Ollama está instalado
2. ✅ Baixar modelo se necessário
3. ✅ Localizar arquivo do modelo
4. ✅ Compilar llama.cpp se necessário
5. ✅ Quantizar para Q4_K_M, Q3_K_M e Q2_K
6. ✅ Criar Modelfiles para cada quantização

---

## 📊 Comparação de Quantizações

| Métrica | Original (Ollama) | Q4_K_M | Q3_K_M | Q2_K |
|---------|-------------------|--------|--------|------|
| **Tamanho** | 8.9GB | ~5GB | ~4GB | ~3GB |
| **VRAM** | ~10GB | ~6GB | ~5GB | ~4GB |
| **Qualidade** | 100% | 95% | 90% | 85% |
| **Velocidade** | 100% | 110% | 120% | 130% |
| **Context** | 160K | 16384 | 16384 | 16384 |

**Recomendação**: Use **Q4_K_M** para o melhor equilíbrio entre qualidade e tamanho.

---

## 🔧 Configuração no Projeto ANIMA

### 1. Atualizar `.env`

```bash
# Usar modelo oficial otimizado
DEFAULT_MODEL=deepseek-coder-v2-16b-optimized

# Ou usar quantização manual
# DEFAULT_MODEL=deepseek-coder-v2-16b-q4_k_m
```

### 2. Atualizar `ollama.ts`

O sistema já está configurado para priorizar modelos não quantizados e fazer fallback automático.

### 3. Testar

```bash
# Testar modelo oficial
ollama run deepseek-coder-v2-16b-optimized "Write a Python function"

# Testar quantização
ollama run deepseek-coder-v2-16b-q4_k_m "Write a Python function"
```

---

## 🐛 Troubleshooting

### Erro: "Model not found"

```bash
# Verificar modelos instalados
ollama list

# Baixar modelo
ollama pull deepseek-coder-v2:16b
```

### Erro: "llama.cpp not found"

```bash
# Clonar e compilar llama.cpp
git clone https://github.com/ggerganov/llama.cpp.git
cd llama.cpp
make  # Linux/macOS
# ou
cmake -B build && cmake --build build --config Release  # Windows
```

### Erro: "Out of memory"

```bash
# Usar quantização mais leve (Q3_K_M ou Q2_K)
# Ou reduzir num_ctx no Modelfile
PARAMETER num_ctx 8192  # Reduzir de 16384 para 8192
```

### Erro: "Quantization failed"

```bash
# Verificar se modelo está no formato GGUF
# Verificar se llama.cpp está compilado corretamente
# Tentar quantização mais simples (Q4_K_M primeiro)
```

---

## 📚 Referências

- [Ollama DeepSeek-Coder-V2](https://ollama.com/library/deepseek-coder-v2)
- [llama.cpp GitHub](https://github.com/ggerganov/llama.cpp)
- [GGUF Quantization](https://github.com/ggerganov/llama.cpp/blob/master/docs/QUANTIZATION.md)
- [DeepSeek-Coder-V2 Hugging Face](https://huggingface.co/deepseek-ai/DeepSeek-Coder-V2-Lite-Instruct)

---

## ✅ Checklist

- [ ] Ollama instalado
- [ ] Modelo `deepseek-coder-v2:16b` baixado
- [ ] Modelfile criado e otimizado
- [ ] Modelo testado com sucesso
- [ ] (Opcional) Quantização manual executada
- [ ] (Opcional) Quantizações testadas
- [ ] Configuração no projeto ANIMA atualizada

---

**Última Atualização**: Janeiro 2025
**Versão**: 1.0
**Status**: Ready for Implementation 🚀

