"""
ANIMA Meta-Reasoning - Meta-Raciocínio e Auto-Reflexão
O agente pensa sobre o próprio pensamento, avaliando confiança e qualidade
"""
from __future__ import annotations

import logging
import time
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Callable
from enum import Enum

logger = logging.getLogger(__name__)


class ConfidenceLevel(str, Enum):
    """Níveis de confiança"""
    VERY_LOW = "very_low"      # < 0.3
    LOW = "low"                # 0.3 - 0.5
    MEDIUM = "medium"          # 0.5 - 0.7
    HIGH = "high"              # 0.7 - 0.9
    VERY_HIGH = "very_high"    # > 0.9


class ReflectionType(str, Enum):
    """Tipos de reflexão"""
    QUALITY_CHECK = "quality_check"        # Verificar qualidade da resposta
    UNDERSTANDING_CHECK = "understanding_check"  # Verificar se entendeu corretamente
    OPTIMIZATION = "optimization"          # Otimizar abordagem
    ERROR_ANALYSIS = "error_analysis"      # Analisar erros
    LEARNING = "learning"                  # Aprender com experiência


@dataclass
class ReflectionResult:
    """Resultado de uma reflexão"""
    reflection_type: ReflectionType
    confidence: float  # 0.0 - 1.0
    confidence_level: ConfidenceLevel
    should_revise: bool
    revision_suggestions: List[str] = field(default_factory=list)
    insights: List[str] = field(default_factory=list)
    timestamp: float = field(default_factory=time.time)


@dataclass
class ReasoningTrace:
    """Rastreamento de raciocínio"""
    step: int
    action: str
    reasoning: str
    confidence: float
    outcome: Optional[str] = None
    timestamp: float = field(default_factory=time.time)


class MetaReasoningEngine:
    """
    Motor de meta-raciocínio que avalia o próprio pensamento
    Implementa: confiança, auto-avaliação, reflexão iterativa
    """
    
    def __init__(
        self,
        confidence_threshold_low: float = 0.6,
        confidence_threshold_high: float = 0.8,
        enable_reflection: bool = True,
    ):
        self.confidence_threshold_low = confidence_threshold_low
        self.confidence_threshold_high = confidence_threshold_high
        self.enable_reflection = enable_reflection
        
        self.reasoning_trace: List[ReasoningTrace] = []
        self.reflection_history: List[ReflectionResult] = []
        self.learning_insights: List[str] = []
        
    def assess_confidence(
        self,
        task: str,
        context: Dict[str, Any],
        response: Optional[str] = None
    ) -> float:
        """
        Avalia confiança na compreensão e resposta
        Retorna valor entre 0.0 (muito baixa) e 1.0 (muito alta)
        """
        confidence = 0.5  # Base neutra
        
        # Fatores que aumentam confiança
        if context.get("has_similar_experience", False):
            confidence += 0.2
        
        if context.get("clear_instructions", False):
            confidence += 0.15
        
        if context.get("sufficient_context", False):
            confidence += 0.1
        
        if response and len(response) > 50:  # Resposta substancial
            confidence += 0.05
        
        # Fatores que diminuem confiança
        if context.get("ambiguous_task", False):
            confidence -= 0.2
        
        if context.get("insufficient_context", False):
            confidence -= 0.15
        
        if context.get("complex_task", False):
            confidence -= 0.1
        
        if context.get("previous_errors", 0) > 0:
            confidence -= 0.1 * min(context["previous_errors"], 3)
        
        # Limitar entre 0.0 e 1.0
        confidence = max(0.0, min(1.0, confidence))
        
        return confidence
    
    def get_confidence_level(self, confidence: float) -> ConfidenceLevel:
        """Converte valor de confiança para nível"""
        if confidence < 0.3:
            return ConfidenceLevel.VERY_LOW
        elif confidence < 0.5:
            return ConfidenceLevel.LOW
        elif confidence < 0.7:
            return ConfidenceLevel.MEDIUM
        elif confidence < 0.9:
            return ConfidenceLevel.HIGH
        else:
            return ConfidenceLevel.VERY_HIGH
    
    def reflect(
        self,
        reflection_type: ReflectionType,
        task: str,
        response: Optional[str] = None,
        context: Optional[Dict[str, Any]] = None,
        error: Optional[Exception] = None
    ) -> ReflectionResult:
        """
        Reflete sobre a própria compreensão e resposta
        Retorna sugestões de revisão se necessário
        """
        if not self.enable_reflection:
            return ReflectionResult(
                reflection_type=reflection_type,
                confidence=0.5,
                confidence_level=ConfidenceLevel.MEDIUM,
                should_revise=False
            )
        
        if context is None:
            context = {}
        
        # Avaliar confiança
        confidence = self.assess_confidence(task, context, response)
        confidence_level = self.get_confidence_level(confidence)
        
        # Determinar se deve revisar
        should_revise = confidence < self.confidence_threshold_low
        
        # Gerar sugestões de revisão
        revision_suggestions = []
        insights = []
        
        if reflection_type == ReflectionType.QUALITY_CHECK:
            if confidence < self.confidence_threshold_low:
                revision_suggestions.append("Reavaliar compreensão da tarefa")
                revision_suggestions.append("Buscar mais contexto se necessário")
                insights.append(f"Confiança baixa ({confidence:.2f}), resposta pode não atender completamente")
            
            if response and len(response) < 50:
                revision_suggestions.append("Expandir resposta com mais detalhes")
                insights.append("Resposta muito curta, pode não ser completa")
        
        elif reflection_type == ReflectionType.UNDERSTANDING_CHECK:
            if confidence < self.confidence_threshold_low:
                revision_suggestions.append("Confirmar entendimento com usuário")
                revision_suggestions.append("Pedir esclarecimentos se necessário")
                insights.append("Compreensão pode estar incorreta, verificar")
            
            if context.get("ambiguous_task", False):
                revision_suggestions.append("Listar possíveis interpretações")
                insights.append("Tarefa ambígua detectada")
        
        elif reflection_type == ReflectionType.OPTIMIZATION:
            if confidence > self.confidence_threshold_high:
                insights.append("Abordagem atual parece adequada")
            else:
                revision_suggestions.append("Considerar abordagem alternativa")
                revision_suggestions.append("Otimizar para maior eficiência")
                insights.append("Há espaço para otimização")
        
        elif reflection_type == ReflectionType.ERROR_ANALYSIS:
            if error:
                revision_suggestions.append(f"Analisar erro: {str(error)}")
                revision_suggestions.append("Identificar causa raiz")
                insights.append("Erro detectado, necessário análise")
            
            if context.get("previous_errors", 0) > 0:
                revision_suggestions.append("Revisar padrão de erros anteriores")
                insights.append("Múltiplos erros sugerem problema sistemático")
        
        elif reflection_type == ReflectionType.LEARNING:
            if confidence > self.confidence_threshold_high:
                insights.append("Experiência positiva, pode ser replicada")
            else:
                insights.append("Experiência negativa, evitar repetição")
                revision_suggestions.append("Ajustar abordagem para futuras tarefas similares")
        
        # Criar resultado de reflexão
        result = ReflectionResult(
            reflection_type=reflection_type,
            confidence=confidence,
            confidence_level=confidence_level,
            should_revise=should_revise,
            revision_suggestions=revision_suggestions,
            insights=insights
        )
        
        # Registrar na história
        self.reflection_history.append(result)
        
        # Manter apenas últimos 50 reflexões
        if len(self.reflection_history) > 50:
            self.reflection_history.pop(0)
        
        logger.debug(f"🧠 Meta-raciocínio: {reflection_type.value} - Confiança: {confidence:.2f} ({confidence_level.value})")
        
        return result
    
    def trace_reasoning(
        self,
        step: int,
        action: str,
        reasoning: str,
        confidence: float,
        outcome: Optional[str] = None
    ):
        """Rastreia passo de raciocínio"""
        trace = ReasoningTrace(
            step=step,
            action=action,
            reasoning=reasoning,
            confidence=confidence,
            outcome=outcome
        )
        
        self.reasoning_trace.append(trace)
        
        # Manter apenas últimos 100 passos
        if len(self.reasoning_trace) > 100:
            self.reasoning_trace.pop(0)
    
    def should_revise(self, confidence: float) -> bool:
        """Determina se deve revisar baseado em confiança"""
        return confidence < self.confidence_threshold_low
    
    def get_revision_prompt(self, reflection_result: ReflectionResult) -> str:
        """Gera prompt para revisão baseado em reflexão"""
        if not reflection_result.should_revise:
            return ""
        
        prompt = "Revisão necessária:\n"
        prompt += f"Confiança: {reflection_result.confidence:.2f} ({reflection_result.confidence_level.value})\n"
        prompt += "Sugestões:\n"
        
        for suggestion in reflection_result.revision_suggestions:
            prompt += f"- {suggestion}\n"
        
        return prompt
    
    def learn_from_experience(
        self,
        task: str,
        success: bool,
        reflection_result: ReflectionResult
    ):
        """Aprende com experiência e armazena insights"""
        if success:
            insight = f"✅ Sucesso em '{task}' com confiança {reflection_result.confidence:.2f}"
        else:
            insight = f"❌ Falha em '{task}' com confiança {reflection_result.confidence:.2f}"
        
        # Adicionar insights da reflexão
        for ref_insight in reflection_result.insights:
            insight += f" | {ref_insight}"
        
        self.learning_insights.append(insight)
        
        # Manter apenas últimos 100 insights
        if len(self.learning_insights) > 100:
            self.learning_insights.pop(0)
        
        logger.info(f"📚 Aprendizado: {insight}")
    
    def get_reasoning_summary(self) -> Dict[str, Any]:
        """Retorna resumo do estado de raciocínio"""
        if not self.reasoning_trace:
            return {
                "total_steps": 0,
                "average_confidence": 0.0,
                "reflections_count": len(self.reflection_history),
                "learning_insights_count": len(self.learning_insights)
            }
        
        avg_confidence = sum(t.confidence for t in self.reasoning_trace) / len(self.reasoning_trace)
        
        return {
            "total_steps": len(self.reasoning_trace),
            "average_confidence": avg_confidence,
            "recent_steps": [
                {
                    "step": t.step,
                    "action": t.action,
                    "confidence": t.confidence,
                    "outcome": t.outcome
                }
                for t in self.reasoning_trace[-5:]
            ],
            "reflections_count": len(self.reflection_history),
            "recent_reflections": [
                {
                    "type": r.reflection_type.value,
                    "confidence": r.confidence,
                    "should_revise": r.should_revise
                }
                for r in self.reflection_history[-5:]
            ],
            "learning_insights_count": len(self.learning_insights),
            "recent_insights": self.learning_insights[-5:] if self.learning_insights else []
        }

