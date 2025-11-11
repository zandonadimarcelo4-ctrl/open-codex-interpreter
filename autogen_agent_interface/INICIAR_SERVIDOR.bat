@echo off
echo ========================================
echo Iniciando Servidor com Build Inicial
echo ========================================
echo.

cd /d "%~dp0"

echo [1/5] Verificando processos existentes...
tasklist /FI "IMAGENAME eq node.exe" 2>nul | find /I /N "node.exe">nul
if "%ERRORLEVEL%"=="0" (
    echo ⚠️  Processos Node.js encontrados
    echo 💡 Se houver problemas, execute REINICIAR_SERVIDOR.bat primeiro
    timeout /t 2 /nobreak >nul
) else (
    echo ✅ Nenhum processo Node.js encontrado
)

echo.
echo [2/5] Verificando diretório de build...
if not exist .parcel-dist (
    echo ℹ️  Diretório de build não existe, será criado
) else (
    echo ✅ Diretório de build existe
)

echo.
echo [3/5] Fazendo build inicial do Parcel...
echo ⏳ Isso pode levar 10-30 segundos...
echo.
call npm run dev:parcel:build

echo.
echo [4/5] Verificando se os arquivos foram gerados...
timeout /t 2 /nobreak >nul
if exist .parcel-dist\index.html (
    echo ✅ index.html encontrado
    if exist .parcel-dist\*.js (
        echo ✅ Arquivos JavaScript encontrados
        echo ✅ Build inicial concluído com sucesso!
    ) else (
        echo ⚠️  Nenhum arquivo JavaScript encontrado
        echo 💡 O build pode não ter completado
        echo 💡 Verifique os logs acima
        pause
        exit /b 1
    )
) else (
    echo ❌ index.html não encontrado no diretório de build
    echo 💡 O build pode ter falhado
    echo 💡 Verifique os logs acima
    pause
    exit /b 1
)

echo.
echo [5/5] Iniciando servidores...
echo.
echo ⚠️  IMPORTANTE: 
echo    - Express servirá os arquivos estáticos
echo    - Parcel watch monitorará mudanças e fará rebuild automático
echo    - Aguarde alguns segundos para os servidores iniciarem
echo.

start "Express Backend Server" cmd /k "cd /d %~dp0 && npm run dev"
timeout /t 3 /nobreak >nul
start "Parcel Watch (Rebuild Automático)" cmd /k "cd /d %~dp0 && npm run dev:parcel:watch"

echo.
echo ========================================
echo Servidores iniciados!
echo ========================================
echo.
echo ✅ Build inicial: Concluído
echo ✅ Express: Iniciando...
echo ✅ Parcel Watch: Iniciando...
echo.
echo 🌐 Acesse a aplicação em:
echo    http://localhost:3000/ (ou a porta que aparecer nos logs)
echo.
echo 💡 Parcel watch fará rebuild automático quando você alterar arquivos
echo 💡 Express servirá os arquivos estáticos automaticamente
echo.
echo ⏳ Aguarde alguns segundos para os servidores iniciarem completamente
echo.
pause

