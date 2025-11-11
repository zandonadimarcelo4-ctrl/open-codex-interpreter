@echo off
REM Script para instalar modelos coder recomendados
REM Análise completa: ANALISE_MODELOS_CODER_EXECUTOR.md

echo ========================================
echo Instalando Modelos Coder Recomendados
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

REM Verificar VRAM disponível
echo ========================================
echo Verificando VRAM Disponível
echo ========================================
echo.
nvidia-smi --query-gpu=name,memory.total,memory.free --format=csv,noheader,nounits 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ⚠️ NVIDIA GPU não detectada. Modelos podem ser pesados.
    echo.
) else (
    echo ✅ GPU NVIDIA detectada
    echo.
)

echo ========================================
echo Modelos Recomendados
echo ========================================
echo.
echo 🥇 PRIMEIRA OPÇÃO: Cline_FuseO1 (RECOMENDADO)
echo    - Híbrido DeepSeekR1 + Qwen2.5
echo    - Contexto: 128K tokens
echo    - Tamanho: 20GB (q4_k_m)
echo    - VRAM: ~14-16GB (com offload)
echo    - Ideal para: Desenvolvimento, código longo, VS Code integration
echo.
echo 🥈 SEGUNDA OPÇÃO: Qwen2.5-Coder-32B (FALLBACK)
echo    - Official Qwen2.5-Coder
echo    - Contexto: 32K tokens
echo    - Tamanho: 19GB (q4_K_S)
echo    - VRAM: ~12-14GB
echo    - Ideal para: Produção, estável, oficial
echo.
echo 🥉 TERCEIRA OPÇÃO: Qwen3-30B-Coder-Tools (TESTES)
echo    - Qwen3 com Tools + Thinking
echo    - Contexto: 256K tokens
echo    - Tamanho: 19GB (Q4_0)
echo    - VRAM: ~14-16GB (com offload)
echo    - Ideal para: Código muito longo, raciocínio explícito
echo.

set /p INSTALL_CHOICE="Qual modelo instalar? (1=Cline_FuseO1, 2=Qwen2.5-Coder-32B, 3=Qwen3-30B, 4=Todos): "

if "%INSTALL_CHOICE%"=="1" goto INSTALL_CLINE
if "%INSTALL_CHOICE%"=="2" goto INSTALL_QWEN25
if "%INSTALL_CHOICE%"=="3" goto INSTALL_QWEN3
if "%INSTALL_CHOICE%"=="4" goto INSTALL_ALL
goto INVALID_CHOICE

:INSTALL_CLINE
echo.
echo ========================================
echo Instalando Cline_FuseO1 (RECOMENDADO)
echo ========================================
echo.
echo ⚠️ ATENÇÃO: Este modelo tem 20GB. Certifique-se de ter espaço suficiente.
echo.
pause
ollama pull nuibang/Cline_FuseO1-DeepSeekR1-Qwen2.5-Coder-32B-Preview:q4_k_m
if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ Cline_FuseO1 instalado com sucesso!
    echo.
    echo Configurando no .env...
    if exist "autogen_agent_interface\.env" (
        powershell -Command "(Get-Content 'autogen_agent_interface\.env') -replace 'EXECUTOR_MODEL=.*', 'EXECUTOR_MODEL=nuibang/Cline_FuseO1-DeepSeekR1-Qwen2.5-Coder-32B-Preview:q4_k_m' | Set-Content 'autogen_agent_interface\.env'"
        echo ✅ .env atualizado
    ) else (
        echo ⚠️ Arquivo .env não encontrado. Crie manualmente.
    )
) else (
    echo.
    echo ❌ Erro ao instalar Cline_FuseO1
    echo    Verifique sua conexão e espaço em disco.
)
goto END

:INSTALL_QWEN25
echo.
echo ========================================
echo Instalando Qwen2.5-Coder-32B (FALLBACK)
echo ========================================
echo.
echo ⚠️ ATENÇÃO: Este modelo tem 19GB. Certifique-se de ter espaço suficiente.
echo.
pause
ollama pull MHKetbi/Qwen2.5-Coder-32B-Instruct-Roo:q4_K_S
if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ Qwen2.5-Coder-32B instalado com sucesso!
    echo.
    echo Configurando no .env...
    if exist "autogen_agent_interface\.env" (
        powershell -Command "(Get-Content 'autogen_agent_interface\.env') -replace 'EXECUTOR_MODEL=.*', 'EXECUTOR_MODEL=MHKetbi/Qwen2.5-Coder-32B-Instruct-Roo:q4_K_S' | Set-Content 'autogen_agent_interface\.env'"
        echo ✅ .env atualizado
    ) else (
        echo ⚠️ Arquivo .env não encontrado. Crie manualmente.
    )
) else (
    echo.
    echo ❌ Erro ao instalar Qwen2.5-Coder-32B
    echo    Verifique sua conexão e espaço em disco.
)
goto END

:INSTALL_QWEN3
echo.
echo ========================================
echo Instalando Qwen3-30B-Coder-Tools (TESTES)
echo ========================================
echo.
echo ⚠️ ATENÇÃO: Este modelo tem 19GB. Certifique-se de ter espaço suficiente.
echo.
pause
ollama pull lucifers/qwen3-30B-coder-tools.Q4_0:latest
if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ Qwen3-30B-Coder-Tools instalado com sucesso!
    echo.
    echo Configurando no .env...
    if exist "autogen_agent_interface\.env" (
        powershell -Command "(Get-Content 'autogen_agent_interface\.env') -replace 'EXECUTOR_MODEL=.*', 'EXECUTOR_MODEL=lucifers/qwen3-30B-coder-tools.Q4_0:latest' | Set-Content 'autogen_agent_interface\.env'"
        echo ✅ .env atualizado
    ) else (
        echo ⚠️ Arquivo .env não encontrado. Crie manualmente.
    )
) else (
    echo.
    echo ❌ Erro ao instalar Qwen3-30B-Coder-Tools
    echo    Verifique sua conexão e espaço em disco.
)
goto END

:INSTALL_ALL
echo.
echo ========================================
echo Instalando Todos os Modelos
echo ========================================
echo.
echo ⚠️ ATENÇÃO: Isso vai instalar ~58GB de modelos!
echo    Certifique-se de ter espaço suficiente.
echo.
pause

echo.
echo Instalando Cline_FuseO1...
ollama pull nuibang/Cline_FuseO1-DeepSeekR1-Qwen2.5-Coder-32B-Preview:q4_k_m

echo.
echo Instalando Qwen2.5-Coder-32B...
ollama pull MHKetbi/Qwen2.5-Coder-32B-Instruct-Roo:q4_K_S

echo.
echo Instalando Qwen3-30B-Coder-Tools...
ollama pull lucifers/qwen3-30B-coder-tools.Q4_0:latest

echo.
echo ✅ Todos os modelos instalados!
echo.
echo Configurando .env com Cline_FuseO1 (recomendado)...
if exist "autogen_agent_interface\.env" (
    powershell -Command "(Get-Content 'autogen_agent_interface\.env') -replace 'EXECUTOR_MODEL=.*', 'EXECUTOR_MODEL=nuibang/Cline_FuseO1-DeepSeekR1-Qwen2.5-Coder-32B-Preview:q4_k_m' | Set-Content 'autogen_agent_interface\.env'"
    echo ✅ .env atualizado
) else (
    echo ⚠️ Arquivo .env não encontrado. Crie manualmente.
)
goto END

:INVALID_CHOICE
echo.
echo ❌ Escolha inválida. Use 1, 2, 3 ou 4.
goto END

:END
echo.
echo ========================================
echo ✅ Instalação Concluída!
echo ========================================
echo.
echo Próximos passos:
echo   1. Verificar modelos instalados: ollama list
echo   2. Testar modelo: ollama run [modelo] "Hello, world!"
echo   3. Verificar VRAM: nvidia-smi
echo   4. Reiniciar servidor para aplicar mudanças
echo.
echo 📚 Documentação:
echo    - ANALISE_MODELOS_CODER_EXECUTOR.md (análise completa)
echo    - GUIA_OLLAMA_CLOUD.md (guia Ollama Cloud)
echo.
pause

