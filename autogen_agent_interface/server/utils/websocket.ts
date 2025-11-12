/**
 * WebSocket Server para Chat em Tempo Real
 * Integração com AutoGen e sistema de voz
 */
import { WebSocketServer, WebSocket } from "ws";
import { Server } from "http";
import { IncomingMessage } from "http";
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

      // Detectar intenção (usando mesma lógica do routers.ts)
      let intent: { type: string; confidence: number; actionType?: string; reason?: string };
      try {
        // Primeiro: tentar regras rápidas (baixa latência)
        const rulesIntent = detectIntentLocal(text);
        
        // Se confiança alta (>0.9), usar diretamente
        if (rulesIntent.confidence > 0.9) {
          intent = rulesIntent;
          console.log(`[WebSocket] ✅ Intent detectado por regras: ${intent.type} (confiança: ${intent.confidence})`);
        } else {
          // Casos ambíguos: usar LLM (classificação mais precisa)
          console.log(`[WebSocket] 🔄 Intent ambíguo (confiança: ${rulesIntent.confidence}), usando LLM...`);
          const { classifyIntentHybrid } = await import("./intent_classifier_bridge");
          const llmIntent = await classifyIntentHybrid(text, rulesIntent);
          
          // Converter formato LLM para formato local
          intent = {
            type: llmIntent.intent === "execution" ? "action" : llmIntent.intent,
            confidence: llmIntent.confidence,
            actionType: llmIntent.action_type || undefined,
            reason: llmIntent.reasoning,
          };
          console.log(`[WebSocket] ✅ Intent detectado por LLM: ${intent.type} (confiança: ${intent.confidence})`);
        }
      } catch (error) {
        // Fallback para regras se LLM falhar
        console.warn(`[WebSocket] ⚠️ Erro ao usar LLM para classificação, usando regras: ${error}`);
        intent = detectIntentLocal(text);
      }

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

/**
 * Detecção de intenção local (regras rápidas)
 * Mesma lógica do routers.ts
 */
function detectIntentLocal(message: string): { type: string; confidence: number; actionType?: string; reason?: string } {
  const lowerMessage = message.toLowerCase();
  
  // Palavras-chave para comandos diretos (alta prioridade) - EXECUTAR AUTOMATICAMENTE
  const commandKeywords = [
    'faça', 'execute', 'rode', 'crie', 'delete', 'executa', 'abrir', 'abre', 
    'abrir meu', 'abrir o', 'abrir a', 'abre meu', 'abre o', 'abre a', 
    'abrir vs code', 'abrir code', 'executa vs code', 'executa code', 
    'abre vs code', 'abre code', 'fazer', 'faz', 'criar', 'cria',
    'rodar', 'roda', 'iniciar', 'inicia', 'abrir aplicativo', 'abrir programa',
    'executar', 'rodar aplicativo', 'rodar programa', 'abrir arquivo',
    'criar arquivo', 'escrever código', 'buscar', 'pesquisar', 'pesquisa',
    'instalar', 'instala', 'baixar', 'baixa', 'copiar', 'copia', 'mover', 'move',
    'deletar', 'apagar', 'apaga', 'editar', 'edita', 'modificar', 'modifica'
  ];
  
  // Palavras-chave para ações (média prioridade) - EXECUTAR AUTOMATICAMENTE
  const actionKeywords = [
    'criar', 'fazer', 'executar', 'rodar', 'buscar', 'pesquisar', 
    'criar arquivo', 'escrever código', 'abrir aplicativo', 'abrir programa', 
    'iniciar', 'inicia', 'rodar aplicativo', 'rodar programa', 'abrir arquivo',
    'instalar', 'baixar', 'copiar', 'mover', 'deletar', 'apagar', 'editar', 'modificar'
  ];
  
  // Palavras-chave para conversa/cumprimentos (alta prioridade - NÃO executar)
  const conversationKeywords = [
    'tudo bem', 'tudo bom', 'tudo certo', 'tudo certo?', 'tudo bem?', 'tudo bom?',
    'eai', 'e aí', 'e ai', 'eae', 'e aê',
    'oi', 'olá', 'opa', 'eae', 'e aê',
    'como vai', 'como está', 'como vai?', 'como está?',
    'beleza', 'beleza?', 'tranquilo', 'tranquilo?',
    'bom dia', 'boa tarde', 'boa noite',
    'tchau', 'até logo', 'até mais', 'falou',
    'obrigado', 'obrigada', 'valeu', 'vlw',
    'ok', 'okay', 'ok?', 'okay?',
    'sim', 'não', 'talvez',
    'entendi', 'entendeu?', 'sabe?',
    'legal', 'massa', 'top', 'show'
  ];
  
  // Palavras-chave para perguntas (apenas perguntas explícitas)
  const questionKeywords = ['o que é', 'o que significa', 'como funciona', 'quando usar', 'onde fica', 'quem é', 'qual é', 'por que', 'explique', 'me diga sobre', 'me fale sobre', 'o que é isso', 'o que é aquilo'];
  
  // Verificar comandos diretos primeiro (maior confiança) - SEMPRE EXECUTAR
  if (commandKeywords.some(kw => lowerMessage.includes(kw))) {
    // Detectar tipo de ação específica
    let actionType = 'execute';
    if (lowerMessage.includes('abrir') || lowerMessage.includes('abre') || lowerMessage.includes('pesquisar') || lowerMessage.includes('pesquisa')) {
      actionType = 'web';
    } else if (lowerMessage.includes('executar') || lowerMessage.includes('executa')) {
      actionType = 'execute';
    } else if (lowerMessage.includes('criar') || lowerMessage.includes('crie') || lowerMessage.includes('cria')) {
      actionType = 'create';
    } else if (lowerMessage.includes('delete') || lowerMessage.includes('deletar') || lowerMessage.includes('apagar') || lowerMessage.includes('apaga')) {
      actionType = 'delete';
    } else if (lowerMessage.includes('instalar') || lowerMessage.includes('instala')) {
      actionType = 'install';
    } else if (lowerMessage.includes('baixar') || lowerMessage.includes('baixa')) {
      actionType = 'download';
    } else if (lowerMessage.includes('editar') || lowerMessage.includes('edita') || lowerMessage.includes('modificar') || lowerMessage.includes('modifica')) {
      actionType = 'edit';
    }
    
    return { type: 'action', confidence: 0.98, actionType, reason: 'Comando direto detectado - EXECUTAR AUTOMATICAMENTE' };
  }
  
  // Verificar ações - SEMPRE EXECUTAR
  if (actionKeywords.some(kw => lowerMessage.includes(kw))) {
    let actionType = 'execute';
    if (lowerMessage.includes('abrir') || lowerMessage.includes('abre') || lowerMessage.includes('pesquisar') || lowerMessage.includes('pesquisa')) {
      actionType = 'web';
    } else if (lowerMessage.includes('criar') || lowerMessage.includes('crie') || lowerMessage.includes('cria')) {
      actionType = 'create';
    } else if (lowerMessage.includes('instalar') || lowerMessage.includes('instala')) {
      actionType = 'install';
    } else if (lowerMessage.includes('baixar') || lowerMessage.includes('baixa')) {
      actionType = 'download';
    }
    
    return { type: 'action', confidence: 0.90, actionType, reason: 'Ação detectada - EXECUTAR AUTOMATICAMENTE' };
  }
  
  // Verificar conversa/cumprimentos PRIMEIRO (antes de perguntas e ações)
  // Isso evita que "tudo bem?" seja tratado como ação
  if (conversationKeywords.some(kw => lowerMessage.includes(kw))) {
    return { type: 'conversation', confidence: 0.9, reason: 'Conversa/cumprimento detectado' };
  }
  
  // Verificar perguntas explícitas (apenas perguntas claras)
  if (questionKeywords.some(kw => lowerMessage.includes(kw))) {
    return { type: 'question', confidence: 0.7, reason: 'Pergunta detectada' };
  }
  
  // Se a mensagem contém nomes de aplicativos/arquivos/coisas que podem ser executadas, tratar como ação
  const executablePatterns = [
    /vs code|code|visual studio|chrome|firefox|edge|notepad|word|excel|powerpoint|spotify|discord|telegram|whatsapp|google/i,
    /\.py$|\.js$|\.ts$|\.html$|\.css$|\.json$|\.md$|\.txt$/i,
    /arquivo|file|pasta|folder|diretorio|directory/i
  ];
  
  if (executablePatterns.some(pattern => pattern.test(message))) {
    return { type: 'action', confidence: 0.75, actionType: 'execute', reason: 'Padrão executável detectado' };
  }
  
  // Padrão: tratar como conversa (mais seguro)
  return { type: 'conversation', confidence: 0.5, reason: 'Padrão padrão: conversa' };
}

