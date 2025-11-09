"""Self-update / auto-fork utilities."""
from __future__ import annotations

import subprocess
from dataclasses import dataclass
from pathlib import Path
from typing import Optional

from ..memory.auto_context import AutoContextMemory


@dataclass
class AutoForkManager:
    """Clones external repositories and prepares improvements automatically."""

    workspace: Path
    memory: AutoContextMemory

    def clone(self, repo_url: str, *, branch: Optional[str] = None) -> Path:
        target = self.workspace / Path(repo_url.split("/")[-1].replace(".git", ""))
        if target.exists():
            self.memory.manager.add_event("auto_fork", f"Repository already present: {target}")
            return target
        command = ["git", "clone", repo_url, str(target)]
        if branch:
            command.extend(["--branch", branch])
        subprocess.run(command, check=False)
        self.memory.manager.add_event("auto_fork", f"Cloned {repo_url} into {target}")
        return target

    def create_branch(self, repo_path: Path, branch_name: str) -> None:
        subprocess.run(["git", "-C", str(repo_path), "checkout", "-b", branch_name], check=False)
        self.memory.manager.add_event("auto_fork", f"Created branch {branch_name} in {repo_path}")

    def push_changes(self, repo_path: Path, message: str) -> None:
        subprocess.run(["git", "-C", str(repo_path), "add", "-A"], check=False)
        subprocess.run(["git", "-C", str(repo_path), "commit", "-m", message], check=False)
        subprocess.run(["git", "-C", str(repo_path), "push"], check=False)
        self.memory.manager.add_event("auto_fork", f"Pushed changes from {repo_path}")


__all__ = ["AutoForkManager"]
