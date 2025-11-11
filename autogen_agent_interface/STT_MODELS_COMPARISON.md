# 🎙️ Comparação de Modelos de Transcrição de Áudio (STT)

Este documento compara os diferentes modelos de IA disponíveis para transcrição de áudio no projeto.

## 📊 Modelos Disponíveis

### 1. **Faster-Whisper** (Padrão) ⚡
- **Velocidade**: ⭐⭐⭐⭐ (Rápido)
- **Precisão**: ⭐⭐⭐⭐ (Muito boa)
- **Idiomas**: 99+ idiomas
- **Requer GPU**: Não (funciona bem em CPU)
- **Custo**: Gratuito (open-source)
- **Recomendado para**: Uso geral, produção

**Modelos disponíveis:**
- `tiny` - Mais rápido, menor precisão (~39MB)
- `base` - Balanceado (padrão) (~74MB) ⭐
- `small` - Melhor precisão (~244MB)
- `medium` - Alta precisão (~769MB)
- `large` - Máxima precisão (~1550MB)

**Configuração:**
```bash
# Variáveis de ambiente
STT_MODEL=faster-whisper
STT_MODEL_SIZE=base  # tiny, base, small, medium, large
STT_DEVICE=cpu  # cpu, cuda
STT_COMPUTE_TYPE=int8  # int8, float16, float32
```

---

### 2. **Distil-Whisper** 🚀
- **Velocidade**: ⭐⭐⭐⭐⭐ (Muito rápido)
- **Precisão**: ⭐⭐⭐ (Boa, mas menor que Faster-Whisper)
- **Idiomas**: Inglês (distil-medium.en) ou Multilingual (distil-large-v3)
- **Requer GPU**: Opcional (mais rápido com GPU)
- **Custo**: Gratuito (open-source)
- **Recomendado para**: Inglês, tempo real, baixa latência

**Modelos disponíveis:**
- `distil-whisper/distil-medium.en` - Inglês apenas
- `distil-whisper/distil-large-v3` - Multilingual

**Configuração:**
```bash
STT_MODEL=distil-whisper
STT_DEVICE=cpu  # cpu, cuda, mps (Mac)
```

**Instalação:**
```bash
pip install transformers torch pydub
```

---

### 3. **OpenAI Whisper API** 🎯
- **Velocidade**: ⭐⭐⭐ (Moderado, depende da conexão)
- **Precisão**: ⭐⭐⭐⭐⭐ (Excelente)
- **Idiomas**: 99+ idiomas
- **Requer GPU**: Não (processado na nuvem)
- **Custo**: $0.006 por minuto (~$0.36/hora)
- **Recomendado para**: Alta precisão, quando não há recursos locais

**Configuração:**
```bash
STT_MODEL=openai-api
OPENAI_API_KEY=sk-...
```

**Instalação:**
```bash
pip install openai
```

---

## 📈 Comparação Detalhada

| Característica | Faster-Whisper | Distil-Whisper | OpenAI API |
|---------------|----------------|----------------|------------|
| **Velocidade** | Rápido | Muito Rápido | Moderado |
| **Precisão** | Muito Boa | Boa | Excelente |
| **Idiomas** | 99+ | Inglês/Multilingual | 99+ |
| **Custo** | Gratuito | Gratuito | $0.006/min |
| **Requer Internet** | Não | Não | Sim |
| **Requer GPU** | Não | Opcional | Não |
| **Tamanho do Modelo** | 39MB-1.5GB | ~1GB | N/A |
| **Latência** | Baixa | Muito Baixa | Média |
| **Privacidade** | 100% Local | 100% Local | Na nuvem |

---

## 🎯 Recomendações por Caso de Uso

### ✅ **Uso Geral (Recomendado)**
```bash
STT_MODEL=faster-whisper
STT_MODEL_SIZE=base
```
- Balance perfeito entre velocidade e precisão
- Funciona bem em CPU
- Suporta múltiplos idiomas

### ⚡ **Máxima Velocidade (Inglês)**
```bash
STT_MODEL=distil-whisper
```
- Ideal para tempo real
- Baixa latência
- Principalmente para inglês

### 🎯 **Máxima Precisão**
```bash
STT_MODEL=faster-whisper
STT_MODEL_SIZE=large
```
ou
```bash
STT_MODEL=openai-api
OPENAI_API_KEY=sk-...
```
- Melhor qualidade de transcrição
- Ideal para conteúdo importante
- Maior custo (OpenAI) ou recursos (Large)

### 💰 **Baixo Custo / Sem Internet**
```bash
STT_MODEL=faster-whisper
STT_MODEL_SIZE=tiny
```
- Modelo menor e mais rápido
- Funciona offline
- Menor precisão

---

## 🔧 Configuração

### 1. **Variáveis de Ambiente**
Crie um arquivo `.env` ou configure as variáveis:

```bash
# Modelo a usar
STT_MODEL=faster-whisper  # faster-whisper, distil-whisper, openai-api

# Configurações do Faster-Whisper
STT_MODEL_SIZE=base  # tiny, base, small, medium, large
STT_DEVICE=cpu  # cpu, cuda
STT_COMPUTE_TYPE=int8  # int8, float16, float32

# OpenAI API (se usar openai-api)
OPENAI_API_KEY=sk-...
```

### 2. **Instalar Dependências**

**Faster-Whisper (padrão):**
```bash
pip install faster-whisper pydub
```

**Distil-Whisper:**
```bash
pip install transformers torch pydub
```

**OpenAI API:**
```bash
pip install openai
```

### 3. **Usar no Código**

O código automaticamente detecta a configuração e usa o modelo apropriado.

---

## 🚀 Melhorias Futuras

- [ ] Suporte para Whisper Large v3
- [ ] Suporte para modelos locais multilíngues melhorados
- [ ] Cache de transcrições
- [ ] Suporte para streaming (tempo real)
- [ ] Detecção automática de idioma melhorada
- [ ] Suporte para múltiplos falantes

---

## 📚 Referências

- [Faster-Whisper](https://github.com/guillaumekln/faster-whisper)
- [Distil-Whisper](https://huggingface.co/distil-whisper)
- [OpenAI Whisper API](https://platform.openai.com/docs/guides/speech-to-text)
- [Whisper (OpenAI)](https://github.com/openai/whisper)

