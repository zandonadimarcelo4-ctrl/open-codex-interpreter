# 🚀 EXEMPLO PRÁTICO - Programe Agora!

## 👋 Vamos Programar Juntos!

Este exemplo te mostra **exatamente** como modificar o código e fazer funcionar!

**Não precisa saber tudo - só seguir os passos!**

---

## 🎯 Exemplo: Adicionar Mensagem Personalizada

### O Que Vamos Fazer:

Adicionar uma mensagem personalizada quando o usuário digitar "tudo bem?".

### Passo 1: Abrir o Arquivo

1. Abra `super_agent/app_simples.py` no seu editor
2. Procure pela função `process_message`
3. Encontre a parte que processa conversas

### Passo 2: Adicionar Sua Lógica

Encontre esta parte:

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

### Passo 3: Modificar o Código

**SUBSTITUA** a parte acima por:

```python
# CONVERSA: usar Ollama diretamente (mais rápido)
else:
    logger.info("💬 Processando como conversa (Ollama direto)...")
    
    # ✅ SUA MODIFICAÇÃO: Mensagem personalizada para "tudo bem?"
    mensagem_lower = message.lower().strip()
    
    if "tudo bem" in mensagem_lower or "tudo bom" in mensagem_lower:
        response = "Tudo bem sim, obrigado! E você? Como posso ajudar?"
    elif "obrigado" in mensagem_lower or "obrigada" in mensagem_lower:
        response = "De nada! Fico feliz em ajudar! 😊"
    elif "tchau" in mensagem_lower or "até logo" in mensagem_lower:
        response = "Tchau! Até logo! Espero ter ajudado! 👋"
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

### Passo 4: Salvar e Testar

1. **Salve o arquivo** (Ctrl+S ou Cmd+S)
2. **Execute o programa:**
   ```bash
   python app_simples.py
   ```
3. **Abra no navegador:** `http://localhost:7860`
4. **Teste:**
   - Digite: "Tudo bem?"
   - Veja sua resposta personalizada!

---

## 🎯 Exemplo 2: Adicionar Nova Função

### O Que Vamos Fazer:

Criar uma função que retorna a hora atual.

### Passo 1: Adicionar Função

No arquivo `app_simples.py`, adicione esta função **ANTES** da classe `SuperAgentApp`:

```python
# ✅ SUA FUNÇÃO: Retornar hora atual
def obter_hora_atual() -> str:
    """
    Obter hora atual
    
    Returns:
        Hora atual formatada
    """
    from datetime import datetime
    hora_atual = datetime.now().strftime("%H:%M:%S")
    return f"⏰ A hora atual é: {hora_atual}"


def obter_data_atual() -> str:
    """
    Obter data atual
    
    Returns:
        Data atual formatada
    """
    from datetime import datetime
    data_atual = datetime.now().strftime("%d/%m/%Y")
    return f"📅 A data atual é: {data_atual}"
```

### Passo 2: Usar a Função

Na função `process_message`, adicione esta lógica **ANTES** de processar a mensagem:

```python
async def process_message(self, message: str, history: List[List[str]]) -> tuple:
    """
    Processar mensagem do usuário
    """
    # ✅ SUA MODIFICAÇÃO: Verificar se é pergunta sobre hora/data
    mensagem_lower = message.lower().strip()
    
    if "que horas" in mensagem_lower or "hora" in mensagem_lower:
        response = obter_hora_atual()
    elif "que data" in mensagem_lower or "data" in mensagem_lower:
        response = obter_data_atual()
    else:
        # Processamento normal
        # ... resto do código ...
```

### Passo 3: Salvar e Testar

1. **Salve o arquivo**
2. **Execute o programa:**
   ```bash
   python app_simples.py
   ```
3. **Teste:**
   - Digite: "Que horas são?"
   - Digite: "Que data é hoje?"
   - Veja suas funções funcionando!

---

## 🎯 Exemplo 3: Modificar Detecção de Intenção

### O Que Vamos Fazer:

Modificar a detecção de intenção para reconhecer mais palavras-chave.

### Passo 1: Encontrar a Função

No arquivo `app_simples.py`, encontre a função `detect_intent_simple`:

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

**MODIFIQUE** a lista de palavras-chave:

```python
# Palavras-chave de ação
action_keywords = [
    "executa", "cria", "edita", "abre", "pesquisa", "navega",
    "clica", "digita", "screenshot", "tira foto", "busca",
    "instala", "desinstala", "executa código", "roda código",
    # ✅ SUAS PALAVRAS-CHAVE:
    "faz", "fazer", "rodar", "rodar código", "executar código",
    "criar arquivo", "escrever código", "modificar código",
    "adicionar", "remover", "deletar", "apagar"
]
```

### Passo 3: Salvar e Testar

1. **Salve o arquivo**
2. **Execute o programa:**
   ```bash
   python app_simples.py
   ```
3. **Teste:**
   - Digite: "Faz um arquivo novo"
   - Digite: "Adiciona uma linha"
   - Veja se funciona!

---

## 🎯 Exemplo 4: Criar Ferramenta Simples

### O Que Vamos Fazer:

Criar uma ferramenta que calcula a soma de dois números.

### Passo 1: Criar Arquivo

Crie um novo arquivo: `super_agent/tools/calculator.py`

**Cole este código:**

```python
"""
🧮 Calculadora - Ferramenta Simples

Esta ferramenta calcula operações matemáticas básicas.
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
    try:
        result = a + b
        return {
            "success": True,
            "result": result,
            "operation": "soma",
            "a": a,
            "b": b
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


def calculate_multiply(a: float, b: float) -> Dict[str, Any]:
    """
    Calcular multiplicação de dois números
    
    Args:
        a: Primeiro número
        b: Segundo número
    
    Returns:
        Resultado da multiplicação
    """
    try:
        result = a * b
        return {
            "success": True,
            "result": result,
            "operation": "multiplicação",
            "a": a,
            "b": b
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

### Passo 2: Registrar no AutoGen

Abra `super_agent/core/simple_commander.py` e encontre onde as ferramentas são registradas.

**Adicione este código:**

```python
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

### Passo 3: Salvar e Testar

1. **Salve os arquivos**
2. **Execute o programa:**
   ```bash
   python app_simples.py
   ```
3. **Teste:**
   - Digite: "Calcula a soma de 5 e 3"
   - Digite: "Quanto é 10 mais 20?"
   - Veja o resultado!

---

## 🎯 Exemplo 5: Modificar Interface

### O Que Vamos Fazer:

Modificar a mensagem inicial da interface.

### Passo 1: Encontrar a Interface

No arquivo `app_simples.py`, encontre onde a interface é criada:

```python
def create_interface(self):
    """
    Criar interface Gradio
    """
    # ... código da interface ...
```

### Passo 2: Modificar Mensagem Inicial

Encontre a mensagem inicial:

```python
# Chat
chatbot = gr.Chatbot(
    label="Chat",
    height=500,
    show_label=True,
)
```

**MODIFIQUE** para adicionar uma mensagem inicial:

```python
# Chat
chatbot = gr.Chatbot(
    label="Chat",
    height=500,
    show_label=True,
    value=[["", "Olá! Eu sou seu assistente inteligente. Como posso ajudar?"]]  # ✅ SUA MODIFICAÇÃO
)
```

### Passo 3: Salvar e Testar

1. **Salve o arquivo**
2. **Execute o programa:**
   ```bash
   python app_simples.py
   ```
3. **Veja sua mensagem personalizada!**

---

## 🎉 Conclusão

### Você Programou! ✅

Agora você sabe:
- ✅ Como modificar o código
- ✅ Como adicionar funcionalidades
- ✅ Como criar ferramentas
- ✅ Como testar suas modificações

### Próximos Passos:

1. **Modifique mais coisas** - Experimente!
2. **Adicione mais funcionalidades** - Crie suas próprias!
3. **Compartilhe seu código** - Mostre para outros!

### Precisa de Ajuda?

- Leia `COMO_PROGRAMAR.md` - Guia completo de programação
- Leia os comentários no código - Estão em português!
- Teste pequenas modificações - Aprenda fazendo!

---

**Lembre-se**: Você pode escrever código Python errado ou pseudocódigo diretamente nos arquivos - eu vou entender e corrigir! 🚀

**Boa sorte programando!** 🎉


## 👋 Vamos Programar Juntos!

Este exemplo te mostra **exatamente** como modificar o código e fazer funcionar!

**Não precisa saber tudo - só seguir os passos!**

---

## 🎯 Exemplo: Adicionar Mensagem Personalizada

### O Que Vamos Fazer:

Adicionar uma mensagem personalizada quando o usuário digitar "tudo bem?".

### Passo 1: Abrir o Arquivo

1. Abra `super_agent/app_simples.py` no seu editor
2. Procure pela função `process_message`
3. Encontre a parte que processa conversas

### Passo 2: Adicionar Sua Lógica

Encontre esta parte:

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

### Passo 3: Modificar o Código

**SUBSTITUA** a parte acima por:

```python
# CONVERSA: usar Ollama diretamente (mais rápido)
else:
    logger.info("💬 Processando como conversa (Ollama direto)...")
    
    # ✅ SUA MODIFICAÇÃO: Mensagem personalizada para "tudo bem?"
    mensagem_lower = message.lower().strip()
    
    if "tudo bem" in mensagem_lower or "tudo bom" in mensagem_lower:
        response = "Tudo bem sim, obrigado! E você? Como posso ajudar?"
    elif "obrigado" in mensagem_lower or "obrigada" in mensagem_lower:
        response = "De nada! Fico feliz em ajudar! 😊"
    elif "tchau" in mensagem_lower or "até logo" in mensagem_lower:
        response = "Tchau! Até logo! Espero ter ajudado! 👋"
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

### Passo 4: Salvar e Testar

1. **Salve o arquivo** (Ctrl+S ou Cmd+S)
2. **Execute o programa:**
   ```bash
   python app_simples.py
   ```
3. **Abra no navegador:** `http://localhost:7860`
4. **Teste:**
   - Digite: "Tudo bem?"
   - Veja sua resposta personalizada!

---

## 🎯 Exemplo 2: Adicionar Nova Função

### O Que Vamos Fazer:

Criar uma função que retorna a hora atual.

### Passo 1: Adicionar Função

No arquivo `app_simples.py`, adicione esta função **ANTES** da classe `SuperAgentApp`:

```python
# ✅ SUA FUNÇÃO: Retornar hora atual
def obter_hora_atual() -> str:
    """
    Obter hora atual
    
    Returns:
        Hora atual formatada
    """
    from datetime import datetime
    hora_atual = datetime.now().strftime("%H:%M:%S")
    return f"⏰ A hora atual é: {hora_atual}"


def obter_data_atual() -> str:
    """
    Obter data atual
    
    Returns:
        Data atual formatada
    """
    from datetime import datetime
    data_atual = datetime.now().strftime("%d/%m/%Y")
    return f"📅 A data atual é: {data_atual}"
```

### Passo 2: Usar a Função

Na função `process_message`, adicione esta lógica **ANTES** de processar a mensagem:

```python
async def process_message(self, message: str, history: List[List[str]]) -> tuple:
    """
    Processar mensagem do usuário
    """
    # ✅ SUA MODIFICAÇÃO: Verificar se é pergunta sobre hora/data
    mensagem_lower = message.lower().strip()
    
    if "que horas" in mensagem_lower or "hora" in mensagem_lower:
        response = obter_hora_atual()
    elif "que data" in mensagem_lower or "data" in mensagem_lower:
        response = obter_data_atual()
    else:
        # Processamento normal
        # ... resto do código ...
```

### Passo 3: Salvar e Testar

1. **Salve o arquivo**
2. **Execute o programa:**
   ```bash
   python app_simples.py
   ```
3. **Teste:**
   - Digite: "Que horas são?"
   - Digite: "Que data é hoje?"
   - Veja suas funções funcionando!

---

## 🎯 Exemplo 3: Modificar Detecção de Intenção

### O Que Vamos Fazer:

Modificar a detecção de intenção para reconhecer mais palavras-chave.

### Passo 1: Encontrar a Função

No arquivo `app_simples.py`, encontre a função `detect_intent_simple`:

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

**MODIFIQUE** a lista de palavras-chave:

```python
# Palavras-chave de ação
action_keywords = [
    "executa", "cria", "edita", "abre", "pesquisa", "navega",
    "clica", "digita", "screenshot", "tira foto", "busca",
    "instala", "desinstala", "executa código", "roda código",
    # ✅ SUAS PALAVRAS-CHAVE:
    "faz", "fazer", "rodar", "rodar código", "executar código",
    "criar arquivo", "escrever código", "modificar código",
    "adicionar", "remover", "deletar", "apagar"
]
```

### Passo 3: Salvar e Testar

1. **Salve o arquivo**
2. **Execute o programa:**
   ```bash
   python app_simples.py
   ```
3. **Teste:**
   - Digite: "Faz um arquivo novo"
   - Digite: "Adiciona uma linha"
   - Veja se funciona!

---

## 🎯 Exemplo 4: Criar Ferramenta Simples

### O Que Vamos Fazer:

Criar uma ferramenta que calcula a soma de dois números.

### Passo 1: Criar Arquivo

Crie um novo arquivo: `super_agent/tools/calculator.py`

**Cole este código:**

```python
"""
🧮 Calculadora - Ferramenta Simples

Esta ferramenta calcula operações matemáticas básicas.
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
    try:
        result = a + b
        return {
            "success": True,
            "result": result,
            "operation": "soma",
            "a": a,
            "b": b
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


def calculate_multiply(a: float, b: float) -> Dict[str, Any]:
    """
    Calcular multiplicação de dois números
    
    Args:
        a: Primeiro número
        b: Segundo número
    
    Returns:
        Resultado da multiplicação
    """
    try:
        result = a * b
        return {
            "success": True,
            "result": result,
            "operation": "multiplicação",
            "a": a,
            "b": b
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

### Passo 2: Registrar no AutoGen

Abra `super_agent/core/simple_commander.py` e encontre onde as ferramentas são registradas.

**Adicione este código:**

```python
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

### Passo 3: Salvar e Testar

1. **Salve os arquivos**
2. **Execute o programa:**
   ```bash
   python app_simples.py
   ```
3. **Teste:**
   - Digite: "Calcula a soma de 5 e 3"
   - Digite: "Quanto é 10 mais 20?"
   - Veja o resultado!

---

## 🎯 Exemplo 5: Modificar Interface

### O Que Vamos Fazer:

Modificar a mensagem inicial da interface.

### Passo 1: Encontrar a Interface

No arquivo `app_simples.py`, encontre onde a interface é criada:

```python
def create_interface(self):
    """
    Criar interface Gradio
    """
    # ... código da interface ...
```

### Passo 2: Modificar Mensagem Inicial

Encontre a mensagem inicial:

```python
# Chat
chatbot = gr.Chatbot(
    label="Chat",
    height=500,
    show_label=True,
)
```

**MODIFIQUE** para adicionar uma mensagem inicial:

```python
# Chat
chatbot = gr.Chatbot(
    label="Chat",
    height=500,
    show_label=True,
    value=[["", "Olá! Eu sou seu assistente inteligente. Como posso ajudar?"]]  # ✅ SUA MODIFICAÇÃO
)
```

### Passo 3: Salvar e Testar

1. **Salve o arquivo**
2. **Execute o programa:**
   ```bash
   python app_simples.py
   ```
3. **Veja sua mensagem personalizada!**

---

## 🎉 Conclusão

### Você Programou! ✅

Agora você sabe:
- ✅ Como modificar o código
- ✅ Como adicionar funcionalidades
- ✅ Como criar ferramentas
- ✅ Como testar suas modificações

### Próximos Passos:

1. **Modifique mais coisas** - Experimente!
2. **Adicione mais funcionalidades** - Crie suas próprias!
3. **Compartilhe seu código** - Mostre para outros!

### Precisa de Ajuda?

- Leia `COMO_PROGRAMAR.md` - Guia completo de programação
- Leia os comentários no código - Estão em português!
- Teste pequenas modificações - Aprenda fazendo!

---

**Lembre-se**: Você pode escrever código Python errado ou pseudocódigo diretamente nos arquivos - eu vou entender e corrigir! 🚀

**Boa sorte programando!** 🎉


## 👋 Vamos Programar Juntos!

Este exemplo te mostra **exatamente** como modificar o código e fazer funcionar!

**Não precisa saber tudo - só seguir os passos!**

---

## 🎯 Exemplo: Adicionar Mensagem Personalizada

### O Que Vamos Fazer:

Adicionar uma mensagem personalizada quando o usuário digitar "tudo bem?".

### Passo 1: Abrir o Arquivo

1. Abra `super_agent/app_simples.py` no seu editor
2. Procure pela função `process_message`
3. Encontre a parte que processa conversas

### Passo 2: Adicionar Sua Lógica

Encontre esta parte:

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

### Passo 3: Modificar o Código

**SUBSTITUA** a parte acima por:

```python
# CONVERSA: usar Ollama diretamente (mais rápido)
else:
    logger.info("💬 Processando como conversa (Ollama direto)...")
    
    # ✅ SUA MODIFICAÇÃO: Mensagem personalizada para "tudo bem?"
    mensagem_lower = message.lower().strip()
    
    if "tudo bem" in mensagem_lower or "tudo bom" in mensagem_lower:
        response = "Tudo bem sim, obrigado! E você? Como posso ajudar?"
    elif "obrigado" in mensagem_lower or "obrigada" in mensagem_lower:
        response = "De nada! Fico feliz em ajudar! 😊"
    elif "tchau" in mensagem_lower or "até logo" in mensagem_lower:
        response = "Tchau! Até logo! Espero ter ajudado! 👋"
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

### Passo 4: Salvar e Testar

1. **Salve o arquivo** (Ctrl+S ou Cmd+S)
2. **Execute o programa:**
   ```bash
   python app_simples.py
   ```
3. **Abra no navegador:** `http://localhost:7860`
4. **Teste:**
   - Digite: "Tudo bem?"
   - Veja sua resposta personalizada!

---

## 🎯 Exemplo 2: Adicionar Nova Função

### O Que Vamos Fazer:

Criar uma função que retorna a hora atual.

### Passo 1: Adicionar Função

No arquivo `app_simples.py`, adicione esta função **ANTES** da classe `SuperAgentApp`:

```python
# ✅ SUA FUNÇÃO: Retornar hora atual
def obter_hora_atual() -> str:
    """
    Obter hora atual
    
    Returns:
        Hora atual formatada
    """
    from datetime import datetime
    hora_atual = datetime.now().strftime("%H:%M:%S")
    return f"⏰ A hora atual é: {hora_atual}"


def obter_data_atual() -> str:
    """
    Obter data atual
    
    Returns:
        Data atual formatada
    """
    from datetime import datetime
    data_atual = datetime.now().strftime("%d/%m/%Y")
    return f"📅 A data atual é: {data_atual}"
```

### Passo 2: Usar a Função

Na função `process_message`, adicione esta lógica **ANTES** de processar a mensagem:

```python
async def process_message(self, message: str, history: List[List[str]]) -> tuple:
    """
    Processar mensagem do usuário
    """
    # ✅ SUA MODIFICAÇÃO: Verificar se é pergunta sobre hora/data
    mensagem_lower = message.lower().strip()
    
    if "que horas" in mensagem_lower or "hora" in mensagem_lower:
        response = obter_hora_atual()
    elif "que data" in mensagem_lower or "data" in mensagem_lower:
        response = obter_data_atual()
    else:
        # Processamento normal
        # ... resto do código ...
```

### Passo 3: Salvar e Testar

1. **Salve o arquivo**
2. **Execute o programa:**
   ```bash
   python app_simples.py
   ```
3. **Teste:**
   - Digite: "Que horas são?"
   - Digite: "Que data é hoje?"
   - Veja suas funções funcionando!

---

## 🎯 Exemplo 3: Modificar Detecção de Intenção

### O Que Vamos Fazer:

Modificar a detecção de intenção para reconhecer mais palavras-chave.

### Passo 1: Encontrar a Função

No arquivo `app_simples.py`, encontre a função `detect_intent_simple`:

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

**MODIFIQUE** a lista de palavras-chave:

```python
# Palavras-chave de ação
action_keywords = [
    "executa", "cria", "edita", "abre", "pesquisa", "navega",
    "clica", "digita", "screenshot", "tira foto", "busca",
    "instala", "desinstala", "executa código", "roda código",
    # ✅ SUAS PALAVRAS-CHAVE:
    "faz", "fazer", "rodar", "rodar código", "executar código",
    "criar arquivo", "escrever código", "modificar código",
    "adicionar", "remover", "deletar", "apagar"
]
```

### Passo 3: Salvar e Testar

1. **Salve o arquivo**
2. **Execute o programa:**
   ```bash
   python app_simples.py
   ```
3. **Teste:**
   - Digite: "Faz um arquivo novo"
   - Digite: "Adiciona uma linha"
   - Veja se funciona!

---

## 🎯 Exemplo 4: Criar Ferramenta Simples

### O Que Vamos Fazer:

Criar uma ferramenta que calcula a soma de dois números.

### Passo 1: Criar Arquivo

Crie um novo arquivo: `super_agent/tools/calculator.py`

**Cole este código:**

```python
"""
🧮 Calculadora - Ferramenta Simples

Esta ferramenta calcula operações matemáticas básicas.
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
    try:
        result = a + b
        return {
            "success": True,
            "result": result,
            "operation": "soma",
            "a": a,
            "b": b
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


def calculate_multiply(a: float, b: float) -> Dict[str, Any]:
    """
    Calcular multiplicação de dois números
    
    Args:
        a: Primeiro número
        b: Segundo número
    
    Returns:
        Resultado da multiplicação
    """
    try:
        result = a * b
        return {
            "success": True,
            "result": result,
            "operation": "multiplicação",
            "a": a,
            "b": b
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

### Passo 2: Registrar no AutoGen

Abra `super_agent/core/simple_commander.py` e encontre onde as ferramentas são registradas.

**Adicione este código:**

```python
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

### Passo 3: Salvar e Testar

1. **Salve os arquivos**
2. **Execute o programa:**
   ```bash
   python app_simples.py
   ```
3. **Teste:**
   - Digite: "Calcula a soma de 5 e 3"
   - Digite: "Quanto é 10 mais 20?"
   - Veja o resultado!

---

## 🎯 Exemplo 5: Modificar Interface

### O Que Vamos Fazer:

Modificar a mensagem inicial da interface.

### Passo 1: Encontrar a Interface

No arquivo `app_simples.py`, encontre onde a interface é criada:

```python
def create_interface(self):
    """
    Criar interface Gradio
    """
    # ... código da interface ...
```

### Passo 2: Modificar Mensagem Inicial

Encontre a mensagem inicial:

```python
# Chat
chatbot = gr.Chatbot(
    label="Chat",
    height=500,
    show_label=True,
)
```

**MODIFIQUE** para adicionar uma mensagem inicial:

```python
# Chat
chatbot = gr.Chatbot(
    label="Chat",
    height=500,
    show_label=True,
    value=[["", "Olá! Eu sou seu assistente inteligente. Como posso ajudar?"]]  # ✅ SUA MODIFICAÇÃO
)
```

### Passo 3: Salvar e Testar

1. **Salve o arquivo**
2. **Execute o programa:**
   ```bash
   python app_simples.py
   ```
3. **Veja sua mensagem personalizada!**

---

## 🎉 Conclusão

### Você Programou! ✅

Agora você sabe:
- ✅ Como modificar o código
- ✅ Como adicionar funcionalidades
- ✅ Como criar ferramentas
- ✅ Como testar suas modificações

### Próximos Passos:

1. **Modifique mais coisas** - Experimente!
2. **Adicione mais funcionalidades** - Crie suas próprias!
3. **Compartilhe seu código** - Mostre para outros!

### Precisa de Ajuda?

- Leia `COMO_PROGRAMAR.md` - Guia completo de programação
- Leia os comentários no código - Estão em português!
- Teste pequenas modificações - Aprenda fazendo!

---

**Lembre-se**: Você pode escrever código Python errado ou pseudocódigo diretamente nos arquivos - eu vou entender e corrigir! 🚀

**Boa sorte programando!** 🎉


## 👋 Vamos Programar Juntos!

Este exemplo te mostra **exatamente** como modificar o código e fazer funcionar!

**Não precisa saber tudo - só seguir os passos!**

---

## 🎯 Exemplo: Adicionar Mensagem Personalizada

### O Que Vamos Fazer:

Adicionar uma mensagem personalizada quando o usuário digitar "tudo bem?".

### Passo 1: Abrir o Arquivo

1. Abra `super_agent/app_simples.py` no seu editor
2. Procure pela função `process_message`
3. Encontre a parte que processa conversas

### Passo 2: Adicionar Sua Lógica

Encontre esta parte:

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

### Passo 3: Modificar o Código

**SUBSTITUA** a parte acima por:

```python
# CONVERSA: usar Ollama diretamente (mais rápido)
else:
    logger.info("💬 Processando como conversa (Ollama direto)...")
    
    # ✅ SUA MODIFICAÇÃO: Mensagem personalizada para "tudo bem?"
    mensagem_lower = message.lower().strip()
    
    if "tudo bem" in mensagem_lower or "tudo bom" in mensagem_lower:
        response = "Tudo bem sim, obrigado! E você? Como posso ajudar?"
    elif "obrigado" in mensagem_lower or "obrigada" in mensagem_lower:
        response = "De nada! Fico feliz em ajudar! 😊"
    elif "tchau" in mensagem_lower or "até logo" in mensagem_lower:
        response = "Tchau! Até logo! Espero ter ajudado! 👋"
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

### Passo 4: Salvar e Testar

1. **Salve o arquivo** (Ctrl+S ou Cmd+S)
2. **Execute o programa:**
   ```bash
   python app_simples.py
   ```
3. **Abra no navegador:** `http://localhost:7860`
4. **Teste:**
   - Digite: "Tudo bem?"
   - Veja sua resposta personalizada!

---

## 🎯 Exemplo 2: Adicionar Nova Função

### O Que Vamos Fazer:

Criar uma função que retorna a hora atual.

### Passo 1: Adicionar Função

No arquivo `app_simples.py`, adicione esta função **ANTES** da classe `SuperAgentApp`:

```python
# ✅ SUA FUNÇÃO: Retornar hora atual
def obter_hora_atual() -> str:
    """
    Obter hora atual
    
    Returns:
        Hora atual formatada
    """
    from datetime import datetime
    hora_atual = datetime.now().strftime("%H:%M:%S")
    return f"⏰ A hora atual é: {hora_atual}"


def obter_data_atual() -> str:
    """
    Obter data atual
    
    Returns:
        Data atual formatada
    """
    from datetime import datetime
    data_atual = datetime.now().strftime("%d/%m/%Y")
    return f"📅 A data atual é: {data_atual}"
```

### Passo 2: Usar a Função

Na função `process_message`, adicione esta lógica **ANTES** de processar a mensagem:

```python
async def process_message(self, message: str, history: List[List[str]]) -> tuple:
    """
    Processar mensagem do usuário
    """
    # ✅ SUA MODIFICAÇÃO: Verificar se é pergunta sobre hora/data
    mensagem_lower = message.lower().strip()
    
    if "que horas" in mensagem_lower or "hora" in mensagem_lower:
        response = obter_hora_atual()
    elif "que data" in mensagem_lower or "data" in mensagem_lower:
        response = obter_data_atual()
    else:
        # Processamento normal
        # ... resto do código ...
```

### Passo 3: Salvar e Testar

1. **Salve o arquivo**
2. **Execute o programa:**
   ```bash
   python app_simples.py
   ```
3. **Teste:**
   - Digite: "Que horas são?"
   - Digite: "Que data é hoje?"
   - Veja suas funções funcionando!

---

## 🎯 Exemplo 3: Modificar Detecção de Intenção

### O Que Vamos Fazer:

Modificar a detecção de intenção para reconhecer mais palavras-chave.

### Passo 1: Encontrar a Função

No arquivo `app_simples.py`, encontre a função `detect_intent_simple`:

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

**MODIFIQUE** a lista de palavras-chave:

```python
# Palavras-chave de ação
action_keywords = [
    "executa", "cria", "edita", "abre", "pesquisa", "navega",
    "clica", "digita", "screenshot", "tira foto", "busca",
    "instala", "desinstala", "executa código", "roda código",
    # ✅ SUAS PALAVRAS-CHAVE:
    "faz", "fazer", "rodar", "rodar código", "executar código",
    "criar arquivo", "escrever código", "modificar código",
    "adicionar", "remover", "deletar", "apagar"
]
```

### Passo 3: Salvar e Testar

1. **Salve o arquivo**
2. **Execute o programa:**
   ```bash
   python app_simples.py
   ```
3. **Teste:**
   - Digite: "Faz um arquivo novo"
   - Digite: "Adiciona uma linha"
   - Veja se funciona!

---

## 🎯 Exemplo 4: Criar Ferramenta Simples

### O Que Vamos Fazer:

Criar uma ferramenta que calcula a soma de dois números.

### Passo 1: Criar Arquivo

Crie um novo arquivo: `super_agent/tools/calculator.py`

**Cole este código:**

```python
"""
🧮 Calculadora - Ferramenta Simples

Esta ferramenta calcula operações matemáticas básicas.
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
    try:
        result = a + b
        return {
            "success": True,
            "result": result,
            "operation": "soma",
            "a": a,
            "b": b
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


def calculate_multiply(a: float, b: float) -> Dict[str, Any]:
    """
    Calcular multiplicação de dois números
    
    Args:
        a: Primeiro número
        b: Segundo número
    
    Returns:
        Resultado da multiplicação
    """
    try:
        result = a * b
        return {
            "success": True,
            "result": result,
            "operation": "multiplicação",
            "a": a,
            "b": b
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

### Passo 2: Registrar no AutoGen

Abra `super_agent/core/simple_commander.py` e encontre onde as ferramentas são registradas.

**Adicione este código:**

```python
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

### Passo 3: Salvar e Testar

1. **Salve os arquivos**
2. **Execute o programa:**
   ```bash
   python app_simples.py
   ```
3. **Teste:**
   - Digite: "Calcula a soma de 5 e 3"
   - Digite: "Quanto é 10 mais 20?"
   - Veja o resultado!

---

## 🎯 Exemplo 5: Modificar Interface

### O Que Vamos Fazer:

Modificar a mensagem inicial da interface.

### Passo 1: Encontrar a Interface

No arquivo `app_simples.py`, encontre onde a interface é criada:

```python
def create_interface(self):
    """
    Criar interface Gradio
    """
    # ... código da interface ...
```

### Passo 2: Modificar Mensagem Inicial

Encontre a mensagem inicial:

```python
# Chat
chatbot = gr.Chatbot(
    label="Chat",
    height=500,
    show_label=True,
)
```

**MODIFIQUE** para adicionar uma mensagem inicial:

```python
# Chat
chatbot = gr.Chatbot(
    label="Chat",
    height=500,
    show_label=True,
    value=[["", "Olá! Eu sou seu assistente inteligente. Como posso ajudar?"]]  # ✅ SUA MODIFICAÇÃO
)
```

### Passo 3: Salvar e Testar

1. **Salve o arquivo**
2. **Execute o programa:**
   ```bash
   python app_simples.py
   ```
3. **Veja sua mensagem personalizada!**

---

## 🎉 Conclusão

### Você Programou! ✅

Agora você sabe:
- ✅ Como modificar o código
- ✅ Como adicionar funcionalidades
- ✅ Como criar ferramentas
- ✅ Como testar suas modificações

### Próximos Passos:

1. **Modifique mais coisas** - Experimente!
2. **Adicione mais funcionalidades** - Crie suas próprias!
3. **Compartilhe seu código** - Mostre para outros!

### Precisa de Ajuda?

- Leia `COMO_PROGRAMAR.md` - Guia completo de programação
- Leia os comentários no código - Estão em português!
- Teste pequenas modificações - Aprenda fazendo!

---

**Lembre-se**: Você pode escrever código Python errado ou pseudocódigo diretamente nos arquivos - eu vou entender e corrigir! 🚀

**Boa sorte programando!** 🎉


## 👋 Vamos Programar Juntos!

Este exemplo te mostra **exatamente** como modificar o código e fazer funcionar!

**Não precisa saber tudo - só seguir os passos!**

---

## 🎯 Exemplo: Adicionar Mensagem Personalizada

### O Que Vamos Fazer:

Adicionar uma mensagem personalizada quando o usuário digitar "tudo bem?".

### Passo 1: Abrir o Arquivo

1. Abra `super_agent/app_simples.py` no seu editor
2. Procure pela função `process_message`
3. Encontre a parte que processa conversas

### Passo 2: Adicionar Sua Lógica

Encontre esta parte:

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

### Passo 3: Modificar o Código

**SUBSTITUA** a parte acima por:

```python
# CONVERSA: usar Ollama diretamente (mais rápido)
else:
    logger.info("💬 Processando como conversa (Ollama direto)...")
    
    # ✅ SUA MODIFICAÇÃO: Mensagem personalizada para "tudo bem?"
    mensagem_lower = message.lower().strip()
    
    if "tudo bem" in mensagem_lower or "tudo bom" in mensagem_lower:
        response = "Tudo bem sim, obrigado! E você? Como posso ajudar?"
    elif "obrigado" in mensagem_lower or "obrigada" in mensagem_lower:
        response = "De nada! Fico feliz em ajudar! 😊"
    elif "tchau" in mensagem_lower or "até logo" in mensagem_lower:
        response = "Tchau! Até logo! Espero ter ajudado! 👋"
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

### Passo 4: Salvar e Testar

1. **Salve o arquivo** (Ctrl+S ou Cmd+S)
2. **Execute o programa:**
   ```bash
   python app_simples.py
   ```
3. **Abra no navegador:** `http://localhost:7860`
4. **Teste:**
   - Digite: "Tudo bem?"
   - Veja sua resposta personalizada!

---

## 🎯 Exemplo 2: Adicionar Nova Função

### O Que Vamos Fazer:

Criar uma função que retorna a hora atual.

### Passo 1: Adicionar Função

No arquivo `app_simples.py`, adicione esta função **ANTES** da classe `SuperAgentApp`:

```python
# ✅ SUA FUNÇÃO: Retornar hora atual
def obter_hora_atual() -> str:
    """
    Obter hora atual
    
    Returns:
        Hora atual formatada
    """
    from datetime import datetime
    hora_atual = datetime.now().strftime("%H:%M:%S")
    return f"⏰ A hora atual é: {hora_atual}"


def obter_data_atual() -> str:
    """
    Obter data atual
    
    Returns:
        Data atual formatada
    """
    from datetime import datetime
    data_atual = datetime.now().strftime("%d/%m/%Y")
    return f"📅 A data atual é: {data_atual}"
```

### Passo 2: Usar a Função

Na função `process_message`, adicione esta lógica **ANTES** de processar a mensagem:

```python
async def process_message(self, message: str, history: List[List[str]]) -> tuple:
    """
    Processar mensagem do usuário
    """
    # ✅ SUA MODIFICAÇÃO: Verificar se é pergunta sobre hora/data
    mensagem_lower = message.lower().strip()
    
    if "que horas" in mensagem_lower or "hora" in mensagem_lower:
        response = obter_hora_atual()
    elif "que data" in mensagem_lower or "data" in mensagem_lower:
        response = obter_data_atual()
    else:
        # Processamento normal
        # ... resto do código ...
```

### Passo 3: Salvar e Testar

1. **Salve o arquivo**
2. **Execute o programa:**
   ```bash
   python app_simples.py
   ```
3. **Teste:**
   - Digite: "Que horas são?"
   - Digite: "Que data é hoje?"
   - Veja suas funções funcionando!

---

## 🎯 Exemplo 3: Modificar Detecção de Intenção

### O Que Vamos Fazer:

Modificar a detecção de intenção para reconhecer mais palavras-chave.

### Passo 1: Encontrar a Função

No arquivo `app_simples.py`, encontre a função `detect_intent_simple`:

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

**MODIFIQUE** a lista de palavras-chave:

```python
# Palavras-chave de ação
action_keywords = [
    "executa", "cria", "edita", "abre", "pesquisa", "navega",
    "clica", "digita", "screenshot", "tira foto", "busca",
    "instala", "desinstala", "executa código", "roda código",
    # ✅ SUAS PALAVRAS-CHAVE:
    "faz", "fazer", "rodar", "rodar código", "executar código",
    "criar arquivo", "escrever código", "modificar código",
    "adicionar", "remover", "deletar", "apagar"
]
```

### Passo 3: Salvar e Testar

1. **Salve o arquivo**
2. **Execute o programa:**
   ```bash
   python app_simples.py
   ```
3. **Teste:**
   - Digite: "Faz um arquivo novo"
   - Digite: "Adiciona uma linha"
   - Veja se funciona!

---

## 🎯 Exemplo 4: Criar Ferramenta Simples

### O Que Vamos Fazer:

Criar uma ferramenta que calcula a soma de dois números.

### Passo 1: Criar Arquivo

Crie um novo arquivo: `super_agent/tools/calculator.py`

**Cole este código:**

```python
"""
🧮 Calculadora - Ferramenta Simples

Esta ferramenta calcula operações matemáticas básicas.
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
    try:
        result = a + b
        return {
            "success": True,
            "result": result,
            "operation": "soma",
            "a": a,
            "b": b
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


def calculate_multiply(a: float, b: float) -> Dict[str, Any]:
    """
    Calcular multiplicação de dois números
    
    Args:
        a: Primeiro número
        b: Segundo número
    
    Returns:
        Resultado da multiplicação
    """
    try:
        result = a * b
        return {
            "success": True,
            "result": result,
            "operation": "multiplicação",
            "a": a,
            "b": b
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

### Passo 2: Registrar no AutoGen

Abra `super_agent/core/simple_commander.py` e encontre onde as ferramentas são registradas.

**Adicione este código:**

```python
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

### Passo 3: Salvar e Testar

1. **Salve os arquivos**
2. **Execute o programa:**
   ```bash
   python app_simples.py
   ```
3. **Teste:**
   - Digite: "Calcula a soma de 5 e 3"
   - Digite: "Quanto é 10 mais 20?"
   - Veja o resultado!

---

## 🎯 Exemplo 5: Modificar Interface

### O Que Vamos Fazer:

Modificar a mensagem inicial da interface.

### Passo 1: Encontrar a Interface

No arquivo `app_simples.py`, encontre onde a interface é criada:

```python
def create_interface(self):
    """
    Criar interface Gradio
    """
    # ... código da interface ...
```

### Passo 2: Modificar Mensagem Inicial

Encontre a mensagem inicial:

```python
# Chat
chatbot = gr.Chatbot(
    label="Chat",
    height=500,
    show_label=True,
)
```

**MODIFIQUE** para adicionar uma mensagem inicial:

```python
# Chat
chatbot = gr.Chatbot(
    label="Chat",
    height=500,
    show_label=True,
    value=[["", "Olá! Eu sou seu assistente inteligente. Como posso ajudar?"]]  # ✅ SUA MODIFICAÇÃO
)
```

### Passo 3: Salvar e Testar

1. **Salve o arquivo**
2. **Execute o programa:**
   ```bash
   python app_simples.py
   ```
3. **Veja sua mensagem personalizada!**

---

## 🎉 Conclusão

### Você Programou! ✅

Agora você sabe:
- ✅ Como modificar o código
- ✅ Como adicionar funcionalidades
- ✅ Como criar ferramentas
- ✅ Como testar suas modificações

### Próximos Passos:

1. **Modifique mais coisas** - Experimente!
2. **Adicione mais funcionalidades** - Crie suas próprias!
3. **Compartilhe seu código** - Mostre para outros!

### Precisa de Ajuda?

- Leia `COMO_PROGRAMAR.md` - Guia completo de programação
- Leia os comentários no código - Estão em português!
- Teste pequenas modificações - Aprenda fazendo!

---

**Lembre-se**: Você pode escrever código Python errado ou pseudocódigo diretamente nos arquivos - eu vou entender e corrigir! 🚀

**Boa sorte programando!** 🎉


## 👋 Vamos Programar Juntos!

Este exemplo te mostra **exatamente** como modificar o código e fazer funcionar!

**Não precisa saber tudo - só seguir os passos!**

---

## 🎯 Exemplo: Adicionar Mensagem Personalizada

### O Que Vamos Fazer:

Adicionar uma mensagem personalizada quando o usuário digitar "tudo bem?".

### Passo 1: Abrir o Arquivo

1. Abra `super_agent/app_simples.py` no seu editor
2. Procure pela função `process_message`
3. Encontre a parte que processa conversas

### Passo 2: Adicionar Sua Lógica

Encontre esta parte:

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

### Passo 3: Modificar o Código

**SUBSTITUA** a parte acima por:

```python
# CONVERSA: usar Ollama diretamente (mais rápido)
else:
    logger.info("💬 Processando como conversa (Ollama direto)...")
    
    # ✅ SUA MODIFICAÇÃO: Mensagem personalizada para "tudo bem?"
    mensagem_lower = message.lower().strip()
    
    if "tudo bem" in mensagem_lower or "tudo bom" in mensagem_lower:
        response = "Tudo bem sim, obrigado! E você? Como posso ajudar?"
    elif "obrigado" in mensagem_lower or "obrigada" in mensagem_lower:
        response = "De nada! Fico feliz em ajudar! 😊"
    elif "tchau" in mensagem_lower or "até logo" in mensagem_lower:
        response = "Tchau! Até logo! Espero ter ajudado! 👋"
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

### Passo 4: Salvar e Testar

1. **Salve o arquivo** (Ctrl+S ou Cmd+S)
2. **Execute o programa:**
   ```bash
   python app_simples.py
   ```
3. **Abra no navegador:** `http://localhost:7860`
4. **Teste:**
   - Digite: "Tudo bem?"
   - Veja sua resposta personalizada!

---

## 🎯 Exemplo 2: Adicionar Nova Função

### O Que Vamos Fazer:

Criar uma função que retorna a hora atual.

### Passo 1: Adicionar Função

No arquivo `app_simples.py`, adicione esta função **ANTES** da classe `SuperAgentApp`:

```python
# ✅ SUA FUNÇÃO: Retornar hora atual
def obter_hora_atual() -> str:
    """
    Obter hora atual
    
    Returns:
        Hora atual formatada
    """
    from datetime import datetime
    hora_atual = datetime.now().strftime("%H:%M:%S")
    return f"⏰ A hora atual é: {hora_atual}"


def obter_data_atual() -> str:
    """
    Obter data atual
    
    Returns:
        Data atual formatada
    """
    from datetime import datetime
    data_atual = datetime.now().strftime("%d/%m/%Y")
    return f"📅 A data atual é: {data_atual}"
```

### Passo 2: Usar a Função

Na função `process_message`, adicione esta lógica **ANTES** de processar a mensagem:

```python
async def process_message(self, message: str, history: List[List[str]]) -> tuple:
    """
    Processar mensagem do usuário
    """
    # ✅ SUA MODIFICAÇÃO: Verificar se é pergunta sobre hora/data
    mensagem_lower = message.lower().strip()
    
    if "que horas" in mensagem_lower or "hora" in mensagem_lower:
        response = obter_hora_atual()
    elif "que data" in mensagem_lower or "data" in mensagem_lower:
        response = obter_data_atual()
    else:
        # Processamento normal
        # ... resto do código ...
```

### Passo 3: Salvar e Testar

1. **Salve o arquivo**
2. **Execute o programa:**
   ```bash
   python app_simples.py
   ```
3. **Teste:**
   - Digite: "Que horas são?"
   - Digite: "Que data é hoje?"
   - Veja suas funções funcionando!

---

## 🎯 Exemplo 3: Modificar Detecção de Intenção

### O Que Vamos Fazer:

Modificar a detecção de intenção para reconhecer mais palavras-chave.

### Passo 1: Encontrar a Função

No arquivo `app_simples.py`, encontre a função `detect_intent_simple`:

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

**MODIFIQUE** a lista de palavras-chave:

```python
# Palavras-chave de ação
action_keywords = [
    "executa", "cria", "edita", "abre", "pesquisa", "navega",
    "clica", "digita", "screenshot", "tira foto", "busca",
    "instala", "desinstala", "executa código", "roda código",
    # ✅ SUAS PALAVRAS-CHAVE:
    "faz", "fazer", "rodar", "rodar código", "executar código",
    "criar arquivo", "escrever código", "modificar código",
    "adicionar", "remover", "deletar", "apagar"
]
```

### Passo 3: Salvar e Testar

1. **Salve o arquivo**
2. **Execute o programa:**
   ```bash
   python app_simples.py
   ```
3. **Teste:**
   - Digite: "Faz um arquivo novo"
   - Digite: "Adiciona uma linha"
   - Veja se funciona!

---

## 🎯 Exemplo 4: Criar Ferramenta Simples

### O Que Vamos Fazer:

Criar uma ferramenta que calcula a soma de dois números.

### Passo 1: Criar Arquivo

Crie um novo arquivo: `super_agent/tools/calculator.py`

**Cole este código:**

```python
"""
🧮 Calculadora - Ferramenta Simples

Esta ferramenta calcula operações matemáticas básicas.
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
    try:
        result = a + b
        return {
            "success": True,
            "result": result,
            "operation": "soma",
            "a": a,
            "b": b
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


def calculate_multiply(a: float, b: float) -> Dict[str, Any]:
    """
    Calcular multiplicação de dois números
    
    Args:
        a: Primeiro número
        b: Segundo número
    
    Returns:
        Resultado da multiplicação
    """
    try:
        result = a * b
        return {
            "success": True,
            "result": result,
            "operation": "multiplicação",
            "a": a,
            "b": b
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

### Passo 2: Registrar no AutoGen

Abra `super_agent/core/simple_commander.py` e encontre onde as ferramentas são registradas.

**Adicione este código:**

```python
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

### Passo 3: Salvar e Testar

1. **Salve os arquivos**
2. **Execute o programa:**
   ```bash
   python app_simples.py
   ```
3. **Teste:**
   - Digite: "Calcula a soma de 5 e 3"
   - Digite: "Quanto é 10 mais 20?"
   - Veja o resultado!

---

## 🎯 Exemplo 5: Modificar Interface

### O Que Vamos Fazer:

Modificar a mensagem inicial da interface.

### Passo 1: Encontrar a Interface

No arquivo `app_simples.py`, encontre onde a interface é criada:

```python
def create_interface(self):
    """
    Criar interface Gradio
    """
    # ... código da interface ...
```

### Passo 2: Modificar Mensagem Inicial

Encontre a mensagem inicial:

```python
# Chat
chatbot = gr.Chatbot(
    label="Chat",
    height=500,
    show_label=True,
)
```

**MODIFIQUE** para adicionar uma mensagem inicial:

```python
# Chat
chatbot = gr.Chatbot(
    label="Chat",
    height=500,
    show_label=True,
    value=[["", "Olá! Eu sou seu assistente inteligente. Como posso ajudar?"]]  # ✅ SUA MODIFICAÇÃO
)
```

### Passo 3: Salvar e Testar

1. **Salve o arquivo**
2. **Execute o programa:**
   ```bash
   python app_simples.py
   ```
3. **Veja sua mensagem personalizada!**

---

## 🎉 Conclusão

### Você Programou! ✅

Agora você sabe:
- ✅ Como modificar o código
- ✅ Como adicionar funcionalidades
- ✅ Como criar ferramentas
- ✅ Como testar suas modificações

### Próximos Passos:

1. **Modifique mais coisas** - Experimente!
2. **Adicione mais funcionalidades** - Crie suas próprias!
3. **Compartilhe seu código** - Mostre para outros!

### Precisa de Ajuda?

- Leia `COMO_PROGRAMAR.md` - Guia completo de programação
- Leia os comentários no código - Estão em português!
- Teste pequenas modificações - Aprenda fazendo!

---

**Lembre-se**: Você pode escrever código Python errado ou pseudocódigo diretamente nos arquivos - eu vou entender e corrigir! 🚀

**Boa sorte programando!** 🎉


## 👋 Vamos Programar Juntos!

Este exemplo te mostra **exatamente** como modificar o código e fazer funcionar!

**Não precisa saber tudo - só seguir os passos!**

---

## 🎯 Exemplo: Adicionar Mensagem Personalizada

### O Que Vamos Fazer:

Adicionar uma mensagem personalizada quando o usuário digitar "tudo bem?".

### Passo 1: Abrir o Arquivo

1. Abra `super_agent/app_simples.py` no seu editor
2. Procure pela função `process_message`
3. Encontre a parte que processa conversas

### Passo 2: Adicionar Sua Lógica

Encontre esta parte:

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

### Passo 3: Modificar o Código

**SUBSTITUA** a parte acima por:

```python
# CONVERSA: usar Ollama diretamente (mais rápido)
else:
    logger.info("💬 Processando como conversa (Ollama direto)...")
    
    # ✅ SUA MODIFICAÇÃO: Mensagem personalizada para "tudo bem?"
    mensagem_lower = message.lower().strip()
    
    if "tudo bem" in mensagem_lower or "tudo bom" in mensagem_lower:
        response = "Tudo bem sim, obrigado! E você? Como posso ajudar?"
    elif "obrigado" in mensagem_lower or "obrigada" in mensagem_lower:
        response = "De nada! Fico feliz em ajudar! 😊"
    elif "tchau" in mensagem_lower or "até logo" in mensagem_lower:
        response = "Tchau! Até logo! Espero ter ajudado! 👋"
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

### Passo 4: Salvar e Testar

1. **Salve o arquivo** (Ctrl+S ou Cmd+S)
2. **Execute o programa:**
   ```bash
   python app_simples.py
   ```
3. **Abra no navegador:** `http://localhost:7860`
4. **Teste:**
   - Digite: "Tudo bem?"
   - Veja sua resposta personalizada!

---

## 🎯 Exemplo 2: Adicionar Nova Função

### O Que Vamos Fazer:

Criar uma função que retorna a hora atual.

### Passo 1: Adicionar Função

No arquivo `app_simples.py`, adicione esta função **ANTES** da classe `SuperAgentApp`:

```python
# ✅ SUA FUNÇÃO: Retornar hora atual
def obter_hora_atual() -> str:
    """
    Obter hora atual
    
    Returns:
        Hora atual formatada
    """
    from datetime import datetime
    hora_atual = datetime.now().strftime("%H:%M:%S")
    return f"⏰ A hora atual é: {hora_atual}"


def obter_data_atual() -> str:
    """
    Obter data atual
    
    Returns:
        Data atual formatada
    """
    from datetime import datetime
    data_atual = datetime.now().strftime("%d/%m/%Y")
    return f"📅 A data atual é: {data_atual}"
```

### Passo 2: Usar a Função

Na função `process_message`, adicione esta lógica **ANTES** de processar a mensagem:

```python
async def process_message(self, message: str, history: List[List[str]]) -> tuple:
    """
    Processar mensagem do usuário
    """
    # ✅ SUA MODIFICAÇÃO: Verificar se é pergunta sobre hora/data
    mensagem_lower = message.lower().strip()
    
    if "que horas" in mensagem_lower or "hora" in mensagem_lower:
        response = obter_hora_atual()
    elif "que data" in mensagem_lower or "data" in mensagem_lower:
        response = obter_data_atual()
    else:
        # Processamento normal
        # ... resto do código ...
```

### Passo 3: Salvar e Testar

1. **Salve o arquivo**
2. **Execute o programa:**
   ```bash
   python app_simples.py
   ```
3. **Teste:**
   - Digite: "Que horas são?"
   - Digite: "Que data é hoje?"
   - Veja suas funções funcionando!

---

## 🎯 Exemplo 3: Modificar Detecção de Intenção

### O Que Vamos Fazer:

Modificar a detecção de intenção para reconhecer mais palavras-chave.

### Passo 1: Encontrar a Função

No arquivo `app_simples.py`, encontre a função `detect_intent_simple`:

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

**MODIFIQUE** a lista de palavras-chave:

```python
# Palavras-chave de ação
action_keywords = [
    "executa", "cria", "edita", "abre", "pesquisa", "navega",
    "clica", "digita", "screenshot", "tira foto", "busca",
    "instala", "desinstala", "executa código", "roda código",
    # ✅ SUAS PALAVRAS-CHAVE:
    "faz", "fazer", "rodar", "rodar código", "executar código",
    "criar arquivo", "escrever código", "modificar código",
    "adicionar", "remover", "deletar", "apagar"
]
```

### Passo 3: Salvar e Testar

1. **Salve o arquivo**
2. **Execute o programa:**
   ```bash
   python app_simples.py
   ```
3. **Teste:**
   - Digite: "Faz um arquivo novo"
   - Digite: "Adiciona uma linha"
   - Veja se funciona!

---

## 🎯 Exemplo 4: Criar Ferramenta Simples

### O Que Vamos Fazer:

Criar uma ferramenta que calcula a soma de dois números.

### Passo 1: Criar Arquivo

Crie um novo arquivo: `super_agent/tools/calculator.py`

**Cole este código:**

```python
"""
🧮 Calculadora - Ferramenta Simples

Esta ferramenta calcula operações matemáticas básicas.
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
    try:
        result = a + b
        return {
            "success": True,
            "result": result,
            "operation": "soma",
            "a": a,
            "b": b
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


def calculate_multiply(a: float, b: float) -> Dict[str, Any]:
    """
    Calcular multiplicação de dois números
    
    Args:
        a: Primeiro número
        b: Segundo número
    
    Returns:
        Resultado da multiplicação
    """
    try:
        result = a * b
        return {
            "success": True,
            "result": result,
            "operation": "multiplicação",
            "a": a,
            "b": b
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

### Passo 2: Registrar no AutoGen

Abra `super_agent/core/simple_commander.py` e encontre onde as ferramentas são registradas.

**Adicione este código:**

```python
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

### Passo 3: Salvar e Testar

1. **Salve os arquivos**
2. **Execute o programa:**
   ```bash
   python app_simples.py
   ```
3. **Teste:**
   - Digite: "Calcula a soma de 5 e 3"
   - Digite: "Quanto é 10 mais 20?"
   - Veja o resultado!

---

## 🎯 Exemplo 5: Modificar Interface

### O Que Vamos Fazer:

Modificar a mensagem inicial da interface.

### Passo 1: Encontrar a Interface

No arquivo `app_simples.py`, encontre onde a interface é criada:

```python
def create_interface(self):
    """
    Criar interface Gradio
    """
    # ... código da interface ...
```

### Passo 2: Modificar Mensagem Inicial

Encontre a mensagem inicial:

```python
# Chat
chatbot = gr.Chatbot(
    label="Chat",
    height=500,
    show_label=True,
)
```

**MODIFIQUE** para adicionar uma mensagem inicial:

```python
# Chat
chatbot = gr.Chatbot(
    label="Chat",
    height=500,
    show_label=True,
    value=[["", "Olá! Eu sou seu assistente inteligente. Como posso ajudar?"]]  # ✅ SUA MODIFICAÇÃO
)
```

### Passo 3: Salvar e Testar

1. **Salve o arquivo**
2. **Execute o programa:**
   ```bash
   python app_simples.py
   ```
3. **Veja sua mensagem personalizada!**

---

## 🎉 Conclusão

### Você Programou! ✅

Agora você sabe:
- ✅ Como modificar o código
- ✅ Como adicionar funcionalidades
- ✅ Como criar ferramentas
- ✅ Como testar suas modificações

### Próximos Passos:

1. **Modifique mais coisas** - Experimente!
2. **Adicione mais funcionalidades** - Crie suas próprias!
3. **Compartilhe seu código** - Mostre para outros!

### Precisa de Ajuda?

- Leia `COMO_PROGRAMAR.md` - Guia completo de programação
- Leia os comentários no código - Estão em português!
- Teste pequenas modificações - Aprenda fazendo!

---

**Lembre-se**: Você pode escrever código Python errado ou pseudocódigo diretamente nos arquivos - eu vou entender e corrigir! 🚀

**Boa sorte programando!** 🎉


## 👋 Vamos Programar Juntos!

Este exemplo te mostra **exatamente** como modificar o código e fazer funcionar!

**Não precisa saber tudo - só seguir os passos!**

---

## 🎯 Exemplo: Adicionar Mensagem Personalizada

### O Que Vamos Fazer:

Adicionar uma mensagem personalizada quando o usuário digitar "tudo bem?".

### Passo 1: Abrir o Arquivo

1. Abra `super_agent/app_simples.py` no seu editor
2. Procure pela função `process_message`
3. Encontre a parte que processa conversas

### Passo 2: Adicionar Sua Lógica

Encontre esta parte:

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

### Passo 3: Modificar o Código

**SUBSTITUA** a parte acima por:

```python
# CONVERSA: usar Ollama diretamente (mais rápido)
else:
    logger.info("💬 Processando como conversa (Ollama direto)...")
    
    # ✅ SUA MODIFICAÇÃO: Mensagem personalizada para "tudo bem?"
    mensagem_lower = message.lower().strip()
    
    if "tudo bem" in mensagem_lower or "tudo bom" in mensagem_lower:
        response = "Tudo bem sim, obrigado! E você? Como posso ajudar?"
    elif "obrigado" in mensagem_lower or "obrigada" in mensagem_lower:
        response = "De nada! Fico feliz em ajudar! 😊"
    elif "tchau" in mensagem_lower or "até logo" in mensagem_lower:
        response = "Tchau! Até logo! Espero ter ajudado! 👋"
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

### Passo 4: Salvar e Testar

1. **Salve o arquivo** (Ctrl+S ou Cmd+S)
2. **Execute o programa:**
   ```bash
   python app_simples.py
   ```
3. **Abra no navegador:** `http://localhost:7860`
4. **Teste:**
   - Digite: "Tudo bem?"
   - Veja sua resposta personalizada!

---

## 🎯 Exemplo 2: Adicionar Nova Função

### O Que Vamos Fazer:

Criar uma função que retorna a hora atual.

### Passo 1: Adicionar Função

No arquivo `app_simples.py`, adicione esta função **ANTES** da classe `SuperAgentApp`:

```python
# ✅ SUA FUNÇÃO: Retornar hora atual
def obter_hora_atual() -> str:
    """
    Obter hora atual
    
    Returns:
        Hora atual formatada
    """
    from datetime import datetime
    hora_atual = datetime.now().strftime("%H:%M:%S")
    return f"⏰ A hora atual é: {hora_atual}"


def obter_data_atual() -> str:
    """
    Obter data atual
    
    Returns:
        Data atual formatada
    """
    from datetime import datetime
    data_atual = datetime.now().strftime("%d/%m/%Y")
    return f"📅 A data atual é: {data_atual}"
```

### Passo 2: Usar a Função

Na função `process_message`, adicione esta lógica **ANTES** de processar a mensagem:

```python
async def process_message(self, message: str, history: List[List[str]]) -> tuple:
    """
    Processar mensagem do usuário
    """
    # ✅ SUA MODIFICAÇÃO: Verificar se é pergunta sobre hora/data
    mensagem_lower = message.lower().strip()
    
    if "que horas" in mensagem_lower or "hora" in mensagem_lower:
        response = obter_hora_atual()
    elif "que data" in mensagem_lower or "data" in mensagem_lower:
        response = obter_data_atual()
    else:
        # Processamento normal
        # ... resto do código ...
```

### Passo 3: Salvar e Testar

1. **Salve o arquivo**
2. **Execute o programa:**
   ```bash
   python app_simples.py
   ```
3. **Teste:**
   - Digite: "Que horas são?"
   - Digite: "Que data é hoje?"
   - Veja suas funções funcionando!

---

## 🎯 Exemplo 3: Modificar Detecção de Intenção

### O Que Vamos Fazer:

Modificar a detecção de intenção para reconhecer mais palavras-chave.

### Passo 1: Encontrar a Função

No arquivo `app_simples.py`, encontre a função `detect_intent_simple`:

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

**MODIFIQUE** a lista de palavras-chave:

```python
# Palavras-chave de ação
action_keywords = [
    "executa", "cria", "edita", "abre", "pesquisa", "navega",
    "clica", "digita", "screenshot", "tira foto", "busca",
    "instala", "desinstala", "executa código", "roda código",
    # ✅ SUAS PALAVRAS-CHAVE:
    "faz", "fazer", "rodar", "rodar código", "executar código",
    "criar arquivo", "escrever código", "modificar código",
    "adicionar", "remover", "deletar", "apagar"
]
```

### Passo 3: Salvar e Testar

1. **Salve o arquivo**
2. **Execute o programa:**
   ```bash
   python app_simples.py
   ```
3. **Teste:**
   - Digite: "Faz um arquivo novo"
   - Digite: "Adiciona uma linha"
   - Veja se funciona!

---

## 🎯 Exemplo 4: Criar Ferramenta Simples

### O Que Vamos Fazer:

Criar uma ferramenta que calcula a soma de dois números.

### Passo 1: Criar Arquivo

Crie um novo arquivo: `super_agent/tools/calculator.py`

**Cole este código:**

```python
"""
🧮 Calculadora - Ferramenta Simples

Esta ferramenta calcula operações matemáticas básicas.
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
    try:
        result = a + b
        return {
            "success": True,
            "result": result,
            "operation": "soma",
            "a": a,
            "b": b
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


def calculate_multiply(a: float, b: float) -> Dict[str, Any]:
    """
    Calcular multiplicação de dois números
    
    Args:
        a: Primeiro número
        b: Segundo número
    
    Returns:
        Resultado da multiplicação
    """
    try:
        result = a * b
        return {
            "success": True,
            "result": result,
            "operation": "multiplicação",
            "a": a,
            "b": b
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

### Passo 2: Registrar no AutoGen

Abra `super_agent/core/simple_commander.py` e encontre onde as ferramentas são registradas.

**Adicione este código:**

```python
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

### Passo 3: Salvar e Testar

1. **Salve os arquivos**
2. **Execute o programa:**
   ```bash
   python app_simples.py
   ```
3. **Teste:**
   - Digite: "Calcula a soma de 5 e 3"
   - Digite: "Quanto é 10 mais 20?"
   - Veja o resultado!

---

## 🎯 Exemplo 5: Modificar Interface

### O Que Vamos Fazer:

Modificar a mensagem inicial da interface.

### Passo 1: Encontrar a Interface

No arquivo `app_simples.py`, encontre onde a interface é criada:

```python
def create_interface(self):
    """
    Criar interface Gradio
    """
    # ... código da interface ...
```

### Passo 2: Modificar Mensagem Inicial

Encontre a mensagem inicial:

```python
# Chat
chatbot = gr.Chatbot(
    label="Chat",
    height=500,
    show_label=True,
)
```

**MODIFIQUE** para adicionar uma mensagem inicial:

```python
# Chat
chatbot = gr.Chatbot(
    label="Chat",
    height=500,
    show_label=True,
    value=[["", "Olá! Eu sou seu assistente inteligente. Como posso ajudar?"]]  # ✅ SUA MODIFICAÇÃO
)
```

### Passo 3: Salvar e Testar

1. **Salve o arquivo**
2. **Execute o programa:**
   ```bash
   python app_simples.py
   ```
3. **Veja sua mensagem personalizada!**

---

## 🎉 Conclusão

### Você Programou! ✅

Agora você sabe:
- ✅ Como modificar o código
- ✅ Como adicionar funcionalidades
- ✅ Como criar ferramentas
- ✅ Como testar suas modificações

### Próximos Passos:

1. **Modifique mais coisas** - Experimente!
2. **Adicione mais funcionalidades** - Crie suas próprias!
3. **Compartilhe seu código** - Mostre para outros!

### Precisa de Ajuda?

- Leia `COMO_PROGRAMAR.md` - Guia completo de programação
- Leia os comentários no código - Estão em português!
- Teste pequenas modificações - Aprenda fazendo!

---

**Lembre-se**: Você pode escrever código Python errado ou pseudocódigo diretamente nos arquivos - eu vou entender e corrigir! 🚀

**Boa sorte programando!** 🎉


## 👋 Vamos Programar Juntos!

Este exemplo te mostra **exatamente** como modificar o código e fazer funcionar!

**Não precisa saber tudo - só seguir os passos!**

---

## 🎯 Exemplo: Adicionar Mensagem Personalizada

### O Que Vamos Fazer:

Adicionar uma mensagem personalizada quando o usuário digitar "tudo bem?".

### Passo 1: Abrir o Arquivo

1. Abra `super_agent/app_simples.py` no seu editor
2. Procure pela função `process_message`
3. Encontre a parte que processa conversas

### Passo 2: Adicionar Sua Lógica

Encontre esta parte:

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

### Passo 3: Modificar o Código

**SUBSTITUA** a parte acima por:

```python
# CONVERSA: usar Ollama diretamente (mais rápido)
else:
    logger.info("💬 Processando como conversa (Ollama direto)...")
    
    # ✅ SUA MODIFICAÇÃO: Mensagem personalizada para "tudo bem?"
    mensagem_lower = message.lower().strip()
    
    if "tudo bem" in mensagem_lower or "tudo bom" in mensagem_lower:
        response = "Tudo bem sim, obrigado! E você? Como posso ajudar?"
    elif "obrigado" in mensagem_lower or "obrigada" in mensagem_lower:
        response = "De nada! Fico feliz em ajudar! 😊"
    elif "tchau" in mensagem_lower or "até logo" in mensagem_lower:
        response = "Tchau! Até logo! Espero ter ajudado! 👋"
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

### Passo 4: Salvar e Testar

1. **Salve o arquivo** (Ctrl+S ou Cmd+S)
2. **Execute o programa:**
   ```bash
   python app_simples.py
   ```
3. **Abra no navegador:** `http://localhost:7860`
4. **Teste:**
   - Digite: "Tudo bem?"
   - Veja sua resposta personalizada!

---

## 🎯 Exemplo 2: Adicionar Nova Função

### O Que Vamos Fazer:

Criar uma função que retorna a hora atual.

### Passo 1: Adicionar Função

No arquivo `app_simples.py`, adicione esta função **ANTES** da classe `SuperAgentApp`:

```python
# ✅ SUA FUNÇÃO: Retornar hora atual
def obter_hora_atual() -> str:
    """
    Obter hora atual
    
    Returns:
        Hora atual formatada
    """
    from datetime import datetime
    hora_atual = datetime.now().strftime("%H:%M:%S")
    return f"⏰ A hora atual é: {hora_atual}"


def obter_data_atual() -> str:
    """
    Obter data atual
    
    Returns:
        Data atual formatada
    """
    from datetime import datetime
    data_atual = datetime.now().strftime("%d/%m/%Y")
    return f"📅 A data atual é: {data_atual}"
```

### Passo 2: Usar a Função

Na função `process_message`, adicione esta lógica **ANTES** de processar a mensagem:

```python
async def process_message(self, message: str, history: List[List[str]]) -> tuple:
    """
    Processar mensagem do usuário
    """
    # ✅ SUA MODIFICAÇÃO: Verificar se é pergunta sobre hora/data
    mensagem_lower = message.lower().strip()
    
    if "que horas" in mensagem_lower or "hora" in mensagem_lower:
        response = obter_hora_atual()
    elif "que data" in mensagem_lower or "data" in mensagem_lower:
        response = obter_data_atual()
    else:
        # Processamento normal
        # ... resto do código ...
```

### Passo 3: Salvar e Testar

1. **Salve o arquivo**
2. **Execute o programa:**
   ```bash
   python app_simples.py
   ```
3. **Teste:**
   - Digite: "Que horas são?"
   - Digite: "Que data é hoje?"
   - Veja suas funções funcionando!

---

## 🎯 Exemplo 3: Modificar Detecção de Intenção

### O Que Vamos Fazer:

Modificar a detecção de intenção para reconhecer mais palavras-chave.

### Passo 1: Encontrar a Função

No arquivo `app_simples.py`, encontre a função `detect_intent_simple`:

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

**MODIFIQUE** a lista de palavras-chave:

```python
# Palavras-chave de ação
action_keywords = [
    "executa", "cria", "edita", "abre", "pesquisa", "navega",
    "clica", "digita", "screenshot", "tira foto", "busca",
    "instala", "desinstala", "executa código", "roda código",
    # ✅ SUAS PALAVRAS-CHAVE:
    "faz", "fazer", "rodar", "rodar código", "executar código",
    "criar arquivo", "escrever código", "modificar código",
    "adicionar", "remover", "deletar", "apagar"
]
```

### Passo 3: Salvar e Testar

1. **Salve o arquivo**
2. **Execute o programa:**
   ```bash
   python app_simples.py
   ```
3. **Teste:**
   - Digite: "Faz um arquivo novo"
   - Digite: "Adiciona uma linha"
   - Veja se funciona!

---

## 🎯 Exemplo 4: Criar Ferramenta Simples

### O Que Vamos Fazer:

Criar uma ferramenta que calcula a soma de dois números.

### Passo 1: Criar Arquivo

Crie um novo arquivo: `super_agent/tools/calculator.py`

**Cole este código:**

```python
"""
🧮 Calculadora - Ferramenta Simples

Esta ferramenta calcula operações matemáticas básicas.
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
    try:
        result = a + b
        return {
            "success": True,
            "result": result,
            "operation": "soma",
            "a": a,
            "b": b
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


def calculate_multiply(a: float, b: float) -> Dict[str, Any]:
    """
    Calcular multiplicação de dois números
    
    Args:
        a: Primeiro número
        b: Segundo número
    
    Returns:
        Resultado da multiplicação
    """
    try:
        result = a * b
        return {
            "success": True,
            "result": result,
            "operation": "multiplicação",
            "a": a,
            "b": b
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

### Passo 2: Registrar no AutoGen

Abra `super_agent/core/simple_commander.py` e encontre onde as ferramentas são registradas.

**Adicione este código:**

```python
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

### Passo 3: Salvar e Testar

1. **Salve os arquivos**
2. **Execute o programa:**
   ```bash
   python app_simples.py
   ```
3. **Teste:**
   - Digite: "Calcula a soma de 5 e 3"
   - Digite: "Quanto é 10 mais 20?"
   - Veja o resultado!

---

## 🎯 Exemplo 5: Modificar Interface

### O Que Vamos Fazer:

Modificar a mensagem inicial da interface.

### Passo 1: Encontrar a Interface

No arquivo `app_simples.py`, encontre onde a interface é criada:

```python
def create_interface(self):
    """
    Criar interface Gradio
    """
    # ... código da interface ...
```

### Passo 2: Modificar Mensagem Inicial

Encontre a mensagem inicial:

```python
# Chat
chatbot = gr.Chatbot(
    label="Chat",
    height=500,
    show_label=True,
)
```

**MODIFIQUE** para adicionar uma mensagem inicial:

```python
# Chat
chatbot = gr.Chatbot(
    label="Chat",
    height=500,
    show_label=True,
    value=[["", "Olá! Eu sou seu assistente inteligente. Como posso ajudar?"]]  # ✅ SUA MODIFICAÇÃO
)
```

### Passo 3: Salvar e Testar

1. **Salve o arquivo**
2. **Execute o programa:**
   ```bash
   python app_simples.py
   ```
3. **Veja sua mensagem personalizada!**

---

## 🎉 Conclusão

### Você Programou! ✅

Agora você sabe:
- ✅ Como modificar o código
- ✅ Como adicionar funcionalidades
- ✅ Como criar ferramentas
- ✅ Como testar suas modificações

### Próximos Passos:

1. **Modifique mais coisas** - Experimente!
2. **Adicione mais funcionalidades** - Crie suas próprias!
3. **Compartilhe seu código** - Mostre para outros!

### Precisa de Ajuda?

- Leia `COMO_PROGRAMAR.md` - Guia completo de programação
- Leia os comentários no código - Estão em português!
- Teste pequenas modificações - Aprenda fazendo!

---

**Lembre-se**: Você pode escrever código Python errado ou pseudocódigo diretamente nos arquivos - eu vou entender e corrigir! 🚀

**Boa sorte programando!** 🎉


## 👋 Vamos Programar Juntos!

Este exemplo te mostra **exatamente** como modificar o código e fazer funcionar!

**Não precisa saber tudo - só seguir os passos!**

---

## 🎯 Exemplo: Adicionar Mensagem Personalizada

### O Que Vamos Fazer:

Adicionar uma mensagem personalizada quando o usuário digitar "tudo bem?".

### Passo 1: Abrir o Arquivo

1. Abra `super_agent/app_simples.py` no seu editor
2. Procure pela função `process_message`
3. Encontre a parte que processa conversas

### Passo 2: Adicionar Sua Lógica

Encontre esta parte:

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

### Passo 3: Modificar o Código

**SUBSTITUA** a parte acima por:

```python
# CONVERSA: usar Ollama diretamente (mais rápido)
else:
    logger.info("💬 Processando como conversa (Ollama direto)...")
    
    # ✅ SUA MODIFICAÇÃO: Mensagem personalizada para "tudo bem?"
    mensagem_lower = message.lower().strip()
    
    if "tudo bem" in mensagem_lower or "tudo bom" in mensagem_lower:
        response = "Tudo bem sim, obrigado! E você? Como posso ajudar?"
    elif "obrigado" in mensagem_lower or "obrigada" in mensagem_lower:
        response = "De nada! Fico feliz em ajudar! 😊"
    elif "tchau" in mensagem_lower or "até logo" in mensagem_lower:
        response = "Tchau! Até logo! Espero ter ajudado! 👋"
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

### Passo 4: Salvar e Testar

1. **Salve o arquivo** (Ctrl+S ou Cmd+S)
2. **Execute o programa:**
   ```bash
   python app_simples.py
   ```
3. **Abra no navegador:** `http://localhost:7860`
4. **Teste:**
   - Digite: "Tudo bem?"
   - Veja sua resposta personalizada!

---

## 🎯 Exemplo 2: Adicionar Nova Função

### O Que Vamos Fazer:

Criar uma função que retorna a hora atual.

### Passo 1: Adicionar Função

No arquivo `app_simples.py`, adicione esta função **ANTES** da classe `SuperAgentApp`:

```python
# ✅ SUA FUNÇÃO: Retornar hora atual
def obter_hora_atual() -> str:
    """
    Obter hora atual
    
    Returns:
        Hora atual formatada
    """
    from datetime import datetime
    hora_atual = datetime.now().strftime("%H:%M:%S")
    return f"⏰ A hora atual é: {hora_atual}"


def obter_data_atual() -> str:
    """
    Obter data atual
    
    Returns:
        Data atual formatada
    """
    from datetime import datetime
    data_atual = datetime.now().strftime("%d/%m/%Y")
    return f"📅 A data atual é: {data_atual}"
```

### Passo 2: Usar a Função

Na função `process_message`, adicione esta lógica **ANTES** de processar a mensagem:

```python
async def process_message(self, message: str, history: List[List[str]]) -> tuple:
    """
    Processar mensagem do usuário
    """
    # ✅ SUA MODIFICAÇÃO: Verificar se é pergunta sobre hora/data
    mensagem_lower = message.lower().strip()
    
    if "que horas" in mensagem_lower or "hora" in mensagem_lower:
        response = obter_hora_atual()
    elif "que data" in mensagem_lower or "data" in mensagem_lower:
        response = obter_data_atual()
    else:
        # Processamento normal
        # ... resto do código ...
```

### Passo 3: Salvar e Testar

1. **Salve o arquivo**
2. **Execute o programa:**
   ```bash
   python app_simples.py
   ```
3. **Teste:**
   - Digite: "Que horas são?"
   - Digite: "Que data é hoje?"
   - Veja suas funções funcionando!

---

## 🎯 Exemplo 3: Modificar Detecção de Intenção

### O Que Vamos Fazer:

Modificar a detecção de intenção para reconhecer mais palavras-chave.

### Passo 1: Encontrar a Função

No arquivo `app_simples.py`, encontre a função `detect_intent_simple`:

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

**MODIFIQUE** a lista de palavras-chave:

```python
# Palavras-chave de ação
action_keywords = [
    "executa", "cria", "edita", "abre", "pesquisa", "navega",
    "clica", "digita", "screenshot", "tira foto", "busca",
    "instala", "desinstala", "executa código", "roda código",
    # ✅ SUAS PALAVRAS-CHAVE:
    "faz", "fazer", "rodar", "rodar código", "executar código",
    "criar arquivo", "escrever código", "modificar código",
    "adicionar", "remover", "deletar", "apagar"
]
```

### Passo 3: Salvar e Testar

1. **Salve o arquivo**
2. **Execute o programa:**
   ```bash
   python app_simples.py
   ```
3. **Teste:**
   - Digite: "Faz um arquivo novo"
   - Digite: "Adiciona uma linha"
   - Veja se funciona!

---

## 🎯 Exemplo 4: Criar Ferramenta Simples

### O Que Vamos Fazer:

Criar uma ferramenta que calcula a soma de dois números.

### Passo 1: Criar Arquivo

Crie um novo arquivo: `super_agent/tools/calculator.py`

**Cole este código:**

```python
"""
🧮 Calculadora - Ferramenta Simples

Esta ferramenta calcula operações matemáticas básicas.
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
    try:
        result = a + b
        return {
            "success": True,
            "result": result,
            "operation": "soma",
            "a": a,
            "b": b
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


def calculate_multiply(a: float, b: float) -> Dict[str, Any]:
    """
    Calcular multiplicação de dois números
    
    Args:
        a: Primeiro número
        b: Segundo número
    
    Returns:
        Resultado da multiplicação
    """
    try:
        result = a * b
        return {
            "success": True,
            "result": result,
            "operation": "multiplicação",
            "a": a,
            "b": b
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

### Passo 2: Registrar no AutoGen

Abra `super_agent/core/simple_commander.py` e encontre onde as ferramentas são registradas.

**Adicione este código:**

```python
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

### Passo 3: Salvar e Testar

1. **Salve os arquivos**
2. **Execute o programa:**
   ```bash
   python app_simples.py
   ```
3. **Teste:**
   - Digite: "Calcula a soma de 5 e 3"
   - Digite: "Quanto é 10 mais 20?"
   - Veja o resultado!

---

## 🎯 Exemplo 5: Modificar Interface

### O Que Vamos Fazer:

Modificar a mensagem inicial da interface.

### Passo 1: Encontrar a Interface

No arquivo `app_simples.py`, encontre onde a interface é criada:

```python
def create_interface(self):
    """
    Criar interface Gradio
    """
    # ... código da interface ...
```

### Passo 2: Modificar Mensagem Inicial

Encontre a mensagem inicial:

```python
# Chat
chatbot = gr.Chatbot(
    label="Chat",
    height=500,
    show_label=True,
)
```

**MODIFIQUE** para adicionar uma mensagem inicial:

```python
# Chat
chatbot = gr.Chatbot(
    label="Chat",
    height=500,
    show_label=True,
    value=[["", "Olá! Eu sou seu assistente inteligente. Como posso ajudar?"]]  # ✅ SUA MODIFICAÇÃO
)
```

### Passo 3: Salvar e Testar

1. **Salve o arquivo**
2. **Execute o programa:**
   ```bash
   python app_simples.py
   ```
3. **Veja sua mensagem personalizada!**

---

## 🎉 Conclusão

### Você Programou! ✅

Agora você sabe:
- ✅ Como modificar o código
- ✅ Como adicionar funcionalidades
- ✅ Como criar ferramentas
- ✅ Como testar suas modificações

### Próximos Passos:

1. **Modifique mais coisas** - Experimente!
2. **Adicione mais funcionalidades** - Crie suas próprias!
3. **Compartilhe seu código** - Mostre para outros!

### Precisa de Ajuda?

- Leia `COMO_PROGRAMAR.md` - Guia completo de programação
- Leia os comentários no código - Estão em português!
- Teste pequenas modificações - Aprenda fazendo!

---

**Lembre-se**: Você pode escrever código Python errado ou pseudocódigo diretamente nos arquivos - eu vou entender e corrigir! 🚀

**Boa sorte programando!** 🎉

