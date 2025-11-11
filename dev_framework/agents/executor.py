"""Executor agent that connects to Open Interpreter and external tooling (AutoGen v2)."""
from __future__ import annotations

import json
import logging
import subprocess
from pathlib import Path
from typing import Any, Optional

try:
    from autogen_agentchat.agents import AssistantAgent
    AUTOGEN_V2_AVAILABLE = True
except ImportError:
    AUTOGEN_V2_AVAILABLE = False
    logger = logging.getLogger(__name__)
    logger.error("AutoGen v2 não disponível. Execute: pip install autogen-agentchat autogen-ext[openai]")
    raise ImportError("AutoGen v2 (autogen-agentchat) é obrigatório")

from ..integrations.after_effects import AfterEffectsIntegration
from ..integrations.ufo import UFOIntegration
from ..memory.memory_manager import MemoryManager

logger = logging.getLogger(__name__)


class ExecutorAgent(AssistantAgent):
    """Runs code locally and coordinates integrations (AutoGen v2)."""

    def __init__(
        self,
        *,
        name: str,
        model_client: Any,
        workspace: Path,
        memory: MemoryManager,
        auto_exec: bool = True,
        **kwargs
    ) -> None:
        """
        Inicializar Executor Agent com AutoGen v2
        
        Args:
            name: Nome do agente
            model_client: Model Client (Ollama ou OpenAI)
            workspace: Diretório de trabalho
            memory: Gerenciador de memória
            auto_exec: Executar código automaticamente
            **kwargs: Argumentos adicionais
        """
        system_message = """Você é um agente executor especializado em executar código e comandos.
        Sua função é executar código Python, JavaScript, Shell, etc.
        Use a memória para lembrar comandos e resultados anteriores.
        Armazene resultados de execução na memória para referência futura.
        Sempre verifique resultados antes de prosseguir."""
        
        super().__init__(
            name=name,
            model_client=model_client,
            system_message=system_message,
            **kwargs
        )
        
        self._workspace = Path(workspace)
        self._memory = memory
        self._auto_exec = auto_exec
        self._after_effects: Optional[AfterEffectsIntegration] = None
        self._ufo: Optional[UFOIntegration] = None

    def load_after_effects_project(self, project_path: Path) -> None:
        self._after_effects = AfterEffectsIntegration(project_path)
        self._memory.add_event("after_effects", f"Loaded project: {project_path}")

    def connect_ufo_workspace(self, workspace: Path) -> None:
        self._ufo = UFOIntegration(workspace)
        self._memory.add_event("ufo_workspace", str(workspace))

    def execute_from_conversation(self, conversation_summary: str) -> None:
        code_blocks = self._extract_code_blocks(conversation_summary)
        for block in code_blocks:
            self.run_local_code(block)

    def run_local_code(self, code: str) -> None:
        if not self._auto_exec:
            self._memory.add_event("execution_skipped", code)
            return

        command = ["interpreter", "-y", "--local"]
        process = subprocess.run(
            command,
            input=code.encode("utf-8"),
            cwd=self._workspace,
            check=False,
            capture_output=True,
        )
        result = {
            "returncode": process.returncode,
            "stdout": process.stdout.decode("utf-8", errors="ignore"),
            "stderr": process.stderr.decode("utf-8", errors="ignore"),
        }
        self._memory.add_event("execution_result", json.dumps(result, ensure_ascii=False))

        if self._after_effects:
            self._after_effects.sync_memory(self._memory)
        if self._ufo:
            self._ufo.capture_state(self._memory)

    @staticmethod
    def _extract_code_blocks(conversation_summary: str) -> list[str]:
        blocks: list[str] = []
        parts = conversation_summary.split("```")
        for index in range(1, len(parts), 2):
            blocks.append(parts[index])
        return blocks
