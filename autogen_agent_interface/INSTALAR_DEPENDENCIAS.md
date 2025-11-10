# 📦 Instalar Dependências - Parcel

## ❌ Erro

```
Error [ERR_MODULE_NOT_FOUND]: Cannot find package 'http-proxy-middleware'
Cannot find module "@parcel/config-default"
```

## ✅ Solução

Execute os seguintes comandos para instalar as dependências:

### Opção 1: Usando pnpm (Recomendado)

```bash
cd E:\cordex\open-codex-interpreter\autogen_agent_interface
pnpm install
```

### Opção 2: Usando npm

```bash
cd E:\cordex\open-codex-interpreter\autogen_agent_interface
npm install
```

### Opção 3: Instalar manualmente as dependências faltantes

```bash
cd E:\cordex\open-codex-interpreter\autogen_agent_interface

# Instalar dependências do Parcel
pnpm add -D @parcel/config-default parcel

# Instalar http-proxy-middleware
pnpm add -D http-proxy-middleware

# Instalar npm-run-all (para script dev:all)
pnpm add -D npm-run-all
```

## 🔍 Verificar Instalação

Após instalar, verifique se os pacotes estão instalados:

```bash
# Verificar Parcel
pnpm list parcel
pnpm list @parcel/config-default

# Verificar http-proxy-middleware
pnpm list http-proxy-middleware

# Verificar npm-run-all
pnpm list npm-run-all
```

## 📝 Dependências Necessárias

As seguintes dependências devem estar em `package.json`:

```json
{
  "devDependencies": {
    "@parcel/config-default": "^2.13.3",
    "http-proxy-middleware": "^3.0.3",
    "npm-run-all": "^4.1.5",
    "parcel": "^2.13.3"
  }
}
```

## 🚀 Após Instalar

1. Execute o servidor novamente:
   ```bash
   npm run dev:all
   # ou
   dev-start.bat
   # ou
   powershell -ExecutionPolicy Bypass -File start-dev.ps1
   ```

2. Verifique se está funcionando:
   - Parcel: http://localhost:1234
   - Express: http://localhost:3000

## 🐛 Problemas Comuns

### pnpm não encontrado

Se `pnpm` não estiver instalado:

```bash
# Instalar pnpm
npm install -g pnpm

# Ou usar npm
npm install
```

### Erro de permissão

Se tiver erro de permissão:

```bash
# Executar como administrador (Windows)
# Ou usar npm com --legacy-peer-deps
npm install --legacy-peer-deps
```

### Cache corrompido

Se o cache estiver corrompido:

```bash
# Limpar cache do pnpm
pnpm store prune

# Ou limpar cache do npm
npm cache clean --force

# Reinstalar
pnpm install
```

