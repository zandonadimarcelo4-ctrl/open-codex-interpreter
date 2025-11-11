"""
Open Interpreter com suporte a Ollama
"""
from .interpreter import Interpreter
from .ollama_adapter import OllamaAdapter
from .server import OpenInterpreterServer

__all__ = ["Interpreter", "OllamaAdapter", "OpenInterpreterServer"]
__version__ = "0.1.0"
