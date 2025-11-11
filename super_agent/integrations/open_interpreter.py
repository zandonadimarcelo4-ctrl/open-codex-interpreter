"""
Open Interpreter Integration
Integra o Open Interpreter com o Super Agent usando parâmetros --local e -y (auto_run)
"""
import os
import sys
from pathlib import Path
from typing import Optional, Dict, Any
import logging

logger = logging.getLogger(__name__)

# Adicionar caminho do interpreter ao sys.path
interpreter_path = Path(__file__).parent.parent.parent / "interpreter"
if interpreter_path.exists():
    sys.path.insert(0, str(interpreter_path.parent))

try:
    from interpreter.interpreter import Interpreter
    OPEN_INTERPRETER_AVAILABLE = True
except ImportError:
    try:
        # Tentar importar do diretório atual
        import interpreter
        OPEN_INTERPRETER_AVAILABLE = True
    except ImportError:
        OPEN_INTERPRETER_AVAILABLE = False
        logger.warning("Open Interpreter não disponível. Instale com: pip install open-interpreter")


class OpenInterpreterIntegration:
    """
    Integração do Open Interpreter com o Super Agent.
    
    Usa os parâmetros nativos do Open Interpreter:
    - auto_run=True (equivalente a -y): executa código sem pedir confirmação
    - local=False: não usa Code-Llama local, usa Ollama via adaptador
    - use_ollama=True: força uso de Ollama em vez de OpenAI
    """
    
    def __init__(
        self,
        auto_run: bool = True,
        local: bool = True,  # Mudado para True - modo local usa Ollama
        model: Optional[str] = None,
        debug_mode: bool = False,
        use_ollama: bool = True,
        autogen_model: Optional[str] = None,  # Novo: modelo do AutoGen
    ):
        """
        Inicializa a integração do Open Interpreter.
        
        Args:
            auto_run (bool): Se True, executa código automaticamente (equivalente a -y)
            local (bool): Se True, usa modo local com Ollama (equivalente a --local). Padrão: True
            model (str): Nome do modelo a usar (padrão: do ambiente ou do AutoGen)
            debug_mode (bool): Se True, ativa modo debug
            use_ollama (bool): Se True, força uso de Ollama (padrão: True)
            autogen_model (str): Modelo que o AutoGen está usando (será usado se model não for especificado)
        """
        if not OPEN_INTERPRETER_AVAILABLE:
            raise ImportError("Open Interpreter não está disponível. Instale com: pip install . na pasta interpreter")
        
        self.auto_run = auto_run
        self.local = local
        # Usar modelo do AutoGen se fornecido, senão usar o padrão
        self.model = model or autogen_model or os.getenv("DEFAULT_MODEL", "deepseek-coder-v2-16b-q4_k_m-rtx")
        self.debug_mode = debug_mode
        self.use_ollama = use_ollama
        
        # Inicializar Interpreter com parâmetros
        try:
            self.interpreter = Interpreter(
                auto_run=self.auto_run,  # -y: executa sem pedir confirmação
                local=self.local,  # --local: usa Ollama via adaptador
                model=self.model,  # Usa o mesmo modelo do AutoGen
                debug_mode=self.debug_mode,
                use_ollama=self.use_ollama,  # Força uso de Ollama
            )
            logger.info(f"Open Interpreter inicializado com auto_run={auto_run}, local={local}, model={self.model}, use_ollama={use_ollama}")
        except Exception as e:
            logger.error(f"Erro ao inicializar Open Interpreter: {e}")
            raise
    
    def execute_code(self, code: str, language: str = "python") -> Dict[str, Any]:
        """
        Executa código usando o Open Interpreter.
        
        Args:
            code (str): Código a executar
            language (str): Linguagem do código (padrão: python)
        
        Returns:
            Dict com resultado da execução
        """
        try:
            # Criar mensagem para o Interpreter
            message = f"Execute o seguinte código {language}:\n\n```{language}\n{code}\n```"
            
            # Executar usando chat (modo programático)
            # O Interpreter vai executar automaticamente se auto_run=True
            result = self.interpreter.chat(message, return_messages=False)
            
            # Extrair output das mensagens
            output = ""
            if self.interpreter.messages:
                last_message = self.interpreter.messages[-1]
                if last_message.get("role") == "function" and last_message.get("name") == "run_code":
                    output = last_message.get("content", "")
            
            return {
                "success": True,
                "output": output,
                "language": language,
                "code": code,
            }
        except Exception as e:
            logger.error(f"Erro ao executar código com Open Interpreter: {e}")
            return {
                "success": False,
                "error": str(e),
                "language": language,
                "code": code,
            }
    
    def chat(self, message: str) -> Dict[str, Any]:
        """
        Envia uma mensagem para o Open Interpreter e retorna a resposta.
        
        Args:
            message (str): Mensagem/prompt a enviar
        
        Returns:
            Dict com resposta do Interpreter
        """
        try:
            # Executar chat (modo programático)
            # O Interpreter vai executar código automaticamente se auto_run=True
            self.interpreter.chat(message, return_messages=False)
            
            # Extrair resposta das mensagens
            response = ""
            if self.interpreter.messages:
                # Pegar última mensagem do assistant
                for msg in reversed(self.interpreter.messages):
                    if msg.get("role") == "assistant" and msg.get("content"):
                        response = msg.get("content", "")
                        break
            
            return {
                "success": True,
                "response": response,
                "messages": self.interpreter.messages,
            }
        except Exception as e:
            logger.error(f"Erro ao enviar mensagem para Open Interpreter: {e}")
            return {
                "success": False,
                "error": str(e),
            }
    
    def reset(self):
        """Reseta o estado do Interpreter (limpa mensagens)"""
        if hasattr(self, "interpreter"):
            self.interpreter.reset()
    
    def is_available(self) -> bool:
        """Verifica se o Open Interpreter está disponível"""
        return OPEN_INTERPRETER_AVAILABLE and hasattr(self, "interpreter")

