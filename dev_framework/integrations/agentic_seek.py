"""Wrapper around agenticSeek planner."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, List

try:
    from agenticseek.core import AgenticSeek
except Exception:  # pragma: no cover
    AgenticSeek = None  # type: ignore

from ..memory.auto_context import AutoContextMemory


@dataclass
class AgenticSeekPlanner:
    """High level plan generator leveraging agenticSeek if available."""

    memory: AutoContextMemory

    def plan(self, goal: str) -> List[Dict[str, Any]]:
        if AgenticSeek is None:
            steps = [{"step": 1, "action": goal, "note": "agenticSeek not installed"}]
        else:
            planner = AgenticSeek()
            steps = planner.plan(goal)
        self.memory.manager.add_event("plan", self.memory.manager.dumps({"goal": goal, "steps": steps}))
        return steps


__all__ = ["AgenticSeekPlanner"]
