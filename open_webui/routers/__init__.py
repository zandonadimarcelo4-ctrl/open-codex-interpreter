"""
Routers package - Compatibilidade
"""
import sys
from pathlib import Path

# Adicionar raiz ao path
_root = Path(__file__).parent.parent.parent
if str(_root) not in sys.path:
    sys.path.insert(0, str(_root))

# Importar routers da raiz (serão movidos gradualmente)
# Usar try/except para cada import individualmente para não quebrar se algum faltar
_modules = {}

# Lista de módulos para importar
_module_names = [
    'auths', 'channels', 'chats', 'notes', 'folders', 
    'configs', 'groups', 'files', 'functions', 'memories',
    'models', 'knowledge', 'prompts', 'tools', 'users', 'utils',
    'tasks', 'evaluations'
]

# Importar cada módulo individualmente
for name in _module_names:
    try:
        _modules[name] = __import__(name, fromlist=[''])
    except ImportError:
        _modules[name] = None

# Criar variáveis globais para cada módulo
auths = _modules.get('auths')
channels = _modules.get('channels')
chats = _modules.get('chats')
notes = _modules.get('notes')
folders = _modules.get('folders')
configs = _modules.get('configs')
groups = _modules.get('groups')
files = _modules.get('files')
functions = _modules.get('functions')
memories = _modules.get('memories')
models = _modules.get('models')
knowledge = _modules.get('knowledge')
prompts = _modules.get('prompts')
tools = _modules.get('tools')
users = _modules.get('users')
utils = _modules.get('utils')
tasks = _modules.get('tasks')
evaluations = _modules.get('evaluations')

# Placeholders para routers que podem não existir ainda
audio = None
images = None
ollama = None
openai = None
retrieval = None
pipelines = None
scim = None

__all__ = [
    'auths', 'channels', 'chats', 'notes', 'folders', 
    'configs', 'groups', 'files', 'functions', 'memories',
    'models', 'knowledge', 'prompts', 'tools', 'users', 'utils'
]

