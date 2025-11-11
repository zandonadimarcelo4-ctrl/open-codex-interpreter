"""
Tool do Interpretador Nativo para AutoGen
Usa NativeInterpreter (reimplementação completa do Open Interpreter)
SEM dependência do projeto Open Interpreter externo
"""
import os
import logging
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

try:
    from ..executors.native_interpreter import NativeInterpreter
    from ..protocol.communication_protocol import (
        CommunicationProtocol,
        CommandMessage,
        ResultMessage,
        create_command_from_task,
    )
    NATIVE_INTERPRETER_AVAILABLE = True
except ImportError:
    NATIVE_INTERPRETER_AVAILABLE = False
    logger.warning("NativeInterpreter não disponível")


def create_native_interpreter_tool(
    model: Optional[str] = None,
    workspace: Optional[str] = None,
    auto_run: bool = True,
    session_id: Optional[str] = None,
    enable_logging: bool = True,
) -> Dict[str, Any]:
    """
    Cria uma tool do Interpretador Nativo para AutoGen
    
    Esta tool reimplementa completamente o Open Interpreter:
    - Gera código usando LLM (Ollama)
    - Executa código real via subprocess
    - Suporta Python, Shell, JavaScript, HTML, etc.
    - SEM dependência do projeto Open Interpreter externo
    
    Args:
        model: Modelo Ollama a usar
        workspace: Diretório de trabalho (sandbox)
        auto_run: Executar código automaticamente
        session_id: ID da sessão (para logs)
        enable_logging: Se True, registra logs de comunicação
    
    Returns:
        Dict com schema da tool para AutoGen
    """
    if not NATIVE_INTERPRETER_AVAILABLE:
        raise ImportError("NativeInterpreter não disponível")
    
    # Inicializar protocolo de comunicação
    protocol = CommunicationProtocol(
        session_id=session_id,
        enable_logging=enable_logging,
    )
    
    # Inicializar interpretador nativo
    interpreter = NativeInterpreter(
        model=model or os.getenv("DEFAULT_MODEL", "deepseek-coder-v2-16b-q4_k_m-rtx"),
        workspace=workspace or os.getcwd(),
        auto_run=auto_run,
    )
    
    logger.info(f"✅ NativeInterpreter Tool criada")
    logger.info(f"   Modelo: {interpreter.model}")
    logger.info(f"   Workspace: {interpreter.workspace}")
    logger.info(f"   Auto-run: {auto_run}")
    
    # Função wrapper para AutoGen
    def tool_function(task: str) -> str:
        """
        Função chamada pelo AutoGen
        
        Args:
            task: Tarefa em linguagem natural
        
        Returns:
            Resposta em formato JSON estruturado
        """
        try:
            # Executar tarefa no interpretador nativo
            result = interpreter.chat(task)
            
            # Criar resultado estruturado
            if result["success"]:
                # Combinar output de todos os resultados
                output = result["output"]
                code_executed = "\n\n".join([
                    f"```{r['language']}\n{r['code']}\n```"
                    for r in result.get("code_blocks", [])
                ])
                
                errors = [
                    r["error"] for r in result.get("execution_results", [])
                    if not r.get("success", False) and r.get("error")
                ]
                
                result_message = protocol.create_result(
                    success=True,
                    output=output,
                    code_executed=code_executed if code_executed else None,
                    errors=errors if errors else None,
                    metadata={
                        "code_blocks_count": len(result.get("code_blocks", [])),
                        "execution_results_count": len(result.get("execution_results", [])),
                    },
                )
            else:
                result_message = protocol.create_result(
                    success=False,
                    output="",
                    errors=[result.get("error", "Erro desconhecido")],
                )
            
            # Retornar JSON estruturado
            return result_message.to_json()
        
        except Exception as e:
            # Retornar erro em formato JSON
            error_result = ResultMessage(
                success=False,
                output="",
                errors=[str(e)],
            )
            return error_result.to_json()
    
    # Schema da tool para AutoGen
    return {
        "type": "function",
        "function": {
            "name": "native_code_interpreter",
            "description": (
                "Interpretador de código nativo que gera e executa código localmente. "
                "Reimplementa completamente o Open Interpreter SEM dependência externa. "
                "Use esta tool quando precisar: executar código, criar scripts, processar dados, etc. "
                "A tool gera código usando LLM (Ollama) e executa código real via subprocess. "
                "Suporta Python, Shell, JavaScript, HTML, etc. "
                "Retorna resultados em formato JSON estruturado com 'success', 'output', 'code_executed', 'errors'."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "task": {
                        "type": "string",
                        "description": (
                            "Tarefa em linguagem natural. "
                            "Exemplos: 'Crie um script Python que soma 5 + 7', "
                            "'Execute ls -la no diretório atual', "
                            "'Analise o arquivo data.csv e gere um relatório'"
                        ),
                    },
                },
                "required": ["task"],
            },
        },
        "func": tool_function,
    }

