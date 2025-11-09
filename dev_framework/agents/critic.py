"""Critic agent that reviews generator output."""
from __future__ import annotations

from .._compat import require_autogen
from ..memory.memory_manager import MemoryManager

autogen = require_autogen()
AssistantAgent = autogen.AssistantAgent


class CriticAgent(AssistantAgent):
    """Agent responsible for code review and planning."""

    def __init__(self, *, memory: MemoryManager, **kwargs):
        super().__init__(**kwargs)
        self._memory = memory

    def register_review(self, feedback: str) -> None:
        self._memory.add_event("critic_feedback", feedback)
        self._memory.add_event("auto_explanation", f"Critic feedback:\n{feedback}")
