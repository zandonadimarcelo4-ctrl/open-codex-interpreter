# 🚀 Teste Rápido: Verificar se GPU está sendo Usada

## ⚡ Teste em 2 Passos

### Passo 1: Monitorar GPU

Abra um terminal e execute:

```bash
# Windows PowerShell
nvidia-smi -l 1

# Ou para ver uma vez só
nvidia-smi
```

### Passo 2: Executar Modelo

Em outro terminal, execute:

```bash
ollama run deepseek-coder-v2-16b-q4_k_m-rtx "Write a Python function to calculate fibonacci numbers"
```

## ✅ O que Procurar

### Se GPU está sendo usada:
- **Uso de GPU**: 80-100%
- **VRAM Usada**: 10-12GB (de 16GB)
- **Temperatura**: 60-75°C
- **Power Usage**: 300-400W
- **Performance**: 80-120 tokens/s

### Se GPU NÃO está sendo usada:
- **Uso de GPU**: <10%
- **VRAM Usada**: <1GB
- **Performance**: 10-20 tokens/s
- **Tempo de carregamento**: Muito longo (>30s)

## 🔧 Se GPU não está sendo usada

1. **Verificar Drivers NVIDIA**:
   ```bash
   nvidia-smi
   ```

2. **Verificar CUDA**:
   ```bash
   nvcc --version
   ```

3. **Reiniciar Ollama**:
   - Windows: Reiniciar serviço Ollama ou computador

4. **Verificar Variáveis de Ambiente**:
   - Não definir `CUDA_VISIBLE_DEVICES`
   - Deixar Ollama detectar GPU automaticamente

## 📊 Comparação de Performance

| Métrica | Com GPU | Sem GPU |
|---------|---------|---------|
| **Tokens/s** | 80-120 | 10-20 |
| **Tempo de carregamento** | 5-10s | 30-60s |
| **Uso de GPU** | 80-100% | <10% |
| **VRAM** | 10-12GB | <1GB |

## 🎯 Próximos Passos

1. ✅ Verificar se GPU está sendo usada
2. ✅ Se não estiver, seguir troubleshooting
3. ✅ Se estiver, aproveitar a performance!
4. ✅ Configurar no projeto ANIMA

---

**Dica**: Execute o teste várias vezes. A primeira execução sempre é mais lenta (carregamento do modelo). As execuções subsequentes devem ser mais rápidas.

