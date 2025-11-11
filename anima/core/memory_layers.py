"""
ANIMA Memory Layers - Camadas de Memória (Episódica, Semântica, Emocional)
Memória profunda com três camadas: curto prazo, médio prazo, longo prazo
"""
from __future__ import annotations

import logging
import time
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional
from enum import Enum

logger = logging.getLogger(__name__)


class MemoryType(str, Enum):
    """Tipos de memória"""
    EPISODIC = "episodic"      # Memória episódica (eventos, tarefas)
    SEMANTIC = "semantic"      # Memória semântica (conceitos, conhecimento)
    AFFECTIVE = "affective"    # Memória afetiva (emoções, sentimentos)


class MemoryLayer(str, Enum):
    """Camadas de memória por prazo"""
    SHORT_TERM = "short_term"    # RAM mental - contexto atual
    MEDIUM_TERM = "medium_term"  # Memória de sessão - últimos objetivos
    LONG_TERM = "long_term"      # Banco semântico + afetivo - conceitos e emoções


@dataclass
class EpisodicMemory:
    """Memória episódica - eventos e tarefas"""
    task: str
    success: bool
    emotion: str = "neutral"
    emotion_value: float = 0.5
    timestamp: float = field(default_factory=time.time)
    duration: Optional[float] = None
    outcome: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)
    
    def to_dict(self) -> Dict[str, Any]:
        """Converte para dicionário"""
        return {
            "task": self.task,
            "success": self.success,
            "emotion": self.emotion,
            "emotion_value": self.emotion_value,
            "timestamp": self.timestamp,
            "duration": self.duration,
            "outcome": self.outcome,
            "metadata": self.metadata
        }


@dataclass
class SemanticMemory:
    """Memória semântica - conceitos e conhecimento"""
    concept: str
    definition: str
    associations: List[str] = field(default_factory=list)
    usage_count: int = 0
    last_used: float = field(default_factory=time.time)
    confidence: float = 0.5
    metadata: Dict[str, Any] = field(default_factory=dict)
    
    def to_dict(self) -> Dict[str, Any]:
        """Converte para dicionário"""
        return {
            "concept": self.concept,
            "definition": self.definition,
            "associations": self.associations,
            "usage_count": self.usage_count,
            "last_used": self.last_used,
            "confidence": self.confidence,
            "metadata": self.metadata
        }


@dataclass
class AffectiveMemory:
    """Memória afetiva - emoções e sentimentos"""
    user_id: Optional[str] = None
    event: str = ""
    emotion: str = "neutral"
    emotion_value: float = 0.5
    timestamp: float = field(default_factory=time.time)
    duration_affective: float = 0.0  # Duração do sentimento
    context: Dict[str, Any] = field(default_factory=dict)
    
    def to_dict(self) -> Dict[str, Any]:
        """Converte para dicionário"""
        return {
            "user_id": self.user_id,
            "event": self.event,
            "emotion": self.emotion,
            "emotion_value": self.emotion_value,
            "timestamp": self.timestamp,
            "duration_affective": self.duration_affective,
            "context": self.context
        }


class MemoryLayers:
    """
    Sistema de memória em três camadas
    - Curto prazo: contexto atual (RAM mental)
    - Médio prazo: últimos objetivos e decisões (sessão)
    - Longo prazo: conceitos, aprendizados e emoções (persistente)
    """
    
    def __init__(
        self,
        short_term_max_size: int = 50,
        medium_term_max_size: int = 200,
        long_term_ttl: float = 86400 * 30,  # 30 dias
    ):
        self.short_term_max_size = short_term_max_size
        self.medium_term_max_size = medium_term_max_size
        self.long_term_ttl = long_term_ttl
        
        # Camadas de memória
        self.short_term_episodic: List[EpisodicMemory] = []
        self.medium_term_episodic: List[EpisodicMemory] = []
        self.long_term_episodic: List[EpisodicMemory] = []
        
        self.short_term_semantic: List[SemanticMemory] = []
        self.medium_term_semantic: List[SemanticMemory] = []
        self.long_term_semantic: List[SemanticMemory] = []
        
        self.short_term_affective: List[AffectiveMemory] = []
        self.medium_term_affective: List[AffectiveMemory] = []
        self.long_term_affective: List[AffectiveMemory] = []
        
        # Índices para busca rápida
        self.concept_index: Dict[str, SemanticMemory] = {}
        self.user_affinity: Dict[str, float] = {}  # Afinidade com usuários
    
    def store_episodic(
        self,
        task: str,
        success: bool,
        emotion: str = "neutral",
        emotion_value: float = 0.5,
        layer: MemoryLayer = MemoryLayer.SHORT_TERM,
        outcome: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ):
        """Armazena memória episódica"""
        memory = EpisodicMemory(
            task=task,
            success=success,
            emotion=emotion,
            emotion_value=emotion_value,
            outcome=outcome,
            metadata=metadata or {}
        )
        
        if layer == MemoryLayer.SHORT_TERM:
            self.short_term_episodic.append(memory)
            # Limitar tamanho
            if len(self.short_term_episodic) > self.short_term_max_size:
                # Mover mais antigas para médio prazo
                old = self.short_term_episodic.pop(0)
                self.medium_term_episodic.append(old)
        
        elif layer == MemoryLayer.MEDIUM_TERM:
            self.medium_term_episodic.append(memory)
            # Limitar tamanho
            if len(self.medium_term_episodic) > self.medium_term_max_size:
                # Mover mais antigas para longo prazo
                old = self.medium_term_episodic.pop(0)
                self.long_term_episodic.append(old)
        
        else:  # LONG_TERM
            self.long_term_episodic.append(memory)
        
        logger.debug(f"💾 Memória episódica armazenada: {task} (sucesso: {success}, emoção: {emotion})")
    
    def store_semantic(
        self,
        concept: str,
        definition: str,
        associations: Optional[List[str]] = None,
        layer: MemoryLayer = MemoryLayer.LONG_TERM,
        confidence: float = 0.5,
        metadata: Optional[Dict[str, Any]] = None
    ):
        """Armazena memória semântica"""
        # Verificar se conceito já existe
        if concept in self.concept_index:
            # Atualizar conceito existente
            existing = self.concept_index[concept]
            existing.usage_count += 1
            existing.last_used = time.time()
            existing.definition = definition  # Atualizar definição
            if associations:
                existing.associations.extend(associations)
                existing.associations = list(set(existing.associations))  # Remover duplicatas
            existing.confidence = max(existing.confidence, confidence)
            if metadata:
                existing.metadata.update(metadata)
            return
        
        memory = SemanticMemory(
            concept=concept,
            definition=definition,
            associations=associations or [],
            usage_count=1,
            confidence=confidence,
            metadata=metadata or {}
        )
        
        if layer == MemoryLayer.SHORT_TERM:
            self.short_term_semantic.append(memory)
        elif layer == MemoryLayer.MEDIUM_TERM:
            self.medium_term_semantic.append(memory)
        else:  # LONG_TERM
            self.long_term_semantic.append(memory)
        
        # Indexar
        self.concept_index[concept] = memory
        
        logger.debug(f"💾 Memória semântica armazenada: {concept}")
    
    def store_affective(
        self,
        user_id: Optional[str],
        event: str,
        emotion: str,
        emotion_value: float,
        layer: MemoryLayer = MemoryLayer.MEDIUM_TERM,
        context: Optional[Dict[str, Any]] = None
    ):
        """Armazena memória afetiva"""
        memory = AffectiveMemory(
            user_id=user_id,
            event=event,
            emotion=emotion,
            emotion_value=emotion_value,
            context=context or {}
        )
        
        if layer == MemoryLayer.SHORT_TERM:
            self.short_term_affective.append(memory)
        elif layer == MemoryLayer.MEDIUM_TERM:
            self.medium_term_affective.append(memory)
        else:  # LONG_TERM
            self.long_term_affective.append(memory)
        
        # Atualizar afinidade com usuário
        if user_id:
            if user_id not in self.user_affinity:
                self.user_affinity[user_id] = 0.5  # Neutro
            
            # Ajustar afinidade baseado em emoção
            if emotion in ["satisfaction", "excitement", "empathy"]:
                self.user_affinity[user_id] = min(1.0, self.user_affinity[user_id] + emotion_value * 0.1)
            elif emotion in ["frustration", "boredom"]:
                self.user_affinity[user_id] = max(0.0, self.user_affinity[user_id] - emotion_value * 0.1)
        
        logger.debug(f"💾 Memória afetiva armazenada: {event} (emoção: {emotion}, valor: {emotion_value:.2f})")
    
    def retrieve_episodic(
        self,
        task_pattern: Optional[str] = None,
        success: Optional[bool] = None,
        emotion: Optional[str] = None,
        limit: int = 10
    ) -> List[EpisodicMemory]:
        """Recupera memórias episódicas relevantes"""
        results = []
        
        # Buscar em todas as camadas (curto prazo primeiro)
        all_episodic = (
            self.short_term_episodic +
            self.medium_term_episodic +
            self.long_term_episodic
        )
        
        for memory in all_episodic:
            # Filtrar
            if task_pattern and task_pattern.lower() not in memory.task.lower():
                continue
            if success is not None and memory.success != success:
                continue
            if emotion and memory.emotion != emotion:
                continue
            
            results.append(memory)
        
        # Ordenar por timestamp (mais recentes primeiro)
        results.sort(key=lambda m: m.timestamp, reverse=True)
        
        return results[:limit]
    
    def retrieve_semantic(
        self,
        concept: Optional[str] = None,
        query: Optional[str] = None,
        limit: int = 10
    ) -> List[SemanticMemory]:
        """Recupera memórias semânticas relevantes"""
        results = []
        
        # Buscar por conceito exato
        if concept and concept in self.concept_index:
            results.append(self.concept_index[concept])
        
        # Buscar por query (busca textual)
        if query:
            all_semantic = (
                self.short_term_semantic +
                self.medium_term_semantic +
                self.long_term_semantic
            )
            
            query_lower = query.lower()
            for memory in all_semantic:
                if (query_lower in memory.concept.lower() or
                    query_lower in memory.definition.lower() or
                    any(query_lower in assoc.lower() for assoc in memory.associations)):
                    if memory not in results:
                        results.append(memory)
        
        # Ordenar por uso e confiança
        results.sort(key=lambda m: (m.usage_count, m.confidence), reverse=True)
        
        return results[:limit]
    
    def retrieve_affective(
        self,
        user_id: Optional[str] = None,
        emotion: Optional[str] = None,
        limit: int = 10
    ) -> List[AffectiveMemory]:
        """Recupera memórias afetivas relevantes"""
        results = []
        
        all_affective = (
            self.short_term_affective +
            self.medium_term_affective +
            self.long_term_affective
        )
        
        for memory in all_affective:
            # Filtrar
            if user_id and memory.user_id != user_id:
                continue
            if emotion and memory.emotion != emotion:
                continue
            
            results.append(memory)
        
        # Ordenar por timestamp (mais recentes primeiro)
        results.sort(key=lambda m: m.timestamp, reverse=True)
        
        return results[:limit]
    
    def get_user_affinity(self, user_id: str) -> float:
        """Obtém afinidade com usuário"""
        return self.user_affinity.get(user_id, 0.5)  # Neutro por padrão
    
    def cleanup_expired(self):
        """Remove memórias expiradas (apenas longo prazo)"""
        current_time = time.time()
        
        # Limpar memórias de longo prazo expiradas
        self.long_term_episodic = [
            m for m in self.long_term_episodic
            if current_time - m.timestamp < self.long_term_ttl
        ]
        
        self.long_term_semantic = [
            m for m in self.long_term_semantic
            if current_time - m.last_used < self.long_term_ttl
        ]
        
        self.long_term_affective = [
            m for m in self.long_term_affective
            if current_time - m.timestamp < self.long_term_ttl
        ]
        
        logger.debug("🧹 Memórias expiradas removidas")
    
    def get_memory_summary(self) -> Dict[str, Any]:
        """Retorna resumo do estado de memória"""
        return {
            "short_term": {
                "episodic": len(self.short_term_episodic),
                "semantic": len(self.short_term_semantic),
                "affective": len(self.short_term_affective)
            },
            "medium_term": {
                "episodic": len(self.medium_term_episodic),
                "semantic": len(self.medium_term_semantic),
                "affective": len(self.medium_term_affective)
            },
            "long_term": {
                "episodic": len(self.long_term_episodic),
                "semantic": len(self.long_term_semantic),
                "affective": len(self.long_term_affective)
            },
            "concepts_indexed": len(self.concept_index),
            "users_tracked": len(self.user_affinity),
            "user_affinities": self.user_affinity
        }

