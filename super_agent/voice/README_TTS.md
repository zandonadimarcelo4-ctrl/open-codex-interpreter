# 🎤 Sistema de Voz Jarvis - TTS Realista

## 🎯 TTS Open Source Realista

Usando **Coqui TTS (XTTS v2)** - projeto open source de TTS realista de IA.

### Coqui TTS (XTTS v2)

**Coqui TTS** é um projeto open source que oferece:
- ✅ **Voz Realista** - Síntese de voz natural e realista
- ✅ **Multilíngue** - Suporta múltiplos idiomas
- ✅ **Clonagem de Voz** - Pode clonar vozes de referência
- ✅ **100% Local** - Roda totalmente local
- ✅ **Open Source** - Código aberto e gratuito

**Repositório**: https://github.com/coqui-ai/TTS

## 📦 Instalação

```bash
# Instalar Coqui TTS
pip install TTS

# Ou usar requirements.txt
pip install -r super_agent/requirements.txt
```

## 🚀 Uso

```python
from super_agent import JarvisVoiceSystem

# Inicializar sistema de voz
voice = JarvisVoiceSystem(
    voice_model="xtts-v2",
    language="pt"  # Português
)

# Falar texto
await voice.speak("Olá, sou o Jarvis. Como posso ajudá-lo?")

# Falar em streaming
async for audio_chunk in voice.speak("Texto longo...", stream=True):
    # Processar chunks de áudio
    pass
```

## 🎨 Vozes Disponíveis

### XTTS v2 (Coqui TTS)
- Voz masculina profissional
- Voz feminina profissional
- Clonagem de voz personalizada

### Fallbacks
- **Piper TTS** - Voz local rápida
- **Edge TTS** - Voz do Windows (gratuita)
- **pyttsx3** - Voz do sistema

## 🔧 Configuração

```python
voice = JarvisVoiceSystem(
    voice_model="xtts-v2",      # Modelo de voz
    voice_speed=1.0,             # Velocidade (0.5 a 2.0)
    voice_pitch=0.0,             # Tom (-1.0 a 1.0)
    voice_style="professional",  # Estilo da voz
    language="pt"                 # Idioma
)
```

## 🎯 Características

### 1. **Voz Realista**
- Síntese de voz natural
- Pronúncia correta
- Entonação natural

### 2. **Estilo Jarvis**
- Prefixos estilo Jarvis ("Certainly,", "Right away,")
- Pausas naturais
- Tom profissional

### 3. **Streaming**
- Suporte a streaming de áudio
- Chunks em tempo real
- Baixa latência

### 4. **Multilíngue**
- Suporta múltiplos idiomas
- Português, Inglês, Espanhol, etc.

## 📊 Comparação

| TTS | Qualidade | Velocidade | Local | Open Source |
|-----|-----------|------------|-------|-------------|
| **Coqui TTS (XTTS)** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ✅ | ✅ |
| Piper TTS | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ✅ | ✅ |
| Edge TTS | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ✅ | ❌ |
| pyttsx3 | ⭐⭐ | ⭐⭐⭐⭐⭐ | ✅ | ✅ |

## 🚀 Resultado

**Voz realista estilo Jarvis usando Coqui TTS (XTTS v2)!** 🎤✨

