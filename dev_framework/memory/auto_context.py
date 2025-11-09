"""High level auto-context memory features built on top of ChromaDB."""
from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Any, Iterable, Optional

from .memory_manager import MemoryManager


@dataclass
class AutoContextMemory:
    """Augments :class:`MemoryManager` with semantic context helpers."""

    storage_path: Path
    namespace: str = "auto_context"

    def __post_init__(self) -> None:
        self.storage_path = Path(self.storage_path)
        self._manager = MemoryManager(self.storage_path, collection_name=self.namespace)

    @property
    def manager(self) -> MemoryManager:
        return self._manager

    def record_interaction(
        self,
        *,
        speaker: str,
        message: str,
        tags: Optional[Iterable[str]] = None,
        metadata: Optional[dict[str, Any]] = None,
    ) -> None:
        payload = {
            "timestamp": datetime.utcnow().isoformat(),
            "speaker": speaker,
            "message": message,
            "tags": list(tags or []),
            "metadata": metadata or {},
        }
        self._manager.add_event("interaction", self._manager.dumps(payload))

    def remember_decision(self, summary: str, *, rationale: str | None = None) -> None:
        payload = {
            "timestamp": datetime.utcnow().isoformat(),
            "summary": summary,
            "rationale": rationale,
        }
        self._manager.add_event("decision", self._manager.dumps(payload))

    def remember_execution(self, code: str, *, output: str, status: str) -> None:
        payload = {
            "timestamp": datetime.utcnow().isoformat(),
            "code": code,
            "output": output,
            "status": status,
        }
        self._manager.add_event("execution", self._manager.dumps(payload))

    def recall(self, topic: str, *, k: int = 5) -> list[str]:
        return self._manager.query(topic, top_k=k)

    def export(self) -> list[dict[str, Any]]:
        return self._manager.export()


__all__ = ["AutoContextMemory"]
