import "dotenv/config";
import express from "express";
import { createServer } from "http";
import { createServer as createHttpsServer } from "https";
import net from "net";
import os from "os";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { createExpressMiddleware } from "@trpc/server/adapters/express";

// Obter __dirname equivalente para ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
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
  
  // Middleware para permitir TODOS os hosts (incluindo Tailscale Funnel)
  app.use((req, res, next) => {
    // Permitir qualquer host - necessário para Tailscale Funnel
    const host = req.headers.host;
    if (host) {
      // Log para debug
      console.log(`[Server] Requisição recebida de host: ${host}`);
    }
    next();
  });
  
  // Configurar CORS para permitir acesso de qualquer origem
  let cors: any;
  try {
    cors = (await import('cors')).default;
    app.use(cors({
      origin: true, // Permitir QUALQUER origem (incluindo Tailscale Funnel .ts.net)
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin', 'Host'],
      exposedHeaders: ['Content-Type', 'Authorization'],
    }));
  } catch (e) {
    console.warn('[CORS] ⚠️ CORS não instalado. Execute: pnpm install cors');
  }
  
  // Headers de segurança para detectar site como seguro
  app.use((req, res, next) => {
    // Content Security Policy (CSP) - Permissivo para desenvolvimento local
    res.setHeader('Content-Security-Policy', 
      "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: ws: wss: http: https:; " +
      "img-src 'self' data: blob: http: https:; " +
      "font-src 'self' data: http: https:; " +
      "connect-src 'self' ws: wss: http: https:; " +
      "media-src 'self' blob: data: http: https:; " +
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' http: https:; " +
      "style-src 'self' 'unsafe-inline' http: https:;"
    );
    
    // X-Frame-Options - Permitir iframe para desenvolvimento
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    
    // X-Content-Type-Options
    res.setHeader('X-Content-Type-Options', 'nosniff');
    
    // X-XSS-Protection
    res.setHeader('X-XSS-Protection', '1; mode=block');
    
    // Referrer-Policy
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // Permissions-Policy (Feature-Policy)
    // Removido 'interest-cohort' pois é uma feature deprecada/removida
    res.setHeader('Permissions-Policy', 
      'camera=(), microphone=(self), geolocation=()'
    );
    
    // Strict-Transport-Security (HSTS) - Apenas se HTTPS
    if (req.secure || req.headers['x-forwarded-proto'] === 'https') {
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }
    
    next();
  });
  
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  
  // Criar servidor HTTP ou HTTPS
  let server;
  const useHttps = process.env.USE_HTTPS === 'true';
  
  if (useHttps) {
    // Tentar carregar certificado SSL
    // __dirname aponta para server/_core, então ../../../ vai para a raiz do projeto
    const certPath = process.env.SSL_CERT_PATH || path.join(__dirname, '../../../certs/cert.pem');
    const keyPath = process.env.SSL_KEY_PATH || path.join(__dirname, '../../../certs/key.pem');
    
    if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
      try {
        const cert = fs.readFileSync(certPath);
        const key = fs.readFileSync(keyPath);
        server = createHttpsServer({ cert, key }, app);
        console.log('[HTTPS] ✅ Servidor HTTPS configurado com certificado SSL');
      } catch (error) {
        console.warn('[HTTPS] ⚠️ Erro ao carregar certificado SSL, usando HTTP:', error);
        server = createServer(app);
      }
    } else {
      console.warn('[HTTPS] ⚠️ Certificados SSL não encontrados, usando HTTP');
      console.warn(`[HTTPS] 💡 Para usar HTTPS, coloque os certificados em: ${certPath} e ${keyPath}`);
      server = createServer(app);
    }
  } else {
    server = createServer(app);
  }
  
  // Configurar multer para upload de arquivos (STT)
  let multer: any;
  try {
    multer = (await import('multer')).default;
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
  
  // Endpoint de teste simples para verificar conectividade de rede
  app.get("/api/test", (req, res) => {
    const clientIP = req.ip || req.socket.remoteAddress || 'unknown';
    console.log(`[TEST] Requisição de teste recebida de ${clientIP}`);
    res.json({ 
      success: true, 
      message: "Servidor acessível!",
      clientIP,
      serverIP: req.headers.host,
      timestamp: new Date().toISOString()
    });
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
          
          // Importar utilitário STT
          const { transcribeAudio } = await import("../utils/stt_backend");
          
          // Transcrever áudio usando Faster-Whisper
          console.log("[STT] 🎤 Transcrevendo áudio com Faster-Whisper...");
          
          try {
            const transcribedText = await transcribeAudio(req.file.buffer, "pt");
            
            if (transcribedText && transcribedText.trim()) {
              console.log(`[STT] ✅ Transcrição concluída: "${transcribedText.substring(0, 50)}${transcribedText.length > 50 ? "..." : ""}"`);
              
              res.status(200).json({
                text: transcribedText,
                language: "pt-BR",
                segments: []
              });
            } else {
              console.warn("[STT] ⚠️ Transcrição retornou texto vazio");
              res.status(200).json({
                text: "",
                language: "pt-BR",
                segments: [],
                warning: "Não foi possível transcrever o áudio. Pode estar muito curto ou sem fala."
              });
            }
          } catch (sttError) {
            console.error("[STT] ❌ Erro ao transcrever áudio:", sttError);
            const errorMessage = sttError instanceof Error ? sttError.message : String(sttError);
            
            // Verificar se é erro de dependência
            if (errorMessage.includes("faster-whisper") || 
                errorMessage.includes("não está instalado") || 
                errorMessage.includes("No module named") ||
                errorMessage.includes("ModuleNotFoundError")) {
              res.status(503).json({
                error: "STT não disponível",
                details: "Dependências do STT não estão instaladas",
                message: errorMessage,
                solution: {
                  windows: "Execute: .\\scripts\\install_stt_dependencies.ps1",
                  linux: "Execute: chmod +x scripts/install_stt_dependencies.sh && ./scripts/install_stt_dependencies.sh",
                  manual: "Execute: pip install faster-whisper pydub"
                },
                suggestion: "Instale as dependências do STT para usar Speech-to-Text. Veja scripts/install_stt_dependencies.ps1 (Windows) ou install_stt_dependencies.sh (Linux/Mac)"
              });
            } else {
              res.status(500).json({
                error: "Erro ao processar áudio",
                details: errorMessage,
                suggestion: "Verifique os logs do servidor para mais detalhes"
              });
            }
          }
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
      
      console.log("[TTS] 🎙️ Gerando áudio com ElevenLabs Turbo v2.5 (ultra-rápido)...");
      
      try {
        // Verificar se o cliente suporta streaming (via header)
        const supportsStreaming = req.headers.accept?.includes('stream') || req.headers['x-streaming'] === 'true';
        
        if (supportsStreaming) {
          // Streaming mode - enviar áudio assim que começar a chegar
          console.log("[TTS] 🚀 Modo streaming ativado - resposta quase em tempo real");
          res.setHeader("Content-Type", "audio/mpeg");
          res.setHeader("Transfer-Encoding", "chunked");
          res.setHeader("Cache-Control", "no-cache");
          res.setHeader("Connection", "keep-alive");
          
          // Gerar TTS e enviar em chunks
          const audioBuffer = await generateTTS(text, "pt-BR");
          if (audioBuffer && audioBuffer.length > 0) {
            console.log("[TTS] ✅ Áudio gerado com sucesso, tamanho:", audioBuffer.length, "bytes");
            // Enviar em chunks para streaming mais rápido
            const chunkSize = 8192; // 8KB chunks
            for (let i = 0; i < audioBuffer.length; i += chunkSize) {
              const chunk = audioBuffer.slice(i, i + chunkSize);
              res.write(chunk);
            }
            res.end();
          } else {
            throw new Error("Audio buffer is empty");
          }
        } else {
          // Modo normal - enviar áudio completo
          const audioBuffer = await generateTTS(text, "pt-BR");
          
          if (audioBuffer && audioBuffer.length > 0) {
            console.log("[TTS] ✅ Áudio gerado com sucesso, tamanho:", audioBuffer.length, "bytes");
            
            // Detectar formato do áudio baseado no conteúdo
            // ElevenLabs retorna MP3, Piper retorna WAV
            let contentType = "audio/wav"; // Padrão
            if (audioBuffer[0] === 0xFF && audioBuffer[1] === 0xFB) {
              // MP3 começa com FF FB
              contentType = "audio/mpeg";
              console.log("[TTS] Formato detectado: MP3 (ElevenLabs Turbo)");
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
  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);
  
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server, port);
  } else {
    serveStatic(app);
  }

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
  const networkInterfaces = os.networkInterfaces();
  let localIP = 'localhost';
  const allIPs: string[] = [];
  
  // Encontrar todos os IPs IPv4 não loopback
  // Priorizar interfaces Ethernet e Wi-Fi sobre outras
  const priorityInterfaces = ['Ethernet', 'Wi-Fi', 'WiFi', 'WLAN', 'Local Area Connection'];
  const allInterfaces: Array<{ name: string; address: string }> = [];
  
  for (const interfaceName in networkInterfaces) {
    const addresses = networkInterfaces[interfaceName];
    if (addresses) {
      for (const address of addresses) {
        // Verificar se é IPv4 e não é loopback ou link-local
        if (address.family === 'IPv4' && !address.internal && !address.address.startsWith('169.254.')) {
          allInterfaces.push({ name: interfaceName, address: address.address });
          allIPs.push(address.address);
        }
      }
    }
  }
  
  // Priorizar interfaces Ethernet/Wi-Fi
  for (const priorityName of priorityInterfaces) {
    const found = allInterfaces.find(i => i.name.includes(priorityName));
    if (found) {
      localIP = found.address;
      break;
    }
  }
  
  // Se não encontrou interface prioritária, usar a primeira disponível
  if (localIP === 'localhost' && allInterfaces.length > 0) {
    localIP = allInterfaces[0].address;
  }
  
  // Log todos os IPs encontrados para debug
  if (allIPs.length > 0) {
    console.log(`\n🌐 IPs de rede detectados: ${allIPs.join(', ')}`);
    console.log(`   Usando IP principal: ${localIP}`);
  } else {
    console.warn(`\n⚠️  Nenhum IP de rede detectado! Usando localhost apenas.`);
    console.warn(`   Verifique se o PC está conectado à rede Wi-Fi/Ethernet.`);
    console.warn(`   O servidor ainda escutará em 0.0.0.0, mas não será acessível por IP de rede.`);
  }

  server.listen(port, '0.0.0.0', async () => {
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
    
    // Verificar Tailscale Funnel
    // Verificar primeiro se há um Funnel ativo (mesmo sem detectar Tailscale instalado)
    const { checkTailscaleInstalled, checkTailscaleFunnel, startTailscaleFunnel } = await import('../utils/tailscale');
    
    // Verificar Funnel primeiro (pode estar ativo mesmo se não detectarmos o Tailscale)
    const funnelStatus = await checkTailscaleFunnel(port);
    
    if (funnelStatus.active) {
      // Funnel está ativo - mostrar URL mesmo se não detectamos o Tailscale
      if (funnelStatus.url) {
        console.log(`\n🌐 Tailscale Funnel ATIVO:`);
        console.log(`   🌐 URL: ${funnelStatus.url}`);
        console.log(`   📡 WebSocket: ${funnelStatus.url.replace('https://', 'wss://')}/ws`);
        console.log(`\n   ⚠️  Se estiver dando timeout, verifique:`);
        console.log(`      1. O servidor está escutando em 0.0.0.0:${port} (não apenas localhost)`);
        console.log(`      2. O Funnel está realmente ativo: tailscale funnel status`);
        console.log(`      3. O servidor está respondendo localmente: http://localhost:${port}/api/test`);
      } else {
        console.log(`\n🌐 Tailscale Funnel ATIVO (porta ${port})`);
        if (funnelStatus.error) {
          console.log(`   ⚠️  ${funnelStatus.error}`);
        }
        console.log(`   💡 Para ver a URL, execute: tailscale funnel status`);
        // Tentar obter a URL novamente após um delay
        setTimeout(async () => {
          const retryStatus = await checkTailscaleFunnel(port);
          if (retryStatus.url) {
            console.log(`   🌐 URL do Funnel: ${retryStatus.url}`);
            console.log(`   📡 WebSocket: ${retryStatus.url.replace('https://', 'wss://')}/ws`);
          } else if (retryStatus.error) {
            console.log(`   ⚠️  ${retryStatus.error}`);
          }
        }, 2000);
      }
    } else {
      // Funnel não está ativo - tentar iniciar se USE_TAILSCALE_FUNNEL=true
      if (process.env.USE_TAILSCALE_FUNNEL === 'true') {
        console.log(`\n🔄 Iniciando Tailscale Funnel automaticamente (USE_TAILSCALE_FUNNEL=true)...`);
        
        // Verificar se o Tailscale está rodando primeiro
        const { checkTailscaleRunning } = await import('../utils/tailscale');
        const tailscaleStatus = await checkTailscaleRunning();
        
        if (!tailscaleStatus.running) {
          console.log(`   ⚠️  Tailscale não está rodando!`);
          console.log(`      ${tailscaleStatus.error || 'Tailscale está parado'}`);
          console.log(`\n   📋 Para iniciar o Tailscale:`);
          console.log(`      1. Execute: tailscale up`);
          console.log(`      2. Ou inicie o Tailscale pelo menu do sistema`);
          console.log(`      3. Depois reinicie o servidor`);
          console.log(`\n   💡 Alternativa: Execute manualmente:`);
          console.log(`      tailscale up && tailscale funnel --bg ${port}`);
        } else {
          const result = await startTailscaleFunnel(port);
          if (result.success) {
            console.log(`   ✅ Tailscale Funnel iniciado com sucesso!`);
            if (result.url) {
              console.log(`      🌐 URL: ${result.url}`);
              console.log(`      📡 WebSocket: ${result.url.replace('https://', 'wss://')}/ws`);
            } else {
              console.log(`   💡 Para ver a URL, execute: tailscale funnel status`);
              // Tentar obter a URL após um delay
              setTimeout(async () => {
                const retryStatus = await checkTailscaleFunnel(port);
                if (retryStatus.url) {
                  console.log(`   🌐 URL do Funnel: ${retryStatus.url}`);
                  console.log(`   📡 WebSocket: ${retryStatus.url.replace('https://', 'wss://')}/ws`);
                }
              }, 2000);
            }
          } else {
            console.log(`   ⚠️  Não foi possível iniciar Tailscale Funnel automaticamente:`);
            console.log(`      ${result.error || 'Erro desconhecido'}`);
            
            // Verificar se o erro é porque o Tailscale está parado
            if (result.error?.includes('stopped') || result.error?.includes('not running')) {
              console.log(`\n   📋 Para iniciar o Tailscale:`);
              console.log(`      1. Execute: tailscale up`);
              console.log(`      2. Ou inicie o Tailscale pelo menu do sistema`);
              console.log(`      3. Depois reinicie o servidor`);
            } else {
              console.log(`   💡 Para iniciar manualmente, execute:`);
              console.log(`      tailscale funnel --bg ${port}`);
            }
          }
        }
      } else {
        // Verificar se Tailscale está instalado para mostrar mensagem apropriada
        const tailscaleInstalled = await checkTailscaleInstalled();
        
        if (tailscaleInstalled) {
          console.log(`\n🌐 Tailscale detectado!`);
          console.log(`   💡 Para usar Tailscale Funnel (acesso de qualquer lugar):`);
          console.log(`      1. Configure USE_TAILSCALE_FUNNEL=true no .env`);
          console.log(`      2. Ou execute manualmente: tailscale funnel --bg ${port}`);
        } else {
          console.log(`\n💡 Para acesso de qualquer lugar (sem configurar firewall):`);
          console.log(`   Use Tailscale Funnel:`);
          console.log(`   1. Instale o Tailscale: https://tailscale.com/download`);
          console.log(`   2. Configure USE_TAILSCALE_FUNNEL=true no .env`);
          console.log(`   3. Ou execute: tailscale funnel --bg ${port}`);
        }
      }
    }
    
    console.log(`\n💡 Para acessar na rede local, use: http://${localIP}:${port}/`);
    console.log(`\n⚠️  IMPORTANTE: Se não conseguir conectar de outro PC (timeout):`);
    console.log(`   → Use Tailscale Funnel (recomendado) ou configure o firewall`);
    console.log(`   → Veja instruções acima para Tailscale Funnel\n`);
  });
}

startServer().catch(console.error);
