"""
Roteador Inteligente para Orquestração de Modelos
Detecta tipo de tarefa e roteia para modelo apropriado
"""
import re
import logging
from typing import Dict, Any, Optional
from enum import Enum

logger = logging.getLogger(__name__)


class TaskType(Enum):
    """Tipos de tarefa"""
    PLANNING = "planning"  # Planejamento estratégico
    REASONING = "reasoning"  # Raciocínio complexo
    CODE = "code"  # Geração de código
    EXECUTION = "execution"  # Execução de código
    DEBUGGING = "debugging"  # Debugging e correção
    REFACTORING = "refactoring"  # Refatoração
    TOOL_CALLING = "tool_calling"  # Chamada de ferramentas
    REFLECTION = "reflection"  # Auto-reflexão
    CONVERSATION = "conversation"  # Conversa simples
    UNKNOWN = "unknown"  # Tipo desconhecido


class IntelligentRouter:
    """
    Roteador inteligente que detecta tipo de tarefa e roteia para modelo apropriado
    
    Usa heurísticas e análise de prompt para determinar:
    - Tarefas estratégicas → Brain (Qwen32B-MoE)
    - Tarefas de código → Executor (Qwen14B-Coder ou DeepSeek-Lite)
    """
    
    def __init__(self):
        """Inicializa o roteador"""
        # Padrões para detectar tipo de tarefa
        self.patterns = {
            TaskType.PLANNING: [
                r"planej|plan|estrateg|organiz|estrutur|divid|decompos",
                r"criar.*plano|fazer.*plano|desenvolver.*plano",
                r"como.*fazer|passos.*para|etapas.*para",
            ],
            TaskType.REASONING: [
                r"racioc|pens|analis|reflet|consid|avali|deduz",
                r"por que|porque|qual.*razao|qual.*motivo",
                r"explique|explic|entend|compreend",
            ],
            TaskType.CODE: [
                r"codigo|code|program|script|funcao|function|classe|class",
                r"python|javascript|typescript|java|go|rust|c\+\+|c#",
                r"criar.*codigo|escrever.*codigo|gerar.*codigo",
                r"implement|desenvolver.*codigo",
            ],
            TaskType.EXECUTION: [
                r"execut|rodar|run|execute|exec",
                r"abrir|open|iniciar|start",
                r"fazer.*funcionar|fazer.*rodar",
            ],
            TaskType.DEBUGGING: [
                r"debug|erro|error|bug|corrig|fix|correcao",
                r"problema|issue|falha|failure",
                r"nao.*funciona|nao.*esta.*funcionando",
            ],
            TaskType.REFACTORING: [
                r"refator|refactor|melhor|optim|otimiz|reestrutur",
                r"limpar.*codigo|organizar.*codigo|melhorar.*codigo",
            ],
            TaskType.TOOL_CALLING: [
                r"ferrament|tool|usar.*ferramenta|chamar.*ferramenta",
                r"api|endpoint|requisicao|request",
            ],
            TaskType.REFLECTION: [
                r"reflet|reflex|avaliar.*acao|avaliar.*resultado",
                r"o que.*aprend|o que.*melhor|como.*melhor",
            ],
            TaskType.CONVERSATION: [
                r"ola|oi|hello|hi|obrigad|thanks|thank",
                r"como.*voce|como.*esta|tudo.*bem",
            ],
        }
    
    def detect_task_type(self, prompt: str, intent: Optional[Dict[str, Any]] = None) -> TaskType:
        """
        Detecta tipo de tarefa baseado no prompt e intent
        
        Args:
            prompt: Prompt do usuário
            intent: Intent detectado (opcional)
        
        Returns:
            Tipo de tarefa detectado
        """
        prompt_lower = prompt.lower()
        
        # Se intent fornecido, usar como hint
        if intent:
            intent_type = intent.get("type", "")
            if intent_type == "action" or intent_type == "command":
                # Ações/comandos podem ser código ou execução
                if any(re.search(pattern, prompt_lower) for pattern in self.patterns[TaskType.CODE]):
                    return TaskType.CODE
                elif any(re.search(pattern, prompt_lower) for pattern in self.patterns[TaskType.EXECUTION]):
                    return TaskType.EXECUTION
                else:
                    return TaskType.PLANNING
            elif intent_type == "conversation" or intent_type == "question":
                return TaskType.CONVERSATION
        
        # Detectar tipo baseado em padrões
        scores: Dict[TaskType, int] = {task_type: 0 for task_type in TaskType}
        
        for task_type, patterns in self.patterns.items():
            for pattern in patterns:
                if re.search(pattern, prompt_lower):
                    scores[task_type] += 1
        
        # Remover UNKNOWN do scoring
        scores.pop(TaskType.UNKNOWN, None)
        
        # Retornar tipo com maior score
        if scores:
            max_score = max(scores.values())
            if max_score > 0:
                for task_type, score in scores.items():
                    if score == max_score:
                        logger.info(f"🎯 Tipo de tarefa detectado: {task_type.value} (score: {score})")
                        return task_type
        
        # Padrão: REASONING (tarefa complexa)
        logger.info(f"🎯 Tipo de tarefa: REASONING (padrão)")
        return TaskType.REASONING
    
    def should_use_brain(self, task_type: TaskType) -> bool:
        """
        Determina se deve usar modelo cérebro (Brain)
        
        Args:
            task_type: Tipo de tarefa
        
        Returns:
            True se deve usar Brain
        """
        brain_tasks = [
            TaskType.PLANNING,
            TaskType.REASONING,
            TaskType.TOOL_CALLING,
            TaskType.REFLECTION,
            TaskType.CONVERSATION,
        ]
        return task_type in brain_tasks
    
    def should_use_executor(self, task_type: TaskType) -> bool:
        """
        Determina se deve usar modelo executor
        
        Args:
            task_type: Tipo de tarefa
        
        Returns:
            True se deve usar Executor
        """
        executor_tasks = [
            TaskType.CODE,
            TaskType.EXECUTION,
            TaskType.DEBUGGING,
            TaskType.REFACTORING,
        ]
        return task_type in executor_tasks
    
    def route_task(self, prompt: str, intent: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Roteia tarefa para modelo apropriado
        
        Args:
            prompt: Prompt do usuário
            intent: Intent detectado (opcional)
        
        Returns:
            Dict com informações de roteamento
        """
        task_type = self.detect_task_type(prompt, intent)
        
        use_brain = self.should_use_brain(task_type)
        use_executor = self.should_use_executor(task_type)
        
        # Se ambos podem ser usados, preferir Brain (mais inteligente)
        if use_brain and use_executor:
            use_executor = False
        
        return {
            "task_type": task_type.value,
            "use_brain": use_brain,
            "use_executor": use_executor,
            "model_role": "brain" if use_brain else "executor",
        }


# Instância global do roteador
_router: Optional[IntelligentRouter] = None


def get_router() -> IntelligentRouter:
    """Retorna instância global do roteador"""
    global _router
    if _router is None:
        _router = IntelligentRouter()
    return _router

