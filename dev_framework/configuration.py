"""Configuration helpers for the unified development agent."""
from __future__ import annotations

import json
from dataclasses import dataclass, fields, replace
from pathlib import Path
from typing import Any, Dict, Iterable, Mapping

try:  # pragma: no cover - Python 3.11+
    import tomllib  # type: ignore[attr-defined]
except ModuleNotFoundError:  # pragma: no cover - fallback for Python 3.10
    tomllib = None  # type: ignore

try:  # pragma: no cover - optional dependency
    import yaml  # type: ignore
except ModuleNotFoundError:  # pragma: no cover - optional dependency
    yaml = None  # type: ignore

__all__ = [
    "ConfigurationError",
    "UnifiedDevAgentConfig",
    "load_profile_config",
    "load_config_file",
    "list_profiles",
]


class ConfigurationError(RuntimeError):
    """Raised when a configuration source is invalid or unsupported."""


_PATH_FIELDS = {
    "workspace",
    "memory_path",
    "after_effects_project_path",
    "ufo_workspace",
}

_BOOL_FIELDS = {
    "enable_auto_execution",
    "auto_execution_guard",
    "ide_integration_enabled",
    "observe_automate_enabled",
    "multimodal_enabled",
    "reward_system_enabled",
    "plugin_auto_discover",
    "enable_agentic_seek",
    "enable_browser_search",
    "enable_intention_detection",
}


@dataclass
class UnifiedDevAgentConfig:
    """Runtime configuration for the unified development agent."""

    ollama_model: str = "deepseek-r1:8b"
    ollama_base_url: str = "http://127.0.0.1:11434"
    workspace: Path = Path.cwd()
    memory_path: Path = Path("dev_framework/memory/context.json")
    enable_auto_execution: bool = True
    auto_execution_guard: bool = True
    ide_integration_enabled: bool = False
    after_effects_project_path: Path | None = None
    ufo_workspace: Path | None = None
    observe_automate_enabled: bool = True
    multimodal_enabled: bool = True
    reward_system_enabled: bool = True
    plugin_auto_discover: bool = True
    enable_agentic_seek: bool = True
    enable_browser_search: bool = True
    enable_intention_detection: bool = True
    auto_fork_repos: tuple[str, ...] = (
        "https://github.com/VolksRat71/after-effects-mcp-vision.git",
        "https://github.com/microsoft/autogen.git",
        "https://github.com/microsoft/UFO.git",
        "https://github.com/OpenBMB/ChatDev.git",
        "https://github.com/Fosowl/agenticSeek.git",
        "https://github.com/browser-use/browser-use.git",
    )

    # ------------------------------------------------------------------
    def with_updates(self, updates: Mapping[str, Any]) -> "UnifiedDevAgentConfig":
        """Return a new config with the provided overrides applied."""

        if not updates:
            return self
    
        prepared: Dict[str, Any] = {}
        valid_fields = {field.name for field in fields(self)}
        for key, value in updates.items():
            if key not in valid_fields:
                raise ConfigurationError(f"Unknown configuration option: {key}")
            prepared[key] = _coerce_value(key, value)
        return replace(self, **prepared)

    @classmethod
    def from_mapping(
        cls, mapping: Mapping[str, Any], *, base: "UnifiedDevAgentConfig" | None = None
    ) -> "UnifiedDevAgentConfig":
        """Create a config instance from a mapping, optionally starting from ``base``."""

        config = base or cls()
        return config.with_updates(mapping)

    def to_dict(self) -> Dict[str, Any]:
        """Convert the configuration to simple serialisable types."""

        result: Dict[str, Any] = {}
        for field in fields(self):
            value = getattr(self, field.name)
            if isinstance(value, Path):
                result[field.name] = str(value)
            elif isinstance(value, tuple):
                result[field.name] = list(value)
            else:
                result[field.name] = value
        return result


_PROFILE_DEFINITIONS: Dict[str, Dict[str, Any]] = {
    "innovation": {
        "description": "Ativa todas as capacidades avançadas para explorar automação multimodal.",
        "settings": {
            "enable_auto_execution": True,
            "auto_execution_guard": False,
            "observe_automate_enabled": True,
            "multimodal_enabled": True,
            "reward_system_enabled": True,
            "plugin_auto_discover": True,
            "enable_agentic_seek": True,
            "enable_browser_search": True,
            "enable_intention_detection": True,
        },
    },
    "minimal": {
        "description": "Fluxo básico focado em geração e execução de código sem integrações extras.",
        "settings": {
            "enable_auto_execution": True,
            "auto_execution_guard": True,
            "observe_automate_enabled": False,
            "multimodal_enabled": False,
            "reward_system_enabled": False,
            "plugin_auto_discover": False,
            "enable_agentic_seek": False,
            "enable_browser_search": False,
            "enable_intention_detection": True,
            "auto_fork_repos": (),
        },
    },
}


def load_profile_config(name: str) -> UnifiedDevAgentConfig:
    """Load one of the built-in configuration profiles."""

    key = name.lower()
    if key not in _PROFILE_DEFINITIONS:
        available = ", ".join(sorted(_PROFILE_DEFINITIONS))
        raise ConfigurationError(f"Perfil desconhecido: {name}. Disponíveis: {available}")
    profile = _PROFILE_DEFINITIONS[key]["settings"]
    return UnifiedDevAgentConfig.from_mapping(profile)


def list_profiles() -> Iterable[tuple[str, str]]:
    """Return the available profile names paired with their descriptions."""

    for name, payload in sorted(_PROFILE_DEFINITIONS.items()):
        yield name, payload.get("description", "")


def load_config_file(path: Path) -> Dict[str, Any]:
    """Parse a configuration file returning a dictionary of overrides."""

    if not path.exists():
        raise ConfigurationError(f"Arquivo de configuração não encontrado: {path}")
    suffix = path.suffix.lower()
    text = path.read_text(encoding="utf-8")
    if suffix in {".json", ".jsonc"}:
        data = json.loads(text)
    elif suffix == ".toml":
        if tomllib is None:
            raise ConfigurationError("Leitura de TOML requer Python 3.11+ ou o pacote 'tomli'.")
        data = tomllib.loads(text)
    elif suffix in {".yaml", ".yml"}:
        if yaml is None:
            raise ConfigurationError("Suporte YAML requer a instalação opcional de 'pyyaml'.")
        data = yaml.safe_load(text)
    else:
        raise ConfigurationError(f"Formato de configuração não suportado: {path.suffix}")
    if not isinstance(data, Mapping):
        raise ConfigurationError("O arquivo de configuração deve conter um objeto mapeável na raiz.")
    return dict(data)


def _coerce_value(key: str, value: Any) -> Any:
    if key in _PATH_FIELDS and value is not None:
        return value if isinstance(value, Path) else Path(value)
    if key in _BOOL_FIELDS and isinstance(value, str):
        normalized = value.strip().lower()
        if normalized in {"1", "true", "yes", "sim", "on"}:
            return True
        if normalized in {"0", "false", "no", "nao", "off"}:
            return False
        raise ConfigurationError(f"Valor booleano inválido para {key}: {value}")
    if key == "auto_fork_repos":
        if value is None:
            return ()
        if isinstance(value, str):
            items = [item.strip() for item in value.split(",") if item.strip()]
            return tuple(items)
        if isinstance(value, Iterable):
            return tuple(str(item) for item in value)
        raise ConfigurationError("auto_fork_repos deve ser uma lista ou sequência de URLs")
    return value
