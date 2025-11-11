"""
ANIMA Emotional Regulator - Regulador de Emoções
Garante que emoções modulam sem controlar, mantendo prioridade à lógica
"""
from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional, Callable
from dataclasses import dataclass

from .emotion_engine import EmotionEngine, EmotionState

logger = logging.getLogger(__name__)


@dataclass
class RegulatoryRule:
    """Regra de regulação emocional"""
    name: str
    condition: Callable[[EmotionState], bool]  # Condição para aplicar regra
    action: Callable[[EmotionEngine], None]     # Ação a tomar
    priority: int = 0  # Prioridade (maior = mais importante)


class EmotionalRegulator:
    """
    Regulador que garante que emoções nunca comprometem a lógica
    Implementa o princípio: lógica sempre vence em conflitos
    """
    
    def __init__(self, emotion_engine: EmotionEngine):
        self.emotion_engine = emotion_engine
        self.rules: List[RegulatoryRule] = []
        self.conflict_history: List[Dict[str, Any]] = []
        self._setup_default_rules()
    
    def _setup_default_rules(self):
        """Configura regras padrão de regulação"""
        
        # Regra 1: Frustração excessiva não pode bloquear raciocínio
        def check_excessive_frustration(state: EmotionState) -> bool:
            return state.frustration > 0.8
        
        def mitigate_frustration(engine: EmotionEngine):
            # Reduzir frustração gradualmente
            engine.state.set("frustration", 0.6, reason="regulator_mitigation")
            logger.warning("⚠️ Regulador: Frustração excessiva detectada, mitigando...")
        
        self.add_rule(
            RegulatoryRule(
                name="mitigate_excessive_frustration",
                condition=check_excessive_frustration,
                action=mitigate_frustration,
                priority=10
            )
        )
        
        # Regra 2: Excitação excessiva não pode comprometer precisão
        def check_excessive_excitement(state: EmotionState) -> bool:
            return state.excitement > 0.9
        
        def moderate_excitement(engine: EmotionEngine):
            engine.state.set("excitement", 0.7, reason="regulator_moderation")
            engine.state.set("caution", 0.5, reason="regulator_balance")
            logger.info("⚖️ Regulador: Excitação excessiva, aumentando cautela...")
        
        self.add_rule(
            RegulatoryRule(
                name="moderate_excessive_excitement",
                condition=check_excessive_excitement,
                action=moderate_excitement,
                priority=8
            )
        )
        
        # Regra 3: Tédio não pode levar a respostas apressadas
        def check_excessive_boredom(state: EmotionState) -> bool:
            return state.boredom > 0.7
        
        def counteract_boredom(engine: EmotionEngine):
            # Aumentar curiosidade para contrabalançar tédio
            engine.state.set("curiosity", 0.6, reason="regulator_curiosity_boost")
            engine.state.set("boredom", 0.4, reason="regulator_boredom_reduction")
            logger.info("🔄 Regulador: Tédio detectado, aumentando curiosidade...")
        
        self.add_rule(
            RegulatoryRule(
                name="counteract_excessive_boredom",
                condition=check_excessive_boredom,
                action=counteract_boredom,
                priority=7
            )
        )
        
        # Regra 4: Confiança excessiva não pode levar a riscos desnecessários
        def check_excessive_confidence(state: EmotionState) -> bool:
            return state.confidence > 0.95
        
        def balance_confidence(engine: EmotionEngine):
            engine.state.set("confidence", 0.85, reason="regulator_confidence_balance")
            engine.state.set("caution", 0.5, reason="regulator_caution_boost")
            logger.info("🎯 Regulador: Confiança excessiva, aumentando cautela...")
        
        self.add_rule(
            RegulatoryRule(
                name="balance_excessive_confidence",
                condition=check_excessive_confidence,
                action=balance_confidence,
                priority=9
            )
        )
    
    def add_rule(self, rule: RegulatoryRule):
        """Adiciona regra de regulação"""
        self.rules.append(rule)
        # Ordenar por prioridade (maior primeiro)
        self.rules.sort(key=lambda r: r.priority, reverse=True)
    
    def apply_regulation(self) -> bool:
        """
        Aplica regras de regulação ao estado emocional
        Retorna True se alguma regra foi aplicada
        """
        applied = False
        
        for rule in self.rules:
            if rule.condition(self.emotion_engine.state):
                logger.debug(f"📐 Aplicando regra de regulação: {rule.name}")
                rule.action(self.emotion_engine)
                applied = True
                
                # Registrar conflito resolvido
                self.conflict_history.append({
                    "rule": rule.name,
                    "timestamp": self.emotion_engine.state.last_update,
                    "state_before": self.emotion_engine.state.to_dict()
                })
                
                # Manter apenas últimos 20 conflitos
                if len(self.conflict_history) > 20:
                    self.conflict_history.pop(0)
        
        return applied
    
    def enforce_logic_priority(self, logical_decision: Any, emotional_influence: Dict[str, float]) -> Any:
        """
        Garante que decisão lógica sempre tem prioridade sobre influência emocional
        Emoções apenas modulam, nunca controlam
        """
        # Aplicar regulação antes de verificar conflitos
        self.apply_regulation()
        
        # Obter fatores de modulação
        modulation_factors = self.emotion_engine.get_modulation_factors()
        
        # Se houver conflito entre lógica e emoção, lógica vence
        # Mas registramos a frustração emocional
        if emotional_influence.get("conflict", False):
            self.emotion_engine.trigger_emotion(
                "frustration",
                0.05,  # Frustração leve por ter a decisão emocional sobreposta
                "logic_priority_override",
                "internal"
            )
            logger.debug("🧠 Lógica tem prioridade sobre emoção (conflito resolvido)")
        
        # Retornar decisão lógica (emoções apenas modulam fatores, não a decisão)
        return logical_decision
    
    def get_modulated_parameters(self, base_parameters: Dict[str, Any]) -> Dict[str, Any]:
        """
        Aplica modulação emocional a parâmetros base
        Emoções modulam, mas não controlam valores extremos
        """
        # Aplicar regulação
        self.apply_regulation()
        
        # Obter fatores de modulação
        factors = self.emotion_engine.get_modulation_factors()
        
        # Aplicar modulação com limites seguros
        modulated = {}
        
        for key, value in base_parameters.items():
            if isinstance(value, (int, float)):
                # Aplicar fator de modulação correspondente
                factor_key = self._map_parameter_to_factor(key)
                factor = factors.get(factor_key, 1.0)
                
                # Modular valor (mas manter dentro de limites seguros)
                modulated_value = value * factor
                
                # Limites absolutos para evitar valores extremos
                if "temperature" in key.lower() or "creativity" in key.lower():
                    modulated_value = max(0.1, min(2.0, modulated_value))
                elif "max_tokens" in key.lower() or "timeout" in key.lower():
                    modulated_value = max(value * 0.5, min(value * 1.5, modulated_value))
                else:
                    modulated_value = max(value * 0.7, min(value * 1.3, modulated_value))
                
                modulated[key] = modulated_value
            else:
                # Valores não numéricos não são modulados
                modulated[key] = value
        
        return modulated
    
    def _map_parameter_to_factor(self, parameter_name: str) -> str:
        """Mapeia nome de parâmetro para fator de modulação"""
        parameter_lower = parameter_name.lower()
        
        if "creativity" in parameter_lower or "temperature" in parameter_lower:
            return "creativity"
        elif "focus" in parameter_lower or "attention" in parameter_lower:
            return "focus"
        elif "speed" in parameter_lower or "timeout" in parameter_lower:
            return "speed"
        elif "caution" in parameter_lower or "safety" in parameter_lower:
            return "caution"
        elif "exploration" in parameter_lower or "diversity" in parameter_lower:
            return "exploration"
        elif "patience" in parameter_lower or "retry" in parameter_lower:
            return "patience"
        else:
            return "confidence_mod"
    
    def get_regulation_summary(self) -> Dict[str, Any]:
        """Retorna resumo do estado de regulação"""
        return {
            "rules_count": len(self.rules),
            "conflicts_resolved": len(self.conflict_history),
            "recent_conflicts": self.conflict_history[-5:] if self.conflict_history else [],
            "emotional_state": self.emotion_engine.get_state_summary(),
            "is_regulated": self.apply_regulation()
        }

