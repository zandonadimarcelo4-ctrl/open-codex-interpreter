"""Entry point for the unified development agent framework."""
from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path
from typing import Iterable, Optional

from ._compat import require_autogen
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
from .ui.base import AgentUI

autogen = require_autogen()


@dataclass
class Notification:
    """Representation of an informational message produced during a run."""

    message: str
    kind: str = "info"
    title: Optional[str] = None

    def to_dict(self) -> dict[str, str]:
        payload = {"message": self.message, "kind": self.kind}
        if self.title:
            payload["title"] = self.title
        return payload


@dataclass
class UnifiedDevAgentRunResult:
    """Structured result returned by :meth:`UnifiedDevAgent.run`."""

    prompt: str
    intention: Intention
    plan: Optional[list[str]] = None
    search_result: Optional[str] = None
    conversation_summary: Optional[str] = None
    execution_results: list[dict[str, str | int]] = field(default_factory=list)
    notifications: list[Notification] = field(default_factory=list)

    def to_dict(self) -> dict[str, object]:
        return {
            "prompt": self.prompt,
            "intention": self.intention.name,
            "plan": self.plan,
            "search_result": self.search_result,
            "conversation_summary": self.conversation_summary,
            "execution_results": self.execution_results,
            "notifications": [note.to_dict() for note in self.notifications],
        }


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
        user_proxy = autogen.UserProxyAgent("UnifiedDevUser")
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

    def run(
        self, prompt: str, *, history: Optional[Iterable[str]] = None
    ) -> UnifiedDevAgentRunResult:
        """Run the unified development flow for a prompt."""
        result = UnifiedDevAgentRunResult(prompt=prompt, intention=Intention.EXECUTE)
        if history:
            for item in history:
                self._memory.add_event("history", item)

        self._auto_memory.record_interaction(speaker="user", message=prompt)
        intention = (
            self._intention_detector.classify(prompt)
            if self._intention_detector
            else Intention.EXECUTE
        )
        result.intention = intention

        if prompt.startswith("plugin:") and self._plugin_manager:
            _, _, payload = prompt.partition(":")
            name, _, args = payload.partition(" ")
            response = self._plugin_manager.execute(name, args.strip())
            response_text = str(response)
            self._auto_memory.record_interaction(
                speaker=name, message=response_text, tags=["plugin"]
            )
            result.notifications.append(
                Notification(
                    title=f"Plugin {name}",
                    message=response_text,
                    kind="plugin",
                )
            )
            return result

        if intention is Intention.PLAN and self._planner:
            steps = self._planner.plan(prompt)
            self._memory.add_event("plan", "\n".join(steps))
            result.plan = steps
            return result

        if self._browser_search and any(keyword in prompt.lower() for keyword in ["pesquise", "search", "pesquisar"]):
            search_output = self._browser_search.query(prompt)
            result_text = str(search_output)
            self._auto_memory.record_interaction(
                speaker="browser-search", message=result_text, tags=["search"]
            )
            result.search_result = result_text

        if self._multimodal:
            lowered = prompt.lower()
            if lowered.startswith("capturar tela"):
                try:
                    path = self._multimodal.capture_screenshot()
                    self._memory.add_event("screenshot", str(path))
                    result.notifications.append(
                        Notification(
                            title="Screenshot",
                            message=f"Imagem salva em {path}",
                            kind="success",
                        )
                    )
                except RuntimeError as exc:
                    result.notifications.append(
                        Notification(
                            title="Screenshot",
                            message=str(exc),
                            kind="warning",
                        )
                    )
                return result
            if lowered.startswith("ocr "):
                _, _, file_path = prompt.partition(" ")
                text = self._multimodal.perform_ocr(Path(file_path.strip()))
                result.notifications.append(
                    Notification(
                        title="OCR",
                        message=text,
                        kind="success",
                    )
                )
                return result
            if lowered.startswith("voz:"):
                audio = self._multimodal.record_audio()
                text = self._multimodal.transcribe_audio(audio)
                result.notifications.append(
                    Notification(
                        title="Transcrição de áudio",
                        message=text,
                        kind="success",
                    )
                )
                return result

        conversation = self._generator.initiate_chat_with_critic(
            critic=self._critic,
            user_message=prompt,
        )

        if not conversation.summary:
            return result

        self._memory.add_event("conversation", conversation.summary)
        result.conversation_summary = conversation.summary
        if self.config.enable_auto_execution and "```" in conversation.summary:
            exec_results = self._executor.execute_from_conversation(conversation.summary)
            result.execution_results = exec_results
            if self._reward_system:
                for exec_result in exec_results:
                    status = exec_result.get("returncode", 1)
                    points = 10 if status == 0 else -5
                    reason = "Execução bem sucedida" if status == 0 else "Execução falhou"
                    self._reward_system.award("execution", points, reason=reason)
        return result

    def interactive(self, ui: Optional[AgentUI] = None) -> None:
        """Start an interactive prompt loop."""
        if ui:
            ui.banner(self.config)
        else:
            print("\n💡 O que você quer que o framework desenvolva?")
        try:
            while True:
                try:
                    if ui:
                        prompt = ui.prompt()
                    else:
                        prompt = input("> ")
                except (KeyboardInterrupt, EOFError):
                    if ui:
                        ui.goodbye()
                    else:
                        print("\n👋 Encerrando Unified Dev Agent.")
                    break

                if not prompt.strip():
                    continue

                result = self.run(prompt)
                if ui:
                    ui.display_result(result)
                else:
                    self._render_result(result)
        finally:
            if self._observer:
                self._observer.stop()

    def _render_result(self, result: UnifiedDevAgentRunResult) -> None:
        if result.plan:
            print("📝 Plano gerado:")
            for step in result.plan:
                print(f"- {step}")
            return

        if result.search_result:
            print("🌐 Resultado da pesquisa:", result.search_result)

        for note in result.notifications:
            prefix = {
                "success": "✅",
                "warning": "⚠️",
                "error": "❌",
                "plugin": "🧩",
            }.get(note.kind, "ℹ️")
            heading = f" {note.title}" if note.title else ""
            print(f"{prefix}{heading}: {note.message}")

        if result.conversation_summary:
            print(result.conversation_summary)

        if result.execution_results:
            for exec_result in result.execution_results:
                status = exec_result.get("returncode", "?")
                print(f"⚙️ Execução retornou {status}")
                stdout = exec_result.get("stdout")
                stderr = exec_result.get("stderr")
                if stdout:
                    print(stdout)
                if stderr:
                    print(stderr)


__all__ = [
    "UnifiedDevAgent",
    "UnifiedDevAgentConfig",
    "UnifiedDevAgentRunResult",
    "Notification",
]
