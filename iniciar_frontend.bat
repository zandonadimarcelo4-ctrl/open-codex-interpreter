@echo off
SETLOCAL ENABLEDELAYEDEXPANSION

echo ============================================
echo Iniciando Frontend Completo
echo ============================================
echo.

:: Verificar Node.js
where node >nul 2>&1
if errorlevel 1 (
    echo ERRO: Node.js nao encontrado!
    echo Por favor, instale Node.js 18 ou superior.
    pause
    exit /b 1
)

:: Verificar pnpm
where pnpm >nul 2>&1
if errorlevel 1 (
    echo Instalando pnpm...
    call npm install -g pnpm
    if errorlevel 1 (
        echo ERRO: Falha ao instalar pnpm!
        pause
        exit /b 1
    )
)

:: Verificar diretorio
if not exist "autogen_agent_interface" (
    echo ERRO: Diretorio autogen_agent_interface nao encontrado!
    pause
    exit /b 1
)

:: Ir para diretorio do frontend
cd autogen_agent_interface

:: Verificar dependencias
if not exist "node_modules" (
    echo Instalando dependencias do frontend...
    call pnpm install
    if errorlevel 1 (
        echo ERRO: Falha ao instalar dependencias!
        cd ..
        pause
        exit /b 1
    )
)

:: Criar .env se nao existir
if not exist ".env" (
    if exist "env.example" (
        copy env.example .env >nul
        echo Arquivo .env criado.
    )
)

:: Configurar variaveis de ambiente
set NODE_ENV=development
set PORT=3000
set VITE_OPEN_WEBUI_API=http://localhost:8080/api
set VITE_API_BASE_URL=http://localhost:3000/api

:: Iniciar frontend
echo.
echo ============================================
echo Iniciando Frontend na porta 3000...
echo ============================================
echo.
echo Frontend: http://localhost:3000
echo Landing:  http://localhost:3000/
echo Home:     http://localhost:3000/app
echo Showcase: http://localhost:3000/showcase
echo.
echo Pressione Ctrl+C para parar o servidor
echo.

call pnpm dev

