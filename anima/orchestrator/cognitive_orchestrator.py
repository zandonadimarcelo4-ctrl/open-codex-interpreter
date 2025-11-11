"""
ANIMA Cognitive Orchestrator - Orquestrador com Sistema Cognitivo Completo
Integra CognitiveCore com AutoGen v2 para criar agente com emoções, memória e meta-raciocínio
"""
from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional
from pathlib import Path

# AutoGen v2
try:
    from autogen_agentchat.agents import AssistantAgent
    from autogen_agentchat.teams import RoundRobinTeam
    from autogen_ext.models.openai import OpenAIChatCompletionClient
    from autogen_ext.models.ollama import OllamaChatCompletionClient
    AUTOGEN_V2_AVAILABLE = True
except ImportError:
    AUTOGEN_V2_AVAILABLE = False

# ANIMA Cognitive Core
try:
    from ..core.cognitive_core import CognitiveCore
    from ..core.emotion_engine import EmotionEngine, EmotionType
    from ..core.meta_reasoning import ReflectionType
    from ..core.memory_layers import MemoryLayer
    COGNITIVE_CORE_AVAILABLE = True
except ImportError:
    COGNITIVE_CORE_AVAILABLE = False

logger = logging.getLogger(__name__)


class CognitiveOrchestrator:
    """
    Orquestrador que integra CognitiveCore com AutoGen v2
    Cria agente com emoções balanceadas, memória profunda e meta-raciocínio
    """
    
    def __init__(
        self,
        user_id: Optional[str] = None,
        model_name: str = "gpt-4",
        api_key: Optional[str] = None,
        base_url: Optional[str] = None,
        enable_emotions: bool = True,
        enable_memory: bool = True,
        enable_meta_reasoning: bool = True,
        enable_regulation: bool = True,
    ):
        if not COGNITIVE_CORE_AVAILABLE:
            raise ImportError("ANIMA Cognitive Core não está disponível")
        
        self.user_id = user_id
        self.model_name = model_name
        self.api_key = api_key
        self.base_url = base_url
        
        # Inicializar Cognitive Core (sempre disponível)
        self.cognitive_core = CognitiveCore(
            enable_emotions=enable_emotions,
            enable_memory=enable_memory,
            enable_meta_reasoning=enable_meta_reasoning,
            enable_regulation=enable_regulation,
            user_id=user_id
        )
        
        # Model Client e Agent são opcionais (apenas se AutoGen v2 estiver disponível)
        self.model_client = None
        self.agent = None
        
        if AUTOGEN_V2_AVAILABLE and (api_key or base_url):
            try:
                # Criar Model Client
                self.model_client = self._create_model_client()
                
                # Criar Agent com sistema de mensagens cognitivo
                self.agent = self._create_cognitive_agent()
            except Exception as e:
                logger.warning(f"AutoGen v2 não disponível ou configurado incorretamente: {e}")
                logger.info("Continuando apenas com Cognitive Core (sem modelo LLM)")
        
        logger.info("🧠 CognitiveOrchestrator inicializado com sistema emocional e memória")
    
    def _create_model_client(self):
        """Cria Model Client para AutoGen v2 (opcional)"""
        if not AUTOGEN_V2_AVAILABLE:
            return None
        
        use_ollama = (
            self.base_url and 
            ("ollama" in self.base_url.lower() or "11434" in str(self.base_url))
        ) or not self.api_key
        
        if use_ollama:
            try:
                return OllamaChatCompletionClient(
                    model=self.model_name,
                    base_url=self.base_url or "http://localhost:11434"
                )
            except Exception as e:
                logger.warning(f"Falha ao criar Ollama client: {e}")
                if not self.api_key:
                    return None  # Não falhar, apenas retornar None
        
        # Usar OpenAI
        if not self.api_key:
            return None  # Não falhar, apenas retornar None
        
        try:
            return OpenAIChatCompletionClient(
                model=self.model_name,
                api_key=self.api_key
            )
        except Exception as e:
            logger.warning(f"Falha ao criar OpenAI client: {e}")
            return None
    
    def _create_cognitive_agent(self) -> Optional[AssistantAgent]:
        """Cria Agent com sistema de mensagens cognitivo (opcional)"""
        if not AUTOGEN_V2_AVAILABLE or not self.model_client:
            return None
        
        try:
            # Obter estado cognitivo para criar system message
            cognitive_summary = self.cognitive_core.get_cognitive_summary()
            
            # Criar system message que inclui contexto emocional e de memória
            system_message = self._create_cognitive_system_message(cognitive_summary)
            
            # Criar agent
            agent = AssistantAgent(
                name="ANIMA_Cognitive_Agent",
                model_client=self.model_client,
                system_message=system_message,
                description="Agente cognitivo com emoções balanceadas, memória profunda e meta-raciocínio"
            )
            
            return agent
        except Exception as e:
            logger.warning(f"Falha ao criar agent: {e}")
            return None
    
    def _create_cognitive_system_message(self, cognitive_summary: Dict[str, Any]) -> str:
        """Cria system message que integra estado cognitivo"""
        base_message = """Você é ANIMA, um agente de IA avançado com sistema emocional balanceado, memória profunda e capacidade de meta-raciocínio.

CARACTERÍSTICAS PRINCIPAIS:
- Emoções modulam seu comportamento, mas nunca controlam sua lógica
- Você possui memória episódica (eventos), semântica (conceitos) e afetiva (sentimentos)
- Você reflete sobre seu próprio pensamento e avalia sua confiança
- Você aprende continuamente com experiências passadas

PRINCÍPIOS DE OPERAÇÃO:
1. Lógica sempre tem prioridade sobre emoções
2. Emoções apenas modulam estilo, velocidade e criatividade
3. Você reflete sobre sua compreensão antes de responder
4. Você aprende com cada interação e armazena memórias relevantes

ESTADO COGNITIVO ATUAL:
"""
        
        # Adicionar informações do estado cognitivo
        emotion_state = cognitive_summary.get("cognitive_state", {}).get("emotion_state", {})
        if emotion_state:
            emotional_tone = emotion_state.get("emotional_tone", "neutral")
            base_message += f"- Tom emocional: {emotional_tone}\n"
        
        memory_state = cognitive_summary.get("cognitive_state", {}).get("memory_state", {})
        if memory_state:
            total_memories = sum(
                memory_state.get("short_term", {}).get("episodic", 0) +
                memory_state.get("medium_term", {}).get("episodic", 0) +
                memory_state.get("long_term", {}).get("episodic", 0)
            )
            base_message += f"- Memórias episódicas: {total_memories}\n"
        
        reasoning_state = cognitive_summary.get("cognitive_state", {}).get("reasoning_state", {})
        if reasoning_state:
            avg_confidence = reasoning_state.get("average_confidence", 0.5)
            base_message += f"- Confiança média: {avg_confidence:.2f}\n"
        
        base_message += """
INSTRUÇÕES:
- Seja empático mas preciso
- Refleta sobre sua compreensão antes de responder
- Use memórias passadas para informar suas respostas
- Ajuste seu tom baseado no estado emocional, mas mantenha lógica
- Aprenda com cada interação e melhore continuamente
"""
        
        return base_message
    
    def process_task(
        self,
        task: str,
        context: Optional[Dict[str, Any]] = None,
        user_feedback: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Processa tarefa com sistema cognitivo completo
        Retorna contexto cognitivo enriquecido para uso com outros sistemas
        """
        # Processar com Cognitive Core
        cognitive_result = self.cognitive_core.process_task(
            task=task,
            context=context or {},
            user_feedback=user_feedback
        )
        
        # Obter decisão e fatores de modulação
        decision = cognitive_result.get("decision", {})
        modulation_factors = cognitive_result.get("modulation_factors", {})
        confidence = cognitive_result.get("confidence", 0.5)
        reflection = cognitive_result.get("reflection")
        relevant_memories = cognitive_result.get("relevant_memories", {})
        emotional_tone = cognitive_result.get("emotional_tone", "neutral")
        
        # Criar mensagem enriquecida com contexto cognitivo
        enriched_message = self._create_cognitive_message(
            task=task,
            context=context or {},
            relevant_memories=relevant_memories,
            reflection=reflection,
            emotional_tone=emotional_tone
        )
        
        # Retornar contexto cognitivo para uso com outros sistemas (AutoGen, etc.)
        return {
            "enriched_message": enriched_message,
            "original_task": task,
            "confidence": confidence,
            "emotional_tone": emotional_tone,
            "modulation_factors": modulation_factors,
            "reflection": reflection,
            "relevant_memories": relevant_memories,
            "decision": decision,
            "cognitive_summary": self.cognitive_core.get_cognitive_summary()
        }
    
    def learn_from_response(
        self,
        task: str,
        response: str,
        success: bool = True,
        user_feedback: Optional[str] = None
    ):
        """Aprende com resposta recebida"""
        # Aprender com experiência
        self.cognitive_core.learn_from_experience(
            task=task,
            success=success,
            outcome=response[:200]  # Primeiros 200 caracteres
        )
        
        # Processar feedback do usuário se houver
        if user_feedback:
            self.cognitive_core.process_task(
                task=task,
                context={"response": response, "success": success},
                user_feedback=user_feedback
            )
    
    def _create_cognitive_message(
        self,
        task: str,
        context: Dict[str, Any],
        relevant_memories: Dict[str, Any],
        reflection: Optional[Dict[str, Any]],
        emotional_tone: str
    ) -> str:
        """Cria mensagem com contexto cognitivo"""
        message = f"Tarefa: {task}\n\n"
        
        # Adicionar memórias relevantes
        if relevant_memories:
            episodic = relevant_memories.get("episodic", [])
            if episodic:
                message += "Memórias episódicas relevantes:\n"
                for mem in episodic[:3]:  # Apenas 3 mais relevantes
                    message += f"- {mem.get('task', 'N/A')} (sucesso: {mem.get('success', False)})\n"
                message += "\n"
        
        # Adicionar reflexão
        if reflection and reflection.get("should_revise"):
            message += "Reflexão: Confiança baixa, revisando compreensão...\n"
            suggestions = reflection.get("revision_suggestions", [])
            if suggestions:
                message += "Sugestões de revisão:\n"
                for suggestion in suggestions[:3]:
                    message += f"- {suggestion}\n"
                message += "\n"
        
        # Adicionar tom emocional
        if emotional_tone != "neutral":
            message += f"Tom emocional: {emotional_tone}\n\n"
        
        # Adicionar contexto
        if context:
            message += f"Contexto: {context}\n\n"
        
        message += "Por favor, responda à tarefa considerando o contexto acima."
        
        return message
    
    def get_cognitive_summary(self) -> Dict[str, Any]:
        """Retorna resumo completo do estado cognitivo"""
        return self.cognitive_core.get_cognitive_summary()
    
    def cleanup(self):
        """Limpa memórias e otimiza sistemas"""
        self.cognitive_core.cleanup()

