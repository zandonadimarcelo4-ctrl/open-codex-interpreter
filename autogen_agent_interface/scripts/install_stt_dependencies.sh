#!/bin/bash
# Script para instalar dependências do STT (Speech-to-Text)
# Requer Python 3.8+ e pip

echo "============================================"
echo "  Instalando dependências do STT"
echo "============================================"
echo ""

# Verificar se Python está instalado
echo "Verificando Python..."
if ! command -v python3 &> /dev/null; then
    echo "❌ Python não encontrado!"
    echo "Por favor, instale Python 3.8 ou superior: https://www.python.org/downloads/"
    exit 1
fi
python3 --version
echo ""

# Verificar se pip está instalado
echo "Verificando pip..."
if ! python3 -m pip --version &> /dev/null; then
    echo "❌ pip não encontrado!"
    echo "Por favor, instale pip: python3 -m ensurepip --upgrade"
    exit 1
fi
python3 -m pip --version
echo ""

# Atualizar pip
echo "Atualizando pip..."
python3 -m pip install --upgrade pip
echo ""

# Instalar dependências
echo "Instalando faster-whisper..."
python3 -m pip install faster-whisper
if [ $? -ne 0 ]; then
    echo "❌ Erro ao instalar faster-whisper"
    exit 1
fi
echo "✅ faster-whisper instalado"
echo ""

echo "Instalando pydub..."
python3 -m pip install pydub
if [ $? -ne 0 ]; then
    echo "❌ Erro ao instalar pydub"
    exit 1
fi
echo "✅ pydub instalado"
echo ""

# Verificar instalação
echo "Verificando instalação..."
python3 -c "import faster_whisper; print('✅ faster-whisper: OK')"
python3 -c "import pydub; print('✅ pydub: OK')"

echo ""
echo "============================================"
echo "  ✅ Dependências do STT instaladas!"
echo "============================================"
echo ""
echo "O STT (Speech-to-Text) está pronto para usar."
echo ""

