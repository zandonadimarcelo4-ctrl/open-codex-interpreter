"""
Compatibilidade: audit.py
"""
from enum import Enum

class AuditLevel(str, Enum):
    """Níveis de auditoria"""
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"

class AuditLoggingMiddleware:
    """Middleware de auditoria - placeholder"""
    def __init__(self, *args, **kwargs):
        pass

__all__ = ['AuditLevel', 'AuditLoggingMiddleware']

