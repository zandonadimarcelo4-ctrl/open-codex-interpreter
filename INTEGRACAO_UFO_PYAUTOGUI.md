# 🚀 Integração UFO + PyAutoGUI - Automação GUI Completa

## ✅ Status da Integração

**Integração completa do PyAutoGUI para automação GUI no projeto!**

## 📦 Pacotes Instalados

- ✅ `pyautogui>=0.9.54` - Automação GUI principal
- ✅ `pygetwindow>=0.0.9` - Gerenciamento de janelas
- ✅ `pyscreeze>=1.0.1` - Screenshots
- ✅ `opencv-python>=4.8.0` - Processamento de imagens
- ✅ `Pillow>=10.0.0` - Manipulação de imagens

## 🏗️ Arquitetura

### 1. **UFOIntegration** (`super_agent/integrations/ufo.py`)
   - Integração completa com PyAutoGUI
   - Suporte a screenshots, cliques, digitação, teclas, scroll, drag, etc.
   - Gerenciamento de janelas
   - Localização de imagens na tela

### 2. **GUIAutomationTool** (`super_agent/tools/gui_automation.py`)
   - Tool para AutoGen v2
   - Wrapper da UFOIntegration
   - Schema completo para AutoGen

### 3. **UFOAgent** (`super_agent/agents/ufo_agent.py`)
   - Agente especializado em automação GUI
   - Integrado com AutoGen v2
   - Suporte a memória (ChromaDB)
   - Usa GUIAutomationTool

### 4. **Orchestrator** (`super_agent/core/orchestrator.py`)
   - Integração do UFO no orquestrador principal
   - Configuração automática do workspace
   - Fallback para agente básico se necessário

## 🎯 Funcionalidades

### Screenshots
- Capturar screenshot da tela inteira
- Capturar região específica
- Salvar screenshots no workspace

### Interações do Mouse
- Clique simples, duplo clique, clique direito
- Arrastar e soltar (drag and drop)
- Movimentar mouse
- Scroll

### Interações do Teclado
- Digitar texto
- Pressionar teclas individuais
- Hotkeys (combinações de teclas)
- Suporte a todas as teclas especiais

### Gerenciamento de Janelas
- Listar janelas abertas
- Ativar janelas por título
- Obter informações de janelas

### Localização de Elementos
- Localizar imagens na tela
- Detecção com nível de confiança configurável
- Retornar coordenadas dos elementos encontrados

## 📝 Exemplo de Uso

### No Orchestrator

```python
from super_agent.core.orchestrator import SuperAgentOrchestrator, SuperAgentConfig
from pathlib import Path

config = SuperAgentConfig(
    autogen_model="qwen2.5:14b",
    autogen_base_url="http://localhost:11434",
    ufo_enabled=True,
    ufo_workspace=Path("./ufo_workspace"),
    enable_ufo=True,
)

orchestrator = SuperAgentOrchestrator(config)

# Executar tarefa de automação GUI
result = await orchestrator.execute(
    task="Abrir o Notepad e digitar 'Hello World'",
    context={}
)
```

### Uso Direto da UFOIntegration

```python
from super_agent.integrations.ufo import UFOIntegration
from pathlib import Path

ufo = UFOIntegration(workspace=Path("./ufo_workspace"))

# Capturar screenshot
screenshot = ufo.capture_screenshot(save=True)

# Clicar em uma posição
ufo.click(x=100, y=200, button="left")

# Digitar texto
ufo.type_text("Hello World")

# Pressionar hotkey
ufo.hotkey("ctrl", "c")

# Fazer scroll
ufo.scroll(x=500, y=500, clicks=3, direction="up")

# Localizar imagem
location = ufo.locate_on_screen("button.png", confidence=0.8)
if location["found"]:
    ufo.click(x=location["x"], y=location["y"])
```

### Uso do GUIAutomationTool

```python
from super_agent.tools.gui_automation import GUIAutomationTool
from pathlib import Path

tool = GUIAutomationTool(workspace=Path("./ufo_workspace"))

# Executar ação
result = tool.execute(
    action="screenshot",
    save=True
)

result = tool.execute(
    action="click",
    x=100,
    y=200,
    button="left"
)

result = tool.execute(
    action="type",
    text="Hello World"
)

result = tool.execute(
    action="hotkey",
    keys=["ctrl", "c"]
)
```

## 🔧 Configuração

### Variáveis de Ambiente

```bash
# Workspace para UFO (opcional)
UFO_WORKSPACE=./ufo_workspace
```

### Configuração no Orchestrator

```python
config = SuperAgentConfig(
    # ... outras configurações ...
    ufo_enabled=True,  # Habilitar UFO
    ufo_workspace=Path("./ufo_workspace"),  # Workspace (opcional)
    enable_ufo=True,  # Habilitar agente UFO
)
```

## 🛡️ Segurança

- **FAILSAFE**: Mover mouse para o canto superior esquerdo para parar
- **PAUSE**: Pausa de 0.1 segundos entre ações
- **Validação**: Validação de inputs antes de executar ações
- **Error Handling**: Tratamento robusto de erros

## 📋 Ações Disponíveis

1. **screenshot** - Capturar screenshot
2. **click** - Clicar em uma posição
3. **double_click** - Duplo clique
4. **right_click** - Clique direito
5. **type** - Digitar texto
6. **press_key** - Pressionar tecla
7. **hotkey** - Pressionar combinação de teclas
8. **scroll** - Fazer scroll
9. **drag** - Arrastar elemento
10. **move_mouse** - Mover mouse
11. **get_mouse_position** - Obter posição do mouse
12. **locate_on_screen** - Localizar imagem na tela
13. **get_window_list** - Listar janelas
14. **activate_window** - Ativar janela
15. **execute_task** - Executar tarefa de automação

## 🚀 Próximos Passos

1. ✅ Integração PyAutoGUI completa
2. ✅ Tool para AutoGen v2
3. ✅ Agente UFO
4. ✅ Integração no Orchestrator
5. 🔄 Testes com casos de uso reais
6. 🔄 Melhorar detecção de elementos com visão computacional
7. 🔄 Adicionar suporte a reconhecimento de texto (OCR)
8. 🔄 Adicionar suporte a múltiplos monitores

## 📚 Referências

- [PyAutoGUI Documentation](https://pyautogui.readthedocs.io/)
- [AutoGen v2 Documentation](https://microsoft.github.io/autogen/)
- [OpenCV Documentation](https://opencv.org/)

