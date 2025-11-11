import express, { type Express } from "express";
import fs from "fs";
import { type Server } from "http";
import path from "path";

/**
 * ============================================================================
 * CONFIGURAÇÃO DO PARCEL - GUIA RÁPIDO PARA DEVS JUNIORES
 * ============================================================================
 * 
 * O QUE ESTE ARQUIVO FAZ?
 * - Configura o Parcel para servir arquivos em desenvolvimento
 * - Funciona com localhost (http://localhost:3000)
 * - Funciona com Tailscale (https://revision-pc.tailb3613b.ts.net)
 * - Funciona em LAN (rede local) - outros dispositivos podem acessar
 * 
 * COMO FUNCIONA?
 * - Parcel watch faz build dos arquivos para .parcel-dist
 * - Express serve os arquivos estáticos do .parcel-dist diretamente
 * - Parcel watch monitora mudanças e faz rebuild automaticamente
 * - Express automaticamente serve os novos arquivos após rebuild
 * - Funciona perfeitamente com Tailscale e LAN
 * 
 * IMPORTANTE: 
 * - Execute 'npm run dev:parcel' em outro terminal para fazer build/watch
 * - Ou execute 'npm run dev:parcel:build' para fazer apenas um build
 * - Express serve os arquivos estáticos automaticamente
 * 
 * ============================================================================
 */

/**
 * Configura o servidor Parcel para desenvolvimento
 * 
 * @param app - Aplicação Express
 * @param server - Servidor HTTP do Node.js  
 * @param port - Porta do servidor (padrão: 3000)
 */
export async function setupParcel(app: Express, _server: Server, port?: number) {
  const serverPort = port || parseInt(process.env.PORT || '3000', 10);
  const distPath = path.resolve(
    import.meta.dirname,
    "../..",
    ".parcel-dist"
  );

  console.log('[Parcel] ⚙️  Configurando servidor de arquivos estáticos');
  console.log('[Parcel] 📍 Porta Express:', serverPort);
  console.log('[Parcel] 📍 Diretório de build:', distPath);
  console.log('[Parcel] 💡 Servindo arquivos estáticos diretamente do build');
  console.log('[Parcel] 💡 Para fazer build/watch, execute: npm run dev:parcel');
  console.log('[Parcel] 💡 Para fazer apenas um build: npm run dev:parcel:build');

  // Verificar se o diretório de build existe
  if (!fs.existsSync(distPath)) {
    console.warn(`[Parcel] ⚠️  Diretório de build não encontrado: ${distPath}`);
    console.warn(`[Parcel] 💡 Execute 'npm run dev:parcel:build' para fazer build inicial`);
    console.warn(`[Parcel] 💡 Ou execute 'npm run dev:parcel' para watch mode`);
    
    // Tentar criar o diretório
    try {
      fs.mkdirSync(distPath, { recursive: true });
      console.log(`[Parcel] ✅ Diretório criado: ${distPath}`);
      console.log(`[Parcel] 💡 Agora execute 'npm run dev:parcel:build' para gerar os arquivos`);
    } catch (error) {
      console.error(`[Parcel] ❌ Erro ao criar diretório: ${error}`);
    }
  } else {
    console.log(`[Parcel] ✅ Diretório de build encontrado: ${distPath}`);
    
    // Verificar se index.html existe
    const indexPath = path.join(distPath, "index.html");
    if (fs.existsSync(indexPath)) {
      console.log(`[Parcel] ✅ Arquivos de build encontrados e prontos para servir`);
    } else {
      console.warn(`[Parcel] ⚠️  index.html não encontrado no diretório de build`);
      console.warn(`[Parcel] 💡 Execute 'npm run dev:parcel:build' para gerar os arquivos`);
    }
  }

  // Servir arquivos estáticos do build do Parcel
  app.use(express.static(distPath, {
    maxAge: 0, // Sem cache em desenvolvimento
    etag: false,
    lastModified: false,
  }));

  // Servir index.html para todas as rotas não-API/não-WebSocket
  app.use("*", (req, res, next) => {
    const url = req.url || req.originalUrl || '';
    const pathName = req.path || url.split('?')[0];

    // Ignorar API, WebSocket e arquivos públicos já servidos pelo Express
    if (
      pathName.startsWith("/api/") ||
      pathName.startsWith("/ws") ||
      pathName === "/manifest.json" ||
      pathName === "/favicon.png" ||
      pathName === "/icon-192.png" ||
      pathName === "/icon-512.png" ||
      pathName === "/sw.js"
    ) {
      return next();
    }

    // Servir index.html para todas as outras rotas
    const indexPath = path.join(distPath, "index.html");
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      // Se index.html não existe ainda, retornar mensagem útil
      res.status(503).send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Parcel Build Pendente</title>
            <style>
              body {
                font-family: system-ui, sans-serif;
                display: flex;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
                margin: 0;
                background: #1a1a1a;
                color: white;
              }
              .container {
                text-align: center;
                padding: 2rem;
                max-width: 600px;
              }
              h1 { color: #ff6b6b; }
              code {
                background: #2a2a2a;
                padding: 0.5rem 1rem;
                border-radius: 4px;
                display: inline-block;
                margin: 1rem 0;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>⏳ Parcel Build Pendente</h1>
              <p>O Parcel ainda não gerou os arquivos de build.</p>
              <p>Execute em outro terminal:</p>
              <code>npm run dev:parcel</code>
              <p>Ou aguarde alguns segundos e recarregue a página.</p>
            </div>
          </body>
        </html>
      `);
    }
  });

  console.log('[Parcel] ✅ Configuração concluída!');
  console.log('[Parcel] 📡 Servindo arquivos estáticos de:', distPath);
  console.log('[Parcel] 💡 Express serve os arquivos diretamente (sem proxy)');
  console.log('[Parcel] 💡 Para desenvolvimento, execute Parcel em outro terminal:');
  console.log('[Parcel]    - npm run dev:parcel (watch mode - rebuild automático)');
  console.log('[Parcel]    - npm run dev:parcel:build (build único)');
}

export function serveStatic(app: Express) {
  const distPath =
    process.env.NODE_ENV === "development"
      ? path.resolve(import.meta.dirname, "../..", ".parcel-dist")
      : path.resolve(import.meta.dirname, "public");

  if (!fs.existsSync(distPath)) {
    console.error(
      `[Parcel] ❌ Diretório não encontrado: ${distPath}`
    );
    console.error(
      `[Parcel] 💡 Execute 'npm run build' para criar os arquivos de produção`
    );
    return;
  }
  app.use(express.static(distPath));
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}