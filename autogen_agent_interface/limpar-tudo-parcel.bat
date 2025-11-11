@echo off
echo ========================================
echo Limpando Cache do Parcel (SEGURO)
echo ========================================
echo.
echo ⚠️  ATENÇÃO: Este script APENAS remove cache do Parcel.
echo ⚠️  NÃO remove node_modules ou lock files.
echo.

cd /d "%~dp0"

echo [1/3] Parando processos do Parcel...
taskkill /F /IM node.exe /FI "WINDOWTITLE eq Parcel*" 2>nul
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

if exist .cache (
    rmdir /s /q .cache
    echo ✅ Cache adicional removido: .cache
) else (
    echo ℹ️  Cache adicional não existe: .cache
)

echo [3/3] Limpeza concluída!
echo.
echo ✅ node_modules e lock files foram MANTIDOS (não removidos)
echo.
echo 💡 Próximos passos:
echo    1. Execute: npm run dev:all
echo.
echo ⚠️  IMPORTANTE: Acesse através do Express:
echo    http://localhost:3001/ (ou a porta que aparecer nos logs)
echo.
pause
