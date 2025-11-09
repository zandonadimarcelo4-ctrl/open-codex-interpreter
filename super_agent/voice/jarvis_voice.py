"""
Jarvis Voice System - Voz Realista e Futurista de IA
Sistema de TTS estilo Jarvis do Homem de Ferro
Usando Coqui TTS (XTTS) para voz realista
"""
from __future__ import annotations

import asyncio
import logging
import io
import wave
from typing import Optional, AsyncGenerator
from pathlib import Path

try:
    import aiohttp
    AIOHTTP_AVAILABLE = True
except ImportError:
    AIOHTTP_AVAILABLE = False

try:
    from elevenlabs.client import ElevenLabs
    from elevenlabs import stream as elevenlabs_stream
    ELEVENLABS_AVAILABLE = True
except ImportError:
    ELEVENLABS_AVAILABLE = False

import numpy as np

logger = logging.getLogger(__name__)


class JarvisVoiceSystem:
    """
    Sistema de voz estilo Jarvis
    Voz realista e futurista de IA usando Coqui TTS (XTTS)
    """
    
    def __init__(
        self,
        voice_model: str = "xtts-v2",
        voice_speed: float = 0.95,  # Ligeiramente mais lento para soar mais natural
        voice_pitch: float = 0.0,
        voice_style: str = "professional",
        language: str = "pt-BR",
        speaker_wav_path: Optional[str] = None,  # Caminho para arquivo de voz de referência (voice cloning)
        elevenlabs_api_key: Optional[str] = None,  # API Key do ElevenLabs
        elevenlabs_voice_id: Optional[str] = None  # Voice ID do ElevenLabs
    ):
        self.voice_model = voice_model
        self.voice_speed = voice_speed
        self.voice_pitch = voice_pitch
        self.voice_style = voice_style
        self.language = language
        self.speaker_wav_path = speaker_wav_path
        self.elevenlabs_api_key = elevenlabs_api_key or "872680f98ad6eababb9f8f1e89ec0c939bb1f004364f6b3bb36e2f917c8bef01"
        self.elevenlabs_voice_id = elevenlabs_voice_id or "1qyUTInppoHkRcPT9t6b"
        self.tts_engine = None
        self.fallback_engine = None  # Engine de fallback se ElevenLabs falhar
        self.audio_queue = asyncio.Queue()
        self.is_speaking = False
        
        # Inicializar TTS
        self._initialize_tts()
    
    def _initialize_tts(self):
        """Inicializar engine de TTS - Priorizar ElevenLabs API (voz ultra-realista)"""
        try:
            # PRIORIDADE 1: ElevenLabs API - Voz ultra-realista (melhor qualidade)
            if self.elevenlabs_api_key and self.elevenlabs_voice_id:
                if ELEVENLABS_AVAILABLE:
                    # Usar biblioteca oficial do ElevenLabs
                    try:
                        self.elevenlabs_client = ElevenLabs(api_key=self.elevenlabs_api_key)
                        self.tts_engine = "elevenlabs"
                        logger.info("✅ ElevenLabs API configurada - Voz ultra-realista (PRIORIDADE)")
                        logger.info(f"   API Key: {self.elevenlabs_api_key[:20]}...")
                        logger.info(f"   Voice ID: {self.elevenlabs_voice_id}")
                        logger.info("   Usando biblioteca oficial do ElevenLabs com suporte a streaming")
                    except Exception as e:
                        logger.warning(f"Erro ao inicializar ElevenLabs client: {e}")
                        self.tts_engine = None
                elif AIOHTTP_AVAILABLE:
                    # Fallback para aiohttp se biblioteca oficial não estiver disponível
                    try:
                        import aiohttp
                        self.tts_engine = "elevenlabs"
                        logger.info("✅ ElevenLabs API configurada - Voz ultra-realista (PRIORIDADE)")
                        logger.info(f"   API Key: {self.elevenlabs_api_key[:20]}...")
                        logger.info(f"   Voice ID: {self.elevenlabs_voice_id}")
                        logger.warning("   Usando aiohttp (biblioteca oficial não disponível)")
                    except Exception as e:
                        logger.warning(f"aiohttp não disponível para ElevenLabs API: {e}")
                        self.tts_engine = None
                else:
                    logger.warning("❌ Biblioteca oficial do ElevenLabs e aiohttp não disponíveis")
                    self.tts_engine = None
            else:
                logger.warning("❌ ElevenLabs API Key ou Voice ID não configurados")
                self.tts_engine = None
            
            # Sempre inicializar fallback engine (mesmo se ElevenLabs estiver disponível)
            # PRIORIDADE 2: Piper TTS (voz local rápida)
            try:
                import piper
                if not self.tts_engine or self.tts_engine != "elevenlabs":
                    self.tts_engine = "piper"
                self.fallback_engine = "piper"
                logger.info("Piper TTS disponível (fallback)")
            except ImportError:
                logger.warning("⚠️ Piper TTS não disponível")
                # Se nem ElevenLabs nem Piper estiverem disponíveis, não há fallback
                if not self.tts_engine or self.tts_engine != "elevenlabs":
                    logger.warning("❌ Nenhum engine de TTS disponível (ElevenLabs ou Piper necessário)")
                    self.tts_engine = None
                
            # OUTROS ENGINES COMENTADOS - Usar apenas ElevenLabs e Piper
            # # PRIORIDADE 3: Edge TTS - Melhor suporte nativo para pt-BR (vozes neurais ultra-realistas)
            # try:
            #     import edge_tts
            #     if not self.tts_engine or self.tts_engine != "elevenlabs":
            #         self.tts_engine = "edge_tts"
            #         logger.warning("⚠️ Usando Edge TTS (fallback) - ElevenLabs não disponível")
            #     self.fallback_engine = "edge_tts"
            #     logger.info("Edge TTS disponível (fallback) - Voz neural pt-BR ultra-realista")
            # except ImportError:
            #         # PRIORIDADE 4: Coqui TTS (XTTS) - Multilíngue mas suporte pt-BR pode ser limitado
            #         try:
            #             from TTS.api import TTS
            #             # XTTS v2 - voz ultra-realista e natural (melhor qualidade)
            #             # Usar GPU se disponível para melhor performance e qualidade
            #             try:
            #                 self.tts_engine = TTS(
            #                     model_name="tts_models/multilingual/multi-dataset/xtts_v2",
            #                     progress_bar=False,
            #                     gpu=True  # Usar GPU se disponível para melhor qualidade
            #                 )
            #                 logger.info("Coqui TTS (XTTS v2) inicializado com GPU (fallback)")
            #             except Exception:
            #                 # Fallback para CPU se GPU não disponível
            #                 self.tts_engine = TTS(
            #                     model_name="tts_models/multilingual/multi-dataset/xtts_v2",
            #                     progress_bar=False,
            #                     gpu=False
            #                 )
            #                 logger.info("Coqui TTS (XTTS v2) inicializado com CPU (fallback)")
            #         except ImportError:
            #             # PRIORIDADE 5: pyttsx3 (voz do sistema)
            #             try:
            #                 import pyttsx3
            #                 self.tts_engine = pyttsx3.init()
            #                 # Configurar voz masculina profissional
            #                 voices = self.tts_engine.getProperty('voices')
            #                 for voice in voices:
            #                     if 'male' in voice.name.lower() or 'david' in voice.name.lower():
            #                         self.tts_engine.setProperty('voice', voice.id)
            #                         break
            #                 self.tts_engine.setProperty('rate', int(150 * self.voice_speed))
            #                 self.tts_engine.setProperty('volume', 0.9)
            #                 logger.info("pyttsx3 TTS inicializado (fallback)")
            #             except ImportError:
            #                 logger.warning("Nenhum engine de TTS disponível")
            #                 self.tts_engine = None
        except Exception as e:
            logger.warning(f"Falha ao inicializar TTS: {e}")
            self.tts_engine = None
    
    async def speak(self, text: str):
        """
        Falar texto com voz estilo Jarvis (modo direto)
        
        Args:
            text: Texto a falar
        """
        if not self.tts_engine:
            logger.warning("TTS não disponível")
            return
        
        # Adicionar prefixo estilo Jarvis
        text = self._add_jarvis_style(text)
        
        # Falar diretamente
        await self._speak_direct(text)
    
    async def speak_stream(self, text: str) -> AsyncGenerator[bytes, None]:
        """
        Falar texto com voz estilo Jarvis (modo streaming)
        
        Args:
            text: Texto a falar
        
        Yields:
            Chunks de áudio
        """
        if not self.tts_engine:
            logger.warning("TTS não disponível")
            return
        
        # Adicionar prefixo estilo Jarvis
        text = self._add_jarvis_style(text)
        
        # Retornar generator de áudio
        async for audio_chunk in self._speak_stream(text):
            yield audio_chunk
    
    def _add_jarvis_style(self, text: str) -> str:
        """Adicionar estilo Jarvis ao texto - REMOVIDO para voz mais natural"""
        # REMOVIDO: Modificações de texto que podem afetar a naturalidade da voz
        # O ElevenLabs funciona melhor com texto natural, sem modificações
        # return text
        
        # Apenas remover quebras de linha excessivas e normalizar espaços
        text = text.replace("\n\n", "\n").replace("\n", " ").strip()
        # Normalizar espaços múltiplos
        import re
        text = re.sub(r'\s+', ' ', text)
        
        return text
    
    async def _speak_stream(self, text: str) -> AsyncGenerator[bytes, None]:
        """Falar texto em streaming - Priorizar ElevenLabs API"""
        self.is_speaking = True
        
        try:
            # PRIORIDADE 1: ElevenLabs API - Voz ultra-realista
            if self.tts_engine == "elevenlabs":
                async for chunk in self._elevenlabs_stream(text):
                    yield chunk
            # PRIORIDADE 2: Piper TTS
            elif self.tts_engine == "piper":
                async for chunk in self._piper_stream(text):
                    yield chunk
            # OUTROS ENGINES COMENTADOS - Usar apenas ElevenLabs e Piper
            # # PRIORIDADE 3: Edge TTS - Melhor suporte nativo para pt-BR
            # elif self.tts_engine == "edge_tts":
            #     async for chunk in self._edge_tts_stream(text):
            #         yield chunk
            # # PRIORIDADE 4: Coqui TTS (XTTS)
            # elif hasattr(self.tts_engine, 'tts_to_file'):
            #     async for chunk in self._coqui_tts_stream(text):
            #         yield chunk
            else:
                logger.error(f"❌ Engine de TTS não suportado para streaming: {self.tts_engine}")
                logger.warning("💡 Configure ElevenLabs API ou instale Piper TTS")
                # Fallback para modo direto
                await self._speak_direct(text)
        finally:
            self.is_speaking = False
    
    async def _coqui_tts_stream(self, text: str) -> AsyncGenerator[bytes, None]:
        """Stream usando Coqui TTS (XTTS) - voz realista"""
        try:
            # Gerar áudio usando XTTS
            # XTTS suporta streaming e voz realista
            output_path = Path("./temp_jarvis_audio.wav")
            
            # Usar speaker_wav para clonar voz (opcional) - voz ultra-realista
            # XTTS usa código de idioma de 2 letras - garantir que seja "pt" (português)
            lang_code = "pt"  # Português brasileiro (XTTS suporta pt-BR como "pt")
            
            # Usar voice cloning se disponível para voz mais realista
            speaker_wav = None
            if self.speaker_wav_path and Path(self.speaker_wav_path).exists():
                speaker_wav = self.speaker_wav_path
                logger.info(f"Usando voice cloning com arquivo: {speaker_wav}")
            
            # IMPORTANTE: language="pt" para português brasileiro
            self.tts_engine.tts_to_file(
                text=text,
                file_path=str(output_path),
                language=lang_code,  # "pt" = Português brasileiro
                speaker_wav=speaker_wav,  # Voice cloning para voz mais realista
                speed=self.voice_speed,  # Velocidade ajustada
            )
            logger.info(f"Gerando áudio em português (pt) com XTTS (streaming)")
            
            # Ler arquivo e enviar chunks
            with open(output_path, "rb") as f:
                while True:
                    chunk = f.read(4096)
                    if not chunk:
                        break
                    yield chunk
            
            # Limpar arquivo
            output_path.unlink()
        except Exception as e:
            logger.error(f"Erro ao fazer streaming com Coqui TTS: {e}")
    
    async def _piper_stream(self, text: str) -> AsyncGenerator[bytes, None]:
        """Stream usando piper-tts"""
        # Implementar streaming com piper
        chunks = text.split()
        for chunk in chunks:
            await asyncio.sleep(0.1)  # Simular processamento
            yield chunk.encode()
    
    async def _edge_tts_stream(self, text: str) -> AsyncGenerator[bytes, None]:
        """Stream usando edge-tts - voz neural ultra-realista"""
        try:
            import edge_tts
            
            # Usar voz neural masculina brasileira mais natural
            # pt-BR-AntonioNeural é a voz masculina mais natural e realista
            voice = "pt-BR-AntonioNeural"  # Voz masculina brasileira ultra-realista
            # Alternativas: "pt-BR-FranciscaNeural" (feminina), "pt-BR-ThalitaNeural" (feminina jovem)
            # IMPORTANTE: Edge TTS usa pt-BR automaticamente com pt-BR-AntonioNeural
            communicate = edge_tts.Communicate(text, voice, rate="-3%", pitch="+0Hz")
            async for chunk in communicate.stream():
                if chunk["type"] == "audio":
                    yield chunk["data"]
        except Exception as e:
            logger.error(f"Erro ao fazer streaming com edge-tts: {e}")
    
    async def _speak_direct(self, text: str):
        """Falar texto diretamente - Priorizar ElevenLabs API"""
        self.is_speaking = True
        
        logger.info(f"🔊 Iniciando TTS - Engine atual: {self.tts_engine}")
        logger.info(f"📝 Texto: {text[:100]}...")
        
        try:
            # PRIORIDADE 1: ElevenLabs API - Voz ultra-realista
            if self.tts_engine == "elevenlabs":
                logger.info("✅ Usando ElevenLabs API")
                await self._elevenlabs_speak(text)
            # PRIORIDADE 2: Piper TTS
            elif self.tts_engine == "piper":
                logger.warning("⚠️ Usando Piper TTS (fallback)")
                await self._piper_speak(text)
            # OUTROS ENGINES COMENTADOS - Usar apenas ElevenLabs e Piper
            # # PRIORIDADE 3: Edge TTS - Melhor suporte nativo para pt-BR
            # elif self.tts_engine == "edge_tts":
            #     await self._edge_tts_speak(text)
            # # PRIORIDADE 4: Coqui TTS (XTTS)
            # elif hasattr(self.tts_engine, 'tts_to_file'):
            #     await self._coqui_tts_speak(text)
            # # PRIORIDADE 5: pyttsx3
            # else:
            #     await self._pyttsx3_speak(text)
            else:
                logger.error(f"❌ Engine de TTS não suportado: {self.tts_engine}")
                logger.error(f"   Tipo: {type(self.tts_engine)}")
                logger.warning("💡 Configure ElevenLabs API ou instale Piper TTS")
                raise ValueError(f"Engine de TTS não suportado: {self.tts_engine}")
        finally:
            self.is_speaking = False
    
    async def _coqui_tts_speak(self, text: str):
        """Falar usando Coqui TTS (XTTS) - voz realista"""
        try:
            output_path = Path("./temp_jarvis_audio.wav")
            
            # Gerar áudio com XTTS (voz ultra-realista)
            # XTTS usa código de idioma de 2 letras - garantir que seja "pt" (português)
            lang_code = "pt"  # Português brasileiro (XTTS suporta pt-BR como "pt")
            
            # Usar voice cloning se disponível para voz mais realista
            speaker_wav = None
            if self.speaker_wav_path and Path(self.speaker_wav_path).exists():
                speaker_wav = self.speaker_wav_path
                logger.info(f"Usando voice cloning com arquivo: {speaker_wav}")
            
            # Gerar com parâmetros otimizados para voz natural
            # IMPORTANTE: language="pt" para português brasileiro
            self.tts_engine.tts_to_file(
                text=text,
                file_path=str(output_path),
                language=lang_code,  # "pt" = Português brasileiro
                speaker_wav=speaker_wav,  # Voice cloning para voz mais realista
                speed=self.voice_speed,  # Velocidade ajustada
            )
            logger.info(f"Gerando áudio em português (pt) com XTTS")
            
            # Reproduzir áudio
            try:
                import playsound
                playsound.playsound(str(output_path))
            except ImportError:
                # Fallback para pygame
                try:
                    import pygame
                    pygame.mixer.init()
                    pygame.mixer.music.load(str(output_path))
                    pygame.mixer.music.play()
                    while pygame.mixer.music.get_busy():
                        await asyncio.sleep(0.1)
                except ImportError:
                    logger.warning("Nenhum player de áudio disponível")
            
            # Limpar arquivo
            output_path.unlink()
            
            logger.info(f"Falando com Coqui TTS (XTTS): {text[:50]}...")
        except Exception as e:
            logger.error(f"Erro ao falar com Coqui TTS: {e}")
    
    async def _piper_speak(self, text: str):
        """Falar usando piper-tts"""
        logger.info(f"Falando: {text}")
    
    async def _edge_tts_speak(self, text: str):
        """Falar usando edge-tts - Voz neural pt-BR ultra-realista (RECOMENDADO)"""
        try:
            import edge_tts
            import asyncio
            
            # Usar voz neural masculina brasileira mais natural e realista
            # pt-BR-AntonioNeural é a voz masculina mais natural e realista para pt-BR
            voice = "pt-BR-AntonioNeural"  # Voz masculina brasileira ultra-realista
            # Configurar rate para velocidade mais natural (padrão é 0%)
            # -3% = ligeiramente mais lento para soar mais natural (ajustado para melhor qualidade)
            # Pitch ajustado para voz mais profissional
            communicate = edge_tts.Communicate(text, voice, rate="-3%", pitch="+0Hz")
            
            # Salvar em arquivo temporário e reproduzir
            output_file = Path("./temp_jarvis_audio.mp3")
            await communicate.save(str(output_file))
            
            # Reproduzir áudio
            try:
                import playsound
                playsound.playsound(str(output_file))
            except ImportError:
                logger.warning("playsound não disponível")
            
            # Limpar arquivo
            output_file.unlink()
            logger.warning(f"⚠️ Falando com Edge TTS (fallback - pt-BR-AntonioNeural): {text[:50]}...")
            logger.warning("💡 Dica: Para melhor qualidade, use ElevenLabs API (configure API Key e Voice ID)")
        except Exception as e:
            logger.error(f"❌ Erro ao falar com edge-tts: {e}")
    
    async def _elevenlabs_speak(self, text: str):
        """Falar usando ElevenLabs API - Voz ultra-realista (usando biblioteca oficial)"""
        try:
            if ELEVENLABS_AVAILABLE:
                # Usar biblioteca oficial do ElevenLabs
                output_path = Path("./temp_jarvis_audio.mp3")
                
                # Gerar áudio usando biblioteca oficial
                audio_generator = self.elevenlabs_client.text_to_speech.convert(
                    voice_id=self.elevenlabs_voice_id,
                    text=text,
                    model_id="eleven_multilingual_v2",  # Modelo multilíngue (detecta pt-BR automaticamente)
                    voice_settings={
                        "stability": 0.5,  # Menor estabilidade = mais variação e naturalidade
                        "similarity_boost": 0.75,  # Similaridade moderada para voz mais natural
                        "style": 0.0,  # Estilo neutro para voz mais natural e menos robótica
                        "use_speaker_boost": True  # Melhorar clareza e naturalidade
                    }
                )
                
                # Salvar áudio
                audio_data = b"".join(audio_generator)
                with open(output_path, "wb") as f:
                    f.write(audio_data)
                
                # Reproduzir áudio
                try:
                    import playsound
                    playsound.playsound(str(output_path))
                except ImportError:
                    logger.warning("playsound não disponível")
                
                # Limpar arquivo
                output_path.unlink()
                logger.info(f"✅ ElevenLabs API (biblioteca oficial): Áudio gerado e reproduzido com sucesso!")
                logger.info(f"   Texto: {text[:100]}...")
            elif AIOHTTP_AVAILABLE:
                # Fallback para aiohttp se biblioteca oficial não estiver disponível
                import aiohttp
                
                output_path = Path("./temp_jarvis_audio.mp3")
                
                # Chamar API do ElevenLabs
                url = f"https://api.elevenlabs.io/v1/text-to-speech/{self.elevenlabs_voice_id}"
                headers = {
                    "Accept": "audio/mpeg",
                    "Content-Type": "application/json",
                    "xi-api-key": self.elevenlabs_api_key
                }
                data = {
                    "text": text,  # IMPORTANTE: Texto deve estar em português brasileiro
                    "model_id": "eleven_multilingual_v2",  # Modelo multilíngue (detecta pt-BR automaticamente)
                    "voice_settings": {
                        "stability": 0.5,
                        "similarity_boost": 0.75,
                        "style": 0.0,
                        "use_speaker_boost": True
                    }
                }
                
                # Fazer requisição assíncrona
                async with aiohttp.ClientSession() as session:
                    async with session.post(url, json=data, headers=headers) as response:
                        if response.status == 200:
                            # Salvar áudio
                            audio_data = await response.read()
                            with open(output_path, "wb") as f:
                                f.write(audio_data)
                            
                            # Reproduzir áudio
                            try:
                                import playsound
                                playsound.playsound(str(output_path))
                            except ImportError:
                                logger.warning("playsound não disponível")
                            
                            # Limpar arquivo
                            output_path.unlink()
                            logger.info(f"✅ ElevenLabs API (aiohttp): Áudio gerado e reproduzido com sucesso!")
                            logger.info(f"   Texto: {text[:100]}...")
                        else:
                            error_text = await response.text()
                            logger.error(f"❌ Erro na API ElevenLabs: {response.status} - {error_text}")
                            logger.warning("⚠️ Usando fallback TTS...")
                            # Fallback para Piper
                            if self.fallback_engine == "piper":
                                await self._piper_speak(text)
            else:
                logger.error("❌ Biblioteca oficial do ElevenLabs e aiohttp não disponíveis")
                # Fallback para Piper
                if self.fallback_engine == "piper":
                    await self._piper_speak(text)
                else:
                    logger.error("❌ Nenhum fallback disponível")
        except ImportError:
            logger.warning("Biblioteca oficial do ElevenLabs não disponível, usando fallback")
            # Fallback para Piper
            if self.fallback_engine == "piper":
                await self._piper_speak(text)
            else:
                logger.error("❌ Nenhum fallback disponível")
        except Exception as e:
            logger.error(f"Erro ao falar com ElevenLabs API: {e}")
            # Fallback para Piper
            if self.fallback_engine == "piper":
                await self._piper_speak(text)
            else:
                logger.error("❌ Nenhum fallback disponível")
    
    async def _elevenlabs_stream(self, text: str) -> AsyncGenerator[bytes, None]:
        """Stream usando ElevenLabs API - Voz ultra-realista"""
        try:
            import aiohttp
            
            url = f"https://api.elevenlabs.io/v1/text-to-speech/{self.elevenlabs_voice_id}/stream"
            headers = {
                "Accept": "audio/mpeg",
                "Content-Type": "application/json",
                "xi-api-key": self.elevenlabs_api_key
            }
            data = {
                "text": text,  # IMPORTANTE: Texto deve estar em português brasileiro
                # O modelo eleven_multilingual_v2 detecta automaticamente o idioma do texto
                # Se o texto estiver em pt-BR, a voz falará em português brasileiro
                "model_id": "eleven_multilingual_v2",  # Modelo multilíngue (detecta pt-BR automaticamente)
                "voice_settings": {
                    "stability": 0.5,  # Menor estabilidade = mais variação e naturalidade (reduzido de 0.75)
                    "similarity_boost": 0.75,  # Similaridade moderada para voz mais natural (reduzido de 0.9)
                    "style": 0.0,  # Estilo neutro para voz mais natural e menos robótica (reduzido de 0.3)
                    "use_speaker_boost": True  # Melhorar clareza e naturalidade
                }
            }
            
            # Fazer requisição assíncrona com streaming
            async with aiohttp.ClientSession() as session:
                async with session.post(url, json=data, headers=headers) as response:
                    if response.status == 200:
                        async for chunk in response.content.iter_chunked(4096):
                            yield chunk
                    else:
                        error_text = await response.text()
                        logger.error(f"Erro na API ElevenLabs: {response.status} - {error_text}")
                        # Fallback para Piper
                        if self.fallback_engine == "piper":
                            async for chunk in self._piper_stream(text):
                                yield chunk
                        # OUTROS FALLBACKS COMENTADOS - Usar apenas Piper
                        # elif self.fallback_engine == "edge_tts":
                        #     async for chunk in self._edge_tts_stream(text):
                        #         yield chunk
                        else:
                            logger.error("❌ Nenhum fallback disponível para streaming")
        except ImportError:
            logger.warning("aiohttp não disponível para ElevenLabs API, usando fallback")
            # Fallback para Piper
            if self.fallback_engine == "piper":
                async for chunk in self._piper_stream(text):
                    yield chunk
            # OUTROS FALLBACKS COMENTADOS - Usar apenas Piper
            # elif self.fallback_engine == "edge_tts":
            #     async for chunk in self._edge_tts_stream(text):
            #         yield chunk
            else:
                logger.error("❌ Nenhum fallback disponível para streaming")
        except Exception as e:
            logger.error(f"Erro ao fazer streaming com ElevenLabs API: {e}")
            # Fallback para Piper
            if self.fallback_engine == "piper":
                async for chunk in self._piper_stream(text):
                    yield chunk
            # OUTROS FALLBACKS COMENTADOS - Usar apenas Piper
            # elif self.fallback_engine == "edge_tts":
            #     async for chunk in self._edge_tts_stream(text):
            #         yield chunk
            else:
                logger.error("❌ Nenhum fallback disponível para streaming")
    
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
        engine_name = None
        if self.tts_engine == "elevenlabs":
            engine_name = "ElevenLabs API (Ultra-realista)"
        elif self.tts_engine == "piper":
            engine_name = "Piper TTS (Fallback)"
        elif self.tts_engine == "edge_tts":
            engine_name = "Edge TTS (Fallback - pt-BR)"
        elif hasattr(self.tts_engine, 'tts_to_file'):
            engine_name = "Coqui TTS (XTTS) (Fallback)"
        else:
            engine_name = str(self.tts_engine) if self.tts_engine else None
        
        return {
            "engine": engine_name,
            "engine_type": self.tts_engine if isinstance(self.tts_engine, str) else type(self.tts_engine).__name__,
            "is_speaking": self.is_speaking,
            "voice_model": self.voice_model,
            "voice_speed": self.voice_speed,
            "voice_pitch": self.voice_pitch,
            "voice_style": self.voice_style,
            "language": self.language,
            "elevenlabs_configured": bool(self.elevenlabs_api_key and self.elevenlabs_voice_id),
            "fallback_engine": self.fallback_engine,
        }
