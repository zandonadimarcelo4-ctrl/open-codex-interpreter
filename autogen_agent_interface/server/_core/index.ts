import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { ChatWebSocketServer } from "../utils/websocket";
import { backgroundWorker } from "./services/backgroundWorker";
import { resourceManager } from "./services/resourceManager";
import { modelLoader } from "./services/modelLoader";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  
  // Configurar multer para upload de arquivos (STT)
  let multer: any;
  try {
    multer = require('multer');
  } catch (e) {
    console.warn('[STT] ⚠️ Multer não instalado. STT pode não funcionar. Execute: npm install multer');
  }
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  
  // Health check endpoint (para plataformas de deploy)
  app.get("/api/health", async (req, res) => {
    const { healthCheck } = await import("./health");
    healthCheck(req, res);
  });
  
  // Sound Effects API endpoint (ElevenLabs SFX)
  app.post("/api/sfx", async (req, res) => {
    try {
      console.log("[SFX] Requisição recebida:", req.body.description?.substring(0, 50) + "...");
      
      const { generateSoundEffect } = await import("../utils/sound_effects_backend");
      const { description } = req.body;
      
      if (!description) {
        console.error("[SFX] ❌ Descrição não fornecida");
        return res.status(400).json({ error: "Description is required" });
      }
      
      if (!description.trim()) {
        console.error("[SFX] ❌ Descrição vazia");
        return res.status(400).json({ error: "Description is empty" });
      }
      
      console.log("[SFX] 🎵 Gerando efeito sonoro com ElevenLabs SFX API...");
      
      try {
        const audioBuffer = await generateSoundEffect(description);
        
        if (audioBuffer && audioBuffer.length > 0) {
          console.log("[SFX] ✅ Efeito sonoro gerado com sucesso, tamanho:", audioBuffer.length, "bytes");
          
          res.setHeader("Content-Type", "audio/mpeg");
          res.setHeader("Content-Length", audioBuffer.length.toString());
          res.setHeader("Accept-Ranges", "bytes");
          res.send(audioBuffer);
        } else {
          console.error("[SFX] ❌ SFX não disponível - audioBuffer é null ou vazio");
          res.status(500).json({ 
            error: "SFX not available - ElevenLabs SFX API não configurado ou falhou",
            details: "O efeito sonoro não foi gerado. Verifique se ElevenLabs SFX API está configurado.",
            suggestion: "Verifique os logs do servidor para mais detalhes sobre o erro."
          });
        }
      } catch (sfxError) {
        console.error("[SFX] ❌ Erro ao gerar SFX:", sfxError);
        const errorMessage = sfxError instanceof Error ? sfxError.message : String(sfxError);
        const errorStack = sfxError instanceof Error ? sfxError.stack : undefined;
        console.error("[SFX] Mensagem de erro completa:", errorMessage);
        if (errorStack) {
          console.error("[SFX] Stack trace:", errorStack);
        }
        res.status(500).json({ 
          error: `SFX error: ${errorMessage}`,
          details: errorMessage,
          suggestion: "Verifique se Python está instalado, se aiohttp está instalado, e se ElevenLabs SFX API está configurado."
        });
      }
    } catch (error) {
      console.error("[SFX] ❌ Erro geral:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      if (errorStack) {
        console.error("[SFX] Stack trace:", errorStack);
      }
      res.status(500).json({ 
        error: `Internal server error: ${errorMessage}`,
        details: errorMessage
      });
    }
  });
  
  // STT API endpoint (Speech-to-Text)
  app.post("/api/stt", async (req, res) => {
    try {
      console.log("[STT] Requisição recebida para transcrição de áudio");
      
      if (!multer) {
        console.error("[STT] ❌ Multer não está disponível");
        return res.status(500).json({
          error: "STT não disponível",
          details: "Multer não está instalado. Execute: npm install multer",
          suggestion: "STT ainda não está completamente implementado. Use texto por enquanto."
        });
      }
      
      // Configurar multer para processar multipart/form-data
      const upload = multer({ 
        storage: multer.memoryStorage(),
        limits: { fileSize: 16 * 1024 * 1024 } // 16MB max
      });
      
      // Usar multer como middleware
      const uploadMiddleware = upload.single('audio');
      
      uploadMiddleware(req, res, async (err: any) => {
        if (err) {
          console.error("[STT] ❌ Erro ao processar upload:", err);
          return res.status(400).json({ 
            error: "Erro ao processar arquivo de áudio",
            details: err.message 
          });
        }
        
        if (!req.file) {
          console.error("[STT] ❌ Arquivo de áudio não fornecido");
          return res.status(400).json({ 
            error: "Arquivo de áudio é obrigatório",
            details: "Nenhum arquivo foi enviado no campo 'audio'"
          });
        }
        
        try {
          console.log(`[STT] 🎙️ Processando áudio: ${req.file.size} bytes, tipo: ${req.file.mimetype}`);
          
          // Por enquanto, retornar mensagem informativa
          // Em produção, integrar com serviço de STT (Whisper, etc.)
          console.log("[STT] ⚠️ STT ainda não implementado completamente - retornando mensagem informativa");
          
          // Simular processamento (remover em produção)
          await new Promise(resolve => setTimeout(resolve, 500));
          
          res.status(200).json({
            text: "[STT] Transcrição de áudio ainda não implementada. Use texto por enquanto.",
            language: "pt-BR",
            segments: []
          });
        } catch (sttError) {
          console.error("[STT] ❌ Erro ao processar áudio:", sttError);
          const errorMessage = sttError instanceof Error ? sttError.message : String(sttError);
          res.status(500).json({
            error: "Erro ao processar áudio",
            details: errorMessage
          });
        }
      });
    } catch (error) {
      console.error("[STT] ❌ Erro geral:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      res.status(500).json({
        error: `Erro interno: ${errorMessage}`,
        details: errorMessage
      });
    }
  });
  
  // TTS API endpoint
  app.post("/api/tts", async (req, res) => {
    try {
      console.log("[TTS] Requisição recebida:", req.body.text?.substring(0, 50) + "...");
      
      const { generateTTS } = await import("../utils/tts_backend");
      const { text } = req.body;
      
      if (!text) {
        console.error("[TTS] ❌ Texto não fornecido");
        return res.status(400).json({ error: "Text is required" });
      }
      
      // Verificar se o texto está vazio após limpeza
      if (!text.trim()) {
        console.error("[TTS] ❌ Texto vazio após limpeza");
        return res.status(400).json({ error: "Text is empty after cleaning" });
      }
      
      console.log("[TTS] 🎙️ Gerando áudio com ElevenLabs/Piper...");
      
      try {
        const audioBuffer = await generateTTS(text, "pt-BR");
        
        if (audioBuffer && audioBuffer.length > 0) {
          console.log("[TTS] ✅ Áudio gerado com sucesso, tamanho:", audioBuffer.length, "bytes");
          
          // Detectar formato do áudio baseado no conteúdo
          // ElevenLabs retorna MP3, Piper retorna WAV
          let contentType = "audio/wav"; // Padrão
          if (audioBuffer[0] === 0xFF && audioBuffer[1] === 0xFB) {
            // MP3 começa com FF FB
            contentType = "audio/mpeg";
            console.log("[TTS] Formato detectado: MP3 (ElevenLabs)");
          } else if (audioBuffer[0] === 0x52 && audioBuffer[1] === 0x49 && audioBuffer[2] === 0x46 && audioBuffer[3] === 0x46) {
            // WAV começa com RIFF
            contentType = "audio/wav";
            console.log("[TTS] Formato detectado: WAV (Piper)");
          }
          
          res.setHeader("Content-Type", contentType);
          res.setHeader("Content-Length", audioBuffer.length.toString());
          res.setHeader("Accept-Ranges", "bytes");
          res.send(audioBuffer);
        } else {
          console.error("[TTS] ❌ TTS não disponível - audioBuffer é null ou vazio");
          res.status(500).json({ 
            error: "TTS not available - ElevenLabs/Piper não configurado ou falhou",
            details: "O áudio não foi gerado. Verifique se ElevenLabs está configurado ou se Piper TTS está instalado.",
            suggestion: "Verifique os logs do servidor para mais detalhes sobre o erro."
          });
        }
      } catch (ttsError) {
        console.error("[TTS] ❌ Erro ao gerar TTS:", ttsError);
        const errorMessage = ttsError instanceof Error ? ttsError.message : String(ttsError);
        const errorStack = ttsError instanceof Error ? ttsError.stack : undefined;
        console.error("[TTS] Mensagem de erro completa:", errorMessage);
        if (errorStack) {
          console.error("[TTS] Stack trace:", errorStack);
        }
        res.status(500).json({ 
          error: `TTS error: ${errorMessage}`,
          details: errorMessage,
          suggestion: "Verifique se Python está instalado, se o super_agent está no caminho correto, e se ElevenLabs/Piper está configurado."
        });
      }
    } catch (error) {
      console.error("[TTS] ❌ Erro geral:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      if (errorStack) {
        console.error("[TTS] Stack trace:", errorStack);
      }
      res.status(500).json({ 
        error: `Internal server error: ${errorMessage}`,
        details: errorMessage
      });
    }
  });
  
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  // Inicializar WebSocket Server
  const wsServer = new ChatWebSocketServer(server);

  // Inicializar Background Worker 24/7
  backgroundWorker.start();
  console.log('🚀 Background Worker 24/7 iniciado - "He works while you sleep"');

  // Inicializar Resource Manager (Otimizado para RTX 4080 Super)
  resourceManager.startMonitoring();
  console.log('🔍 Resource Manager iniciado - Otimizado para RTX 4080 Super 16GB VRAM');

  // Pré-carregar modelo padrão (DeepSeek R1) na VRAM para acesso rápido
  const defaultModel = process.env.DEFAULT_MODEL || 'deepseek-r1';
  modelLoader.preloadModel(defaultModel).catch(err => {
    console.warn(`⚠️ Não foi possível pré-carregar modelo ${defaultModel}:`, err);
  });

  // Obter IP da rede local
  const os = require('os');
  const networkInterfaces = os.networkInterfaces();
  let localIP = 'localhost';
  
  // Encontrar primeiro IP IPv4 não loopback
  for (const interfaceName in networkInterfaces) {
    const addresses = networkInterfaces[interfaceName];
    if (addresses) {
      for (const address of addresses) {
        if (address.family === 'IPv4' && !address.internal) {
          localIP = address.address;
          break;
        }
      }
      if (localIP !== 'localhost') break;
    }
  }

  server.listen(port, '0.0.0.0', () => {
    console.log(`\n🚀 Server running on:`);
    console.log(`   Local:   http://localhost:${port}/`);
    console.log(`   Network: http://${localIP}:${port}/`);
    console.log(`\n📡 WebSocket server running on:`);
    console.log(`   Local:   ws://localhost:${port}/ws`);
    console.log(`   Network: ws://${localIP}:${port}/ws`);
    console.log(`\n📊 Status:`);
    console.log(`   Background Worker: ${backgroundWorker.isWorkerRunning() ? '✅ Running' : '❌ Stopped'}`);
    console.log(`   Resource Manager: ${resourceManager.getResourceUsage().isIdle ? '💤 Idle' : '⚡ Active'}`);
    console.log(`   VRAM Usage: ${resourceManager.getResourceUsage().vramUsed.toFixed(1)}GB / ${resourceManager.getResourceUsage().vramTotal}GB`);
    console.log(`\n💡 Para acessar na rede local, use: http://${localIP}:${port}/\n`);
  });
}

startServer().catch(console.error);
