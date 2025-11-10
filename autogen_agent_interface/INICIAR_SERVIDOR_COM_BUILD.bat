@echo off
chcp 65001 >nul
echo ========================================
echo 🚀 Iniciar Servidor com Build Vite
echo ========================================
echo.

cd /d "%~dp0"

echo [1/5] Parando processos existentes...
taskkill /F /IM node.exe 2>nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ Processos parados
    timeout /t 2 /nobreak >nul
) else (
    echo ℹ️  Nenhum processo encontrado
)

echo.
echo [2/5] Limpando cache e builds antigos...
if exist .parcel-cache (
    rmdir /s /q .parcel-cache 2>nul
    echo ✅ Cache Parcel removido
)
if exist .parcel-dist (
    rmdir /s /q .parcel-dist 2>nul
    echo ✅ Build antigo removido
)
if exist node_modules\.vite (
    rmdir /s /q node_modules\.vite 2>nul
    echo ✅ Cache Vite removido
)
echo ✅ Limpeza concluída
timeout /t 1 /nobreak >nul

echo.
echo [3/5] Verificando dependências...
if not exist node_modules (
    echo ⚠️  node_modules não encontrado
    echo 💡 Instalando dependências...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo ❌ Erro ao instalar dependências
        pause
        exit /b 1
    )
) else (
    echo ✅ Dependências encontradas
)

echo.
echo [4/5] Fazendo build inicial com Vite...
echo ⏳ Isso pode levar 10-30 segundos...
echo 💡 Aguarde até ver "built in XXXms"
echo.

call npm run dev:vite:build
set BUILD_EXIT_CODE=%ERRORLEVEL%

echo.
echo Verificando resultado do build...

timeout /t 2 /nobreak >nul

if exist .parcel-dist\index.html (
    echo ✅ index.html encontrado
    if exist .parcel-dist\*.js (
        echo ✅ Arquivos JavaScript encontrados
        echo ✅ Build inicial concluído com sucesso!
    ) else (
        echo ❌ Nenhum arquivo JavaScript encontrado
        echo 💡 O build pode não ter completado
        echo 💡 Verifique os logs acima
        pause
        exit /b 1
    )
) else (
    echo ❌ index.html não encontrado!
    echo 💡 O build pode ter falhado
    echo 💡 Verifique os logs acima
    pause
    exit /b 1
)

echo.
echo [5/5] Iniciando servidores...
echo.
echo ⚠️  IMPORTANTE: 
echo    - Express servirá os arquivos estáticos do .parcel-dist
echo    - Vite watch monitorará mudanças e fará rebuild automático
echo    - Aguarde alguns segundos para os servidores iniciarem
echo.

start "Express Backend Server" cmd /k "cd /d %~dp0 && npm run dev"
timeout /t 3 /nobreak >nul
start "Vite Watch (Rebuild Automático)" cmd /k "cd /d %~dp0 && npm run dev:vite:watch"

echo.
echo ========================================
echo ✅ Servidores Iniciados!
echo ========================================
echo.
echo 📋 Status:
echo    ✅ Build inicial: Concluído
echo    ✅ Express: Iniciando...
echo    ✅ Vite Watch: Iniciando...
echo.
echo 🌐 Acesse a aplicação em:
echo    http://localhost:3000/ (ou a porta que aparecer nos logs)
echo.
echo 💡 Vite watch:
echo    - Monitora mudanças nos arquivos
echo    - Faz rebuild automático quando você salva
echo    - Express serve os novos arquivos automaticamente
echo.
echo ⏳ Aguarde alguns segundos para os servidores iniciarem completamente
echo    Você verá as mensagens de inicialização nas janelas abertas
echo.
echo 💡 Para parar os servidores, feche as janelas ou pressione Ctrl+C
echo.
pause
