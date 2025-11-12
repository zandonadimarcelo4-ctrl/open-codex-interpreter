"""
AutoGen Commander Simplificado
AutoGen = Chefe que decide qual ferramenta usar
Open Interpreter = Apenas uma das ferramentas (tool) registradas
Todas usam o mesmo modelo DeepSeek via Ollama
"""
import os
import logging
from pathlib import Path
from typing import Optional, List, Dict, Any

logger = logging.getLogger(__name__)

try:
    from autogen_agentchat.agents import AssistantAgent
    from autogen_ext.models.openai import OpenAIChatCompletionClient
    AUTOGEN_V2_AVAILABLE = True
except ImportError:
    AUTOGEN_V2_AVAILABLE = False
    logger.error("autogen-agentchat não está instalado. Execute: pip install autogen-agentchat autogen-ext[openai]")

# Ollama Client
try:
    from autogen_ext.models.ollama import OllamaChatCompletionClient
    OLLAMA_CLIENT_AVAILABLE = True
except ImportError:
    OLLAMA_CLIENT_AVAILABLE = False
    logger.warning("OllamaChatCompletionClient não disponível. Instale: pip install autogen-ext[ollama]")

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

# Web Browsing Tool (Selenium)
try:
    from ..tools.web_browsing import WebBrowsingTool
    WEB_BROWSING_TOOL_AVAILABLE = True
    logger.info("✅ Web Browsing Tool disponível (Selenium)")
except ImportError:
    WEB_BROWSING_TOOL_AVAILABLE = False
    logger.warning("⚠️ Web Browsing Tool não disponível")

# GUI Automation Tool (UFO + PyAutoGUI)
try:
    from ..tools.gui_automation import GUIAutomationTool
    GUI_AUTOMATION_TOOL_AVAILABLE = True
    logger.info("✅ GUI Automation Tool disponível (PyAutoGUI)")
except ImportError:
    GUI_AUTOMATION_TOOL_AVAILABLE = False
    logger.warning("⚠️ GUI Automation Tool não disponível")

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
    # Arquitetura híbrida: Qwen32B-MoE (cérebro) + Qwen14B-Coder ou DeepSeek-Lite (executor)
    # Usar modelo padrão que provavelmente está instalado
    brain_model = model or os.getenv("DEFAULT_MODEL", "qwen2.5:7b")
    
    # Obter modelo executor (para tarefas de código)
    executor_model = executor_model or os.getenv("EXECUTOR_MODEL", "qwen2.5-coder:7b")
    
    # Obter API base do ambiente
    api_base = api_base or os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    
    # Garantir formato correto da URL
    api_base = api_base.rstrip("/").rstrip("/v1").rstrip("/api")
    api_url = f"{api_base}/v1"
    
    # Inicializar gerenciador de modelos e roteador (se disponível)
    # PRIORIDADE: HybridModelManager (Cloud + Local com fallback)
    # FALLBACK: ModelManager (Local apenas, modo alternado)
    model_manager = None
    router = None
    hybrid_manager = None
    
    # Tentar usar HybridModelManager (Cloud + Local)
    try:
        from .hybrid_model_manager import get_hybrid_model_manager
        hybrid_manager = get_hybrid_model_manager()
        if hybrid_manager and hybrid_manager.cloud_enabled:
            logger.info(f"✅ Gerenciamento híbrido habilitado (Cloud + Local com fallback)")
            logger.info(f"   Cloud: {hybrid_manager.cloud_model}")
            logger.info(f"   Local Brain: {hybrid_manager.local_brain_model}")
            logger.info(f"   Local Executor: {hybrid_manager.local_executor_model}")
            logger.info(f"   ✅ Fallback automático: Cloud → Local")
        else:
            hybrid_manager = None
    except Exception as e:
        logger.warning(f"⚠️ Erro ao inicializar gerenciador híbrido: {e}")
        hybrid_manager = None
    
    # Fallback: ModelManager (Local apenas, modo alternado)
    MODEL_MANAGEMENT_AVAILABLE = False
    try:
        from .model_manager import get_model_manager
        from .intelligent_router import get_router
        MODEL_MANAGEMENT_AVAILABLE = True
    except ImportError:
        MODEL_MANAGEMENT_AVAILABLE = False
    
    if not hybrid_manager and MODEL_MANAGEMENT_AVAILABLE:
        try:
            model_manager = get_model_manager()
            router = get_router()
            logger.info(f"✅ Gerenciamento de modelos habilitado (modo alternado - Local apenas)")
            logger.info(f"   Brain: {brain_model}")
            logger.info(f"   Executor: {executor_model}")
            logger.info(f"   ✅ Alternância automática para caber em 16GB VRAM")
        except Exception as e:
            logger.warning(f"⚠️ Erro ao inicializar gerenciador de modelos: {e}")
            model_manager = None
            router = None
    
    # Criar cliente LLM dinâmico (será alternado conforme necessidade)
    # Inicialmente usa Brain (mais inteligente)
    # Usar OllamaChatCompletionClient se disponível (melhor para Ollama)
    if OLLAMA_CLIENT_AVAILABLE:
        llm_client = OllamaChatCompletionClient(
            model=brain_model,  # OllamaChatCompletionClient não precisa do prefixo "ollama/"
            base_url=api_base,  # OllamaChatCompletionClient adiciona /v1 automaticamente
        )
        logger.info(f"✅ Usando OllamaChatCompletionClient (nativo)")
    else:
        # Fallback: usar OpenAIChatCompletionClient com formato Ollama
        llm_client = OpenAIChatCompletionClient(
            model=f"ollama/{brain_model}",  # Formato: ollama/nome-do-modelo
            api_base=api_url,
        )
        logger.info(f"✅ Usando OpenAIChatCompletionClient (fallback)")
    
    logger.info(f"✅ AutoGen Commander criado")
    logger.info(f"   Modelo Brain: {brain_model}")
    logger.info(f"   Modelo Executor: {executor_model}")
    logger.info(f"   API URL: {api_url}")
    logger.info(f"   Modo: {'Autonomous Agent' if use_autonomous_agent else 'TOOL (recomendado)'}")
    logger.info(f"   Orquestração: {'Inteligente (alternância automática)' if model_manager else 'Fixo (modelo único)'}")
    
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
                Garante retorno JSON válido
                """
                import asyncio
                import json
                
                try:
                    # Validar task
                    if not isinstance(task, str):
                        task = str(task) if task else ""
                    
                    if not task or not task.strip():
                        logger.warning("⚠️ Task vazia no autonomous_agent_tool")
                        return json.dumps({
                            "success": False,
                            "output": "",
                            "code_executed": "",
                            "errors": ["Task vazia ou inválida"],
                        }, ensure_ascii=False)
                    
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
                    
                    # Garantir que response é string válida
                    if response is None:
                        response = "Execução concluída sem resposta"
                    elif not isinstance(response, str):
                        response = str(response)
                    
                    # Retornar JSON estruturado - validar antes
                    result = {
                        "success": True,
                        "output": response,
                        "code_executed": "",
                        "errors": []
                    }
                    json_str = json.dumps(result, ensure_ascii=False)
                    # Validar JSON
                    json.loads(json_str)
                    return json_str
                    
                except Exception as e:
                    logger.error(f"❌ Erro no agente autônomo: {e}", exc_info=True)
                    import json
                    import traceback
                    try:
                        result = {
                            "success": False,
                            "output": "",
                            "code_executed": "",
                            "errors": [str(e), str(traceback.format_exc())]
                        }
                        json_str = json.dumps(result, ensure_ascii=False)
                        # Validar JSON
                        json.loads(json_str)
                        return json_str
                    except Exception as json_error:
                        # Se até isso falhar, retornar JSON mínimo
                        logger.error(f"❌ Erro crítico ao criar JSON de erro: {json_error}")
                        return json.dumps({
                            "success": False,
                            "output": "",
                            "code_executed": "",
                            "errors": [str(e), "Erro ao criar JSON de erro"],
                        }, ensure_ascii=False)
            
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
            
            logger.info(f"✅ AutonomousInterpreterAgent criado (OPEN INTERPRETER INTEGRADO DIRETAMENTE)")
            logger.info(f"   ✅ Open Interpreter integrado na lógica do agente (não como ferramenta)")
            logger.info(f"   ✅ AutoGen comanda TUDO - Open Interpreter executa diretamente")
            logger.info(f"   ✅ Autonomia total, auto-correção, loop de feedback")
            logger.info(f"   ✅ Zero overhead (mesmo processo)")
            logger.info(f"   ✅ Workdir: {workdir}")
            
            # Adicionar Web Browsing Tool também (para navegação web)
            # AutoGen comanda TUDO - Web Browsing é uma ferramenta adicional
            if WEB_BROWSING_TOOL_AVAILABLE:
                try:
                    web_browsing_tool = WebBrowsingTool(headless=False, browser="chrome")
                    def web_browsing_tool_wrapper(action: str, **kwargs) -> str:
                        """Wrapper para WebBrowsingTool"""
                        import json
                        try:
                            result = web_browsing_tool.execute(action, **kwargs)
                            return json.dumps(result, ensure_ascii=False)
                        except Exception as e:
                            logger.error(f"Erro ao executar ação web '{action}': {e}")
                            return json.dumps({"success": False, "error": str(e)}, ensure_ascii=False)
                    
                    tool_schema = web_browsing_tool.get_function_schema()
                    tools.append({
                        "type": "function",
                        "function": {
                            "name": tool_schema["name"],
                            "description": tool_schema["description"],
                            "parameters": tool_schema["parameters"],
                        },
                        "func": web_browsing_tool_wrapper,
                    })
                    logger.info(f"✅ Web Browsing Tool registrada (Selenium - navegação web)")
                except Exception as e:
                    logger.warning(f"⚠️ Falha ao registrar Web Browsing tool: {e}")
            
            # Adicionar GUI Automation Tool também (para interagir com o computador)
            if GUI_AUTOMATION_TOOL_AVAILABLE:
                try:
                    gui_automation_tool = GUIAutomationTool(workspace=Path(workdir) / "gui_workspace" if workdir else None)
                    def gui_automation_tool_wrapper(action: str, **kwargs) -> str:
                        """Wrapper para GUIAutomationTool"""
                        import json
                        try:
                            result = gui_automation_tool.execute(action, **kwargs)
                            return json.dumps(result, ensure_ascii=False)
                        except Exception as e:
                            logger.error(f"Erro ao executar ação GUI '{action}': {e}")
                            return json.dumps({"success": False, "error": str(e)}, ensure_ascii=False)
                    
                    tool_schema = gui_automation_tool.get_function_schema()
                    tools.append({
                        "type": "function",
                        "function": {
                            "name": tool_schema["name"],
                            "description": tool_schema["description"],
                            "parameters": tool_schema["parameters"],
                        },
                        "func": gui_automation_tool_wrapper,
                    })
                    logger.info(f"✅ GUI Automation Tool registrada (PyAutoGUI)")
                except Exception as e:
                    logger.warning(f"⚠️ Falha ao registrar GUI Automation tool: {e}")
            
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
    
    # Web Browsing Tool (Selenium) - para navegação web e automação
    if WEB_BROWSING_TOOL_AVAILABLE:
        try:
            web_browsing_tool = WebBrowsingTool(headless=False, browser="chrome")
            # Criar wrapper para AutoGen v2 (formato OpenAI function calling)
            def web_browsing_tool_wrapper(action: str, **kwargs) -> str:
                """
                Wrapper para WebBrowsingTool no formato AutoGen v2
                """
                import json
                try:
                    result = web_browsing_tool.execute(action, **kwargs)
                    return json.dumps(result, ensure_ascii=False)
                except Exception as e:
                    logger.error(f"Erro ao executar ação web '{action}': {e}")
                    return json.dumps({
                        "success": False,
                        "error": str(e)
                    }, ensure_ascii=False)
            
            # Obter schema da ferramenta
            tool_schema = web_browsing_tool.get_function_schema()
            
            # Adicionar função ao schema
            tools.append({
                "type": "function",
                "function": {
                    "name": tool_schema["name"],
                    "description": tool_schema["description"],
                    "parameters": tool_schema["parameters"],
                },
                "func": web_browsing_tool_wrapper,
            })
            logger.info(f"✅ Tool registrada: web_browsing (Selenium - navegação web completa)")
        except Exception as e:
            logger.warning(f"⚠️ Falha ao registrar Web Browsing tool: {e}")
    
    # GUI Automation Tool (PyAutoGUI) - para interagir com o computador (digitar, clicar, etc.)
    if GUI_AUTOMATION_TOOL_AVAILABLE:
        try:
            gui_automation_tool = GUIAutomationTool(workspace=Path(workdir) / "gui_workspace" if workdir else None)
            # Criar wrapper para AutoGen v2 (formato OpenAI function calling)
            def gui_automation_tool_wrapper(action: str, **kwargs) -> str:
                """
                Wrapper para GUIAutomationTool no formato AutoGen v2
                """
                import json
                try:
                    result = gui_automation_tool.execute(action, **kwargs)
                    return json.dumps(result, ensure_ascii=False)
                except Exception as e:
                    logger.error(f"Erro ao executar ação GUI '{action}': {e}")
                    return json.dumps({
                        "success": False,
                        "error": str(e)
                    }, ensure_ascii=False)
            
            # Obter schema da ferramenta
            tool_schema = gui_automation_tool.get_function_schema()
            
            # Adicionar função ao schema
            tools.append({
                "type": "function",
                "function": {
                    "name": tool_schema["name"],
                    "description": tool_schema["description"],
                    "parameters": tool_schema["parameters"],
                },
                "func": gui_automation_tool_wrapper,
            })
            logger.info(f"✅ Tool registrada: gui_automation (PyAutoGUI - automação GUI completa)")
        except Exception as e:
            logger.warning(f"⚠️ Falha ao registrar GUI Automation tool: {e}")
    
    # Mensagem do sistema para o AutoGen
    if use_autonomous_agent and AUTONOMOUS_AGENT_AVAILABLE:
        system_message = """Você é o Comandante AutoGen: um chefe inteligente que comanda TUDO.

⚠️ IMPORTANTE: Open Interpreter está INTEGRADO DIRETAMENTE na sua lógica (não é uma ferramenta).
Você TEM acesso completo ao Open Interpreter que pode:
- Executar código Python, JavaScript, Shell, etc.
- Criar e editar arquivos
- Executar comandos do sistema
- Processar dados
- Raciocinar e corrigir erros automaticamente
- Loop de feedback e auto-correção

SUA FUNÇÃO:
- Analisar a tarefa do usuário
- Usar o Open Interpreter integrado diretamente para executar código
- Usar ferramentas adicionais (Web Browsing, GUI Automation) quando necessário
- Coordenar múltiplas ações se necessário
- Retornar o resultado final

PROTOCOLO DE COMUNICAÇÃO:
- Open Interpreter está integrado - você pode executar código diretamente
- Ferramentas adicionais retornam resultados em formato JSON estruturado
- Formato de resposta: {"success": true/false, "output": "...", "code_executed": "...", "errors": [...]}
- Sempre valide a resposta antes de processar
- Se "success" for false, verifique o campo "errors" para entender o problema

FERRAMENTAS DISPONÍVEIS:
"""
    else:
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
⚠️ OPEN INTERPRETER INTEGRADO DIRETAMENTE (não é uma ferramenta):
- Open Interpreter está integrado na sua lógica - você TEM acesso completo
- Você pode executar código Python, JavaScript, Shell, etc. diretamente
- Você pode criar e editar arquivos diretamente
- Você pode executar comandos do sistema diretamente
- Raciocina e corrige erros automaticamente
- Loop de feedback e auto-correção
- Funcionalidades: Python interativo, active line tracking, output truncation, auto-correção, loop de feedback

EXECUÇÃO DIRETA (sem chamar ferramenta):
- Para executar código: Use o Open Interpreter integrado diretamente
- Para criar arquivos: Use o Open Interpreter integrado diretamente
- Para executar comandos: Use o Open Interpreter integrado diretamente

FERRAMENTAS ADICIONAIS (para casos específicos):

1. **web_browsing** (Selenium) - Navegação web completa:
   - Use quando precisar navegar na web, preencher formulários, fazer scraping
   - Ações: navigate_to, click_element, fill_field, get_page_content, take_screenshot, execute_javascript
   - Exemplo: "Abra o Google e pesquise por 'paralelepipedo'"
   - Exemplo: "Navegue para https://example.com e clique no botão 'Login'"

2. **gui_automation** (PyAutoGUI) - Automação GUI completa:
   - Use quando precisar interagir com aplicativos desktop, digitar, clicar, mover mouse
   - Ações disponíveis:
     * screenshot: Capturar screenshot da tela
     * click: Clicar em coordenadas (x, y)
     * double_click: Duplo clique
     * right_click: Clique direito
     * type: Digitar texto
     * press_key: Pressionar tecla (ex: 'enter', 'tab', 'ctrl')
     * hotkey: Combinar teclas (ex: ['ctrl', 'c'])
     * scroll: Fazer scroll (up/down)
     * drag: Arrastar de (x1, y1) para (x2, y2)
     * move_mouse: Mover mouse para coordenadas
     * get_mouse_position: Obter posição atual do mouse
     * locate_on_screen: Localizar imagem na tela
     * get_window_list: Listar janelas abertas
     * activate_window: Ativar janela por título
     * execute_task: Executar tarefa complexa descrita em linguagem natural
   - Exemplos:
     * "Tire um screenshot da tela"
     * "Digite 'Olá mundo' no campo ativo"
     * "Clique nas coordenadas (100, 200)"
     * "Pressione Enter"
     * "Faça scroll para baixo 3 vezes"
     * "Localize a imagem 'botao.png' na tela e clique nela"
     * "Ative a janela 'Notepad'"
     * "Execute a tarefa: Abra o Bloco de Notas e digite 'Olá'"
     * "Execute tarefa com análise visual: gui_automation(action='execute_task', task='Abra o Notepad')"
   
   **Análise Visual (UFO-style) - AUTOMÁTICA**: 
   - O UFO usa automaticamente modelos de visão (LLaVA 7B por padrão) para analisar a tela e executar tarefas
   - Captura screenshot, analisa com modelo de visão, planeja ações e executa automaticamente
   - Modelo padrão: llava:7b (configure VISION_MODEL para usar outro modelo)
   - Exemplo: gui_automation(action="execute_task", task="Abra o Bloco de Notas e digite 'Olá'")
   - O UFO automaticamente: 1) Captura screenshot, 2) Analisa com LLaVA, 3) Planeja ações, 4) Executa
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
    
    # Adicionar descrição da Web Browsing Tool
    if WEB_BROWSING_TOOL_AVAILABLE:
        system_message += """
- web_browsing: Navegação web completa usando Selenium
  Funcionalidades: navegar para URLs, clicar em elementos, preencher formulários, fazer scraping, capturar screenshots, executar JavaScript, etc.
  Use quando precisar: abrir sites, pesquisar na web, interagir com páginas web, fazer scraping, etc.
  Ações disponíveis: navigate_to, click_by_xpath, click_by_id, fill_form, fill_form_by_id, submit_form, get_page_content, take_screenshot, wait_for_element, execute_javascript, etc.
  Retorna: JSON com "success", "message", "data" (se aplicável), "error" (se falhar)
  Exemplo para abrir Google e pesquisar:
    1. web_browsing(action="navigate_to", url="https://www.google.com")
    2. web_browsing(action="wait_for_element", xpath="//input[@name='q']")
    3. web_browsing(action="fill_form_by_id", id="APjFqb", text="paralelepipedo")
    4. web_browsing(action="press_key", key="enter", xpath="//input[@name='q']")
"""
    
    # Adicionar descrição da GUI Automation Tool
    if GUI_AUTOMATION_TOOL_AVAILABLE:
        system_message += """
- gui_automation: Automação GUI completa usando PyAutoGUI
  Funcionalidades: capturar screenshots, clicar, digitar, pressionar teclas, fazer scroll, arrastar, mover mouse, localizar imagens, gerenciar janelas, etc.
  Use quando precisar: interagir com aplicativos desktop, digitar texto, clicar em elementos, mover mouse, capturar tela, etc.
  Ações disponíveis: screenshot, click, double_click, right_click, type, press_key, hotkey, scroll, drag, move_mouse, get_mouse_position, locate_on_screen, get_window_list, activate_window, execute_task
  Retorna: JSON com "success", "message", "data" (se aplicável), "error" (se falhar)
  Exemplos:
    - gui_automation(action="screenshot") - Capturar screenshot da tela
    - gui_automation(action="type", text="Olá mundo") - Digitar texto
    - gui_automation(action="click", x=100, y=200) - Clicar em coordenadas
    - gui_automation(action="press_key", key="enter") - Pressionar Enter
    - gui_automation(action="hotkey", keys=["ctrl", "c"]) - Copiar (Ctrl+C)
    - gui_automation(action="scroll", clicks=3, direction="down") - Scroll para baixo
    - gui_automation(action="get_window_list") - Listar janelas abertas
    - gui_automation(action="activate_window", title="Notepad") - Ativar janela
    - gui_automation(action="execute_task", task="Abra o Bloco de Notas e digite 'Olá'") - Executar tarefa complexa com análise visual automática
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
- Usuário: "Abre o Google e pesquisa por 'paralelepipedo'"
  → Você: 
     1. Chama web_browsing(action="navigate_to", url="https://www.google.com")
     2. Chama web_browsing(action="wait_for_element", xpath="//input[@name='q']", timeout=10)
     3. Chama web_browsing(action="fill_form_by_id", id="APjFqb", text="paralelepipedo")
     4. Chama web_browsing(action="press_key", key="enter", xpath="//input[@name='q']")
  → Resposta: {"success": true, "message": "Pesquisa realizada com sucesso"}
  → Você: "✅ Google aberto e pesquisa por 'paralelepipedo' realizada com sucesso!"

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

