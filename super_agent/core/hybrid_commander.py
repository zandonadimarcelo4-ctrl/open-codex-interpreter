"""
AutoGen Commander Híbrido (Cloud + Local) com Fallback Automático
Ollama Cloud como cérebro principal, modelos locais como fallback
"""
import os
import logging
from typing import Optional, Dict, Any, List

logger = logging.getLogger(__name__)

try:
    from autogen_agentchat.agents import AssistantAgent
    from autogen_ext.models.openai import OpenAIChatCompletionClient
    AUTOGEN_V2_AVAILABLE = True
except ImportError:
    AUTOGEN_V2_AVAILABLE = False
    logger.error("autogen-agentchat não está instalado")

try:
    from .hybrid_model_manager import get_hybrid_model_manager, HybridModelManager
    HYBRID_MANAGEMENT_AVAILABLE = True
except ImportError:
    HYBRID_MANAGEMENT_AVAILABLE = False
    logger.warning("⚠️ Gerenciamento híbrido não disponível")

try:
    from .intelligent_router import get_router, IntelligentRouter
    ROUTER_AVAILABLE = True
except ImportError:
    ROUTER_AVAILABLE = False
    logger.warning("⚠️ Roteador inteligente não disponível")


class HybridCommander(AssistantAgent):
    """
    Commander híbrido com fallback automático Cloud → Local
    
    Características:
    - Ollama Cloud como cérebro principal (raciocínio profundo)
    - Modelos locais como fallback (continuidade, offline)
    - Fallback automático (se Cloud falhar, usa Local)
    - Roteamento inteligente (detecta tipo de tarefa)
    - Nunca trava (sempre tem fallback)
    """
    
    def __init__(
        self,
        cloud_model: Optional[str] = None,
        cloud_api_key: Optional[str] = None,
        cloud_base_url: Optional[str] = None,
        cloud_enabled: bool = True,
        local_brain_model: Optional[str] = None,
        local_executor_model: Optional[str] = None,
        fallback_enabled: bool = True,
        **kwargs
    ):
        """
        Inicializa o commander híbrido
        
        Args:
            cloud_model: Modelo Cloud (ex: "qwen3-coder:480b-cloud")
            cloud_api_key: API key do Ollama Cloud
            cloud_base_url: URL base da API Cloud
            cloud_enabled: Se Cloud está habilitado
            local_brain_model: Modelo local para fallback
            local_executor_model: Modelo local para executor
            fallback_enabled: Se fallback automático está habilitado
            **kwargs: Argumentos adicionais para AssistantAgent
        """
        if not AUTOGEN_V2_AVAILABLE:
            raise ImportError("autogen-agentchat não está instalado")
        
        # Inicializar gerenciador híbrido e roteador
        if HYBRID_MANAGEMENT_AVAILABLE:
            self.hybrid_manager = get_hybrid_model_manager()
            if cloud_model:
                self.hybrid_manager.cloud_model = cloud_model
            if cloud_api_key:
                self.hybrid_manager.cloud_api_key = cloud_api_key
            if cloud_base_url:
                self.hybrid_manager.cloud_base_url = cloud_base_url
            if local_brain_model:
                self.hybrid_manager.local_brain_model = local_brain_model
            if local_executor_model:
                self.hybrid_manager.local_executor_model = local_executor_model
            self.hybrid_manager.cloud_enabled = cloud_enabled
            self.hybrid_manager.fallback_enabled = fallback_enabled
        else:
            self.hybrid_manager = None
            logger.warning("⚠️ Gerenciamento híbrido não disponível. Usando modelo fixo.")
        
        if ROUTER_AVAILABLE:
            self.router = get_router()
        else:
            self.router = None
            logger.warning("⚠️ Roteador inteligente não disponível.")
        
        # Obter modelo inicial (Cloud ou Local)
        if self.hybrid_manager:
            model_info = self.hybrid_manager.get_model_for_task("reasoning", use_cloud=True)
            model_name = model_info["model"]
            api_base = model_info["base_url"]
            api_key = model_info.get("api_key")
        else:
            # Fallback para modelo local
            model_name = local_brain_model or os.getenv("DEFAULT_MODEL", "qwen2.5-32b-instruct-moe-rtx")
            api_base = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
            api_key = None
        
        # Garantir formato correto da URL
        api_base = api_base.rstrip("/").rstrip("/v1").rstrip("/api")
        
        # Criar cliente LLM
        if api_key:
            # Cloud (OpenAI-compatible API)
            api_url = f"{api_base}/v1"
            self.llm_client = OpenAIChatCompletionClient(
                model=model_name,
                api_base=api_url,
                api_key=api_key,
            )
        else:
            # Local (Ollama)
            api_url = f"{api_base}/v1"
            self.llm_client = OpenAIChatCompletionClient(
                model=f"ollama/{model_name}",
                api_base=api_url,
            )
        
        # System message
        system_message = """Você é o Comandante AutoGen Híbrido: um chefe inteligente que decide qual ferramenta usar para cada tarefa.

ARQUITETURA HÍBRIDA:
- Ollama Cloud (cérebro principal): Raciocínio profundo, planejamento complexo
- Modelos locais (fallback): Continuidade, offline, execução rápida
- Fallback automático: Se Cloud falhar, usa Local automaticamente

SUA FUNÇÃO:
- Analisar a tarefa do usuário
- Decidir qual ferramenta (tool) usar
- Coordenar múltiplas ferramentas se necessário
- Retornar o resultado final

FERRAMENTAS DISPONÍVEIS:
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
8. Se Cloud falhar, o sistema automaticamente usa Local (fallback transparente)
"""
        
        # Inicializar AssistantAgent
        super().__init__(
            name="hybrid_commander",
            model_client=self.llm_client,
            system_message=system_message,
            **kwargs
        )
        
        logger.info(f"✅ HybridCommander inicializado")
        logger.info(f"   Cloud: {self.hybrid_manager.cloud_model if self.hybrid_manager else 'N/A'} ({'✅ Habilitado' if (self.hybrid_manager and self.hybrid_manager.cloud_enabled) else '❌ Desabilitado'})")
        logger.info(f"   Local Brain: {self.hybrid_manager.local_brain_model if self.hybrid_manager else 'N/A'}")
        logger.info(f"   Fallback: {'✅ Habilitado' if (self.hybrid_manager and self.hybrid_manager.fallback_enabled) else '❌ Desabilitado'}")
    
    def _switch_model(self, model_info: Dict[str, Any]):
        """
        Alterna modelo do cliente LLM
        
        Args:
            model_info: Informações do modelo (do HybridModelManager)
        """
        model_name = model_info["model"]
        api_base = model_info["base_url"]
        api_key = model_info.get("api_key")
        
        # Garantir formato correto da URL
        api_base = api_base.rstrip("/").rstrip("/v1").rstrip("/api")
        
        # Criar cliente LLM
        if api_key:
            # Cloud (OpenAI-compatible API)
            api_url = f"{api_base}/v1"
            self.llm_client = OpenAIChatCompletionClient(
                model=model_name,
                api_base=api_url,
                api_key=api_key,
            )
        else:
            # Local (Ollama)
            api_url = f"{api_base}/v1"
            self.llm_client = OpenAIChatCompletionClient(
                model=f"ollama/{model_name}",
                api_base=api_url,
            )
        
        # Atualizar model_client do AssistantAgent
        self.model_client = self.llm_client
        
        logger.info(f"🔄 Modelo alternado para: {model_name} ({model_info['tier']})")
    
    async def process_message(self, message: str, intent: Optional[Dict[str, Any]] = None) -> str:
        """
        Processa mensagem com roteamento inteligente e fallback automático
        
        Args:
            message: Mensagem do usuário
            intent: Intent detectado (opcional)
        
        Returns:
            Resposta do commander
        """
        # Rotear tarefa para modelo apropriado
        if self.router and self.hybrid_manager:
            routing = self.router.route_task(message, intent)
            task_type = routing["task_type"]
            
            # Obter modelo apropriado (com fallback automático)
            try:
                model_info = self.hybrid_manager.get_model_for_task(task_type, use_cloud=True)
                self._switch_model(model_info)
                logger.info(f"🎯 Tarefa roteada: {task_type} → {model_info['tier']} ({model_info['model']})")
            except Exception as e:
                logger.warning(f"⚠️ Erro ao obter modelo: {e}")
                # Continuar com modelo atual (já configurado)
        
        # Processar mensagem com AssistantAgent
        # (implementação depende da API do AutoGen v2)
        # Por enquanto, usar método padrão
        return await super().process_message(message)
    
    def get_status(self) -> Dict[str, Any]:
        """
        Retorna status do commander híbrido
        
        Returns:
            Dict com status
        """
        status = {
            "commander_type": "hybrid",
            "cloud_enabled": self.hybrid_manager.cloud_enabled if self.hybrid_manager else False,
            "fallback_enabled": self.hybrid_manager.fallback_enabled if self.hybrid_manager else False,
        }
        
        if self.hybrid_manager:
            status.update(self.hybrid_manager.get_status())
        
        return status


def create_hybrid_commander(
    cloud_model: Optional[str] = None,
    cloud_api_key: Optional[str] = None,
    cloud_base_url: Optional[str] = None,
    cloud_enabled: bool = True,
    local_brain_model: Optional[str] = None,
    local_executor_model: Optional[str] = None,
    fallback_enabled: bool = True,
    **kwargs
) -> HybridCommander:
    """
    Cria um HybridCommander com fallback automático
    
    Args:
        cloud_model: Modelo Cloud
        cloud_api_key: API key do Ollama Cloud
        cloud_base_url: URL base da API Cloud
        cloud_enabled: Se Cloud está habilitado
        local_brain_model: Modelo local para fallback
        local_executor_model: Modelo local para executor
        fallback_enabled: Se fallback automático está habilitado
        **kwargs: Argumentos adicionais
    
    Returns:
        HybridCommander configurado
    """
    return HybridCommander(
        cloud_model=cloud_model,
        cloud_api_key=cloud_api_key,
        cloud_base_url=cloud_base_url,
        cloud_enabled=cloud_enabled,
        local_brain_model=local_brain_model,
        local_executor_model=local_executor_model,
        fallback_enabled=fallback_enabled,
        **kwargs
    )

