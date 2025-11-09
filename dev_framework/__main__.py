"""CLI entry point for the unified development agent."""
from __future__ import annotations

import argparse
from pathlib import Path
from typing import Any, Dict

from ._compat import ensure_autogen
from .configuration import (
    ConfigurationError,
    UnifiedDevAgentConfig,
    list_profiles,
    load_config_file,
    load_profile_config,
)

ensure_autogen()

from .main import UnifiedDevAgent  # noqa: E402
from .ui.rich_cli import RichConsoleUI


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run the unified development agent")
    parser.add_argument("prompt", nargs="*", help="Optional prompt to run once")
    parser.add_argument("--ollama-model", default=None, help="Ollama model name")
    parser.add_argument(
        "--ollama-base",
        default=None,
        help="Base URL for the Ollama server",
    )
    parser.add_argument("--after-effects", help="Path to After Effects MCP Vision project")
    parser.add_argument("--ufo-workspace", help="Path to UFO workspace")
    parser.add_argument("--memory-path", help="Path to the auto-context memory file")
    parser.add_argument(
        "--disable-auto-exec",
        action="store_true",
        help="Disable automatic execution of generated code",
    )
    parser.add_argument("--no-observe", action="store_true", help="Disable Observe & Automate mode")
    parser.add_argument("--no-multimodal", action="store_true", help="Disable multimodal capture")
    parser.add_argument("--no-rewards", action="store_true", help="Disable ChatDev-style rewards")
    parser.add_argument("--no-plugin-discovery", action="store_true", help="Skip plugin discovery")
    parser.add_argument("--no-agentic-seek", action="store_true", help="Disable agenticSeek planner")
    parser.add_argument("--no-browser-search", action="store_true", help="Disable browser-use search integration")
    parser.add_argument("--no-intention", action="store_true", help="Disable intention detection")
    parser.add_argument("--disable-auto-fork", action="store_true", help="Skip cloning helper repositories")
    parser.add_argument("--profile", help="Load a built-in profile (innovation, minimal)")
    parser.add_argument("--config", help="Path to a JSON/TOML/YAML configuration file")
    parser.add_argument("--list-profiles", action="store_true", help="List built-in profiles and exit")
    return parser.parse_args()


def main() -> None:
    args = parse_args()

    if args.list_profiles:
        for name, description in list_profiles():
            print(f"{name}: {description}")
        return

    try:
        config = _build_config(args)
    except ConfigurationError as exc:
        raise SystemExit(str(exc)) from exc

    agent = UnifiedDevAgent(config=config)
    ui = RichConsoleUI()
    if args.prompt:
        ui.banner(config)
        result = agent.run(" ".join(args.prompt))
        ui.display_result(result)
        ui.goodbye()
    else:
        agent.interactive(ui=ui)


def _build_config(args: argparse.Namespace) -> UnifiedDevAgentConfig:
    if args.profile:
        config = load_profile_config(args.profile)
    else:
        config = UnifiedDevAgentConfig()

    if args.config:
        overrides = load_config_file(Path(args.config))
        config = config.with_updates(overrides)

    cli_overrides: Dict[str, Any] = {}
    if args.ollama_model:
        cli_overrides["ollama_model"] = args.ollama_model
    if args.ollama_base:
        cli_overrides["ollama_base_url"] = args.ollama_base
    if args.after_effects:
        cli_overrides["after_effects_project_path"] = Path(args.after_effects)
    if args.ufo_workspace:
        cli_overrides["ufo_workspace"] = Path(args.ufo_workspace)
    if args.memory_path:
        cli_overrides["memory_path"] = Path(args.memory_path)
    if args.disable_auto_exec:
        cli_overrides["enable_auto_execution"] = False
    if args.no_observe:
        cli_overrides["observe_automate_enabled"] = False
    if args.no_multimodal:
        cli_overrides["multimodal_enabled"] = False
    if args.no_rewards:
        cli_overrides["reward_system_enabled"] = False
    if args.no_plugin_discovery:
        cli_overrides["plugin_auto_discover"] = False
    if args.no_agentic_seek:
        cli_overrides["enable_agentic_seek"] = False
    if args.no_browser_search:
        cli_overrides["enable_browser_search"] = False
    if args.no_intention:
        cli_overrides["enable_intention_detection"] = False
    if args.disable_auto_fork:
        cli_overrides["auto_fork_repos"] = ()

    if cli_overrides:
        config = config.with_updates(cli_overrides)
    return config


if __name__ == "__main__":
    main()
