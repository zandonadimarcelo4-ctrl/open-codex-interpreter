"""
Utils package - Compatibilidade
"""
import sys
from pathlib import Path

# Adicionar raiz ao path
_root = Path(__file__).parent.parent.parent
if str(_root) not in sys.path:
    sys.path.insert(0, str(_root))

# Importar logger do módulo de compatibilidade
from .logger import logger, start_logger
from .audit import AuditLevel, AuditLoggingMiddleware

# Importar redis se disponível
try:
    from .redis import get_redis_connection, get_sentinels_from_env
    __all__ = ['logger', 'start_logger', 'AuditLevel', 'AuditLoggingMiddleware', 'get_redis_connection', 'get_sentinels_from_env']
except ImportError:
    __all__ = ['logger', 'start_logger', 'AuditLevel', 'AuditLoggingMiddleware']

