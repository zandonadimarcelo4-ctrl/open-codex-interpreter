# 🚀 Como Usar Scripts .bat

Este guia explica como usar os scripts .bat para iniciar os servidores do projeto no Windows.

## 📋 Pré-requisitos

- **Windows** (qualquer versão recente)
- **Python** 3.10+ instalado
- **Node.js** 20+ instalado
- **pnpm** ou **npm** instalado

## 🚀 Scripts Disponíveis

### 1. `iniciar_servidor.bat` - Script Principal

Este é o script principal que inicia todos os servidores.

**Uso básico:**
```batch
iniciar_servidor.bat
```

**Opções disponíveis:**
```batch
# Iniciar todos os servidores
iniciar_servidor.bat

# Iniciar com Streamlit também
iniciar_servidor.bat --streamlit

# Apenas backend Python
iniciar_servidor.bat --no-frontend --no-build

# Apenas frontend React
iniciar_servidor.bat --no-backend

# Não fazer build (usar build existente)
iniciar_servidor.bat --no-build

# Ver todas as opções
iniciar_servidor.bat --help
```

**O que faz:**
1. ✅ Verifica se Python está instalado
2. ✅ Verifica se o script Python existe
3. ✅ Faz build do frontend React (Apple)
4. ✅ Inicia o backend Python (FastAPI) na porta 8000
5. ✅ Inicia o servidor TypeScript (frontend React) na porta 3000
6. ✅ Opcionalmente inicia o frontend Streamlit (básico) na porta 8501

### 2. `iniciar_servidor_streamlit.bat` - Com Streamlit

Este script inicia todos os servidores, incluindo o frontend Streamlit.

**Uso:**
```batch
iniciar_servidor_streamlit.bat
```

**O que faz:**
- Inicia backend Python (porta 8000)
- Inicia servidor TypeScript (porta 3000)
- Inicia frontend Streamlit (porta 8501)

### 3. `iniciar_servidor_backend_only.bat` - Apenas Backend

Este script inicia apenas o backend Python.

**Uso:**
```batch
iniciar_servidor_backend_only.bat
```

**O que faz:**
- Inicia apenas o backend Python (porta 8000)
- Não faz build do frontend React
- Não inicia o servidor TypeScript

### 4. `iniciar_servidor_frontend_only.bat` - Apenas Frontend

Este script inicia apenas o frontend React.

**Uso:**
```batch
iniciar_servidor_frontend_only.bat
```

**O que faz:**
- Faz build do frontend React
- Inicia o servidor TypeScript (porta 3000)
- Não inicia o backend Python

## 📊 Exemplos de Uso

### Exemplo 1: Iniciar Todos os Servidores

```batch
iniciar_servidor.bat
```

**Resultado:**
- ✅ Build do frontend React concluído
- ✅ Backend Python iniciado em http://localhost:8000
- ✅ Servidor TypeScript iniciado em http://localhost:3000

### Exemplo 2: Iniciar com Streamlit

```batch
iniciar_servidor_streamlit.bat
```

**Resultado:**
- ✅ Build do frontend React concluído
- ✅ Backend Python iniciado em http://localhost:8000
- ✅ Servidor TypeScript iniciado em http://localhost:3000
- ✅ Frontend Streamlit iniciado em http://localhost:8501

### Exemplo 3: Apenas Backend Python

```batch
iniciar_servidor_backend_only.bat
```

**Resultado:**
- ✅ Backend Python iniciado em http://localhost:8000
- ⏭️ Frontend React não iniciado

### Exemplo 4: Apenas Frontend React

```batch
iniciar_servidor_frontend_only.bat
```

**Resultado:**
- ✅ Build do frontend React concluído
- ✅ Servidor TypeScript iniciado em http://localhost:3000
- ⏭️ Backend Python não iniciado

## 🌐 URLs dos Servidores

Após iniciar os servidores, você pode acessar:

- **Backend Python (FastAPI)**: http://localhost:8000
- **WebSocket**: ws://localhost:8000/ws
- **Frontend React (Apple)**: http://localhost:3000
- **Frontend Streamlit (Básico)**: http://localhost:8501

## 🛠️ Troubleshooting

### Erro: "Python não encontrado"

**Solução:**
1. Instale Python 3.10+ de https://www.python.org/
2. Certifique-se de adicionar Python ao PATH durante a instalação
3. Reinicie o terminal e tente novamente

### Erro: "Arquivo iniciar_servidor.py não encontrado"

**Solução:**
1. Certifique-se de estar no diretório raiz do projeto
2. Verifique se o arquivo `iniciar_servidor.py` existe
3. Execute `dir iniciar_servidor.py` para verificar

### Erro: "Node.js não encontrado"

**Solução:**
1. Instale Node.js 20+ de https://nodejs.org/
2. Certifique-se de adicionar Node.js ao PATH durante a instalação
3. Reinicie o terminal e tente novamente

### Erro: "Porta já está em uso"

**Solução:**
1. Encerre o processo que está usando a porta:
   ```batch
   netstat -ano | findstr :8000
   taskkill /PID <PID> /F
   ```
2. Ou mude a porta nos arquivos de configuração

### Erro: "Dependências não instaladas"

**Solução:**
1. Instale as dependências Python:
   ```batch
   pip install -r requirements.txt
   ```
2. Instale as dependências Node.js:
   ```batch
   cd autogen_agent_interface
   pnpm install
   ```

## 📝 Notas

- Os scripts verificam automaticamente se Python está instalado
- Os scripts verificam se as dependências estão instaladas
- Os scripts verificam se as portas estão em uso
- Pressione `Ctrl+C` para encerrar os servidores
- Os scripts podem ser executados diretamente clicando duas vezes neles

## 🔗 Links Úteis

- [README.md](../../README.md) - Documentação principal
- [COMO_INICIAR_SERVIDORES.md](./COMO_INICIAR_SERVIDORES.md) - Guia completo sobre como iniciar servidores
- [COMO_PROGRAMAR.md](./COMO_PROGRAMAR.md) - Como programar no projeto
- [GUIA_PARA_INICIANTES.md](./GUIA_PARA_INICIANTES.md) - Guia para iniciantes

---

**Última atualização**: 2025-01-12
**Criado por**: Sistema de documentação automática

