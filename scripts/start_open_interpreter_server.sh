#!/bin/bash
# Script para iniciar Open Interpreter como servidor WebSocket
# O Open Interpreter pensa e executa localmente, mas aceita comandos do AutoGen

echo "========================================"
echo "Iniciando Open Interpreter Server"
echo "Modo: WebSocket com modelo interno"
echo "AutoGen comanda, Open Interpreter executa"
echo "========================================"
echo ""

cd "$(dirname "$0")/.."

# Verificar se Python está disponível
if ! command -v python3 &> /dev/null; then
    echo "[ERRO] Python não encontrado. Instale Python primeiro."
    exit 1
fi

# Verificar se o interpreter está instalado
if ! python3 -c "import interpreter" &> /dev/null; then
    echo "[INFO] Instalando Open Interpreter..."
    cd interpreter
    pip install -e . > /dev/null 2>&1
    cd ..
fi

# Obter modelo do ambiente ou usar padrão
MODEL="${DEFAULT_MODEL:-deepseek-coder-v2-16b-q4_k_m-rtx}"

echo "[INFO] Modelo: $MODEL"
echo "[INFO] Porta: 8000"
echo "[INFO] Modo: Local com Ollama (pensamento interno)"
echo ""

# Iniciar servidor WebSocket
echo "[INFO] Iniciando servidor WebSocket..."
echo "[INFO] O AutoGen pode enviar comandos via WebSocket"
echo "[INFO] O Open Interpreter pensa e executa localmente"
echo ""

cd interpreter
python3 -m interpreter.server --host localhost --port 8000 --local --auto-run --model "$MODEL"

