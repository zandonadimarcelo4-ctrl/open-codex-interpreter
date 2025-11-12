/**
 * Intent Classifier Bridge - Ponte TypeScript-Python
 * Chama o classificador de intenção LLM do backend Python
 */

import { spawn } from "child_process";
import { join } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface IntentClassification {
  intent: "execution" | "conversation";
  reasoning: string;
  action_type: "code" | "web" | "file" | "search" | "general" | null;
  confidence: number;
}

/**
 * Classifica intenção usando LLM via Python
 */
export async function classifyIntentLLM(
  message: string,
  model?: string,
  baseUrl?: string
): Promise<IntentClassification> {
  return new Promise((resolve, reject) => {
    const scriptPath = join(
      __dirname,
      "../../../interpreter/intent_classifier.py"
    );

    const pythonProcess = spawn("python", [scriptPath, message], {
      cwd: join(__dirname, "../../.."),
      env: {
        ...process.env,
        ...(model && { DEFAULT_MODEL: model }),
        ...(baseUrl && { OLLAMA_BASE_URL: baseUrl }),
      },
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
        console.error(`[IntentClassifier] Erro: ${stderr}`);
        // Fallback seguro
        resolve({
          intent: "conversation",
          reasoning: `Erro ao classificar intenção: ${stderr}`,
          action_type: null,
          confidence: 0.5,
        });
        return;
      }

      try {
        // Extrair JSON da saída (pode ter logs antes/depois)
        const jsonMatch = stdout.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const classification = JSON.parse(jsonMatch[0]);
          resolve(classification);
        } else {
          throw new Error("JSON não encontrado na saída");
        }
      } catch (error) {
        console.error(`[IntentClassifier] Erro ao parsear JSON: ${error}`);
        console.error(`[IntentClassifier] Saída: ${stdout}`);
        // Fallback seguro
        resolve({
          intent: "conversation",
          reasoning: `Erro ao parsear resposta: ${error}`,
          action_type: null,
          confidence: 0.5,
        });
      }
    });

    pythonProcess.on("error", (error) => {
      console.error(`[IntentClassifier] Erro ao executar Python: ${error}`);
      // Fallback seguro
      resolve({
        intent: "conversation",
        reasoning: `Erro ao executar classificador: ${error.message}`,
        action_type: null,
        confidence: 0.5,
      });
    });
  });
}

/**
 * Classificação híbrida: regras rápidas + LLM para casos complexos
 */
export async function classifyIntentHybrid(
  message: string,
  rulesResult?: { type: string; confidence: number; actionType?: string }
): Promise<IntentClassification> {
  // Se as regras têm alta confiança (>0.9), usar diretamente
  if (rulesResult && rulesResult.confidence > 0.9) {
    const intent =
      rulesResult.type === "conversation" ||
      rulesResult.type === "question"
        ? "conversation"
        : "execution";

    let action_type: IntentClassification["action_type"] = null;
    if (intent === "execution") {
      if (rulesResult.actionType === "code") action_type = "code";
      else if (rulesResult.actionType === "web") action_type = "web";
      else if (rulesResult.actionType === "file") action_type = "file";
      else if (rulesResult.actionType === "search") action_type = "search";
      else action_type = "general";
    }

    return {
      intent,
      reasoning: `Classificação por regras (confiança: ${rulesResult.confidence})`,
      action_type,
      confidence: rulesResult.confidence,
    };
  }

  // Casos ambíguos ou baixa confiança: usar LLM
  try {
    const llmResult = await classifyIntentLLM(message);
    return llmResult;
  } catch (error) {
    console.error(`[IntentClassifier] Erro no LLM, usando fallback: ${error}`);
    // Fallback para regras se LLM falhar
    if (rulesResult) {
      const intent =
        rulesResult.type === "conversation" ||
        rulesResult.type === "question"
          ? "conversation"
          : "execution";

      return {
        intent,
        reasoning: `Fallback para regras após erro no LLM`,
        action_type: null,
        confidence: 0.7,
      };
    }

    // Último fallback: tratar como conversa
    return {
      intent: "conversation",
      reasoning: "Erro ao classificar, tratando como conversa por segurança",
      action_type: null,
      confidence: 0.5,
    };
  }
}

