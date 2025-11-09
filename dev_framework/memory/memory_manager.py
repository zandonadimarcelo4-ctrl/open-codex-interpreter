"""Chromadb-backed memory utilities with graceful fallbacks."""
from __future__ import annotations

import json
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Iterable, Optional

try:  # pragma: no cover - optional dependency at runtime
    import chromadb  # type: ignore
except ModuleNotFoundError:  # pragma: no cover - handled via in-memory fallback
    chromadb = None  # type: ignore


@dataclass
class MemoryManager:
    """Stores events and file snapshots backed by ChromaDB or a JSON fallback."""

    path: Path
    collection_name: str = "unified_dev_agent"
    _client: Any = field(init=False, default=None)
    _collection: Any = field(init=False)
    _using_fallback: bool = field(init=False, default=False)

    def __post_init__(self) -> None:
        self.path = Path(self.path)
        self.path.parent.mkdir(parents=True, exist_ok=True)
        if chromadb is None:
            self._using_fallback = True
            self._collection = _InMemoryCollection(self.path)
        else:
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
        self._persist_fallback()

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
        self._persist_fallback()

    def query(self, text: str, *, top_k: int = 3) -> list[str]:
        results = self._collection.query(query_texts=[text], n_results=top_k)
        return results.get("documents", [[]])[0]

    def export(self) -> list[dict]:
        results = self._collection.get()
        documents = results.get("documents", [])
        payload: list[dict] = []
        for doc in documents:
            try:
                payload.append(json.loads(doc))
            except (TypeError, json.JSONDecodeError):
                payload.append({"data": doc})
        return payload

    def snapshot(self, output_path: Optional[Path] = None) -> None:
        export_data = json.dumps(self.export(), ensure_ascii=False, indent=2)
        output_path = output_path or self.path
        output_path.write_text(export_data, encoding="utf-8")
        if self._using_fallback and output_path != self.path:
            # Keep the primary storage file synchronised when exporting elsewhere.
            self.path.write_text(export_data, encoding="utf-8")

    def _persist_fallback(self) -> None:
        if not self._using_fallback:
            return
        export_data = json.dumps(self.export(), ensure_ascii=False, indent=2)
        self.path.write_text(export_data, encoding="utf-8")


class _InMemoryCollection:
    """Very small JSON-backed collection emulating the ChromaDB API surface."""

    def __init__(self, storage_path: Path):
        self._storage_path = storage_path
        self._documents: list[str] = []
        self._ids: list[str] = []
        self._load()

    def _load(self) -> None:
        if not self._storage_path.exists():
            return
        try:
            data = json.loads(self._storage_path.read_text(encoding="utf-8"))
        except Exception:
            return
        if not isinstance(data, list):
            return
        for index, item in enumerate(data, start=1):
            if isinstance(item, str):
                document = item
            else:
                document = json.dumps(item, ensure_ascii=False)
            self._documents.append(document)
            self._ids.append(f"inmemory-{index}")

    # The following methods replicate the minimal interface relied upon by the manager.
    def add(self, *, documents: Iterable[str], ids: Iterable[str]) -> None:
        for doc, doc_id in zip(documents, ids):
            self._documents.append(str(doc))
            self._ids.append(str(doc_id))

    def count(self) -> int:
        return len(self._documents)

    def query(self, query_texts: Iterable[str], n_results: int = 3) -> dict[str, list[list[str]]]:
        results: list[list[str]] = []
        for query in query_texts:
            results.append(self._top_matches(str(query), n_results))
        return {"documents": results}

    def _top_matches(self, query: str, n_results: int) -> list[str]:
        if not self._documents:
            return []
        terms = [term for term in query.lower().split() if term]
        scored: list[tuple[int, int, str]] = []
        for index, doc in enumerate(self._documents):
            score = _score_document(doc, terms)
            scored.append((score, index, doc))
        scored.sort(key=lambda item: (item[0], item[1]), reverse=True)
        top = [doc for _, _, doc in scored[:n_results]]
        if any(score > 0 for score, _, _ in scored[:n_results]):
            return top
        # If everything ties with zero score, prefer most recent documents.
        recent = list(reversed(self._documents))[:n_results]
        return recent

    def get(self) -> dict[str, list[str]]:
        return {"documents": list(self._documents), "ids": list(self._ids)}


def _score_document(document: str, terms: list[str]) -> int:
    if not terms:
        return 0
    try:
        data = json.loads(document)
        text = json.dumps(data, ensure_ascii=False).lower()
    except (TypeError, json.JSONDecodeError):
        text = str(document).lower()
    score = 0
    for term in terms:
        score += text.count(term)
    return score
