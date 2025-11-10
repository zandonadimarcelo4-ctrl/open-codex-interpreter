# 🔧 Corrigir Erro do Parcel: EPERM system32

## ❌ Erro

```
Error: EPERM: operation not permitted, mkdir 'C:\Windows\system32\.parcel-cache'
```

## 🔍 Causa

O Parcel está tentando criar o cache em `C:\Windows\system32\` porque:
1. O comando foi executado do diretório errado (system32)
2. O Parcel não tem permissão para escrever em system32
3. O cache não está configurado para usar o diretório do projeto

## ✅ Solução

### 1. Sempre execute do diretório do projeto

```bash
# IMPORTANTE: Execute deste diretório!
cd E:\cordex\open-codex-interpreter\autogen_agent_interface

# Depois execute:
npm run dev:parcel
```

### 2. Usar os scripts fornecidos

**Opção A - Script PowerShell:**
```bash
cd E:\cordex\open-codex-interpreter\autogen_agent_interface
powershell -ExecutionPolicy Bypass -File start-dev.ps1
```

**Opção B - Script Batch:**
```bash
cd E:\cordex\open-codex-interpreter\autogen_agent_interface
dev-start.bat
```

### 3. Configurar cache manualmente

Se ainda tiver problemas, defina a variável de ambiente:

```bash
# Windows CMD
set PARCEL_CACHE_DIR=.parcel-cache
npx parcel serve client/index.html --host 0.0.0.0 --port 1234

# PowerShell
$env:PARCEL_CACHE_DIR=".parcel-cache"
npx parcel serve client/index.html --host 0.0.0.0 --port 1234
```

### 4. Verificar diretório atual

Antes de executar, sempre verifique:

```bash
# Windows CMD
cd
# Deve mostrar: E:\cordex\open-codex-interpreter\autogen_agent_interface

# PowerShell
pwd
# Deve mostrar: E:\cordex\open-codex-interpreter\autogen_agent_interface
```

## 🎯 Solução Definitiva

Os scripts foram atualizados para:
1. ✅ Mudar para o diretório correto automaticamente
2. ✅ Definir `PARCEL_CACHE_DIR=.parcel-cache` (no projeto)
3. ✅ Garantir que o cache seja criado no diretório do projeto

## 📝 Verificar se funcionou

Após executar o Parcel, você deve ver:
- ✅ Diretório `.parcel-cache` criado no projeto (não em system32)
- ✅ Parcel servindo em http://localhost:1234
- ✅ Sem erros de permissão

## 🐛 Se ainda tiver problemas

1. **Verificar permissões:**
   ```bash
   # Verificar se pode criar diretório no projeto
   mkdir .parcel-cache-test
   rmdir .parcel-cache-test
   ```

2. **Limpar cache antigo:**
   ```bash
   # Remover cache do system32 (se existir - precisa de admin)
   rmdir /s C:\Windows\system32\.parcel-cache
   ```

3. **Usar cache em outro lugar:**
   ```bash
   set PARCEL_CACHE_DIR=%TEMP%\.parcel-cache
   npx parcel serve client/index.html --host 0.0.0.0 --port 1234
   ```

## ✅ Próximos Passos

1. Execute o script `start-dev.ps1` ou `dev-start.bat`
2. Verifique se o cache é criado no projeto (`.parcel-cache/`)
3. Acesse http://localhost:3000 para ver a aplicação

