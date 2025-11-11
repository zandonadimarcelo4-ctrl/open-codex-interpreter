"""
Cliente WebSocket para Open Interpreter Server
"""
import asyncio
import json
import logging
from typing import Dict, Any, Optional
import websockets
from websockets.exceptions import ConnectionClosed

logger = logging.getLogger(__name__)


class OpenInterpreterClient:
    """
    Cliente WebSocket para se comunicar com o Open Interpreter Server
    """
    
    def __init__(self, uri: str = "ws://localhost:8000"):
        """
        Inicializa o cliente
        
        Args:
            uri: URI do servidor WebSocket
        """
        self.uri = uri
        self.websocket = None
    
    async def connect(self):
        """Conecta ao servidor"""
        try:
            self.websocket = await websockets.connect(self.uri)
            logger.info(f"Conectado ao servidor: {self.uri}")
            return True
        except Exception as e:
            logger.error(f"Erro ao conectar: {e}")
            return False
    
    async def disconnect(self):
        """Desconecta do servidor"""
        if self.websocket:
            await self.websocket.close()
            self.websocket = None
    
    async def chat(self, message: str) -> Dict[str, Any]:
        """
        Envia mensagem de chat para o Interpreter
        
        Args:
            message: Mensagem a enviar
        
        Returns:
            Resposta do Interpreter
        """
        if not self.websocket:
            await self.connect()
        
        # Enviar mensagem
        await self.websocket.send(json.dumps({
            "type": "chat",
            "message": message,
        }))
        
        # Receber resposta
        response = await self.websocket.recv()
        return json.loads(response)
    
    async def execute_code(self, code: str, language: str = "python") -> Dict[str, Any]:
        """
        Executa código diretamente
        
        Args:
            code: Código a executar
            language: Linguagem do código
        
        Returns:
            Resultado da execução
        """
        if not self.websocket:
            await self.connect()
        
        # Enviar comando
        await self.websocket.send(json.dumps({
            "type": "execute_code",
            "code": code,
            "language": language,
        }))
        
        # Receber resposta
        response = await self.websocket.recv()
        return json.loads(response)
    
    async def reset(self):
        """Reseta o estado do Interpreter"""
        if not self.websocket:
            await self.connect()
        
        await self.websocket.send(json.dumps({
            "type": "reset",
        }))
        
        response = await self.websocket.recv()
        return json.loads(response)
    
    async def get_model(self) -> Dict[str, Any]:
        """Obtém informações do modelo atual"""
        if not self.websocket:
            await self.connect()
        
        await self.websocket.send(json.dumps({
            "type": "get_model",
        }))
        
        response = await self.websocket.recv()
        return json.loads(response)
    
    async def set_model(self, model: str) -> Dict[str, Any]:
        """Define o modelo a usar"""
        if not self.websocket:
            await self.connect()
        
        await self.websocket.send(json.dumps({
            "type": "set_model",
            "model": model,
        }))
        
        response = await self.websocket.recv()
        return json.loads(response)


async def main():
    """Exemplo de uso do cliente"""
    client = OpenInterpreterClient()
    
    try:
        await client.connect()
        
        # Testar chat
        response = await client.chat("Olá, como você está?")
        print("Resposta:", response)
        
        # Executar código
        result = await client.execute_code("print('Hello, World!')", "python")
        print("Resultado:", result)
        
    finally:
        await client.disconnect()


if __name__ == "__main__":
    asyncio.run(main())

