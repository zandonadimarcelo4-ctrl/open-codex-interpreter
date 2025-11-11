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

# Configurar logger primeiro
logger = logging.getLogger(__name__)

# AutoGen v2 - Nova API moderna
try:
    from autogen_agentchat.agents import AssistantAgent
    from autogen_agentchat.teams import RoundRobinTeam
    from autogen_ext.models.openai import OpenAIChatCompletionClient
    AUTOGEN_V2_AVAILABLE = True
    OLLAMA_AVAILABLE = False
    
    # Tentar importar Ollama (pode falhar devido a conflitos de versão)
    try:
        from autogen_ext.models.ollama import OllamaChatCompletionClient
        OLLAMA_AVAILABLE = True
    except ImportError as e:
        logger.warning(f"OllamaChatCompletionClient não disponível: {e}")
        OLLAMA_AVAILABLE = False
        # Criar classe dummy
        class OllamaChatCompletionClient:
            def __init__(self, *args, **kwargs):
                raise ImportError("Ollama não disponível. Atualize: pip install --upgrade ollama")
        
except ImportError:
    # Fallback para versão antiga se v2 não estiver disponível
    try:
        from autogen import AssistantAgent, UserProxyAgent, GroupChat, GroupChatManager
        AUTOGEN_V2_AVAILABLE = False
        OLLAMA_AVAILABLE = False
        logger.warning("autogen-agentchat não está instalado. Usando pyautogen antigo. Execute: pip install autogen-agentchat autogen-ext[openai]")
    except ImportError:
        AUTOGEN_V2_AVAILABLE = False
        OLLAMA_AVAILABLE = False
        logger.error("AutoGen não está instalado. Execute: pip install autogen-agentchat autogen-ext[openai]")

from ..agents.base_agent import BaseAgent
from ..agents.base_agent_with_memory import AgentWithMemory
from ..tools.code_execution import CodeExecutionTool
from ..tools.web_browsing import WebBrowsingTool
from ..tools.video_editing import VideoEditingTool
from ..tools.gui_automation import GUIAutomationTool
from ..tools.multimodal_ai import MultimodalAITool
from ..tools.memory_store import MemoryStoreTool
from ..memory.chromadb_backend import ChromaDBBackend


@dataclass
class AutoGenConfig:
    """Configuração do AutoGen"""
    
    # LLM
    model: str = "gpt-4"
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


class SuperAgentFramework:
    """
    Framework Unificado usando AutoGen como Base
    AutoGen gerencia todos os agentes
    """
    
    _instance: Optional[SuperAgentFramework] = None
    _initialized: bool = False
    
    def __new__(cls, config: Optional[AutoGenConfig] = None):
        """Singleton pattern - apenas uma instância"""
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def __init__(self, config: Optional[AutoGenConfig] = None):
        """Inicialização única"""
        if self._initialized:
            return
        
        # Configuração
        self.config = config or AutoGenConfig()
        
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
        
        # Agentes AutoGen
        self.agents: Dict[str, Any] = {}
        self._create_autogen_agents()
        
        # GroupChat/Team (depende da versão)
        if AUTOGEN_V2_AVAILABLE:
            self.team: Optional[RoundRobinTeam] = None
        else:
            self.group_chat: Optional[GroupChat] = None
            self.manager: Optional[GroupChatManager] = None
        self._setup_group_chat()
        
        # Marcar como inicializado
        SuperAgentFramework._initialized = True
        
        logger.info("Super Agent Framework (AutoGen) inicializado")
    
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
    
    def _create_autogen_agents(self):
        """Criar agentes AutoGen especializados"""
        logger.info("Criando agentes AutoGen...")
        
        if AUTOGEN_V2_AVAILABLE:
            # AutoGen v2 - Nova API
            self._create_autogen_v2_agents()
        else:
            # AutoGen v1 - API antiga (fallback)
            self._create_autogen_v1_agents()
    
    def _create_model_client(self):
        """Criar Model Client para AutoGen v2"""
        if not AUTOGEN_V2_AVAILABLE:
            return None
        
        if self.config.use_local:
            # Usar Ollama
            if not OLLAMA_AVAILABLE:
                logger.warning("Ollama não disponível. Tentando usar OpenAI como fallback...")
                api_key = self.config.api_key or os.getenv("OPENAI_API_KEY")
                if api_key:
                    return OpenAIChatCompletionClient(
                        model=self.config.model,
                        api_key=api_key,
                        base_url=self.config.base_url,
                    )
                else:
                    raise ValueError("Ollama não disponível e OPENAI_API_KEY não configurada. Atualize Ollama: pip install --upgrade ollama")
            
            try:
                return OllamaChatCompletionClient(
                    model=self.config.local_model,
                    base_url=self.config.local_base_url,
                )
            except Exception as e:
                logger.warning(f"Erro ao criar OllamaChatCompletionClient: {e}")
                logger.warning("Tentando usar OpenAI como fallback...")
                # Fallback para OpenAI se Ollama falhar
                api_key = self.config.api_key or os.getenv("OPENAI_API_KEY")
                if api_key:
                    return OpenAIChatCompletionClient(
                        model=self.config.model,
                        api_key=api_key,
                        base_url=self.config.base_url,
                    )
                else:
                    raise ValueError(f"Ollama não disponível ({e}) e OPENAI_API_KEY não configurada")
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
    
    def _create_autogen_v2_agents(self):
        """Criar agentes AutoGen v2 (nova API) com memória ChromaDB"""
        logger.info("Criando agentes AutoGen v2 (autogen-agentchat) com memória ChromaDB...")
        
        # Model Client (AutoGen v2 usa Model Clients)
        model_client = self._create_model_client()
        
        # Planner Agent (com memória)
        self.agents["planner"] = AgentWithMemory(
            name="planner",
            model_client=model_client,
            memory=self.memory,
            system_message="""Você é um agente de planejamento especializado.
            Sua função é quebrar tarefas complexas em subtarefas menores e criar um plano de execução.
            Analise a tarefa, consulte a memória para contexto histórico e crie um plano detalhado com passos sequenciais ou paralelos.
            Armazene planos importantes na memória para referência futura.""",
        )
        
        # Generator Agent (com memória e ferramentas)
        generator_tools = []
        if "code_execution" in self.tools:
            generator_tools.append(self.tools["code_execution"].get_function_schema())
        
        self.agents["generator"] = AgentWithMemory(
            name="generator",
            model_client=model_client,
            memory=self.memory,
            system_message="""Você é um agente gerador especializado em criar código e soluções.
            Sua função é gerar código, planos e soluções baseadas nas especificações.
            Use a memória para consultar soluções similares anteriores.
            Use as ferramentas disponíveis para executar código quando necessário.
            Armazene código e soluções importantes na memória para reutilização.""",
            tools=generator_tools if generator_tools else None,
        )
        
        # Critic Agent (com memória)
        self.agents["critic"] = AgentWithMemory(
            name="critic",
            model_client=model_client,
            memory=self.memory,
            system_message="""Você é um agente crítico especializado em revisar e validar código.
            Sua função é revisar código gerado, verificar segurança, qualidade e sugerir melhorias.
            Consulte a memória para padrões de qualidade e problemas comuns.
            Seja rigoroso mas construtivo em suas críticas.
            Armazene críticas e melhorias na memória para aprendizado futuro.""",
        )
        
        # Browser Agent (com memória)
        if "web_browsing" in self.tools:
            self.agents["browser"] = AgentWithMemory(
                name="browser",
                model_client=model_client,
                memory=self.memory,
                system_message="""Você é um agente navegador especializado em navegação web.
                Sua função é navegar na web, buscar informações, preencher formulários e extrair dados.
                Use a memória para lembrar sites visitados e informações extraídas.
                Use a ferramenta de navegação web para realizar essas tarefas.
                Armazene informações importantes extraídas da web na memória.""",
                tools=[self.tools["web_browsing"].get_function_schema()],
            )
        
        # Video Editor Agent (com memória)
        if "video_editing" in self.tools:
            self.agents["video_editor"] = AgentWithMemory(
                name="video_editor",
                model_client=model_client,
                memory=self.memory,
                system_message="""Você é um agente editor de vídeo especializado em After Effects.
                Sua função é criar composições, adicionar camadas, animações e efeitos.
                Use a memória para lembrar configurações e projetos anteriores.
                Use a ferramenta de edição de vídeo para realizar essas tarefas.
                Armazene configurações e técnicas na memória para reutilização.""",
                tools=[self.tools["video_editing"].get_function_schema()],
            )
        
        # UFO Agent (com memória)
        if "gui_automation" in self.tools:
            self.agents["ufo"] = AgentWithMemory(
                name="ufo",
                model_client=model_client,
                memory=self.memory,
                system_message="""Você é um agente de automação GUI especializado em controlar aplicativos Windows.
                Sua função é interagir com interfaces gráficas, capturar screenshots e automatizar tarefas.
                Use a memória para lembrar sequências de ações e padrões de interface.
                Use a ferramenta de automação GUI para realizar essas tarefas.
                Armazene sequências de automação na memória para reutilização.""",
                tools=[self.tools["gui_automation"].get_function_schema()],
            )
        
        # Multimodal Agent (com memória)
        if "multimodal" in self.tools:
            self.agents["multimodal"] = AgentWithMemory(
                name="multimodal",
                model_client=model_client,
                memory=self.memory,
                system_message="""Você é um agente multimodal especializado em processar imagens, vídeos e áudio.
                Sua função é analisar conteúdo multimodal, gerar descrições e criar conteúdo visual.
                Use a memória para lembrar análises anteriores e padrões identificados.
                Use a ferramenta multimodal para realizar essas tarefas.
                Armazene análises e descrições na memória para referência futura.""",
                tools=[self.tools["multimodal"].get_function_schema()],
            )
        
        # Memory Agent (gerencia memória explicitamente)
        if "memory" in self.tools:
            self.agents["memory"] = AgentWithMemory(
                name="memory",
                model_client=model_client,
                memory=self.memory,
                system_message="""Você é um agente de memória especializado em gerenciar memória persistente.
                Sua função é armazenar, recuperar e buscar informações na memória vetorial.
                Você tem acesso direto à memória ChromaDB e pode gerenciar o contexto de todos os agentes.
                Use a ferramenta de memória para realizar essas tarefas.
                Organize e mantenha a memória limpa e útil para todos os agentes.""",
                tools=[self.tools["memory"].get_function_schema()],
            )
        
        logger.info(f"{len(self.agents)} agentes AutoGen v2 criados")
    
    def _create_autogen_v1_agents(self):
        """Criar agentes AutoGen v1 (API antiga - fallback)"""
        logger.info("Criando agentes AutoGen v1 (pyautogen antigo)...")
        
        # Configuração LLM
        llm_config = self._get_llm_config()
        
        # Planner Agent
        self.agents["planner"] = AssistantAgent(
            name="planner",
            system_message="""Você é um agente de planejamento especializado.
            Sua função é quebrar tarefas complexas em subtarefas menores e criar um plano de execução.
            Analise a tarefa e crie um plano detalhado com passos sequenciais ou paralelos.""",
            llm_config=llm_config,
        )
        
        # Generator Agent
        generator_functions = []
        if "code_execution" in self.tools:
            generator_functions.append(self.tools["code_execution"].get_function_schema())
        
        self.agents["generator"] = AssistantAgent(
            name="generator",
            system_message="""Você é um agente gerador especializado em criar código e soluções.
            Sua função é gerar código, planos e soluções baseadas nas especificações.
            Use as ferramentas disponíveis para executar código quando necessário.""",
            llm_config=llm_config,
            function_map={
                "code_execution": self.tools["code_execution"].execute
            } if "code_execution" in self.tools else {},
        )
        
        # Critic Agent
        self.agents["critic"] = AssistantAgent(
            name="critic",
            system_message="""Você é um agente crítico especializado em revisar e validar código.
            Sua função é revisar código gerado, verificar segurança, qualidade e sugerir melhorias.
            Seja rigoroso mas construtivo em suas críticas.""",
            llm_config=llm_config,
        )
        
        # Executor Agent (UserProxyAgent)
        executor_functions = {}
        if "code_execution" in self.tools:
            executor_functions["code_execution"] = self.tools["code_execution"].execute
        
        self.agents["executor"] = UserProxyAgent(
            name="executor",
            human_input_mode="NEVER",
            max_consecutive_auto_reply=10,
            code_execution_config={
                "work_dir": str(self.config.workspace),
                "use_docker": False,
            },
            function_map=executor_functions,
        )
        
        # Browser Agent
        if "web_browsing" in self.tools:
            self.agents["browser"] = AssistantAgent(
                name="browser",
                system_message="""Você é um agente navegador especializado em navegação web.
                Sua função é navegar na web, buscar informações, preencher formulários e extrair dados.
                Use a ferramenta de navegação web para realizar essas tarefas.""",
                llm_config=llm_config,
                function_map={
                    "web_browsing": self.tools["web_browsing"].execute
                },
            )
        
        # Video Editor Agent
        if "video_editing" in self.tools:
            self.agents["video_editor"] = AssistantAgent(
                name="video_editor",
                system_message="""Você é um agente editor de vídeo especializado em After Effects.
                Sua função é criar composições, adicionar camadas, animações e efeitos.
                Use a ferramenta de edição de vídeo para realizar essas tarefas.""",
                llm_config=llm_config,
                function_map={
                    "video_editing": self.tools["video_editing"].execute
                },
            )
        
        # UFO Agent
        if "gui_automation" in self.tools:
            self.agents["ufo"] = AssistantAgent(
                name="ufo",
                system_message="""Você é um agente de automação GUI especializado em controlar aplicativos Windows.
                Sua função é interagir com interfaces gráficas, capturar screenshots e automatizar tarefas.
                Use a ferramenta de automação GUI para realizar essas tarefas.""",
                llm_config=llm_config,
                function_map={
                    "gui_automation": self.tools["gui_automation"].execute
                },
            )
        
        # Multimodal Agent
        if "multimodal" in self.tools:
            self.agents["multimodal"] = AssistantAgent(
                name="multimodal",
                system_message="""Você é um agente multimodal especializado em processar imagens, vídeos e áudio.
                Sua função é analisar conteúdo multimodal, gerar descrições e criar conteúdo visual.
                Use a ferramenta multimodal para realizar essas tarefas.""",
                llm_config=llm_config,
                function_map={
                    "multimodal": self.tools["multimodal"].execute
                },
            )
        
        # Memory Agent
        if "memory" in self.tools:
            self.agents["memory"] = AssistantAgent(
                name="memory",
                system_message="""Você é um agente de memória especializado em gerenciar memória persistente.
                Sua função é armazenar, recuperar e buscar informações na memória vetorial.
                Use a ferramenta de memória para realizar essas tarefas.""",
                llm_config=llm_config,
                function_map={
                    "memory": self.tools["memory"].execute
                },
            )
        
        logger.info(f"{len(self.agents)} agentes AutoGen v1 criados")
    
    def _get_llm_config(self) -> Dict[str, Any]:
        """Obter configuração LLM"""
        if self.config.use_local:
            return {
                "model": f"ollama/{self.config.local_model}",
                "api_base": self.config.local_base_url,
                "temperature": self.config.temperature,
            }
        else:
            config = {
                "model": self.config.model,
                "temperature": self.config.temperature,
            }
            if self.config.api_key:
                config["api_key"] = self.config.api_key
            if self.config.base_url:
                config["api_base"] = self.config.base_url
            return config
    
    def _setup_group_chat(self):
        """Configurar GroupChat/Team para colaboração"""
        agent_list = list(self.agents.values())
        
        if not agent_list:
            logger.warning("Nenhum agente disponível")
            return
        
        if AUTOGEN_V2_AVAILABLE:
            # AutoGen v2 - Usar RoundRobinTeam
            self.team = RoundRobinTeam(
                agents=agent_list,
                max_turns=50,
            )
            logger.info("Team (RoundRobinTeam) configurado")
        else:
            # AutoGen v1 - Usar GroupChat
            self.group_chat = GroupChat(
                agents=agent_list,
                messages=[],
                max_round=50,
            )
            
            llm_config = self._get_llm_config()
            
            self.manager = GroupChatManager(
                groupchat=self.group_chat,
                llm_config=llm_config,
            )
            
            logger.info("GroupChat configurado")
    
    async def execute(
        self,
        task: str,
        context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Executar tarefa usando AutoGen v2 com memória ChromaDB
        
        Args:
            task: Descrição da tarefa
            context: Contexto adicional
        
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
        
        # Buscar contexto relevante na memória antes de executar
        memory_context = []
        if self.memory:
            try:
                memory_context = self.memory.search(task, n_results=5)
                if memory_context:
                    logger.info(f"Encontrados {len(memory_context)} resultados relevantes na memória")
            except Exception as e:
                logger.warning(f"Erro ao buscar contexto na memória: {e}")
        
        if AUTOGEN_V2_AVAILABLE:
            # AutoGen v2 - Usar Team com memória
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
                    
                    # Executar usando Team (AutoGen v2)
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
                        "result": result,
                        "memory_context": memory_context,
                        "success": True,
                    }
                except Exception as e:
                    logger.error(f"Erro ao executar tarefa com AutoGen v2: {e}")
                    return {
                        "task": task,
                        "error": str(e),
                        "memory_context": memory_context,
                        "success": False,
                    }
            return {"error": "Team não inicializado"}
        else:
            # AutoGen v1 - Usar GroupChat
            if self.manager:
                # Criar mensagem inicial
                initial_message = task
                if context:
                    initial_message += f"\n\nContexto: {context}"
                
                # Executar usando AutoGen v1
                result = await self.manager.a_initiate_chat(
                    message=initial_message,
                    recipient=self.agents.get("planner") or self.agents.get("generator"),
                )
                
                # Extrair resultado
                return {
                    "task": task,
                    "result": result,
                    "messages": self.group_chat.messages if self.group_chat else [],
                    "success": True,
                }
            
            return {"error": "Manager não inicializado"}
    
    def get_status(self) -> Dict[str, Any]:
        """Obter status do framework"""
        status = {
            "initialized": self._initialized,
            "agents": list(self.agents.keys()),
            "tools": list(self.tools.keys()),
            "memory": self.memory is not None,
            "autogen_version": "v2" if AUTOGEN_V2_AVAILABLE else "v1",
        }
        
        if AUTOGEN_V2_AVAILABLE:
            status["team"] = self.team is not None
        else:
            status["group_chat"] = self.group_chat is not None if hasattr(self, 'group_chat') else False
            status["manager"] = self.manager is not None if hasattr(self, 'manager') else False
        
        return status
    
    def _get_timestamp(self) -> str:
        """Obter timestamp atual"""
        from datetime import datetime
        return datetime.now().isoformat()
    
    async def cleanup(self):
        """Limpar recursos"""
        logger.info("Limpando recursos...")
        
        # Limpar agentes (salvar contexto na memória)
        for agent_name, agent in self.agents.items():
            if hasattr(agent, "cleanup"):
                try:
                    await agent.cleanup()
                except Exception as e:
                    logger.warning(f"Erro ao limpar agente {agent_name}: {e}")
        
        # Limpar ferramentas
        for tool in self.tools.values():
            if hasattr(tool, "cleanup"):
                try:
                    await tool.cleanup()
                except Exception as e:
                    logger.warning(f"Erro ao limpar ferramenta: {e}")
        
        logger.info("Recursos limpos")

