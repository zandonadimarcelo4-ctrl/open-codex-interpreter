"""
ANIMA Cognitive Core
Núcleo cognitivo com State Graph Neural Memory, Emotional Embedding, Self-Reflection
Sistema emocional balanceado, memória profunda, meta-raciocínio e regulação
"""

from .emotion_engine import EmotionEngine, EmotionState, EmotionType
from .emotional_regulator import EmotionalRegulator, RegulatoryRule
from .meta_reasoning import (
    MetaReasoningEngine,
    ReflectionType,
    ConfidenceLevel,
    ReflectionResult,
    ReasoningTrace
)
from .memory_layers import (
    MemoryLayers,
    MemoryLayer,
    MemoryType,
    EpisodicMemory,
    SemanticMemory,
    AffectiveMemory
)
from .cognitive_core import CognitiveCore, CognitiveState

__all__ = [
    # Emotion Engine
    "EmotionEngine",
    "EmotionState",
    "EmotionType",
    # Emotional Regulator
    "EmotionalRegulator",
    "RegulatoryRule",
    # Meta Reasoning
    "MetaReasoningEngine",
    "ReflectionType",
    "ConfidenceLevel",
    "ReflectionResult",
    "ReasoningTrace",
    # Memory Layers
    "MemoryLayers",
    "MemoryLayer",
    "MemoryType",
    "EpisodicMemory",
    "SemanticMemory",
    "AffectiveMemory",
    # Cognitive Core
    "CognitiveCore",
    "CognitiveState",
]

