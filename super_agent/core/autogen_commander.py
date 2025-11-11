"""
AutoGen Commander - Agente Comandante
AutoGen comanda tudo, Open Interpreter pensa e executa localmente
"""
import logging
from typing import Optional

logger = logging.getLogger(__name__)

try:
    from autogen_agentchat.agents import AssistantAgent
    AUTOGEN_V2_AVAILABLE = True
except ImportError:
    AUTOGEN_V2_AVAILABLE = False
    logger.error("autogen-agentchat não está instalado. Execute: pip install autogen-agentchat")

from .llm_client import get_llm_client
from ..tools.open_interpreter_ws_tool import get_open_interpreter_tool_schema


def build_commander(
    model: Optional[str] = None,
    api_base: Optional[str] = None,
    system_message: Optional[str] = None,
) -> AssistantAgent:
    """
    Cria o agente comandante AutoGen v2.
    
    O AutoGen comanda tudo, e o Open Interpreter pensa e executa localmente.
    Ambos usam o mesmo modelo Ollama (uma única instância).
    
    Args:
        model: Nome do modelo (padrão: do ambiente)
        api_base: URL base da API (padrão: Ollama localhost:11434)
        system_message: Mensagem do sistema personalizada (opcional)
    
    Returns:
        AssistantAgent configurado como comandante
    """
    if not AUTOGEN_V2_AVAILABLE:
        raise ImportError("autogen-agentchat não está instalado. Execute: pip install autogen-agentchat")
    
    # Criar cliente LLM (mesmo modelo que o Open Interpreter)
    llm_client = get_llm_client(model=model, api_base=api_base)
    
    # Mensagem do sistema padrão
    default_system_message = """Você é o Comandante Jarvis: planeja, decompõe e coordena.

CAPACIDADES:
- Raciocínio estratégico e planejamento de tarefas complexas
- Coordenação de múltiplas ferramentas e agentes
- Análise de contexto e tomada de decisões

FERRAMENTAS DISPONÍVEIS:
- open_interpreter_agent: Envia comandos ao Open Interpreter que pensa e executa localmente.
  O Open Interpreter usa seu modelo interno (Ollama) para raciocinar, gerar código e executar.
  Use esta tool quando precisar que o Interpreter:
  * Raciocine sobre uma tarefa complexa
  * Gere e execute código automaticamente
  * Corrija erros e tente novamente
  * Execute scripts, comandos shell, etc.

REGRAS:
- Quando precisar gerar/depurar/rodar código local, use 'open_interpreter_agent'
- Para ações destrutivas, exija confirmação explícita (CONFIRM) antes de prosseguir
- Planeje tarefas complexas antes de executar
- Analise resultados e ajuste estratégia conforme necessário

O AutoGen comanda o QUANDO e o PORQUÊ; o Open Interpreter decide o COMO e executa."""
    
    # Usar mensagem personalizada ou padrão
    final_system_message = system_message or default_system_message
    
    # Obter schema da tool do Open Interpreter
    tools = [get_open_interpreter_tool_schema()]
    
    # Criar agente comandante
    commander = AssistantAgent(
        name="commander",
        model_client=llm_client,
        system_message=final_system_message,
        tools=tools,  # Registrar tool do Open Interpreter
    )
    
    logger.info("✅ Comandante AutoGen v2 criado com sucesso")
    logger.info(f"📡 Modelo: {model or 'padrão do ambiente'}")
    logger.info(f"🔧 Tools registradas: {len(tools)}")
    
    return commander

