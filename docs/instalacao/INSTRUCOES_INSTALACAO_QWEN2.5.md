# 🚀 Instruções Rápidas: Instalar Qwen2.5:14b

## ⚡ Instalação Rápida

### Windows
```bash
# Opção 1: Script automático
scripts\setup_qwen2.5_14b.bat

# Opção 2: Manual
ollama pull qwen2.5:14b
```

### Linux/macOS
```bash
ollama pull qwen2.5:14b
```

## 🔧 Configuração

### 1. Atualizar `.env`
```env
DEFAULT_MODEL=qwen2.5:14b
```

### 2. Reiniciar o servidor
```bash
# Parar o servidor atual (Ctrl+C)
# Reiniciar o servidor
npm run dev
```

## ✅ Verificação

### Verificar se está instalado
```bash
ollama list | grep qwen2.5:14b
```

### Testar
```bash
ollama run qwen2.5:14b "Hello, como você está?"
```

## 🎯 Por que Qwen2.5:14b?

- ✅ **Suporta function calling** - Resolve o erro "does not support tools"
- ✅ **Muito inteligente** - Modelo de alta qualidade
- ✅ **Bom em código** - Especializado em programação
- ✅ **Tamanho razoável** - ~8-9GB (cabe em 16GB VRAM)

## 📊 Alternativas

| Modelo | Tamanho | Inteligência | Velocidade | Recomendado para |
|--------|---------|--------------|------------|------------------|
| qwen2.5:32b | ~20GB | ⭐⭐⭐⭐⭐ | ⭐⭐ | Produção máxima |
| **qwen2.5:14b** | **~8GB** | **⭐⭐⭐⭐** | **⭐⭐⭐** | **Uso geral** |
| qwen2.5:7b | ~4GB | ⭐⭐⭐ | ⭐⭐⭐⭐ | Desenvolvimento |
| llama3.2:3b | ~2GB | ⭐⭐ | ⭐⭐⭐⭐⭐ | Testes rápidos |

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
# Verificar versão do Ollama
ollama --version

# Atualizar Ollama se necessário
# Windows: Baixar de https://ollama.ai
# Linux: sudo apt update && sudo apt upgrade ollama
```

---

**Pronto! Agora o sistema deve funcionar com function calling!** 🎉

