import type { Plugin } from 'vite';

/**
 * Plugin do Vite para permitir TODOS os hosts
 * Isso é necessário para permitir acesso via Tailscale Funnel e outros hosts externos
 */
export function viteAllowAllHosts(): Plugin {
  return {
    name: 'vite-allow-all-hosts',
    configureServer(server) {
      // Sobrescrever a função de verificação de host para permitir tudo
      const originalCheckHost = server.config.server?.host;
      
      // Desabilitar verificação de host completamente
      server.middlewares.use((req, res, next) => {
        // Permitir qualquer host - não verificar nada
        const host = req.headers.host;
        
        // Log para debug
        if (host && !host.includes('localhost') && !host.includes('127.0.0.1')) {
          console.log(`[Vite Plugin] Permitindo host: ${host}`);
        }
        
        // Não fazer nenhuma verificação - permitir tudo
        next();
      });
    },
    configurePreviewServer(server) {
      // Mesma coisa para preview server
      server.middlewares.use((req, res, next) => {
        const host = req.headers.host;
        if (host && !host.includes('localhost') && !host.includes('127.0.0.1')) {
          console.log(`[Vite Plugin Preview] Permitindo host: ${host}`);
        }
        next();
      });
    },
  };
}

