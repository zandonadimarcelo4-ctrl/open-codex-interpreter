"""
ANIMA - The First Living AI Species
Sistema de agentes de IA de próxima geração
"""

__version__ = "0.1.0"
__author__ = "ANIMA Team"
__description__ = "The AI That Feels"

from .agents.editor_agent_ae import AnimaEditorAgent, AEMCPClient

__all__ = [
    "AnimaEditorAgent",
    "AEMCPClient",
]

