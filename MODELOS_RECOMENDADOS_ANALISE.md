# 🧠 Análise de Modelos Recomendados para Orquestração

## 📊 Modelos Analisados

### 1. **UIGEN-T1-Qwen-14** (Especializado em UI)
- **Base**: Qwen2.5-Coder-14B-Instruct
- **Especialização**: Geração de UI com reasoning (HTML/CSS)
- **Tamanhos Disponíveis**:
  - `q4_K_S`: 8.6GB (recomendado para 16GB VRAM)
  - `q6_K`: 12GB
  - `q8_0`: 16GB
  - `F16`: 30GB
- **VRAM Recomendado**: 12GB
- **Contexto**: 32K tokens
- **Uso Ideal**: Executor especializado para geração de UI/HTML/CSS

**Vantagens**:
- ✅ Chain-of-thought reasoning para UI
- ✅ Especializado em dashboards, landing pages, forms
- ✅ Gera HTML/CSS estruturado e válido
- ✅ Versão quantizada (q4_K_S) cabe em 16GB VRAM

**Desvantagens**:
- ⚠️ Limitado a UI básica (não JavaScript pesado)
- ⚠️ Pode ter artifacts de formatação
- ⚠️ Design repetitivo (treinado em dataset limitado)

**Recomendação**: ⭐⭐⭐⭐ (4/5) - Excelente como executor especializado para UI

---

### 2. **deepseek-coder-v2-lite-base-q4_k_m-gguf** (Executor Quantizado)
- **Base**: DeepSeek-Coder-V2-Lite
- **Quantização**: Q4_K_M (balanceada)
- **Especialização**: Geração de código multi-linguagem
- **Tamanho Estimado**: ~6-8GB (Q4_K_M)
- **Uso Ideal**: Executor de código geral (Python, JavaScript, etc.)

**Vantagens**:
- ✅ Quantização Q4_K_M (boa qualidade/memória)
- ✅ Baseada em DeepSeek-Coder-V2-Lite (código testado)
- ✅ Suporte a 338 linguagens
- ✅ Eficiente para VRAM limitada

**Desvantagens**:
- ⚠️ Quantização pode reduzir qualidade levemente
- ⚠️ Menos especializado que UIGEN para UI

**Recomendação**: ⭐⭐⭐⭐⭐ (5/5) - Melhor executor geral quantizado

---

### 3. **zhi-create-qwen3-32b** (Brain Criativo)
- **Base**: Qwen3 32B
- **Especialização**: Criação/conteúdo criativo
- **Tamanho Estimado**: ~20-30GB (dependendo da quantização)
- **Uso Ideal**: Brain estratégico para tarefas criativas

**Vantagens**:
- ✅ Modelo 32B (mais inteligente que 14B)
- ✅ Especializado em criação/conteúdo
- ✅ Potencialmente mais criativo

**Desvantagens**:
- ⚠️ Tamanho grande (pode não caber em 16GB VRAM mesmo quantizado)
- ⚠️ Menos testado que Qwen2.5-32B-MoE
- ⚠️ Pode ser menos eficiente que MoE

**Recomendação**: ⭐⭐⭐ (3/5) - Interessante, mas precisa verificar tamanho/quantização

---

## 🎯 Recomendações por Caso de Uso

### **Caso 1: Executor de Código Geral**
**Recomendação**: `deepseek-coder-v2-lite-base-q4_k_m-gguf`
- ✅ Mais eficiente (quantização Q4_K_M)
- ✅ Suporte amplo a linguagens
- ✅ Cabe em 16GB VRAM com Brain

### **Caso 2: Executor Especializado em UI**
**Recomendação**: `UIGEN-T1-Qwen-14:q4_K_S`
- ✅ Especializado em HTML/CSS
- ✅ Chain-of-thought reasoning
- ✅ 8.6GB (cabe em 16GB VRAM)

### **Caso 3: Brain Estratégico**
**Recomendação**: `qwen2.5-32b-instruct-moe-rtx` (atual) ou `zhi-create-qwen3-32b` (se couber)
- ✅ Qwen2.5-32B-MoE: Testado, eficiente (MoE), cabe em 16GB
- ✅ Qwen3-32B: Mais criativo, mas precisa verificar tamanho

---

## 🔧 Configuração Recomendada (16GB VRAM)

### **Opção 1: Geral (Recomendada)**
```env
# Brain: Estratégico (fixo)
DEFAULT_MODEL=qwen2.5-32b-instruct-moe-rtx

# Executor: Código geral (carregado sob demanda)
EXECUTOR_MODEL=networkjohnny/deepseek-coder-v2-lite-base-q4_k_m-gguf
```

**VRAM Esperada**:
- Brain: ~13GB
- Executor: ~6-8GB
- **Total**: Nunca estoura 16GB (modo alternado)

### **Opção 2: UI Especializado**
```env
# Brain: Estratégico (fixo)
DEFAULT_MODEL=qwen2.5-32b-instruct-moe-rtx

# Executor: UI especializado (carregado sob demanda)
EXECUTOR_MODEL=MHKetbi/UIGEN-T1-Qwen-14:q4_K_S
```

**VRAM Esperada**:
- Brain: ~13GB
- Executor: ~8.6GB
- **Total**: Nunca estoura 16GB (modo alternado)

### **Opção 3: Criativo (Experimental)**
```env
# Brain: Criativo (fixo) - PRECISA VERIFICAR TAMANHO
DEFAULT_MODEL=zhihu/zhi-create-qwen3-32b

# Executor: Código geral (carregado sob demanda)
EXECUTOR_MODEL=networkjohnny/deepseek-coder-v2-lite-base-q4_k_m-gguf
```

**VRAM Esperada**:
- Brain: ~20-30GB? (PRECISA VERIFICAR)
- Executor: ~6-8GB
- **⚠️ PODE ESTOURAR 16GB** (não recomendado sem quantização)

---

## 📥 Instalação dos Modelos

### **1. DeepSeek-Coder-V2-Lite (Q4_K_M)**
```bash
# Pull do modelo quantizado
ollama pull networkjohnny/deepseek-coder-v2-lite-base-q4_k_m-gguf

# Verificar instalação
ollama list | grep deepseek-coder-v2-lite
```

### **2. UIGEN-T1-Qwen-14 (Q4_K_S)**
```bash
# Pull do modelo quantizado
ollama pull MHKetbi/UIGEN-T1-Qwen-14:q4_K_S

# Verificar instalação
ollama list | grep UIGEN-T1-Qwen-14
```

### **3. Zhi-Create-Qwen3-32B (Experimental)**
```bash
# Pull do modelo (verificar tamanho primeiro)
ollama pull zhihu/zhi-create-qwen3-32b

# Verificar tamanho
ollama show zhihu/zhi-create-qwen3-32b
```

---

## 🎯 Decisão Final

### **Recomendação Principal**: 
**Usar `deepseek-coder-v2-lite-base-q4_k_m-gguf` como executor padrão**

**Razões**:
1. ✅ Quantização Q4_K_M (boa qualidade/memória)
2. ✅ Mais eficiente que UIGEN para código geral
3. ✅ Suporte amplo a linguagens (338)
4. ✅ Cabe em 16GB VRAM com Brain
5. ✅ Baseada em modelo testado (DeepSeek-Coder-V2-Lite)

### **Recomendação Secundária**:
**Usar `UIGEN-T1-Qwen-14:q4_K_S` como executor alternativo para UI**

**Razões**:
1. ✅ Especializado em HTML/CSS
2. ✅ Chain-of-thought reasoning
3. ✅ 8.6GB (cabe em 16GB VRAM)
4. ✅ Útil para tarefas de UI específicas

### **Recomendação Terciária**:
**Manter `qwen2.5-32b-instruct-moe-rtx` como brain padrão**

**Razões**:
1. ✅ Testado e otimizado para RTX
2. ✅ MoE (eficiente)
3. ✅ Cabe em 16GB VRAM
4. ✅ Mais confiável que Qwen3-32B (menos testado)

---

## 🔄 Configuração no Código

### **Atualizar `env.example`**
```env
# Brain: Estratégico (fixo)
DEFAULT_MODEL=qwen2.5-32b-instruct-moe-rtx

# Executor: Código geral (carregado sob demanda)
EXECUTOR_MODEL=networkjohnny/deepseek-coder-v2-lite-base-q4_k_m-gguf

# Executor alternativo: UI especializado (opcional)
EXECUTOR_UI_MODEL=MHKetbi/UIGEN-T1-Qwen-14:q4_K_S
```

### **Atualizar `model_manager.py`**
```python
# Suportar múltiplos executores
executor_model = os.getenv("EXECUTOR_MODEL", "networkjohnny/deepseek-coder-v2-lite-base-q4_k_m-gguf")
executor_ui_model = os.getenv("EXECUTOR_UI_MODEL", "MHKetbi/UIGEN-T1-Qwen-14:q4_K_S")
```

### **Atualizar `intelligent_router.py`**
```python
# Detectar tarefas de UI e usar executor UI especializado
if task_type == TaskType.UI_GENERATION:
    return executor_ui_model
else:
    return executor_model
```

---

## ✅ Próximos Passos

1. ✅ **Instalar modelos recomendados**
2. ✅ **Atualizar configuração (env.example)**
3. ✅ **Atualizar model_manager.py para suportar múltiplos executores**
4. ✅ **Atualizar intelligent_router.py para detectar tarefas de UI**
5. ✅ **Testar orquestração com modelos novos**
6. ✅ **Verificar VRAM usage (nunca estourar 16GB)**

---

**Status**: ✅ Análise completa, recomendações definidas, pronto para implementação!

