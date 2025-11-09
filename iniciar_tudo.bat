@echo off
SETLOCAL ENABLEDELAYEDEXPANSION

echo ============================================
echo Iniciando Backend + Frontend Completo
echo ============================================
echo.

:: Verificar Python
echo [1/5] Verificando Python...
python --version >nul 2>&1
if errorlevel 1 (
    echo ERRO: Python nao encontrado!
    echo Por favor, instale Python 3.10 ou superior.
    pause
    exit /b 1
)
python --version
echo.

:: Verificar e criar ambiente virtual
echo [2/5] Verificando ambiente virtual...
if not exist ".venv\Scripts\activate.bat" (
    echo Ambiente virtual nao encontrado. Criando...
    python -m venv .venv
    if errorlevel 1 (
        echo ERRO: Falha ao criar ambiente virtual!
        pause
        exit /b 1
    )
    echo Ambiente virtual criado.
)
echo Ativando ambiente virtual...
call .venv\Scripts\activate.bat
echo.

:: Instalar dependencias Python
echo [3/5] Verificando dependencias Python...
python -c "import fastapi" >nul 2>&1
if errorlevel 1 (
    echo Instalando dependencias Python...
    pip install --upgrade pip
    pip install -r requirements.txt
    if errorlevel 1 (
        echo ERRO: Falha ao instalar dependencias Python!
        pause
        exit /b 1
    )
    echo Dependencias Python instaladas.
) else (
    echo Dependencias Python OK.
)
echo.

:: Verificar Node.js e pnpm
echo [4/5] Verificando Node.js e pnpm...
where node >nul 2>&1
if errorlevel 1 (
    echo ERRO: Node.js nao encontrado!
    echo Por favor, instale Node.js 18 ou superior.
    pause
    exit /b 1
)
node --version
where pnpm >nul 2>&1
if errorlevel 1 (
    echo pnpm nao encontrado. Instalando...
    call npm install -g pnpm
    if errorlevel 1 (
        echo ERRO: Falha ao instalar pnpm!
        pause
        exit /b 1
    )
)
pnpm --version
echo.

:: Verificar e instalar dependencias do frontend
if not exist "autogen_agent_interface\node_modules" (
    echo Instalando dependencias do frontend...
    cd autogen_agent_interface
    call pnpm install
    if errorlevel 1 (
        echo ERRO: Falha ao instalar dependencias do frontend!
        cd ..
        pause
        exit /b 1
    )
    cd ..
    echo Dependencias do frontend instaladas.
) else (
    echo Dependencias do frontend OK.
)
echo.

:: Criar arquivo .env se nao existir
if not exist ".env" (
    echo Criando arquivo .env...
    copy env.example .env >nul 2>&1
)
if not exist "autogen_agent_interface\.env" (
    echo Criando arquivo .env no autogen_agent_interface...
    if exist "autogen_agent_interface\env.example" (
        copy "autogen_agent_interface\env.example" "autogen_agent_interface\.env" >nul 2>&1
    )
)

:: Criar diretorios necessarios
if not exist "data" mkdir data
if not exist "data\uploads" mkdir data\uploads
if not exist "data\cache" mkdir data\cache
echo.

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

:: [5/5] Iniciar Backend
echo ============================================
echo [5/5] Iniciando Backend Python (porta 8080)...
echo ============================================
start "Backend Python - Porta 8080" cmd /k "cd /d %~dp0 && call .venv\Scripts\activate.bat && set WEBUI_SECRET_KEY=%WEBUI_SECRET_KEY% && echo Backend iniciando na porta 8080... && python -m uvicorn open_webui.main:app --host %HOST% --port 8080 --reload"

:: Aguardar backend iniciar
echo Aguardando backend iniciar (5 segundos)...
timeout /t 5 /nobreak >nul

:: Verificar se backend esta rodando
echo Verificando se backend esta rodando...
timeout /t 2 /nobreak >nul
curl -s http://localhost:8080/docs >nul 2>&1
if errorlevel 1 (
    echo AVISO: Backend pode nao estar pronto ainda. Continuando...
) else (
    echo Backend esta respondendo!
)
echo.

:: Iniciar Frontend
echo ============================================
echo Iniciando Frontend Completo (porta 3000)...
echo ============================================
echo Frontend inclui:
echo   - React completo com tRPC
echo   - Backend tRPC/Express
echo   - 53 componentes Radix UI
echo   - Design Premium Nivel Apple
echo   - Integracao com Open WebUI
echo.
start "Frontend Completo - Porta 3000" cmd /k "cd /d %~dp0\autogen_agent_interface && set NODE_ENV=development && set PORT=3000 && set VITE_OPEN_WEBUI_API=http://localhost:8080/api && echo Frontend iniciando na porta 3000... && pnpm dev"

:: Aguardar frontend iniciar
echo Aguardando frontend iniciar (5 segundos)...
timeout /t 5 /nobreak >nul
echo.

echo ============================================
echo Servidores Iniciados!
echo ============================================
echo.
echo Backend Python:  http://localhost:8080
echo   - API:         http://localhost:8080/api
echo   - Docs:        http://localhost:8080/docs
echo.
echo Frontend Completo: http://localhost:3000
echo   - Interface:   http://localhost:3000
echo   - Landing:     http://localhost:3000/
echo   - Home:        http://localhost:3000/app
echo   - Showcase:    http://localhost:3000/showcase
echo   - tRPC API:    http://localhost:3000/api/trpc
echo.
echo ============================================
echo Janelas do Backend e Frontend foram abertas
echo Pressione qualquer tecla para parar os servidores...
echo ============================================
pause >nul

:: Parar servidores
echo.
echo Parando servidores...
taskkill /FI "WINDOWTITLE eq Backend Python*" /T /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq Frontend Completo*" /T /F >nul 2>&1
echo Servidores parados.

exit /b

