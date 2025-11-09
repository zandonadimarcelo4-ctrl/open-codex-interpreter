"""Integration with ChatDev reward system."""
from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path
from typing import Dict

from ..memory.auto_context import AutoContextMemory


@dataclass
class ChatDevRewardSystem:
    """Tracks rewards and achievements inspired by ChatDev."""

    workspace: Path
    memory: AutoContextMemory
    _scores: Dict[str, int] = field(default_factory=dict)

    def award(self, category: str, points: int, *, reason: str) -> None:
        self._scores[category] = self._scores.get(category, 0) + points
        entry = {
            "category": category,
            "points": points,
            "reason": reason,
            "total": self._scores[category],
        }
        self.memory.manager.add_event("reward", self.memory.manager.dumps(entry))

    def leaderboard(self) -> Dict[str, int]:
        return dict(self._scores)


__all__ = ["ChatDevRewardSystem"]
