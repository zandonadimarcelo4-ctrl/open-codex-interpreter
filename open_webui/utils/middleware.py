"""
Middleware Utilities - Utilitários de Middleware
Gerencia processamento de payloads e respostas de chat
"""
from __future__ import annotations

import logging
import sys
from typing import Any, Dict

from fastapi import Request

from open_webui.env import SRC_LOG_LEVELS, GLOBAL_LOG_LEVEL

logging.basicConfig(stream=sys.stdout, level=GLOBAL_LOG_LEVEL)
log = logging.getLogger(__name__)
log.setLevel(SRC_LOG_LEVELS.get("MAIN", logging.INFO))


def process_chat_payload(request: Request, payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Processar payload de chat
    
    Args:
        request: Request do FastAPI
        payload: Payload do chat
    
    Returns:
        Payload processado
    """
    try:
        # Por enquanto, retornar payload sem modificações
        # Implementação completa pode processar filtros, etc.
        return payload
    except Exception as e:
        log.exception(f"Erro ao processar payload: {e}")
        return payload


def process_chat_response(request: Request, response: Any) -> Any:
    """
    Processar resposta de chat
    
    Args:
        request: Request do FastAPI
        response: Resposta do chat
    
    Returns:
        Resposta processada
    """
    try:
        # Por enquanto, retornar resposta sem modificações
        # Implementação completa pode processar filtros, etc.
        return response
    except Exception as e:
        log.exception(f"Erro ao processar resposta: {e}")
        return response

