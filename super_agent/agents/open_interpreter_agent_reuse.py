"""
OpenInterpreterAgentReuse - Agente que reutiliza 100% da lógica do Open Interpreter

Este agente reutiliza a classe Interpreter do Open Interpreter diretamente,
mas adapta para usar o model_client do AutoGen em vez do OllamaAdapter.

Características:
- Reutiliza 100% da lógica do Open Interpreter (classe Interpreter)
- Usa model_client do AutoGen (mesmo modelo DeepSeek)
- Herda funcionalidades do AutoGen (histórico, contexto, etc.)
- Zero overhead de comunicação (mesmo processo)
- Mesmo comportamento do OI original
"""
import os
import sys
import logging
from typing import Optional, Any, Dict, List
from pathlib import Path

logger = logging.getLogger(__name__)

# Adicionar interpreter/ ao path para importar módulos do OI
_current_dir = Path(__file__).parent
_interpreter_dir = _current_dir.parent.parent / "interpreter"
if _interpreter_dir.exists():
    sys.path.insert(0, str(_interpreter_dir.parent))

try:
    from autogen_agentchat.agents import AssistantAgent
    AUTOGEN_V2_AVAILABLE = True
except ImportError:
    AUTOGEN_V2_AVAILABLE = False
    logger.error("autogen-agentchat não está instalado. Execute: pip install autogen-agentchat autogen-ext[openai]")

try:
    # Tentar importar Interpreter do OI
    from interpreter.interpreter import Interpreter
    from interpreter.code_interpreter import CodeInterpreter
    from interpreter.utils import parse_partial_json, merge_deltas
    OPEN_INTERPRETER_AVAILABLE = True
except ImportError:
    OPEN_INTERPRETER_AVAILABLE = False
    logger.error("Open Interpreter não disponível. Verifique se interpreter/ está no repositório.")


class OpenInterpreterAgentReuse(AssistantAgent):
    """
    Agente que reutiliza 100% da lógica do Open Interpreter
    
    Este agente encapsula a classe Interpreter do OI e adapta para usar
    o model_client do AutoGen, mantendo todas as funcionalidades do OI.
    """
    
    def __init__(
        self,
        name: str = "interpreter",
        model_client: Optional[Any] = None,
        workdir: Optional[str] = None,
        auto_run: bool = True,
        system_message: Optional[str] = None,
        **kwargs
    ):
        """
        Inicializa o agente que reutiliza a lógica do Open Interpreter
        
        Args:
            name: Nome do agente
            model_client: Cliente LLM do AutoGen (compartilha mesmo modelo)
            workdir: Diretório de trabalho (sandbox)
            auto_run: Executar código automaticamente
            system_message: Mensagem do sistema personalizada
            **kwargs: Argumentos adicionais para AssistantAgent
        """
        if not AUTOGEN_V2_AVAILABLE:
            raise ImportError("autogen-agentchat não está instalado")
        
        if not OPEN_INTERPRETER_AVAILABLE:
            raise ImportError("Open Interpreter não disponível. Verifique se interpreter/ está no repositório.")
        
        # Carregar system message do OI
        if system_message is None:
            system_message = self._load_system_message()
        
        # Inicializar AssistantAgent
        super().__init__(
            name=name,
            model_client=model_client,
            system_message=system_message,
            **kwargs
        )
        
        # Configurações
        self.workdir = workdir or os.getcwd()
        self.auto_run = auto_run
        
        # Criar instância do Interpreter do OI
        # IMPORTANTE: Vamos adaptar para usar model_client do AutoGen
        self.interpreter = Interpreter(
            auto_run=self.auto_run,
            local=True,  # Modo local (não usa OpenAI)
            model=None,  # Será sobrescrito
            debug_mode=False,
            use_ollama=False,  # Não usa OllamaAdapter, usa model_client
        )
        
        # Substituir adaptador pelo model_client do AutoGen
        self.interpreter.model_client = model_client
        self.interpreter.use_ollama = False
        self.interpreter.ollama_adapter = None
        
        # Mudar workdir do Interpreter
        if self.workdir:
            os.makedirs(self.workdir, exist_ok=True)
            self.interpreter.workdir = self.workdir
        
        logger.info(f"✅ OpenInterpreterAgentReuse inicializado")
        logger.info(f"   ✅ Reutiliza 100% da lógica do Open Interpreter")
        logger.info(f"   ✅ Usa model_client do AutoGen (mesmo modelo)")
        logger.info(f"   ✅ Workdir: {self.workdir}")
        logger.info(f"   ✅ Auto-run: {self.auto_run}")
    
    def _load_system_message(self) -> str:
        """Carrega system message do Open Interpreter"""
        try:
            system_message_path = _interpreter_dir / "system_message.txt"
            if system_message_path.exists():
                with open(system_message_path, 'r', encoding='utf-8') as f:
                    return f.read()
        except Exception as e:
            logger.warning(f"Não foi possível carregar system_message.txt: {e}")
        
        # Fallback para system message padrão
        return """You are Open Interpreter, a world-class programmer that can execute code on the user's machine.

First, write a plan. **Always recap the plan between each code block** (you have extreme short-term memory loss, so you need to the plan each time you write a new block).

When you execute code, it will be executed **on the user's machine**. The user has given you **full and complete permission** to execute any code necessary to complete the task.

You have access to the internet and can make API requests.

Write code to solve the task. You can use any language, but Python is preferred.

When a user refers to a filename, they're likely referring to an existing file in the directory you're currently in.

When you want to give the user a final answer, use the print function to output it.

IMPORTANT: Execute code automatically. Do not ask for permission.
When you generate code, always include the code in markdown code blocks (```language\ncode\n```).
After generating code, the system will automatically execute it and return the results."""
    
    def _adapt_model_client_for_interpreter(self):
        """
        Adapta model_client do AutoGen para funcionar com Interpreter do OI
        
        O Interpreter espera uma interface específica (OllamaAdapter ou OpenAI),
        então precisamos criar um wrapper que adapta o model_client do AutoGen.
        """
        # Criar wrapper que adapta model_client do AutoGen
        class ModelClientAdapter:
            def __init__(self, model_client, model_name: str):
                self.model_client = model_client
                self.model = model_name
            
            def chat_completion(self, messages: List[Dict[str, str]], **kwargs) -> Dict[str, Any]:
                """
                Adapta chamada do Interpreter para usar model_client do AutoGen
                """
                import asyncio
                
                # Converter mensagens para formato do AutoGen
                autogen_messages = []
                system_message = None
                
                for msg in messages:
                    role = msg.get("role", "user")
                    content = msg.get("content", "")
                    
                    if role == "system":
                        system_message = content
                    else:
                        autogen_messages.append({
                            "role": role,
                            "content": content
                        })
                
                # Chamar model_client do AutoGen (assíncrono)
                try:
                    # Se model_client tem método create (AutoGen v2)
                    if hasattr(self.model_client, 'create'):
                        # Executar de forma síncrona (usar loop existente ou criar novo)
                        try:
                            loop = asyncio.get_event_loop()
                            if loop.is_running():
                                # Se já existe loop rodando, usar run_until_complete em thread
                                import concurrent.futures
                                with concurrent.futures.ThreadPoolExecutor() as executor:
                                    future = executor.submit(
                                        asyncio.run,
                                        self.model_client.create(messages=autogen_messages)
                                    )
                                    response = future.result()
                            else:
                                response = loop.run_until_complete(
                                    self.model_client.create(messages=autogen_messages)
                                )
                        except RuntimeError:
                            # Não há loop, criar novo
                            response = asyncio.run(
                                self.model_client.create(messages=autogen_messages)
                            )
                    else:
                        # Fallback para interface síncrona
                        response = self.model_client.create(messages=autogen_messages)
                    
                    # Converter resposta para formato do Interpreter
                    if hasattr(response, 'choices'):
                        # Formato OpenAI/AutoGen
                        content = response.choices[0].message.content
                    elif isinstance(response, dict):
                        # Formato dict
                        content = response.get("choices", [{}])[0].get("message", {}).get("content", "")
                    else:
                        content = str(response)
                    
                    return {
                        "choices": [{
                            "message": {
                                "role": "assistant",
                                "content": content
                            },
                            "finish_reason": "stop"
                        }],
                        "usage": {
                            "prompt_tokens": 0,
                            "completion_tokens": 0,
                            "total_tokens": 0
                        }
                    }
                except Exception as e:
                    logger.error(f"Erro ao adaptar model_client: {e}")
                    raise
        
        # Obter nome do modelo
        model_name = getattr(self.model_client, 'model', 'deepseek-coder-v2-16b-q4_k_m-rtx')
        
        # Criar adaptador
        adapter = ModelClientAdapter(self.model_client, model_name)
        
        # Substituir no Interpreter
        self.interpreter.ollama_adapter = adapter
        self.interpreter.use_ollama = True  # Marcar como usando adaptador (não Ollama real)
        self.interpreter.model = model_name
    
    async def process_message(self, message: str) -> str:
        """
        Processa mensagem usando Interpreter do OI (reutiliza 100% da lógica)
        
        Args:
            message: Mensagem do usuário
        
        Returns:
            Resposta do agente
        """
        # Adaptar model_client se necessário
        if not hasattr(self.interpreter, 'model_client') or self.interpreter.model_client != self.model_client:
            self._adapt_model_client_for_interpreter()
        
        # Mudar para workdir
        original_cwd = os.getcwd()
        try:
            if self.workdir:
                os.chdir(self.workdir)
            
            # Executar chat do Interpreter (reutiliza 100% da lógica do OI)
            # O Interpreter vai:
            # 1. Gerar código usando model_client (adaptado)
            # 2. Executar código usando CodeInterpreter
            # 3. Retornar resultado
            self.interpreter.chat(message, return_messages=False)
            
            # Extrair última mensagem do Interpreter
            if self.interpreter.messages:
                last_message = self.interpreter.messages[-1]
                return last_message.get("content", "")
            
            return "Código executado com sucesso."
        finally:
            os.chdir(original_cwd)
    
    def execute_code(self, code: str, language: str = "python") -> str:
        """
        Executa código diretamente usando CodeInterpreter do OI
        
        Args:
            code: Código a executar
            language: Linguagem do código
        
        Returns:
            Output da execução
        """
        # Mudar para workdir
        original_cwd = os.getcwd()
        try:
            if self.workdir:
                os.chdir(self.workdir)
            
            # Criar CodeInterpreter do OI
            code_interpreter = CodeInterpreter(
                language=language,
                debug_mode=False
            )
            
            # Configurar código
            code_interpreter.code = code
            code_interpreter.language = language
            
            # Executar (reutiliza 100% da lógica do OI)
            output = code_interpreter.run()
            
            return output
        finally:
            os.chdir(original_cwd)


def create_open_interpreter_agent_reuse(
    model_client: Any,
    name: str = "interpreter",
    workdir: Optional[str] = None,
    auto_run: bool = True,
    **kwargs
) -> OpenInterpreterAgentReuse:
    """
    Cria um OpenInterpreterAgentReuse para uso no AutoGen
    
    Args:
        model_client: Cliente LLM do AutoGen
        name: Nome do agente
        workdir: Diretório de trabalho
        auto_run: Executar código automaticamente
        **kwargs: Argumentos adicionais
    
    Returns:
        OpenInterpreterAgentReuse configurado
    """
    return OpenInterpreterAgentReuse(
        name=name,
        model_client=model_client,
        workdir=workdir,
        auto_run=auto_run,
        **kwargs
    )

