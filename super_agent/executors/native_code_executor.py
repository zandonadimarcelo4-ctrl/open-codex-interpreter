"""
Executor de Código Nativo para AutoGen
Reimplementa a funcionalidade do Open Interpreter dentro do AutoGen
Mantém 100% das capacidades de execução real de código
"""
import subprocess
import webbrowser
import tempfile
import threading
import traceback
import platform
import time
import ast
import astor
import sys
import os
import re
import logging
from typing import Dict, Any, Optional, List
from pathlib import Path

logger = logging.getLogger(__name__)

# Mapeamento de linguagens para comandos de execução
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
    "applescript": {
        "start_cmd": os.environ.get('SHELL', '/bin/zsh'),
        "print_cmd": 'log "{}"'
    },
    "html": {
        "open_subprocess": False,
        "run_function": lambda content: run_html(content),
    }
}


def run_html(html_content: str) -> str:
    """Executa código HTML abrindo no navegador"""
    with tempfile.NamedTemporaryFile(delete=False, suffix=".html") as f:
        f.write(html_content.encode())
    
    webbrowser.open('file://' + os.path.realpath(f.name))
    return f"Saved to {os.path.realpath(f.name)} and opened with the user's default web browser."


class NativeCodeExecutor:
    """
    Executor de código nativo para AutoGen
    Reimplementa a funcionalidade do Open Interpreter
    Mantém 100% das capacidades de execução real
    """
    
    def __init__(self, workspace: Optional[str] = None, timeout: int = 60):
        """
        Inicializa o executor de código nativo
        
        Args:
            workspace: Diretório de trabalho (sandbox)
            timeout: Timeout em segundos para execução de código
        """
        self.workspace = workspace or os.getcwd()
        self.timeout = timeout
        self.code_interpreters = {}  # Cache de interpretadores por linguagem
        
        # Criar workspace se não existir
        os.makedirs(self.workspace, exist_ok=True)
        
        logger.info(f"✅ NativeCodeExecutor inicializado")
        logger.info(f"   Workspace: {self.workspace}")
        logger.info(f"   Timeout: {self.timeout}s")
    
    def execute_code(
        self,
        code: str,
        language: str = "python",
        timeout: Optional[int] = None,
    ) -> Dict[str, Any]:
        """
        Executa código em uma linguagem específica
        
        Args:
            code: Código a executar
            language: Linguagem do código (python, shell, javascript, etc.)
            timeout: Timeout em segundos (usa self.timeout se não especificado)
        
        Returns:
            Dict com resultado da execução
        """
        timeout = timeout or self.timeout
        
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
            
            # Executar código
            if language == "html":
                # HTML é tratado de forma especial
                result = LANGUAGE_MAP[language]["run_function"](code)
                return {
                    "success": True,
                    "output": result,
                    "error": None,
                    "language": language,
                    "code": code,
                }
            
            # Outras linguagens: usar subprocess
            result = self._execute_subprocess(code, language, timeout)
            return result
        
        except Exception as e:
            error_msg = str(e)
            logger.error(f"❌ Erro ao executar código: {error_msg}")
            return {
                "success": False,
                "output": "",
                "error": error_msg,
                "language": language,
                "code": code,
                "traceback": traceback.format_exc(),
            }
    
    def _execute_subprocess(
        self,
        code: str,
        language: str,
        timeout: int,
    ) -> Dict[str, Any]:
        """
        Executa código usando subprocess
        
        Args:
            code: Código a executar
            language: Linguagem do código
            timeout: Timeout em segundos
        
        Returns:
            Dict com resultado da execução
        """
        try:
            # Obter comando de inicialização
            lang_config = LANGUAGE_MAP[language]
            start_cmd = lang_config["start_cmd"]
            
            # Executar código
            if language == "python":
                # Python: executar código diretamente
                process = subprocess.Popen(
                    start_cmd.split(),
                    stdin=subprocess.PIPE,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    text=True,
                    cwd=self.workspace,
                    bufsize=0,
                )
                
                # Enviar código e fechar stdin
                stdout, stderr = process.communicate(input=code, timeout=timeout)
                
                # Verificar resultado
                return_code = process.returncode
                
                if return_code == 0:
                    return {
                        "success": True,
                        "output": stdout,
                        "error": None,
                        "language": language,
                        "code": code,
                    }
                else:
                    return {
                        "success": False,
                        "output": stdout,
                        "error": stderr,
                        "language": language,
                        "code": code,
                    }
            
            elif language == "shell":
                # Shell: executar comando
                if platform.system() == 'Windows':
                    # Windows: usar cmd.exe
                    process = subprocess.Popen(
                        ["cmd.exe", "/c", code],
                        stdout=subprocess.PIPE,
                        stderr=subprocess.PIPE,
                        text=True,
                        cwd=self.workspace,
                    )
                else:
                    # Unix: usar shell padrão
                    shell = os.environ.get('SHELL', 'bash')
                    process = subprocess.Popen(
                        [shell, "-c", code],
                        stdout=subprocess.PIPE,
                        stderr=subprocess.PIPE,
                        text=True,
                        cwd=self.workspace,
                    )
                
                # Aguardar resultado
                stdout, stderr = process.communicate(timeout=timeout)
                return_code = process.returncode
                
                if return_code == 0:
                    return {
                        "success": True,
                        "output": stdout,
                        "error": None,
                        "language": language,
                        "code": code,
                    }
                else:
                    return {
                        "success": False,
                        "output": stdout,
                        "error": stderr,
                        "language": language,
                        "code": code,
                    }
            
            else:
                # Outras linguagens: tentar executar
                process = subprocess.Popen(
                    start_cmd.split() + [code],
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    text=True,
                    cwd=self.workspace,
                )
                
                stdout, stderr = process.communicate(timeout=timeout)
                return_code = process.returncode
                
                if return_code == 0:
                    return {
                        "success": True,
                        "output": stdout,
                        "error": None,
                        "language": language,
                        "code": code,
                    }
                else:
                    return {
                        "success": False,
                        "output": stdout,
                        "error": stderr,
                        "language": language,
                        "code": code,
                    }
        
        except subprocess.TimeoutExpired:
            process.kill()
            return {
                "success": False,
                "output": "",
                "error": f"Timeout após {timeout}s",
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
    
    def execute_multiple(
        self,
        code_blocks: List[Dict[str, str]],
        timeout: Optional[int] = None,
    ) -> List[Dict[str, Any]]:
        """
        Executa múltiplos blocos de código
        
        Args:
            code_blocks: Lista de blocos de código [{"language": "python", "code": "..."}]
            timeout: Timeout em segundos por bloco
        
        Returns:
            Lista de resultados
        """
        results = []
        
        for block in code_blocks:
            language = block.get("language", "python")
            code = block.get("code", "")
            
            result = self.execute_code(code, language, timeout)
            results.append(result)
        
        return results

