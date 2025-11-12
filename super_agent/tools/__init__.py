"""
Tools - Ferramentas para agentes AutoGen
Cada capacidade vira uma ferramenta AutoGen
"""

from .code_execution import CodeExecutionTool

# Importações opcionais (podem falhar se dependências não estiverem instaladas)
try:
    from .web_browsing import WebBrowsingTool
except Exception:
    # Captura qualquer erro durante a importação (inclui erros de compatibilidade NumPy/OpenCV)
    WebBrowsingTool = None

try:
    from .video_editing import VideoEditingTool
except Exception:
    VideoEditingTool = None

try:
    from .gui_automation import GUIAutomationTool
except Exception:
    GUIAutomationTool = None

try:
    from .multimodal_ai import MultimodalAITool
except Exception:
    MultimodalAITool = None

try:
    from .memory_store import MemoryStoreTool
except Exception:
    MemoryStoreTool = None

__all__ = [
    "CodeExecutionTool",
    "WebBrowsingTool",
    "VideoEditingTool",
    "GUIAutomationTool",
    "MultimodalAITool",
    "MemoryStoreTool",
]

