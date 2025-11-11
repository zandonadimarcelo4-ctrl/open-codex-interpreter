"""
Módulos do Open Interpreter adaptados para uso no AutoGen

Estes módulos foram copiados do projeto Open Interpreter e adaptados
para funcionar dentro do AutoGen, reutilizando 100% da lógica do OI.
"""
from .code_interpreter import CodeInterpreter
from .code_block import CodeBlock
from .message_block import MessageBlock
from .utils import parse_partial_json, merge_deltas
from .oi_core import OICore

__all__ = [
    "CodeInterpreter",
    "CodeBlock",
    "MessageBlock",
    "parse_partial_json",
    "merge_deltas",
    "OICore",
]
