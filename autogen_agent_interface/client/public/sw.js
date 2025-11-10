// Service Worker para PWA
const CACHE_NAME = 'autogen-agent-v1';

// Instalar service worker
self.addEventListener('install', (event) => {
  console.log('[SW] Instalando service worker...');
  // Não bloquear a instalação - permitir que o service worker seja ativado imediatamente
  self.skipWaiting();
});

// Ativar service worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Ativando service worker...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Removendo cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Assumir controle de todas as páginas imediatamente
      return self.clients.claim();
    })
  );
});

// Interceptar requisições
self.addEventListener('fetch', (event) => {
  const url = event.request.url;
  
  // Em desenvolvimento (localhost), NÃO interceptar NENHUMA requisição
  // Deixar tudo passar direto para o Vite
  if (url.includes('localhost') || url.includes('127.0.0.1') || url.includes(':3000')) {
    return; // Não interceptar - deixar passar
  }
  
  // Para Tailscale (.ts.net), também não interceptar para evitar problemas
  // Tailscale Funnel usa HTTPS e precisa de conexões diretas
  if (url.includes('.ts.net')) {
    return; // Não interceptar - deixar passar direto
  }
  
  // Ignorar requisições de WebSocket, APIs, Vite, etc
  if (url.startsWith('ws://') || 
      url.startsWith('wss://') ||
      url.includes('/ws') ||
      url.includes('/api/') ||
      url.includes('/@vite/') ||
      url.includes('/@react-refresh') ||
      url.includes('/node_modules/') ||
      url.includes('/src/')) {
    return; // Não interceptar
  }

  // Para produção, usar estratégia network-first
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Se a requisição foi bem-sucedida, atualizar o cache
        if (response && response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // Se a requisição falhar (offline), retornar do cache
        return caches.match(event.request);
      })
  );
});

