# 🚀 Open Codex Interpreter - Setup Completo

## ⚡ Início Rápido (3 Comandos)

### 1️⃣ Setup Backend
```batch
setup_windows.bat
```

### 2️⃣ Setup Frontend Completo
```batch
cd autogen_agent_interface
pnpm install
```

Se não tiver pnpm:
```batch
npm install -g pnpm
```

### 3️⃣ Iniciar Tudo
```batch
start_full.bat
```

## 📋 O que Você Terá

### Backend Python (Porta 8080)
- ✅ FastAPI com uvicorn
- ✅ API: http://localhost:8080/api
- ✅ Docs: http://localhost:8080/docs
- ✅ Banco de dados SQLite

### Frontend Completo (Porta 3000)
- ✅ **React 19** completo
- ✅ **tRPC** para comunicação type-safe
- ✅ **53 componentes Radix UI**
- ✅ **Backend Express** com tRPC
- ✅ **Páginas completas**: Landing, Home, Showcase
- ✅ **Componentes avançados**:
  - AdvancedChatInterface
  - AgentTeamVisualization
  - 3DAgentCard
  - DashboardLayout
  - TaskExecutionPanel

## 🔧 Configuração

### Frontend Completo
```batch
cd autogen_agent_interface
copy env.example .env
```

Edite o `.env`:
```env
# Database
DATABASE_URL=sqlite:///./data/autogen.db

# Open WebUI Backend
VITE_OPEN_WEBUI_API=http://localhost:8080/api
VITE_API_BASE_URL=http://localhost:3000/api

# Ollama
OLLAMA_BASE_URL=http://localhost:11434
```

## 🧪 Testar

1. **Backend**: http://localhost:8080/docs
2. **Frontend**: http://localhost:3000
3. **Páginas**:
   - Landing: http://localhost:3000/
   - Home: http://localhost:3000/app
   - Showcase: http://localhost:3000/showcase

## 🐛 Problemas?

### pnpm não encontrado
```batch
npm install -g pnpm
```

### Frontend não inicia
```batch
cd autogen_agent_interface
pnpm install
```

### Banco de dados
```batch
cd autogen_agent_interface
pnpm db:push
```

## 📝 Scripts

- `setup_windows.bat` - Setup backend
- `start_windows.bat` - Apenas backend
- `start_full.bat` - Backend + Frontend Completo
- `cd autogen_agent_interface && pnpm dev` - Apenas frontend

## 📚 Documentação

- **Setup Frontend Completo**: `SETUP_FRONTEND_COMPLETO.md`
- **Guia de Setup**: `SETUP_GUIDE.md`
- **Análise do Projeto**: `autogen_agent_interface/ANALISE_E_TAREFAS.md`

---

**Pronto!** Execute os 3 comandos acima e comece a usar o frontend completo! 🎉
