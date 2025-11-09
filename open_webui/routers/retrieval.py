"""
Compatibilidade: routers/retrieval.py
"""
from __future__ import annotations

import logging
import sys
from typing import Any, Optional, Callable

from open_webui.env import SRC_LOG_LEVELS, GLOBAL_LOG_LEVEL

logging.basicConfig(stream=sys.stdout, level=GLOBAL_LOG_LEVEL)
log = logging.getLogger(__name__)
log.setLevel(SRC_LOG_LEVELS.get("RAG", logging.INFO))


def get_ef(
    engine: str = "",
    embedding_model: str = "",
    auto_update: bool = False,
) -> Optional[Any]:
    """
    Obter função de embedding
    
    Args:
        engine: Engine de embedding
        embedding_model: Modelo de embedding
        auto_update: Se True, atualiza automaticamente
    
    Returns:
        Função de embedding ou None
    """
    try:
        if embedding_model and engine == "":
            try:
                from sentence_transformers import SentenceTransformer
                
                # Detectar GPU disponível
                device = "cpu"
                try:
                    import torch
                    if torch.cuda.is_available():
                        device = "cuda"
                        gpu_name = torch.cuda.get_device_name(0)
                        log.info(f"GPU CUDA detectada: {gpu_name}")
                    elif hasattr(torch.backends, 'mps') and torch.backends.mps.is_available():
                        device = "mps"  # Apple Silicon
                        log.info("Apple Silicon GPU (MPS) detectada")
                    else:
                        log.info("Usando CPU (GPU não disponível)")
                except ImportError:
                    log.info("PyTorch não instalado. Usando CPU.")
                except Exception as e:
                    log.warning(f"Erro ao detectar GPU: {e}. Usando CPU.")
                
                ef = SentenceTransformer(embedding_model, device=device)
                log.info(f"Embedding function carregada: {embedding_model} no dispositivo: {device}")
                return ef
            except ImportError:
                log.warning("sentence-transformers não instalado")
            except Exception as e:
                log.warning(f"Erro ao carregar SentenceTransformer: {e}")
        return None
    except Exception as e:
        log.warning(f"Erro ao obter função de embedding: {e}")
        return None


def get_rf(
    engine: str = "",
    reranking_model: Optional[str] = None,
    external_reranker_url: str = "",
    external_reranker_api_key: str = "",
    auto_update: bool = False,
) -> Optional[Any]:
    """
    Obter função de reranking
    
    Args:
        engine: Engine de reranking
        reranking_model: Modelo de reranking
        external_reranker_url: URL do reranker externo
        external_reranker_api_key: API key do reranker externo
        auto_update: Se True, atualiza automaticamente
    
    Returns:
        Função de reranking ou None
    """
    try:
        # Por enquanto, retornar None
        # Implementação completa pode carregar modelos de reranking
        return None
    except Exception as e:
        log.warning(f"Erro ao obter função de reranking: {e}")
        return None


def get_embedding_function(
    engine: str = "",
    embedding_model: str = "",
    embedding_function: Optional[Any] = None,
    url: Optional[str] = None,
    key: Optional[str] = None,
    embedding_batch_size: int = 32,
    azure_api_version: Optional[str] = None,
) -> Optional[Callable]:
    """
    Obter função de embedding completa
    
    Args:
        engine: Engine de embedding
        embedding_model: Modelo de embedding
        embedding_function: Função de embedding pré-carregada
        url: URL da API
        key: API key
        embedding_batch_size: Tamanho do batch
        azure_api_version: Versão da API Azure
    
    Returns:
        Função de embedding ou None
    """
    try:
        # Se embedding_function já foi fornecida, usar ela
        if embedding_function is not None:
            return embedding_function
        
        # Tentar carregar função de embedding
        if embedding_model:
            ef = get_ef(engine, embedding_model)
            if ef:
                return ef
        
        # Por enquanto, retornar None
        # Implementação completa pode criar funções para diferentes engines
        return None
    except Exception as e:
        log.warning(f"Erro ao obter função de embedding: {e}")
        return None


def get_reranking_function(
    engine: str = "",
    reranking_model: Optional[str] = None,
    reranking_function: Optional[Any] = None,
) -> Optional[Callable]:
    """
    Obter função de reranking completa
    
    Args:
        engine: Engine de reranking
        reranking_model: Modelo de reranking
        reranking_function: Função de reranking pré-carregada
    
    Returns:
        Função de reranking ou None
    """
    try:
        # Se reranking_function já foi fornecida, usar ela
        if reranking_function is not None:
            return reranking_function
        
        # Tentar carregar função de reranking
        if reranking_model:
            rf = get_rf(engine, reranking_model)
            if rf:
                return rf
        
        # Por enquanto, retornar None
        # Implementação completa pode criar funções para diferentes engines
        return None
    except Exception as e:
        log.warning(f"Erro ao obter função de reranking: {e}")
        return None


__all__ = [
    'get_embedding_function', 'get_reranking_function',
    'get_ef', 'get_rf'
]

