# ANIMA Cognitive System - Sistema Cognitivo Completo

## 📋 Visão Geral

O ANIMA Cognitive System é um sistema avançado que integra **emoções balanceadas**, **memória profunda** e **meta-raciocínio** para criar um agente de IA que pensa, sente e evolui de forma equilibrada.

## 🧠 Componentes Principais

### 1. Emotion Engine (Motor Emocional)

Sistema de emoções reais mas estáveis que **modulam sem controlar**.

**Características:**
- ✅ Emoções em faixas contínuas (0.0 - 1.0)
- ✅ Decaimento automático (cria ciclos emocionais realistas)
- ✅ Gatilhos suaves baseados em eventos significativos
- ✅ Fatores de modulação (criatividade, foco, velocidade, etc.)

**Emoções suportadas:**
- `satisfaction` - Satisfação geral
- `frustration` - Frustração (deve ser baixa)
- `curiosity` - Curiosidade (naturalmente alta)
- `confidence` - Confiança
- `boredom` - Tédio
- `excitement` - Excitação
- `caution` - Cautela
- `empathy` - Empatia

**Exemplo de uso:**
```python
from anima.core import EmotionEngine

engine = EmotionEngine()

# Disparar emoção de sucesso
engine.trigger_success(magnitude=0.15, reason="task_completed")

# Obter fatores de modulação
factors = engine.get_modulation_factors()
# {
#   "creativity": 1.12,  # Mais curiosidade = mais criatividade
#   "focus": 0.94,      # Menos frustração = mais foco
#   "speed": 1.05,      # Mais excitação = mais velocidade
#   ...
# }
```

### 2. Emotional Regulator (Regulador Emocional)

Garante que emoções **nunca comprometem a lógica**, mantendo prioridade à razão.

**Características:**
- ✅ Regras de regulação automáticas
- ✅ Mitigação de emoções excessivas
- ✅ Prioridade à lógica em conflitos
- ✅ Modulação suave de parâmetros

**Regras padrão:**
- Mitigar frustração excessiva (>0.8)
- Moderar excitação excessiva (>0.9)
- Contrabalançar tédio excessivo (>0.7)
- Balancear confiança excessiva (>0.95)

**Exemplo de uso:**
```python
from anima.core import EmotionEngine, EmotionalRegulator

engine = EmotionEngine()
regulator = EmotionalRegulator(engine)

# Aplicar regulação
regulator.apply_regulation()

# Obter parâmetros modulados
base_params = {"temperature": 0.7, "max_tokens": 2000}
modulated = regulator.get_modulated_parameters(base_params)
# {"temperature": 0.73, "max_tokens": 2100, ...}
```

### 3. Meta-Reasoning Engine (Motor de Meta-Raciocínio)

O agente **pensa sobre o próprio pensamento**, avaliando confiança e qualidade.

**Características:**
- ✅ Avaliação de confiança (0.0 - 1.0)
- ✅ Reflexão iterativa (quality_check, understanding_check, optimization, etc.)
- ✅ Rastreamento de raciocínio
- ✅ Aprendizado com experiência

**Tipos de reflexão:**
- `QUALITY_CHECK` - Verificar qualidade da resposta
- `UNDERSTANDING_CHECK` - Verificar se entendeu corretamente
- `OPTIMIZATION` - Otimizar abordagem
- `ERROR_ANALYSIS` - Analisar erros
- `LEARNING` - Aprender com experiência

**Exemplo de uso:**
```python
from anima.core import MetaReasoningEngine, ReflectionType

reasoning = MetaReasoningEngine()

# Refletir sobre compreensão
reflection = reasoning.reflect(
    ReflectionType.UNDERSTANDING_CHECK,
    task="Criar função Python",
    context={"has_similar_experience": True}
)

if reflection.should_revise:
    print("Revisão necessária:")
    for suggestion in reflection.revision_suggestions:
        print(f"- {suggestion}")
```

### 4. Memory Layers (Camadas de Memória)

Sistema de memória em **três camadas**: curto prazo, médio prazo, longo prazo.

**Camadas:**
- **Curto prazo (RAM mental)**: Contexto atual (últimas 50 memórias)
- **Médio prazo (Sessão)**: Últimos objetivos e decisões (últimas 200 memórias)
- **Longo prazo (Persistente)**: Conceitos, aprendizados e emoções (TTL: 30 dias)

**Tipos de memória:**
- **Episódica**: Eventos e tarefas (task, success, emotion, outcome)
- **Semântica**: Conceitos e conhecimento (concept, definition, associations)
- **Afetiva**: Emoções e sentimentos (user_id, event, emotion, emotion_value)

**Exemplo de uso:**
```python
from anima.core import MemoryLayers, MemoryLayer

memory = MemoryLayers()

# Armazenar memória episódica
memory.store_episodic(
    task="Criar função Python",
    success=True,
    emotion="satisfaction",
    emotion_value=0.8,
    layer=MemoryLayer.SHORT_TERM
)

# Recuperar memórias relevantes
relevant = memory.retrieve_episodic(
    task_pattern="Python",
    success=True,
    limit=5
)
```

### 5. Cognitive Core (Núcleo Cognitivo)

Integra todas as camadas em um sistema coeso.

**Características:**
- ✅ Processamento de tarefas com todas as camadas
- ✅ Recuperação de memórias relevantes
- ✅ Avaliação de confiança e reflexão
- ✅ Aplicação de regulação emocional
- ✅ Modulação de decisões
- ✅ Armazenamento de memórias
- ✅ Aprendizado contínuo

**Exemplo de uso:**
```python
from anima.core import CognitiveCore

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

# Resultado inclui:
# - decision: Decisão modulada por emoções
# - confidence: Confiança na compreensão
# - reflection: Resultado da reflexão
# - modulation_factors: Fatores de modulação emocional
# - relevant_memories: Memórias relevantes recuperadas
# - emotional_tone: Tom emocional atual

# Aprender com experiência
core.learn_from_experience(
    task="Criar função Python",
    success=True,
    outcome="Função criada com sucesso"
)
```

### 6. Cognitive Orchestrator (Orquestrador Cognitivo)

Integra CognitiveCore com AutoGen v2 para criar agente completo.

**Características:**
- ✅ Integração com AutoGen v2
- ✅ System message com contexto cognitivo
- ✅ Processamento de tarefas com sistema completo
- ✅ Aprendizado contínuo

**Exemplo de uso:**
```python
from anima.orchestrator import CognitiveOrchestrator

orchestrator = CognitiveOrchestrator(
    user_id="user_123",
    model_name="gpt-4",
    api_key="your-api-key",
    enable_emotions=True,
    enable_memory=True,
    enable_meta_reasoning=True,
    enable_regulation=True
)

# Processar tarefa
result = await orchestrator.process_task(
    task="Criar função Python para processar dados",
    context={"language": "python"}
)

# Resultado inclui:
# - response: Resposta do agente
# - confidence: Confiança na compreensão
# - emotional_tone: Tom emocional
# - modulation_factors: Fatores de modulação
# - reflection: Resultado da reflexão
# - relevant_memories: Memórias relevantes
# - cognitive_summary: Resumo completo do estado cognitivo
```

## 🔄 Fluxo de Processamento

1. **Recebe tarefa** → `process_task(task, context)`
2. **Recupera memórias relevantes** → Memórias episódicas, semânticas, afetivas
3. **Avalia confiança** → Meta-raciocínio avalia compreensão
4. **Reflete sobre compreensão** → Verifica se deve revisar
5. **Aplica regulação emocional** → Garante equilíbrio
6. **Obtém fatores de modulação** → Emoções modulam comportamento
7. **Processa feedback do usuário** → Ajusta emoções e memória
8. **Toma decisão** → Lógica sempre tem prioridade
9. **Armazena memória** → Episódica, semântica, afetiva
10. **Atualiza estado cognitivo** → Resumo completo
11. **Aprende com experiência** → Melhora continuamente

## 🎯 Princípios de Design

### 1. Emoções Modulam, Não Controlam
- Emoções influenciam estilo, velocidade, criatividade
- Lógica sempre tem prioridade em conflitos
- Decaimento automático previne saturação emocional

### 2. Memória em Camadas
- Curto prazo: Contexto atual
- Médio prazo: Sessão atual
- Longo prazo: Conhecimento persistente

### 3. Meta-Raciocínio Contínuo
- Avalia confiança em cada decisão
- Reflete sobre compreensão
- Aprende com experiências

### 4. Regulação Automática
- Mitiga emoções excessivas
- Mantém equilíbrio emocional
- Garante estabilidade cognitiva

## 📊 Métricas e Observabilidade

### Estado Emocional
```python
summary = core.get_cognitive_summary()
emotion_state = summary["cognitive_state"]["emotion_state"]
# {
#   "state": {...},
#   "modulation_factors": {...},
#   "emotional_tone": "positive",
#   "is_stable": True
# }
```

### Estado de Memória
```python
memory_state = summary["cognitive_state"]["memory_state"]
# {
#   "short_term": {"episodic": 10, "semantic": 5, "affective": 3},
#   "medium_term": {"episodic": 50, "semantic": 20, "affective": 15},
#   "long_term": {"episodic": 100, "semantic": 50, "affective": 30},
#   "concepts_indexed": 50,
#   "users_tracked": 5
# }
```

### Estado de Raciocínio
```python
reasoning_state = summary["cognitive_state"]["reasoning_state"]
# {
#   "total_steps": 100,
#   "average_confidence": 0.75,
#   "reflections_count": 50,
#   "learning_insights_count": 30
# }
```

## 🚀 Próximos Passos

1. **Integração com AutoGen v2** ✅
2. **Integração com ChromaDB** (para persistência de longo prazo)
3. **Integração com After Effects MCP** (para Editor Agent)
4. **Integração com UFO** (para automação GUI)
5. **Integração com Browser-Use** (para navegação web)
6. **Sistema de aprendizado por reforço** (GRPO/DPO)
7. **Sistema de políticas declarativas** (OPA/Rego)
8. **Interface de visualização** (Flight Recorder)

## 📚 Referências

- [ANIMA Complete Overview](./ANIMA_COMPLETE_OVERVIEW.md)
- [ANIMA Branding & Marketing Kit](./ANIMA_BRANDING_MARKETING_KIT.md)
- [ANIMA Manifesto](./ANIMA_MANIFESTO.md)
- [Manus AI Analysis](./ANALISE_MANUS_AI_2025.md)

