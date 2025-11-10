/**
 * Integração com Faster-Whisper para Speech-to-Text
 * Usa faster-whisper via Python para transcrever áudio
 */

import { spawn } from "child_process";
import * as path from "path";
import * as fs from "fs";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const TEMP_AUDIO_DIR = path.join(__dirname, "../../../temp_audio");
// Garantir que o diretório existe
if (!fs.existsSync(TEMP_AUDIO_DIR)) {
  fs.mkdirSync(TEMP_AUDIO_DIR, { recursive: true });
}

/**
 * Transcrever áudio usando Faster-Whisper
 * @param audioBuffer Buffer do áudio (WebM, MP3, WAV, etc.)
 * @param language Idioma do áudio (pt-BR, en-US, etc.) - opcional, auto-detecta se não fornecido
 * @returns Texto transcrito
 */
export async function transcribeAudio(
  audioBuffer: Buffer,
  language: string = "pt"
): Promise<string> {
  return new Promise(async (resolve, reject) => {
    try {
      // Criar arquivo temporário para o áudio
      const tempAudioFile = path.join(
        TEMP_AUDIO_DIR,
        `stt_${Date.now()}_${Math.random().toString(36).substring(7)}.webm`
      );

      // Salvar buffer do áudio em arquivo temporário
      fs.writeFileSync(tempAudioFile, audioBuffer);
      console.log(`[STT] Áudio salvo em: ${tempAudioFile} (${audioBuffer.length} bytes)`);

      // Caminho para o script Python
      const projectRoot = path.resolve(__dirname, "../../../../");
      const pythonScript = path.join(__dirname, "stt_whisper.py");
      
      // Criar script Python se não existir
      if (!fs.existsSync(pythonScript)) {
        await createSTTScript(pythonScript);
      }


      // Preparar comando Python
      const pythonCommand = process.platform === "win32" ? "python" : "python3";
      
      // Normalizar código de idioma (pt-BR -> pt, en-US -> en)
      const langCode = language.split("-")[0].toLowerCase();

      console.log(`[STT] Executando transcrição com Faster-Whisper (idioma: ${langCode})...`);

      const pythonProcess = spawn(pythonCommand, [
        pythonScript,
        tempAudioFile,
        langCode,
      ], {
        cwd: projectRoot,
        stdio: ["ignore", "pipe", "pipe"],
      });

      let stdout = "";
      let stderr = "";

      pythonProcess.stdout.on("data", (data) => {
        stdout += data.toString();
      });

      pythonProcess.stderr.on("data", (data) => {
        stderr += data.toString();
      });

      pythonProcess.on("close", (code) => {
        // Limpar arquivo temporário
        try {
          if (fs.existsSync(tempAudioFile)) {
            fs.unlinkSync(tempAudioFile);
            console.log(`[STT] Arquivo temporário removido: ${tempAudioFile}`);
          }
        } catch (cleanupError) {
          console.warn(`[STT] ⚠️ Erro ao limpar arquivo temporário:`, cleanupError);
        }

        if (code !== 0) {
          console.error(`[STT] ❌ Python process exited with code ${code}`);
          console.error(`[STT] stderr:`, stderr);
          
          // Verificar se é erro de dependência
          if (stderr.includes("faster-whisper") || 
              stderr.includes("No module named") || 
              stderr.includes("ModuleNotFoundError") ||
              stderr.includes("ImportError")) {
            reject(new Error(
              "Faster-Whisper não está instalado. Execute: pip install faster-whisper pydub ou use scripts/install_stt_dependencies.ps1 (Windows) / install_stt_dependencies.sh (Linux/Mac)"
            ));
          } else {
            reject(new Error(`STT error: ${stderr || stdout || "Unknown error"}`));
          }
          return;
        }

        try {
          // Parsear resposta JSON do Python
          const result = JSON.parse(stdout.trim());
          
          if (result.error) {
            console.error(`[STT] ❌ Erro do Python:`, result.error);
            reject(new Error(result.error));
            return;
          }

          const transcribedText = result.text || "";
          const detectedLanguage = result.language || language;

          console.log(`[STT] ✅ Transcrição concluída: "${transcribedText.substring(0, 50)}${transcribedText.length > 50 ? "..." : ""}"`);
          console.log(`[STT] Idioma detectado: ${detectedLanguage}`);

          resolve(transcribedText);
        } catch (parseError) {
          console.error(`[STT] ❌ Erro ao parsear resposta do Python:`, parseError);
          console.error(`[STT] stdout:`, stdout);
          console.error(`[STT] stderr:`, stderr);
          reject(new Error(`Failed to parse STT response: ${stdout || stderr}`));
        }
      });

      pythonProcess.on("error", (error) => {
        console.error(`[STT] ❌ Erro ao executar Python:`, error);
        
        // Limpar arquivo temporário em caso de erro
        try {
          if (fs.existsSync(tempAudioFile)) {
            fs.unlinkSync(tempAudioFile);
          }
        } catch (cleanupError) {
          // Ignorar erro de limpeza
        }
        
        reject(new Error(`Failed to start Python process: ${error.message}`));
      });

      // Timeout de 60 segundos
      setTimeout(() => {
        if (!pythonProcess.killed) {
          pythonProcess.kill();
          reject(new Error("STT timeout: transcrição demorou mais de 60 segundos"));
        }
      }, 60000);

    } catch (error) {
      console.error(`[STT] ❌ Erro geral:`, error);
      reject(error);
    }
  });
}

/**
 * Criar script Python para STT usando Faster-Whisper
 */
async function createSTTScript(scriptPath: string): Promise<void> {
  const pythonScript = `#!/usr/bin/env python3
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
`;

  fs.writeFileSync(scriptPath, pythonScript);
  console.log(`[STT] Script Python criado: ${scriptPath}`);
}

