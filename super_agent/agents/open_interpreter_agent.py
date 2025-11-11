"""
OpenInterpreterAgent - Agente Nativo do AutoGen v2
Encapsula o raciocínio + execução do Open Interpreter
Compartilha o mesmo modelo DeepSeek com o AutoGen
Executa código localmente sem overhead de WebSocket/JSON
"""
import os
import json
import re
import ast
import sys
import time
import logging
import platform
import subprocess
import webbrowser
import tempfile
import threading
import traceback
from typing import Dict, Any, Optional, List
from pathlib import Path

logger = logging.getLogger(__name__)

try:
    from autogen_agentchat.agents import AssistantAgent
    from autogen_ext.models.openai import OpenAIChatCompletionClient
    from autogen_ext.models.ollama import OllamaChatCompletionClient
    AUTOGEN_V2_AVAILABLE = True
except ImportError:
    AUTOGEN_V2_AVAILABLE = False
    logger.error("autogen-agentchat não está instalado. Execute: pip install autogen-agentchat autogen-ext[openai]")

# Importar adaptador Ollama (para usar mesmo modelo)
try:
    from interpreter.ollama_adapter import OllamaAdapter
    OLLAMA_ADAPTER_AVAILABLE = True
except ImportError:
    OLLAMA_ADAPTER_AVAILABLE = False
    logger.warning("OllamaAdapter não disponível. Criando adaptador simples.")
    
    # Criar adaptador simples se não disponível
    try:
        import requests
        class OllamaAdapter:
            def __init__(self, model: str = None, base_url: str = None):
                self.model = model or os.getenv("DEFAULT_MODEL", "deepseek-coder-v2-16b-q4_k_m-rtx")
                self.base_url = (base_url or os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")).rstrip("/")
                self.api_url = f"{self.base_url}/api"
            
            def chat_completion(self, messages: List[Dict[str, str]], **kwargs) -> Dict[str, Any]:
                ollama_messages = []
                system_message = None
                
                for msg in messages:
                    role = msg.get("role", "user")
                    content = msg.get("content", "")
                    if role == "system":
                        system_message = content
                    else:
                        ollama_messages.append({"role": role, "content": content})
                
                payload = {
                    "model": self.model,
                    "messages": ollama_messages,
                    "stream": False,
                    "options": {
                        "temperature": kwargs.get("temperature", 0.7),
                        "top_p": kwargs.get("top_p", 0.9),
                    }
                }
                
                if system_message:
                    payload["system"] = system_message
                
                response = requests.post(f"{self.api_url}/chat", json=payload, timeout=kwargs.get("timeout", 120))
                
                if response.status_code != 200:
                    raise Exception(f"Erro ao chamar Ollama: {response.text}")
                
                result = response.json()
                return {
                    "choices": [{
                        "message": {
                            "role": "assistant",
                            "content": result.get("message", {}).get("content", ""),
                        },
                        "finish_reason": "stop"
                    }],
                    "usage": {
                        "prompt_tokens": result.get("prompt_eval_count", 0),
                        "completion_tokens": result.get("eval_count", 0),
                        "total_tokens": result.get("prompt_eval_count", 0) + result.get("eval_count", 0)
                    }
                }
            
            def verify_connection(self) -> bool:
                try:
                    response = requests.get(f"{self.api_url}/tags", timeout=5)
                    return response.status_code == 200
                except:
                    return False
        
        OLLAMA_ADAPTER_AVAILABLE = True
    except ImportError:
        OLLAMA_ADAPTER_AVAILABLE = False
        logger.error("Ollama não disponível. Instale: pip install requests")


# Mapeamento de linguagens (igual ao Open Interpreter)
LANGUAGE_MAP = {
    "python": {
        "start_cmd": sys.executable + " -i -q -u",
        "print_cmd": 'print("{}")'
    },
    "shell": {
        "start_cmd": 'cmd.exe' if platform.system() == 'Windows' else os.environ.get('SHELL', 'bash'),
        "print_cmd": 'echo "{}"'
    },
    "javascript": {
        "start_cmd": "node -i",
        "print_cmd": 'console.log("{}")'
    },
    "html": {
        "open_subprocess": False,
    }
}


def run_html(html_content: str) -> str:
    """Executa código HTML abrindo no navegador"""
    with tempfile.NamedTemporaryFile(delete=False, suffix=".html") as f:
        f.write(html_content.encode())
    webbrowser.open('file://' + os.path.realpath(f.name))
    return f"Saved to {os.path.realpath(f.name)} and opened with the user's default web browser."


def wrap_in_try_except(code: str) -> str:
    """Envolve código Python em try-except para capturar erros"""
    code = "import traceback\n" + code
    parsed_code = ast.parse(code)
    
    try_except = ast.Try(
        body=parsed_code.body,
        handlers=[
            ast.ExceptHandler(
                type=ast.Name(id="Exception", ctx=ast.Load()),
                name=None,
                body=[
                    ast.Expr(
                        value=ast.Call(
                            func=ast.Attribute(value=ast.Name(id="traceback", ctx=ast.Load()), attr="print_exc", ctx=ast.Load()),
                            args=[],
                            keywords=[]
                        )
                    ),
                ]
            )
        ],
        orelse=[],
        finalbody=[]
    )
    
    parsed_code.body = [try_except]
    return ast.unparse(parsed_code)


def extract_code_blocks(text: str) -> List[Dict[str, str]]:
    """
    Extrai blocos de código de markdown da resposta do LLM
    
    Args:
        text: Texto com blocos de código markdown
    
    Returns:
        Lista de blocos de código [{"language": "python", "code": "..."}]
    """
    code_blocks = []
    
    # Padrão para blocos de código markdown: ```language\ncode\n```
    pattern = r'```(\w+)?\n(.*?)```'
    matches = re.findall(pattern, text, re.DOTALL)
    
    for match in matches:
        language = match[0] or "python"  # Default para Python
        code = match[1].strip()
        if code:
            code_blocks.append({"language": language, "code": code})
    
    return code_blocks


class OpenInterpreterAgent(AssistantAgent):
    """
    Agente Nativo do AutoGen v2 que encapsula o Open Interpreter
    
    Características:
    - Raciocina (via LLM) - mesmo modelo DeepSeek do AutoGen
    - Gera código
    - Executa código localmente
    - Analisa erros e reitera
    - Comunicação direta (sem WebSocket/JSON overhead)
    - Mesmo protocolo de mensagens do AutoGen
    """
    
    def __init__(
        self,
        name: str = "interpreter",
        model_client: Optional[Any] = None,
        workdir: Optional[str] = None,
        auto_run: bool = True,
        timeout: int = 60,
        system_message: Optional[str] = None,
    ):
        """
        Inicializa o OpenInterpreterAgent
        
        Args:
            name: Nome do agente
            model_client: Cliente LLM do AutoGen (compartilha mesmo modelo)
            workdir: Diretório de trabalho (sandbox)
            auto_run: Executar código automaticamente
            timeout: Timeout em segundos para execução
            system_message: Mensagem do sistema personalizada
        """
        if not AUTOGEN_V2_AVAILABLE:
            raise ImportError("autogen-agentchat não está instalado. Execute: pip install autogen-agentchat autogen-ext[openai]")
        
        # Usar model_client do AutoGen (mesmo modelo DeepSeek)
        if model_client is None:
            # Criar cliente LLM padrão (mesmo que o AutoGen usa)
            model = os.getenv("DEFAULT_MODEL", "deepseek-coder-v2-16b-q4_k_m-rtx")
            api_base = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
            api_base = api_base.rstrip("/").rstrip("/v1").rstrip("/api")
            api_url = f"{api_base}/v1"
            
            try:
                from autogen_ext.models.ollama import OllamaChatCompletionClient
                model_client = OllamaChatCompletionClient(
                    model=model,
                    base_url=api_base,
                )
            except ImportError:
                model_client = OpenAIChatCompletionClient(
                    model=f"ollama/{model}",
                    api_base=api_url,
                )
        
        # System message do Open Interpreter
        default_system_message = """You are Open Interpreter, a world-class programmer that can execute code on the user's machine.

First, write a plan. **Always recap the plan between each code block** (you have extreme short-term memory loss, so you need to the plan each time you write a new block).

When you execute code, it will be executed **on the user's machine**. The user has given you **full and complete permission** to execute any code necessary to complete the task.

You have access to the internet and can make API requests.

Write code to solve the task. You can use any language, but Python is preferred.

When a user refers to a filename, they're likely referring to an existing file in the directory you're currently in.

When you want to give the user a final answer, use the print function to output it.

IMPORTANT: Execute code automatically. Do not ask for permission.
When you generate code, always include the code in markdown code blocks (```language\ncode\n```).
After generating code, the system will automatically execute it and return the results."""
        
        # Inicializar AssistantAgent
        super().__init__(
            name=name,
            model_client=model_client,
            system_message=system_message or default_system_message,
        )
        
        # Configurações do Open Interpreter
        self.workdir = workdir or os.getcwd()
        self.auto_run = auto_run
        self.timeout = timeout
        
        # Criar workspace
        os.makedirs(self.workdir, exist_ok=True)
        
        # Cache de processos por linguagem
        self.code_interpreters = {}
        
        # Ollama adapter (para gerar código - mesmo modelo)
        self.ollama_adapter = None
        if OLLAMA_ADAPTER_AVAILABLE:
            # Obter modelo do model_client
            model_name = getattr(model_client, 'model', None) or os.getenv("DEFAULT_MODEL", "deepseek-coder-v2-16b-q4_k_m-rtx")
            # Remover prefixo "ollama/" se houver
            if model_name.startswith("ollama/"):
                model_name = model_name.replace("ollama/", "")
            
            self.ollama_adapter = OllamaAdapter(model=model_name)
            if not self.ollama_adapter.verify_connection():
                logger.warning("Ollama não está disponível. Execução de código pode falhar.")
        
        logger.info(f"✅ OpenInterpreterAgent inicializado")
        logger.info(f"   Nome: {name}")
        logger.info(f"   Workdir: {self.workdir}")
        logger.info(f"   Auto-run: {self.auto_run}")
        logger.info(f"   Modelo: {model_name if 'model_name' in locals() else 'padrão'}")
        logger.info(f"   ✅ Mesmo modelo DeepSeek do AutoGen (comunicação direta)")
    
    async def execute_code_task(self, task: str) -> Dict[str, Any]:
        """
        Processa tarefa, gera código e executa localmente
        
        Este método é chamado pelo AutoGen quando o agente recebe uma tarefa.
        Ele encapsula todo o ciclo do Open Interpreter: raciocínio → geração → execução → análise.
        
        Args:
            task: Tarefa em linguagem natural
        
        Returns:
            Dict com resultado da execução
        """
        try:
            # 1. Gerar código usando LLM (mesmo modelo do AutoGen)
            code_response = await self._generate_code(task)
            
            if not code_response.get("success"):
                return {
                    "success": False,
                    "output": "",
                    "error": code_response.get("error", "Erro ao gerar código"),
                    "code_executed": None,
                }
            
            # 2. Extrair blocos de código da resposta
            code_blocks = extract_code_blocks(code_response.get("response", ""))
            
            if not code_blocks:
                return {
                    "success": False,
                    "output": code_response.get("response", ""),
                    "error": "Nenhum bloco de código encontrado na resposta",
                    "code_executed": None,
                }
            
            # 3. Executar código localmente
            execution_results = []
            for block in code_blocks:
                language = block["language"]
                code = block["code"]
                
                result = self._execute_code(code, language)
                execution_results.append(result)
            
            # 4. Combinar resultados
            all_output = []
            all_errors = []
            all_code = []
            
            for result in execution_results:
                if result["success"]:
                    all_output.append(result.get("output", ""))
                    all_code.append(result.get("code", ""))
                else:
                    all_errors.append(result.get("error", "Erro desconhecido"))
                    all_code.append(result.get("code", ""))
            
            # 5. Retornar resultado estruturado
            return {
                "success": len(all_errors) == 0,
                "output": "\n".join(all_output) if all_output else "",
                "error": "\n".join(all_errors) if all_errors else None,
                "code_executed": "\n\n".join(all_code) if all_code else None,
                "code_blocks": code_blocks,
                "execution_results": execution_results,
            }
        
        except Exception as e:
            error_msg = str(e)
            logger.error(f"❌ Erro ao executar tarefa: {error_msg}")
            return {
                "success": False,
                "output": "",
                "error": error_msg,
                "code_executed": None,
                "traceback": traceback.format_exc(),
            }
    
    async def _generate_code(self, task: str) -> Dict[str, Any]:
        """
        Gera código usando LLM (mesmo modelo do AutoGen)
        
        Args:
            task: Tarefa em linguagem natural
        
        Returns:
            Dict com resposta do LLM
        """
        try:
            # Preparar prompt
            prompt = f"""Você é o Open Interpreter. Gere código para completar a seguinte tarefa:

{task}

IMPORTANTE:
- Gere código válido e funcional
- Use markdown code blocks (```language\ncode\n```)
- Se a tarefa for complexa, quebre em múltiplos blocos de código
- Sempre inclua código, não apenas explicações
"""
            
            # Usar model_client do AutoGen (mesmo modelo DeepSeek)
            # AutoGen v2 usa formato de mensagens
            messages = [
                {"role": "system", "content": self.system_message},
                {"role": "user", "content": prompt}
            ]
            
            # Chamar LLM via model_client
            # AutoGen v2 model_client tem método create ou similar
            if hasattr(self.model_client, 'create'):
                response = await self.model_client.create(messages)
            elif hasattr(self.model_client, 'chat'):
                response = await self.model_client.chat(messages)
            else:
                # Fallback: usar Ollama adapter diretamente
                if self.ollama_adapter:
                    response = self.ollama_adapter.chat_completion(messages, temperature=0.7)
                else:
                    raise Exception("Model client não suportado e Ollama adapter não disponível")
            
            # Extrair resposta
            if isinstance(response, dict):
                if "choices" in response:
                    content = response["choices"][0]["message"]["content"]
                elif "message" in response:
                    content = response["message"].get("content", "")
                else:
                    content = str(response)
            else:
                content = str(response)
            
            return {
                "success": True,
                "response": content,
            }
        
        except Exception as e:
            error_msg = str(e)
            logger.error(f"❌ Erro ao gerar código: {error_msg}")
            return {
                "success": False,
                "error": error_msg,
                "response": "",
            }
    
    def _execute_code(self, code: str, language: str) -> Dict[str, Any]:
        """
        Executa código em uma linguagem específica
        
        Args:
            code: Código a executar
            language: Linguagem do código
        
        Returns:
            Dict com resultado da execução
        """
        try:
            # Validar linguagem
            if language not in LANGUAGE_MAP:
                return {
                    "success": False,
                    "output": "",
                    "error": f"Linguagem não suportada: {language}",
                    "language": language,
                    "code": code,
                }
            
            # HTML: tratamento especial
            if language == "html":
                result = run_html(code)
                return {
                    "success": True,
                    "output": result,
                    "error": None,
                    "language": language,
                    "code": code,
                }
            
            # Python: envolver em try-except
            if language == "python":
                code = wrap_in_try_except(code)
            
            # Executar via subprocess
            return self._execute_subprocess(code, language)
        
        except Exception as e:
            return {
                "success": False,
                "output": "",
                "error": str(e),
                "language": language,
                "code": code,
                "traceback": traceback.format_exc(),
            }
    
    def _execute_subprocess(self, code: str, language: str) -> Dict[str, Any]:
        """Executa código usando subprocess (igual ao Open Interpreter)"""
        try:
            lang_config = LANGUAGE_MAP[language]
            start_cmd = lang_config["start_cmd"]
            
            if language == "python":
                # Python: modo interativo
                process = subprocess.Popen(
                    start_cmd.split(),
                    stdin=subprocess.PIPE,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    text=True,
                    cwd=self.workdir,
                    bufsize=0,
                )
                
                # Adicionar comando de fim
                code += "\nprint('END_OF_EXECUTION')"
                
                stdout, stderr = process.communicate(input=code, timeout=self.timeout)
                
                # Limpar output (remover END_OF_EXECUTION e prompts do REPL)
                stdout = stdout.replace("END_OF_EXECUTION", "").strip()
                stdout = re.sub(r'^(\s*>>>\s*|\s*\.\.\.\s*)', '', stdout, flags=re.MULTILINE)
                
                return {
                    "success": process.returncode == 0,
                    "output": stdout,
                    "error": stderr if process.returncode != 0 else None,
                    "language": language,
                    "code": code,
                }
            
            elif language == "shell":
                # Shell: executar comando
                if platform.system() == 'Windows':
                    process = subprocess.Popen(
                        ["cmd.exe", "/c", code],
                        stdout=subprocess.PIPE,
                        stderr=subprocess.PIPE,
                        text=True,
                        cwd=self.workdir,
                    )
                else:
                    shell = os.environ.get('SHELL', 'bash')
                    process = subprocess.Popen(
                        [shell, "-c", code],
                        stdout=subprocess.PIPE,
                        stderr=subprocess.PIPE,
                        text=True,
                        cwd=self.workdir,
                    )
                
                stdout, stderr = process.communicate(timeout=self.timeout)
                
                return {
                    "success": process.returncode == 0,
                    "output": stdout,
                    "error": stderr if process.returncode != 0 else None,
                    "language": language,
                    "code": code,
                }
            
            else:
                # Outras linguagens
                process = subprocess.Popen(
                    start_cmd.split() + ["-e", code] if language == "javascript" else [code],
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    text=True,
                    cwd=self.workdir,
                )
                
                stdout, stderr = process.communicate(timeout=self.timeout)
                
                return {
                    "success": process.returncode == 0,
                    "output": stdout,
                    "error": stderr if process.returncode != 0 else None,
                    "language": language,
                    "code": code,
                }
        
        except subprocess.TimeoutExpired:
            process.kill()
            return {
                "success": False,
                "output": "",
                "error": f"Timeout após {self.timeout}s",
                "language": language,
                "code": code,
            }
        
        except Exception as e:
            return {
                "success": False,
                "output": "",
                "error": str(e),
                "language": language,
                "code": code,
                "traceback": traceback.format_exc(),
            }


def create_open_interpreter_agent(
    model_client: Optional[Any] = None,
    workdir: Optional[str] = None,
    auto_run: bool = True,
    name: str = "interpreter",
) -> OpenInterpreterAgent:
    """
    Cria um OpenInterpreterAgent para uso no AutoGen
    
    Args:
        model_client: Cliente LLM do AutoGen (compartilha mesmo modelo)
        workdir: Diretório de trabalho (sandbox)
        auto_run: Executar código automaticamente
        name: Nome do agente
    
    Returns:
        OpenInterpreterAgent configurado
    """
    return OpenInterpreterAgent(
        name=name,
        model_client=model_client,
        workdir=workdir,
        auto_run=auto_run,
    )

