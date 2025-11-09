/**
 * Bridge para Super Agent Framework (Python)
 * Conecta o backend Node.js com o Super Agent Framework Python
 */

import { spawn } from "child_process";
import * as path from "path";
import * as fs from "fs";
import * as os from "os";

const PYTHON_PATH = process.env.PYTHON_PATH || "python";
const SUPER_AGENT_PATH = path.join(process.cwd(), "..", "super_agent");

/**
 * Executar tarefa usando Super Agent Framework Python
 */
export async function executeWithSuperAgent(
  task: string,
  intent: { type: string; actionType?: string; confidence: number; reason?: string },
  context?: Record<string, any>
): Promise<string> {
  try {
    // Verificar se o módulo Python existe
    if (!fs.existsSync(SUPER_AGENT_PATH)) {
      console.warn("[SuperAgent] Módulo Python não encontrado");
      throw new Error("Super Agent Framework não disponível");
    }

    // Criar script Python temporário para executar
    // Usar diretório temporário do sistema para evitar que o file watcher detecte mudanças
    const tempDir = os.tmpdir();
    const scriptPath = path.join(tempDir, `temp_super_agent_exec_${Date.now()}_${Math.random().toString(36).substring(7)}.py`);
    const scriptContent = `
import sys
import os
import json
import asyncio
from pathlib import Path

# Adicionar caminho do super_agent
sys.path.insert(0, "${SUPER_AGENT_PATH.replace(/\\/g, "/")}")

from super_agent import SuperAgentFramework, AutoGenConfig

async def main():
    # Configuração
    config = AutoGenConfig(
        use_local=True,
        local_model="deepseek-r1",
        local_base_url="${process.env.OLLAMA_BASE_URL || "http://localhost:11434"}",
        code_execution_enabled=True,
        web_browsing_enabled=True,
        video_editing_enabled=False,
        gui_automation_enabled=False,
        multimodal_enabled=True,
        memory_enabled=True,
        chromadb_path="./super_agent/memory"
    )
    
    # Inicializar framework
    framework = SuperAgentFramework(config)
    
    # Executar tarefa
    task = ${JSON.stringify(task)}
    intent = ${JSON.stringify(intent)}
    context = ${JSON.stringify(context || {})}
    
    # Construir mensagem com contexto de intenção
    message = f"Tarefa: {task}\\n\\nIntenção detectada: {intent.get('type', 'conversation')}\\n"
    if intent.get('actionType'):
        message += f"Tipo de ação: {intent['actionType']}\\n"
    message += f"Confiança: {intent.get('confidence', 0) * 100:.0f}%\\n"
    if intent.get('reason'):
        message += f"Razão: {intent['reason']}\\n"
    
    # Executar usando AutoGen
    result = await framework.execute(message, context)
    
    # Retornar resultado
    if result.get('success'):
        # Extrair mensagens do GroupChat
        messages = result.get('messages', [])
        if messages:
            # Pegar última mensagem do assistente
            for msg in reversed(messages):
                if hasattr(msg, 'content') and msg.content:
                    print(json.dumps({"success": True, "content": msg.content}))
                    return
        print(json.dumps({"success": True, "content": str(result.get('result', 'Tarefa executada com sucesso'))}))
    else:
        print(json.dumps({"success": False, "error": result.get('error', 'Erro desconhecido')}))

if __name__ == "__main__":
    asyncio.run(main())
`;

    // Escrever script temporário
    fs.writeFileSync(scriptPath, scriptContent);

    // Executar script Python
    return new Promise((resolve, reject) => {
      const pythonProcess = spawn(PYTHON_PATH, [scriptPath], {
        cwd: process.cwd(),
        env: { ...process.env, PYTHONUNBUFFERED: "1" },
      });

      let stdout = "";
      let stderr = "";

      pythonProcess.stdout.on("data", (data) => {
        stdout += data.toString();
      });

      pythonProcess.stderr.on("data", (data) => {
        stderr += data.toString();
      });

      pythonProcess.on("close", (code) => {
        // Limpar script temporário (sempre, mesmo em caso de erro)
        try {
          if (fs.existsSync(scriptPath)) {
            fs.unlinkSync(scriptPath);
          }
        } catch (e) {
          // Ignorar erro de limpeza
          console.warn(`[SuperAgent] Não foi possível limpar arquivo temporário: ${scriptPath}`);
        }

        if (code !== 0) {
          console.error("[SuperAgent] Erro ao executar:", stderr);
          reject(new Error(`Python process exited with code ${code}: ${stderr}`));
          return;
        }

        try {
          // Parsear JSON da saída
          const lines = stdout.trim().split("\n");
          const jsonLine = lines.find((line) => line.trim().startsWith("{"));
          if (!jsonLine) {
            throw new Error("No JSON output found");
          }

          const result = JSON.parse(jsonLine);
          if (result.success) {
            resolve(result.content);
          } else {
            reject(new Error(result.error || "Unknown error"));
          }
        } catch (error) {
          console.error("[SuperAgent] Erro ao parsear resultado:", error);
          console.error("[SuperAgent] stdout:", stdout);
          reject(error);
        }
      });

      pythonProcess.on("error", (error) => {
        console.error("[SuperAgent] Erro ao iniciar processo Python:", error);
        // Limpar script temporário em caso de erro
        try {
          if (fs.existsSync(scriptPath)) {
            fs.unlinkSync(scriptPath);
          }
        } catch (e) {
          // Ignorar erro de limpeza
        }
        reject(error);
      });
    });
  } catch (error) {
    console.error("[SuperAgent] Erro ao executar:", error);
    throw error;
  }
}

/**
 * Verificar se Super Agent Framework está disponível
 */
export async function checkSuperAgentAvailable(): Promise<boolean> {
  try {
    if (!fs.existsSync(SUPER_AGENT_PATH)) {
      return false;
    }

    // Verificar se Python está disponível
    return new Promise((resolve) => {
      const pythonProcess = spawn(PYTHON_PATH, ["--version"]);
      pythonProcess.on("close", (code) => {
        resolve(code === 0);
      });
      pythonProcess.on("error", () => {
        resolve(false);
      });
    });
  } catch (error) {
    return false;
  }
}

