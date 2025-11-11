#!/usr/bin/env python3
"""
Script melhorado para transcrever áudio usando múltiplos modelos de IA
Suporta:
- Faster-Whisper (rápido, balanceado) - padrão
- Distil-Whisper (mais rápido, para inglês)
- Whisper Large v3 (mais preciso, mais lento)
- OpenAI Whisper API (mais preciso, requer API key)
"""
import sys
import json
import os
from pathlib import Path
import tempfile

# Adicionar projeto root ao path
project_root = Path(__file__).parent.parent.parent.parent
sys.path.insert(0, str(project_root))

# Configuração via variáveis de ambiente
STT_MODEL = os.getenv("STT_MODEL", "faster-whisper")  # faster-whisper, distil-whisper, whisper-large-v3, openai-api
STT_MODEL_SIZE = os.getenv("STT_MODEL_SIZE", "base")  # tiny, base, small, medium, large (para faster-whisper)
STT_DEVICE = os.getenv("STT_DEVICE", "cpu")  # cpu, cuda, mps
STT_COMPUTE_TYPE = os.getenv("STT_COMPUTE_TYPE", "int8")  # int8, float16, float32
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")

def transcribe_with_faster_whisper(audio_file: str, language: str = "pt"):
    """Transcrever usando Faster-Whisper (rápido e eficiente)"""
    try:
        from faster_whisper import WhisperModel
        from pydub import AudioSegment
    except ImportError as e:
        return {"error": f"Dependências não instaladas: {e}. Execute: pip install faster-whisper pydub"}
    
    try:
        # Converter áudio para WAV se necessário
        audio_path = audio_file
        temp_wav = None
        
        if not audio_file.lower().endswith('.wav'):
            try:
                audio = AudioSegment.from_file(audio_file)
                temp_wav = tempfile.NamedTemporaryFile(delete=False, suffix='.wav')
                temp_wav_path = temp_wav.name
                temp_wav.close()
                audio.export(temp_wav_path, format="wav")
                audio_path = temp_wav_path
            except Exception as e:
                print(json.dumps({"error": f"Erro ao converter áudio: {e}"}), file=sys.stderr)
                audio_path = audio_file
        
        # Inicializar modelo
        print(f"Carregando modelo Faster-Whisper '{STT_MODEL_SIZE}'...", file=sys.stderr)
        model = WhisperModel(STT_MODEL_SIZE, device=STT_DEVICE, compute_type=STT_COMPUTE_TYPE)
        
        # Transcrever
        print(f"Transcrevendo áudio (idioma: {language})...", file=sys.stderr)
        segments, info = model.transcribe(
            audio_path,
            language=language if language and language != "auto" else None,
            beam_size=5,
            vad_filter=True,
        )
        
        # Coletar texto
        transcribed_text = ""
        detected_language = info.language
        
        for segment in segments:
            transcribed_text += segment.text + " "
        
        transcribed_text = transcribed_text.strip()
        
        # Limpar arquivo temporário
        if temp_wav and os.path.exists(temp_wav_path):
            try:
                os.unlink(temp_wav_path)
            except:
                pass
        
        return {
            "text": transcribed_text,
            "language": detected_language,
            "model": f"faster-whisper-{STT_MODEL_SIZE}",
        }
        
    except Exception as e:
        return {"error": f"Erro ao transcrever: {str(e)}"}

def transcribe_with_distil_whisper(audio_file: str, language: str = "pt"):
    """Transcrever usando Distil-Whisper (mais rápido, mas principalmente para inglês)"""
    try:
        from transformers import pipeline
        import torch
        from pydub import AudioSegment
    except ImportError as e:
        return {"error": f"Dependências não instaladas: {e}. Execute: pip install transformers torch pydub"}
    
    try:
        # Converter para WAV
        audio_path = audio_file
        if not audio_file.lower().endswith('.wav'):
            audio = AudioSegment.from_file(audio_file)
            temp_wav = tempfile.NamedTemporaryFile(delete=False, suffix='.wav')
            temp_wav_path = temp_wav.name
            temp_wav.close()
            audio.export(temp_wav_path, format="wav")
            audio_path = temp_wav_path
        
        # Determinar device
        device = "cuda" if torch.cuda.is_available() else "cpu"
        torch_dtype = torch.float16 if device == "cuda" else torch.float32
        
        # Modelo Distil-Whisper (multilingual ou inglês)
        if language == "en" or language.startswith("en-"):
            model_id = "distil-whisper/distil-medium.en"
        else:
            model_id = "distil-whisper/distil-large-v3"  # Multilingual
        
        print(f"Carregando modelo Distil-Whisper '{model_id}'...", file=sys.stderr)
        
        # Criar pipeline
        pipe = pipeline(
            "automatic-speech-recognition",
            model=model_id,
            torch_dtype=torch_dtype,
            device=device,
        )
        
        # Transcrever
        print(f"Transcrevendo áudio (idioma: {language})...", file=sys.stderr)
        result = pipe(audio_path, language=language if language != "auto" else None)
        
        transcribed_text = result["text"].strip()
        
        # Limpar arquivo temporário
        if audio_path != audio_file and os.path.exists(audio_path):
            try:
                os.unlink(audio_path)
            except:
                pass
        
        return {
            "text": transcribed_text,
            "language": language,
            "model": model_id,
        }
        
    except Exception as e:
        return {"error": f"Erro ao transcrever: {str(e)}"}

def transcribe_with_openai_api(audio_file: str, language: str = "pt"):
    """Transcrever usando OpenAI Whisper API (mais preciso, requer API key)"""
    try:
        from openai import OpenAI
    except ImportError:
        return {"error": "Dependências não instaladas: openai. Execute: pip install openai"}
    
    if not OPENAI_API_KEY:
        return {"error": "OPENAI_API_KEY não configurada. Configure a variável de ambiente OPENAI_API_KEY"}
    
    try:
        client = OpenAI(api_key=OPENAI_API_KEY)
        
        print(f"Transcrevendo áudio com OpenAI Whisper API (idioma: {language})...", file=sys.stderr)
        
        with open(audio_file, "rb") as audio_file_obj:
            transcript = client.audio.transcriptions.create(
                model="whisper-1",
                file=audio_file_obj,
                language=language if language != "auto" else None,
            )
        
        return {
            "text": transcript.text,
            "language": language,
            "model": "openai-whisper-1",
        }
        
    except Exception as e:
        return {"error": f"Erro ao transcrever com OpenAI API: {str(e)}"}

def transcribe_audio(audio_file: str, language: str = "pt"):
    """Transcrever áudio usando o modelo configurado"""
    if not os.path.exists(audio_file):
        return {"error": f"Arquivo de áudio não encontrado: {audio_file}"}
    
    # Selecionar modelo baseado na configuração
    if STT_MODEL == "distil-whisper":
        result = transcribe_with_distil_whisper(audio_file, language)
    elif STT_MODEL == "openai-api":
        result = transcribe_with_openai_api(audio_file, language)
    else:  # faster-whisper (padrão)
        result = transcribe_with_faster_whisper(audio_file, language)
    
    if "error" in result:
        print(json.dumps(result), file=sys.stderr)
        sys.exit(1)
    
    return result

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Uso: python stt_whisper_improved.py <audio_file> [language]"}))
        sys.exit(1)
    
    audio_file = sys.argv[1]
    language = sys.argv[2] if len(sys.argv) > 2 else "pt"
    
    result = transcribe_audio(audio_file, language)
    print(json.dumps(result))

