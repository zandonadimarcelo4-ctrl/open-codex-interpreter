"""
Compatibilidade: logger.py
"""
import sys
import logging
from pathlib import Path

# Adicionar raiz ao path
_root = Path(__file__).parent.parent.parent
if str(_root) not in sys.path:
    sys.path.insert(0, str(_root))

# Por enquanto, criar logger básico
# O arquivo real será movido depois
logger = logging.getLogger(__name__)

def start_logger():
    """Inicia o logger"""
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )

__all__ = ['logger', 'start_logger']

