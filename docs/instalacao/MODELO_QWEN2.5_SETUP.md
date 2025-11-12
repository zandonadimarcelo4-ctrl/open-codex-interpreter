# 🚀 Configuração do Modelo Qwen2.5:14b

## ✅ Por que Qwen2.5:14b?

- ✅ **Suporta function calling (tools)** - Resolve o erro "does not support tools"
- ✅ **Muito inteligente** - Modelo de alta qualidade
- ✅ **Bom em código** - Especializado em programação
- ✅ **Tamanho razoável** - ~8-9GB (cabe em 16GB VRAM)

## 📥 Instalação

### Windows
```bash
# Executar script de instalação
scripts\setup_qwen2.5_14b.bat

# Ou manualmente
ollama pull qwen2.5:14b
```

### Linux/macOS
```bash
# Instalar manualmente
ollama pull qwen2.5:14b
```

## 🔧 Configuração

### 1. Atualizar `.env`
```env
DEFAULT_MODEL=qwen2.5:14b
```

### 2. Reiniciar o servidor
```bash
# Parar o servidor atual
# Reiniciar o servidor
```

## 🎯 Alternativas

### Qwen2.5:32b (Mais Inteligente)
- ✅ Mais inteligente que 14b
- ❌ Maior (~20GB)
- ❌ Mais lento
- 💡 Use se tiver 24GB+ VRAM

### Qwen2.5:7b (Mais Rápido)
- ✅ Mais rápido que 14b
- ✅ Menor (~4GB)
- ❌ Menos inteligente
- 💡 Use se precisar de velocidade

### Llama3.2:3b (Menor)
- ✅ Menor (~2GB)
- ✅ Rápido
- ❌ Menos inteligente
- 💡 Use para testes rápidos

## ✅ Verificação

### Verificar se o modelo está instalado
```bash
ollama list | grep qwen2.5:14b
```

### Testar function calling
```bash
ollama run qwen2.5:14b "Execute um código Python que imprime 'Hello World'"
```

## 🐛 Troubleshooting

### Erro: "model not found"
```bash
# Instalar o modelo
ollama pull qwen2.5:14b
```

### Erro: "out of memory"
```bash
# Usar modelo menor
DEFAULT_MODEL=qwen2.5:7b
```

### Erro: "still does not support tools"
```bash
# Verificar versão do Ollama (precisa ser >= 0.1.0)
ollama --version

# Atualizar Ollama
# Windows: Baixar de https://ollama.ai
# Linux: sudo apt update && sudo apt upgrade ollama
```

## 📊 Comparação de Modelos

| Modelo | Tamanho | Inteligência | Function Calling | Velocidade |
|--------|---------|--------------|------------------|------------|
| qwen2.5:32b | ~20GB | ⭐⭐⭐⭐⭐ | ✅ | ⭐⭐ |
| qwen2.5:14b | ~8GB | ⭐⭐⭐⭐ | ✅ | ⭐⭐⭐ |
| qwen2.5:7b | ~4GB | ⭐⭐⭐ | ✅ | ⭐⭐⭐⭐ |
| llama3.2:3b | ~2GB | ⭐⭐ | ✅ | ⭐⭐⭐⭐⭐ |

## 🎯 Recomendação

**Para a maioria dos casos:** `qwen2.5:14b`
- Balanceamento perfeito entre inteligência e velocidade
- Suporta function calling
- Cabe em 16GB VRAM

**Para desenvolvimento/testes:** `qwen2.5:7b`
- Mais rápido
- Menor
- Ainda muito capaz

**Para produção máxima:** `qwen2.5:32b`
- Mais inteligente
- Melhor qualidade
- Requer mais recursos

---

**Status:** ✅ Modelo configurado e pronto para usar!

