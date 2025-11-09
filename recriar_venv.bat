@echo off
echo ============================================
echo Recriando Ambiente Virtual
echo ============================================
echo.

:: Remover ambiente virtual corrompido
if exist ".venv" (
    echo Removendo ambiente virtual corrompido...
    rmdir /s /q .venv
    if errorlevel 1 (
        echo AVISO: Nao foi possivel remover .venv completamente.
        echo Tente fechar todas as janelas e executar novamente.
        pause
        exit /b 1
    )
)

:: Criar novo ambiente virtual
echo Criando novo ambiente virtual...
python -m venv .venv
if errorlevel 1 (
    echo ERRO: Falha ao criar ambiente virtual!
    pause
    exit /b 1
)

:: Ativar ambiente virtual
echo Ativando ambiente virtual...
call .venv\Scripts\activate.bat

:: Atualizar pip
echo Atualizando pip...
python -m pip install --upgrade pip setuptools wheel
if errorlevel 1 (
    echo ERRO: Falha ao atualizar pip!
    pause
    exit /b 1
)

:: Instalar dependencias basicas primeiro
echo.
echo Instalando dependencias basicas...
pip install --no-cache-dir fastapi==0.118.0 "uvicorn[standard]==0.37.0" pydantic==2.11.9 python-multipart==0.0.20
if errorlevel 1 (
    echo ERRO: Falha ao instalar dependencias basicas!
    pause
    exit /b 1
)

echo.
echo ============================================
echo Ambiente Virtual Recriado!
echo ============================================
echo.
echo Dependencias basicas instaladas.
echo Para instalar todas as dependencias, execute:
echo   pip install -r requirements.txt
echo.
echo Para iniciar o backend, execute:
echo   iniciar_backend.bat
echo.
pause

