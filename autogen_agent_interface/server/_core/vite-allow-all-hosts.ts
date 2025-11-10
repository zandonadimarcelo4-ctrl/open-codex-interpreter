import type { Plugin } from 'vite';

/**
 * Plugin do Vite para permitir TODOS os hosts
 * Isso é necessário para permitir acesso via Tailscale Funnel e outros hosts externos
 * 
 * Este plugin funciona tanto em modo servidor normal quanto em middlewareMode
 */
export function viteAllowAllHosts(): Plugin {
  return {
    name: 'vite-allow-all-hosts',
    enforce: 'pre', // Executar antes de outros plugins
    configureServer(server) {
      // Interceptar middleware do Vite para permitir todos os hosts
      const originalUse = server.middlewares.use.bind(server.middlewares);
      
      // Adicionar middleware no início para permitir todos os hosts
      server.middlewares.use((req, res, next) => {
        // Remover qualquer verificação de host - permitir tudo
        const host = req.headers.host;
        
        // Log para debug (apenas para hosts externos)
        if (host && !host.includes('localhost') && !host.includes('127.0.0.1')) {
          console.log(`[Vite Plugin] ✅ Permitindo host: ${host}`);
        }
        
        // Não fazer nenhuma verificação - permitir tudo
        // Remover header de host se necessário para evitar verificação
        next();
      });
      
      console.log('[Vite Plugin] ✅ Plugin vite-allow-all-hosts ativado - todos os hosts permitidos');
    },
    configurePreviewServer(server) {
      // Mesma coisa para preview server
      server.middlewares.use((req, res, next) => {
        const host = req.headers.host;
        if (host && !host.includes('localhost') && !host.includes('127.0.0.1')) {
          console.log(`[Vite Plugin Preview] ✅ Permitindo host: ${host}`);
        }
        next();
      });
    },
    // Hook para modificar a configuração do Vite
    config(config) {
      // Garantir que allowedHosts está definido como 'all'
      if (!config.server) {
        config.server = {};
      }
      // Tentar múltiplas formas de permitir todos os hosts
      config.server.allowedHosts = 'all';
      config.server.host = '0.0.0.0';
      
      // Se 'all' não funcionar, tentar lista vazia ou true
      // Algumas versões do Vite podem não suportar 'all'
      try {
        // Verificar se há uma propriedade interna que podemos modificar
        (config.server as any).strictPort = false;
      } catch (e) {
        // Ignorar erros
      }
      
      return config;
    },
    // Hook de configuração resolvida (executa após todas as configurações serem resolvidas)
    configResolved(config) {
      // Garantir que allowedHosts está definido mesmo após resolução
      if (config.server && config.server.allowedHosts !== 'all') {
        console.warn('[Vite Plugin] ⚠️ allowedHosts não está definido como "all", forçando...');
        config.server.allowedHosts = 'all';
      }
    },
  };
}

