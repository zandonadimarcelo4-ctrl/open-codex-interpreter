@echo off
SETLOCAL ENABLEDELAYEDEXPANSION

echo ============================================
echo Corrigindo Instalacao Python
echo ============================================
echo.

:: Ativar ambiente virtual
if exist ".venv\Scripts\activate.bat" (
    echo Ativando ambiente virtual...
    call .venv\Scripts\activate.bat
) else (
    echo Criando ambiente virtual...
    python -m venv .venv
    call .venv\Scripts\activate.bat
)

:: Atualizar pip
echo.
echo [1/4] Atualizando pip...
python -m pip install --upgrade pip --no-cache-dir
if errorlevel 1 (
    echo ERRO ao atualizar pip!
    pause
    exit /b 1
)

:: Limpar cache
echo.
echo [2/4] Limpando cache do pip...
pip cache purge

:: Instalar dependencias basicas primeiro
echo.
echo [3/4] Instalando dependencias basicas...
pip install --no-cache-dir fastapi==0.118.0 uvicorn[standard]==0.37.0 pydantic==2.11.9
if errorlevel 1 (
    echo ERRO ao instalar dependencias basicas!
    pause
    exit /b 1
)

:: Instalar dependencias restantes
echo.
echo [4/4] Instalando dependencias restantes...
pip install --no-cache-dir -r requirements.txt
if errorlevel 1 (
    echo AVISO: Algumas dependencias podem ter falhado.
    echo Tentando instalar sem cache...
    pip install --no-cache-dir --no-deps -r requirements.txt 2>nul
)

echo.
echo ============================================
echo Instalacao concluida!
echo ============================================
echo.
echo Testando importacoes basicas...
python -c "import fastapi; print('FastAPI: OK')" 2>nul || echo "FastAPI: ERRO"
python -c "import uvicorn; print('Uvicorn: OK')" 2>nul || echo "Uvicorn: ERRO"
python -c "import open_webui; print('Open WebUI: OK')" 2>nul || echo "Open WebUI: ERRO"
echo.
pause

