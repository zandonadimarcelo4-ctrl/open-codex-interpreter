from pathlib import Path

import pytest

from dev_framework.configuration import (
    ConfigurationError,
    UnifiedDevAgentConfig,
    list_profiles,
    load_profile_config,
)


def test_profile_innovation_enables_advanced_features():
    config = load_profile_config("innovation")
    assert config.enable_auto_execution is True
    assert config.auto_execution_guard is False
    assert config.observe_automate_enabled is True
    assert config.multimodal_enabled is True
    assert config.enable_browser_search is True


def test_profile_minimal_disables_optional_integrations():
    config = load_profile_config("minimal")
    assert config.observe_automate_enabled is False
    assert config.multimodal_enabled is False
    assert config.auto_fork_repos == ()


def test_with_updates_casts_paths_and_sequences(tmp_path: Path):
    base = UnifiedDevAgentConfig()
    overrides = {
        "memory_path": tmp_path / "memory.json",
        "auto_fork_repos": ["https://example.com/repo.git"],
    }
    config = base.with_updates(overrides)
    assert config.memory_path == tmp_path / "memory.json"
    assert config.auto_fork_repos == ("https://example.com/repo.git",)


def test_unknown_profile_raises_error():
    with pytest.raises(ConfigurationError):
        load_profile_config("unknown")


def test_list_profiles_contains_expected_entries():
    names = {name for name, _ in list_profiles()}
    assert {"innovation", "minimal"}.issubset(names)
