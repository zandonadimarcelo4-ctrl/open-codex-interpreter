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
});

export type AppRouter = typeof appRouter;
