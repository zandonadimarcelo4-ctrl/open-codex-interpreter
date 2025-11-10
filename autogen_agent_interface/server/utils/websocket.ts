/**
 * WebSocket Server para Chat em Tempo Real
 * Integração com AutoGen e sistema de voz
 */
import { WebSocketServer, WebSocket } from "ws";
import { Server } from "http";
import { IncomingMessage } from "http";
import { detectIntent } from "../../client/src/utils/intentDetector";
import { executeWithAutoGen } from "./autogen";

export interface WebSocketMessage {
  type: "text" | "audio" | "assistant" | "system" | "status" | "error" | "stream" | "agent_update";
  message?: string;
  content?: string;
  audio?: string;
  agent?: string;
  status?: string;
  timestamp?: string;
  data?: any;
}

export class ChatWebSocketServer {
  private wss: WebSocketServer;
  private connections: Map<string, WebSocket> = new Map();

  constructor(server: Server) {
    this.wss = new WebSocketServer({ 
      server,
      path: "/ws",
      perMessageDeflate: false, // Desabilitar compressão para melhor compatibilidade
      clientTracking: true, // Rastrear clientes conectados
    });

    this.wss.on("connection", (ws: WebSocket, req: IncomingMessage) => {
      // Log informações da conexão para debug
      const clientIP = req.socket.remoteAddress || 'unknown';
      const clientPort = req.socket.remotePort || 'unknown';
      console.log(`[WebSocket] Nova conexão recebida de ${clientIP}:${clientPort}`);
      console.log(`[WebSocket] Headers:`, {
        host: req.headers.host,
        origin: req.headers.origin,
        'user-agent': req.headers['user-agent'],
      });
      
      // Extrair clientId da URL
      const url = new URL(req.url || "", `http://${req.headers.host || "localhost"}`);
      const clientId = url.pathname.split("/").pop() || `client_${Date.now()}_${Date.now()}`;

      this.connections.set(clientId, ws);
      console.log(`[WebSocket] ✅ Cliente ${clientId} conectado de ${clientIP}:${clientPort}`);

      // Enviar mensagem de boas-vindas
      this.send(ws, {
        type: "system",
        message: "Bem-vindo ao Super Agent. Como posso ajudá-lo?",
        timestamp: new Date().toISOString(),
      });

      ws.on("message", async (data: Buffer) => {
        try {
          const message = JSON.parse(data.toString()) as WebSocketMessage;
          await this.handleMessage(ws, clientId, message);
        } catch (error) {
          console.error("[WebSocket] Erro ao processar mensagem:", error);
          this.send(ws, {
            type: "error",
            message: "Erro ao processar mensagem",
            timestamp: new Date().toISOString(),
          });
        }
      });

      ws.on("close", () => {
        console.log(`[WebSocket] Cliente ${clientId} desconectado`);
        this.connections.delete(clientId);
      });

      ws.on("error", (error: Error) => {
        console.error(`[WebSocket] Erro no cliente ${clientId}:`, error);
        this.connections.delete(clientId);
      });
    });

    console.log("[WebSocket] Servidor WebSocket iniciado em /ws");
  }

  private send(ws: WebSocket, message: WebSocketMessage) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  private async handleMessage(ws: WebSocket, clientId: string, message: WebSocketMessage) {
    if (message.type === "text") {
      const text = message.message || message.content || "";
      
      // Enviar confirmação
      this.send(ws, {
        type: "status",
        message: "Processando...",
        timestamp: new Date().toISOString(),
      });

      // Detectar intenção
      const intent = detectIntent(text);

      // Atualizar agentes ativos
      this.send(ws, {
        type: "agent_update",
        data: {
          agents: ["Planner", "Generator", "Executor"],
        },
        timestamp: new Date().toISOString(),
      });

      try {
        // Usar APENAS AutoGen Framework (único framework)
        const response = await executeWithAutoGen(text, intent, { clientId });

        // Enviar resposta completa
        this.send(ws, {
          type: "assistant",
          content: response,
          agent: "Super Agent (AutoGen)",
          timestamp: new Date().toISOString(),
        });

        // Limpar agentes ativos
        this.send(ws, {
          type: "agent_update",
          data: {
            agents: [],
          },
          timestamp: new Date().toISOString(),
        });

      } catch (error) {
        console.error("[WebSocket] Erro ao processar mensagem:", error);
        
        const errorMessage = error instanceof Error ? error.message : String(error);
        this.send(ws, {
          type: "error",
          message: errorMessage,
          timestamp: new Date().toISOString(),
        });
      }
    } else if (message.type === "audio") {
      // Processar áudio (STT)
      this.send(ws, {
        type: "status",
        message: "Processando áudio...",
        timestamp: new Date().toISOString(),
      });

      // Por enquanto, apenas simular processamento de áudio
      // Em produção, integrar com API de STT
      this.send(ws, {
        type: "error",
        message: "STT ainda não implementado. Use texto por enquanto.",
        timestamp: new Date().toISOString(),
      });
    }
  }

  broadcast(message: WebSocketMessage) {
    this.connections.forEach((ws) => {
      this.send(ws, message);
    });
  }

  getConnectionCount(): number {
    return this.connections.size;
  }
}

