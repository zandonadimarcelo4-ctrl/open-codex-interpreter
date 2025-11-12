# 🔍 Como Verificar se o Modelo está Usando GPU

## 📊 Verificação Rápida

### 1. Verificar Uso de GPU Durante Execução

```bash
# Em um terminal, execute o modelo
ollama run deepseek-coder-v2-16b-q4_k_m-rtx "Write a Python function"

# Em outro terminal, monitore a GPU
nvidia-smi -l 1
```

**O que procurar:**
- **Uso de GPU**: Deve estar entre 80-100% durante inferência
- **VRAM Usada**: Deve estar entre 10-12GB (de 16GB)
- **Temperatura**: 60-75°C
- **Power Usage**: Alta (300-400W durante inferência)

### 2. Verificar Variáveis de Ambiente

```bash
# Verificar se CUDA está disponível
echo %CUDA_VISIBLE_DEVICES%

# Verificar se Ollama detecta GPU
ollama ps
```

### 3. Testar Performance

```bash
# Testar velocidade de inferência
ollama run deepseek-coder-v2-16b-q4_k_m-rtx "Write a Python function to calculate fibonacci numbers" --verbose
```

**Performance Esperada (RTX 4080 Super 16GB):**
- **Tokens/segundo**: 80-120 tokens/s (com GPU)
- **Tokens/segundo**: 10-20 tokens/s (sem GPU, apenas CPU)
- **Tempo de carregamento**: 5-10 segundos (com GPU)
- **Tempo de carregamento**: 30-60 segundos (sem GPU)

### 4. Verificar Logs do Ollama

```bash
# Verificar logs do Ollama (Windows)
# Os logs geralmente mostram se está usando GPU ou CPU
```

## 🐛 Problemas Comuns

### GPU não está sendo usada

**Sintomas:**
- Velocidade baixa (10-20 tokens/s)
- Uso de GPU baixo (<10%)
- Tempo de carregamento longo (>30 segundos)

**Soluções:**

1. **Verificar Drivers NVIDIA**:
   ```bash
   nvidia-smi
   # Deve mostrar informações da GPU
   ```

2. **Verificar CUDA**:
   ```bash
   nvcc --version
   # Deve mostrar versão do CUDA
   ```

3. **Reiniciar Ollama**:
   ```bash
   # Windows: Reiniciar serviço Ollama
   # Ou reiniciar o computador
   ```

4. **Verificar Variáveis de Ambiente**:
   ```bash
   # Não definir CUDA_VISIBLE_DEVICES (deixe vazio)
   # Ollama deve detectar GPU automaticamente
   ```

### Performance baixa mesmo com GPU

**Possíveis causas:**
- Context window muito grande (reduzir `num_ctx`)
- Batch size muito grande (Ollama gerencia automaticamente)
- Outros processos usando GPU

**Soluções:**
- Fechar outros aplicativos que usam GPU
- Reduzir `num_ctx` se não precisar de contexto muito grande
- Verificar temperatura da GPU (throttling)

## ✅ Checklist

- [ ] GPU detectada pelo `nvidia-smi`
- [ ] Drivers NVIDIA atualizados
- [ ] CUDA instalado e funcionando
- [ ] Ollama detecta GPU (verificar logs)
- [ ] Uso de GPU >80% durante inferência
- [ ] VRAM sendo usada (10-12GB)
- [ ] Performance adequada (80-120 tokens/s)
- [ ] Temperatura normal (60-75°C)

## 📚 Referências

- [Ollama GPU Support](https://github.com/ollama/ollama/blob/main/docs/gpu.md)
- [NVIDIA CUDA Documentation](https://docs.nvidia.com/cuda/)
- [Ollama Performance Tuning](https://github.com/ollama/ollama/blob/main/docs/performance.md)

