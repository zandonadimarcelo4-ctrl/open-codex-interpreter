"""
LLM Client para AutoGen v2
Usa o mesmo modelo Ollama que o Open Interpreter
"""
import os
import logging
from typing import Optional

logger = logging.getLogger(__name__)

try:
    from autogen_ext.models.openai import OpenAIChatCompletionClient
    AUTOGEN_EXT_AVAILABLE = True
except ImportError:
    AUTOGEN_EXT_AVAILABLE = False
    logger.warning("autogen-ext não disponível. Instale: pip install autogen-ext[openai]")

try:
    from autogen_ext.models.ollama import OllamaChatCompletionClient
    OLLAMA_CLIENT_AVAILABLE = True
except ImportError:
    OLLAMA_CLIENT_AVAILABLE = False
    logger.warning("OllamaChatCompletionClient não disponível. Instale: pip install autogen-ext[ollama]")


def get_llm_client(model: Optional[str] = None, api_base: Optional[str] = None) -> any:
    """
    Cria um cliente LLM para AutoGen v2.
    
    Usa o mesmo modelo Ollama que o Open Interpreter (uma única instância).
    
    Args:
        model: Nome do modelo (padrão: do ambiente ou deepseek-coder-v2-16b-q4_k_m-rtx)
        api_base: URL base da API (padrão: http://localhost:11434/v1 para Ollama)
    
    Returns:
        Cliente LLM (OpenAIChatCompletionClient ou OllamaChatCompletionClient)
    """
    if not AUTOGEN_EXT_AVAILABLE:
        raise ImportError("autogen-ext não está disponível. Instale: pip install autogen-ext[openai]")
    
    # Obter modelo do ambiente ou usar padrão (qwen2.5:14b suporta function calling)
    model = model or os.getenv("DEFAULT_MODEL", "qwen2.5:14b")
    
    # Obter API base do ambiente
    # IMPORTANTE: Usar a mesma URL que o Open Interpreter (OllamaAdapter)
    # OLLAMA_BASE_URL deve ser "http://localhost:11434" (sem /v1 ou /api)
    api_base = api_base or os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    
    # Garantir que não há /v1 ou /api no final (será adicionado pelo cliente)
    api_base = api_base.rstrip("/").rstrip("/v1").rstrip("/api")
    
    # Se a API base é Ollama, usar OllamaChatCompletionClient
    if "localhost:11434" in api_base or "127.0.0.1:11434" in api_base or "ollama" in api_base.lower():
        if OLLAMA_CLIENT_AVAILABLE:
            # Ollama: formato "ollama/modelo" ou apenas "modelo"
            if not model.startswith("ollama/"):
                ollama_model = model
            else:
                ollama_model = model.replace("ollama/", "")
            
            logger.info(f"✅ Usando OllamaChatCompletionClient")
            logger.info(f"   Modelo: {ollama_model}")
            logger.info(f"   Base URL: {api_base}")
            logger.info(f"   ✅ Mesma instância que Open Interpreter (OllamaAdapter)")
            return OllamaChatCompletionClient(
                model=ollama_model,
                base_url=api_base,  # OllamaChatCompletionClient adiciona /v1 automaticamente
            )
        else:
            # Fallback: usar OpenAIChatCompletionClient com formato Ollama
            logger.warning("OllamaChatCompletionClient não disponível. Usando OpenAIChatCompletionClient com formato Ollama.")
            api_url = f"{api_base}/v1" if not api_base.endswith("/v1") else api_base
            logger.info(f"✅ Usando OpenAIChatCompletionClient (fallback)")
            logger.info(f"   Modelo: ollama/{model}")
            logger.info(f"   API URL: {api_url}")
            logger.info(f"   ✅ Mesma instância que Open Interpreter (OllamaAdapter)")
            return OpenAIChatCompletionClient(
                model=f"ollama/{model}",
                api_base=api_url,
            )
    else:
        # OpenAI ou outro
        api_url = f"{api_base}/v1" if not api_base.endswith("/v1") else api_base
        return OpenAIChatCompletionClient(
            model=model,
            api_base=api_url,
        )

