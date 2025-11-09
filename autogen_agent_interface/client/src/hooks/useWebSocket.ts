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
  const {
    url = `ws://localhost:${import.meta.env.VITE_PORT || 3000}/ws`,
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
  const maxReconnectAttempts = 5;

  const connect = useCallback(() => {
    if (!enabled || wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      const clientId = `client_${Math.random().toString(36).substr(2, 9)}`;
      // WebSocket URL format: ws://host:port/ws/clientId
      const wsUrl = url.includes('/ws') ? `${url}/${clientId}` : `${url}/ws/${clientId}`;
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        setIsConnected(true);
        setIsConnecting(false);
        reconnectAttemptsRef.current = 0;
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
        setError(event);
        setIsConnecting(false);
        onError?.(event);
      };

      ws.onclose = () => {
        setIsConnected(false);
        setIsConnecting(false);
        onClose?.();

        // Tentar reconectar
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++;
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, 1000 * reconnectAttemptsRef.current);
        }
      };

      wsRef.current = ws;
    } catch (err) {
      console.error('Erro ao criar WebSocket:', err);
      setIsConnecting(false);
    }
  }, [url, enabled, onMessage, onError, onOpen, onClose]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
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
      connect();
    }

    return () => {
      disconnect();
    };
  }, [enabled, connect, disconnect]);

  return {
    isConnected,
    isConnecting,
    error,
    send,
    connect,
    disconnect,
  };
}

