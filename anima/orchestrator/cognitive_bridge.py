"""
Cognitive Bridge - Ponte Python para integração com TypeScript
Script que permite chamar o sistema cognitivo ANIMA a partir de TypeScript
"""
import sys
import json
import logging
from typing import Dict, Any, Optional

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Importar sistema cognitivo
try:
    from anima.orchestrator import CognitiveOrchestrator
    from anima.core import CognitiveCore
    COGNITIVE_SYSTEM_AVAILABLE = True
except ImportError as e:
    logger.warning(f"Sistema cognitivo não disponível: {e}")
    COGNITIVE_SYSTEM_AVAILABLE = False

# Cache de orquestradores por usuário
_orchestrator_cache: Dict[str, CognitiveOrchestrator] = {}


def get_orchestrator(user_id: str = "default_user") -> Optional[CognitiveOrchestrator]:
    """Obtém orquestrador cognitivo para usuário (com cache)"""
    if not COGNITIVE_SYSTEM_AVAILABLE:
        return None
    
    if user_id not in _orchestrator_cache:
        try:
            # Criar orquestrador (sem modelo por enquanto, apenas para processamento cognitivo)
            # O modelo será usado apenas quando necessário
            _orchestrator_cache[user_id] = CognitiveOrchestrator(
                user_id=user_id,
                model_name="gpt-4",  # Placeholder, não será usado se não houver API key
                api_key=None,  # Não usar modelo externo
                base_url=None,
                enable_emotions=True,
                enable_memory=True,
                enable_meta_reasoning=True,
                enable_regulation=True,
            )
        except Exception as e:
            logger.error(f"Erro ao criar orquestrador para usuário {user_id}: {e}")
            return None
    
    return _orchestrator_cache[user_id]


def process_task(context: Dict[str, Any]) -> Dict[str, Any]:
    """Processa tarefa com sistema cognitivo"""
    task = context.get("task", "")
    user_id = context.get("user_id", "default_user")
    context_data = context.get("context", {})
    user_feedback = context.get("user_feedback")
    
    orchestrator = get_orchestrator(user_id)
    if not orchestrator:
        # Retornar resultado vazio se sistema não disponível
        return {
            "enriched_message": task,
            "original_task": task,
            "confidence": 0.5,
            "emotional_tone": "neutral",
            "modulation_factors": {},
            "reflection": None,
            "relevant_memories": {"episodic": [], "semantic": [], "affective": []},
            "decision": {"action": "process", "approach": "standard", "parameters": {}},
            "cognitive_summary": {}
        }
    
    # Processar tarefa
    try:
        result = orchestrator.process_task(
            task=task,
            context=context_data,
            user_feedback=user_feedback
        )
        return result
    except Exception as e:
        logger.error(f"Erro ao processar tarefa: {e}")
        # Retornar resultado básico em caso de erro
        return {
            "enriched_message": task,
            "original_task": task,
            "confidence": 0.5,
            "emotional_tone": "neutral",
            "modulation_factors": {},
            "reflection": None,
            "relevant_memories": {"episodic": [], "semantic": [], "affective": []},
            "decision": {"action": "process", "approach": "standard", "parameters": {}},
            "cognitive_summary": {}
        }


def learn_from_response(context: Dict[str, Any]) -> Dict[str, Any]:
    """Aprende com resposta recebida"""
    task = context.get("task", "")
    response = context.get("response", "")
    success = context.get("success", True)
    user_feedback = context.get("user_feedback")
    user_id = context.get("user_id", "default_user")
    
    orchestrator = get_orchestrator(user_id)
    if not orchestrator:
        return {"status": "error", "message": "Sistema cognitivo não disponível"}
    
    try:
        orchestrator.learn_from_response(
            task=task,
            response=response,
            success=success,
            user_feedback=user_feedback
        )
        return {"status": "success"}
    except Exception as e:
        logger.error(f"Erro ao aprender com resposta: {e}")
        return {"status": "error", "message": str(e)}


def get_summary(context: Dict[str, Any]) -> Dict[str, Any]:
    """Obtém resumo do estado cognitivo"""
    user_id = context.get("user_id", "default_user")
    
    orchestrator = get_orchestrator(user_id)
    if not orchestrator:
        return {"cognitive_summary": {}}
    
    try:
        summary = orchestrator.get_cognitive_summary()
        return {"cognitive_summary": summary}
    except Exception as e:
        logger.error(f"Erro ao obter resumo: {e}")
        return {"cognitive_summary": {}}


def main():
    """Função principal - processa argumentos da linha de comando"""
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No context provided"}))
        sys.exit(1)
    
    try:
        # Parse JSON context
        context_str = sys.argv[1]
        context = json.loads(context_str)
        
        # Determinar ação
        action = context.get("action", "process")
        
        if action == "process":
            result = process_task(context)
        elif action == "learn":
            result = learn_from_response(context)
        elif action == "summary":
            result = get_summary(context)
        else:
            result = {"error": f"Unknown action: {action}"}
        
        # Retornar resultado como JSON
        print(json.dumps(result, indent=2, default=str))
        
    except Exception as e:
        logger.error(f"Erro no cognitive_bridge: {e}")
        print(json.dumps({"error": str(e)}))


if __name__ == "__main__":
    main()

