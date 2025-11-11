# 🚀 Instalação Rápida: DeepSeek-Coder-V2:16b Q4_K_M para RTX NVIDIA

## 📋 Visão Geral

Guia rápido para instalar e configurar o modelo **DeepSeek-Coder-V2:16b** otimizado para **GPU NVIDIA RTX** com quantização **Q4_K_M**.

---

## ⚡ Instalação Rápida (Recomendado)

### Windows

```bash
# Executar script de instalação
scripts\setup_deepseek_coder_v2_16b_q4_k_m_rtx.bat
```

### Linux/macOS

```bash
# Tornar script executável
chmod +x scripts/setup_deepseek_coder_v2_16b_q4_k_m_rtx.sh

# Executar script
./scripts/setup_deepseek_coder_v2_16b_q4_k_m_rtx.sh
```

### Python (Multiplataforma)

```bash
# Executar script Python
python scripts/setup_deepseek_coder_v2_16b_q4_k_m_rtx.py
```

---

## 📝 Instalação Manual

### Passo 1: Baixar Modelo

```bash
ollama pull deepseek-coder-v2:16b
```

### Passo 2: Criar Modelo Otimizado

```bash
# Usar Modelfile otimizado para RTX
ollama create deepseek-coder-v2-16b-q4_k_m-rtx -f Modelfile.deepseek-coder-v2-16b-q4_k_m-rtx
```

### Passo 3: Testar Modelo

```bash
ollama run deepseek-coder-v2-16b-q4_k_m-rtx "Write a Python function to calculate fibonacci numbers"
```

---

## 🔧 Configuração no Projeto ANIMA

### 1. Atualizar `.env`

```bash
# Adicionar ao arquivo .env
DEFAULT_MODEL=deepseek-coder-v2-16b-q4_k_m-rtx
OLLAMA_BASE_URL=http://localhost:11434
```

### 2. Verificar GPU NVIDIA

```bash
# Verificar se GPU está sendo usada
nvidia-smi

# Durante execução do modelo, você deve ver uso de GPU
```

### 3. Reiniciar Servidor

```bash
# Reiniciar servidor para aplicar configurações
npm run dev
# ou
python main.py
```

---

## 📊 Especificações do Modelo

| Especificação | Valor |
|---------------|-------|
| **Modelo** | DeepSeek-Coder-V2:16b |
| **Quantização** | Q4_K_M (otimizado) |
| **Tamanho** | ~8.9GB |
| **Context Window** | 32,768 tokens (otimizado para GPU) |
| **GPU Layers** | 99 (todas na GPU) |
| **Batch Size** | 1024 (otimizado para RTX) |
| **Flash Attention** | Habilitado |
| **VRAM Requerida** | ~6-8GB (dependendo da RTX) |

---

## 🎯 Otimizações para RTX NVIDIA

### Configurações Aplicadas

1. **GPU Layers: 99** - Todas as camadas na GPU
2. **Batch Size: 1024** - Processamento em lote maior (RTX suporta)
3. **Flash Attention: true** - Atenção flash para acelerar
4. **Context Window: 32,768** - Aproveita melhor a GPU
5. **Num Threads: 8** - CPU apenas para tarefas leves

### Verificar Uso de GPU

```bash
# Monitorar uso de GPU em tempo real
watch -n 1 nvidia-smi

# Ou no Windows
nvidia-smi -l 1
```

---

## 🐛 Troubleshooting

### Erro: "CUDA out of memory"

```bash
# Reduzir batch size no Modelfile
PARAMETER num_batch 512  # Reduzir de 1024 para 512

# Ou reduzir context window
PARAMETER num_ctx 16384  # Reduzir de 32768 para 16384
```

### Erro: "Model not found"

```bash
# Verificar se modelo está instalado
ollama list

# Reinstalar modelo
ollama pull deepseek-coder-v2:16b
ollama create deepseek-coder-v2-16b-q4_k_m-rtx -f Modelfile.deepseek-coder-v2-16b-q4_k_m-rtx
```

### GPU não está sendo usada

```bash
# Verificar se Ollama detecta GPU
ollama ps

# Verificar drivers NVIDIA
nvidia-smi

# Reiniciar Ollama
# Windows: Reiniciar serviço Ollama
# Linux: sudo systemctl restart ollama
```

### Performance lenta

```bash
# Verificar se Flash Attention está habilitado
# Verificar uso de GPU (deve estar >80%)
nvidia-smi

# Verificar se batch size está adequado
# RTX 3060-3070: 512
# RTX 3080-3090: 1024
# RTX 4080-4090: 2048
```

---

## 📚 Referências

- [Ollama DeepSeek-Coder-V2](https://ollama.com/library/deepseek-coder-v2)
- [DeepSeek-Coder-V2 Hugging Face](https://huggingface.co/deepseek-ai/DeepSeek-Coder-V2-Lite-Instruct)
- [Ollama Modelfile Documentation](https://github.com/ollama/ollama/blob/main/docs/modelfile.md)

---

## ✅ Checklist

- [ ] Ollama instalado
- [ ] GPU NVIDIA RTX detectada
- [ ] Modelo `deepseek-coder-v2:16b` baixado
- [ ] Modelo otimizado `deepseek-coder-v2-16b-q4_k_m-rtx` criado
- [ ] Modelo testado com sucesso
- [ ] GPU sendo usada (verificar com `nvidia-smi`)
- [ ] Configuração no `.env` atualizada
- [ ] Servidor reiniciado

---

## 🎉 Pronto!

Agora o modelo está configurado e otimizado para usar sua GPU NVIDIA RTX!

Para usar no projeto ANIMA, o sistema irá automaticamente:
1. Detectar o modelo `deepseek-coder-v2-16b-q4_k_m-rtx`
2. Usar GPU NVIDIA se disponível
3. Fazer fallback para CPU se necessário
4. Otimizar performance para código

---

**Última Atualização**: Janeiro 2025
**Versão**: 1.0
**Status**: Ready for RTX NVIDIA 🚀

