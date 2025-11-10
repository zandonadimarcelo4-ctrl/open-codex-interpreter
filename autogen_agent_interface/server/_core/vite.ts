import express, { type Express } from "express";
import fs from "fs";
import { type Server } from "http";
import { nanoid } from "nanoid";
import path from "path";
import { createServer as createViteServer } from "vite";
import viteConfig from "../../vite.config";
import { viteAllowAllHosts } from "./vite-allow-all-hosts";

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { 
      server,
      host: '0.0.0.0', // Permitir HMR de qualquer IP da rede
      port: undefined, // Usar a mesma porta do servidor
      clientPort: undefined, // Usar a mesma porta do servidor
      protocol: undefined, // Usar o mesmo protocolo do servidor
    },
    allowedHosts: 'all', // Permitir TODOS os hosts (incluindo Tailscale Funnel .ts.net)
    // Desabilitar completamente a verificação de host
    strictPort: false,
  };

  // Criar configuração do Vite sem plugins problemáticos
  const { plugins, server: serverConfig, ...restConfig } = viteConfig;
  const safePlugins = (plugins || []).filter((p: any) => {
    // Filtrar plugins que podem causar problemas
    const pluginName = p?.name || '';
    return !pluginName.includes('jsxLoc') && !pluginName.includes('manusRuntime');
  });
  
  // Adicionar plugin para permitir TODOS os hosts (incluindo Tailscale Funnel)
  safePlugins.unshift(viteAllowAllHosts());

  // Remover proxy do serverConfig se existir
  const { proxy, allowedHosts, ...cleanServerConfig } = serverConfig || {};

  // Criar configuração do servidor que PERMITE TODOS OS HOSTS
  const serverConfigFinal = {
    ...serverOptions,
    ...cleanServerConfig,
    // MÚLTIPLAS tentativas de permitir todos os hosts
    allowedHosts: 'all' as const,
    // Tentar também como array vazio (algumas versões do Vite)
    // allowedHosts: [],
    // Desabilitar completamente a verificação de host
    host: '0.0.0.0',
    strictPort: false,
    // Desabilitar HTML proxy explicitamente
    proxy: undefined,
    // Permitir qualquer origem
    cors: true,
  };
  
  console.log('[Vite] Configuração do servidor:', {
    allowedHosts: serverConfigFinal.allowedHosts,
    host: serverConfigFinal.host,
    middlewareMode: serverOptions.middlewareMode,
  });

  const vite = await createViteServer({
    ...restConfig,
    plugins: safePlugins,
    configFile: false,
    server: serverConfigFinal,
    appType: "custom",
    optimizeDeps: {
      // Desabilitar otimizações que podem causar problemas com HTML proxy
      entries: [],
    },
  });

  // Interceptar requisições problemáticas antes que cheguem ao Vite
  app.use((req, res, next) => {
    // Permitir TODOS os hosts - necessário para Tailscale Funnel
    const host = req.headers.host;
    if (host) {
      // Log para debug
      console.log(`[Vite] Requisição recebida de host: ${host}`);
    }
    
    // Ignorar requisições de API - deixar o Express lidar com elas
    if (req.url && req.url.startsWith('/api/')) {
      next();
      return;
    }
    
    // Ignorar requisições de WebSocket do Vite HMR
    if (req.url && (req.url.includes('/@vite/client') || req.url.includes('/@react-refresh'))) {
      next();
      return;
    }
    
    // Se a URL contém html-proxy, retornar 404 imediatamente
    if (req.url && req.url.includes('html-proxy')) {
      res.status(404).end();
      return;
    }
    next();
  });

  // Wrapper AGGRESSIVO para o middleware do Vite que FORÇA permitir todos os hosts
  // Esta é a ÚLTIMA tentativa - interceptar TUDO antes do Vite
  app.use((req, res, next) => {
    // Salvar headers originais
    const originalHost = req.headers.host;
    const originalOrigin = req.headers.origin;
    
    // Se o host for do Tailscale Funnel ou qualquer host externo, interceptar COMPLETAMENTE
    if (originalHost && !originalHost.includes('localhost') && !originalHost.includes('127.0.0.1')) {
      console.log(`[Vite Wrapper] 🔄 Interceptando requisição de host externo: ${originalHost}`);
      
      // Criar um Stream de resposta customizado que intercepta TUDO
      let responseBody = '';
      let statusCode = 200;
      let headers: Record<string, string> = {};
      let isBlocked = false;
      
      // Interceptar writeHead ANTES de qualquer coisa
      const originalWriteHead = res.writeHead.bind(res);
      res.writeHead = function(code: number, message?: any, h?: any) {
        statusCode = code;
        if (typeof message === 'object' && message) {
          headers = message;
        } else if (h) {
          headers = h;
        }
        
        // Se for erro de host, BLOQUEAR o envio e continuar
        if (code === 403 || code === 400) {
          console.log(`[Vite Wrapper] ⚠️ Status ${code} detectado - verificando se é erro de host...`);
          isBlocked = true;
          // Não enviar resposta de erro - vamos continuar processando
        }
        return res;
      };
      
      // Interceptar write para capturar o corpo da resposta
      const originalWrite = res.write.bind(res);
      res.write = function(chunk: any, encoding?: any) {
        if (isBlocked) {
          // Se já detectamos bloqueio, verificar se é mensagem de erro de host
          const chunkStr = chunk?.toString() || '';
          if (chunkStr.includes('not allowed') && chunkStr.includes('host')) {
            console.log(`[Vite Wrapper] ⚠️ Mensagem de erro de host bloqueada`);
            console.log(`[Vite Wrapper] ✅ Ignorando bloqueio do Vite e continuando...`);
            // Limpar flags e permitir que continue
            isBlocked = false;
            statusCode = 200;
            responseBody = '';
            // Continuar processamento normalmente
            return true;
          }
        }
        
        // Acumular corpo da resposta se necessário
        if (chunk) {
          responseBody += chunk.toString();
        }
        return originalWrite(chunk, encoding);
      };
      
      // Interceptar end
      const originalEnd = res.end.bind(res);
      res.end = function(chunk?: any, encoding?: any) {
        if (isBlocked || (responseBody && responseBody.includes('not allowed') && responseBody.includes('host'))) {
          console.log(`[Vite Wrapper] ⚠️ Resposta bloqueada detectada - ignorando e continuando`);
          console.log(`[Vite Wrapper] ✅ Host ${originalHost} será permitido`);
          // Não enviar resposta de erro - continuar para próximo middleware
          isBlocked = false;
          statusCode = 200;
          responseBody = '';
          // Continuar para próximo handler (não chamar originalEnd)
          next();
          return res;
        }
        return originalEnd(chunk, encoding);
      };
    }
    
    // Chamar middleware do Vite
    // Se o Vite bloquear, nosso interceptor acima vai capturar
    vite.middlewares(req, res, (err?: any) => {
      if (err) {
        const errorMessage = err.message || String(err);
        if (errorMessage.includes('not allowed') || 
            errorMessage.includes('Invalid Host header') || 
            errorMessage.includes('host')) {
          console.log(`[Vite Wrapper] ⚠️ Erro de host no callback: ${errorMessage}`);
          console.log(`[Vite Wrapper] ✅ Ignorando e continuando com host: ${originalHost}`);
          // Continuar processamento
          next();
        } else {
          next(err);
        }
      } else {
        next();
      }
    });
  });
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    // Ignorar requisições de API - deixar o Express lidar com elas
    if (url && url.startsWith('/api/')) {
      next();
      return;
    }

    // Ignorar requisições de WebSocket do Vite HMR
    if (url && (url.includes('/@vite/client') || url.includes('/@react-refresh'))) {
      next();
      return;
    }

    // Ignorar requisições de HTML proxy
    if (url && url.includes('html-proxy')) {
      res.status(404).end();
      return;
    }

    // Ignorar requisições de arquivos estáticos (js, css, etc) - deixar o Vite lidar
    if (url && (url.endsWith('.js') || url.endsWith('.ts') || url.endsWith('.tsx') || 
                url.endsWith('.css') || url.endsWith('.json') || url.endsWith('.png') || 
                url.endsWith('.jpg') || url.endsWith('.svg') || url.endsWith('.ico') ||
                url.startsWith('/src/') || url.startsWith('/node_modules/'))) {
      next();
      return;
    }

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "../..",
        "client",
        "index.html"
      );

      // Verificar se o arquivo existe
      if (!fs.existsSync(clientTemplate)) {
        console.error(`[Vite] Template não encontrado: ${clientTemplate}`);
        res.status(404).send('Template não encontrado');
        return;
      }

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      console.error('[Vite] Erro ao processar template:', e);
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const distPath =
    process.env.NODE_ENV === "development"
      ? path.resolve(import.meta.dirname, "../..", "dist", "public")
      : path.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }

  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
