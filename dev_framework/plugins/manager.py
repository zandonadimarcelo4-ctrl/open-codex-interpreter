"""Runtime plugin discovery and execution."""
from __future__ import annotations

import importlib
import pkgutil
from dataclasses import dataclass, field
from typing import Any, Callable, Dict


@dataclass
class PluginManager:
    """Loads pluggable skills exposed via entry points or the plugins package."""

    namespace: str = "dev_framework.plugins"
    registry: Dict[str, Callable[..., Any]] = field(default_factory=dict)

    def discover(self) -> None:
        for module_info in pkgutil.iter_modules():
            if not module_info.name.startswith(self.namespace):
                continue
            module = importlib.import_module(module_info.name)
            register = getattr(module, "register", None)
            if callable(register):
                register(self)

    def register(self, name: str, handler: Callable[..., Any]) -> None:
        self.registry[name] = handler

    def execute(self, name: str, *args: Any, **kwargs: Any) -> Any:
        if name not in self.registry:
            raise KeyError(f"Plugin '{name}' not registered")
        return self.registry[name](*args, **kwargs)


__all__ = ["PluginManager"]
