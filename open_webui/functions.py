"""
Functions Module - Módulo de Funções
Gerencia funções e modelos de funções
"""
from __future__ import annotations

import logging
import sys
from typing import Any, Dict, List, Optional

from fastapi import Request

try:
    from open_webui.models.functions import Functions
except ImportError:
    # Se Functions não estiver disponível, criar uma versão simplificada
    Functions = None

try:
    from open_webui.utils.plugin import load_function_module_by_id
except ImportError:
    load_function_module_by_id = None

from open_webui.env import SRC_LOG_LEVELS, GLOBAL_LOG_LEVEL

logging.basicConfig(stream=sys.stdout, level=GLOBAL_LOG_LEVEL)
log = logging.getLogger(__name__)
log.setLevel(SRC_LOG_LEVELS.get("MAIN", logging.INFO))


def get_function_module_by_id(request: Request, pipe_id: str):
    """
    Obter módulo de função por ID
    
    Args:
        request: Request do FastAPI
        pipe_id: ID da função
    
    Returns:
        Módulo da função ou None
    """
    if load_function_module_by_id is None:
        log.warning("load_function_module_by_id não disponível")
        return None
    
    # Verificar se função está em cache
    if not hasattr(request.app.state, "FUNCTION_MODULES"):
        request.app.state.FUNCTION_MODULES = {}
    
    if pipe_id in request.app.state.FUNCTION_MODULES:
        return request.app.state.FUNCTION_MODULES[pipe_id]
    
    # Carregar módulo da função
    try:
        if callable(load_function_module_by_id):
            # Se retorna tupla (module, path, content)
            result = load_function_module_by_id(pipe_id)
            if isinstance(result, tuple):
                function_module = result[0]
            else:
                function_module = result
        else:
            function_module = None
        
        if function_module:
            request.app.state.FUNCTION_MODULES[pipe_id] = function_module
        return function_module
    except Exception as e:
        log.exception(f"Falha ao carregar módulo da função {pipe_id}: {e}")
        return None


async def get_function_models(request: Request) -> List[Dict[str, Any]]:
    """
    Obter modelos de funções (pipes)
    
    Args:
        request: Request do FastAPI
    
    Returns:
        Lista de modelos de funções
    """
    try:
        # Se Functions não estiver disponível, retornar lista vazia
        if Functions is None:
            log.debug("Functions não disponível, retornando lista vazia")
            return []
        
        # Obter funções do tipo "pipe" ativas
        try:
            pipes = Functions.get_functions_by_type("pipe", active_only=True)
        except Exception as e:
            log.warning(f"Falha ao obter funções do tipo 'pipe': {e}")
            return []
        
        if not pipes:
            log.debug("Nenhuma função do tipo 'pipe' encontrada")
            return []
        
        pipe_models = []
        
        for pipe in pipes:
            try:
                pipe_id = pipe.id if hasattr(pipe, "id") else str(pipe)
                function_module = get_function_module_by_id(request, pipe_id)
                
                if function_module is None:
                    log.debug(f"Módulo da função {pipe_id} não encontrado")
                    continue
                
                # Verificar se função é um manifold (contém sub-pipes)
                if hasattr(function_module, "pipes"):
                    sub_pipes = []
                    
                    try:
                        # Verificar se pipes é uma função ou uma lista
                        if callable(function_module.pipes):
                            sub_pipes = function_module.pipes()
                        else:
                            sub_pipes = function_module.pipes
                    except Exception as e:
                        log.exception(f"Erro ao obter sub-pipes de {pipe_id}: {e}")
                        sub_pipes = []
                    
                    log.debug(
                        f"get_function_models: função '{pipe_id}' é um manifold de {len(sub_pipes)} sub-pipes"
                    )
                    
                    # Adicionar cada sub-pipe como modelo
                    for p in sub_pipes:
                        if isinstance(p, dict):
                            sub_pipe_id = f'{pipe_id}.{p.get("id", "")}'
                            sub_pipe_name = p.get("name", sub_pipe_id)
                        else:
                            sub_pipe_id = f'{pipe_id}.{str(p)}'
                            sub_pipe_name = str(p)
                        
                        if hasattr(function_module, "name"):
                            sub_pipe_name = f"{function_module.name} {sub_pipe_name}"
                        
                        pipe_type = pipe.type if hasattr(pipe, "type") else "pipe"
                        pipe_flag = {"type": pipe_type}
                        
                        created_at = 0
                        if hasattr(pipe, "created_at"):
                            if hasattr(pipe.created_at, "timestamp"):
                                created_at = int(pipe.created_at.timestamp())
                            elif hasattr(pipe.created_at, "timestamp"):
                                created_at = int(pipe.created_at)
                        
                        pipe_models.append({
                            "id": sub_pipe_id,
                            "name": sub_pipe_name,
                            "object": "model",
                            "created": created_at,
                            "owned_by": "openai",
                            "pipe": pipe_flag,
                        })
                else:
                    # Função simples (não é manifold)
                    pipe_type = pipe.type if hasattr(pipe, "type") else "pipe"
                    pipe_flag = {"type": pipe_type}
                    
                    pipe_name = pipe.name if hasattr(pipe, "name") else pipe_id
                    if hasattr(function_module, "name"):
                        pipe_name = function_module.name
                    
                    created_at = 0
                    if hasattr(pipe, "created_at"):
                        if hasattr(pipe.created_at, "timestamp"):
                            created_at = int(pipe.created_at.timestamp())
                        elif isinstance(pipe.created_at, (int, float)):
                            created_at = int(pipe.created_at)
                    
                    pipe_models.append({
                        "id": pipe_id,
                        "name": pipe_name,
                        "object": "model",
                        "created": created_at,
                        "owned_by": "openai",
                        "pipe": pipe_flag,
                    })
            except Exception as e:
                log.exception(f"Erro ao processar função {pipe}: {e}")
                continue
        
        log.debug(f"get_function_models retornou {len(pipe_models)} modelos")
        return pipe_models
        
    except Exception as e:
        log.exception(f"Erro ao obter modelos de funções: {e}")
        return []


async def generate_function_chat_completion(
    request: Request,
    form_data: Dict[str, Any],
    user: Any,
    models: Dict[str, Any] = {}
) -> Dict[str, Any]:
    """
    Gerar completion de chat usando função
    
    Args:
        request: Request do FastAPI
        form_data: Dados do formulário
        user: Usuário
        models: Dicionário de modelos
    
    Returns:
        Resposta da função
    """
    try:
        model_id = form_data.get("model", "")
        
        # Verificar se modelo é uma função
        if model_id in models and models[model_id].get("pipe"):
            pipe_id = model_id.split(".")[0]  # Obter ID base do pipe
            function_module = get_function_module_by_id(request, pipe_id)
            
            if function_module and hasattr(function_module, "generate_chat_completion"):
                return await function_module.generate_chat_completion(
                    request, form_data, user, models
                )
        
        # Se não for função, retornar erro
        raise ValueError(f"Modelo {model_id} não é uma função válida")
        
    except Exception as e:
        log.exception(f"Erro ao gerar completion de função: {e}")
        raise
