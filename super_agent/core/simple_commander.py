"""
AutoGen Commander Simplificado
AutoGen = Chefe que decide qual ferramenta usar
Open Interpreter = Apenas uma das ferramentas (tool) registradas
Todas usam o mesmo modelo DeepSeek via Ollama
"""
import os
import logging
from typing import Optional, List, Dict, Any

logger = logging.getLogger(__name__)

try:
    from autogen_agentchat.agents import AssistantAgent
    from autogen_ext.models.openai import OpenAIChatCompletionClient
    AUTOGEN_V2_AVAILABLE = True
except ImportError:
    AUTOGEN_V2_AVAILABLE = False
    logger.error("autogen-agentchat não está instalado. Execute: pip install autogen-agentchat autogen-ext[openai]")

# Importar tools
# PRIORIDADE: Open Interpreter Externo (projeto estático, código testado, funcionalidades completas)
# DECISÃO TÉCNICA: Open Interpreter Externo é mais eficiente (ver FORMA_MAIS_EFICIENTE.md)
try:
    from ..tools.open_interpreter_protocol_tool import create_open_interpreter_protocol_tool
    OPEN_INTERPRETER_TOOL_AVAILABLE = True
    logger.info("✅ Open Interpreter Protocol Tool disponível (código testado, funcionalidades completas)")
except ImportError:
    OPEN_INTERPRETER_TOOL_AVAILABLE = False
    logger.warning("⚠️ Open Interpreter Protocol Tool não disponível")

# Fallback: NativeInterpreter (reimplementação - funcionalidades parciais, código novo)
try:
    from ..tools.native_interpreter_tool import create_native_interpreter_tool
    NATIVE_INTERPRETER_TOOL_AVAILABLE = True
    logger.info("✅ NativeInterpreter Tool disponível (fallback - reimplementação)")
except ImportError:
    NATIVE_INTERPRETER_TOOL_AVAILABLE = False
    logger.warning("⚠️ NativeInterpreter Tool não disponível")

# Opção: AutonomousInterpreterAgent (reutilização completa - autonomia total, performance máxima)
try:
    from ..agents.autonomous_interpreter_agent import create_autonomous_interpreter_agent
    AUTONOMOUS_AGENT_AVAILABLE = True
    logger.info("✅ AutonomousInterpreterAgent disponível (reutilização completa - autonomia total)")
except ImportError:
    AUTONOMOUS_AGENT_AVAILABLE = False
    logger.warning("⚠️ AutonomousInterpreterAgent não disponível")


def create_simple_commander(
    model: Optional[str] = None,
    api_base: Optional[str] = None,
    use_autonomous_agent: bool = False,
    workdir: Optional[str] = None,
    executor_model: Optional[str] = None,
) -> AssistantAgent:
    """
    Cria um comandante AutoGen simplificado.
    
    AutoGen = Chefe que decide qual ferramenta usar
    Open Interpreter = Apenas uma das ferramentas (tools) registradas
    Todas usam o mesmo modelo DeepSeek via Ollama
    
    Args:
        model: Nome do modelo cérebro (padrão: qwen2.5-32b-instruct-moe-rtx - mais inteligente)
        api_base: URL base da API (padrão: Ollama localhost:11434)
        use_autonomous_agent: Se True, usa AutonomousInterpreterAgent (reutilização completa, autonomia total)
        workdir: Diretório de trabalho (sandbox) para agente autônomo
        executor_model: Nome do modelo executor (padrão: deepseek-coder-v2-lite:instruct - mais rápido)
    
    Returns:
        AssistantAgent configurado como comandante
    """
    if not AUTOGEN_V2_AVAILABLE:
        raise ImportError("autogen-agentchat não está instalado. Execute: pip install autogen-agentchat autogen-ext[openai]")
    
    # Obter modelo cérebro do ambiente ou usar padrão (Qwen32B-MoE - mais inteligente)
    # Arquitetura híbrida: Qwen32B-MoE (cérebro) + DeepSeek-Lite (executor)
    model = model or os.getenv("DEFAULT_MODEL", "qwen2.5-32b-instruct-moe-rtx")
    
    # Obter modelo executor (para tarefas de código)
    executor_model = executor_model or os.getenv("EXECUTOR_MODEL", "deepseek-coder-v2-lite:instruct")
    
    # Obter API base do ambiente
    api_base = api_base or os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    
    # Garantir formato correto da URL
    api_base = api_base.rstrip("/").rstrip("/v1").rstrip("/api")
    api_url = f"{api_base}/v1"
    
    # Criar cliente LLM (mesmo modelo que todas as tools)
    llm_client = OpenAIChatCompletionClient(
        model=f"ollama/{model}",  # Formato: ollama/nome-do-modelo
        api_base=api_url,
    )
    
    logger.info(f"✅ AutoGen Commander criado")
    logger.info(f"   Modelo: {model}")
    logger.info(f"   API URL: {api_url}")
    logger.info(f"   ✅ Mesmo modelo usado por todas as tools")
    logger.info(f"   Modo: {'Autonomous Agent' if use_autonomous_agent else 'TOOL (recomendado)'}")
    
    # Opção 1: Usar AutonomousInterpreterAgent (reutilização completa, autonomia total)
    if use_autonomous_agent and AUTONOMOUS_AGENT_AVAILABLE:
        try:
            # Criar agente autônomo como tool
            workdir = workdir or os.path.join(os.getcwd(), "workspace")
            os.makedirs(workdir, exist_ok=True)
            
            autonomous_agent = create_autonomous_interpreter_agent(
                model_client=llm_client,
                workdir=workdir,
                auto_run=True,
                max_retries=3,
            )
            
            # Criar tool wrapper para o agente autônomo
            # AutoGen v2 espera tools no formato OpenAI function calling
            def autonomous_agent_tool(task: str) -> str:
                """
                Tool wrapper para AutonomousInterpreterAgent
                AutoGen v2 chama esta função com a tarefa em linguagem natural
                """
                import asyncio
                try:
                    # Executar de forma síncrona (usando asyncio.run se necessário)
                    try:
                        loop = asyncio.get_event_loop()
                        if loop.is_running():
                            # Se já há um loop rodando, criar task
                            import concurrent.futures
                            with concurrent.futures.ThreadPoolExecutor() as executor:
                                future = executor.submit(asyncio.run, autonomous_agent.process_message(task))
                                response = future.result(timeout=300)  # 5 minutos timeout
                        else:
                            response = loop.run_until_complete(autonomous_agent.process_message(task))
                    except RuntimeError:
                        # Não há loop, criar um novo
                        response = asyncio.run(autonomous_agent.process_message(task))
                    
                    # Retornar JSON estruturado
                    import json
                    result = {
                        "success": True,
                        "output": response,
                        "code_executed": "",
                        "errors": []
                    }
                    return json.dumps(result, ensure_ascii=False)
                except Exception as e:
                    logger.error(f"Erro no agente autônomo: {e}")
                    import json
                    import traceback
                    result = {
                        "success": False,
                        "output": "",
                        "code_executed": "",
                        "errors": [str(e), traceback.format_exc()]
                    }
                    return json.dumps(result, ensure_ascii=False)
            
            # Registrar como tool no formato AutoGen v2 (OpenAI function calling)
            tools: List[Dict[str, Any]] = [{
                "type": "function",
                "function": {
                    "name": "autonomous_interpreter_agent",
                    "description": (
                        "Agente autônomo que reutiliza 100% da lógica do Open Interpreter. "
                        "Raciocina, executa e corrige código sozinho com autonomia total. "
                        "Use quando precisar: executar código, criar scripts, processar dados, etc. "
                        "Retorna JSON com 'success', 'output', 'code_executed', 'errors'."
                    ),
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "task": {
                                "type": "string",
                                "description": (
                                    "Tarefa em linguagem natural. "
                                    "Exemplos: 'Crie um script Python que abre o navegador', "
                                    "'Execute ls -la no diretório atual', "
                                    "'Analise o arquivo data.csv e gere um relatório'"
                                ),
                            },
                        },
                        "required": ["task"],
                    },
                },
                "func": autonomous_agent_tool,
            }]
            
            logger.info(f"✅ AutonomousInterpreterAgent registrado como tool (REUTILIZAÇÃO COMPLETA)")
            logger.info(f"   ✅ Autonomia total, auto-correção, loop de feedback")
            logger.info(f"   ✅ Zero overhead (mesmo processo)")
            logger.info(f"   ✅ Workdir: {workdir}")
            
        except Exception as e:
            logger.error(f"❌ Falha ao criar AutonomousInterpreterAgent: {e}")
            logger.warning("⚠️ Fallback para TOOL approach")
            use_autonomous_agent = False
    
    # Opção 2: Usar TOOL (recomendado para projeto estático)
    if not use_autonomous_agent:
        # Registrar tools (ferramentas)
        tools: List[Dict[str, Any]] = []
        
        # DECISÃO TÉCNICA: Usar Open Interpreter Externo (projeto já existe, código testado, funcionalidades completas)
        # Prioridade: Open Interpreter com protocolo (projeto estático no repositório)
        if OPEN_INTERPRETER_TOOL_AVAILABLE:
            try:
                open_interpreter_tool = create_open_interpreter_protocol_tool(
                    model=model,  # Mesmo modelo do AutoGen
                    auto_run=True,
                    local=True,
                    session_id=None,  # Será gerado automaticamente
                    enable_logging=True,
                )
                tools.append(open_interpreter_tool)
                logger.info(f"✅ Tool registrada: open_interpreter_agent (OPEN INTERPRETER EXTERNO - projeto estático)")
                logger.info(f"   ✅ Código testado, funcionalidades completas, baixo custo de manutenção")
            except Exception as e:
                logger.warning(f"⚠️ Falha ao registrar Open Interpreter tool: {e}")
                # Fallback: NativeInterpreter (se Open Interpreter não disponível)
                if NATIVE_INTERPRETER_TOOL_AVAILABLE:
                    try:
                        native_interpreter_tool = create_native_interpreter_tool(
                            model=model,
                            workspace=None,
                            auto_run=True,
                            session_id=None,
                            enable_logging=True,
                        )
                        tools.append(native_interpreter_tool)
                        logger.warning(f"⚠️ Tool registrada: native_code_interpreter (FALLBACK - reimplementação)")
                    except Exception as e2:
                        logger.error(f"❌ Falha ao registrar NativeInterpreter tool: {e2}")
        elif NATIVE_INTERPRETER_TOOL_AVAILABLE:
            # Fallback: NativeInterpreter (se Open Interpreter não disponível)
            try:
                native_interpreter_tool = create_native_interpreter_tool(
                    model=model,
                    workspace=None,
                    auto_run=True,
                    session_id=None,
                    enable_logging=True,
                )
                tools.append(native_interpreter_tool)
                logger.warning(f"⚠️ Tool registrada: native_code_interpreter (FALLBACK - reimplementação)")
                logger.warning(f"   ⚠️ Funcionalidades parciais, código novo, maior risco de bugs")
            except Exception as e:
                logger.error(f"❌ Falha ao registrar NativeInterpreter tool: {e}")
        else:
            logger.error("❌ Nenhuma tool de execução de código disponível!")
    
    # TODO: Adicionar outras tools aqui (WebSearch, FileManager, etc.)
    # tools.append(web_search_tool)
    # tools.append(file_manager_tool)
    
    # Mensagem do sistema para o AutoGen
    system_message = """Você é o Comandante AutoGen: um chefe inteligente que decide qual ferramenta usar para cada tarefa.

SUA FUNÇÃO:
- Analisar a tarefa do usuário
- Decidir qual ferramenta (tool) usar
- Coordenar múltiplas ferramentas se necessário
- Retornar o resultado final

PROTOCOLO DE COMUNICAÇÃO:
- Todas as ferramentas retornam resultados em formato JSON estruturado
- Formato de resposta: {"success": true/false, "output": "...", "code_executed": "...", "errors": [...]}
- Sempre valide a resposta antes de processar
- Se "success" for false, verifique o campo "errors" para entender o problema

FERRAMENTAS DISPONÍVEIS:
"""
    
    # Adicionar descrição das tools
    if use_autonomous_agent and AUTONOMOUS_AGENT_AVAILABLE:
        system_message += """
- autonomous_interpreter_agent: Agente autônomo que reutiliza 100% da lógica do Open Interpreter
  Raciocina, executa e corrige código sozinho com autonomia total.
  Funcionalidades: Python interativo, active line tracking, output truncation, auto-correção, loop de feedback.
  Use quando precisar: executar código, criar scripts, processar dados, etc.
  Retorna: JSON com "success", "output", "code_executed", "errors"
  Exemplo: {"success": true, "output": "Resultado da execução", "code_executed": "print('Hello')", "errors": []}
"""
    elif OPEN_INTERPRETER_TOOL_AVAILABLE:
        system_message += """
- open_interpreter_agent: Gera e executa código localmente (Python, Shell, JavaScript, HTML, etc.)
  Código testado com funcionalidades completas: Python interativo, active line tracking, output truncation, etc.
  Use quando precisar: executar código, criar scripts, processar dados, etc.
  Retorna: JSON com "success", "output", "code_executed", "errors"
  Exemplo: {"success": true, "output": "Resultado da execução", "code_executed": "print('Hello')", "errors": []}
"""
    elif NATIVE_INTERPRETER_TOOL_AVAILABLE:
        system_message += """
- native_code_interpreter: Interpretador de código nativo (reimplementação)
  Gera código usando LLM (Ollama) e executa código real via subprocess
  Use quando precisar: executar código, criar scripts, processar dados, etc.
  Suporta: Python, Shell, JavaScript, HTML, etc. (funcionalidades parciais)
  Retorna: JSON com "success", "output", "code_executed", "errors"
  Exemplo: {"success": true, "output": "Resultado da execução", "code_executed": "print('Hello')", "errors": []}
"""
    
    system_message += """
REGRAS:
1. Analise a tarefa do usuário
2. Decida qual ferramenta usar (ou múltiplas ferramentas)
3. Chame a ferramenta apropriada com a tarefa em linguagem natural
4. Parse e valide a resposta JSON da ferramenta
5. Se a tarefa precisar de múltiplos passos, use múltiplas ferramentas em sequência
6. Sempre retorne o resultado final de forma clara e estruturada
7. Se uma ferramenta retornar "success": false, verifique "errors" e tente novamente ou informe o usuário

EXEMPLOS:
- Usuário: "Executa um código para abrir o navegador"
  → Você: Chama open_interpreter_agent("Crie um código Python que abre o navegador padrão")
  → Resposta: {"success": true, "output": "Navegador aberto", "code_executed": "import webbrowser; webbrowser.open('http://localhost')", "errors": []}
  → Você: "✅ Navegador aberto com sucesso!"

- Usuário: "Crie um arquivo texto com 'Hello World'"
  → Você: Chama open_interpreter_agent("Crie um arquivo texto chamado hello.txt com o conteúdo 'Hello World'")
  → Resposta: {"success": true, "output": "Arquivo criado", "code_executed": "with open('hello.txt', 'w') as f: f.write('Hello World')", "errors": []}
  → Você: "✅ Arquivo hello.txt criado com sucesso!"

- Se a resposta contiver "success": false:
  → Você: Verifica "errors" e informa o problema ao usuário ou tenta novamente com mais contexto
"""
    
    # Criar comandante AutoGen
    commander = AssistantAgent(
        name="commander",
        model_client=llm_client,
        system_message=system_message,
        tools=tools if tools else None,  # Registrar tools
    )
    
    logger.info(f"✅ Comandante AutoGen criado com {len(tools)} tool(s) registrada(s)")
    
    return commander

