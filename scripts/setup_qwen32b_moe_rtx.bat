@echo off
REM ============================================
REM Script para instalar e configurar Qwen2.5-32B-Instruct-MoE (Q4_K_M)
REM Otimizado para RTX 4080 Super (16GB VRAM)
REM ============================================

echo ============================================
echo Instalando Qwen2.5-32B-Instruct-MoE (Q4_K_M)
echo Otimizado para RTX 4080 Super (16GB VRAM)
echo ============================================
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

REM Verificar GPU NVIDIA
echo [INFO] Verificando GPU NVIDIA...
nvidia-smi >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [AVISO] GPU NVIDIA nao detectada ou nvidia-smi nao disponivel
    echo O modelo ainda funcionara, mas pode ser mais lento
) else (
    echo [INFO] GPU NVIDIA detectada!
    nvidia-smi --query-gpu=name,memory.total --format=csv,noheader
)

echo.

REM Verificar se o modelo base já está instalado
echo [INFO] Verificando se o modelo base ja esta instalado...
ollama list | findstr /C:"qwen2.5:32b" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [INFO] Modelo base qwen2.5:32b ja esta instalado!
) else (
    echo [INFO] Modelo base nao encontrado. Instalando...
    echo [INFO] Isso pode demorar varios minutos (modelo grande)...
    ollama pull qwen2.5:32b
    if %ERRORLEVEL% NEQ 0 (
        echo [ERRO] Falha ao instalar modelo base!
        pause
        exit /b 1
    )
)

echo.

REM Criar modelo customizado com Modelfile
echo [INFO] Criando modelo customizado com Modelfile otimizado...
cd /d "%~dp0.."
if exist "Modelfile.qwen2.5-32b-instruct-moe-rtx" (
    ollama create qwen2.5-32b-instruct-moe-rtx -f Modelfile.qwen2.5-32b-instruct-moe-rtx
    if %ERRORLEVEL% EQU 0 (
        echo [SUCESSO] Modelo customizado criado: qwen2.5-32b-instruct-moe-rtx
    ) else (
        echo [ERRO] Falha ao criar modelo customizado!
        echo [INFO] Tentando usar modelo base diretamente...
        set MODEL_NAME=qwen2.5:32b
    )
) else (
    echo [AVISO] Modelfile nao encontrado. Usando modelo base.
    set MODEL_NAME=qwen2.5:32b
)

echo.

REM Verificar uso de VRAM
echo [INFO] Verificando uso de VRAM...
nvidia-smi --query-gpu=memory.used,memory.total --format=csv,noheader >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [INFO] VRAM atual:
    nvidia-smi --query-gpu=memory.used,memory.total --format=csv,noheader
    echo.
    echo [INFO] Apos carregar o modelo, a VRAM deve estar em ~12-14GB
    echo [INFO] Isso deixa ~2-4GB livres para cache e outros processos
)

echo.
echo ============================================
echo Instalacao concluida!
echo ============================================
echo.
echo [INFO] Para usar o modelo, configure no .env:
echo        DEFAULT_MODEL=qwen2.5-32b-instruct-moe-rtx
echo.
echo [INFO] Ou use o modelo base:
echo        DEFAULT_MODEL=qwen2.5:32b
echo.
echo [INFO] Testar o modelo:
echo        ollama run qwen2.5-32b-instruct-moe-rtx "Hello, como voce esta?"
echo.

pause

