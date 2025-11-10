/**
 * Hook para WebSocket - Chat em Tempo Real
 */
import { useEffect, useRef, useState, useCallback } from 'react';

export interface WebSocketMessage {
  type: 'text' | 'audio' | 'assistant' | 'system' | 'status' | 'error' | 'stream' | 'agent_update';
  message?: string;
  content?: string;
  audio?: string;
  agent?: string;
  status?: string;
  timestamp?: string;
  data?: any;
}

export interface UseWebSocketOptions {
  url?: string;
  enabled?: boolean;
  onMessage?: (message: WebSocketMessage) => void;
  onError?: (error: Event) => void;
  onOpen?: () => void;
  onClose?: () => void;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  // Detectar host e porta corretos do servidor
  const getWebSocketUrl = () => {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      const protocol = window.location.protocol;
      const wsProtocol = protocol === 'https:' ? 'wss:' : 'ws:';
      
      // Se a porta estiver vazia, significa que é porta padrão (80 para HTTP, 443 para HTTPS)
      // Neste caso, não incluir a porta na URL do WebSocket
      const port = window.location.port;
      
      // Se a porta estiver vazia ou for padrão, não incluir na URL
      if (!port || port === '80' || port === '443') {
        // Para HTTP padrão (80), usar ws://host/ws
        // Para HTTPS padrão (443), usar wss://host/ws
        return `${wsProtocol}//${hostname}/ws`;
      } else {
        // Para outras portas, incluir na URL
        return `${wsProtocol}//${hostname}:${port}/ws`;
      }
    }
    return `ws://localhost:${import.meta.env.VITE_PORT || 3000}/ws`;
  };

  const {
    url = getWebSocketUrl(),
    enabled = true,
    onMessage,
    onError,
    onOpen,
    onClose,
  } = options;

  // Singleton para garantir apenas uma conexão WebSocket global
  let globalWSInstance: WebSocket | null = null;
  let globalWSListeners: Set<(message: WebSocketMessage) => void> = new Set();
  let globalWSState: { isConnected: boolean; isConnecting: boolean } = { isConnected: false, isConnecting: false };
  
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<Event | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const isConnectingRef = useRef(false);
  const maxReconnectAttempts = 3; // Reduzido de 5 para 3
  const reconnectDelayRef = useRef(2000); // Aumentado para 2 segundos inicial
  const messageHandlerRef = useRef<(message: WebSocketMessage) => void | undefined>();

  const connect = useCallback(() => {
    // Evitar múltiplas tentativas simultâneas
    if (!enabled || isConnectingRef.current) {
      return;
    }

    // Se já existe uma conexão global ativa, reutilizar
    if (globalWSInstance && (globalWSInstance.readyState === WebSocket.OPEN || globalWSInstance.readyState === WebSocket.CONNECTING)) {
      wsRef.current = globalWSInstance;
      setIsConnected(globalWSInstance.readyState === WebSocket.OPEN);
      setIsConnecting(globalWSInstance.readyState === WebSocket.CONNECTING);
      
      // Adicionar listener se ainda não estiver registrado
      if (onMessage && !globalWSListeners.has(onMessage)) {
        globalWSListeners.add(onMessage);
      }
      return;
    }

    // Limpar timeout anterior se existir
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    // Verificar se já está conectando globalmente
    if (globalWSState.isConnecting) {
      return;
    }

    isConnectingRef.current = true;
    globalWSState.isConnecting = true;
    setIsConnecting(true);
    setError(null);

    try {
      // Fechar conexão anterior se existir
      if (globalWSInstance) {
        try {
          globalWSInstance.close(1000, 'Nova conexão');
        } catch (e) {
          // Ignorar erros ao fechar
        }
        globalWSInstance = null;
      }

      // WebSocket URL format: ws://host:port/ws (sem clientId na URL, será extraído no servidor)
      const wsUrl = url.includes('/ws') ? url : `${url}/ws`;
      
      // Log apenas na primeira tentativa
      if (reconnectAttemptsRef.current === 0) {
        console.log(`[WebSocket] Conectando a: ${wsUrl}`);
      }
      
      const ws = new WebSocket(wsUrl);
      globalWSInstance = ws;
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        setIsConnecting(false);
        isConnectingRef.current = false;
        globalWSState.isConnected = true;
        globalWSState.isConnecting = false;
        reconnectAttemptsRef.current = 0;
        reconnectDelayRef.current = 2000; // Reset delay
        console.log('[WebSocket] ✅ Conectado com sucesso');
        onOpen?.();
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as WebSocketMessage;
          // Notificar todos os listeners registrados
          globalWSListeners.forEach(listener => {
            try {
              listener(data);
            } catch (err) {
              console.error('[WebSocket] Erro ao processar mensagem:', err);
            }
          });
          // Também chamar o callback local se existir
          onMessage?.(data);
        } catch (err) {
          console.error('[WebSocket] Erro ao parsear mensagem:', err);
        }
      };

      ws.onerror = (event) => {
        // Não logar erro repetidamente - apenas na primeira tentativa
        if (reconnectAttemptsRef.current === 0) {
          console.warn('[WebSocket] ⚠️ Erro na conexão');
        }
        setError(event);
        setIsConnecting(false);
        isConnectingRef.current = false;
        globalWSState.isConnecting = false;
        onError?.(event);
      };

      ws.onclose = (event) => {
        setIsConnected(false);
        setIsConnecting(false);
        isConnectingRef.current = false;
        globalWSState.isConnected = false;
        globalWSState.isConnecting = false;
        
        // Limpar instância global se for esta conexão
        if (globalWSInstance === ws) {
          globalWSInstance = null;
        }
        
        onClose?.();

        // Não tentar reconectar se foi fechado intencionalmente (código 1000)
        if (event.code === 1000) {
          console.log('[WebSocket] Conexão fechada intencionalmente');
          return;
        }
        
        // NÃO reconectar automaticamente se a conexão foi fechada
        // Deixa o React gerenciar a reconexão através do useEffect
        // Isso previne loops infinitos de reconexão
        console.log('[WebSocket] Conexão fechada. Aguardando reconexão manual...');
        
        // Limpar referência global
        if (globalWSInstance === ws) {
          globalWSInstance = null;
        }
        
        // NÃO tentar reconectar automaticamente aqui
        // O useEffect vai detectar que a conexão foi fechada e reconectar se necessário
      };
    } catch (err) {
      console.error('[WebSocket] ❌ Erro ao criar WebSocket:', err);
      setIsConnecting(false);
      isConnectingRef.current = false;
    }
  }, [url, enabled, onMessage, onError, onOpen, onClose]);

  const disconnect = useCallback(() => {
    // Limpar timeout de reconexão
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    // Remover listener se existir
    if (onMessage && globalWSListeners.has(onMessage)) {
      globalWSListeners.delete(onMessage);
    }
    
    // Resetar contadores apenas se não há outros listeners
    if (globalWSListeners.size === 0) {
      reconnectAttemptsRef.current = 0;
      reconnectDelayRef.current = 2000;
      isConnectingRef.current = false;
      
      // Fechar WebSocket global apenas se não há mais listeners
      if (globalWSInstance) {
        try {
          if (globalWSInstance.readyState === WebSocket.OPEN || globalWSInstance.readyState === WebSocket.CONNECTING) {
            globalWSInstance.close(1000, 'Desconexão intencional');
          }
        } catch (e) {
          // Ignorar erros
        }
        globalWSInstance = null;
      }
      
      globalWSState.isConnected = false;
      globalWSState.isConnecting = false;
    }
    
    // Fechar referência local
    wsRef.current = null;
    setIsConnected(false);
    setIsConnecting(false);
  }, [onMessage]);

  const send = useCallback((message: WebSocketMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket não está conectado');
    }
  }, []);

  // Registrar listener quando onMessage mudar
  useEffect(() => {
    if (onMessage && enabled) {
      if (!globalWSListeners.has(onMessage)) {
        globalWSListeners.add(onMessage);
      }
    }
    
    return () => {
      if (onMessage && globalWSListeners.has(onMessage)) {
        globalWSListeners.delete(onMessage);
      }
    };
  }, [onMessage, enabled]);

  useEffect(() => {
    if (!enabled) {
      disconnect();
      return;
    }
    
    // Conectar apenas uma vez quando o componente monta
    // Não reconectar automaticamente se já estiver conectado
    if (!globalWSInstance || globalWSInstance.readyState === WebSocket.CLOSED) {
      const timeoutId = setTimeout(() => {
        connect();
      }, 500);
      
      return () => {
        clearTimeout(timeoutId);
        // NÃO desconectar automaticamente - deixa a conexão aberta
        // disconnect();
      };
    }
    
    // Se já está conectado, não fazer nada
    return () => {
      // Não desconectar - manter conexão aberta
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, url]); // Apenas 'enabled' e 'url' nas dependências

  return {
    isConnected,
    isConnecting,
    error,
    send,
    connect,
    disconnect,
  };
}

