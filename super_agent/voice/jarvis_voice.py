"""
Jarvis Voice System - Voz Realista e Futurista de IA
Sistema de TTS estilo Jarvis do Homem de Ferro
"""
from __future__ import annotations

import asyncio
import logging
import io
import wave
from typing import Optional, AsyncGenerator
from pathlib import Path

import numpy as np

logger = logging.getLogger(__name__)


class JarvisVoiceSystem:
    """
    Sistema de voz estilo Jarvis
    Voz realista e futurista de IA
    """
    
    def __init__(
        self,
        voice_model: str = "jarvis",
        voice_speed: float = 1.0,
        voice_pitch: float = 0.0,
        voice_style: str = "professional"
    ):
        self.voice_model = voice_model
        self.voice_speed = voice_speed
        self.voice_pitch = voice_pitch
        self.voice_style = voice_style
        self.tts_engine = None
        self.audio_queue = asyncio.Queue()
        self.is_speaking = False
        
        # Inicializar TTS
        self._initialize_tts()
    
    def _initialize_tts(self):
        """Inicializar engine de TTS"""
        try:
            # Tentar usar piper-tts (voz realista local)
            try:
                import piper
                self.tts_engine = "piper"
                logger.info("Piper TTS inicializado")
            except ImportError:
                # Fallback para pyttsx3
                try:
                    import pyttsx3
                    self.tts_engine = pyttsx3.init()
                    # Configurar voz estilo Jarvis
                    voices = self.tts_engine.getProperty('voices')
                    # Procurar voz masculina profissional
                    for voice in voices:
                        if 'male' in voice.name.lower() or 'david' in voice.name.lower():
                            self.tts_engine.setProperty('voice', voice.id)
                            break
                    # Configurar velocidade e pitch
                    self.tts_engine.setProperty('rate', int(150 * self.voice_speed))
                    self.tts_engine.setProperty('volume', 0.9)
                    logger.info("pyttsx3 TTS inicializado")
                except ImportError:
                    # Fallback para edge-tts (Windows)
                    try:
                        import edge_tts
                        self.tts_engine = "edge_tts"
                        logger.info("Edge TTS inicializado")
                    except ImportError:
                        logger.warning("Nenhum engine de TTS disponível")
                        self.tts_engine = None
        except Exception as e:
            logger.warning(f"Falha ao inicializar TTS: {e}")
            self.tts_engine = None
    
    async def speak(self, text: str, stream: bool = False) -> Optional[AsyncGenerator[bytes, None]]:
        """
        Falar texto com voz estilo Jarvis
        
        Args:
            text: Texto a falar
            stream: Se True, retorna generator de áudio
        
        Returns:
            Generator de áudio se stream=True, None caso contrário
        """
        if not self.tts_engine:
            logger.warning("TTS não disponível")
            return None
        
        # Adicionar prefixo estilo Jarvis
        text = self._add_jarvis_style(text)
        
        if stream:
            # Retornar generator de áudio
            async for audio_chunk in self._speak_stream(text):
                yield audio_chunk
        else:
            # Falar diretamente
            await self._speak_direct(text)
    
    def _add_jarvis_style(self, text: str) -> str:
        """Adicionar estilo Jarvis ao texto"""
        # Adicionar pausas naturais
        text = text.replace(".", ".\n")
        text = text.replace(",", ",\n")
        text = text.replace("!", "!\n")
        text = text.replace("?", "?\n")
        
        # Adicionar prefixo estilo Jarvis
        if not text.startswith("Sir,") and not text.startswith("Certainly,"):
            # Adicionar prefixo ocasionalmente
            prefixes = ["Certainly,", "Of course,", "Right away,", "Understood,"]
            import random
            if random.random() < 0.3:  # 30% das vezes
                text = f"{random.choice(prefixes)} {text}"
        
        return text
    
    async def _speak_stream(self, text: str) -> AsyncGenerator[bytes, None]:
        """Falar texto em streaming"""
        self.is_speaking = True
        
        try:
            if self.tts_engine == "piper":
                # Usar piper para streaming
                async for chunk in self._piper_stream(text):
                    yield chunk
            elif self.tts_engine == "edge_tts":
                # Usar edge-tts para streaming
                async for chunk in self._edge_tts_stream(text):
                    yield chunk
            else:
                # Fallback para pyttsx3 (não suporta streaming)
                await self._speak_direct(text)
        finally:
            self.is_speaking = False
    
    async def _piper_stream(self, text: str) -> AsyncGenerator[bytes, None]:
        """Stream usando piper-tts"""
        # Implementar streaming com piper
        # Por enquanto, retornar chunks simulados
        chunks = text.split()
        for chunk in chunks:
            await asyncio.sleep(0.1)  # Simular processamento
            yield chunk.encode()
    
    async def _edge_tts_stream(self, text: str) -> AsyncGenerator[bytes, None]:
        """Stream usando edge-tts"""
        try:
            import edge_tts
            
            # Usar voz masculina profissional
            voice = "en-US-GuyNeural"  # Voz masculina profissional
            
            communicate = edge_tts.Communicate(text, voice)
            async for chunk in communicate.stream():
                if chunk["type"] == "audio":
                    yield chunk["data"]
        except Exception as e:
            logger.error(f"Erro ao fazer streaming com edge-tts: {e}")
    
    async def _speak_direct(self, text: str):
        """Falar texto diretamente"""
        self.is_speaking = True
        
        try:
            if self.tts_engine == "piper":
                # Usar piper
                await self._piper_speak(text)
            elif self.tts_engine == "edge_tts":
                # Usar edge-tts
                await self._edge_tts_speak(text)
            else:
                # Usar pyttsx3
                await self._pyttsx3_speak(text)
        finally:
            self.is_speaking = False
    
    async def _piper_speak(self, text: str):
        """Falar usando piper-tts"""
        # Implementar com piper
        logger.info(f"Falando: {text}")
    
    async def _edge_tts_speak(self, text: str):
        """Falar usando edge-tts"""
        try:
            import edge_tts
            import asyncio
            
            voice = "en-US-GuyNeural"
            communicate = edge_tts.Communicate(text, voice)
            
            # Salvar em arquivo temporário e reproduzir
            output_file = Path("./temp_jarvis_audio.mp3")
            await communicate.save(str(output_file))
            
            # Reproduzir áudio
            import playsound
            playsound.playsound(str(output_file))
            
            # Limpar arquivo
            output_file.unlink()
        except Exception as e:
            logger.error(f"Erro ao falar com edge-tts: {e}")
    
    async def _pyttsx3_speak(self, text: str):
        """Falar usando pyttsx3"""
        if hasattr(self.tts_engine, 'say'):
            loop = asyncio.get_event_loop()
            await loop.run_in_executor(None, self.tts_engine.say, text)
            await loop.run_in_executor(None, self.tts_engine.runAndWait)
    
    def stop(self):
        """Parar de falar"""
        self.is_speaking = False
        if hasattr(self.tts_engine, 'stop'):
            self.tts_engine.stop()
    
    def get_status(self) -> dict:
        """Obter status do sistema de voz"""
        return {
            "engine": str(self.tts_engine) if self.tts_engine else None,
            "is_speaking": self.is_speaking,
            "voice_model": self.voice_model,
            "voice_speed": self.voice_speed,
            "voice_pitch": self.voice_pitch,
            "voice_style": self.voice_style,
        }

