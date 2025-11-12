@echo off
REM ============================================================================
REM Script para Iniciar Servidores e Fazer Build
REM ============================================================================
REM Este script:
REM - Faz build do frontend React (Apple)
REM - Inicia o backend Python (FastAPI)
REM - Inicia o servidor TypeScript (que serve o frontend React)
REM - Opcionalmente inicia o frontend Streamlit (basico)
REM ============================================================================

echo.
echo ============================================================================
echo   Iniciando Servidores e Fazendo Build
echo ============================================================================
echo.

REM Verificar se Python esta instalado
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERRO] Python nao encontrado. Instale Python 3.10+
    pause
    exit /b 1
)

REM Verificar se o script Python existe
if not exist "iniciar_servidor.py" (
    echo [ERRO] Arquivo iniciar_servidor.py nao encontrado
    pause
    exit /b 1
)

REM Verificar argumentos da linha de comando
set ARGS=%*

REM Se nao houver argumentos, usar modo padrao
if "%ARGS%"=="" (
    echo [INFO] Iniciando servidores no modo padrao...
    echo [INFO] Para mais opcoes, use: iniciar_servidor.bat --help
    echo.
    python iniciar_servidor.py
) else (
    REM Passar argumentos para o script Python
    python iniciar_servidor.py %ARGS%
)

REM Verificar se houve erro
if errorlevel 1 (
    echo.
    echo [ERRO] Erro ao iniciar servidores
    pause
    exit /b 1
)

REM Pausar apenas se executado diretamente (nao se chamado de outro script)
if "%1"=="" (
    pause
)

