# 💻 COMO PROGRAMAR - Guia Prático para Iniciantes

## 🎯 Você Quer Programar, Não Só Usar!

Este guia te ensina **como programar** e **modificar o projeto**, não só usar!

**Você vai aprender:**
- ✅ Como ler e entender o código
- ✅ Como modificar o código
- ✅ Como adicionar funcionalidades
- ✅ Como criar suas próprias ferramentas
- ✅ Exemplos práticos passo a passo

---

## 📁 Por Onde Começar a Programar?

### 1. **`app_simples.py`** ⭐ (Comece aqui!)

**O que é?**
- Arquivo principal do programa
- Interface web (Gradio)
- Processa mensagens do usuário

**Por que começar aqui?**
- É o mais simples
- Tem tudo comentado em português
- Fácil de entender e modificar

**Localização:**
```
super_agent/app_simples.py
```

---

### 2. **`core/simple_commander.py`** - Cérebro do Assistente

**O que é?**
- Cérebro do assistente inteligente
- Decide o que fazer com cada mensagem
- Usa AutoGen para comandar tudo

**Por que programar aqui?**
- Entende como o assistente funciona
- Pode adicionar novas funcionalidades
- Pode modificar o comportamento

**Localização:**
```
super_agent/core/simple_commander.py
```

---

### 3. **`tools/`** - Ferramentas

**O que é?**
- Ferramentas que o assistente usa
- Web Browsing (Selenium)
- GUI Automation (PyAutoGUI)
- Code Execution (Open Interpreter)

**Por que programar aqui?**
- Pode criar suas próprias ferramentas
- Pode modificar ferramentas existentes
- Pode integrar com outras bibliotecas

**Localização:**
```
super_agent/tools/
├── web_browsing.py       # Navegação web
├── gui_automation.py     # Automação GUI
└── code_execution.py     # Execução de código
```

---

## 🚀 Exemplo 1: Modificar a Resposta do Assistente

### O Que Vamos Fazer:

Modificar a resposta padrão do assistente quando ele recebe "Oi!".

### Passo 1: Abrir o Arquivo

Abra `app_simples.py` no seu editor de código.

### Passo 2: Encontrar a Função

Procure pela função `process_message`:

```python
async def process_message(self, message: str, history: List[List[str]]) -> tuple:
    """
    Processar mensagem do usuário
    
    Esta função:
    1. Detecta a intenção (conversa ou ação)
    2. Processa a mensagem (AutoGen ou Ollama)
    3. Retorna a resposta
    """
    # ... código aqui ...
```

### Passo 3: Modificar a Resposta

Encontre a parte que processa conversas:

```python
# CONVERSA: usar Ollama diretamente (mais rápido)
else:
    logger.info("💬 Processando como conversa (Ollama direto)...")
    
    try:
        import requests
        
        # Chamar Ollama diretamente
        response_ollama = requests.post(
            f"{OLLAMA_BASE_URL}/api/generate",
            json={
                "model": DEFAULT_MODEL,
                "prompt": message,
                "stream": False,
            },
            timeout=60
        )
        
        if response_ollama.status_code == 200:
            data = response_ollama.json()
            response = data.get("response", "Desculpe, não consegui gerar uma resposta.")
        else:
            response = f"❌ Erro ao chamar Ollama: {response_ollama.status_code}"
```

### Passo 4: Adicionar Sua Lógica

Modifique para adicionar sua própria lógica:

```python
# CONVERSA: usar Ollama diretamente (mais rápido)
else:
    logger.info("💬 Processando como conversa (Ollama direto)...")
    
    # ✅ SUA MODIFICAÇÃO: Resposta personalizada para "Oi!"
    if message.lower().strip() == "oi!" or message.lower().strip() == "oi":
        response = "Olá! Eu sou seu assistente inteligente. Como posso ajudar?"
    else:
        try:
            import requests
            
            # Chamar Ollama diretamente
            response_ollama = requests.post(
                f"{OLLAMA_BASE_URL}/api/generate",
                json={
                    "model": DEFAULT_MODEL,
                    "prompt": message,
                    "stream": False,
                },
                timeout=60
            )
            
            if response_ollama.status_code == 200:
                data = response_ollama.json()
                response = data.get("response", "Desculpe, não consegui gerar uma resposta.")
            else:
                response = f"❌ Erro ao chamar Ollama: {response_ollama.status_code}"
        except Exception as e:
            response = f"❌ Erro ao processar conversa: {str(e)}"
```

### Passo 5: Testar

1. Salve o arquivo
2. Execute: `python app_simples.py`
3. Abra no navegador: `http://localhost:7860`
4. Digite: "Oi!"
5. Veja sua resposta personalizada!

---

## 🚀 Exemplo 2: Adicionar Nova Ferramenta

### O Que Vamos Fazer:

Criar uma nova ferramenta que calcula a soma de dois números.

### Passo 1: Criar Arquivo da Ferramenta

Crie um novo arquivo: `super_agent/tools/calculator.py`

```python
"""
🧮 Calculadora - Ferramenta Simples

Esta ferramenta calcula a soma de dois números.
"""

from typing import Dict, Any


def calculate_sum(a: float, b: float) -> Dict[str, Any]:
    """
    Calcular soma de dois números
    
    Args:
        a: Primeiro número
        b: Segundo número
    
    Returns:
        Resultado da soma
    """
    result = a + b
    return {
        "success": True,
        "result": result,
        "operation": "soma",
        "a": a,
        "b": b
    }


def get_function_schema() -> Dict[str, Any]:
    """
    Obter schema da função (para AutoGen)
    
    Returns:
        Schema da função
    """
    return {
        "name": "calculate_sum",
        "description": "Calcular soma de dois números",
        "parameters": {
            "type": "object",
            "properties": {
                "a": {
                    "type": "number",
                    "description": "Primeiro número"
                },
                "b": {
                    "type": "number",
                    "description": "Segundo número"
                }
            },
            "required": ["a", "b"]
        }
    }
```

### Passo 2: Registrar a Ferramenta no AutoGen

Abra `super_agent/core/simple_commander.py` e encontre onde as ferramentas são registradas:

```python
# Adicionar ferramentas ao agente
tools = []
```

Adicione sua ferramenta:

```python
# Adicionar ferramentas ao agente
tools = []

# ✅ SUA FERRAMENTA: Calculadora
try:
    from ..tools.calculator import calculate_sum, get_function_schema
    
    calculator_schema = get_function_schema()
    tools.append({
        "type": "function",
        "function": {
            "name": calculator_schema["name"],
            "description": calculator_schema["description"],
            "parameters": calculator_schema["parameters"],
        },
        "func": calculate_sum,
    })
    logger.info("✅ Tool registrada: calculate_sum (Calculadora)")
except Exception as e:
    logger.warning(f"⚠️ Falha ao registrar calculadora: {e}")
```

### Passo 3: Testar

1. Salve os arquivos
2. Execute: `python app_simples.py`
3. Abra no navegador: `http://localhost:7860`
4. Digite: "Calcula a soma de 5 e 3"
5. Veja o resultado!

---

## 🚀 Exemplo 3: Modificar Detecção de Intenção

### O Que Vamos Fazer:

Modificar a detecção de intenção para reconhecer mais palavras-chave.

### Passo 1: Abrir o Arquivo

Abra `app_simples.py` e encontre a função `detect_intent_simple`:

```python
def detect_intent_simple(self, message: str) -> Dict[str, Any]:
    """
    Detectar intenção de forma simples (sem LLM)
    """
    message_lower = message.lower().strip()
    
    # Palavras-chave de ação
    action_keywords = [
        "executa", "cria", "edita", "abre", "pesquisa", "navega",
        "clica", "digita", "screenshot", "tira foto", "busca",
        "instala", "desinstala", "executa código", "roda código"
    ]
```

### Passo 2: Adicionar Novas Palavras-Chave

Adicione suas próprias palavras-chave:

```python
# Palavras-chave de ação
action_keywords = [
    "executa", "cria", "edita", "abre", "pesquisa", "navega",
    "clica", "digita", "screenshot", "tira foto", "busca",
    "instala", "desinstala", "executa código", "roda código",
    # ✅ SUAS PALAVRAS-CHAVE:
    "faz", "fazer", "rodar", "rodar código", "executar código",
    "criar arquivo", "escrever código", "modificar código"
]
```

### Passo 3: Testar

1. Salve o arquivo
2. Execute: `python app_simples.py`
3. Teste com suas novas palavras-chave
4. Veja se funciona!

---

## 🚀 Exemplo 4: Criar Função Personalizada

### O Que Vamos Fazer:

Criar uma função que envia mensagens personalizadas.

### Passo 1: Criar Função

Abra `app_simples.py` e adicione sua função:

```python
def minha_funcao_personalizada(mensagem: str) -> str:
    """
    Minha função personalizada
    
    Args:
        mensagem: Mensagem do usuário
    
    Returns:
        Resposta personalizada
    """
    # Sua lógica aqui
    if "hora" in mensagem.lower():
        from datetime import datetime
        hora_atual = datetime.now().strftime("%H:%M:%S")
        return f"⏰ A hora atual é: {hora_atual}"
    elif "data" in mensagem.lower():
        from datetime import datetime
        data_atual = datetime.now().strftime("%d/%m/%Y")
        return f"📅 A data atual é: {data_atual}"
    else:
        return "Não entendi. Tente perguntar sobre 'hora' ou 'data'."
```

### Passo 2: Usar a Função

Modifique a função `process_message` para usar sua função:

```python
async def process_message(self, message: str, history: List[List[str]]) -> tuple:
    """
    Processar mensagem do usuário
    """
    # ✅ SUA MODIFICAÇÃO: Usar função personalizada
    if "hora" in message.lower() or "data" in message.lower():
        response = minha_funcao_personalizada(message)
    else:
        # Processamento normal
        # ... código existente ...
```

### Passo 3: Testar

1. Salve o arquivo
2. Execute: `python app_simples.py`
3. Digite: "Que horas são?"
4. Veja sua função funcionando!

---

## 🎓 Como Entender o Código

### 1. **Ler os Comentários** ✅

Os comentários estão em português e explicam tudo:

```python
# Este é um comentário que explica o código
def minha_funcao():
    """
    Esta é uma docstring que explica a função
    """
    # Código aqui
    pass
```

### 2. **Ler de Cima para Baixo** ✅

O código é lido de cima para baixo:

```python
# 1. Imports (bibliotecas)
import os
import logging

# 2. Configuração (variáveis)
OLLAMA_BASE_URL = "http://localhost:11434"

# 3. Funções
def minha_funcao():
    pass

# 4. Código principal
if __name__ == "__main__":
    minha_funcao()
```

### 3. **Entender as Funções** ✅

Cada função faz uma coisa específica:

```python
def processar_mensagem(mensagem: str) -> str:
    """
    Processar mensagem do usuário
    
    Args:
        mensagem: Mensagem do usuário
    
    Returns:
        Resposta processada
    """
    # Lógica aqui
    return "Resposta"
```

### 4. **Testar Pequenas Modificações** ✅

Faça pequenas modificações e veja o que acontece:

```python
# Antes:
response = "Olá!"

# Depois:
response = "Oi! Como posso ajudar?"
```

---

## 🔧 Ferramentas Úteis para Programar

### 1. **Editor de Código** ✅

**Recomendado:**
- **VS Code** (gratuito, fácil de usar)
- **PyCharm** (pago, mas tem versão gratuita)
- **Sublime Text** (simples, rápido)

### 2. **Terminal** ✅

**Windows:**
- Prompt de Comando (cmd)
- PowerShell

**Linux/Mac:**
- Terminal

### 3. **Python** ✅

**Verificar versão:**
```bash
python --version
```

**Instalar bibliotecas:**
```bash
pip install nome_da_biblioteca
```

---

## 🐛 Como Debugar (Encontrar Erros)

### 1. **Ler Mensagens de Erro** ✅

Quando der erro, leia a mensagem:

```python
# Erro comum:
NameError: name 'minha_variavel' is not defined

# Solução:
# A variável não foi definida antes de usar
minha_variavel = "valor"  # Definir antes de usar
```

### 2. **Usar Print para Debugar** ✅

Adicione `print()` para ver o que está acontecendo:

```python
def minha_funcao(mensagem):
    print(f"📨 Mensagem recebida: {mensagem}")  # ✅ Debug
    # Processar mensagem
    resposta = processar(mensagem)
    print(f"📤 Resposta: {resposta}")  # ✅ Debug
    return resposta
```

### 3. **Testar Pequenas Partes** ✅

Teste uma função de cada vez:

```python
# Testar função isoladamente
def somar(a, b):
    return a + b

# Testar:
resultado = somar(5, 3)
print(resultado)  # Deve mostrar: 8
```

---

## 🎯 Próximos Passos

### 1. **Modificar Código Existente** ✅

- Modifique pequenas coisas
- Teste suas modificações
- Veja o que acontece

### 2. **Adicionar Funcionalidades** ✅

- Crie novas funções
- Adicione novas ferramentas
- Integre com outras bibliotecas

### 3. **Criar Seus Próprios Projetos** ✅

- Use este código como base
- Crie seus próprios projetos
- Aprenda fazendo!

---

## 💡 Dicas para Programar

### 1. **Comece Simples** ✅

- Comece com modificações pequenas
- Teste antes de modificar mais
- Aprenda gradualmente

### 2. **Leia os Comentários** ✅

- Os comentários explicam tudo
- Leia com calma
- Entenda antes de modificar

### 3. **Teste Sempre** ✅

- Teste após cada modificação
- Veja se funciona
- Corrija erros

### 4. **Não Tenha Medo de Errar** ✅

- Erros são normais
- Aprenda com eles
- Não desista!

### 5. **Pratique** ✅

- Pratique todo dia
- Crie pequenos projetos
- Aprenda fazendo!

---

## 🚀 Exemplo Completo: Criar Nova Ferramenta

Vamos criar uma ferramenta completa passo a passo:

### Passo 1: Criar Arquivo

Crie `super_agent/tools/weather.py`:

```python
"""
🌤️ Clima - Ferramenta para Obter Clima

Esta ferramenta obtém informações sobre o clima.
"""

import requests
from typing import Dict, Any


def get_weather(city: str) -> Dict[str, Any]:
    """
    Obter clima de uma cidade
    
    Args:
        city: Nome da cidade
    
    Returns:
        Informações sobre o clima
    """
    try:
        # Usar API pública (exemplo)
        # Nota: Você precisa de uma API key real
        api_key = "sua_api_key_aqui"
        url = f"http://api.openweathermap.org/data/2.5/weather?q={city}&appid={api_key}"
        
        response = requests.get(url, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            return {
                "success": True,
                "city": city,
                "temperature": data["main"]["temp"],
                "description": data["weather"][0]["description"],
                "humidity": data["main"]["humidity"]
            }
        else:
            return {
                "success": False,
                "error": f"Erro ao obter clima: {response.status_code}"
            }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


def get_function_schema() -> Dict[str, Any]:
    """
    Obter schema da função (para AutoGen)
    """
    return {
        "name": "get_weather",
        "description": "Obter clima de uma cidade",
        "parameters": {
            "type": "object",
            "properties": {
                "city": {
                    "type": "string",
                    "description": "Nome da cidade"
                }
            },
            "required": ["city"]
        }
    }
```

### Passo 2: Registrar no AutoGen

Abra `super_agent/core/simple_commander.py` e adicione:

```python
# ✅ SUA FERRAMENTA: Clima
try:
    from ..tools.weather import get_weather, get_function_schema
    
    weather_schema = get_function_schema()
    tools.append({
        "type": "function",
        "function": {
            "name": weather_schema["name"],
            "description": weather_schema["description"],
            "parameters": weather_schema["parameters"],
        },
        "func": get_weather,
    })
    logger.info("✅ Tool registrada: get_weather (Clima)")
except Exception as e:
    logger.warning(f"⚠️ Falha ao registrar clima: {e}")
```

### Passo 3: Testar

1. Salve os arquivos
2. Execute: `python app_simples.py`
3. Digite: "Qual o clima em São Paulo?"
4. Veja o resultado!

---

## 🎉 Conclusão

### Você Pode Programar! ✅

Agora você sabe:
- ✅ Como ler e entender o código
- ✅ Como modificar o código
- ✅ Como adicionar funcionalidades
- ✅ Como criar suas próprias ferramentas

### Próximos Passos:

1. **Modifique o código existente** - Faça pequenas modificações
2. **Adicione funcionalidades** - Crie novas ferramentas
3. **Crie seus próprios projetos** - Use este código como base

### Precisa de Ajuda?

- Leia os comentários no código (estão em português!)
- Teste pequenas modificações
- Aprenda fazendo!

---

**Lembre-se**: Você pode escrever código Python errado ou pseudocódigo diretamente nos arquivos - eu vou entender e corrigir! 🚀

**Boa sorte programando!** 🎉

