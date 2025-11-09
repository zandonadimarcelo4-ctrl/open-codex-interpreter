"""
Access Control Utilities - Utilitários de Controle de Acesso
Gerencia permissões e controle de acesso
"""
from __future__ import annotations

import logging
import sys
from typing import Any, Optional

from open_webui.env import SRC_LOG_LEVELS, GLOBAL_LOG_LEVEL

logging.basicConfig(stream=sys.stdout, level=GLOBAL_LOG_LEVEL)
log = logging.getLogger(__name__)
log.setLevel(SRC_LOG_LEVELS.get("MAIN", logging.INFO))


def has_access(
    user_id: str,
    type: str = "write",
    access_control: Optional[dict] = None,
    user_group_ids: Optional[set] = None,
    strict: bool = True,
) -> bool:
    """
    Verificar se usuário tem acesso
    
    Args:
        user_id: ID do usuário
        type: Tipo de acesso (read, write)
        access_control: Controle de acesso (dict com group_ids e user_ids)
        user_group_ids: IDs dos grupos do usuário
        strict: Se True, retorna False se access_control for None e type != "read"
    
    Returns:
        True se usuário tem acesso, False caso contrário
    """
    if access_control is None:
        if strict:
            return type == "read"
        else:
            return True
    
    # Se user_group_ids não foi fornecido, tentar obter dos grupos
    if user_group_ids is None:
        try:
            from open_webui.models.groups import Groups
            user_groups = Groups.get_groups_by_member_id(user_id)
            user_group_ids = {group.id for group in user_groups}
        except Exception:
            user_group_ids = set()
    
    # Obter permissões do tipo solicitado
    permission_access = access_control.get(type, {})
    permitted_group_ids = permission_access.get("group_ids", [])
    permitted_user_ids = permission_access.get("user_ids", [])
    
    # Verificar se usuário ou grupo tem acesso
    return user_id in permitted_user_ids or any(
        group_id in permitted_group_ids for group_id in user_group_ids
    )


def check_admin_access(user: Optional[Any] = None) -> bool:
    """
    Verificar se usuário tem acesso de administrador
    
    Args:
        user: Usuário a verificar
    
    Returns:
        True se usuário é admin, False caso contrário
    """
    if user is None:
        return False
    
    if hasattr(user, "role"):
        return user.role == "admin"
    
    return False


def check_model_access(user: Optional[Any] = None, model: Optional[Any] = None) -> bool:
    """
    Verificar se usuário tem acesso ao modelo
    
    Args:
        user: Usuário a verificar
        model: Modelo a verificar
    
    Returns:
        True se usuário tem acesso ao modelo, False caso contrário
    """
    # Por enquanto, retornar True para todos
    # Implementação completa pode verificar permissões específicas do modelo
    return True

