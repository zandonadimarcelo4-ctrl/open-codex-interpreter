# 🚀 Quick Start - Open Codex Interpreter

## Setup Rápido (Windows)

### 1️⃣ Executar Setup Automático
```batch
setup_windows.bat
```

Este script irá:
- ✅ Verificar Python
- ✅ Criar ambiente virtual (.venv)
- ✅ Instalar todas as dependências
- ✅ Criar arquivo `.env` com configurações padrão
- ✅ Criar diretórios necessários (data/, data/uploads/, data/cache/)

### 2️⃣ Iniciar Servidor
```batch
start_windows.bat
```

Ou manualmente:
```batch
.venv\Scripts\activate
python -m uvicorn open_webui.main:app --host 0.0.0.0 --port 8080 --reload
```

### 3️⃣ Acessar Interface Web
Abra no navegador:
```
http://localhost:8080
```

## 📋 Setup Manual (Passo a Passo)

### Pré-requisitos
- ✅ Python 3.10 ou superior
- ✅ pip (vem com Python)

### Passo 1: Criar Ambiente Virtual
```batch
python -m venv .venv
```

### Passo 2: Ativar Ambiente Virtual
```batch
.venv\Scripts\activate
```

### Passo 3: Instalar Dependências
```batch
pip install --upgrade pip
pip install -r requirements.txt
```

### Passo 4: Configurar Ambiente
```batch
copy env.example .env
```

Edite o `.env` se necessário (valores padrão funcionam).

### Passo 5: Criar Diretórios
```batch
mkdir data
mkdir data\uploads
mkdir data\cache
```

### Passo 6: Iniciar Servidor
```batch
start_windows.bat
```

## 🎯 Configuração Mínima

O projeto funciona com configuração mínima:

1. **Banco de Dados**: SQLite (automático, não precisa configurar)
2. **Porta**: 8080 (padrão)
3. **Host**: 0.0.0.0 (aceita conexões de qualquer IP)

**Variáveis opcionais:**
- `OLLAMA_BASE_URL` - Se usar Ollama (padrão: http://localhost:11434)
- `OPENAI_API_KEY` - Se usar OpenAI (opcional)

## 🧪 Testar Instalação

### 1. Verificar Python
```batch
python --version
```
Deve mostrar Python 3.10 ou superior.

### 2. Verificar Dependências
```batch
python -c "import fastapi; print('FastAPI OK')"
python -c "import uvicorn; print('Uvicorn OK')"
```

### 3. Iniciar e Testar
```batch
start_windows.bat
```

Acesse: http://localhost:8080

## 🔧 Configuração Opcional

### Usar Ollama (Modelos Locais)

1. **Instalar Ollama:**
   - Windows: https://ollama.ai/download
   - Baixe e instale

2. **Iniciar Ollama:**
   ```batch
   ollama serve
   ```

3. **Baixar um modelo:**
   ```batch
   ollama pull llama2
   ```

4. **Configurar no .env:**
   ```env
   OLLAMA_BASE_URL=http://localhost:11434
   ENABLE_OLLAMA_API=True
   ```

### Usar OpenAI

1. **Obter API Key:**
   - Acesse: https://platform.openai.com/api-keys
   - Crie uma chave

2. **Configurar no .env:**
   ```env
   OPENAI_API_KEY=sk-...
   ENABLE_OPENAI_API=True
   ```

## 🐛 Problemas Comuns

### Erro: "ModuleNotFoundError"
**Solução:** Ative o ambiente virtual:
```batch
.venv\Scripts\activate
```

### Erro: "Port already in use"
**Solução:** Altere a porta no `.env`:
```env
PORT=8081
```

### Erro: "Database connection failed"
**Solução:** Certifique-se de que o diretório `data/` existe:
```batch
mkdir data
```

### Erro: "Ollama connection failed"
**Solução:** 
- Verifique se Ollama está rodando: `ollama serve`
- Ou desabilite: `ENABLE_OLLAMA_API=False` no `.env`

## 📝 Próximos Passos

1. ✅ **Acessar Interface**: http://localhost:8080
2. ✅ **Criar Usuário**: A interface pedirá para criar um usuário admin
3. ✅ **Configurar Modelo**: Adicione Ollama ou OpenAI
4. ✅ **Testar Chat**: Comece a usar!

## 💡 Dicas

- **Desenvolvimento**: Use `--reload` para auto-reload:
  ```batch
  uvicorn open_webui.main:app --reload
  ```

- **Produção**: Use múltiplos workers:
  ```env
  UVICORN_WORKERS=4
  ```

- **Logs**: Configure `GLOBAL_LOG_LEVEL=DEBUG` no `.env` para mais detalhes

---

**Pronto!** Agora você pode testar a interface web. 🎉

Para mais detalhes, veja `SETUP_GUIDE.md`.

