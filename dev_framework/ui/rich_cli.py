"""Rich-powered cinematic CLI for the unified agent."""
from __future__ import annotations

import textwrap
from typing import Iterable

from rich import box
from rich.align import Align
from rich.console import Console, Group
from rich.layout import Layout
from rich.live import Live
from rich.markdown import Markdown
from rich.panel import Panel
from rich.prompt import Prompt
from rich.rule import Rule
from rich.table import Table
from rich.text import Text

from ..configuration import UnifiedDevAgentConfig
from ..main import Notification, UnifiedDevAgentRunResult
from .base import AgentUI


class RichConsoleUI(AgentUI):
    """A cinematic terminal UI inspired by modern productivity tooling."""

    def __init__(self) -> None:
        self.console = Console()
        self.layout = Layout()
        self.timeline: list[Panel] = []
        self._live: Live | None = None

    # ------------------------------------------------------------------
    def banner(self, config: UnifiedDevAgentConfig) -> None:
        self.console.clear()
        title = Text("Unified Dev Agent", style="bold italic #9D4EDD")
        subtitle = Text(
            "Local-first orchestration · Ollama · AutoGen · Open Interpreter",
            style="italic #6C5CE7",
        )
        hero = Panel(
            Align.center(Text.from_markup("[bold white]∞[/]"), vertical="middle"),
            title="[b cyan]SUPER AGENT",
            subtitle="[dim]crafting autonomously" ,
            border_style="#4CC9F0",
            padding=(2, 8),
            width=80,
        )
        self.console.print(Align.center(hero))
        self.console.print(Align.center(title))
        self.console.print(Align.center(subtitle))
        self.console.print(Align.center(Rule(style="#4CC9F0")))
        overview = Text(
            textwrap.fill(
                "Digite comandos em linguagem natural para gerar planos, automações e execuções locais.\n"
                "Use prefixos como [bold]plugin:[/] ou comandos multimodais (capturar tela, ocr, voz:).",
                80,
            ),
            style="#E0AAFF",
            justify="center",
        )
        self.console.print(Align.center(overview))
        self.console.print()
        self._live = Live(self._render_timeline(), console=self.console, refresh_per_second=4)
        self._live.__enter__()

    def prompt(self) -> str:
        return Prompt.ask("[bold cyan]>[/]", console=self.console)

    def display_result(self, result: UnifiedDevAgentRunResult) -> None:
        panel = self._build_panel(result)
        self.timeline.append(panel)
        if len(self.timeline) > 6:
            self.timeline = self.timeline[-6:]
        if self._live:
            self._live.update(self._render_timeline())
        else:
            self.console.print(panel)

    def display_notifications(self, notes: Iterable[Notification]) -> None:
        for note in notes:
            self.console.print(self._notification_panel(note))

    def goodbye(self) -> None:
        farewell = Panel(
            Align.center(Text("Até breve — continue criando.", style="bold #7B2CBF")),
            border_style="#7B2CBF",
        )
        if self._live:
            self._live.stop()
            self._live.__exit__(None, None, None)
            self._live = None
        self.console.print(farewell)

    # ------------------------------------------------------------------
    def _render_timeline(self) -> Layout:
        layout = Layout(name="root")
        header_panel = Panel(
            Align.center(Text("Fluxo ao vivo", style="bold #4CC9F0")),
            box=box.ROUNDED,
            border_style="#4CC9F0",
        )
        layout.split_column(Layout(header_panel, size=3, name="header"), Layout(name="body"))
        body = Layout(name="timeline")
        if self.timeline:
            body.split_column(*[Layout(panel) for panel in reversed(self.timeline)])
        else:
            placeholder = Panel(
                Align.center(
                    Text(
                        "Aguardando instruções para iniciar o fluxo.",
                        style="#E0AAFF",
                    )
                ),
                border_style="#4CC9F0",
                box=box.ROUNDED,
            )
            body.update(placeholder)
        layout["body"] = body
        return layout

    def _build_panel(self, result: UnifiedDevAgentRunResult) -> Panel:
        renderables = []

        header = Text(
            f"{result.intention.name.title()} · {result.prompt}",
            style="bold #F72585",
        )
        renderables.append(header)

        if result.plan:
            plan_lines = "\n".join(f"[cyan]▸[/] {step}" for step in result.plan)
            renderables.append(Text.from_markup(f"[bold cyan]Plano[/]\n{plan_lines}"))

        if result.search_result:
            renderables.append(
                Text.from_markup(f"[bold green]Pesquisa[/]\n{result.search_result}")
            )

        if result.conversation_summary:
            renderables.append(Markdown(result.conversation_summary))

        if result.execution_results:
            table = Table(box=box.SIMPLE, show_header=True, header_style="bold #4361EE")
            table.add_column("Execução")
            table.add_column("Status", justify="right")
            for index, exec_result in enumerate(result.execution_results, start=1):
                status = exec_result.get("returncode", "?")
                table.add_row(f"#{index}", str(status))
            renderables.append(table)

        if result.notifications:
            for note in result.notifications:
                renderables.append(
                    Text.from_markup(
                        f"[bold]{note.title or note.kind.title()}[/]: {note.message}"
                    )
                )

        content = Group(*renderables)
        return Panel(
            Align.left(content),
            border_style="#4CC9F0",
            box=box.ROUNDED,
            subtitle="fluxo orquestrado",
        )

    def _notification_panel(self, note: Notification) -> Panel:
        icon = {
            "success": "✅",
            "warning": "⚠️",
            "error": "❌",
            "plugin": "🧩",
        }.get(note.kind, "ℹ️")
        body = Text(note.message, style="#E0AAFF")
        title = f"{icon} {note.title or note.kind.title()}"
        return Panel(body, title=title, border_style="#4CC9F0", box=box.ROUNDED)


__all__ = ["RichConsoleUI"]
