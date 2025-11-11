@echo off
echo ========================================
echo Iniciando servidor de desenvolvimento
echo ========================================
echo.

echo [1/2] Iniciando Parcel (Frontend)...
cd /d "%~dp0"
set PARCEL_CACHE_DIR=.parcel-cache
start "Parcel Dev Server" cmd /k "cd /d %~dp0 && set PARCEL_CACHE_DIR=.parcel-cache && npx parcel serve client/index.html --dist-dir .parcel-dist --host 0.0.0.0 --port 5173"

echo.
echo Aguardando 5 segundos para o Parcel iniciar...
timeout /t 5 /nobreak >nul

echo.
echo [2/2] Iniciando Express (Backend)...
echo.
npm run dev

pause

