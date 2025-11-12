"""
🚀 Super Agent - Versão 100% Python (SIMPLIFICADA para Iniciantes)

Este arquivo contém TUDO que você precisa para usar o Super Agent:
- ✅ AutoGen (comanda tudo)
- ✅ Open Interpreter (execução de código)
- ✅ Selenium (navegação web)
- ✅ PyAutoGUI/UFO (automação GUI)
- ✅ After Effects MCP Vision (edição de vídeo) - OPCIONAL

COMO USAR:
1. Instale as dependências: pip install -r requirements.txt
2. Execute: python app_simples.py
3. Acesse: http://localhost:7860

TUDO está aqui, comentado em português, fácil de entender! 🎉
"""

# ============================================================================
# IMPORTAÇÕES (O que cada biblioteca faz)
# ============================================================================

import os
import logging
import asyncio
from pathlib import Path
from typing import Optional, Dict, Any, List

# Configurar logging (mensagens de debug)
# Isso mostra mensagens no terminal quando o programa roda
logging.basicConfig(
    level=logging.INFO,  # Nível: INFO (mostra informações importantes)
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ----------------------------------------------------------------------------
# GRADIO (Interface Web Simples)
# ----------------------------------------------------------------------------
# Gradio cria uma interface web bonita automaticamente
# Você não precisa saber HTML/CSS/JavaScript - só Python!
try:
    import gradio as gr
    GRADIO_AVAILABLE = True
except ImportError:
    GRADIO_AVAILABLE = False
    logger.warning("⚠️ Gradio não está instalado. Instale com: pip install gradio")

# ----------------------------------------------------------------------------
# AUTOGEN (Comandante Inteligente)
# ----------------------------------------------------------------------------
# AutoGen é o "chefe" que decide qual ferramenta usar
# Ele comanda TUDO: Open Interpreter, Selenium, PyAutoGUI, etc.
try:
    from .core.simple_commander import create_simple_commander
    from autogen_agentchat.teams import RoundRobinGroupChat
    AUTOGEN_AVAILABLE = True
    logger.info("✅ AutoGen disponível")
except ImportError as e:
    AUTOGEN_AVAILABLE = False
    logger.error(f"❌ AutoGen não disponível: {e}")
    logger.error("   Instale com: pip install autogen-agentchat autogen-ext[openai] autogen-ext[ollama]")

# ----------------------------------------------------------------------------
# CLASSIFICADOR DE INTENÇÃO (Opcional)
# ----------------------------------------------------------------------------
# Detecta se a mensagem é uma conversa ou uma ação
# Exemplo: "Oi!" = conversa, "Executa código" = ação
try:
    from interpreter.intent_classifier import classify_intent
    INTENT_CLASSIFIER_AVAILABLE = True
    logger.info("✅ Classificador de intenção disponível")
except ImportError:
    INTENT_CLASSIFIER_AVAILABLE = False
    logger.warning("⚠️ Classificador de intenção não disponível (opcional)")

# ----------------------------------------------------------------------------
# AFTER EFFECTS MCP VISION (Opcional)
# ----------------------------------------------------------------------------
# Permite controlar Adobe After Effects via MCP (Model Context Protocol)
# Você pode criar composições, adicionar camadas, renderizar vídeos, etc.
try:
    from anima.agents.editor_agent_ae import AEMCPClient
    AFTER_EFFECTS_MCP_AVAILABLE = True
    logger.info("✅ After Effects MCP disponível")
except ImportError:
    AFTER_EFFECTS_MCP_AVAILABLE = False
    logger.warning("⚠️ After Effects MCP não disponível (opcional)")

# ============================================================================
# CONFIGURAÇÃO (Variáveis de Ambiente)
# ============================================================================

# Ollama é o servidor que roda os modelos de IA localmente
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")

# Modelo padrão para conversas e raciocínio
DEFAULT_MODEL = os.getenv("DEFAULT_MODEL", "qwen2.5:7b")

# Modelo para execução de código (mais rápido, especializado em código)
EXECUTOR_MODEL = os.getenv("EXECUTOR_MODEL", "qwen2.5-coder:7b")

# Workspace é onde os arquivos são criados/editados
WORKSPACE_PATH = os.getenv("WORKSPACE_PATH", str(Path.cwd() / "workspace"))

# Criar workspace se não existir
workspace = Path(WORKSPACE_PATH)
workspace.mkdir(parents=True, exist_ok=True)
logger.info(f"📁 Workspace: {workspace}")

# ============================================================================
# CLASSE PRINCIPAL (SuperAgentApp)
# ============================================================================

class SuperAgentApp:
    """
    Aplicação Super Agent - Versão Simplificada para Iniciantes
    
    Esta classe faz TUDO:
    1. Inicializa o AutoGen Commander (chefe inteligente)
    2. Detecta a intenção da mensagem (conversa ou ação)
    3. Processa a mensagem (usando AutoGen ou Ollama)
    4. Cria a interface web (Gradio)
    5. Executa a aplicação
    """
    
    def __init__(self):
        """
        Inicializar aplicação
        
        O que acontece aqui:
        1. Cria o AutoGen Commander (se disponível)
        2. Cria o team (grupo de agentes)
        3. Inicializa o histórico de conversas
        """
        # Variáveis da classe
        self.commander = None  # Comandante AutoGen (chefe inteligente)
        self.team = None       # Team de agentes (grupo de trabalho)
        self.history = []      # Histórico de conversas
        
        # Inicializar AutoGen Commander
        if AUTOGEN_AVAILABLE:
            try:
                logger.info("🚀 Inicializando AutoGen Commander...")
                
                # Criar comandante AutoGen
                # Este é o "chefe" que comanda tudo:
                # - Open Interpreter (execução de código)
                # - Selenium (navegação web)
                # - PyAutoGUI/UFO (automação GUI)
                # - After Effects MCP (edição de vídeo) - opcional
                self.commander = create_simple_commander(
                    model=DEFAULT_MODEL,                    # Modelo para raciocínio
                    api_base=OLLAMA_BASE_URL,               # URL do Ollama
                    use_autonomous_agent=True,              # Open Interpreter integrado diretamente
                    workdir=str(workspace),                 # Diretório de trabalho
                    executor_model=EXECUTOR_MODEL,          # Modelo para execução de código
                )
                
                # Criar team com comandante
                # RoundRobinGroupChat = cada agente fala na vez (rodízio)
                self.team = RoundRobinGroupChat(agents=[self.commander])
                
                logger.info("✅ AutoGen Commander inicializado com sucesso")
            except Exception as e:
                logger.error(f"❌ Erro ao inicializar AutoGen Commander: {e}")
                self.commander = None
                self.team = None
        else:
            logger.error("❌ AutoGen não está disponível. Instale com: pip install autogen-agentchat autogen-ext[openai] autogen-ext[ollama]")
    
    def detect_intent_simple(self, message: str) -> Dict[str, Any]:
        """
        Detectar intenção da mensagem (conversa ou ação)
        
        Esta função decide se a mensagem é:
        - CONVERSA: "Oi!", "Como você está?", "O que é Python?"
        - AÇÃO: "Executa código", "Abre o Google", "Tira screenshot"
        
        Args:
            message: Mensagem do usuário
            
        Returns:
            Dicionário com tipo de intenção e confiança
            Exemplo: {"type": "action", "confidence": 0.8, "reason": "Palavra-chave detectada: executa"}
        """
        # Converter mensagem para minúsculas (facilita comparação)
        message_lower = message.lower().strip()
        
        # Palavras-chave de AÇÃO (fazer algo)
        # Se a mensagem contém essas palavras, é uma ação
        action_keywords = [
            "executa", "cria", "edita", "abre", "pesquisa", "navega",
            "clica", "digita", "screenshot", "tira foto", "busca",
            "instala", "desinstala", "executa código", "roda código",
            "renderiza", "cria vídeo", "adiciona camada",  # After Effects
        ]
        
        # Palavras-chave de CONVERSA (só conversar)
        # Se a mensagem contém essas palavras, é uma conversa
        conversation_keywords = [
            "oi", "olá", "tudo bem", "como você está", "qual é",
            "o que é", "explique", "me diga", "me fale", "obrigado"
        ]
        
        # Verificar palavras-chave de AÇÃO
        # Se encontrar uma palavra-chave de ação, retorna "action"
        for keyword in action_keywords:
            if message_lower.startswith(keyword) or keyword in message_lower:
                return {
                    "type": "action",
                    "confidence": 0.8,
                    "reason": f"Palavra-chave detectada: {keyword}"
                }
        
        # Verificar palavras-chave de CONVERSA
        # Se encontrar uma palavra-chave de conversa, retorna "conversation"
        for keyword in conversation_keywords:
            if message_lower.startswith(keyword) or keyword in message_lower:
                return {
                    "type": "conversation",
                    "confidence": 0.8,
                    "reason": f"Palavra-chave detectada: {keyword}"
                }
        
        # Se não encontrou palavra-chave, tentar classificador (se disponível)
        # O classificador usa IA para detectar a intenção (mais preciso)
        if INTENT_CLASSIFIER_AVAILABLE:
            try:
                intent = classify_intent(message)
                return intent
            except Exception as e:
                logger.warning(f"⚠️ Erro ao usar classificador: {e}")
        
        # Padrão: assumir que é conversa
        # Se não conseguiu detectar, assume que é uma conversa
        return {
            "type": "conversation",
            "confidence": 0.5,
            "reason": "Padrão: assumido como conversa"
        }
    
    async def process_message(self, message: str, history: list) -> tuple:
        """
        Processar mensagem do usuário
        
        Esta função faz o seguinte:
        1. Detecta a intenção (conversa ou ação)
        2. Se for AÇÃO → usa AutoGen Commander (executa tarefas)
        3. Se for CONVERSA → usa Ollama diretamente (mais rápido)
        4. Retorna a resposta
        
        Args:
            message: Mensagem do usuário
            history: Histórico de conversas (formato Gradio)
                    Exemplo: [["Oi!", "Olá! Como posso ajudar?"], ["Executa: print('Hello')", "Hello"]]
        
        Returns:
            tuple: (nova_history, resposta)
                   nova_history = histórico atualizado
                   resposta = "" (vazio, porque a resposta já está no histórico)
        """
        # Verificar se a mensagem não está vazia
        if not message or not message.strip():
            return history, "Por favor, digite uma mensagem."
        
        logger.info(f"📨 Mensagem recebida: {message[:50]}...")
        
        # Adicionar mensagem do usuário ao histórico
        # Formato: [mensagem_usuario, resposta_assistente]
        # resposta_assistente = None inicialmente (será preenchido depois)
        history = history or []
        history.append([message, None])
        
        try:
            # 1. DETECTAR INTENÇÃO
            # Decide se é conversa ou ação
            intent = self.detect_intent_simple(message)
            logger.info(f"🎯 Intenção detectada: {intent['type']} (confiança: {intent['confidence']:.2f})")
            
            # 2. PROCESSAR MENSAGEM BASEADO NA INTENÇÃO
            if intent["type"] == "action" and self.team:
                # AÇÃO: usar AutoGen Commander
                # AutoGen comanda TUDO: Open Interpreter, Selenium, PyAutoGUI, etc.
                logger.info("🚀 Processando como ação (AutoGen Commander)...")
                
                try:
                    # Executar tarefa usando AutoGen
                    # O AutoGen decide qual ferramenta usar automaticamente
                    result = await self.team.run(task=message)
                    
                    # Extrair resposta do resultado
                    if result and len(result.messages) > 0:
                        # Pegar a última mensagem (resposta do agente)
                        last_message = result.messages[-1]
                        # Extrair conteúdo da mensagem
                        response = last_message.content if hasattr(last_message, 'content') else str(last_message)
                    else:
                        # Se não houve mensagens, assume sucesso
                        response = "✅ Tarefa executada com sucesso!"
                    
                    logger.info(f"✅ Resposta gerada: {response[:50]}...")
                    
                except Exception as e:
                    # Se der erro, retorna mensagem de erro
                    logger.error(f"❌ Erro ao executar tarefa: {e}")
                    response = f"❌ Erro ao executar tarefa: {str(e)}"
            
            else:
                # CONVERSA: usar Ollama diretamente (mais rápido)
                # Para conversas simples, não precisa do AutoGen
                logger.info("💬 Processando como conversa (Ollama direto)...")
                
                try:
                    import requests
                    
                    # Chamar Ollama diretamente
                    # Ollama é o servidor que roda os modelos de IA
                    response_ollama = requests.post(
                        f"{OLLAMA_BASE_URL}/api/generate",
                        json={
                            "model": DEFAULT_MODEL,  # Modelo a usar
                            "prompt": message,        # Mensagem do usuário
                            "stream": False,          # Não usar streaming (mais simples)
                        },
                        timeout=60  # Timeout de 60 segundos
                    )
                    
                    # Verificar se a resposta foi bem-sucedida
                    if response_ollama.status_code == 200:
                        # Extrair resposta do JSON
                        data = response_ollama.json()
                        response = data.get("response", "Desculpe, não consegui gerar uma resposta.")
                    else:
                        # Se der erro, retorna código de erro
                        response = f"❌ Erro ao chamar Ollama: {response_ollama.status_code}"
                    
                    logger.info(f"✅ Resposta gerada: {response[:50]}...")
                    
                except Exception as e:
                    # Se der erro, retorna mensagem de erro
                    logger.error(f"❌ Erro ao processar conversa: {e}")
                    response = f"❌ Erro ao processar conversa: {str(e)}"
            
            # 3. ATUALIZAR HISTÓRICO
            # Adicionar resposta ao histórico
            history[-1][1] = response
            
            # Retornar histórico atualizado e resposta vazia
            # (resposta vazia porque a resposta já está no histórico)
            return history, ""
            
        except Exception as e:
            # Se der erro em qualquer lugar, retorna mensagem de erro
            logger.error(f"❌ Erro ao processar mensagem: {e}")
            error_response = f"❌ Erro ao processar mensagem: {str(e)}"
            history[-1][1] = error_response
            return history, ""
    
    def create_interface(self):
        """
        Criar interface Gradio (Interface Web)
        
        Gradio cria uma interface web bonita automaticamente.
        Você não precisa saber HTML/CSS/JavaScript - só Python!
        
        Esta função cria:
        - Título e descrição
        - Chat (área de mensagens)
        - Campo de entrada (para digitar mensagens)
        - Botões (Enviar, Limpar)
        - Status (informações sobre o sistema)
        
        Returns:
            Interface Gradio configurada
        """
        if not GRADIO_AVAILABLE:
            raise ImportError("Gradio não está instalado. Instale com: pip install gradio")
        
        # Criar interface de chat
        # gr.Blocks = container principal (caixa que contém tudo)
        # theme=gr.themes.Soft() = tema suave (bonito)
        with gr.Blocks(
            title="🤖 Super Agent - Chat Inteligente",
            theme=gr.themes.Soft(),
        ) as interface:
            
            # TÍTULO E DESCRIÇÃO
            # gr.Markdown = texto formatado (como markdown)
            gr.Markdown("""
            # 🤖 Super Agent - Chat Inteligente
            
            **Versão 100% Python** - Simples para Iniciantes
            
            Este assistente pode:
            - 💬 Conversar com você
            - 🚀 Executar tarefas (código, navegação web, automação GUI)
            - 🔧 Usar AutoGen, Open Interpreter, Selenium, PyAutoGUI
            - 🎬 Editar vídeos (After Effects MCP) - Opcional
            """)
            
            # CHAT (Área de Mensagens)
            # gr.Chatbot = área onde as mensagens aparecem
            chatbot = gr.Chatbot(
                label="Chat",        # Título do chat
                height=500,          # Altura em pixels
                show_label=True,     # Mostrar título
            )
            
            # CAMPO DE ENTRADA (Para Digitar Mensagens)
            # gr.Textbox = campo de texto (para digitar)
            msg = gr.Textbox(
                label="Digite sua mensagem",                    # Título do campo
                placeholder="Ex: Oi! ou Executa: print('Hello World')",  # Texto de exemplo
                lines=2,                                         # Número de linhas
            )
            
            # BOTÕES
            # gr.Row = linha (organiza botões lado a lado)
            with gr.Row():
                # Botão Enviar
                submit_btn = gr.Button("Enviar", variant="primary")  # Botão principal (azul)
                # Botão Limpar
                clear_btn = gr.Button("Limpar")                      # Botão secundário (cinza)
            
            # STATUS (Informações sobre o Sistema)
            # Mostra o status do sistema (AutoGen disponível, workspace, etc.)
            status_text = f"""
            **Status:**
            - ✅ Interface carregada
            - {'✅' if AUTOGEN_AVAILABLE else '❌'} AutoGen: {'Disponível' if AUTOGEN_AVAILABLE else 'Não disponível'}
            - {'✅' if AFTER_EFFECTS_MCP_AVAILABLE else '⚠️'} After Effects MCP: {'Disponível' if AFTER_EFFECTS_MCP_AVAILABLE else 'Não disponível (opcional)'}
            - 📁 Workspace: {workspace}
            """
            status = gr.Markdown(status_text)
            
            # FUNÇÃO PARA ENVIAR MENSAGEM
            # Esta função é chamada quando o usuário clica em "Enviar" ou pressiona Enter
            def user_message(message, history):
                """
                Processar mensagem do usuário
                
                Esta função:
                1. Recebe a mensagem e o histórico
                2. Chama process_message (que é async)
                3. Retorna o histórico atualizado
                
                Args:
                    message: Mensagem do usuário
                    history: Histórico de conversas
                
                Returns:
                    tuple: (nova_history, "")
                           nova_history = histórico atualizado
                           "" = resposta vazia (porque a resposta já está no histórico)
                """
                # Converter para formato async
                # Gradio não suporta async diretamente, então criamos um loop
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
                try:
                    # Executar process_message
                    new_history, _ = loop.run_until_complete(
                        self.process_message(message, history)
                    )
                    # Retornar histórico atualizado e resposta vazia
                    return new_history, ""
                finally:
                    # Fechar loop (importante para não vazar recursos)
                    loop.close()
            
            # CONECTAR EVENTOS
            # Conectar botões e campos à função user_message
            
            # Quando o usuário pressiona Enter no campo de texto
            msg.submit(user_message, [msg, chatbot], [chatbot, msg])
            # Quando o usuário clica no botão "Enviar"
            submit_btn.click(user_message, [msg, chatbot], [chatbot, msg])
            # Quando o usuário clica no botão "Limpar"
            clear_btn.click(lambda: ([], ""), None, [chatbot, msg])
        
        # Retornar interface criada
        return interface
    
    def run(self, server_name: str = "0.0.0.0", server_port: int = 7860, share: bool = False):
        """
        Executar aplicação
        
        Esta função:
        1. Cria a interface Gradio
        2. Inicia o servidor web
        3. Abre no navegador (http://localhost:7860)
        
        Args:
            server_name: Endereço do servidor (padrão: 0.0.0.0 - acessível de qualquer lugar)
            server_port: Porta do servidor (padrão: 7860)
            share: Se True, cria link público (padrão: False)
        """
        if not GRADIO_AVAILABLE:
            logger.error("❌ Gradio não está instalado. Instale com: pip install gradio")
            return
        
        logger.info("🚀 Iniciando Super Agent...")
        logger.info(f"📡 Servidor: {server_name}:{server_port}")
        logger.info(f"🌐 Acesse: http://localhost:{server_port}")
        
        # Criar interface
        interface = self.create_interface()
        
        # Executar interface
        # launch() inicia o servidor web e abre no navegador
        interface.launch(
            server_name=server_name,  # Endereço do servidor
            server_port=server_port,  # Porta do servidor
            share=share,              # Se True, cria link público
        )


# ============================================================================
# FUNÇÃO PRINCIPAL (main)
# ============================================================================

def main():
    """
    Função principal
    
    Esta função:
    1. Cria a aplicação SuperAgentApp
    2. Executa a aplicação
    
    É a função que é chamada quando você executa: python app_simples.py
    """
    # Criar aplicação
    app = SuperAgentApp()
    
    # Executar aplicação
    app.run(
        server_name="0.0.0.0",  # Acessível de qualquer lugar (0.0.0.0 = todas as interfaces)
        server_port=7860,       # Porta 7860 (padrão do Gradio)
        share=False,            # Se True, cria link público (útil para compartilhar)
    )


# ============================================================================
# PONTO DE ENTRADA (Quando o arquivo é executado)
# ============================================================================

if __name__ == "__main__":
    # Quando você executa: python app_simples.py
    # Esta linha chama a função main()
    main()
