@echo off
SETLOCAL ENABLEDELAYEDEXPANSION

echo ============================================
echo Iniciando Backend Python
echo ============================================
echo.

:: Verificar Python
python --version >nul 2>&1
if errorlevel 1 (
    echo ERRO: Python nao encontrado!
    pause
    exit /b 1
)

:: Verificar ambiente virtual
if not exist ".venv\Scripts\activate.bat" (
    echo Criando ambiente virtual...
    python -m venv .venv
    if errorlevel 1 (
        echo ERRO: Falha ao criar ambiente virtual!
        pause
        exit /b 1
    )
)

:: Ativar ambiente virtual
echo Ativando ambiente virtual...
call .venv\Scripts\activate.bat

:: Verificar dependencias basicas
python -c "import fastapi" >nul 2>&1
if errorlevel 1 (
    echo Instalando dependencias basicas...
    pip install --upgrade pip setuptools wheel
    pip install --no-cache-dir fastapi==0.118.0 "uvicorn[standard]==0.37.0" pydantic==2.11.9
    if errorlevel 1 (
        echo ERRO: Falha ao instalar dependencias basicas!
        pause
        exit /b 1
    )
)

:: Configurar variaveis de ambiente
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
        python -c "import base64, random; open('.webui_secret_key', 'w').write(base64.b64encode(random.randbytes(12)).decode())"
    )
    SET /p WEBUI_SECRET_KEY=<%KEY_FILE%
)

:: Criar diretorios necessarios
if not exist "data" mkdir data
if not exist "data\uploads" mkdir data\uploads
if not exist "data\cache" mkdir data\cache

:: Iniciar backend
echo.
echo ============================================
echo Iniciando Backend na porta %PORT%...
echo ============================================
echo.
echo Backend: http://localhost:%PORT%
echo API:    http://localhost:%PORT%/api
echo Docs:   http://localhost:%PORT%/docs
echo.
echo Pressione Ctrl+C para parar o servidor
echo.

python -m uvicorn open_webui.main:app --host %HOST% --port %PORT% --reload

