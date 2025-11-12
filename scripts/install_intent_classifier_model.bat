@echo off
REM Script para instalar o modelo classificador de intenção (Mistral 7B Instruct)
REM Este modelo é leve, rápido e excelente para classificação de intenção com JSON estruturado

echo ============================================
echo Instalando Modelo Classificador de Intencao
echo ============================================
echo.
echo Modelo: mistral:7b-instruct
echo VRAM necessaria: ~4-5GB
echo Uso: Classificacao de intencao (execution vs conversation)
echo.

REM Verificar se o Ollama está instalado
where ollama >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERRO] Ollama nao esta instalado ou nao esta no PATH.
    echo Por favor, instale o Ollama primeiro: https://ollama.com
    pause
    exit /b 1
)

echo [INFO] Ollama encontrado. Instalando modelo...
echo.

REM Instalar o modelo Mistral 7B Instruct
ollama pull mistral:7b-instruct

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ============================================
    echo [SUCESSO] Modelo instalado com sucesso!
    echo ============================================
    echo.
    echo O modelo 'mistral:7b-instruct' esta pronto para uso.
    echo Ele sera usado automaticamente pelo classificador de intencao.
    echo.
    echo Para testar, execute:
    echo   python interpreter/intent_classifier.py "Olá, como você está?"
    echo.
) else (
    echo.
    echo ============================================
    echo [ERRO] Falha ao instalar o modelo
    echo ============================================
    echo.
    echo Verifique sua conexao com a internet e tente novamente.
    echo.
)

pause

