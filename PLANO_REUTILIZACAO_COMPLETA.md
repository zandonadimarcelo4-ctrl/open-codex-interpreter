# 🎯 Plano Completo: Reutilizar Open Interpreter Dentro do AutoGen

## 📋 Visão Geral

**Objetivo:** Reutilizar 100% da lógica do Open Interpreter dentro do AutoGen, mantendo todas as funcionalidades e usando o `model_client` do AutoGen.

**Abordagem:** Importar classe `Interpreter` do OI e adaptar método `respond()` para usar `model_client` do AutoGen, mantendo toda a lógica de execução (CodeInterpreter, etc.).

---

## 🗺️ Plano de Implementação

### Fase 1: Análise e Preparação (1-2 horas)

#### 1.1 Analisar Estrutura do Open Interpreter
- [x] Identificar módulos principais:
  - `interpreter.py` - Classe principal
  - `code_interpreter.py` - Execução de código
  - `code_block.py` - Display de blocos
  - `message_block.py` - Display de mensagens
  - `utils.py` - Utilitários
  - `system_message.txt` - System message
- [x] Identificar dependências entre módulos
- [x] Identificar métodos críticos:
  - `Interpreter.respond()` - Gera código usando LLM
  - `Interpreter.chat()` - Loop principal de chat
  - `CodeInterpreter.run()` - Executa código

#### 1.2 Analisar Interface do AutoGen
- [x] Entender `AssistantAgent` do AutoGen v2
- [x] Entender `model_client` do AutoGen
- [x] Entender sistema de mensagens do AutoGen
- [x] Identificar pontos de integração

#### 1.3 Definir Estratégia de Adaptação
- [x] **Estratégia escolhida:** Substituir método `respond()` do Interpreter para usar `model_client` do AutoGen
- [x] Manter toda a lógica de execução do OI (CodeInterpreter, etc.)
- [x] Manter system message do OI
- [x] Manter processamento de código do OI

---

### Fase 2: Implementação do Agente (2-3 horas)

#### 2.1 Criar Agente Base

**Arquivo:** `super_agent/agents/open_interpreter_agent_integrated.py`

```python
"""
OpenInterpreterAgentIntegrated - Agente que reutiliza 100% da lógica do Open Interpreter

Este agente importa a classe Interpreter do OI e adapta apenas o método respond()
para usar o model_client do AutoGen, mantendo toda a lógica de execução do OI.
"""
import os
import sys
import logging
from pathlib import Path
from typing import Optional, Any, Dict, List

logger = logging.getLogger(__name__)

# Adicionar interpreter/ ao path
_current_dir = Path(__file__).parent
_interpreter_dir = _current_dir.parent.parent / "interpreter"
if _interpreter_dir.exists():
    sys.path.insert(0, str(_interpreter_dir.parent))

try:
    from autogen_agentchat.agents import AssistantAgent
    AUTOGEN_V2_AVAILABLE = True
except ImportError:
    AUTOGEN_V2_AVAILABLE = False
    logger.error("autogen-agentchat não está instalado")

try:
    from interpreter.interpreter import Interpreter
    from interpreter.code_interpreter import CodeInterpreter
    from interpreter.utils import parse_partial_json, merge_deltas
    OPEN_INTERPRETER_AVAILABLE = True
except ImportError:
    OPEN_INTERPRETER_AVAILABLE = False
    logger.error("Open Interpreter não disponível")
```

#### 2.2 Criar Classe do Agente

```python
class OpenInterpreterAgentIntegrated(AssistantAgent):
    """
    Agente que reutiliza 100% da lógica do Open Interpreter
    
    Características:
    - Importa classe Interpreter do OI
    - Substitui método respond() para usar model_client do AutoGen
    - Mantém toda a lógica de execução do OI (CodeInterpreter, etc.)
    - Zero overhead de comunicação (mesmo processo)
    """
    
    def __init__(
        self,
        name: str = "interpreter",
        model_client: Optional[Any] = None,
        workdir: Optional[str] = None,
        auto_run: bool = True,
        system_message: Optional[str] = None,
        **kwargs
    ):
        """
        Inicializa o agente integrado
        
        Args:
            name: Nome do agente
            model_client: Cliente LLM do AutoGen
            workdir: Diretório de trabalho (sandbox)
            auto_run: Executar código automaticamente
            system_message: Mensagem do sistema personalizada
            **kwargs: Argumentos adicionais para AssistantAgent
        """
        if not AUTOGEN_V2_AVAILABLE:
            raise ImportError("autogen-agentchat não está instalado")
        
        if not OPEN_INTERPRETER_AVAILABLE:
            raise ImportError("Open Interpreter não disponível")
        
        # Carregar system message do OI
        if system_message is None:
            system_message = self._load_system_message()
        
        # Inicializar AssistantAgent
        super().__init__(
            name=name,
            model_client=model_client,
            system_message=system_message,
            **kwargs
        )
        
        # Configurações
        self.workdir = workdir or os.getcwd()
        self.auto_run = auto_run
        self.model_client_autogen = model_client
        
        # Criar instância do Interpreter do OI
        self.interpreter = Interpreter(
            auto_run=self.auto_run,
            local=True,  # Modo local
            model=None,  # Será sobrescrito
            debug_mode=False,
            use_ollama=False,  # Não usar OllamaAdapter
        )
        
        # Desabilitar OllamaAdapter no Interpreter
        self.interpreter.ollama_adapter = None
        self.interpreter.use_ollama = False
        
        # Substituir método respond() do Interpreter
        # Salvar método original para referência
        self._original_respond = self.interpreter.respond
        # Substituir por nossa implementação
        self.interpreter.respond = self._respond_with_autogen
        
        # Configurar workdir
        if self.workdir:
            os.makedirs(self.workdir, exist_ok=True)
        
        logger.info(f"✅ OpenInterpreterAgentIntegrated inicializado")
        logger.info(f"   ✅ Reutiliza 100% da lógica do Open Interpreter")
        logger.info(f"   ✅ Usa model_client do AutoGen")
        logger.info(f"   ✅ Workdir: {self.workdir}")
```

#### 2.3 Implementar Método _load_system_message()

```python
def _load_system_message(self) -> str:
    """Carrega system message do Open Interpreter"""
    try:
        system_message_path = _interpreter_dir / "system_message.txt"
        if system_message_path.exists():
            with open(system_message_path, 'r', encoding='utf-8') as f:
                return f.read()
    except Exception as e:
        logger.warning(f"Não foi possível carregar system_message.txt: {e}")
    
    # Fallback para system message padrão
    return """You are Open Interpreter, a world-class programmer that can execute code on the user's machine.

First, write a plan. **Always recap the plan between each code block**.

When you execute code, it will be executed **on the user's machine**. The user has given you **full and complete permission** to execute any code necessary to complete the task.

Write code to solve the task. You can use any language, but Python is preferred.

When a user refers to a filename, they're likely referring to an existing file in the directory you're currently in.

When you want to give the user a final answer, use the print function to output it.

IMPORTANT: Execute code automatically. Do not ask for permission.
When you generate code, always include the code in markdown code blocks (```language\ncode\n```).
After generating code, the system will automatically execute it and return the results."""
```

#### 2.4 Implementar Método _respond_with_autogen()

```python
def _respond_with_autogen(self):
    """
    Substitui respond() do Interpreter para usar model_client do AutoGen
    
    Este método:
    1. Prepara mensagens do Interpreter para o model_client do AutoGen
    2. Chama model_client do AutoGen (assíncrono)
    3. Processa resposta do LLM
    4. Extrai blocos de código
    5. Executa código usando CodeInterpreter do OI (reutiliza 100% da lógica)
    6. Adiciona resultados às mensagens do Interpreter
    """
    import asyncio
    import re
    
    # Preparar mensagens para model_client do AutoGen
    messages = self.interpreter.messages.copy()
    
    # Adicionar system message se não estiver presente
    has_system_message = any(msg.get("role") == "system" for msg in messages)
    if not has_system_message:
        system_message = self.interpreter.system_message
        if system_message:
            # Adicionar informações do sistema (como o OI faz)
            system_info = self.interpreter.get_info_for_system_message()
            full_system_message = system_message + system_info
            messages.insert(0, {"role": "system", "content": full_system_message})
    
    # Chamar model_client do AutoGen (assíncrono)
    try:
        # Executar de forma síncrona (o Interpreter espera resposta síncrona)
        if asyncio.iscoroutinefunction(self.model_client_autogen.create):
            # Se model_client é assíncrono, usar loop existente ou criar novo
            try:
                loop = asyncio.get_event_loop()
                if loop.is_running():
                    # Loop já está rodando, usar run_in_executor
                    import concurrent.futures
                    with concurrent.futures.ThreadPoolExecutor() as executor:
                        future = executor.submit(
                            asyncio.run,
                            self.model_client_autogen.create(messages=messages)
                        )
                        response = future.result()
                else:
                    response = loop.run_until_complete(
                        self.model_client_autogen.create(messages=messages)
                    )
            except RuntimeError:
                # Não há loop, criar novo
                response = asyncio.run(
                    self.model_client_autogen.create(messages=messages)
                )
        else:
            # Se model_client é síncrono, chamar diretamente
            response = self.model_client_autogen.create(messages=messages)
        
        # Extrair conteúdo da resposta
        if hasattr(response, 'choices'):
            # Formato OpenAI/AutoGen
            content = response.choices[0].message.content
        elif isinstance(response, dict):
            # Formato dict
            content = response.get("choices", [{}])[0].get("message", {}).get("content", "")
        else:
            content = str(response)
        
        # Adicionar resposta às mensagens do Interpreter
        self.interpreter.messages.append({
            "role": "assistant",
            "content": content
        })
        
        # Processar resposta: extrair código e executar
        # Isso reutiliza 100% da lógica do OI
        self._process_response(content)
        
    except Exception as e:
        logger.error(f"Erro ao chamar model_client do AutoGen: {e}")
        # Adicionar erro às mensagens
        self.interpreter.messages.append({
            "role": "assistant",
            "content": f"Erro ao processar: {str(e)}"
        })
```

#### 2.5 Implementar Método _process_response()

```python
def _process_response(self, content: str):
    """
    Processa resposta do LLM: extrai código e executa
    Reutiliza 100% da lógica do Open Interpreter
    """
    import re
    
    # Extrair blocos de código (mesma lógica do OI)
    code_blocks = re.findall(r'```(\w+)?\n(.*?)```', content, re.DOTALL)
    
    if not code_blocks:
        return  # Não há código para executar
    
    # Processar cada bloco de código
    for language, code in code_blocks:
        language = language or "python"
        code = code.strip()
        
        if not code:
            continue
        
        # Executar código usando CodeInterpreter do OI (reutiliza 100% da lógica)
        try:
            output = self._execute_code(code, language)
            
            # Adicionar resultado às mensagens do Interpreter (formato do OI)
            self.interpreter.messages.append({
                "role": "function",
                "name": "run_code",
                "content": output
            })
            
        except Exception as e:
            logger.error(f"Erro ao executar código: {e}")
            # Adicionar erro às mensagens
            self.interpreter.messages.append({
                "role": "function",
                "name": "run_code",
                "content": f"Erro ao executar código: {str(e)}"
            })
```

#### 2.6 Implementar Método _execute_code()

```python
def _execute_code(self, code: str, language: str) -> str:
    """
    Executa código usando CodeInterpreter do OI (reutiliza 100% da lógica)
    
    Args:
        code: Código a executar
        language: Linguagem do código (python, shell, javascript, etc.)
    
    Returns:
        Output da execução
    """
    # Mudar para workdir
    original_cwd = os.getcwd()
    try:
        if self.workdir:
            os.chdir(self.workdir)
        
        # Obter ou criar CodeInterpreter para linguagem (reutiliza lógica do OI)
        if language not in self.interpreter.code_interpreters:
            self.interpreter.code_interpreters[language] = CodeInterpreter(
                language=language,
                debug_mode=self.interpreter.debug_mode
            )
        
        code_interpreter = self.interpreter.code_interpreters[language]
        
        # Configurar código no CodeInterpreter
        code_interpreter.code = code
        code_interpreter.language = language
        
        # Executar código (reutiliza 100% da lógica do OI)
        # CodeInterpreter.run() faz tudo:
        # - Inicia processo se necessário
        - Adiciona active line tracking (AST transformation)
        # - Executa código
        # - Captura output
        # - Retorna resultado
        output = code_interpreter.run()
        
        return output
        
    finally:
        os.chdir(original_cwd)
```

#### 2.7 Implementar Método process_message() para AutoGen

```python
async def process_message(self, message: str) -> str:
    """
    Processa mensagem do AutoGen usando Interpreter do OI (reutiliza 100% da lógica)
    
    Args:
        message: Mensagem do usuário
    
    Returns:
        Resposta do agente
    """
    # Mudar para workdir
    original_cwd = os.getcwd()
    try:
        if self.workdir:
            os.chdir(self.workdir)
        
        # Adicionar mensagem ao Interpreter
        self.interpreter.messages.append({
            "role": "user",
            "content": message
        })
        
        # Chamar respond() do Interpreter (que foi substituído para usar model_client do AutoGen)
        # Isso vai:
        # 1. Chamar model_client do AutoGen (via _respond_with_autogen)
        # 2. Processar resposta (extrair código)
        # 3. Executar código (usando CodeInterpreter do OI)
        # 4. Adicionar resultados às mensagens
        self.interpreter.respond()
        
        # Extrair última mensagem do Interpreter
        if self.interpreter.messages:
            # Buscar última mensagem do assistant
            for msg in reversed(self.interpreter.messages):
                if msg.get("role") == "assistant":
                    return msg.get("content", "")
            
            # Se não encontrou mensagem do assistant, retornar última mensagem
            last_message = self.interpreter.messages[-1]
            return last_message.get("content", "Código executado com sucesso.")
        
        return "Código executado com sucesso."
        
    finally:
        os.chdir(original_cwd)
```

#### 2.8 Criar Função Helper

```python
def create_open_interpreter_agent_integrated(
    model_client: Any,
    name: str = "interpreter",
    workdir: Optional[str] = None,
    auto_run: bool = True,
    **kwargs
) -> OpenInterpreterAgentIntegrated:
    """
    Cria um OpenInterpreterAgentIntegrated para uso no AutoGen
    
    Args:
        model_client: Cliente LLM do AutoGen
        name: Nome do agente
        workdir: Diretório de trabalho
        auto_run: Executar código automaticamente
        **kwargs: Argumentos adicionais
    
    Returns:
        OpenInterpreterAgentIntegrated configurado
    """
    return OpenInterpreterAgentIntegrated(
        name=name,
        model_client=model_client,
        workdir=workdir,
        auto_run=auto_run,
        **kwargs
    )
```

---

### Fase 3: Integração com AutoGen (1-2 horas)

#### 3.1 Atualizar simple_commander.py

**Arquivo:** `super_agent/core/simple_commander.py`

```python
# Adicionar import
from ..agents.open_interpreter_agent_integrated import create_open_interpreter_agent_integrated

# No método _initialize_agents(), adicionar opção para usar agente integrado
def _initialize_agents(self):
    # ... código existente ...
    
    # Opção 1: Usar TOOL (atual) - Recomendado para projeto estático
    if USE_TOOL_APPROACH:
        # ... código existente do TOOL ...
        pass
    
    # Opção 2: Usar Agente Integrado (reutiliza 100% da lógica do OI)
    elif USE_INTEGRATED_AGENT:
        interpreter_agent = create_open_interpreter_agent_integrated(
            model_client=llm_client,
            name="interpreter",
            workdir=self.workdir,
            auto_run=True,
        )
        
        # Adicionar agente ao team
        agents.append(interpreter_agent)
        logger.info(f"✅ Agente integrado registrado: interpreter (reutiliza 100% da lógica do OI)")
```

#### 3.2 Adicionar Configuração

**Arquivo:** `super_agent/core/simple_commander.py`

```python
# Adicionar flag de configuração
USE_INTEGRATED_AGENT = os.getenv("USE_INTEGRATED_INTERPRETER_AGENT", "false").lower() == "true"
USE_TOOL_APPROACH = not USE_INTEGRATED_AGENT  # TOOL é padrão
```

---

### Fase 4: Testes (2-3 horas)

#### 4.1 Testes Unitários

**Arquivo:** `tests/test_open_interpreter_agent_integrated.py`

```python
import pytest
from super_agent.agents.open_interpreter_agent_integrated import OpenInterpreterAgentIntegrated

def test_agent_initialization():
    """Testa inicialização do agente"""
    # ... testes ...

def test_code_execution():
    """Testa execução de código Python"""
    # ... testes ...

def test_code_execution_shell():
    """Testa execução de código Shell"""
    # ... testes ...

def test_code_execution_javascript():
    """Testa execução de código JavaScript"""
    # ... testes ...
```

#### 4.2 Testes de Integração

**Arquivo:** `tests/test_integration_autogen_interpreter.py`

```python
def test_autogen_with_interpreter_agent():
    """Testa integração do agente com AutoGen"""
    # ... testes ...

def test_multiple_agents():
    """Testa múltiplos agentes trabalhando juntos"""
    # ... testes ...
```

#### 4.3 Testes de Performance

```python
def test_performance():
    """Testa performance do agente integrado"""
    # ... testes ...
    # Comparar com TOOL approach
```

---

### Fase 5: Documentação (1-2 horas)

#### 5.1 Documentar Agente

**Arquivo:** `docs/OPEN_INTERPRETER_AGENT_INTEGRATED.md`

```markdown
# OpenInterpreterAgentIntegrated

## Descrição
Agente que reutiliza 100% da lógica do Open Interpreter dentro do AutoGen.

## Uso
```python
from super_agent.agents.open_interpreter_agent_integrated import create_open_interpreter_agent_integrated

agent = create_open_interpreter_agent_integrated(
    model_client=llm_client,
    workdir="./workspace",
    auto_run=True,
)
```

## Características
- Reutiliza 100% da lógica do Open Interpreter
- Usa model_client do AutoGen
- Zero overhead de comunicação
- Funcionalidades completas (Python, Shell, JavaScript, HTML)
```

#### 5.2 Atualizar README

**Arquivo:** `README.md`

```markdown
## Open Interpreter Integration

### Opção 1: TOOL (Recomendado)
- Código mínimo (~100 linhas)
- Isolamento (processo separado)
- Performance adequada (overhead negligenciável)

### Opção 2: Agente Integrado
- Reutiliza 100% da lógica do OI
- Zero overhead (mesmo processo)
- Integração nativa com AutoGen
```

---

## 📊 Cronograma

| Fase | Tarefa | Tempo | Status |
|------|--------|-------|--------|
| 1 | Análise e Preparação | 1-2h | ⏳ Pendente |
| 2 | Implementação do Agente | 2-3h | ⏳ Pendente |
| 3 | Integração com AutoGen | 1-2h | ⏳ Pendente |
| 4 | Testes | 2-3h | ⏳ Pendente |
| 5 | Documentação | 1-2h | ⏳ Pendente |
| **Total** | | **7-12h** | ⏳ Pendente |

---

## ✅ Checklist de Implementação

### Fase 1: Análise e Preparação
- [ ] Analisar estrutura do Open Interpreter
- [ ] Analisar interface do AutoGen
- [ ] Definir estratégia de adaptação

### Fase 2: Implementação do Agente
- [ ] Criar arquivo `open_interpreter_agent_integrated.py`
- [ ] Implementar classe `OpenInterpreterAgentIntegrated`
- [ ] Implementar método `_load_system_message()`
- [ ] Implementar método `_respond_with_autogen()`
- [ ] Implementar método `_process_response()`
- [ ] Implementar método `_execute_code()`
- [ ] Implementar método `process_message()`
- [ ] Criar função helper `create_open_interpreter_agent_integrated()`

### Fase 3: Integração com AutoGen
- [ ] Atualizar `simple_commander.py`
- [ ] Adicionar configuração `USE_INTEGRATED_AGENT`
- [ ] Testar integração com AutoGen

### Fase 4: Testes
- [ ] Testes unitários
- [ ] Testes de integração
- [ ] Testes de performance

### Fase 5: Documentação
- [ ] Documentar agente
- [ ] Atualizar README
- [ ] Criar exemplos de uso

---

## 🎯 Resultado Esperado

### Funcionalidades
- ✅ Reutiliza 100% da lógica do Open Interpreter
- ✅ Usa model_client do AutoGen (mesmo modelo)
- ✅ Executa código Python, Shell, JavaScript, HTML
- ✅ Active line tracking (AST transformation)
- ✅ Output truncation
- ✅ Error handling robusto
- ✅ Zero overhead de comunicação

### Performance
- ✅ 0ms overhead (mesmo processo)
- ✅ Memória compartilhada
- ✅ Integração nativa com AutoGen

### Manutenção
- ✅ Código limpo e documentado
- ✅ Testes completos
- ✅ Fácil de manter

---

## 🚀 Próximos Passos

1. **Começar Fase 1:** Análise e Preparação
2. **Implementar Fase 2:** Criar agente integrado
3. **Integrar Fase 3:** Conectar com AutoGen
4. **Testar Fase 4:** Garantir funcionalidades
5. **Documentar Fase 5:** Criar documentação

---

## 📝 Notas Importantes

### Vantagens
- ✅ Reutiliza 100% da lógica do Open Interpreter
- ✅ Zero overhead de comunicação
- ✅ Integração nativa com AutoGen
- ✅ Funcionalidades completas

### Desvantagens
- ⚠️ Mais código (~300-400 linhas)
- ⚠️ Menos isolamento (mesmo processo)
- ⚠️ Manutenção média (adaptar método)

### Recomendação
- ✅ **TOOL é mais eficiente para projeto estático** (código mínimo, manutenção baixa)
- ⚠️ **Agente integrado** só se precisar performance máxima (0ms overhead)

---

**Status: Plano completo criado. Pronto para implementação!** ✅

