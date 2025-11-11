"""
OpenInterpreterAgentIntegrated - Agente que reutiliza 100% da lógica do Open Interpreter

Este agente importa a classe Interpreter do OI e adapta apenas o método respond()
para usar o model_client do AutoGen, mantendo toda a lógica de execução do OI.

Características:
- Reutiliza 100% da lógica do Open Interpreter
- Usa model_client do AutoGen (mesmo modelo)
- Zero overhead de comunicação (mesmo processo)
- Funcionalidades completas (Python, Shell, JavaScript, HTML)
- Active line tracking (AST transformation)
- Output truncation
- Error handling robusto
"""
import os
import sys
import logging
import asyncio
import re
from pathlib import Path
from typing import Optional, Any, Dict, List

logger = logging.getLogger(__name__)

# Adicionar interpreter/ ao path
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
    from interpreter.interpreter import Interpreter
    from interpreter.code_interpreter import CodeInterpreter
    from interpreter.utils import parse_partial_json, merge_deltas
    OPEN_INTERPRETER_AVAILABLE = True
except ImportError:
    OPEN_INTERPRETER_AVAILABLE = False
    logger.error("Open Interpreter não disponível. Verifique se interpreter/ está no repositório.")


class OpenInterpreterAgentIntegrated(AssistantAgent):
    """
    Agente que reutiliza 100% da lógica do Open Interpreter
    
    Este agente:
    1. Importa classe Interpreter do OI
    2. Substitui método respond() para usar model_client do AutoGen
    3. Mantém toda a lógica de execução do OI (CodeInterpreter, etc.)
    4. Zero overhead de comunicação (mesmo processo)
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
        Inicializa o agente integrado
        
        Args:
            name: Nome do agente
            model_client: Cliente LLM do AutoGen (compartilha mesmo modelo)
            workdir: Diretório de trabalho (sandbox)
            auto_run: Executar código automaticamente
            system_message: Mensagem do sistema personalizada
            **kwargs: Argumentos adicionais para AssistantAgent
        """
        if not AUTOGEN_V2_AVAILABLE:
            raise ImportError("autogen-agentchat não está instalado. Execute: pip install autogen-agentchat autogen-ext[openai]")
        
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
        self.model_client_autogen = model_client
        
        # Criar instância do Interpreter do OI
        self.interpreter = Interpreter(
            auto_run=self.auto_run,
            local=True,  # Modo local
            model=None,  # Será sobrescrito
            debug_mode=False,
            use_ollama=False,  # Não usar OllamaAdapter
        )
        
        # Desabilitar OllamaAdapter no Interpreter
        self.interpreter.ollama_adapter = None
        self.interpreter.use_ollama = False
        
        # Substituir método respond() do Interpreter
        # Salvar método original para referência (se necessário)
        self._original_respond = self.interpreter.respond
        # Substituir por nossa implementação
        self.interpreter.respond = self._respond_with_autogen
        
        # Configurar workdir
        if self.workdir:
            os.makedirs(self.workdir, exist_ok=True)
        
        logger.info(f"✅ OpenInterpreterAgentIntegrated inicializado")
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
    
    def _respond_with_autogen(self):
        """
        Substitui respond() do Interpreter para usar model_client do AutoGen
        
        Este método:
        1. Prepara mensagens do Interpreter para o model_client do AutoGen
        2. Chama model_client do AutoGen (assíncrono)
        3. Processa resposta do LLM
        4. Extrai blocos de código
        5. Executa código usando CodeInterpreter do OI (reutiliza 100% da lógica)
        6. Adiciona resultados às mensagens do Interpreter
        """
        # Preparar mensagens para model_client do AutoGen
        messages = self.interpreter.messages.copy()
        
        # Adicionar system message se não estiver presente
        has_system_message = any(msg.get("role") == "system" for msg in messages)
        if not has_system_message:
            system_message = self.interpreter.system_message
            if system_message:
                # Adicionar informações do sistema (como o OI faz)
                try:
                    system_info = self.interpreter.get_info_for_system_message()
                    full_system_message = system_message + system_info
                except Exception as e:
                    logger.warning(f"Erro ao obter informações do sistema: {e}")
                    full_system_message = system_message
                
                messages.insert(0, {"role": "system", "content": full_system_message})
        
        # Chamar model_client do AutoGen (assíncrono)
        try:
            # Executar de forma síncrona (o Interpreter espera resposta síncrona)
            if asyncio.iscoroutinefunction(self.model_client_autogen.create):
                # Se model_client é assíncrono, usar loop existente ou criar novo
                try:
                    loop = asyncio.get_event_loop()
                    if loop.is_running():
                        # Loop já está rodando, usar run_in_executor
                        import concurrent.futures
                        with concurrent.futures.ThreadPoolExecutor() as executor:
                            future = executor.submit(
                                asyncio.run,
                                self.model_client_autogen.create(messages=messages)
                            )
                            response = future.result()
                    else:
                        response = loop.run_until_complete(
                            self.model_client_autogen.create(messages=messages)
                        )
                except RuntimeError:
                    # Não há loop, criar novo
                    response = asyncio.run(
                        self.model_client_autogen.create(messages=messages)
                    )
            else:
                # Se model_client é síncrono, chamar diretamente
                response = self.model_client_autogen.create(messages=messages)
            
            # Extrair conteúdo da resposta
            if hasattr(response, 'choices'):
                # Formato OpenAI/AutoGen
                content = response.choices[0].message.content
            elif isinstance(response, dict):
                # Formato dict
                content = response.get("choices", [{}])[0].get("message", {}).get("content", "")
            else:
                content = str(response)
            
            # Adicionar resposta às mensagens do Interpreter
            self.interpreter.messages.append({
                "role": "assistant",
                "content": content
            })
            
            # Processar resposta: extrair código e executar
            # Isso reutiliza 100% da lógica do OI
            self._process_response(content)
            
        except Exception as e:
            logger.error(f"Erro ao chamar model_client do AutoGen: {e}")
            import traceback
            logger.error(traceback.format_exc())
            # Adicionar erro às mensagens
            self.interpreter.messages.append({
                "role": "assistant",
                "content": f"Erro ao processar: {str(e)}"
            })
    
    def _process_response(self, content: str):
        """
        Processa resposta do LLM: extrai código e executa
        Reutiliza 100% da lógica do Open Interpreter
        """
        # Extrair blocos de código (mesma lógica do OI)
        code_blocks = re.findall(r'```(\w+)?\n(.*?)```', content, re.DOTALL)
        
        if not code_blocks:
            return  # Não há código para executar
        
        # Processar cada bloco de código
        for language, code in code_blocks:
            language = language or "python"
            code = code.strip()
            
            if not code:
                continue
            
            # Executar código usando CodeInterpreter do OI (reutiliza 100% da lógica)
            try:
                output = self._execute_code(code, language)
                
                # Adicionar resultado às mensagens do Interpreter (formato do OI)
                self.interpreter.messages.append({
                    "role": "function",
                    "name": "run_code",
                    "content": output
                })
                
            except Exception as e:
                logger.error(f"Erro ao executar código: {e}")
                import traceback
                logger.error(traceback.format_exc())
                # Adicionar erro às mensagens
                self.interpreter.messages.append({
                    "role": "function",
                    "name": "run_code",
                    "content": f"Erro ao executar código: {str(e)}"
                })
    
    def _execute_code(self, code: str, language: str) -> str:
        """
        Executa código usando CodeInterpreter do OI (reutiliza 100% da lógica)
        
        Args:
            code: Código a executar
            language: Linguagem do código (python, shell, javascript, etc.)
        
        Returns:
            Output da execução
        """
        # Mudar para workdir
        original_cwd = os.getcwd()
        try:
            if self.workdir:
                os.chdir(self.workdir)
            
            # Obter ou criar CodeInterpreter para linguagem (reutiliza lógica do OI)
            if language not in self.interpreter.code_interpreters:
                self.interpreter.code_interpreters[language] = CodeInterpreter(
                    language=language,
                    debug_mode=self.interpreter.debug_mode
                )
            
            code_interpreter = self.interpreter.code_interpreters[language]
            
            # Configurar código no CodeInterpreter
            code_interpreter.code = code
            code_interpreter.language = language
            
            # Executar código (reutiliza 100% da lógica do OI)
            # CodeInterpreter.run() faz tudo:
            # - Inicia processo se necessário
            # - Adiciona active line tracking (AST transformation)
            # - Executa código
            # - Captura output
            # - Retorna resultado
            output = code_interpreter.run()
            
            return output
            
        finally:
            os.chdir(original_cwd)
    
    async def process_message(self, message: str) -> str:
        """
        Processa mensagem do AutoGen usando Interpreter do OI (reutiliza 100% da lógica)
        
        Args:
            message: Mensagem do usuário
        
        Returns:
            Resposta do agente
        """
        # Mudar para workdir
        original_cwd = os.getcwd()
        try:
            if self.workdir:
                os.chdir(self.workdir)
            
            # Adicionar mensagem ao Interpreter
            self.interpreter.messages.append({
                "role": "user",
                "content": message
            })
            
            # Chamar respond() do Interpreter (que foi substituído para usar model_client do AutoGen)
            # Isso vai:
            # 1. Chamar model_client do AutoGen (via _respond_with_autogen)
            # 2. Processar resposta (extrair código)
            # 3. Executar código (usando CodeInterpreter do OI)
            # 4. Adicionar resultados às mensagens
            self.interpreter.respond()
            
            # Extrair última mensagem do Interpreter
            if self.interpreter.messages:
                # Buscar última mensagem do assistant
                for msg in reversed(self.interpreter.messages):
                    if msg.get("role") == "assistant":
                        return msg.get("content", "")
                
                # Se não encontrou mensagem do assistant, retornar última mensagem
                last_message = self.interpreter.messages[-1]
                return last_message.get("content", "Código executado com sucesso.")
            
            return "Código executado com sucesso."
            
        finally:
            os.chdir(original_cwd)


def create_open_interpreter_agent_integrated(
    model_client: Any,
    name: str = "interpreter",
    workdir: Optional[str] = None,
    auto_run: bool = True,
    **kwargs
) -> OpenInterpreterAgentIntegrated:
    """
    Cria um OpenInterpreterAgentIntegrated para uso no AutoGen
    
    Args:
        model_client: Cliente LLM do AutoGen (compartilha mesmo modelo)
        name: Nome do agente
        workdir: Diretório de trabalho (sandbox)
        auto_run: Executar código automaticamente
        **kwargs: Argumentos adicionais
    
    Returns:
        OpenInterpreterAgentIntegrated configurado
    """
    return OpenInterpreterAgentIntegrated(
        name=name,
        model_client=model_client,
        workdir=workdir,
        auto_run=auto_run,
        **kwargs
    )

