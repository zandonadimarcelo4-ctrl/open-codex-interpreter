"""Observe & Automate mode using pyautogui and pynput."""
from __future__ import annotations

import threading
import time
from dataclasses import dataclass, field
from typing import Any, Callable, Optional

try:  # pragma: no cover - platform dependent
    import pyautogui
except Exception:  # pragma: no cover
    pyautogui = None  # type: ignore

try:  # pragma: no cover
    from pynput import keyboard, mouse
except Exception:  # pragma: no cover
    keyboard = None  # type: ignore
    mouse = None  # type: ignore

from ..memory.auto_context import AutoContextMemory


@dataclass
class ObserveAutomateController:
    """Captures human interactions and mirrors them into automation scripts."""

    memory: AutoContextMemory
    _listener_threads: list[threading.Thread] = field(default_factory=list, init=False)
    _stop_event: threading.Event = field(default_factory=threading.Event, init=False)
    _automation_callback: Optional[Callable[[str], None]] = None
    _keyboard_listener: Optional[Any] = field(default=None, init=False)
    _mouse_listener: Optional[Any] = field(default=None, init=False)

    def start(self, callback: Optional[Callable[[str], None]] = None) -> None:
        self._automation_callback = callback
        self._stop_event.clear()
        try:
            if keyboard:
                self._start_keyboard_listener()
            if mouse:
                self._start_mouse_listener()
            self.memory.manager.add_event("observe_mode", "Observe & Automate mode enabled")
        except Exception as exc:  # pragma: no cover - hardware specific
            self.memory.manager.add_event("observe_mode_error", str(exc))

    def stop(self) -> None:
        self._stop_event.set()
        if self._keyboard_listener:
            self._keyboard_listener.stop()
        if self._mouse_listener:
            self._mouse_listener.stop()
        for thread in self._listener_threads:
            if thread.is_alive():
                thread.join(timeout=0.2)
        self._listener_threads.clear()
        self.memory.manager.add_event("observe_mode", "Observe & Automate mode disabled")

    def _start_keyboard_listener(self) -> None:
        def on_press(key: keyboard.Key | keyboard.KeyCode) -> None:
            if self._stop_event.is_set():
                return
            description = f"Key pressed: {key}"
            self.memory.record_interaction(speaker="system", message=description, tags=["keyboard"])
            if self._automation_callback:
                self._automation_callback(description)

        if not keyboard:
            return
        listener = keyboard.Listener(on_press=on_press)
        thread = listener.start()
        if thread:
            self._listener_threads.append(thread)
        self._keyboard_listener = listener

    def _start_mouse_listener(self) -> None:
        def on_click(x: int, y: int, button: mouse.Button, pressed: bool) -> None:
            if self._stop_event.is_set():
                return
            state = "down" if pressed else "up"
            description = f"Mouse {button} {state} at ({x}, {y})"
            self.memory.record_interaction(speaker="system", message=description, tags=["mouse"])
            if self._automation_callback:
                self._automation_callback(description)

        if not mouse:
            return
        listener = mouse.Listener(on_click=on_click)
        thread = listener.start()
        if thread:
            self._listener_threads.append(thread)
        self._mouse_listener = listener

    def capture_screen(self, label: str | None = None) -> str:
        if not pyautogui:
            self.memory.manager.add_event("screenshot_error", "pyautogui indisponível")
            return ""
        screenshot = pyautogui.screenshot()
        path = self.memory.storage_path.parent / f"screenshot_{int(time.time())}.png"
        screenshot.save(path)
        self.memory.manager.add_event("screenshot", str(path))
        return str(path)


__all__ = ["ObserveAutomateController"]
