# Script para instalar dependências do STT (Speech-to-Text)
# Requer Python 3.8+ e pip

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Instalando dependências do STT" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se Python está instalado
Write-Host "Verificando Python..." -ForegroundColor Yellow
$pythonVersion = python --version 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Python não encontrado!" -ForegroundColor Red
    Write-Host "Por favor, instale Python 3.8 ou superior: https://www.python.org/downloads/" -ForegroundColor Yellow
    exit 1
}
Write-Host "✅ $pythonVersion" -ForegroundColor Green
Write-Host ""

# Verificar se pip está instalado
Write-Host "Verificando pip..." -ForegroundColor Yellow
$pipVersion = python -m pip --version 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ pip não encontrado!" -ForegroundColor Red
    Write-Host "Por favor, instale pip: python -m ensurepip --upgrade" -ForegroundColor Yellow
    exit 1
}
Write-Host "✅ $pipVersion" -ForegroundColor Green
Write-Host ""

# Atualizar pip
Write-Host "Atualizando pip..." -ForegroundColor Yellow
python -m pip install --upgrade pip
Write-Host ""

# Instalar dependências
Write-Host "Instalando faster-whisper..." -ForegroundColor Yellow
python -m pip install faster-whisper
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro ao instalar faster-whisper" -ForegroundColor Red
    exit 1
}
Write-Host "✅ faster-whisper instalado" -ForegroundColor Green
Write-Host ""

Write-Host "Instalando pydub..." -ForegroundColor Yellow
python -m pip install pydub
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro ao instalar pydub" -ForegroundColor Red
    exit 1
}
Write-Host "✅ pydub instalado" -ForegroundColor Green
Write-Host ""

# Verificar instalação
Write-Host "Verificando instalação..." -ForegroundColor Yellow
python -c "import faster_whisper; print('✅ faster-whisper: OK')"
python -c "import pydub; print('✅ pydub: OK')"

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "  ✅ Dependências do STT instaladas!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "O STT (Speech-to-Text) está pronto para usar." -ForegroundColor Cyan
Write-Host ""

