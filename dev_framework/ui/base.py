"""UI protocol definitions for rich CLI and web front-ends."""
from __future__ import annotations

from typing import Iterable, Protocol, TYPE_CHECKING

if TYPE_CHECKING:  # pragma: no cover - for typing only
    from ..configuration import UnifiedDevAgentConfig
    from ..main import Notification, UnifiedDevAgentRunResult


class AgentUI(Protocol):
    """Protocol for interactive user interfaces that consume agent results."""

    def banner(self, config: "UnifiedDevAgentConfig") -> None:
        """Render an initial banner or splash screen."""

    def prompt(self) -> str:
        """Request the next prompt from the user."""

    def display_result(self, result: "UnifiedDevAgentRunResult") -> None:
        """Render a run result."""

    def goodbye(self) -> None:
        """Render shutdown messaging."""

    # Optional helpers -------------------------------------------------
    def display_notifications(self, notes: Iterable["Notification"]) -> None:
        """Render a batch of notifications (optional)."""


__all__ = ["AgentUI"]
