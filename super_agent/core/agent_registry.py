"""
Agent Registry - Registro centralizado de agentes
Gerencia agentes de forma unificada
"""
from __future__ import annotations

import logging
from typing import Dict, Optional

from ..agents.base_agent import BaseAgent

logger = logging.getLogger(__name__)


class AgentRegistry:
    """
    Registro de agentes
    Gerencia agentes de forma unificada
    """
    
    def __init__(self):
        self.agents: Dict[str, BaseAgent] = {}
    
    def register(self, name: str, agent: BaseAgent):
        """
        Registrar agente
        
        Args:
            name: Nome do agente
            agent: Instância do agente
        """
        if name in self.agents:
            logger.warning(f"Agente '{name}' já registrado, substituindo...")
        
        self.agents[name] = agent
        logger.debug(f"Agente '{name}' registrado")
    
    def get(self, name: str) -> Optional[BaseAgent]:
        """
        Obter agente
        
        Args:
            name: Nome do agente
        
        Returns:
            Agente ou None
        """
        return self.agents.get(name)
    
    def list(self) -> list[str]:
        """
        Listar agentes registrados
        
        Returns:
            Lista de nomes de agentes
        """
        return list(self.agents.keys())
    
    def unregister(self, name: str):
        """
        Desregistrar agente
        
        Args:
            name: Nome do agente
        """
        if name in self.agents:
            del self.agents[name]
            logger.debug(f"Agente '{name}' desregistrado")

