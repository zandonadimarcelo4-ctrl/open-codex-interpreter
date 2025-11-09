"""
Compatibilidade: Re-exporta constants.py da raiz
"""
import sys
from pathlib import Path

# Adicionar raiz ao path para imports
_root = Path(__file__).parent.parent
if str(_root) not in sys.path:
    sys.path.insert(0, str(_root))

# Importar do arquivo original
try:
    from constants import ERROR_MESSAGES, MESSAGES, WEBHOOK_MESSAGES
except ImportError:
    # Fallback se não conseguir importar
    ERROR_MESSAGES = None
    MESSAGES = None
    WEBHOOK_MESSAGES = None

__all__ = ['ERROR_MESSAGES', 'MESSAGES', 'WEBHOOK_MESSAGES']

