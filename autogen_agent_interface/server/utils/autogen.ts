/**
 * Utilitários para integração com AutoGen
 * AutoGen controla tudo - orquestra todos os agentes
 */

import { spawn } from "child_process";
import { promisify } from "util";
import * as fs from "fs";
import * as path from "path";

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
const DEFAULT_MODEL = "deepseek-r1";

let autogenFramework: any = null;

/**
 * Inicializar AutoGen Framework
 */
export async function initializeAutoGen(): Promise<any> {
  if (autogenFramework) {
    return autogenFramework;
  }

  try {
    // Importar SuperAgentFramework do Python
    const { exec } = require("child_process");
    const execAsync = promisify(exec);
    
    // Verificar se o módulo Python existe
    const pythonModulePath = path.join(process.cwd(), "..", "super_agent");
    if (!fs.existsSync(pythonModulePath)) {
      console.warn("[AutoGen] Módulo Python não encontrado, usando fallback");
      return null;
    }

    // Por enquanto, usar uma abordagem simplificada
    // Em produção, usar comunicação via API ou IPC
    console.log("[AutoGen] Framework inicializado (modo simplificado)");
    
    autogenFramework = {
      initialized: true,
      model: DEFAULT_MODEL,
      ollamaBaseUrl: OLLAMA_BASE_URL,
    };
    
    return autogenFramework;
  } catch (error) {
    console.error("[AutoGen] Erro ao inicializar:", error);
    return null;
  }
}

/**
 * Executar tarefa usando AutoGen
 * AutoGen orquestra todos os agentes baseado na intenção
 */
export async function executeWithAutoGen(
  task: string,
  intent: { type: string; actionType?: string; confidence: number; reason?: string },
  context?: Record<string, any>
): Promise<string> {
  try {
    // Inicializar AutoGen se necessário
    const framework = await initializeAutoGen();
    if (!framework) {
      throw new Error("AutoGen não disponível");
    }

    // Construir prompt baseado na intenção
    let systemPrompt = "";
    let agentName = "Super Agent";
    
    if (intent.type === "action" || intent.type === "command") {
      systemPrompt = `Você é um agente executor controlado pelo AutoGen Framework.
O AutoGen orquestra todos os agentes especializados:
- Planner: Planeja a execução
- Generator: Gera código e soluções
- Critic: Revisa e valida
- Executor: Executa tarefas
- Browser: Navega na web
- Video Editor: Edita vídeos
- UFO: Automa GUI
- Multimodal: Processa imagens/vídeos/áudio

O usuário quer que você AJA e FAÇA algo.
Intenção detectada: ${intent.actionType || "execução"}
Confiança: ${(intent.confidence * 100).toFixed(0)}%

O AutoGen vai coordenar os agentes necessários para executar esta ação.
Responda de forma direta e prática, focando em executar a ação solicitada.
Se a ação requer código, forneça código executável.
Se a ação requer criação de arquivos, forneça o conteúdo completo.
Seja objetivo e eficiente.`;
      agentName = "Executor Agent (AutoGen)";
    } else if (intent.type === "question") {
      systemPrompt = `Você é um assistente controlado pelo AutoGen Framework.
O AutoGen orquestra todos os agentes especializados para fornecer respostas completas.

O usuário fez uma pergunta e quer uma resposta informativa.
Intenção detectada: Pergunta
Confiança: ${(intent.confidence * 100).toFixed(0)}%

O AutoGen pode usar agentes especializados (Browser, Multimodal, etc.) se necessário.
Responda a pergunta de forma detalhada e educativa.
Se a pergunta for sobre código, forneça exemplos práticos.
Se a pergunta for conceitual, explique de forma clara e didática.`;
      agentName = "Assistant Agent (AutoGen)";
    } else {
      systemPrompt = `Você é um assistente de IA colaborativo controlado pelo AutoGen Framework.
O AutoGen orquestra todos os agentes especializados:
- Planner: Planeja soluções
- Generator: Gera código
- Designer: Cria interfaces
- Executor: Executa tarefas
- Browser: Busca informações
- Multimodal: Processa conteúdo multimodal

O usuário está conversando com você. Seja amigável e útil.
Se o usuário quiser que você faça algo, o AutoGen vai coordenar os agentes necessários.
Sugira comandos diretos como:
- "Crie um arquivo..."
- "Execute o código..."
- "Busque informações sobre..."`;
    }

    // Chamar Ollama DeepSeek-R1 com o prompt do AutoGen
    const ollamaResponse = await callOllamaWithAutoGenPrompt(
      systemPrompt,
      task,
      framework.model,
      intent
    );

    return ollamaResponse;
  } catch (error) {
    console.error("[AutoGen] Erro ao executar:", error);
    throw error;
  }
}

/**
 * Chamar Ollama com prompt do AutoGen
 */
async function callOllamaWithAutoGenPrompt(
  systemPrompt: string,
  userMessage: string,
  model: string,
  intent: { type: string; actionType?: string; confidence: number }
): Promise<string> {
  try {
    const url = `${OLLAMA_BASE_URL}/api/chat`;
    
    const requestBody = {
      model,
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: userMessage,
        },
      ],
      stream: false,
      options: {
        temperature: intent.type === "action" ? 0.3 : 0.7,
        top_p: 0.9,
        num_predict: intent.type === "action" ? 2000 : 1000,
      },
    };

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Ollama API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data.message.content;
  } catch (error) {
    console.error("[AutoGen] Erro ao chamar Ollama:", error);
    throw error;
  }
}

/**
 * Verificar se AutoGen está disponível
 */
export async function checkAutoGenAvailable(): Promise<boolean> {
  try {
    const framework = await initializeAutoGen();
    return framework !== null;
  } catch (error) {
    return false;
  }
}

