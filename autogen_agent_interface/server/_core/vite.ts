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

  // Wrapper para o middleware do Vite que FORÇA permitir todos os hosts
  app.use((req, res, next) => {
    // Salvar headers originais
    const originalHost = req.headers.host;
    const originalOrigin = req.headers.origin;
    
    // INTERCEPTAR e modificar comportamento se necessário
    // Se o host for do Tailscale Funnel, garantir que será aceito
    
    // Criar um objeto de resposta customizado que intercepta writeHead
    const originalWriteHead = res.writeHead.bind(res);
    res.writeHead = function(statusCode: number, statusMessage?: any, headers?: any) {
      // Se for erro 403 ou 400 relacionado a host, ignorar
      if (statusCode === 403 || statusCode === 400) {
        const message = typeof statusMessage === 'string' ? statusMessage : '';
        if (message.includes('host') || message.includes('Host') || message.includes('not allowed')) {
          console.log(`[Vite Wrapper] ⚠️ Status ${statusCode} bloqueado - ignorando verificação de host`);
          console.log(`[Vite Wrapper] ✅ Permitindo host: ${originalHost}`);
          // Não chamar writeHead com erro - deixar continuar
          return res;
        }
      }
      return originalWriteHead(statusCode, statusMessage, headers);
    };
    
    // Interceptar write para capturar mensagens de erro
    const originalWrite = res.write.bind(res);
    res.write = function(chunk: any, encoding?: any) {
      if (chunk && typeof chunk === 'string' && chunk.includes('not allowed') && chunk.includes('host')) {
        console.log(`[Vite Wrapper] ⚠️ Mensagem de erro bloqueada: ${chunk.substring(0, 100)}`);
        console.log(`[Vite Wrapper] ✅ Ignorando bloqueio e permitindo host: ${originalHost}`);
        // Não escrever a mensagem de erro
        return true;
      }
      return originalWrite(chunk, encoding);
    };
    
    // Chamar middleware do Vite com tratamento de erro
    try {
      vite.middlewares(req, res, (err?: any) => {
        if (err) {
          // Se houver erro relacionado a host, ignorar completamente
          const errorMessage = err.message || String(err);
          if (errorMessage.includes('not allowed') || 
              errorMessage.includes('Invalid Host header') || 
              errorMessage.includes('host') ||
              errorMessage.includes('Host')) {
            console.log(`[Vite Wrapper] ⚠️ Erro de host capturado e ignorado: ${errorMessage}`);
            console.log(`[Vite Wrapper] ✅ Continuando com host: ${originalHost}`);
            // Não passar o erro adiante - continuar processamento
            next();
          } else {
            next(err);
          }
        } else {
          next();
        }
      });
    } catch (error: any) {
      // Se houver exceção relacionada a host, ignorar
      const errorMessage = error?.message || String(error);
      if (errorMessage.includes('not allowed') || 
          errorMessage.includes('Invalid Host header') || 
          errorMessage.includes('host')) {
        console.log(`[Vite Wrapper] ⚠️ Exceção de host capturada e ignorada: ${errorMessage}`);
        console.log(`[Vite Wrapper] ✅ Continuando com host: ${originalHost}`);
        next();
      } else {
        next(error);
      }
    }
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
