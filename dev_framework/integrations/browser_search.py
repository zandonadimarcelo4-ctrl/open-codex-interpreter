"""Web search integration built on top of browser-use."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict

try:
    from browser_use import search
except Exception:  # pragma: no cover
    search = None  # type: ignore

from ..memory.auto_context import AutoContextMemory


@dataclass
class BrowserSearch:
    """Executes search queries and logs the results."""

    memory: AutoContextMemory

    def query(self, question: str) -> Dict[str, Any]:
        if search is None:
            result = {"question": question, "results": [], "note": "browser-use not installed"}
        else:
            result = search(question)  # type: ignore[misc]
        self.memory.manager.add_event("search", self.memory.manager.dumps(result))
        return result


__all__ = ["BrowserSearch"]
