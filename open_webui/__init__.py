"""
Open WebUI package - Compatibilidade com imports existentes
Este pacote mantém compatibilidade com a estrutura antiga enquanto reorganizamos.
"""
import sys
from pathlib import Path

# Adicionar raiz ao path
_root = Path(__file__).parent.parent
if str(_root) not in sys.path:
    sys.path.insert(0, str(_root))

# Importar constantes da raiz
from constants import ERROR_MESSAGES

__all__ = ['ERROR_MESSAGES']

