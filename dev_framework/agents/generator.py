"""Generator agent that uses Ollama-backed models via AutoGen v2."""
from __future__ import annotations

import logging
from typing import Any, Optional

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


class GeneratorAgent(AssistantAgent):
    """LLM-backed agent responsible for producing code and reasoning (AutoGen v2)."""

    def __init__(self, *, memory: MemoryManager, model_client: Any, name: str = "Generator", **kwargs):
        """
        Inicializar Generator Agent com AutoGen v2
        
        Args:
            memory: Gerenciador de memória
            model_client: Model Client (Ollama ou OpenAI)
            name: Nome do agente
            **kwargs: Argumentos adicionais
        """
        system_message = """Você é um agente gerador especializado em criar código e soluções.
        Sua função é gerar código, planos e soluções baseadas nas especificações.
        Use a memória para consultar soluções similares anteriores.
        Armazene código e soluções importantes na memória para reutilização."""
        
        super().__init__(
            name=name,
            model_client=model_client,
            system_message=system_message,
            **kwargs
        )
        self._memory = memory

    async def generate_with_memory(self, prompt: str) -> str:
        """
        Gerar código/solução usando memória (método assíncrono para AutoGen v2)
        
        Args:
            prompt: Prompt do usuário
            
        Returns:
            Resposta gerada
        """
        self._memory.add_event("prompt", prompt)
        
        # Buscar contexto relevante na memória
        memory_context = self._memory.query(prompt, top_k=3)
        
        # Criar prompt com contexto
        enhanced_prompt = prompt
        if memory_context:
            enhanced_prompt += f"\n\n=== CONTEXTO DA MEMÓRIA ===\n"
            for i, ctx in enumerate(memory_context, 1):
                enhanced_prompt += f"{i}. {ctx[:200]}...\n"
            enhanced_prompt += "========================\n"
        
        # No AutoGen v2, os agentes trabalham através do Team
        # Este método pode ser usado para gerar resposta diretamente
        # Por enquanto, retornamos o prompt aprimorado
        return enhanced_prompt
