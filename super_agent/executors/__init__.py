"""
Executores de código nativos para AutoGen
"""
from .native_interpreter import NativeInterpreter
from .native_code_executor import NativeCodeExecutor

__all__ = [
    "NativeInterpreter",
    "NativeCodeExecutor",
]

