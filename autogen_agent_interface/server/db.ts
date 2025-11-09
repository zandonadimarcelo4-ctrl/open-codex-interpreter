import { and, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  agents,
  conversations,
  InsertAgent,
  InsertConversation,
  InsertMessage,
  InsertResult,
  InsertTask,
  InsertUser,
  messages,
  results,
  tasks,
  users,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
      // Testar conexão
      await _db.execute({ sql: "SELECT 1", params: [] });
      console.log("[Database] ✅ Conectado ao banco de dados");
    } catch (error) {
      console.warn("[Database] ⚠️ Falha ao conectar ao banco de dados:", error);
      console.warn("[Database] Sistema funcionará sem banco de dados (modo offline)");
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ==================== Conversations ====================

export async function createConversation(conversation: InsertConversation) {
  const db = await getDb();
  if (!db) {
    // Modo offline: retornar ID temporário
    console.warn("[Database] Modo offline: usando ID temporário para conversa");
    return Date.now();
  }
  try {
    const [result] = await db.insert(conversations).values(conversation);
    return result.insertId;
  } catch (error) {
    console.warn("[Database] Erro ao criar conversa, usando ID temporário:", error);
    return Date.now();
  }
}

export async function getConversationById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const [result] = await db.select().from(conversations).where(eq(conversations.id, id)).limit(1);
  return result;
}

export async function getConversationsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(conversations)
    .where(eq(conversations.userId, userId))
    .orderBy(desc(conversations.updatedAt));
}

export async function updateConversation(id: number, updates: Partial<InsertConversation>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(conversations).set(updates).where(eq(conversations.id, id));
}

export async function deleteConversation(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(conversations).where(eq(conversations.id, id));
}

// ==================== Messages ====================

export async function createMessage(message: InsertMessage) {
  const db = await getDb();
  if (!db) {
    // Modo offline: retornar ID temporário
    console.warn("[Database] Modo offline: usando ID temporário para mensagem");
    return Date.now();
  }
  try {
    const [result] = await db.insert(messages).values(message);
    return result.insertId;
  } catch (error) {
    console.warn("[Database] Erro ao criar mensagem, usando ID temporário:", error);
    return Date.now();
  }
}

export async function getMessagesByConversationId(conversationId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(messages.createdAt);
}

export async function getMessageById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const [result] = await db.select().from(messages).where(eq(messages.id, id)).limit(1);
  return result;
}

export async function deleteMessage(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(messages).where(eq(messages.id, id));
}

// ==================== Agents ====================

export async function createAgent(agent: InsertAgent) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(agents).values(agent);
  return result.insertId;
}

export async function getAgentById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const [result] = await db.select().from(agents).where(eq(agents.id, id)).limit(1);
  return result;
}

export async function getAgentsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(agents)
    .where(eq(agents.userId, userId))
    .orderBy(desc(agents.createdAt));
}

export async function updateAgent(id: number, updates: Partial<InsertAgent>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(agents).set(updates).where(eq(agents.id, id));
}

export async function deleteAgent(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(agents).where(eq(agents.id, id));
}

// ==================== Tasks ====================

export async function createTask(task: InsertTask) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(tasks).values(task);
  return result.insertId;
}

export async function getTaskById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const [result] = await db.select().from(tasks).where(eq(tasks.id, id)).limit(1);
  return result;
}

export async function getTasksByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(tasks)
    .where(eq(tasks.userId, userId))
    .orderBy(desc(tasks.createdAt));
}

export async function getTasksByConversationId(conversationId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(tasks)
    .where(eq(tasks.conversationId, conversationId))
    .orderBy(desc(tasks.createdAt));
}

export async function updateTask(id: number, updates: Partial<InsertTask>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(tasks).set(updates).where(eq(tasks.id, id));
}

export async function deleteTask(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(tasks).where(eq(tasks.id, id));
}

// ==================== Results ====================

export async function createResult(result: InsertResult) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [resultData] = await db.insert(results).values(result);
  return resultData.insertId;
}

export async function getResultsByTaskId(taskId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(results)
    .where(eq(results.taskId, taskId))
    .orderBy(desc(results.createdAt));
}

export async function getResultById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const [result] = await db.select().from(results).where(eq(results.id, id)).limit(1);
  return result;
}

export async function deleteResult(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(results).where(eq(results.id, id));
}
