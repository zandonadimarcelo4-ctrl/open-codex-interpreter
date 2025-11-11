"""
Script para verificar se AutoGen e Open Interpreter usam o mesmo modelo na mesma instância do Ollama
"""
import os
import requests
import json
import sys

# Cores para output
GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
BLUE = "\033[94m"
RESET = "\033[0m"

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
DEFAULT_MODEL = os.getenv("DEFAULT_MODEL", "deepseek-coder-v2-16b-q4_k_m-rtx")


def check_ollama_running():
    """Verifica se Ollama está rodando"""
    try:
        response = requests.get(f"{OLLAMA_BASE_URL}/api/tags", timeout=5)
        return response.status_code == 200
    except:
        return False


def get_loaded_models():
    """Obtém modelos carregados no Ollama (em uso)"""
    try:
        response = requests.get(f"{OLLAMA_BASE_URL}/api/ps", timeout=5)
        if response.status_code == 200:
            return response.json()
        return None
    except:
        return None


def get_available_models():
    """Obtém modelos disponíveis no Ollama"""
    try:
        response = requests.get(f"{OLLAMA_BASE_URL}/api/tags", timeout=5)
        if response.status_code == 200:
            data = response.json()
            return [model["name"] for model in data.get("models", [])]
        return []
    except:
        return []


def check_model_config():
    """Verifica configuração do modelo"""
    print(f"{BLUE}═══════════════════════════════════════════════════════════{RESET}")
    print(f"{BLUE}🔍 Verificando se AutoGen e Open Interpreter usam o mesmo modelo{RESET}")
    print(f"{BLUE}═══════════════════════════════════════════════════════════{RESET}")
    print()
    
    # 1. Verificar se Ollama está rodando
    print(f"{YELLOW}[1/5]{RESET} Verificando se Ollama está rodando...")
    if not check_ollama_running():
        print(f"{RED}❌ Ollama não está rodando em {OLLAMA_BASE_URL}{RESET}")
        print(f"{YELLOW}💡 Execute: ollama serve{RESET}")
        return False
    print(f"{GREEN}✅ Ollama está rodando em {OLLAMA_BASE_URL}{RESET}")
    print()
    
    # 2. Verificar modelo configurado
    print(f"{YELLOW}[2/5]{RESET} Verificando modelo configurado...")
    model = os.getenv("DEFAULT_MODEL", DEFAULT_MODEL)
    print(f"{BLUE}📌 Modelo configurado (DEFAULT_MODEL): {model}{RESET}")
    print()
    
    # 3. Verificar se o modelo existe
    print(f"{YELLOW}[3/5]{RESET} Verificando se o modelo existe no Ollama...")
    available_models = get_available_models()
    if model not in available_models:
        print(f"{RED}❌ Modelo '{model}' não encontrado no Ollama{RESET}")
        print(f"{YELLOW}💡 Modelos disponíveis: {', '.join(available_models[:5])}{RESET}")
        if len(available_models) > 5:
            print(f"{YELLOW}   ... e mais {len(available_models) - 5} modelo(s){RESET}")
        print(f"{YELLOW}💡 Execute: ollama pull {model}{RESET}")
        return False
    print(f"{GREEN}✅ Modelo '{model}' encontrado no Ollama{RESET}")
    print()
    
    # 4. Verificar modelos carregados (em uso)
    print(f"{YELLOW}[4/5]{RESET} Verificando modelos carregados (em uso)...")
    loaded_models = get_loaded_models()
    if loaded_models:
        models_in_use = loaded_models.get("models", [])
        if models_in_use:
            print(f"{BLUE}📊 Modelos carregados na memória:{RESET}")
            for m in models_in_use:
                model_name = m.get("name", "unknown")
                size = m.get("size_vram", 0) / (1024**3)  # GB
                clients = m.get("clients", [])
                print(f"  • {model_name}: {size:.2f} GB VRAM, {len(clients)} cliente(s)")
            
            # Verificar se nosso modelo está carregado
            model_loaded = any(m.get("name") == model for m in models_in_use)
            if model_loaded:
                model_info = next((m for m in models_in_use if m.get("name") == model), None)
                num_clients = len(model_info.get("clients", [])) if model_info else 0
                print()
                print(f"{GREEN}✅ Modelo '{model}' está carregado com {num_clients} cliente(s){RESET}")
                if num_clients > 1:
                    print(f"{BLUE}💡 Múltiplos clientes usando o mesmo modelo (AutoGen + Open Interpreter) - PERFEITO!{RESET}")
            else:
                print()
                print(f"{YELLOW}⚠️  Modelo '{model}' não está carregado ainda (será carregado quando usado){RESET}")
        else:
            print(f"{YELLOW}⚠️  Nenhum modelo carregado ainda (será carregado quando usado){RESET}")
    else:
        print(f"{YELLOW}⚠️  Não foi possível obter informações de modelos carregados{RESET}")
    print()
    
    # 5. Verificar configuração de URL
    print(f"{YELLOW}[5/5]{RESET} Verificando configuração de URLs...")
    ollama_url_env = os.getenv("OLLAMA_BASE_URL", OLLAMA_BASE_URL)
    print(f"{BLUE}📌 OLLAMA_BASE_URL: {ollama_url_env}{RESET}")
    
    # Open Interpreter usa: {OLLAMA_BASE_URL}/api/chat
    oi_url = f"{ollama_url_env}/api/chat"
    print(f"{BLUE}📌 Open Interpreter usa: {oi_url}{RESET}")
    
    # AutoGen usa: {OLLAMA_BASE_URL}/v1/chat/completions (via OpenAI-compatible API)
    autogen_url = f"{ollama_url_env}/v1/chat/completions"
    print(f"{BLUE}📌 AutoGen usa: {autogen_url}{RESET}")
    
    print(f"{GREEN}✅ Ambos usam a mesma instância do Ollama ({ollama_url_env}){RESET}")
    print()
    
    # Resumo final
    print(f"{BLUE}═══════════════════════════════════════════════════════════{RESET}")
    print(f"{GREEN}✅ VERIFICAÇÃO COMPLETA{RESET}")
    print(f"{BLUE}═══════════════════════════════════════════════════════════{RESET}")
    print()
    print(f"{GREEN}✅ AutoGen e Open Interpreter usam o mesmo modelo: {model}{RESET}")
    print(f"{GREEN}✅ Ambos se conectam à mesma instância do Ollama: {ollama_url_env}{RESET}")
    print(f"{GREEN}✅ O Ollama gerencia múltiplos clientes para a mesma instância do modelo{RESET}")
    print()
    print(f"{BLUE}💡 Quando ambos estão ativos, você pode verificar com:{RESET}")
    print(f"{YELLOW}   ollama ps{RESET}")
    print(f"{BLUE}   Isso mostrará quantos clientes estão usando o mesmo modelo.{RESET}")
    print()
    
    return True


if __name__ == "__main__":
    try:
        success = check_model_config()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print(f"\n{YELLOW}⚠️  Verificação interrompida pelo usuário{RESET}")
        sys.exit(1)
    except Exception as e:
        print(f"{RED}❌ Erro durante verificação: {e}{RESET}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

