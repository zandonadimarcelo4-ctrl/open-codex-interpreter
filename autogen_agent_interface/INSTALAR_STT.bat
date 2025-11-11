@echo off
chcp 65001 >nul
echo ========================================
echo 🎙️ Instalar Dependências do STT
echo ========================================
echo.
echo Este script instala as dependências Python necessárias
echo para o Speech-to-Text (STT) funcionar.
echo.
echo Dependências:
echo   - faster-whisper (transcrição de áudio)
echo   - pydub (conversão de formatos de áudio)
echo.
echo ========================================
echo.

cd /d "%~dp0"

echo [1/3] Verificando Python...
python --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Python não encontrado!
    echo.
    echo Por favor, instale Python 3.8 ou superior:
    echo https://www.python.org/downloads/
    echo.
    pause
    exit /b 1
)
python --version
echo ✅ Python encontrado
echo.

echo [2/3] Instalando dependências...
echo.
echo ⏳ Isso pode levar alguns minutos...
echo.

python -m pip install --upgrade pip --quiet
python -m pip install faster-whisper pydub

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ Erro ao instalar dependências
    echo.
    echo Tente executar manualmente:
    echo   python -m pip install faster-whisper pydub
    echo.
    pause
    exit /b 1
)

echo.
echo [3/3] Verificando instalação...
python -c "import faster_whisper; print('✅ faster-whisper: OK')" 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ faster-whisper não foi instalado corretamente
    pause
    exit /b 1
)

python -c "import pydub; print('✅ pydub: OK')" 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ pydub não foi instalado corretamente
    pause
    exit /b 1
)

echo.
echo ========================================
echo ✅ Dependências do STT instaladas!
echo ========================================
echo.
echo O STT (Speech-to-Text) está pronto para usar.
echo.
echo 💡 Nota: Para converter alguns formatos de áudio,
echo    você pode precisar instalar o FFmpeg:
echo    https://ffmpeg.org/download.html
echo.
pause

