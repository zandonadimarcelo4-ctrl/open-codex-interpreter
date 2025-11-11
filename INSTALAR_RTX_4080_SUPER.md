# 🚀 Configuração para RTX 4080 Super (16GB VRAM)

## 📋 Visão Geral

Guia específico para configurar o **DeepSeek-Coder-V2:16b Q4_K_M** otimizado para **RTX 4080 Super com 16GB de VRAM**.

---

## ⚡ Instalação Rápida

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

## 🎯 Otimizações Específicas para RTX 4080 Super (16GB)

### Configurações Aplicadas

| Parâmetro | Valor | Motivo |
|-----------|-------|--------|
| **Context Window** | 65,536 tokens | RTX 4080 Super 16GB suporta contexto muito grande |
| **Max Tokens** | 16,384 tokens | Respostas completas e detalhadas |
| **Batch Size** | 2,048 | Aproveita toda a VRAM disponível |
| **GPU Layers** | 99 (todas) | Todas as camadas na GPU para máxima performance |
| **Threads** | 16 | CPU auxilia enquanto GPU processa |
| **Repeat Last N** | 128 | Mais contexto para melhor qualidade |

### Performance Esperada

- **Inferência**: ~50-100 tokens/segundo (dependendo do contexto)
- **Uso de VRAM**: ~10-12GB (de 16GB disponíveis)
- **Uso de GPU**: 90-100% durante inferência
- **Temperatura**: 60-75°C (dependendo do cooler)

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

# Durante execução do modelo, você deve ver:
# - Uso de VRAM: ~10-12GB
# - Uso de GPU: 90-100%
# - Temperatura: 60-75°C
```

### 3. Reiniciar Servidor

```bash
# Reiniciar servidor para aplicar configurações
npm run dev
# ou
python main.py
```

---

## 📊 Especificações do Modelo para RTX 4080 Super

| Especificação | Valor |
|---------------|-------|
| **Modelo** | DeepSeek-Coder-V2:16b |
| **Quantização** | Q4_K_M (otimizado) |
| **Tamanho** | ~8.9GB |
| **Context Window** | 65,536 tokens |
| **Max Tokens** | 16,384 tokens |
| **GPU Layers** | 99 (todas na GPU) |
| **Batch Size** | 2,048 |
| **Threads** | 16 |
| **VRAM Usada** | ~10-12GB |
| **VRAM Disponível** | 16GB |
| **Flash Attention** | Habilitado |

---

## 🚀 Performance e Benchmarks

### Teste de Velocidade

```bash
# Testar velocidade de inferência
ollama run deepseek-coder-v2-16b-q4_k_m-rtx "Write a Python function to calculate fibonacci numbers" --verbose
```

### Resultados Esperados (RTX 4080 Super)

- **Primeira resposta**: 2-3 segundos (carregamento do modelo)
- **Respostas subsequentes**: 1-2 segundos
- **Tokens por segundo**: 50-100 tokens/s
- **Latência**: <100ms por token

---

## 🐛 Troubleshooting

### Erro: "CUDA out of memory"

```bash
# RTX 4080 Super 16GB não deve ter esse problema
# Se ocorrer, reduzir batch size no Modelfile:
PARAMETER num_batch 1536  # Reduzir de 2048 para 1536
```

### GPU não está sendo usada

```bash
# Verificar se Ollama detecta GPU
ollama ps

# Verificar drivers NVIDIA
nvidia-smi

# Verificar se CUDA está instalado
nvcc --version

# Reiniciar Ollama
# Windows: Reiniciar serviço Ollama
# Linux: sudo systemctl restart ollama
```

### Performance lenta

```bash
# Verificar uso de GPU (deve estar >90%)
nvidia-smi

# Verificar se Flash Attention está habilitado
# Verificar temperatura da GPU (deve estar <80°C)
# Verificar se não há throttling (verificar clocks)
```

### VRAM não está sendo usada completamente

```bash
# Isso é normal! O modelo Q4_K_M usa ~10-12GB
# Você pode aumentar o context window ou batch size se quiser usar mais VRAM
# Mas não é necessário para boa performance
```

---

## 💡 Dicas de Otimização

### 1. Aumentar Context Window (se necessário)

```bash
# No Modelfile, aumentar para 131072 (máximo)
PARAMETER num_ctx 131072
```

### 2. Aumentar Batch Size (se necessário)

```bash
# No Modelfile, aumentar para 4096 (máximo)
PARAMETER num_batch 4096
```

### 3. Usar Múltiplos Modelos

```bash
# RTX 4080 Super 16GB pode rodar múltiplos modelos simultaneamente
# Cada modelo usa ~10-12GB, então pode rodar 1 modelo por vez
# Mas pode carregar/descarregar modelos rapidamente
```

### 4. Monitorar Performance

```bash
# Monitorar uso de GPU em tempo real
watch -n 1 nvidia-smi

# Ou no Windows
nvidia-smi -l 1
```

---

## 📚 Referências

- [Ollama DeepSeek-Coder-V2](https://ollama.com/library/deepseek-coder-v2)
- [NVIDIA RTX 4080 Super Specifications](https://www.nvidia.com/en-us/geforce/graphics-cards/40-series/rtx-4080-super/)
- [Ollama Modelfile Documentation](https://github.com/ollama/ollama/blob/main/docs/modelfile.md)

---

## ✅ Checklist

- [ ] Ollama instalado
- [ ] GPU NVIDIA RTX 4080 Super detectada
- [ ] Drivers NVIDIA atualizados
- [ ] CUDA instalado e funcionando
- [ ] Modelo `deepseek-coder-v2:16b` baixado
- [ ] Modelo otimizado `deepseek-coder-v2-16b-q4_k_m-rtx` criado
- [ ] Modelo testado com sucesso
- [ ] GPU sendo usada (verificar com `nvidia-smi`)
- [ ] VRAM sendo usada (~10-12GB)
- [ ] Configuração no `.env` atualizada
- [ ] Servidor reiniciado
- [ ] Performance verificada (50-100 tokens/s)

---

## 🎉 Pronto!

Agora o modelo está configurado e otimizado para usar sua **RTX 4080 Super 16GB** com máxima performance!

Para usar no projeto ANIMA, o sistema irá automaticamente:
1. Detectar o modelo `deepseek-coder-v2-16b-q4_k_m-rtx`
2. Usar GPU RTX 4080 Super 16GB
3. Otimizar performance para código
4. Aproveitar toda a VRAM disponível

---

**Última Atualização**: Janeiro 2025
**Versão**: 1.0
**Status**: Ready for RTX 4080 Super 16GB 🚀

