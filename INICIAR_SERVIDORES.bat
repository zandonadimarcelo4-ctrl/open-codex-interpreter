@echo off
SETLOCAL ENABLEDELAYEDEXPANSION

title Iniciando Backend e Frontend

echo.
echo ============================================
echo   Iniciando Backend e Frontend
echo ============================================
echo.

:: Iniciar Backend
echo [1/2] Iniciando Backend na porta 8080...
start "Backend Python - Porta 8080" cmd /k "cd /d %~dp0 && if exist .venv\Scripts\activate.bat (call .venv\Scripts\activate.bat && python -m uvicorn open_webui.main:app --host 0.0.0.0 --port 8080 --reload) else (python -m uvicorn open_webui.main:app --host 0.0.0.0 --port 8080 --reload)"

:: Aguardar backend iniciar
echo Aguardando backend iniciar (8 segundos)...
timeout /t 8 /nobreak >nul

:: Iniciar Frontend
echo [2/2] Iniciando Frontend na porta 3000...
cd autogen_agent_interface
if exist node_modules (
    start "Frontend Completo - Porta 3000" cmd /k "cd /d %~dp0autogen_agent_interface && set NODE_ENV=development && set PORT=3000 && set VITE_OPEN_WEBUI_API=http://localhost:8080/api && pnpm dev"
) else (
    echo Instalando dependencias do frontend...
    call pnpm install
    if errorlevel 1 (
        echo ERRO: Falha ao instalar dependencias!
        pause
        exit /b 1
    )
    start "Frontend Completo - Porta 3000" cmd /k "cd /d %~dp0autogen_agent_interface && set NODE_ENV=development && set PORT=3000 && set VITE_OPEN_WEBUI_API=http://localhost:8080/api && pnpm dev"
)
cd ..

echo.
echo ============================================
echo   Servidores Iniciados!
echo ============================================
echo.
echo Backend:  http://localhost:8080
echo   - API:  http://localhost:8080/api
echo   - Docs: http://localhost:8080/docs
echo.
echo Frontend: http://localhost:3000
echo   - Interface: http://localhost:3000
echo.
echo Janelas do Backend e Frontend foram abertas.
echo.
echo Pressione qualquer tecla para fechar esta janela...
pause >nul

exit /b 0

