"""Entry point for the unified development agent framework."""
from __future__ import annotations

import logging
from dataclasses import dataclass, field
from pathlib import Path
from typing import Iterable, Optional

# AutoGen v2 - Nova API moderna
try:
    from autogen_agentchat.agents import AssistantAgent
    from autogen_agentchat.teams import RoundRobinTeam
    from autogen_ext.models.openai import OpenAIChatCompletionClient
    from autogen_ext.models.ollama import OllamaChatCompletionClient
    AUTOGEN_V2_AVAILABLE = True
except ImportError as e:
    AUTOGEN_V2_AVAILABLE = False
    logger = logging.getLogger(__name__)
    logger.error(f"AutoGen v2 não disponível: {e}")
    raise ImportError("AutoGen v2 (autogen-agentchat) é obrigatório. Execute: pip install autogen-agentchat autogen-ext[openai]")

from .agents.critic import CriticAgent
from .agents.executor import ExecutorAgent
from .agents.generator import GeneratorAgent
from .memory.memory_manager import MemoryManager

logger = logging.getLogger(__name__)


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
        
        # Criar Model Client para AutoGen v2
        model_client = OllamaChatCompletionClient(
            model=self.config.ollama_model,
            base_url=self.config.ollama_base_url,
        )
        
        # Criar agentes com AutoGen v2
        self._generator = GeneratorAgent(
            name="Generator",
            model_client=model_client,
            memory=self._memory,
        )
        self._critic = CriticAgent(
            name="Critic",
            model_client=model_client,
            memory=self._memory,
        )
        
        # Executor não usa UserProxyAgent no AutoGen v2
        self._executor = ExecutorAgent(
            name="Executor",
            model_client=model_client,
            workspace=self.config.workspace,
            memory=self._memory,
            auto_exec=self.config.enable_auto_execution,
        )
        if self.config.after_effects_project_path:
            self._executor.load_after_effects_project(self.config.after_effects_project_path)
        if self.config.ufo_workspace:
            self._executor.connect_ufo_workspace(self.config.ufo_workspace)
        
        # Criar Team para coordenação
        self._team = RoundRobinTeam(
            agents=[self._generator, self._critic],
            max_turns=50,
        )

    async def run(self, prompt: str, *, history: Optional[Iterable[str]] = None) -> None:
        """Run the unified development flow for a prompt (AutoGen v2 - assíncrono)."""
        if history:
            for item in history:
                self._memory.add_event("history", item)

        # Executar usando Team (AutoGen v2)
        try:
            result = await self._team.run(task=prompt)
            
            # Extrair resultado
            if result:
                result_text = str(result)
                self._memory.add_event("conversation", result_text)
                
                if self.config.enable_auto_execution and "```" in result_text:
                    self._executor.execute_from_conversation(result_text)
        except Exception as e:
            logger.error(f"Erro ao executar prompt: {e}")
            raise

    async def interactive(self) -> None:
        """Start an interactive prompt loop (AutoGen v2 - assíncrono)."""
        import asyncio
        print("\n💡 O que você quer que o framework desenvolva?")
        while True:
            try:
                prompt = input("> ")
            except (KeyboardInterrupt, EOFError):
                print("\n👋 Encerrando Unified Dev Agent.")
                break

            if not prompt.strip():
                continue

            await self.run(prompt)


__all__ = ["UnifiedDevAgent", "UnifiedDevAgentConfig"]
