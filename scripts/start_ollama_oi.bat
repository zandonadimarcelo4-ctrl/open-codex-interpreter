@echo off
REM Script para iniciar Ollama + Open Interpreter Server
REM AutoGen comanda, Open Interpreter pensa e executa localmente
REM Ambos usam o mesmo modelo Ollama (uma única instância)

echo ========================================
echo Iniciando Ollama + Open Interpreter
echo Arquitetura Híbrida: AutoGen comanda tudo
echo ========================================
echo.

cd /d "%~dp0\.."

REM Verificar se Ollama está instalado
where ollama >nul 2>&1
if errorlevel 1 (
    echo [ERRO] Ollama não encontrado. Instale Ollama primeiro.
    echo Download: https://ollama.com/download
    pause
    exit /b 1
)

REM Verificar se Python está disponível
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERRO] Python não encontrado. Instale Python primeiro.
    pause
    exit /b 1
)

REM Obter configurações do ambiente
set MODEL=%DEFAULT_MODEL%
if "%MODEL%"=="" set MODEL=deepseek-coder-v2-16b-q4_k_m-rtx

set WORKDIR=%WORKDIR%
if "%WORKDIR%"=="" set WORKDIR=E:\JarvisSandbox

set PORT=%OI_WS_PORT%
if "%PORT%"=="" set PORT=4000

echo [INFO] Modelo: %MODEL%
echo [INFO] Porta WebSocket: %PORT%
echo [INFO] Workdir: %WORKDIR%
echo.

REM Criar diretório de trabalho
if not exist "%WORKDIR%" (
    echo [INFO] Criando diretório de trabalho: %WORKDIR%
    mkdir "%WORKDIR%"
)

REM Verificar se o modelo existe no Ollama
echo [INFO] Verificando modelo no Ollama...
ollama list | findstr /C:"%MODEL%" >nul 2>&1
if errorlevel 1 (
    echo [INFO] Modelo não encontrado. Baixando modelo...
    ollama pull %MODEL%
    if errorlevel 1 (
        echo [ERRO] Erro ao baixar modelo. Verifique se o nome do modelo está correto.
        pause
        exit /b 1
    )
)

echo [INFO] Modelo verificado: %MODEL%
echo.

REM Verificar se o interpreter está instalado
python -c "import interpreter" >nul 2>&1
if errorlevel 1 (
    echo [INFO] Instalando Open Interpreter...
    cd interpreter
    pip install -e . >nul 2>&1
    if errorlevel 1 (
        echo [ERRO] Erro ao instalar Open Interpreter.
        pause
        exit /b 1
    )
    cd ..
)

echo [INFO] Iniciando servidor Open Interpreter...
echo [INFO] O AutoGen pode enviar comandos via WebSocket
echo [INFO] O Open Interpreter pensa e executa localmente
echo [INFO] Ambos usam o mesmo modelo: %MODEL%
echo.

REM Iniciar servidor WebSocket
cd interpreter
python -m interpreter.server --host localhost --port %PORT% --local --auto-run --model %MODEL% --workdir "%WORKDIR%"

pause

