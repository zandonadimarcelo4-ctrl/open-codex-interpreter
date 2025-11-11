# Script PowerShell para iniciar servidor de desenvolvimento
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Iniciando servidor de desenvolvimento" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se está no diretório correto
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Erro: package.json não encontrado!" -ForegroundColor Red
    Write-Host "💡 Execute este script no diretório autogen_agent_interface" -ForegroundColor Yellow
    exit 1
}

# Verificar se node_modules existe
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Instalando dependências..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Erro ao instalar dependências!" -ForegroundColor Red
        Write-Host "💡 Tente executar: npm install manualmente" -ForegroundColor Yellow
        exit 1
    }
}

Write-Host ""
Write-Host "[1/2] Iniciando Parcel (Frontend) na porta 5173..." -ForegroundColor Green
$parcelCmd = "cd '$PWD'; `$env:PARCEL_CACHE_DIR='.parcel-cache'; npx parcel serve client/index.html --dist-dir .parcel-dist --host 0.0.0.0 --port 5173"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $parcelCmd

Write-Host ""
Write-Host "Aguardando 8 segundos para o Parcel iniciar..." -ForegroundColor Yellow
Start-Sleep -Seconds 8

Write-Host ""
Write-Host "[2/2] Iniciando Express (Backend) na porta 3000..." -ForegroundColor Green
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Servidor iniciado!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📍 Acesse:" -ForegroundColor Cyan
Write-Host "   - Localhost: http://localhost:3000" -ForegroundColor White
Write-Host "   - LAN: http://SEU-IP:3000" -ForegroundColor White
Write-Host "   - Tailscale: https://revision-pc.tailb3613b.ts.net" -ForegroundColor White
Write-Host ""
Write-Host "⚠️  Para parar: Pressione Ctrl+C" -ForegroundColor Yellow
Write-Host ""

# Iniciar Express
npm run dev

