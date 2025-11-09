"""
Compatibilidade: audit.py
"""
from __future__ import annotations

from enum import Enum

class AuditLevel(str, Enum):
    """Níveis de auditoria"""
    NONE = "NONE"
    METADATA = "METADATA"
    REQUEST = "REQUEST"
    REQUEST_RESPONSE = "REQUEST_RESPONSE"

class AuditLoggingMiddleware:
    """Middleware de auditoria - placeholder"""
    def __init__(self, *args, **kwargs):
        pass

__all__ = ['AuditLevel', 'AuditLoggingMiddleware']

