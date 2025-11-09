"""
Super Agent Framework - Framework Unificado
Único ponto de entrada, sem conflitos
"""
from __future__ import annotations

import asyncio
import logging
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Dict, List, Optional

from ..agents.base_agent import BaseAgent
from ..capabilities.code_execution import CodeExecution
from ..capabilities.web_browsing import WebBrowsing
from ..capabilities.video_editing import VideoEditing
from ..capabilities.gui_automation import GUIAutomation
from ..capabilities.multimodal_ai import MultimodalAI
from ..memory.unified_memory import UnifiedMemory
from .resource_manager import ResourceManager
from .agent_registry import AgentRegistry
from .execution_engine import ExecutionEngine

logger = logging.getLogger(__name__)


@dataclass
class SuperAgentConfig:
    """Configuração do Super Agent Framework"""
    
    # Memory
    memory_type: str = "chromadb"
    memory_path: Path = Path("./super_agent/memory")
    
    # Capabilities
    code_execution_enabled: bool = True
    web_browsing_enabled: bool = True
    video_editing_enabled: bool = True
    gui_automation_enabled: bool = True
    multimodal_enabled: bool = True
    
    # LLM
    llm_provider: str = "ollama"
    llm_model: str = "deepseek-r1:8b"
    llm_base_url: str = "http://127.0.0.1:11434"
    
    # Workspace
    workspace: Path = Path.cwd()
    
    # After Effects
    after_effects_enabled: bool = False
    after_effects_path: Optional[Path] = None
    
    # UFO
    ufo_enabled: bool = False
    ufo_workspace: Optional[Path] = None


class SuperAgentFramework:
    """
    Framework Unificado - Único ponto de entrada
    Gerencia tudo sem conflitos
    """
    
    _instance: Optional[SuperAgentFramework] = None
    _initialized: bool = False
    
    def __new__(cls, config: Optional[SuperAgentConfig] = None):
        """Singleton pattern - apenas uma instância"""
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def __init__(self, config: Optional[SuperAgentConfig] = None):
        """Inicialização única"""
        if self._initialized:
            return
        
        # Configuração
        self.config = config or SuperAgentConfig()
        
        # Gerenciadores principais
        self.resource_manager = ResourceManager()
        self.agent_registry = AgentRegistry()
        self.execution_engine = ExecutionEngine(self.resource_manager)
        self.memory_manager = UnifiedMemory(
            memory_type=self.config.memory_type,
            path=self.config.memory_path
        )
        
        # Capabilities
        self.capabilities: Dict[str, Any] = {}
        self._initialize_capabilities()
        
        # Agentes
        self.agents: Dict[str, BaseAgent] = {}
        self._initialize_agents()
        
        # Estado unificado
        self.state: Dict[str, Any] = {}
        
        # Marcar como inicializado
        SuperAgentFramework._initialized = True
        
        logger.info("Super Agent Framework inicializado com sucesso")
    
    def _initialize_capabilities(self):
        """Inicializar capabilities de forma unificada"""
        logger.info("Inicializando capabilities...")
        
        # Code Execution (Open Interpreter)
        if self.config.code_execution_enabled:
            try:
                self.capabilities["code_execution"] = CodeExecution(
                    workspace=self.config.workspace,
                    resource_manager=self.resource_manager
                )
                logger.info("Code Execution inicializado")
            except Exception as e:
                logger.warning(f"Falha ao inicializar Code Execution: {e}")
        
        # Web Browsing (AgenticSeek)
        if self.config.web_browsing_enabled:
            try:
                self.capabilities["web_browsing"] = WebBrowsing(
                    resource_manager=self.resource_manager
                )
                logger.info("Web Browsing inicializado")
            except Exception as e:
                logger.warning(f"Falha ao inicializar Web Browsing: {e}")
        
        # Video Editing (After Effects MCP)
        if self.config.video_editing_enabled and self.config.after_effects_path:
            try:
                self.capabilities["video_editing"] = VideoEditing(
                    ae_path=self.config.after_effects_path,
                    resource_manager=self.resource_manager
                )
                logger.info("Video Editing inicializado")
            except Exception as e:
                logger.warning(f"Falha ao inicializar Video Editing: {e}")
        
        # GUI Automation (UFO)
        if self.config.gui_automation_enabled and self.config.ufo_workspace:
            try:
                self.capabilities["gui_automation"] = GUIAutomation(
                    workspace=self.config.ufo_workspace,
                    resource_manager=self.resource_manager
                )
                logger.info("GUI Automation inicializado")
            except Exception as e:
                logger.warning(f"Falha ao inicializar GUI Automation: {e}")
        
        # Multimodal AI
        if self.config.multimodal_enabled:
            try:
                self.capabilities["multimodal"] = MultimodalAI(
                    model=self.config.llm_model,
                    base_url=self.config.llm_base_url,
                    resource_manager=self.resource_manager
                )
                logger.info("Multimodal AI inicializado")
            except Exception as e:
                logger.warning(f"Falha ao inicializar Multimodal AI: {e}")
    
    def _initialize_agents(self):
        """Inicializar agentes de forma unificada"""
        logger.info("Inicializando agentes...")
        
        # Todos os agentes usam a mesma base
        # Mesma interface, sem conflitos
        
        from ..agents.planner import PlannerAgent
        from ..agents.generator import GeneratorAgent
        from ..agents.critic import CriticAgent
        from ..agents.executor import ExecutorAgent
        from ..agents.browser import BrowserAgent
        from ..agents.video_editor import VideoEditorAgent
        from ..agents.ufo_agent import UFOAgent
        from ..agents.multimodal import MultimodalAgent
        
        # Configuração LLM unificada
        llm_config = {
            "provider": self.config.llm_provider,
            "model": self.config.llm_model,
            "base_url": self.config.llm_base_url,
        }
        
        # Planner Agent
        self.agents["planner"] = PlannerAgent(
            name="planner",
            llm_config=llm_config,
            memory=self.memory_manager,
            resource_manager=self.resource_manager
        )
        
        # Generator Agent
        self.agents["generator"] = GeneratorAgent(
            name="generator",
            llm_config=llm_config,
            memory=self.memory_manager,
            resource_manager=self.resource_manager,
            code_execution=self.capabilities.get("code_execution")
        )
        
        # Critic Agent
        self.agents["critic"] = CriticAgent(
            name="critic",
            llm_config=llm_config,
            memory=self.memory_manager,
            resource_manager=self.resource_manager
        )
        
        # Executor Agent
        self.agents["executor"] = ExecutorAgent(
            name="executor",
            llm_config=llm_config,
            memory=self.memory_manager,
            resource_manager=self.resource_manager,
            code_execution=self.capabilities.get("code_execution")
        )
        
        # Browser Agent
        if "web_browsing" in self.capabilities:
            self.agents["browser"] = BrowserAgent(
                name="browser",
                llm_config=llm_config,
                memory=self.memory_manager,
                resource_manager=self.resource_manager,
                web_browsing=self.capabilities["web_browsing"]
            )
        
        # Video Editor Agent
        if "video_editing" in self.capabilities:
            self.agents["video_editor"] = VideoEditorAgent(
                name="video_editor",
                llm_config=llm_config,
                memory=self.memory_manager,
                resource_manager=self.resource_manager,
                video_editing=self.capabilities["video_editing"]
            )
        
        # UFO Agent
        if "gui_automation" in self.capabilities:
            self.agents["ufo"] = UFOAgent(
                name="ufo",
                llm_config=llm_config,
                memory=self.memory_manager,
                resource_manager=self.resource_manager,
                gui_automation=self.capabilities["gui_automation"]
            )
        
        # Multimodal Agent
        if "multimodal" in self.capabilities:
            self.agents["multimodal"] = MultimodalAgent(
                name="multimodal",
                llm_config=llm_config,
                memory=self.memory_manager,
                resource_manager=self.resource_manager,
                multimodal_ai=self.capabilities["multimodal"]
            )
        
        # Registrar agentes
        for name, agent in self.agents.items():
            self.agent_registry.register(name, agent)
        
        logger.info(f"{len(self.agents)} agentes inicializados")
    
    async def execute(
        self,
        task: str,
        context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Executar tarefa - único ponto de entrada
        
        Args:
            task: Descrição da tarefa
            context: Contexto adicional
        
        Returns:
            Resultado da execução
        """
        logger.info(f"Executando tarefa: {task}")
        
        # Adquirir lock para execução
        async with self.resource_manager.acquire("execution"):
            # Salvar na memória
            await self.memory_manager.add_task(task, context or {})
            
            # Planejar tarefa
            plan = await self.agents["planner"].plan(task, context)
            logger.info(f"Plano criado: {plan}")
            
            # Executar usando execution engine
            result = await self.execution_engine.execute(
                task=task,
                plan=plan,
                agents=self.agents,
                capabilities=self.capabilities,
                memory=self.memory_manager
            )
            
            # Salvar resultado na memória
            await self.memory_manager.add_result(task, result)
            
            return result
    
    def get_status(self) -> Dict[str, Any]:
        """Obter status do framework"""
        return {
            "initialized": self._initialized,
            "agents": {
                name: agent.get_status()
                for name, agent in self.agents.items()
            },
            "capabilities": {
                name: capability.get_status()
                for name, capability in self.capabilities.items()
            },
            "memory": self.memory_manager.get_status(),
            "resources": self.resource_manager.get_status(),
        }
    
    async def cleanup(self):
        """Limpar recursos"""
        logger.info("Limpando recursos...")
        
        # Limpar capabilities
        for capability in self.capabilities.values():
            if hasattr(capability, "cleanup"):
                await capability.cleanup()
        
        # Limpar agentes
        for agent in self.agents.values():
            if hasattr(agent, "cleanup"):
                await agent.cleanup()
        
        # Limpar memória
        await self.memory_manager.cleanup()
        
        # Limpar resource manager
        await self.resource_manager.cleanup()
        
        logger.info("Recursos limpos")

