@echo off
SETLOCAL ENABLEDELAYEDEXPANSION

title Limpando Ambiente Virtual...

echo.
echo ============================================
echo   Limpando Ambiente Virtual
echo ============================================
echo.

echo Parando todos os processos Python...
taskkill /F /IM python.exe >nul 2>&1
taskkill /F /IM pythonw.exe >nul 2>&1
if errorlevel 1 (
    echo Nenhum processo Python encontrado.
) else (
    echo Processos Python parados.
)

echo.
echo Aguardando processos terminarem (3 segundos)...
timeout /t 3 /nobreak >nul

echo.
echo Removendo ambiente virtual...
if exist ".venv" (
    rmdir /s /q .venv 2>nul
    if exist ".venv" (
        echo AVISO: Nao foi possivel remover .venv completamente.
        echo Algum processo ainda pode estar usando os arquivos.
        echo.
        echo Tente:
        echo   1. Fechar todas as janelas do terminal
        echo   2. Fechar o VS Code ou outros editores
        echo   3. Executar este script novamente
        echo   4. Ou deletar manualmente a pasta .venv
    ) else (
        echo Ambiente virtual removido com sucesso!
    )
) else (
    echo Ambiente virtual nao encontrado.
)

echo.
echo Limpeza concluida!
echo.
echo Agora voce pode executar INICIAR.bat para criar um novo ambiente virtual.
echo.
pause

