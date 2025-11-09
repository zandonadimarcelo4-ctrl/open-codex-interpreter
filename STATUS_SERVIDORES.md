# 📊 Status dos Servidores

## ✅ Como Verificar se Estão Rodando

### Backend (Porta 8080)
```batch
netstat -ano | findstr ":8080" | findstr "LISTENING"
```

Ou abra no navegador:
- http://localhost:8080/docs

### Frontend (Porta 3000)
```batch
netstat -ano | findstr ":3000" | findstr "LISTENING"
```

Ou abra no navegador:
- http://localhost:3000

## 🚀 Iniciar Manualmente

### Backend
```batch
cd E:\cordex\open-codex-interpreter
.venv\Scripts\activate
python -m uvicorn open_webui.main:app --host 0.0.0.0 --port 8080 --reload
```

### Frontend
```batch
cd E:\cordex\open-codex-interpreter\autogen_agent_interface
set NODE_ENV=development
set PORT=3000
set VITE_OPEN_WEBUI_API=http://localhost:8080/api
pnpm dev
```

## 🌐 URLs para Testar

### Backend
- **API**: http://localhost:8080/api
- **Docs**: http://localhost:8080/docs
- **Health**: http://localhost:8080/health

### Frontend
- **Interface**: http://localhost:3000
- **Landing**: http://localhost:3000/
- **Home**: http://localhost:3000/app
- **Showcase**: http://localhost:3000/showcase
- **tRPC API**: http://localhost:3000/api/trpc

## 🐛 Se Não Estiver Rodando

### Backend não inicia
1. Verifique se Python está instalado: `python --version`
2. Ative ambiente virtual: `.venv\Scripts\activate`
3. Instale dependências: `pip install -r requirements.txt`
4. Tente iniciar manualmente

### Frontend não inicia
1. Verifique se Node.js está instalado: `node --version`
2. Instale pnpm: `npm install -g pnpm`
3. Instale dependências: `cd autogen_agent_interface && pnpm install`
4. Tente iniciar manualmente

## ⏹️ Parar Servidores

### Parar Backend
Pressione `Ctrl+C` na janela do backend

### Parar Frontend
Pressione `Ctrl+C` na janela do frontend

### Parar Tudo
```batch
taskkill /FI "WINDOWTITLE eq Backend Python*" /T /F
taskkill /FI "WINDOWTITLE eq Frontend Completo*" /T /F
```

---

**Execute `iniciar_tudo.bat` para iniciar tudo automaticamente!** 🎉

