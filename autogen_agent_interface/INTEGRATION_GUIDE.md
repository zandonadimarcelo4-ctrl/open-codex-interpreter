# AutoGen Super Agent Interface - Guia de Integração

## Estrutura do Projeto

```
autogen_agent_interface/
├── client/                          # Frontend React (porta 3000)
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Landing.tsx         # Página inicial
│   │   │   ├── Home.tsx            # Interface principal
│   │   │   └── Showcase.tsx        # Demonstração
│   │   ├── components/
│   │   │   ├── HeroSection.tsx
│   │   │   ├── AdvancedChatInterface.tsx
│   │   │   ├── AgentTeamVisualization.tsx
│   │   │   ├── 3DAgentCard.tsx
│   │   │   ├── FloatingOrb.tsx
│   │   │   ├── GlassCard.tsx
│   │   │   └── ... (outros componentes)
│   │   └── ...
│   └── ...
├── server/                          # Backend tRPC (porta 3000)
│   ├── routers.ts
│   ├── db.ts
│   └── ...
├── open-webui-backend/              # Backend Open WebUI (porta 8000)
│   ├── backend/
│   │   ├── open_webui/
│   │   │   ├── main.py
│   │   │   ├── routers/
│   │   │   │   ├── chats.py
│   │   │   │   ├── models.py
│   │   │   │   ├── ollama.py
│   │   │   │   └── ...
│   │   │   └── ...
│   │   └── requirements.txt
│   └── ...
└── README.md
```

## Iniciar o Projeto

### 1. Frontend + Backend tRPC (Node.js)
```bash
cd /home/ubuntu/autogen_agent_interface
pnpm install
pnpm dev
# Acessa em http://localhost:3000
```

### 2. Backend Open WebUI (Python)
```bash
cd /home/ubuntu/autogen_agent_interface/open-webui-backend/backend
pip install -r requirements.txt
python -m open_webui.main
# Acessa em http://localhost:8000
```

## Integração de APIs

### Frontend → Open WebUI Backend

O frontend React se conecta ao Open WebUI backend através de:

1. **Chat API** (`/api/chats`)
   - Enviar mensagens
   - Recuperar histórico
   - Gerenciar conversas

2. **Models API** (`/api/models`)
   - Listar modelos disponíveis
   - Selecionar modelos

3. **Ollama API** (`/api/ollama`)
   - Integração com Ollama
   - Modelos locais

4. **Retrieval API** (`/api/retrieval`)
   - Busca e RAG
   - Processamento de documentos

### Exemplo de Integração no Frontend

```typescript
// client/src/lib/openWebUIClient.ts
const OPEN_WEBUI_API = 'http://localhost:8000/api';

export async function sendMessage(chatId: string, message: string) {
  const response = await fetch(`${OPEN_WEBUI_API}/chats/${chatId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: message })
  });
  return response.json();
}

export async function getModels() {
  const response = await fetch(`${OPEN_WEBUI_API}/models`);
  return response.json();
}
```

## Recursos Disponíveis

### Open WebUI Backend Inclui:

- ✅ Chat Management (criar, atualizar, deletar conversas)
- ✅ Modelo Selection (suporte a múltiplos modelos)
- ✅ Ollama Integration (modelos locais)
- ✅ RAG/Retrieval (busca e processamento)
- ✅ File Upload (documentos e imagens)
- ✅ User Management (autenticação)
- ✅ Audio Processing (transcrição)
- ✅ Image Generation (geração de imagens)
- ✅ Web Retrieval (busca na web)
- ✅ Database (SQLite/PostgreSQL)

### Frontend Inclui:

- ✅ Landing Page (Hero section)
- ✅ Chat Interface Avançada (markdown, syntax highlighting)
- ✅ Agent Team Visualization (3D)
- ✅ Task Execution Panel
- ✅ Results Showcase
- ✅ Glassmorphism Design
- ✅ Animações Fluidas
- ✅ Dark Mode Premium

## Próximos Passos

1. **Conectar Chat Real**: Integrar `AdvancedChatInterface` com `/api/chats`
2. **Listar Modelos**: Buscar modelos do Open WebUI e exibir em `AgentTeamVisualization`
3. **Streaming de Respostas**: Implementar SSE para respostas em tempo real
4. **Persistência**: Salvar conversas e resultados no banco de dados
5. **Autenticação**: Integrar login com Open WebUI

## Variáveis de Ambiente

```bash
# Frontend (.env)
VITE_OPEN_WEBUI_API=http://localhost:8000/api
VITE_API_BASE_URL=http://localhost:3000/api

# Backend Python (.env)
OLLAMA_BASE_URL=http://localhost:11434
DATABASE_URL=sqlite:///./data/webui.db
```

## Documentação

- **Open WebUI**: https://github.com/open-webui/open-webui
- **Autogen**: https://microsoft.github.io/autogen/
- **React**: https://react.dev
- **FastAPI**: https://fastapi.tiangolo.com
