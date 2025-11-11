"""
Gerenciador de Modelos para Orquestração Inteligente
Gerencia carregamento/descarregamento de modelos na GPU de 16GB
"""
import os
import subprocess
import logging
import time
from typing import Optional, Dict, Any
from enum import Enum

logger = logging.getLogger(__name__)


class ModelRole(Enum):
    """Papéis dos modelos no sistema"""
    BRAIN = "brain"  # Cérebro estratégico (Qwen32B-MoE)
    EXECUTOR = "executor"  # Executor de código (Qwen14B-Coder ou DeepSeek-Lite)


class ModelManager:
    """
    Gerenciador de modelos para orquestração inteligente
    
    Gerencia carregamento/descarregamento de modelos na GPU de 16GB
    para evitar estouro de VRAM (modo alternado)
    """
    
    def __init__(
        self,
        brain_model: str = "qwen2.5-32b-instruct-moe-rtx",
        executor_model: str = "networkjohnny/deepseek-coder-v2-lite-base-q4_k_m-gguf",
        executor_ui_model: Optional[str] = None,
        ollama_base_url: str = "http://localhost:11434",
    ):
        """
        Inicializa o gerenciador de modelos
        
        Args:
            brain_model: Modelo cérebro estratégico (Qwen32B-MoE)
            executor_model: Modelo executor de código geral (DeepSeek-Lite ou Qwen14B-Coder)
            executor_ui_model: Modelo executor especializado em UI (UIGEN-T1-Qwen-14, opcional)
            ollama_base_url: URL base do Ollama
        """
        self.brain_model = brain_model
        self.executor_model = executor_model
        self.executor_ui_model = executor_ui_model or os.getenv("EXECUTOR_UI_MODEL", "MHKetbi/UIGEN-T1-Qwen-14:q4_K_S")
        self.ollama_base_url = ollama_base_url.rstrip("/")
        
        # Estado atual
        self.current_model: Optional[str] = None
        self.current_role: Optional[ModelRole] = None
        self.model_loaded_at: Optional[float] = None
        
        # Cache de modelos carregados
        self.loaded_models: Dict[str, Any] = {}
        
        logger.info(f"✅ ModelManager inicializado")
        logger.info(f"   Brain: {brain_model}")
        logger.info(f"   Executor (código): {executor_model}")
        logger.info(f"   Executor (UI): {executor_ui_model}")
    
    def _run_ollama_command(self, command: str) -> tuple[bool, str]:
        """
        Executa comando Ollama via API ou CLI
        
        Args:
            command: Comando a executar (ex: "ps", "show", etc.)
        
        Returns:
            (sucesso, resposta)
        """
        try:
            import requests
            
            # Usar API do Ollama
            if command == "ps":
                url = f"{self.ollama_base_url}/api/ps"
                response = requests.get(url, timeout=5)
                if response.status_code == 200:
                    return True, response.text
            elif command.startswith("show "):
                model_name = command.replace("show ", "")
                url = f"{self.ollama_base_url}/api/show"
                response = requests.post(url, json={"name": model_name}, timeout=5)
                if response.status_code == 200:
                    return True, response.text
            
            # Fallback: usar CLI
            result = subprocess.run(
                ["ollama", command.split()[0]] + command.split()[1:],
                capture_output=True,
                text=True,
                timeout=10,
            )
            return result.returncode == 0, result.stdout
        except Exception as e:
            logger.error(f"Erro ao executar comando Ollama: {e}")
            return False, str(e)
    
    def _is_model_loaded(self, model_name: str) -> bool:
        """
        Verifica se modelo está carregado na GPU
        
        Args:
            model_name: Nome do modelo
        
        Returns:
            True se modelo está carregado
        """
        try:
            success, output = self._run_ollama_command("ps")
            if success:
                # Verificar se modelo está na lista de processos
                return model_name in output
            return False
        except Exception as e:
            logger.warning(f"Erro ao verificar modelo carregado: {e}")
            return False
    
    def _unload_model(self, model_name: str) -> bool:
        """
        Descarrega modelo da GPU (liberando VRAM)
        
        Args:
            model_name: Nome do modelo a descarregar
        
        Returns:
            True se modelo foi descarregado
        """
        try:
            # Ollama não tem comando direto para descarregar
            # Mas podemos forçar descarregamento carregando outro modelo
            # ou aguardando timeout de inatividade
            
            # Verificar se modelo está carregado
            if not self._is_model_loaded(model_name):
                return True  # Já está descarregado
            
            # Aguardar timeout de inatividade (Ollama descarrega automaticamente)
            # Ou forçar descarregamento carregando modelo dummy/vazio
            logger.info(f"🔄 Aguardando descarregamento automático de {model_name}...")
            time.sleep(2)  # Aguardar um pouco
            
            # Verificar novamente
            if not self._is_model_loaded(model_name):
                logger.info(f"✅ Modelo {model_name} descarregado")
                return True
            else:
                logger.warning(f"⚠️ Modelo {model_name} ainda carregado (pode estar em uso)")
                return False
        except Exception as e:
            logger.error(f"Erro ao descarregar modelo: {e}")
            return False
    
    def _load_model(self, model_name: str, role: ModelRole) -> bool:
        """
        Carrega modelo na GPU (se necessário)
        
        Args:
            model_name: Nome do modelo a carregar
            role: Papel do modelo (BRAIN ou EXECUTOR)
        
        Returns:
            True se modelo foi carregado
        """
        try:
            # Se modelo já está carregado, não precisa fazer nada
            if self._is_model_loaded(model_name):
                logger.info(f"✅ Modelo {model_name} já está carregado")
                self.current_model = model_name
                self.current_role = role
                self.model_loaded_at = time.time()
                return True
            
            # Se outro modelo está carregado, descarregar primeiro
            if self.current_model and self.current_model != model_name:
                logger.info(f"🔄 Descarregando {self.current_model} para carregar {model_name}...")
                self._unload_model(self.current_model)
                time.sleep(1)  # Aguardar descarregamento
            
            # Carregar modelo (fazer uma chamada de teste)
            logger.info(f"🚀 Carregando {model_name} ({role.value})...")
            
            # Fazer chamada de teste para forçar carregamento
            import requests
            url = f"{self.ollama_base_url}/api/generate"
            response = requests.post(
                url,
                json={
                    "model": model_name,
                    "prompt": "test",
                    "stream": False,
                    "options": {
                        "num_predict": 1,  # Apenas 1 token para teste rápido
                    }
                },
                timeout=30,
            )
            
            if response.status_code == 200:
                logger.info(f"✅ Modelo {model_name} carregado com sucesso")
                self.current_model = model_name
                self.current_role = role
                self.model_loaded_at = time.time()
                return True
            else:
                logger.error(f"❌ Erro ao carregar modelo {model_name}: {response.status_code}")
                return False
        except Exception as e:
            logger.error(f"Erro ao carregar modelo: {e}")
            return False
    
    def get_brain_model(self) -> str:
        """Retorna modelo cérebro estratégico"""
        return self.brain_model
    
    def get_executor_model(self, task_type: Optional[str] = None) -> str:
        """
        Retorna modelo executor apropriado
        
        Args:
            task_type: Tipo de tarefa (opcional, para selecionar executor UI)
        
        Returns:
            Nome do modelo executor
        """
        # Se tarefa é de UI, usar executor UI especializado
        if task_type and "ui" in task_type.lower():
            return self.executor_ui_model
        return self.executor_model
    
    def get_executor_ui_model(self) -> str:
        """Retorna modelo executor especializado em UI"""
        return self.executor_ui_model
    
    def ensure_brain_loaded(self) -> bool:
        """
        Garante que modelo cérebro está carregado
        
        Returns:
            True se modelo cérebro está carregado
        """
        if self.current_model == self.brain_model and self.current_role == ModelRole.BRAIN:
            return True  # Já está carregado
        
        return self._load_model(self.brain_model, ModelRole.BRAIN)
    
    def ensure_executor_loaded(self, task_type: Optional[str] = None) -> bool:
        """
        Garante que modelo executor está carregado
        
        Args:
            task_type: Tipo de tarefa (opcional, para selecionar executor UI)
        
        Returns:
            True se modelo executor está carregado
        """
        # Selecionar executor apropriado
        executor_model = self.get_executor_model(task_type)
        
        if self.current_model == executor_model and self.current_role == ModelRole.EXECUTOR:
            return True  # Já está carregado
        
        return self._load_model(executor_model, ModelRole.EXECUTOR)
    
    def get_model_for_task(self, task_type: str) -> str:
        """
        Retorna modelo apropriado para tipo de tarefa
        
        Args:
            task_type: Tipo de tarefa ("planning", "reasoning", "code", "execution", "ui_generation")
        
        Returns:
            Nome do modelo apropriado
        """
        # Tarefas estratégicas → Brain
        if task_type in ["planning", "reasoning", "strategy", "tool_calling", "reflection"]:
            self.ensure_brain_loaded()
            return self.brain_model
        
        # Tarefas de UI → Executor UI especializado
        elif task_type in ["ui_generation", "ui", "html", "css", "frontend"]:
            self.ensure_executor_loaded(task_type)
            return self.executor_ui_model
        
        # Tarefas de código → Executor geral
        elif task_type in ["code", "execution", "debugging", "refactoring"]:
            self.ensure_executor_loaded(task_type)
            return self.executor_model
        
        # Padrão: Brain (mais inteligente)
        else:
            self.ensure_brain_loaded()
            return self.brain_model
    
    def get_vram_usage(self) -> Dict[str, Any]:
        """
        Retorna uso de VRAM atual
        
        Returns:
            Dict com informações de VRAM
        """
        try:
            import subprocess
            result = subprocess.run(
                ["nvidia-smi", "--query-gpu=memory.used,memory.total", "--format=csv,noheader,nounits"],
                capture_output=True,
                text=True,
                timeout=5,
            )
            if result.returncode == 0:
                parts = result.stdout.strip().split(", ")
                if len(parts) == 2:
                    used = int(parts[0])
                    total = int(parts[1])
                    return {
                        "used_gb": used / 1024,
                        "total_gb": total / 1024,
                        "used_percent": (used / total) * 100,
                        "available_gb": (total - used) / 1024,
                    }
        except Exception as e:
            logger.warning(f"Erro ao obter uso de VRAM: {e}")
        
        return {
            "used_gb": 0,
            "total_gb": 16,
            "used_percent": 0,
            "available_gb": 16,
        }
    
    def get_status(self) -> Dict[str, Any]:
        """
        Retorna status atual do gerenciador
        
        Returns:
            Dict com status
        """
        vram = self.get_vram_usage()
        return {
            "current_model": self.current_model,
            "current_role": self.current_role.value if self.current_role else None,
            "brain_model": self.brain_model,
            "executor_model": self.executor_model,
            "brain_loaded": self._is_model_loaded(self.brain_model),
            "executor_loaded": self._is_model_loaded(self.executor_model),
            "vram_used_gb": vram["used_gb"],
            "vram_total_gb": vram["total_gb"],
            "vram_used_percent": vram["used_percent"],
            "vram_available_gb": vram["available_gb"],
        }


# Instância global do gerenciador
_model_manager: Optional[ModelManager] = None


def get_model_manager() -> ModelManager:
    """Retorna instância global do gerenciador"""
    global _model_manager
    if _model_manager is None:
        _model_manager = ModelManager(
            brain_model=os.getenv("DEFAULT_MODEL", "qwen2.5-32b-instruct-moe-rtx"),
            executor_model=os.getenv("EXECUTOR_MODEL", "qwen2.5-coder:14b"),
            ollama_base_url=os.getenv("OLLAMA_BASE_URL", "http://localhost:11434"),
        )
    return _model_manager

