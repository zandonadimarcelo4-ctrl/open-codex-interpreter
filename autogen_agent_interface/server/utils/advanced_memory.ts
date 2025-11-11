/**
 * Advanced Memory Management - Gerenciamento Avançado de Memória
 * Sistema completo de memória com ChromaDB para agentes inteligentes
 */

import { spawn } from "child_process";
import * as path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PYTHON_SCRIPT = path.join(__dirname, "../../../super_agent/memory/chromadb_backend.py");

/**
 * Armazenar informação na memória com metadados avançados
 */
export async function storeInMemoryAdvanced(
  text: string,
  metadata?: {
    userId?: number;
    conversationId?: number;
    agent?: string;
    type?: string;
    importance?: number;
    tags?: string[];
    timestamp?: string;
    [key: string]: any;
  }
): Promise<string> {
  try {
    const pythonScript = `
import sys
import json
import os
sys.path.insert(0, "${path.join(__dirname, "../../../super_agent")}")
from memory.chromadb_backend import ChromaDBBackend

memory = ChromaDBBackend()
metadata = ${JSON.stringify(metadata || {})}
doc_id = memory.store("${text.replace(/"/g, '\\"')}", metadata)
print(json.dumps({"success": True, "doc_id": doc_id}))
`;
    
    return new Promise((resolve, reject) => {
      const python = spawn("python", ["-c", pythonScript]);
      let output = "";
      let error = "";
      
      python.stdout.on("data", (data) => {
        output += data.toString();
      });
      
      python.stderr.on("data", (data) => {
        error += data.toString();
      });
      
      python.on("close", (code) => {
        if (code === 0) {
          try {
            const result = JSON.parse(output.trim());
            resolve(result.doc_id || "");
          } catch (e) {
            reject(new Error(`Erro ao parsear resultado: ${e}`));
          }
        } else {
          reject(new Error(`Erro ao executar Python: ${error}`));
        }
      });
    });
  } catch (error) {
    console.error("[Memory] Erro ao armazenar:", error);
    return "";
  }
}

/**
 * Buscar memória com múltiplas queries para melhor relevância
 */
export async function searchMemoryAdvanced(
  query: string,
  options?: {
    nResults?: number;
    userId?: number;
    conversationId?: number;
    type?: string;
    minRelevance?: number;
  }
): Promise<Array<{ id: string; text: string; metadata: any; distance: number; relevance: number }>> {
  try {
    const nResults = options?.nResults || 5;
    const pythonScript = `
import sys
import json
sys.path.insert(0, "${path.join(__dirname, "../../../super_agent")}")
from memory.chromadb_backend import ChromaDBBackend

memory = ChromaDBBackend()
results = memory.search("${query.replace(/"/g, '\\"')}", ${nResults})

# Adicionar score de relevância (1 - distance)
for item in results:
    item['relevance'] = max(0, min(100, (1 - item.get('distance', 1.0)) * 100))

print(json.dumps({"success": True, "results": results}))
`;
    
    return new Promise((resolve, reject) => {
      const python = spawn("python", ["-c", pythonScript]);
      let output = "";
      let error = "";
      
      python.stdout.on("data", (data) => {
        output += data.toString();
      });
      
      python.stderr.on("data", (data) => {
        error += data.toString();
      });
      
      python.on("close", (code) => {
        if (code === 0) {
          try {
            const result = JSON.parse(output.trim());
            let results = result.results || [];
            
            // Filtrar por relevância mínima se especificado
            if (options?.minRelevance) {
              results = results.filter((item: any) => item.relevance >= options.minRelevance!);
            }
            
            // Filtrar por userId se especificado
            if (options?.userId) {
              results = results.filter((item: any) => 
                item.metadata?.userId === options.userId
              );
            }
            
            // Filtrar por conversationId se especificado
            if (options?.conversationId) {
              results = results.filter((item: any) => 
                item.metadata?.conversationId === options.conversationId
              );
            }
            
            // Filtrar por tipo se especificado
            if (options?.type) {
              results = results.filter((item: any) => 
                item.metadata?.type === options.type
              );
            }
            
            resolve(results);
          } catch (e) {
            reject(new Error(`Erro ao parsear resultado: ${e}`));
          }
        } else {
          // Se falhar, retornar array vazio
          console.warn("[Memory] ChromaDB não disponível, retornando array vazio");
          resolve([]);
        }
      });
    });
  } catch (error) {
    console.error("[Memory] Erro ao buscar:", error);
    return [];
  }
}

/**
 * Buscar memória por múltiplas queries (mais abrangente)
 */
export async function searchMemoryMultiQuery(
  queries: string[],
  nResults: number = 5
): Promise<Array<{ id: string; text: string; metadata: any; distance: number; relevance: number; query: string }>> {
  const allResults: Array<{ id: string; text: string; metadata: any; distance: number; relevance: number; query: string }> = [];
  
  for (const query of queries) {
    if (query.trim().length > 2) {
      try {
        const results = await searchMemoryAdvanced(query, { nResults });
        for (const result of results) {
          allResults.push({
            ...result,
            query,
          });
        }
      } catch (e) {
        // Ignorar erros em queries individuais
      }
    }
  }
  
  // Remover duplicatas (por ID)
  const uniqueResults = Array.from(
    new Map(allResults.map(item => [item.id, item])).values()
  );
  
  // Ordenar por relevância (maior primeiro)
  uniqueResults.sort((a, b) => b.relevance - a.relevance);
  
  return uniqueResults.slice(0, nResults);
}

/**
 * Armazenar conversa completa (pergunta e resposta)
 */
export async function storeConversation(
  userMessage: string,
  assistantResponse: string,
  metadata?: {
    userId?: number;
    conversationId?: number;
    agent?: string;
    timestamp?: string;
  }
): Promise<{ userDocId: string; assistantDocId: string }> {
  const timestamp = new Date().toISOString();
  
  // Armazenar mensagem do usuário
  const userDocId = await storeInMemoryAdvanced(userMessage, {
    ...metadata,
    type: "user_message",
    timestamp,
    importance: 80,
  });
  
  // Armazenar resposta do assistente
  const assistantDocId = await storeInMemoryAdvanced(assistantResponse, {
    ...metadata,
    type: "assistant_response",
    timestamp,
    importance: 70,
    user_message_preview: userMessage.substring(0, 200),
  });
  
  return { userDocId, assistantDocId };
}

/**
 * Buscar contexto relevante para uma conversa
 */
export async function getConversationContext(
  message: string,
  options?: {
    userId?: number;
    conversationId?: number;
    nResults?: number;
  }
): Promise<{
  context: string;
  itemsFound: number;
  relevance: number;
}> {
  // Criar múltiplas queries para busca mais abrangente
  const words = message.split(' ').filter(w => w.length > 3).slice(0, 5);
  const queries = [message, message.substring(0, 50), ...words];
  
  const results = await searchMemoryMultiQuery(queries, options?.nResults || 10);
  
  if (results.length === 0) {
    return {
      context: "",
      itemsFound: 0,
      relevance: 0,
    };
  }
  
  // Calcular relevância média
  const avgRelevance = results.reduce((sum, item) => sum + item.relevance, 0) / results.length;
  
  // Formatar contexto
  let context = "\n\n🧠 MEMÓRIA E CONTEXTO:\n\n";
  for (let i = 0; i < results.length; i++) {
    const item = results[i];
    context += `${i + 1}. [${item.relevance.toFixed(0)}% relevante] ${item.text.substring(0, 300)}...\n`;
    if (item.metadata?.timestamp) {
      context += `   📅 ${new Date(item.metadata.timestamp).toLocaleString('pt-BR')}\n`;
    }
    context += `\n`;
  }
  
  return {
    context,
    itemsFound: results.length,
    relevance: avgRelevance,
  };
}

