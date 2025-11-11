"""
Memory-Enabled Agent - Agente com memória ChromaDB integrada de forma profunda
Usa hooks do AutoGen v2 para buscar e armazenar memória automaticamente
"""
from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional, Callable

logger = logging.getLogger(__name__)

try:
    from autogen_agentchat.agents import AssistantAgent
    from autogen_agentchat.events import Event, MessageEvent
    AUTOGEN_V2_AVAILABLE = True
except ImportError as e:
    AUTOGEN_V2_AVAILABLE = False
    logger.warning(f"AutoGen v2 não disponível: {e}")
    # Criar classe dummy
    class AssistantAgent:
        def __init__(self, *args, **kwargs):
            raise ImportError("AutoGen v2 não está instalado. Execute: pip install autogen-agentchat autogen-ext[openai]")

from ..memory.chromadb_backend import ChromaDBBackend


class MemoryEnabledAgent(AssistantAgent):
    """
    Agente AutoGen v2 com memória ChromaDB integrada profundamente
    Busca e armazena memória automaticamente durante as conversas
    """
    
    def __init__(
        self,
        name: str,
        model_client: Any,
        memory: Optional[ChromaDBBackend] = None,
        system_message: Optional[str] = None,
        memory_search_enabled: bool = True,
        memory_store_enabled: bool = True,
        **kwargs
    ):
        """
        Inicializar agente com memória
        
        Args:
            name: Nome do agente
            model_client: Model Client (OpenAI ou Ollama)
            memory: Backend de memória ChromaDB
            system_message: Mensagem do sistema
            memory_search_enabled: Habilitar busca automática na memória
            memory_store_enabled: Habilitar armazenamento automático na memória
            **kwargs: Argumentos adicionais para AssistantAgent
        """
        if not AUTOGEN_V2_AVAILABLE:
            raise ImportError("AutoGen v2 (autogen-agentchat) é obrigatório")
        
        # Criar mensagem do sistema com informações de memória
        enhanced_system_message = self._create_enhanced_system_message(
            system_message or "Você é um assistente útil.",
            memory is not None
        )
        
        # Inicializar AssistantAgent
        super().__init__(
            name=name,
            model_client=model_client,
            system_message=enhanced_system_message,
            **kwargs
        )
        
        # Armazenar memória e configurações
        self.memory = memory
        self.memory_search_enabled = memory_search_enabled
        self.memory_store_enabled = memory_store_enabled
        self._context_history: List[Dict[str, Any]] = []
        
        # Registrar hooks para interceptar mensagens
        if self.memory:
            self._register_memory_hooks()
    
    def _create_enhanced_system_message(self, base_message: str, has_memory: bool) -> str:
        """Criar mensagem do sistema aprimorada com informações de memória"""
        enhanced = base_message
        
        if has_memory:
            enhanced += """

IMPORTANTE - MEMÓRIA E CONTEXTO:
- Você tem acesso a memória persistente que armazena TODAS as conversas e informações anteriores
- O contexto da memória será fornecido automaticamente antes de cada mensagem
- SEMPRE use as informações da memória quando fornecidas para responder de forma consistente
- Se a memória contém informações sobre o usuário, preferências, ou conversas anteriores, USE essas informações
- Sempre referencie informações da memória quando relevante: "Como mencionado anteriormente...", "Lembro que você disse...", etc.
- Se a memória não contiver informações relevantes, proceda normalmente
- Suas respostas serão automaticamente armazenadas na memória para referência futura

CAPACIDADES:
- Planejamento: Criar planos detalhados para tarefas complexas
- Execução: Executar código, comandos e scripts
- Memória: Consultar e usar contexto histórico automaticamente
"""
        
        return enhanced
    
    def _register_memory_hooks(self):
        """Registrar hooks para buscar e armazenar memória automaticamente"""
        try:
            # Hook para antes de processar mensagem (buscar memória)
            if self.memory_search_enabled:
                # AutoGen v2 usa eventos, vamos interceptar através de um wrapper
                self._original_on_event = getattr(self, 'on_event', None)
                if self._original_on_event is None:
                    # Se não existir, criar um método que será chamado
                    pass
        except Exception as e:
            logger.warning(f"Erro ao registrar hooks de memória: {e}")
    
    async def _enrich_message_with_memory(self, message: str) -> str:
        """
        Enriquecer mensagem com contexto da memória
        
        Args:
            message: Mensagem original
            
        Returns:
            Mensagem enriquecida com contexto da memória
        """
        if not self.memory or not self.memory_search_enabled:
            return message
        
        try:
            # Buscar contexto relevante na memória
            memory_context = self.memory.search(message, n_results=5)
            
            if not memory_context:
                return message
            
            # Criar contexto formatado
            context_text = "\n\n=== MEMÓRIA E CONTEXTO ANTERIOR ===\n"
            context_text += "As seguintes informações foram encontradas na memória e são relevantes para esta conversa:\n\n"
            
            for i, item in enumerate(memory_context, 1):
                text = item.get('text', '')
                metadata = item.get('metadata', {})
                
                # Formatar contexto
                context_text += f"{i}. {text[:400]}"
                if len(text) > 400:
                    context_text += "..."
                context_text += "\n"
                
                # Adicionar metadados se disponíveis
                if metadata:
                    if 'timestamp' in metadata:
                        context_text += f"   (Data: {metadata['timestamp']})\n"
                    if 'agent' in metadata:
                        context_text += f"   (Agente: {metadata['agent']})\n"
                context_text += "\n"
            
            context_text += "=== FIM DO CONTEXTO DA MEMÓRIA ===\n\n"
            context_text += "INSTRUÇÃO: Use as informações acima para responder de forma consistente com o contexto histórico. "
            context_text += "Se houver informações sobre o usuário, preferências, ou conversas anteriores, USE essas informações.\n\n"
            
            # Adicionar contexto antes da mensagem
            enriched_message = context_text + f"MENSAGEM DO USUÁRIO: {message}"
            
            logger.info(f"[{self.name}] Mensagem enriquecida com {len(memory_context)} itens da memória")
            return enriched_message
            
        except Exception as e:
            logger.error(f"[{self.name}] Erro ao enriquecer mensagem com memória: {e}")
            return message
    
    async def _store_response_in_memory(self, user_message: str, agent_response: str):
        """
        Armazenar resposta na memória
        
        Args:
            user_message: Mensagem do usuário
            agent_response: Resposta do agente
        """
        if not self.memory or not self.memory_store_enabled:
            return
        
        try:
            # Armazenar mensagem do usuário
            self.memory.store(
                f"Usuário: {user_message}",
                {
                    "type": "user_message",
                    "agent": self.name,
                    "timestamp": self._get_timestamp()
                }
            )
            
            # Armazenar resposta do agente
            self.memory.store(
                f"{self.name}: {agent_response}",
                {
                    "type": "agent_response",
                    "agent": self.name,
                    "user_message": user_message[:200],  # Primeiros 200 caracteres
                    "timestamp": self._get_timestamp()
                }
            )
            
            logger.info(f"[{self.name}] Resposta armazenada na memória")
            
        except Exception as e:
            logger.error(f"[{self.name}] Erro ao armazenar resposta na memória: {e}")
    
    def _get_timestamp(self) -> str:
        """Obter timestamp atual"""
        from datetime import datetime
        return datetime.now().isoformat()
    
    # Sobrescrever método para interceptar mensagens
    async def on_event(self, event: Event) -> None:
        """
        Interceptar eventos do AutoGen v2 para buscar e armazenar memória
        """
        try:
            # Se for um evento de mensagem, processar memória
            if isinstance(event, MessageEvent):
                # Buscar memória antes de processar
                if hasattr(event, 'content') and event.content:
                    # Enriquecer mensagem com memória (se for mensagem do usuário)
                    if hasattr(event, 'source') and event.source != self.name:
                        # É uma mensagem de outro agente/usuário
                        enriched_content = await self._enrich_message_with_memory(event.content)
                        # Atualizar conteúdo do evento (se possível)
                        if hasattr(event, 'content'):
                            event.content = enriched_content
                
                # Chamar método original se existir
                if hasattr(super(), 'on_event'):
                    await super().on_event(event)
                else:
                    # Processar evento normalmente
                    pass
            else:
                # Chamar método original para outros eventos
                if hasattr(super(), 'on_event'):
                    await super().on_event(event)
        except Exception as e:
            logger.error(f"[{self.name}] Erro ao processar evento: {e}")
            # Chamar método original mesmo em caso de erro
            if hasattr(super(), 'on_event'):
                await super().on_event(event)


# Criar alias para compatibilidade
AgentWithMemory = MemoryEnabledAgent

