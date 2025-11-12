# 🐍 Guia Python Puro - Versão 100% Python para Iniciantes

## 🎯 O Que É Esta Versão?

Esta é uma versão **100% Python** do projeto, criada especialmente para iniciantes que:
- ✅ Sabem Python básico (variáveis, if/else, loops, funções)
- ❌ Não sabem TypeScript/React
- 🎯 Querem algo simples e fácil de entender

## 🚀 Vantagens da Versão Python Puro

### ✅ **Simplicidade**
- **Uma única linguagem**: Python (nada de TypeScript/React)
- **Código claro**: Bem comentado em português
- **Fácil de entender**: Usa conceitos básicos de Python

### ✅ **Todas as Funcionalidades**
- ✅ AutoGen Commander (comanda tudo)
- ✅ Open Interpreter (execução de código)
- ✅ Web Browsing (Selenium)
- ✅ GUI Automation (PyAutoGUI/UFO)
- ✅ Chat em tempo real
- ✅ Classificação de intenção

### ✅ **Fácil de Usar**
- **Interface Gradio**: Interface web simples (nada de React)
- **Servidor FastAPI**: Servidor web simples (nada de Node.js)
- **Um único arquivo**: `app_simples.py` contém tudo

---

## 📦 Instalação

### 1. Instalar Dependências

```bash
# Instalar Gradio (interface web simples)
pip install gradio

# Instalar AutoGen (comanda tudo)
pip install autogen-agentchat autogen-ext[openai] autogen-ext[ollama]

# Instalar outras dependências
pip install requests fastapi uvicorn
```

### 2. Instalar Ferramentas (Opcional)

```bash
# Selenium (navegação web)
pip install selenium webdriver-manager

# PyAutoGUI (automação GUI)
pip install pyautogui

# Open Interpreter (execução de código)
pip install open-interpreter
```

### 3. Configurar Variáveis de Ambiente (Opcional)

Crie um arquivo `.env`:

```env
# Ollama
OLLAMA_BASE_URL=http://localhost:11434
DEFAULT_MODEL=qwen2.5:7b
EXECUTOR_MODEL=qwen2.5-coder:7b

# Workspace
WORKSPACE_PATH=./workspace
```

---

## 🚀 Como Usar

### 1. Iniciar Servidor

```bash
# No diretório do projeto
cd open-codex-interpreter/super_agent

# Executar aplicação
python app_simples.py
```

### 2. Acessar Interface

Abra o navegador em:
```
http://localhost:7860
```

### 3. Usar o Chat

Digite mensagens como:
- **Conversa**: "Oi! Como você está?"
- **Ação**: "Executa: print('Hello World')"
- **Navegação**: "Abre o Google e pesquisa por 'Python'"
- **GUI**: "Tira um screenshot da tela"

---

## 📁 Estrutura do Código

### `app_simples.py` - Aplicação Principal

```python
class SuperAgentApp:
    """
    Aplicação Super Agent - Versão 100% Python
    
    Esta classe gerencia toda a aplicação:
    - Interface Gradio (chat)
    - AutoGen Commander (execução de tarefas)
    - Classificação de intenção (conversa vs ação)
    """
    
    def __init__(self):
        """Inicializar aplicação"""
        # Criar AutoGen Commander
        self.commander = create_simple_commander(...)
        self.team = RoundRobinGroupChat(agents=[self.commander])
    
    def detect_intent_simple(self, message: str):
        """Detectar intenção de forma simples"""
        # Regras simples: se começa com "executa" → ação
        # Caso contrário → conversa
    
    async def process_message(self, message: str, history: list):
        """Processar mensagem do usuário"""
        # Detectar intenção
        intent = self.detect_intent_simple(message)
        
        # Se ação → usar AutoGen Commander
        if intent["type"] == "action":
            result = await self.team.run(task=message)
        
        # Se conversa → usar Ollama diretamente
        else:
            response = requests.post(...)
    
    def create_interface(self):
        """Criar interface Gradio"""
        # Gradio cria interface web automaticamente
        with gr.Blocks() as interface:
            chatbot = gr.Chatbot(...)
            msg = gr.Textbox(...)
            # ...
        return interface
    
    def run(self):
        """Executar aplicação"""
        interface = self.create_interface()
        interface.launch()
```

---

## 🔍 Como Funciona?

### 1. Usuário Envia Mensagem

```
Usuário → "Executa: print('Hello World')"
```

### 2. Sistema Detecta Intenção

```python
intent = detect_intent_simple("Executa: print('Hello World')")
# Resultado: {"type": "action", "confidence": 0.8}
```

### 3. Sistema Processa Mensagem

```python
if intent["type"] == "action":
    # Usar AutoGen Commander
    result = await self.team.run(task=message)
else:
    # Usar Ollama diretamente
    response = requests.post(...)
```

### 4. Sistema Retorna Resposta

```
Assistente → "✅ Código executado: Hello World"
```

---

## 🎯 Exemplos de Uso

### Exemplo 1: Conversa Simples

```
Usuário: "Oi! Como você está?"
Sistema: Detecta intenção → "conversation"
Sistema: Usa Ollama diretamente → Resposta rápida
Assistente: "Oi! Estou bem, obrigado! Como posso ajudar?"
```

### Exemplo 2: Executar Código

```
Usuário: "Executa: print('Hello World')"
Sistema: Detecta intenção → "action"
Sistema: Usa AutoGen Commander → Executa código
Assistente: "✅ Código executado: Hello World"
```

### Exemplo 3: Navegação Web

```
Usuário: "Abre o Google e pesquisa por 'Python'"
Sistema: Detecta intenção → "action"
Sistema: Usa AutoGen Commander → Usa Web Browsing Tool (Selenium)
Assistente: "✅ Google aberto e pesquisa realizada!"
```

### Exemplo 4: Automação GUI

```
Usuário: "Tira um screenshot da tela"
Sistema: Detecta intenção → "action"
Sistema: Usa AutoGen Commander → Usa GUI Automation Tool (PyAutoGUI)
Assistente: "✅ Screenshot capturado e salvo!"
```

---

## 🔧 Personalização

### 1. Mudar Modelo

Edite `app_simples.py`:

```python
DEFAULT_MODEL = os.getenv("DEFAULT_MODEL", "qwen2.5:7b")
# Mude para:
DEFAULT_MODEL = os.getenv("DEFAULT_MODEL", "llama3:8b")
```

### 2. Mudar Porta

Edite `app_simples.py`:

```python
app.run(
    server_name="0.0.0.0",
    server_port=7860,  # Mude para 8080, por exemplo
    share=False,
)
```

### 3. Adicionar Novas Funcionalidades

Edite `app_simples.py`:

```python
def process_message(self, message: str, history: list):
    # Adicione sua lógica aqui
    if "minha_funcao" in message:
        # Sua função personalizada
        response = minha_funcao(message)
    else:
        # Lógica padrão
        response = await self.team.run(task=message)
```

---

## 📚 Conceitos Importantes

### 1. Gradio

**O que é?** Biblioteca Python que cria interfaces web simples.

**Como usar?**
```python
import gradio as gr

with gr.Blocks() as interface:
    chatbot = gr.Chatbot()
    msg = gr.Textbox()
    # ...

interface.launch()
```

**Vantagens:**
- ✅ Simples (nada de React/TypeScript)
- ✅ Automático (cria interface web automaticamente)
- ✅ Bonito (temas pré-configurados)

### 2. FastAPI

**O que é?** Framework Python para criar servidores web.

**Como usar?**
```python
from fastapi import FastAPI

app = FastAPI()

@app.get("/")
async def root():
    return {"message": "Hello World"}

# Executar: uvicorn app:app
```

**Vantagens:**
- ✅ Simples (nada de Node.js/Express)
- ✅ Rápido (performance alta)
- ✅ Automático (documentação automática)

### 3. AutoGen Commander

**O que é?** Comandante AutoGen que executa tarefas.

**Como usar?**
```python
commander = create_simple_commander(...)
team = RoundRobinGroupChat(agents=[commander])
result = await team.run(task="Executa: print('Hello')")
```

**Vantagens:**
- ✅ Comanda tudo (Open Interpreter, Selenium, PyAutoGUI)
- ✅ Inteligente (decide qual ferramenta usar)
- ✅ Autônomo (executa tarefas automaticamente)

---

## 🐛 Troubleshooting

### Erro: "Gradio não está instalado"

**Solução:**
```bash
pip install gradio
```

### Erro: "AutoGen não está disponível"

**Solução:**
```bash
pip install autogen-agentchat autogen-ext[openai] autogen-ext[ollama]
```

### Erro: "Ollama não está rodando"

**Solução:**
```bash
# Iniciar Ollama
ollama serve

# Ou verificar se está rodando
curl http://localhost:11434/api/tags
```

### Erro: "Modelo não encontrado"

**Solução:**
```bash
# Instalar modelo
ollama pull qwen2.5:7b

# Ou mudar modelo no código
DEFAULT_MODEL = "llama3:8b"
```

---

## 📖 Próximos Passos

1. **Explore o código**: Leia `app_simples.py` e entenda como funciona
2. **Teste funcionalidades**: Teste conversa, código, navegação web, GUI
3. **Personalize**: Adicione suas próprias funcionalidades
4. **Aprenda**: Use este código como referência para aprender Python

---

## 🎯 Resumo

| Aspecto | Versão TypeScript | Versão Python Puro |
|---------|-------------------|-------------------|
| **Linguagem** | TypeScript + Python | Python apenas |
| **Interface** | React | Gradio |
| **Servidor** | Node.js/Express | FastAPI |
| **Complexidade** | Alta | Baixa |
| **Facilidade** | Média | Alta |
| **Funcionalidades** | Todas | Todas |

---

## 💡 Dicas

- **Comece simples**: Use a versão Python puro primeiro
- **Aprenda gradualmente**: Não precisa entender tudo de uma vez
- **Experimente**: Teste diferentes funcionalidades
- **Personalize**: Adicione suas próprias funcionalidades

---

**Lembre-se**: Esta versão é 100% Python e mantém TODAS as funcionalidades! 🚀

