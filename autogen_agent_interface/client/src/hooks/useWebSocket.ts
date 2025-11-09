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
  // Detectar porta correta do servidor
  const getServerPort = () => {
    // Tentar usar a porta do servidor atual
    if (typeof window !== 'undefined') {
      const currentPort = window.location.port || (window.location.protocol === 'https:' ? '443' : '80');
      return currentPort !== '' ? currentPort : (import.meta.env.VITE_PORT || '3000');
    }
    return import.meta.env.VITE_PORT || '3000';
  };

  const {
    url = `ws://localhost:${getServerPort()}/ws`,
    enabled = true,
    onMessage,
    onError,
    onOpen,
    onClose,
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<Event | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const isConnectingRef = useRef(false);
  const maxReconnectAttempts = 5;
  const reconnectDelayRef = useRef(1000); // Delay inicial de 1 segundo

  const connect = useCallback(() => {
    // Evitar múltiplas tentativas simultâneas
    if (!enabled || isConnectingRef.current || wsRef.current?.readyState === WebSocket.OPEN || wsRef.current?.readyState === WebSocket.CONNECTING) {
      return;
    }

    // Limpar timeout anterior se existir
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    isConnectingRef.current = true;
    setIsConnecting(true);
    setError(null);

    try {
      // WebSocket URL format: ws://host:port/ws (sem clientId na URL, será extraído no servidor)
      const wsUrl = url.includes('/ws') ? url : `${url}/ws`;
      
      // Log apenas na primeira tentativa ou após sucesso
      if (reconnectAttemptsRef.current === 0) {
        console.log(`[WebSocket] Conectando a: ${wsUrl}`);
      }
      
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        setIsConnected(true);
        setIsConnecting(false);
        isConnectingRef.current = false;
        reconnectAttemptsRef.current = 0;
        reconnectDelayRef.current = 1000; // Reset delay
        console.log('[WebSocket] ✅ Conectado com sucesso');
        onOpen?.();
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as WebSocketMessage;
          onMessage?.(data);
        } catch (err) {
          console.error('Erro ao parsear mensagem WebSocket:', err);
        }
      };

      ws.onerror = (event) => {
        // Não logar erro repetidamente - apenas na primeira tentativa
        if (reconnectAttemptsRef.current === 0) {
          console.warn('[WebSocket] ⚠️ Erro na conexão:', event);
        }
        setError(event);
        setIsConnecting(false);
        isConnectingRef.current = false;
        onError?.(event);
      };

      ws.onclose = (event) => {
        setIsConnected(false);
        setIsConnecting(false);
        isConnectingRef.current = false;
        onClose?.();

        // Não tentar reconectar se foi fechado intencionalmente (código 1000)
        if (event.code === 1000) {
          console.log('[WebSocket] Conexão fechada intencionalmente');
          return;
        }

        // Tentar reconectar apenas se não excedeu o limite
        if (reconnectAttemptsRef.current < maxReconnectAttempts && enabled) {
          reconnectAttemptsRef.current++;
          // Backoff exponencial com limite máximo de 30 segundos
          const delay = Math.min(reconnectDelayRef.current * Math.pow(2, reconnectAttemptsRef.current - 1), 30000);
          reconnectDelayRef.current = delay;
          
          // Log apenas a cada 5 tentativas para evitar spam
          if (reconnectAttemptsRef.current % 5 === 0 || reconnectAttemptsRef.current === 1) {
            console.log(`[WebSocket] Tentando reconectar (${reconnectAttemptsRef.current}/${maxReconnectAttempts}) em ${delay}ms...`);
          }
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        } else if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
          console.warn(`[WebSocket] ❌ Limite de tentativas de reconexão atingido (${maxReconnectAttempts}). Parando tentativas.`);
        }
      };

      wsRef.current = ws;
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
    
    // Resetar contadores
    reconnectAttemptsRef.current = 0;
    reconnectDelayRef.current = 1000;
    isConnectingRef.current = false;
    
    // Fechar WebSocket se existir
    if (wsRef.current) {
      // Fechar com código 1000 (normal closure) para evitar reconexão automática
      if (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING) {
        wsRef.current.close(1000, 'Desconexão intencional');
      }
      wsRef.current = null;
    }
    
    setIsConnected(false);
    setIsConnecting(false);
  }, []);

  const send = useCallback((message: WebSocketMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket não está conectado');
    }
  }, []);

  useEffect(() => {
    if (enabled) {
      // Pequeno delay para evitar múltiplas tentativas no mount
      const timeoutId = setTimeout(() => {
        connect();
      }, 100);
      
      return () => {
        clearTimeout(timeoutId);
        disconnect();
      };
    } else {
      disconnect();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]); // Apenas 'enabled' nas dependências para evitar loops

  return {
    isConnected,
    isConnecting,
    error,
    send,
    connect,
    disconnect,
  };
}

