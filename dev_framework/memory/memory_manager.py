"""Chromadb-backed memory utilities."""
from __future__ import annotations

import json
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional

import chromadb


@dataclass
class MemoryManager:
    """Stores events and file snapshots in a local ChromaDB collection."""

    path: Path
    collection_name: str = "unified_dev_agent"
    _client: chromadb.PersistentClient = field(init=False)
    _collection: chromadb.Collection = field(init=False)

    def __post_init__(self) -> None:
        self.path = Path(self.path)
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self._client = chromadb.PersistentClient(path=str(self.path.parent))
        self._collection = self._client.get_or_create_collection(self.collection_name)

    def dumps(self, payload: dict) -> str:
        return json.dumps(payload, ensure_ascii=False)

    def add_event(self, kind: str, data: str) -> None:
        if isinstance(data, dict):
            data = self.dumps(data)
        document = json.dumps({"kind": kind, "data": data}, ensure_ascii=False)
        self._collection.add(
            documents=[document],
            ids=[f"event-{self._collection.count() + 1}"],
        )

    def add_file_snapshot(self, label: str, file_path: Path) -> None:
        file_path = Path(file_path)
        if not file_path.exists():
            return
        payload = json.dumps(
            {
                "label": label,
                "path": str(file_path),
                "content": file_path.read_text(encoding="utf-8", errors="ignore"),
            }
        )
        self._collection.add(
            documents=[payload],
            ids=[f"file-{self._collection.count() + 1}"],
        )

    def query(self, text: str, *, top_k: int = 3) -> list[str]:
        results = self._collection.query(query_texts=[text], n_results=top_k)
        return results.get("documents", [[]])[0]

    def export(self) -> list[dict]:
        results = self._collection.get()
        documents = results.get("documents", [])
        ids = results.get("ids", [])
        return [json.loads(doc) for doc in documents]

    def snapshot(self, output_path: Optional[Path] = None) -> None:
        export_data = json.dumps(self.export(), ensure_ascii=False, indent=2)
        output_path = output_path or self.path
        output_path.write_text(export_data, encoding="utf-8")
