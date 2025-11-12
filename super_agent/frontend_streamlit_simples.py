"""
🎨 Frontend Streamlit Simples - Versão Simplificada para Iniciantes

Este é um frontend SIMPLES em Python usando Streamlit.
É perfeito para iniciantes que não sabem React/TypeScript!

COMO USAR:
1. Execute: streamlit run frontend_streamlit_simples.py
2. Acesse: http://localhost:8501

ESTE FRONTEND:
- ✅ Interface simples e clara
- ✅ Fácil de entender (só Python)
- ✅ Perfeito para iniciantes
- ✅ Conecta ao backend Python via API

O BACKEND ESTILO APPLE (React/TypeScript) continua disponível em:
- autogen_agent_interface/ (frontend React estilo Apple)
"""

import streamlit as st
import requests
import json
from typing import Optional, Dict, Any

# Configuração da página
st.set_page_config(
    page_title="🤖 Super Agent - Chat Inteligente",
    page_icon="🤖",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Variáveis de ambiente
BACKEND_URL = st.secrets.get("BACKEND_URL", "http://localhost:8000") if hasattr(st, 'secrets') else "http://localhost:8000"

# CSS customizado (estilo simples e limpo)
st.markdown("""
<style>
    /* Estilo geral */
    .main {
        padding: 2rem;
    }
    
    /* Chat messages */
    .user-message {
        background-color: #007AFF;
        color: white;
        padding: 1rem;
        border-radius: 1rem;
        margin: 0.5rem 0;
        margin-left: 20%;
    }
    
    .assistant-message {
        background-color: #F2F2F7;
        color: black;
        padding: 1rem;
        border-radius: 1rem;
        margin: 0.5rem 0;
        margin-right: 20%;
    }
    
    /* Input area */
    .stTextInput > div > div > input {
        border-radius: 1rem;
        padding: 0.75rem;
    }
    
    /* Buttons */
    .stButton > button {
        border-radius: 0.5rem;
        padding: 0.5rem 1.5rem;
        font-weight: 600;
    }
</style>
""", unsafe_allow_html=True)


def send_message_to_backend(message: str, context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    Enviar mensagem para o backend Python
    
    Args:
        message: Mensagem do usuário
        context: Contexto adicional (opcional)
    
    Returns:
        Resposta do backend
    """
    try:
        # Chamar API do backend
        response = requests.post(
            f"{BACKEND_URL}/api/chat",
            json={
                "message": message,
                "context": context or {}
            },
            timeout=60
        )
        
        if response.status_code == 200:
            return response.json()
        else:
            return {
                "success": False,
                "error": f"Erro ao chamar backend: {response.status_code}"
            }
    except Exception as e:
        return {
            "success": False,
            "error": f"Erro ao conectar com backend: {str(e)}"
        }


def main():
    """Função principal do frontend Streamlit"""
    
    # Título
    st.title("🤖 Super Agent - Chat Inteligente")
    st.markdown("**Versão Streamlit Simples** - Perfeito para Iniciantes")
    
    # Sidebar (informações)
    with st.sidebar:
        st.header("ℹ️ Informações")
        st.markdown("""
        **Este é o frontend SIMPLES:**
        - ✅ Interface clara e fácil
        - ✅ Só Python (sem React/TypeScript)
        - ✅ Perfeito para iniciantes
        
        **Funcionalidades:**
        - 💬 Conversar
        - 🚀 Executar tarefas
        - 🔧 AutoGen, Open Interpreter, Selenium, PyAutoGUI
        - 🎬 After Effects MCP (opcional)
        """)
        
        st.markdown("---")
        st.markdown("**📡 Backend:**")
        st.code(BACKEND_URL)
        
        st.markdown("---")
        st.markdown("**🎨 Frontend Apple:**")
        st.markdown("Para usar o frontend estilo Apple (React/TypeScript), acesse:")
        st.code("http://localhost:3000")
    
    # Inicializar histórico de mensagens
    if "messages" not in st.session_state:
        st.session_state.messages = [
            {
                "role": "assistant",
                "content": "Olá! Sou seu Super Agent. Como posso ajudar você hoje?"
            }
        ]
    
    # Mostrar histórico de mensagens
    for message in st.session_state.messages:
        with st.chat_message(message["role"]):
            st.markdown(message["content"])
    
    # Campo de entrada
    user_input = st.chat_input("Digite sua mensagem...")
    
    # Processar mensagem do usuário
    if user_input:
        # Adicionar mensagem do usuário ao histórico
        st.session_state.messages.append({
            "role": "user",
            "content": user_input
        })
        
        # Mostrar mensagem do usuário
        with st.chat_message("user"):
            st.markdown(user_input)
        
        # Processar mensagem (chamar backend)
        with st.chat_message("assistant"):
            with st.spinner("Processando..."):
                # Chamar backend
                result = send_message_to_backend(user_input)
                
                # Verificar resultado
                if result.get("success"):
                    response_text = result.get("response", "Desculpe, não consegui gerar uma resposta.")
                else:
                    response_text = f"❌ Erro: {result.get('error', 'Erro desconhecido')}"
                
                # Mostrar resposta
                st.markdown(response_text)
                
                # Adicionar resposta ao histórico
                st.session_state.messages.append({
                    "role": "assistant",
                    "content": response_text
                })


if __name__ == "__main__":
    main()

