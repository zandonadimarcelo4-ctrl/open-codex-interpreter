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
# PRIORIDADE: NativeInterpreter (sem dependência externa)
try:
    from ..tools.native_interpreter_tool import create_native_interpreter_tool
    NATIVE_INTERPRETER_TOOL_AVAILABLE = True
    logger.info("✅ NativeInterpreter Tool disponível (sem dependência externa)")
except ImportError:
    NATIVE_INTERPRETER_TOOL_AVAILABLE = False
    logger.warning("⚠️ NativeInterpreter Tool não disponível")

# Fallback: Open Interpreter com protocolo (se disponível)
OPEN_INTERPRETER_TOOL_AVAILABLE = False
if not NATIVE_INTERPRETER_TOOL_AVAILABLE:
    try:
        from ..tools.open_interpreter_protocol_tool import create_open_interpreter_protocol_tool
        OPEN_INTERPRETER_TOOL_AVAILABLE = True
        logger.warning("⚠️ Usando Open Interpreter Protocol tool (fallback - requer projeto externo)")
    except ImportError:
        OPEN_INTERPRETER_TOOL_AVAILABLE = False
        logger.warning("⚠️ Open Interpreter Protocol tool não disponível")


def create_simple_commander(
    model: Optional[str] = None,
    api_base: Optional[str] = None,
) -> AssistantAgent:
    """
    Cria um comandante AutoGen simplificado.
    
    AutoGen = Chefe que decide qual ferramenta usar
    Open Interpreter = Apenas uma das ferramentas (tools) registradas
    Todas usam o mesmo modelo DeepSeek via Ollama
    
    Args:
        model: Nome do modelo (padrão: do ambiente)
        api_base: URL base da API (padrão: Ollama localhost:11434)
    
    Returns:
        AssistantAgent configurado como comandante
    """
    if not AUTOGEN_V2_AVAILABLE:
        raise ImportError("autogen-agentchat não está instalado. Execute: pip install autogen-agentchat autogen-ext[openai]")
    
    # Obter modelo do ambiente ou usar padrão
    model = model or os.getenv("DEFAULT_MODEL", "deepseek-coder-v2-16b-q4_k_m-rtx")
    
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
    # DECISÃO TÉCNICA: Priorizar Open Interpreter Externo (código testado, funcionalidades completas)
    if OPEN_INTERPRETER_TOOL_AVAILABLE:
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

