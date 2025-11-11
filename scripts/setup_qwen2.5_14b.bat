@echo off
REM ============================================
REM Script para instalar Qwen2.5:14b no Ollama
REM Modelo que suporta function calling (tools)
REM ============================================

echo ============================================
echo Instalando Qwen2.5:14b no Ollama
echo ============================================
echo.
echo Este modelo:
echo - Suporta function calling (tools)
echo - Muito inteligente e bom em codigo
echo - Tamanho: ~8-9GB
echo.

REM Verificar se Ollama está instalado
where ollama >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERRO] Ollama nao esta instalado!
    echo Por favor, instale o Ollama primeiro: https://ollama.ai
    pause
    exit /b 1
)

echo [INFO] Ollama encontrado!
echo.

REM Verificar se o modelo já está instalado
echo [INFO] Verificando se o modelo ja esta instalado...
ollama list | findstr /C:"qwen2.5:14b" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [INFO] Modelo qwen2.5:14b ja esta instalado!
    echo.
    echo [INFO] Para usar o modelo, configure:
    echo        DEFAULT_MODEL=qwen2.5:14b
    echo.
    pause
    exit /b 0
)

echo [INFO] Modelo nao encontrado. Instalando...
echo.

REM Instalar o modelo
echo [INFO] Baixando modelo qwen2.5:14b (isso pode demorar alguns minutos)...
ollama pull qwen2.5:14b

if %ERRORLEVEL% EQU 0 (
    echo.
    echo [SUCESSO] Modelo qwen2.5:14b instalado com sucesso!
    echo.
    echo [INFO] Para usar o modelo, configure no .env:
    echo        DEFAULT_MODEL=qwen2.5:14b
    echo.
    echo [INFO] Alternativas:
    echo        - qwen2.5:32b (mais inteligente, maior ~20GB)
    echo        - qwen2.5:7b (mais rapido, menor ~4GB)
    echo        - llama3.2:3b (menor, ~2GB)
    echo.
) else (
    echo.
    echo [ERRO] Falha ao instalar o modelo!
    echo.
    echo [INFO] Tente instalar manualmente:
    echo        ollama pull qwen2.5:14b
    echo.
)

pause

