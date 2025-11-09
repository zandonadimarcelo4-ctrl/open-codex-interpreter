"""
Super Agent Orchestrator - Coordenador principal do sistema
"""
from __future__ import annotations

import asyncio
import logging
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Dict, List, Optional

from autogen import AssistantAgent, GroupChat, GroupChatManager, UserProxyAgent

from ..agents.executor_agent import ExecutorAgent
from ..agents.generator_agent import GeneratorAgent
from ..agents.critic_agent import CriticAgent
from ..agents.planner_agent import PlannerAgent
from ..agents.ufo_agent import UFOAgent
from ..agents.multimodal_agent import MultimodalAgent
from ..integrations.open_interpreter import OpenInterpreterIntegration
from ..integrations.ufo import UFOIntegration
from ..integrations.multimodal import MultimodalIntegration
from ..memory.chromadb_store import ChromaDBStore

logger = logging.getLogger(__name__)


@dataclass
class SuperAgentConfig:
    """Configuração do Super Agent"""
    
    # AutoGen Config
    autogen_model: str = "gpt-4"
    autogen_api_key: Optional[str] = None
    autogen_base_url: Optional[str] = None
    autogen_temperature: float = 0.7
    
    # Open Interpreter Config
    open_interpreter_enabled: bool = True
    open_interpreter_auto_run: bool = False
    
    # UFO Config
    ufo_enabled: bool = True
    ufo_workspace: Optional[Path] = None
    
    # Multimodal Config
    multimodal_enabled: bool = True
    multimodal_model: str = "gpt-4-vision-preview"
    
    # ChromaDB Config
    chromadb_enabled: bool = True
    chromadb_path: Path = Path("./super_agent/memory")
    
    # Workspace
    workspace: Path = Path.cwd()
    
    # Agent Configs
    enable_generator: bool = True
    enable_critic: bool = True
    enable_planner: bool = True
    enable_executor: bool = True
    enable_ufo: bool = True
    enable_multimodal: bool = True


class SuperAgentOrchestrator:
    """
    Orquestrador principal que coordena todos os agentes
    """
    
    def __init__(self, config: SuperAgentConfig):
        self.config = config
        self.agents: Dict[str, Any] = {}
        self.integrations: Dict[str, Any] = {}
        self.memory: Optional[ChromaDBStore] = None
        self.group_chat: Optional[GroupChat] = None
        self.manager: Optional[GroupChatManager] = None
        
        # Inicializar componentes
        self._initialize_memory()
        self._initialize_integrations()
        self._initialize_agents()
        self._setup_group_chat()
    
    def _initialize_memory(self):
        """Inicializar ChromaDB para memória persistente"""
        if self.config.chromadb_enabled:
            try:
                self.memory = ChromaDBStore(
                    persist_directory=str(self.config.chromadb_path)
                )
                logger.info("ChromaDB inicializado com sucesso")
            except Exception as e:
                logger.warning(f"Falha ao inicializar ChromaDB: {e}")
                self.memory = None
    
    def _initialize_integrations(self):
        """Inicializar integrações externas"""
        # Open Interpreter
        if self.config.open_interpreter_enabled:
            try:
                self.integrations["open_interpreter"] = OpenInterpreterIntegration(
                    auto_run=self.config.open_interpreter_auto_run
                )
                logger.info("Open Interpreter integrado")
            except Exception as e:
                logger.warning(f"Falha ao integrar Open Interpreter: {e}")
        
        # UFO
        if self.config.ufo_enabled and self.config.ufo_workspace:
            try:
                self.integrations["ufo"] = UFOIntegration(
                    workspace=self.config.ufo_workspace
                )
                logger.info("UFO integrado")
            except Exception as e:
                logger.warning(f"Falha ao integrar UFO: {e}")
        
        # Multimodal
        if self.config.multimodal_enabled:
            try:
                self.integrations["multimodal"] = MultimodalIntegration(
                    model=self.config.multimodal_model
                )
                logger.info("Multimodal integrado")
            except Exception as e:
                logger.warning(f"Falha ao integrar Multimodal: {e}")
    
    def _initialize_agents(self):
        """Inicializar agentes AutoGen"""
        llm_config = {
            "model": self.config.autogen_model,
            "temperature": self.config.autogen_temperature,
        }
        
        if self.config.autogen_api_key:
            llm_config["api_key"] = self.config.autogen_api_key
        if self.config.autogen_base_url:
            llm_config["api_base"] = self.config.autogen_base_url
        
        # User Proxy
        user_proxy = UserProxyAgent(
            name="user_proxy",
            human_input_mode="NEVER",
            max_consecutive_auto_reply=10,
            code_execution_config={
                "work_dir": str(self.config.workspace),
                "use_docker": False,
            },
        )
        
        # Generator Agent
        if self.config.enable_generator:
            self.agents["generator"] = GeneratorAgent(
                name="generator",
                llm_config=llm_config,
                memory=self.memory,
                open_interpreter=self.integrations.get("open_interpreter"),
            )
        
        # Critic Agent
        if self.config.enable_critic:
            self.agents["critic"] = CriticAgent(
                name="critic",
                llm_config=llm_config,
                memory=self.memory,
            )
        
        # Planner Agent
        if self.config.enable_planner:
            self.agents["planner"] = PlannerAgent(
                name="planner",
                llm_config=llm_config,
                memory=self.memory,
            )
        
        # Executor Agent
        if self.config.enable_executor:
            self.agents["executor"] = ExecutorAgent(
                name="executor",
                llm_config=llm_config,
                user_proxy=user_proxy,
                memory=self.memory,
                open_interpreter=self.integrations.get("open_interpreter"),
            )
        
        # UFO Agent
        if self.config.enable_ufo and "ufo" in self.integrations:
            self.agents["ufo"] = UFOAgent(
                name="ufo_agent",
                llm_config=llm_config,
                memory=self.memory,
                ufo_integration=self.integrations["ufo"],
            )
        
        # Multimodal Agent
        if self.config.enable_multimodal and "multimodal" in self.integrations:
            self.agents["multimodal"] = MultimodalAgent(
                name="multimodal_agent",
                llm_config=llm_config,
                memory=self.memory,
                multimodal_integration=self.integrations["multimodal"],
            )
    
    def _setup_group_chat(self):
        """Configurar GroupChat para colaboração entre agentes"""
        agent_list = list(self.agents.values())
        
        if not agent_list:
            logger.warning("Nenhum agente disponível")
            return
        
        self.group_chat = GroupChat(
            agents=agent_list,
            messages=[],
            max_round=50,
        )
        
        self.manager = GroupChatManager(
            groupchat=self.group_chat,
            llm_config={
                "model": self.config.autogen_model,
                "temperature": self.config.autogen_temperature,
            },
        )
    
    async def execute(self, task: str, context: Optional[Dict] = None) -> Dict[str, Any]:
        """
        Executar uma tarefa complexa usando todos os agentes
        
        Args:
            task: Descrição da tarefa
            context: Contexto adicional (imagens, arquivos, etc.)
        
        Returns:
            Resultado da execução
        """
        logger.info(f"Executando tarefa: {task}")
        
        # Salvar na memória
        if self.memory:
            self.memory.add_task(task, context or {})
        
        # Processar contexto multimodal se fornecido
        multimodal_context = None
        if context and "images" in context and self.agents.get("multimodal"):
            multimodal_context = await self.agents["multimodal"].process_context(
                context["images"]
            )
        
        # Planejar tarefa
        plan = None
        if self.agents.get("planner"):
            plan = await self.agents["planner"].plan_task(task, context)
            logger.info(f"Plano criado: {plan}")
        
        # Executar usando GroupChat
        if self.manager:
            result = await self.manager.a_initiate_chat(
                message=task,
                recipient=self.agents.get("planner") or self.agents.get("generator"),
            )
            
            # Extrair resultado
            return {
                "task": task,
                "plan": plan,
                "result": result,
                "messages": self.group_chat.messages if self.group_chat else [],
            }
        
        return {"error": "Manager não inicializado"}
    
    def get_status(self) -> Dict[str, Any]:
        """Obter status de todos os agentes"""
        return {
            "agents": {
                name: {
                    "enabled": agent is not None,
                    "type": type(agent).__name__,
                }
                for name, agent in self.agents.items()
            },
            "integrations": {
                name: {"enabled": integration is not None}
                for name, integration in self.integrations.items()
            },
            "memory": {
                "enabled": self.memory is not None,
            },
        }

