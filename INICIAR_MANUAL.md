# 🚀 Como Iniciar Manualmente (Passo a Passo)

## ⚠️ Se o Ambiente Virtual Estiver Corrompido

### Solução: Recriar Ambiente Virtual

```batch
cd E:\cordex\open-codex-interpreter

:: Remover ambiente virtual corrompido
rmdir /s /q .venv

:: Criar novo ambiente virtual
python -m venv .venv

:: Ativar ambiente virtual
.venv\Scripts\activate

:: Atualizar pip
python -m pip install --upgrade pip

:: Instalar dependencias basicas primeiro
pip install fastapi==0.118.0 "uvicorn[standard]==0.37.0" pydantic==2.11.9

:: Depois instalar o resto (pode demorar)
pip install -r requirements.txt
```

## 📋 Iniciar na Ordem Correta

### Passo 1: Iniciar Backend (Terminal 1)

Abra um terminal e execute:

```batch
cd E:\cordex\open-codex-interpreter
.venv\Scripts\activate
python -m uvicorn open_webui.main:app --host 0.0.0.0 --port 8080 --reload
```

**Aguarde aparecer:**
```
INFO:     Uvicorn running on http://0.0.0.0:8080 (Press CTRL+C to quit)
```

### Passo 2: Iniciar Frontend (Terminal 2)

Abra OUTRO terminal e execute:

```batch
cd E:\cordex\open-codex-interpreter\autogen_agent_interface
set NODE_ENV=development
set PORT=3000
set VITE_OPEN_WEBUI_API=http://localhost:8080/api
pnpm dev
```

**Aguarde aparecer:**
```
Server running on http://localhost:3000/
```

## 🧪 Testar

### Backend
- **API**: http://localhost:8080/api
- **Docs**: http://localhost:8080/docs

### Frontend
- **Interface**: http://localhost:3000
- **Landing**: http://localhost:3000/
- **Home**: http://localhost:3000/app

## 🐛 Problemas Comuns

### Backend não inicia
1. Verifique se Python está instalado: `python --version`
2. Recrie ambiente virtual (veja acima)
3. Instale dependências básicas primeiro

### Frontend não inicia
1. Verifique se Node.js está instalado: `node --version`
2. Instale pnpm: `npm install -g pnpm`
3. Instale dependências: `cd autogen_agent_interface && pnpm install`

### Porta ocupada
Altere a porta no comando:
```batch
python -m uvicorn open_webui.main:app --host 0.0.0.0 --port 8081 --reload
```

---

**Execute os comandos acima em ordem!** 🎉

