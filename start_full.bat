@echo off
SETLOCAL ENABLEDELAYEDEXPANSION

echo ============================================
echo Iniciando Backend Python + Frontend Completo
echo ============================================
echo.

:: Verificar se ambiente virtual existe
if exist ".venv\Scripts\activate.bat" (
    echo [1/3] Ativando ambiente virtual Python...
    call .venv\Scripts\activate.bat
) else (
    echo ERRO: Ambiente virtual nao encontrado!
    echo Execute setup_windows.bat primeiro.
    pause
    exit /b 1
)

:: Verificar se Node.js esta instalado
where node >nul 2>&1
if errorlevel 1 (
    echo ERRO: Node.js nao encontrado!
    echo Por favor, instale Node.js 18 ou superior.
    pause
    exit /b 1
)

:: Verificar se pnpm esta instalado
where pnpm >nul 2>&1
if errorlevel 1 (
    echo AVISO: pnpm nao encontrado. Instalando pnpm...
    call npm install -g pnpm
    if errorlevel 1 (
        echo ERRO: Falha ao instalar pnpm!
        pause
        exit /b 1
    )
)

:: Verificar se autogen_agent_interface existe
if not exist "autogen_agent_interface" (
    echo ERRO: Diretorio autogen_agent_interface nao encontrado!
    pause
    exit /b 1
)

:: Verificar se node_modules existe no autogen_agent_interface
if not exist "autogen_agent_interface\node_modules" (
    echo [2/3] Instalando dependencias do frontend completo...
    cd autogen_agent_interface
    call pnpm install
    if errorlevel 1 (
        echo ERRO: Falha ao instalar dependencias do frontend!
        cd ..
        pause
        exit /b 1
    )
    cd ..
)

:: Verificar se .env existe no autogen_agent_interface
if not exist "autogen_agent_interface\.env" (
    echo Criando arquivo .env no autogen_agent_interface...
    if exist "autogen_agent_interface\env.example" (
        copy "autogen_agent_interface\env.example" "autogen_agent_interface\.env" >nul
        echo Arquivo .env criado. Por favor, edite-o com suas configuracoes.
    )
)

:: Configurar variaveis de ambiente do backend
SET "KEY_FILE=.webui_secret_key"
IF NOT "%WEBUI_SECRET_KEY_FILE%" == "" (
    SET "KEY_FILE=%WEBUI_SECRET_KEY_FILE%"
)

IF "%PORT%"=="" SET PORT=8080
IF "%HOST%"=="" SET HOST=0.0.0.0
SET "WEBUI_SECRET_KEY=%WEBUI_SECRET_KEY%"
SET "WEBUI_JWT_SECRET_KEY=%WEBUI_JWT_SECRET_KEY%"

:: Verificar chaves secretas
IF "%WEBUI_SECRET_KEY% %WEBUI_JWT_SECRET_KEY%" == " " (
    IF NOT EXIST "%KEY_FILE%" (
        echo Gerando WEBUI_SECRET_KEY...
        python -c "import base64, random, os; open('.webui_secret_key', 'w').write(base64.b64encode(random.randbytes(12)).decode())"
    )
    SET /p WEBUI_SECRET_KEY=<%KEY_FILE%
)

:: Iniciar backend em background
echo.
echo ============================================
echo [3/3] Iniciando Backend Python (porta 8080)...
echo ============================================
start "Backend Python" cmd /k "cd /d %~dp0 && call .venv\Scripts\activate.bat && set WEBUI_SECRET_KEY=%WEBUI_SECRET_KEY% && python -m uvicorn open_webui.main:app --host %HOST% --port 8080 --reload"

:: Aguardar backend iniciar
timeout /t 5 /nobreak >nul

:: Iniciar frontend completo
echo.
echo ============================================
echo Iniciando Frontend Completo (porta 3000)...
echo ============================================
echo Frontend inclui:
echo   - React completo com tRPC
echo   - Backend tRPC/Express
echo   - 53 componentes Radix UI
echo   - Integracao com Open WebUI
echo.
start "Frontend Completo" cmd /k "cd /d %~dp0\autogen_agent_interface && set NODE_ENV=development && set PORT=3000 && set VITE_OPEN_WEBUI_API=http://localhost:8080/api && pnpm dev"

echo.
echo ============================================
echo Servidores iniciados!
echo ============================================
echo.
echo Backend Python:  http://localhost:8080
echo   - API:         http://localhost:8080/api
echo   - Docs:        http://localhost:8080/docs
echo.
echo Frontend Completo: http://localhost:3000
echo   - Interface:   http://localhost:3000
echo   - tRPC API:    http://localhost:3000/api/trpc
echo.
echo Pressione qualquer tecla para parar os servidores...
pause >nul

:: Parar servidores
taskkill /FI "WINDOWTITLE eq Backend Python*" /T /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq Frontend Completo*" /T /F >nul 2>&1

exit /b
