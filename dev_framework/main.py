"""Entry point for the unified development agent framework."""
from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path
from typing import Iterable, Optional

from autogen import AssistantAgent, UserProxyAgent

from .agents.critic import CriticAgent
from .agents.executor import ExecutorAgent
from .agents.generator import GeneratorAgent
from .memory.memory_manager import MemoryManager


@dataclass
class UnifiedDevAgentConfig:
    """Runtime configuration for :class:`UnifiedDevAgent`."""

    ollama_model: str = "deepseek-r1:8b"
    ollama_base_url: str = "http://127.0.0.1:11434"
    workspace: Path = Path.cwd()
    memory_path: Path = Path("dev_framework/memory/context.json")
    enable_auto_execution: bool = True
    auto_execution_guard: bool = True
    ide_integration_enabled: bool = False
    after_effects_project_path: Optional[Path] = None
    ufo_workspace: Optional[Path] = None


@dataclass
class UnifiedDevAgent:
    """High level orchestrator that coordinates generator, critic and executor agents."""

    config: UnifiedDevAgentConfig = field(default_factory=UnifiedDevAgentConfig)
    _memory: MemoryManager = field(init=False)
    _generator: GeneratorAgent = field(init=False)
    _critic: CriticAgent = field(init=False)
    _executor: ExecutorAgent = field(init=False)

    def __post_init__(self) -> None:
        self._memory = MemoryManager(self.config.memory_path)
        self._generator = GeneratorAgent(
            name="Generator",
            llm_config={
                "model": f"ollama/{self.config.ollama_model}",
                "api_base": self.config.ollama_base_url,
            },
            memory=self._memory,
        )
        self._critic = CriticAgent(
            name="Critic",
            llm_config={
                "model": f"ollama/{self.config.ollama_model}",
                "api_base": self.config.ollama_base_url,
            },
            memory=self._memory,
        )
        user_proxy = UserProxyAgent("UnifiedDevUser")
        self._executor = ExecutorAgent(
            name="Executor",
            user_proxy=user_proxy,
            workspace=self.config.workspace,
            memory=self._memory,
            auto_exec=self.config.enable_auto_execution,
        )
        if self.config.after_effects_project_path:
            self._executor.load_after_effects_project(self.config.after_effects_project_path)
        if self.config.ufo_workspace:
            self._executor.connect_ufo_workspace(self.config.ufo_workspace)

    def run(self, prompt: str, *, history: Optional[Iterable[str]] = None) -> None:
        """Run the unified development flow for a prompt."""
        if history:
            for item in history:
                self._memory.add_event("history", item)

        conversation = self._generator.initiate_chat_with_critic(
            critic=self._critic,
            user_message=prompt,
        )

        if not conversation.summary:
            return

        self._memory.add_event("conversation", conversation.summary)
        if self.config.enable_auto_execution and "```" in conversation.summary:
            self._executor.execute_from_conversation(conversation.summary)

    def interactive(self) -> None:
        """Start an interactive prompt loop."""
        print("\n💡 O que você quer que o framework desenvolva?")
        while True:
            try:
                prompt = input("> ")
            except (KeyboardInterrupt, EOFError):
                print("\n👋 Encerrando Unified Dev Agent.")
                break

            if not prompt.strip():
                continue

            self.run(prompt)


__all__ = ["UnifiedDevAgent", "UnifiedDevAgentConfig"]
