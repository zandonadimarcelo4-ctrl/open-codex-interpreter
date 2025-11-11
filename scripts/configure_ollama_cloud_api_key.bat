@echo off
REM Script para configurar API Key do Ollama Cloud
REM API Key: dcfcdcf698474f3096020c0f1e5216b8.lB2uKkVruGztw1ZekdKFisTl

set API_KEY=dcfcdcf698474f3096020c0f1e5216b8.lB2uKkVruGztw1ZekdKFisTl

echo ========================================
echo Configurando Ollama Cloud API Key
echo ========================================
echo.

REM Verificar se estamos no diretório correto
if not exist "autogen_agent_interface\env.example" (
    echo ❌ Arquivo env.example não encontrado!
    echo    Execute este script da raiz do projeto.
    pause
    exit /b 1
)

echo ✅ Diretório correto encontrado
echo.

REM Configurar autogen_agent_interface/.env
echo ========================================
echo Configurando autogen_agent_interface/.env
echo ========================================
echo.

if not exist "autogen_agent_interface\.env" (
    echo ⚠️ Arquivo .env não encontrado. Copiando de env.example...
    copy "autogen_agent_interface\env.example" "autogen_agent_interface\.env"
    echo ✅ Arquivo .env criado
    echo.
)

echo Configurando API Key...
powershell -Command "(Get-Content 'autogen_agent_interface\.env') -replace 'OLLAMA_API_KEY=', 'OLLAMA_API_KEY=%API_KEY%' | Set-Content 'autogen_agent_interface\.env'"
powershell -Command "(Get-Content 'autogen_agent_interface\.env') -replace 'OLLAMA_CLOUD_ENABLED=false', 'OLLAMA_CLOUD_ENABLED=true' | Set-Content 'autogen_agent_interface\.env'"

echo ✅ API Key configurada no autogen_agent_interface/.env
echo.

REM Configurar .env na raiz (se existir)
if exist ".env" (
    echo ========================================
    echo Configurando .env na raiz
    echo ========================================
    echo.
    
    echo Configurando API Key...
    powershell -Command "(Get-Content '.env') -replace 'OLLAMA_API_KEY=', 'OLLAMA_API_KEY=%API_KEY%' | Set-Content '.env'"
    powershell -Command "(Get-Content '.env') -replace 'OLLAMA_CLOUD_ENABLED=false', 'OLLAMA_CLOUD_ENABLED=true' | Set-Content '.env'"
    
    echo ✅ API Key configurada no .env
    echo.
) else (
    echo ⚠️ Arquivo .env não encontrado na raiz (opcional)
    echo.
)

REM Configurar variável de ambiente do sistema (opcional)
echo ========================================
echo Configurando Variável de Ambiente do Sistema
echo ========================================
echo.
set /p SET_SYSTEM_ENV="Configurar variável de ambiente do sistema? (s/n): "
if /i "%SET_SYSTEM_ENV%"=="s" (
    echo.
    echo ⚠️ ATENÇÃO: Requer privilégios de administrador!
    echo.
    setx OLLAMA_API_KEY "%API_KEY%" /M
    if %ERRORLEVEL% EQU 0 (
        echo ✅ Variável de ambiente do sistema configurada
        echo    Reinicie o terminal para aplicar as mudanças.
    ) else (
        echo ❌ Erro ao configurar variável de ambiente do sistema
        echo    Execute como administrador ou configure manualmente.
    )
    echo.
) else (
    echo ⚠️ Variável de ambiente do sistema não configurada
    echo    Configure manualmente se necessário.
    echo.
)

REM Testar conexão com Ollama Cloud
echo ========================================
echo Testando Conexão com Ollama Cloud
echo ========================================
echo.

echo Testando API Key...
curl -s -X GET "https://ollama.com/api/tags" -H "Authorization: Bearer %API_KEY%" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo ✅ Conexão com Ollama Cloud bem-sucedida!
    echo.
    echo Listando modelos disponíveis...
    curl -s -X GET "https://ollama.com/api/tags" -H "Authorization: Bearer %API_KEY%" | findstr /i "qwen3-coder deepseek-v3.1 gpt-oss"
    echo.
) else (
    echo ❌ Erro ao testar conexão com Ollama Cloud
    echo    Verifique sua conexão com a internet e a API key.
    echo.
)

REM Verificar configuração
echo ========================================
echo Verificando Configuração
echo ========================================
echo.

echo Verificando autogen_agent_interface/.env...
findstr /i "OLLAMA_API_KEY OLLAMA_CLOUD_ENABLED" "autogen_agent_interface\.env"
echo.

if exist ".env" (
    echo Verificando .env na raiz...
    findstr /i "OLLAMA_API_KEY OLLAMA_CLOUD_ENABLED" ".env"
    echo.
)

echo ========================================
echo ✅ Configuração Concluída!
echo ========================================
echo.
echo API Key configurada:
echo   - autogen_agent_interface/.env ✅
if exist ".env" (
    echo   - .env (raiz) ✅
)
echo.
echo Ollama Cloud habilitado:
echo   - OLLAMA_CLOUD_ENABLED=true ✅
echo.
echo Próximos passos:
echo   1. Reinicie o servidor para aplicar mudanças
echo   2. Teste com: ollama run qwen3-coder:480b-cloud "Hello, world!"
echo   3. Verifique logs para confirmar uso do Cloud
echo.
echo 📚 Documentação:
echo    - GUIA_OLLAMA_CLOUD.md (guia completo)
echo    - https://docs.ollama.com/cloud (documentação oficial)
echo.
pause

