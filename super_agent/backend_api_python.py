"""
🚀 Backend Python - API REST + WebSocket (Simplificado para Iniciantes)

Este backend Python:
- ✅ API REST simples (FastAPI)
- ✅ WebSocket para chat em tempo real
- ✅ AutoGen Commander (comanda tudo)
- ✅ After Effects MCP Vision (opcional)
- ✅ Código bem comentado em português

Este backend funciona com:
1. Frontend Streamlit Simples (Python) - via API REST
2. Frontend React Estilo Apple (TypeScript) - via WebSocket

COMO USAR:
1. Execute: python backend_api_python.py
2. API: http://localhost:8000
3. WebSocket: ws://localhost:8000/ws

TODAS AS FUNCIONALIDADES ESTÃO AQUI:
- ✅ AutoGen (comanda tudo)
- ✅ Open Interpreter (execução de código)
- ✅ Selenium (navegação web)
- ✅ PyAutoGUI/UFO (automação GUI)
- ✅ After Effects MCP Vision (edição de vídeo) - opcional
"""

import os
import json
import logging
import asyncio
from pathlib import Path
from typing import Optional, Dict, Any, List
from datetime import datetime

# FastAPI para API REST
try:
    from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
    from fastapi.middleware.cors import CORSMiddleware
    from fastapi.responses import JSONResponse
    import uvicorn
    FASTAPI_AVAILABLE = True
except ImportError:
    FASTAPI_AVAILABLE = False
    print("⚠️ FastAPI não está instalado. Instale com: pip install fastapi uvicorn")

# AutoGen Commander
try:
    from .core.simple_commander import create_simple_commander
    from autogen_agentchat.teams import RoundRobinGroupChat
    AUTOGEN_AVAILABLE = True
except ImportError:
    AUTOGEN_AVAILABLE = False
    print("⚠️ AutoGen não está disponível. Instale com: pip install autogen-agentchat autogen-ext[openai] autogen-ext[ollama]")

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Variáveis de ambiente
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
DEFAULT_MODEL = os.getenv("DEFAULT_MODEL", "qwen2.5:7b")
EXECUTOR_MODEL = os.getenv("EXECUTOR_MODEL", "qwen2.5-coder:7b")
WORKSPACE_PATH = os.getenv("WORKSPACE_PATH", str(Path.cwd() / "workspace"))

# Criar workspace se não existir
workspace = Path(WORKSPACE_PATH)
workspace.mkdir(parents=True, exist_ok=True)
logger.info(f"📁 Workspace: {workspace}")


class SuperAgentBackend:
    """
    Backend Super Agent - Versão Simplificada para Iniciantes
    
    Esta classe faz TUDO:
    1. Inicializa o AutoGen Commander (chefe inteligente)
    2. Detecta a intenção da mensagem (conversa ou ação)
    3. Processa a mensagem (usando AutoGen ou Ollama)
    4. Gerencia conexões WebSocket (chat em tempo real)
    """
    
    def __init__(self):
        """Inicializar backend"""
        self.commander = None
        self.team = None
        self.websocket_connections: Dict[str, WebSocket] = {}
        
        # Inicializar AutoGen Commander
        if AUTOGEN_AVAILABLE:
            try:
                logger.info("🚀 Inicializando AutoGen Commander...")
                self.commander = create_simple_commander(
                    model=DEFAULT_MODEL,
                    api_base=OLLAMA_BASE_URL,
                    use_autonomous_agent=True,  # Open Interpreter integrado diretamente
                    workdir=str(workspace),
                    executor_model=EXECUTOR_MODEL,
                )
                
                # Criar team com comandante
                self.team = RoundRobinGroupChat(agents=[self.commander])
                logger.info("✅ AutoGen Commander inicializado com sucesso")
            except Exception as e:
                logger.error(f"❌ Erro ao inicializar AutoGen Commander: {e}")
    
    def detect_intent_simple(self, message: str) -> Dict[str, Any]:
        """
        Detectar intenção da mensagem (conversa ou ação)
        
        Args:
            message: Mensagem do usuário
        
        Returns:
            Intenção detectada
        """
        message_lower = message.lower().strip()
        
        # Palavras-chave de ação
        action_keywords = [
            "executa", "cria", "edita", "abre", "pesquisa", "navega",
            "clica", "digita", "screenshot", "tira foto", "busca",
            "instala", "desinstala", "executa código", "roda código",
            "renderiza", "cria vídeo", "adiciona camada",  # After Effects
        ]
        
        # Palavras-chave de conversa
        conversation_keywords = [
            "oi", "olá", "tudo bem", "como você está", "qual é",
            "o que é", "explique", "me diga", "me fale", "obrigado"
        ]
        
        # Verificar palavras-chave de ação
        for keyword in action_keywords:
            if message_lower.startswith(keyword) or keyword in message_lower:
                return {
                    "type": "action",
                    "confidence": 0.8,
                    "reason": f"Palavra-chave detectada: {keyword}"
                }
        
        # Verificar palavras-chave de conversa
        for keyword in conversation_keywords:
            if message_lower.startswith(keyword) or keyword in message_lower:
                return {
                    "type": "conversation",
                    "confidence": 0.8,
                    "reason": f"Palavra-chave detectada: {keyword}"
                }
        
        # Padrão: assumir que é conversa
        return {
            "type": "conversation",
            "confidence": 0.5,
            "reason": "Padrão: assumido como conversa"
        }
    
    async def process_message(self, message: str, context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Processar mensagem do usuário
        
        Args:
            message: Mensagem do usuário
            context: Contexto adicional (opcional)
        
        Returns:
            Resposta processada
        """
        if not message or not message.strip():
            return {
                "success": False,
                "error": "Mensagem vazia"
            }
        
        logger.info(f"📨 Mensagem recebida: {message[:50]}...")
        
        try:
            # Detectar intenção
            intent = self.detect_intent_simple(message)
            logger.info(f"🎯 Intenção detectada: {intent['type']} (confiança: {intent['confidence']:.2f})")
            
            # Processar mensagem baseado na intenção
            if intent["type"] == "action" and self.team:
                # Ação: usar AutoGen Commander
                logger.info("🚀 Processando como ação (AutoGen Commander)...")
                
                try:
                    # Executar tarefa usando AutoGen
                    result = await self.team.run(task=message)
                    
                    # Extrair resposta
                    if result and len(result.messages) > 0:
                        last_message = result.messages[-1]
                        response_text = last_message.content if hasattr(last_message, 'content') else str(last_message)
                    else:
                        response_text = "✅ Tarefa executada com sucesso!"
                    
                    logger.info(f"✅ Resposta gerada: {response_text[:50]}...")
                    
                    return {
                        "success": True,
                        "response": response_text,
                        "intent": intent,
                        "timestamp": datetime.now().isoformat()
                    }
                    
                except Exception as e:
                    logger.error(f"❌ Erro ao executar tarefa: {e}")
                    return {
                        "success": False,
                        "error": str(e),
                        "intent": intent
                    }
            
            else:
                # Conversa: usar Ollama diretamente (mais rápido)
                logger.info("💬 Processando como conversa (Ollama direto)...")
                
                try:
                    import requests
                    
                    # Chamar Ollama diretamente
                    response_ollama = requests.post(
                        f"{OLLAMA_BASE_URL}/api/generate",
                        json={
                            "model": DEFAULT_MODEL,
                            "prompt": message,
                            "stream": False,
                        },
                        timeout=60
                    )
                    
                    if response_ollama.status_code == 200:
                        data = response_ollama.json()
                        response_text = data.get("response", "Desculpe, não consegui gerar uma resposta.")
                    else:
                        response_text = f"❌ Erro ao chamar Ollama: {response_ollama.status_code}"
                    
                    logger.info(f"✅ Resposta gerada: {response_text[:50]}...")
                    
                    return {
                        "success": True,
                        "response": response_text,
                        "intent": intent,
                        "timestamp": datetime.now().isoformat()
                    }
                    
                except Exception as e:
                    logger.error(f"❌ Erro ao processar conversa: {e}")
                    return {
                        "success": False,
                        "error": str(e),
                        "intent": intent
                    }
            
        except Exception as e:
            logger.error(f"❌ Erro ao processar mensagem: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def handle_websocket(self, websocket: WebSocket, client_id: str):
        """
        Lidar com conexão WebSocket (chat em tempo real)
        
        Args:
            websocket: Conexão WebSocket
            client_id: ID do cliente
        """
        await websocket.accept()
        self.websocket_connections[client_id] = websocket
        logger.info(f"✅ Cliente {client_id} conectado via WebSocket")
        
        # Enviar mensagem de boas-vindas
        await websocket.send_json({
            "type": "system",
            "message": "Bem-vindo ao Super Agent. Como posso ajudá-lo?",
            "timestamp": datetime.now().isoformat()
        })
        
        try:
            while True:
                # Receber mensagem
                data = await websocket.receive_json()
                message_type = data.get("type", "text")
                message = data.get("message", "") or data.get("content", "")
                
                # Enviar confirmação
                await websocket.send_json({
                    "type": "status",
                    "message": "Processando...",
                    "timestamp": datetime.now().isoformat()
                })
                
                # Processar mensagem
                result = await self.process_message(message, data.get("context"))
                
                # Enviar resposta
                if result["success"]:
                    await websocket.send_json({
                        "type": "assistant",
                        "message": result["response"],
                        "intent": result.get("intent"),
                        "timestamp": result.get("timestamp")
                    })
                else:
                    await websocket.send_json({
                        "type": "error",
                        "message": result.get("error", "Erro desconhecido"),
                        "timestamp": datetime.now().isoformat()
                    })
                    
        except WebSocketDisconnect:
            logger.info(f"❌ Cliente {client_id} desconectado")
            self.websocket_connections.pop(client_id, None)
        except Exception as e:
            logger.error(f"❌ Erro no WebSocket: {e}")
            self.websocket_connections.pop(client_id, None)


# Criar aplicação FastAPI
if FASTAPI_AVAILABLE:
    app = FastAPI(
        title="Super Agent - Backend Python",
        description="Backend Python simplificado para Super Agent",
        version="1.0.0"
    )
    
    # Configurar CORS (permitir acesso de qualquer origem)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],  # Permitir qualquer origem (desenvolvimento)
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    # Criar instância do backend
    backend = SuperAgentBackend()
    
    @app.get("/")
    async def root():
        """Rota raiz"""
        return {
            "message": "Super Agent - Backend Python",
            "version": "1.0.0",
            "status": "running",
            "autogen_available": AUTOGEN_AVAILABLE,
            "endpoints": {
                "api": "/api/chat",
                "websocket": "/ws/{client_id}",
                "health": "/health",
                "tools": "/api/tools"
            }
        }
    
    @app.get("/health")
    async def health():
        """Health check"""
        return {
            "status": "healthy",
            "timestamp": datetime.now().isoformat()
        }
    
    @app.post("/api/chat")
    async def chat(message: dict):
        """
        Endpoint de chat (API REST)
        
        Body:
            {
                "message": "Sua mensagem aqui",
                "context": {...}  # Opcional
            }
        """
        try:
            user_message = message.get("message", "")
            context = message.get("context")
            
            if not user_message:
                raise HTTPException(status_code=400, detail="Mensagem vazia")
            
            # Processar mensagem
            result = await backend.process_message(user_message, context)
            
            return JSONResponse(content=result)
            
        except Exception as e:
            logger.error(f"❌ Erro no endpoint /api/chat: {e}")
            raise HTTPException(status_code=500, detail=str(e))
    
    @app.get("/api/tools")
    async def list_tools():
        """Listar ferramentas disponíveis"""
        tools = []
        
        # Ferramentas do AutoGen
        if AUTOGEN_AVAILABLE:
            tools.append({
                "name": "autogen",
                "description": "AutoGen Commander (comanda tudo)",
                "available": True
            })
            tools.append({
                "name": "open_interpreter",
                "description": "Open Interpreter (execução de código)",
                "available": True
            })
            tools.append({
                "name": "web_browsing",
                "description": "Web Browsing (Selenium)",
                "available": True
            })
            tools.append({
                "name": "gui_automation",
                "description": "GUI Automation (PyAutoGUI/UFO)",
                "available": True
            })
        
        return {"tools": tools}
    
    @app.websocket("/ws/{client_id}")
    async def websocket_endpoint(websocket: WebSocket, client_id: str):
        """Endpoint WebSocket para chat em tempo real"""
        await backend.handle_websocket(websocket, client_id)
    
    def run(host: str = "0.0.0.0", port: int = 8000):
        """
        Executar servidor
        
        Args:
            host: Endereço do servidor (padrão: 0.0.0.0)
            port: Porta do servidor (padrão: 8000)
        """
        if not FASTAPI_AVAILABLE:
            logger.error("❌ FastAPI não está instalado. Instale com: pip install fastapi uvicorn")
            return
        
        logger.info("🚀 Iniciando Super Agent Backend...")
        logger.info(f"📡 Servidor: {host}:{port}")
        logger.info(f"🌐 API: http://localhost:{port}")
        logger.info(f"🔌 WebSocket: ws://localhost:{port}/ws")
        
        # Executar servidor
        uvicorn.run(app, host=host, port=port)


def main():
    """Função principal"""
    if not FASTAPI_AVAILABLE:
        print("❌ FastAPI não está instalado. Instale com: pip install fastapi uvicorn")
        return
    
    # Executar servidor
    run(
        host="0.0.0.0",
        port=8000
    )


if __name__ == "__main__":
    main()

