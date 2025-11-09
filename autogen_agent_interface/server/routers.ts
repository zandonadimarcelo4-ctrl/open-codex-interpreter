import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import * as db from "./db";
import { executeCode, extractCodeBlocks, executeCodeBlocks } from "./utils/code_executor";
import { storeInMemory, searchMemory } from "./utils/memory";
import { evaluateAgent, evaluateCollaboration } from "./utils/reward_system";
import { backgroundWorker } from "./_core/services/backgroundWorker";
import { deviceManager } from "./_core/services/deviceManager";
import { modelManager } from "./_core/services/modelManager";
import { resourceManager } from "./_core/services/resourceManager";
import { gpuOptimizer } from "./_core/services/gpuOptimizer";
import { modelLoader } from "./_core/services/modelLoader";
import { AGENT_MODES, getAllAgentModes, getAgentModeConfig, getBestModelForTask } from "./_core/services/agentModes";

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
        
        // Detectar intenção da mensagem (função local)
        const intent = detectIntentLocal(input.message);
        
        // Extrair blocos de código da mensagem
        const codeBlocks = extractCodeBlocks(input.message);
        
        // Se houver código e for ação/comando, executar automaticamente
        let codeExecutionResults: any[] = [];
        if (codeBlocks.length > 0 && (intent.type === "action" || intent.type === "command")) {
          try {
            codeExecutionResults = await executeCodeBlocks(codeBlocks, {
              autoApprove: true,
              timeout: 30000,
            });
          } catch (error) {
            console.warn("[Chat] Erro ao executar código:", error);
          }
        }
        
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
        
        // Processar usando AutoGen Framework (ÚNICO FRAMEWORK)
        // AutoGen controla tudo - orquestra todos os agentes
        let response: string = "";
        let agentName = "Super Agent (AutoGen)";
        
        try {
          // Usar APENAS AutoGen Framework (único framework)
          const { executeWithAutoGen } = await import("./utils/autogen");
          response = await executeWithAutoGen(
            input.message,
            intent,
            { conversationId, userId }
          );
          
          // Adicionar resultados de execução de código se houver
          if (codeExecutionResults.length > 0) {
            const codeOutput = codeExecutionResults
              .map((result, idx) => {
                if (result.success) {
                  return `\n\n**✅ Código ${idx + 1} executado (${result.language}):**\n\`\`\`\n${result.output}\n\`\`\``;
                } else {
                  return `\n\n**❌ Erro na execução ${idx + 1} (${result.language}):**\n\`\`\`\n${result.error}\n\`\`\``;
                }
              })
              .join("\n");
            response = response + codeOutput;
          }

          // Armazenar na memória ChromaDB (se disponível)
          try {
            await storeInMemory(input.message, {
              userId,
              conversationId,
              intent: intent.type,
              timestamp: new Date().toISOString(),
            });
            await storeInMemory(response, {
              userId,
              conversationId,
              role: "assistant",
              agentName,
              timestamp: new Date().toISOString(),
            });
          } catch (error) {
            console.warn("[Chat] Erro ao armazenar na memória:", error);
          }

          // Avaliar agente usando sistema de recompensa ChatDev (se disponível)
          try {
            const reward = await evaluateAgent(
              agentName,
              input.message,
              {
                success: true,
                response: response.substring(0, 500),
                execution_time: 0, // TODO: medir tempo de execução
                code: codeExecutionResults.length > 0 ? codeExecutionResults.map(r => r.code).join("\n") : undefined,
              }
            );
            if (reward.reward > 0) {
              console.log(`[Reward] Agente ${agentName} recebeu recompensa: ${reward.reward.toFixed(2)} - ${reward.reason}`);
            }
          } catch (error) {
            console.warn("[Chat] Erro ao avaliar agente:", error);
          }

          // Adicionar contexto da intenção detectada
          const baseResponse = response; // Salvar resposta base
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
            }
            
            response = `🤖 **AutoGen Framework** - Orquestrando agentes...\n\n` +
              `🔧 **Ação Detectada**: ${intent.actionType || "execução"}\n` +
              `**Confiança**: ${(intent.confidence * 100).toFixed(0)}%\n` +
              (taskId ? `**Tarefa**: #${taskId}\n\n` : "\n") +
              `**Agentes Coordenados pelo AutoGen**:\n` +
              `- Planner: Planejando execução\n` +
              `- Generator: Gerando solução\n` +
              `- Executor: Executando tarefa\n\n` +
              baseResponse;
            agentName = "Executor Agent (AutoGen)";
          } else if (intent.type === "question") {
            response = `🤖 **AutoGen Framework** - Coordenando agentes...\n\n` +
              `💬 **Pergunta Detectada**\n\n` +
              baseResponse;
            agentName = "Assistant Agent (AutoGen)";
          } else {
            response = `🤖 **AutoGen Framework** - Pronto para coordenar agentes\n\n` +
              `💭 **Conversa Detectada**\n\n` +
              baseResponse;
          }
        } catch (error) {
          console.error("[Chat] Error calling AutoGen:", error);
          
          // Usar mensagem de erro detalhada se disponível
          const errorMessage = error instanceof Error ? error.message : String(error);
          
          // Se a mensagem de erro já contém informações detalhadas do AutoGen, usar ela
          if (errorMessage.includes("AutoGen não disponível") || errorMessage.includes("⚠️")) {
            response = errorMessage;
            agentName = "Super Agent (Offline)";
          } else {
            // Fallback: resposta baseada em intenção sem AutoGen
            if (intent.type === "action" || intent.type === "command") {
              response = `🔧 **Ação Detectada** (AutoGen não disponível)\n\n` +
                `**Tipo**: ${intent.actionType || "execução"}\n` +
                `**Confiança**: ${(intent.confidence * 100).toFixed(0)}%\n` +
                `**Razão**: ${intent.reason}\n\n` +
                `⚠️ AutoGen não está disponível. Para executar ações, certifique-se de que:\n` +
                `1. AutoGen está instalado: \`pip install pyautogen\`\n` +
                `2. Ollama está rodando: \`ollama serve\`\n` +
                `3. Modelo está instalado: \`ollama pull deepseek-r1\`\n` +
                `4. OLLAMA_BASE_URL está configurado corretamente\n\n` +
                `**Sua mensagem**: "${input.message}"`;
              agentName = "Executor Agent (Offline)";
            } else if (intent.type === "question") {
              response = `💬 **Pergunta Detectada** (AutoGen não disponível)\n\n` +
                `**Sua pergunta**: "${input.message}"\n\n` +
                `⚠️ AutoGen não está disponível. Para respostas completas, certifique-se de que:\n` +
                `1. AutoGen está instalado: \`pip install pyautogen\`\n` +
                `2. Ollama está rodando: \`ollama serve\`\n` +
                `3. Modelo está instalado: \`ollama pull deepseek-r1\`\n` +
                `4. OLLAMA_BASE_URL está configurado corretamente\n\n` +
                `**Sua mensagem**: "${input.message}"`;
              agentName = "Assistant Agent (Offline)";
            } else {
              response = `💭 **Conversa Detectada** (AutoGen não disponível)\n\n` +
                `**Sua mensagem**: "${input.message}"\n\n` +
                `⚠️ AutoGen não está disponível. Para respostas completas, certifique-se de que:\n` +
                `1. AutoGen está instalado: \`pip install pyautogen\`\n` +
                `2. Ollama está rodando: \`ollama serve\`\n` +
                `3. Modelo está instalado: \`ollama pull deepseek-r1\`\n` +
                `4. OLLAMA_BASE_URL está configurado corretamente\n\n` +
                `**Sua mensagem**: "${input.message}"`;
            }
          }
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

  // ==================== Background Worker 24/7 ====================
  background: router({
    getStatus: protectedProcedure.query(() => {
      return backgroundWorker.getStatistics();
    }),

    getTasks: protectedProcedure.query(() => {
      return backgroundWorker.getScheduledTasks();
    }),

    getTask: protectedProcedure
      .input(z.object({ taskId: z.string() }))
      .query(({ input }) => {
        return backgroundWorker.getScheduledTask(input.taskId);
      }),

    createTask: protectedProcedure
      .input(
        z.object({
          name: z.string(),
          description: z.string(),
          taskType: z.string(),
          payload: z.any(),
          schedule: z.object({
            type: z.enum(['once', 'hourly', 'daily', 'weekly', 'monthly', 'custom']),
            time: z.string().optional(),
            dayOfWeek: z.number().optional(),
            dayOfMonth: z.number().optional(),
            cronExpression: z.string().optional(),
            timezone: z.string().optional(),
          }),
        })
      )
      .mutation(({ input }) => {
        return backgroundWorker.createScheduledTask(
          input.name,
          input.description,
          input.taskType,
          input.payload,
          input.schedule
        );
      }),

    updateTask: protectedProcedure
      .input(
        z.object({
          taskId: z.string(),
          updates: z.any(),
        })
      )
      .mutation(({ input }) => {
        return backgroundWorker.updateScheduledTask(input.taskId, input.updates);
      }),

    deleteTask: protectedProcedure
      .input(z.object({ taskId: z.string() }))
      .mutation(({ input }) => {
        return backgroundWorker.deleteScheduledTask(input.taskId);
      }),

    getJobs: protectedProcedure
      .input(z.object({ limit: z.number().optional() }))
      .query(({ input }) => {
        return backgroundWorker.getBackgroundJobs(input.limit || 50);
      }),

    getJob: protectedProcedure
      .input(z.object({ jobId: z.string() }))
      .query(({ input }) => {
        return backgroundWorker.getBackgroundJob(input.jobId);
      }),
  }),

  // ==================== Device Manager ====================
  device: router({
    getMode: protectedProcedure.query(() => {
      return { mode: deviceManager.getExecutionMode() };
    }),

    setMode: protectedProcedure
      .input(z.object({ mode: z.enum(['local', 'remote']) }))
      .mutation(({ input }) => {
        deviceManager.setExecutionMode(input.mode);
        return { success: true, mode: input.mode };
      }),

    getDevices: protectedProcedure.query(() => {
      return deviceManager.getAvailableDevices();
    }),

    getLocalDevice: protectedProcedure.query(() => {
      return deviceManager.getLocalDeviceInfo();
    }),

    getRemoteDevices: protectedProcedure.query(() => {
      return deviceManager.getRemoteDevices();
    }),

    registerDevice: protectedProcedure
      .input(
        z.object({
          name: z.string(),
          type: z.enum(['desktop', 'android', 'ios', 'web']),
          ipAddress: z.string(),
          port: z.number(),
          apiKey: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        return await deviceManager.registerRemoteDevice(
          input.name,
          input.type,
          input.ipAddress,
          input.port,
          input.apiKey
        );
      }),

    submitTask: protectedProcedure
      .input(
        z.object({
          taskType: z.string(),
          payload: z.any(),
          priority: z.enum(['low', 'normal', 'high']).optional(),
          deviceId: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        return await deviceManager.submitTask(
          input.taskType,
          input.payload,
          input.priority || 'normal',
          input.deviceId
        );
      }),

    getTaskStatus: protectedProcedure
      .input(z.object({ taskId: z.string() }))
      .query(({ input }) => {
        return deviceManager.getTaskStatus(input.taskId);
      }),

    getTaskQueue: protectedProcedure
      .input(z.object({ limit: z.number().optional() }))
      .query(({ input }) => {
        return deviceManager.getTaskQueue(input.limit || 50);
      }),
  }),

  // ==================== Model Manager ====================
  model: router({
    getStatus: protectedProcedure.query(async () => {
      return await modelManager.getStatus();
    }),

    getAllModels: protectedProcedure.query(async () => {
      return await modelManager.getAllModels();
    }),

    getCurrentModel: protectedProcedure.query(() => {
      return modelManager.getCurrentModel();
    }),

    setCurrentModel: protectedProcedure
      .input(z.object({ modelName: z.string() }))
      .mutation(({ input }) => {
        return { success: modelManager.setCurrentModel(input.modelName) };
      }),

    checkOllama: protectedProcedure.query(async () => {
      return { available: await modelManager.checkOllamaAvailability() };
    }),

    getOllamaModels: protectedProcedure.query(async () => {
      return await modelManager.getOllamaModels();
    }),

    getDeepSeekFallback: protectedProcedure.query(async () => {
      return await modelManager.getDeepSeekFallbackChain();
    }),

    getBestModel: protectedProcedure
      .input(
        z.object({
          taskType: z.string(),
          availableVRAM: z.number().optional(),
          strategy: z.enum(['quality', 'speed', 'balanced']).optional(),
        })
      )
      .query(async ({ input }) => {
        return await modelManager.getBestModelForTask(
          input.taskType,
          input.availableVRAM || 16,
          input.strategy || 'balanced'
        );
      }),

    isModelAvailable: protectedProcedure
      .input(z.object({ modelName: z.string() }))
      .query(async ({ input }) => {
        return { available: await modelManager.isModelAvailable(input.modelName) };
      }),
  }),

  // ==================== Agent Modes ====================
  agentMode: router({
    getAllModes: protectedProcedure.query(() => {
      return getAllAgentModes();
    }),

    getMode: protectedProcedure
      .input(z.object({ mode: z.enum(['creative', 'analytical', 'executor']) }))
      .query(({ input }) => {
        return getAgentModeConfig(input.mode);
      }),

    getBestModel: protectedProcedure
      .input(
        z.object({
          taskType: z.string(),
          availableVram: z.number().optional(),
          prioritize: z.enum(['quality', 'speed', 'balance']).optional(),
        })
      )
      .query(({ input }) => {
        return {
          model: getBestModelForTask(
            input.taskType,
            input.availableVram || 16,
            input.prioritize || 'balance'
          ),
        };
      }),
  }),

  // ==================== Resource Manager ====================
  resource: router({
    getUsage: protectedProcedure.query(() => {
      return resourceManager.getResourceUsage();
    }),

    getStatistics: protectedProcedure.query(() => {
      return resourceManager.getStatistics();
    }),

    getModelCache: protectedProcedure.query(() => {
      return resourceManager.getModelCacheStatus();
    }),

    setIdleTimeout: protectedProcedure
      .input(z.object({ timeout: z.number() }))
      .mutation(({ input }) => {
        resourceManager.setIdleTimeout(input.timeout);
        return { success: true };
      }),

    forceUnloadAll: protectedProcedure.mutation(() => {
      resourceManager.forceUnloadAllModels();
      return { success: true };
    }),

    getBestModel: protectedProcedure
      .input(
        z.object({
          taskType: z.string(),
          strategy: z.enum(['quality', 'speed', 'balanced']).optional(),
        })
      )
      .query(async ({ input }) => {
        return await resourceManager.getBestModelForTask(
          input.taskType,
          input.strategy || 'balanced'
        );
      }),
  }),

  // ==================== GPU Optimizer ====================
  gpu: router({
    getOptimization: protectedProcedure
      .input(
        z.object({
          modelName: z.string(),
          taskType: z.string().optional(),
          isIdle: z.boolean().optional(),
        })
      )
      .query(({ input }) => {
        const vramAvailable = resourceManager.getResourceUsage().vramAvailable;
        const isIdle = resourceManager.getResourceUsage().isIdle;
        
        return gpuOptimizer.getRecommendedOptimization(
          input.modelName,
          input.taskType || 'general',
          vramAvailable,
          input.isIdle ?? isIdle
        );
      }),

    getOptimizationStatus: protectedProcedure
      .input(z.object({ modelName: z.string() }))
      .query(({ input }) => {
        return gpuOptimizer.getOptimizationStatus(input.modelName);
      }),

    getAllOptimizations: protectedProcedure.query(() => {
      return gpuOptimizer.getAllOptimizations();
    }),

    applyOptimization: protectedProcedure
      .input(
        z.object({
          modelName: z.string(),
          optimization: z.any(),
        })
      )
      .mutation(async ({ input }) => {
        return await gpuOptimizer.applyOptimization(input.modelName, input.optimization);
      }),
  }),

  // ==================== Model Loader ====================
  modelLoader: router({
    loadModel: protectedProcedure
      .input(
        z.object({
          modelName: z.string(),
          priority: z.enum(['low', 'normal', 'high']).optional(),
          preload: z.boolean().optional(),
        })
      )
      .mutation(async ({ input }) => {
        return await modelLoader.loadModel(
          input.modelName,
          input.priority || 'normal',
          input.preload || false
        );
      }),

    unloadModel: protectedProcedure
      .input(z.object({ modelName: z.string() }))
      .mutation(async ({ input }) => {
        await modelLoader.unloadModel(input.modelName);
        return { success: true };
      }),

    getLoadedModel: protectedProcedure
      .input(z.object({ modelName: z.string() }))
      .query(({ input }) => {
        return modelLoader.getLoadedModel(input.modelName);
      }),

    getLoadedModels: protectedProcedure.query(() => {
      return modelLoader.getLoadedModels();
    }),

    getActiveModels: protectedProcedure.query(() => {
      return modelLoader.getActiveModels();
    }),

    getStatistics: protectedProcedure.query(() => {
      return modelLoader.getStatistics();
    }),

    preloadModel: protectedProcedure
      .input(z.object({ modelName: z.string() }))
      .mutation(async ({ input }) => {
        await modelLoader.preloadModel(input.modelName);
        return { success: true };
      }),

    warmUpModels: protectedProcedure
      .input(z.object({ modelNames: z.array(z.string()) }))
      .mutation(async ({ input }) => {
        await modelLoader.warmUpModels(input.modelNames);
        return { success: true };
      }),

    autoLoadForTask: protectedProcedure
      .input(z.object({ taskType: z.string() }))
      .mutation(async ({ input }) => {
        const modelName = await modelLoader.autoLoadModelForTask(input.taskType);
        return { modelName, success: !!modelName };
      }),
  }),
});

export type AppRouter = typeof appRouter;

// Função auxiliar para detectar intenção (simplificada para o backend)
// Prioriza ações/comandos para executar automaticamente tudo que o usuário pedir
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
    if (lowerMessage.includes('abrir') || lowerMessage.includes('abre')) {
      actionType = 'open';
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
    
    return { type: 'command', confidence: 0.98, actionType, reason: 'Comando direto detectado - EXECUTAR AUTOMATICAMENTE' };
  }
  
  // Verificar ações - SEMPRE EXECUTAR
  if (actionKeywords.some(kw => lowerMessage.includes(kw))) {
    let actionType = 'execute';
    if (lowerMessage.includes('abrir') || lowerMessage.includes('abre')) {
      actionType = 'open';
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
    /vs code|code|visual studio|chrome|firefox|edge|notepad|word|excel|powerpoint|spotify|discord|telegram|whatsapp/i,
    /\.py$|\.js$|\.ts$|\.html$|\.css$|\.json$|\.md$|\.txt$/i,
    /arquivo|file|pasta|folder|diretorio|directory/i
  ];
  
  if (executablePatterns.some(pattern => pattern.test(message))) {
    return { type: 'action', confidence: 0.85, actionType: 'execute', reason: 'Padrão executável detectado - EXECUTAR AUTOMATICAMENTE' };
  }
  
  // Padrão: se não for claramente uma pergunta ou conversa, tratar como ação (executar automaticamente)
  // Isso garante que o sistema execute tudo que o usuário pedir, como Codex e Manus
  return { type: 'action', confidence: 0.75, actionType: 'execute', reason: 'Tratando como ação - EXECUTAR AUTOMATICAMENTE' };
}
