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
try:
    from ..tools.open_interpreter_protocol_tool import create_open_interpreter_protocol_tool
    OPEN_INTERPRETER_TOOL_AVAILABLE = True
except ImportError:
    OPEN_INTERPRETER_TOOL_AVAILABLE = False
    logger.warning("Open Interpreter Protocol tool não disponível")
    
    # Fallback para tool sem protocolo
    try:
        from ..tools.open_interpreter_tool import create_open_interpreter_tool
        OPEN_INTERPRETER_TOOL_AVAILABLE = True
        logger.warning("Usando Open Interpreter tool sem protocolo (fallback)")
    except ImportError:
        OPEN_INTERPRETER_TOOL_AVAILABLE = False


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
    
    # Tool 1: Open Interpreter (gera e executa código) - COM PROTOCOLO DE COMUNICAÇÃO
    if OPEN_INTERPRETER_TOOL_AVAILABLE:
        try:
            # Tentar usar tool com protocolo (preferencial)
            try:
                open_interpreter_tool = create_open_interpreter_protocol_tool(
                    model=model,  # Mesmo modelo do AutoGen
                    auto_run=True,
                    local=True,
                    session_id=None,  # Será gerado automaticamente
                    enable_logging=True,
                )
                logger.info(f"✅ Tool registrada: open_interpreter_agent (COM PROTOCOLO)")
            except ImportError:
                # Fallback para tool sem protocolo
                open_interpreter_tool = create_open_interpreter_tool(
                    model=model,
                    auto_run=True,
                    local=True,
                )
                logger.warning(f"⚠️ Tool registrada: open_interpreter_agent (SEM PROTOCOLO - fallback)")
            
            tools.append(open_interpreter_tool)
        except Exception as e:
            logger.warning(f"⚠️ Falha ao registrar Open Interpreter tool: {e}")
    else:
        logger.warning("⚠️ Open Interpreter tool não disponível")
    
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
    if OPEN_INTERPRETER_TOOL_AVAILABLE:
        system_message += """
- open_interpreter_agent: Gera e executa código localmente (Python, Shell, etc.)
  Use quando precisar: executar código, criar scripts, processar dados, etc.
  Retorna: JSON com "success", "output", "code_executed", "errors"
  Exemplo de resposta: {"success": true, "output": "Resultado da execução", "code_executed": "print('Hello')", "errors": []}
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

