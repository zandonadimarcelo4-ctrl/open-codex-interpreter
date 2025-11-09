"""Entry point for the unified development agent framework."""
from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path
from typing import Iterable, Optional

from autogen import UserProxyAgent

from .agents.critic import CriticAgent
from .agents.executor import ExecutorAgent
from .agents.generator import GeneratorAgent
from .automation.observer import ObserveAutomateController
from .integrations.agentic_seek import AgenticSeekPlanner
from .integrations.browser_search import BrowserSearch
from .integrations.chatdev_reward import ChatDevRewardSystem
from .memory.auto_context import AutoContextMemory
from .memory.memory_manager import MemoryManager
from .multimodal.interface import MultimodalInterface
from .plugins.manager import PluginManager
from .self_update.auto_fork import AutoForkManager
from .intelligence.intention import Intention, IntentionDetector


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


@dataclass
class UnifiedDevAgent:
    """High level orchestrator that coordinates generator, critic and executor agents."""

    config: UnifiedDevAgentConfig = field(default_factory=UnifiedDevAgentConfig)
    _memory: MemoryManager = field(init=False)
    _auto_memory: AutoContextMemory = field(init=False)
    _generator: GeneratorAgent = field(init=False)
    _critic: CriticAgent = field(init=False)
    _executor: ExecutorAgent = field(init=False)
    _observer: Optional[ObserveAutomateController] = field(default=None, init=False)
    _multimodal: Optional[MultimodalInterface] = field(default=None, init=False)
    _reward_system: Optional[ChatDevRewardSystem] = field(default=None, init=False)
    _plugin_manager: Optional[PluginManager] = field(default=None, init=False)
    _planner: Optional[AgenticSeekPlanner] = field(default=None, init=False)
    _browser_search: Optional[BrowserSearch] = field(default=None, init=False)
    _auto_fork: AutoForkManager = field(init=False)
    _intention_detector: Optional[IntentionDetector] = field(default=None, init=False)

    def __post_init__(self) -> None:
        self._auto_memory = AutoContextMemory(self.config.memory_path)
        self._memory = self._auto_memory.manager
        self._auto_fork = AutoForkManager(self.config.workspace, self._auto_memory)
        self._bootstrap_repositories()
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
            auto_memory=self._auto_memory,
            auto_exec=self.config.enable_auto_execution,
        )
        if self.config.after_effects_project_path:
            self._executor.load_after_effects_project(self.config.after_effects_project_path)
        if self.config.ufo_workspace:
            self._executor.connect_ufo_workspace(self.config.ufo_workspace)
        if self.config.observe_automate_enabled:
            self._observer = ObserveAutomateController(self._auto_memory)
            self._observer.start()
        if self.config.multimodal_enabled:
            self._multimodal = MultimodalInterface(self._auto_memory)
        if self.config.reward_system_enabled:
            self._reward_system = ChatDevRewardSystem(self.config.workspace, self._auto_memory)
        if self.config.plugin_auto_discover:
            self._plugin_manager = PluginManager()
            self._plugin_manager.discover()
        if self.config.enable_agentic_seek:
            self._planner = AgenticSeekPlanner(self._auto_memory)
        if self.config.enable_browser_search:
            self._browser_search = BrowserSearch(self._auto_memory)
        if self.config.enable_intention_detection:
            self._intention_detector = IntentionDetector()

    def _bootstrap_repositories(self) -> None:
        for repo in self.config.auto_fork_repos:
            self._auto_fork.clone(repo)

    def run(self, prompt: str, *, history: Optional[Iterable[str]] = None) -> None:
        """Run the unified development flow for a prompt."""
        if history:
            for item in history:
                self._memory.add_event("history", item)

        self._auto_memory.record_interaction(speaker="user", message=prompt)
        intention = (
            self._intention_detector.classify(prompt)
            if self._intention_detector
            else Intention.EXECUTE
        )

        if prompt.startswith("plugin:") and self._plugin_manager:
            _, _, payload = prompt.partition(":")
            name, _, args = payload.partition(" ")
            response = self._plugin_manager.execute(name, args.strip())
            self._auto_memory.record_interaction(speaker=name, message=str(response), tags=["plugin"])
            return

        if intention is Intention.PLAN and self._planner:
            steps = self._planner.plan(prompt)
            print("📝 Plano gerado:")
            for step in steps:
                print(f"- {step}")
            return

        if self._browser_search and any(keyword in prompt.lower() for keyword in ["pesquise", "search", "pesquisar"]):
            result = self._browser_search.query(prompt)
            print("🌐 Resultado da pesquisa:", result)

        if self._multimodal:
            lowered = prompt.lower()
            if lowered.startswith("capturar tela"):
                try:
                    path = self._multimodal.capture_screenshot()
                    print(f"📸 Screenshot salva em {path}")
                except RuntimeError as exc:
                    print(f"⚠️ Falha ao capturar screenshot: {exc}")
                return
            if lowered.startswith("ocr "):
                _, _, file_path = prompt.partition(" ")
                text = self._multimodal.perform_ocr(Path(file_path.strip()))
                print("🪄 OCR:", text)
                return
            if lowered.startswith("voz:"):
                audio = self._multimodal.record_audio()
                text = self._multimodal.transcribe_audio(audio)
                print("🎤 Transcrição:", text)
                return

        conversation = self._generator.initiate_chat_with_critic(
            critic=self._critic,
            user_message=prompt,
        )

        if not conversation.summary:
            return

        self._memory.add_event("conversation", conversation.summary)
        if self.config.enable_auto_execution and "```" in conversation.summary:
            results = self._executor.execute_from_conversation(conversation.summary)
            if self._reward_system:
                for result in results:
                    status = result.get("returncode", 1)
                    points = 10 if status == 0 else -5
                    reason = "Execução bem sucedida" if status == 0 else "Execução falhou"
                    self._reward_system.award("execution", points, reason=reason)

    def interactive(self) -> None:
        """Start an interactive prompt loop."""
        print("\n💡 O que você quer que o framework desenvolva?")
        try:
            while True:
                try:
                    prompt = input("> ")
                except (KeyboardInterrupt, EOFError):
                    print("\n👋 Encerrando Unified Dev Agent.")
                    break

                if not prompt.strip():
                    continue

                self.run(prompt)
        finally:
            if self._observer:
                self._observer.stop()


__all__ = ["UnifiedDevAgent", "UnifiedDevAgentConfig"]
