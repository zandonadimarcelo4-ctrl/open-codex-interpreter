"""
Integrações externas para o Super Agent
"""
import sys
import importlib

# Importar OpenInterpreterIntegration
try:
    from .open_interpreter import OpenInterpreterIntegration
except Exception:
    # Captura qualquer erro durante a importação
    OpenInterpreterIntegration = None

# Importar UFOIntegration de forma mais segura
# O problema é que o cv2 pode falhar durante a importação do módulo
UFOIntegration = None
try:
    # Tentar importar usando importlib para melhor controle de erros
    ufo_module = importlib.import_module('.ufo', package='super_agent.integrations')
    if hasattr(ufo_module, 'UFOIntegration'):
        UFOIntegration = ufo_module.UFOIntegration
except Exception as e:
    # Captura qualquer erro durante a importação (inclui erros de compatibilidade NumPy/OpenCV)
    # Limpar o módulo do cache se foi parcialmente carregado
    module_name = 'super_agent.integrations.ufo'
    if module_name in sys.modules:
        del sys.modules[module_name]
    UFOIntegration = None

__all__ = ["OpenInterpreterIntegration", "UFOIntegration"]

