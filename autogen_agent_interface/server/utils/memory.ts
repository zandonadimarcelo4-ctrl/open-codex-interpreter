/**
 * Integração com ChromaDB para memória persistente
 * Usa o Super Agent Framework Python via bridge
 */

import { spawn } from "child_process";
import { promisify } from "util";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PYTHON_SCRIPT = path.join(__dirname, "../../../super_agent/memory/chromadb_backend.py");

/**
 * Armazenar texto na memória ChromaDB
 */
export async function storeInMemory(
  text: string,
  metadata?: Record<string, any>
): Promise<string> {
  try {
    const pythonScript = `
import sys
import json
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
 * Buscar textos similares na memória ChromaDB
 */
export async function searchMemory(
  query: string,
  nResults: number = 5
): Promise<Array<{ id: string; text: string; metadata: any; distance: number }>> {
  try {
    const pythonScript = `
import sys
import json
sys.path.insert(0, "${path.join(__dirname, "../../../super_agent")}")
from memory.chromadb_backend import ChromaDBBackend

memory = ChromaDBBackend()
results = memory.search("${query.replace(/"/g, '\\"')}", ${nResults})
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
            resolve(result.results || []);
          } catch (e) {
            reject(new Error(`Erro ao parsear resultado: ${e}`));
          }
        } else {
          // Se ChromaDB não estiver disponível, retornar array vazio
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
 * Verificar se ChromaDB está disponível
 */
export async function checkMemoryAvailable(): Promise<boolean> {
  try {
    const pythonScript = `
import sys
sys.path.insert(0, "${path.join(__dirname, "../../../super_agent")}")
try:
    from memory.chromadb_backend import ChromaDBBackend
    memory = ChromaDBBackend()
    print("True" if memory.collection else "False")
except:
    print("False")
`;
    
    return new Promise((resolve) => {
      const python = spawn("python", ["-c", pythonScript]);
      let output = "";
      
      python.stdout.on("data", (data) => {
        output += data.toString();
      });
      
      python.on("close", (code) => {
        resolve(output.trim() === "True");
      });
    });
  } catch (error) {
    return false;
  }
}

