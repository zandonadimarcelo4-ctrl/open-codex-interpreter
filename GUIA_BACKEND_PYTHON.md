# 🐍 Guia Backend Python - 100% Python para Iniciantes

## 🎯 O Que É Este Backend?

Este é um **backend 100% Python** que:
- ✅ Usa AutoGen para comandar TUDO
- ✅ Se conecta ao After Effects MCP Vision via MCP protocol
- ✅ Mantém TODAS as funcionalidades (AutoGen, Open Interpreter, Selenium, PyAutoGUI, After Effects MCP)
- ✅ Código bem comentado em português para iniciantes
- ✅ API REST simples (FastAPI)
- ✅ WebSocket para chat em tempo real

## 🚀 Vantagens

### ✅ **Simplicidade**
- **100% Python**: Nada de TypeScript/Node.js
- **Código claro**: Bem comentado em português
- **Fácil de entender**: Usa conceitos básicos de Python

### ✅ **Todas as Funcionalidades**
- ✅ AutoGen Commander (comanda tudo)
- ✅ Open Interpreter (execução de código)
- ✅ Web Browsing (Selenium)
- ✅ GUI Automation (PyAutoGUI/UFO)
- ✅ After Effects MCP (edição de vídeo)
- ✅ Chat em tempo real (WebSocket)

### ✅ **Integração After Effects MCP**
- ✅ Conecta ao servidor After Effects MCP Vision
- ✅ 30+ ferramentas MCP disponíveis
- ✅ Visão visual em tempo real
- ✅ Renderização de frames
- ✅ Criação de composições
- ✅ Edição de vídeo completa

---

## 📦 Instalação

### 1. Instalar Dependências

```bash
# FastAPI (API REST)
pip install fastapi uvicorn

# AutoGen (comanda tudo)
pip install autogen-agentchat autogen-ext[openai] autogen-ext[ollama]

# MCP SDK (cliente MCP)
pip install mcp

# Outras dependências
pip install requests websocket-client
```

### 2. Instalar After Effects MCP Vision

```bash
# Clonar repositório
git clone https://github.com/VolksRat71/after-effects-mcp-vision.git
cd after-effects-mcp-vision

# Instalar dependências
npm install

# Build TypeScript e JSX
npm run build

# Instalar bridge no After Effects
npm run bridge-install
```

### 3. Configurar Variáveis de Ambiente

Crie um arquivo `.env`:

```env
# Ollama
OLLAMA_BASE_URL=http://localhost:11434
DEFAULT_MODEL=qwen2.5:7b
EXECUTOR_MODEL=qwen2.5-coder:7b

# Workspace
WORKSPACE_PATH=./workspace

# After Effects MCP
AFTER_EFFECTS_MCP_PATH=/caminho/para/after-effects-mcp-vision/build/server/index.js
```

---

## 🚀 Como Usar

### 1. Iniciar Backend

```bash
# No diretório do projeto
cd open-codex-interpreter/super_agent

# Executar backend
python backend_python.py
```

### 2. Verificar Backend

Abra o navegador em:
```
http://localhost:8000
```

Você deve ver:
```json
{
  "message": "Super Agent - Backend Python",
  "version": "1.0.0",
  "status": "running",
  "autogen_available": true,
  "mcp_available": true,
  "after_effects_connected": true
}
```

### 3. Usar API REST

```bash
# Enviar mensagem
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Oi! Como você está?"}'
```

### 4. Usar WebSocket

```python
import websocket
import json

def on_message(ws, message):
    data = json.loads(message)
    print(f"Resposta: {data.get('message')}")

ws = websocket.WebSocketApp(
    "ws://localhost:8000/ws/client_123",
    on_message=on_message
)
ws.run_forever()
```

### 5. Usar Frontend Streamlit

```bash
# Executar frontend
streamlit run frontend_streamlit.py
```

Acesse: `http://localhost:8501`

---

## 📁 Estrutura do Código

### `backend_python.py` - Backend Principal

```python
class SuperAgentBackend:
    """
    Backend Super Agent - 100% Python
    
    Este backend:
    - Gerencia AutoGen Commander
    - Gerencia cliente MCP do After Effects
    - Processa mensagens do usuário
    - Executa tarefas via AutoGen
    - Integra com After Effects via MCP
    """
    
    def __init__(self):
        """Inicializar backend"""
        # Criar AutoGen Commander
        self.commander = create_simple_commander(...)
        self.team = RoundRobinGroupChat(agents=[self.commander])
        
        # Criar cliente MCP do After Effects
        self.ae_mcp_client = AfterEffectsMCPClient(...)
        await self.ae_mcp_client.connect()
    
    async def process_message(self, message: str, context: dict):
        """Processar mensagem do usuário"""
        # Detectar intenção
        intent = self.detect_intent_simple(message)
        
        # Se ação → usar AutoGen Commander
        if intent["type"] == "action":
            result = await self.team.run(task=message)
        
        # Se conversa → usar Ollama diretamente
        else:
            response = requests.post(...)
```

### `AfterEffectsMCPClient` - Cliente MCP

```python
class AfterEffectsMCPClient:
    """
    Cliente MCP para After Effects
    
    Este cliente se conecta ao servidor After Effects MCP Vision
    e permite controlar o After Effects via MCP protocol.
    """
    
    async def connect(self):
        """Conectar ao servidor MCP"""
        # Configurar servidor MCP (stdio)
        server_params = StdioServerParameters(
            command="node",
            args=[self.mcp_server_path],
            env=None
        )
        
        # Conectar via stdio
        read_stream, write_stream = await stdio_client(server_params)
        
        # Criar sessão MCP
        self.session = ClientSession(read_stream, write_stream)
        await self.session.initialize()
    
    async def call_tool(self, tool_name: str, arguments: dict):
        """Chamar ferramenta MCP"""
        result = await self.session.call_tool(tool_name, arguments)
        return result
```

---

## 🎬 Integração After Effects MCP

### 1. Conectar ao After Effects MCP

```python
# Criar cliente MCP
ae_mcp_client = AfterEffectsMCPClient(
    mcp_server_path="/caminho/para/after-effects-mcp-vision/build/server/index.js"
)

# Conectar
await ae_mcp_client.connect()
```

### 2. Criar Composição

```python
# Criar composição
result = await ae_mcp_client.call_tool(
    "create-composition",
    {
        "name": "My Comp",
        "width": 1920,
        "height": 1080,
        "duration": 10.0,
        "frameRate": 30.0
    }
)
```

### 3. Adicionar Camada

```python
# Adicionar camada de texto
result = await ae_mcp_client.call_tool(
    "add-layer",
    {
        "composition": "My Comp",
        "layerType": "text",
        "name": "Title Layer",
        "text": "Hello World"
    }
)
```

### 4. Renderizar Frame

```python
# Renderizar frame
result = await ae_mcp_client.call_tool(
    "render-frame",
    {
        "composition": "My Comp",
        "time": 0.0
    }
)

# Resultado contém caminho para imagem PNG
image_path = result.get("imagePath")
```

### 5. Visualizar Composição

```python
# Visualizar composição
result = await ae_mcp_client.call_tool(
    "visualize-composition",
    {
        "composition": "My Comp"
    }
)

# Resultado contém caminho para imagem PNG
image_path = result.get("imagePath")
```

---

## 🔧 API REST

### Endpoints

#### `GET /`
**Descrição**: Informações do backend

**Resposta**:
```json
{
  "message": "Super Agent - Backend Python",
  "version": "1.0.0",
  "status": "running",
  "autogen_available": true,
  "mcp_available": true,
  "after_effects_connected": true
}
```

#### `GET /health`
**Descrição**: Health check

**Resposta**:
```json
{
  "status": "healthy",
  "timestamp": "2025-01-01T12:00:00"
}
```

#### `POST /api/chat`
**Descrição**: Enviar mensagem

**Body**:
```json
{
  "message": "Sua mensagem aqui",
  "context": {}  // Opcional
}
```

**Resposta**:
```json
{
  "success": true,
  "response": "Resposta do assistente",
  "intent": {
    "type": "action",
    "confidence": 0.8
  },
  "timestamp": "2025-01-01T12:00:00"
}
```

#### `GET /api/tools`
**Descrição**: Listar ferramentas disponíveis

**Resposta**:
```json
{
  "tools": [
    {
      "name": "autogen",
      "description": "AutoGen Commander (comanda tudo)",
      "available": true
    },
    {
      "name": "create-composition",
      "description": "Criar composição no After Effects",
      "available": true,
      "source": "after_effects_mcp"
    }
  ]
}
```

#### `WebSocket /ws/{client_id}`
**Descrição**: Chat em tempo real via WebSocket

**Mensagens**:
- **Enviar**: `{"type": "text", "message": "Sua mensagem"}`
- **Receber**: `{"type": "assistant", "message": "Resposta do assistente"}`

---

## 🔌 WebSocket

### Conexão

```python
import websocket
import json

def on_message(ws, message):
    data = json.loads(message)
    print(f"Tipo: {data.get('type')}")
    print(f"Mensagem: {data.get('message')}")

def on_error(ws, error):
    print(f"Erro: {error}")

def on_close(ws, close_status_code, close_msg):
    print("Conexão fechada")

def on_open(ws):
    # Enviar mensagem
    ws.send(json.dumps({
        "type": "text",
        "message": "Oi! Como você está?"
    }))

ws = websocket.WebSocketApp(
    "ws://localhost:8000/ws/client_123",
    on_message=on_message,
    on_error=on_error,
    on_close=on_close,
    on_open=on_open
)
ws.run_forever()
```

---

## 🎯 Exemplos de Uso

### Exemplo 1: Conversa Simples

```python
# Enviar mensagem
response = client.send_message("Oi! Como você está?")

# Resposta
print(response["response"])
# "Oi! Estou bem, obrigado! Como posso ajudar?"
```

### Exemplo 2: Executar Código

```python
# Enviar mensagem
response = client.send_message("Executa: print('Hello World')")

# Resposta
print(response["response"])
# "✅ Código executado: Hello World"
```

### Exemplo 3: Criar Composição After Effects

```python
# Enviar mensagem
response = client.send_message(
    "Cria uma composição no After Effects chamada 'My Comp' com 1920x1080 e 10 segundos de duração"
)

# Resposta
print(response["response"])
# "✅ Composição 'My Comp' criada com sucesso!"
```

### Exemplo 4: Navegação Web

```python
# Enviar mensagem
response = client.send_message("Abre o Google e pesquisa por 'Python'")

# Resposta
print(response["response"])
# "✅ Google aberto e pesquisa realizada!"
```

---

## 🐛 Troubleshooting

### Erro: "FastAPI não está instalado"

**Solução:**
```bash
pip install fastapi uvicorn
```

### Erro: "AutoGen não está disponível"

**Solução:**
```bash
pip install autogen-agentchat autogen-ext[openai] autogen-ext[ollama]
```

### Erro: "MCP SDK não está instalado"

**Solução:**
```bash
pip install mcp
```

### Erro: "After Effects MCP não conectado"

**Solução:**
1. Verificar se o servidor MCP está rodando: `npm start` (no diretório after-effects-mcp-vision)
2. Verificar se o caminho do servidor MCP está correto: `AFTER_EFFECTS_MCP_PATH`
3. Verificar se o After Effects está rodando com o Bridge Panel aberto

### Erro: "Backend não está rodando"

**Solução:**
1. Verificar se o backend está rodando: `python backend_python.py`
2. Verificar se a porta 8000 está livre
3. Verificar logs do backend para erros

---

## 📚 Próximos Passos

1. **Explore o código**: Leia `backend_python.py` e entenda como funciona
2. **Teste funcionalidades**: Teste conversa, código, navegação web, GUI, After Effects
3. **Personalize**: Adicione suas próprias funcionalidades
4. **Aprenda**: Use este código como referência para aprender Python

---

## 🎯 Resumo

| Aspecto | Backend TypeScript | Backend Python |
|---------|-------------------|----------------|
| **Linguagem** | TypeScript | Python |
| **Framework** | Express/Node.js | FastAPI |
| **Complexidade** | Alta | Baixa |
| **Facilidade** | Média | Alta |
| **Funcionalidades** | Todas | Todas |
| **After Effects MCP** | Sim (via bridge) | Sim (nativo) |

---

**Lembre-se**: Este backend é 100% Python e mantém TODAS as funcionalidades, incluindo integração com After Effects MCP! 🚀

