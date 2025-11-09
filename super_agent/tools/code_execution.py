"""
Code Execution Tool - Integração com Open Interpreter
Ferramenta AutoGen para execução de código
"""
from __future__ import annotations

import logging
from pathlib import Path
from typing import Any, Dict

logger = logging.getLogger(__name__)


class CodeExecutionTool:
    """
    Ferramenta de execução de código usando Open Interpreter
    Compatível com AutoGen function calling
    """
    
    def __init__(self, workspace: Path):
        self.workspace = Path(workspace)
        self.interpreter = None
        self._initialize_interpreter()
    
    def _initialize_interpreter(self):
        """Inicializar Open Interpreter"""
        try:
            import interpreter
            self.interpreter = interpreter.Interpreter()
            self.interpreter.auto_run = True
            self.interpreter.workspace = str(self.workspace)
            logger.info("Open Interpreter inicializado")
        except ImportError:
            logger.warning("Open Interpreter não disponível")
        except Exception as e:
            logger.warning(f"Falha ao inicializar Open Interpreter: {e}")
    
    def get_function_schema(self) -> Dict[str, Any]:
        """Obter schema da função para AutoGen"""
        return {
            "name": "code_execution",
            "description": "Executa código Python, JavaScript, Shell, etc. localmente",
            "parameters": {
                "type": "object",
                "properties": {
                    "language": {
                        "type": "string",
                        "enum": ["python", "javascript", "shell", "html"],
                        "description": "Linguagem de programação"
                    },
                    "code": {
                        "type": "string",
                        "description": "Código a executar"
                    }
                },
                "required": ["language", "code"]
            }
        }
    
    async def execute(self, language: str, code: str) -> Dict[str, Any]:
        """
        Executar código
        
        Args:
            language: Linguagem de programação
            code: Código a executar
        
        Returns:
            Resultado da execução
        """
        if not self.interpreter:
            return {
                "success": False,
                "error": "Open Interpreter não disponível"
            }
        
        try:
            # Executar código usando Open Interpreter
            result = self.interpreter.chat(
                f"Execute este código {language}:\n```{language}\n{code}\n```"
            )
            
            return {
                "success": True,
                "language": language,
                "result": str(result),
            }
        except Exception as e:
            logger.error(f"Erro ao executar código: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def get_status(self) -> Dict[str, Any]:
        """Obter status da ferramenta"""
        return {
            "enabled": self.interpreter is not None,
            "workspace": str(self.workspace),
        }
    
    async def cleanup(self):
        """Limpar recursos"""
        self.interpreter = None

