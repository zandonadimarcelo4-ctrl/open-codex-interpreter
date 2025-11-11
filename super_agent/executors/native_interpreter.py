"""
Interpretador de Código Nativo para AutoGen
Reimplementa completamente a funcionalidade do Open Interpreter
SEM dependência do projeto Open Interpreter externo
Mantém 100% das capacidades: gera código com LLM e executa código real
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
from dataclasses import dataclass

logger = logging.getLogger(__name__)

# Importar adaptador Ollama (copiado do Open Interpreter)
try:
    from interpreter.ollama_adapter import OllamaAdapter
    OLLAMA_AVAILABLE = True
except ImportError:
    # Se não disponível, criar adaptador simples
    try:
        import requests
        OLLAMA_AVAILABLE = True
        
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
    except ImportError:
        OLLAMA_AVAILABLE = False
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


class NativeInterpreter:
    """
    Interpretador de código nativo para AutoGen
    Reimplementa completamente o Open Interpreter:
    - Gera código usando LLM (Ollama)
    - Executa código real via subprocess
    - Suporta Python, Shell, JavaScript, HTML, etc.
    - Sem dependência do projeto Open Interpreter externo
    """
    
    def __init__(
        self,
        model: Optional[str] = None,
        workspace: Optional[str] = None,
        auto_run: bool = True,
        timeout: int = 60,
    ):
        """
        Inicializa o interpretador nativo
        
        Args:
            model: Modelo Ollama a usar
            workspace: Diretório de trabalho (sandbox)
            auto_run: Executar código automaticamente
            timeout: Timeout em segundos para execução
        """
        if not OLLAMA_AVAILABLE:
            raise ImportError("Ollama não disponível. Instale: pip install requests")
        
        self.model = model or os.getenv("DEFAULT_MODEL", "deepseek-coder-v2-16b-q4_k_m-rtx")
        self.workspace = workspace or os.getcwd()
        self.auto_run = auto_run
        self.timeout = timeout
        
        # Inicializar Ollama
        self.ollama_adapter = OllamaAdapter(model=self.model)
        if not self.ollama_adapter.verify_connection():
            raise Exception("Ollama não está disponível. Certifique-se de que Ollama está rodando.")
        
        # Criar workspace
        os.makedirs(self.workspace, exist_ok=True)
        
        # Mensagens de contexto
        self.messages = []
        
        # System message (similar ao Open Interpreter)
        self.system_message = """You are Open Interpreter, a world-class programmer that can execute code on the user's machine.

First, write a plan. **Always recap the plan between each code block** (you have extreme short-term memory loss, so you need to the plan each time you write a new block).

When you execute code, it will be executed **on the user's machine**. The user has given you **full and complete permission** to execute any code necessary to complete the task.

You have access to the internet and can make API requests.

Write code to solve the task. You can use any language, but Python is preferred.

When a user refers to a filename, they're likely referring to an existing file in the directory you're currently in.

When you want to give the user a final answer, use the print function to output it.

IMPORTANT: Execute code automatically. Do not ask for permission."""
        
        logger.info(f"✅ NativeInterpreter inicializado")
        logger.info(f"   Modelo: {self.model}")
        logger.info(f"   Workspace: {self.workspace}")
        logger.info(f"   Auto-run: {self.auto_run}")
    
    def chat(self, message: str) -> Dict[str, Any]:
        """
        Envia mensagem ao interpretador e retorna resultado
        
        Args:
            message: Mensagem/prompt do usuário
        
        Returns:
            Dict com resultado da execução
        """
        # Adicionar mensagem do usuário
        self.messages.append({"role": "user", "content": message})
        
        # Preparar mensagens para o LLM (incluindo system message)
        llm_messages = [{"role": "system", "content": self.system_message}] + self.messages
        
        # Chamar Ollama para gerar código
        try:
            response = self.ollama_adapter.chat_completion(
                messages=llm_messages,
                temperature=0.7,
                timeout=self.timeout * 2,  # Timeout maior para LLM
            )
            
            assistant_message = response["choices"][0]["message"]["content"]
            
            # Adicionar resposta do assistente
            self.messages.append({"role": "assistant", "content": assistant_message})
            
            # Extrair blocos de código da resposta
            code_blocks = extract_code_blocks(assistant_message)
            
            # Executar código se auto_run=True
            execution_results = []
            if self.auto_run and code_blocks:
                for block in code_blocks:
                    language = block["language"]
                    code = block["code"]
                    
                    # Executar código
                    result = self._execute_code(code, language)
                    execution_results.append(result)
            
            # Construir resultado
            return {
                "success": True,
                "response": assistant_message,
                "code_blocks": code_blocks,
                "execution_results": execution_results,
                "output": self._format_output(assistant_message, execution_results),
            }
        
        except Exception as e:
            error_msg = str(e)
            logger.error(f"❌ Erro ao processar mensagem: {error_msg}")
            return {
                "success": False,
                "response": "",
                "code_blocks": [],
                "execution_results": [],
                "output": "",
                "error": error_msg,
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
        """Executa código usando subprocess"""
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
                    cwd=self.workspace,
                    bufsize=0,
                )
                
                # Adicionar comando de fim
                code += "\nprint('END_OF_EXECUTION')"
                
                stdout, stderr = process.communicate(input=code, timeout=self.timeout)
                
                # Limpar output (remover END_OF_EXECUTION)
                stdout = stdout.replace("END_OF_EXECUTION", "").strip()
                
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
                        cwd=self.workspace,
                    )
                else:
                    shell = os.environ.get('SHELL', 'bash')
                    process = subprocess.Popen(
                        [shell, "-c", code],
                        stdout=subprocess.PIPE,
                        stderr=subprocess.PIPE,
                        text=True,
                        cwd=self.workspace,
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
                    cwd=self.workspace,
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
    
    def _format_output(self, response: str, execution_results: List[Dict[str, Any]]) -> str:
        """Formata saída combinando resposta do LLM e resultados de execução"""
        output = response
        
        # Adicionar resultados de execução
        if execution_results:
            output += "\n\n--- Resultados de Execução ---\n"
            for i, result in enumerate(execution_results, 1):
                if result["success"]:
                    output += f"\n✅ Código {i} ({result['language']}):\n{result['output']}\n"
                else:
                    output += f"\n❌ Código {i} ({result['language']}):\nErro: {result['error']}\n"
        
        return output
    
    def reset(self):
        """Reseta o estado do interpretador"""
        self.messages = []

