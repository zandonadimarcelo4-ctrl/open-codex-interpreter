"""
Speech to Text - Reconhecimento de Voz
Sistema de STT para interação por voz
"""
from __future__ import annotations

import asyncio
import logging
from typing import Optional, AsyncGenerator

logger = logging.getLogger(__name__)


class SpeechToText:
    """
    Sistema de reconhecimento de voz
    Converte áudio em texto
    """
    
    def __init__(self, model: str = "whisper"):
        self.model = model
        self.stt_engine = None
        self.is_listening = False
        
        # Inicializar STT
        self._initialize_stt()
    
    def _initialize_stt(self):
        """Inicializar engine de STT"""
        try:
            if self.model == "whisper":
                # Tentar usar whisper
                try:
                    import whisper
                    self.stt_engine = whisper.load_model("base")
                    logger.info("Whisper STT inicializado")
                except ImportError:
                    # Fallback para speech_recognition
                    try:
                        import speech_recognition as sr
                        self.stt_engine = sr.Recognizer()
                        logger.info("speech_recognition STT inicializado")
                    except ImportError:
                        logger.warning("Nenhum engine de STT disponível")
                        self.stt_engine = None
        except Exception as e:
            logger.warning(f"Falha ao inicializar STT: {e}")
            self.stt_engine = None
    
    async def listen(self, timeout: Optional[float] = None) -> Optional[str]:
        """
        Ouvir e converter áudio em texto
        
        Args:
            timeout: Timeout em segundos
        
        Returns:
            Texto reconhecido ou None
        """
        if not self.stt_engine:
            logger.warning("STT não disponível")
            return None
        
        self.is_listening = True
        
        try:
            if hasattr(self.stt_engine, 'transcribe'):
                # Usar whisper
                return await self._whisper_listen(timeout)
            else:
                # Usar speech_recognition
                return await self._speech_recognition_listen(timeout)
        finally:
            self.is_listening = False
    
    async def _whisper_listen(self, timeout: Optional[float] = None) -> Optional[str]:
        """Ouvir usando whisper"""
        try:
            import pyaudio
            import wave
            
            # Gravar áudio
            audio_data = await self._record_audio(timeout)
            
            if audio_data:
                # Transcrever usando whisper
                result = self.stt_engine.transcribe(audio_data)
                return result["text"]
        except Exception as e:
            logger.error(f"Erro ao ouvir com whisper: {e}")
            return None
    
    async def _speech_recognition_listen(self, timeout: Optional[float] = None) -> Optional[str]:
        """Ouvir usando speech_recognition"""
        try:
            import speech_recognition as sr
            import pyaudio
            
            with sr.Microphone() as source:
                # Ajustar para ruído ambiente
                self.stt_engine.adjust_for_ambient_noise(source)
                
                # Ouvir áudio
                loop = asyncio.get_event_loop()
                audio = await loop.run_in_executor(
                    None,
                    self.stt_engine.listen,
                    source,
                    timeout or 5
                )
                
                # Reconhecer usando Google
                try:
                    text = await loop.run_in_executor(
                        None,
                        self.stt_engine.recognize_google,
                        audio,
                        language="pt-BR"
                    )
                    return text
                except sr.UnknownValueError:
                    logger.warning("Não foi possível reconhecer o áudio")
                    return None
                except sr.RequestError as e:
                    logger.error(f"Erro ao reconhecer: {e}")
                    return None
        except Exception as e:
            logger.error(f"Erro ao ouvir com speech_recognition: {e}")
            return None
    
    async def _record_audio(self, timeout: Optional[float] = None) -> Optional[bytes]:
        """Gravar áudio"""
        try:
            import pyaudio
            
            CHUNK = 1024
            FORMAT = pyaudio.paInt16
            CHANNELS = 1
            RATE = 16000
            
            p = pyaudio.PyAudio()
            
            stream = p.open(
                format=FORMAT,
                channels=CHANNELS,
                rate=RATE,
                input=True,
                frames_per_buffer=CHUNK
            )
            
            frames = []
            duration = timeout or 5
            
            for _ in range(0, int(RATE / CHUNK * duration)):
                data = stream.read(CHUNK)
                frames.append(data)
            
            stream.stop_stream()
            stream.close()
            p.terminate()
            
            return b''.join(frames)
        except Exception as e:
            logger.error(f"Erro ao gravar áudio: {e}")
            return None
    
    def stop(self):
        """Parar de ouvir"""
        self.is_listening = False
    
    def get_status(self) -> dict:
        """Obter status do sistema de STT"""
        return {
            "engine": str(self.stt_engine) if self.stt_engine else None,
            "is_listening": self.is_listening,
            "model": self.model,
        }

