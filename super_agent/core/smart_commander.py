"""
AutoGen Commander Inteligente com Orquestração de Modelos
Alterna automaticamente entre Brain (Qwen32B-MoE) e Executor (Qwen14B-Coder)
"""
import os
import logging
from typing import Optional, Dict, Any

logger = logging.getLogger(__name__)

try:
    from autogen_agentchat.agents import AssistantAgent
    from autogen_ext.models.openai import OpenAIChatCompletionClient
    AUTOGEN_V2_AVAILABLE = True
except ImportError:
    AUTOGEN_V2_AVAILABLE = False
    logger.error("autogen-agentchat não está instalado. Execute: pip install autogen-agentchat autogen-ext[openai]")

try:
    from .model_manager import get_model_manager, ModelManager
    from .intelligent_router import get_router, IntelligentRouter
    MODEL_MANAGEMENT_AVAILABLE = True
except ImportError:
    MODEL_MANAGEMENT_AVAILABLE = False
    logger.warning("⚠️ Gerenciamento de modelos não disponível")


class SmartCommander(AssistantAgent):
    """
    Commander inteligente que alterna modelos automaticamente
    
    Características:
    - Detecta tipo de tarefa (planejamento vs código)
    - Alterna entre Brain (Qwen32B-MoE) e Executor (Qwen14B-Coder)
    - Gerencia VRAM automaticamente (modo alternado)
    - Nunca estoura 16GB VRAM
    """
    
    def __init__(
        self,
        brain_model: Optional[str] = None,
        executor_model: Optional[str] = None,
        api_base: Optional[str] = None,
        **kwargs
    ):
        """
        Inicializa o commander inteligente
        
        Args:
            brain_model: Modelo cérebro estratégico (padrão: qwen2.5-32b-instruct-moe-rtx)
            executor_model: Modelo executor de código (padrão: qwen2.5-coder:14b)
            api_base: URL base da API Ollama
            **kwargs: Argumentos adicionais para AssistantAgent
        """
        if not AUTOGEN_V2_AVAILABLE:
            raise ImportError("autogen-agentchat não está instalado")
        
        # Inicializar gerenciador de modelos e roteador
        if MODEL_MANAGEMENT_AVAILABLE:
            self.model_manager = get_model_manager()
            self.router = get_router()
            self.brain_model = brain_model or self.model_manager.get_brain_model()
            self.executor_model = executor_model or self.model_manager.get_executor_model()
        else:
            self.model_manager = None
            self.router = None
            self.brain_model = brain_model or os.getenv("DEFAULT_MODEL", "qwen2.5-32b-instruct-moe-rtx")
            self.executor_model = executor_model or os.getenv("EXECUTOR_MODEL", "qwen2.5-coder:14b")
        
        # Obter API base
        api_base = api_base or os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
        api_base = api_base.rstrip("/").rstrip("/v1").rstrip("/api")
        api_url = f"{api_base}/v1"
        
        # Criar cliente LLM inicial (Brain)
        self.llm_client = OpenAIChatCompletionClient(
            model=f"ollama/{self.brain_model}",
            api_base=api_url,
        )
        
        # Garantir que Brain está carregado inicialmente
        if self.model_manager:
            self.model_manager.ensure_brain_loaded()
        
        # System message
        system_message = """Você é o Comandante AutoGen: um chefe inteligente que decide qual ferramenta usar para cada tarefa.

SUA FUNÇÃO:
- Analisar a tarefa do usuário
- Decidir qual ferramenta (tool) usar
- Coordenar múltiplas ferramentas se necessário
- Retornar o resultado final

VOCÊ TEM ACESSO A:
- open_interpreter_agent: Gera e executa código localmente (Python, Shell, JavaScript, HTML, etc.)
- Outras ferramentas conforme necessário

REGRAS:
1. Analise a tarefa do usuário
2. Decida qual ferramenta usar (ou múltiplas ferramentas)
3. Chame a ferramenta apropriada com a tarefa em linguagem natural
4. Parse e valide a resposta JSON da ferramenta
5. Se a tarefa precisar de múltiplos passos, use múltiplas ferramentas em sequência
6. Sempre retorne o resultado final de forma clara e estruturada
7. Se uma ferramenta retornar "success": false, verifique "errors" e tente novamente ou informe o usuário
"""
        
        # Inicializar AssistantAgent
        super().__init__(
            name="smart_commander",
            model_client=self.llm_client,
            system_message=system_message,
            **kwargs
        )
        
        logger.info(f"✅ SmartCommander inicializado")
        logger.info(f"   Brain: {self.brain_model}")
        logger.info(f"   Executor: {self.executor_model}")
        logger.info(f"   Orquestração: {'Inteligente' if self.model_manager else 'Fixa'}")
    
    def _switch_model(self, model_name: str, role: str):
        """
        Alterna modelo do cliente LLM
        
        Args:
            model_name: Nome do modelo
            role: Papel do modelo (brain ou executor)
        """
        if self.model_manager:
            # Usar gerenciador para alternar modelo
            if role == "brain":
                self.model_manager.ensure_brain_loaded()
                model_name = self.model_manager.get_brain_model()
            elif role == "executor":
                self.model_manager.ensure_executor_loaded()
                model_name = self.model_manager.get_executor_model()
        
        # Atualizar cliente LLM
        api_base = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
        api_base = api_base.rstrip("/").rstrip("/v1").rstrip("/api")
        api_url = f"{api_base}/v1"
        
        self.llm_client = OpenAIChatCompletionClient(
            model=f"ollama/{model_name}",
            api_base=api_url,
        )
        
        # Atualizar model_client do AssistantAgent
        self.model_client = self.llm_client
        
        logger.info(f"🔄 Modelo alternado para: {model_name} ({role})")
    
    async def process_message(self, message: str, intent: Optional[Dict[str, Any]] = None) -> str:
        """
        Processa mensagem com roteamento inteligente
        
        Args:
            message: Mensagem do usuário
            intent: Intent detectado (opcional)
        
        Returns:
            Resposta do commander
        """
        # Rotear tarefa para modelo apropriado
        if self.router and self.model_manager:
            routing = self.router.route_task(message, intent)
            task_type = routing["task_type"]
            model_role = routing["model_role"]
            
            # Alternar modelo se necessário
            if model_role == "brain":
                self._switch_model(self.brain_model, "brain")
            elif model_role == "executor":
                self._switch_model(self.executor_model, "executor")
            
            logger.info(f"🎯 Tarefa roteada: {task_type} → {model_role}")
        
        # Processar mensagem com AssistantAgent
        # (implementação depende da API do AutoGen v2)
        # Por enquanto, usar método padrão
        return await super().process_message(message)
    
    def get_status(self) -> Dict[str, Any]:
        """
        Retorna status do commander
        
        Returns:
            Dict com status
        """
        status = {
            "brain_model": self.brain_model,
            "executor_model": self.executor_model,
            "orchestration": "intelligent" if self.model_manager else "fixed",
        }
        
        if self.model_manager:
            status.update(self.model_manager.get_status())
        
        return status


def create_smart_commander(
    brain_model: Optional[str] = None,
    executor_model: Optional[str] = None,
    api_base: Optional[str] = None,
    **kwargs
) -> SmartCommander:
    """
    Cria um SmartCommander com orquestração inteligente
    
    Args:
        brain_model: Modelo cérebro estratégico
        executor_model: Modelo executor de código
        api_base: URL base da API Ollama
        **kwargs: Argumentos adicionais
    
    Returns:
        SmartCommander configurado
    """
    return SmartCommander(
        brain_model=brain_model,
        executor_model=executor_model,
        api_base=api_base,
        **kwargs
    )

