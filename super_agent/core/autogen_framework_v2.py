"""
Super Agent Framework - AutoGen v2 (autogen-agentchat) como Base
Framework unificado usando AutoGen v2 - API moderna
"""
from __future__ import annotations

import asyncio
import logging
import os
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Dict, List, Optional

# AutoGen v2 - Nova API moderna
try:
    from autogen_agentchat.agents import AssistantAgent
    from autogen_agentchat.teams import RoundRobinTeam
    from autogen_ext.models.openai import OpenAIChatCompletionClient
    from autogen_ext.models.ollama import OllamaChatCompletionClient
    AUTOGEN_V2_AVAILABLE = True
except ImportError:
    AUTOGEN_V2_AVAILABLE = False
    logger.warning("autogen-agentchat não está instalado. Execute: pip install autogen-agentchat autogen-ext[openai]")

from ..agents.base_agent import BaseAgent
from ..tools.code_execution import CodeExecutionTool
from ..tools.web_browsing import WebBrowsingTool
from ..tools.video_editing import VideoEditingTool
from ..tools.gui_automation import GUIAutomationTool
from ..tools.multimodal_ai import MultimodalAITool
from ..tools.memory_store import MemoryStoreTool
from ..memory.chromadb_backend import ChromaDBBackend

logger = logging.getLogger(__name__)


@dataclass
class AutoGenV2Config:
    """Configuração do AutoGen v2"""
    
    # LLM
    model: str = "gpt-4o"
    api_key: Optional[str] = None
    base_url: Optional[str] = None
    temperature: float = 0.7
    
    # Local LLM (Ollama)
    use_local: bool = True
    local_model: str = "deepseek-r1:8b"
    local_base_url: str = "http://127.0.0.1:11434"
    
    # Workspace
    workspace: Path = Path.cwd()
    
    # Capabilities
    code_execution_enabled: bool = True
    web_browsing_enabled: bool = True
    video_editing_enabled: bool = True
    gui_automation_enabled: bool = True
    multimodal_enabled: bool = True
    memory_enabled: bool = True
    
    # After Effects
    after_effects_path: Optional[Path] = None
    
    # UFO
    ufo_workspace: Optional[Path] = None
    
    # ChromaDB
    chromadb_path: Path = Path("./super_agent/memory")


class SuperAgentFrameworkV2:
    """
    Framework Unificado usando AutoGen v2 (autogen-agentchat) como Base
    AutoGen v2 gerencia todos os agentes com API moderna
    """
    
    _instance: Optional[SuperAgentFrameworkV2] = None
    _initialized: bool = False
    
    def __new__(cls, config: Optional[AutoGenV2Config] = None):
        """Singleton pattern - apenas uma instância"""
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def __init__(self, config: Optional[AutoGenV2Config] = None):
        """Inicialização única"""
        if self._initialized:
            return
        
        if not AUTOGEN_V2_AVAILABLE:
            raise ImportError(
                "autogen-agentchat não está instalado. "
                "Execute: pip install autogen-agentchat autogen-ext[openai]"
            )
        
        # Configuração
        self.config = config or AutoGenV2Config()
        
        # Model Client (AutoGen v2 usa Model Clients)
        self.model_client = self._create_model_client()
        
        # Memória
        self.memory: Optional[ChromaDBBackend] = None
        if self.config.memory_enabled:
            try:
                self.memory = ChromaDBBackend(
                    persist_directory=str(self.config.chromadb_path)
                )
                logger.info("ChromaDB inicializado")
            except Exception as e:
                logger.warning(f"Falha ao inicializar ChromaDB: {e}")
        
        # Ferramentas
        self.tools: Dict[str, Any] = {}
        self._initialize_tools()
        
        # Agentes AutoGen v2
        self.agents: Dict[str, AssistantAgent] = {}
        self._create_autogen_v2_agents()
        
        # Team (AutoGen v2 usa Teams em vez de GroupChat)
        self.team: Optional[RoundRobinTeam] = None
        self._setup_team()
        
        # Marcar como inicializado
        SuperAgentFrameworkV2._initialized = True
        
        logger.info("Super Agent Framework (AutoGen v2) inicializado")
    
    def _create_model_client(self):
        """Criar Model Client para AutoGen v2"""
        if self.config.use_local:
            # Usar Ollama
            return OllamaChatCompletionClient(
                model=self.config.local_model,
                base_url=self.config.local_base_url,
            )
        else:
            # Usar OpenAI
            api_key = self.config.api_key or os.getenv("OPENAI_API_KEY")
            if not api_key:
                raise ValueError("OPENAI_API_KEY não configurada. Configure a chave ou use use_local=True")
            
            return OpenAIChatCompletionClient(
                model=self.config.model,
                api_key=api_key,
                base_url=self.config.base_url,
            )
    
    def _initialize_tools(self):
        """Inicializar ferramentas"""
        logger.info("Inicializando ferramentas...")
        
        # Code Execution (Open Interpreter)
        if self.config.code_execution_enabled:
            try:
                self.tools["code_execution"] = CodeExecutionTool(
                    workspace=self.config.workspace
                )
                logger.info("Code Execution Tool inicializado")
            except Exception as e:
                logger.warning(f"Falha ao inicializar Code Execution: {e}")
        
        # Web Browsing (AgenticSeek)
        if self.config.web_browsing_enabled:
            try:
                self.tools["web_browsing"] = WebBrowsingTool()
                logger.info("Web Browsing Tool inicializado")
            except Exception as e:
                logger.warning(f"Falha ao inicializar Web Browsing: {e}")
        
        # Video Editing (After Effects MCP)
        if self.config.video_editing_enabled and self.config.after_effects_path:
            try:
                self.tools["video_editing"] = VideoEditingTool(
                    ae_path=self.config.after_effects_path
                )
                logger.info("Video Editing Tool inicializado")
            except Exception as e:
                logger.warning(f"Falha ao inicializar Video Editing: {e}")
        
        # GUI Automation (UFO)
        if self.config.gui_automation_enabled and self.config.ufo_workspace:
            try:
                self.tools["gui_automation"] = GUIAutomationTool(
                    workspace=self.config.ufo_workspace
                )
                logger.info("GUI Automation Tool inicializado")
            except Exception as e:
                logger.warning(f"Falha ao inicializar GUI Automation: {e}")
        
        # Multimodal AI
        if self.config.multimodal_enabled:
            try:
                self.tools["multimodal"] = MultimodalAITool(
                    model=self.config.model,
                    base_url=self.config.base_url or self.config.local_base_url
                )
                logger.info("Multimodal AI Tool inicializado")
            except Exception as e:
                logger.warning(f"Falha ao inicializar Multimodal AI: {e}")
        
        # Memory Store (ChromaDB)
        if self.config.memory_enabled and self.memory:
            try:
                self.tools["memory"] = MemoryStoreTool(memory=self.memory)
                logger.info("Memory Store Tool inicializado")
            except Exception as e:
                logger.warning(f"Falha ao inicializar Memory Store: {e}")
    
    def _create_autogen_v2_agents(self):
        """Criar agentes AutoGen v2 especializados"""
        logger.info("Criando agentes AutoGen v2...")
        
        # Planner Agent
        self.agents["planner"] = AssistantAgent(
            name="planner",
            model_client=self.model_client,
            system_message="""Você é um agente de planejamento especializado.
            Sua função é quebrar tarefas complexas em subtarefas menores e criar um plano de execução.
            Analise a tarefa e crie um plano detalhado com passos sequenciais ou paralelos.""",
        )
        
        # Generator Agent
        generator_tools = []
        if "code_execution" in self.tools:
            generator_tools.append(self.tools["code_execution"].get_function_schema())
        
        self.agents["generator"] = AssistantAgent(
            name="generator",
            model_client=self.model_client,
            system_message="""Você é um agente gerador especializado em criar código e soluções.
            Sua função é gerar código, planos e soluções baseadas nas especificações.
            Use as ferramentas disponíveis para executar código quando necessário.""",
            tools=generator_tools if generator_tools else None,
        )
        
        # Critic Agent
        self.agents["critic"] = AssistantAgent(
            name="critic",
            model_client=self.model_client,
            system_message="""Você é um agente crítico especializado em revisar e validar código.
            Sua função é revisar código gerado, verificar segurança, qualidade e sugerir melhorias.
            Seja rigoroso mas construtivo em suas críticas.""",
        )
        
        # Browser Agent
        if "web_browsing" in self.tools:
            self.agents["browser"] = AssistantAgent(
                name="browser",
                model_client=self.model_client,
                system_message="""Você é um agente navegador especializado em navegação web.
                Sua função é navegar na web, buscar informações, preencher formulários e extrair dados.
                Use a ferramenta de navegação web para realizar essas tarefas.""",
                tools=[self.tools["web_browsing"].get_function_schema()],
            )
        
        # Video Editor Agent
        if "video_editing" in self.tools:
            self.agents["video_editor"] = AssistantAgent(
                name="video_editor",
                model_client=self.model_client,
                system_message="""Você é um agente editor de vídeo especializado em After Effects.
                Sua função é criar composições, adicionar camadas, animações e efeitos.
                Use a ferramenta de edição de vídeo para realizar essas tarefas.""",
                tools=[self.tools["video_editing"].get_function_schema()],
            )
        
        # UFO Agent
        if "gui_automation" in self.tools:
            self.agents["ufo"] = AssistantAgent(
                name="ufo",
                model_client=self.model_client,
                system_message="""Você é um agente de automação GUI especializado em controlar aplicativos Windows.
                Sua função é interagir com interfaces gráficas, capturar screenshots e automatizar tarefas.
                Use a ferramenta de automação GUI para realizar essas tarefas.""",
                tools=[self.tools["gui_automation"].get_function_schema()],
            )
        
        # Multimodal Agent
        if "multimodal" in self.tools:
            self.agents["multimodal"] = AssistantAgent(
                name="multimodal",
                model_client=self.model_client,
                system_message="""Você é um agente multimodal especializado em processar imagens, vídeos e áudio.
                Sua função é analisar conteúdo multimodal, gerar descrições e criar conteúdo visual.
                Use a ferramenta multimodal para realizar essas tarefas.""",
                tools=[self.tools["multimodal"].get_function_schema()],
            )
        
        # Memory Agent
        if "memory" in self.tools:
            self.agents["memory"] = AssistantAgent(
                name="memory",
                model_client=self.model_client,
                system_message="""Você é um agente de memória especializado em gerenciar memória persistente.
                Sua função é armazenar, recuperar e buscar informações na memória vetorial.
                Use a ferramenta de memória para realizar essas tarefas.""",
                tools=[self.tools["memory"].get_function_schema()],
            )
        
        logger.info(f"{len(self.agents)} agentes AutoGen v2 criados")
    
    def _setup_team(self):
        """Configurar Team para colaboração (AutoGen v2)"""
        agent_list = list(self.agents.values())
        
        if not agent_list:
            logger.warning("Nenhum agente disponível")
            return
        
        # AutoGen v2 usa RoundRobinTeam para coordenação
        self.team = RoundRobinTeam(
            agents=agent_list,
            max_turns=50,
        )
        
        logger.info("Team (RoundRobinTeam) configurado")
    
    async def execute(
        self,
        task: str,
        context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Executar tarefa usando AutoGen v2
        
        Args:
            task: Descrição da tarefa
            context: Contexto adicional
        
        Returns:
            Resultado da execução
        """
        logger.info(f"Executando tarefa: {task}")
        
        # Salvar na memória
        if self.memory:
            await self.memory.add_task(task, context or {})
        
        # Executar usando Team (AutoGen v2)
        if self.team:
            try:
                # AutoGen v2 usa team.run() que é assíncrono
                result = await self.team.run(task=task)
                
                # Extrair resultado
                return {
                    "task": task,
                    "result": result,
                    "success": True,
                }
            except Exception as e:
                logger.error(f"Erro ao executar tarefa: {e}")
                return {
                    "task": task,
                    "error": str(e),
                    "success": False,
                }
        
        return {"error": "Team não inicializado"}
    
    def get_status(self) -> Dict[str, Any]:
        """Obter status do framework"""
        return {
            "initialized": self._initialized,
            "agents": list(self.agents.keys()),
            "tools": list(self.tools.keys()),
            "memory": self.memory is not None,
            "team": self.team is not None,
            "model_client": type(self.model_client).__name__ if self.model_client else None,
        }
    
    async def cleanup(self):
        """Limpar recursos"""
        logger.info("Limpando recursos...")
        
        # Limpar ferramentas
        for tool in self.tools.values():
            if hasattr(tool, "cleanup"):
                await tool.cleanup()
        
        # Limpar memória
        if self.memory:
            await self.memory.cleanup()
        
        logger.info("Recursos limpos")

