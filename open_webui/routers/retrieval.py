"""
Compatibilidade: routers/retrieval.py
"""
# Placeholders para funções de retrieval
# Os arquivos reais serão movidos depois

def get_embedding_function():
    """Retorna função de embedding"""
    return None

def get_reranking_function():
    """Retorna função de reranking"""
    return None

def get_ef():
    """Alias para get_embedding_function"""
    return get_embedding_function()

def get_rf():
    """Alias para get_reranking_function"""
    return get_reranking_function()

__all__ = [
    'get_embedding_function', 'get_reranking_function',
    'get_ef', 'get_rf'
]

