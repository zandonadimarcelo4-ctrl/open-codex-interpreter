import "dotenv/config";
import express from "express";
import { createServer } from "http";
import { createServer as createHttpsServer } from "https";
import os from "os";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { createExpressMiddleware } from "@trpc/server/adapters/express";

// Obter __dirname equivalente para ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const importMetaDirname = __dirname;
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic } from "./vite";
import { ChatWebSocketServer } from "../utils/websocket";
import { backgroundWorker } from "./services/backgroundWorker";
import { resourceManager } from "./services/resourceManager";
import { modelLoader } from "./services/modelLoader";

async function startServer() {
  const app = express();
  
  // Middleware para permitir TODOS os hosts (incluindo Tailscale Funnel)
  app.use((req, _res, next) => {
    // Permitir qualquer host - necessário para Tailscale Funnel
    const host = req.headers.host;
    const url = req.url || req.originalUrl || '';
    // Log apenas para requisições importantes (não logar todas para evitar spam)
    if (url === '/' || url.startsWith('/app') || url.startsWith('/src')) {
      console.log(`[Server] Requisição recebida: ${req.method} ${url} (host: ${host})`);
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
  
  // Servir arquivos públicos (favicon, manifest, etc) ANTES de qualquer outra coisa
  // Isso permite que o Express sirva esses arquivos diretamente, mesmo em desenvolvimento
  // IMPORTANTE: Deve estar ANTES do setupParcel para que os arquivos sejam servidos antes do proxy
  const publicPath = path.resolve(importMetaDirname, "../..", "client", "public");
  if (fs.existsSync(publicPath)) {
    app.use('/favicon.png', express.static(path.join(publicPath, 'favicon.png')));
    app.use('/icon-192.png', express.static(path.join(publicPath, 'icon-192.png')));
    app.use('/icon-512.png', express.static(path.join(publicPath, 'icon-512.png')));
    // Servir manifest.json com Content-Type correto
    app.get('/manifest.json', (_req, res) => {
      const manifestPath = path.join(publicPath, 'manifest.json');
      if (fs.existsSync(manifestPath)) {
        res.setHeader('Content-Type', 'application/manifest+json');
        res.sendFile(manifestPath);
      } else {
        res.status(404).json({ error: 'Manifest not found' });
      }
    });
    app.use('/sw.js', express.static(path.join(publicPath, 'sw.js')));
    console.log('[Server] ✅ Arquivos públicos configurados:', publicPath);
  }
  
  // Criar servidor HTTP ou HTTPS
  let server: ReturnType<typeof createServer> | ReturnType<typeof createHttpsServer>;
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
  
  // ============================================================================
  // PROXY PARA BACKEND PYTHON (APENAS PYTHON - DESABILITAR BACKEND TYPESCRIPT)
  // ============================================================================
  // IMPORTANTE: O backend Python agora comanda TUDO!
  // O servidor TypeScript serve APENAS:
  // - Frontend React (via Vite)
  // - Proxy para backend Python
  // - tRPC (apenas para compatibilidade com frontend existente)
  
  // Configurar proxy para backend Python
  try {
    const { setupPythonBackendProxy, checkPythonBackend } = await import('./python_backend_proxy');
    
    // Verificar se o backend Python está rodando
    const pythonBackendAvailable = await checkPythonBackend();
    if (pythonBackendAvailable) {
      console.log('[Proxy] ✅ Backend Python está rodando');
      setupPythonBackendProxy(app, server);
    } else {
      console.warn('[Proxy] ⚠️ Backend Python não está rodando');
      console.warn('[Proxy] 💡 Para usar o backend Python, execute: python super_agent/backend_python.py');
      console.warn('[Proxy] 💡 O servidor TypeScript continuará funcionando, mas sem proxy para backend Python');
    }
  } catch (error) {
    console.error('[Proxy] ❌ Erro ao configurar proxy para backend Python:', error);
    console.warn('[Proxy] 💡 O servidor TypeScript continuará funcionando sem proxy');
  }
  
  // ============================================================================
  // tRPC API - MANTIDO PARA COMPATIBILIDADE COM FRONTEND EXISTENTE
  // ============================================================================
  // IMPORTANTE: Por enquanto, mantemos tRPC para compatibilidade
  // Mas as requisições de chat serão redirecionadas para o backend Python via proxy
  // OU o frontend pode se conectar diretamente ao backend Python na porta 8000
  
  console.log('[tRPC] 🔧 Configurando middleware do tRPC em /api/trpc (compatibilidade)');
  
  const trpcHandler = createExpressMiddleware({
      router: appRouter,
      createContext,
    onError: ({ error, path: errorPath, type }) => {
      // Logar erros do tRPC para debug
      console.error(`[tRPC] ❌ Erro em ${errorPath || 'unknown'}:`, error.message);
      if (type) {
        console.error(`[tRPC] Tipo de erro: ${type}`);
      }
    },
  });
  
  // Middleware wrapper para adicionar logs
  app.use("/api/trpc", (req, res, next) => {
    const method = req.method;
    const url = req.originalUrl || req.url || '';
    console.log(`[tRPC] 📨 Requisição recebida: ${method} ${url}`);
    trpcHandler(req, res, next);
  });
  
  console.log('[tRPC] ✅ Middleware do tRPC configurado (compatibilidade)');
  
  // production mode uses static files
  if (process.env.NODE_ENV !== "development") {
    serveStatic(app);
  }

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

  // Configurar Vite para servir arquivos estáticos (em desenvolvimento)
  // IMPORTANTE: serveStatic deve ser chamado DEPOIS de todos os middlewares de API
  // para garantir que rotas de API sejam processadas antes de servir arquivos estáticos
  const preferredPort = parseInt(process.env.PORT || "3000");
  
  // Middleware de verificação para garantir que rotas de API não sejam interceptadas
  // Este middleware não faz nada, apenas garante que está na ordem correta
  app.use((req, res, next) => {
    const url = req.originalUrl || req.url || '';
    // Se for rota de API e ainda não foi processada, logar (mas não interferir)
    if (url.startsWith('/api/') && !res.headersSent) {
      console.log(`[Middleware] ⚠️ Rota de API chegou no middleware de verificação: ${req.method} ${url}`);
    }
    next();
  });
  
  if (process.env.NODE_ENV === "development") {
    console.log('[Static] 🔧 Configurando serveStatic (desenvolvimento)');
    serveStatic(app);
    console.log('[Static] ✅ serveStatic configurado');
  }
  
  // Tentar fazer bind na porta - usar fallback automático se falhar
  const tryListen = async (attemptPort: number, maxAttempts: number = 10): Promise<number> => {
    return new Promise((resolve, reject) => {
      const listenHandler = async () => {
        const actualPort = attemptPort;
        console.log(`\n🚀 Server running on:`);
        console.log(`   Local:   http://localhost:${actualPort}/`);
        console.log(`   Network: http://${localIP}:${actualPort}/`);
        console.log(`\n📡 WebSocket server running on:`);
        console.log(`   Local:   ws://localhost:${actualPort}/ws`);
        console.log(`   Network: ws://${localIP}:${actualPort}/ws`);
        console.log(`\n📊 Status:`);
        console.log(`   Background Worker: ${backgroundWorker.isWorkerRunning() ? '✅ Running' : '❌ Stopped'}`);
        console.log(`   Resource Manager: ${resourceManager.getResourceUsage().isIdle ? '💤 Idle' : '⚡ Active'}`);
        console.log(`   VRAM Usage: ${resourceManager.getResourceUsage().vramUsed.toFixed(1)}GB / ${resourceManager.getResourceUsage().vramTotal}GB`);
        
        // Inicializar WebSocket Server DEPOIS que o servidor iniciar
        new ChatWebSocketServer(server);
        
        // Verificar Tailscale Funnel
        const { checkTailscaleFunnel, startTailscaleFunnel } = await import('../utils/tailscale');
        const funnelStatus = await checkTailscaleFunnel(actualPort);
        
        if (funnelStatus.active) {
          if (funnelStatus.url) {
            console.log(`\n🌐 Tailscale Funnel ATIVO:`);
            const funnelUrl = funnelStatus.url?.replace(/:\d+(\/|$)/, '$1') || funnelStatus.url;
            console.log(`   🌐 URL: ${funnelUrl}`);
            console.log(`   📡 WebSocket: ${funnelUrl?.replace('https://', 'wss://')}/ws`);
          } else {
            console.log(`\n🌐 Tailscale Funnel ATIVO (porta ${actualPort})`);
            console.log(`   💡 Para ver a URL, execute: tailscale funnel status`);
          }
        } else if (process.env.USE_TAILSCALE_FUNNEL === 'true') {
          console.log(`\n🔄 Iniciando Tailscale Funnel automaticamente...`);
          const { checkTailscaleRunning } = await import('../utils/tailscale');
          const tailscaleStatus = await checkTailscaleRunning();
          
          if (tailscaleStatus.running) {
            const result = await startTailscaleFunnel(actualPort);
            if (result.success && result.url) {
              console.log(`   ✅ Tailscale Funnel iniciado: ${result.url}`);
            }
          } else {
            console.log(`   ⚠️  Tailscale não está rodando`);
          }
        }
        
        console.log(`\n💡 Para acessar na rede local, use: http://${localIP}:${actualPort}/`);
        resolve(actualPort);
      };

      const errorHandler = (err: any) => {
        if (err.code === 'EADDRINUSE') {
          console.error(`[Server] ❌ Porta ${attemptPort} está em uso!`);
          if (maxAttempts > 0) {
            const nextPort = attemptPort + 1;
            console.log(`[Server] 🔄 Tentando porta ${nextPort}...`);
            server.removeAllListeners('listening');
            server.removeAllListeners('error');
            // Tentar novamente com a próxima porta
            tryListen(nextPort, maxAttempts - 1).then(resolve).catch(reject);
          } else {
            reject(new Error(`Não foi possível encontrar uma porta disponível (tentou de ${preferredPort} até ${attemptPort})`));
          }
        } else {
          reject(err);
        }
      };

      server.once('listening', listenHandler);
      server.once('error', errorHandler);
      server.listen(attemptPort, '0.0.0.0');
    });
  };

  try {
    const actualPort = await tryListen(preferredPort);
    if (actualPort !== preferredPort) {
      console.log(`[Server] ⚠️ Porta ${preferredPort} estava em uso, usando porta ${actualPort} ao invés`);
    }
  } catch (error) {
    console.error('[Server] ❌ Erro ao iniciar servidor:', error);
    process.exit(1);
  }
}

startServer().catch(console.error);

            const nextPort = attemptPort + 1;
            console.log(`[Server] 🔄 Tentando porta ${nextPort}...`);
            server.removeAllListeners('listening');
            server.removeAllListeners('error');
            // Tentar novamente com a próxima porta
            tryListen(nextPort, maxAttempts - 1).then(resolve).catch(reject);
          } else {
            reject(new Error(`Não foi possível encontrar uma porta disponível (tentou de ${preferredPort} até ${attemptPort})`));
          }
        } else {
          reject(err);
        }
      };

      server.once('listening', listenHandler);
      server.once('error', errorHandler);
      server.listen(attemptPort, '0.0.0.0');
    });
  };

  try {
    const actualPort = await tryListen(preferredPort);
    if (actualPort !== preferredPort) {
      console.log(`[Server] ⚠️ Porta ${preferredPort} estava em uso, usando porta ${actualPort} ao invés`);
    }
  } catch (error) {
    console.error('[Server] ❌ Erro ao iniciar servidor:', error);
    process.exit(1);
  }
}

startServer().catch(console.error);

            const nextPort = attemptPort + 1;
            console.log(`[Server] 🔄 Tentando porta ${nextPort}...`);
            server.removeAllListeners('listening');
            server.removeAllListeners('error');
            // Tentar novamente com a próxima porta
            tryListen(nextPort, maxAttempts - 1).then(resolve).catch(reject);
          } else {
            reject(new Error(`Não foi possível encontrar uma porta disponível (tentou de ${preferredPort} até ${attemptPort})`));
          }
        } else {
          reject(err);
        }
      };

      server.once('listening', listenHandler);
      server.once('error', errorHandler);
      server.listen(attemptPort, '0.0.0.0');
    });
  };

  try {
    const actualPort = await tryListen(preferredPort);
    if (actualPort !== preferredPort) {
      console.log(`[Server] ⚠️ Porta ${preferredPort} estava em uso, usando porta ${actualPort} ao invés`);
    }
  } catch (error) {
    console.error('[Server] ❌ Erro ao iniciar servidor:', error);
    process.exit(1);
  }
}

startServer().catch(console.error);

            const nextPort = attemptPort + 1;
            console.log(`[Server] 🔄 Tentando porta ${nextPort}...`);
            server.removeAllListeners('listening');
            server.removeAllListeners('error');
            // Tentar novamente com a próxima porta
            tryListen(nextPort, maxAttempts - 1).then(resolve).catch(reject);
          } else {
            reject(new Error(`Não foi possível encontrar uma porta disponível (tentou de ${preferredPort} até ${attemptPort})`));
          }
        } else {
          reject(err);
        }
      };

      server.once('listening', listenHandler);
      server.once('error', errorHandler);
      server.listen(attemptPort, '0.0.0.0');
    });
  };

  try {
    const actualPort = await tryListen(preferredPort);
    if (actualPort !== preferredPort) {
      console.log(`[Server] ⚠️ Porta ${preferredPort} estava em uso, usando porta ${actualPort} ao invés`);
    }
  } catch (error) {
    console.error('[Server] ❌ Erro ao iniciar servidor:', error);
    process.exit(1);
  }
}

startServer().catch(console.error);

            const nextPort = attemptPort + 1;
            console.log(`[Server] 🔄 Tentando porta ${nextPort}...`);
            server.removeAllListeners('listening');
            server.removeAllListeners('error');
            // Tentar novamente com a próxima porta
            tryListen(nextPort, maxAttempts - 1).then(resolve).catch(reject);
          } else {
            reject(new Error(`Não foi possível encontrar uma porta disponível (tentou de ${preferredPort} até ${attemptPort})`));
          }
        } else {
          reject(err);
        }
      };

      server.once('listening', listenHandler);
      server.once('error', errorHandler);
      server.listen(attemptPort, '0.0.0.0');
    });
  };

  try {
    const actualPort = await tryListen(preferredPort);
    if (actualPort !== preferredPort) {
      console.log(`[Server] ⚠️ Porta ${preferredPort} estava em uso, usando porta ${actualPort} ao invés`);
    }
  } catch (error) {
    console.error('[Server] ❌ Erro ao iniciar servidor:', error);
    process.exit(1);
  }
}

startServer().catch(console.error);

            const nextPort = attemptPort + 1;
            console.log(`[Server] 🔄 Tentando porta ${nextPort}...`);
            server.removeAllListeners('listening');
            server.removeAllListeners('error');
            // Tentar novamente com a próxima porta
            tryListen(nextPort, maxAttempts - 1).then(resolve).catch(reject);
          } else {
            reject(new Error(`Não foi possível encontrar uma porta disponível (tentou de ${preferredPort} até ${attemptPort})`));
          }
        } else {
          reject(err);
        }
      };

      server.once('listening', listenHandler);
      server.once('error', errorHandler);
      server.listen(attemptPort, '0.0.0.0');
    });
  };

  try {
    const actualPort = await tryListen(preferredPort);
    if (actualPort !== preferredPort) {
      console.log(`[Server] ⚠️ Porta ${preferredPort} estava em uso, usando porta ${actualPort} ao invés`);
    }
  } catch (error) {
    console.error('[Server] ❌ Erro ao iniciar servidor:', error);
    process.exit(1);
  }
}

startServer().catch(console.error);

            const nextPort = attemptPort + 1;
            console.log(`[Server] 🔄 Tentando porta ${nextPort}...`);
            server.removeAllListeners('listening');
            server.removeAllListeners('error');
            // Tentar novamente com a próxima porta
            tryListen(nextPort, maxAttempts - 1).then(resolve).catch(reject);
          } else {
            reject(new Error(`Não foi possível encontrar uma porta disponível (tentou de ${preferredPort} até ${attemptPort})`));
          }
        } else {
          reject(err);
        }
      };

      server.once('listening', listenHandler);
      server.once('error', errorHandler);
      server.listen(attemptPort, '0.0.0.0');
    });
  };

  try {
    const actualPort = await tryListen(preferredPort);
    if (actualPort !== preferredPort) {
      console.log(`[Server] ⚠️ Porta ${preferredPort} estava em uso, usando porta ${actualPort} ao invés`);
    }
  } catch (error) {
    console.error('[Server] ❌ Erro ao iniciar servidor:', error);
    process.exit(1);
  }
}

startServer().catch(console.error);

            const nextPort = attemptPort + 1;
            console.log(`[Server] 🔄 Tentando porta ${nextPort}...`);
            server.removeAllListeners('listening');
            server.removeAllListeners('error');
            // Tentar novamente com a próxima porta
            tryListen(nextPort, maxAttempts - 1).then(resolve).catch(reject);
          } else {
            reject(new Error(`Não foi possível encontrar uma porta disponível (tentou de ${preferredPort} até ${attemptPort})`));
          }
        } else {
          reject(err);
        }
      };

      server.once('listening', listenHandler);
      server.once('error', errorHandler);
      server.listen(attemptPort, '0.0.0.0');
    });
  };

  try {
    const actualPort = await tryListen(preferredPort);
    if (actualPort !== preferredPort) {
      console.log(`[Server] ⚠️ Porta ${preferredPort} estava em uso, usando porta ${actualPort} ao invés`);
    }
  } catch (error) {
    console.error('[Server] ❌ Erro ao iniciar servidor:', error);
    process.exit(1);
  }
}

startServer().catch(console.error);

            const nextPort = attemptPort + 1;
            console.log(`[Server] 🔄 Tentando porta ${nextPort}...`);
            server.removeAllListeners('listening');
            server.removeAllListeners('error');
            // Tentar novamente com a próxima porta
            tryListen(nextPort, maxAttempts - 1).then(resolve).catch(reject);
          } else {
            reject(new Error(`Não foi possível encontrar uma porta disponível (tentou de ${preferredPort} até ${attemptPort})`));
          }
        } else {
          reject(err);
        }
      };

      server.once('listening', listenHandler);
      server.once('error', errorHandler);
      server.listen(attemptPort, '0.0.0.0');
    });
  };

  try {
    const actualPort = await tryListen(preferredPort);
    if (actualPort !== preferredPort) {
      console.log(`[Server] ⚠️ Porta ${preferredPort} estava em uso, usando porta ${actualPort} ao invés`);
    }
  } catch (error) {
    console.error('[Server] ❌ Erro ao iniciar servidor:', error);
    process.exit(1);
  }
}

startServer().catch(console.error);

            const nextPort = attemptPort + 1;
            console.log(`[Server] 🔄 Tentando porta ${nextPort}...`);
            server.removeAllListeners('listening');
            server.removeAllListeners('error');
            // Tentar novamente com a próxima porta
            tryListen(nextPort, maxAttempts - 1).then(resolve).catch(reject);
          } else {
            reject(new Error(`Não foi possível encontrar uma porta disponível (tentou de ${preferredPort} até ${attemptPort})`));
          }
        } else {
          reject(err);
        }
      };

      server.once('listening', listenHandler);
      server.once('error', errorHandler);
      server.listen(attemptPort, '0.0.0.0');
    });
  };

  try {
    const actualPort = await tryListen(preferredPort);
    if (actualPort !== preferredPort) {
      console.log(`[Server] ⚠️ Porta ${preferredPort} estava em uso, usando porta ${actualPort} ao invés`);
    }
  } catch (error) {
    console.error('[Server] ❌ Erro ao iniciar servidor:', error);
    process.exit(1);
  }
}

startServer().catch(console.error);
