# 🚀 Iniciar Agora - Guia Rápido

## ⚡ Início Automático (Recomendado)

Execute o script que faz tudo automaticamente:

```batch
iniciar_tudo.bat
```

Este script irá:
1. ✅ Verificar Python
2. ✅ Criar ambiente virtual (se necessário)
3. ✅ Instalar dependências Python (se necessário)
4. ✅ Verificar Node.js e pnpm
5. ✅ Instalar dependências do frontend (se necessário)
6. ✅ Iniciar Backend na porta 8080
7. ✅ Iniciar Frontend na porta 3000

## 📋 Início Manual (Passo a Passo)

### Passo 1: Setup Backend
```batch
setup_windows.bat
```

### Passo 2: Setup Frontend
```batch
cd autogen_agent_interface
pnpm install
cd ..
```

### Passo 3: Iniciar Backend
```batch
start_windows.bat
```

Ou manualmente:
```batch
.venv\Scripts\activate
python -m uvicorn open_webui.main:app --host 0.0.0.0 --port 8080 --reload
```

### Passo 4: Iniciar Frontend (em outra janela)
```batch
cd autogen_agent_interface
set NODE_ENV=development
set PORT=3000
set VITE_OPEN_WEBUI_API=http://localhost:8080/api
pnpm dev
```

## 🧪 Testar

### 1. Backend
Abra no navegador:
- **API**: http://localhost:8080/api
- **Docs**: http://localhost:8080/docs

### 2. Frontend
Abra no navegador:
- **Interface**: http://localhost:3000
- **Landing**: http://localhost:3000/
- **Home**: http://localhost:3000/app
- **Showcase**: http://localhost:3000/showcase

## 🐛 Problemas?

### Backend não inicia
```batch
.venv\Scripts\activate
pip install -r requirements.txt
```

### Frontend não inicia
```batch
cd autogen_agent_interface
pnpm install
```

### Porta ocupada
Altere no `.env`:
```env
PORT=8081  # Backend
```

E no `autogen_agent_interface/.env`:
```env
PORT=3001  # Frontend
```

## 📝 Ordem de Inicialização

1. **Backend primeiro** (porta 8080)
   - Aguarde aparecer: "Uvicorn running on http://0.0.0.0:8080"

2. **Frontend depois** (porta 3000)
   - Aguarde aparecer: "Server running on http://localhost:3000/"

## ✅ Verificar se Está Funcionando

### Backend
```batch
curl http://localhost:8080/docs
```

### Frontend
```batch
curl http://localhost:3000
```

---

**Pronto!** Execute `iniciar_tudo.bat` e tudo será iniciado automaticamente! 🎉

