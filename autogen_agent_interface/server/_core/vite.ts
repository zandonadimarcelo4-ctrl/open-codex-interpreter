import express, { type Express } from "express";
import fs from "fs";
import { type Server } from "http";
import path from "path";
import { createServer as createViteServer } from "vite";
import viteConfig from "../../vite.config";
import { viteAllowAllHosts } from "./vite-allow-all-hosts";

/**
 * ============================================================================
 * CONFIGURAÇÃO DO VITE - GUIA RÁPIDO PARA DEVS JUNIORES
 * ============================================================================
 * 
 * O QUE ESTE ARQUIVO FAZ?
 * - Configura o Vite para servir arquivos em desenvolvimento
 * - Funciona com localhost (http://localhost:3000)
 * - Funciona com Tailscale (https://revision-pc.tailb3613b.ts.net)
 * 
 * POR QUE HMR ESTÁ DESABILITADO?
 * - HMR (Hot Module Replacement) causa loops infinitos de recarregamento
 * - Para recarregar: pressione F5 no navegador
 * 
 * POR QUE MODIFICAMOS URLs PARA TAILSCALE?
 * - O Vite gera URLs com "localhost" no HTML
 * - Tailscale precisa de URLs com o hostname correto
 * - Substituímos "localhost" pelo hostname do Tailscale
 * 
 * COMO ADICIONAR NOVOS TIPOS DE ARQUIVO?
 * - Veja a lista "isStaticAsset" abaixo
 * - Adicione: url.endsWith('.seu-tipo-de-arquivo')
 * 
 * ============================================================================
 */

/**
 * Configura o servidor Vite para desenvolvimento
 * 
 * @param app - Aplicação Express
 * @param server - Servidor HTTP do Node.js  
 * @param port - Porta do servidor (padrão: 3000)
 */
export async function setupVite(app: Express, _server: Server, port?: number) {
  // ==========================================================================
  // PASSO 1: CONFIGURAÇÃO BÁSICA
  // ==========================================================================
  
  const serverPort = port || parseInt(process.env.PORT || '3000', 10);
  const useHttps = process.env.USE_HTTPS === 'true';
  
  // HMR DESABILITADO COMPLETAMENTE - evita loops infinitos e problemas no Tailscale
  // Para recarregar código: pressione F5 no navegador
  // Nota: disableHMR não é mais usado diretamente, mas documentado para referência
  
  console.log('[Vite] ⚙️  Configurando servidor');
  console.log('[Vite] 📍 Porta:', serverPort);
  console.log('[Vite] 🔥 HMR: DESABILITADO (pressione F5 para recarregar)');

  // ==========================================================================
  // PASSO 2: CONFIGURAÇÃO DO SERVIDOR VITE
  // ==========================================================================
  
  const serverOptions = {
    middlewareMode: true,  // Vite como middleware do Express (não servidor standalone)
    hmr: false,            // HMR COMPLETAMENTE desabilitado (evita loops e problemas)
    allowedHosts: true,    // CRÍTICO: Permite TODOS os hosts (localhost, Tailscale, etc)
    strictPort: false,     // Não força porta específica
    ws: false,             // WebSocket do Vite desabilitado (não precisa para HMR)
  };

  // ==========================================================================
  // PASSO 3: CONFIGURAR PLUGINS
  // ==========================================================================
  
  const { plugins, server: serverConfig, ...restConfig } = viteConfig;
  
  // Filtrar plugins que causam problemas
  const safePlugins = (plugins || []).filter((p: any) => {
    const pluginName = p?.name || '';
    return !pluginName.includes('jsxLoc') && !pluginName.includes('manusRuntime');
  });
  
  // Adicionar plugin que permite todos os hosts (necessário para Tailscale)
  safePlugins.unshift(viteAllowAllHosts());

  // ==========================================================================
  // PASSO 4: LIMPAR CONFIGURAÇÕES CONFLITANTES
  // ==========================================================================
  
  const { proxy, allowedHosts: _, ...cleanServerConfig } = serverConfig || {};

  // Configuração final do servidor (SIMPLIFICADA)
  const serverConfigFinal: any = {
    ...serverOptions,
    ...cleanServerConfig,
    allowedHosts: true,     // Permite qualquer host
    host: '0.0.0.0',        // Escuta em todas as interfaces
    strictPort: false,
    proxy: undefined,       // Sem proxy
    cors: true,             // CORS habilitado
    hmr: false,             // HMR COMPLETAMENTE desabilitado
    ws: false,              // WebSocket do Vite desabilitado
  };

  // ==========================================================================
  // PASSO 5: CRIAR SERVIDOR VITE
  // ==========================================================================
  
  // ==========================================================================
  // PASSO 6: CRIAR PLUGIN PARA BLOQUEAR VITE CLIENT COMPLETAMENTE
  // ==========================================================================
  
  // Plugin customizado para BLOQUEAR completamente o Vite client
  const blockViteClientPlugin = {
    name: 'block-vite-client',
    enforce: 'pre' as const,
    transformIndexHtml: {
      enforce: 'pre' as const,
      transform(html: string) {
        // Remover TODOS os scripts do Vite client ANTES de qualquer processamento
        const patterns = [
          /<script[^>]*>[\s\S]*?@vite\/client[\s\S]*?<\/script>/gi,
          /<script[^>]*src=["'][^"']*@vite\/client[^"']*["'][^>]*><\/script>/gi,
          /<script[^>]*type=["']module["'][^>]*src=["'][^"']*@vite\/client[^"']*["'][^>]*><\/script>/gi,
          /<script[^>]*vite[^>]*client[^>]*><\/script>/gi,
        ];
        
        patterns.forEach(pattern => {
          html = html.replace(pattern, '');
        });
        
        return html;
      },
    },
    resolveId(id: string) {
      // Bloquear importações do Vite client
      if (id.includes('@vite/client') || id.includes('vite/client')) {
        return { id: 'data:text/javascript,', external: true };
      }
      return null;
    },
    load(id: string) {
      // Bloquear carregamento do Vite client
      if (id.includes('@vite/client') || id.includes('vite/client')) {
        return 'export {};'; // Retornar módulo vazio
      }
      return null;
    },
    transform(code: string, id: string) {
      // BLOQUEAR qualquer código JavaScript que tente usar o Vite client
      // Isso intercepta o código ANTES de ser compilado
      if (!code || typeof code !== 'string') {
        return null;
      }
      
      const originalCode = code;
      
      // Se o arquivo inteiro é sobre o Vite client, retornar vazio
      if (id.includes('@vite/client') || id.includes('vite/client')) {
        return { code: 'export {};', map: null };
      }
      
      // Remover imports do Vite client
      code = code.replace(/import\s+.*?from\s+['"]@vite\/client['"]/gi, '');
      code = code.replace(/import\s+.*?from\s+['"]vite\/client['"]/gi, '');
      // Remover referências a import.meta.hot (HMR API)
      code = code.replace(/import\.meta\.hot/gi, 'undefined');
      // Remover qualquer código que tente conectar ao Vite
      code = code.replace(/vite.*connecting/gi, '');
      code = code.replace(/vite.*polling/gi, '');
      // Remover código do Vite client injetado
      code = code.replace(/['"]@vite\/client['"]/g, '""');
      code = code.replace(/@vite\/client/g, '');
      
      // Se o código foi modificado, retornar o código modificado
      if (code !== originalCode) {
        return { code, map: null };
      }
      
      // Se não foi modificado, retornar null (não modificar)
      return null;
    },
  };
  
  // Adicionar plugin de bloqueio ANTES de todos os outros
  safePlugins.unshift(blockViteClientPlugin);

  const vite = await createViteServer({
    ...restConfig,
    plugins: safePlugins,
    configFile: false,
    server: serverConfigFinal,
    appType: "custom",
    optimizeDeps: {
      entries: [],  // Desabilitar otimizações que podem causar problemas
      exclude: ['@vite/client'], // Excluir Vite client das otimizações
    },
    // IMPORTANTE: Desabilitar completamente o client do Vite
    define: {
      'import.meta.hot': 'undefined', // Desabilitar HMR API
    },
  });

  // ==========================================================================
  // PASSO 6: MIDDLEWARE PARA ASSETS ESTÁTICOS
  // ==========================================================================
  // 
  // Este middleware processa arquivos estáticos (JS, CSS, imagens, etc)
  // ANTES de servir o HTML da aplicação.
  
  app.use((req, res, next) => {
    const url = req.url || req.originalUrl || '';
    const hostname = req.hostname || req.headers.host?.split(':')[0] || 'localhost';
    const isTailscale = hostname.endsWith('.ts.net');
    
    // Log apenas em desenvolvimento
    if (process.env.NODE_ENV === 'development' || isTailscale) {
      console.log(`[Vite] 📦 ${req.method} ${url}`);
    }
    
    // Ignorar API e WebSocket (deixa Express processar)
    if (url.startsWith('/api/') || url.startsWith('/ws')) {
      next();
      return;
    }
    
    // Lista de tipos de arquivo que o Vite deve processar
    const staticFileExtensions = [
      '.js', '.mjs', '.ts', '.tsx', '.jsx',  // JavaScript/TypeScript
      '.css', '.scss', '.sass', '.less',     // Estilos
      '.json',                                // JSON
      '.svg', '.png', '.jpg', '.jpeg', '.gif', '.webp', '.ico',  // Imagens
      '.woff', '.woff2', '.ttf',             // Fontes
    ];
    
    const staticPaths = [
      '/src/',
      '/node_modules/',
      '/@vite/',
      '/@react-refresh',
      '/@fs/',
    ];
    
    const staticFiles = [
      '/manifest.json',
      '/favicon.png',
    ];
    
    // Verificar se é asset estático
    const isStaticAsset = 
      staticPaths.some(path => url.includes(path)) ||
      staticFileExtensions.some(ext => url.endsWith(ext)) ||
      staticFiles.includes(url);
    
    // Se for asset estático, processar com Vite
    if (isStaticAsset) {
      // Para Tailscale, adicionar headers de proxy
      if (isTailscale) {
        req.headers['x-forwarded-host'] = req.headers.host || hostname;
        req.headers['x-forwarded-proto'] = 'https';
        req.headers['x-forwarded-for'] = req.ip || req.socket?.remoteAddress || '127.0.0.1';
      }
      
      // Processar com Vite
      // O plugin vite-allow-all-hosts garante que todos os hosts sejam aceitos
      vite.middlewares(req, res, (err?: any) => {
        if (err) {
          // Log detalhado do erro
          console.error(`[Vite] ❌ Erro: ${url}`, {
            message: err?.message,
            status: err?.status || err?.statusCode || 500,
            code: err?.code,
            host: req.headers.host,
          });
          
          // Retornar erro se ainda não foi respondido
          if (!res.headersSent) {
            res.status(err?.status || 500).json({
              error: 'Erro ao processar asset',
              message: err?.message || 'Erro desconhecido',
              url,
              host: req.headers.host,
            });
          }
        }
      });
      return;
    }
    
    // Se não for asset, continuar para próximo middleware (serve HTML)
    next();
  });

  // ==========================================================================
  // PASSO 7: MIDDLEWARE PARA SERVIR HTML (SPA ROUTING)
  // ==========================================================================
  // 
  // Este middleware serve o index.html para todas as rotas.
  // Isso permite que o React Router funcione (Single Page Application).
  
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl || req.url || '/';

    // Ignorar API e WebSocket
    if (url.startsWith('/api/') || url.startsWith('/ws')) {
      next();
      return;
    }

    // Se já foi respondido, não fazer nada
    if (res.headersSent) {
      return;
    }

    try {
      // Caminho para o arquivo HTML
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

      // Ler o arquivo HTML
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      
      // Adicionar cache buster em desenvolvimento (força recarregar após mudanças)
      if (process.env.NODE_ENV === 'development') {
      template = template.replace(
        `src="/src/main.tsx"`,
          `src="/src/main.tsx?v=${Date.now()}"`
        );
      }
      
      // Detectar se é Tailscale
      const hostname = req.hostname || req.headers.host?.split(':')[0] || 'localhost';
      const isTailscale = hostname.endsWith('.ts.net');
      
      // ======================================================================
      // BLOQUEAR VITE CLIENT ANTES DE TRANSFORMAR HTML
      // ======================================================================
      // 
      // IMPORTANTE: O Vite injeta scripts do client mesmo com HMR desabilitado
      // Precisamos remover ANTES de transformar o HTML
      // 
      // ======================================================================
      
      // Remover qualquer referência ao Vite client do template ANTES de transformar
      const viteClientPatterns = [
        /<script[^>]*>[\s\S]*?@vite\/client[\s\S]*?<\/script>/gi,
        /<script[^>]*src=["'][^"']*@vite\/client[^"']*["'][^>]*><\/script>/gi,
        /@vite\/client/gi,
      ];
      
      viteClientPatterns.forEach(pattern => {
        template = template.replace(pattern, '');
      });
      
      // Transformar HTML com Vite (MAS o Vite client já foi removido)
      // IMPORTANTE: Interceptar transformIndexHtml para bloquear injeção do client
      let page = await vite.transformIndexHtml(url, template);
      
      // BLOQUEAR IMEDIATAMENTE após transformação (antes de qualquer processamento)
      // O Vite pode ter injetado o client durante transformIndexHtml
      const immediateBlockPatterns = [
        /<script[^>]*>[\s\S]*?@vite\/client[\s\S]*?<\/script>/gi,
        /<script[^>]*src=["'][^"']*@vite\/client[^"']*["'][^>]*><\/script>/gi,
        /<script[^>]*type=["']module["'][^>]*src=["'][^"']*@vite\/client[^"']*["'][^>]*><\/script>/gi,
        /@vite\/client/gi,
      ];
      
      immediateBlockPatterns.forEach(pattern => {
        page = page.replace(pattern, '');
      });
      
      // ======================================================================
      // REMOVER SCRIPTS DO VITE CLIENT (APÓS TRANSFORMAÇÃO)
      // ======================================================================
      // 
      // O Vite pode ter injetado scripts durante a transformação
      // Remover TODOS os scripts do Vite client para prevenir
      // tentativas de conexão WebSocket que causam loops infinitos
      // 
      // ======================================================================
      
      // Lista completa de padrões para remover
      const allViteClientPatterns = [
        // Script inline do Vite client
        /<script[^>]*>[\s\S]*?@vite\/client[\s\S]*?<\/script>/gi,
        // Script com src do Vite client
        /<script[^>]*src=["'][^"']*@vite\/client[^"']*["'][^>]*><\/script>/gi,
        // Script type="module" do Vite client
        /<script[^>]*type=["']module["'][^>]*src=["'][^"']*@vite\/client[^"']*["'][^>]*><\/script>/gi,
        // Scripts que mencionam vite/client
        /<script[^>]*vite[^>]*client[^>]*><\/script>/gi,
        // Scripts com import de @vite/client
        /<script[^>]*>[\s\S]*?import[^"']*["']@vite\/client["'][\s\S]*?<\/script>/gi,
        // Qualquer string que contenha @vite/client
        /["']@vite\/client["']/g,
        // URLs com @vite/client
        /@vite\/client/g,
      ];
      
      // Aplicar remoção múltiplas vezes (até 10 vezes para garantir)
      let changed = true;
      let iterations = 0;
      while (changed && iterations < 10) {
        const beforeLength = page.length;
        allViteClientPatterns.forEach(pattern => {
          page = page.replace(pattern, '');
        });
        changed = page.length !== beforeLength;
        iterations++;
      }
      
      // Remover portas incorretas do Vite (como 24678)
      page = page.replace(/localhost:24678/g, 'localhost:3000');
      page = page.replace(/:\/\/[^\/]+:24678/g, (match) => match.replace(':24678', ':3000'));
      page = page.replace(/:24678/g, ':3000');
      
      // Remover qualquer script que tente conectar ao Vite
      page = page.replace(/<script[^>]*>[\s\S]*?vite.*connecting[\s\S]*?<\/script>/gi, '');
      page = page.replace(/<script[^>]*>[\s\S]*?polling.*restart[\s\S]*?<\/script>/gi, '');
      
      console.log(`[Vite] ✅ Scripts do Vite client removidos (${iterations} iterações)`);
      
      // ======================================================================
      // CORRIGIR URLs PARA TAILSCALE
      // ======================================================================
      // 
      // PROBLEMA: O Vite gera URLs com "localhost" no HTML
      // SOLUÇÃO: Substituir "localhost" pelo hostname do Tailscale
      
      if (isTailscale) {
        // ======================================================================
        // CORRIGIR URLs PARA TAILSCALE (SIMPLIFICADO)
        // ======================================================================
        // 
        // REGRA: Tailscale Funnel SEMPRE usa porta padrão (443 para HTTPS)
        // NUNCA adicionar porta à URL do Tailscale!
        // 
        // O QUE FAZEMOS:
        // 1. Substituir "localhost" pelo hostname do Tailscale
        // 2. Remover portas de URLs do Tailscale (se existirem)
        // 3. Usar HTTPS/WSS (Tailscale Funnel sempre usa HTTPS)
        // 
        // ======================================================================
        
        const protocol = 'https';
        const wsProtocol = 'wss';
        // IMPORTANTE: URL SEM PORTA (Funnel usa porta padrão 443)
        const tailscaleBaseUrl = `${protocol}://${hostname}`;
        const wsBaseUrl = `${wsProtocol}://${hostname}`;
        
        console.log(`[Vite] 🔄 Corrigindo URLs para Tailscale: ${tailscaleBaseUrl}`);
        
        // Lista de substituições SIMPLIFICADA
        // Substituir localhost por hostname do Tailscale (com ou sem porta)
        page = page.replace(/\bhttps?:\/\/localhost(?::\d+)?/gi, tailscaleBaseUrl);
        page = page.replace(/\bwss?:\/\/localhost(?::\d+)?/gi, wsBaseUrl);
        // Remover porta de URLs do Tailscale (se existir)
        page = page.replace(/(\.ts\.net):\d+/g, '$1');
        // URLs em strings JavaScript (com aspas)
        page = page.replace(/'https?:\/\/localhost:\d+/g, `'${tailscaleBaseUrl}`);
        page = page.replace(/'wss?:\/\/localhost:\d+/g, `'${wsBaseUrl}`);
        // URLs em atributos HTML
        page = page.replace(/(src|href)=["']https?:\/\/localhost(?::\d+)?/gi, (_match, attr) => `${attr}="${tailscaleBaseUrl}`);
        page = page.replace(/(src|href)=["']wss?:\/\/localhost(?::\d+)?/gi, (_match, attr) => `${attr}="${wsBaseUrl}`);
        
        // ======================================================================
        // SCRIPT SIMPLIFICADO PARA CORRIGIR URLs DO TAILSCALE
        // ======================================================================
        // 
        // O QUE ESTE SCRIPT FAZ?
        // 1. Substitui "localhost" pelo hostname do Tailscale
        // 2. Remove portas de URLs do Tailscale (Funnel usa porta padrão 443)
        // 3. Corrige WebSocket e fetch() para usar URLs corretas
        // 
        // POR QUE É NECESSÁRIO?
        // - O Vite gera URLs com "localhost" no código
        // - Tailscale precisa de URLs com o hostname correto
        // - Tailscale Funnel não precisa de porta na URL (usa 443 por padrão)
        // 
        // ======================================================================
        
        const tailscaleScript = `<script>
// Script para corrigir URLs do Tailscale (SIMPLIFICADO E CORRIGIDO)
(function() {
  // Evitar execução múltipla (prevenir loops)
  if (window.__tailscaleScriptLoaded) return;
  window.__tailscaleScriptLoaded = true;
  
  // Verificar se estamos no Tailscale
  var hostname = window.location.hostname;
  if (!hostname || !hostname.endsWith('.ts.net')) return;
  
  // Obter origin SEM porta (Tailscale Funnel usa porta padrão 443)
  var protocol = window.location.protocol;
  var baseUrl = protocol + '//' + hostname;
  var wsBaseUrl = (protocol === 'https:' ? 'wss:' : 'ws:') + '//' + hostname;
  
  console.log('[Tailscale] ✅ Corrigindo URLs para:', baseUrl);
  
  // Função auxiliar: corrigir URL (SIMPLIFICADA)
  function fixUrl(url) {
    if (typeof url !== 'string') return url;
    
    var fixed = url;
    
    // 1. Substituir localhost pelo hostname do Tailscale
    if (fixed.includes('localhost')) {
      fixed = fixed.replace(/https?:\\/\\/localhost(:\\d+)?/gi, baseUrl);
      fixed = fixed.replace(/wss?:\\/\\/localhost(:\\d+)?/gi, wsBaseUrl);
    }
    
    // 2. Remover porta de URLs do Tailscale (Funnel não precisa de porta)
    fixed = fixed.replace(/(\\.ts\\.net):\\d+/g, '$1');
    
    return fixed;
  }
  
  // Corrigir fetch() - PREVENIR LOOP INFINITO
  var _origFetch = window.fetch.bind(window);
  window.fetch = function(input, init) {
    // Se input for string, corrigir URL
    if (typeof input === 'string') {
      input = fixUrl(input);
    }
    // Se input for Request object, criar novo com URL corrigida
    if (input && typeof input === 'object' && input.url) {
      input = new Request(fixUrl(input.url), input);
    }
    // Chamar fetch original (não recursivo!)
    return _origFetch(input, init);
  };
  
  // Corrigir WebSocket() - SIMPLIFICADO
  var _OrigWebSocket = window.WebSocket;
  window.WebSocket = function(url, protocols) {
    url = fixUrl(url);
    return protocols ? new _OrigWebSocket(url, protocols) : new _OrigWebSocket(url);
  };
  
  // Preservar propriedades do WebSocket original
  Object.setPrototypeOf(window.WebSocket, _OrigWebSocket);
  Object.setPrototypeOf(window.WebSocket.prototype, _OrigWebSocket.prototype);
  ['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED'].forEach(function(key) {
    window.WebSocket[key] = _OrigWebSocket[key];
  });
  
  console.log('[Tailscale] ✅ URLs corrigidas (fetch e WebSocket)');
})();
</script>`;
        
        // Inserir script no <head> (ANTES de qualquer outro script)
        if (page.includes('</head>')) {
          page = page.replace('</head>', tailscaleScript + '</head>');
        } else {
          page = page.replace('<body', tailscaleScript + '<body');
        }
        console.log(`[Vite] ✅ Script Tailscale adicionado (URLs corrigidas, portas removidas)`);
      }
      
      // ======================================================================
      // CORRIGIR URLs PARA LOCALHOST (HTTP)
      // ======================================================================
      // 
      // Se não usar HTTPS e não for Tailscale, forçar HTTP/WS
      
      if (!useHttps && !isTailscale) {
        // Substituir HTTPS por HTTP
        page = page.replace(/https:\/\/localhost/g, 'http://localhost');
        page = page.replace(/wss:\/\/localhost/g, 'ws://localhost');
        
        // Substituir para IPs locais também
        page = page.replace(/https:\/\/(\d+\.\d+\.\d+\.\d+)/g, 'http://$1');
        page = page.replace(/wss:\/\/(\d+\.\d+\.\d+\.\d+)/g, 'ws://$1');
        
        // Remover script do Vite client (HMR desabilitado)
        page = page.replace(
          /<script[^>]*src=["'][^"']*@vite\/client[^"']*["'][^>]*><\/script>/gi,
          '<!-- Vite HMR desabilitado -->'
        );
      }
      
      // Enviar HTML transformado
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      // Tratamento de erros
      console.error('[Vite] ❌ Erro ao processar template:', e);
      if (vite.ssrFixStacktrace) {
      vite.ssrFixStacktrace(e as Error);
      }
      next(e);
    }
  });
}

/**
 * Serve arquivos estáticos em PRODUÇÃO
 * 
 * Esta função é usada apenas quando NODE_ENV=production.
 * Em desenvolvimento, o Vite serve os arquivos.
 * 
 * @param app - Aplicação Express
 */
export function serveStatic(app: Express) {
  const distPath =
    process.env.NODE_ENV === "development"
      ? path.resolve(import.meta.dirname, "../..", ".parcel-dist")
      : path.resolve(import.meta.dirname, "../..", "dist", "public");
      
  if (!fs.existsSync(distPath)) {
    console.error(
      `[Vite] ❌ Diretório não encontrado: ${distPath}`
    );
    console.error(
      `[Vite] 💡 Execute 'npm run dev:vite:build' para criar os arquivos de desenvolvimento`
    );
    console.error(
      `[Vite] 💡 Execute 'npm run build' para criar os arquivos de produção`
    );
    return;
  }

  console.log(`[Vite] ✅ Servindo arquivos estáticos de: ${distPath}`);

  // Servir arquivos estáticos
  app.use(express.static(distPath, {
    maxAge: 0, // Sem cache em desenvolvimento
    etag: false,
    lastModified: false,
  }));

  // Fallback para index.html (SPA routing)
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
