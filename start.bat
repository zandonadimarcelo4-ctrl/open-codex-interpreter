@echo off
REM Script de inicialização moderno (wrapper para start.js)
REM Substitui os scripts .bat antigos

echo ============================================
echo 🚀 AutoGen Agent Interface
echo ============================================
echo.

REM Verificar se Node.js está instalado
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Erro: Node.js não encontrado!
    echo Instale Node.js: https://nodejs.org/
    pause
    exit /b 1
)

REM Verificar se pnpm está instalado
where pnpm >nul 2>nul
if %errorlevel% neq 0 (
    echo ⚠️  pnpm não encontrado, usando npm...
    echo Para melhor performance, instale pnpm: npm install -g pnpm
    echo.
)

REM Executar script Node.js
node start.js

if %errorlevel% neq 0 (
    echo.
    echo ❌ Erro ao iniciar servidor!
    pause
    exit /b 1
)

