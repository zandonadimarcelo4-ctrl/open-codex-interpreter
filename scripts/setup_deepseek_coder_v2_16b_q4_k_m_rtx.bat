@echo off
REM Script para configurar DeepSeek-Coder-V2:16b Q4_K_M otimizado para RTX NVIDIA
REM Windows Batch Script

echo ========================================
echo Configurando DeepSeek-Coder-V2:16b Q4_K_M
echo Otimizado para GPU NVIDIA RTX
echo ========================================
echo.

REM Verificar se Ollama está instalado
where ollama >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERRO] Ollama nao esta instalado!
    echo Por favor, instale o Ollama em: https://ollama.ai/download
    pause
    exit /b 1
)

echo [OK] Ollama encontrado
echo.

REM Verificar se modelo já está instalado
echo Verificando se modelo ja esta instalado...
ollama list | findstr /C:"deepseek-coder-v2:16b" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [OK] Modelo deepseek-coder-v2:16b ja esta instalado
) else (
    echo [INFO] Baixando modelo deepseek-coder-v2:16b...
    echo Isso pode demorar varios minutos (tamanho: 8.9GB)
    echo.
    ollama pull deepseek-coder-v2:16b
    if %ERRORLEVEL% NEQ 0 (
        echo [ERRO] Falha ao baixar o modelo
        pause
        exit /b 1
    )
    echo [OK] Modelo baixado com sucesso!
)

echo.
echo Criando modelo otimizado Q4_K_M para RTX...
cd /d "%~dp0.."

REM Verificar se Modelfile existe
if not exist "Modelfile.deepseek-coder-v2-16b-q4_k_m-rtx" (
    echo [ERRO] Modelfile.nao encontrado: Modelfile.deepseek-coder-v2-16b-q4_k_m-rtx
    pause
    exit /b 1
)

REM Criar modelo otimizado
ollama create deepseek-coder-v2-16b-q4_k_m-rtx -f Modelfile.deepseek-coder-v2-16b-q4_k_m-rtx
if %ERRORLEVEL% NEQ 0 (
    echo [ERRO] Falha ao criar modelo otimizado
    pause
    exit /b 1
)

echo [OK] Modelo otimizado criado: deepseek-coder-v2-16b-q4_k_m-rtx
echo.

REM Testar modelo
echo Testando modelo...
ollama run deepseek-coder-v2-16b-q4_k_m-rtx "Write a Python function to calculate fibonacci numbers" --verbose
if %ERRORLEVEL% EQU 0 (
    echo [OK] Modelo funcionando corretamente!
) else (
    echo [AVISO] Teste falhou, mas modelo pode estar funcionando
)

echo.
echo ========================================
echo Configuracao concluida!
echo ========================================
echo.
echo Modelo configurado: deepseek-coder-v2-16b-q4_k_m-rtx
echo Otimizado para: GPU NVIDIA RTX
echo.
echo Para testar o modelo, execute:
echo   ollama run deepseek-coder-v2-16b-q4_k_m-rtx "Write a Python function"
echo.
echo Para verificar uso de GPU:
echo   nvidia-smi
echo.
echo Para usar no projeto ANIMA, atualize o .env:
echo   DEFAULT_MODEL=deepseek-coder-v2-16b-q4_k_m-rtx
echo.
pause

