# 🚀 Como Acessar a Aplicação

## ⚠️ IMPORTANTE: Não Acesse Diretamente o Parcel!

### ❌ **ERRADO** - NÃO FAÇA ISSO:
```
http://localhost:5173/
```
**Por quê?** O Parcel sozinho não consegue:
- Servir arquivos públicos corretamente (manifest.json, favicon, etc)
- Fazer bundle de módulos React corretamente
- Processar requisições de API

### ✅ **CORRETO** - FAÇA ISSO:
```
http://localhost:3001/
```
(ou a porta que o Express estiver usando - verifique os logs do servidor)

**Por quê?** O Express:
- Serve arquivos públicos corretamente
- Faz proxy para o Parcel processar o frontend
- Processa requisições de API
- Gerencia WebSocket

## 📋 Passos para Acessar Corretamente

### 1. Iniciar os Servidores

```bash
# Opção 1: Iniciar ambos automaticamente
npm run dev:all

# Opção 2: Usar script do Windows
dev-start.bat

# Opção 3: Iniciar manualmente (2 terminais)
# Terminal 1:
npm run dev:parcel

# Terminal 2:
npm run dev
```

### 2. Verificar os Logs

Você deve ver algo assim nos logs:

```
🚀 Server running on:
   Local:   http://localhost:3001/
   Network: http://172.27.144.1:3001/

📡 WebSocket server running on:
   Local:   ws://localhost:3001/ws
   Network: ws://172.27.144.1:3001/ws

[Parcel] ✅ Proxy configurado!
[Parcel] 📡 Proxy: Express (3001) → Parcel (5173)
```

### 3. Acessar a Aplicação

**Use a URL que aparece nos logs:**
```
http://localhost:3001/
```

**NÃO use:**
```
http://localhost:5173/  ← ERRADO!
```

## 🔍 Como Funciona

```
┌─────────────────────────────────────────┐
│         NAVEGADOR                       │
│    http://localhost:3001/               │
└──────────────┬──────────────────────────┘
               │
               │ Requisição HTTP
               │
               ▼
┌─────────────────────────────────────────┐
│         EXPRESS (Backend)               │
│    Porta 3001                           │
│                                         │
│  1. Serve arquivos públicos            │
│     (/manifest.json, /favicon.png)     │
│                                         │
│  2. Processa API                       │
│     (/api/trpc/*, /api/health, etc)    │
│                                         │
│  3. Processa WebSocket                 │
│     (/ws)                               │
│                                         │
│  4. Faz PROXY para Parcel              │
│     (todas as outras requisições)      │
└──────────────┬──────────────────────────┘
               │
               │ Proxy HTTP
               │
               ▼
┌─────────────────────────────────────────┐
│         PARCEL (Frontend)               │
│    Porta 5173                           │
│                                         │
│  • Processa TypeScript/TSX             │
│  • Faz bundle do React                 │
│  • Processa CSS                        │
│  • Hot Module Replacement              │
└─────────────────────────────────────────┘
```

## 🐛 Problemas Comuns

### Erro: "Failed to resolve module specifier 'react/jsx-dev-runtime'"

**Causa**: Você está acessando diretamente `http://localhost:5173/`

**Solução**: Acesse através do Express: `http://localhost:3001/`

### Erro: "Manifest: Line: 1, column: 1, Syntax error"

**Causa**: O Parcel está tentando servir o manifest.json, mas não consegue processá-lo corretamente

**Solução**: Acesse através do Express, que serve o manifest.json corretamente

### Erro: "Unexpected endpoint or method. (GET /)"

**Causa**: O Express não está fazendo proxy para o Parcel

**Solução**: 
1. Verifique se o Parcel está rodando na porta 5173
2. Verifique se o Express está configurado para fazer proxy
3. Reinicie ambos os servidores

## 🔧 Limpar Cache do Parcel

Se você ainda tiver problemas após acessar pelo Express:

```bash
# Windows
limpar-cache-parcel.bat

# Ou manualmente:
rmdir /s /q .parcel-cache .parcel-dist
```

Depois reinicie:
```bash
npm run dev:all
```

## 📝 Resumo

1. ✅ **Sempre acesse através do Express**: `http://localhost:3001/`
2. ❌ **Nunca acesse diretamente o Parcel**: `http://localhost:5173/`
3. 🔄 **Se tiver problemas, limpe o cache do Parcel**
4. 📊 **Verifique os logs do servidor para ver a porta correta**

## 🎯 URLs Corretas

- **Frontend**: `http://localhost:3001/` (através do Express)
- **API**: `http://localhost:3001/api/health` (diretamente no Express)
- **WebSocket**: `ws://localhost:3001/ws` (diretamente no Express)
- **Tailscale**: `https://revision-pc.tailb3613b.ts.net` (através do Express)

**NUNCA use**: `http://localhost:5173/` (Parcel sozinho não funciona corretamente)

