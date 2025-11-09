"""
Real-time Chat - Chat em Tempo Real com Voz
Sistema de chat estilo Jarvis com voz realista
"""
from __future__ import annotations

import asyncio
import logging
from typing import Optional, AsyncGenerator, Dict, Any
from datetime import datetime

from fastapi import WebSocket, WebSocketDisconnect
from ..voice.jarvis_voice import JarvisVoiceSystem
from ..voice.speech_to_text import SpeechToText
from ..core.autogen_framework import SuperAgentFramework

logger = logging.getLogger(__name__)


class RealTimeChat:
    """
    Chat em tempo real com voz estilo Jarvis
    Sistema completo de chat com TTS e STT
    """
    
    def __init__(
        self,
        framework: SuperAgentFramework,
        voice_enabled: bool = True,
        stt_enabled: bool = True
    ):
        self.framework = framework
        self.voice_enabled = voice_enabled
        self.stt_enabled = stt_enabled
        
        # Sistema de voz
        self.voice_system: Optional[JarvisVoiceSystem] = None
        if voice_enabled:
            try:
                self.voice_system = JarvisVoiceSystem(
                    voice_model="jarvis",
                    voice_speed=1.0,
                    voice_pitch=0.0,
                    voice_style="professional"
                )
                logger.info("Sistema de voz Jarvis inicializado")
            except Exception as e:
                logger.warning(f"Falha ao inicializar voz: {e}")
        
        # Sistema de STT
        self.stt_system: Optional[SpeechToText] = None
        if stt_enabled:
            try:
                self.stt_system = SpeechToText(model="whisper")
                logger.info("Sistema de STT inicializado")
            except Exception as e:
                logger.warning(f"Falha ao inicializar STT: {e}")
        
        # Conexões WebSocket
        self.connections: Dict[str, WebSocket] = {}
        self.chat_history: list[Dict[str, Any]] = []
    
    async def handle_websocket(self, websocket: WebSocket, client_id: str):
        """
        Lidar com conexão WebSocket
        
        Args:
            websocket: Conexão WebSocket
            client_id: ID do cliente
        """
        await websocket.accept()
        self.connections[client_id] = websocket
        
        logger.info(f"Cliente {client_id} conectado")
        
        # Enviar mensagem de boas-vindas
        welcome_message = {
            "type": "system",
            "message": "Bem-vindo ao Super Agent. Como posso ajudá-lo?",
            "timestamp": datetime.now().isoformat()
        }
        await websocket.send_json(welcome_message)
        
        # Falar mensagem de boas-vindas
        if self.voice_system:
            await self.voice_system.speak(welcome_message["message"])
        
        try:
            while True:
                # Receber mensagem
                data = await websocket.receive_json()
                
                # Processar mensagem
                await self._process_message(websocket, client_id, data)
        
        except WebSocketDisconnect:
            logger.info(f"Cliente {client_id} desconectado")
            del self.connections[client_id]
        except Exception as e:
            logger.error(f"Erro ao lidar com WebSocket: {e}")
            del self.connections[client_id]
    
    async def _process_message(
        self,
        websocket: WebSocket,
        client_id: str,
        data: Dict[str, Any]
    ):
        """
        Processar mensagem recebida
        
        Args:
            websocket: Conexão WebSocket
            client_id: ID do cliente
            data: Dados da mensagem
        """
        message_type = data.get("type")
        
        if message_type == "text":
            # Mensagem de texto
            text = data.get("message", "")
            await self._handle_text_message(websocket, client_id, text)
        
        elif message_type == "audio":
            # Mensagem de áudio
            audio_data = data.get("audio")
            await self._handle_audio_message(websocket, client_id, audio_data)
        
        elif message_type == "command":
            # Comando especial
            command = data.get("command")
            await self._handle_command(websocket, client_id, command)
    
    async def _handle_text_message(
        self,
        websocket: WebSocket,
        client_id: str,
        text: str
    ):
        """Lidar com mensagem de texto"""
        # Adicionar ao histórico
        self.chat_history.append({
            "type": "user",
            "message": text,
            "timestamp": datetime.now().isoformat()
        })
        
        # Enviar confirmação
        await websocket.send_json({
            "type": "status",
            "message": "Processando...",
            "timestamp": datetime.now().isoformat()
        })
        
        # Processar com framework
        result = await self.framework.execute(text)
        
        # Resposta do agente
        response = result.get("result", {}).get("summary", "Tarefa concluída")
        
        # Adicionar ao histórico
        self.chat_history.append({
            "type": "assistant",
            "message": response,
            "timestamp": datetime.now().isoformat()
        })
        
        # Enviar resposta
        await websocket.send_json({
            "type": "assistant",
            "message": response,
            "timestamp": datetime.now().isoformat()
        })
        
        # Falar resposta
        if self.voice_system:
            await self.voice_system.speak(response)
    
    async def _handle_audio_message(
        self,
        websocket: WebSocket,
        client_id: str,
        audio_data: bytes
    ):
        """Lidar com mensagem de áudio"""
        if not self.stt_system:
            await websocket.send_json({
                "type": "error",
                "message": "STT não disponível",
                "timestamp": datetime.now().isoformat()
            })
            return
        
        # Converter áudio em texto
        text = await self.stt_system.listen()
        
        if text:
            # Processar como mensagem de texto
            await self._handle_text_message(websocket, client_id, text)
        else:
            await websocket.send_json({
                "type": "error",
                "message": "Não foi possível reconhecer o áudio",
                "timestamp": datetime.now().isoformat()
            })
    
    async def _handle_command(
        self,
        websocket: WebSocket,
        client_id: str,
        command: str
    ):
        """Lidar com comando especial"""
        if command == "stop_voice":
            if self.voice_system:
                self.voice_system.stop()
        
        elif command == "stop_listening":
            if self.stt_system:
                self.stt_system.stop()
        
        elif command == "get_history":
            await websocket.send_json({
                "type": "history",
                "messages": self.chat_history[-10:],  # Últimas 10 mensagens
                "timestamp": datetime.now().isoformat()
            })
        
        elif command == "get_status":
            status = {
                "voice": self.voice_system.get_status() if self.voice_system else None,
                "stt": self.stt_system.get_status() if self.stt_system else None,
                "framework": self.framework.get_status(),
            }
            await websocket.send_json({
                "type": "status",
                "data": status,
                "timestamp": datetime.now().isoformat()
            })
    
    async def broadcast(self, message: Dict[str, Any]):
        """Transmitir mensagem para todos os clientes"""
        for client_id, websocket in self.connections.items():
            try:
                await websocket.send_json(message)
            except Exception as e:
                logger.error(f"Erro ao transmitir para {client_id}: {e}")
    
    def get_status(self) -> Dict[str, Any]:
        """Obter status do chat"""
        return {
            "connections": len(self.connections),
            "voice_enabled": self.voice_enabled and self.voice_system is not None,
            "stt_enabled": self.stt_enabled and self.stt_system is not None,
            "history_count": len(self.chat_history),
        }

