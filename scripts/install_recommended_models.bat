@echo off
REM Script para instalar modelos recomendados para orquestração inteligente
REM Brain: Qwen2.5-32B-MoE (já instalado)
REM Executor: DeepSeek-Coder-V2-Lite (Q4_K_M) - código geral
REM Executor UI: UIGEN-T1-Qwen-14 (Q4_K_S) - UI especializado

echo ========================================
echo Instalando Modelos Recomendados
echo ========================================
echo.

REM Verificar se Ollama está instalado
where ollama >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Ollama não encontrado! Instale o Ollama primeiro.
    echo    Download: https://ollama.com/download
    pause
    exit /b 1
)

echo ✅ Ollama encontrado
echo.

REM 1. Instalar Executor de Código Geral (DeepSeek-Coder-V2-Lite Q4_K_M)
echo ========================================
echo [1/2] Instalando Executor de Código Geral
echo ========================================
echo Modelo: networkjohnny/deepseek-coder-v2-lite-base-q4_k_m-gguf
echo Tamanho: ~6-8GB
echo Uso: Código geral (Python, JavaScript, etc.)
echo.
ollama pull networkjohnny/deepseek-coder-v2-lite-base-q4_k_m-gguf
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Erro ao instalar DeepSeek-Coder-V2-Lite
    pause
    exit /b 1
)
echo ✅ DeepSeek-Coder-V2-Lite instalado
echo.

REM 2. Instalar Executor UI Especializado (UIGEN-T1-Qwen-14 Q4_K_S)
echo ========================================
echo [2/2] Instalando Executor UI Especializado
echo ========================================
echo Modelo: MHKetbi/UIGEN-T1-Qwen-14:q4_K_S
echo Tamanho: ~8.6GB
echo Uso: UI/HTML/CSS (dashboards, landing pages, forms)
echo.
ollama pull MHKetbi/UIGEN-T1-Qwen-14:q4_K_S
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Erro ao instalar UIGEN-T1-Qwen-14
    pause
    exit /b 1
)
echo ✅ UIGEN-T1-Qwen-14 instalado
echo.

REM Verificar instalação
echo ========================================
echo Verificando Instalação
echo ========================================
echo.
ollama list | findstr /i "deepseek-coder-v2-lite UIGEN-T1-Qwen-14 qwen2.5-32b"
echo.

echo ========================================
echo ✅ Instalação Concluída!
echo ========================================
echo.
echo Modelos instalados:
echo   - Brain: qwen2.5-32b-instruct-moe-rtx (já instalado)
echo   - Executor (código): networkjohnny/deepseek-coder-v2-lite-base-q4_k_m-gguf
echo   - Executor (UI): MHKetbi/UIGEN-T1-Qwen-14:q4_K_S
echo.
echo Próximos passos:
echo   1. Atualize o arquivo .env com os modelos:
echo      EXECUTOR_MODEL=networkjohnny/deepseek-coder-v2-lite-base-q4_k_m-gguf
echo      EXECUTOR_UI_MODEL=MHKetbi/UIGEN-T1-Qwen-14:q4_K_S
echo   2. Reinicie o servidor para aplicar as mudanças
echo.
pause

