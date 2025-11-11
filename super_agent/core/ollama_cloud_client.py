"""
Cliente customizado para Ollama Cloud
Adapta a API da Ollama Cloud para AutoGen v2 (OpenAI-compatible)
"""
import os
import logging
import requests
from typing import Optional, List, Dict, Any, Iterator

logger = logging.getLogger(__name__)

try:
    from autogen_ext.models.openai import OpenAIChatCompletionClient
    AUTOGEN_V2_AVAILABLE = True
except ImportError:
    AUTOGEN_V2_AVAILABLE = False
    logger.error("autogen-ext não está instalado")


class OllamaCloudClient:
    """
    Cliente customizado para Ollama Cloud
    
    Ollama Cloud usa a mesma API do Ollama local, mas:
    - URL: https://ollama.com (não localhost:11434)
    - Autenticação: Bearer token (OLLAMA_API_KEY)
    - Formato: Mesmo formato do Ollama local (/api/chat)
    """
    
    def __init__(
        self,
        model: str,
        api_key: Optional[str] = None,
        base_url: str = "https://ollama.com",
        timeout: int = 30,
    ):
        """
        Inicializa o cliente Ollama Cloud
        
        Args:
            model: Nome do modelo Cloud (ex: "qwen3-coder:480b-cloud")
            api_key: API key do Ollama Cloud (OLLAMA_API_KEY)
            base_url: URL base da Ollama Cloud (https://ollama.com)
            timeout: Timeout para requisições (segundos)
        """
        self.model = model
        self.api_key = api_key or os.getenv("OLLAMA_API_KEY", "")
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout
        
        logger.info(f"✅ OllamaCloudClient inicializado")
        logger.info(f"   Modelo: {model}")
        logger.info(f"   Base URL: {base_url}")
        logger.info(f"   API Key: {'✅ Configurada' if self.api_key else '❌ Não configurada'}")
    
    def create(
        self,
        messages: List[Dict[str, Any]],
        stream: bool = False,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Cria uma conversa com o modelo Cloud
        
        Args:
            messages: Lista de mensagens
            stream: Se deve retornar stream
            **kwargs: Argumentos adicionais
        
        Returns:
            Resposta do modelo
        """
        url = f"{self.base_url}/api/chat"
        headers = {
            "Content-Type": "application/json",
        }
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"
        
        payload = {
            "model": self.model,
            "messages": messages,
            "stream": stream,
            **kwargs
        }
        
        response = requests.post(
            url,
            json=payload,
            headers=headers,
            timeout=self.timeout,
        )
        
        if response.status_code != 200:
            raise RuntimeError(f"Erro ao chamar Ollama Cloud: {response.status_code} - {response.text}")
        
        return response.json()
    
    def chat(
        self,
        messages: List[Dict[str, Any]],
        stream: bool = False,
        **kwargs
    ) -> Iterator[Dict[str, Any]]:
        """
        Chama o modelo Cloud com streaming
        
        Args:
            messages: Lista de mensagens
            stream: Se deve retornar stream
            **kwargs: Argumentos adicionais
        
        Yields:
            Chunks da resposta
        """
        url = f"{self.base_url}/api/chat"
        headers = {
            "Content-Type": "application/json",
        }
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"
        
        payload = {
            "model": self.model,
            "messages": messages,
            "stream": stream,
            **kwargs
        }
        
        response = requests.post(
            url,
            json=payload,
            headers=headers,
            timeout=self.timeout,
            stream=stream,
        )
        
        if response.status_code != 200:
            raise RuntimeError(f"Erro ao chamar Ollama Cloud: {response.status_code} - {response.text}")
        
        if stream:
            for line in response.iter_lines():
                if line:
                    import json
                    data = json.loads(line)
                    yield data
        else:
            yield response.json()


def create_ollama_cloud_client(
    model: Optional[str] = None,
    api_key: Optional[str] = None,
    base_url: Optional[str] = None,
) -> OllamaCloudClient:
    """
    Cria um cliente Ollama Cloud
    
    Args:
        model: Nome do modelo Cloud
        api_key: API key do Ollama Cloud
        base_url: URL base da Ollama Cloud
    
    Returns:
        OllamaCloudClient configurado
    """
    return OllamaCloudClient(
        model=model or os.getenv("OLLAMA_CLOUD_MODEL", "qwen3-coder:480b-cloud"),
        api_key=api_key or os.getenv("OLLAMA_API_KEY", ""),
        base_url=base_url or os.getenv("OLLAMA_CLOUD_BASE_URL", "https://ollama.com"),
    )

