@echo off
SETLOCAL ENABLEDELAYEDEXPANSION

echo ============================================
echo Iniciando Backend + Frontend
echo ============================================
echo.

:: Iniciar Backend em janela separada
echo [1/2] Iniciando Backend (porta 8080)...
start "Backend Python - Porta 8080" cmd /k "cd /d %~dp0 && iniciar_backend.bat"

:: Aguardar backend iniciar
echo Aguardando backend iniciar (5 segundos)...
timeout /t 5 /nobreak >nul

:: Iniciar Frontend em janela separada
echo [2/2] Iniciando Frontend (porta 3000)...
start "Frontend Completo - Porta 3000" cmd /k "cd /d %~dp0 && iniciar_frontend.bat"

echo.
echo ============================================
echo Servidores Iniciados!
echo ============================================
echo.
echo Backend:  http://localhost:8080
echo   - API:  http://localhost:8080/api
echo   - Docs: http://localhost:8080/docs
echo.
echo Frontend: http://localhost:3000
echo   - Interface: http://localhost:3000
echo   - Landing:   http://localhost:3000/
echo   - Home:      http://localhost:3000/app
echo.
echo Janelas do Backend e Frontend foram abertas.
echo Pressione qualquer tecla para parar os servidores...
pause >nul

:: Parar servidores
echo.
echo Parando servidores...
taskkill /FI "WINDOWTITLE eq Backend Python*" /T /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq Frontend Completo*" /T /F >nul 2>&1
echo Servidores parados.

exit /b

