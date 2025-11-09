"""Generator agent that uses Ollama-backed models via AutoGen."""
from __future__ import annotations

from autogen import AssistantAgent

from ..memory.memory_manager import MemoryManager


class GeneratorAgent(AssistantAgent):
    """LLM-backed agent responsible for producing code and reasoning."""

    def __init__(self, *, memory: MemoryManager, **kwargs):
        super().__init__(**kwargs)
        self._memory = memory

    def initiate_chat_with_critic(self, critic: AssistantAgent, user_message: str):
        self._memory.add_event("prompt", user_message)
        result = self.initiate_chat(
            critic,
            message=user_message,
        )
        summary = result.summary or ""
        self._memory.add_event("generator_response", summary)
        self._memory.add_event("auto_explanation", f"Generator reasoning:\n{summary}")
        return result
