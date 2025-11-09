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

# Placeholders para routers que podem não existir ainda
# Criar routers FastAPI básicos para evitar AttributeError
from fastapi import APIRouter

# Criar módulos placeholder com atributo router
class RouterModule:
    def __init__(self, router):
        self.router = router

# Criar variáveis globais para cada módulo
# Garantir que todos tenham atributo router
def ensure_router_module(module):
    """Garantir que o módulo tenha atributo router"""
    if module is None:
        return RouterModule(APIRouter())
    if not hasattr(module, 'router'):
        # Se o módulo não tem router, criar um wrapper
        return RouterModule(APIRouter())
    return module

auths = ensure_router_module(_modules.get('auths'))
channels = ensure_router_module(_modules.get('channels'))
chats = ensure_router_module(_modules.get('chats'))
notes = ensure_router_module(_modules.get('notes'))
folders = ensure_router_module(_modules.get('folders'))
configs = ensure_router_module(_modules.get('configs'))
groups = ensure_router_module(_modules.get('groups'))
files = ensure_router_module(_modules.get('files'))
functions = ensure_router_module(_modules.get('functions'))
memories = ensure_router_module(_modules.get('memories'))
models = ensure_router_module(_modules.get('models'))
knowledge = ensure_router_module(_modules.get('knowledge'))
prompts = ensure_router_module(_modules.get('prompts'))
tools = ensure_router_module(_modules.get('tools'))
users = ensure_router_module(_modules.get('users'))
utils = ensure_router_module(_modules.get('utils'))
tasks = ensure_router_module(_modules.get('tasks'))
evaluations = ensure_router_module(_modules.get('evaluations'))

# Criar routers placeholder
audio = RouterModule(APIRouter())
images = RouterModule(APIRouter())
ollama = RouterModule(APIRouter())
openai = RouterModule(APIRouter())
retrieval = RouterModule(APIRouter())
pipelines = RouterModule(APIRouter())
scim = RouterModule(APIRouter())

__all__ = [
    'auths', 'channels', 'chats', 'notes', 'folders', 
    'configs', 'groups', 'files', 'functions', 'memories',
    'models', 'knowledge', 'prompts', 'tools', 'users', 'utils'
]

