"""Multimodal utilities including OCR, vision and voice I/O."""
from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Optional

import numpy as np

try:  # pragma: no cover
    import pyautogui
except Exception:  # pragma: no cover
    pyautogui = None  # type: ignore

try:  # pragma: no cover
    import speech_recognition as sr
except Exception:  # pragma: no cover
    sr = None  # type: ignore

from PIL import Image
from pytesseract import image_to_string

from ..memory.auto_context import AutoContextMemory

try:  # pragma: no cover - optional dependency
    import sounddevice as sd
except Exception:  # pragma: no cover - gracefully degrade if sounddevice missing
    sd = None


@dataclass
class MultimodalInterface:
    """Provides OCR, screenshot capture and speech transcription."""

    memory: AutoContextMemory

    def capture_screenshot(self, label: Optional[str] = None) -> Path:
        if not pyautogui:
            self.memory.manager.add_event("vision_error", "pyautogui indisponível")
            raise RuntimeError("pyautogui indisponível para capturar tela")
        image = pyautogui.screenshot()
        label = label or "screenshot"
        path = self.memory.storage_path.parent / f"{label}.png"
        image.save(path)
        self.memory.manager.add_event("vision", f"Captured screenshot {path}")
        return path

    def perform_ocr(self, image_path: Path) -> str:
        with Image.open(image_path) as img:
            text = image_to_string(img)
        self.memory.manager.add_event("ocr", text)
        return text

    def record_audio(
        self,
        duration: float = 5.0,
        *,
        samplerate: int = 16_000,
    ) -> Optional[tuple[np.ndarray, int]]:
        if sd is None:
            self.memory.manager.add_event("audio", "sounddevice not available")
            return None
        self.memory.manager.add_event("audio", f"Recording audio for {duration} seconds")
        recording = sd.rec(int(duration * samplerate), samplerate=samplerate, channels=1)
        sd.wait()
        return recording.squeeze(), samplerate

    def transcribe_audio(self, audio: Optional[tuple[np.ndarray, int]]) -> Optional[str]:
        if audio is None:
            return None
        waveform, samplerate = audio
        waveform = waveform.astype(np.float32)
        pcm_bytes = (waveform * (2**15 - 1)).astype(np.int16).tobytes()
        if not sr:
            self.memory.manager.add_event("audio_error", "speech_recognition indisponível")
            return None
        recognizer = sr.Recognizer()
        audio_data = sr.AudioData(pcm_bytes, samplerate, 2)
        try:
            text = recognizer.recognize_google(audio_data)
        except sr.UnknownValueError:
            text = None
        if text:
            self.memory.record_interaction(speaker="voice", message=text, tags=["voice"])
        return text


__all__ = ["MultimodalInterface"]
