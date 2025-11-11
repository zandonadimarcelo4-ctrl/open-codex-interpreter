"""Critic agent that reviews generator output (AutoGen v2)."""
from __future__ import annotations

import logging
from typing import Any

try:
    from autogen_agentchat.agents import AssistantAgent
    AUTOGEN_V2_AVAILABLE = True
except ImportError:
    AUTOGEN_V2_AVAILABLE = False
    logger = logging.getLogger(__name__)
    logger.error("AutoGen v2 não disponível. Execute: pip install autogen-agentchat autogen-ext[openai]")
    raise ImportError("AutoGen v2 (autogen-agentchat) é obrigatório")

from ..memory.memory_manager import MemoryManager

logger = logging.getLogger(__name__)


class CriticAgent(AssistantAgent):
    """Agent responsible for code review and planning (AutoGen v2)."""

    def __init__(self, *, memory: MemoryManager, model_client: Any, name: str = "Critic", **kwargs):
        """
        Inicializar Critic Agent com AutoGen v2
        
        Args:
            memory: Gerenciador de memória
            model_client: Model Client (Ollama ou OpenAI)
            name: Nome do agente
            **kwargs: Argumentos adicionais
        """
        system_message = """Você é um agente crítico especializado em revisar e validar código.
        Sua função é revisar código gerado, verificar segurança, qualidade e sugerir melhorias.
        Consulte a memória para padrões de qualidade e problemas comuns.
        Seja rigoroso mas construtivo em suas críticas.
        Armazene críticas e melhorias na memória para aprendizado futuro."""
        
        super().__init__(
            name=name,
            model_client=model_client,
            system_message=system_message,
            **kwargs
        )
        self._memory = memory

    def register_review(self, feedback: str) -> None:
        """Registrar feedback na memória"""
        self._memory.add_event("critic_feedback", feedback)
