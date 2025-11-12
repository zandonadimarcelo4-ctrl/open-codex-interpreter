# 🚀 Guia de Deploy

Este guia explica como fazer deploy do projeto em diferentes plataformas.

## 📋 Pré-requisitos

- Node.js 20+
- pnpm 8+
- Conta nas plataformas de deploy escolhidas

## 🌐 Plataformas Suportadas

### 1. Vercel (Recomendado)

**Configuração:**
1. Conecte seu repositório GitHub ao Vercel
2. Configure as variáveis de ambiente:
   - `NODE_ENV=production`
   - `OLLAMA_BASE_URL=http://localhost:11434` (ou URL do seu Ollama)
   - `DEFAULT_MODEL=deepseek-r1`
3. O Vercel detectará automaticamente o `vercel.json`

**Deploy:**
```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

**Arquivo:** `vercel.json`

---

### 2. Render

**Configuração:**
1. Crie uma nova Web Service no Render
2. Conecte seu repositório GitHub
3. Configure:
   - **Build Command:** `cd autogen_agent_interface && pnpm install && pnpm build`
   - **Start Command:** `cd autogen_agent_interface && pnpm start`
   - **Environment:** `Node`
4. Adicione variáveis de ambiente (mesmas do Vercel)

**Arquivo:** `render.yaml`

**Deploy automático:**
- Push para `main` = deploy automático

---

### 3. Railway

**Configuração:**
1. Conecte seu repositório GitHub ao Railway
2. Railway detectará automaticamente o `railway.json`
3. Configure variáveis de ambiente no dashboard

**Arquivo:** `railway.json`

**Deploy:**
```bash
# Instalar Railway CLI
npm i -g @railway/cli

# Login
railway login

# Deploy
railway up
```

---

### 4. Fly.io

**Configuração:**
1. Instale o Fly CLI: `curl -L https://fly.io/install.sh | sh`
2. Login: `fly auth login`
3. Crie o app: `fly launch` (usará `fly.toml`)

**Arquivo:** `fly.toml`

**Deploy:**
```bash
fly deploy
```

---

### 5. Docker (Qualquer plataforma)

**Build:**
```bash
docker build -t autogen-agent-interface .
```

**Run:**
```bash
docker run -p 3000:3000 \
  -e NODE_ENV=production \
  -e OLLAMA_BASE_URL=http://localhost:11434 \
  -e DEFAULT_MODEL=deepseek-r1 \
  autogen-agent-interface
```

**Arquivos:** `Dockerfile`, `.dockerignore`

---

## 🔧 Variáveis de Ambiente

Configure estas variáveis em todas as plataformas:

```env
# Ambiente
NODE_ENV=production
PORT=3000

# Ollama
OLLAMA_BASE_URL=http://localhost:11434
DEFAULT_MODEL=deepseek-r1

# TTS (Opcional)
ELEVENLABS_API_KEY=your_key_here
ELEVENLABS_VOICE_ID=your_voice_id_here

# OAuth (Opcional)
VITE_OAUTH_PORTAL_URL=https://oauth.manus.computer
VITE_APP_ID=your_app_id
```

---

## 📦 Build Local

Para testar o build localmente:

```bash
cd autogen_agent_interface
pnpm install
pnpm build
pnpm start
```

---

## 🏥 Health Check

Todas as plataformas verificam a saúde do app em:
- **Endpoint:** `/api/health`
- **Método:** GET
- **Resposta:** JSON com status, timestamp, uptime

---

## 🚨 Troubleshooting

### Erro: "Module not found"
- Verifique se todas as dependências estão no `package.json`
- Execute `pnpm install` novamente

### Erro: "Port already in use"
- Configure a variável `PORT` no ambiente de deploy
- Vercel/Render usam portas dinâmicas automaticamente

### Erro: "Build timeout"
- Aumente o timeout no `vercel.json` ou configuração da plataforma
- Otimize o build removendo dependências desnecessárias

### Erro: "Memory limit exceeded"
- Upgrade o plano da plataforma
- Otimize o código (lazy loading, code splitting)

---

## 📚 Recursos

- [Vercel Docs](https://vercel.com/docs)
- [Render Docs](https://render.com/docs)
- [Railway Docs](https://docs.railway.app)
- [Fly.io Docs](https://fly.io/docs)

---

## ✅ Checklist de Deploy

- [ ] Variáveis de ambiente configuradas
- [ ] Build local funcionando
- [ ] Health check respondendo
- [ ] Testes passando
- [ ] Logs configurados
- [ ] Domínio customizado (opcional)
- [ ] SSL/HTTPS habilitado
- [ ] Monitoramento configurado

