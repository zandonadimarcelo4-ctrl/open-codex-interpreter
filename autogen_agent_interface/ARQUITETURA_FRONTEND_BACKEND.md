# 🏗️ Arquitetura: Como o Frontend e Backend Funcionam

## 📋 Visão Geral

O projeto usa uma arquitetura híbrida onde:
- **Express** serve o backend (API, WebSocket, arquivos públicos)
- **Parcel** processa e serve o frontend em desenvolvimento
- **Express** faz proxy das requisições do frontend para o Parcel em desenvolvimento
- **Express** serve arquivos estáticos do frontend em produção

## 🔄 Como Funciona

### 🛠️ **Modo DESENVOLVIMENTO** (`NODE_ENV=development`)

```
┌─────────────────────────────────────────────────────────────┐
│                    NAVEGADOR                                │
│                  (localhost:3001)                           │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ Requisições HTTP
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                    EXPRESS (Backend)                        │
│                  (localhost:3001)                           │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ 1. Servir arquivos públicos (manifest.json, etc)    │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ 2. Processar API (/api/*)                            │  │
│  │    - tRPC (/api/trpc/*)                              │  │
│  │    - Health check (/api/health)                      │  │
│  │    - TTS, STT, SFX (/api/tts, /api/stt, /api/sfx)   │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ 3. Processar WebSocket (/ws)                         │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ 4. Proxy para Parcel (todas as outras requisições)  │  │
│  │    → http://localhost:5173                           │  │
│  └──────────────────────────────────────────────────────┘  │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ Proxy HTTP
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                    PARCEL (Frontend)                        │
│                  (localhost:5173)                           │
│                                                             │
│  • Processa TypeScript/TSX                                  │
│  • Faz bundle do React                                      │
│  • Processa CSS (PostCSS, Tailwind)                        │
│  • Hot Module Replacement (HMR)                            │
│  • Serve arquivos processados                              │
└─────────────────────────────────────────────────────────────┘
```

### 🚀 **Modo PRODUÇÃO** (`NODE_ENV=production`)

```
┌─────────────────────────────────────────────────────────────┐
│                    NAVEGADOR                                │
│                  (localhost:3000)                           │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ Requisições HTTP
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                    EXPRESS (Backend + Frontend)             │
│                  (localhost:3000)                           │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ 1. Servir arquivos públicos (manifest.json, etc)    │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ 2. Processar API (/api/*)                            │  │
│  │    - tRPC (/api/trpc/*)                              │  │
│  │    - Health check (/api/health)                      │  │
│  │    - TTS, STT, SFX (/api/tts, /api/stt, /api/sfx)   │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ 3. Processar WebSocket (/ws)                         │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ 4. Servir arquivos estáticos do frontend            │  │
│  │    (dist/public/*)                                   │  │
│  │    - index.html                                      │  │
│  │    - JS bundlado                                    │  │
│  │    - CSS processado                                 │  │
│  │    - Assets (imagens, etc)                          │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## 📂 Estrutura de Arquivos

```
autogen_agent_interface/
├── client/              # Frontend (React, TypeScript)
│   ├── src/            # Código fonte do frontend
│   ├── public/         # Arquivos públicos (manifest.json, favicon, etc)
│   └── index.html      # HTML de entrada
│
├── server/             # Backend (Express, Node.js)
│   └── _core/
│       ├── index.ts    # Servidor Express principal
│       └── parcel.ts   # Configuração do proxy Parcel
│
├── dist/               # Build de produção (gerado)
│   └── public/         # Frontend bundlado
│
└── .parcel-dist/       # Build temporário do Parcel (desenvolvimento)
```

## 🔧 Como Funciona o Proxy

### Em Desenvolvimento

1. **Navegador** acessa `http://localhost:3001/`
2. **Express** recebe a requisição
3. **Express** verifica se é:
   - Arquivo público (`/manifest.json`, `/favicon.png`) → Serve diretamente
   - API (`/api/*`) → Processa e retorna
   - WebSocket (`/ws`) → Processa e mantém conexão
   - **Qualquer outra coisa** → Faz proxy para Parcel (`http://localhost:5173`)
4. **Parcel** processa a requisição e retorna o HTML/JS/CSS processado
5. **Express** retorna a resposta do Parcel para o navegador

### Em Produção

1. **Navegador** acessa `http://localhost:3000/`
2. **Express** recebe a requisição
3. **Express** verifica se é:
   - Arquivo público → Serve diretamente
   - API → Processa e retorna
   - WebSocket → Processa e mantém conexão
   - **Qualquer outra coisa** → Serve arquivo estático de `dist/public/`

## 🎯 Por Que Usar Esta Arquitetura?

### ✅ **Vantagens**

1. **Desenvolvimento Rápido**: Parcel faz hot reload automático
2. **Separação de Concerns**: Frontend e backend são independentes
3. **Um Único Servidor**: Express serve tudo, facilitando deploy
4. **Otimização**: Em produção, arquivos são pré-processados e otimizados

### 🔄 **Fluxo de Requisições**

#### Requisição para `/api/health`:
```
Navegador → Express → API Handler → Resposta JSON
```

#### Requisição para `/`:
```
Navegador → Express → Proxy → Parcel → HTML processado → Navegador
```

#### Requisição para `/manifest.json`:
```
Navegador → Express → Serve arquivo público → Navegador
```

## 📝 Código Relevante

### `server/_core/index.ts`

```typescript
// Servir arquivos públicos ANTES do proxy
app.use('/manifest.json', ...);
app.use('/favicon.png', ...);

// Configurar API
app.use('/api/trpc', ...);
app.get('/api/health', ...);

// Configurar WebSocket
new ChatWebSocketServer(server);

// Em desenvolvimento: Proxy para Parcel
if (process.env.NODE_ENV === "development") {
  await setupParcel(app, server, preferredPort);
}

// Em produção: Servir arquivos estáticos
if (process.env.NODE_ENV !== "development") {
  serveStatic(app);
}
```

### `server/_core/parcel.ts`

```typescript
// Proxy middleware que encaminha requisições para o Parcel
const parcelProxy = createProxyMiddleware({
  target: `http://localhost:${parcelPort}`,
  changeOrigin: true,
  // ... configurações
});

// Aplicar proxy para todas as requisições que não são API/WebSocket
app.use((req, res, next) => {
  if (path.startsWith('/api/') || path.startsWith('/ws')) {
    return next(); // Não fazer proxy
  }
  parcelProxy(req, res, next); // Fazer proxy para Parcel
});
```

## 🚀 Comandos

### Desenvolvimento
```bash
# Iniciar ambos (Express + Parcel)
npm run dev:all

# Ou separadamente:
npm run dev          # Express (backend)
npm run dev:parcel   # Parcel (frontend)
```

### Produção
```bash
# Build do frontend
npm run build

# Iniciar servidor
npm start
```

## 🎓 Resumo

- **Express** = Backend (API, WebSocket) + Proxy (desenvolvimento) + Servidor de arquivos estáticos (produção)
- **Parcel** = Processador de frontend (apenas em desenvolvimento)
- **Navegador** = Acessa apenas o Express (porta 3001 em dev, 3000 em produção)
- **Proxy** = Express encaminha requisições do frontend para o Parcel em desenvolvimento

**IMPORTANTE**: Em desenvolvimento, sempre acesse através do Express (`http://localhost:3001/`), não diretamente no Parcel (`http://localhost:5173/`)!

