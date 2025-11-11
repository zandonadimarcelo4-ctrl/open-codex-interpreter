# 🚀 Guia: DeepSeek-Coder-V2-16B-Q4_K_M no Ollama

## 📋 Visão Geral

Este guia mostra como baixar, quantizar e instalar o modelo **DeepSeek-Coder-V2-16B** no formato **Q4_K_M** no Ollama. O modelo não está disponível quantizado por padrão, então precisamos fazer a quantização manualmente.

---

## 🎯 Objetivo

- Baixar o modelo DeepSeek-Coder-V2-16B (não quantizado)
- Quantizar para Q4_K_M usando `llama.cpp` ou `gguf`
- Criar Modelfile do Ollama
- Carregar o modelo no Ollama

---

## 📊 Especificações do Modelo

- **Modelo**: DeepSeek-Coder-V2-16B
- **Quantização**: Q4_K_M (4-bit, médio)
- **VRAM Requerida**: ~10-12 GB (quantizado)
- **VRAM Original**: ~32 GB (não quantizado)
- **Tamanho do Arquivo**: ~9-10 GB (quantizado)
- **Tamanho Original**: ~32 GB (não quantizado)

---

## 🔧 Pré-requisitos

### 1. **Ollama Instalado**
```bash
# Verificar se Ollama está instalado
ollama --version

# Se não estiver instalado, instalar:
# Windows: https://ollama.ai/download
# Linux: curl -fsSL https://ollama.ai/install.sh | sh
# macOS: brew install ollama
```

### 2. **Python 3.10+**
```bash
python --version
```

### 3. **Git**
```bash
git --version
```

### 4. **Espaço em Disco**
- ~15 GB livres (para download e quantização)

### 5. **VRAM/ RAM**
- Mínimo: 12 GB VRAM (GPU) ou 16 GB RAM (CPU)
- Recomendado: 16 GB VRAM (GPU) ou 32 GB RAM (CPU)

---

## 📥 Método 1: Usar Hugging Face (Recomendado)

### Passo 1: Instalar Dependências

```bash
# Instalar transformers e accelerate
pip install transformers accelerate torch

# Instalar llama.cpp (para quantização)
pip install llama-cpp-python

# OU instalar gguf (alternativa)
pip install gguf
```

### Passo 2: Baixar o Modelo

```bash
# Criar diretório para o modelo
mkdir -p models/deepseek-coder-v2-16b
cd models/deepseek-coder-v2-16b

# Baixar usando huggingface-hub
pip install huggingface-hub
python -c "from huggingface_hub import snapshot_download; snapshot_download(repo_id='deepseek-ai/DeepSeek-Coder-V2-Lite-Instruct', local_dir='./')"
```

### Passo 3: Quantizar para Q4_K_M

```bash
# Instalar llama.cpp (compilado)
git clone https://github.com/ggerganov/llama.cpp.git
cd llama.cpp
make

# Quantizar o modelo
python convert-hf-to-gguf.py ../models/deepseek-coder-v2-16b --outdir ../models/deepseek-coder-v2-16b-gguf
./quantize ../models/deepseek-coder-v2-16b-gguf/ggml-model-f16.gguf ../models/deepseek-coder-v2-16b-gguf/ggml-model-q4_k_m.gguf Q4_K_M
```

---

## 📥 Método 2: Usar Script Automatizado (Mais Fácil)

### Passo 1: Executar Script de Download e Quantização

```bash
# Executar script automatizado
python scripts/download_and_quantize_deepseek_coder_v2.py
```

O script irá:
1. Baixar o modelo do Hugging Face
2. Converter para GGUF
3. Quantizar para Q4_K_M
4. Criar Modelfile do Ollama
5. Carregar o modelo no Ollama

---

## 🔧 Método 3: Usar Modelo Já Quantizado (Mais Rápido)

### Passo 1: Baixar Modelo Quantizado

Se alguém já quantizou o modelo, você pode baixar diretamente:

```bash
# Baixar modelo quantizado (se disponível)
# Exemplo de repositório com modelos quantizados:
# https://huggingface.co/TheBloke/DeepSeek-Coder-V2-Lite-Instruct-GGUF

# Usar huggingface-hub para baixar
pip install huggingface-hub
python -c "from huggingface_hub import hf_hub_download; hf_hub_download(repo_id='TheBloke/DeepSeek-Coder-V2-Lite-Instruct-GGUF', filename='deepseek-coder-v2-lite-instruct.Q4_K_M.gguf', local_dir='./models')"
```

### Passo 2: Criar Modelfile do Ollama

```bash
# Criar Modelfile
cat > Modelfile << 'EOF'
FROM ./models/deepseek-coder-v2-lite-instruct.Q4_K_M.gguf

TEMPLATE """{{ if .System }}System: {{ .System }}

{{ end }}{{ if .Prompt }}User: {{ .Prompt }}

{{ end }}Assistant:"""

PARAMETER temperature 0.7
PARAMETER top_p 0.9
PARAMETER top_k 40
PARAMETER num_predict 4096
PARAMETER stop "System:"
PARAMETER stop "User:"
PARAMETER stop "Assistant:"
EOF
```

### Passo 3: Carregar no Ollama

```bash
# Criar modelo no Ollama
ollama create deepseek-coder-v2-16b-q4_k_m -f Modelfile

# Testar o modelo
ollama run deepseek-coder-v2-16b-q4_k_m "Write a Python function to calculate fibonacci numbers"
```

---

## 🚀 Script Automatizado Completo

Crie o arquivo `scripts/setup_deepseek_coder_v2.sh`:

```bash
#!/bin/bash

set -e

echo "🚀 Configurando DeepSeek-Coder-V2-16B-Q4_K_M no Ollama..."

# Variáveis
MODEL_NAME="deepseek-coder-v2-16b-q4_k_m"
HF_REPO="deepseek-ai/DeepSeek-Coder-V2-Lite-Instruct"
MODEL_DIR="./models/${MODEL_NAME}"
GGUF_DIR="${MODEL_DIR}-gguf"
OLLAMA_MODEL_NAME="deepseek-coder-v2-16b-q4_k_m"

# Criar diretórios
mkdir -p models
mkdir -p scripts

# Verificar se Ollama está instalado
if ! command -v ollama &> /dev/null; then
    echo "❌ Ollama não está instalado. Instale em https://ollama.ai/download"
    exit 1
fi

# Verificar se Python está instalado
if ! command -v python &> /dev/null; then
    echo "❌ Python não está instalado"
    exit 1
fi

# Instalar dependências
echo "📦 Instalando dependências..."
pip install -q huggingface-hub transformers accelerate torch

# Baixar modelo
echo "📥 Baixando modelo do Hugging Face..."
python -c "
from huggingface_hub import snapshot_download
import os
os.makedirs('${MODEL_DIR}', exist_ok=True)
snapshot_download(repo_id='${HF_REPO}', local_dir='${MODEL_DIR}')
"

# Verificar se llama.cpp está disponível
if ! command -v ./llama.cpp/quantize &> /dev/null; then
    echo "📦 Instalando llama.cpp..."
    git clone https://github.com/ggerganov/llama.cpp.git || true
    cd llama.cpp
    make
    cd ..
fi

# Converter para GGUF
echo "🔄 Convertendo para GGUF..."
python llama.cpp/convert-hf-to-gguf.py "${MODEL_DIR}" --outdir "${GGUF_DIR}"

# Quantizar para Q4_K_M
echo "⚡ Quantizando para Q4_K_M..."
./llama.cpp/quantize "${GGUF_DIR}/ggml-model-f16.gguf" "${GGUF_DIR}/ggml-model-q4_k_m.gguf" Q4_K_M

# Criar Modelfile
echo "📝 Criando Modelfile..."
cat > "${GGUF_DIR}/Modelfile" << 'EOF'
FROM ./ggml-model-q4_k_m.gguf

TEMPLATE """{{ if .System }}System: {{ .System }}

{{ end }}{{ if .Prompt }}User: {{ .Prompt }}

{{ end }}Assistant:"""

PARAMETER temperature 0.7
PARAMETER top_p 0.9
PARAMETER top_k 40
PARAMETER num_predict 4096
PARAMETER stop "System:"
PARAMETER stop "User:"
PARAMETER stop "Assistant:"
EOF

# Carregar no Ollama
echo "🚀 Carregando modelo no Ollama..."
cd "${GGUF_DIR}"
ollama create "${OLLAMA_MODEL_NAME}" -f Modelfile

echo "✅ Modelo ${OLLAMA_MODEL_NAME} instalado com sucesso!"
echo "🧪 Testando modelo..."
ollama run "${OLLAMA_MODEL_NAME}" "Write a Python function to calculate fibonacci numbers"

echo "🎉 Concluído!"
```

---

## 🐍 Script Python (Windows/Linux/macOS)

Crie o arquivo `scripts/setup_deepseek_coder_v2.py`:

```python
#!/usr/bin/env python3
"""
Script para baixar, quantizar e instalar DeepSeek-Coder-V2-16B-Q4_K_M no Ollama
"""

import os
import subprocess
import sys
from pathlib import Path

# Configurações
MODEL_NAME = "deepseek-coder-v2-16b-q4_k_m"
HF_REPO = "deepseek-ai/DeepSeek-Coder-V2-Lite-Instruct"
MODEL_DIR = Path("./models") / MODEL_NAME
GGUF_DIR = Path("./models") / f"{MODEL_NAME}-gguf"
OLLAMA_MODEL_NAME = "deepseek-coder-v2-16b-q4_k_m"

def run_command(command, check=True, shell=False):
    """Executar comando e imprimir output"""
    print(f"▶️ Executando: {command}")
    try:
        if isinstance(command, str) and not shell:
            command = command.split()
        result = subprocess.run(
            command,
            check=check,
            shell=shell,
            capture_output=True,
            text=True
        )
        if result.stdout:
            print(result.stdout)
        return result
    except subprocess.CalledProcessError as e:
        print(f"❌ Erro: {e}")
        if e.stderr:
            print(f"Stderr: {e.stderr}")
        if check:
            raise
        return e

def check_dependencies():
    """Verificar se dependências estão instaladas"""
    print("🔍 Verificando dependências...")
    
    # Verificar Ollama
    try:
        run_command(["ollama", "--version"], check=False)
        print("✅ Ollama instalado")
    except FileNotFoundError:
        print("❌ Ollama não está instalado. Instale em https://ollama.ai/download")
        sys.exit(1)
    
    # Verificar Python
    print(f"✅ Python {sys.version}")

def install_dependencies():
    """Instalar dependências Python"""
    print("📦 Instalando dependências Python...")
    dependencies = [
        "huggingface-hub",
        "transformers",
        "accelerate",
        "torch",
    ]
    
    for dep in dependencies:
        print(f"Instalando {dep}...")
        run_command([sys.executable, "-m", "pip", "install", "-q", dep])

def download_model():
    """Baixar modelo do Hugging Face"""
    print("📥 Baixando modelo do Hugging Face...")
    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    
    download_script = f"""
from huggingface_hub import snapshot_download
import os
os.makedirs('{MODEL_DIR}', exist_ok=True)
snapshot_download(repo_id='{HF_REPO}', local_dir='{MODEL_DIR}')
print("✅ Modelo baixado com sucesso!")
"""
    
    run_command([sys.executable, "-c", download_script])

def setup_llama_cpp():
    """Configurar llama.cpp"""
    print("📦 Configurando llama.cpp...")
    llama_cpp_dir = Path("./llama.cpp")
    
    if not llama_cpp_dir.exists():
        print("Clonando llama.cpp...")
        run_command(["git", "clone", "https://github.com/ggerganov/llama.cpp.git"])
    
    # Compilar llama.cpp
    if sys.platform == "win32":
        # Windows
        print("Compilando llama.cpp (Windows)...")
        os.chdir("llama.cpp")
        run_command(["cmake", "-B", "build"], check=False)
        run_command(["cmake", "--build", "build", "--config", "Release"], check=False)
        os.chdir("..")
    else:
        # Linux/macOS
        print("Compilando llama.cpp (Linux/macOS)...")
        os.chdir("llama.cpp")
        run_command(["make"], check=False)
        os.chdir("..")

def convert_to_gguf():
    """Converter modelo para GGUF"""
    print("🔄 Convertendo para GGUF...")
    GGUF_DIR.mkdir(parents=True, exist_ok=True)
    
    llama_cpp_dir = Path("./llama.cpp")
    convert_script = llama_cpp_dir / "convert-hf-to-gguf.py"
    
    if not convert_script.exists():
        print("❌ Script de conversão não encontrado")
        sys.exit(1)
    
    run_command([
        sys.executable,
        str(convert_script),
        str(MODEL_DIR),
        "--outdir",
        str(GGUF_DIR)
    ])

def quantize_model():
    """Quantizar modelo para Q4_K_M"""
    print("⚡ Quantizando para Q4_K_M...")
    
    llama_cpp_dir = Path("./llama.cpp")
    quantize_bin = llama_cpp_dir / "quantize"
    
    if sys.platform == "win32":
        quantize_bin = llama_cpp_dir / "build" / "Release" / "quantize.exe"
    
    if not quantize_bin.exists():
        print("❌ Binário de quantização não encontrado")
        sys.exit(1)
    
    input_file = GGUF_DIR / "ggml-model-f16.gguf"
    output_file = GGUF_DIR / "ggml-model-q4_k_m.gguf"
    
    run_command([
        str(quantize_bin),
        str(input_file),
        str(output_file),
        "Q4_K_M"
    ])

def create_modelfile():
    """Criar Modelfile do Ollama"""
    print("📝 Criando Modelfile...")
    
    modelfile_content = f"""FROM ./ggml-model-q4_k_m.gguf

TEMPLATE \"\"\"{{{{ if .System }}}}System: {{{{ .System }}}}

{{{{ end }}}}{{{{ if .Prompt }}}}User: {{{{ .Prompt }}}}

{{{{ end }}}}Assistant:\"\"\"

PARAMETER temperature 0.7
PARAMETER top_p 0.9
PARAMETER top_k 40
PARAMETER num_predict 4096
PARAMETER stop "System:"
PARAMETER stop "User:"
PARAMETER stop "Assistant:"
"""
    
    modelfile_path = GGUF_DIR / "Modelfile"
    modelfile_path.write_text(modelfile_content)
    print(f"✅ Modelfile criado: {modelfile_path}")

def load_ollama_model():
    """Carregar modelo no Ollama"""
    print("🚀 Carregando modelo no Ollama...")
    
    os.chdir(GGUF_DIR)
    run_command([
        "ollama",
        "create",
        OLLAMA_MODEL_NAME,
        "-f",
        "Modelfile"
    ])
    os.chdir("../..")
    
    print(f"✅ Modelo {OLLAMA_MODEL_NAME} instalado no Ollama!")

def test_model():
    """Testar modelo"""
    print("🧪 Testando modelo...")
    test_prompt = "Write a Python function to calculate fibonacci numbers"
    
    result = run_command([
        "ollama",
        "run",
        OLLAMA_MODEL_NAME,
        test_prompt
    ], check=False)
    
    if result.returncode == 0:
        print("✅ Modelo funcionando corretamente!")
    else:
        print("⚠️ Modelo instalado, mas teste falhou. Verifique manualmente.")

def main():
    """Função principal"""
    print("🚀 Configurando DeepSeek-Coder-V2-16B-Q4_K_M no Ollama...")
    print("=" * 60)
    
    try:
        check_dependencies()
        install_dependencies()
        download_model()
        setup_llama_cpp()
        convert_to_gguf()
        quantize_model()
        create_modelfile()
        load_ollama_model()
        test_model()
        
        print("=" * 60)
        print("🎉 Concluído com sucesso!")
        print(f"📌 Modelo instalado: {OLLAMA_MODEL_NAME}")
        print(f"💡 Use: ollama run {OLLAMA_MODEL_NAME} 'sua pergunta'")
        
    except Exception as e:
        print(f"❌ Erro: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
```

---

## 🔧 Configurar no Projeto ANIMA

### 1. Atualizar `.env`

```bash
# Adicionar ao .env
DEFAULT_MODEL=deepseek-coder-v2-16b-q4_k_m
OLLAMA_BASE_URL=http://localhost:11434
```

### 2. Atualizar `modelManager.ts`

```typescript
// Adicionar ao modelManager.ts
'deepseek-coder-v2-16b-q4_k_m': {
  name: 'deepseek-coder-v2-16b-q4_k_m',
  provider: 'ollama',
  type: 'code',
  local: true,
  baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
  vramRequired: 10, // Q4_K_M quantizado
  qualityScore: 92, // Alta qualidade para código
  speedScore: 85, // Boa velocidade
},
```

### 3. Testar Integração

```bash
# Testar no Ollama
ollama run deepseek-coder-v2-16b-q4_k_m "Write a Python function to reverse a string"

# Testar no projeto
npm run dev
# Acessar interface e testar com o novo modelo
```

---

## 🐛 Troubleshooting

### Erro: "Model not found"
```bash
# Verificar se modelo está instalado
ollama list

# Se não estiver, reinstalar
ollama pull deepseek-coder-v2-16b-q4_k_m
```

### Erro: "Out of memory"
```bash
# Reduzir quantização (Q3_K_M ou Q2_K)
# Ou usar modelo menor (7B ou 1.3B)
```

### Erro: "llama.cpp not found"
```bash
# Instalar llama.cpp manualmente
git clone https://github.com/ggerganov/llama.cpp.git
cd llama.cpp
make
```

### Erro: "Hugging Face download failed"
```bash
# Verificar conexão com internet
# Ou baixar manualmente do Hugging Face
# https://huggingface.co/deepseek-ai/DeepSeek-Coder-V2-Lite-Instruct
```

---

## 📊 Comparação de Quantizações

| Quantização | VRAM | Qualidade | Velocidade | Tamanho |
|-------------|------|-----------|------------|---------|
| **F16** (original) | ~32 GB | 100% | 100% | ~32 GB |
| **Q8_0** | ~16 GB | 99% | 95% | ~16 GB |
| **Q6_K** | ~12 GB | 98% | 90% | ~12 GB |
| **Q4_K_M** | ~10 GB | 95% | 85% | ~9 GB |
| **Q3_K_M** | ~8 GB | 90% | 80% | ~7 GB |
| **Q2_K** | ~6 GB | 85% | 75% | ~5 GB |

**Recomendação**: Q4_K_M oferece o melhor equilíbrio entre qualidade e recursos.

---

## 📚 Referências

- [DeepSeek-Coder-V2 Hugging Face](https://huggingface.co/deepseek-ai/DeepSeek-Coder-V2-Lite-Instruct)
- [llama.cpp GitHub](https://github.com/ggerganov/llama.cpp)
- [Ollama Modelfile](https://github.com/ollama/ollama/blob/main/docs/modelfile.md)
- [GGUF Quantization](https://github.com/ggerganov/llama.cpp/blob/master/docs/QUANTIZATION.md)

---

## 🎯 Próximos Passos

1. ✅ Baixar e quantizar modelo
2. ✅ Carregar no Ollama
3. ✅ Configurar no projeto ANIMA
4. ✅ Testar geração de código
5. ✅ Integrar com Code Router
6. ✅ Otimizar performance

---

**Última Atualização**: Novembro 2025
**Versão**: 1.0
**Status**: Ready for Implementation 🚀

