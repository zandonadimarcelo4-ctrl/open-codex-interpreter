# 🚀 Início Completo - Backend + Frontend

## ⚡ Setup em 3 Passos

### 1️⃣ Setup Backend (Python)
```batch
setup_windows.bat
```

### 2️⃣ Setup Frontend (Node.js)
```batch
npm install
```

### 3️⃣ Iniciar Tudo
```batch
start_full.bat
```

Isso irá iniciar:
- ✅ **Backend Python** na porta 8080 (http://localhost:8080)
- ✅ **Frontend React** na porta 3000 (http://localhost:3000)

## 📋 O que Cada Servidor Faz

### Backend (Python - Porta 8080)
- **Framework**: FastAPI (uvicorn)
- **API**: http://localhost:8080/api
- **Docs**: http://localhost:8080/docs
- **Arquivo**: `open_webui/main.py`

### Frontend (React - Porta 3000)
- **Framework**: React + Vite
- **Interface**: http://localhost:3000
- **Arquivo**: `main.tsx`
- **Proxy**: `/api` → `http://localhost:8080/api`

## 🔧 Configuração

### Arquivo `.env`
```env
# Backend
HOST=0.0.0.0
PORT=8080
DATABASE_URL=sqlite:///./data/webui.db

# Frontend (opcional)
NODE_ENV=development
VITE_API_BASE_URL=http://localhost:8080/api
```

## 🧪 Testar

### 1. Backend
Abra: http://localhost:8080/docs
- Deve mostrar a documentação da API

### 2. Frontend
Abra: http://localhost:3000
- Deve mostrar a interface React

## 🐛 Problemas

### Backend não inicia
```batch
.venv\Scripts\activate
pip install -r requirements.txt
```

### Frontend não inicia
```batch
npm install
```

### Porta ocupada
Altere no `.env`:
```env
PORT=8081  # Backend
```
E no `vite.config.ts`:
```typescript
server: { port: 3001 }
```

## 📝 Scripts Disponíveis

### Backend
```batch
# Apenas backend
start_windows.bat

# Manualmente
.venv\Scripts\activate
python -m uvicorn open_webui.main:app --reload
```

### Frontend
```batch
# Apenas frontend
npm run dev

# Build
npm run build
```

### Ambos
```batch
# Backend + Frontend
start_full.bat
```

## 💡 Dicas

1. **Hot Reload**: Frontend tem hot reload automático
2. **Auto-reload**: Backend usa `--reload` para auto-reload
3. **Logs**: Configure `GLOBAL_LOG_LEVEL=DEBUG` no `.env`
4. **Produção**: Build frontend com `npm run build`

## 🔗 URLs

- **Backend API**: http://localhost:8080/api
- **Backend Docs**: http://localhost:8080/docs
- **Frontend**: http://localhost:3000

---

**Pronto!** Execute `setup_windows.bat`, `npm install`, e então `start_full.bat`! 🎉

