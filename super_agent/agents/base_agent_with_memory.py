"""
Base Agent with ChromaDB Memory - Agente base com memória ChromaDB
Integração completa com AutoGen v2 e ChromaDB
"""
from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)

# Importar AutoGen v2 (tornar Ollama opcional devido a possíveis conflitos)
try:
    from autogen_agentchat.agents import AssistantAgent
    from autogen_ext.models.openai import OpenAIChatCompletionClient
    AUTOGEN_V2_AVAILABLE = True
    OLLAMA_AVAILABLE = False
    
    # Tentar importar Ollama (pode falhar devido a conflitos de versão)
    try:
        from autogen_ext.models.ollama import OllamaChatCompletionClient
        OLLAMA_AVAILABLE = True
    except ImportError:
        logger.warning("OllamaChatCompletionClient não disponível (pode haver conflito de versão do pacote ollama)")
        OLLAMA_AVAILABLE = False
        # Criar classe dummy
        class OllamaChatCompletionClient:
            def __init__(self, *args, **kwargs):
                raise ImportError("Ollama não disponível. Atualize o pacote ollama: pip install --upgrade ollama")
        
except ImportError as e:
    AUTOGEN_V2_AVAILABLE = False
    OLLAMA_AVAILABLE = False
    logger.warning(f"AutoGen v2 não disponível: {e}")
    # Criar classe dummy
    class AssistantAgent:
        def __init__(self, *args, **kwargs):
            raise ImportError("AutoGen v2 não está instalado. Execute: pip install autogen-agentchat autogen-ext[openai]")

from ..memory.chromadb_backend import ChromaDBBackend


class AgentWithMemory(AssistantAgent):
    """
    Agente AutoGen v2 com memória ChromaDB integrada
    Inclui capacidades de planejamento, execução e memória de contexto
    """
    
    def __init__(
        self,
        name: str,
        model_client: Any,
        memory: Optional[ChromaDBBackend] = None,
        system_message: Optional[str] = None,
        **kwargs
    ):
        """
        Inicializar agente com memória
        
        Args:
            name: Nome do agente
            model_client: Model Client (OpenAI ou Ollama)
            memory: Backend de memória ChromaDB
            system_message: Mensagem do sistema
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
        
        # Armazenar memória
        self.memory = memory
        self._context_history: List[Dict[str, Any]] = []
    
    def _create_enhanced_system_message(self, base_message: str, has_memory: bool) -> str:
        """Criar mensagem do sistema aprimorada com informações de memória"""
        enhanced = base_message
        
        if has_memory:
            enhanced += """
            
CAPACIDADES DE MEMÓRIA:
- Você tem acesso a memória persistente que armazena contexto de conversas anteriores
- Use a memória para lembrar informações importantes, preferências do usuário e contexto histórico
- Quando necessário, busque informações relevantes na memória antes de responder
- Armazene informações importantes na memória para uso futuro

CAPACIDADES DE PLANEJAMENTO:
- Você pode criar planos detalhados para tarefas complexas
- Quebre tarefas grandes em subtarefas menores e sequenciais
- Identifique dependências entre tarefas
- Ajuste planos com base em resultados intermediários

CAPACIDADES DE EXECUÇÃO:
- Você pode executar código Python, JavaScript, Shell, etc.
- Você pode executar comandos e scripts
- Você pode interagir com sistemas externos
- Sempre verifique resultados antes de prosseguir
"""
        
        return enhanced
    
    async def get_context_from_memory(self, query: str, n_results: int = 5) -> List[Dict[str, Any]]:
        """
        Buscar contexto relevante na memória
        
        Args:
            query: Consulta para buscar contexto
            n_results: Número de resultados
            
        Returns:
            Lista de resultados relevantes
        """
        if not self.memory:
            return []
        
        try:
            results = self.memory.search(query, n_results=n_results)
            logger.info(f"[{self.name}] Buscou {len(results)} resultados na memória para: {query[:50]}...")
            return results
        except Exception as e:
            logger.error(f"[{self.name}] Erro ao buscar memória: {e}")
            return []
    
    async def store_in_memory(self, text: str, metadata: Optional[Dict[str, Any]] = None) -> str:
        """
        Armazenar informação na memória
        
        Args:
            text: Texto a armazenar
            metadata: Metadados adicionais
            
        Returns:
            ID do documento armazenado
        """
        if not self.memory:
            return ""
        
        try:
            # Adicionar metadados do agente
            if metadata is None:
                metadata = {}
            metadata["agent"] = self.name
            metadata["type"] = "agent_memory"
            
            doc_id = self.memory.store(text, metadata)
            logger.info(f"[{self.name}] Armazenou informação na memória: {doc_id}")
            return doc_id
        except Exception as e:
            logger.error(f"[{self.name}] Erro ao armazenar na memória: {e}")
            return ""
    
    def add_to_context(self, role: str, content: str, metadata: Optional[Dict[str, Any]] = None):
        """
        Adicionar item ao contexto histórico do agente
        
        Args:
            role: Papel (user, assistant, system)
            content: Conteúdo da mensagem
            metadata: Metadados adicionais
        """
        self._context_history.append({
            "role": role,
            "content": content,
            "metadata": metadata or {},
            "timestamp": self._get_timestamp()
        })
    
    def get_context_summary(self, max_items: int = 10) -> str:
        """
        Obter resumo do contexto histórico
        
        Args:
            max_items: Número máximo de itens a incluir
            
        Returns:
            Resumo do contexto
        """
        if not self._context_history:
            return ""
        
        recent_items = self._context_history[-max_items:]
        summary = "Contexto histórico recente:\n"
        for item in recent_items:
            summary += f"- [{item['role']}]: {item['content'][:100]}...\n"
        
        return summary
    
    async def plan_task(self, task: str, context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Planejar tarefa (capacidade de planejamento)
        
        Args:
            task: Descrição da tarefa
            context: Contexto adicional
            
        Returns:
            Plano detalhado
        """
        # Buscar contexto relevante na memória
        memory_context = await self.get_context_from_memory(task, n_results=3)
        
        # Criar prompt de planejamento
        planning_prompt = f"""Analise a seguinte tarefa e crie um plano detalhado:

TAREFA: {task}

CONTEXTO ADICIONAL:
{context or "Nenhum contexto adicional fornecido"}

MEMÓRIA RELEVANTE:
{self._format_memory_context(memory_context)}

Crie um plano detalhado com:
1. Análise da tarefa
2. Subtarefas necessárias (em ordem)
3. Dependências entre subtarefas
4. Recursos necessários
5. Possíveis desafios e soluções

Responda em formato estruturado (lista numerada ou JSON).
"""
        
        # Armazenar tarefa na memória
        await self.store_in_memory(
            f"Tarefa planejada: {task}",
            {"type": "task_planning", "task": task, "context": context}
        )
        
        # Adicionar ao contexto
        self.add_to_context("user", task, {"type": "task_planning"})
        
        return {
            "task": task,
            "planning_prompt": planning_prompt,
            "memory_context": memory_context,
            "context": context
        }
    
    async def execute_with_memory(self, task: str, context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Executar tarefa com memória de contexto
        
        Args:
            task: Descrição da tarefa
            context: Contexto adicional
            
        Returns:
            Resultado da execução
        """
        # Buscar contexto relevante
        memory_context = await self.get_context_from_memory(task, n_results=5)
        
        # Criar prompt com contexto
        execution_prompt = f"""Execute a seguinte tarefa:

TAREFA: {task}

CONTEXTO ADICIONAL:
{context or "Nenhum contexto adicional"}

MEMÓRIA RELEVANTE:
{self._format_memory_context(memory_context)}

CONTEXTO HISTÓRICO:
{self.get_context_summary()}

Execute a tarefa passo a passo e armazene resultados importantes na memória.
"""
        
        # Adicionar ao contexto
        self.add_to_context("user", task, {"type": "execution"})
        
        return {
            "task": task,
            "execution_prompt": execution_prompt,
            "memory_context": memory_context,
            "context": context
        }
    
    def _format_memory_context(self, memory_context: List[Dict[str, Any]]) -> str:
        """Formatar contexto da memória para uso em prompts"""
        if not memory_context:
            return "Nenhuma memória relevante encontrada."
        
        formatted = "Memória relevante encontrada:\n"
        for i, item in enumerate(memory_context, 1):
            formatted += f"{i}. {item.get('text', '')[:200]}...\n"
            if item.get('metadata'):
                formatted += f"   (Metadados: {item['metadata']})\n"
        
        return formatted
    
    def _get_timestamp(self) -> str:
        """Obter timestamp atual"""
        from datetime import datetime
        return datetime.now().isoformat()
    
    async def cleanup(self):
        """Limpar recursos"""
        # Salvar contexto histórico na memória antes de limpar
        if self.memory and self._context_history:
            try:
                context_summary = self.get_context_summary(max_items=50)
                await self.store_in_memory(
                    f"Contexto histórico do agente {self.name}",
                    {"type": "context_history", "agent": self.name, "items_count": len(self._context_history)}
                )
            except Exception as e:
                logger.error(f"[{self.name}] Erro ao salvar contexto histórico: {e}")
        
        self._context_history.clear()

