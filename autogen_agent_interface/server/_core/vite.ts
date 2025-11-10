import express, { type Express } from "express";
import fs from "fs";
import { type Server } from "http";
import { nanoid } from "nanoid";
import path from "path";
import { createServer as createViteServer } from "vite";
import viteConfig from "../../vite.config";
import { viteAllowAllHosts } from "./vite-allow-all-hosts";

export async function setupVite(app: Express, server: Server, port?: number) {
  // Obter porta do servidor (passada como parâmetro ou do env)
  const serverPort = port || parseInt(process.env.PORT || '3000', 10);
  
  const serverOptions = {
    middlewareMode: true,
    hmr: { 
      server,
      // HMR deve usar localhost para o navegador conseguir conectar
      // Não usar '0.0.0.0' pois navegadores não conseguem conectar a esse endereço
      host: 'localhost',
      port: serverPort,
      clientPort: serverPort,
      protocol: process.env.USE_HTTPS === 'true' ? 'wss' : 'ws',
    },
    allowedHosts: 'all', // Permitir TODOS os hosts (incluindo Tailscale Funnel .ts.net)
    // Desabilitar completamente a verificação de host
    strictPort: false,
  };
  
  console.log('[Vite] Configurando HMR na porta:', serverPort);

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
  // IMPORTANTE: host precisa ser '0.0.0.0' para aceitar conexões externas,
  // mas HMR precisa usar 'localhost' ou hostname real para o navegador conseguir conectar
  const serverConfigFinal: any = {
    ...serverOptions,
    ...cleanServerConfig,
    // Permitir TODOS os hosts usando true (equivalente a 'all')
    allowedHosts: true,
    // Desabilitar completamente a verificação de host
    host: '0.0.0.0', // Servidor escuta em todas as interfaces
    strictPort: false,
    // Desabilitar HTML proxy explicitamente
    proxy: undefined,
    // Permitir qualquer origem
    cors: true,
    // Configurar HMR (já configurado em serverOptions acima)
    hmr: serverOptions.hmr,
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

  // Middleware do Vite - deve processar TODAS as requisições de assets (JS, CSS, TS, TSX, etc)
  // IMPORTANTE: Este middleware deve processar arquivos antes do catch-all para HTML
  app.use((req, res, next) => {
    const url = req.url || req.originalUrl || '';
    
    // Se for requisição de API ou WebSocket, pular Vite
    if (url.startsWith('/api/') || url.startsWith('/ws')) {
      next();
      return;
    }
    
    // Se for requisição de arquivo estático ou módulo Vite, deixar Vite processar
    // Vite precisa processar essas requisições para fazer transformações e HMR
    const isStaticAsset = url.includes('/src/') || 
                         url.includes('/node_modules/') ||
                         url.includes('/@vite/') ||
                         url.includes('/@react-refresh') ||
                         url.includes('/@fs/') ||
                         url.endsWith('.ts') ||
                         url.endsWith('.tsx') ||
                         url.endsWith('.js') ||
                         url.endsWith('.jsx') ||
                         url.endsWith('.mjs') ||
                         url.endsWith('.css') ||
                         url.endsWith('.json') ||
                         url.endsWith('.png') ||
                         url.endsWith('.jpg') ||
                         url.endsWith('.jpeg') ||
                         url.endsWith('.svg') ||
                         url.endsWith('.ico') ||
                         url.endsWith('.webp') ||
                         url.endsWith('.woff') ||
                         url.endsWith('.woff2') ||
                         url.endsWith('.ttf');
    
    if (isStaticAsset) {
      // Chamar middleware do Vite diretamente para arquivos estáticos
      vite.middlewares(req, res, (err?: any) => {
        if (err) {
          console.error(`[Vite] Erro ao processar ${url}:`, err.message);
          // Se for erro de host, continuar mesmo assim
          if (err.message && err.message.includes('host')) {
            next();
          } else {
            next(err);
          }
        }
        // Vite processou (com sucesso ou não), não chamar next() aqui
        // Se Vite não conseguir processar, ele já respondeu com 404
      });
      return;
    }
    
    // Para outras requisições (HTML, rotas SPA, etc), continuar para próximo middleware
    next();
  });
  
  // Catch-all para servir index.html (SPA routing)
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl || req.url || '/';

    // Ignorar requisições de API - deixar o Express lidar com elas
    if (url.startsWith('/api/')) {
      next();
      return;
    }

    // Ignorar requisições de WebSocket
    if (url.startsWith('/ws')) {
      next();
      return;
    }

    // Se já foi respondido, não fazer nada
    if (res.headersSent) {
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
        console.error(`[Vite] ❌ Template não encontrado: ${clientTemplate}`);
        res.status(404).send('Template não encontrado');
        return;
      }

      // Ler index.html e transformar com Vite
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      
      // Adicionar cache buster apenas em desenvolvimento
      if (process.env.NODE_ENV === 'development') {
        template = template.replace(
          `src="/src/main.tsx"`,
          `src="/src/main.tsx?v=${Date.now()}"`
        );
      }
      
      // Transformar HTML com Vite (injeta scripts do HMR, etc)
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      console.error('[Vite] ❌ Erro ao processar template:', e);
      if (vite.ssrFixStacktrace) {
        vite.ssrFixStacktrace(e as Error);
      }
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
