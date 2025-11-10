import express, { type Express } from "express";
import fs from "fs";
import { type Server } from "http";
import { nanoid } from "nanoid";
import path from "path";
import { createServer as createViteServer } from "vite";
import viteConfig from "../../vite.config";

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { 
      server,
      host: '0.0.0.0', // Permitir HMR de qualquer IP da rede
      port: undefined, // Usar a mesma porta do servidor
      clientPort: undefined, // Usar a mesma porta do servidor
    },
    allowedHosts: 'all', // Permitir TODOS os hosts (incluindo Tailscale Funnel .ts.net)
  };

  // Criar configuração do Vite sem plugins problemáticos
  const { plugins, server: serverConfig, ...restConfig } = viteConfig;
  const safePlugins = (plugins || []).filter((p: any) => {
    // Filtrar plugins que podem causar problemas
    const pluginName = p?.name || '';
    return !pluginName.includes('jsxLoc') && !pluginName.includes('manusRuntime');
  });

  // Remover proxy do serverConfig se existir
  const { proxy, allowedHosts, ...cleanServerConfig } = serverConfig || {};

  const vite = await createViteServer({
    ...restConfig,
    plugins: safePlugins,
    configFile: false,
    server: {
      ...serverOptions,
      ...cleanServerConfig,
      // Garantir que allowedHosts está definido como 'all'
      allowedHosts: 'all',
      // Desabilitar HTML proxy explicitamente
      proxy: undefined,
    },
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

  app.use(vite.middlewares);
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
