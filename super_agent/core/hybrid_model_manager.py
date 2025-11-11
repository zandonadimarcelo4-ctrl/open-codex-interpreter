"""
Gerenciador de Modelos Híbrido (Cloud + Local) com Fallback Automático
Ollama Cloud como cérebro principal, modelos locais como fallback
"""
import os
import logging
import time
from typing import Optional, Dict, Any, List
from enum import Enum

logger = logging.getLogger(__name__)

try:
    import requests
    REQUESTS_AVAILABLE = True
except ImportError:
    REQUESTS_AVAILABLE = False
    logger.warning("⚠️ requests não disponível. Fallback para local apenas.")


class ModelTier(Enum):
    """Camadas de modelos (hierarquia)"""
    CLOUD_PRIMARY = "cloud_primary"  # Ollama Cloud (120B, 480B, 671B)
    LOCAL_FALLBACK = "local_fallback"  # Modelos locais (Qwen32B, DeepSeek-Lite)
    LOCAL_EXECUTOR = "local_executor"  # Executor local (código rápido)


class HybridModelManager:
    """
    Gerenciador de modelos híbrido com fallback automático
    
    Arquitetura:
    1. Ollama Cloud (cérebro principal) - raciocínio profundo, planejamento
    2. Modelos locais (fallback) - continuidade, offline, execução rápida
    3. Executor local (código) - execução direta, sem overhead
    
    Fallback automático:
    - Se Cloud falhar → Local fallback
    - Se Local fallback falhar → Executor local
    - Se todos falharem → Erro tratado
    """
    
    def __init__(
        self,
        # Cloud (Ollama Cloud)
        cloud_model: Optional[str] = None,
        cloud_api_key: Optional[str] = None,
        cloud_base_url: str = "https://api.ollama.cloud/v1",
        cloud_enabled: bool = True,
        # Local Fallback
        local_brain_model: str = "qwen2.5-32b-instruct-moe-rtx",
        local_executor_model: str = "networkjohnny/deepseek-coder-v2-lite-base-q4_k_m-gguf",
        local_ui_model: str = "MHKetbi/UIGEN-T1-Qwen-14:q4_K_S",
        local_base_url: str = "http://localhost:11434",
        # Configuração
        fallback_enabled: bool = True,
        timeout_cloud: int = 30,
        timeout_local: int = 60,
        max_retries: int = 2,
    ):
        """
        Inicializa o gerenciador híbrido
        
        Args:
            cloud_model: Modelo Cloud (ex: "qwen3-coder:480b-cloud" ou "deepseek-v3.1:671b-cloud")
            cloud_api_key: API key do Ollama Cloud (opcional para free tier)
            cloud_base_url: URL base da API Cloud
            cloud_enabled: Se Cloud está habilitado
            local_brain_model: Modelo local para fallback (Brain)
            local_executor_model: Modelo local para executor (código)
            local_ui_model: Modelo local para UI
            local_base_url: URL base do Ollama local
            fallback_enabled: Se fallback automático está habilitado
            timeout_cloud: Timeout para Cloud (segundos)
            timeout_local: Timeout para Local (segundos)
            max_retries: Número máximo de tentativas
        """
        # Cloud configuration
        # Ollama Cloud usa a mesma API do Ollama local, mas em https://ollama.com
        self.cloud_model = cloud_model or os.getenv("OLLAMA_CLOUD_MODEL", "qwen3-coder:480b-cloud")
        self.cloud_api_key = cloud_api_key or os.getenv("OLLAMA_API_KEY", "")  # OLLAMA_API_KEY é a variável oficial
        self.cloud_base_url = cloud_base_url or os.getenv("OLLAMA_CLOUD_BASE_URL", "https://ollama.com")
        self.cloud_base_url = self.cloud_base_url.rstrip("/")
        self.cloud_enabled = cloud_enabled and os.getenv("OLLAMA_CLOUD_ENABLED", "true").lower() == "true"
        
        # Local configuration
        self.local_brain_model = local_brain_model or os.getenv("DEFAULT_MODEL", "qwen2.5-32b-instruct-moe-rtx")
        # Executor: Cline_FuseO1 (híbrido DeepSeekR1 + Qwen2.5, 128K contexto, VS Code integration)
        self.local_executor_model = local_executor_model or os.getenv(
            "EXECUTOR_MODEL",
            "nuibang/Cline_FuseO1-DeepSeekR1-Qwen2.5-Coder-32B-Preview:q4_k_m"
        )
        self.local_ui_model = local_ui_model or os.getenv("EXECUTOR_UI_MODEL", "MHKetbi/UIGEN-T1-Qwen-14:q4_K_S")
        self.local_base_url = local_base_url.rstrip("/")
        
        # Fallback configuration
        self.fallback_enabled = fallback_enabled
        self.timeout_cloud = timeout_cloud
        self.timeout_local = timeout_local
        self.max_retries = max_retries
        
        # Estado
        self.cloud_available = False
        self.local_available = False
        self.last_cloud_check = None
        self.last_local_check = None
        self.cloud_failures = 0
        self.local_failures = 0
        
        # Verificar disponibilidade
        self._check_availability()
        
        logger.info(f"✅ HybridModelManager inicializado")
        logger.info(f"   Cloud: {self.cloud_model} ({'✅ Habilitado' if self.cloud_enabled else '❌ Desabilitado'})")
        logger.info(f"   Local Brain: {self.local_brain_model}")
        logger.info(f"   Local Executor: {self.local_executor_model}")
        logger.info(f"   Fallback: {'✅ Habilitado' if self.fallback_enabled else '❌ Desabilitado'}")
    
    def _check_availability(self):
        """Verifica disponibilidade de Cloud e Local"""
        # Verificar Cloud
        if self.cloud_enabled:
            self.cloud_available = self._check_cloud_available()
            self.last_cloud_check = time.time()
        
        # Verificar Local
        self.local_available = self._check_local_available()
        self.last_local_check = time.time()
    
    def _check_cloud_available(self) -> bool:
        """Verifica se Ollama Cloud está disponível"""
        try:
            if not REQUESTS_AVAILABLE:
                return False
            
            # Verificar endpoint Cloud (mesmo formato do Ollama local)
            url = f"{self.cloud_base_url}/api/tags"
            headers = {}
            if self.cloud_api_key:
                headers["Authorization"] = f"Bearer {self.cloud_api_key}"
            
            response = requests.get(url, headers=headers, timeout=5)
            return response.status_code == 200
        except Exception as e:
            logger.warning(f"⚠️ Ollama Cloud não disponível: {e}")
            return False
    
    def _check_local_available(self) -> bool:
        """Verifica se Ollama Local está disponível"""
        try:
            if not REQUESTS_AVAILABLE:
                return False
            
            url = f"{self.local_base_url}/api/tags"
            response = requests.get(url, timeout=5)
            return response.status_code == 200
        except Exception as e:
            logger.warning(f"⚠️ Ollama Local não disponível: {e}")
            return False
    
    def get_model_for_task(
        self,
        task_type: str,
        use_cloud: bool = True,
        force_local: bool = False,
    ) -> Dict[str, Any]:
        """
        Retorna modelo apropriado para tarefa com fallback automático
        
        Args:
            task_type: Tipo de tarefa ("planning", "reasoning", "code", "execution", "ui_generation")
            use_cloud: Se deve tentar usar Cloud primeiro
            force_local: Se deve forçar uso de local (ignora Cloud)
        
        Returns:
            Dict com informações do modelo selecionado
        """
        # Forçar local se especificado
        if force_local:
            return self._get_local_model(task_type)
        
        # Tentar Cloud primeiro (se habilitado e disponível)
        if use_cloud and self.cloud_enabled and self.cloud_available and not force_local:
            # Verificar se Cloud está disponível (re-verificar a cada 60s)
            if self.last_cloud_check is None or (time.time() - self.last_cloud_check) > 60:
                self.cloud_available = self._check_cloud_available()
                self.last_cloud_check = time.time()
            
            if self.cloud_available:
                return {
                    "model": self.cloud_model,
                    "base_url": self.cloud_base_url,
                    "api_key": self.cloud_api_key,
                    "tier": ModelTier.CLOUD_PRIMARY.value,
                    "timeout": self.timeout_cloud,
                    "provider": "ollama_cloud",  # Mesma API do Ollama, mas na Cloud
                }
        
        # Fallback para local
        if self.fallback_enabled:
            return self._get_local_model(task_type)
        
        # Se fallback desabilitado e Cloud não disponível, erro
        raise RuntimeError("Cloud não disponível e fallback desabilitado")
    
    def _get_local_model(self, task_type: str) -> Dict[str, Any]:
        """
        Retorna modelo local apropriado
        
        Args:
            task_type: Tipo de tarefa
        
        Returns:
            Dict com informações do modelo local
        """
        # Verificar se Local está disponível (re-verificar a cada 60s)
        if self.last_local_check is None or (time.time() - self.last_local_check) > 60:
            self.local_available = self._check_local_available()
            self.last_local_check = time.time()
        
        if not self.local_available:
            raise RuntimeError("Ollama Local não disponível")
        
        # Selecionar modelo local baseado no tipo de tarefa
        if task_type in ["ui_generation", "ui", "html", "css", "frontend"]:
            model = self.local_ui_model
            tier = ModelTier.LOCAL_EXECUTOR.value
        elif task_type in ["code", "execution", "debugging", "refactoring"]:
            model = self.local_executor_model
            tier = ModelTier.LOCAL_EXECUTOR.value
        else:
            model = self.local_brain_model
            tier = ModelTier.LOCAL_FALLBACK.value
        
        return {
            "model": model,
            "base_url": self.local_base_url,
            "api_key": None,
            "tier": tier,
            "timeout": self.timeout_local,
            "provider": "ollama_local",
        }
    
    def call_with_fallback(
        self,
        prompt: str,
        task_type: str = "reasoning",
        messages: Optional[List[Dict[str, Any]]] = None,
        use_cloud: bool = True,
        force_local: bool = False,
    ) -> Dict[str, Any]:
        """
        Chama modelo com fallback automático
        
        Args:
            prompt: Prompt do usuário
            task_type: Tipo de tarefa
            messages: Mensagens (opcional, para chat)
            use_cloud: Se deve tentar usar Cloud primeiro
            force_local: Se deve forçar uso de local
        
        Returns:
            Dict com resposta do modelo
        """
        # Obter modelo apropriado
        model_info = self.get_model_for_task(task_type, use_cloud, force_local)
        
        # Tentar chamar modelo
        for attempt in range(self.max_retries):
            try:
                response = self._call_model(model_info, prompt, messages)
                
                # Resetar contadores de falha em caso de sucesso
                if model_info["tier"] == ModelTier.CLOUD_PRIMARY.value:
                    self.cloud_failures = 0
                else:
                    self.local_failures = 0
                
                return {
                    "response": response,
                    "model": model_info["model"],
                    "tier": model_info["tier"],
                    "provider": model_info["provider"],
                    "success": True,
                }
            except Exception as e:
                logger.warning(f"⚠️ Tentativa {attempt + 1} falhou: {e}")
                
                # Se Cloud falhou, tentar fallback para local
                if model_info["tier"] == ModelTier.CLOUD_PRIMARY.value and self.fallback_enabled:
                    logger.info(f"🔄 Fallback para local após falha do Cloud")
                    self.cloud_failures += 1
                    model_info = self._get_local_model(task_type)
                    continue
                
                # Se última tentativa, re-raise
                if attempt == self.max_retries - 1:
                    raise
        
        # Se todas as tentativas falharam, erro
        raise RuntimeError("Todas as tentativas falharam")
    
    def _call_model(
        self,
        model_info: Dict[str, Any],
        prompt: str,
        messages: Optional[List[Dict[str, Any]]] = None,
    ) -> str:
        """
        Chama modelo (Cloud ou Local)
        
        Args:
            model_info: Informações do modelo
            prompt: Prompt do usuário
            messages: Mensagens (opcional)
        
        Returns:
            Resposta do modelo
        """
        if not REQUESTS_AVAILABLE:
            raise RuntimeError("requests não disponível")
        
        # Preparar mensagens
        if messages is None:
            messages = [{"role": "user", "content": prompt}]
        
        # Ollama Cloud usa a mesma API do Ollama local
        # URL: https://ollama.com/api/chat (mesmo formato)
        url = f"{model_info['base_url']}/api/chat"
        headers = {
            "Content-Type": "application/json",
        }
        if model_info["api_key"]:
            headers["Authorization"] = f"Bearer {model_info['api_key']}"
        
        # Preparar payload (mesmo formato para Cloud e Local)
        payload = {
            "model": model_info["model"],
            "messages": messages,
            "stream": False,
        }
        
        # Fazer requisição
        response = requests.post(
            url,
            json=payload,
            headers=headers,
            timeout=model_info["timeout"],
        )
        
        if response.status_code != 200:
            raise RuntimeError(f"Erro ao chamar modelo: {response.status_code} - {response.text}")
        
        # Parsear resposta (mesmo formato para Cloud e Local)
        data = response.json()
        return data["message"]["content"]
    
    def get_status(self) -> Dict[str, Any]:
        """
        Retorna status do gerenciador híbrido
        
        Returns:
            Dict com status
        """
        return {
            "cloud_enabled": self.cloud_enabled,
            "cloud_available": self.cloud_available,
            "cloud_model": self.cloud_model,
            "cloud_failures": self.cloud_failures,
            "local_available": self.local_available,
            "local_brain_model": self.local_brain_model,
            "local_executor_model": self.local_executor_model,
            "local_ui_model": self.local_ui_model,
            "local_failures": self.local_failures,
            "fallback_enabled": self.fallback_enabled,
            "last_cloud_check": self.last_cloud_check,
            "last_local_check": self.last_local_check,
        }


# Instância global do gerenciador híbrido
_hybrid_manager: Optional[HybridModelManager] = None


def get_hybrid_model_manager() -> HybridModelManager:
    """Retorna instância global do gerenciador híbrido"""
    global _hybrid_manager
    if _hybrid_manager is None:
        _hybrid_manager = HybridModelManager(
            cloud_model=os.getenv("OLLAMA_CLOUD_MODEL", "qwen3-coder:480b-cloud"),
            cloud_api_key=os.getenv("OLLAMA_API_KEY", ""),  # OLLAMA_API_KEY é a variável oficial
            cloud_base_url=os.getenv("OLLAMA_CLOUD_BASE_URL", "https://ollama.com"),  # URL oficial da Ollama Cloud
            cloud_enabled=os.getenv("OLLAMA_CLOUD_ENABLED", "true").lower() == "true",
            local_brain_model=os.getenv("DEFAULT_MODEL", "qwen2.5-32b-instruct-moe-rtx"),
            local_executor_model=os.getenv(
                "EXECUTOR_MODEL",
                "nuibang/Cline_FuseO1-DeepSeekR1-Qwen2.5-Coder-32B-Preview:q4_k_m"
            ),
            local_ui_model=os.getenv("EXECUTOR_UI_MODEL", "MHKetbi/UIGEN-T1-Qwen-14:q4_K_S"),
            local_base_url=os.getenv("OLLAMA_BASE_URL", "http://localhost:11434"),
            fallback_enabled=os.getenv("FALLBACK_ENABLED", "true").lower() == "true",
        )
    return _hybrid_manager

