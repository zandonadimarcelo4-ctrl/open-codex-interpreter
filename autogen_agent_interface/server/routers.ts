import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import * as db from "./db";

export const appRouter = router({
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // ==================== Conversations ====================
  conversations: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user?.id) throw new Error("User not found");
      return db.getConversationsByUserId(ctx.user.id);
    }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        const conversation = await db.getConversationById(input.id);
        if (!conversation) throw new Error("Conversation not found");
        if (conversation.userId !== ctx.user?.id) throw new Error("Unauthorized");
        return conversation;
      }),

    create: protectedProcedure
      .input(
        z.object({
          title: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user?.id) throw new Error("User not found");
        const id = await db.createConversation({
          userId: ctx.user.id,
          title: input.title || "New Conversation",
        });
        return { id };
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          title: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const conversation = await db.getConversationById(input.id);
        if (!conversation) throw new Error("Conversation not found");
        if (conversation.userId !== ctx.user?.id) throw new Error("Unauthorized");
        await db.updateConversation(input.id, { title: input.title });
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const conversation = await db.getConversationById(input.id);
        if (!conversation) throw new Error("Conversation not found");
        if (conversation.userId !== ctx.user?.id) throw new Error("Unauthorized");
        await db.deleteConversation(input.id);
        return { success: true };
      }),
  }),

  // ==================== Messages ====================
  messages: router({
    list: protectedProcedure
      .input(z.object({ conversationId: z.number() }))
      .query(async ({ input, ctx }) => {
        const conversation = await db.getConversationById(input.conversationId);
        if (!conversation) throw new Error("Conversation not found");
        if (conversation.userId !== ctx.user?.id) throw new Error("Unauthorized");
        return db.getMessagesByConversationId(input.conversationId);
      }),

    create: protectedProcedure
      .input(
        z.object({
          conversationId: z.number(),
          role: z.enum(["user", "assistant", "system", "agent"]),
          content: z.string(),
          agentId: z.number().optional(),
          metadata: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const conversation = await db.getConversationById(input.conversationId);
        if (!conversation) throw new Error("Conversation not found");
        if (conversation.userId !== ctx.user?.id) throw new Error("Unauthorized");
        const id = await db.createMessage({
          conversationId: input.conversationId,
          role: input.role,
          content: input.content,
          agentId: input.agentId,
          metadata: input.metadata,
        });
        return { id };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const message = await db.getMessageById(input.id);
        if (!message) throw new Error("Message not found");
        const conversation = await db.getConversationById(message.conversationId);
        if (!conversation || conversation.userId !== ctx.user?.id) {
          throw new Error("Unauthorized");
        }
        await db.deleteMessage(input.id);
        return { success: true };
      }),
  }),

  // ==================== Agents ====================
  agents: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user?.id) throw new Error("User not found");
      return db.getAgentsByUserId(ctx.user.id);
    }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        const agent = await db.getAgentById(input.id);
        if (!agent) throw new Error("Agent not found");
        if (agent.userId !== ctx.user?.id) throw new Error("Unauthorized");
        return agent;
      }),

    create: protectedProcedure
      .input(
        z.object({
          name: z.string(),
          role: z.string().optional(),
          model: z.string().optional(),
          systemPrompt: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user?.id) throw new Error("User not found");
        const id = await db.createAgent({
          userId: ctx.user.id,
          name: input.name,
          role: input.role,
          model: input.model,
          systemPrompt: input.systemPrompt,
          status: "inactive",
        });
        return { id };
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().optional(),
          role: z.string().optional(),
          model: z.string().optional(),
          systemPrompt: z.string().optional(),
          status: z.enum(["active", "inactive", "running"]).optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const agent = await db.getAgentById(input.id);
        if (!agent) throw new Error("Agent not found");
        if (agent.userId !== ctx.user?.id) throw new Error("Unauthorized");
        const { id, ...updates } = input;
        await db.updateAgent(id, updates);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const agent = await db.getAgentById(input.id);
        if (!agent) throw new Error("Agent not found");
        if (agent.userId !== ctx.user?.id) throw new Error("Unauthorized");
        await db.deleteAgent(input.id);
        return { success: true };
      }),
  }),

  // ==================== Tasks ====================
  tasks: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user?.id) throw new Error("User not found");
      return db.getTasksByUserId(ctx.user.id);
    }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        const task = await db.getTaskById(input.id);
        if (!task) throw new Error("Task not found");
        if (task.userId !== ctx.user?.id) throw new Error("Unauthorized");
        return task;
      }),

    listByConversation: protectedProcedure
      .input(z.object({ conversationId: z.number() }))
      .query(async ({ input, ctx }) => {
        const conversation = await db.getConversationById(input.conversationId);
        if (!conversation) throw new Error("Conversation not found");
        if (conversation.userId !== ctx.user?.id) throw new Error("Unauthorized");
        return db.getTasksByConversationId(input.conversationId);
      }),

    create: protectedProcedure
      .input(
        z.object({
          conversationId: z.number().optional(),
          title: z.string(),
          description: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user?.id) throw new Error("User not found");
        const id = await db.createTask({
          userId: ctx.user.id,
          conversationId: input.conversationId,
          title: input.title,
          description: input.description,
          status: "pending",
          progress: 0,
        });
        return { id };
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          title: z.string().optional(),
          description: z.string().optional(),
          status: z.enum(["pending", "running", "completed", "failed", "cancelled"]).optional(),
          progress: z.number().min(0).max(100).optional(),
          result: z.string().optional(),
          error: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const task = await db.getTaskById(input.id);
        if (!task) throw new Error("Task not found");
        if (task.userId !== ctx.user?.id) throw new Error("Unauthorized");
        const { id, ...updates } = input;
        await db.updateTask(id, updates);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const task = await db.getTaskById(input.id);
        if (!task) throw new Error("Task not found");
        if (task.userId !== ctx.user?.id) throw new Error("Unauthorized");
        await db.deleteTask(input.id);
        return { success: true };
      }),
  }),

  // ==================== Results ====================
  results: router({
    list: protectedProcedure
      .input(z.object({ taskId: z.number() }))
      .query(async ({ input, ctx }) => {
        const task = await db.getTaskById(input.taskId);
        if (!task) throw new Error("Task not found");
        if (task.userId !== ctx.user?.id) throw new Error("Unauthorized");
        return db.getResultsByTaskId(input.taskId);
      }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        const result = await db.getResultById(input.id);
        if (!result) throw new Error("Result not found");
        const task = await db.getTaskById(result.taskId);
        if (!task || task.userId !== ctx.user?.id) throw new Error("Unauthorized");
        return result;
      }),

    create: protectedProcedure
      .input(
        z.object({
          taskId: z.number(),
          type: z.enum(["code", "text", "image", "file", "data"]),
          content: z.string(),
          metadata: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const task = await db.getTaskById(input.taskId);
        if (!task) throw new Error("Task not found");
        if (task.userId !== ctx.user?.id) throw new Error("Unauthorized");
        const id = await db.createResult({
          taskId: input.taskId,
          type: input.type,
          content: input.content,
          metadata: input.metadata,
        });
        return { id };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const result = await db.getResultById(input.id);
        if (!result) throw new Error("Result not found");
        const task = await db.getTaskById(result.taskId);
        if (!task || task.userId !== ctx.user?.id) throw new Error("Unauthorized");
        await db.deleteResult(input.id);
        return { success: true };
      }),
  }),

  // ==================== Chat ====================
  chat: router({
    process: publicProcedure
      .input(
        z.object({
          message: z.string(),
          conversationId: z.number().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        // Permitir acesso sem autenticação (modo demo)
        // Se não houver usuário, usar usuário demo
        const userId = ctx.user?.id || 1; // ID demo padrão
        
        // Detectar intenção da mensagem
        const intent = detectIntent(input.message);
        
        // Criar ou obter conversa
        let conversationId = input.conversationId;
        if (!conversationId) {
          try {
            const convId = await db.createConversation({
              userId,
              title: input.message.substring(0, 50),
            });
            conversationId = convId;
          } catch (error) {
            // Se falhar ao criar conversa (ex: sem DB), usar ID temporário
            console.warn("[Chat] Failed to create conversation:", error);
            conversationId = Date.now(); // ID temporário
          }
        }
        
        // Criar mensagem do usuário (se DB disponível)
        let userMessageId: number | undefined;
        try {
          userMessageId = await db.createMessage({
            conversationId,
            role: "user",
            content: input.message,
          });
        } catch (error) {
          console.warn("[Chat] Failed to create message:", error);
          userMessageId = Date.now(); // ID temporário
        }
        
        // Processar baseado na intenção
        let response: string;
        let agentName = "Super Agent";
        
        if (intent.type === "action" || intent.type === "command") {
          // Criar tarefa para ação (se DB disponível)
          let taskId: number | undefined;
          try {
            taskId = await db.createTask({
              userId,
              conversationId,
              title: input.message.substring(0, 100),
              description: input.message,
              status: "running",
              progress: 0,
            });
          } catch (error) {
            console.warn("[Chat] Failed to create task:", error);
            taskId = Date.now(); // ID temporário
          }
          
          // Simular processamento da ação
          response = `🔧 **Ação Detectada**: ${intent.actionType || "execução"}\n\n` +
            `**Intenção**: ${intent.reason}\n\n` +
            `**Confiança**: ${(intent.confidence * 100).toFixed(0)}%\n\n` +
            `**Tarefa Criada**: #${taskId}\n\n` +
            `Estou processando sua solicitação. Isso pode levar alguns segundos...\n\n` +
            `\`\`\`\n${input.message}\n\`\`\`\n\n` +
            `⏳ Processando...`;
          
          agentName = "Executor Agent";
        } else if (intent.type === "question") {
          // Resposta conversacional para pergunta
          response = `💬 **Pergunta Detectada**\n\n` +
            `Vou responder sua pergunta sobre: "${input.message}"\n\n` +
            `**Resposta**:\n\n` +
            `Baseado na sua pergunta, posso ajudar com informações e explicações. ` +
            `Se você precisar de uma ação específica, por favor, seja mais direto, por exemplo: ` +
            `"crie um arquivo", "execute código", "busque informações", etc.`;
          
          agentName = "Assistant Agent";
        } else {
          // Conversa normal
          response = `💭 **Conversa Detectada**\n\n` +
            `Entendi sua mensagem: "${input.message}"\n\n` +
            `Como posso ajudá-lo? Posso:\n\n` +
            `- 💬 Conversar e responder perguntas\n` +
            `- 🔧 Executar ações (criar arquivos, executar código, etc.)\n` +
            `- 🔍 Buscar informações\n` +
            `- 📝 Gerar código\n\n` +
            `Se você quiser que eu faça algo específico, use comandos diretos como:\n` +
            `- "Crie um arquivo..."\n` +
            `- "Execute o código..."\n` +
            `- "Busque informações sobre..."`;
          
          agentName = "Super Agent";
        }
        
        // Criar mensagem de resposta (se DB disponível)
        let assistantMessageId: number;
        try {
          assistantMessageId = await db.createMessage({
            conversationId,
            role: "assistant",
            content: response,
            metadata: JSON.stringify({ intent, messageId: userMessageId }),
          });
        } catch (error) {
          console.warn("[Chat] Failed to create assistant message:", error);
          assistantMessageId = Date.now(); // ID temporário
        }
        
        return {
          messageId: assistantMessageId,
          conversationId,
          content: response,
          intent,
          agentName,
        };
      }),
  }),
});

export type AppRouter = typeof appRouter;

// Função auxiliar para detectar intenção (simplificada para o backend)
function detectIntent(message: string): { type: string; confidence: number; actionType?: string; reason?: string } {
  const lowerMessage = message.toLowerCase();
  
  const actionKeywords = ['criar', 'fazer', 'executar', 'rodar', 'buscar', 'pesquisar', 'criar arquivo', 'escrever código'];
  const questionKeywords = ['o que', 'como', 'quando', 'onde', 'quem', 'qual', 'por que'];
  const commandKeywords = ['faça', 'execute', 'rode', 'crie', 'delete'];
  
  if (commandKeywords.some(kw => lowerMessage.includes(kw))) {
    return { type: 'command', confidence: 0.9, reason: 'Comando direto detectado' };
  }
  
  if (actionKeywords.some(kw => lowerMessage.includes(kw))) {
    return { type: 'action', confidence: 0.8, actionType: 'execute', reason: 'Ação detectada' };
  }
  
  if (questionKeywords.some(kw => lowerMessage.includes(kw))) {
    return { type: 'question', confidence: 0.7, reason: 'Pergunta detectada' };
  }
  
  return { type: 'conversation', confidence: 0.6, reason: 'Conversa normal' };
}
