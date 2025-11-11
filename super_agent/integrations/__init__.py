"""
Integrações externas para o Super Agent
"""
try:
    from .open_interpreter import OpenInterpreterIntegration
except ImportError:
    OpenInterpreterIntegration = None

try:
    from .ufo import UFOIntegration
except ImportError:
    UFOIntegration = None

__all__ = ["OpenInterpreterIntegration", "UFOIntegration"]

