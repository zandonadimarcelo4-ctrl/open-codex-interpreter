"""CLI entry point for the unified development agent."""
from __future__ import annotations

import argparse
from pathlib import Path

from .main import UnifiedDevAgent, UnifiedDevAgentConfig


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run the unified development agent")
    parser.add_argument("prompt", nargs="*", help="Optional prompt to run once")
    parser.add_argument("--ollama-model", default="deepseek-r1:8b", help="Ollama model name")
    parser.add_argument(
        "--ollama-base",
        default="http://127.0.0.1:11434",
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
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    defaults = UnifiedDevAgentConfig()
    config = UnifiedDevAgentConfig(
        ollama_model=args.ollama_model,
        ollama_base_url=args.ollama_base,
        enable_auto_execution=not args.disable_auto_exec,
        after_effects_project_path=Path(args.after_effects) if args.after_effects else None,
        ufo_workspace=Path(args.ufo_workspace) if args.ufo_workspace else None,
        memory_path=Path(args.memory_path) if args.memory_path else defaults.memory_path,
        observe_automate_enabled=not args.no_observe,
        multimodal_enabled=not args.no_multimodal,
        reward_system_enabled=not args.no_rewards,
        plugin_auto_discover=not args.no_plugin_discovery,
        enable_agentic_seek=not args.no_agentic_seek,
        enable_browser_search=not args.no_browser_search,
        enable_intention_detection=not args.no_intention,
        auto_fork_repos=() if args.disable_auto_fork else defaults.auto_fork_repos,
    )
    agent = UnifiedDevAgent(config=config)
    if args.prompt:
        agent.run(" ".join(args.prompt))
    else:
        agent.interactive()


if __name__ == "__main__":
    main()
