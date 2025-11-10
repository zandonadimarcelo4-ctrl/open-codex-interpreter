import type { Plugin } from 'vite';

/**
 * ============================================================================
 * PLUGIN VITE: PERMITIR TODOS OS HOSTS
 * ============================================================================
 * 
 * O QUE ESTE PLUGIN FAZ?
 * - Permite que QUALQUER host acesse o servidor Vite
 * - Necessário para Tailscale Funnel funcionar
 * 
 * POR QUE É NECESSÁRIO?
 * - Por padrão, o Vite só aceita requisições de "localhost"
 * - Tailscale usa um hostname diferente (ex: revision-pc.tailb3613b.ts.net)
 * - Sem este plugin, o Vite rejeitaria requisições do Tailscale (erro 403)
 * 
 * COMO FUNCIONA?
 * - Força `allowedHosts: true` na configuração do Vite
 * - Adiciona headers de proxy para requisições Tailscale
 * 
 * ============================================================================
 */

/**
 * Plugin do Vite que permite TODOS os hosts
 * 
 * @returns Plugin do Vite configurado
 */
export function viteAllowAllHosts(): Plugin {
  return {
    name: 'vite-allow-all-hosts',
    enforce: 'pre', // Executar ANTES de outros plugins
    
    // Hook: Configurar servidor
    configureServer(server) {
      // Forçar allowedHosts: true
      if (server.config && server.config.server) {
        (server.config.server as any).allowedHosts = true;
        
        // Garantir que host seja 0.0.0.0
        if (!server.config.server.host) {
          server.config.server.host = '0.0.0.0';
        }
      }
      
      // Adicionar middleware para processar requisições Tailscale
      server.middlewares.use((req, res, next) => {
        const host = req.headers.host || '';
        
        // Se for Tailscale, adicionar headers de proxy
        if (host.endsWith('.ts.net')) {
          req.headers['x-forwarded-host'] = host;
          req.headers['x-forwarded-proto'] = 'https';
          console.log(`[Vite Plugin] ✅ Tailscale: ${host}`);
        }
        
        next();
      });
      
      console.log('[Vite Plugin] ✅ Plugin ativado - todos os hosts permitidos');
    },
    
    // Hook: Configurar servidor de preview
    configurePreviewServer(server) {
      // Mesma coisa para preview server
      server.middlewares.use((req, res, next) => {
        const host = req.headers.host;
        if (host && !host.includes('localhost') && !host.includes('127.0.0.1')) {
          console.log(`[Vite Plugin] ✅ Preview: ${host}`);
        }
        next();
      });
    },
    
    // Hook: Modificar configuração
    config(config) {
      // Garantir que allowedHosts está definido
      if (!config.server) {
        config.server = {};
      }
      
      config.server.allowedHosts = 'all';
      config.server.host = '0.0.0.0';
      
      return config;
    },
    
    // Hook: Configuração resolvida
    configResolved(config) {
      // Garantir que allowedHosts está definido mesmo após resolução
      if (config.server && config.server.allowedHosts !== 'all') {
        console.warn('[Vite Plugin] ⚠️  Forçando allowedHosts: all');
        config.server.allowedHosts = 'all';
      }
    },
  };
}
