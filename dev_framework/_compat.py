"""Compatibility helpers for optional dependencies."""
from __future__ import annotations

from importlib import import_module
from types import ModuleType

AUTOGEN_INSTALL_HINT = (
    "AutoGen support requires installing the optional 'autogen' dependencies. "
    "Install them with `pip install open-interpreter[autogen]` or "
    "`poetry install --extras \"autogen\"`."
)


def require_autogen() -> ModuleType:
    """Return the :mod:`autogen` module or raise a helpful error if missing."""
    try:
        return import_module("autogen")
    except ImportError as exc:  # pragma: no cover - exercised in runtime environments without autogen
        raise ImportError(AUTOGEN_INSTALL_HINT) from exc


def ensure_autogen() -> None:
    """Ensure AutoGen is importable, raising :class:`SystemExit` with guidance if not."""
    try:
        require_autogen()
    except ImportError as exc:  # pragma: no cover - exercised in runtime environments without autogen
        raise SystemExit(AUTOGEN_INSTALL_HINT) from exc
