"""
Protocolo de Comunicação entre AutoGen e Tools
Evita "telefone sem fio" usando JSON estruturado e validação
"""
import json
import logging
from typing import Dict, Any, Optional, List
from datetime import datetime
from pathlib import Path
from dataclasses import dataclass, asdict
from enum import Enum

logger = logging.getLogger(__name__)

# Diretório de logs
LOG_DIR = Path(__file__).parent.parent.parent / "logs"
LOG_DIR.mkdir(exist_ok=True)


class MessageType(str, Enum):
    """Tipos de mensagens do protocolo"""
    COMMAND = "command"
    RESULT = "result"
    ERROR = "error"
    ACK = "ack"


@dataclass
class CommandMessage:
    """
    Mensagem de comando do AutoGen para uma Tool (ex: Open Interpreter)
    """
    type: str = MessageType.COMMAND
    objective: str = ""  # Objetivo principal da tarefa
    steps: List[str] = None  # Passos específicos a seguir
    constraints: List[str] = None  # Restrições ou requisitos
    context: Dict[str, Any] = None  # Contexto adicional
    output_format: str = "json"  # Formato esperado da resposta
    timeout: Optional[int] = None  # Timeout em segundos
    tool: str = "open_interpreter_agent"  # Tool a ser usada
    
    def __post_init__(self):
        if self.steps is None:
            self.steps = []
        if self.constraints is None:
            self.constraints = []
        if self.context is None:
            self.context = {}
    
    def to_dict(self) -> Dict[str, Any]:
        """Converte para dicionário"""
        return asdict(self)
    
    def to_json(self) -> str:
        """Converte para JSON"""
        return json.dumps(self.to_dict(), ensure_ascii=False, indent=2)
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "CommandMessage":
        """Cria a partir de um dicionário"""
        return cls(
            type=data.get("type", MessageType.COMMAND),
            objective=data.get("objective", ""),
            steps=data.get("steps", []),
            constraints=data.get("constraints", []),
            context=data.get("context", {}),
            output_format=data.get("output_format", "json"),
            timeout=data.get("timeout"),
            tool=data.get("tool", "open_interpreter_agent"),
        )
    
    @classmethod
    def from_json(cls, json_str: str) -> "CommandMessage":
        """Cria a partir de JSON"""
        data = json.loads(json_str)
        return cls.from_dict(data)
    
    def validate(self) -> tuple[bool, Optional[str]]:
        """
        Valida a mensagem de comando
        
        Returns:
            (is_valid, error_message)
        """
        if not self.objective:
            return False, "Campo 'objective' é obrigatório"
        
        if self.type != MessageType.COMMAND:
            return False, f"Tipo de mensagem inválido: {self.type}"
        
        if not isinstance(self.steps, list):
            return False, "Campo 'steps' deve ser uma lista"
        
        if not isinstance(self.constraints, list):
            return False, "Campo 'constraints' deve ser uma lista"
        
        return True, None


@dataclass
class ResultMessage:
    """
    Mensagem de resultado de uma Tool para o AutoGen
    """
    type: str = MessageType.RESULT
    success: bool = False
    output: str = ""  # Saída principal
    code_executed: Optional[str] = None  # Código executado (se aplicável)
    errors: Optional[List[str]] = None  # Lista de erros (se houver)
    warnings: Optional[List[str]] = None  # Lista de avisos
    execution_time: Optional[float] = None  # Tempo de execução em segundos
    metadata: Dict[str, Any] = None  # Metadados adicionais
    
    def __post_init__(self):
        if self.errors is None:
            self.errors = []
        if self.warnings is None:
            self.warnings = []
        if self.metadata is None:
            self.metadata = {}
    
    def to_dict(self) -> Dict[str, Any]:
        """Converte para dicionário"""
        return asdict(self)
    
    def to_json(self) -> str:
        """Converte para JSON - garante serialização válida"""
        try:
            # Garantir que todos os campos são serializáveis
            data = {
                "type": str(self.type),
                "success": bool(self.success),
                "output": str(self.output) if self.output is not None else "",
                "code_executed": str(self.code_executed) if self.code_executed is not None else None,
                "errors": [str(e) for e in (self.errors or [])],
                "warnings": [str(w) for w in (self.warnings or [])],
                "execution_time": float(self.execution_time) if self.execution_time is not None else None,
                "metadata": {}
            }
            
            # Validar que metadata é dict serializável
            if self.metadata:
                for k, v in self.metadata.items():
                    try:
                        json.dumps(v)  # Testar se é serializável
                        data["metadata"][str(k)] = v
                    except (TypeError, ValueError):
                        data["metadata"][str(k)] = str(v)
            
            json_str = json.dumps(data, ensure_ascii=False, indent=2)
            # Validar que é JSON válido
            json.loads(json_str)
            return json_str
        except Exception as e:
            logger.error(f"❌ Erro ao serializar ResultMessage para JSON: {e}", exc_info=True)
            # Retornar JSON mínimo válido em caso de erro
            return json.dumps({
                "type": str(self.type),
                "success": bool(self.success),
                "output": str(self.output) if self.output else "",
                "code_executed": str(self.code_executed) if self.code_executed else None,
                "errors": [str(e) for e in (self.errors or [])],
                "warnings": [str(w) for w in (self.warnings or [])],
                "execution_time": float(self.execution_time) if self.execution_time else None,
                "metadata": {},
            }, ensure_ascii=False)
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "ResultMessage":
        """Cria a partir de um dicionário"""
        return cls(
            type=data.get("type", MessageType.RESULT),
            success=data.get("success", False),
            output=data.get("output", ""),
            code_executed=data.get("code_executed"),
            errors=data.get("errors", []),
            warnings=data.get("warnings", []),
            execution_time=data.get("execution_time"),
            metadata=data.get("metadata", {}),
        )
    
    @classmethod
    def from_json(cls, json_str: str) -> "ResultMessage":
        """Cria a partir de JSON"""
        data = json.loads(json_str)
        return cls.from_dict(data)
    
    def validate(self) -> tuple[bool, Optional[str]]:
        """
        Valida a mensagem de resultado
        
        Returns:
            (is_valid, error_message)
        """
        if self.type != MessageType.RESULT:
            return False, f"Tipo de mensagem inválido: {self.type}"
        
        if not isinstance(self.success, bool):
            return False, "Campo 'success' deve ser um booleano"
        
        if not self.success and not self.errors:
            return False, "Se 'success' é False, 'errors' deve conter pelo menos um erro"
        
        return True, None


@dataclass
class ErrorMessage:
    """
    Mensagem de erro
    """
    type: str = MessageType.ERROR
    error: str = ""  # Mensagem de erro
    error_code: Optional[str] = None  # Código de erro
    details: Dict[str, Any] = None  # Detalhes adicionais
    
    def __post_init__(self):
        if self.details is None:
            self.details = {}
    
    def to_dict(self) -> Dict[str, Any]:
        """Converte para dicionário"""
        return asdict(self)
    
    def to_json(self) -> str:
        """Converte para JSON"""
        return json.dumps(self.to_dict(), ensure_ascii=False, indent=2)
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "ErrorMessage":
        """Cria a partir de um dicionário"""
        return cls(
            type=data.get("type", MessageType.ERROR),
            error=data.get("error", ""),
            error_code=data.get("error_code"),
            details=data.get("details", {}),
        )
    
    @classmethod
    def from_json(cls, json_str: str) -> "ErrorMessage":
        """Cria a partir de JSON"""
        data = json.loads(json_str)
        return cls.from_dict(data)


class CommunicationProtocol:
    """
    Protocolo de comunicação estruturado entre AutoGen e Tools
    """
    
    def __init__(self, session_id: Optional[str] = None, enable_logging: bool = True):
        """
        Inicializa o protocolo de comunicação
        
        Args:
            session_id: ID da sessão (para logs)
            enable_logging: Se True, registra logs de comunicação
        """
        self.session_id = session_id or datetime.now().strftime("%Y%m%d_%H%M%S")
        self.enable_logging = enable_logging
        self.log_file = LOG_DIR / f"session_{self.session_id}.txt" if enable_logging else None
        
        if self.enable_logging and self.log_file:
            self.log_file.parent.mkdir(parents=True, exist_ok=True)
            self._log("=" * 80)
            self._log(f"Sessão iniciada: {self.session_id}")
            self._log("=" * 80)
    
    def _log(self, message: str):
        """Registra mensagem no log"""
        if self.enable_logging and self.log_file:
            timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            with open(self.log_file, "a", encoding="utf-8") as f:
                f.write(f"[{timestamp}] {message}\n")
        logger.info(message)
    
    def create_command(
        self,
        objective: str,
        steps: Optional[List[str]] = None,
        constraints: Optional[List[str]] = None,
        context: Optional[Dict[str, Any]] = None,
        output_format: str = "json",
        timeout: Optional[int] = None,
        tool: str = "open_interpreter_agent",
    ) -> CommandMessage:
        """
        Cria uma mensagem de comando estruturada
        
        Args:
            objective: Objetivo principal da tarefa
            steps: Passos específicos a seguir
            constraints: Restrições ou requisitos
            context: Contexto adicional
            output_format: Formato esperado da resposta
            timeout: Timeout em segundos
            tool: Tool a ser usada
        
        Returns:
            CommandMessage validada
        """
        command = CommandMessage(
            objective=objective,
            steps=steps or [],
            constraints=constraints or [],
            context=context or {},
            output_format=output_format,
            timeout=timeout,
            tool=tool,
        )
        
        # Validar
        is_valid, error = command.validate()
        if not is_valid:
            raise ValueError(f"Comando inválido: {error}")
        
        # Log
        self._log(f"📤 Comando criado para {tool}:")
        self._log(f"   Objetivo: {objective}")
        self._log(f"   Passos: {len(command.steps)}")
        self._log(f"   Restrições: {len(command.constraints)}")
        
        return command
    
    def create_result(
        self,
        success: bool,
        output: str = "",
        code_executed: Optional[str] = None,
        errors: Optional[List[str]] = None,
        warnings: Optional[List[str]] = None,
        execution_time: Optional[float] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> ResultMessage:
        """
        Cria uma mensagem de resultado estruturada
        
        Args:
            success: Se a execução foi bem-sucedida
            output: Saída principal
            code_executed: Código executado (se aplicável)
            errors: Lista de erros (se houver)
            warnings: Lista de avisos
            execution_time: Tempo de execução em segundos
            metadata: Metadados adicionais
        
        Returns:
            ResultMessage validada
        """
        result = ResultMessage(
            success=success,
            output=output,
            code_executed=code_executed,
            errors=errors or [],
            warnings=warnings or [],
            execution_time=execution_time,
            metadata=metadata or {},
        )
        
        # Validar
        is_valid, error = result.validate()
        if not is_valid:
            raise ValueError(f"Resultado inválido: {error}")
        
        # Log
        status = "✅ Sucesso" if success else "❌ Falha"
        self._log(f"📥 Resultado recebido: {status}")
        self._log(f"   Output: {output[:100]}..." if len(output) > 100 else f"   Output: {output}")
        if errors:
            self._log(f"   Erros: {len(errors)}")
        
        return result
    
    def parse_message(self, message: str) -> Dict[str, Any]:
        """
        Parseia uma mensagem JSON e retorna o tipo e dados
        
        Args:
            message: Mensagem JSON
        
        Returns:
            Dict com 'type' e 'data'
        """
        try:
            data = json.loads(message)
            msg_type = data.get("type")
            
            if msg_type == MessageType.COMMAND:
                return {
                    "type": "command",
                    "data": CommandMessage.from_dict(data),
                }
            elif msg_type == MessageType.RESULT:
                return {
                    "type": "result",
                    "data": ResultMessage.from_dict(data),
                }
            elif msg_type == MessageType.ERROR:
                return {
                    "type": "error",
                    "data": ErrorMessage.from_dict(data),
                }
            else:
                raise ValueError(f"Tipo de mensagem desconhecido: {msg_type}")
        
        except json.JSONDecodeError as e:
            error_msg = f"Erro ao parsear JSON: {e}"
            self._log(f"❌ {error_msg}")
            raise ValueError(error_msg)
    
    def validate_response(self, response: ResultMessage) -> tuple[bool, Optional[str]]:
        """
        Valida uma resposta e verifica se está completa
        
        Args:
            response: Mensagem de resultado
        
        Returns:
            (is_valid, error_message)
        """
        # Validar estrutura
        is_valid, error = response.validate()
        if not is_valid:
            return False, error
        
        # Verificar se há erros
        if not response.success and not response.errors:
            return False, "Resposta indica falha mas não contém erros"
        
        # Verificar se há output (mesmo que vazio)
        if response.output is None:
            return False, "Campo 'output' é obrigatório"
        
        return True, None


# Função helper para criar comando a partir de tarefa em linguagem natural
def create_command_from_task(
    task: str,
    tool: str = "open_interpreter_agent",
    context: Optional[Dict[str, Any]] = None,
) -> CommandMessage:
    """
    Cria um comando estruturado a partir de uma tarefa em linguagem natural
    
    Args:
        task: Tarefa em linguagem natural
        tool: Tool a ser usada
        context: Contexto adicional
    
    Returns:
        CommandMessage
    """
    protocol = CommunicationProtocol(enable_logging=False)
    
    # Extrair objetivo e passos da tarefa
    objective = task.strip()
    
    # Tentar extrair passos se a tarefa contiver "passos" ou números
    steps = []
    if "passo" in task.lower() or any(char.isdigit() for char in task):
        # Tentar identificar passos numerados
        lines = task.split("\n")
        for line in lines:
            line = line.strip()
            if line and (line[0].isdigit() or line.startswith("-") or line.startswith("*")):
                steps.append(line)
    
    # Se não houver passos explícitos, criar um passo genérico
    if not steps:
        steps = [f"Executar tarefa: {objective}"]
    
    return protocol.create_command(
        objective=objective,
        steps=steps,
        constraints=[],
        context=context or {},
        tool=tool,
    )

