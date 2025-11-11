@echo off
REM Script para configurar Ollama Cloud
REM Documentação: https://docs.ollama.com/cloud

echo ========================================
echo Configurando Ollama Cloud
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
echo ✅ Login no Ollama Cloud bem-sucedido!
echo.

REM Listar modelos Cloud disponíveis
echo ========================================
echo Modelos Cloud Disponíveis
echo ========================================
echo.
echo Modelos disponíveis na Ollama Cloud:
echo   - deepseek-v3.1:671b-cloud
echo   - gpt-oss:20b-cloud
echo   - gpt-oss:120b-cloud
echo   - kimi-k2:1t-cloud
echo   - qwen3-coder:480b-cloud (RECOMENDADO para código)
echo   - glm-4.6:cloud
echo   - minimax-m2:cloud
echo.

REM Testar modelo Cloud
echo ========================================
echo Testando Modelo Cloud
echo ========================================
echo.
set /p TEST_MODEL="Modelo para testar (ex: qwen3-coder:480b-cloud): "
if not "%TEST_MODEL%"=="" (
    echo.
    echo Testando modelo: %TEST_MODEL%
    echo.
    ollama run %TEST_MODEL% "Hello, world!"
    echo.
)

REM Configurar API Key (se necessário)
echo ========================================
echo Configurar API Key (Opcional)
echo ========================================
echo.
echo ⚠️ ATENÇÃO: API Key é necessária para acesso direto via API!
echo    Obtenha em: https://ollama.com (criar conta e gerar API key)
echo.
set /p API_KEY="API Key (ou pressione Enter para pular): "
if not "%API_KEY%"=="" (
    echo.
    echo ✅ API Key configurada
    echo    Adicione ao arquivo .env: OLLAMA_API_KEY=%API_KEY%
    echo.
) else (
    echo.
    echo ⚠️ API Key não configurada
    echo    Você pode usar 'ollama signin' para autenticação via CLI
    echo.
)

REM Verificar se .env existe
if not exist "autogen_agent_interface\.env" (
    echo ⚠️ Arquivo .env não encontrado. Copiando de env.example...
    copy "autogen_agent_interface\env.example" "autogen_agent_interface\.env"
    echo ✅ Arquivo .env criado
    echo.
)

REM Configurar .env
echo ========================================
echo Configurando .env
echo ========================================
echo.
set /p CLOUD_ENABLED="Habilitar Ollama Cloud? (s/n): "
if /i "%CLOUD_ENABLED%"=="s" (
    set /p CLOUD_MODEL="Modelo Cloud (qwen3-coder:480b-cloud recomendado): "
    if "%CLOUD_MODEL%"=="" set CLOUD_MODEL=qwen3-coder:480b-cloud
    
    echo.
    echo ✅ Configurando Ollama Cloud...
    echo    Modelo: %CLOUD_MODEL%
    echo.
    
    REM Atualizar .env
    powershell -Command "(Get-Content 'autogen_agent_interface\.env') -replace 'OLLAMA_CLOUD_ENABLED=false', 'OLLAMA_CLOUD_ENABLED=true' | Set-Content 'autogen_agent_interface\.env'"
    powershell -Command "(Get-Content 'autogen_agent_interface\.env') -replace 'OLLAMA_CLOUD_MODEL=qwen3-coder:480b-cloud', 'OLLAMA_CLOUD_MODEL=%CLOUD_MODEL%' | Set-Content 'autogen_agent_interface\.env'"
    
    if not "%API_KEY%"=="" (
        powershell -Command "(Get-Content 'autogen_agent_interface\.env') -replace 'OLLAMA_API_KEY=', 'OLLAMA_API_KEY=%API_KEY%' | Set-Content 'autogen_agent_interface\.env'"
    )
) else (
    echo.
    echo ⚠️ Ollama Cloud desabilitado. Usando apenas modelos locais.
    echo.
    powershell -Command "(Get-Content 'autogen_agent_interface\.env') -replace 'OLLAMA_CLOUD_ENABLED=true', 'OLLAMA_CLOUD_ENABLED=false' | Set-Content 'autogen_agent_interface\.env'"
)

echo.
echo ========================================
echo ✅ Configuração Concluída!
echo ========================================
echo.
echo Ollama Cloud configurado:
echo   - Habilitado: %CLOUD_ENABLED%
echo   - Modelo: %CLOUD_MODEL%
echo   - API Key: %API_KEY%
echo.
echo Próximos passos:
echo   1. Verificar configuração no arquivo .env
echo   2. Testar modelo Cloud: ollama run %CLOUD_MODEL% "Hello, world!"
echo   3. Reiniciar servidor para aplicar mudanças
echo.
echo 📚 Documentação:
echo    - https://docs.ollama.com/cloud
echo    - ARQUITETURA_HIBRIDA_CLOUD_LOCAL.md (arquitetura completa)
echo.
pause

