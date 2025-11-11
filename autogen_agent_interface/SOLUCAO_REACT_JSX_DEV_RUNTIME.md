# 🔧 Solução: Erro react/jsx-dev-runtime não bundleado

## ❌ Problema

O erro `Uncaught TypeError: Failed to resolve module specifier "react/jsx-dev-runtime"` ocorre porque o Parcel está gerando código com imports externos (`__parcelExternal0`) ao invés de bundlear o React corretamente.

## 🔍 Causa Raiz

O Parcel estava usando "scope hoisting" que causava:
1. Geração de múltiplos bundles
2. Imports externos para `react/jsx-dev-runtime`
3. O `index.html` carregava o bundle errado

## ✅ Solução Aplicada

### 1. Adicionar `--no-scope-hoist` aos scripts do Parcel

Modifique `package.json`:

```json
{
  "scripts": {
    "dev:parcel:build": "cross-env PARCEL_CACHE_DIR=.parcel-cache NODE_ENV=production parcel build client/index.html --dist-dir .parcel-dist --public-url / --no-scope-hoist",
    "dev:parcel:watch": "cross-env PARCEL_CACHE_DIR=.parcel-cache NODE_ENV=production parcel watch client/index.html --dist-dir .parcel-dist --public-url / --no-scope-hoist"
  }
}
```

### 2. Limpar Cache e Rebuild

```bash
# Limpar cache
rmdir /s /q .parcel-cache .parcel-dist

# Rebuild
npm run dev:parcel:build
```

### 3. Verificar Build

Após o build, verifique que:
- ✅ Apenas um arquivo JavaScript é gerado (ou múltiplos bundles corretos)
- ✅ O arquivo gerado NÃO tem `__parcelExternal` para `react/jsx-dev-runtime`
- ✅ O `index.html` referencia o arquivo correto

## 📋 Configuração Correta

### `client/package.json`

```json
{
  "targets": {
    "default": {
      "context": "browser",
      "includeNodeModules": true
    }
  }
}
```

### `tsconfig.json`

```json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "module": "ESNext",
    "moduleResolution": "bundler"
  }
}
```

## 🚀 Como Testar

1. Limpe o cache:
   ```bash
   rmdir /s /q .parcel-cache .parcel-dist
   ```

2. Execute o build:
   ```bash
   npm run dev:parcel:build
   ```

3. Verifique o arquivo gerado:
   - Abra `.parcel-dist/client.*.js`
   - Procure por `react/jsx-dev-runtime`
   - Deve estar bundleado (não deve ter `__parcelExternal`)

4. Acesse a aplicação:
   ```
   http://localhost:3000/
   ```

5. Verifique o console do navegador:
   - Não deve ter erros de módulos
   - A aplicação deve carregar corretamente

## 💡 Explicação Técnica

O `--no-scope-hoist` desabilita o "scope hoisting" do Parcel, que é uma otimização que pode causar problemas com alguns módulos. Ao desabilitá-lo:

- O Parcel bundlea todos os módulos corretamente
- Não gera imports externos para módulos que deveriam ser bundleados
- Garante que `react/jsx-dev-runtime` seja incluído no bundle

## ⚠️ Notas Importantes

1. **Cache**: Sempre limpe o cache após mudanças na configuração
2. **Build Mode**: Use `NODE_ENV=production` para garantir build completo
3. **Watch Mode**: O `--no-scope-hoist` também deve ser usado no watch mode
4. **Verificação**: Sempre verifique o arquivo gerado para garantir que está correto

## 🔄 Se o Problema Persistir

1. Limpe completamente:
   ```bash
   rmdir /s /q .parcel-cache .parcel-dist node_modules
   npm install
   ```

2. Verifique as versões:
   ```bash
   npm list react react-dom parcel
   ```

3. Verifique a configuração:
   - `client/package.json` tem `includeNodeModules: true`
   - `tsconfig.json` tem `jsx: "react-jsx"`
   - Scripts têm `--no-scope-hoist`

4. Execute build limpo:
   ```bash
   npm run dev:parcel:build
   ```

## ✅ Resultado Esperado

Após aplicar a solução:
- ✅ Build gera bundle completo
- ✅ React está bundleado corretamente
- ✅ Não há erros de módulos no navegador
- ✅ Aplicação carrega e funciona corretamente

