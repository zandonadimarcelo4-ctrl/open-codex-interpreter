"""
Super Agent Framework - AutoGen como Base
Framework unificado usando AutoGen
Com chat em tempo real, voz estilo Jarvis e auto-recompensa
"""

from .core.autogen_framework import SuperAgentFramework, AutoGenConfig
from .chat.realtime_chat import RealTimeChat
from .voice.jarvis_voice import JarvisVoiceSystem
from .voice.speech_to_text import SpeechToText
from .reward.auto_reward import AutoRewardSystem, RewardConfig
from .reward.chatdev_reward import ChatDevRewardSystem, ChatDevRewardConfig
from .api.websocket_server import WebSocketServer

__version__ = "1.0.0"
__all__ = [
    "SuperAgentFramework",
    "AutoGenConfig",
    "RealTimeChat",
    "JarvisVoiceSystem",
    "SpeechToText",
    "AutoRewardSystem",
    "RewardConfig",
    "ChatDevRewardSystem",
    "ChatDevRewardConfig",
    "WebSocketServer",
]
