"""
Chat Utilities - Utilitários de Chat
Gerencia geração de completions de chat e ações
"""
from __future__ import annotations

import time
import logging
import sys
from typing import Any, Dict, Optional

from fastapi import Request
from starlette.responses import Response, StreamingResponse

try:
    from open_webui.models.users import UserModel
except ImportError:
    UserModel = None

try:
    from open_webui.socket.main import (
        get_event_call,
        get_event_emitter,
    )
except ImportError:
    get_event_call = None
    get_event_emitter = None

try:
    from open_webui.functions import generate_function_chat_completion
except ImportError:
    generate_function_chat_completion = None

try:
    from open_webui.routers.openai import (
        generate_chat_completion as generate_openai_chat_completion,
    )
except ImportError:
    generate_openai_chat_completion = None

try:
    from open_webui.routers.ollama import (
        generate_chat_completion as generate_ollama_chat_completion,
    )
except ImportError:
    generate_ollama_chat_completion = None

try:
    from open_webui.utils.models import get_all_models, check_model_access
except ImportError:
    get_all_models = None
    check_model_access = None

from open_webui.env import SRC_LOG_LEVELS, GLOBAL_LOG_LEVEL, BYPASS_MODEL_ACCESS_CONTROL

logging.basicConfig(stream=sys.stdout, level=GLOBAL_LOG_LEVEL)
log = logging.getLogger(__name__)
log.setLevel(SRC_LOG_LEVELS.get("MAIN", logging.INFO))


async def generate_chat_completion(
    request: Request,
    form_data: Dict[str, Any],
    user: Any,
    bypass_filter: bool = False,
) -> Response:
    """
    Gerar completion de chat
    
    Args:
        request: Request do FastAPI
        form_data: Dados do formulário
        user: Usuário
        bypass_filter: Se True, ignora filtros
    
    Returns:
        Resposta do chat
    """
    try:
        model_id = form_data.get("model", "")
        
        # Verificar se modelo é uma função
        if generate_function_chat_completion:
            try:
                models = await get_all_models(request) if get_all_models else {}
                if model_id in models and models[model_id].get("pipe"):
                    return await generate_function_chat_completion(
                        request, form_data, user, models
                    )
            except Exception as e:
                log.warning(f"Erro ao verificar função: {e}")
        
        # Verificar acesso ao modelo
        if check_model_access and not BYPASS_MODEL_ACCESS_CONTROL:
            try:
                if not check_model_access(user, {"id": model_id}):
                    return Response(
                        content='{"error": "Model access denied"}',
                        status_code=403,
                        media_type="application/json"
                    )
            except Exception as e:
                log.warning(f"Erro ao verificar acesso ao modelo: {e}")
        
        # Tentar OpenAI primeiro
        if generate_openai_chat_completion:
            try:
                return await generate_openai_chat_completion(request, form_data, user)
            except Exception as e:
                log.debug(f"Erro ao gerar completion OpenAI: {e}")
        
        # Tentar Ollama
        if generate_ollama_chat_completion:
            try:
                return await generate_ollama_chat_completion(request, form_data, user)
            except Exception as e:
                log.error(f"Erro ao gerar completion Ollama: {e}")
        
        # Se nenhum funcionar, retornar erro
        return Response(
            content='{"error": "No chat completion provider available"}',
            status_code=500,
            media_type="application/json"
        )
        
    except Exception as e:
        log.exception(f"Erro ao gerar completion de chat: {e}")
        return Response(
            content=f'{{"error": "Internal server error: {str(e)}"}}',
            status_code=500,
            media_type="application/json"
        )


async def chat_completed(
    request: Request,
    form_data: Dict[str, Any],
    user: Any,
) -> Response:
    """
    Handler para quando chat é completado
    
    Args:
        request: Request do FastAPI
        form_data: Dados do formulário
        user: Usuário
    
    Returns:
        Resposta
    """
    try:
        # Por enquanto, apenas logar
        log.info(f"Chat completado para usuário {user.id if hasattr(user, 'id') else 'unknown'}")
        
        # Emitir evento se disponível
        if get_event_emitter:
            try:
                await get_event_emitter(request).emit(
                    "chat_completed",
                    {
                        "user_id": user.id if hasattr(user, "id") else None,
                        "chat_id": form_data.get("chat_id"),
                    }
                )
            except Exception as e:
                log.warning(f"Erro ao emitir evento: {e}")
        
        return Response(
            content='{"status": "ok"}',
            status_code=200,
            media_type="application/json"
        )
    except Exception as e:
        log.exception(f"Erro ao processar chat completado: {e}")
        return Response(
            content='{"error": "Internal server error"}',
            status_code=500,
            media_type="application/json"
        )


async def chat_action(
    request: Request,
    form_data: Dict[str, Any],
    user: Any,
) -> Response:
    """
    Handler para ações de chat
    
    Args:
        request: Request do FastAPI
        form_data: Dados do formulário
        user: Usuário
    
    Returns:
        Resposta
    """
    try:
        action = form_data.get("action", "")
        
        log.info(f"Ação de chat: {action} para usuário {user.id if hasattr(user, 'id') else 'unknown'}")
        
        # Processar ação específica
        if action == "regenerate":
            # Regenerar resposta
            return await generate_chat_completion(request, form_data, user)
        elif action == "stop":
            # Parar geração
            if get_event_emitter:
                try:
                    await get_event_emitter(request).emit(
                        "chat_stopped",
                        {
                            "user_id": user.id if hasattr(user, "id") else None,
                            "chat_id": form_data.get("chat_id"),
                        }
                    )
                except Exception as e:
                    log.warning(f"Erro ao emitir evento: {e}")
            return Response(
                content='{"status": "stopped"}',
                status_code=200,
                media_type="application/json"
            )
        else:
            # Ação desconhecida
            return Response(
                content=f'{{"error": "Unknown action: {action}"}}',
                status_code=400,
                media_type="application/json"
            )
            
    except Exception as e:
        log.exception(f"Erro ao processar ação de chat: {e}")
        return Response(
            content='{"error": "Internal server error"}',
            status_code=500,
            media_type="application/json"
        )

