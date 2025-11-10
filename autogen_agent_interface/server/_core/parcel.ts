import express, { type Express } from "express";
import fs from "fs";
import { type Server } from "http";
import path from "path";
import { createProxyMiddleware } from "http-proxy-middleware";

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
 * POR QUE PARCEL?
 * - Zero-config: Não precisa de configuração complexa
 * - Funciona perfeitamente em LAN: Escuta em 0.0.0.0 por padrão
 * - HMR estável: Hot Module Replacement sem loops infinitos
 * - Tailscale funciona: Sem problemas de hostname
 * - Simples para devs juniores: Configuração mínima
 * 
 * COMO FUNCIONA?
 * - Parcel roda em uma porta separada (ex: 1234)
 * - Express faz proxy das requisições para o Parcel
 * - Parcel processa e serve os arquivos (JS, CSS, etc)
 * - Funciona perfeitamente com Tailscale e LAN
 * 
 * IMPORTANTE: Você precisa iniciar o Parcel manualmente ou via script:
 *   npx parcel serve client/index.html --host 0.0.0.0 --port 1234
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
  const parcelPort = parseInt(process.env.PARCEL_PORT || '1234', 10);
  
  console.log('[Parcel] ⚙️  Configurando servidor Parcel');
  console.log('[Parcel] 📍 Porta Express:', serverPort);
  console.log('[Parcel] 📍 Porta Parcel:', parcelPort);
  console.log('[Parcel] 🌐 Host: 0.0.0.0 (acessível de LAN e Tailscale)');
  console.log('[Parcel] 🔥 HMR: ATIVO (Hot Module Replacement)');
  console.log('[Parcel] 💡 Certifique-se de que o Parcel está rodando na porta', parcelPort);

  // Caminho para o arquivo HTML de entrada
  const clientTemplate = path.resolve(
    import.meta.dirname,
    "../..",
    "client",
    "index.html"
  );

  // Verificar se o arquivo existe
  if (!fs.existsSync(clientTemplate)) {
    console.error(`[Parcel] ❌ Template não encontrado: ${clientTemplate}`);
    throw new Error(`Template não encontrado: ${clientTemplate}`);
  }

  // ==========================================================================
  // CONFIGURAR PROXY NO EXPRESS
  // ==========================================================================
  // 
  // Fazer proxy de todas as requisições para o Parcel
  // Exceto requisições de API (/api) e WebSocket (/ws)
  // 
  // ==========================================================================

  // Criar proxy middleware para o Parcel
  const parcelProxy = createProxyMiddleware({
    target: `http://localhost:${parcelPort}`,
    changeOrigin: true,
    ws: false, // Não fazer proxy de WebSocket (Express gerencia)
    logLevel: process.env.NODE_ENV === 'development' ? 'info' : 'silent',
    onError: (err, req, res) => {
      console.error('[Parcel] ❌ Erro no proxy:', err.message);
      console.error('[Parcel] 💡 Certifique-se de que o Parcel está rodando na porta', parcelPort);
      if (!res.headersSent) {
        res.status(503).json({
          error: 'Parcel server not available',
          message: `Parcel server is not running on port ${parcelPort}`,
          suggestion: `Start Parcel with: npx parcel serve client/index.html --host 0.0.0.0 --port ${parcelPort}`
        });
      }
    },
  });

  // Middleware para fazer proxy das requisições para o Parcel
  app.use((req, res, next) => {
    const url = req.url || req.originalUrl || '';

    // Ignorar API e WebSocket (deixa Express processar)
    if (url.startsWith('/api/') || url.startsWith('/ws')) {
      next();
      return;
    }

    // Se já foi respondido, não fazer nada
    if (res.headersSent) {
      return;
    }

    // Fazer proxy para o Parcel
    parcelProxy(req, res, next);
  });

  console.log('[Parcel] ✅ Proxy configurado!');
  console.log(`[Parcel] 📡 Proxy: Express (${serverPort}) → Parcel (${parcelPort})`);
  console.log('[Parcel] 💡 Para iniciar o Parcel, execute em outro terminal:');
  console.log(`[Parcel]    npx parcel serve client/index.html --host 0.0.0.0 --port ${parcelPort}`);
}

/**
 * Serve arquivos estáticos em PRODUÇÃO
 * 
 * Esta função é usada apenas quando NODE_ENV=production.
 * Em desenvolvimento, o Parcel serve os arquivos.
 * 
 * @param app - Aplicação Express
 */
export function serveStatic(app: Express) {
  const distPath =
    process.env.NODE_ENV === "development"
      ? path.resolve(import.meta.dirname, "../..", "dist", "public")
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

  // Servir arquivos estáticos
  app.use(express.static(distPath));

  // Fallback para index.html (SPA routing)
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}

