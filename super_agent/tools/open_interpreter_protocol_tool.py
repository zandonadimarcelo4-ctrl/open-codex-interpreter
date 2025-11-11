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
        
        self.model = model or os.getenv("DEFAULT_MODEL", "deepseek-coder-v2-16b-q4_k_m-rtx")
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
            ResultMessage estruturada
        """
        try:
            # Limpar mensagens anteriores
            self.interpreter.messages = []
            
            # Executar no Open Interpreter
            self.interpreter.chat(prompt, return_messages=False)
            
            # Extrair resultado das mensagens
            output = ""
            code_executed = ""
            errors = []
            warnings = []
            
            # Processar mensagens do Interpreter
            for msg in self.interpreter.messages:
                role = msg.get("role", "")
                content = msg.get("content", "")
                name = msg.get("name", "")
                
                if role == "assistant" and content:
                    # Resposta do assistente
                    output += content + "\n"
                
                elif role == "function" and name == "run_code":
                    # Código executado
                    if isinstance(content, dict):
                        code_executed = content.get("code", "")
                        if "error" in content:
                            errors.append(content["error"])
                    elif isinstance(content, str):
                        code_executed = content
            
            # Verificar se houve erro
            success = len(errors) == 0 and output != ""
            
            # Criar resultado estruturado
            result = self.protocol.create_result(
                success=success,
                output=output.strip(),
                code_executed=code_executed if code_executed else None,
                errors=errors if errors else None,
                warnings=warnings if warnings else None,
                metadata={
                    "tool": command.tool,
                    "objective": command.objective,
                    "steps_count": len(command.steps),
                },
            )
            
            return result
        
        except Exception as e:
            error_msg = str(e)
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
            task: Tarefa em linguagem natural
        
        Returns:
            Resposta em formato JSON estruturado
        """
        try:
            # Executar tarefa
            result = tool_instance.execute_from_task(task)
            
            # Retornar JSON estruturado
            return result.to_json()
        
        except Exception as e:
            # Retornar erro em formato JSON
            error_result = ResultMessage(
                success=False,
                output="",
                errors=[str(e)],
            )
            return error_result.to_json()
    
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

