"""Unified development agent framework."""

from __future__ import annotations

from typing import TYPE_CHECKING

__all__ = ["UnifiedDevAgent", "UnifiedDevAgentConfig"]

if TYPE_CHECKING:  # pragma: no cover - import-time hinting only
    from .configuration import UnifiedDevAgentConfig
    from .main import UnifiedDevAgent


def __getattr__(name: str):  # pragma: no cover - simple delegation
    if name in __all__:
        if name == "UnifiedDevAgent":
            from .main import UnifiedDevAgent

            return UnifiedDevAgent
        if name == "UnifiedDevAgentConfig":
            from .configuration import UnifiedDevAgentConfig

            return UnifiedDevAgentConfig
    raise AttributeError(f"module 'dev_framework' has no attribute {name!r}")
