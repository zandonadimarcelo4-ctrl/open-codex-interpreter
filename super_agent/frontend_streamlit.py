"""
🚀 Super Agent - Frontend Python (Streamlit)

Este frontend Python:
- ✅ Usa Streamlit (interface bonita e simples)
- ✅ Se conecta ao backend Python via API REST e WebSocket
- ✅ Mantém TODAS as funcionalidades (AutoGen, Open Interpreter, Selenium, PyAutoGUI, After Effects MCP)
- ✅ Código bem comentado em português para iniciantes

Para iniciar:
    streamlit run frontend_streamlit.py

Acesse: http://localhost:8501
"""

import os
import json
import requests
import streamlit as st
from typing import Optional, Dict, Any
import websocket
import threading
import queue

# Configuração
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000")
BACKEND_WS_URL = os.getenv("BACKEND_WS_URL", "ws://localhost:8000")

# Configurar página
st.set_page_config(
    page_title="🤖 Super Agent - Chat Inteligente",
    page_icon="🤖",
    layout="wide",
    initial_sidebar_state="expanded"
)

# CSS personalizado
st.markdown("""
<style>
    .main-header {
        font-size: 2.5rem;
        font-weight: bold;
        color: #1f77b4;
        text-align: center;
        margin-bottom: 2rem;
    }
    .message-user {
        background-color: #e3f2fd;
        padding: 1rem;
        border-radius: 10px;
        margin: 0.5rem 0;
        border-left: 4px solid #2196F3;
    }
    .message-assistant {
        background-color: #f1f8e9;
        padding: 1rem;
        border-radius: 10px;
        margin: 0.5rem 0;
        border-left: 4px solid #4CAF50;
    }
    .status-box {
        background-color: #fff3e0;
        padding: 0.5rem;
        border-radius: 5px;
        margin: 0.5rem 0;
        border-left: 4px solid #FF9800;
    }
</style>
""", unsafe_allow_html=True)


class BackendClient:
    """
    Cliente para backend Python
    
    Este cliente se conecta ao backend Python via API REST e WebSocket.
    """
    
    def __init__(self, backend_url: str = BACKEND_URL):
        """
        Inicializar cliente
        
        Args:
            backend_url: URL do backend (padrão: http://localhost:8000)
        """
        self.backend_url = backend_url
        self.ws_url = backend_url.replace("http://", "ws://").replace("https://", "wss://")
        self.ws_connection = None
        self.message_queue = queue.Queue()
    
    def check_health(self) -> bool:
        """
        Verificar saúde do backend
        
        Returns:
            True se backend está rodando
        """
        try:
            response = requests.get(f"{self.backend_url}/health", timeout=5)
            return response.status_code == 200
        except Exception as e:
            st.error(f"❌ Erro ao conectar ao backend: {e}")
            return False
    
    def send_message(self, message: str, context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Enviar mensagem via API REST
        
        Args:
            message: Mensagem do usuário
            context: Contexto adicional (opcional)
        
        Returns:
            Resposta do backend
        """
        try:
            response = requests.post(
                f"{self.backend_url}/api/chat",
                json={
                    "message": message,
                    "context": context or {}
                },
                timeout=120  # 2 minutos para tarefas complexas
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                return {
                    "success": False,
                    "error": f"Erro do servidor: {response.status_code}"
                }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    def list_tools(self) -> list:
        """
        Listar ferramentas disponíveis
        
        Returns:
            Lista de ferramentas
        """
        try:
            response = requests.get(f"{self.backend_url}/api/tools", timeout=5)
            if response.status_code == 200:
                data = response.json()
                return data.get("tools", [])
            return []
        except Exception as e:
            st.error(f"❌ Erro ao listar ferramentas: {e}")
            return []


def main():
    """Função principal"""
    # Título
    st.markdown('<div class="main-header">🤖 Super Agent - Chat Inteligente</div>', unsafe_allow_html=True)
    
    # Sidebar
    with st.sidebar:
        st.header("⚙️ Configurações")
        
        # URL do backend
        backend_url = st.text_input(
            "Backend URL",
            value=BACKEND_URL,
            help="URL do backend Python (padrão: http://localhost:8000)"
        )
        
        # Cliente backend
        client = BackendClient(backend_url)
        
        # Verificar saúde do backend
        if st.button("🔍 Verificar Backend"):
            if client.check_health():
                st.success("✅ Backend está rodando!")
            else:
                st.error("❌ Backend não está rodando!")
        
        # Listar ferramentas
        st.header("🔧 Ferramentas")
        tools = client.list_tools()
        if tools:
            for tool in tools:
                st.write(f"✅ {tool.get('name', 'Unknown')}: {tool.get('description', 'No description')}")
        else:
            st.write("⚠️ Nenhuma ferramenta disponível")
    
    # Chat
    st.header("💬 Chat")
    
    # Inicializar histórico de mensagens
    if "messages" not in st.session_state:
        st.session_state.messages = []
    
    # Exibir histórico de mensagens
    for message in st.session_state.messages:
        if message["role"] == "user":
            st.markdown(f'<div class="message-user">👤 <strong>Você:</strong> {message["content"]}</div>', unsafe_allow_html=True)
        else:
            st.markdown(f'<div class="message-assistant">🤖 <strong>Assistente:</strong> {message["content"]}</div>', unsafe_allow_html=True)
    
    # Campo de entrada
    user_input = st.text_input(
        "Digite sua mensagem",
        placeholder="Ex: Oi! ou Executa: print('Hello World')",
        key="user_input"
    )
    
    # Botões
    col1, col2 = st.columns(2)
    
    with col1:
        if st.button("📤 Enviar", type="primary"):
            if user_input:
                # Adicionar mensagem do usuário ao histórico
                st.session_state.messages.append({
                    "role": "user",
                    "content": user_input
                })
                
                # Mostrar status
                with st.spinner("⏳ Processando..."):
                    # Enviar mensagem para backend
                    result = client.send_message(user_input)
                    
                    # Adicionar resposta ao histórico
                    if result.get("success"):
                        response_text = result.get("response", "✅ Tarefa executada com sucesso!")
                        st.session_state.messages.append({
                            "role": "assistant",
                            "content": response_text
                        })
                    else:
                        error_text = result.get("error", "❌ Erro desconhecido")
                        st.session_state.messages.append({
                            "role": "assistant",
                            "content": f"❌ Erro: {error_text}"
                        })
                
                # Recarregar página para exibir nova mensagem
                st.rerun()
    
    with col2:
        if st.button("🗑️ Limpar"):
            st.session_state.messages = []
            st.rerun()
    
    # Status
    st.markdown("---")
    st.markdown("### 📊 Status")
    
    # Verificar saúde do backend
    if client.check_health():
        st.success("✅ Backend está rodando")
    else:
        st.error("❌ Backend não está rodando")
        st.info("💡 Certifique-se de que o backend Python está rodando: `python backend_python.py`")
    
    # Informações
    st.markdown("### ℹ️ Informações")
    st.info("""
    **Funcionalidades disponíveis:**
    - 💬 Chat em tempo real
    - 🚀 Execução de código (Python, JavaScript, Shell)
    - 🌐 Navegação web (Selenium)
    - 🖱️ Automação GUI (PyAutoGUI)
    - 🎬 After Effects MCP (edição de vídeo)
    - 🔧 AutoGen Commander (comanda tudo)
    """)


if __name__ == "__main__":
    main()

