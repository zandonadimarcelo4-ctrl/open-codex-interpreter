"""Simple intention classifier for differentiating chat vs actions."""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum, auto


class Intention(Enum):
    CONVERSE = auto()
    EXECUTE = auto()
    PLAN = auto()


@dataclass
class IntentionDetector:
    """Heuristic-driven intention detector."""

    def classify(self, text: str) -> Intention:
        lowered = text.lower()
        if any(keyword in lowered for keyword in ["plan", "roadmap", "estratégia"]):
            return Intention.PLAN
        if any(keyword in lowered for keyword in ["execute", "run", "faça", "implement"]):
            return Intention.EXECUTE
        return Intention.CONVERSE


__all__ = ["Intention", "IntentionDetector"]
