# Script para configurar Firewall do Windows para AutoGen Agent Interface
# Execute como Administrador

Write-Host "🔧 Configurando Firewall do Windows para AutoGen Agent Interface..." -ForegroundColor Cyan

$port = 3000

# Verificar se já existe regra
$existingRule = Get-NetFirewallRule -DisplayName "AutoGen Agent Interface" -ErrorAction SilentlyContinue

if ($existingRule) {
    Write-Host "⚠️  Regra já existe. Removendo regra antiga..." -ForegroundColor Yellow
    Remove-NetFirewallRule -DisplayName "AutoGen Agent Interface" -ErrorAction SilentlyContinue
}

# Criar nova regra
try {
    New-NetFirewallRule -DisplayName "AutoGen Agent Interface" `
        -Direction Inbound `
        -LocalPort $port `
        -Protocol TCP `
        -Action Allow `
        -Profile Domain,Private,Public `
        -Description "Permite conexões na porta $port para AutoGen Agent Interface"
    
    Write-Host "✅ Regra de firewall criada com sucesso!" -ForegroundColor Green
    Write-Host "   Porta: $port" -ForegroundColor Gray
    Write-Host "   Protocolo: TCP" -ForegroundColor Gray
    Write-Host "   Ação: Allow" -ForegroundColor Gray
    Write-Host "   Perfis: Domain, Private, Public" -ForegroundColor Gray
} catch {
    Write-Host "❌ Erro ao criar regra de firewall:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Tente executar este script como Administrador:" -ForegroundColor Yellow
    Write-Host "   1. Clique com botão direito no PowerShell" -ForegroundColor Yellow
    Write-Host "   2. Selecione 'Executar como administrador'" -ForegroundColor Yellow
    Write-Host "   3. Execute o script novamente" -ForegroundColor Yellow
    exit 1
}

# Verificar regra criada
$rule = Get-NetFirewallRule -DisplayName "AutoGen Agent Interface" -ErrorAction SilentlyContinue
if ($rule) {
    Write-Host ""
    Write-Host "📋 Detalhes da regra criada:" -ForegroundColor Cyan
    Get-NetFirewallRule -DisplayName "AutoGen Agent Interface" | Format-List DisplayName, Direction, Action, Enabled, Profile
}

Write-Host ""
Write-Host "✅ Firewall configurado com sucesso!" -ForegroundColor Green
Write-Host "   Agora você pode acessar o servidor de outros PCs na rede." -ForegroundColor Gray

