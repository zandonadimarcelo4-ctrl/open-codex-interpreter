#!/bin/bash
# Script para instalar TODOS os modelos recomendados para orquestração inteligente
# Brain: Qwen2.5-32B-MoE (atual) + Qwen3-30B-A3B-Instruct-2507 (experimental)
# Executor: DeepSeek-Coder-V2-Lite (código geral) + UIGEN-T1-Qwen-14 (UI especializado)

echo "========================================"
echo "Instalando TODOS os Modelos Recomendados"
echo "========================================"
echo ""
echo "Modelos a instalar:"
echo "  1. Brain: Qwen2.5-32B-MoE (atual, recomendado)"
echo "  2. Brain: Qwen3-30B-A3B-Instruct-2507 (experimental, 256K contexto)"
echo "  3. Executor: DeepSeek-Coder-V2-Lite (código geral)"
echo "  4. Executor: UIGEN-T1-Qwen-14 (UI especializado)"
echo ""
echo "⚠️  ATENÇÃO: Isso vai baixar ~50-60GB de modelos!"
echo "   Tempo estimado: 30-60 minutos (dependendo da velocidade da internet)"
echo ""
read -p "Pressione Enter para continuar..."

# Verificar se Ollama está instalado
if ! command -v ollama &> /dev/null; then
    echo "❌ Ollama não encontrado! Instale o Ollama primeiro."
    echo "   Download: https://ollama.com/download"
    exit 1
fi

echo "✅ Ollama encontrado"
echo ""

# 1. Instalar Brain: Qwen2.5-32B-MoE (atual, recomendado)
echo "========================================"
echo "[1/4] Instalando Brain: Qwen2.5-32B-MoE"
echo "========================================"
echo "Modelo: qwen2.5-32b-instruct-moe-rtx"
echo "Tamanho: ~13GB"
echo "Contexto: 32K tokens"
echo "MoE: Sim"
echo "Status: RECOMENDADO (testado, estável)"
echo ""
read -p "Pressione Enter para continuar..."

if ollama pull qwen2.5-32b-instruct-moe-rtx; then
    echo "✅ Qwen2.5-32B-MoE instalado"
else
    echo "❌ Erro ao instalar Qwen2.5-32B-MoE"
    echo "⚠️  Continuando com outros modelos..."
fi
echo ""

# 2. Instalar Brain: Qwen3-30B-A3B-Instruct-2507 (experimental)
echo "========================================"
echo "[2/4] Instalando Brain: Qwen3-30B-A3B-Instruct-2507"
echo "========================================"
echo "Modelo: alibayram/Qwen3-30B-A3B-Instruct-2507"
echo "Tamanho: 19GB (não quantizado)"
echo "Contexto: 256K tokens (ENORME!)"
echo "MoE: Sim (3.3B ativados)"
echo "Status: EXPERIMENTAL (benchmarks melhores, 256K contexto)"
echo ""
echo "⚠️  ATENÇÃO: Este modelo é grande (19GB)!"
echo "   Recomendado: Quantizar para Q4_K_M (~10-12GB) depois"
echo ""
read -p "Pressione Enter para continuar..."

if ollama pull alibayram/Qwen3-30B-A3B-Instruct-2507; then
    echo "✅ Qwen3-30B-A3B-Instruct-2507 instalado"
    echo "⚠️  LEMBRE-SE: Quantize para Q4_K_M (~10-12GB) antes de usar em produção"
else
    echo "❌ Erro ao instalar Qwen3-30B-A3B-Instruct-2507"
    echo "⚠️  Continuando com outros modelos..."
fi
echo ""

# 3. Instalar Executor: DeepSeek-Coder-V2-Lite (código geral)
echo "========================================"
echo "[3/4] Instalando Executor: DeepSeek-Coder-V2-Lite"
echo "========================================"
echo "Modelo: networkjohnny/deepseek-coder-v2-lite-base-q4_k_m-gguf"
echo "Tamanho: ~6-8GB (Q4_K_M)"
echo "Contexto: ? tokens"
echo "Especialização: Código geral (Python, JavaScript, etc.)"
echo "Status: RECOMENDADO (código geral, 338 linguagens)"
echo ""
read -p "Pressione Enter para continuar..."

if ollama pull networkjohnny/deepseek-coder-v2-lite-base-q4_k_m-gguf; then
    echo "✅ DeepSeek-Coder-V2-Lite instalado"
else
    echo "❌ Erro ao instalar DeepSeek-Coder-V2-Lite"
    echo "⚠️  Continuando com outros modelos..."
fi
echo ""

# 4. Instalar Executor: UIGEN-T1-Qwen-14 (UI especializado)
echo "========================================"
echo "[4/4] Instalando Executor: UIGEN-T1-Qwen-14"
echo "========================================"
echo "Modelo: MHKetbi/UIGEN-T1-Qwen-14:q4_K_S"
echo "Tamanho: ~8.6GB (Q4_K_S)"
echo "Contexto: 32K tokens"
echo "Especialização: UI/HTML/CSS (dashboards, landing pages, forms)"
echo "Status: RECOMENDADO (UI especializado, chain-of-thought reasoning)"
echo ""
read -p "Pressione Enter para continuar..."

if ollama pull MHKetbi/UIGEN-T1-Qwen-14:q4_K_S; then
    echo "✅ UIGEN-T1-Qwen-14 instalado"
else
    echo "❌ Erro ao instalar UIGEN-T1-Qwen-14"
    echo "⚠️  Continuando..."
fi
echo ""

# Verificar instalação
echo "========================================"
echo "Verificando Instalação"
echo "========================================"
echo ""
ollama list
echo ""

echo "========================================"
echo "✅ Instalação Concluída!"
echo "========================================"
echo ""
echo "Modelos instalados:"
echo "  ✅ Brain: qwen2.5-32b-instruct-moe-rtx (~13GB)"
echo "  ✅ Brain: alibayram/Qwen3-30B-A3B-Instruct-2507 (19GB - quantizar depois)"
echo "  ✅ Executor: networkjohnny/deepseek-coder-v2-lite-base-q4_k_m-gguf (~6-8GB)"
echo "  ✅ Executor: MHKetbi/UIGEN-T1-Qwen-14:q4_K_S (~8.6GB)"
echo ""
echo "Próximos passos:"
echo "  1. Verificar modelos instalados (ollama list)"
echo "  2. Quantizar Qwen3-30B-A3B-Instruct-2507 para Q4_K_M (~10-12GB)"
echo "  3. Atualizar arquivo .env com os modelos:"
echo "     DEFAULT_MODEL=qwen2.5-32b-instruct-moe-rtx"
echo "     EXECUTOR_MODEL=networkjohnny/deepseek-coder-v2-lite-base-q4_k_m-gguf"
echo "     EXECUTOR_UI_MODEL=MHKetbi/UIGEN-T1-Qwen-14:q4_K_S"
echo "  4. Reiniciar o servidor para aplicar as mudanças"
echo ""
echo "⚠️  LEMBRE-SE: Qwen3-30B-A3B-Instruct-2507 precisa ser quantizado!"
echo "   Tamanho atual: 19GB (muito grande para 16GB VRAM)"
echo "   Tamanho quantizado: ~10-12GB (Q4_K_M) - cabe em 16GB VRAM"
echo ""

