"""
Compatibilidade: Re-exporta env.py da raiz
"""
import sys
from pathlib import Path

# Adicionar raiz ao path para imports
_root = Path(__file__).parent.parent
if str(_root) not in sys.path:
    sys.path.insert(0, str(_root))

# Importar tudo do env.py original
from env import *

