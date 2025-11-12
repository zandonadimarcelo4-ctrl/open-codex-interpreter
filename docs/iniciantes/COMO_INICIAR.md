# 🚀 Como Iniciar - Guia Completo

## ⚠️ Problema: Ambiente Virtual Corrompido

Se você viu o erro sobre pip, o ambiente virtual está corrompido.

### Solução Rápida

Execute este script para recriar o ambiente virtual:

```batch
recriar_venv.bat
```

Isso irá:
1. Remover o ambiente virtual corrompido
2. Criar um novo ambiente virtual
3. Instalar dependências básicas (FastAPI, Uvicorn, Pydantic)

## 📋 Iniciar na Ordem Correta

### Opção 1: Scripts Separados (Recomendado)

#### Terminal 1: Backend
```batch
iniciar_backend.bat
```

#### Terminal 2: Frontend
```batch
iniciar_frontend.bat
```

### Opção 2: Script Automático
```batch
iniciar_tudo_simples.bat
```

### Opção 3: Manual (Passo a Passo)

#### 1. Backend (Terminal 1)
```batch
cd E:\cordex\open-codex-interpreter
.venv\Scripts\activate
python -m uvicorn open_webui.main:app --host 0.0.0.0 --port 8080 --reload
```

**Aguarde:** `Uvicorn running on http://0.0.0.0:8080`

#### 2. Frontend (Terminal 2)
```batch
cd E:\cordex\open-codex-interpreter\autogen_agent_interface
set NODE_ENV=development
set PORT=3000
set VITE_OPEN_WEBUI_API=http://localhost:8080/api
pnpm dev
```

**Aguarde:** `Server running on http://localhost:3000/`

## ✅ Verificar se Está Funcionando

### Backend
Abra no navegador:
- http://localhost:8080/docs

### Frontend
Abra no navegador:
- http://localhost:3000

## 🐛 Se Não Funcionar

### 1. Recriar Ambiente Virtual
```batch
recriar_venv.bat
```

### 2. Instalar Todas as Dependências
```batch
.venv\Scripts\activate
pip install -r requirements.txt
```

### 3. Verificar Frontend
```batch
cd autogen_agent_interface
pnpm install
```

## 📝 Ordem Importante

1. **Backend primeiro** - Deve estar rodando na porta 8080
2. **Frontend depois** - Conecta ao backend na porta 8080

---

**Execute `recriar_venv.bat` primeiro se o ambiente virtual estiver corrompido!** 🎉

