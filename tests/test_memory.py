from pathlib import Path

import json

import pytest

from dev_framework.memory import memory_manager as mm


@pytest.fixture()
def fallback_manager(tmp_path: Path, monkeypatch: pytest.MonkeyPatch):
    """Provide a memory manager that always uses the JSON fallback backend."""

    monkeypatch.setattr(mm, "chromadb", None)
    storage = tmp_path / "memory.json"
    manager = mm.MemoryManager(storage)
    return manager


def test_memory_manager_records_and_persists_events(fallback_manager: mm.MemoryManager, tmp_path: Path) -> None:
    fallback_manager.add_event("note", "hello world")
    fallback_manager.add_event("note", {"details": "analysis"})

    sample_file = tmp_path / "example.txt"
    sample_file.write_text("sample content", encoding="utf-8")
    fallback_manager.add_file_snapshot("example", sample_file)

    results = fallback_manager.query("hello", top_k=2)
    assert results, "query should return stored documents"
    assert any("hello" in doc for doc in results)

    export = fallback_manager.export()
    assert any(entry.get("kind") == "note" for entry in export)

    fallback_manager.snapshot()
    persisted = fallback_manager.path
    assert persisted.exists()
    contents = persisted.read_text(encoding="utf-8")
    data = json.loads(contents)
    assert isinstance(data, list) and data, "exported data should be a non-empty list"
