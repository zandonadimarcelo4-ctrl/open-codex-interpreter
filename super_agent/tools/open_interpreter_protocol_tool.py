"""
Open Interpreter Tool com Protocolo de Comunicação Estruturado
Evita "telefone sem fio" usando JSON estruturado e validação
"""
import asyncio
import json
import logging
import os
import time
from typing import Dict, Any, Optional
from pathlib import Path
import sys

logger = logging.getLogger(__name__)

# Adicionar caminho do interpreter
interpreter_path = Path(__file__).parent.parent.parent / "interpreter"
if interpreter_path.exists():
    sys.path.insert(0, str(interpreter_path.parent))

# Importar protocolo
try:
    from ..protocol.communication_protocol import (
        CommunicationProtocol,
        CommandMessage,
        ResultMessage,
        create_command_from_task,
    )
    PROTOCOL_AVAILABLE = True
except ImportError:
    PROTOCOL_AVAILABLE = False
    logger.warning("Protocolo de comunicação não disponível")

try:
    from interpreter.interpreter import Interpreter
    OPEN_INTERPRETER_AVAILABLE = True
except ImportError:
    OPEN_INTERPRETER_AVAILABLE = False
    logger.warning("Open Interpreter não disponível")


class OpenInterpreterProtocolTool:
    """
    Tool do Open Interpreter com protocolo de comunicação estruturado
    
    AutoGen envia comandos em JSON estruturado
    Open Interpreter responde em JSON estruturado
    Validação e logs em cada etapa
    """
    
    def __init__(
        self,
        model: Optional[str] = None,
        auto_run: bool = True,
        local: bool = True,
        session_id: Optional[str] = None,
        enable_logging: bool = True,
    ):
        """
        Inicializa a tool com protocolo de comunicação
        
        Args:
            model: Modelo a usar (padrão: do ambiente)
            auto_run: Executar código automaticamente
            local: Usar modo local com Ollama
            session_id: ID da sessão (para logs)
            enable_logging: Se True, registra logs de comunicação
        """
        if not OPEN_INTERPRETER_AVAILABLE:
            raise ImportError("Open Interpreter não disponível. Instale: pip install . na pasta interpreter")
        
        if not PROTOCOL_AVAILABLE:
            raise ImportError("Protocolo de comunicação não disponível")
        
        self.model = model or os.getenv("DEFAULT_MODEL", "qwen2.5:14b")
        self.auto_run = auto_run
        self.local = local
        
        # Inicializar protocolo de comunicação
        self.protocol = CommunicationProtocol(
            session_id=session_id,
            enable_logging=enable_logging,
        )
        
        # Inicializar Open Interpreter
        try:
            self.interpreter = Interpreter(
                auto_run=self.auto_run,
                local=self.local,
                model=self.model,
                debug_mode=False,
                use_ollama=True,
            )
            logger.info(f"✅ Open Interpreter Protocol Tool inicializado com modelo: {self.model}")
        except Exception as e:
            logger.error(f"❌ Erro ao inicializar Open Interpreter: {e}")
            raise
    
    def execute(
        self,
        command: CommandMessage,
        max_retries: int = 2,
    ) -> ResultMessage:
        """
        Executa um comando estruturado via Open Interpreter
        
        Args:
            command: Comando estruturado
            max_retries: Número máximo de tentativas em caso de erro
        
        Returns:
            ResultMessage estruturada
        """
        start_time = time.time()
        
        # Validar comando
        is_valid, error = command.validate()
        if not is_valid:
            return self.protocol.create_result(
                success=False,
                output="",
                errors=[f"Comando inválido: {error}"],
            )
        
        # Construir prompt estruturado para o Open Interpreter
        prompt = self._build_prompt(command)
        
        # Log
        self.protocol._log(f"🚀 Executando comando: {command.objective}")
        self.protocol._log(f"   Tool: {command.tool}")
        self.protocol._log(f"   Passos: {len(command.steps)}")
        
        # Executar com retry
        for attempt in range(max_retries + 1):
            try:
                # Executar no Open Interpreter
                result = self._execute_interpreter(prompt, command)
                
                # Validar resposta
                is_valid, error = self.protocol.validate_response(result)
                if is_valid:
                    execution_time = time.time() - start_time
                    result.execution_time = execution_time
                    self.protocol._log(f"✅ Comando executado com sucesso em {execution_time:.2f}s")
                    return result
                else:
                    self.protocol._log(f"⚠️ Resposta inválida: {error}")
                    if attempt < max_retries:
                        self.protocol._log(f"🔄 Tentativa {attempt + 1}/{max_retries + 1}")
                        continue
                    else:
                        # Retornar erro após todas as tentativas
                        return self.protocol.create_result(
                            success=False,
                            output=result.output,
                            errors=[error] + result.errors,
                        )
            
            except Exception as e:
                error_msg = str(e)
                self.protocol._log(f"❌ Erro na tentativa {attempt + 1}: {error_msg}")
                
                if attempt < max_retries:
                    self.protocol._log(f"🔄 Tentativa {attempt + 1}/{max_retries + 1}")
                    continue
                else:
                    # Retornar erro após todas as tentativas
                    execution_time = time.time() - start_time
                    return self.protocol.create_result(
                        success=False,
                        output="",
                        errors=[error_msg],
                        execution_time=execution_time,
                    )
    
    def _build_prompt(self, command: CommandMessage) -> str:
        """
        Constrói um prompt estruturado para o Open Interpreter
        
        Args:
            command: Comando estruturado
        
        Returns:
            Prompt em linguagem natural
        """
        prompt_parts = []
        
        # Objetivo
        prompt_parts.append(f"OBJETIVO: {command.objective}")
        
        # Passos
        if command.steps:
            prompt_parts.append("\nPASSOS:")
            for i, step in enumerate(command.steps, 1):
                prompt_parts.append(f"{i}. {step}")
        
        # Restrições
        if command.constraints:
            prompt_parts.append("\nRESTRIÇÕES:")
            for constraint in command.constraints:
                prompt_parts.append(f"- {constraint}")
        
        # Contexto
        if command.context:
            prompt_parts.append("\nCONTEXTO:")
            for key, value in command.context.items():
                prompt_parts.append(f"- {key}: {value}")
        
        # Formato de saída
        if command.output_format == "json":
            prompt_parts.append("\nFORMATO DE SAÍDA: Retorne o resultado em formato JSON estruturado.")
        
        return "\n".join(prompt_parts)
    
    def _execute_interpreter(self, prompt: str, command: CommandMessage) -> ResultMessage:
        """
        Executa o prompt no Open Interpreter e retorna resultado estruturado
        
        Args:
            prompt: Prompt em linguagem natural
            command: Comando original (para contexto)
        
        Returns:
            ResultMessage estruturada (sempre válida)
        """
        try:
            # Validar prompt
            if not prompt or not isinstance(prompt, str) or not prompt.strip():
                logger.warning("⚠️ Prompt vazio ou inválido")
                return self.protocol.create_result(
                    success=False,
                    output="",
                    errors=["Prompt vazio ou inválido"],
                )
            
            # Limpar mensagens anteriores
            self.interpreter.messages = []
            
            # Executar no Open Interpreter com tratamento de erro
            try:
                self.interpreter.chat(prompt, return_messages=False)
            except Exception as chat_error:
                logger.error(f"❌ Erro ao executar chat no Interpreter: {chat_error}", exc_info=True)
                return self.protocol.create_result(
                    success=False,
                    output="",
                    errors=[f"Erro ao executar no Interpreter: {str(chat_error)}"],
                )
            
            # Verificar se há mensagens
            if not self.interpreter.messages:
                logger.warning("⚠️ Nenhuma mensagem retornada do Interpreter")
                return self.protocol.create_result(
                    success=False,
                    output="",
                    errors=["Nenhuma mensagem retornada do Interpreter"],
                )
            
            # Extrair resultado das mensagens - garantir que são strings válidas
            output = ""
            code_executed = ""
            errors = []
            warnings = []
            
            # Processar mensagens do Interpreter
            for msg in self.interpreter.messages:
                if not isinstance(msg, dict):
                    logger.warning(f"⚠️ Mensagem inválida (não é dict): {type(msg)}")
                    continue
                
                role = msg.get("role", "")
                content = msg.get("content", "")
                name = msg.get("name", "")
                
                # Garantir que content é string válida
                if content and not isinstance(content, str):
                    try:
                        content = json.dumps(content, ensure_ascii=False) if isinstance(content, (dict, list)) else str(content)
                    except Exception:
                        content = str(content)
                
                if role == "assistant" and content:
                    # Resposta do assistente
                    output += content + "\n"
                
                elif role == "function" and name == "run_code":
                    # Código executado
                    if isinstance(content, dict):
                        code_executed = str(content.get("code", ""))
                        if "error" in content:
                            error_val = content["error"]
                            errors.append(str(error_val) if error_val else "Erro desconhecido")
                    elif isinstance(content, str):
                        code_executed = content
                    else:
                        # Tentar converter para string
                        code_executed = str(content) if content else ""
            
            # Garantir que output não está vazio (mesmo que não tenha código executado)
            if not output or not output.strip():
                output = "Execução concluída sem saída de texto" if code_executed else "Nenhuma saída gerada"
            
            # Verificar se houve erro
            success = len(errors) == 0
            
            # Criar resultado estruturado - garantir que todos os campos são strings válidas
            result = self.protocol.create_result(
                success=success,
                output=str(output).strip() if output else "Execução concluída",
                code_executed=str(code_executed) if code_executed else None,
                errors=[str(e) for e in errors] if errors else None,
                warnings=[str(w) for w in warnings] if warnings else None,
                metadata={
                    "tool": str(command.tool) if command.tool else "open_interpreter_agent",
                    "objective": str(command.objective) if command.objective else "",
                    "steps_count": int(len(command.steps)) if command.steps else 0,
                },
            )
            
            return result
        
        except Exception as e:
            error_msg = str(e) if e else "Erro desconhecido"
            logger.error(f"❌ Erro crítico ao executar no Interpreter: {error_msg}", exc_info=True)
            self.protocol._log(f"❌ Erro ao executar no Interpreter: {error_msg}")
            
            return self.protocol.create_result(
                success=False,
                output="",
                errors=[error_msg],
            )
    
    def execute_from_task(
        self,
        task: str,
        context: Optional[Dict[str, Any]] = None,
        max_retries: int = 2,
    ) -> ResultMessage:
        """
        Executa uma tarefa em linguagem natural (converte para comando estruturado)
        
        Args:
            task: Tarefa em linguagem natural
            context: Contexto adicional
            max_retries: Número máximo de tentativas
        
        Returns:
            ResultMessage estruturada
        """
        # Criar comando a partir da tarefa
        command = create_command_from_task(
            task=task,
            tool="open_interpreter_agent",
            context=context,
        )
        
        # Executar comando
        return self.execute(command, max_retries=max_retries)


def create_open_interpreter_protocol_tool(
    model: Optional[str] = None,
    auto_run: bool = True,
    local: bool = True,
    session_id: Optional[str] = None,
    enable_logging: bool = True,
) -> Dict[str, Any]:
    """
    Cria uma tool do Open Interpreter com protocolo de comunicação para AutoGen
    
    Args:
        model: Modelo a usar
        auto_run: Executar código automaticamente
        local: Usar modo local com Ollama
        session_id: ID da sessão (para logs)
        enable_logging: Se True, registra logs de comunicação
    
    Returns:
        Dict com schema da tool para AutoGen
    """
    tool_instance = OpenInterpreterProtocolTool(
        model=model,
        auto_run=auto_run,
        local=local,
        session_id=session_id,
        enable_logging=enable_logging,
    )
    
    # Função wrapper para AutoGen
    def tool_function(task: str) -> str:
        """
        Função chamada pelo AutoGen
        
        Args:
            task: Tarefa em linguagem natural (deve ser string válida)
        
        Returns:
            Resposta em formato JSON estruturado (sempre string JSON válida)
        """
        try:
            # Validar que task é string válida
            if not isinstance(task, str):
                logger.warning(f"⚠️ Task não é string: {type(task)}, convertendo...")
                task = str(task) if task is not None else ""
            
            if not task or not task.strip():
                logger.warning("⚠️ Task vazia, retornando erro")
                error_result = ResultMessage(
                    success=False,
                    output="",
                    errors=["Task vazia ou inválida"],
                )
                return error_result.to_json()
            
            # Executar tarefa
            logger.info(f"🚀 Executando tarefa: {task[:100]}...")
            result = tool_instance.execute_from_task(task)
            
            # Garantir que result é um ResultMessage válido
            if not isinstance(result, ResultMessage):
                logger.error(f"❌ Result não é ResultMessage: {type(result)}")
                error_result = ResultMessage(
                    success=False,
                    output="",
                    errors=[f"Resultado inválido: {type(result)}"],
                )
                return error_result.to_json()
            
            # Retornar JSON estruturado - validar antes
            try:
                json_str = result.to_json()
                # Validar que é JSON válido parseando novamente
                json.loads(json_str)
                logger.info(f"✅ Resultado válido: {len(json_str)} chars")
                return json_str
            except (TypeError, ValueError) as json_error:
                logger.error(f"❌ Erro ao serializar resultado: {json_error}")
                # Criar resultado de erro válido
                error_result = ResultMessage(
                    success=False,
                    output=str(result.output) if hasattr(result, 'output') else "",
                    errors=[f"Erro ao serializar resultado: {json_error}"],
                )
                return error_result.to_json()
        
        except Exception as e:
            # Retornar erro em formato JSON válido
            logger.error(f"❌ Erro na tool_function: {e}", exc_info=True)
            try:
                error_result = ResultMessage(
                    success=False,
                    output="",
                    errors=[str(e)],
                )
                json_str = error_result.to_json()
                # Validar JSON
                json.loads(json_str)
                return json_str
            except Exception as json_error:
                # Se até isso falhar, retornar JSON manual mínimo
                logger.error(f"❌ Erro crítico ao criar JSON de erro: {json_error}")
                return json.dumps({
                    "success": False,
                    "output": "",
                    "errors": [str(e), f"Erro ao criar JSON: {json_error}"],
                }, ensure_ascii=False)
    
    # Schema da tool para AutoGen
    return {
        "type": "function",
        "function": {
            "name": "open_interpreter_agent",
            "description": (
                "Gera e executa código localmente usando Open Interpreter. "
                "Use esta tool quando precisar: executar código, criar scripts, processar dados, etc. "
                "A tool retorna resultados em formato JSON estruturado com 'success', 'output', 'code_executed', 'errors'."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "task": {
                        "type": "string",
                        "description": (
                            "Tarefa em linguagem natural. "
                            "Exemplos: 'Crie um script Python que soma 5 + 7', "
                            "'Execute ls -la no diretório atual', "
                            "'Analise o arquivo data.csv e gere um relatório'"
                        ),
                    },
                },
                "required": ["task"],
            },
        },
        "func": tool_function,
    }

