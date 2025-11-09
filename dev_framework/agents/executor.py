"""Executor agent that connects to Open Interpreter and external tooling."""
from __future__ import annotations

import json
import subprocess
from pathlib import Path
from typing import Optional

from autogen import UserProxyAgent

from ..integrations.after_effects import AfterEffectsIntegration
from ..integrations.ufo import UFOIntegration
from ..memory.auto_context import AutoContextMemory
from ..memory.memory_manager import MemoryManager


class ExecutorAgent:
    """Runs code locally and coordinates integrations."""

    def __init__(
        self,
        *,
        name: str,
        user_proxy: UserProxyAgent,
        workspace: Path,
        memory: MemoryManager,
        auto_memory: AutoContextMemory,
        auto_exec: bool = True,
    ) -> None:
        self.name = name
        self._user_proxy = user_proxy
        self._workspace = Path(workspace)
        self._memory = memory
        self._auto_memory = auto_memory
        self._auto_exec = auto_exec
        self._after_effects: Optional[AfterEffectsIntegration] = None
        self._ufo: Optional[UFOIntegration] = None

    def load_after_effects_project(self, project_path: Path) -> None:
        self._after_effects = AfterEffectsIntegration(project_path)
        self._memory.add_event("after_effects", f"Loaded project: {project_path}")

    def connect_ufo_workspace(self, workspace: Path) -> None:
        self._ufo = UFOIntegration(workspace)
        self._memory.add_event("ufo_workspace", str(workspace))

    def execute_from_conversation(self, conversation_summary: str) -> list[dict[str, str | int]]:
        code_blocks = self._extract_code_blocks(conversation_summary)
        results = []
        for block in code_blocks:
            results.append(self.run_local_code(block))
        return results

    def run_local_code(self, code: str) -> dict[str, str | int]:
        if not self._auto_exec:
            self._memory.add_event("execution_skipped", code)
            return {"returncode": -1, "stdout": "", "stderr": "Auto execution disabled"}

        command = ["interpreter", "-y", "--local"]
        process = subprocess.run(
            command,
            input=code.encode("utf-8"),
            cwd=self._workspace,
            check=False,
            capture_output=True,
        )
        stdout = process.stdout.decode("utf-8", errors="ignore")
        stderr = process.stderr.decode("utf-8", errors="ignore")
        result = {
            "returncode": process.returncode,
            "stdout": stdout,
            "stderr": stderr,
        }
        self._memory.add_event("execution_result", json.dumps(result, ensure_ascii=False))
        status = "success" if process.returncode == 0 else "failed"
        self._auto_memory.remember_execution(code, output=stdout or stderr, status=status)

        if self._after_effects:
            self._after_effects.sync_memory(self._memory)
        if self._ufo:
            self._ufo.capture_state(self._memory)
        return result

    @staticmethod
    def _extract_code_blocks(conversation_summary: str) -> list[str]:
        blocks: list[str] = []
        parts = conversation_summary.split("```")
        for index in range(1, len(parts), 2):
            blocks.append(parts[index])
        return blocks
