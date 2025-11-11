# 🔧 Passo a Passo: Corrigir Erro do Parcel com React

## ❌ Erro Atual

```
Uncaught TypeError: Failed to resolve module specifier "react/jsx-dev-runtime". 
Relative references must start with either "/", "./", or "../".
```

## 🎯 Solução

### **PASSO 1: Parar TODOS os Servidores**

1. Feche todos os terminais que estão rodando o Express ou Parcel
2. Ou pressione `Ctrl+C` em cada terminal

### **PASSO 2: Limpar Cache do Parcel**

Execute o script:
```bash
limpar-cache-parcel.bat
```

Ou manualmente:
```bash
rmdir /s /q .parcel-cache .parcel-dist
```

### **PASSO 3: Verificar Configuração**

Certifique-se de que os arquivos estão assim:

#### `client/package.json`
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

#### `.parcelrc`
```json
{
  "extends": "@parcel/config-default",
  "transformers": {
    "*.{css,scss,sass}": [
      "@parcel/transformer-postcss"
    ]
  },
  "resolvers": [
    "@parcel/resolver-default"
  ]
}
```

### **PASSO 4: Reiniciar Servidores**

Execute:
```bash
npm run dev:all
```

Ou use o script:
```bash
REINICIAR_SERVIDOR.bat
```

### **PASSO 5: Aguardar Servidores Iniciarem**

Você deve ver nos logs:
```
[Parcel] ✅ Proxy configurado!
[Parcel] 📡 Proxy: Express (3001) → Parcel (5173)

🚀 Server running on:
   Local:   http://localhost:3001/
```

### **PASSO 6: Acessar através do Express**

**✅ CORRETO:**
```
http://localhost:3001/
```
(use a porta que aparecer nos logs)

**❌ ERRADO:**
```
http://localhost:5173/  ← NÃO FAÇA ISSO!
```

## 🚨 Se Ainda Não Funcionar

### Verificar Versão do Parcel

```bash
npm list parcel
```

Se for diferente de `2.16.1`, atualize:
```bash
npm install parcel@^2.16.1 --save-dev
```

### Limpar Tudo e Reinstalar

```bash
# 1. Parar servidores
# 2. Limpar cache
rmdir /s /q .parcel-cache .parcel-dist node_modules

# 3. Reinstalar
npm install

# 4. Reiniciar
npm run dev:all
```

## 📝 Checklist

- [ ] Servidores parados
- [ ] Cache do Parcel limpo (`.parcel-cache` e `.parcel-dist` removidos)
- [ ] `client/package.json` tem `includeNodeModules: true`
- [ ] `.parcelrc` está correto
- [ ] Servidores reiniciados
- [ ] Acessando através do Express (`http://localhost:3001/`)
- [ ] **NÃO** acessando diretamente o Parcel (`http://localhost:5173/`)

## 💡 Por Que Isso Resolve?

1. **Cache limpo**: Remove configurações antigas que estavam causando o problema
2. **includeNodeModules: true**: Força o Parcel a incluir módulos do `node_modules` no bundle
3. **Acesso através do Express**: O Express serve arquivos públicos corretamente e faz proxy para o Parcel

## 🎯 Resumo Rápido

1. **Parar servidores**
2. **Limpar cache**: `limpar-cache-parcel.bat`
3. **Reiniciar**: `npm run dev:all`
4. **Acessar**: `http://localhost:3001/` (não 5173!)

---

**IMPORTANTE**: Sempre acesse através do Express, nunca diretamente no Parcel!

