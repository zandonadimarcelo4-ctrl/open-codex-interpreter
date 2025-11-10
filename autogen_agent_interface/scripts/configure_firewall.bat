@echo off
REM Script para configurar Firewall do Windows para AutoGen Agent Interface
REM Execute como Administrador

echo.
echo ========================================
echo   Configurar Firewall - AutoGen Agent
echo ========================================
echo.

REM Verificar se está executando como administrador
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [ERRO] Este script precisa ser executado como Administrador!
    echo.
    echo Como executar:
    echo 1. Clique com botao direito neste arquivo
    echo 2. Selecione "Executar como administrador"
    echo.
    pause
    exit /b 1
)

echo [INFO] Configurando Firewall do Windows...
echo.

REM Remover regra antiga se existir
netsh advfirewall firewall delete rule name="AutoGen Agent Interface" >nul 2>&1

REM Criar nova regra
netsh advfirewall firewall add rule name="AutoGen Agent Interface" dir=in action=allow protocol=TCP localport=3000

if %errorLevel% equ 0 (
    echo [OK] Regra de firewall criada com sucesso!
    echo.
    echo Porta: 3000
    echo Protocolo: TCP
    echo Acao: Allow
    echo.
) else (
    echo [ERRO] Falha ao criar regra de firewall!
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo   Firewall configurado com sucesso!
echo ========================================
echo.
echo Agora voce pode acessar o servidor de outros PCs na rede.
echo.
pause

