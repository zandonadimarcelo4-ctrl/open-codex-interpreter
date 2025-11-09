@echo off
SETLOCAL ENABLEDELAYEDEXPANSION

echo ============================================
echo Open Codex Interpreter - Setup
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

:: Criar ambiente virtual
echo [2/5] Criando ambiente virtual...
if not exist ".venv" (
    python -m venv .venv
    echo Ambiente virtual criado.
) else (
    echo Ambiente virtual ja existe.
)
echo.

:: Ativar ambiente virtual
echo [3/5] Ativando ambiente virtual...
call .venv\Scripts\activate.bat
echo.

:: Instalar dependencias
echo [4/5] Instalando dependencias...
python -m pip install --upgrade pip
pip install -r requirements.txt
echo.

:: Criar arquivo .env se nao existir
echo [5/5] Configurando variaveis de ambiente...
if not exist ".env" (
    echo Criando arquivo .env a partir do .env.example...
    copy .env.example .env >nul
    echo Arquivo .env criado. Por favor, edite-o com suas configuracoes.
) else (
    echo Arquivo .env ja existe.
)
echo.

:: Criar diretorios necessarios
if not exist "data" mkdir data
if not exist "data\uploads" mkdir data\uploads
if not exist "data\cache" mkdir data\cache
echo Diretorios criados.
echo.

echo ============================================
echo Setup concluido!
echo ============================================
echo.
echo Para iniciar o servidor, execute:
echo   start_windows.bat
echo.
echo Ou use:
echo   python -m open_codex serve
echo.
echo A interface web estara disponivel em:
echo   http://localhost:8080
echo.
pause

