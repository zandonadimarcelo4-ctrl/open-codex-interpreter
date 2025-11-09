"""
Compatibilidade: main.py
"""
import sys
from pathlib import Path

# Adicionar raiz ao path
_root = Path(__file__).parent.parent
if str(_root) not in sys.path:
    sys.path.insert(0, str(_root))

# Importar do main.py original
# Isso permite que imports como "from open_webui.main import app" funcionem
from main import *

