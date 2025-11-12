# 🚀 Setup Completo - Backend + Frontend

## ⚡ Início Rápido

### 1️⃣ Setup Inicial
```batch
setup_windows.bat
```

### 2️⃣ Instalar Dependências do Frontend
```batch
npm install
```

### 3️⃣ Iniciar Backend + Frontend
```batch
start_full.bat
```

Isso irá iniciar:
- ✅ **Backend Python** na porta 8080 (http://localhost:8080)
- ✅ **Frontend React** na porta 3000 (http://localhost:3000)

## 📋 Estrutura

### Backend (Python)
- **Porta**: 8080
- **Framework**: FastAPI (uvicorn)
- **Arquivo**: `open_webui/main.py`
- **API**: http://localhost:8080/api

### Frontend (React + TypeScript)
- **Porta**: 3000
- **Framework**: React + Vite
- **Arquivo**: `index.ts` (servidor Express)
- **Interface**: http://localhost:3000

## 🔧 Configuração

### Variáveis de Ambiente

Crie um arquivo `.env` na raiz:

```env
# Backend
HOST=0.0.0.0
PORT=8080
DATABASE_URL=sqlite:///./data/webui.db

# Frontend
NODE_ENV=development
VITE_API_BASE_URL=http://localhost:8080/api
```

### Proxy do Frontend

O frontend está configurado para fazer proxy das requisições `/api` para o backend:

```typescript
// vite.config.ts
server: {
  proxy: {
    "/api": {
      target: "http://localhost:8080",
      changeOrigin: true,
    },
  },
}
```

## 🧪 Testar

### 1. Verificar Backend
Abra no navegador:
```
http://localhost:8080/docs
```
Deve mostrar a documentação da API (Swagger).

### 2. Verificar Frontend
Abra no navegador:
```
http://localhost:3000
```
Deve mostrar a interface React.

## 🐛 Problemas Comuns

### Erro: "ModuleNotFoundError" (Backend)
**Solução:**
```batch
.venv\Scripts\activate
pip install -r requirements.txt
```

### Erro: "Cannot find module" (Frontend)
**Solução:**
```batch
npm install
```

### Erro: "Port already in use"
**Solução:** Altere as portas no `.env`:
```env
PORT=8081  # Backend
# E no vite.config.ts:
server: { port: 3001 }
```

### Frontend não conecta ao Backend
**Solução:** Verifique se:
1. Backend está rodando na porta 8080
2. Proxy está configurado corretamente no `vite.config.ts`
3. CORS está habilitado no backend

## 📝 Scripts Disponíveis

### Backend
```batch
# Iniciar apenas backend
start_windows.bat

# Ou manualmente
.venv\Scripts\activate
python -m uvicorn open_webui.main:app --reload
```

### Frontend
```batch
# Iniciar apenas frontend
npm run dev

# Build para produção
npm run build
```

### Ambos
```batch
# Iniciar backend + frontend
start_full.bat
```

## 💡 Dicas

1. **Desenvolvimento**: Use `--reload` no backend para auto-reload
2. **Hot Reload**: O frontend tem hot reload automático com Vite
3. **Logs**: Configure `GLOBAL_LOG_LEVEL=DEBUG` no `.env` para mais detalhes
4. **Produção**: Build o frontend com `npm run build` e sirva os arquivos estáticos

## 🔗 URLs

- **Backend API**: http://localhost:8080/api
- **Backend Docs**: http://localhost:8080/docs
- **Frontend**: http://localhost:3000

---

**Pronto!** Execute `setup_windows.bat`, depois `npm install`, e então `start_full.bat` para começar! 🎉

