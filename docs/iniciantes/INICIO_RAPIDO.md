# 🚀 Início Rápido - Open Codex Interpreter

## ⚡ Setup em 3 Passos (Windows)

### 1️⃣ Executar Setup
```batch
setup_windows.bat
```

### 2️⃣ Iniciar Servidor
```batch
start_windows.bat
```

### 3️⃣ Acessar Interface
Abra no navegador:
```
http://localhost:8080
```

## 📋 O que o Setup Faz

1. ✅ Verifica Python 3.10+
2. ✅ Cria ambiente virtual (.venv)
3. ✅ Instala dependências (requirements.txt)
4. ✅ Cria arquivo .env com configurações padrão
5. ✅ Cria diretórios (data/, data/uploads/, data/cache/)

## 🎯 Configuração Mínima

O projeto funciona **sem configuração adicional**:
- ✅ Banco de dados: SQLite (automático)
- ✅ Porta: 8080 (padrão)
- ✅ Host: 0.0.0.0 (aceita conexões locais)

## 🔧 Configuração Opcional

### Usar Ollama (Modelos Locais)

1. **Instalar Ollama:**
   - Baixe: https://ollama.ai/download
   - Instale e execute

2. **Baixar Modelo:**
   ```batch
   ollama pull llama2
   ```

3. **Configurar (opcional):**
   - Edite `.env`:
   ```env
   OLLAMA_BASE_URL=http://localhost:11434
   ENABLE_OLLAMA_API=True
   ```

### Usar OpenAI

1. **Obter API Key:**
   - https://platform.openai.com/api-keys

2. **Configurar:**
   - Edite `.env`:
   ```env
   OPENAI_API_KEY=sk-...
   ENABLE_OPENAI_API=True
   ```

## 🧪 Testar Instalação

Execute:
```batch
test_setup.bat
```

Este script verifica:
- ✅ Python instalado
- ✅ Ambiente virtual criado
- ✅ Dependências instaladas
- ✅ Arquivo .env configurado
- ✅ Diretórios criados

## 🐛 Problemas?

### Erro: "ModuleNotFoundError"
**Solução:**
```batch
.venv\Scripts\activate
pip install -r requirements.txt
```

### Erro: "Port already in use"
**Solução:** Altere a porta no `.env`:
```env
PORT=8081
```

### Erro: "Database connection failed"
**Solução:** Crie o diretório:
```batch
mkdir data
```

## 📝 Próximos Passos

1. ✅ **Acessar Interface**: http://localhost:8080
2. ✅ **Criar Usuário**: A interface pedirá para criar um usuário admin
3. ✅ **Configurar Modelo**: Adicione Ollama ou OpenAI
4. ✅ **Testar Chat**: Comece a usar!

## 💡 Dicas

- **Desenvolvimento**: O servidor reinicia automaticamente ao modificar código
- **Logs**: Configure `GLOBAL_LOG_LEVEL=DEBUG` no `.env` para mais detalhes
- **Produção**: Use `UVICORN_WORKERS=4` no `.env` para melhor performance

---

**Pronto!** Execute `setup_windows.bat` e depois `start_windows.bat` para começar! 🎉

