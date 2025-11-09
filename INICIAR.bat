@echo off
SETLOCAL ENABLEDELAYEDEXPANSION

title Open Codex Interpreter - Iniciando...

echo.
echo ============================================
echo   Open Codex Interpreter
echo   Iniciando Backend + Frontend Automaticamente
echo ============================================
echo.

:: ============================================
:: PASSO 1: Verificar Python
:: ============================================
echo [1/8] Verificando Python...
python --version >nul 2>&1
if errorlevel 1 (
    echo.
    echo ERRO: Python nao encontrado!
    echo Por favor, instale Python 3.10 ou superior.
    echo Download: https://www.python.org/downloads/
    echo.
    pause
    exit /b 1
)
for /f "tokens=2" %%i in ('python --version 2^>^&1') do set PYTHON_VERSION=%%i
echo Python !PYTHON_VERSION! encontrado.
echo.

:: ============================================
:: PASSO 2: Verificar/Criar Ambiente Virtual
:: ============================================
echo [2/8] Verificando ambiente virtual...
if not exist ".venv\Scripts\activate.bat" (
    echo Ambiente virtual nao encontrado. Criando...
    python -m venv .venv
    if errorlevel 1 (
        echo ERRO: Falha ao criar ambiente virtual!
        pause
        exit /b 1
    )
    echo Ambiente virtual criado.
) else (
    echo Ambiente virtual encontrado.
)
echo.

:: ============================================
:: PASSO 3: Ativar e Atualizar Ambiente Virtual
:: ============================================
echo [3/8] Ativando ambiente virtual...
call .venv\Scripts\activate.bat
if errorlevel 1 (
    echo ERRO: Falha ao ativar ambiente virtual!
    echo Tentando recriar...
    rmdir /s /q .venv 2>nul
    python -m venv .venv
    call .venv\Scripts\activate.bat
)
echo Atualizando pip...
python -m pip install --upgrade pip setuptools wheel --quiet
echo.

:: ============================================
:: PASSO 4: Instalar Dependencias Python Basicas
:: ============================================
echo [4/8] Verificando dependencias Python...
python -c "import fastapi" >nul 2>&1
if errorlevel 1 (
    echo Instalando dependencias basicas (FastAPI, Uvicorn, Pydantic)...
    pip install --no-cache-dir --quiet fastapi==0.118.0 "uvicorn[standard]==0.37.0" pydantic==2.11.9 python-multipart==0.0.20
    if errorlevel 1 (
        echo ERRO: Falha ao instalar dependencias basicas!
        pause
        exit /b 1
    )
    echo Dependencias basicas instaladas.
) else (
    echo Dependencias basicas OK.
)
echo.

:: ============================================
:: PASSO 5: Verificar Node.js e pnpm
:: ============================================
echo [5/8] Verificando Node.js...
where node >nul 2>&1
if errorlevel 1 (
    echo.
    echo ERRO: Node.js nao encontrado!
    echo Por favor, instale Node.js 18 ou superior.
    echo Download: https://nodejs.org/
    echo.
    pause
    exit /b 1
)
for /f "tokens=1" %%i in ('node --version') do set NODE_VERSION=%%i
echo Node.js !NODE_VERSION! encontrado.

where pnpm >nul 2>&1
if errorlevel 1 (
    echo Instalando pnpm...
    call npm install -g pnpm --quiet
    if errorlevel 1 (
        echo ERRO: Falha ao instalar pnpm!
        pause
        exit /b 1
    )
) else (
    echo pnpm encontrado.
)
echo.

:: ============================================
:: PASSO 6: Verificar/Instalar Dependencias Frontend
:: ============================================
echo [6/8] Verificando dependencias do frontend...
if not exist "autogen_agent_interface" (
    echo ERRO: Diretorio autogen_agent_interface nao encontrado!
    pause
    exit /b 1
)

if not exist "autogen_agent_interface\node_modules" (
    echo Instalando dependencias do frontend (isso pode demorar alguns minutos)...
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

:: ============================================
:: PASSO 7: Configurar Ambiente
:: ============================================
echo [7/8] Configurando ambiente...

:: Criar arquivo .env se nao existir
if not exist ".env" (
    if exist "env.example" (
        copy env.example .env >nul 2>&1
    )
)

if not exist "autogen_agent_interface\.env" (
    if exist "autogen_agent_interface\env.example" (
        copy "autogen_agent_interface\env.example" "autogen_agent_interface\.env" >nul 2>&1
    )
)

:: Criar diretorios necessarios
if not exist "data" mkdir data >nul 2>&1
if not exist "data\uploads" mkdir data\uploads >nul 2>&1
if not exist "data\cache" mkdir data\cache >nul 2>&1

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
        python -c "import base64, random; open('.webui_secret_key', 'w').write(base64.b64encode(random.randbytes(12)).decode())" >nul 2>&1
    )
    SET /p WEBUI_SECRET_KEY=<%KEY_FILE% 2>nul
)

echo Configuracao concluida.
echo.

:: ============================================
:: PASSO 8: Iniciar Servidores
:: ============================================
echo [8/8] Iniciando servidores...
echo.

:: Iniciar Backend em janela separada
echo Iniciando Backend (porta 8080)...
start "Backend Python - Porta 8080" cmd /k "cd /d %~dp0 && title Backend Python && call .venv\Scripts\activate.bat && set WEBUI_SECRET_KEY=%WEBUI_SECRET_KEY% && echo. && echo ============================================ && echo   Backend Python - Porta 8080 && echo ============================================ && echo. && echo Iniciando servidor... && python -m uvicorn open_webui.main:app --host %HOST% --port 8080 --reload"

:: Aguardar backend iniciar
echo Aguardando backend iniciar (5 segundos)...
timeout /t 5 /nobreak >nul

:: Iniciar Frontend em janela separada
echo Iniciando Frontend (porta 3000)...
start "Frontend Completo - Porta 3000" cmd /k "cd /d %~dp0\autogen_agent_interface && title Frontend Completo && set NODE_ENV=development && set PORT=3000 && set VITE_OPEN_WEBUI_API=http://localhost:8080/api && set VITE_API_BASE_URL=http://localhost:3000/api && echo. && echo ============================================ && echo   Frontend Completo - Porta 3000 && echo ============================================ && echo. && echo Iniciando servidor... && pnpm dev"

:: Aguardar frontend iniciar
echo Aguardando frontend iniciar (5 segundos)...
timeout /t 5 /nobreak >nul

:: Aguardar mais um pouco para garantir que iniciaram
timeout /t 3 /nobreak >nul

:: ============================================
:: Abrir Navegadores Automaticamente
:: ============================================
echo.
echo ============================================
echo   Servidores Iniciados!
echo ============================================
echo.
echo Abrindo navegadores automaticamente...
echo.

:: Abrir Backend Docs
start "" "http://localhost:8080/docs"

:: Aguardar um pouco
timeout /t 2 /nobreak >nul

:: Abrir Frontend
start "" "http://localhost:3000"

echo.
echo ============================================
echo   URLs Disponiveis
echo ============================================
echo.
echo Backend:
echo   - API:    http://localhost:8080/api
echo   - Docs:   http://localhost:8080/docs
echo.
echo Frontend:
echo   - Interface: http://localhost:3000
echo   - Landing:   http://localhost:3000/
echo   - Home:      http://localhost:3000/app
echo   - Showcase:  http://localhost:3000/showcase
echo.
echo ============================================
echo   Janelas do Backend e Frontend foram abertas
echo   Navegadores foram abertos automaticamente
echo.
echo   Pressione qualquer tecla para parar os servidores...
echo ============================================
echo.

pause >nul

:: Parar servidores
echo.
echo Parando servidores...
taskkill /FI "WINDOWTITLE eq Backend Python*" /T /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq Frontend Completo*" /T /F >nul 2>&1
echo Servidores parados.
echo.

timeout /t 2 /nobreak >nul
exit /b

