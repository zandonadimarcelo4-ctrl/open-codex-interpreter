@echo off
REM ============================================
REM Script para instalar DeepSeek-Coder-V2-Lite (Q4_K_M)
REM Executor rápido para código (complementa Qwen32B)
REM ============================================

echo ============================================
echo Instalando DeepSeek-Coder-V2-Lite (Q4_K_M)
echo Executor rapido para codigo
echo ============================================
echo.

REM Verificar se Ollama está instalado
where ollama >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERRO] Ollama nao esta instalado!
    pause
    exit /b 1
)

echo [INFO] Ollama encontrado!
echo.

REM Instalar modelo base
echo [INFO] Instalando modelo base deepseek-coder-v2-lite...
ollama pull deepseek-coder-v2-lite:instruct

if %ERRORLEVEL% EQU 0 (
    echo [SUCESSO] Modelo instalado!
) else (
    echo [ERRO] Falha ao instalar modelo!
    echo [INFO] Tentando alternativa: deepseek-coder:6.7b
    ollama pull deepseek-coder:6.7b
)

echo.
echo [INFO] Para usar como executor, configure:
echo        EXECUTOR_MODEL=deepseek-coder-v2-lite:instruct
echo.

pause

