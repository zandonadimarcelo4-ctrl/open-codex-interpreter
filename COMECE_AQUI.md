# 🚀 Comece Aqui - Open Codex Interpreter

## ⚡ Setup Rápido (3 Comandos)

### Windows:
```batch
# 1. Setup automático
setup_windows.bat

# 2. Iniciar servidor
start_windows.bat

# 3. Acessar no navegador
# http://localhost:8080
```

## 📋 O que Você Precisa

- ✅ Python 3.10 ou superior
- ✅ pip (vem com Python)
- ✅ Conexão com internet (para instalar dependências)

## 🎯 Setup Passo a Passo

### Passo 1: Executar Setup
```batch
setup_windows.bat
```

**O que faz:**
- Verifica Python
- Cria ambiente virtual (.venv)
- Instala todas as dependências
- Cria arquivo .env
- Cria diretórios necessários

### Passo 2: Iniciar Servidor
```batch
start_windows.bat
```

**O que faz:**
- Ativa ambiente virtual
- Gera chave secreta (se necessário)
- Inicia servidor FastAPI na porta 8080

### Passo 3: Acessar Interface
Abra no navegador:
```
http://localhost:8080
```

## 🔧 Configuração (Opcional)

### Arquivo .env
O arquivo `.env` foi criado automaticamente. Você pode editá-lo para:

**Ollama (Modelos Locais):**
```env
OLLAMA_BASE_URL=http://localhost:11434
ENABLE_OLLAMA_API=True
```

**OpenAI:**
```env
OPENAI_API_KEY=sk-...
ENABLE_OPENAI_API=True
```

**Porta (se 8080 estiver ocupada):**
```env
PORT=8081
```

## 🧪 Testar Instalação

Execute:
```batch
test_setup.bat
```

Verifica se tudo está configurado corretamente.

## 🐛 Problemas Comuns

### "ModuleNotFoundError"
**Solução:**
```batch
.venv\Scripts\activate
pip install -r requirements.txt
```

### "Port already in use"
**Solução:** Altere a porta no `.env`:
```env
PORT=8081
```

### "Database connection failed"
**Solução:**
```batch
mkdir data
```

## 📝 Primeiro Uso

1. **Acesse**: http://localhost:8080
2. **Crie Usuário**: A interface pedirá para criar um usuário admin
3. **Configure Modelo**: 
   - Ollama: Instale e configure
   - OpenAI: Adicione API key
4. **Teste Chat**: Comece a usar!

## 💡 Dicas

- **Desenvolvimento**: O servidor reinicia automaticamente ao modificar código
- **Logs**: Configure `GLOBAL_LOG_LEVEL=DEBUG` no `.env` para mais detalhes
- **Produção**: Use `UVICORN_WORKERS=4` no `.env` para melhor performance

## 📚 Documentação

- **Setup Completo**: `SETUP_GUIDE.md`
- **Início Rápido**: `QUICK_START.md`
- **Análise do Projeto**: `ANALISE_E_TAREFAS.md`

---

**Pronto!** Execute `setup_windows.bat` e depois `start_windows.bat` para começar! 🎉

