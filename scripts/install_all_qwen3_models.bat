@echo off
REM Script para instalar TODOS os modelos Qwen3 recomendados
REM Brain: Qwen3-30B-A3B (thinking e non-thinking)
REM Executor: DeepSeek-Coder-V2-Lite
REM Executor UI: UIGEN-T1-Qwen-14

echo ========================================
echo Instalando TODOS os Modelos Qwen3 Recomendados
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

REM ========================================
REM 1. BRAIN: Qwen3-30B-A3B-Thinking-2507-Deepseek-v3.1-Distill (Thinking + Distilação)
REM ========================================
echo ========================================
echo [1/5] Instalando Brain com Thinking (Deepseek Distill)
echo ========================================
echo Modelo: ukjin/Qwen3-30B-A3B-Thinking-2507-Deepseek-v3.1-Distill
echo Tamanho: 19GB (não quantizado)
echo Contexto: 256K tokens
echo Modo: Thinking explícito
echo Características: Reasoning melhorado (herda do DeepSeek-V3.1), menos overthink
echo.
echo ⚠️ ATENÇÃO: Este modelo é grande (19GB)!
echo    Recomendado: Quantizar para Q4_K_M (~10-12GB) antes de usar
echo.
pause

ollama pull ukjin/Qwen3-30B-A3B-Thinking-2507-Deepseek-v3.1-Distill
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Erro ao baixar Qwen3-30B-A3B-Thinking-2507-Deepseek-v3.1-Distill
    pause
    exit /b 1
)

echo ✅ Qwen3-30B-A3B-Thinking-2507-Deepseek-v3.1-Distill instalado
echo.

REM ========================================
REM 2. BRAIN: Qwen3-30B-A3B-Thinking-2507-Unsloth (Thinking + Quantização Unsloth)
REM ========================================
echo ========================================
echo [2/5] Instalando Brain com Thinking (Unsloth Quantizado)
echo ========================================
echo Modelo: danielsheep/Qwen3-30B-A3B-Thinking-2507-Unsloth:UD-Q4_K_XL
echo Tamanho: 18GB (já quantizado)
echo Contexto: 256K tokens
echo Modo: Thinking explícito
echo Características: Quantização Unsloth Dynamic 2.0 (SOTA)
echo.
echo ⚠️ ATENÇÃO: Este modelo é grande (18GB)!
echo    Pode ser apertado em 16GB VRAM (precisa otimização)
echo.
pause

ollama pull danielsheep/Qwen3-30B-A3B-Thinking-2507-Unsloth:UD-Q4_K_XL
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Erro ao baixar Qwen3-30B-A3B-Thinking-2507-Unsloth
    pause
    exit /b 1
)

echo ✅ Qwen3-30B-A3B-Thinking-2507-Unsloth instalado
echo.

REM ========================================
REM 3. BRAIN: Qwen3-30B-A3B-Instruct-2507 (Non-Thinking)
REM ========================================
echo ========================================
echo [3/5] Instalando Brain sem Thinking (Non-Thinking)
echo ========================================
echo Modelo: alibayram/Qwen3-30B-A3B-Instruct-2507
echo Tamanho: 19GB (não quantizado)
echo Contexto: 256K tokens
echo Modo: Non-thinking (raciocínio interno silencioso)
echo Características: Mais rápido, mais eficiente, ideal para produção
echo.
echo ⚠️ ATENÇÃO: Este modelo é grande (19GB)!
echo    Recomendado: Quantizar para Q4_K_M (~10-12GB) antes de usar
echo.
pause

ollama pull alibayram/Qwen3-30B-A3B-Instruct-2507
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Erro ao baixar Qwen3-30B-A3B-Instruct-2507
    pause
    exit /b 1
)

echo ✅ Qwen3-30B-A3B-Instruct-2507 instalado
echo.

REM ========================================
REM 4. EXECUTOR: DeepSeek-Coder-V2-Lite (Código Geral)
REM ========================================
echo ========================================
echo [4/5] Instalando Executor de Código Geral
echo ========================================
echo Modelo: networkjohnny/deepseek-coder-v2-lite-base-q4_k_m-gguf
echo Tamanho: ~6-8GB (quantizado Q4_K_M)
echo Uso: Código geral (Python, JavaScript, etc.)
echo Características: Sem thinking (execução direta), foco em ação
echo.
ollama pull networkjohnny/deepseek-coder-v2-lite-base-q4_k_m-gguf
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Erro ao baixar DeepSeek-Coder-V2-Lite
    pause
    exit /b 1
)

echo ✅ DeepSeek-Coder-V2-Lite instalado
echo.

REM ========================================
REM 5. EXECUTOR UI: UIGEN-T1-Qwen-14 (UI Especializado)
REM ========================================
echo ========================================
echo [5/5] Instalando Executor UI Especializado
echo ========================================
echo Modelo: MHKetbi/UIGEN-T1-Qwen-14:q4_K_S
echo Tamanho: ~8.6GB (quantizado Q4_K_S)
echo Uso: UI/HTML/CSS (dashboards, landing pages, forms)
echo Características: Chain-of-thought reasoning para UI
echo.
ollama pull MHKetbi/UIGEN-T1-Qwen-14:q4_K_S
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Erro ao baixar UIGEN-T1-Qwen-14
    pause
    exit /b 1
)

echo ✅ UIGEN-T1-Qwen-14 instalado
echo.

REM Verificar modelos instalados
echo ========================================
echo Modelos Instalados
echo ========================================
echo.
ollama list | findstr /i "qwen3 deepseek-coder-v2-lite UIGEN-T1-Qwen-14"
echo.

echo ========================================
echo ✅ Instalação Concluída!
echo ========================================
echo.
echo Modelos instalados:
echo   - Brain (Thinking + Distilação): ukjin/Qwen3-30B-A3B-Thinking-2507-Deepseek-v3.1-Distill
echo   - Brain (Thinking + Unsloth): danielsheep/Qwen3-30B-A3B-Thinking-2507-Unsloth:UD-Q4_K_XL
echo   - Brain (Non-Thinking): alibayram/Qwen3-30B-A3B-Instruct-2507
echo   - Executor (Código): networkjohnny/deepseek-coder-v2-lite-base-q4_k_m-gguf
echo   - Executor (UI): MHKetbi/UIGEN-T1-Qwen-14:q4_K_S
echo.
echo Próximos passos:
echo   1. Verificar tamanho dos modelos (ollama show)
echo   2. Quantizar modelos grandes para Q4_K_M se necessário (~10-12GB)
echo   3. Configurar .env com os modelos apropriados
echo   4. Testar orquestração com modelos novos
echo   5. Comparar performance (thinking vs non-thinking)
echo.
echo ⚠️ LEMBRE-SE: Modelos thinking são melhores para desenvolvimento!
echo    Modelos non-thinking são melhores para produção (performance otimizada)
echo.
echo 📚 Documentação:
echo    - THINKING_VS_INTELIGENCIA.md (análise técnica)
echo    - ANALISE_THINKING_MODELOS.md (análise dos modelos)
echo    - ORQUESTRACAO_INTELIGENTE_MODELOS.md (configuração)
echo.
pause

