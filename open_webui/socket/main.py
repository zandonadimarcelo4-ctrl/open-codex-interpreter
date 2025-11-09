"""
Compatibilidade: socket/main.py
"""
# Placeholders para imports do socket
# Os arquivos reais serão movidos depois

app = None

def periodic_usage_pool_cleanup():
    """Limpa pool de uso periódico"""
    pass

def get_event_emitter():
    """Retorna event emitter"""
    return None

def get_models_in_use():
    """Retorna modelos em uso"""
    return []

def get_active_user_ids():
    """Retorna IDs de usuários ativos"""
    return []

__all__ = [
    'app', 'periodic_usage_pool_cleanup', 
    'get_event_emitter', 'get_models_in_use', 
    'get_active_user_ids'
]

