# Script para organizar repositório
# Move arquivos desnecessários para diretórios apropriados

$root = Get-Location

# Criar diretórios se não existirem
@("docs", "scripts", "archive", "temp") | ForEach-Object {
    if (-not (Test-Path $_)) {
        New-Item -ItemType Directory -Path $_ | Out-Null
    }
}

# Mover arquivos .md (exceto README.md na raiz)
Get-ChildItem -Path $root -Filter "*.md" -File | Where-Object { $_.Name -ne "README.md" } | ForEach-Object {
    Move-Item -Path $_.FullName -Destination "docs\" -Force -ErrorAction SilentlyContinue
    Write-Host "Movido: $($_.Name) -> docs/"
}

# Mover arquivos .bat
Get-ChildItem -Path $root -Filter "*.bat" -File | ForEach-Object {
    Move-Item -Path $_.FullName -Destination "scripts\" -Force -ErrorAction SilentlyContinue
    Write-Host "Movido: $($_.Name) -> scripts/"
}

# Mover arquivos .zip
Get-ChildItem -Path $root -Filter "*.zip" -File | ForEach-Object {
    Move-Item -Path $_.FullName -Destination "archive\" -Force -ErrorAction SilentlyContinue
    Write-Host "Movido: $($_.Name) -> archive/"
}

# Mover arquivos soltos na raiz que deveriam estar em archive
$arquivosSoltos = @("*.tsx", "*.ts", "*.py", "*.png", "*.json", "*.css", "*.html", "*.txt", "*.xml", "*.sh", "*.ini", "*.lock", "*.toml")
$arquivosSoltos | ForEach-Object {
    Get-ChildItem -Path $root -Filter $_ -File | Where-Object { 
        $_.Name -notmatch "^(package\.json|tsconfig\.json|requirements\.txt|pyproject\.toml|poetry\.lock|LICENSE|README\.md)$" 
    } | ForEach-Object {
        Move-Item -Path $_.FullName -Destination "archive\" -Force -ErrorAction SilentlyContinue
        Write-Host "Movido: $($_.Name) -> archive/"
    }
}

# Mover diretórios antigos
$diretoriosAntigos = @("interpreter", "dev_framework", "open_webui", "static", "data", "tests")
$diretoriosAntigos | ForEach-Object {
    if (Test-Path $_) {
        Move-Item -Path $_ -Destination "archive\" -Force -ErrorAction SilentlyContinue
        Write-Host "Movido: $_ -> archive/"
    }
}

# Mover temp_audio se existir
if (Test-Path "temp_audio") {
    Move-Item -Path "temp_audio" -Destination "temp\" -Force -ErrorAction SilentlyContinue
    Write-Host "Movido: temp_audio -> temp/"
}

Write-Host "`n✅ Organização concluída!"

