@echo off
echo ========================================
echo Limpando cache do Parcel
echo ========================================
echo.

cd /d "%~dp0"

echo [1/3] Parando processos do Parcel...
taskkill /F /IM node.exe /FI "WINDOWTITLE eq Parcel Dev Server*" 2>nul
timeout /t 2 /nobreak >nul

echo [2/3] Removendo cache do Parcel...
if exist .parcel-cache (
    rmdir /s /q .parcel-cache
    echo ✅ Cache removido: .parcel-cache
) else (
    echo ℹ️  Cache não existe: .parcel-cache
)

if exist .parcel-dist (
    rmdir /s /q .parcel-dist
    echo ✅ Dist removido: .parcel-dist
) else (
    echo ℹ️  Dist não existe: .parcel-dist
)

echo [3/3] Limpeza concluída!
echo.
echo 💡 Agora reinicie o servidor com:
echo    npm run dev:all
echo.
echo ⚠️  IMPORTANTE: Acesse através do Express:
echo    http://localhost:3001/ (ou a porta que o Express estiver usando)
echo    NÃO acesse diretamente: http://localhost:5173/
echo.
pause

