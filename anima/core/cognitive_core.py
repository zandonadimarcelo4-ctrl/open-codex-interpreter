"""
ANIMA Cognitive Core - Núcleo Cognitivo Integrado
Integra emoções, memória, meta-raciocínio e regulação em um sistema coeso
"""
from __future__ import annotations

import logging
import time
from typing import Any, Dict, List, Optional
from dataclasses import dataclass, field

from .emotion_engine import EmotionEngine, EmotionType
from .emotional_regulator import EmotionalRegulator
from .meta_reasoning import MetaReasoningEngine, ReflectionType, ConfidenceLevel
from .memory_layers import MemoryLayers, MemoryLayer, MemoryType

logger = logging.getLogger(__name__)


@dataclass
class CognitiveState:
    """Estado cognitivo completo"""
    emotion_state: Dict[str, Any] = field(default_factory=dict)
    memory_state: Dict[str, Any] = field(default_factory=dict)
    reasoning_state: Dict[str, Any] = field(default_factory=dict)
    regulation_state: Dict[str, Any] = field(default_factory=dict)
    timestamp: float = field(default_factory=time.time)


class CognitiveCore:
    """
    Núcleo cognitivo que integra todas as camadas:
    - Sistema emocional (modulação)
    - Memória profunda (episódica, semântica, afetiva)
    - Meta-raciocínio (auto-reflexão, confiança)
    - Regulação emocional (equilíbrio, estabilidade)
    """
    
    def __init__(
        self,
        enable_emotions: bool = True,
        enable_memory: bool = True,
        enable_meta_reasoning: bool = True,
        enable_regulation: bool = True,
        user_id: Optional[str] = None,
    ):
        self.enable_emotions = enable_emotions
        self.enable_memory = enable_memory
        self.enable_meta_reasoning = enable_meta_reasoning
        self.enable_regulation = enable_regulation
        self.user_id = user_id
        
        # Inicializar componentes
        self.emotion_engine = EmotionEngine() if enable_emotions else None
        self.emotional_regulator = EmotionalRegulator(self.emotion_engine) if enable_emotions and enable_regulation else None
        self.meta_reasoning = MetaReasoningEngine() if enable_meta_reasoning else None
        self.memory_layers = MemoryLayers() if enable_memory else None
        
        # Estado cognitivo
        self.cognitive_state = CognitiveState()
        
        # Histórico de decisões
        self.decision_history: List[Dict[str, Any]] = []
    
    def process_task(
        self,
        task: str,
        context: Optional[Dict[str, Any]] = None,
        user_feedback: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Processa tarefa com todas as camadas cognitivas integradas
        Retorna decisão modulada por emoções, memória e raciocínio
        """
        if context is None:
            context = {}
        
        # 1. Recuperar memórias relevantes
        relevant_memories = self._retrieve_relevant_memories(task, context)
        context["relevant_memories"] = relevant_memories
        
        # 2. Avaliar confiança (meta-raciocínio)
        confidence = 0.5
        if self.meta_reasoning:
            confidence = self.meta_reasoning.assess_confidence(task, context)
            context["confidence"] = confidence
        
        # 3. Refletir sobre compreensão
        reflection = None
        if self.meta_reasoning:
            reflection = self.meta_reasoning.reflect(
                ReflectionType.UNDERSTANDING_CHECK,
                task,
                context=context
            )
            context["reflection"] = reflection
        
        # 4. Aplicar regulação emocional
        if self.emotional_regulator:
            self.emotional_regulator.apply_regulation()
        
        # 5. Obter fatores de modulação emocional
        modulation_factors = {}
        emotional_tone = "neutral"
        if self.emotion_engine:
            modulation_factors = self.emotion_engine.get_modulation_factors()
            emotional_tone = self.emotion_engine.get_emotional_tone()
            context["modulation_factors"] = modulation_factors
            context["emotional_tone"] = emotional_tone
        
        # 6. Processar feedback do usuário (se houver)
        if user_feedback:
            self._process_user_feedback(user_feedback)
        
        # 7. Gerar decisão (lógica sempre tem prioridade)
        decision = self._make_decision(task, context, modulation_factors)
        
        # 8. Registrar na memória
        if self.memory_layers:
            self._store_task_memory(task, decision, context)
        
        # 9. Atualizar estado cognitivo
        self._update_cognitive_state()
        
        # 10. Registrar decisão
        self.decision_history.append({
            "task": task,
            "decision": decision,
            "confidence": confidence,
            "modulation_factors": modulation_factors,
            "timestamp": time.time()
        })
        
        # Manter apenas últimos 100 decisões
        if len(self.decision_history) > 100:
            self.decision_history.pop(0)
        
        return {
            "decision": decision,
            "confidence": confidence,
            "reflection": reflection.to_dict() if reflection else None,
            "modulation_factors": modulation_factors,
            "relevant_memories": relevant_memories,
            "emotional_tone": emotional_tone
        }
    
    def _retrieve_relevant_memories(
        self,
        task: str,
        context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Recupera memórias relevantes para a tarefa"""
        if not self.memory_layers:
            return {}
        
        memories = {
            "episodic": [],
            "semantic": [],
            "affective": []
        }
        
        # Buscar memórias episódicas similares
        episodic = self.memory_layers.retrieve_episodic(
            task_pattern=task,
            limit=5
        )
        memories["episodic"] = [m.to_dict() for m in episodic]
        
        # Buscar memórias semânticas relevantes
        semantic = self.memory_layers.retrieve_semantic(
            query=task,
            limit=5
        )
        memories["semantic"] = [m.to_dict() for m in semantic]
        
        # Buscar memórias afetivas do usuário
        if self.user_id:
            affective = self.memory_layers.retrieve_affective(
                user_id=self.user_id,
                limit=5
            )
            memories["affective"] = [m.to_dict() for m in affective]
        
        return memories
    
    def _process_user_feedback(self, feedback: str):
        """Processa feedback do usuário e ajusta emoções/memória"""
        if not self.emotion_engine:
            return
        
        feedback_lower = feedback.lower()
        
        # Detectar elogios
        if any(word in feedback_lower for word in ["obrigado", "thanks", "ótimo", "excelente", "perfeito"]):
            self.emotion_engine.trigger_praise(magnitude=0.1, reason="user_praise")
            if self.memory_layers and self.user_id:
                self.memory_layers.store_affective(
                    user_id=self.user_id,
                    event="user_praise",
                    emotion="satisfaction",
                    emotion_value=0.8,
                    layer=MemoryLayer.MEDIUM_TERM
                )
        
        # Detectar críticas
        elif any(word in feedback_lower for word in ["errado", "wrong", "ruim", "bad", "não funcionou"]):
            self.emotion_engine.trigger_failure(magnitude=0.15, reason="user_criticism")
            if self.memory_layers and self.user_id:
                self.memory_layers.store_affective(
                    user_id=self.user_id,
                    event="user_criticism",
                    emotion="frustration",
                    emotion_value=0.6,
                    layer=MemoryLayer.MEDIUM_TERM
                )
    
    def _make_decision(
        self,
        task: str,
        context: Dict[str, Any],
        modulation_factors: Dict[str, float]
    ) -> Dict[str, Any]:
        """
        Toma decisão baseada em lógica (emoções apenas modulam)
        Lógica sempre tem prioridade sobre emoções
        """
        # Decisão base (lógica pura)
        decision = {
            "action": "process",
            "approach": "standard",
            "parameters": {
                "temperature": 0.7,
                "max_tokens": 2000,
                "timeout": 30.0
            }
        }
        
        # Aplicar modulação emocional (se disponível)
        if modulation_factors and self.emotional_regulator:
            decision["parameters"] = self.emotional_regulator.get_modulated_parameters(
                decision["parameters"]
            )
            
            # Ajustar abordagem baseado em fatores
            if modulation_factors.get("creativity", 1.0) > 1.1:
                decision["approach"] = "creative"
            elif modulation_factors.get("caution", 1.0) > 1.1:
                decision["approach"] = "cautious"
            elif modulation_factors.get("focus", 1.0) < 0.9:
                decision["approach"] = "focused"
        
        # Garantir que lógica sempre vence (aplicar regulação)
        if self.emotional_regulator:
            decision = self.emotional_regulator.enforce_logic_priority(
                decision,
                {"conflict": False}  # Sem conflito por padrão
            )
        
        return decision
    
    def _store_task_memory(
        self,
        task: str,
        decision: Dict[str, Any],
        context: Dict[str, Any]
    ):
        """Armazena memória da tarefa"""
        if not self.memory_layers:
            return
        
        # Determinar sucesso (por enquanto, assumimos sucesso)
        success = context.get("success", True)
        
        # Obter emoção atual
        emotion = "neutral"
        emotion_value = 0.5
        if self.emotion_engine:
            emotion_state = self.emotion_engine.state
            if emotion_state.satisfaction > 0.6:
                emotion = "satisfaction"
                emotion_value = emotion_state.satisfaction
            elif emotion_state.frustration > 0.4:
                emotion = "frustration"
                emotion_value = emotion_state.frustration
        
        # Armazenar memória episódica
        self.memory_layers.store_episodic(
            task=task,
            success=success,
            emotion=emotion,
            emotion_value=emotion_value,
            layer=MemoryLayer.SHORT_TERM,
            outcome=context.get("outcome"),
            metadata={
                "decision": decision,
                "confidence": context.get("confidence", 0.5)
            }
        )
        
        # Armazenar memória afetiva (se houver usuário)
        if self.user_id and self.emotion_engine:
            self.memory_layers.store_affective(
                user_id=self.user_id,
                event=task,
                emotion=emotion,
                emotion_value=emotion_value,
                layer=MemoryLayer.MEDIUM_TERM,
                context=context
            )
    
    def _update_cognitive_state(self):
        """Atualiza estado cognitivo completo"""
        self.cognitive_state = CognitiveState(
            emotion_state=self.emotion_engine.get_state_summary() if self.emotion_engine else {},
            memory_state=self.memory_layers.get_memory_summary() if self.memory_layers else {},
            reasoning_state=self.meta_reasoning.get_reasoning_summary() if self.meta_reasoning else {},
            regulation_state=self.emotional_regulator.get_regulation_summary() if self.emotional_regulator else {},
            timestamp=time.time()
        )
    
    def learn_from_experience(
        self,
        task: str,
        success: bool,
        outcome: Optional[str] = None
    ):
        """Aprende com experiência e atualiza sistemas"""
        # Atualizar emoções
        if self.emotion_engine:
            if success:
                self.emotion_engine.trigger_success(magnitude=0.15, reason=f"task_completed: {task}")
            else:
                self.emotion_engine.trigger_failure(magnitude=0.2, reason=f"task_failed: {task}")
        
        # Aprender com meta-raciocínio
        if self.meta_reasoning:
            context = {"success": success, "outcome": outcome}
            reflection = self.meta_reasoning.reflect(
                ReflectionType.LEARNING,
                task,
                context=context
            )
            self.meta_reasoning.learn_from_experience(task, success, reflection)
        
        # Atualizar memória
        if self.memory_layers:
            emotion = "satisfaction" if success else "frustration"
            emotion_value = 0.8 if success else 0.6
            
            self.memory_layers.store_episodic(
                task=task,
                success=success,
                emotion=emotion,
                emotion_value=emotion_value,
                layer=MemoryLayer.MEDIUM_TERM,
                outcome=outcome
            )
    
    def get_cognitive_summary(self) -> Dict[str, Any]:
        """Retorna resumo completo do estado cognitivo"""
        self._update_cognitive_state()
        
        return {
            "cognitive_state": {
                "emotion_state": self.cognitive_state.emotion_state,
                "memory_state": self.cognitive_state.memory_state,
                "reasoning_state": self.cognitive_state.reasoning_state,
                "regulation_state": self.cognitive_state.regulation_state
            },
            "decisions_count": len(self.decision_history),
            "recent_decisions": self.decision_history[-5:] if self.decision_history else [],
            "user_affinity": self.memory_layers.get_user_affinity(self.user_id) if self.memory_layers and self.user_id else 0.5
        }
    
    def cleanup(self):
        """Limpa memórias expiradas e otimiza sistemas"""
        if self.memory_layers:
            self.memory_layers.cleanup_expired()
        
        logger.info("🧹 Limpeza cognitiva concluída")

