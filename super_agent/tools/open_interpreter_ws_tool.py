"""
Open Interpreter WebSocket Tool para AutoGen v2
Tool que envia comandos ao Open Interpreter via WebSocket
O Open Interpreter pensa e executa localmente usando seu modelo interno (Ollama)
AutoGen comanda QUANDO e PORQUÊ; Open Interpreter decide COMO
"""
import os
import json
import asyncio
import logging
from typing import Dict, Any, Optional
from dotenv import load_dotenv

# Carregar variáveis de ambiente
load_dotenv()

logger = logging.getLogger(__name__)

# Configurações
OI_WS_URL = os.getenv("OI_WS_URL", "ws://localhost:4000")
WORKDIR = os.getenv("WORKDIR", os.getcwd())

try:
    import websockets
    from websockets.exceptions import ConnectionClosed
    WEBSOCKETS_AVAILABLE = True
except ImportError:
    WEBSOCKETS_AVAILABLE = False
    logger.warning("websockets não disponível. Use: pip install websockets")

# Contrato do sistema para o Open Interpreter (subordinado ao AutoGen)
SYSTEM_CONTRACT = f"""
You are the Open Interpreter subordinate agent.

- Obey Commander (AutoGen) precisely.
- Stay inside WORKDIR: {WORKDIR}
- For destructive actions (delete/move/overwrite):
  1) Print a clear plan.
  2) Wait for a follow-up message containing ONLY: CONFIRM
- Always show the code before executing.
- Be concise with logs and end with a summary.
- Think and execute locally using your internal LLM.
- Generate code, debug, and execute autonomously within the command scope.
"""


async def _send_to_oi(
    order: str,
    temperature: float = 0.2,
    max_tokens: int = 2048,
    workdir: Optional[str] = None,
) -> str:
    """
    Envia comando ao Open Interpreter via WebSocket.
    
    O Open Interpreter pensa e executa localmente usando seu modelo interno.
    
    Args:
        order: Comando/tarefa em linguagem natural
        temperature: Temperatura para o modelo (opcional)
        max_tokens: Máximo de tokens (opcional)
        workdir: Diretório de trabalho (opcional, usa WORKDIR se não fornecido)
    
    Returns:
        Output do Open Interpreter (pensamento + execução)
    """
    if not WEBSOCKETS_AVAILABLE:
        raise ImportError("websockets não está disponível. Instale: pip install websockets")
    
    # Preparar payload
    payload = {
        "type": "prompt",  # Tipo: prompt (comando em linguagem natural)
        "prompt": f"{SYSTEM_CONTRACT}\n\n[COMMANDER ORDER]\n{order}",
        "temperature": temperature,
        "max_tokens": max_tokens,
        "workdir": workdir or WORKDIR,
    }
    
    output = ""
    response_text = ""
    code_executed = ""
    
    try:
        async with websockets.connect(OI_WS_URL) as ws:
            # Enviar comando
            await ws.send(json.dumps(payload))
            
            # Receber respostas (pode vir em múltiplas mensagens)
            async for msg in ws:
                try:
                    data = json.loads(msg)
                    
                    if data.get("type") == "status":
                        status_msg = data.get("message", "")
                        logger.info(f"📡 Open Interpreter: {status_msg}")
                        print(f"💬 {status_msg}")
                    
                    elif data.get("type") == "response":
                        # Resposta completa do Open Interpreter
                        response_text = data.get("response", "")
                        output = data.get("output", "")
                        code_executed = data.get("code_executed", "")
                        
                        # Exibir output se houver
                        if output:
                            logger.info(f"📊 Output: {output}")
                            print(f"📊 Output:\n{output}")
                    
                    elif data.get("type") == "done":
                        # Concluído
                        break
                    
                    elif data.get("type") == "error":
                        error = data.get("error", "Erro desconhecido")
                        logger.error(f"❌ Erro: {error}")
                        raise Exception(f"Open Interpreter error: {error}")
                
                except json.JSONDecodeError:
                    logger.warning(f"Mensagem inválida recebida: {msg}")
                    continue
        
        # Combinar resposta e output
        if output:
            return f"✅ Open Interpreter executou:\n\n💭 Pensamento: {response_text}\n\n📊 Output:\n{output}"
        else:
            return f"✅ Open Interpreter respondeu:\n\n💭 {response_text}"
    
    except ConnectionClosed:
        error_msg = f"Conexão WebSocket fechada. Verifique se o servidor Open Interpreter está rodando em {OI_WS_URL}"
        logger.error(error_msg)
        raise Exception(error_msg)
    except Exception as e:
        error_msg = f"Erro ao comunicar com Open Interpreter: {e}"
        logger.error(error_msg)
        raise Exception(error_msg)


def register_open_interpreter_tool():
    """
    Registra a tool do Open Interpreter para AutoGen v2.
    
    Returns:
        Lista de tools para AutoGen v2
    """
    if not WEBSOCKETS_AVAILABLE:
        logger.warning("websockets não disponível. Tool do Open Interpreter não será registrada.")
        return []
    
    return [{
        "name": "open_interpreter_agent",
        "description": (
            "Envia comandos/tarefas ao Open Interpreter que pensa e executa localmente. "
            "O Open Interpreter usa seu modelo interno (Ollama) para raciocinar, gerar código e executar. "
            "Use esta tool quando precisar que o Interpreter: "
            "- Raciocine sobre uma tarefa complexa "
            "- Gere e execute código automaticamente "
            "- Corrija erros e tente novamente "
            "- Execute scripts, comandos shell, etc. "
            "O AutoGen comanda o QUANDO e o PORQUÊ; o Open Interpreter decide o COMO e executa."
        ),
        "func": lambda command: asyncio.run(_send_to_oi(command))
    }]


# Função para obter schema da tool (compatível com AutoGen v2)
def get_open_interpreter_tool_schema() -> Dict[str, Any]:
    """
    Retorna o schema da tool para AutoGen v2.
    """
    return {
        "type": "function",
        "function": {
            "name": "open_interpreter_agent",
            "description": (
                "Envia comandos/tarefas ao Open Interpreter que pensa e executa localmente. "
                "O Open Interpreter usa seu modelo interno (Ollama) para raciocinar, gerar código e executar. "
                "O AutoGen comanda o QUANDO e o PORQUÊ; o Open Interpreter decide o COMO e executa."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "command": {
                        "type": "string",
                        "description": (
                            "Comando/tarefa em linguagem natural para o Open Interpreter. "
                            "Exemplos: 'Crie um script Python que soma 5 + 7', "
                            "'Execute ls -la no diretório atual', "
                            "'Analise o arquivo data.csv e gere um relatório'"
                        ),
                    },
                },
                "required": ["command"],
            },
        },
    }

