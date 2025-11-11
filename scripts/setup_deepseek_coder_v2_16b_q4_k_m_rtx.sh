#!/bin/bash

# Script para configurar DeepSeek-Coder-V2:16b Q4_K_M otimizado para RTX NVIDIA
# Linux/macOS Shell Script

set -e

echo "========================================"
echo "Configurando DeepSeek-Coder-V2:16b Q4_K_M"
echo "Otimizado para GPU NVIDIA RTX"
echo "========================================"
echo ""

# Verificar se Ollama está instalado
if ! command -v ollama &> /dev/null; then
    echo "[ERRO] Ollama não está instalado!"
    echo "Por favor, instale o Ollama em: https://ollama.ai/download"
    exit 1
fi

echo "[OK] Ollama encontrado"
echo ""

# Verificar se NVIDIA GPU está disponível
echo "Verificando GPU NVIDIA..."
if command -v nvidia-smi &> /dev/null; then
    echo "[OK] GPU NVIDIA detectada!"
    nvidia-smi --query-gpu=name,memory.total --format=csv,noheader
    echo ""
else
    echo "[AVISO] GPU NVIDIA não detectada. O modelo funcionará em CPU (mais lento)."
    echo ""
fi

# Verificar se modelo já está instalado
echo "Verificando se modelo já está instalado..."
if ollama list | grep -q "deepseek-coder-v2:16b"; then
    echo "[OK] Modelo deepseek-coder-v2:16b já está instalado"
else
    echo "[INFO] Baixando modelo deepseek-coder-v2:16b..."
    echo "Isso pode demorar vários minutos (tamanho: 8.9GB)"
    echo ""
    ollama pull deepseek-coder-v2:16b
    if [ $? -ne 0 ]; then
        echo "[ERRO] Falha ao baixar o modelo"
        exit 1
    fi
    echo "[OK] Modelo baixado com sucesso!"
fi

echo ""
echo "Criando modelo otimizado Q4_K_M para RTX..."

# Navegar para o diretório do projeto
cd "$(dirname "$0")/.."

# Verificar se Modelfile existe
if [ ! -f "Modelfile.deepseek-coder-v2-16b-q4_k_m-rtx" ]; then
    echo "[ERRO] Modelfile não encontrado: Modelfile.deepseek-coder-v2-16b-q4_k_m-rtx"
    exit 1
fi

# Criar modelo otimizado
ollama create deepseek-coder-v2-16b-q4_k_m-rtx -f Modelfile.deepseek-coder-v2-16b-q4_k_m-rtx
if [ $? -ne 0 ]; then
    echo "[ERRO] Falha ao criar modelo otimizado"
    exit 1
fi

echo "[OK] Modelo otimizado criado: deepseek-coder-v2-16b-q4_k_m-rtx"
echo ""

# Testar modelo
echo "Testando modelo..."
ollama run deepseek-coder-v2-16b-q4_k_m-rtx "Write a Python function to calculate fibonacci numbers" --verbose
if [ $? -eq 0 ]; then
    echo "[OK] Modelo funcionando corretamente!"
else
    echo "[AVISO] Teste falhou, mas modelo pode estar funcionando"
fi

echo ""
echo "========================================"
echo "Configuração concluída!"
echo "========================================"
echo ""
echo "Modelo configurado: deepseek-coder-v2-16b-q4_k_m-rtx"
echo "Otimizado para: GPU NVIDIA RTX"
echo ""
echo "Para testar o modelo, execute:"
echo "  ollama run deepseek-coder-v2-16b-q4_k_m-rtx 'Write a Python function'"
echo ""
echo "Para verificar uso de GPU:"
echo "  nvidia-smi"
echo ""
echo "Para usar no projeto ANIMA, atualize o .env:"
echo "  DEFAULT_MODEL=deepseek-coder-v2-16b-q4_k_m-rtx"
echo ""

