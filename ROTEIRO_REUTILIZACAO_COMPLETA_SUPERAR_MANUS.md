# 🚀 Roteiro Prático: Reutilização Completa para Superar Manus

## 🎯 Objetivo

Criar um agente que **supera o Manus** em:
- ✅ **Autonomia real** - raciocina, executa e corrige sozinho
- ✅ **Inteligência local contínua** - aprende com logs, arquivos, contexto
- ✅ **Ciclo interno completo** - prompt → code → exec → retry (sem intervenção)
- ✅ **Zero overhead** - tudo no mesmo processo
- ✅ **Multi-linguagem verdadeira** - Python, Shell, JS, PowerShell, etc.

---

## 📋 Estrutura do Roteiro

1. **Fase 1: Copiar Módulos do Open Interpreter** (30 min)
2. **Fase 2: Adaptar Imports e Dependências** (1-2h)
3. **Fase 3: Integrar com AutoGen Model Client** (2-3h)
4. **Fase 4: Conectar Loop de Feedback** (2-3h)
5. **Fase 5: Adicionar Autonomia e Auto-Correção** (2-3h)
6. **Fase 6: Testes e Validação** (2-3h)

**Total:** 10-15 horas de trabalho intenso

---

## 🗂️ Fase 1: Copiar Módulos do Open Interpreter

### 1.1 Estrutura de Diretórios

```
super_agent/
└── executors/
    ├── __init__.py
    ├── code_interpreter.py      # ← Copiar de interpreter/
    ├── code_block.py            # ← Copiar de interpreter/
    ├── message_block.py         # ← Copiar de interpreter/
    ├── utils.py                 # ← Copiar de interpreter/
    ├── system_message.txt       # ← Copiar de interpreter/
    └── oi_core.py               # ← Novo: núcleo do OI adaptado
```

### 1.2 Comandos para Copiar

```bash
# Criar diretório
mkdir -p super_agent/executors

# Copiar módulos
cp interpreter/code_interpreter.py super_agent/executors/
cp interpreter/code_block.py super_agent/executors/
cp interpreter/message_block.py super_agent/executors/
cp interpreter/utils.py super_agent/executors/
cp interpreter/system_message.txt super_agent/executors/

# Criar __init__.py
touch super_agent/executors/__init__.py
```

### 1.3 Arquivos a Copiar (Checklist)

- [x] `code_interpreter.py` - Executor de código (Python, Shell, JS, etc.)
- [x] `code_block.py` - Display de blocos de código (Rich)
- [x] `message_block.py` - Display de mensagens (Rich)
- [x] `utils.py` - Utilitários (parse_partial_json, merge_deltas)
- [x] `system_message.txt` - System message do OI

---

## 🔧 Fase 2: Adaptar Imports e Dependências

### 2.1 Criar `super_agent/executors/__init__.py`

```python
"""
Módulos do Open Interpreter adaptados para uso no AutoGen
"""
from .code_interpreter import CodeInterpreter
from .code_block import CodeBlock
from .message_block import MessageBlock
from .utils import parse_partial_json, merge_deltas

__all__ = [
    "CodeInterpreter",
    "CodeBlock",
    "MessageBlock",
    "parse_partial_json",
    "merge_deltas",
]
```

### 2.2 Adaptar Imports em `code_interpreter.py`

**Antes:**
```python
# Imports originais (podem ter dependências relativas)
from .code_block import CodeBlock
from .utils import truncate_output
```

**Depois:**
```python
# Imports adaptados (usar imports absolutos ou relativos corretos)
from super_agent.executors.code_block import CodeBlock
from super_agent.executors.utils import truncate_output
# Ou manter relativos se funcionar:
from .code_block import CodeBlock
from .utils import truncate_output
```

### 2.3 Adaptar Imports em `code_block.py` e `message_block.py`

```python
# Verificar se há imports relativos e ajustar
# Geralmente esses arquivos são auto-suficientes
```

### 2.4 Criar `super_agent/executors/oi_core.py`

```python
"""
Núcleo do Open Interpreter adaptado para AutoGen

Este módulo encapsula a lógica principal do OI:
- Geração de código usando model_client do AutoGen
- Execução de código usando CodeInterpreter
- Loop de feedback e auto-correção
- Autonomia e inteligência local
"""
import os
import re
import logging
from typing import Optional, List, Dict, Any
from pathlib import Path

from .code_interpreter import CodeInterpreter
from .utils import parse_partial_json

logger = logging.getLogger(__name__)


class OICore:
    """
    Núcleo do Open Interpreter adaptado para AutoGen
    
    Características:
    - Usa model_client do AutoGen (mesmo modelo)
    - Executa código usando CodeInterpreter (reutiliza 100% da lógica)
    - Loop de feedback e auto-correção
    - Autonomia e inteligência local
    """
    
    def __init__(
        self,
        model_client: Any,
        workdir: Optional[str] = None,
        auto_run: bool = True,
        max_retries: int = 3,
        debug_mode: bool = False,
    ):
        """
        Inicializa o núcleo do OI
        
        Args:
            model_client: Cliente LLM do AutoGen
            workdir: Diretório de trabalho (sandbox)
            auto_run: Executar código automaticamente
            max_retries: Número máximo de tentativas de correção
            debug_mode: Modo debug
        """
        self.model_client = model_client
        self.workdir = workdir or os.getcwd()
        self.auto_run = auto_run
        self.max_retries = max_retries
        self.debug_mode = debug_mode
        
        # Histórico de mensagens
        self.messages: List[Dict[str, Any]] = []
        
        # Cache de CodeInterpreter por linguagem
        self.code_interpreters: Dict[str, CodeInterpreter] = {}
        
        # System message
        self.system_message = self._load_system_message()
        
        # Criar workdir se não existir
        os.makedirs(self.workdir, exist_ok=True)
        
        logger.info(f"✅ OICore inicializado")
        logger.info(f"   ✅ Workdir: {self.workdir}")
        logger.info(f"   ✅ Auto-run: {self.auto_run}")
        logger.info(f"   ✅ Max retries: {self.max_retries}")
    
    def _load_system_message(self) -> str:
        """Carrega system message do OI"""
        try:
            system_message_path = Path(__file__).parent / "system_message.txt"
            if system_message_path.exists():
                with open(system_message_path, 'r', encoding='utf-8') as f:
                    return f.read()
        except Exception as e:
            logger.warning(f"Não foi possível carregar system_message.txt: {e}")
        
        # Fallback
        return """You are Open Interpreter, a world-class programmer that can execute code on the user's machine.

First, write a plan. **Always recap the plan between each code block**.

When you execute code, it will be executed **on the user's machine**. The user has given you **full and complete permission** to execute any code necessary to complete the task.

Write code to solve the task. You can use any language, but Python is preferred.

When a user refers to a filename, they're likely referring to an existing file in the directory you're currently in.

When you want to give the user a final answer, use the print function to output it.

IMPORTANT: Execute code automatically. Do not ask for permission.
When you generate code, always include the code in markdown code blocks (```language\ncode\n```).
After generating code, the system will automatically execute it and return the results."""
    
    def _get_code_interpreter(self, language: str) -> CodeInterpreter:
        """Obtém ou cria CodeInterpreter para linguagem"""
        if language not in self.code_interpreters:
            self.code_interpreters[language] = CodeInterpreter(
                language=language,
                debug_mode=self.debug_mode
            )
        return self.code_interpreters[language]
    
    def _extract_code_blocks(self, text: str) -> List[Dict[str, str]]:
        """Extrai blocos de código de markdown"""
        code_blocks = []
        pattern = r'```(\w+)?\n(.*?)```'
        matches = re.findall(pattern, text, re.DOTALL)
        
        for match in matches:
            language = match[0] or "python"
            code = match[1].strip()
            if code:
                code_blocks.append({"language": language, "code": code})
        
        return code_blocks
    
    def _execute_code(self, code: str, language: str) -> str:
        """Executa código usando CodeInterpreter (reutiliza 100% da lógica)"""
        original_cwd = os.getcwd()
        try:
            os.chdir(self.workdir)
            
            code_interpreter = self._get_code_interpreter(language)
            code_interpreter.code = code
            code_interpreter.language = language
            
            # Executar código (reutiliza 100% da lógica do OI)
            output = code_interpreter.run()
            
            return output
        finally:
            os.chdir(original_cwd)
    
    async def _generate_code(self, prompt: str) -> str:
        """
        Gera código usando model_client do AutoGen
        
        Args:
            prompt: Prompt do usuário
        
        Returns:
            Resposta do LLM com código
        """
        import asyncio
        
        # Preparar mensagens
        messages = self.messages.copy()
        
        # Adicionar system message se não estiver presente
        has_system = any(msg.get("role") == "system" for msg in messages)
        if not has_system:
            messages.insert(0, {"role": "system", "content": self.system_message})
        
        # Adicionar prompt do usuário
        messages.append({"role": "user", "content": prompt})
        
        # Chamar model_client do AutoGen
        try:
            if asyncio.iscoroutinefunction(self.model_client.create):
                response = await self.model_client.create(messages=messages)
            else:
                response = self.model_client.create(messages=messages)
            
            # Extrair conteúdo
            if hasattr(response, 'choices'):
                content = response.choices[0].message.content
            elif isinstance(response, dict):
                content = response.get("choices", [{}])[0].get("message", {}).get("content", "")
            else:
                content = str(response)
            
            return content
        except Exception as e:
            logger.error(f"Erro ao gerar código: {e}")
            raise
    
    async def _process_with_feedback_loop(self, prompt: str) -> str:
        """
        Processa prompt com loop de feedback e auto-correção
        
        Este é o coração da autonomia: gera código, executa, detecta erros,
        corrige automaticamente e repete até sucesso ou max_retries.
        """
        # Adicionar prompt às mensagens
        self.messages.append({"role": "user", "content": prompt})
        
        # Loop de feedback e auto-correção
        for attempt in range(self.max_retries + 1):
            try:
                # Gerar código usando model_client do AutoGen
                response = await self._generate_code(prompt if attempt == 0 else f"Erro anterior: {self.messages[-1].get('content', '')}. Corrija e tente novamente.")
                
                # Adicionar resposta às mensagens
                self.messages.append({"role": "assistant", "content": response})
                
                # Extrair blocos de código
                code_blocks = self._extract_code_blocks(response)
                
                if not code_blocks:
                    # Não há código para executar, retornar resposta
                    return response
                
                # Executar código (reutiliza 100% da lógica do OI)
                execution_results = []
                has_error = False
                
                for block in code_blocks:
                    language = block["language"]
                    code = block["code"]
                    
                    try:
                        output = self._execute_code(code, language)
                        execution_results.append({
                            "language": language,
                            "code": code,
                            "output": output,
                            "success": True
                        })
                    except Exception as e:
                        error_msg = str(e)
                        execution_results.append({
                            "language": language,
                            "code": code,
                            "output": error_msg,
                            "success": False
                        })
                        has_error = True
                
                # Adicionar resultados às mensagens
                for result in execution_results:
                    self.messages.append({
                        "role": "function",
                        "name": "run_code",
                        "content": f"Language: {result['language']}\nCode: {result['code']}\nOutput: {result['output']}\nSuccess: {result['success']}"
                    })
                
                # Se não houve erro, retornar resposta final
                if not has_error:
                    # Gerar resposta final com resultados
                    final_response = await self._generate_code("Código executado com sucesso. Forneça um resumo do que foi feito.")
                    self.messages.append({"role": "assistant", "content": final_response})
                    return final_response
                
                # Se houve erro e ainda há tentativas, continuar loop
                if attempt < self.max_retries:
                    logger.info(f"⚠️ Erro detectado, tentando corrigir (tentativa {attempt + 1}/{self.max_retries})")
                    continue
                else:
                    # Sem mais tentativas, retornar resposta com erro
                    error_response = await self._generate_code("Código executado com erros após múltiplas tentativas. Forneça um resumo dos erros encontrados.")
                    self.messages.append({"role": "assistant", "content": error_response})
                    return error_response
                    
            except Exception as e:
                logger.error(f"Erro no loop de feedback: {e}")
                if attempt < self.max_retries:
                    continue
                else:
                    return f"Erro após {self.max_retries + 1} tentativas: {str(e)}"
        
        return "Erro: não foi possível processar o prompt"
    
    async def process(self, prompt: str) -> str:
        """
        Processa prompt com autonomia completa
        
        Args:
            prompt: Prompt do usuário
        
        Returns:
            Resposta final do agente
        """
        return await self._process_with_feedback_loop(prompt)
    
    def reset(self):
        """Reseta o estado do OI"""
        self.messages = []
        self.code_interpreters = {}
```

---

## 🔌 Fase 3: Integrar com AutoGen Model Client

### 3.1 Criar Agente AutoGen que Usa OICore

**Arquivo:** `super_agent/agents/autonomous_interpreter_agent.py`

```python
"""
AutonomousInterpreterAgent - Agente AutoGen com núcleo OI integrado

Este agente combina:
- AutoGen (coordenação multi-agente)
- OI Core (execução autônoma e inteligente)
- Loop de feedback e auto-correção
- Autonomia total
"""
import os
import logging
from typing import Optional, Any

logger = logging.getLogger(__name__)

try:
    from autogen_agentchat.agents import AssistantAgent
    AUTOGEN_V2_AVAILABLE = True
except ImportError:
    AUTOGEN_V2_AVAILABLE = False
    logger.error("autogen-agentchat não está instalado")

try:
    from ..executors.oi_core import OICore
    OI_CORE_AVAILABLE = True
except ImportError:
    OI_CORE_AVAILABLE = False
    logger.error("OICore não disponível")


class AutonomousInterpreterAgent(AssistantAgent):
    """
    Agente AutoGen com núcleo OI integrado
    
    Características:
    - Herda funcionalidades do AutoGen (coordenação, histórico)
    - Usa OICore para execução autônoma (raciocina, executa, corrige)
    - Loop de feedback e auto-correção
    - Autonomia total
    """
    
    def __init__(
        self,
        name: str = "autonomous_interpreter",
        model_client: Optional[Any] = None,
        workdir: Optional[str] = None,
        auto_run: bool = True,
        max_retries: int = 3,
        **kwargs
    ):
        """
        Inicializa o agente autônomo
        
        Args:
            name: Nome do agente
            model_client: Cliente LLM do AutoGen
            workdir: Diretório de trabalho (sandbox)
            auto_run: Executar código automaticamente
            max_retries: Número máximo de tentativas de correção
            **kwargs: Argumentos adicionais para AssistantAgent
        """
        if not AUTOGEN_V2_AVAILABLE:
            raise ImportError("autogen-agentchat não está instalado")
        
        if not OI_CORE_AVAILABLE:
            raise ImportError("OICore não disponível")
        
        # Inicializar AssistantAgent
        super().__init__(
            name=name,
            model_client=model_client,
            system_message="You are an autonomous AI agent that can write and execute code. You have access to a code execution engine that can run Python, Shell, JavaScript, and other languages. Use it to solve tasks autonomously.",
            **kwargs
        )
        
        # Criar núcleo OI
        self.oi_core = OICore(
            model_client=model_client,
            workdir=workdir,
            auto_run=auto_run,
            max_retries=max_retries,
            debug_mode=False,
        )
        
        logger.info(f"✅ AutonomousInterpreterAgent inicializado")
        logger.info(f"   ✅ Núcleo OI integrado")
        logger.info(f"   ✅ Autonomia total ativada")
        logger.info(f"   ✅ Max retries: {max_retries}")
    
    async def process_message(self, message: str) -> str:
        """
        Processa mensagem com autonomia total
        
        Args:
            message: Mensagem do usuário
        
        Returns:
            Resposta do agente
        """
        # Processar usando OICore (autonomia total)
        response = await self.oi_core.process(message)
        
        return response
```

---

## 🔄 Fase 4: Conectar Loop de Feedback

### 4.1 Melhorar Loop de Feedback no OICore

**Adicionar ao `oi_core.py`:**

```python
def _analyze_execution_result(self, result: Dict[str, Any]) -> Dict[str, Any]:
    """
    Analisa resultado da execução e determina se precisa corrigir
    
    Args:
        result: Resultado da execução
    
    Returns:
        Análise do resultado (sucesso, erro, precisa correção)
    """
    if result["success"]:
        return {
            "needs_correction": False,
            "status": "success",
            "message": "Código executado com sucesso"
        }
    
    # Analisar erro
    error_output = result["output"]
    
    # Detectar tipos de erro comuns
    if "SyntaxError" in error_output:
        return {
            "needs_correction": True,
            "status": "syntax_error",
            "message": "Erro de sintaxe detectado",
            "error_type": "syntax"
        }
    elif "NameError" in error_output:
        return {
            "needs_correction": True,
            "status": "name_error",
            "message": "Variável ou função não definida",
            "error_type": "name"
        }
    elif "ImportError" in error_output:
        return {
            "needs_correction": True,
            "status": "import_error",
            "message": "Módulo não encontrado",
            "error_type": "import"
        }
    else:
        return {
            "needs_correction": True,
            "status": "unknown_error",
            "message": "Erro desconhecido",
            "error_type": "unknown"
        }

async def _correct_code(self, error_analysis: Dict[str, Any], code: str, language: str) -> str:
    """
    Corrige código com base na análise de erro
    
    Args:
        error_analysis: Análise do erro
        code: Código com erro
        language: Linguagem do código
    
    Returns:
        Código corrigido
    """
    error_type = error_analysis.get("error_type", "unknown")
    error_message = error_analysis.get("message", "")
    
    # Criar prompt para correção
    correction_prompt = f"""
O seguinte código {language} teve um erro:
Erro: {error_message}
Tipo: {error_type}

Código com erro:
```{language}
{code}
```

Por favor, corrija o código e forneça apenas o código corrigido em um bloco markdown.
"""
    
    # Gerar código corrigido
    corrected_response = await self._generate_code(correction_prompt)
    
    # Extrair código corrigido
    code_blocks = self._extract_code_blocks(corrected_response)
    if code_blocks:
        return code_blocks[0]["code"]
    
    return code  # Retornar código original se não conseguir corrigir
```

---

## 🧠 Fase 5: Adicionar Autonomia e Auto-Correção

### 5.1 Melhorar `_process_with_feedback_loop()` com Análise Inteligente

**Atualizar método no `oi_core.py`:**

```python
async def _process_with_feedback_loop(self, prompt: str) -> str:
    """
    Processa prompt com loop de feedback e auto-correção inteligente
    
    Melhorias:
    - Análise inteligente de erros
    - Correção automática baseada em tipo de erro
    - Aprendizado com tentativas anteriores
    - Detecção de loops infinitos
    """
    self.messages.append({"role": "user", "content": prompt})
    
    previous_errors = []  # Histórico de erros para detectar loops
    
    for attempt in range(self.max_retries + 1):
        try:
            # Gerar código
            if attempt == 0:
                response = await self._generate_code(prompt)
            else:
                # Criar prompt de correção com contexto
                error_context = "\n".join([f"- {e}" for e in previous_errors[-3:]])  # Últimos 3 erros
                correction_prompt = f"""
Erros anteriores encontrados:
{error_context}

Por favor, corrija o código e tente novamente. Analise os erros e forneça uma solução que os resolva.
"""
                response = await self._generate_code(correction_prompt)
            
            self.messages.append({"role": "assistant", "content": response})
            
            # Extrair blocos de código
            code_blocks = self._extract_code_blocks(response)
            
            if not code_blocks:
                return response
            
            # Executar código com análise inteligente
            execution_results = []
            has_error = False
            errors = []
            
            for block in code_blocks:
                language = block["language"]
                code = block["code"]
                
                try:
                    output = self._execute_code(code, language)
                    execution_results.append({
                        "language": language,
                        "code": code,
                        "output": output,
                        "success": True
                    })
                except Exception as e:
                    error_msg = str(e)
                    execution_results.append({
                        "language": language,
                        "code": code,
                        "output": error_msg,
                        "success": False
                    })
                    
                    # Analisar erro
                    error_analysis = self._analyze_execution_result(execution_results[-1])
                    errors.append({
                        "code": code,
                        "error": error_msg,
                        "analysis": error_analysis
                    })
                    has_error = True
            
            # Adicionar resultados às mensagens
            for result in execution_results:
                self.messages.append({
                    "role": "function",
                    "name": "run_code",
                    "content": f"Language: {result['language']}\nCode: {result['code']}\nOutput: {result['output']}\nSuccess: {result['success']}"
                })
            
            # Se não houve erro, retornar resposta final
            if not has_error:
                final_response = await self._generate_code("Código executado com sucesso. Forneça um resumo do que foi feito e os resultados obtidos.")
                self.messages.append({"role": "assistant", "content": final_response})
                return final_response
            
            # Se houve erro, adicionar ao histórico
            previous_errors.extend([e["error"] for e in errors])
            
            # Detectar loops infinitos (mesmos erros repetidos)
            if len(previous_errors) >= 3:
                last_3_errors = previous_errors[-3:]
                if len(set(last_3_errors)) == 1:  # Mesmo erro 3 vezes
                    logger.warning("⚠️ Loop infinito detectado: mesmo erro repetido 3 vezes")
                    return f"Erro: Loop infinito detectado. Não foi possível corrigir o código após {self.max_retries + 1} tentativas. Último erro: {last_3_errors[0]}"
            
            # Se ainda há tentativas, continuar loop
            if attempt < self.max_retries:
                logger.info(f"⚠️ Erro detectado, tentando corrigir (tentativa {attempt + 1}/{self.max_retries})")
                continue
            else:
                # Sem mais tentativas, retornar resposta com erro
                error_summary = "\n".join([f"- {e['error']}" for e in errors])
                error_response = await self._generate_code(f"Código executado com erros após {self.max_retries + 1} tentativas. Erros encontrados:\n{error_summary}\n\nForneça um resumo dos erros e sugestões para corrigi-los.")
                self.messages.append({"role": "assistant", "content": error_response})
                return error_response
                
        except Exception as e:
            logger.error(f"Erro no loop de feedback: {e}")
            if attempt < self.max_retries:
                continue
            else:
                return f"Erro após {self.max_retries + 1} tentativas: {str(e)}"
    
    return "Erro: não foi possível processar o prompt"
```

---

## ✅ Fase 6: Testes e Validação

### 6.1 Testes Unitários

**Arquivo:** `tests/test_oi_core.py`

```python
import pytest
from super_agent.executors.oi_core import OICore

@pytest.mark.asyncio
async def test_code_execution():
    """Testa execução de código Python"""
    # ... testes ...

@pytest.mark.asyncio
async def test_feedback_loop():
    """Testa loop de feedback e auto-correção"""
    # ... testes ...

@pytest.mark.asyncio
async def test_multiple_languages():
    """Testa suporte a múltiplas linguagens"""
    # ... testes ...
```

### 6.2 Testes de Integração

**Arquivo:** `tests/test_autonomous_agent.py`

```python
import pytest
from super_agent.agents.autonomous_interpreter_agent import AutonomousInterpreterAgent

@pytest.mark.asyncio
async def test_autonomous_execution():
    """Testa execução autônoma"""
    # ... testes ...

@pytest.mark.asyncio
async def test_auto_correction():
    """Testa auto-correção de erros"""
    # ... testes ...
```

---

## 🎯 Resultado Final

### Funcionalidades Implementadas

- ✅ **Reutilização completa** - 100% da lógica do OI
- ✅ **Autonomia total** - raciocina, executa e corrige sozinho
- ✅ **Loop de feedback** - detecta erros e corrige automaticamente
- ✅ **Análise inteligente** - analisa tipos de erro e corrige apropriadamente
- ✅ **Multi-linguagem** - Python, Shell, JavaScript, HTML, etc.
- ✅ **Zero overhead** - tudo no mesmo processo
- ✅ **Integração nativa** - herda funcionalidades do AutoGen

### Vantagens sobre Manus

- ✅ **Executor local autônomo** - não depende de ferramentas externas
- ✅ **Auto-correção** - corrige erros automaticamente
- ✅ **Inteligência local** - aprende com logs e contexto
- ✅ **Ciclo completo** - prompt → code → exec → retry (sem intervenção)
- ✅ **Zero overhead** - sem comunicação externa

---

## 📝 Checklist Final

### Fase 1: Copiar Módulos
- [ ] Copiar `code_interpreter.py`
- [ ] Copiar `code_block.py`
- [ ] Copiar `message_block.py`
- [ ] Copiar `utils.py`
- [ ] Copiar `system_message.txt`

### Fase 2: Adaptar Imports
- [ ] Criar `__init__.py`
- [ ] Adaptar imports em `code_interpreter.py`
- [ ] Adaptar imports em `code_block.py`
- [ ] Adaptar imports em `message_block.py`
- [ ] Criar `oi_core.py`

### Fase 3: Integrar com AutoGen
- [ ] Criar `AutonomousInterpreterAgent`
- [ ] Integrar `OICore` com `model_client` do AutoGen
- [ ] Testar geração de código

### Fase 4: Conectar Loop de Feedback
- [ ] Implementar `_analyze_execution_result()`
- [ ] Implementar `_correct_code()`
- [ ] Melhorar `_process_with_feedback_loop()`

### Fase 5: Adicionar Autonomia
- [ ] Detectar loops infinitos
- [ ] Análise inteligente de erros
- [ ] Auto-correção baseada em tipo de erro

### Fase 6: Testes
- [ ] Testes unitários
- [ ] Testes de integração
- [ ] Testes de performance

---

## 🚀 Próximos Passos

1. **Executar Fase 1** - Copiar módulos do OI
2. **Executar Fase 2** - Adaptar imports
3. **Executar Fase 3** - Integrar com AutoGen
4. **Executar Fase 4** - Conectar loop de feedback
5. **Executar Fase 5** - Adicionar autonomia
6. **Executar Fase 6** - Testes e validação

---

**Status: Roteiro completo criado. Pronto para implementação!** ✅

