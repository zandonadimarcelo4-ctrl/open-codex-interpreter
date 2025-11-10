# Script para configurar Tailscale Funnel para AutoGen Agent Interface
# Execute no PC servidor

param(
    [int]$Port = 3000,
    [switch]$Stop = $false
)

Write-Host "🌐 Configuração do Tailscale Funnel" -ForegroundColor Cyan
Write-Host ""

# Verificar se o Tailscale está instalado
Write-Host "1️⃣ Verificando se o Tailscale está instalado..." -ForegroundColor Yellow
try {
    $tailscaleVersion = & tailscale version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Tailscale está instalado!" -ForegroundColor Green
        Write-Host "      $($tailscaleVersion -split "`n" | Select-Object -First 1)" -ForegroundColor Gray
    } else {
        Write-Host "   ❌ Tailscale não está instalado!" -ForegroundColor Red
        Write-Host "      Baixe em: https://tailscale.com/download" -ForegroundColor Yellow
        Write-Host "      Depois de instalar, execute este script novamente." -ForegroundColor Yellow
        exit 1
    }
} catch {
    Write-Host "   ❌ Tailscale não está instalado ou não está no PATH!" -ForegroundColor Red
    Write-Host "      Baixe em: https://tailscale.com/download" -ForegroundColor Yellow
    Write-Host "      Depois de instalar, execute este script novamente." -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Verificar se o Tailscale está rodando
Write-Host "2️⃣ Verificando se o Tailscale está rodando..." -ForegroundColor Yellow
try {
    $tailscaleStatus = & tailscale status 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Tailscale está rodando!" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Tailscale não está rodando!" -ForegroundColor Red
        Write-Host "      Inicie o Tailscale e tente novamente." -ForegroundColor Yellow
        exit 1
    }
} catch {
    Write-Host "   ❌ Erro ao verificar status do Tailscale!" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Parar o Funnel se solicitado
if ($Stop) {
    Write-Host "3️⃣ Parando Tailscale Funnel na porta $Port..." -ForegroundColor Yellow
    try {
        & tailscale funnel --bg --off $Port 2>&1 | Out-Null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "   ✅ Tailscale Funnel parado com sucesso!" -ForegroundColor Green
        } else {
            Write-Host "   ⚠️  Não havia Funnel ativo na porta $Port" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "   ❌ Erro ao parar Tailscale Funnel!" -ForegroundColor Red
        Write-Host "      $($_.Exception.Message)" -ForegroundColor Gray
    }
    exit 0
}

# Verificar se já existe um Funnel ativo
Write-Host "3️⃣ Verificando Funnel existente..." -ForegroundColor Yellow
try {
    $funnelStatus = & tailscale funnel status 2>&1
    if ($LASTEXITCODE -eq 0 -and $funnelStatus -match ":$Port") {
        Write-Host "   ✅ Já existe um Funnel ativo na porta $Port!" -ForegroundColor Green
        if ($funnelStatus -match "https://[^\s]+") {
            $funnelUrl = $Matches[0]
            Write-Host "      URL: $funnelUrl" -ForegroundColor Cyan
            Write-Host "      WebSocket: $($funnelUrl -replace 'https://', 'wss://')/ws" -ForegroundColor Cyan
        }
        Write-Host ""
        Write-Host "   💡 Para parar o Funnel, execute:" -ForegroundColor Yellow
        Write-Host "      .\setup_tailscale_funnel.ps1 -Stop" -ForegroundColor Gray
        exit 0
    } else {
        Write-Host "   ℹ️  Nenhum Funnel ativo na porta $Port" -ForegroundColor Gray
    }
} catch {
    Write-Host "   ⚠️  Não foi possível verificar Funnel existente" -ForegroundColor Yellow
}

Write-Host ""

# Iniciar o Funnel
Write-Host "4️⃣ Iniciando Tailscale Funnel na porta $Port..." -ForegroundColor Yellow
try {
    $funnelOutput = & tailscale funnel --bg $Port 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Tailscale Funnel iniciado com sucesso!" -ForegroundColor Green
        
        # Tentar extrair a URL do output
        if ($funnelOutput -match "https://[^\s]+") {
            $funnelUrl = $Matches[0]
            Write-Host ""
            Write-Host "   🌐 URL do Funnel:" -ForegroundColor Cyan
            Write-Host "      HTTP:  $funnelUrl" -ForegroundColor White
            Write-Host "      WS:    $($funnelUrl -replace 'https://', 'wss://')/ws" -ForegroundColor White
        } else {
            Write-Host ""
            Write-Host "   💡 Para ver a URL do Funnel, execute:" -ForegroundColor Yellow
            Write-Host "      tailscale funnel status" -ForegroundColor Gray
        }
        
        Write-Host ""
        Write-Host "   📝 Para configurar o servidor para iniciar o Funnel automaticamente:" -ForegroundColor Yellow
        Write-Host "      1. Adicione ao arquivo .env:" -ForegroundColor Gray
        Write-Host "         USE_TAILSCALE_FUNNEL=true" -ForegroundColor White
        Write-Host "      2. Reinicie o servidor" -ForegroundColor Gray
        
        Write-Host ""
        Write-Host "   💡 Para parar o Funnel, execute:" -ForegroundColor Yellow
        Write-Host "      .\setup_tailscale_funnel.ps1 -Stop" -ForegroundColor Gray
        Write-Host "      OU" -ForegroundColor Gray
        Write-Host "      tailscale funnel --bg --off $Port" -ForegroundColor Gray
    } else {
        Write-Host "   ❌ Erro ao iniciar Tailscale Funnel!" -ForegroundColor Red
        Write-Host "      Output: $funnelOutput" -ForegroundColor Gray
        Write-Host ""
        Write-Host "   💡 Possíveis causas:" -ForegroundColor Yellow
        Write-Host "      - Tailscale não está autenticado (execute: tailscale up)" -ForegroundColor Gray
        Write-Host "      - Funnel não está habilitado na sua conta Tailscale" -ForegroundColor Gray
        Write-Host "      - Porta já está em uso por outro Funnel" -ForegroundColor Gray
        exit 1
    }
} catch {
    Write-Host "   ❌ Erro ao iniciar Tailscale Funnel!" -ForegroundColor Red
    Write-Host "      $($_.Exception.Message)" -ForegroundColor Gray
    exit 1
}

Write-Host ""

