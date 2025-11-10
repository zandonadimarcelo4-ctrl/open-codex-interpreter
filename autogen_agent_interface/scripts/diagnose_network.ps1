# Script de Diagnóstico de Rede para AutoGen Agent Interface
# Execute no PC servidor

Write-Host "🔍 Diagnóstico de Rede - AutoGen Agent Interface" -ForegroundColor Cyan
Write-Host ""

# 1. Verificar IPs de rede
Write-Host "1️⃣ Verificando IPs de rede..." -ForegroundColor Yellow
$networkInterfaces = Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike "127.*" -and $_.IPAddress -notlike "169.254.*" }
if ($networkInterfaces) {
    Write-Host "   ✅ IPs de rede encontrados:" -ForegroundColor Green
    foreach ($interface in $networkInterfaces) {
        Write-Host "      - $($interface.IPAddress) ($($interface.InterfaceAlias))" -ForegroundColor Gray
    }
} else {
    Write-Host "   ❌ Nenhum IP de rede encontrado!" -ForegroundColor Red
    Write-Host "      Verifique se o PC está conectado à rede." -ForegroundColor Yellow
}

Write-Host ""

# 2. Verificar regras de firewall
Write-Host "2️⃣ Verificando regras de firewall..." -ForegroundColor Yellow
$firewallRules = Get-NetFirewallRule -DisplayName "AutoGen Agent Interface" -ErrorAction SilentlyContinue
if ($firewallRules) {
    Write-Host "   ✅ Regra de firewall encontrada:" -ForegroundColor Green
    foreach ($rule in $firewallRules) {
        $filters = Get-NetFirewallPortFilter -AssociatedNetFirewallRule $rule
        Write-Host "      - Nome: $($rule.DisplayName)" -ForegroundColor Gray
        Write-Host "        Direção: $($rule.Direction)" -ForegroundColor Gray
        Write-Host "        Ação: $($rule.Action)" -ForegroundColor Gray
        Write-Host "        Habilitado: $($rule.Enabled)" -ForegroundColor Gray
        Write-Host "        Porta: $($filters.LocalPort)" -ForegroundColor Gray
        Write-Host "        Protocolo: $($filters.Protocol)" -ForegroundColor Gray
    }
} else {
    Write-Host "   ❌ Regra de firewall NÃO encontrada!" -ForegroundColor Red
    Write-Host "      Execute o script configure_firewall.ps1 como Administrador." -ForegroundColor Yellow
}

Write-Host ""

# 3. Verificar se a porta está escutando
Write-Host "3️⃣ Verificando se a porta 3000 está escutando..." -ForegroundColor Yellow
$listeningPorts = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue
if ($listeningPorts) {
    Write-Host "   ✅ Porta 3000 está escutando:" -ForegroundColor Green
    foreach ($port in $listeningPorts) {
        $localAddress = $port.LocalAddress
        Write-Host "      - IP: $localAddress" -ForegroundColor Gray
        Write-Host "        Estado: $($port.State)" -ForegroundColor Gray
        if ($localAddress -eq "0.0.0.0") {
            Write-Host "        ✅ Escutando em todas as interfaces (0.0.0.0)" -ForegroundColor Green
        } elseif ($localAddress -eq "127.0.0.1") {
            Write-Host "        ⚠️  Escutando apenas em localhost (127.0.0.1)" -ForegroundColor Yellow
            Write-Host "           Isso impede conexões de outros PCs!" -ForegroundColor Red
        } else {
            Write-Host "        ⚠️  Escutando apenas em $localAddress" -ForegroundColor Yellow
        }
    }
} else {
    Write-Host "   ❌ Porta 3000 NÃO está escutando!" -ForegroundColor Red
    Write-Host "      O servidor pode não estar rodando." -ForegroundColor Yellow
}

Write-Host ""

# 4. Verificar processos na porta 3000
Write-Host "4️⃣ Verificando processos na porta 3000..." -ForegroundColor Yellow
$processes = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
if ($processes) {
    foreach ($pid in $processes) {
        $process = Get-Process -Id $pid -ErrorAction SilentlyContinue
        if ($process) {
            Write-Host "   ✅ Processo encontrado:" -ForegroundColor Green
            Write-Host "      - PID: $pid" -ForegroundColor Gray
            Write-Host "      - Nome: $($process.ProcessName)" -ForegroundColor Gray
            Write-Host "      - Caminho: $($process.Path)" -ForegroundColor Gray
        }
    }
} else {
    Write-Host "   ⚠️  Nenhum processo encontrado na porta 3000" -ForegroundColor Yellow
}

Write-Host ""

# 5. Testar conectividade local
Write-Host "5️⃣ Testando conectividade local..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/test" -TimeoutSec 5 -ErrorAction Stop
    Write-Host "   ✅ Servidor responde localmente!" -ForegroundColor Green
    Write-Host "      Status: $($response.StatusCode)" -ForegroundColor Gray
} catch {
    Write-Host "   ❌ Servidor NÃO responde localmente!" -ForegroundColor Red
    Write-Host "      Erro: $($_.Exception.Message)" -ForegroundColor Gray
}

Write-Host ""

# 6. Resumo e recomendações
Write-Host "📋 Resumo e Recomendações:" -ForegroundColor Cyan
Write-Host ""

$hasNetworkIP = $networkInterfaces -ne $null
$hasFirewallRule = $firewallRules -ne $null
$isListening = $listeningPorts -ne $null
$listeningOnAll = ($listeningPorts | Where-Object { $_.LocalAddress -eq "0.0.0.0" }) -ne $null

if (-not $hasNetworkIP) {
    Write-Host "   ❌ Nenhum IP de rede detectado" -ForegroundColor Red
    Write-Host "      → Verifique se o PC está conectado à rede Wi-Fi/Ethernet" -ForegroundColor Yellow
}

if (-not $hasFirewallRule) {
    Write-Host "   ❌ Regra de firewall não encontrada" -ForegroundColor Red
    Write-Host "      → Execute: .\configure_firewall.ps1 (como Administrador)" -ForegroundColor Yellow
}

if (-not $isListening) {
    Write-Host "   ❌ Porta 3000 não está escutando" -ForegroundColor Red
    Write-Host "      → Inicie o servidor: npm run dev" -ForegroundColor Yellow
}

if ($isListening -and -not $listeningOnAll) {
    Write-Host "   ⚠️  Servidor não está escutando em 0.0.0.0" -ForegroundColor Yellow
    Write-Host "      → Verifique a configuração do servidor" -ForegroundColor Yellow
}

if ($hasNetworkIP -and $hasFirewallRule -and $listeningOnAll) {
    Write-Host "   ✅ Tudo configurado corretamente!" -ForegroundColor Green
    Write-Host ""
    Write-Host "   Para acessar de outro PC, use:" -ForegroundColor Cyan
    foreach ($interface in $networkInterfaces) {
        Write-Host "      http://$($interface.IPAddress):3000/" -ForegroundColor White
    }
}

Write-Host ""

