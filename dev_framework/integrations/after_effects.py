"""Integration helpers for the After Effects MCP Vision project."""
from __future__ import annotations

import json
from pathlib import Path
from typing import Optional

from ..memory.memory_manager import MemoryManager


class AfterEffectsIntegration:
    """Lightweight bridge with the After Effects MCP Vision toolkit."""

    def __init__(self, project_root: Path) -> None:
        self.project_root = Path(project_root)
        self._metadata_path = self.project_root / "metadata.json"

    def sync_memory(self, memory: MemoryManager) -> None:
        metadata = self._load_metadata()
        if metadata is None:
            return
        memory.add_event("after_effects_state", json.dumps(metadata, ensure_ascii=False))

    def _load_metadata(self) -> Optional[dict]:
        if not self._metadata_path.exists():
            return None
        try:
            return json.loads(self._metadata_path.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            return None
