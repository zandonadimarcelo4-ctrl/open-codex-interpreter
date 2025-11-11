@echo off
REM Script para iniciar Open Interpreter como servidor WebSocket
REM O Open Interpreter pensa e executa localmente, mas aceita comandos do AutoGen

echo ========================================
echo Iniciando Open Interpreter Server
echo Modo: WebSocket com modelo interno
echo AutoGen comanda, Open Interpreter executa
echo ========================================
echo.

cd /d "%~dp0\.."

REM Verificar se Python está disponível
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERRO] Python não encontrado. Instale Python primeiro.
    pause
    exit /b 1
)

REM Verificar se o interpreter está instalado
python -c "import interpreter" >nul 2>&1
if errorlevel 1 (
    echo [INFO] Instalando Open Interpreter...
    cd interpreter
    pip install -e . >nul 2>&1
    cd ..
)

REM Obter modelo do ambiente ou usar padrão
set MODEL=%DEFAULT_MODEL%
if "%MODEL%"=="" set MODEL=deepseek-coder-v2-16b-q4_k_m-rtx

echo [INFO] Modelo: %MODEL%
echo [INFO] Porta: 8000
echo [INFO] Modo: Local com Ollama (pensamento interno)
echo.

REM Iniciar servidor WebSocket
echo [INFO] Iniciando servidor WebSocket...
echo [INFO] O AutoGen pode enviar comandos via WebSocket
echo [INFO] O Open Interpreter pensa e executa localmente
echo.

cd interpreter
python -m interpreter.server --host localhost --port 8000 --local --auto-run --model %MODEL%

pause

