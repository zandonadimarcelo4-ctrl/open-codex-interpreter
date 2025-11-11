@echo off
echo ========================================
echo Reiniciando Servidor com Parcel Watch
echo ========================================
echo.

cd /d "%~dp0"

echo [1/6] Parando processos existentes...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul
echo ✅ Processos parados

echo.
echo [2/6] Limpando cache do Parcel...
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

echo.
echo [3/6] Aguardando 3 segundos...
timeout /t 3 /nobreak >nul

echo.
echo [4/6] Fazendo build inicial do Parcel...
echo ⏳ Isso pode levar 10-30 segundos...
echo 💡 Aguarde até ver "✨ Built in XXXms"
echo.

call npm run dev:parcel:build
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ Erro no build do Parcel!
    echo 💡 Verifique os erros acima
    pause
    exit /b 1
)

echo.
echo ✅ Build inicial concluído!

echo.
echo [5/6] Verificando arquivos de build...
if exist .parcel-dist\index.html (
    echo ✅ Arquivos de build encontrados!
) else (
    echo ❌ index.html não encontrado!
    echo 💡 O build pode ter falhado
    pause
    exit /b 1
)

echo.
echo [6/6] Iniciando servidores (Express + Parcel Watch)...
echo.
echo ⚠️  IMPORTANTE: 
echo    - Express serve os arquivos estáticos diretamente
echo    - Parcel watch monitora mudanças e faz rebuild automático
echo    - Acesse: http://localhost:3000/ (ou a porta que aparecer nos logs)
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
