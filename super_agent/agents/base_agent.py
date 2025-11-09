"""
Base Agent - Classe base para todos os agentes
Compatível com AutoGen
"""
from __future__ import annotations

import logging
from abc import ABC, abstractmethod
from typing import Any, Dict, Optional

logger = logging.getLogger(__name__)


class BaseAgent(ABC):
    """
    Classe base para todos os agentes
    Compatível com AutoGen AssistantAgent
    """
    
    def __init__(
        self,
        name: str,
        system_message: str,
        llm_config: Dict[str, Any],
        memory: Optional[Any] = None,
        resource_manager: Optional[Any] = None,
    ):
        self.name = name
        self.system_message = system_message
        self.llm_config = llm_config
        self.memory = memory
        self.resource_manager = resource_manager
        self.status = "idle"
    
    @abstractmethod
    async def execute(
        self,
        action: str,
        params: Dict[str, Any],
        memory: Optional[Any] = None
    ) -> Dict[str, Any]:
        """
        Executar ação do agente
        
        Args:
            action: Ação a executar
            params: Parâmetros da ação
            memory: Gerenciador de memória
        
        Returns:
            Resultado da execução
        """
        pass
    
    def get_status(self) -> Dict[str, Any]:
        """Obter status do agente"""
        return {
            "name": self.name,
            "status": self.status,
            "memory": self.memory is not None,
        }
    
    async def cleanup(self):
        """Limpar recursos do agente"""
        self.status = "idle"

