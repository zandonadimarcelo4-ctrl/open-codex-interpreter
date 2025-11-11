"""
Super Agent Orchestrator - Coordenador principal do sistema
Atualizado para AutoGen v2 (autogen-agentchat)
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
    logger = logging.getLogger(__name__)
    logger.error("autogen-agentchat não está instalado. Execute: pip install autogen-agentchat autogen-ext[openai]")
    raise ImportError("AutoGen v2 (autogen-agentchat) é obrigatório. Instale com: pip install autogen-agentchat autogen-ext[openai]")

# Imports opcionais - agentes especializados podem não existir ainda
try:
    from ..agents.executor_agent import ExecutorAgent
except ImportError:
    ExecutorAgent = None

try:
    from ..agents.generator_agent import GeneratorAgent
except ImportError:
    GeneratorAgent = None

try:
    from ..agents.critic_agent import CriticAgent
except ImportError:
    CriticAgent = None

try:
    from ..agents.planner_agent import PlannerAgent
except ImportError:
    PlannerAgent = None

try:
    from ..agents.ufo_agent import UFOAgent
except ImportError:
    UFOAgent = None

try:
    from ..agents.multimodal_agent import MultimodalAgent
except ImportError:
    MultimodalAgent = None

try:
    from ..integrations.open_interpreter import OpenInterpreterIntegration
except ImportError:
    OpenInterpreterIntegration = None

try:
    from ..integrations.ufo import UFOIntegration
except ImportError:
    UFOIntegration = None

try:
    from ..integrations.multimodal import MultimodalIntegration
except ImportError:
    MultimodalIntegration = None

from ..memory.chromadb_backend import ChromaDBBackend
from ..agents.base_agent_with_memory import AgentWithMemory

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
        if not AUTOGEN_V2_AVAILABLE:
            raise ImportError("AutoGen v2 (autogen-agentchat) é obrigatório. Instale com: pip install autogen-agentchat autogen-ext[openai]")
        
        self.config = config
        self.agents: Dict[str, Any] = {}
        self.integrations: Dict[str, Any] = {}
        self.memory: Optional[ChromaDBBackend] = None
        self.team: Optional[RoundRobinTeam] = None
        self.model_client = self._create_model_client()
        
        # Inicializar componentes
        self._initialize_memory()
        self._initialize_integrations()
        self._initialize_agents()
        self._setup_team()
    
    def _create_model_client(self):
        """Criar Model Client para AutoGen v2"""
        # Verificar se deve usar Ollama (base_url contém ollama ou porta 11434)
        use_ollama = (
            self.config.autogen_base_url and 
            ("ollama" in self.config.autogen_base_url.lower() or "11434" in str(self.config.autogen_base_url))
        ) or not self.config.autogen_api_key  # Se não há API key, usar Ollama como padrão
        
        if use_ollama:
            # Usar Ollama
            try:
                return OllamaChatCompletionClient(
                    model=self.config.autogen_model,
                    base_url=self.config.autogen_base_url or "http://127.0.0.1:11434",
                )
            except Exception as e:
                logger.warning(f"Erro ao criar OllamaChatCompletionClient: {e}")
                logger.warning("Tentando usar OpenAI como fallback...")
                # Fallback para OpenAI se Ollama falhar
                api_key = self.config.autogen_api_key or os.getenv("OPENAI_API_KEY")
                if api_key:
                    return OpenAIChatCompletionClient(
                        model=self.config.autogen_model,
                        api_key=api_key,
                        base_url=self.config.autogen_base_url,
                    )
                else:
                    raise ValueError("Ollama não disponível e OPENAI_API_KEY não configurada")
        else:
            # Usar OpenAI
            api_key = self.config.autogen_api_key or os.getenv("OPENAI_API_KEY")
            if not api_key:
                raise ValueError("OPENAI_API_KEY não configurada. Configure a chave ou use autogen_base_url com Ollama")
            
            return OpenAIChatCompletionClient(
                model=self.config.autogen_model,
                api_key=api_key,
                base_url=self.config.autogen_base_url,
            )
    
    def _initialize_memory(self):
        """Inicializar ChromaDB para memória persistente"""
        if self.config.chromadb_enabled:
            try:
                self.memory = ChromaDBBackend(
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
        """Inicializar agentes AutoGen v2 com memória ChromaDB"""
        # Generator Agent (com memória)
        if self.config.enable_generator and GeneratorAgent:
            try:
                self.agents["generator"] = GeneratorAgent(
                    name="generator",
                    model_client=self.model_client,
                    memory=self.memory,
                    open_interpreter=self.integrations.get("open_interpreter"),
                )
            except Exception as e:
                logger.warning(f"Falha ao criar GeneratorAgent: {e}")
                # Criar agente básico com memória se GeneratorAgent não funcionar
                self.agents["generator"] = AgentWithMemory(
                    name="generator",
                    model_client=self.model_client,
                    memory=self.memory,
                    system_message="""Você é um agente gerador especializado em criar código e soluções.
                    Use a memória para consultar soluções similares anteriores.
                    Armazene código e soluções importantes na memória para reutilização.""",
                )
        
        # Critic Agent (com memória)
        if self.config.enable_critic and CriticAgent:
            try:
                self.agents["critic"] = CriticAgent(
                    name="critic",
                    model_client=self.model_client,
                    memory=self.memory,
                )
            except Exception as e:
                logger.warning(f"Falha ao criar CriticAgent: {e}")
                self.agents["critic"] = AgentWithMemory(
                    name="critic",
                    model_client=self.model_client,
                    memory=self.memory,
                    system_message="""Você é um agente crítico especializado em revisar e validar código.
                    Consulte a memória para padrões de qualidade e problemas comuns.
                    Armazene críticas e melhorias na memória para aprendizado futuro.""",
                )
        
        # Planner Agent (com memória)
        if self.config.enable_planner and PlannerAgent:
            try:
                self.agents["planner"] = PlannerAgent(
                    name="planner",
                    model_client=self.model_client,
                    memory=self.memory,
                )
            except Exception as e:
                logger.warning(f"Falha ao criar PlannerAgent: {e}")
                self.agents["planner"] = AgentWithMemory(
                    name="planner",
                    model_client=self.model_client,
                    memory=self.memory,
                    system_message="""Você é um agente de planejamento especializado em quebrar tarefas complexas em subtarefas menores.
                    Consulte a memória para planos similares anteriores.
                    Armazene planos importantes na memória para referência futura.""",
                )
        
        # Executor Agent (se disponível, com memória)
        if self.config.enable_executor and ExecutorAgent:
            try:
                self.agents["executor"] = ExecutorAgent(
                    name="executor",
                    model_client=self.model_client,
                    memory=self.memory,
                    workspace=self.config.workspace,
                    open_interpreter=self.integrations.get("open_interpreter"),
                )
            except Exception as e:
                logger.warning(f"Falha ao criar ExecutorAgent: {e}")
                # Criar agente executor básico com memória
                self.agents["executor"] = AgentWithMemory(
                    name="executor",
                    model_client=self.model_client,
                    memory=self.memory,
                    system_message="""Você é um agente executor especializado em executar código e comandos.
                    Use a memória para lembrar comandos e resultados anteriores.
                    Armazene resultados de execução na memória para referência futura.""",
                )
        
        # UFO Agent (com memória)
        if self.config.enable_ufo and "ufo" in self.integrations and UFOAgent:
            try:
                self.agents["ufo"] = UFOAgent(
                    name="ufo_agent",
                    model_client=self.model_client,
                    memory=self.memory,
                    ufo_integration=self.integrations["ufo"],
                )
            except Exception as e:
                logger.warning(f"Falha ao criar UFOAgent: {e}")
                self.agents["ufo"] = AgentWithMemory(
                    name="ufo",
                    model_client=self.model_client,
                    memory=self.memory,
                    system_message="""Você é um agente de automação GUI especializado em controlar aplicativos Windows.
                    Use a memória para lembrar sequências de ações e padrões de interface.
                    Armazene sequências de automação na memória para reutilização.""",
                )
        
        # Multimodal Agent (com memória)
        if self.config.enable_multimodal and "multimodal" in self.integrations and MultimodalAgent:
            try:
                self.agents["multimodal"] = MultimodalAgent(
                    name="multimodal_agent",
                    model_client=self.model_client,
                    memory=self.memory,
                    multimodal_integration=self.integrations["multimodal"],
                )
            except Exception as e:
                logger.warning(f"Falha ao criar MultimodalAgent: {e}")
                self.agents["multimodal"] = AgentWithMemory(
                    name="multimodal",
                    model_client=self.model_client,
                    memory=self.memory,
                    system_message="""Você é um agente multimodal especializado em processar imagens, vídeos e áudio.
                    Use a memória para lembrar análises anteriores e padrões identificados.
                    Armazene análises e descrições na memória para referência futura.""",
                )
    
    def _setup_team(self):
        """Configurar Team para colaboração entre agentes (AutoGen v2)"""
        agent_list = list(self.agents.values())
        
        if not agent_list:
            logger.warning("Nenhum agente disponível")
            return
        
        # AutoGen v2 usa RoundRobinTeam
        self.team = RoundRobinTeam(
            agents=agent_list,
            max_turns=50,
        )
        
        logger.info(f"Team (RoundRobinTeam) configurado com {len(agent_list)} agentes")
    
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
        
        # Armazenar tarefa na memória
        if self.memory:
            try:
                self.memory.store(
                    f"Tarefa: {task}",
                    {"type": "task", "context": context, "timestamp": self._get_timestamp()}
                )
            except Exception as e:
                logger.warning(f"Erro ao armazenar tarefa na memória: {e}")
        
        # Buscar contexto relevante na memória
        memory_context = []
        if self.memory:
            try:
                memory_context = self.memory.search(task, n_results=5)
                if memory_context:
                    logger.info(f"Encontrados {len(memory_context)} resultados relevantes na memória")
            except Exception as e:
                logger.warning(f"Erro ao buscar contexto na memória: {e}")
        
        # Processar contexto multimodal se fornecido
        multimodal_context = None
        if context and "images" in context and self.agents.get("multimodal"):
            multimodal_context = await self.agents["multimodal"].process_context(
                context["images"]
            )
        
        # Planejar tarefa (se planner disponível e tiver método plan_task)
        plan = None
        if self.agents.get("planner"):
            try:
                if hasattr(self.agents["planner"], "plan_task"):
                    plan = await self.agents["planner"].plan_task(task, context)
                    logger.info(f"Plano criado: {plan}")
            except Exception as e:
                logger.warning(f"Erro ao criar plano: {e}")
        
        # Executar usando Team (AutoGen v2) com memória
        if self.team:
            try:
                # Criar mensagem inicial com contexto da memória
                initial_message = task
                
                # Adicionar contexto da memória
                if memory_context:
                    initial_message += "\n\n=== CONTEXTO DA MEMÓRIA ===\n"
                    for i, item in enumerate(memory_context, 1):
                        initial_message += f"{i}. {item.get('text', '')[:300]}...\n"
                    initial_message += "========================\n"
                
                # Adicionar contexto adicional
                if context:
                    initial_message += f"\n\n=== CONTEXTO ADICIONAL ===\n{context}\n=======================\n"
                
                # Adicionar contexto multimodal
                if multimodal_context:
                    initial_message += f"\n\n=== CONTEXTO MULTIMODAL ===\n{multimodal_context}\n==========================\n"
                
                # Adicionar plano se disponível
                if plan:
                    initial_message += f"\n\n=== PLANO ===\n{plan}\n=============\n"
                
                # Executar usando Team
                logger.info(f"Executando tarefa com {len(self.agents)} agentes e memória ChromaDB")
                result = await self.team.run(task=initial_message)
                
                # Armazenar resultado na memória
                if self.memory and result:
                    try:
                        result_text = str(result)[:1000]  # Limitar tamanho
                        self.memory.store(
                            f"Resultado da tarefa: {task}",
                            {
                                "type": "task_result",
                                "task": task,
                                "result_preview": result_text,
                                "timestamp": self._get_timestamp()
                            }
                        )
                    except Exception as e:
                        logger.warning(f"Erro ao armazenar resultado na memória: {e}")
                
                # Extrair resultado
                return {
                    "task": task,
                    "plan": plan,
                    "result": result,
                    "memory_context": memory_context,
                    "success": True,
                }
            except Exception as e:
                logger.error(f"Erro ao executar tarefa: {e}")
                return {
                    "task": task,
                    "plan": plan,
                    "error": str(e),
                    "memory_context": memory_context,
                    "success": False,
                }
        
        return {"error": "Team não inicializado"}
    
    def _get_timestamp(self) -> str:
        """Obter timestamp atual"""
        from datetime import datetime
        return datetime.now().isoformat()
    
    def get_status(self) -> Dict[str, Any]:
        """Obter status de todos os agentes"""
        memory_status = {
            "enabled": self.memory is not None,
        }
        
        if self.memory:
            try:
                all_docs = self.memory.get_all()
                memory_status["total_documents"] = len(all_docs)
                memory_status["path"] = str(self.memory.persist_directory)
            except Exception as e:
                memory_status["error"] = str(e)
        
        return {
            "agents": {
                name: {
                    "enabled": agent is not None,
                    "type": type(agent).__name__,
                    "has_memory": hasattr(agent, "memory") and agent.memory is not None,
                }
                for name, agent in self.agents.items()
            },
            "integrations": {
                name: {"enabled": integration is not None}
                for name, integration in self.integrations.items()
            },
            "memory": memory_status,
            "team": {
                "enabled": self.team is not None,
                "agents_count": len(self.agents) if self.team else 0,
            },
            "model_client": {
                "type": type(self.model_client).__name__ if self.model_client else None,
            },
        }

