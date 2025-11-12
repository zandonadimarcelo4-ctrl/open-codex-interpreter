# Classificador de Intenção com Mistral 7B Instruct

## 📋 Resumo

O classificador de intenção foi atualizado para usar o modelo **Mistral 7B Instruct** como modelo padrão recomendado. Este modelo é leve (~4.4 GB), rápido e excelente em seguir instruções JSON estruturado.

## 🎯 Modelo Selecionado

- **Modelo**: `mistral:7b-instruct`
- **Tamanho**: ~4.4 GB VRAM
- **Características**:
  - Leve e rápido
  - Excelente em seguir instruções JSON
  - Boa capacidade de classificação de intenção
  - Baixa latência para classificação

## 🔧 Configuração

### 1. Instalar o Modelo

```bash
ollama pull mistral:7b-instruct
```

Ou use o script automatizado:

```bash
scripts/install_intent_classifier_model.bat
```

### 2. Configurar Variável de Ambiente

Adicione ao arquivo `.env`:

```env
INTENT_CLASSIFIER_MODEL=mistral:7b-instruct
```

### 3. Verificar Instalação

Teste o classificador:

```bash
python interpreter/intent_classifier.py "Olá, como você está?"
```

## 📊 Modelos de Fallback

O sistema possui uma ordem de fallback inteligente:

1. **mistral:7b-instruct** (RECOMENDADO) - 4.4 GB
2. **phi3:mini** (Mais rápido) - 2.2 GB
3. **qwen2.5-coder:7b** - 4.7 GB
4. **qwen2.5:7b-instruct** - 4.7 GB
5. **llama3.1:8b** - 4.9 GB
6. **qwen2.5-coder:7b-instruct** - 4.7 GB
7. **llama3.2:3b** (se disponível)
8. **deepseek-coder:6.7b** (se disponível)
9. **DEFAULT_MODEL** (último recurso, pode ser grande)

## 🚀 Uso

### Classificação Híbrida (Recomendado)

```python
from interpreter.intent_classifier import classify_intent_hybrid

result = classify_intent_hybrid("Crie um script Python para fazer backup")
# {
#   "intent": "execution",
#   "reasoning": "O usuário pediu para criar um script Python.",
#   "action_type": "code",
#   "confidence": 0.95
# }
```

### Classificação LLM Direta

```python
from interpreter.intent_classifier import classify_intent_llm

result = classify_intent_llm("Olá, como você está?", model="mistral:7b-instruct")
# {
#   "intent": "conversation",
#   "reasoning": "É uma saudação.",
#   "action_type": null,
#   "confidence": 0.95
# }
```

## ⚙️ Configurações Avançadas

### Timeout

O timeout padrão é de **60 segundos** para modelos que podem demorar mais:

```python
# Em interpreter/intent_classifier.py
timeout=60  # Timeout aumentado para modelos que podem demorar mais
```

### Temperatura

A temperatura é configurada para **0.1** para classificação mais consistente:

```python
"options": {
    "temperature": 0.1,  # Baixa temperatura para classificação mais consistente
    "num_predict": 200,  # Resposta curta (apenas JSON)
}
```

## 🔍 Integração

### TypeScript Bridge

O classificador é acessível via TypeScript através do bridge:

```typescript
import { classifyIntentHybrid } from "./utils/intent_classifier_bridge";

const result = await classifyIntentHybrid("Olá, como você está?");
```

### AutoGen Router

O classificador é usado automaticamente no router do AutoGen:

```typescript
// Em autogen_agent_interface/server/routers.ts
const { classifyIntentHybrid } = await import("./utils/intent_classifier_bridge");
const llmIntent = await classifyIntentHybrid(input.message, rulesIntent);
```

## 📝 Formato de Resposta

O classificador retorna um objeto JSON com a seguinte estrutura:

```typescript
interface IntentClassification {
  intent: "execution" | "conversation";
  reasoning: string;
  action_type: "code" | "web" | "file" | "search" | "general" | null;
  confidence: number; // 0.0 - 1.0
}
```

### Exemplos

**Conversa:**
```json
{
  "intent": "conversation",
  "reasoning": "É uma saudação.",
  "action_type": null,
  "confidence": 0.95
}
```

**Execução (Código):**
```json
{
  "intent": "execution",
  "reasoning": "O usuário pediu para criar um script Python.",
  "action_type": "code",
  "confidence": 0.95
}
```

**Execução (Web):**
```json
{
  "intent": "execution",
  "reasoning": "O usuário pediu para pesquisar na web.",
  "action_type": "web",
  "confidence": 0.95
}
```

## 🐛 Troubleshooting

### Modelo não encontrado

Se o modelo `mistral:7b-instruct` não estiver disponível, o sistema tentará automaticamente os modelos de fallback na ordem listada acima.

### Timeout

Se estiver ocorrendo timeout, verifique:
1. Se o Ollama está rodando: `ollama serve`
2. Se há VRAM suficiente disponível
3. Se a conexão com o Ollama está funcionando

### Erro de JSON

Se houver erro ao parsear JSON, o sistema tentará extrair o JSON da resposta usando regex e markdown code blocks.

## 📚 Referências

- [Mistral AI](https://mistral.ai/)
- [Ollama Models](https://ollama.com/library/mistral)
- [Intent Classifier Documentation](../interpreter/intent_classifier.py)

