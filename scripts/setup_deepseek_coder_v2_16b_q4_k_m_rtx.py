#!/usr/bin/env python3
"""
Script para configurar DeepSeek-Coder-V2:16b Q4_K_M otimizado para RTX NVIDIA
Funciona em Windows, Linux e macOS
"""

import os
import subprocess
import sys
from pathlib import Path

def run_command(command, check=True, shell=False, capture_output=False):
    """Executar comando e imprimir output"""
    print(f"▶️ Executando: {command}")
    try:
        if isinstance(command, str) and not shell:
            command = command.split()
        result = subprocess.run(
            command,
            check=check,
            shell=shell,
            capture_output=capture_output,
            text=True
        )
        if result.stdout and not capture_output:
            print(result.stdout)
        return result
    except subprocess.CalledProcessError as e:
        print(f"❌ Erro: {e}")
        if e.stderr:
            print(f"Stderr: {e.stderr}")
        if check:
            raise
        return e

def check_ollama_installed():
    """Verificar se Ollama está instalado"""
    try:
        run_command(["ollama", "--version"], check=False, capture_output=True)
        print("✅ Ollama encontrado")
        return True
    except FileNotFoundError:
        print("❌ Ollama não está instalado!")
        print("Por favor, instale o Ollama em: https://ollama.ai/download")
        return False

def check_nvidia_gpu():
    """Verificar se GPU NVIDIA está disponível"""
    try:
        result = run_command(["nvidia-smi", "--query-gpu=name,memory.total", "--format=csv,noheader"], 
                           check=False, capture_output=True)
        if result.returncode == 0:
            print("✅ GPU NVIDIA detectada!")
            print(result.stdout)
            return True
        else:
            print("⚠️ GPU NVIDIA não detectada. O modelo funcionará em CPU (mais lento).")
            return False
    except FileNotFoundError:
        print("⚠️ nvidia-smi não encontrado. GPU NVIDIA não detectada.")
        return False

def check_model_installed():
    """Verificar se modelo está instalado"""
    try:
        result = run_command(["ollama", "list"], check=False, capture_output=True)
        if "deepseek-coder-v2:16b" in result.stdout:
            print("✅ Modelo deepseek-coder-v2:16b já está instalado")
            return True
        else:
            print("⚠️ Modelo não encontrado")
            return False
    except Exception as e:
        print(f"⚠️ Erro ao verificar modelo: {e}")
        return False

def download_model():
    """Baixar modelo do Ollama"""
    print("📥 Baixando modelo deepseek-coder-v2:16b...")
    print("⚠️ Isso pode demorar vários minutos (tamanho: 8.9GB)")
    try:
        run_command(["ollama", "pull", "deepseek-coder-v2:16b"])
        print("✅ Modelo baixado com sucesso!")
        return True
    except Exception as e:
        print(f"❌ Erro ao baixar modelo: {e}")
        return False

def create_optimized_model():
    """Criar modelo otimizado com Modelfile"""
    print("🔧 Criando modelo otimizado Q4_K_M para RTX...")
    
    # Navegar para o diretório do projeto
    project_dir = Path(__file__).parent.parent
    modelfile_path = project_dir / "Modelfile.deepseek-coder-v2-16b-q4_k_m-rtx"
    
    if not modelfile_path.exists():
        print(f"❌ Modelfile não encontrado: {modelfile_path}")
        return False
    
    try:
        # Criar modelo otimizado
        run_command([
            "ollama", "create",
            "deepseek-coder-v2-16b-q4_k_m-rtx",
            "-f", str(modelfile_path)
        ])
        print("✅ Modelo otimizado criado: deepseek-coder-v2-16b-q4_k_m-rtx")
        return True
    except Exception as e:
        print(f"❌ Falha ao criar modelo otimizado: {e}")
        return False

def test_model():
    """Testar modelo"""
    print("🧪 Testando modelo...")
    try:
        result = run_command([
            "ollama", "run",
            "deepseek-coder-v2-16b-q4_k_m-rtx",
            "Write a Python function to calculate fibonacci numbers"
        ], check=False, capture_output=True)
        
        if result.returncode == 0:
            print("✅ Modelo funcionando corretamente!")
            if result.stdout:
                print("Resposta do modelo:")
                print(result.stdout[:200] + "..." if len(result.stdout) > 200 else result.stdout)
            return True
        else:
            print("⚠️ Teste falhou, mas modelo pode estar funcionando")
            return False
    except Exception as e:
        print(f"⚠️ Erro ao testar modelo: {e}")
        return False

def main():
    """Função principal"""
    print("=" * 60)
    print("Configurando DeepSeek-Coder-V2:16b Q4_K_M")
    print("Otimizado para GPU NVIDIA RTX")
    print("=" * 60)
    print("")
    
    # Verificar Ollama
    if not check_ollama_installed():
        sys.exit(1)
    
    # Verificar GPU NVIDIA
    has_gpu = check_nvidia_gpu()
    print("")
    
    # Verificar/Baixar modelo
    if not check_model_installed():
        if not download_model():
            sys.exit(1)
    
    # Criar modelo otimizado
    if not create_optimized_model():
        sys.exit(1)
    
    # Testar modelo (opcional)
    test_model()
    
    print("")
    print("=" * 60)
    print("✅ Configuração concluída!")
    print("=" * 60)
    print("")
    print("Modelo configurado: deepseek-coder-v2-16b-q4_k_m-rtx")
    print("Otimizado para: GPU NVIDIA RTX" if has_gpu else "Executando em: CPU")
    print("")
    print("💡 Para testar o modelo, execute:")
    print("   ollama run deepseek-coder-v2-16b-q4_k_m-rtx 'Write a Python function'")
    print("")
    if has_gpu:
        print("📊 Para verificar uso de GPU:")
        print("   nvidia-smi")
        print("")
    print("🔧 Para usar no projeto ANIMA, atualize o .env:")
    print("   DEFAULT_MODEL=deepseek-coder-v2-16b-q4_k_m-rtx")
    print("")

if __name__ == "__main__":
    main()

