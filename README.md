# 🚀 AutoGen Agent Interface

Sistema completo de agentes AI colaborativos com AutoGen Framework, otimizado para RTX 4080 Super.

## ⚡ Início Rápido

### Opção 1: Script Moderno (Recomendado) ✨

**Windows:**
```bash
start.bat
```

**Linux/Mac:**
```bash
chmod +x start.sh
./start.sh
```

**Node.js direto (qualquer plataforma):**
```bash
node start.js
```

O script moderno:
- ✅ Detecta automaticamente pnpm ou npm
- ✅ Instala dependências automaticamente se necessário
- ✅ Inicia o servidor de desenvolvimento
- ✅ Output colorido e informativo
- ✅ Cross-platform (Windows/Linux/Mac)

### Opção 2: Manual

```bash
cd autogen_agent_interface
pnpm install
pnpm dev
```

## 📋 Pré-requisitos

- **Node.js** 20+ ([Download](https://nodejs.org/))
- **pnpm** 8+ (ou npm) - Instalado automaticamente pelo script
- **Ollama** (para modelos locais) - [Download](https://ollama.ai/)
- **Python** 3.10+ (para Super Agent Framework) - [Download](https://www.python.org/)

## 🌐 URLs

Após iniciar:

- **Frontend**: http://localhost:3000
- **API**: http://localhost:3000/api
- **Health Check**: http://localhost:3000/api/health
- **WebSocket**: ws://localhost:3000/ws

## 🚀 Deploy

Veja o guia completo em [DEPLOY.md](./DEPLOY.md)

Suporta:
- ✅ Vercel (recomendado)
- ✅ Render
- ✅ Railway
- ✅ Fly.io
- ✅ Docker

## 📚 Documentação

- **Deploy**: [DEPLOY.md](./DEPLOY.md)
- **Funcionalidades**: [FUNCIONALIDADES_STATUS.md](./FUNCIONALIDADES_STATUS.md)
- **Setup**: Veja `autogen_agent_interface/env.example`

## 🛠️ Scripts Disponíveis

```bash
# Desenvolvimento
pnpm dev              # Inicia servidor de desenvolvimento

# Build
pnpm build            # Build para produção
pnpm start            # Inicia servidor de produção

# Utilitários
pnpm lint             # Lint do código
pnpm type-check       # Verificação de tipos
```

## 🐛 Troubleshooting

### Erro: "pnpm não encontrado"
O script detecta automaticamente e usa npm como fallback, ou instale pnpm:
```bash
npm install -g pnpm
```

### Erro: "Dependências não instaladas"
Execute manualmente:
```bash
cd autogen_agent_interface
pnpm install
```

### Erro: "Porta já em uso"
Altere a porta no arquivo `.env`:
```env
PORT=3001
```

## 📦 Estrutura do Projeto

```
open-codex-interpreter/
├── autogen_agent_interface/    # Aplicação principal
│   ├── client/                 # Frontend React
│   ├── server/                 # Backend Node.js
│   └── shared/                 # Código compartilhado
├── super_agent/                # Super Agent Framework (Python)
├── start.js                    # Script de inicialização moderno
├── start.bat                   # Wrapper Windows
├── start.sh                    # Wrapper Linux/Mac
└── README.md                   # Este arquivo
```

## 🎯 Funcionalidades

- ✅ Chat em tempo real com WebSocket
- ✅ TTS/STT (ElevenLabs/Piper)
- ✅ OCR e análise de imagens
- ✅ Execução de código
- ✅ Integração com Ollama/AutoGen
- ✅ Background Worker 24/7
- ✅ Resource Manager (otimizado para RTX 4080 Super)
- ✅ Model Loader (carregamento automático na VRAM)

## 📝 Licença

MIT

---

**Execute `start.bat` (Windows) ou `./start.sh` (Linux/Mac) agora!** 🎉
