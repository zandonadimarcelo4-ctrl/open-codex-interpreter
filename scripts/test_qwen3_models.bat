@echo off
REM Script para testar modelos Qwen3 (Qwen3-30B-A3B e qwen3-32b-agent)
REM Comparar com Qwen2.5-32B-MoE atual

echo ========================================
echo Testando Modelos Qwen3
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

REM 1. Testar Qwen3-30B-A3B-Instruct-2507
echo ========================================
echo [1/2] Testando Qwen3-30B-A3B-Instruct-2507
echo ========================================
echo Modelo: alibayram/Qwen3-30B-A3B-Instruct-2507
echo Tamanho: 19GB (não quantizado)
echo Contexto: 256K tokens
echo MoE: Sim (3.3B ativados)
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

echo ✅ Qwen3-30B-A3B-Instruct-2507 baixado
echo.
ollama show alibayram/Qwen3-30B-A3B-Instruct-2507
echo.

REM 2. Testar qwen3-32b-agent
echo ========================================
echo [2/2] Testando qwen3-32b-agent
echo ========================================
echo Modelo: ExpedientFalcon/qwen3-32b-agent
echo Tamanho: ~20-30GB (dependendo da quantização)
echo Especialização: Agentes
echo.
echo ⚠️ ATENÇÃO: Este modelo é grande (32B denso)!
echo    Recomendado: Verificar tamanho e quantizar se necessário
echo.
pause

ollama pull ExpedientFalcon/qwen3-32b-agent
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Erro ao baixar qwen3-32b-agent
    pause
    exit /b 1
)

echo ✅ qwen3-32b-agent baixado
echo.
ollama show ExpedientFalcon/qwen3-32b-agent
echo.

REM Verificar modelos instalados
echo ========================================
echo Modelos Instalados
echo ========================================
echo.
ollama list | findstr /i "qwen3 qwen2.5-32b"
echo.

echo ========================================
echo ✅ Teste Concluído!
echo ========================================
echo.
echo Modelos testados:
echo   - Qwen3-30B-A3B-Instruct-2507 (19GB)
echo   - qwen3-32b-agent (~20-30GB)
echo.
echo Próximos passos:
echo   1. Verificar tamanho dos modelos (ollama show)
echo   2. Quantizar para Q4_K_M se necessário (~10-12GB)
echo   3. Testar tool calling e agentic behavior
echo   4. Comparar performance com Qwen2.5-32B-MoE
echo   5. Se melhor, migrar gradualmente
echo.
echo ⚠️ LEMBRE-SE: Ambos modelos são grandes!
echo    Quantize para Q4_K_M antes de usar em produção (16GB VRAM)
echo.
pause

