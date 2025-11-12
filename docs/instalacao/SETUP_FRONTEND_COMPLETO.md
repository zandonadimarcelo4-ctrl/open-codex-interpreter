# 🚀 Setup Frontend Completo - AutoGen Agent Interface

## ⚡ Início Rápido

### 1️⃣ Setup Backend Python
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

### 3️⃣ Configurar Variáveis de Ambiente
```batch
cd autogen_agent_interface
copy env.example .env
```

Edite o `.env`:
```env
# Database
DATABASE_URL=mysql://user:password@localhost:3306/autogen_agent_interface

# Server
PORT=3000
NODE_ENV=development

# Open WebUI Backend
VITE_OPEN_WEBUI_API=http://localhost:8080/api
VITE_API_BASE_URL=http://localhost:3000/api

# Ollama
OLLAMA_BASE_URL=http://localhost:11434
```

### 4️⃣ Iniciar Tudo
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
  - E muito mais!

## 🎯 Estrutura do Frontend Completo

```
autogen_agent_interface/
├── client/                    # Frontend React
│   ├── src/
│   │   ├── pages/            # Landing, Home, Showcase
│   │   ├── components/       # 53 componentes UI
│   │   └── ...
│   └── ...
├── server/                    # Backend tRPC/Express
│   ├── _core/               # Core do servidor
│   ├── routers.ts           # Rotas tRPC
│   └── db.ts                # Banco de dados
├── drizzle/                  # Schema e migrações
└── shared/                   # Código compartilhado
```

## 🔧 Configuração Detalhada

### Banco de Dados

O frontend completo usa Drizzle ORM. Configure o banco:

**MySQL:**
```env
DATABASE_URL=mysql://user:password@localhost:3306/autogen_agent_interface
```

**PostgreSQL:**
```env
DATABASE_URL=postgresql://user:password@localhost:5432/autogen_agent_interface
```

**SQLite (desenvolvimento):**
```env
DATABASE_URL=sqlite:///./data/autogen.db
```

Depois, execute as migrações:
```batch
cd autogen_agent_interface
pnpm db:push
```

### Integração com Open WebUI

O frontend se conecta ao backend Python através de:

1. **API REST**: `VITE_OPEN_WEBUI_API=http://localhost:8080/api`
2. **tRPC**: `VITE_API_BASE_URL=http://localhost:3000/api`

## 🧪 Testar

### 1. Backend Python
```
http://localhost:8080/docs
```

### 2. Frontend Completo
```
http://localhost:3000
```

### 3. Páginas Disponíveis
- **Landing**: http://localhost:3000/
- **Home**: http://localhost:3000/app
- **Showcase**: http://localhost:3000/showcase

## 🐛 Problemas Comuns

### Erro: "pnpm não encontrado"
**Solução:**
```batch
npm install -g pnpm
```

### Erro: "Cannot find module"
**Solução:**
```batch
cd autogen_agent_interface
pnpm install
```

### Erro: "Database connection failed"
**Solução:**
1. Configure `DATABASE_URL` no `.env`
2. Execute: `pnpm db:push`

### Erro: "Port already in use"
**Solução:** Altere as portas no `.env`:
```env
PORT=3001  # Frontend
```

E no backend:
```env
PORT=8081  # Backend
```

## 📝 Scripts Disponíveis

### Frontend Completo
```batch
cd autogen_agent_interface

# Desenvolvimento
pnpm dev

# Build
pnpm build

# Produção
pnpm start

# Banco de dados
pnpm db:push
```

### Backend Python
```batch
# Apenas backend
start_windows.bat

# Manualmente
.venv\Scripts\activate
python -m uvicorn open_webui.main:app --reload
```

### Ambos
```batch
# Backend + Frontend Completo
start_full.bat
```

## 💡 Recursos do Frontend Completo

### Componentes UI (53 componentes)
- Accordion, Alert Dialog, Avatar
- Button, Card, Checkbox
- Dialog, Dropdown Menu
- Form, Input, Label
- Select, Slider, Switch
- Tabs, Tooltip
- E muito mais!

### Páginas
- **Landing**: Página inicial
- **Home**: Interface principal com chat
- **Showcase**: Demonstração de componentes

### Funcionalidades
- ✅ Chat avançado
- ✅ Visualização de agentes
- ✅ Painel de tarefas
- ✅ Dashboard de resultados
- ✅ Autenticação
- ✅ Notificações
- ✅ Responsivo mobile

## 🔗 URLs

- **Backend Python**: http://localhost:8080
- **Frontend Completo**: http://localhost:3000
- **tRPC API**: http://localhost:3000/api/trpc
- **Open WebUI API**: http://localhost:8080/api

---

**Pronto!** Execute `setup_windows.bat`, depois `cd autogen_agent_interface && pnpm install`, e então `start_full.bat`! 🎉

