"""CLI entry point for the unified development agent."""
from __future__ import annotations

import argparse

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
    parser.add_argument(
        "--disable-auto-exec",
        action="store_true",
        help="Disable automatic execution of generated code",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    config = UnifiedDevAgentConfig(
        ollama_model=args.ollama_model,
        ollama_base_url=args.ollama_base,
        enable_auto_execution=not args.disable_auto_exec,
        after_effects_project_path=args.after_effects,
        ufo_workspace=args.ufo_workspace,
    )
    agent = UnifiedDevAgent(config=config)
    if args.prompt:
        agent.run(" ".join(args.prompt))
    else:
        agent.interactive()


if __name__ == "__main__":
    main()
