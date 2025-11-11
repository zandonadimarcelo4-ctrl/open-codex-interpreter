@echo off
REM Script para configurar arquitetura híbrida (Ollama Cloud + Local)
REM Cloud como cérebro principal, Local como fallback

echo ========================================
echo Configurando Arquitetura Híbrida
echo Ollama Cloud + Local com Fallback
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

REM Verificar se .env existe
if not exist "autogen_agent_interface\.env" (
    echo ⚠️ Arquivo .env não encontrado. Copiando de env.example...
    copy "autogen_agent_interface\env.example" "autogen_agent_interface\.env"
    echo ✅ Arquivo .env criado
    echo.
)

REM Configurar Ollama Cloud
echo ========================================
echo Configurando Ollama Cloud
echo ========================================
echo.
echo ⚠️ ATENÇÃO: Você precisa ter uma conta Ollama Cloud!
echo    Acesse: https://ollama.com/cloud
echo    Planos: Free, Pro ($20/mo), Max ($100/mo)
echo.
pause

set /p CLOUD_ENABLED="Habilitar Ollama Cloud? (s/n): "
if /i "%CLOUD_ENABLED%"=="s" (
    set /p CLOUD_MODEL="Modelo Cloud (qwen3-coder:480b-cloud ou deepseek-v3.1:671b-cloud): "
    set /p CLOUD_API_KEY="API Key (opcional para free tier): "
    
    echo.
    echo ✅ Configurando Ollama Cloud...
    echo    Modelo: %CLOUD_MODEL%
    echo    API Key: %CLOUD_API_KEY%
    echo.
    
    REM Atualizar .env
    powershell -Command "(Get-Content 'autogen_agent_interface\.env') -replace 'OLLAMA_CLOUD_ENABLED=false', 'OLLAMA_CLOUD_ENABLED=true' | Set-Content 'autogen_agent_interface\.env'"
    powershell -Command "(Get-Content 'autogen_agent_interface\.env') -replace 'OLLAMA_CLOUD_MODEL=qwen3-coder:480b-cloud', 'OLLAMA_CLOUD_MODEL=%CLOUD_MODEL%' | Set-Content 'autogen_agent_interface\.env'"
    if not "%CLOUD_API_KEY%"=="" (
        powershell -Command "(Get-Content 'autogen_agent_interface\.env') -replace 'OLLAMA_CLOUD_API_KEY=', 'OLLAMA_CLOUD_API_KEY=%CLOUD_API_KEY%' | Set-Content 'autogen_agent_interface\.env'"
    )
) else (
    echo.
    echo ⚠️ Ollama Cloud desabilitado. Usando apenas modelos locais.
    echo.
    powershell -Command "(Get-Content 'autogen_agent_interface\.env') -replace 'OLLAMA_CLOUD_ENABLED=true', 'OLLAMA_CLOUD_ENABLED=false' | Set-Content 'autogen_agent_interface\.env'"
)

REM Configurar Fallback
echo ========================================
echo Configurando Fallback Automático
echo ========================================
echo.
set /p FALLBACK_ENABLED="Habilitar fallback automático (Cloud → Local)? (s/n): "
if /i "%FALLBACK_ENABLED%"=="s" (
    echo ✅ Fallback automático habilitado
    powershell -Command "(Get-Content 'autogen_agent_interface\.env') -replace 'FALLBACK_ENABLED=false', 'FALLBACK_ENABLED=true' | Set-Content 'autogen_agent_interface\.env'"
) else (
    echo ⚠️ Fallback automático desabilitado
    powershell -Command "(Get-Content 'autogen_agent_interface\.env') -replace 'FALLBACK_ENABLED=true', 'FALLBACK_ENABLED=false' | Set-Content 'autogen_agent_interface\.env'"
)

echo.

REM Verificar modelos locais
echo ========================================
echo Verificando Modelos Locais
echo ========================================
echo.
ollama list | findstr /i "qwen2.5-32b deepseek-coder-v2-lite UIGEN-T1-Qwen-14"
echo.

REM Testar conexão Cloud (se habilitado)
if /i "%CLOUD_ENABLED%"=="s" (
    echo ========================================
    echo Testando Conexão Ollama Cloud
    echo ========================================
    echo.
    echo ⚠️ ATENÇÃO: Isso requer uma conta Ollama Cloud ativa!
    echo.
    pause
    
    REM Testar conexão (se possível)
    echo Testando conexão com Ollama Cloud...
    curl -s https://api.ollama.cloud/v1/models >nul 2>&1
    if %ERRORLEVEL% EQU 0 (
        echo ✅ Conexão com Ollama Cloud bem-sucedida!
    ) else (
        echo ⚠️ Não foi possível testar conexão. Verifique sua conta Ollama Cloud.
    )
    echo.
)

echo ========================================
echo ✅ Configuração Concluída!
echo ========================================
echo.
echo Arquitetura Híbrida configurada:
echo   - Cloud: %CLOUD_ENABLED%
echo   - Fallback: %FALLBACK_ENABLED%
echo.
echo Próximos passos:
echo   1. Verificar configuração no arquivo .env
echo   2. Testar conexão com Ollama Cloud (se habilitado)
echo   3. Testar fallback automático (desabilitar Cloud temporariamente)
echo   4. Reiniciar servidor para aplicar mudanças
echo.
echo 📚 Documentação:
echo    - ARQUITETURA_HIBRIDA_CLOUD_LOCAL.md (arquitetura completa)
echo    - THINKING_VS_INTELIGENCIA.md (análise técnica)
echo.
pause

