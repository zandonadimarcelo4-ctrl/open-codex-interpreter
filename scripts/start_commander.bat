@echo off
REM Script para iniciar AutoGen Commander
REM AutoGen comanda tudo, Open Interpreter pensa e executa localmente

echo ========================================
echo Iniciando AutoGen Commander
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

REM Verificar se as dependências estão instaladas
python -c "import autogen_agentchat" >nul 2>&1
if errorlevel 1 (
    echo [INFO] Instalando dependências...
    pip install autogen-agentchat autogen-ext[openai] websockets python-dotenv rich >nul 2>&1
    if errorlevel 1 (
        echo [ERRO] Erro ao instalar dependências.
        pause
        exit /b 1
    )
)

REM Configurar variáveis de ambiente (se não estiverem configuradas)
if "%OLLAMA_BASE_URL%"=="" set OLLAMA_BASE_URL=http://localhost:11434
if "%OI_WS_URL%"=="" set OI_WS_URL=ws://localhost:4000
if "%WORKDIR%"=="" set WORKDIR=E:\JarvisSandbox
if "%DEFAULT_MODEL%"=="" set DEFAULT_MODEL=deepseek-coder-v2-16b-q4_k_m-rtx

echo [INFO] OLLAMA_BASE_URL: %OLLAMA_BASE_URL%
echo [INFO] OI_WS_URL: %OI_WS_URL%
echo [INFO] WORKDIR: %WORKDIR%
echo [INFO] DEFAULT_MODEL: %DEFAULT_MODEL%
echo.

REM Verificar se o servidor Open Interpreter está rodando
echo [INFO] Verificando conexão com Open Interpreter...
python -c "import asyncio; import websockets; asyncio.run(websockets.connect('%OI_WS_URL%'))" >nul 2>&1
if errorlevel 1 (
    echo [AVISO] Não foi possível conectar ao Open Interpreter em %OI_WS_URL%
    echo [AVISO] Certifique-se de que o servidor Open Interpreter está rodando.
    echo [AVISO] Execute: scripts\start_ollama_oi.bat
    echo.
    set /p continue="Deseja continuar mesmo assim? (S/N): "
    if /i not "%continue%"=="S" (
        exit /b 1
    )
)

echo [INFO] Iniciando AutoGen Commander...
echo [INFO] O AutoGen vai comandar o Open Interpreter
echo [INFO] Ambos usam o mesmo modelo: %DEFAULT_MODEL%
echo.

REM Executar comandante
python -m super_agent.main_commander

pause

