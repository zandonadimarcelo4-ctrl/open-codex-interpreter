/**
 * Cognitive Bridge - Ponte entre TypeScript e Sistema Cognitivo Python
 * Integra o ANIMA Cognitive Core com o sistema TypeScript existente
 */

import { spawn } from "child_process";
import * as path from "path";
import * as fs from "fs";
import { fileURLToPath } from "url";
import { dirname } from "path";

// Suporte para __dirname em módulos ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface CognitiveResult {
  enriched_message: string;
  original_task: string;
  confidence: number;
  emotional_tone: string;
  modulation_factors: Record<string, number>;
  reflection: {
    reflection_type: string;
    confidence: number;
    confidence_level: string;
    should_revise: boolean;
    revision_suggestions: string[];
    insights: string[];
  } | null;
  relevant_memories: {
    episodic: Array<{
      task: string;
      success: boolean;
      emotion: string;
      emotion_value: number;
      timestamp: number;
    }>;
    semantic: Array<{
      concept: string;
      definition: string;
      usage_count: number;
      confidence: number;
    }>;
    affective: Array<{
      event: string;
      emotion: string;
      emotion_value: number;
      timestamp: number;
    }>;
  };
  decision: {
    action: string;
    approach: string;
    parameters: Record<string, any>;
  };
  cognitive_summary: Record<string, any>;
}

interface CognitiveContext {
  task: string;
  context?: Record<string, any>;
  user_feedback?: string;
  user_id?: string;
}

/**
 * Processa tarefa com sistema cognitivo Python
 * Retorna contexto cognitivo enriquecido
 */
export async function processWithCognitiveSystem(
  task: string,
  context?: Record<string, any>,
  user_id?: string
): Promise<CognitiveResult | null> {
  try {
    // Verificar se o sistema cognitivo está disponível
    const cognitiveScriptPath = path.join(
      __dirname,
      "../../../anima/orchestrator/cognitive_bridge.py"
    );

    if (!fs.existsSync(cognitiveScriptPath)) {
      console.warn("[CognitiveBridge] Sistema cognitivo não disponível, pulando...");
      return null;
    }

    // Criar contexto cognitivo
    const cognitiveContext: CognitiveContext = {
      task,
      context: context || {},
      user_id: user_id || "default_user",
    };

    // Chamar sistema cognitivo Python via script
    return await callCognitivePython(cognitiveContext);
  } catch (error) {
    console.error("[CognitiveBridge] Erro ao processar com sistema cognitivo:", error);
    return null;
  }
}

/**
 * Chama script Python do sistema cognitivo
 */
async function callCognitivePython(
  context: CognitiveContext
): Promise<CognitiveResult> {
  return new Promise((resolve, reject) => {
    const pythonScript = path.join(
      __dirname,
      "../../../anima/orchestrator/cognitive_bridge.py"
    );

    const pythonProcess = spawn("python", [pythonScript, JSON.stringify(context)], {
      cwd: path.join(__dirname, "../../.."),
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
      if (code !== 0) {
        console.error(`[CognitiveBridge] Python script exited with code ${code}`);
        console.error(`[CognitiveBridge] stderr: ${stderr}`);
        reject(new Error(`Python script failed with code ${code}: ${stderr}`));
        return;
      }

      try {
        // Parse JSON response
        const result = JSON.parse(stdout.trim());
        resolve(result);
      } catch (error) {
        console.error("[CognitiveBridge] Erro ao parsear resposta JSON:", error);
        console.error("[CognitiveBridge] stdout:", stdout);
        reject(new Error(`Failed to parse JSON response: ${error}`));
      }
    });

    pythonProcess.on("error", (error) => {
      console.error("[CognitiveBridge] Erro ao executar Python script:", error);
      reject(error);
    });

    // Timeout de 30 segundos
    setTimeout(() => {
      pythonProcess.kill();
      reject(new Error("Cognitive system timeout (30s)"));
    }, 30000);
  });
}

/**
 * Aprende com resposta recebida
 */
export async function learnFromResponse(
  task: string,
  response: string,
  success: boolean = true,
  user_feedback?: string,
  user_id?: string
): Promise<void> {
  try {
    const cognitiveScriptPath = path.join(
      __dirname,
      "../../../anima/orchestrator/cognitive_bridge.py"
    );

    if (!fs.existsSync(cognitiveScriptPath)) {
      return;
    }

    const learnContext = {
      action: "learn",
      task,
      response,
      success,
      user_feedback,
      user_id: user_id || "default_user",
    };

    await callCognitivePython(learnContext as any);
  } catch (error) {
    console.error("[CognitiveBridge] Erro ao aprender com resposta:", error);
    // Não rejeitar, apenas logar erro
  }
}

/**
 * Obtém resumo do estado cognitivo
 */
export async function getCognitiveSummary(user_id?: string): Promise<Record<string, any> | null> {
  try {
    const cognitiveScriptPath = path.join(
      __dirname,
      "../../../anima/orchestrator/cognitive_bridge.py"
    );

    if (!fs.existsSync(cognitiveScriptPath)) {
      return null;
    }

    const summaryContext = {
      action: "summary",
      user_id: user_id || "default_user",
    };

    const result = await callCognitivePython(summaryContext as any);
    return result?.cognitive_summary || null;
  } catch (error) {
    console.error("[CognitiveBridge] Erro ao obter resumo cognitivo:", error);
    return null;
  }
}

/**
 * Enriquece mensagem com contexto cognitivo (modo simplificado sem Python)
 * Usa apenas heurísticas TypeScript quando o sistema Python não está disponível
 */
export function enrichMessageWithCognitiveContext(
  task: string,
  context?: Record<string, any>
): string {
  // Modo simplificado: apenas adiciona contexto básico
  let enrichedMessage = task;

  // Adicionar contexto de memória se disponível
  if (context?.memoryContext === "SIM") {
    enrichedMessage = `[CONTEXTO DE MEMÓRIA DISPONÍVEL]\n${enrichedMessage}`;
  }

  // Adicionar contexto de conversa se disponível
  if (context?.conversationId) {
    enrichedMessage = `[CONVERSA ${context.conversationId}]\n${enrichedMessage}`;
  }

  return enrichedMessage;
}

