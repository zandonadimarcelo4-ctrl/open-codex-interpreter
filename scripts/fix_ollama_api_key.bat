@echo off
REM Script para corrigir API key duplicada no .env

set API_KEY=dcfcdcf698474f3096020c0f1e5216b8.lB2uKkVruGztw1ZekdKFisTl

echo ========================================
echo Corrigindo API Key Duplicada
echo ========================================
echo.

cd /d "%~dp0.."

REM Corrigir autogen_agent_interface/.env
if exist "autogen_agent_interface\.env" (
    echo Corrigindo autogen_agent_interface/.env...
    powershell -Command "$content = Get-Content 'autogen_agent_interface\.env' -Raw; $content = $content -replace 'OLLAMA_API_KEY=.*', 'OLLAMA_API_KEY=%API_KEY%'; $content | Set-Content 'autogen_agent_interface\.env' -NoNewline"
    echo ✅ Corrigido
    echo.
    
    echo Verificando...
    powershell -Command "Get-Content 'autogen_agent_interface\.env' | Select-String 'OLLAMA_API_KEY'"
    echo.
) else (
    echo ⚠️ Arquivo autogen_agent_interface/.env não encontrado
    echo.
)

REM Corrigir .env na raiz
if exist ".env" (
    echo Corrigindo .env na raiz...
    powershell -Command "$content = Get-Content '.env' -Raw; $content = $content -replace 'OLLAMA_API_KEY=.*', 'OLLAMA_API_KEY=%API_KEY%'; $content | Set-Content '.env' -NoNewline"
    echo ✅ Corrigido
    echo.
    
    echo Verificando...
    powershell -Command "Get-Content '.env' | Select-String 'OLLAMA_API_KEY'"
    echo.
) else (
    echo ⚠️ Arquivo .env na raiz não encontrado
    echo.
)

echo ========================================
echo ✅ Correção Concluída!
echo ========================================
echo.
pause

