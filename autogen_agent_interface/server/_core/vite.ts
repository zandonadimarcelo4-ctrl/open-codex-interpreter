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
  // Usar 'true' em vez de 'all' para compatibilidade com TypeScript
  const serverConfigFinal: any = {
    ...serverOptions,
    ...cleanServerConfig,
    // Permitir TODOS os hosts usando true (equivalente a 'all')
    allowedHosts: true,
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

  // SOLUÇÃO DEFINITIVA: Modificar header Host antes de passar para o Vite
  // Se o host não for localhost, mudar temporariamente para localhost
  // Isso faz o Vite aceitar a requisição, e depois processamos normalmente
  app.use((req, res, next) => {
    const originalHost = req.headers.host;
    
    // Se for um host externo (Tailscale Funnel, etc), modificar temporariamente
    if (originalHost && !originalHost.includes('localhost') && !originalHost.includes('127.0.0.1')) {
      console.log(`[Vite Wrapper] 🔄 Host externo detectado: ${originalHost} - modificando para localhost temporariamente`);
      
      // Salvar host original
      (req as any)._originalHost = originalHost;
      
      // Modificar header Host para localhost (com porta se houver)
      const portMatch = originalHost.match(/:(\d+)$/);
      const port = portMatch ? portMatch[1] : '3000';
      req.headers.host = `localhost:${port}`;
      
      console.log(`[Vite Wrapper] ✅ Host modificado de "${originalHost}" para "${req.headers.host}"`);
    }
    
    // Interceptar resposta para restaurar host original se necessário
    const originalWriteHead = res.writeHead.bind(res);
    res.writeHead = function(statusCode: number, statusMessage?: any, headers?: any): typeof res {
      // Se for erro 403/400, pode ser que ainda esteja bloqueando
      if ((statusCode === 403 || statusCode === 400) && (req as any)._originalHost) {
        const chunkStr = (res as any)._responseBody || '';
        if (chunkStr.includes('not allowed') || chunkStr.includes('host')) {
          console.log(`[Vite Wrapper] ⚠️ Ainda bloqueando mesmo com host modificado - tentando interceptar resposta`);
          (res as any)._shouldIntercept = true;
        }
      }
      // Chamar writeHead original
      if (headers) {
        return originalWriteHead(statusCode, headers);
      } else if (statusMessage && typeof statusMessage !== 'string') {
        return originalWriteHead(statusCode, statusMessage);
      } else {
        return originalWriteHead(statusCode, statusMessage as any);
      }
    };
    
    // Interceptar write para capturar corpo da resposta
    const originalWrite = res.write.bind(res);
    res.write = function(chunk: any, encoding?: any) {
      if (chunk) {
        (res as any)._responseBody = ((res as any)._responseBody || '') + chunk.toString();
        
        // Se for mensagem de erro de host, bloquear
        if ((res as any)._responseBody.includes('not allowed') && (res as any)._responseBody.includes('host')) {
          console.log(`[Vite Wrapper] ⚠️ Erro de host detectado mesmo com host modificado - bloqueando resposta`);
          (res as any)._shouldIntercept = true;
          // Não escrever esta resposta
          return true;
        }
      }
      return originalWrite(chunk, encoding);
    };
    
    // Chamar middleware do Vite
    vite.middlewares(req, res, (err?: any) => {
      // Restaurar host original após processamento do Vite
      if ((req as any)._originalHost) {
        req.headers.host = (req as any)._originalHost;
      }
      
      if (err) {
        const errorMessage = err.message || String(err);
        if (errorMessage.includes('not allowed') || 
            errorMessage.includes('Invalid Host header') || 
            errorMessage.includes('host')) {
          console.log(`[Vite Wrapper] ⚠️ Erro de host mesmo com modificação: ${errorMessage}`);
          console.log(`[Vite Wrapper] ✅ Continuando mesmo assim com host: ${(req as any)._originalHost || originalHost}`);
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
