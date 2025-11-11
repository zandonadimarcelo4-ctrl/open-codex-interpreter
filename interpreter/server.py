"""
Open Interpreter WebSocket Server
Servidor WebSocket para usar o Open Interpreter de forma programática
"""
import asyncio
import json
import os
import logging
from typing import Dict, Any, Optional
from websockets.server import serve
from websockets.exceptions import ConnectionClosed
import threading

from .interpreter import Interpreter

logger = logging.getLogger(__name__)

class OpenInterpreterServer:
    """
    Servidor WebSocket para Open Interpreter
    Permite comunicação assíncrona com o Interpreter
    """
    
    def __init__(
        self,
        host: str = "localhost",
        port: int = 8000,
        auto_run: bool = True,
        local: bool = True,
        model: Optional[str] = None,
        debug_mode: bool = False,
        use_ollama: bool = True,
        workdir: Optional[str] = None,
    ):
        """
        Inicializa o servidor WebSocket
        
        Args:
            host: Host do servidor
            port: Porta do servidor
            auto_run: Executar código automaticamente (equivalente a -y)
            local: Usar modo local com Ollama (equivalente a --local)
            model: Modelo a usar (padrão: do ambiente)
            debug_mode: Modo debug
            use_ollama: Usar Ollama
            workdir: Diretório de trabalho (sandbox)
        """
        self.host = host
        self.port = port
        self.auto_run = auto_run
        self.local = local
        self.model = model or os.getenv("DEFAULT_MODEL", "deepseek-coder-v2-16b-q4_k_m-rtx")
        self.debug_mode = debug_mode
        self.use_ollama = use_ollama
        self.workdir = workdir
        
        # Criar diretório de trabalho se não existir
        if self.workdir:
            os.makedirs(self.workdir, exist_ok=True)
            # Mudar para o diretório de trabalho
            os.chdir(self.workdir)
            logger.info(f"Diretório de trabalho: {self.workdir}")
        
        # Criar instância do Interpreter
        self.interpreter = Interpreter(
            auto_run=self.auto_run,
            local=self.local,
            model=self.model,
            debug_mode=self.debug_mode,
            use_ollama=self.use_ollama,
        )
        
        logger.info(f"Open Interpreter Server inicializado: {host}:{port}, model={self.model}, auto_run={auto_run}, local={local}, workdir={workdir}")
    
    async def handle_client(self, websocket, path):
        """
        Manipula conexão de cliente WebSocket
        """
        logger.info(f"Cliente conectado: {websocket.remote_address}")
        
        try:
            async for message in websocket:
                try:
                    data = json.loads(message)
                    await self.process_message(websocket, data)
                except json.JSONDecodeError:
                    await websocket.send(json.dumps({
                        "type": "error",
                        "error": "Mensagem JSON inválida"
                    }))
                except Exception as e:
                    logger.error(f"Erro ao processar mensagem: {e}")
                    await websocket.send(json.dumps({
                        "type": "error",
                        "error": str(e)
                    }))
        except ConnectionClosed:
            logger.info(f"Cliente desconectado: {websocket.remote_address}")
        except Exception as e:
            logger.error(f"Erro na conexão: {e}")
    
    async def process_message(self, websocket, data: Dict[str, Any]):
        """
        Processa mensagem do cliente
        
        O AutoGen envia comandos aqui, e o Open Interpreter pensa e executa localmente.
        """
        message_type = data.get("type", "message")
        
        if message_type == "chat" or message_type == "prompt":
            # Enviar mensagem/prompt para o Interpreter
            # O Open Interpreter vai pensar e executar localmente usando seu modelo interno
            user_message = data.get("message") or data.get("prompt", "")
            temperature = data.get("temperature", self.interpreter.temperature)
            max_tokens = data.get("max_tokens")
            workdir = data.get("workdir") or self.workdir  # Usar workdir da mensagem ou do servidor
            
            # Enviar confirmação
            await websocket.send(json.dumps({
                "type": "status",
                "status": "processing",
                "message": f"Open Interpreter pensando e executando: {user_message[:50]}...",
                "model": self.model,
            }))
            
            # Processar mensagem (em thread separada para não bloquear)
            # O Open Interpreter usa seu modelo interno para pensar e executar
            loop = asyncio.get_event_loop()
            result = await loop.run_in_executor(
                None,
                self._process_chat,
                user_message,
                temperature,
                workdir
            )
            
            # Enviar resultado completo (resposta + output)
            await websocket.send(json.dumps({
                "type": "response",
                "response": result.get("response", ""),
                "output": result.get("output", ""),
                "code_executed": result.get("code_executed", ""),
                "success": result.get("success", True),
                "error": result.get("error"),
                "messages": result.get("messages", []),
            }))
            
            # Enviar sinal de conclusão
            await websocket.send(json.dumps({
                "type": "done",
                "status": "completed",
            }))
        
        elif message_type == "execute_code":
            # Executar código diretamente
            code = data.get("code", "")
            language = data.get("language", "python")
            
            await websocket.send(json.dumps({
                "type": "status",
                "status": "executing",
                "message": f"Executando código {language}..."
            }))
            
            loop = asyncio.get_event_loop()
            result = await loop.run_in_executor(
                None,
                self._execute_code,
                code,
                language
            )
            
            await websocket.send(json.dumps({
                "type": "code_result",
                "success": result.get("success", False),
                "output": result.get("output", ""),
                "error": result.get("error"),
            }))
        
        elif message_type == "reset":
            # Resetar estado do Interpreter
            self.interpreter.reset()
            await websocket.send(json.dumps({
                "type": "status",
                "status": "reset",
                "message": "Estado resetado"
            }))
        
        elif message_type == "get_model":
            # Retornar modelo atual
            await websocket.send(json.dumps({
                "type": "model_info",
                "model": self.interpreter.model,
                "use_ollama": self.interpreter.use_ollama,
                "local": self.interpreter.local,
            }))
        
        elif message_type == "set_model":
            # Alterar modelo (reinicializar interpreter)
            new_model = data.get("model")
            if new_model:
                self.model = new_model
                self.interpreter = Interpreter(
                    auto_run=self.auto_run,
                    local=self.local,
                    model=self.model,
                    debug_mode=self.debug_mode,
                    use_ollama=self.use_ollama,
                )
                await websocket.send(json.dumps({
                    "type": "status",
                    "status": "model_changed",
                    "model": self.model,
                }))
        
        else:
            await websocket.send(json.dumps({
                "type": "error",
                "error": f"Tipo de mensagem desconhecido: {message_type}"
            }))
    
    def _process_chat(self, message: str, temperature: float = None, sandbox: str = None) -> Dict[str, Any]:
        """
        Processa mensagem de chat (executado em thread separada)
        O Open Interpreter pensa localmente e executa código
        
        Args:
            message: Mensagem/prompt do AutoGen
            temperature: Temperatura para o modelo (opcional)
            sandbox: Diretório de execução (opcional)
        """
        import os
        original_cwd = os.getcwd()
        
        try:
            # Mudar para sandbox se especificado
            if sandbox and os.path.exists(sandbox):
                os.chdir(sandbox)
                logger.info(f"Executando em sandbox: {sandbox}")
            
            # Ajustar temperatura se fornecida
            if temperature is not None:
                self.interpreter.temperature = temperature
            
            # Executar chat - Open Interpreter pensa e executa localmente
            # Ele vai interpretar a mensagem, gerar código, executar e retornar resultado
            self.interpreter.chat(message, return_messages=False)
            
            # Extrair resposta e código executado
            response = ""
            output = ""
            code_executed = ""
            
            if self.interpreter.messages:
                # Pegar última mensagem do assistant (resposta pensada)
                for msg in reversed(self.interpreter.messages):
                    if msg.get("role") == "assistant" and msg.get("content"):
                        response = msg.get("content", "")
                        break
                
                # Pegar código executado e output
                for msg in reversed(self.interpreter.messages):
                    if msg.get("role") == "function" and msg.get("name") == "run_code":
                        output = msg.get("content", "")
                        # Tentar extrair código executado
                        if "function_call" in msg:
                            parsed_args = msg.get("function_call", {}).get("parsed_arguments", {})
                            if parsed_args:
                                code_executed = parsed_args.get("code", "")
                        break
            
            return {
                "success": True,
                "response": response,  # Resposta pensada do Open Interpreter
                "output": output,  # Output da execução
                "code_executed": code_executed,  # Código que foi executado
                "messages": self.interpreter.messages,
            }
        except Exception as e:
            logger.error(f"Erro ao processar chat: {e}")
            return {
                "success": False,
                "response": "",
                "output": "",
                "code_executed": "",
                "messages": [],
                "error": str(e),
            }
        finally:
            # Voltar para diretório original
            os.chdir(original_cwd)
    
    def _execute_code(self, code: str, language: str) -> Dict[str, Any]:
        """
        Executa código diretamente (executado em thread separada)
        """
        try:
            # Criar mensagem para executar código
            message = f"Execute o seguinte código {language}:\n\n```{language}\n{code}\n```"
            
            # Executar
            self.interpreter.chat(message, return_messages=False)
            
            # Extrair output
            output = ""
            if self.interpreter.messages:
                for msg in reversed(self.interpreter.messages):
                    if msg.get("role") == "function" and msg.get("name") == "run_code":
                        output = msg.get("content", "")
                        break
            
            return {
                "success": True,
                "output": output,
            }
        except Exception as e:
            logger.error(f"Erro ao executar código: {e}")
            return {
                "success": False,
                "error": str(e),
            }
    
    async def start(self):
        """
        Inicia o servidor WebSocket
        """
        async with serve(self.handle_client, self.host, self.port):
            logger.info(f"Servidor WebSocket rodando em ws://{self.host}:{self.port}")
            await asyncio.Future()  # Rodar indefinidamente
    
    def run(self):
        """
        Executa o servidor (blocking)
        """
        asyncio.run(self.start())


def main():
    """
    Função principal para executar o servidor
    Modo: interpreter --server ou interpreter-server
    """
    import argparse
    
    parser = argparse.ArgumentParser(
        description="Open Interpreter WebSocket Server - Modo Agente para AutoGen",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Exemplos:
  interpreter --server --port 4000
  interpreter --server --model deepseek-coder-v2-16b-q4_k_m-rtx --port 4000
  interpreter --server --auto-run --local --port 4000

O servidor aceita comandos do AutoGen via WebSocket e o Open Interpreter
pensa e executa localmente usando o modelo especificado.
        """
    )
    parser.add_argument("--host", default="localhost", help="Host do servidor (default: localhost)")
    parser.add_argument("--port", type=int, default=4000, help="Porta do servidor (default: 4000)")
    parser.add_argument("--auto-run", action="store_true", default=True, help="Executar código automaticamente (-y, default: True)")
    parser.add_argument("--local", action="store_true", default=True, help="Usar modo local com Ollama (--local, default: True)")
    parser.add_argument("--model", help="Modelo a usar (default: do ambiente ou deepseek-coder-v2-16b-q4_k_m-rtx)")
    parser.add_argument("--debug", action="store_true", help="Modo debug")
    parser.add_argument("--allow-remote", action="store_true", help="Permitir conexões remotas (não recomendado)")
    parser.add_argument("--workdir", help="Diretório de trabalho (sandbox)")
    parser.add_argument("--ws", action="store_true", help="Alias para --server (modo WebSocket)")
    
    args = parser.parse_args()
    
    # Validar host
    if not args.allow_remote and args.host != "localhost" and args.host != "127.0.0.1":
        logger.warning("⚠️  Servidor configurado para aceitar conexões remotas. Use --allow-remote explicitamente se isso for intencional.")
    
    server = OpenInterpreterServer(
        host=args.host if args.allow_remote else "localhost",
        port=args.port,
        auto_run=args.auto_run,
        local=args.local,
        model=args.model,
        debug_mode=args.debug,
        use_ollama=True,
        workdir=args.workdir,
    )
    
    logger.info("=" * 60)
    logger.info("🚀 Open Interpreter WebSocket Server")
    logger.info("=" * 60)
    logger.info(f"📍 Endpoint: ws://{server.host}:{server.port}")
    logger.info(f"🤖 Modelo: {server.model}")
    logger.info(f"🔄 Auto-run: {server.auto_run}")
    logger.info(f"🏠 Local: {server.local}")
    logger.info("=" * 60)
    logger.info("✅ Servidor pronto para receber comandos do AutoGen")
    logger.info("=" * 60)
    
    server.run()


if __name__ == "__main__":
    main()

