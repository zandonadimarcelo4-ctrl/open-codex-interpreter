"""
UFO Agent - Agente de Automação GUI
Usa PyAutoGUI para interagir com interfaces gráficas
"""
from __future__ import annotations

import logging
from pathlib import Path
from typing import Any, Dict, Optional

try:
    from autogen_agentchat.agents import AssistantAgent
    from autogen_ext.models.openai import OpenAIChatCompletionClient
    from autogen_ext.models.ollama import OllamaChatCompletionClient
    AUTOGEN_V2_AVAILABLE = True
except ImportError:
    AUTOGEN_V2_AVAILABLE = False

try:
    from ..integrations.ufo import UFOIntegration
    UFO_AVAILABLE = True
except ImportError:
    UFO_AVAILABLE = False

from ..agents.base_agent_with_memory import AgentWithMemory

logger = logging.getLogger(__name__)


class UFOAgent(AgentWithMemory):
    """
    Agente de automação GUI usando PyAutoGUI
    Permite interagir com interfaces gráficas do Windows
    """
    
    def __init__(
        self,
        name: str = "ufo_agent",
        model_client: Optional[Any] = None,
        memory: Optional[Any] = None,
        ufo_integration: Optional[UFOIntegration] = None,
        workspace: Optional[Path] = None,
    ):
        """
        Inicializar agente UFO
        
        Args:
            name: Nome do agente
            model_client: Cliente de modelo para AutoGen v2
            memory: Memória (ChromaDB)
            ufo_integration: Integração UFO
            workspace: Workspace para UFO
        """
        if not AUTOGEN_V2_AVAILABLE:
            raise ImportError("AutoGen v2 (autogen-agentchat) é obrigatório")
        
        if not UFO_AVAILABLE:
            raise ImportError("UFO Integration não disponível. Execute: pip install pyautogui opencv-python Pillow")
        
        # Criar integração UFO se não fornecida
        if ufo_integration is None:
            ufo_integration = UFOIntegration(workspace=workspace)
        
        self.ufo = ufo_integration
        
        # Criar tool de GUI automation
        from ..tools.gui_automation import GUIAutomationTool
        gui_tool = GUIAutomationTool(workspace=workspace)
        
        # System message para o agente
        system_message = """Você é um agente de automação GUI especializado em controlar aplicativos Windows.
        
Sua função é:
1. Capturar screenshots da tela para analisar interfaces
2. Clicar em botões, menus e elementos da interface
3. Digitar texto em campos de formulário
4. Pressionar teclas e hotkeys (ex: Ctrl+C, Alt+Tab)
5. Fazer scroll em páginas e listas
6. Arrastar elementos (drag and drop)
7. Localizar elementos na tela usando imagens
8. Gerenciar janelas (ativar, listar, etc.)

Quando o usuário pedir para:
- "Abrir o Notepad" → Use hotkey Win+R, digite "notepad", pressione Enter
- "Clicar no botão X" → Capture screenshot, localize o botão, clique nele
- "Digitar texto" → Use a ação 'type' para digitar o texto
- "Pressionar Ctrl+C" → Use hotkey com ['ctrl', 'c']
- "Fazer scroll" → Use a ação 'scroll' na posição desejada

Sempre:
1. Capture um screenshot antes de interagir para ver o estado atual da tela
2. Analise o screenshot para localizar elementos
3. Execute a ação solicitada
4. Capture outro screenshot para verificar o resultado

Use a ferramenta 'gui_automation' para todas as ações de automação GUI.
"""
        
        # Inicializar agente base com memória e tool
        super().__init__(
            name=name,
            model_client=model_client,
            memory=memory,
            system_message=system_message,
            tools=[gui_tool.get_function_schema()["function"]],
        )
        
        logger.info(f"UFO Agent '{name}' inicializado com PyAutoGUI")
    
    async def execute_gui_task(self, task: str) -> Dict[str, Any]:
        """
        Executar tarefa de automação GUI
        
        Args:
            task: Descrição da tarefa
        
        Returns:
            Resultado da execução
        """
        logger.info(f"Executando tarefa GUI: {task}")
        
        # Usar a integração UFO para executar a tarefa
        result = self.ufo.execute_task(task=task)
        
        return result
    
    def capture_screenshot(self, region: Optional[tuple] = None, save: bool = True) -> Dict[str, Any]:
        """Capturar screenshot"""
        return self.ufo.capture_screenshot(region=region, save=save)
    
    def click(self, x: int, y: int, button: str = "left", clicks: int = 1) -> Dict[str, Any]:
        """Clicar em uma posição"""
        return self.ufo.click(x=x, y=y, button=button, clicks=clicks)
    
    def type_text(self, text: str) -> Dict[str, Any]:
        """Digitar texto"""
        return self.ufo.type_text(text=text)
    
    def press_key(self, key: str, presses: int = 1) -> Dict[str, Any]:
        """Pressionar tecla"""
        return self.ufo.press_key(key=key, presses=presses)
    
    def hotkey(self, *keys: str) -> Dict[str, Any]:
        """Pressionar combinação de teclas"""
        return self.ufo.hotkey(*keys)

