"""
Núcleo do Open Interpreter adaptado para AutoGen

Este módulo encapsula a lógica principal do OI:
- Geração de código usando model_client do AutoGen
- Execução de código usando CodeInterpreter
- Loop de feedback e auto-correção
- Autonomia e inteligência local
"""
import os
import re
import logging
from typing import Optional, List, Dict, Any
from pathlib import Path

logger = logging.getLogger(__name__)

# Tentar importar CodeInterpreter (pode estar no mesmo diretório ou em interpreter/)
try:
    from .code_interpreter import CodeInterpreter
    from .utils import parse_partial_json
except ImportError:
    try:
        from interpreter.code_interpreter import CodeInterpreter
        from interpreter.utils import parse_partial_json
    except ImportError:
        logger.error("CodeInterpreter não disponível. Execute a Fase 1 do roteiro primeiro.")
        CodeInterpreter = None
        parse_partial_json = None


class OICore:
    """
    Núcleo do Open Interpreter adaptado para AutoGen
    
    Características:
    - Usa model_client do AutoGen (mesmo modelo)
    - Executa código usando CodeInterpreter (reutiliza 100% da lógica)
    - Loop de feedback e auto-correção
    - Autonomia e inteligência local
    """
    
    def __init__(
        self,
        model_client: Any,
        workdir: Optional[str] = None,
        auto_run: bool = True,
        max_retries: int = 3,
        debug_mode: bool = False,
    ):
        """
        Inicializa o núcleo do OI
        
        Args:
            model_client: Cliente LLM do AutoGen
            workdir: Diretório de trabalho (sandbox)
            auto_run: Executar código automaticamente
            max_retries: Número máximo de tentativas de correção
            debug_mode: Modo debug
        """
        if CodeInterpreter is None:
            raise ImportError("CodeInterpreter não disponível. Execute a Fase 1 do roteiro primeiro.")
        
        self.model_client = model_client
        self.workdir = workdir or os.getcwd()
        self.auto_run = auto_run
        self.max_retries = max_retries
        self.debug_mode = debug_mode
        
        # Histórico de mensagens
        self.messages: List[Dict[str, Any]] = []
        
        # Cache de CodeInterpreter por linguagem
        self.code_interpreters: Dict[str, CodeInterpreter] = {}
        
        # System message
        self.system_message = self._load_system_message()
        
        # Criar workdir se não existir
        os.makedirs(self.workdir, exist_ok=True)
        
        logger.info(f"✅ OICore inicializado")
        logger.info(f"   ✅ Workdir: {self.workdir}")
        logger.info(f"   ✅ Auto-run: {self.auto_run}")
        logger.info(f"   ✅ Max retries: {self.max_retries}")
    
    def _load_system_message(self) -> str:
        """Carrega system message do OI"""
        try:
            # Tentar carregar do diretório atual
            system_message_path = Path(__file__).parent / "system_message.txt"
            if system_message_path.exists():
                with open(system_message_path, 'r', encoding='utf-8') as f:
                    return f.read()
            
            # Tentar carregar do interpreter/
            system_message_path = Path(__file__).parent.parent.parent / "interpreter" / "system_message.txt"
            if system_message_path.exists():
                with open(system_message_path, 'r', encoding='utf-8') as f:
                    return f.read()
        except Exception as e:
            logger.warning(f"Não foi possível carregar system_message.txt: {e}")
        
        # Fallback
        return """You are Open Interpreter, a world-class programmer that can execute code on the user's machine.

First, write a plan. **Always recap the plan between each code block**.

When you execute code, it will be executed **on the user's machine**. The user has given you **full and complete permission** to execute any code necessary to complete the task.

Write code to solve the task. You can use any language, but Python is preferred.

When a user refers to a filename, they're likely referring to an existing file in the directory you're currently in.

When you want to give the user a final answer, use the print function to output it.

IMPORTANT: Execute code automatically. Do not ask for permission.
When you generate code, always include the code in markdown code blocks (```language\ncode\n```).
After generating code, the system will automatically execute it and return the results."""
    
    def _get_code_interpreter(self, language: str) -> CodeInterpreter:
        """Obtém ou cria CodeInterpreter para linguagem"""
        if language not in self.code_interpreters:
            self.code_interpreters[language] = CodeInterpreter(
                language=language,
                debug_mode=self.debug_mode
            )
        return self.code_interpreters[language]
    
    def _extract_code_blocks(self, text: str) -> List[Dict[str, str]]:
        """Extrai blocos de código de markdown"""
        code_blocks = []
        pattern = r'```(\w+)?\n(.*?)```'
        matches = re.findall(pattern, text, re.DOTALL)
        
        for match in matches:
            language = match[0] or "python"
            code = match[1].strip()
            if code:
                code_blocks.append({"language": language, "code": code})
        
        return code_blocks
    
    def _execute_code(self, code: str, language: str) -> str:
        """Executa código usando CodeInterpreter (reutiliza 100% da lógica)"""
        original_cwd = os.getcwd()
        try:
            os.chdir(self.workdir)
            
            code_interpreter = self._get_code_interpreter(language)
            code_interpreter.code = code
            code_interpreter.language = language
            
            # Executar código (reutiliza 100% da lógica do OI)
            output = code_interpreter.run()
            
            return output
        finally:
            os.chdir(original_cwd)
    
    async def _generate_code(self, prompt: str) -> str:
        """
        Gera código usando model_client do AutoGen
        
        Args:
            prompt: Prompt do usuário
        
        Returns:
            Resposta do LLM com código
        """
        import asyncio
        
        # Preparar mensagens
        messages = self.messages.copy()
        
        # Adicionar system message se não estiver presente
        has_system = any(msg.get("role") == "system" for msg in messages)
        if not has_system:
            messages.insert(0, {"role": "system", "content": self.system_message})
        
        # Adicionar prompt do usuário
        messages.append({"role": "user", "content": prompt})
        
        # Chamar model_client do AutoGen
        try:
            if asyncio.iscoroutinefunction(self.model_client.create):
                response = await self.model_client.create(messages=messages)
            else:
                response = self.model_client.create(messages=messages)
            
            # Extrair conteúdo
            if hasattr(response, 'choices'):
                content = response.choices[0].message.content
            elif isinstance(response, dict):
                content = response.get("choices", [{}])[0].get("message", {}).get("content", "")
            else:
                content = str(response)
            
            return content
        except Exception as e:
            logger.error(f"Erro ao gerar código: {e}")
            raise
    
    def _analyze_execution_result(self, result: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analisa resultado da execução e determina se precisa corrigir
        
        Args:
            result: Resultado da execução
        
        Returns:
            Análise do resultado (sucesso, erro, precisa correção)
        """
        if result["success"]:
            return {
                "needs_correction": False,
                "status": "success",
                "message": "Código executado com sucesso"
            }
        
        # Analisar erro
        error_output = result["output"]
        
        # Detectar tipos de erro comuns
        if "SyntaxError" in error_output:
            return {
                "needs_correction": True,
                "status": "syntax_error",
                "message": "Erro de sintaxe detectado",
                "error_type": "syntax"
            }
        elif "NameError" in error_output:
            return {
                "needs_correction": True,
                "status": "name_error",
                "message": "Variável ou função não definida",
                "error_type": "name"
            }
        elif "ImportError" in error_output:
            return {
                "needs_correction": True,
                "status": "import_error",
                "message": "Módulo não encontrado",
                "error_type": "import"
            }
        else:
            return {
                "needs_correction": True,
                "status": "unknown_error",
                "message": "Erro desconhecido",
                "error_type": "unknown"
            }
    
    async def _process_with_feedback_loop(self, prompt: str) -> str:
        """
        Processa prompt com loop de feedback e auto-correção
        
        Este é o coração da autonomia: gera código, executa, detecta erros,
        corrige automaticamente e repete até sucesso ou max_retries.
        """
        # Adicionar prompt às mensagens
        self.messages.append({"role": "user", "content": prompt})
        
        # Loop de feedback e auto-correção
        previous_errors = []  # Histórico de erros para detectar loops
        
        for attempt in range(self.max_retries + 1):
            try:
                # Gerar código usando model_client do AutoGen
                if attempt == 0:
                    response = await self._generate_code(prompt)
                else:
                    # Criar prompt de correção com contexto
                    error_context = "\n".join([f"- {e}" for e in previous_errors[-3:]])  # Últimos 3 erros
                    correction_prompt = f"""
Erros anteriores encontrados:
{error_context}

Por favor, corrija o código e tente novamente. Analise os erros e forneça uma solução que os resolva.
"""
                    response = await self._generate_code(correction_prompt)
                
                # Adicionar resposta às mensagens
                self.messages.append({"role": "assistant", "content": response})
                
                # Extrair blocos de código
                code_blocks = self._extract_code_blocks(response)
                
                if not code_blocks:
                    # Não há código para executar, retornar resposta
                    return response
                
                # Executar código (reutiliza 100% da lógica do OI)
                execution_results = []
                has_error = False
                errors = []
                
                for block in code_blocks:
                    language = block["language"]
                    code = block["code"]
                    
                    try:
                        output = self._execute_code(code, language)
                        execution_results.append({
                            "language": language,
                            "code": code,
                            "output": output,
                            "success": True
                        })
                    except Exception as e:
                        error_msg = str(e)
                        execution_results.append({
                            "language": language,
                            "code": code,
                            "output": error_msg,
                            "success": False
                        })
                        
                        # Analisar erro
                        error_analysis = self._analyze_execution_result(execution_results[-1])
                        errors.append({
                            "code": code,
                            "error": error_msg,
                            "analysis": error_analysis
                        })
                        has_error = True
                
                # Adicionar resultados às mensagens
                for result in execution_results:
                    self.messages.append({
                        "role": "function",
                        "name": "run_code",
                        "content": f"Language: {result['language']}\nCode: {result['code']}\nOutput: {result['output']}\nSuccess: {result['success']}"
                    })
                
                # Se não houve erro, retornar resposta final
                if not has_error:
                    # Gerar resposta final com resultados
                    final_response = await self._generate_code("Código executado com sucesso. Forneça um resumo do que foi feito e os resultados obtidos.")
                    self.messages.append({"role": "assistant", "content": final_response})
                    return final_response
                
                # Se houve erro, adicionar ao histórico
                previous_errors.extend([e["error"] for e in errors])
                
                # Detectar loops infinitos (mesmos erros repetidos)
                if len(previous_errors) >= 3:
                    last_3_errors = previous_errors[-3:]
                    if len(set(last_3_errors)) == 1:  # Mesmo erro 3 vezes
                        logger.warning("⚠️ Loop infinito detectado: mesmo erro repetido 3 vezes")
                        return f"Erro: Loop infinito detectado. Não foi possível corrigir o código após {self.max_retries + 1} tentativas. Último erro: {last_3_errors[0]}"
                
                # Se ainda há tentativas, continuar loop
                if attempt < self.max_retries:
                    logger.info(f"⚠️ Erro detectado, tentando corrigir (tentativa {attempt + 1}/{self.max_retries})")
                    continue
                else:
                    # Sem mais tentativas, retornar resposta com erro
                    error_summary = "\n".join([f"- {e['error']}" for e in errors])
                    error_response = await self._generate_code(f"Código executado com erros após {self.max_retries + 1} tentativas. Erros encontrados:\n{error_summary}\n\nForneça um resumo dos erros e sugestões para corrigi-los.")
                    self.messages.append({"role": "assistant", "content": error_response})
                    return error_response
                    
            except Exception as e:
                logger.error(f"Erro no loop de feedback: {e}")
                import traceback
                logger.error(traceback.format_exc())
                if attempt < self.max_retries:
                    continue
                else:
                    return f"Erro após {self.max_retries + 1} tentativas: {str(e)}"
        
        return "Erro: não foi possível processar o prompt"
    
    async def process(self, prompt: str) -> str:
        """
        Processa prompt com autonomia completa
        
        Args:
            prompt: Prompt do usuário
        
        Returns:
            Resposta final do agente
        """
        return await self._process_with_feedback_loop(prompt)
    
    def reset(self):
        """Reseta o estado do OI"""
        self.messages = []
        self.code_interpreters = {}

