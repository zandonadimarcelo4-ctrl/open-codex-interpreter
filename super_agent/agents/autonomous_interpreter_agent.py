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
    logger.error("autogen-agentchat não está instalado. Execute: pip install autogen-agentchat autogen-ext[openai]")

try:
    from ..executors.oi_core import OICore
    OI_CORE_AVAILABLE = True
except ImportError:
    OI_CORE_AVAILABLE = False
    logger.error("OICore não disponível. Verifique se os módulos foram copiados corretamente.")


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
            raise ImportError("autogen-agentchat não está instalado. Execute: pip install autogen-agentchat autogen-ext[openai]")
        
        if not OI_CORE_AVAILABLE:
            raise ImportError("OICore não disponível. Verifique se os módulos foram copiados corretamente.")
        
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


def create_autonomous_interpreter_agent(
    model_client: Any,
    name: str = "autonomous_interpreter",
    workdir: Optional[str] = None,
    auto_run: bool = True,
    max_retries: int = 3,
    **kwargs
) -> AutonomousInterpreterAgent:
    """
    Cria um AutonomousInterpreterAgent para uso no AutoGen
    
    Args:
        model_client: Cliente LLM do AutoGen
        name: Nome do agente
        workdir: Diretório de trabalho
        auto_run: Executar código automaticamente
        max_retries: Número máximo de tentativas de correção
        **kwargs: Argumentos adicionais
    
    Returns:
        AutonomousInterpreterAgent configurado
    """
    return AutonomousInterpreterAgent(
        name=name,
        model_client=model_client,
        workdir=workdir,
        auto_run=auto_run,
        max_retries=max_retries,
        **kwargs
    )

