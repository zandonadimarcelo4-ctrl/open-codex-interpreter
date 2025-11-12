#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
🚀 Script para Iniciar Servidores e Fazer Build

Este script:
- ✅ Faz build do frontend React (Apple)
- ✅ Inicia o backend Python (FastAPI)
- ✅ Inicia o servidor TypeScript (que serve o frontend React)
- ✅ Opcionalmente inicia o frontend Streamlit (básico)
- ✅ Gerencia processos de forma organizada
- ✅ Código bem comentado em português para iniciantes

Uso:
    python iniciar_servidor.py [--streamlit] [--no-build] [--no-backend] [--no-frontend]

Opções:
    --streamlit     Inicia também o frontend Streamlit
    --no-build      Não faz build do frontend React (usa build existente)
    --no-backend    Não inicia o backend Python
    --no-frontend   Não inicia o servidor TypeScript (frontend React)
"""

import os
import sys
import subprocess
import signal
import time
import argparse
from pathlib import Path
from typing import List, Optional
import platform

# Cores para terminal (Windows/Linux/Mac)
class Colors:
    """Cores para terminal"""
    RESET = '\033[0m'
    BOLD = '\033[1m'
    RED = '\033[91m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    MAGENTA = '\033[95m'
    CYAN = '\033[96m'
    
    @staticmethod
    def disable():
        """Desabilita cores (Windows sem suporte)"""
        Colors.RESET = ''
        Colors.BOLD = ''
        Colors.RED = ''
        Colors.GREEN = ''
        Colors.YELLOW = ''
        Colors.BLUE = ''
        Colors.MAGENTA = ''
        Colors.CYAN = ''

# Desabilitar cores no Windows se necessário
if platform.system() == 'Windows':
    try:
        import colorama
        colorama.init()
    except ImportError:
        Colors.disable()

# Diretório raiz do projeto
ROOT = Path(__file__).parent
os.chdir(ROOT)

# Caminhos importantes
BACKEND_PYTHON = ROOT / "super_agent" / "backend_python.py"
FRONTEND_STREAMLIT = ROOT / "super_agent" / "frontend_streamlit.py"
FRONTEND_REACT = ROOT / "autogen_agent_interface"
SERVER_TYPESCRIPT = ROOT / "autogen_agent_interface"

# Processos em execução
processes: List[subprocess.Popen] = []

def print_info(message: str):
    """Imprime mensagem informativa"""
    print(f"{Colors.CYAN}[INFO]{Colors.RESET} {message}")

def print_success(message: str):
    """Imprime mensagem de sucesso"""
    print(f"{Colors.GREEN}[OK]{Colors.RESET} {message}")

def print_error(message: str):
    """Imprime mensagem de erro"""
    print(f"{Colors.RED}[ERRO]{Colors.RESET} {message}")

def print_warning(message: str):
    """Imprime mensagem de aviso"""
    print(f"{Colors.YELLOW}[AVISO]{Colors.RESET} {message}")

def check_command(command: str) -> bool:
    """Verifica se um comando está disponível"""
    try:
        subprocess.run(
            [command, "--version"],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            check=True
        )
        return True
    except (subprocess.CalledProcessError, FileNotFoundError):
        return False

def find_node_manager() -> Optional[str]:
    """Encontra o gerenciador de pacotes Node.js (pnpm ou npm)"""
    if check_command("pnpm"):
        return "pnpm"
    elif check_command("npm"):
        return "npm"
    else:
        return None

def check_dependencies():
    """Verifica se as dependências estão instaladas"""
    print_info("Verificando dependências...")
    
    # Verificar Python
    if not check_command("python") and not check_command("python3"):
        print_error("Python não encontrado. Instale Python 3.10+")
        return False
    
    # Verificar Node.js
    if not check_command("node"):
        print_error("Node.js não encontrado. Instale Node.js 20+")
        return False
    
    # Verificar gerenciador de pacotes
    node_manager = find_node_manager()
    if not node_manager:
        print_error("pnpm ou npm não encontrado. Instale pnpm ou npm")
        return False
    
    print_success(f"Node.js encontrado: {node_manager}")
    
    # Verificar se dependências Python estão instaladas
    try:
        import fastapi
        import uvicorn
        print_success("FastAPI e uvicorn encontrados")
    except ImportError:
        print_warning("FastAPI não encontrado. Instale com: pip install fastapi uvicorn")
    
    # Verificar se dependências Node.js estão instaladas
    node_modules = FRONTEND_REACT / "node_modules"
    if not node_modules.exists():
        print_warning("Dependências Node.js não instaladas. Instalando...")
        if node_manager == "pnpm":
            subprocess.run(["pnpm", "install"], cwd=FRONTEND_REACT, check=True)
        else:
            subprocess.run(["npm", "install"], cwd=FRONTEND_REACT, check=True)
        print_success("Dependências Node.js instaladas")
    
    return True

def build_frontend_react(node_manager: str) -> bool:
    """Faz build do frontend React (Apple)"""
    print_info("Fazendo build do frontend React (Apple)...")
    
    try:
        # Fazer build
        if node_manager == "pnpm":
            result = subprocess.run(
                ["pnpm", "build"],
                cwd=FRONTEND_REACT,
                check=True,
                capture_output=True,
                text=True
            )
        else:
            result = subprocess.run(
                ["npm", "run", "build"],
                cwd=FRONTEND_REACT,
                check=True,
                capture_output=True,
                text=True
            )
        
        print_success("Build do frontend React concluído")
        return True
    except subprocess.CalledProcessError as e:
        print_error(f"Erro ao fazer build do frontend React: {e}")
        print_error(f"Output: {e.stdout}")
        print_error(f"Erro: {e.stderr}")
        return False

def start_backend_python() -> Optional[subprocess.Popen]:
    """Inicia o backend Python (FastAPI)"""
    print_info("Iniciando backend Python (FastAPI)...")
    
    # Verificar se a porta 8000 está em uso
    if check_port(8000):
        print_warning("Porta 8000 já está em uso. Tentando iniciar mesmo assim...")
    
    try:
        # Iniciar backend Python
        process = subprocess.Popen(
            [sys.executable, str(BACKEND_PYTHON)],
            cwd=ROOT,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1,
            universal_newlines=True
        )
        
        # Aguardar porta ficar disponível
        if wait_for_port(8000, timeout=10, name="Backend Python"):
            print_success("Backend Python iniciado (http://localhost:8000)")
            return process
        else:
            print_error("Backend Python não iniciou corretamente")
            process.terminate()
            return None
    except Exception as e:
        print_error(f"Erro ao iniciar backend Python: {e}")
        return None

def start_server_typescript(node_manager: str) -> Optional[subprocess.Popen]:
    """Inicia o servidor TypeScript (que serve o frontend React)"""
    print_info("Iniciando servidor TypeScript (frontend React)...")
    
    # Verificar se a porta 3000 está em uso
    if check_port(3000):
        print_warning("Porta 3000 já está em uso. Tentando iniciar mesmo assim...")
    
    try:
        # Iniciar servidor TypeScript
        if node_manager == "pnpm":
            process = subprocess.Popen(
                ["pnpm", "dev"],
                cwd=SERVER_TYPESCRIPT,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
                bufsize=1,
                universal_newlines=True
            )
        else:
            process = subprocess.Popen(
                ["npm", "run", "dev"],
                cwd=SERVER_TYPESCRIPT,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
                bufsize=1,
                universal_newlines=True
            )
        
        # Aguardar porta ficar disponível
        if wait_for_port(3000, timeout=15, name="Servidor TypeScript"):
            print_success("Servidor TypeScript iniciado (http://localhost:3000)")
            return process
        else:
            print_error("Servidor TypeScript não iniciou corretamente")
            process.terminate()
            return None
    except Exception as e:
        print_error(f"Erro ao iniciar servidor TypeScript: {e}")
        return None

def start_frontend_streamlit() -> Optional[subprocess.Popen]:
    """Inicia o frontend Streamlit (básico)"""
    print_info("Iniciando frontend Streamlit (básico)...")
    
    # Verificar se a porta 8501 está em uso
    if check_port(8501):
        print_warning("Porta 8501 já está em uso. Tentando iniciar mesmo assim...")
    
    try:
        # Verificar se streamlit está instalado
        try:
            import streamlit
        except ImportError:
            print_error("Streamlit não encontrado. Instale com: pip install streamlit")
            return None
        
        # Iniciar frontend Streamlit
        process = subprocess.Popen(
            [sys.executable, "-m", "streamlit", "run", str(FRONTEND_STREAMLIT)],
            cwd=ROOT,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1,
            universal_newlines=True
        )
        
        # Aguardar porta ficar disponível
        if wait_for_port(8501, timeout=10, name="Frontend Streamlit"):
            print_success("Frontend Streamlit iniciado (http://localhost:8501)")
            return process
        else:
            print_error("Frontend Streamlit não iniciou corretamente")
            process.terminate()
            return None
    except Exception as e:
        print_error(f"Erro ao iniciar frontend Streamlit: {e}")
        return None

def check_port(port: int) -> bool:
    """Verifica se uma porta está em uso"""
    import socket
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.settimeout(1)
            result = s.connect_ex(('localhost', port))
            return result == 0
    except Exception:
        return False

def wait_for_port(port: int, timeout: int = 30, name: str = "") -> bool:
    """Aguarda uma porta ficar disponível"""
    print_info(f"Aguardando {name} na porta {port}...")
    start_time = time.time()
    while time.time() - start_time < timeout:
        if check_port(port):
            print_success(f"{name} está rodando na porta {port}")
            return True
        time.sleep(1)
    print_error(f"{name} não iniciou na porta {port} dentro do tempo limite")
    return False

def signal_handler(sig, frame):
    """Handler para sinal de interrupção (Ctrl+C)"""
    print_info("\nEncerrando servidores...")
    
    # Encerrar todos os processos
    for process in processes:
        try:
            process.terminate()
            process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            process.kill()
        except Exception:
            pass
    
    print_success("Servidores encerrados")
    sys.exit(0)

def main():
    """Função principal"""
    # Configurar handler para Ctrl+C
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    # Parse de argumentos
    parser = argparse.ArgumentParser(description="Iniciar servidores e fazer build")
    parser.add_argument("--streamlit", action="store_true", help="Inicia também o frontend Streamlit")
    parser.add_argument("--no-build", action="store_true", help="Não faz build do frontend React")
    parser.add_argument("--no-backend", action="store_true", help="Não inicia o backend Python")
    parser.add_argument("--no-frontend", action="store_true", help="Não inicia o servidor TypeScript")
    args = parser.parse_args()
    
    # Banner
    print(f"""
{Colors.BOLD}{Colors.CYAN}
╔══════════════════════════════════════════════════════════════╗
║   🚀 Super Agent - Iniciar Servidores e Fazer Build         ║
╚══════════════════════════════════════════════════════════════╝
{Colors.RESET}
    """)
    
    # Verificar dependências
    if not check_dependencies():
        print_error("Dependências não satisfeitas. Corrija os erros acima.")
        sys.exit(1)
    
    # Encontrar gerenciador de pacotes Node.js
    node_manager = find_node_manager()
    if not node_manager:
        print_error("pnpm ou npm não encontrado")
        sys.exit(1)
    
    # Fazer build do frontend React (se necessário)
    if not args.no_frontend and not args.no_build:
        if not build_frontend_react(node_manager):
            print_error("Erro ao fazer build do frontend React")
            sys.exit(1)
    
    # Iniciar backend Python (se necessário)
    if not args.no_backend:
        backend_process = start_backend_python()
        if backend_process:
            processes.append(backend_process)
        else:
            print_error("Erro ao iniciar backend Python")
            sys.exit(1)
    
    # Iniciar servidor TypeScript (se necessário)
    if not args.no_frontend:
        frontend_process = start_server_typescript(node_manager)
        if frontend_process:
            processes.append(frontend_process)
        else:
            print_error("Erro ao iniciar servidor TypeScript")
            sys.exit(1)
    
    # Iniciar frontend Streamlit (se solicitado)
    if args.streamlit:
        streamlit_process = start_frontend_streamlit()
        if streamlit_process:
            processes.append(streamlit_process)
        else:
            print_warning("Erro ao iniciar frontend Streamlit (continuando sem ele)")
    
    # Informações finais
    print(f"""
{Colors.BOLD}{Colors.GREEN}
╔══════════════════════════════════════════════════════════════╗
║   ✅ Servidores Iniciados com Sucesso!                       ║
╚══════════════════════════════════════════════════════════════╝
{Colors.RESET}
    """)
    
    if not args.no_backend:
        print(f"{Colors.GREEN}✓ Backend Python:{Colors.RESET} http://localhost:8000")
        print(f"{Colors.GREEN}✓ WebSocket:{Colors.RESET} ws://localhost:8000/ws")
    
    if not args.no_frontend:
        print(f"{Colors.GREEN}✓ Frontend React (Apple):{Colors.RESET} http://localhost:3000")
    
    if args.streamlit:
        print(f"{Colors.GREEN}✓ Frontend Streamlit (Básico):{Colors.RESET} http://localhost:8501")
    
    print(f"""
{Colors.YELLOW}
Pressione Ctrl+C para encerrar os servidores
{Colors.RESET}
    """)
    
    # Aguardar processos
    try:
        for process in processes:
            process.wait()
    except KeyboardInterrupt:
        signal_handler(None, None)

if __name__ == "__main__":
    main()

