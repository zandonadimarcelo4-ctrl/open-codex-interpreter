# 🔄 Reutilizar Toda a Lógica do Open Interpreter Dentro do AutoGen

## 🎯 Objetivo

Reutilizar **100% da lógica do Open Interpreter** dentro do AutoGen, mantendo:
- ✅ Todas as funcionalidades (Python, Shell, JavaScript, HTML)
- ✅ Active line tracking (AST transformation)
- ✅ Output truncation
- ✅ Streaming de output (threading)
- ✅ Error handling robusto
- ✅ Python interativo (-i mode)
- ✅ Mesmo modelo Ollama (via AutoGen model_client)

---

## 📦 Módulos do Open Interpreter a Reutilizar

### 1. **Módulos Core**

```
interpreter/
├── code_interpreter.py    # ← Execução de código (Python, Shell, JS, HTML)
├── code_block.py          # ← Display de blocos de código (Rich)
├── message_block.py       # ← Display de mensagens (Rich)
├── utils.py               # ← Utilitários (merge_deltas, parse_partial_json)
└── system_message.txt     # ← System message do OI
```

### 2. **Módulos Opcionais**

```
interpreter/
├── ollama_adapter.py      # ← NÃO PRECISA (usa model_client do AutoGen)
└── interpreter.py         # ← NÃO PRECISA (lógica será no agente)
```

---

## 🏗️ Estrutura Proposta

### 1. Copiar Módulos para `super_agent/executors/`

```
super_agent/
└── executors/
    ├── __init__.py
    ├── code_interpreter.py    # ← Copiado de interpreter/
    ├── code_block.py          # ← Copiado de interpreter/
    ├── message_block.py       # ← Copiado de interpreter/
    └── utils.py               # ← Copiado de interpreter/
```

### 2. Criar Agente que Reutiliza Módulos

```
super_agent/
└── agents/
    └── open_interpreter_agent_native.py  # ← Novo agente que reutiliza tudo
```

---

## 🔧 Implementação

### Passo 1: Copiar Módulos

```bash
# Copiar módulos do OI para super_agent/executors/
cp interpreter/code_interpreter.py super_agent/executors/
cp interpreter/code_block.py super_agent/executors/
cp interpreter/message_block.py super_agent/executors/
cp interpreter/utils.py super_agent/executors/
cp interpreter/system_message.txt super_agent/executors/
```

### Passo 2: Adaptar Imports

**Antes (interpreter/code_interpreter.py):**
```python
import subprocess
import webbrowser
# ...
```

**Depois (super_agent/executors/code_interpreter.py):**
```python
import subprocess
import webbrowser
# ... (mesmo código, apenas ajustar imports internos se necessário)
```

### Passo 3: Criar Agente Nativo

```python
# super_agent/agents/open_interpreter_agent_native.py
from autogen_agentchat.agents import AssistantAgent
from autogen_ext.models.ollama import OllamaChatCompletionClient

from ..executors.code_interpreter import CodeInterpreter
from ..executors.utils import parse_partial_json
import re
import os


class OpenInterpreterAgentNative(AssistantAgent):
    """
    Agente Nativo que reutiliza 100% da lógica do Open Interpreter
    
    Características:
    - Usa model_client do AutoGen (mesmo modelo DeepSeek)
    - Reutiliza CodeInterpreter do OI (execução de código)
    - Reutiliza utils do OI (parse_partial_json, etc.)
    - Mesmo comportamento do OI original
    - Zero overhead de comunicação (mesmo processo)
    """
    
    def __init__(
        self,
        name: str = "interpreter",
        model_client=None,
        workdir: Optional[str] = None,
        auto_run: bool = True,
        **kwargs
    ):
        # Inicializar AssistantAgent
        super().__init__(
            name=name,
            model_client=model_client,
            system_message=self._load_system_message(),
            **kwargs
        )
        
        # Configurações
        self.workdir = workdir or os.getcwd()
        self.auto_run = auto_run
        
        # Cache de CodeInterpreter por linguagem
        self.code_interpreters = {}
        
        # Histórico de mensagens (para contexto)
        self.message_history = []
    
    def _load_system_message(self) -> str:
        """Carrega system message do OI"""
        here = os.path.abspath(os.path.dirname(__file__))
        system_message_path = os.path.join(here, '..', 'executors', 'system_message.txt')
        
        if os.path.exists(system_message_path):
            with open(system_message_path, 'r') as f:
                return f.read()
        else:
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
    
    def _extract_code_blocks(self, text: str) -> List[Dict[str, str]]:
        """Extrai blocos de código de markdown (reutiliza lógica do OI)"""
        code_blocks = []
        pattern = r'```(\w+)?\n(.*?)```'
        matches = re.findall(pattern, text, re.DOTALL)
        
        for match in matches:
            language = match[0] or "python"
            code = match[1].strip()
            if code:
                code_blocks.append({"language": language, "code": code})
        
        return code_blocks
    
    def _get_code_interpreter(self, language: str) -> CodeInterpreter:
        """Obtém ou cria CodeInterpreter para linguagem (reutiliza do OI)"""
        if language not in self.code_interpreters:
            from ..executors.code_interpreter import CodeInterpreter
            self.code_interpreters[language] = CodeInterpreter(
                language=language,
                debug_mode=False
            )
        return self.code_interpreters[language]
    
    def _execute_code(self, code: str, language: str) -> str:
        """Executa código usando CodeInterpreter do OI (reutiliza 100%)"""
        # Mudar para workdir
        original_cwd = os.getcwd()
        try:
            os.chdir(self.workdir)
            
            # Obter CodeInterpreter
            code_interpreter = self._get_code_interpreter(language)
            
            # Configurar código no CodeInterpreter
            code_interpreter.code = code
            code_interpreter.language = language
            
            # Executar código (reutiliza lógica do OI)
            output = code_interpreter.run()
            
            return output
        finally:
            os.chdir(original_cwd)
    
    async def process_message(self, message: str) -> str:
        """
        Processa mensagem: gera código com model_client do AutoGen,
        executa com CodeInterpreter do OI, retorna resultado
        """
        # Adicionar mensagem ao histórico
        self.message_history.append({"role": "user", "content": message})
        
        # Gerar resposta com model_client do AutoGen
        response = await self.model_client.create(
            messages=self.message_history
        )
        
        # Extrair conteúdo da resposta
        content = response.choices[0].message.content
        
        # Adicionar resposta ao histórico
        self.message_history.append({"role": "assistant", "content": content})
        
        # Extrair blocos de código (reutiliza lógica do OI)
        code_blocks = self._extract_code_blocks(content)
        
        # Executar código se auto_run=True
        if self.auto_run and code_blocks:
            execution_results = []
            for block in code_blocks:
                language = block["language"]
                code = block["code"]
                
                # Executar código (reutiliza CodeInterpreter do OI)
                output = self._execute_code(code, language)
                execution_results.append(f"```{language}\n{code}\n```\n\nOutput:\n{output}")
            
            # Adicionar resultados ao histórico
            if execution_results:
                results_text = "\n\n".join(execution_results)
                self.message_history.append({
                    "role": "function",
                    "name": "run_code",
                    "content": results_text
                })
                
                # Gerar resposta final com resultados
                final_response = await self.model_client.create(
                    messages=self.message_history
                )
                content = final_response.choices[0].message.content
                self.message_history.append({"role": "assistant", "content": content})
        
        return content
```

---

## 📊 Comparação: TOOL vs Reutilização Completa

| Aspecto | TOOL (Atual) | Reutilização Completa |
|---------|--------------|-----------------------|
| **Código** | ~100 linhas (bridge) | ~300-400 linhas (agente) |
| **Módulos Reutilizados** | 0 (usa classe Interpreter) | 4 (code_interpreter, code_block, message_block, utils) |
| **Performance** | ⚠️ ~10-50ms overhead | ✅ 0ms overhead |
| **Funcionalidades** | ✅ Completas (via Interpreter) | ✅ Completas (reutiliza módulos) |
| **Isolamento** | ✅ Alto (processo separado) | ⚠️ Médio (mesmo processo) |
| **Manutenção** | ✅ Baixa (bridge simples) | ⚠️ Média (adaptar módulos) |
| **Complexidade** | ✅ Baixa | ⚠️ Média |

---

## ✅ Vantagens da Reutilização Completa

1. ✅ **Zero overhead** - mesmo processo, memória compartilhada
2. ✅ **Funcionalidades completas** - reutiliza 100% da lógica do OI
3. ✅ **Integração nativa** - herda funcionalidades do AutoGen
4. ✅ **Mesmo comportamento** - código idêntico ao OI original
5. ✅ **Performance máxima** - sem comunicação entre processos

---

## ⚠️ Desvantagens da Reutilização Completa

1. ⚠️ **Mais código** - ~300-400 linhas vs ~100 linhas
2. ⚠️ **Menos isolamento** - mesmo processo (risco de travar)
3. ⚠️ **Manutenção** - precisa adaptar módulos se OI mudar (mas você não atualiza)
4. ⚠️ **Complexidade** - mais código para gerenciar

---

## 🎯 Quando Usar Cada Abordagem

### TOOL (Atual) ✅
- ✅ Projeto estático (você não atualiza OI)
- ✅ Isolamento importante (segurança)
- ✅ Manutenção baixa (bridge simples)
- ✅ Performance adequada (overhead negligenciável)

### Reutilização Completa ⚠️
- ⚠️ Performance máxima necessária (0ms overhead)
- ⚠️ Integração nativa com AutoGen (histórico automático)
- ⚠️ Mesmo processo (menos overhead)
- ⚠️ Controle total sobre código

---

## 🚀 Implementação Completa

### Opção 1: Reutilizar Módulos Diretamente (Recomendado)

```python
# super_agent/agents/open_interpreter_agent_native.py
from autogen_agentchat.agents import AssistantAgent
from ..executors.code_interpreter import CodeInterpreter  # ← Reutiliza do OI
from ..executors.utils import parse_partial_json  # ← Reutiliza do OI
import re
import os

class OpenInterpreterAgentNative(AssistantAgent):
    def __init__(self, model_client, workdir=None, auto_run=True, **kwargs):
        super().__init__(model_client=model_client, **kwargs)
        self.workdir = workdir or os.getcwd()
        self.auto_run = auto_run
        self.code_interpreters = {}  # Cache por linguagem
    
    def _execute_code(self, code: str, language: str) -> str:
        """Executa código usando CodeInterpreter do OI"""
        if language not in self.code_interpreters:
            self.code_interpreters[language] = CodeInterpreter(
                language=language,
                debug_mode=False
            )
        
        code_interpreter = self.code_interpreters[language]
        code_interpreter.code = code
        code_interpreter.language = language
        return code_interpreter.run()  # ← Reutiliza 100% da lógica do OI
```

### Opção 2: Usar Classe Interpreter Completa (Mais Simples)

```python
# super_agent/agents/open_interpreter_agent_wrapper.py
from autogen_agentchat.agents import AssistantAgent
import sys
import os

# Adicionar interpreter/ ao path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'interpreter'))

from interpreter import Interpreter  # ← Usa classe completa do OI

class OpenInterpreterAgentWrapper(AssistantAgent):
    def __init__(self, model_client, workdir=None, auto_run=True, **kwargs):
        super().__init__(model_client=model_client, **kwargs)
        
        # Criar instância do Interpreter do OI
        self.interpreter = Interpreter(
            auto_run=auto_run,
            local=True,  # Usa Ollama
            model=None,  # Será sobrescrito
            debug_mode=False,
            use_ollama=True,
        )
        
        # Substituir adaptador Ollama pelo model_client do AutoGen
        self.interpreter.ollama_adapter = None
        self.interpreter.use_ollama = False
        self.interpreter.model_client = model_client  # ← Usa model_client do AutoGen
    
    async def process_message(self, message: str) -> str:
        """Processa mensagem usando Interpreter do OI"""
        # Executar chat do OI (reutiliza 100% da lógica)
        self.interpreter.chat(message, return_messages=False)
        
        # Extrair última mensagem
        if self.interpreter.messages:
            return self.interpreter.messages[-1].get("content", "")
        return ""
```

---

## 📝 Resumo

### Reutilização Completa vs TOOL

| Critério | TOOL | Reutilização Completa |
|----------|------|-----------------------|
| **Código** | ~100 linhas | ~300-400 linhas |
| **Performance** | ⚠️ ~10-50ms | ✅ 0ms |
| **Funcionalidades** | ✅ Completas | ✅ Completas |
| **Isolamento** | ✅ Alto | ⚠️ Médio |
| **Manutenção** | ✅ Baixa | ⚠️ Média |
| **Complexidade** | ✅ Baixa | ⚠️ Média |

### Decisão

**Para projeto estático (você não atualiza OI):**
- ✅ **TOOL é mais eficiente** (código mínimo, manutenção baixa)
- ⚠️ **Reutilização completa** só se precisar performance máxima (0ms overhead)

---

## 🎯 Recomendação Final

### **MANTER TOOL** (Para Projeto Estático)

**Motivos:**
1. ✅ Código mínimo (~100 linhas)
2. ✅ Manutenção baixa (bridge simples)
3. ✅ Isolamento (processo separado)
4. ✅ Performance adequada (overhead negligenciável)
5. ✅ Funcionalidades completas (via Interpreter)

### **Reutilização Completa** (Se Precisar Performance Máxima)

**Motivos:**
1. ✅ Performance máxima (0ms overhead)
2. ✅ Integração nativa (histórico automático)
3. ✅ Controle total (mesmo processo)
4. ⚠️ Mais código (~300-400 linhas)
5. ⚠️ Menos isolamento (mesmo processo)

---

**Status: TOOL é mais eficiente para projeto estático, mas reutilização completa é possível se precisar performance máxima** ✅

