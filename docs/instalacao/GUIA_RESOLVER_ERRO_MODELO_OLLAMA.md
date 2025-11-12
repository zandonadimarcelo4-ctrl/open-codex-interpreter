# 🔧 Guia para Resolver Erro de Modelo LLM Não Encontrado no Ollama

## ❌ Erro Comum

```
Ollama API error: 404 - model not found
Modelo 'deepseek-coder-v2-16b-q4_k_m' não encontrado no Ollama
```

## 🔍 Causas Possíveis

1. **Modelo não está instalado** - O modelo não foi baixado no Ollama
2. **Nome do modelo incorreto** - O nome do modelo está errado ou mudou
3. **Ollama não está rodando** - O servidor Ollama não está ativo
4. **Variável de ambiente incorreta** - `DEFAULT_MODEL` aponta para modelo inexistente

## ✅ Soluções

### 1. Verificar Modelos Instalados

```bash
# Listar todos os modelos instalados
ollama list

# Ver modelos disponíveis online
ollama search deepseek
```

### 2. Instalar Modelo Padrão

```bash
# Instalar modelo padrão (DeepSeek-Coder-V2)
ollama pull deepseek-coder-v2-16b-q4_k_m

# Ou instalar modelo mais leve (mais rápido)
ollama pull deepseek-coder

# Ou instalar modelo específico usado pelo sistema
ollama pull lucasmg/deepseek-r1-8b-0528-qwen3-q4_K_M-tool-true
```

### 3. Configurar Modelo no .env

Edite o arquivo `.env` e defina o modelo que você tem instalado:

```env
# Modelo padrão (use um modelo que você tem instalado)
DEFAULT_MODEL=deepseek-coder-v2-16b-q4_k_m

# Ou use um modelo mais leve
# DEFAULT_MODEL=deepseek-coder

# Ou use o modelo específico do sistema
# DEFAULT_MODEL=lucasmg/deepseek-r1-8b-0528-qwen3-q4_K_M-tool-true
```

### 4. Verificar se Ollama Está Rodando

```bash
# Verificar se Ollama está rodando
curl http://localhost:11434/api/tags

# Se não estiver rodando, inicie o Ollama
ollama serve
```

### 5. Usar Modelo de Fallback Automático

O sistema agora tem fallback automático! Se o modelo configurado não estiver disponível, o sistema tentará usar modelos alternativos na seguinte ordem:

1. `deepseek-coder-v2-16b-q4_k_m`
2. `deepseek-coder`
3. `deepseek-coder:1.3b`
4. `codellama`
5. `mistral`
6. `llama3.2`
7. `qwen2.5-coder`

## 🚀 Solução Rápida

### Passo 1: Verificar Modelos Instalados
```bash
ollama list
```

### Passo 2: Instalar Modelo (se necessário)
```bash
# Opção 1: Modelo padrão (recomendado)
ollama pull deepseek-coder-v2-16b-q4_k_m

# Opção 2: Modelo mais leve (mais rápido)
ollama pull deepseek-coder

# Opção 3: Modelo usado pelo sistema
ollama pull lucasmg/deepseek-r1-8b-0528-qwen3-q4_K_M-tool-true
```

### Passo 3: Configurar .env
```env
DEFAULT_MODEL=deepseek-coder-v2-16b-q4_k_m
```

### Passo 4: Reiniciar Servidor
```bash
# Reinicie o servidor para aplicar as mudanças
npm run dev
```

## 📋 Modelos Recomendados

### Para Desenvolvimento (Leves e Rápidos)
- `deepseek-coder` - Modelo leve e rápido
- `codellama` - Modelo especializado em código
- `mistral` - Modelo geral rápido

### Para Produção (Melhor Qualidade)
- `deepseek-coder-v2-16b-q4_k_m` - Alta qualidade, quantizado
- `lucasmg/deepseek-r1-8b-0528-qwen3-q4_K_M-tool-true` - Modelo com tools

### Para Testes (Muito Leves)
- `deepseek-coder:1.3b` - Muito leve, rápido
- `qwen2.5-coder:1.5b` - Muito leve

## 🔍 Verificação de Status

### Verificar Ollama
```bash
# Verificar se Ollama está rodando
curl http://localhost:11434/api/tags

# Deve retornar JSON com lista de modelos
```

### Verificar Modelo Específico
```bash
# Verificar se modelo específico está instalado
ollama list | grep deepseek-coder
```

### Testar Modelo
```bash
# Testar modelo diretamente
ollama run deepseek-coder-v2-16b-q4_k_m "Hello, world!"
```

## ⚠️ Erros Comuns

### Erro: "connection refused"
**Causa**: Ollama não está rodando
**Solução**: Execute `ollama serve` ou reinicie o Ollama

### Erro: "model not found"
**Causa**: Modelo não está instalado
**Solução**: Execute `ollama pull <nome-do-modelo>`

### Erro: "timeout"
**Causa**: Modelo muito lento ou Ollama sobrecarregado
**Solução**: 
- Use modelo mais leve
- Aumente `OLLAMA_TIMEOUT_MS` no `.env`
- Verifique recursos do sistema (CPU/RAM/GPU)

## 🛠️ Troubleshooting Avançado

### Listar Modelos Disponíveis Programaticamente
```typescript
import { listAvailableModels } from "./server/utils/ollama";

const models = await listAvailableModels();
console.log("Modelos disponíveis:", models);
```

### Encontrar Melhor Modelo Disponível
```typescript
import { findBestAvailableModel } from "./server/utils/ollama";

const model = await findBestAvailableModel();
console.log("Melhor modelo disponível:", model);
```

### Verificar Modelo Específico
```typescript
import { checkModelAvailable } from "./server/utils/ollama";

const available = await checkModelAvailable("deepseek-coder-v2-16b-q4_k_m");
console.log("Modelo disponível:", available);
```

## 📚 Referências

- [Ollama Documentation](https://ollama.ai/docs)
- [DeepSeek-Coder Models](https://ollama.ai/library/deepseek-coder)
- [Model Installation Guide](./GUIA_DEEPSEEK_CODER_V2_OLLAMA.md)

## 🎯 Resumo

1. ✅ Verifique modelos instalados: `ollama list`
2. ✅ Instale modelo se necessário: `ollama pull <modelo>`
3. ✅ Configure `.env` com modelo instalado
4. ✅ Reinicie servidor
5. ✅ Sistema usa fallback automático se modelo não estiver disponível

## 💡 Dica

O sistema agora detecta automaticamente se o modelo não está disponível e tenta usar modelos alternativos. Se nenhum modelo estiver disponível, você verá uma mensagem clara com instruções de como instalar.

