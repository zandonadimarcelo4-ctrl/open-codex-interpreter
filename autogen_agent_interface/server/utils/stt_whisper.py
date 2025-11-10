#!/usr/bin/env python3
"""
Script para transcrever áudio usando Faster-Whisper
"""
import sys
import json
import os
from pathlib import Path

# Adicionar projeto root ao path
project_root = Path(__file__).parent.parent.parent.parent
sys.path.insert(0, str(project_root))

try:
    from faster_whisper import WhisperModel
    import tempfile
    from pydub import AudioSegment
except ImportError as e:
    print(json.dumps({"error": f"Dependências não instaladas: {e}. Execute: pip install faster-whisper pydub"}))
    sys.exit(1)

def transcribe_audio(audio_file: str, language: str = "pt"):
    """
    Transcrever áudio usando Faster-Whisper
    
    Args:
        audio_file: Caminho para o arquivo de áudio
        language: Código do idioma (pt, en, etc.) ou None para auto-detectar
    
    Returns:
        Texto transcrito
    """
    try:
        # Converter áudio para WAV se necessário (Faster-Whisper funciona melhor com WAV)
        audio_path = audio_file
        temp_wav = None
        
        # Verificar se precisa converter
        if not audio_file.lower().endswith('.wav'):
            try:
                # Carregar áudio com pydub
                audio = AudioSegment.from_file(audio_file)
                
                # Criar arquivo WAV temporário
                temp_wav = tempfile.NamedTemporaryFile(delete=False, suffix='.wav')
                temp_wav_path = temp_wav.name
                temp_wav.close()
                
                # Exportar como WAV
                audio.export(temp_wav_path, format="wav")
                audio_path = temp_wav_path
            except Exception as e:
                # Se falhar a conversão, tentar com o arquivo original
                print(json.dumps({"error": f"Erro ao converter áudio: {e}"}), file=sys.stderr)
                audio_path = audio_file
        
        # Inicializar modelo Whisper (usar modelo base para velocidade)
        # Modelos disponíveis: tiny, base, small, medium, large
        model_size = "base"  # Balance entre velocidade e qualidade
        
        print(f"Carregando modelo Whisper '{model_size}'...", file=sys.stderr)
        model = WhisperModel(model_size, device="cpu", compute_type="int8")
        
        # Transcrever áudio
        print(f"Transcrevendo áudio (idioma: {language})...", file=sys.stderr)
        
        # Se language for "auto" ou None, deixar Whisper detectar
        segments, info = model.transcribe(
            audio_path,
            language=language if language and language != "auto" else None,
            beam_size=5,
            vad_filter=True,  # Filtrar silêncio
        )
        
        # Coletar texto transcrito
        transcribed_text = ""
        detected_language = info.language
        
        for segment in segments:
            transcribed_text += segment.text + " "
        
        transcribed_text = transcribed_text.strip()
        
        # Limpar arquivo WAV temporário se foi criado
        if temp_wav and os.path.exists(temp_wav_path):
            try:
                os.unlink(temp_wav_path)
            except:
                pass
        
        # Retornar resultado como JSON
        result = {
            "text": transcribed_text,
            "language": detected_language,
            "segments": []
        }
        
        print(json.dumps(result))
        
    except Exception as e:
        error_msg = f"Erro ao transcrever áudio: {str(e)}"
        print(json.dumps({"error": error_msg}), file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Uso: python stt_whisper.py <audio_file> [language]"}))
        sys.exit(1)
    
    audio_file = sys.argv[1]
    language = sys.argv[2] if len(sys.argv) > 2 else "pt"
    
    if not os.path.exists(audio_file):
        print(json.dumps({"error": f"Arquivo de áudio não encontrado: {audio_file}"}))
        sys.exit(1)
    
    transcribe_audio(audio_file, language)
