@echo off
REM Script para verificar se AutoGen e Open Interpreter usam o mesmo modelo na mesma instância
echo ========================================
echo Verificando Mesma Instancia do Modelo
echo AutoGen + Open Interpreter
echo ========================================
echo.

cd /d "%~dp0\.."

REM Verificar se Python está disponível
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERRO] Python nao encontrado.
    pause
    exit /b 1
)

REM Executar script de verificação
python scripts\verify_same_model_instance.py

if errorlevel 1 (
    echo.
    echo [ERRO] Verificacao falhou.
    pause
    exit /b 1
)

echo.
echo ========================================
echo Verificacao concluida!
echo ========================================
pause

