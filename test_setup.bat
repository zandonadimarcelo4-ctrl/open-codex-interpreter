@echo off
echo ============================================
echo Testando Configuracao do Ambiente
echo ============================================
echo.

:: Verificar Python
echo [1/4] Verificando Python...
python --version >nul 2>&1
if errorlevel 1 (
    echo ERRO: Python nao encontrado!
    echo Por favor, instale Python 3.10 ou superior.
    pause
    exit /b 1
)
python --version
echo.

:: Verificar ambiente virtual
echo [2/4] Verificando ambiente virtual...
if exist ".venv\Scripts\activate.bat" (
    echo Ambiente virtual encontrado.
    call .venv\Scripts\activate.bat
) else (
    echo AVISO: Ambiente virtual nao encontrado.
    echo Execute setup_windows.bat primeiro.
)
echo.

:: Verificar dependencias
echo [3/4] Verificando dependencias...
python -c "import fastapi; print('FastAPI: OK')" 2>nul || echo "FastAPI: FALTANDO"
python -c "import uvicorn; print('Uvicorn: OK')" 2>nul || echo "Uvicorn: FALTANDO"
python -c "import open_webui; print('Open WebUI: OK')" 2>nul || echo "Open WebUI: FALTANDO"
echo.

:: Verificar arquivo .env
echo [4/4] Verificando configuracao...
if exist ".env" (
    echo Arquivo .env encontrado.
) else (
    echo AVISO: Arquivo .env nao encontrado.
    echo Copiando env.example para .env...
    copy env.example .env >nul 2>&1
    if exist ".env" (
        echo Arquivo .env criado.
    )
)
echo.

:: Verificar diretorios
if not exist "data" mkdir data
if not exist "data\uploads" mkdir data\uploads
if not exist "data\cache" mkdir data\cache
echo Diretorios verificados.
echo.

echo ============================================
echo Teste concluido!
echo ============================================
echo.
echo Para iniciar o servidor, execute:
echo   start_windows.bat
echo.
pause

