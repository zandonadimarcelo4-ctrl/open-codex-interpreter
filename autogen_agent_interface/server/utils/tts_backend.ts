/**
 * Integração com Coqui TTS (XTTS) para voz Jarvis realista
 * Usa o Super Agent Framework Python via bridge
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
 * Limpar texto removendo caracteres não essenciais (emojis, markdown, etc.)
 */
function cleanTextForTTS(text: string): string {
  if (!text) return '';
  
  // PRIMEIRO: Remover TODOS os caracteres Unicode acima de 0x7F exceto acentos portugueses
  // Isso remove TODOS os emojis de uma vez
  let cleaned = text.split('').filter(char => {
    const code = char.charCodeAt(0);
    // Manter apenas ASCII básico (0-127) e acentos portugueses (0x00C0-0x017F)
    return code <= 0x7F || (code >= 0x00C0 && code <= 0x017F);
  }).join('');
  
  // Remover markdown
  cleaned = cleaned.replace(/#{1,6}\s+/g, ''); // Headers (#, ##, etc.)
  cleaned = cleaned.replace(/\*\*/g, ''); // Bold (**)
  cleaned = cleaned.replace(/\*/g, ''); // Italic (*)
  cleaned = cleaned.replace(/__/g, ''); // Bold (__)
  cleaned = cleaned.replace(/_/g, ''); // Italic (_)
  cleaned = cleaned.replace(/`/g, ''); // Code (`)
  cleaned = cleaned.replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1'); // Links [text](url) -> text
  cleaned = cleaned.replace(/!\[([^\]]*)\]\([^\)]+\)/g, ''); // Imagens ![alt](url)
  
  // Remover caracteres especiais desnecessários
  // Manter apenas: letras (a-z, A-Z), números (0-9), acentos portugueses, espaços e pontuação básica
  cleaned = cleaned.replace(/[^\w\s\u00C0-\u017F.,!?;:()\-]/g, ' '); // Manter apenas letras, números, acentos e pontuação básica
  
  // Normalizar espaços
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  
  return cleaned;
}

/**
 * Gerar áudio TTS usando Coqui TTS (XTTS)
 */
export async function generateTTS(
  text: string,
  language: string = "pt-BR"
): Promise<Buffer | null> {
  try {
    // Limpar texto removendo caracteres não essenciais
    let cleanedText = cleanTextForTTS(text);
    console.log(`[TTS] Texto original (${text.length} chars) -> Limpo (${cleanedText.length} chars)`);
    console.log(`[TTS] Texto original (primeiros 100 chars): ${text.substring(0, 100)}`);
    console.log(`[TTS] Texto limpo (primeiros 100 chars): ${cleanedText.substring(0, 100)}`);
    
    // Verificar se ainda há emojis ou caracteres especiais e limpar agressivamente
    // Remover TODOS os caracteres Unicode acima de 0x7F exceto acentos portugueses
    cleanedText = cleanedText.split('').filter(char => {
      const code = char.charCodeAt(0);
      // Manter apenas ASCII básico (0-127) e acentos portugueses (0x00C0-0x017F)
      return code <= 0x7F || (code >= 0x00C0 && code <= 0x017F);
    }).join('');
    
    // Verificar se ainda há emojis após limpeza agressiva
    const hasEmojis = /[\u{1F300}-\u{1F9FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu.test(cleanedText);
    if (hasEmojis) {
      console.warn(`[TTS] ⚠️ Ainda há emojis no texto após limpeza agressiva!`);
      // Limpar novamente de forma ainda mais agressiva - remover TUDO que não for ASCII ou acento português
      cleanedText = cleanedText.split('').filter(char => {
        const code = char.charCodeAt(0);
        return code <= 0x7F || (code >= 0x00C0 && code <= 0x017F);
      }).join('');
      console.log(`[TTS] Texto re-limpado (${cleanedText.length} chars): ${cleanedText.substring(0, 100)}`);
    }
    
    // Garantir que não há caracteres especiais problemáticos
    cleanedText = cleanedText.replace(/[^\x00-\x7F\u00C0-\u017F\s.,!?;:()\-]/g, '');
    // Garantir que o diretório existe
    if (!fs.existsSync(TEMP_AUDIO_DIR)) {
      fs.mkdirSync(TEMP_AUDIO_DIR, { recursive: true });
      console.log(`[TTS] Diretório criado: ${TEMP_AUDIO_DIR}`);
    }
    
    const outputFile = path.join(TEMP_AUDIO_DIR, `tts_${Date.now()}.wav`);
    console.log(`[TTS] Arquivo de saída: ${outputFile}`);
    
    // Usar caminho absoluto para evitar problemas
    // super_agent pode estar em diferentes locais
    const possiblePaths = [
      path.resolve(__dirname, "../../../super_agent"), // open-codex-interpreter/super_agent
      path.resolve(__dirname, "../../super_agent"), // autogen_agent_interface/super_agent (se existir)
      path.resolve(process.cwd(), "super_agent"), // Raiz do projeto
      path.resolve(process.cwd(), "autogen_agent_interface/super_agent"), // Dentro de autogen_agent_interface
    ];
    
    let superAgentPath: string | null = null;
    for (const possiblePath of possiblePaths) {
      const jarvisVoicePath = path.join(possiblePath, "voice", "jarvis_voice.py");
      if (fs.existsSync(jarvisVoicePath)) {
        superAgentPath = possiblePath;
        break;
      }
    }
    
    if (!superAgentPath) {
      console.error(`[TTS] ❌ super_agent não encontrado em nenhum dos caminhos:`, possiblePaths);
      throw new Error(`super_agent não encontrado. Verifique se o diretório existe.`);
    }
    
    console.log(`[TTS] Caminho do super_agent: ${superAgentPath}`);
    
    // Codificar o texto limpo em base64 para evitar problemas com emojis e caracteres especiais
    const textBase64 = Buffer.from(cleanedText, 'utf-8').toString('base64');
    
    const pythonScript = `
import sys
import json
import base64
import os

# Adicionar caminho do super_agent
super_agent_path = "${superAgentPath.replace(/\\/g, '/')}"
sys.path.insert(0, super_agent_path)
print(f"[TTS] Python: Caminho do super_agent: {super_agent_path}", file=sys.stderr)
print(f"[TTS] Python: sys.path[0]: {sys.path[0]}", file=sys.stderr)

try:
    from voice.jarvis_voice import JarvisVoiceSystem
    print("[TTS] Python: JarvisVoiceSystem importado com sucesso", file=sys.stderr)
except ImportError as e:
    print(f"[TTS] Python: ❌ Erro ao importar JarvisVoiceSystem: {e}", file=sys.stderr)
    print(f"[TTS] Python: sys.path: {sys.path}", file=sys.stderr)
    raise

import asyncio

async def generate():
    try:
        # Configurar para voz ultra-realista - ElevenLabs API (PRIORIDADE)
        print("[TTS] Python: Inicializando JarvisVoiceSystem...", file=sys.stderr)
        jarvis = JarvisVoiceSystem(
            language="pt-BR",
            voice_speed=0.90,  # Velocidade normal para voz natural (não muito lento para evitar voz aguda)
            voice_style="professional",
            elevenlabs_api_key="872680f98ad6eababb9f8f1e89ec0c939bb1f004364f6b3bb36e2f917c8bef01",
            elevenlabs_voice_id="1qyUTInppoHkRcPT9t6b"  # Voz masculina brasileira - ajustar timbre via voice_settings
        )
        print(f"[TTS] Python: JarvisVoiceSystem inicializado. Engine: {jarvis.tts_engine}", file=sys.stderr)
        
        output_file = "${outputFile.replace(/\\/g, '/')}"
        print(f"[TTS] Python: Arquivo de saída: {output_file}", file=sys.stderr)
        
        # Garantir que o diretório existe
        import os
        output_dir = os.path.dirname(output_file)
        if not os.path.exists(output_dir):
            os.makedirs(output_dir, exist_ok=True)
            print(f"[TTS] Python: Diretório criado: {output_dir}", file=sys.stderr)
        
        # PRIORIDADE 1: ElevenLabs API - Voz ultra-realista
        print(f"[TTS] Python: Engine atual: {jarvis.tts_engine}", file=sys.stderr)
        print(f"[TTS] Python: ElevenLabs API Key: {jarvis.elevenlabs_api_key[:20] if jarvis.elevenlabs_api_key else 'None'}...", file=sys.stderr)
        print(f"[TTS] Python: ElevenLabs Voice ID: {jarvis.elevenlabs_voice_id}", file=sys.stderr)
        
        if jarvis.tts_engine == "elevenlabs":
            print("[TTS] Python: ✅ Usando ElevenLabs API", file=sys.stderr)
            import aiohttp
            url = f"https://api.elevenlabs.io/v1/text-to-speech/{jarvis.elevenlabs_voice_id}"
            headers = {
                "Accept": "audio/mpeg",
                "Content-Type": "application/json",
                "xi-api-key": jarvis.elevenlabs_api_key
            }
            # Decodificar o texto de base64 (evita problemas com emojis e caracteres especiais)
            import base64 as b64
            text_data = b64.b64decode('${textBase64}').decode('utf-8')
            
            data = {
                "text": text_data,
                "model_id": "eleven_multilingual_v2",  # Modelo estável e confiável (multilíngue, suporta pt-BR)
                "voice_settings": {
                    "stability": 0.6,  # Estabilidade moderada para voz natural e grave (não muito alta para evitar voz aguda)
                    "similarity_boost": 0.8,  # Similaridade alta para manter timbre original masculino
                    "style": 0.0,  # Estilo neutro para voz mais natural
                    "use_speaker_boost": True  # Habilitar para melhorar clareza sem afinar demais
                },
                "output_format": "mp3_44100_128"  # Formato MP3 otimizado para streaming
            }
            async with aiohttp.ClientSession() as session:
                async with session.post(url, json=data, headers=headers) as response:
                    if response.status == 200:
                        print("[TTS] Python: ✅ ElevenLabs API retornou 200 (Turbo v2.5 - Ultra-rápido)", file=sys.stderr)
                        # Ler áudio em chunks para streaming mais rápido
                        audio_chunks = []
                        async for chunk in response.content.iter_chunked(8192):
                            audio_chunks.append(chunk)
                        audio_data = b''.join(audio_chunks)
                        print(f"[TTS] Python: Áudio recebido (streaming), tamanho: {len(audio_data)} bytes", file=sys.stderr)
                        with open(output_file, "wb") as f:
                            f.write(audio_data)
                        print(f"[TTS] Python: Arquivo salvo: {output_file}", file=sys.stderr)
                        print(f"[TTS] Python: Arquivo existe: {os.path.exists(output_file)}", file=sys.stderr)
                        print(json.dumps({"success": True, "file": output_file, "engine": "elevenlabs"}))
                    else:
                        error_text = await response.text()
                        print(f"[TTS] Python: ❌ ElevenLabs API error: {response.status} - {error_text}", file=sys.stderr)
                        print(json.dumps({"success": False, "error": f"ElevenLabs API error: {response.status} - {error_text}"}))
        # PRIORIDADE 2: Piper TTS
        elif jarvis.tts_engine == "piper":
            print("[TTS] Python: ⚠️ Usando Piper TTS (fallback)", file=sys.stderr)
            print(json.dumps({"success": False, "error": "Piper TTS não implementado ainda"}))
    # OUTROS ENGINES COMENTADOS - Usar apenas ElevenLabs e Piper
    # # PRIORIDADE 3: Edge TTS - Melhor suporte nativo para pt-BR
    # elif jarvis.tts_engine == "edge_tts":
    #     import edge_tts
    #     voice = "pt-BR-AntonioNeural"  # Voz masculina brasileira ultra-realista
    #     # IMPORTANTE: Edge TTS usa pt-BR automaticamente com pt-BR-AntonioNeural
    #     communicate = edge_tts.Communicate("${text.replace(/"/g, '\\"')}", voice, rate="-3%", pitch="+0Hz")
    #     await communicate.save(output_file)
    #     print(json.dumps({"success": True, "file": output_file, "engine": "edge_tts"}))
    # # PRIORIDADE 4: Coqui TTS (XTTS)
    # elif hasattr(jarvis.tts_engine, 'tts_to_file'):
    #     lang_code = "pt"  # Português brasileiro
    #     jarvis.tts_engine.tts_to_file(
    #         text="${text.replace(/"/g, '\\"')}",
    #         file_path=output_file,
    #         language=lang_code,  # Português
    #         speed=0.95  # Velocidade ajustada para voz mais natural
    #     )
    #     print(json.dumps({"success": True, "file": output_file, "engine": "coqui_tts"}))
        else:
            print(f"[TTS] Python: ❌ Engine não suportado: {jarvis.tts_engine}", file=sys.stderr)
            print(f"[TTS] Python: Tipo: {type(jarvis.tts_engine)}", file=sys.stderr)
            print(json.dumps({"success": False, "error": f"TTS engine não disponível: {jarvis.tts_engine}. Use ElevenLabs ou Piper TTS."}))
    except Exception as e:
        import traceback
        print(f"[TTS] Python: ❌ Erro no generate(): {e}", file=sys.stderr)
        print(f"[TTS] Python: Traceback:", file=sys.stderr)
        traceback.print_exc(file=sys.stderr)
        print(json.dumps({"success": False, "error": f"Erro ao gerar TTS: {str(e)}"}))

asyncio.run(generate())
`;
    
    return new Promise((resolve, reject) => {
      // Usar Python do ambiente virtual se disponível
      const pythonPath = process.env.PYTHON_PATH || "python";
      console.log(`[TTS] Usando Python: ${pythonPath}`);
      console.log(`[TTS] Script Python (primeiras 500 chars): ${pythonScript.substring(0, 500)}...`);
      
      const python = spawn(pythonPath, ["-c", pythonScript], {
        env: { ...process.env, PYTHONUNBUFFERED: "1" },
        cwd: path.resolve(__dirname, "../../../")
      });
      let output = "";
      let error = "";
      
      python.stdout.on("data", (data) => {
        output += data.toString();
      });
      
      python.stderr.on("data", (data) => {
        const errorData = data.toString();
        error += errorData;
        // Logar erros em tempo real
        console.error("[TTS] Python stderr:", errorData);
      });
      
      python.on("close", (code) => {
        console.log(`[TTS] Python process finalizado com código: ${code}`);
        console.log(`[TTS] stdout: ${output.substring(0, 500)}`);
        console.log(`[TTS] stderr: ${error.substring(0, 500)}`);
        
        if (code === 0) {
          try {
            // Tentar encontrar JSON no output (pode ter logs antes)
            const outputLines = output.trim().split('\n');
            let jsonLine = '';
            for (let i = outputLines.length - 1; i >= 0; i--) {
              const line = outputLines[i].trim();
              if (line.startsWith('{') && line.endsWith('}')) {
                jsonLine = line;
                break;
              }
            }
            
            if (!jsonLine) {
              console.error(`[TTS] ❌ Nenhum JSON encontrado no output`);
              console.error(`[TTS] Output completo:`, output);
              reject(new Error(`Nenhum JSON encontrado no output do Python. Output: ${output.substring(0, 500)}`));
              return;
            }
            
            const result = JSON.parse(jsonLine);
            console.log(`[TTS] Resultado JSON:`, result);
            
            if (result.success) {
              const filePath = result.file || outputFile;
              console.log(`[TTS] Verificando arquivo: ${filePath}`);
              console.log(`[TTS] Arquivo existe: ${fs.existsSync(filePath)}`);
              
              if (fs.existsSync(filePath)) {
                const audioBuffer = fs.readFileSync(filePath);
                console.log(`[TTS] Arquivo lido, tamanho: ${audioBuffer.length} bytes`);
                // Limpar arquivo temporário
                try {
                  fs.unlinkSync(filePath);
                  console.log(`[TTS] Arquivo temporário removido`);
                } catch (e) {
                  console.warn(`[TTS] Não foi possível remover arquivo temporário: ${e}`);
                }
                const engineName = result.engine === "elevenlabs" ? "ElevenLabs API (Ultra-realista)" :
                                   result.engine === "edge_tts" ? "Edge TTS (Fallback)" :
                                   result.engine === "coqui_tts" ? "Coqui TTS (Fallback)" :
                                   result.engine || 'TTS';
                console.log(`[TTS] ✅ Áudio gerado com sucesso usando ${engineName} (pt-BR)`);
                if (result.engine !== "elevenlabs") {
                  console.warn(`[TTS] ⚠️ Usando fallback ${result.engine}. Para melhor qualidade, use ElevenLabs API.`);
                }
                resolve(audioBuffer);
              } else {
                // Erro: Arquivo não encontrado
                const errorMsg = `Arquivo de áudio não encontrado: ${filePath}`;
                console.error(`[TTS] ❌ ${errorMsg}`);
                console.error(`[TTS] Resultado:`, result);
                reject(new Error(errorMsg));
              }
            } else {
              // Erro: TTS não disponível
              const errorMsg = result.error || "TTS não disponível";
              console.error(`[TTS] ❌ Erro: ${errorMsg}`);
              console.error(`[TTS] Resultado:`, result);
              reject(new Error(errorMsg));
            }
          } catch (e) {
            // Erro ao processar resultado
            console.error(`[TTS] ❌ Erro ao processar resultado JSON:`, e);
            console.error(`[TTS] Output:`, output);
            console.error(`[TTS] Error:`, error);
            reject(new Error(`Erro ao processar resultado: ${e instanceof Error ? e.message : String(e)}`));
          }
        } else {
          // Erro: Python process falhou
          console.error(`[TTS] ❌ Python process falhou com código ${code}`);
          console.error(`[TTS] stderr:`, error);
          console.error(`[TTS] stdout:`, output);
          reject(new Error(`TTS não disponível: Python process falhou (código ${code}). Erro: ${error || 'Sem detalhes'}`));
        }
      });
      
      python.on("error", (err) => {
        console.error(`[TTS] ❌ Erro ao iniciar Python process:`, err);
        reject(new Error(`Erro ao iniciar Python process: ${err.message}`));
      });
    });
  } catch (error) {
    console.error("[TTS] ❌ Erro ao gerar áudio:", error);
    throw error; // Lançar erro em vez de retornar null
  }
}

/**
 * Verificar se Coqui TTS está disponível
 */
export async function checkTTSAvailable(): Promise<boolean> {
  try {
    const pythonScript = `
import sys
sys.path.insert(0, "${path.join(__dirname, "../../super_agent")}")
try:
    from voice.jarvis_voice import JarvisVoiceSystem
    jarvis = JarvisVoiceSystem()
    print("True" if jarvis.tts_engine else "False")
except:
    print("False")
`;
    
    return new Promise((resolve) => {
      const python = spawn("python", ["-c", pythonScript]);
      let output = "";
      
      python.stdout.on("data", (data) => {
        output += data.toString();
      });
      
      python.on("close", (code) => {
        resolve(output.trim() === "True");
      });
    });
  } catch (error) {
    return false;
  }
}

