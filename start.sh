#!/bin/bash
# Script de inicialização moderno (Linux/Mac)
# Substitui os scripts .sh antigos

echo "============================================"
echo "🚀 AutoGen Agent Interface"
echo "============================================"
echo ""

# Verificar se Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Erro: Node.js não encontrado!"
    echo "Instale Node.js: https://nodejs.org/"
    exit 1
fi

# Verificar se pnpm está instalado
if ! command -v pnpm &> /dev/null; then
    echo "⚠️  pnpm não encontrado, usando npm..."
    echo "Para melhor performance, instale pnpm: npm install -g pnpm"
    echo ""
fi

# Executar script Node.js
node start.js

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Erro ao iniciar servidor!"
    exit 1
fi
