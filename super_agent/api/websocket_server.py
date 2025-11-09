"""
WebSocket Server - Servidor WebSocket para Chat em Tempo Real
Integração com sistema de voz e auto-recompensa
"""
from __future__ import annotations

import asyncio
import logging
from typing import Dict, Any
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import HTMLResponse

from ..chat.realtime_chat import RealTimeChat
from ..core.autogen_framework import SuperAgentFramework
from ..reward.auto_reward import AutoRewardSystem

logger = logging.getLogger(__name__)


class WebSocketServer:
    """
    Servidor WebSocket para chat em tempo real
    Integra voz, STT e auto-recompensa
    """
    
    def __init__(
        self,
        framework: SuperAgentFramework,
        reward_system: AutoRewardSystem,
        voice_enabled: bool = True,
        stt_enabled: bool = True
    ):
        self.framework = framework
        self.reward_system = reward_system
        self.voice_enabled = voice_enabled
        self.stt_enabled = stt_enabled
        
        # Chat em tempo real
        self.chat = RealTimeChat(
            framework=framework,
            voice_enabled=voice_enabled,
            stt_enabled=stt_enabled
        )
        
        # FastAPI app
        self.app = FastAPI(title="Super Agent Chat")
        self._setup_routes()
    
    def _setup_routes(self):
        """Configurar rotas"""
        
        @self.app.get("/")
        async def root():
            return HTMLResponse(content=self._get_html_interface())
        
        @self.app.websocket("/ws/{client_id}")
        async def websocket_endpoint(websocket: WebSocket, client_id: str):
            await self.chat.handle_websocket(websocket, client_id)
        
        @self.app.get("/status")
        async def get_status():
            return {
                "chat": self.chat.get_status(),
                "framework": self.framework.get_status(),
                "reward": self.reward_system.get_statistics(),
            }
    
    def _get_html_interface(self) -> str:
        """Obter interface HTML para chat"""
        return """
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Super Agent - Chat Jarvis</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', sans-serif;
            background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
            color: #ffffff;
            height: 100vh;
            display: flex;
            flex-direction: column;
            overflow: hidden;
        }
        
        .header {
            background: rgba(0, 0, 0, 0.5);
            backdrop-filter: blur(20px);
            padding: 20px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .header h1 {
            font-size: 24px;
            font-weight: 600;
            letter-spacing: -0.5px;
        }
        
        .chat-container {
            flex: 1;
            display: flex;
            flex-direction: column;
            padding: 20px;
            overflow-y: auto;
        }
        
        .messages {
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: 16px;
            margin-bottom: 20px;
        }
        
        .message {
            display: flex;
            gap: 12px;
            animation: fadeIn 0.3s ease-in;
        }
        
        @keyframes fadeIn {
            from {
                opacity: 0;
                transform: translateY(10px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        .message.user {
            flex-direction: row-reverse;
        }
        
        .message-avatar {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 600;
            font-size: 18px;
        }
        
        .message.user .message-avatar {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        
        .message.assistant .message-avatar {
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
        }
        
        .message-content {
            flex: 1;
            background: rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(10px);
            padding: 16px;
            border-radius: 16px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            line-height: 1.6;
        }
        
        .input-container {
            display: flex;
            gap: 12px;
            padding: 20px;
            background: rgba(0, 0, 0, 0.5);
            backdrop-filter: blur(20px);
            border-top: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .input-field {
            flex: 1;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            padding: 16px;
            color: #ffffff;
            font-size: 16px;
            font-family: inherit;
            outline: none;
            transition: all 0.3s ease;
        }
        
        .input-field:focus {
            border-color: rgba(255, 255, 255, 0.3);
            background: rgba(255, 255, 255, 0.08);
        }
        
        .send-button {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border: none;
            border-radius: 12px;
            padding: 16px 32px;
            color: #ffffff;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .send-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
        }
        
        .voice-button {
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            border: none;
            border-radius: 12px;
            padding: 16px;
            color: #ffffff;
            font-size: 16px;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .voice-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(240, 147, 251, 0.4);
        }
        
        .status {
            padding: 12px 20px;
            background: rgba(0, 0, 0, 0.3);
            border-top: 1px solid rgba(255, 255, 255, 0.1);
            font-size: 14px;
            color: rgba(255, 255, 255, 0.7);
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🤖 Super Agent - Chat Jarvis</h1>
    </div>
    
    <div class="chat-container">
        <div class="messages" id="messages"></div>
    </div>
    
    <div class="input-container">
        <input type="text" class="input-field" id="messageInput" placeholder="Digite sua mensagem ou use o botão de voz..." />
        <button class="voice-button" id="voiceButton">🎤</button>
        <button class="send-button" id="sendButton">Enviar</button>
    </div>
    
    <div class="status" id="status">Conectando...</div>
    
    <script>
        const clientId = 'client_' + Math.random().toString(36).substr(2, 9);
        const ws = new WebSocket(`ws://localhost:8000/ws/${clientId}`);
        const messagesDiv = document.getElementById('messages');
        const messageInput = document.getElementById('messageInput');
        const sendButton = document.getElementById('sendButton');
        const voiceButton = document.getElementById('voiceButton');
        const statusDiv = document.getElementById('status');
        
        let isRecording = false;
        let mediaRecorder = null;
        let audioChunks = [];
        
        ws.onopen = () => {
            statusDiv.textContent = 'Conectado - Pronto para conversar';
        };
        
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            
            if (data.type === 'assistant') {
                addMessage('assistant', data.message);
            } else if (data.type === 'system') {
                addMessage('system', data.message);
            } else if (data.type === 'status') {
                statusDiv.textContent = data.message;
            }
        };
        
        ws.onerror = (error) => {
            statusDiv.textContent = 'Erro na conexão';
        };
        
        ws.onclose = () => {
            statusDiv.textContent = 'Desconectado';
        };
        
        function addMessage(type, message) {
            const messageDiv = document.createElement('div');
            messageDiv.className = `message ${type}`;
            
            const avatar = document.createElement('div');
            avatar.className = 'message-avatar';
            avatar.textContent = type === 'user' ? '👤' : '🤖';
            
            const content = document.createElement('div');
            content.className = 'message-content';
            content.textContent = message;
            
            messageDiv.appendChild(avatar);
            messageDiv.appendChild(content);
            messagesDiv.appendChild(messageDiv);
            
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
        }
        
        sendButton.addEventListener('click', () => {
            const message = messageInput.value.trim();
            if (message) {
                ws.send(JSON.stringify({
                    type: 'text',
                    message: message
                }));
                addMessage('user', message);
                messageInput.value = '';
            }
        });
        
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendButton.click();
            }
        });
        
        voiceButton.addEventListener('click', async () => {
            if (!isRecording) {
                // Iniciar gravação
                try {
                    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                    mediaRecorder = new MediaRecorder(stream);
                    audioChunks = [];
                    
                    mediaRecorder.ondataavailable = (event) => {
                        audioChunks.push(event.data);
                    };
                    
                    mediaRecorder.onstop = () => {
                        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                        const reader = new FileReader();
                        reader.onload = () => {
                            ws.send(JSON.stringify({
                                type: 'audio',
                                audio: reader.result
                            }));
                        };
                        reader.readAsDataURL(audioBlob);
                    };
                    
                    mediaRecorder.start();
                    isRecording = true;
                    voiceButton.textContent = '⏹️';
                    statusDiv.textContent = 'Gravando...';
                } catch (error) {
                    statusDiv.textContent = 'Erro ao acessar microfone';
                }
            } else {
                // Parar gravação
                if (mediaRecorder) {
                    mediaRecorder.stop();
                    mediaRecorder.stream.getTracks().forEach(track => track.stop());
                    isRecording = false;
                    voiceButton.textContent = '🎤';
                    statusDiv.textContent = 'Processando áudio...';
                }
            }
        });
    </script>
</body>
</html>
        """
    
    def run(self, host: str = "0.0.0.0", port: int = 8000):
        """Executar servidor"""
        import uvicorn
        uvicorn.run(self.app, host=host, port=port)

