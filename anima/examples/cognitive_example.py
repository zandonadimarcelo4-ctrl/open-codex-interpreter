"""
Exemplo de uso do Sistema Cognitivo ANIMA
Demonstra como usar Emotion Engine, Memory Layers, Meta-Reasoning e Cognitive Core
"""
import asyncio
import logging
from anima.core import (
    EmotionEngine,
    EmotionalRegulator,
    MetaReasoningEngine,
    MemoryLayers,
    CognitiveCore,
    ReflectionType,
    MemoryLayer
)
from anima.orchestrator import CognitiveOrchestrator

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def example_emotion_engine():
    """Exemplo de uso do Emotion Engine"""
    print("\n" + "="*50)
    print("EXEMPLO 1: Emotion Engine")
    print("="*50)
    
    engine = EmotionEngine()
    
    # Disparar emoções
    engine.trigger_success(magnitude=0.15, reason="task_completed")
    engine.trigger_curiosity(magnitude=0.1, reason="new_task")
    
    # Obter fatores de modulação
    factors = engine.get_modulation_factors()
    print(f"Fatores de modulação: {factors}")
    
    # Obter tom emocional
    tone = engine.get_emotional_tone()
    print(f"Tom emocional: {tone}")
    
    # Obter resumo
    summary = engine.get_state_summary()
    print(f"Resumo emocional: {summary['emotional_tone']}")


def example_emotional_regulator():
    """Exemplo de uso do Emotional Regulator"""
    print("\n" + "="*50)
    print("EXEMPLO 2: Emotional Regulator")
    print("="*50)
    
    engine = EmotionEngine()
    regulator = EmotionalRegulator(engine)
    
    # Simular frustração excessiva
    engine.state.set("frustration", 0.9, reason="test_excessive_frustration")
    print(f"Frustração antes da regulação: {engine.state.frustration:.2f}")
    
    # Aplicar regulação
    regulator.apply_regulation()
    print(f"Frustração após regulação: {engine.state.frustration:.2f}")
    
    # Obter parâmetros modulados
    base_params = {"temperature": 0.7, "max_tokens": 2000}
    modulated = regulator.get_modulated_parameters(base_params)
    print(f"Parâmetros modulados: {modulated}")


def example_meta_reasoning():
    """Exemplo de uso do Meta-Reasoning Engine"""
    print("\n" + "="*50)
    print("EXEMPLO 3: Meta-Reasoning Engine")
    print("="*50)
    
    reasoning = MetaReasoningEngine()
    
    # Refletir sobre compreensão
    reflection = reasoning.reflect(
        ReflectionType.UNDERSTANDING_CHECK,
        task="Criar função Python para processar dados",
        context={
            "has_similar_experience": True,
            "clear_instructions": True,
            "sufficient_context": True
        }
    )
    
    print(f"Confiança: {reflection.confidence:.2f} ({reflection.confidence_level.value})")
    print(f"Deve revisar: {reflection.should_revise}")
    if reflection.revision_suggestions:
        print("Sugestões de revisão:")
        for suggestion in reflection.revision_suggestions:
            print(f"  - {suggestion}")


def example_memory_layers():
    """Exemplo de uso do Memory Layers"""
    print("\n" + "="*50)
    print("EXEMPLO 4: Memory Layers")
    print("="*50)
    
    memory = MemoryLayers()
    
    # Armazenar memória episódica
    memory.store_episodic(
        task="Criar função Python",
        success=True,
        emotion="satisfaction",
        emotion_value=0.8,
        layer=MemoryLayer.SHORT_TERM
    )
    
    # Armazenar memória semântica
    memory.store_semantic(
        concept="Python",
        definition="Linguagem de programação de alto nível",
        associations=["programming", "data science", "web development"],
        layer=MemoryLayer.LONG_TERM
    )
    
    # Armazenar memória afetiva
    memory.store_affective(
        user_id="user_123",
        event="task_completed",
        emotion="satisfaction",
        emotion_value=0.8,
        layer=MemoryLayer.MEDIUM_TERM
    )
    
    # Recuperar memórias
    episodic = memory.retrieve_episodic(task_pattern="Python", limit=5)
    print(f"Memórias episódicas recuperadas: {len(episodic)}")
    
    semantic = memory.retrieve_semantic(query="Python", limit=5)
    print(f"Memórias semânticas recuperadas: {len(semantic)}")
    
    affective = memory.retrieve_affective(user_id="user_123", limit=5)
    print(f"Memórias afetivas recuperadas: {len(affective)}")
    
    # Obter afinidade com usuário
    affinity = memory.get_user_affinity("user_123")
    print(f"Afinidade com usuário: {affinity:.2f}")


def example_cognitive_core():
    """Exemplo de uso do Cognitive Core"""
    print("\n" + "="*50)
    print("EXEMPLO 5: Cognitive Core")
    print("="*50)
    
    core = CognitiveCore(
        enable_emotions=True,
        enable_memory=True,
        enable_meta_reasoning=True,
        enable_regulation=True,
        user_id="user_123"
    )
    
    # Processar tarefa
    result = core.process_task(
        task="Criar função Python para processar dados",
        context={"language": "python", "complexity": "medium"}
    )
    
    print(f"Confiança: {result['confidence']:.2f}")
    print(f"Tom emocional: {result['emotional_tone']}")
    print(f"Fatores de modulação: {result['modulation_factors']}")
    
    # Aprender com experiência
    core.learn_from_experience(
        task="Criar função Python para processar dados",
        success=True,
        outcome="Função criada com sucesso"
    )
    
    # Obter resumo
    summary = core.get_cognitive_summary()
    print(f"Resumo cognitivo: {len(summary['cognitive_state'])} estados")


def example_cognitive_orchestrator():
    """Exemplo de uso do Cognitive Orchestrator"""
    print("\n" + "="*50)
    print("EXEMPLO 6: Cognitive Orchestrator")
    print("="*50)
    
    # Nota: Este exemplo requer API key ou Ollama configurado
    # Por enquanto, apenas demonstra a estrutura
    
    try:
        orchestrator = CognitiveOrchestrator(
            user_id="user_123",
            model_name="gpt-4",
            api_key=None,  # Configurar com sua API key
            enable_emotions=True,
            enable_memory=True,
            enable_meta_reasoning=True,
            enable_regulation=True,
        )
        
        # Processar tarefa
        result = orchestrator.process_task(
            task="Criar função Python para processar dados",
            context={"language": "python"}
        )
        
        print(f"Mensagem enriquecida: {result['enriched_message'][:100]}...")
        print(f"Confiança: {result['confidence']:.2f}")
        print(f"Tom emocional: {result['emotional_tone']}")
        
    except Exception as e:
        print(f"Erro ao criar orquestrador (esperado se não houver API key): {e}")


def main():
    """Executa todos os exemplos"""
    print("\n" + "="*50)
    print("EXEMPLOS DO SISTEMA COGNITIVO ANIMA")
    print("="*50)
    
    # Executar exemplos
    example_emotion_engine()
    example_emotional_regulator()
    example_meta_reasoning()
    example_memory_layers()
    example_cognitive_core()
    example_cognitive_orchestrator()
    
    print("\n" + "="*50)
    print("EXEMPLOS CONCLUÍDOS")
    print("="*50)


if __name__ == "__main__":
    main()

