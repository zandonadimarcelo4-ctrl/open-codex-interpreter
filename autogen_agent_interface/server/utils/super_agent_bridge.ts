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
    // Adicionar caminho do projeto para importar interpreter
    const projectRoot = path.resolve(process.cwd(), "..");
    const interpreterPath = path.join(projectRoot, "interpreter");
    
    const scriptContent = `
import sys
import os
import json

# Adicionar caminhos do projeto
project_root = "${projectRoot.replace(/\\/g, '/')}"
interpreter_path = "${interpreterPath.replace(/\\/g, '/')}"
sys.path.insert(0, project_root)
sys.path.insert(0, interpreter_path)

# Usar Open Interpreter existente do projeto
try:
    from interpreter.interpreter import Interpreter
    
    # Inicializar Open Interpreter
    interpreter = Interpreter()
    interpreter.auto_run = True  # Executar código automaticamente
    interpreter.local = True  # Usar modelo local (Ollama)
    
    # Configurar para usar Ollama
    import os
    os.environ['OLLAMA_BASE_URL'] = "${process.env.OLLAMA_BASE_URL || "http://localhost:11434"}"
    
    print("[SuperAgent] Open Interpreter inicializado", file=sys.stderr)
    
    # Executar tarefa usando Open Interpreter
    task = ${JSON.stringify(task)}
    intent = ${JSON.stringify(intent)}
    
    # Construir mensagem
    message = task
    if intent.get('type') in ['action', 'command']:
        message = f"{task}\\n\\n(Execute this task automatically using code)"
    
    # Usar chat do Open Interpreter (ele já faz tudo: detecta código, executa, etc)
    result = interpreter.chat(message, return_messages=False)
    
    # Extrair última resposta do assistente
    if interpreter.messages:
        for msg in reversed(interpreter.messages):
            if msg.get('role') == 'assistant' and msg.get('content'):
                print(json.dumps({"success": True, "content": msg['content']}))
                break
        else:
            print(json.dumps({"success": True, "content": "Tarefa executada"}))
    else:
        print(json.dumps({"success": True, "content": "Tarefa executada"}))
        
except ImportError as e:
    print(f"[SuperAgent] Erro ao importar Open Interpreter: {e}", file=sys.stderr)
    print(json.dumps({"success": False, "error": f"Open Interpreter não disponível: {e}"}))
except Exception as e:
    import traceback
    print(f"[SuperAgent] Erro: {e}", file=sys.stderr)
    print(traceback.format_exc(), file=sys.stderr)
    print(json.dumps({"success": False, "error": str(e)}))
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

