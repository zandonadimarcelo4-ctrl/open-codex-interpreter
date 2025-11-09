# Guia de Configuração - Open Codex Interpreter

## 🚀 Setup Rápido (Windows)

### 1. Executar Setup Automático
```batch
setup_windows.bat
```

Este script irá:
- ✅ Verificar Python
- ✅ Criar ambiente virtual
- ✅ Instalar dependências
- ✅ Criar arquivo `.env`
- ✅ Criar diretórios necessários

### 2. Configurar Variáveis de Ambiente (Opcional)
Edite o arquivo `.env` criado e configure:
- `OLLAMA_BASE_URL` - URL do Ollama (padrão: http://localhost:11434)
- `DATABASE_URL` - URL do banco de dados (padrão: SQLite)
- `PORT` - Porta do servidor (padrão: 8080)

### 3. Iniciar Servidor
```batch
start_windows.bat
```

Ou:
```batch
python -m open_codex serve
```

### 4. Acessar Interface Web
Abra no navegador:
```
http://localhost:8080
```

## 📋 Setup Manual

### Pré-requisitos
- Python 3.10 ou superior
- pip (geralmente vem com Python)

### Passo 1: Criar Ambiente Virtual
```bash
python -m venv .venv
```

### Passo 2: Ativar Ambiente Virtual

**Windows:**
```batch
.venv\Scripts\activate
```

**Linux/Mac:**
```bash
source .venv/bin/activate
```

### Passo 3: Instalar Dependências
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### Passo 4: Configurar Variáveis de Ambiente
```bash
# Copiar arquivo de exemplo
cp .env.example .env

# Editar .env com suas configurações
# (opcional, valores padrão funcionam)
```

### Passo 5: Criar Diretórios
```bash
mkdir -p data/uploads
mkdir -p data/cache
```

### Passo 6: Iniciar Servidor

**Opção 1: Usando script**
```batch
# Windows
start_windows.bat

# Linux/Mac
./start.sh
```

**Opção 2: Usando Python**
```bash
python -m open_codex serve
```

**Opção 3: Usando uvicorn diretamente**
```bash
uvicorn open_webui.main:app --host 0.0.0.0 --port 8080 --reload
```

## 🔧 Configuração Avançada

### Variáveis de Ambiente Importantes

#### Segurança
```bash
WEBUI_SECRET_KEY=          # Gerado automaticamente se não fornecido
WEBUI_JWT_SECRET_KEY=      # Gerado automaticamente se não fornecido
```

#### Servidor
```bash
HOST=0.0.0.0              # Host do servidor
PORT=8080                  # Porta do servidor
UVICORN_WORKERS=1          # Número de workers
```

#### Banco de Dados
```bash
# SQLite (desenvolvimento)
DATABASE_URL=sqlite:///./data/webui.db

# PostgreSQL (produção)
DATABASE_URL=postgresql://user:password@localhost:5432/open_codex

# MySQL (produção)
DATABASE_URL=mysql://user:password@localhost:3306/open_codex
```

#### Ollama (Modelos Locais)
```bash
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_API_BASE_URL=http://localhost:11434/api
ENABLE_OLLAMA_API=True
```

#### Open Interpreter
```bash
OPENINTERPRETER_MODE=local
OPENINTERPRETER_SANDBOX=false
```

### Instalar Ollama (Opcional)

Para usar modelos locais, instale o Ollama:

**Windows:**
1. Baixe de: https://ollama.ai/download
2. Instale e execute
3. Baixe um modelo: `ollama pull llama2`

**Linux/Mac:**
```bash
curl -fsSL https://ollama.ai/install.sh | sh
ollama pull llama2
```

## 🧪 Testar Instalação

### 1. Verificar Python
```bash
python --version
# Deve mostrar Python 3.10 ou superior
```

### 2. Verificar Dependências
```bash
python -c "import fastapi; print('FastAPI OK')"
python -c "import uvicorn; print('Uvicorn OK')"
python -c "import open_webui; print('Open WebUI OK')"
```

### 3. Testar Servidor
```bash
python -m open_codex serve
```

Acesse: http://localhost:8080

## 🐛 Solução de Problemas

### Erro: "ModuleNotFoundError: No module named 'open_webui'"
**Solução:** Certifique-se de que o ambiente virtual está ativado e as dependências foram instaladas.

### Erro: "Port already in use"
**Solução:** Altere a porta no `.env` ou pare o processo que está usando a porta 8080.

### Erro: "Database connection failed"
**Solução:** Verifique a `DATABASE_URL` no `.env`. Para SQLite, certifique-se de que o diretório `data/` existe.

### Erro: "Ollama connection failed"
**Solução:** 
- Verifique se o Ollama está rodando: `ollama serve`
- Verifique a `OLLAMA_BASE_URL` no `.env`
- Ou desabilite: `ENABLE_OLLAMA_API=False`

## 📝 Próximos Passos

1. **Acessar Interface Web**: http://localhost:8080
2. **Criar Primeiro Usuário**: A interface pedirá para criar um usuário admin
3. **Configurar Modelos**: Adicione modelos Ollama ou OpenAI
4. **Testar Chat**: Comece a usar o chat com o modelo configurado

## 🔗 Links Úteis

- **Ollama**: https://ollama.ai
- **Open Interpreter**: https://github.com/KillianLucas/open-interpreter
- **Open WebUI**: https://github.com/open-webui/open-webui
- **Documentação FastAPI**: https://fastapi.tiangolo.com

## 💡 Dicas

1. **Desenvolvimento**: Use `--reload` para auto-reload:
   ```bash
   uvicorn open_webui.main:app --reload
   ```

2. **Produção**: Use múltiplos workers:
   ```bash
   UVICORN_WORKERS=4 python -m open_codex serve
   ```

3. **Logs**: Configure `GLOBAL_LOG_LEVEL=DEBUG` no `.env` para mais detalhes

4. **Banco de Dados**: SQLite é suficiente para desenvolvimento. Use PostgreSQL/MySQL para produção.

---

**Pronto!** Agora você pode testar a interface web. 🎉

