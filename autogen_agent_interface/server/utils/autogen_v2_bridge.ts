/**
 * AutoGen v2 Bridge - Ponte TypeScript → Python AutoGen v2
 * 
 * IMPORTANTE: AutoGen v2 (Python) comanda TUDO - sem conflitos
 * Este bridge permite que o TypeScript chame o AutoGen v2 Python
 * que orquestra todos os agentes, ferramentas e execuções
 * 
 * @module autogen_v2_bridge
 * @author ANIMA Project
 * @since 1.0.0
 */

import { spawn } from "child_process";
import * as path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { promisify } from "util";
import * as fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const AUTOGEN_V2_SCRIPT = path.join(__dirname, "../../../super_agent/core/autogen_v2_orchestrator.py");

export interface AutoGenV2TaskRequest {
  task: string;
  intent?: {
    type: string;
    actionType?: string;
    confidence: number;
    reason?: string;
  };
  context?: Record<string, any>;
  userId?: string;
  conversationId?: number;
  model?: string;
}

export interface AutoGenV2TaskResponse {
  success: boolean;
  result?: string;
  error?: string;
  executionTime?: number;
  agent?: string;
  tools?: string[];
}

let autogenV2Process: any = null;

/**
 * Inicializar AutoGen v2 (verificar se está disponível)
 */
export async function initializeAutoGenV2(): Promise<boolean> {
  try {
    // Verificar se o script Python existe
    if (!fs.existsSync(AUTOGEN_V2_SCRIPT)) {
      console.warn(`[AutoGenV2] ⚠️ Script não encontrado: ${AUTOGEN_V2_SCRIPT}`);
      return false;
    }

    // Verificar se Python está disponível
    const { exec } = await import("child_process");
    const { promisify } = await import("util");
    const execAsync = promisify(exec);

    try {
      await execAsync("python --version");
      console.log(`[AutoGenV2] ✅ Python encontrado`);
    } catch {
      console.warn(`[AutoGenV2] ⚠️ Python não encontrado`);
      return false;
    }

    // Testar importação do AutoGen v2
    const testScript = `
import sys
sys.path.insert(0, "${path.join(__dirname, "../../../super_agent")}")
try:
    from autogen_agentchat.agents import AssistantAgent
    from autogen_agentchat.teams import RoundRobinTeam
    from autogen_ext.models.ollama import OllamaChatCompletionClient
    print("SUCCESS")
except ImportError as e:
    print(f"IMPORT_ERROR: {e}")
    sys.exit(1)
`;

    const pythonProcess = spawn("python", ["-c", testScript], {
      cwd: path.join(__dirname, "../../.."),
      env: { ...process.env, PYTHONUNBUFFERED: "1" },
    });

    return new Promise((resolve) => {
      let output = "";
      let error = "";

      pythonProcess.stdout.on("data", (data) => {
        output += data.toString();
      });

      pythonProcess.stderr.on("data", (data) => {
        error += data.toString();
      });

      pythonProcess.on("close", (code) => {
        if (code === 0 && output.includes("SUCCESS")) {
          console.log(`[AutoGenV2] ✅ AutoGen v2 está disponível`);
          resolve(true);
        } else {
          console.warn(`[AutoGenV2] ⚠️ AutoGen v2 não está disponível: ${error || output}`);
          resolve(false);
        }
      });
    });
  } catch (error) {
    console.warn(`[AutoGenV2] ⚠️ Erro ao verificar AutoGen v2: ${error}`);
    return false;
  }
}

/**
 * Executar tarefa usando AutoGen v2 Python
 * AutoGen v2 orquestra TUDO: agentes, ferramentas, execução de código, etc.
 * 
 * @param request - Requisição da tarefa
 * @returns Resposta do AutoGen v2
 */
export async function executeWithAutoGenV2(
  request: AutoGenV2TaskRequest
): Promise<AutoGenV2TaskResponse> {
  return new Promise((resolve, reject) => {
    try {
      console.log(`[AutoGenV2] 🚀 Executando tarefa via AutoGen v2 Python: "${request.task.substring(0, 100)}..."`);

      // Preparar payload JSON
      const payload = JSON.stringify({
        task: request.task,
        intent: request.intent || { type: "action", confidence: 0.8 },
        context: request.context || {},
        userId: request.userId || "default",
        conversationId: request.conversationId || 0,
        model: request.model || process.env.DEFAULT_MODEL || "deepseek-coder-v2-16b-q4_k_m-rtx",
      });

      // Criar script Python temporário que chama o orchestrator
      const pythonScript = `
import sys
import json
import os
import asyncio
from pathlib import Path

# Adicionar caminho do super_agent
super_agent_path = Path("${path.join(__dirname, "../../../super_agent")}").resolve()
sys.path.insert(0, str(super_agent_path))

# Configurar variáveis de ambiente
os.environ.setdefault("OLLAMA_BASE_URL", "${process.env.OLLAMA_BASE_URL || "http://localhost:11434"}")
os.environ.setdefault("DEFAULT_MODEL", "${process.env.DEFAULT_MODEL || "deepseek-coder-v2-16b-q4_k_m-rtx"}")

try:
    from super_agent.core.orchestrator import SuperAgentOrchestrator, SuperAgentConfig
    
    # Ler payload do stdin
    payload_str = sys.stdin.read()
    payload = json.loads(payload_str)
    
    # Configurar AutoGen v2
    config = SuperAgentConfig(
        autogen_model=payload.get("model", "deepseek-coder-v2-16b-q4_k_m-rtx"),
        autogen_base_url="${process.env.OLLAMA_BASE_URL || "http://localhost:11434"}",
        autogen_api_key=None,  # Usar Ollama
        workspace=Path("${process.cwd()}"),
        memory_enabled=True,
        chromadb_path=Path("${path.join(process.cwd(), "super_agent/memory")}"),
        open_interpreter_enabled=True,
        open_interpreter_auto_run=True,
        ufo_enabled=False,
        multimodal_enabled=False,
    )
    
    # Criar orchestrator
    orchestrator = SuperAgentOrchestrator(config)
    
    # Executar tarefa
    async def run_task():
        try:
            result = await orchestrator.execute(
                task=payload["task"],
                context=payload.get("context", {})
            )
            return {
                "success": True,
                "result": str(result.get("result", result)),
                "executionTime": result.get("executionTime", 0),
                "agent": result.get("agent", "autogen_v2"),
                "tools": result.get("tools", [])
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    # Executar async
    result = asyncio.run(run_task())
    print(json.dumps(result))
    
except ImportError as e:
    print(json.dumps({
        "success": False,
        "error": f"AutoGen v2 não disponível: {e}"
    }))
    sys.exit(1)
except Exception as e:
    print(json.dumps({
        "success": False,
        "error": f"Erro ao executar: {e}"
    }))
    sys.exit(1)
`;

      // Executar script Python
      const pythonProcess = spawn("python", ["-c", pythonScript], {
        cwd: path.join(__dirname, "../../.."),
        env: { ...process.env, PYTHONUNBUFFERED: "1" },
        stdio: ["pipe", "pipe", "pipe"],
      });

      let stdout = "";
      let stderr = "";

      // Enviar payload para stdin
      pythonProcess.stdin.write(payload);
      pythonProcess.stdin.end();

      // Capturar stdout
      pythonProcess.stdout.on("data", (data) => {
        stdout += data.toString();
      });

      // Capturar stderr
      pythonProcess.stderr.on("data", (data) => {
        stderr += data.toString();
        console.warn(`[AutoGenV2] stderr: ${data.toString()}`);
      });

      // Timeout de 5 minutos (tarefas complexas podem demorar)
      const timeout = setTimeout(() => {
        pythonProcess.kill();
        reject(new Error("AutoGen v2 timeout (5 minutos)"));
      }, 5 * 60 * 1000);

      // Processar resultado
      pythonProcess.on("close", (code) => {
        clearTimeout(timeout);

        if (code !== 0) {
          console.error(`[AutoGenV2] ❌ Processo Python falhou com código ${code}`);
          console.error(`[AutoGenV2] stderr: ${stderr}`);
          reject(new Error(`AutoGen v2 falhou: ${stderr || "Erro desconhecido"}`));
          return;
        }

        try {
          const result = JSON.parse(stdout.trim());
          console.log(`[AutoGenV2] ✅ Tarefa executada com sucesso`);
          resolve(result);
        } catch (error) {
          console.error(`[AutoGenV2] ❌ Erro ao parsear resultado: ${error}`);
          console.error(`[AutoGenV2] stdout: ${stdout}`);
          reject(new Error(`Erro ao parsear resultado do AutoGen v2: ${error}`));
        }
      });

      pythonProcess.on("error", (error) => {
        clearTimeout(timeout);
        console.error(`[AutoGenV2] ❌ Erro ao executar processo Python: ${error}`);
        reject(error);
      });
    } catch (error) {
      console.error(`[AutoGenV2] ❌ Erro ao executar AutoGen v2: ${error}`);
      reject(error);
    }
  });
}

/**
 * Verificar se AutoGen v2 está disponível e funcionando
 */
export async function checkAutoGenV2Available(): Promise<boolean> {
  try {
    return await initializeAutoGenV2();
  } catch {
    return false;
  }
}

