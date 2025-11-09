"""Unified development agent framework."""

from __future__ import annotations

from typing import TYPE_CHECKING

__all__ = ["UnifiedDevAgent", "UnifiedDevAgentConfig"]

if TYPE_CHECKING:  # pragma: no cover - import-time hinting only
    from .main import UnifiedDevAgent, UnifiedDevAgentConfig


def __getattr__(name: str):  # pragma: no cover - simple delegation
    if name in __all__:
        from .main import UnifiedDevAgent, UnifiedDevAgentConfig

        namespace = {
            "UnifiedDevAgent": UnifiedDevAgent,
            "UnifiedDevAgentConfig": UnifiedDevAgentConfig,
        }
        return namespace[name]
    raise AttributeError(f"module 'dev_framework' has no attribute {name!r}")
