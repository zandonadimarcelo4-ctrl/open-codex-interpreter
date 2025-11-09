import { relations } from "drizzle-orm";
import { agents, conversations, messages, results, tasks, users } from "./schema";

/**
 * User relations
 */
export const usersRelations = relations(users, ({ many }) => ({
  conversations: many(conversations),
  agents: many(agents),
  tasks: many(tasks),
}));

/**
 * Conversation relations
 */
export const conversationsRelations = relations(conversations, ({ one, many }) => ({
  user: one(users, {
    fields: [conversations.userId],
    references: [users.id],
  }),
  messages: many(messages),
  tasks: many(tasks),
}));

/**
 * Agent relations
 */
export const agentsRelations = relations(agents, ({ one, many }) => ({
  user: one(users, {
    fields: [agents.userId],
    references: [users.id],
  }),
  messages: many(messages),
}));

/**
 * Message relations
 */
export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
  agent: one(agents, {
    fields: [messages.agentId],
    references: [agents.id],
  }),
}));

/**
 * Task relations
 */
export const tasksRelations = relations(tasks, ({ one, many }) => ({
  user: one(users, {
    fields: [tasks.userId],
    references: [users.id],
  }),
  conversation: one(conversations, {
    fields: [tasks.conversationId],
    references: [conversations.id],
  }),
  results: many(results),
}));

/**
 * Result relations
 */
export const resultsRelations = relations(results, ({ one }) => ({
  task: one(tasks, {
    fields: [results.taskId],
    references: [tasks.id],
  }),
}));
