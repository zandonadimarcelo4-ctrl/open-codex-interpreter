"""Integration helpers for the Microsoft UFO IDE workspace."""
from __future__ import annotations

from pathlib import Path

from ..memory.memory_manager import MemoryManager


class UFOIntegration:
    """Captures workspace state from a UFO installation if available."""

    def __init__(self, workspace_root: Path) -> None:
        self.workspace_root = Path(workspace_root)

    def capture_state(self, memory: MemoryManager) -> None:
        manifest_path = self.workspace_root / "ufo.manifest.json"
        if not manifest_path.exists():
            return
        memory.add_file_snapshot("ufo_manifest", manifest_path)
