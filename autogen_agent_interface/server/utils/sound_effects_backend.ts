/**
 * Gerar efeitos sonoros usando ElevenLabs SFX API
 * A ElevenLabs tem uma API específica para efeitos sonoros (não TTS)
 */
import * as fs from "fs";
import * as path from "path";
import { spawn } from "child_process";
import { promisify } from "util";

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || "872680f98ad6eababb9f8f1e89ec0c939bb1f004364f6b3bb36e2f917c8bef01";
const ELEVENLABS_SFX_API_URL = "https://api.elevenlabs.io/v1/sound-generation";

/**
 * Gerar efeito sonoro usando ElevenLabs SFX API
 */
export async function generateSoundEffect(
  description: string
): Promise<Buffer | null> {
  try {
    console.log(`[SFX] Gerando efeito sonoro: "${description.substring(0, 50)}..."`);
    
    // Criar arquivo temporário para o áudio
    const tempDir = path.join(process.cwd(), "temp_audio");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    const outputFile = path.join(tempDir, `sfx_${Date.now()}.mp3`);
    
    // Usar Python para chamar a API da ElevenLabs SFX
    const pythonScript = `
import sys
import json
import base64
import os
import aiohttp
import asyncio

async def generate_sfx():
    try:
        api_key = "${ELEVENLABS_API_KEY}"
        description = base64.b64decode('${Buffer.from(description).toString('base64')}').decode('utf-8')
        output_file = "${outputFile.replace(/\\/g, '/')}"
        
        print(f"[SFX] Python: Gerando efeito sonoro: {description[:50]}...", file=sys.stderr)
        print(f"[SFX] Python: Arquivo de saída: {output_file}", file=sys.stderr)
        
        # Garantir que o diretório existe
        output_dir = os.path.dirname(output_file)
        if not os.path.exists(output_dir):
            os.makedirs(output_dir, exist_ok=True)
            print(f"[SFX] Python: Diretório criado: {output_dir}", file=sys.stderr)
        
        # Chamar API de efeitos sonoros da ElevenLabs
        url = "${ELEVENLABS_SFX_API_URL}"
        headers = {
            "Accept": "audio/mpeg",
            "Content-Type": "application/json",
            "xi-api-key": api_key
        }
        
        data = {
            "text": description,
            "duration_seconds": 2.0,  # Duração curta para efeitos sonoros
            "prompt_influence": 0.3  # Influência do prompt (0.0 a 1.0)
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.post(url, json=data, headers=headers) as response:
                if response.status == 200:
                    print("[SFX] Python: ✅ ElevenLabs SFX API retornou 200", file=sys.stderr)
                    audio_data = await response.read()
                    print(f"[SFX] Python: Áudio recebido, tamanho: {len(audio_data)} bytes", file=sys.stderr)
                    
                    with open(output_file, "wb") as f:
                        f.write(audio_data)
                    
                    print(f"[SFX] Python: Arquivo salvo: {output_file}", file=sys.stderr)
                    print(json.dumps({"success": True, "file": output_file, "engine": "elevenlabs_sfx"}))
                else:
                    error_text = await response.text()
                    print(f"[SFX] Python: ❌ ElevenLabs SFX API error: {response.status} - {error_text}", file=sys.stderr)
                    print(json.dumps({"success": False, "error": f"ElevenLabs SFX API error: {response.status} - {error_text}"}))
    except Exception as e:
        print(f"[SFX] Python: ❌ Erro: {e}", file=sys.stderr)
        import traceback
        print(traceback.format_exc(), file=sys.stderr)
        print(json.dumps({"success": False, "error": str(e)}))

asyncio.run(generate_sfx())
`;

    // Executar script Python
    const python = spawn("python", ["-c", pythonScript], {
      cwd: process.cwd(),
      env: { ...process.env, PYTHONUNBUFFERED: "1" },
    });

    let output = "";
    let errorOutput = "";

    python.stdout.on("data", (data) => {
      output += data.toString();
    });

    python.stderr.on("data", (data) => {
      errorOutput += data.toString();
    });

    const result = await new Promise<{ success: boolean; file?: string; error?: string }>((resolve, reject) => {
      const timeout = setTimeout(() => {
        python.kill();
        reject(new Error("Timeout: Python script demorou mais de 10 segundos"));
      }, 10000);

      python.on("close", (code) => {
        clearTimeout(timeout);
        
        if (code === 0 && output) {
          try {
            const parsed = JSON.parse(output.trim());
            resolve(parsed);
          } catch (e) {
            console.warn("[SFX] Erro ao parsear resultado:", e);
            console.warn("[SFX] Output:", output);
            resolve({ success: false, error: "Erro ao processar resposta" });
          }
        } else {
          console.warn("[SFX] Python retornou código:", code);
          console.warn("[SFX] stderr:", errorOutput);
          resolve({ success: false, error: errorOutput || "Erro desconhecido" });
        }
      });

      python.on("error", (error) => {
        clearTimeout(timeout);
        console.error("[SFX] Erro ao executar Python:", error);
        reject(error);
      });
    });

    if (result.success && result.file && fs.existsSync(result.file)) {
      const audioBuffer = fs.readFileSync(result.file);
      
      // Limpar arquivo temporário
      try {
        fs.unlinkSync(result.file);
      } catch (e) {
        console.warn("[SFX] Não foi possível remover arquivo temporário:", e);
      }
      
      console.log(`[SFX] ✅ Efeito sonoro gerado com sucesso, tamanho: ${audioBuffer.length} bytes`);
      return audioBuffer;
    } else {
      console.error(`[SFX] ❌ Erro ao gerar efeito sonoro: ${result.error}`);
      return null;
    }
  } catch (error) {
    console.error("[SFX] ❌ Erro ao gerar efeito sonoro:", error);
    if (error instanceof Error) {
      console.error("[SFX] Mensagem:", error.message);
      console.error("[SFX] Stack:", error.stack);
    }
    return null;
  }
}

