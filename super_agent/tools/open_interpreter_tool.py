"""
Open Interpreter Tool para AutoGen v2
Tool assíncrona que permite ao AutoGen executar código via Open Interpreter (WebSocket ou direto)
"""
import asyncio
import json
import logging
import os
from typing import Dict, Any, Optional
from pathlib import Path
import sys

logger = logging.getLogger(__name__)

# Adicionar caminho do interpreter
interpreter_path = Path(__file__).parent.parent.parent / "interpreter"
if interpreter_path.exists():
    sys.path.insert(0, str(interpreter_path.parent))

try:
    import websockets
    from websockets.exceptions import ConnectionClosed
    WEBSOCKETS_AVAILABLE = True
except ImportError:
    WEBSOCKETS_AVAILABLE = False
    logger.warning("websockets não disponível. Use: pip install websockets")

try:
    from interpreter.interpreter import Interpreter
    from interpreter.client import OpenInterpreterClient
    OPEN_INTERPRETER_AVAILABLE = True
except ImportError:
    OPEN_INTERPRETER_AVAILABLE = False
    logger.warning("Open Interpreter não disponível")


class OpenInterpreterTool:
    """
    Tool do AutoGen v2 para executar código via Open Interpreter.
    
    Pode usar WebSocket (se servidor estiver rodando) ou instância direta.
    AutoGen comanda quando e como usar essa tool.
    """
    
    def __init__(
        self,
        model: Optional[str] = None,
        use_websocket: bool = False,
        websocket_uri: str = "ws://localhost:8000",
        auto_run: bool = True,
        local: bool = True,
    ):
        """
        Inicializa a tool do Open Interpreter.
        
        Args:
            model: Modelo a usar (padrão: do ambiente ou do AutoGen)
            use_websocket: Se True, usa WebSocket. Se False, usa instância direta
            websocket_uri: URI do servidor WebSocket
            auto_run: Executar código automaticamente
            local: Usar modo local com Ollama
        """
        self.model = model or os.getenv("DEFAULT_MODEL", "deepseek-coder-v2-16b-q4_k_m-rtx")
        self.use_websocket = use_websocket
        self.websocket_uri = websocket_uri
        self.auto_run = auto_run
        self.local = local
        
        # Instância direta (fallback se WebSocket não estiver disponível)
        self.interpreter = None
        self.client = None
        
        if not OPEN_INTERPRETER_AVAILABLE:
            raise ImportError("Open Interpreter não disponível. Instale: pip install . na pasta interpreter")
        
        # Se usar WebSocket, criar cliente
        if use_websocket and WEBSOCKETS_AVAILABLE:
            try:
                self.client = OpenInterpreterClient(uri=websocket_uri)
                logger.info(f"Open Interpreter Tool: usando WebSocket em {websocket_uri}")
            except Exception as e:
                logger.warning(f"Erro ao criar cliente WebSocket: {e}. Usando instância direta.")
                self.use_websocket = False
        
        # Se não usar WebSocket ou se WebSocket falhou, criar instância direta
        if not self.use_websocket:
            try:
                self.interpreter = Interpreter(
                    auto_run=self.auto_run,
                    local=self.local,
                    model=self.model,
                    debug_mode=False,
                    use_ollama=True,
                )
                logger.info(f"Open Interpreter Tool: usando instância direta com modelo {self.model}")
            except Exception as e:
                logger.error(f"Erro ao criar instância do Interpreter: {e}")
                raise
    
    async def execute_code(
        self,
        code: str,
        language: str = "python",
        description: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Executa código via Open Interpreter (assíncrono).
        
        Esta é a função que o AutoGen v2 chama quando decide executar código.
        
        Args:
            code: Código a executar
            language: Linguagem do código (python, shell, etc.)
            description: Descrição opcional do que o código faz
        
        Returns:
            Dict com resultado da execução
        """
        try:
            if self.use_websocket and self.client:
                # Usar WebSocket (assíncrono)
                return await self._execute_via_websocket(code, language)
            else:
                # Usar instância direta (executar em thread para não bloquear)
                return await self._execute_via_interpreter(code, language)
        except Exception as e:
            logger.error(f"Erro ao executar código: {e}")
            return {
                "success": False,
                "error": str(e),
                "output": "",
                "code": code,
                "language": language,
            }
    
    async def _execute_via_websocket(self, code: str, language: str) -> Dict[str, Any]:
        """Executa código via WebSocket - AutoGen envia comando, Open Interpreter pensa e executa"""
        try:
            # Conectar se não estiver conectado
            if not self.client.websocket:
                connected = await self.client.connect()
                if not connected:
                    raise Exception("Falha ao conectar ao servidor WebSocket")
            
            # Enviar prompt em linguagem natural para o Open Interpreter
            # O Open Interpreter vai pensar e executar o código
            prompt = f"Execute o seguinte código {language}:\n\n```{language}\n{code}\n```"
            
            # Enviar via chat (o Open Interpreter pensa e executa)
            result = await self.client.chat(prompt)
            
            return {
                "success": result.get("success", False),
                "output": result.get("output", ""),
                "response": result.get("response", ""),  # Resposta pensada do Open Interpreter
                "error": result.get("error"),
                "code": code,
                "language": language,
            }
        except Exception as e:
            logger.error(f"Erro ao executar via WebSocket: {e}")
            # Fallback para instância direta
            if not self.interpreter:
                self.interpreter = Interpreter(
                    auto_run=self.auto_run,
                    local=self.local,
                    model=self.model,
                    debug_mode=False,
                    use_ollama=True,
                )
            return await self._execute_via_interpreter(code, language)
    
    async def send_command(self, command: str, temperature: float = None, sandbox: str = None) -> Dict[str, Any]:
        """
        Envia comando em linguagem natural para o Open Interpreter via WebSocket.
        O Open Interpreter pensa e executa localmente.
        
        Esta é a função principal que o AutoGen usa para comandar o Open Interpreter.
        
        Args:
            command: Comando em linguagem natural (ex: "Crie um script Python que mostra a data atual")
            temperature: Temperatura para o modelo (opcional)
            sandbox: Diretório de execução (opcional)
        
        Returns:
            Resultado da execução
        """
        try:
            if self.use_websocket and self.client:
                # Conectar se não estiver conectado
                if not self.client.websocket:
                    await self.client.connect()
                
                # Enviar comando via WebSocket
                # O protocolo espera: {"type": "chat" ou "prompt", "message" ou "prompt": command, ...}
                message = {
                    "type": "prompt",  # ou "chat"
                    "prompt": command,  # Comando em linguagem natural
                }
                if temperature is not None:
                    message["temperature"] = temperature
                if sandbox:
                    message["sandbox"] = sandbox
                
                # Enviar mensagem
                await self.client.websocket.send(json.dumps(message))
                
                # Receber resposta (pode vir em múltiplas mensagens)
                response_text = ""
                output = ""
                code_executed = ""
                success = True
                error = None
                
                async for raw_message in self.client.websocket:
                    data = json.loads(raw_message)
                    
                    if data.get("type") == "status":
                        logger.info(f"Status: {data.get('message')}")
                    elif data.get("type") == "response":
                        response_text = data.get("response", "")
                        output = data.get("output", "")
                        code_executed = data.get("code_executed", "")
                        success = data.get("success", True)
                        error = data.get("error")
                    elif data.get("type") == "done":
                        break
                    elif data.get("type") == "error":
                        error = data.get("error", "Erro desconhecido")
                        success = False
                        break
                
                return {
                    "success": success,
                    "response": response_text,  # Resposta pensada do Open Interpreter
                    "output": output,  # Output da execução
                    "code_executed": code_executed,  # Código que foi executado
                    "error": error,
                }
            else:
                # Fallback: usar instância direta
                return await self.chat(command)
        except Exception as e:
            logger.error(f"Erro ao enviar comando: {e}")
            return {
                "success": False,
                "error": str(e),
                "response": "",
                "output": "",
            }
    
    async def _execute_via_interpreter(self, code: str, language: str) -> Dict[str, Any]:
        """Executa código via instância direta (em thread separada)"""
        def _run_code():
            try:
                # Criar mensagem para o Interpreter
                message = f"Execute o seguinte código {language}:\n\n```{language}\n{code}\n```"
                
                # Executar (bloqueante, mas em thread separada)
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
                    "code": code,
                    "language": language,
                }
            except Exception as e:
                return {
                    "success": False,
                    "error": str(e),
                    "output": "",
                    "code": code,
                    "language": language,
                }
        
        # Executar em thread separada para não bloquear
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(None, _run_code)
        return result
    
    async def chat(self, message: str) -> Dict[str, Any]:
        """
        Envia mensagem de chat para o Interpreter (assíncrono).
        
        O AutoGen usa isso para enviar comandos ao Open Interpreter.
        O Open Interpreter pensa e executa localmente usando seu modelo interno.
        
        Args:
            message: Mensagem/prompt a enviar (comando do AutoGen)
        
        Returns:
            Resposta do Interpreter (pensamento + execução local)
        """
        try:
            if self.use_websocket and self.client:
                # Usar WebSocket (modo servidor - Open Interpreter pensa localmente)
                if not self.client.websocket:
                    await self.client.connect()
                
                # Enviar prompt - Open Interpreter vai pensar e executar
                result = await self.client.chat(message)
                
                # Combinar resposta e output
                response = result.get("response", "")
                output = result.get("output", "")
                
                # Se há output, incluir na resposta
                if output:
                    full_response = f"{response}\n\n📊 Output da execução:\n{output}"
                else:
                    full_response = response
                
                return {
                    "success": result.get("success", False),
                    "response": full_response,
                    "output": output,
                    "raw_response": response,
                }
            else:
                # Usar instância direta (Open Interpreter pensa localmente)
                def _run_chat():
                    try:
                        # O Interpreter usa seu modelo interno para pensar e executar
                        self.interpreter.chat(message, return_messages=False)
                        response = ""
                        output = ""
                        if self.interpreter.messages:
                            for msg in reversed(self.interpreter.messages):
                                if msg.get("role") == "assistant" and msg.get("content"):
                                    response = msg.get("content", "")
                                    break
                                if msg.get("role") == "function" and msg.get("name") == "run_code":
                                    output = msg.get("content", "")
                        
                        # Combinar resposta e output
                        if output:
                            full_response = f"{response}\n\n📊 Output da execução:\n{output}"
                        else:
                            full_response = response
                        
                        return {
                            "success": True,
                            "response": full_response,
                            "output": output,
                            "raw_response": response,
                        }
                    except Exception as e:
                        return {
                            "success": False,
                            "error": str(e),
                        }
                
                loop = asyncio.get_event_loop()
                result = await loop.run_in_executor(None, _run_chat)
                return result
        except Exception as e:
            logger.error(f"Erro ao enviar mensagem: {e}")
            return {
                "success": False,
                "error": str(e),
            }
    
    def get_tool_schema(self) -> Dict[str, Any]:
        """
        Retorna o schema da tool para AutoGen v2.
        
        O AutoGen v2 usa esse schema para entender quando e como chamar a tool.
        """
        return {
            "type": "function",
            "function": {
                "name": "execute_code",
                "description": (
                    "Executa código Python, Shell, ou outras linguagens via Open Interpreter. "
                    "Use esta tool quando precisar executar código, scripts, ou comandos no sistema. "
                    "O código será executado automaticamente e o output será retornado."
                ),
                "parameters": {
                    "type": "object",
                    "properties": {
                        "code": {
                            "type": "string",
                            "description": "Código a executar (ex: 'print(\"Hello\")', 'ls -la', etc.)",
                        },
                        "language": {
                            "type": "string",
                            "enum": ["python", "shell", "bash", "javascript", "html"],
                            "description": "Linguagem do código (padrão: python)",
                            "default": "python",
                        },
                        "description": {
                            "type": "string",
                            "description": "Descrição opcional do que o código faz",
                        },
                    },
                    "required": ["code"],
                },
            },
        }
    
    def get_chat_tool_schema(self) -> Dict[str, Any]:
        """
        Retorna o schema da tool de chat para AutoGen v2.
        
        Esta tool permite que o AutoGen envie comandos ao Open Interpreter.
        O Open Interpreter pensa e executa localmente usando seu modelo interno.
        """
        return {
            "type": "function",
            "function": {
                "name": "open_interpreter_agent",
                "description": (
                    "Envia comandos/tarefas ao Open Interpreter que pensa e executa localmente. "
                    "O Open Interpreter usa seu modelo interno (Ollama) para raciocinar, gerar código e executar. "
                    "Use esta tool quando precisar que o Interpreter: "
                    "- Raciocine sobre uma tarefa complexa "
                    "- Gere e execute código automaticamente "
                    "- Corrija erros e tente novamente "
                    "- Execute scripts, comandos shell, etc. "
                    "O AutoGen comanda o QUANDO e o PORQUÊ; o Open Interpreter decide o COMO e executa."
                ),
                "parameters": {
                    "type": "object",
                    "properties": {
                        "command": {
                            "type": "string",
                            "description": (
                                "Comando/tarefa em linguagem natural para o Open Interpreter. "
                                "Exemplos: 'Crie um script Python que soma 5 + 7', "
                                "'Execute ls -la no diretório atual', "
                                "'Analise o arquivo data.csv e gere um relatório'"
                            ),
                        },
                    },
                    "required": ["command"],
                },
            },
        }


# Função helper para criar a tool (usada pelo AutoGen v2)
def create_open_interpreter_tool(
    model: Optional[str] = None,
    use_websocket: bool = False,
    websocket_uri: str = "ws://localhost:8000",
    auto_run: bool = True,
    local: bool = True,
) -> OpenInterpreterTool:
    """
    Cria uma instância da tool do Open Interpreter.
    
    Args:
        model: Modelo a usar (padrão: do ambiente)
        use_websocket: Se True, usa WebSocket
        websocket_uri: URI do servidor WebSocket
        auto_run: Executar código automaticamente
        local: Usar modo local com Ollama
    
    Returns:
        Instância da tool
    """
    return OpenInterpreterTool(
        model=model,
        use_websocket=use_websocket,
        websocket_uri=websocket_uri,
        auto_run=auto_run,
        local=local,
    )


# Funções para AutoGen v2 (wrappers assíncronos)
async def execute_code_tool(
    code: str,
    language: str = "python",
    description: Optional[str] = None,
    tool_instance: Optional[OpenInterpreterTool] = None,
) -> str:
    """
    Wrapper assíncrono para a tool execute_code.
    
    O AutoGen v2 chama esta função quando decide executar código.
    
    Args:
        code: Código a executar
        language: Linguagem do código
        description: Descrição opcional
        tool_instance: Instância da tool (se None, cria nova)
    
    Returns:
        Output do código executado (string)
    """
    if tool_instance is None:
        tool_instance = create_open_interpreter_tool()
    
    result = await tool_instance.execute_code(code, language, description)
    
    if result.get("success"):
        output = result.get("output", "")
        if output:
            return f"✅ Código executado com sucesso:\n{output}"
        else:
            return "✅ Código executado (sem output)"
    else:
        error = result.get("error", "Erro desconhecido")
        return f"❌ Erro ao executar código: {error}"


async def interpreter_chat_tool(
    message: str,
    tool_instance: Optional[OpenInterpreterTool] = None,
) -> str:
    """
    Wrapper assíncrono para a tool interpreter_chat.
    
    O AutoGen v2 chama esta função quando decide conversar com o Interpreter.
    
    Args:
        message: Mensagem a enviar
        tool_instance: Instância da tool (se None, cria nova)
    
    Returns:
        Resposta do Interpreter (string)
    """
    if tool_instance is None:
        tool_instance = create_open_interpreter_tool()
    
    result = await tool_instance.chat(message)
    
    if result.get("success"):
        response = result.get("response", "")
        output = result.get("output", "")
        if output:
            return f"💬 Resposta: {response}\n\n📊 Output:\n{output}"
        else:
            return f"💬 Resposta: {response}"
    else:
        error = result.get("error", "Erro desconhecido")
        return f"❌ Erro: {error}"


Tool assíncrona que permite ao AutoGen executar código via Open Interpreter (WebSocket ou direto)
"""
import asyncio
import json
import logging
import os
from typing import Dict, Any, Optional
from pathlib import Path
import sys

logger = logging.getLogger(__name__)

# Adicionar caminho do interpreter
interpreter_path = Path(__file__).parent.parent.parent / "interpreter"
if interpreter_path.exists():
    sys.path.insert(0, str(interpreter_path.parent))

try:
    import websockets
    from websockets.exceptions import ConnectionClosed
    WEBSOCKETS_AVAILABLE = True
except ImportError:
    WEBSOCKETS_AVAILABLE = False
    logger.warning("websockets não disponível. Use: pip install websockets")

try:
    from interpreter.interpreter import Interpreter
    from interpreter.client import OpenInterpreterClient
    OPEN_INTERPRETER_AVAILABLE = True
except ImportError:
    OPEN_INTERPRETER_AVAILABLE = False
    logger.warning("Open Interpreter não disponível")


class OpenInterpreterTool:
    """
    Tool do AutoGen v2 para executar código via Open Interpreter.
    
    Pode usar WebSocket (se servidor estiver rodando) ou instância direta.
    AutoGen comanda quando e como usar essa tool.
    """
    
    def __init__(
        self,
        model: Optional[str] = None,
        use_websocket: bool = False,
        websocket_uri: str = "ws://localhost:8000",
        auto_run: bool = True,
        local: bool = True,
    ):
        """
        Inicializa a tool do Open Interpreter.
        
        Args:
            model: Modelo a usar (padrão: do ambiente ou do AutoGen)
            use_websocket: Se True, usa WebSocket. Se False, usa instância direta
            websocket_uri: URI do servidor WebSocket
            auto_run: Executar código automaticamente
            local: Usar modo local com Ollama
        """
        self.model = model or os.getenv("DEFAULT_MODEL", "deepseek-coder-v2-16b-q4_k_m-rtx")
        self.use_websocket = use_websocket
        self.websocket_uri = websocket_uri
        self.auto_run = auto_run
        self.local = local
        
        # Instância direta (fallback se WebSocket não estiver disponível)
        self.interpreter = None
        self.client = None
        
        if not OPEN_INTERPRETER_AVAILABLE:
            raise ImportError("Open Interpreter não disponível. Instale: pip install . na pasta interpreter")
        
        # Se usar WebSocket, criar cliente
        if use_websocket and WEBSOCKETS_AVAILABLE:
            try:
                self.client = OpenInterpreterClient(uri=websocket_uri)
                logger.info(f"Open Interpreter Tool: usando WebSocket em {websocket_uri}")
            except Exception as e:
                logger.warning(f"Erro ao criar cliente WebSocket: {e}. Usando instância direta.")
                self.use_websocket = False
        
        # Se não usar WebSocket ou se WebSocket falhou, criar instância direta
        if not self.use_websocket:
            try:
                self.interpreter = Interpreter(
                    auto_run=self.auto_run,
                    local=self.local,
                    model=self.model,
                    debug_mode=False,
                    use_ollama=True,
                )
                logger.info(f"Open Interpreter Tool: usando instância direta com modelo {self.model}")
            except Exception as e:
                logger.error(f"Erro ao criar instância do Interpreter: {e}")
                raise
    
    async def execute_code(
        self,
        code: str,
        language: str = "python",
        description: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Executa código via Open Interpreter (assíncrono).
        
        Esta é a função que o AutoGen v2 chama quando decide executar código.
        
        Args:
            code: Código a executar
            language: Linguagem do código (python, shell, etc.)
            description: Descrição opcional do que o código faz
        
        Returns:
            Dict com resultado da execução
        """
        try:
            if self.use_websocket and self.client:
                # Usar WebSocket (assíncrono)
                return await self._execute_via_websocket(code, language)
            else:
                # Usar instância direta (executar em thread para não bloquear)
                return await self._execute_via_interpreter(code, language)
        except Exception as e:
            logger.error(f"Erro ao executar código: {e}")
            return {
                "success": False,
                "error": str(e),
                "output": "",
                "code": code,
                "language": language,
            }
    
    async def _execute_via_websocket(self, code: str, language: str) -> Dict[str, Any]:
        """Executa código via WebSocket"""
        try:
            # Conectar se não estiver conectado
            if not self.client.websocket:
                await self.client.connect()
            
            # Executar código
            result = await self.client.execute_code(code, language)
            
            return {
                "success": result.get("success", False),
                "output": result.get("output", ""),
                "error": result.get("error"),
                "code": code,
                "language": language,
            }
        except Exception as e:
            logger.error(f"Erro ao executar via WebSocket: {e}")
            # Fallback para instância direta
            if not self.interpreter:
                self.interpreter = Interpreter(
                    auto_run=self.auto_run,
                    local=self.local,
                    model=self.model,
                    debug_mode=False,
                    use_ollama=True,
                )
            return await self._execute_via_interpreter(code, language)
    
    async def _execute_via_interpreter(self, code: str, language: str) -> Dict[str, Any]:
        """Executa código via instância direta (em thread separada)"""
        def _run_code():
            try:
                # Criar mensagem para o Interpreter
                message = f"Execute o seguinte código {language}:\n\n```{language}\n{code}\n```"
                
                # Executar (bloqueante, mas em thread separada)
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
                    "code": code,
                    "language": language,
                }
            except Exception as e:
                return {
                    "success": False,
                    "error": str(e),
                    "output": "",
                    "code": code,
                    "language": language,
                }
        
        # Executar em thread separada para não bloquear
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(None, _run_code)
        return result
    
    async def chat(self, message: str) -> Dict[str, Any]:
        """
        Envia mensagem de chat para o Interpreter (assíncrono).
        
        O AutoGen usa isso para enviar comandos ao Open Interpreter.
        O Open Interpreter pensa e executa localmente usando seu modelo interno.
        
        Args:
            message: Mensagem/prompt a enviar (comando do AutoGen)
        
        Returns:
            Resposta do Interpreter (pensamento + execução local)
        """
        try:
            if self.use_websocket and self.client:
                # Usar WebSocket (modo servidor - Open Interpreter pensa localmente)
                if not self.client.websocket:
                    await self.client.connect()
                
                # Enviar prompt - Open Interpreter vai pensar e executar
                result = await self.client.chat(message)
                
                # Combinar resposta e output
                response = result.get("response", "")
                output = result.get("output", "")
                
                # Se há output, incluir na resposta
                if output:
                    full_response = f"{response}\n\n📊 Output da execução:\n{output}"
                else:
                    full_response = response
                
                return {
                    "success": result.get("success", False),
                    "response": full_response,
                    "output": output,
                    "raw_response": response,
                }
            else:
                # Usar instância direta (Open Interpreter pensa localmente)
                def _run_chat():
                    try:
                        # O Interpreter usa seu modelo interno para pensar e executar
                        self.interpreter.chat(message, return_messages=False)
                        response = ""
                        output = ""
                        if self.interpreter.messages:
                            for msg in reversed(self.interpreter.messages):
                                if msg.get("role") == "assistant" and msg.get("content"):
                                    response = msg.get("content", "")
                                    break
                                if msg.get("role") == "function" and msg.get("name") == "run_code":
                                    output = msg.get("content", "")
                        
                        # Combinar resposta e output
                        if output:
                            full_response = f"{response}\n\n📊 Output da execução:\n{output}"
                        else:
                            full_response = response
                        
                        return {
                            "success": True,
                            "response": full_response,
                            "output": output,
                            "raw_response": response,
                        }
                    except Exception as e:
                        return {
                            "success": False,
                            "error": str(e),
                        }
                
                loop = asyncio.get_event_loop()
                result = await loop.run_in_executor(None, _run_chat)
                return result
        except Exception as e:
            logger.error(f"Erro ao enviar mensagem: {e}")
            return {
                "success": False,
                "error": str(e),
            }
    
    def get_tool_schema(self) -> Dict[str, Any]:
        """
        Retorna o schema da tool para AutoGen v2.
        
        O AutoGen v2 usa esse schema para entender quando e como chamar a tool.
        """
        return {
            "type": "function",
            "function": {
                "name": "execute_code",
                "description": (
                    "Executa código Python, Shell, ou outras linguagens via Open Interpreter. "
                    "Use esta tool quando precisar executar código, scripts, ou comandos no sistema. "
                    "O código será executado automaticamente e o output será retornado."
                ),
                "parameters": {
                    "type": "object",
                    "properties": {
                        "code": {
                            "type": "string",
                            "description": "Código a executar (ex: 'print(\"Hello\")', 'ls -la', etc.)",
                        },
                        "language": {
                            "type": "string",
                            "enum": ["python", "shell", "bash", "javascript", "html"],
                            "description": "Linguagem do código (padrão: python)",
                            "default": "python",
                        },
                        "description": {
                            "type": "string",
                            "description": "Descrição opcional do que o código faz",
                        },
                    },
                    "required": ["code"],
                },
            },
        }
    
    def get_chat_tool_schema(self) -> Dict[str, Any]:
        """
        Retorna o schema da tool de chat para AutoGen v2.
        
        Esta tool permite que o AutoGen envie comandos ao Open Interpreter.
        O Open Interpreter pensa e executa localmente usando seu modelo interno.
        """
        return {
            "type": "function",
            "function": {
                "name": "open_interpreter_agent",
                "description": (
                    "Envia comandos/tarefas ao Open Interpreter que pensa e executa localmente. "
                    "O Open Interpreter usa seu modelo interno (Ollama) para raciocinar, gerar código e executar. "
                    "Use esta tool quando precisar que o Interpreter: "
                    "- Raciocine sobre uma tarefa complexa "
                    "- Gere e execute código automaticamente "
                    "- Corrija erros e tente novamente "
                    "- Execute scripts, comandos shell, etc. "
                    "O AutoGen comanda o QUANDO e o PORQUÊ; o Open Interpreter decide o COMO e executa."
                ),
                "parameters": {
                    "type": "object",
                    "properties": {
                        "command": {
                            "type": "string",
                            "description": (
                                "Comando/tarefa em linguagem natural para o Open Interpreter. "
                                "Exemplos: 'Crie um script Python que soma 5 + 7', "
                                "'Execute ls -la no diretório atual', "
                                "'Analise o arquivo data.csv e gere um relatório'"
                            ),
                        },
                    },
                    "required": ["command"],
                },
            },
        }


# Função helper para criar a tool (usada pelo AutoGen v2)
def create_open_interpreter_tool(
    model: Optional[str] = None,
    use_websocket: bool = False,
    websocket_uri: str = "ws://localhost:8000",
    auto_run: bool = True,
    local: bool = True,
) -> OpenInterpreterTool:
    """
    Cria uma instância da tool do Open Interpreter.
    
    Args:
        model: Modelo a usar (padrão: do ambiente)
        use_websocket: Se True, usa WebSocket
        websocket_uri: URI do servidor WebSocket
        auto_run: Executar código automaticamente
        local: Usar modo local com Ollama
    
    Returns:
        Instância da tool
    """
    return OpenInterpreterTool(
        model=model,
        use_websocket=use_websocket,
        websocket_uri=websocket_uri,
        auto_run=auto_run,
        local=local,
    )


# Funções para AutoGen v2 (wrappers assíncronos)
async def execute_code_tool(
    code: str,
    language: str = "python",
    description: Optional[str] = None,
    tool_instance: Optional[OpenInterpreterTool] = None,
) -> str:
    """
    Wrapper assíncrono para a tool execute_code.
    
    O AutoGen v2 chama esta função quando decide executar código.
    
    Args:
        code: Código a executar
        language: Linguagem do código
        description: Descrição opcional
        tool_instance: Instância da tool (se None, cria nova)
    
    Returns:
        Output do código executado (string)
    """
    if tool_instance is None:
        tool_instance = create_open_interpreter_tool()
    
    result = await tool_instance.execute_code(code, language, description)
    
    if result.get("success"):
        output = result.get("output", "")
        if output:
            return f"✅ Código executado com sucesso:\n{output}"
        else:
            return "✅ Código executado (sem output)"
    else:
        error = result.get("error", "Erro desconhecido")
        return f"❌ Erro ao executar código: {error}"


async def open_interpreter_agent_tool(
    command: str,
    tool_instance: Optional[OpenInterpreterTool] = None,
) -> str:
    """
    Wrapper assíncrono para a tool open_interpreter_agent.
    
    O AutoGen v2 chama esta função quando decide enviar um comando ao Open Interpreter.
    O Open Interpreter pensa e executa localmente usando seu modelo interno.
    
    Args:
        command: Comando/tarefa em linguagem natural
        tool_instance: Instância da tool (se None, cria nova)
    
    Returns:
        Resposta completa do Open Interpreter (pensamento + execução)
    """
    if tool_instance is None:
        tool_instance = create_open_interpreter_tool()
    
    # Enviar comando ao Open Interpreter
    # Ele vai pensar e executar localmente
    result = await tool_instance.chat(command)
    
    if result.get("success"):
        response = result.get("response", "")
        output = result.get("output", "")
        raw_response = result.get("raw_response", "")
        
        # Formatar resposta completa
        if output:
            return f"✅ Open Interpreter executou com sucesso:\n\n💭 Pensamento: {raw_response}\n\n📊 Output:\n{output}"
        else:
            return f"✅ Open Interpreter respondeu:\n\n💭 {response}"
    else:
        error = result.get("error", "Erro desconhecido")
        return f"❌ Erro ao executar comando no Open Interpreter: {error}"

