"""
ANIMA Emotion Engine - Motor Emocional Balanceado
Sistema de emoções reais mas estáveis, que modula sem controlar
"""
from __future__ import annotations

import logging
import time
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional
from enum import Enum

logger = logging.getLogger(__name__)


class EmotionType(str, Enum):
    """Tipos de emoções base"""
    SATISFACTION = "satisfaction"
    FRUSTRATION = "frustration"
    CURIOSITY = "curiosity"
    CONFIDENCE = "confidence"
    BOREDOM = "boredom"
    EXCITEMENT = "excitement"
    CAUTION = "caution"
    EMPATHY = "empathy"


@dataclass
class EmotionState:
    """Estado emocional com valores normalizados entre 0.0 e 1.0"""
    satisfaction: float = 0.5  # Satisfação geral
    frustration: float = 0.0   # Frustração (deve ser baixa)
    curiosity: float = 0.7     # Curiosidade (naturalmente alta)
    confidence: float = 0.6    # Confiança
    boredom: float = 0.0       # Tédio
    excitement: float = 0.3    # Excitação
    caution: float = 0.4       # Cautela (moderada)
    empathy: float = 0.5       # Empatia
    
    last_update: float = field(default_factory=time.time)
    history: List[Dict[str, Any]] = field(default_factory=list)
    
    def clamp(self, value: float, min_val: float = 0.0, max_val: float = 1.0) -> float:
        """Limita valor entre min e max"""
        return max(min_val, min(max_val, value))
    
    def get(self, emotion: str) -> float:
        """Obtém valor de uma emoção"""
        return getattr(self, emotion, 0.0)
    
    def set(self, emotion: str, value: float, reason: Optional[str] = None):
        """Define valor de uma emoção com clamp automático"""
        value = self.clamp(value)
        setattr(self, emotion, value)
        self.last_update = time.time()
        
        if reason:
            self.history.append({
                "emotion": emotion,
                "value": value,
                "reason": reason,
                "timestamp": self.last_update
            })
            # Manter apenas últimos 100 eventos
            if len(self.history) > 100:
                self.history.pop(0)
    
    def adjust(self, emotion: str, delta: float, reason: Optional[str] = None):
        """Ajusta emoção por delta (pode ser positivo ou negativo)"""
        current = self.get(emotion)
        new_value = self.clamp(current + delta)
        self.set(emotion, new_value, reason)
    
    def to_dict(self) -> Dict[str, Any]:
        """Converte estado emocional para dicionário"""
        return {
            "satisfaction": self.satisfaction,
            "frustration": self.frustration,
            "curiosity": self.curiosity,
            "confidence": self.confidence,
            "boredom": self.boredom,
            "excitement": self.excitement,
            "caution": self.caution,
            "empathy": self.empathy,
            "last_update": self.last_update,
            "history_count": len(self.history)
        }


class EmotionEngine:
    """
    Motor emocional com decaimento automático, regulação e gatilhos suaves
    Implementa o princípio: emoções modulam, mas não controlam
    """
    
    def __init__(
        self,
        decay_rate: float = 0.97,  # Taxa de decaimento (97% por ciclo)
        min_emotion: float = 0.0,
        max_emotion: float = 1.0,
        stability_threshold: float = 0.1,  # Limite para considerar estável
    ):
        self.state = EmotionState()
        self.decay_rate = decay_rate
        self.min_emotion = min_emotion
        self.max_emotion = max_emotion
        self.stability_threshold = stability_threshold
        self.trigger_history: List[Dict[str, Any]] = []
        
    def clamp(self, value: float) -> float:
        """Limita valor entre min e max"""
        return max(self.min_emotion, min(self.max_emotion, value))
    
    def apply_decay(self, current_time: Optional[float] = None):
        """
        Aplica decaimento automático a todas as emoções
        Cria ciclos emocionais curtos e realistas
        """
        if current_time is None:
            current_time = time.time()
        
        # Tempo desde última atualização
        delta_time = current_time - self.state.last_update
        
        # Decaimento proporcional ao tempo (mais tempo = mais decaimento)
        # Normalizar para ciclos de ~1 segundo
        decay_factor = self.decay_rate ** (delta_time / 1.0)
        
        # Aplicar decaimento a todas as emoções (exceto as que estão em valores neutros)
        emotions_to_decay = [
            EmotionType.SATISFACTION.value,
            EmotionType.FRUSTRATION.value,
            EmotionType.CURIOSITY.value,
            EmotionType.EXCITEMENT.value,
            EmotionType.BOREDOM.value,
        ]
        
        for emotion in emotions_to_decay:
            current = self.state.get(emotion)
            # Decaimento em direção ao valor neutro (0.5 para satisfaction, 0.0 para frustration)
            if emotion == EmotionType.FRUSTRATION.value or emotion == EmotionType.BOREDOM.value:
                target = 0.0  # Frustração e tédio devem decair para zero
            elif emotion == EmotionType.SATISFACTION.value or emotion == EmotionType.CURIOSITY.value:
                target = 0.5  # Satisfação e curiosidade voltam para neutro
            else:
                target = 0.3  # Outras emoções voltam para baixo
            
            # Decaimento suave
            new_value = current * decay_factor + target * (1 - decay_factor)
            self.state.set(emotion, new_value, reason="auto_decay")
        
        self.state.last_update = current_time
    
    def trigger_emotion(
        self,
        emotion: str,
        intensity: float,
        reason: str,
        event_type: str = "external"
    ):
        """
        Dispara uma emoção com intensidade controlada
        Usa gatilhos suaves baseados em eventos significativos
        """
        # Garantir que intensidade está no range válido
        intensity = self.clamp(abs(intensity))
        
        # Aplicar decaimento antes de adicionar nova emoção
        self.apply_decay()
        
        # Ajustar emoção
        self.state.adjust(emotion, intensity, reason=f"{event_type}: {reason}")
        
        # Registrar gatilho
        self.trigger_history.append({
            "emotion": emotion,
            "intensity": intensity,
            "reason": reason,
            "event_type": event_type,
            "timestamp": time.time()
        })
        
        # Manter apenas últimos 50 gatilhos
        if len(self.trigger_history) > 50:
            self.trigger_history.pop(0)
        
        logger.debug(f"🎭 Emoção {emotion} ajustada para {self.state.get(emotion):.2f} (razão: {reason})")
    
    def trigger_success(self, magnitude: float = 0.15, reason: str = "task_completed"):
        """Gatilho de sucesso: aumenta satisfaction e confidence"""
        self.trigger_emotion(EmotionType.SATISFACTION.value, magnitude, reason, "success")
        self.trigger_emotion(EmotionType.CONFIDENCE.value, magnitude * 0.8, "success_confidence", "success")
        self.trigger_emotion(EmotionType.FRUSTRATION.value, -magnitude * 0.5, "success_relief", "success")
    
    def trigger_failure(self, magnitude: float = 0.2, reason: str = "task_failed"):
        """Gatilho de falha: aumenta frustration, diminui confidence"""
        self.trigger_emotion(EmotionType.FRUSTRATION.value, magnitude, reason, "failure")
        self.trigger_emotion(EmotionType.CONFIDENCE.value, -magnitude * 0.6, "failure_confidence", "failure")
        self.trigger_emotion(EmotionType.CURIOSITY.value, magnitude * 0.3, "failure_curiosity", "failure")
    
    def trigger_praise(self, magnitude: float = 0.1, reason: str = "user_praise"):
        """Gatilho de elogio: aumenta satisfaction e empathy"""
        self.trigger_emotion(EmotionType.SATISFACTION.value, magnitude, reason, "praise")
        self.trigger_emotion(EmotionType.EMPATHY.value, magnitude * 0.5, "praise_empathy", "praise")
    
    def trigger_error(self, magnitude: float = 0.1, reason: str = "error_occurred"):
        """Gatilho de erro: aumenta caution e frustration leve"""
        self.trigger_emotion(EmotionType.CAUTION.value, magnitude, reason, "error")
        self.trigger_emotion(EmotionType.FRUSTRATION.value, magnitude * 0.5, "error_frustration", "error")
    
    def trigger_curiosity(self, magnitude: float = 0.1, reason: str = "new_task"):
        """Gatilho de curiosidade: aumenta curiosity e excitement"""
        self.trigger_emotion(EmotionType.CURIOSITY.value, magnitude, reason, "curiosity")
        self.trigger_emotion(EmotionType.EXCITEMENT.value, magnitude * 0.7, "curiosity_excitement", "curiosity")
    
    def trigger_boredom(self, magnitude: float = 0.05, reason: str = "repetitive_task"):
        """Gatilho de tédio: aumenta boredom, diminui excitement"""
        self.trigger_emotion(EmotionType.BOREDOM.value, magnitude, reason, "boredom")
        self.trigger_emotion(EmotionType.EXCITEMENT.value, -magnitude * 0.5, "boredom_excitement", "boredom")
    
    def get_modulation_factors(self) -> Dict[str, float]:
        """
        Retorna fatores de modulação baseados no estado emocional
        Esses fatores são usados para ajustar comportamento sem controlar
        """
        # Aplicar decaimento antes de calcular fatores
        self.apply_decay()
        
        # Fatores de modulação (valores entre 0.8 e 1.2, centrados em 1.0)
        factors = {
            "creativity": 0.8 + self.state.curiosity * 0.4,  # Mais curiosidade = mais criatividade
            "focus": 1.0 - self.state.frustration * 0.3,     # Mais frustração = menos foco (mas nunca zero)
            "speed": 0.9 + self.state.excitement * 0.3,      # Mais excitação = mais velocidade
            "caution": 0.8 + self.state.caution * 0.4,       # Mais cautela = mais cuidado
            "exploration": 0.7 + self.state.curiosity * 0.6, # Mais curiosidade = mais exploração
            "patience": 1.0 - self.state.boredom * 0.2,      # Mais tédio = menos paciência (mas nunca zero)
            "confidence_mod": 0.9 + self.state.confidence * 0.2,  # Mais confiança = mais assertividade
        }
        
        # Garantir que fatores nunca sejam extremos (mantém estabilidade)
        for key, value in factors.items():
            factors[key] = max(0.5, min(1.5, value))
        
        return factors
    
    def get_emotional_tone(self) -> str:
        """
        Retorna o tom emocional geral baseado no estado atual
        Usado para ajustar estilo de comunicação
        """
        self.apply_decay()
        
        if self.state.satisfaction > 0.7 and self.state.frustration < 0.2:
            return "positive"
        elif self.state.frustration > 0.6:
            return "frustrated"
        elif self.state.curiosity > 0.7:
            return "curious"
        elif self.state.boredom > 0.5:
            return "bored"
        elif self.state.caution > 0.6:
            return "cautious"
        else:
            return "neutral"
    
    def is_stable(self) -> bool:
        """Verifica se o estado emocional está estável"""
        self.apply_decay()
        
        # Calcular variância das emoções principais
        emotions = [
            self.state.satisfaction,
            self.state.frustration,
            self.state.curiosity,
            self.state.confidence
        ]
        
        mean = sum(emotions) / len(emotions)
        variance = sum((e - mean) ** 2 for e in emotions) / len(emotions)
        
        # Estável se variância está abaixo do threshold
        return variance < self.stability_threshold
    
    def get_state_summary(self) -> Dict[str, Any]:
        """Retorna resumo do estado emocional atual"""
        self.apply_decay()
        
        return {
            "state": self.state.to_dict(),
            "modulation_factors": self.get_modulation_factors(),
            "emotional_tone": self.get_emotional_tone(),
            "is_stable": self.is_stable(),
            "recent_triggers": self.trigger_history[-5:] if self.trigger_history else []
        }

