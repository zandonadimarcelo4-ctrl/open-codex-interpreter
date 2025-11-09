/**
 * Utilitários para integração com AutoGen
 * AutoGen controla tudo - orquestra todos os agentes
 */

import { spawn } from "child_process";
import { promisify } from "util";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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
    // Verificar se o módulo Python existe
    // Tentar múltiplos caminhos possíveis
    const possiblePaths = [
      path.join(process.cwd(), "..", "super_agent"),
      path.join(process.cwd(), "super_agent"),
      path.join(__dirname, "..", "..", "..", "super_agent"),
      path.join(__dirname, "..", "..", "super_agent"),
    ];
    
    let pythonModulePath: string | null = null;
    for (const possiblePath of possiblePaths) {
      if (fs.existsSync(possiblePath)) {
        pythonModulePath = possiblePath;
        break;
      }
    }
    
    // Se não encontrar o módulo Python, ainda assim inicializar o framework
    // O framework pode funcionar apenas com Ollama, sem precisar do módulo Python completo
    if (!pythonModulePath) {
      console.warn("[AutoGen] Módulo Python não encontrado, usando modo simplificado (apenas Ollama)");
    } else {
      console.log(`[AutoGen] Módulo Python encontrado em: ${pythonModulePath}`);
    }

    // Inicializar framework (modo simplificado - apenas Ollama)
    // O AutoGen pode funcionar apenas com Ollama, sem precisar do módulo Python completo
    console.log("[AutoGen] Framework inicializado (modo simplificado - Ollama)");
    
    autogenFramework = {
      initialized: true,
      model: DEFAULT_MODEL,
      ollamaBaseUrl: OLLAMA_BASE_URL,
      pythonModulePath: pythonModulePath || null,
    };
    
    return autogenFramework;
  } catch (error) {
    console.error("[AutoGen] Erro ao inicializar:", error);
    // Mesmo com erro, retornar framework simplificado se Ollama estiver disponível
    autogenFramework = {
      initialized: true,
      model: DEFAULT_MODEL,
      ollamaBaseUrl: OLLAMA_BASE_URL,
      pythonModulePath: null,
    };
    return autogenFramework;
  }
}

/**
 * Executar tarefa usando AutoGen
 * AutoGen orquestra todos os agentes baseado na intenção
 * Suporta execução de código e análise de imagens
 */
export async function executeWithAutoGen(
  task: string,
  intent: { type: string; actionType?: string; confidence: number; reason?: string },
  context?: Record<string, any>
): Promise<string> {
  try {
    // Verificar disponibilidade primeiro
    const availability = await checkAutoGenAvailable();
    if (!availability.available) {
      // Construir mensagem de erro detalhada
      let errorMessage = `⚠️ **AutoGen não disponível**\n\n`;
      errorMessage += `**Razão**: ${availability.reason || "Desconhecida"}\n\n`;
      
      if (availability.details) {
        if (availability.details.suggestion) {
          errorMessage += `**Solução**: ${availability.details.suggestion}\n\n`;
        }
        if (availability.details.ollama_url) {
          errorMessage += `**Ollama URL**: ${availability.details.ollama_url}\n\n`;
        }
        if (availability.details.model) {
          errorMessage += `**Modelo**: ${availability.details.model}\n\n`;
        }
      }
      
      errorMessage += `**Para resolver:**\n`;
      errorMessage += `1. Verifique se Ollama está rodando: \`ollama serve\`\n`;
      errorMessage += `2. Verifique se o modelo está instalado: \`ollama pull ${DEFAULT_MODEL}\`\n`;
      errorMessage += `3. Verifique se OLLAMA_BASE_URL está configurado corretamente\n`;
      errorMessage += `4. Verifique se AutoGen está instalado: \`pip install pyautogen\`\n\n`;
      errorMessage += `**Sua mensagem**: "${task}"`;
      
      throw new Error(errorMessage);
    }

    // Inicializar AutoGen se necessário
    const framework = await initializeAutoGen();
    if (!framework) {
      throw new Error("AutoGen não disponível");
    }

    // Construir prompt baseado na intenção - estilo Open Interpreter
    let systemPrompt = "";
    let agentName = "Super Agent";
    
    if (intent.type === "action" || intent.type === "command") {
      systemPrompt = `Você é Open Interpreter, um programador de classe mundial que pode completar qualquer objetivo executando código.

Você tem acesso a um ambiente de execução de código local. Quando o usuário pede algo que requer código, você DEVE:
1. Gerar o código necessário
2. Executar o código automaticamente
3. Mostrar o resultado
4. Iterar se necessário

REGRAS IMPORTANTES:
- SEMPRE execute código quando necessário - não apenas explique como fazer
- Use function calling para executar código automaticamente
- Mostre o código que você está executando
- Se o código falhar, tente corrigir e executar novamente
- Seja direto e objetivo - execute, não apenas explique

Intenção detectada: ${intent.actionType || "execução"}
Confiança: ${(intent.confidence * 100).toFixed(0)}%

EXECUTE o código automaticamente quando o usuário pedir para fazer algo.`;
      agentName = "Open Interpreter (AutoGen)";
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

    // Extrair imagens do contexto se disponíveis
    const images = context?.images || [];

    // Chamar Ollama DeepSeek-R1 com o prompt do AutoGen e imagens
    let ollamaResponse = await callOllamaWithAutoGenPrompt(
      systemPrompt,
      task,
      framework.model,
      intent,
      images.length > 0 ? images : undefined
    );

    // Se a resposta contém código e não foi executado via function calling, executar automaticamente
    if (intent.type === "action" || intent.type === "command") {
      const { extractCodeBlocks, executeCodeBlocks } = await import("./code_executor");
      const codeBlocks = extractCodeBlocks(ollamaResponse);

      // Só executar se não foi executado via function calling
      if (codeBlocks.length > 0 && !ollamaResponse.includes("✅ Código executado")) {
        // Executar código automaticamente (estilo Open Interpreter)
        const executionResults = await executeCodeBlocks(codeBlocks, {
          autoApprove: true,
          timeout: 30000,
        });

        // Adicionar resultados da execução à resposta
        const executionOutput = executionResults
          .map((result, idx) => {
            if (result.success) {
              return `\n\n**✅ Código ${idx + 1} executado (${result.language}):**\n\`\`\`\n${result.output}\n\`\`\``;
            } else {
              return `\n\n**❌ Erro na execução ${idx + 1} (${result.language}):**\n\`\`\`\n${result.error}\n\`\`\``;
            }
          })
          .join("\n");

        ollamaResponse += executionOutput;
      }
    }

    return ollamaResponse;
  } catch (error) {
    console.error("[AutoGen] Erro ao executar:", error);
    throw error;
  }
}

/**
 * Chamar Ollama com prompt do AutoGen e suporte a imagens
 */
async function callOllamaWithAutoGenPrompt(
  systemPrompt: string,
  userMessage: string,
  model: string,
  intent: { type: string; actionType?: string; confidence: number },
  images?: string[] // URLs base64 de imagens
): Promise<string> {
  try {
    const url = `${OLLAMA_BASE_URL}/api/chat`;
    
    // Construir mensagens com suporte a imagens
    const messages: any[] = [
      {
        role: "system",
        content: systemPrompt,
      },
    ];

    // Se houver imagens, adicionar como mensagem multimodal
    if (images && images.length > 0) {
      const imageContents = images.map((imageUrl) => ({
        type: "image_url",
        image_url: {
          url: imageUrl,
        },
      }));

      messages.push({
        role: "user",
        content: [
          { type: "text", text: userMessage },
          ...imageContents,
        ],
      });
    } else {
      messages.push({
        role: "user",
        content: userMessage,
      });
    }

    // Function calling para execução automática de código (estilo Open Interpreter)
    const tools = intent.type === "action" || intent.type === "command" ? [
      {
        type: "function",
        function: {
          name: "run_code",
          description: "Executa código automaticamente. Use esta função sempre que precisar executar código para completar a tarefa do usuário.",
          parameters: {
            type: "object",
            properties: {
              language: {
                type: "string",
                description: "Linguagem do código (python, javascript, shell, etc.)",
                enum: ["python", "javascript", "shell", "bash"]
              },
              code: {
                type: "string",
                description: "O código a ser executado"
              }
            },
            required: ["language", "code"]
          }
        }
      }
    ] : undefined;

    const requestBody: any = {
      model,
      messages,
      stream: false,
      options: {
        temperature: intent.type === "action" ? 0.2 : 0.7,
        top_p: 0.9,
        num_predict: intent.type === "action" ? 4000 : 1000,
      },
    };

    if (tools) {
      requestBody.tools = tools;
      requestBody.tool_choice = "auto"; // Forçar uso de function calling quando disponível
    }

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
    let responseContent = data.message.content || "";
    
    // Se houver function calls, executar automaticamente (estilo Open Interpreter)
    if (data.message.tool_calls && Array.isArray(data.message.tool_calls)) {
      const { executeCode } = await import("./code_executor");
      
      for (const toolCall of data.message.tool_calls) {
        if (toolCall.function?.name === "run_code") {
          try {
            const args = JSON.parse(toolCall.function.arguments || "{}");
            const { language, code } = args;
            
            if (code) {
              // Executar código automaticamente
              const result = await executeCode(code, language, {
                timeout: 30000,
                workingDirectory: process.cwd(),
              });
              
              // Adicionar resultado à resposta
              if (result.success) {
                responseContent += `\n\n**✅ Código executado (${language}):**\n\`\`\`${language}\n${code}\n\`\`\`\n\n**Resultado:**\n\`\`\`\n${result.output}\n\`\`\``;
              } else {
                responseContent += `\n\n**❌ Erro na execução (${language}):**\n\`\`\`${language}\n${code}\n\`\`\`\n\n**Erro:**\n\`\`\`\n${result.error}\n\`\`\``;
              }
            }
          } catch (error) {
            console.warn("[AutoGen] Erro ao executar function call:", error);
            responseContent += `\n\n⚠️ Erro ao executar código: ${error instanceof Error ? error.message : String(error)}`;
          }
        }
      }
    }
    
    return responseContent;
  } catch (error) {
    console.error("[AutoGen] Erro ao chamar Ollama:", error);
    throw error;
  }
}

/**
 * Verificar se Ollama está disponível
 */
export async function checkOllamaAvailable(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 segundos de timeout
    
    const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`, {
      method: "GET",
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.warn("[AutoGen] Ollama não respondeu a tempo (timeout)");
    } else {
      console.warn("[AutoGen] Ollama não disponível:", error);
    }
    return false;
  }
}

/**
 * Verificar se o modelo está instalado
 */
export async function checkModelAvailable(model: string = DEFAULT_MODEL): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 segundos de timeout
    
    const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`, {
      method: "GET",
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      return false;
    }
    
    const data = await response.json();
    const models = data.models || [];
    
    // Verificar se o modelo está instalado (pode ser "deepseek-r1", "deepseek-r1:8b", "deepseek-r1:latest", etc.)
    const modelFound = models.some((m: any) => {
      const modelName = m.name || "";
      // Aceitar exatamente o nome, ou variações com tag (ex: "deepseek-r1:8b", "deepseek-r1:latest")
      return modelName === model || 
             modelName.startsWith(`${model}:`) ||
             modelName.includes(model);
    });
    
    if (!modelFound) {
      console.warn(`[AutoGen] Modelo '${model}' não encontrado. Modelos disponíveis:`, models.map((m: any) => m.name));
    } else {
      const foundModel = models.find((m: any) => {
        const modelName = m.name || "";
        return modelName === model || modelName.startsWith(`${model}:`) || modelName.includes(model);
      });
      console.log(`[AutoGen] Modelo encontrado: ${foundModel?.name || model}`);
    }
    
    return modelFound;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.warn("[AutoGen] Timeout ao verificar modelo");
    } else {
      console.warn("[AutoGen] Erro ao verificar modelo:", error);
    }
    return false;
  }
}

/**
 * Verificar se AutoGen está disponível
 */
export async function checkAutoGenAvailable(): Promise<{ available: boolean; reason?: string; details?: any }> {
  try {
    // Verificar Ollama primeiro
    const ollamaAvailable = await checkOllamaAvailable();
    if (!ollamaAvailable) {
      return {
        available: false,
        reason: "Ollama não está rodando",
        details: {
          ollama_url: OLLAMA_BASE_URL,
          suggestion: "Execute 'ollama serve' para iniciar o Ollama",
        },
      };
    }

    // Verificar modelo
    const modelAvailable = await checkModelAvailable();
    if (!modelAvailable) {
      return {
        available: false,
        reason: `Modelo '${DEFAULT_MODEL}' não está instalado`,
        details: {
          model: DEFAULT_MODEL,
          suggestion: `Execute 'ollama pull ${DEFAULT_MODEL}' para instalar o modelo`,
        },
      };
    }

    // Verificar framework
    // O framework pode funcionar apenas com Ollama, sem precisar do módulo Python completo
    const framework = await initializeAutoGen();
    if (!framework || !framework.initialized) {
      return {
        available: false,
        reason: "AutoGen Framework não inicializado",
        details: {
          suggestion: "Verifique se Ollama está rodando e o modelo está instalado",
        },
      };
    }

    // Se chegou até aqui, Ollama está rodando, modelo está instalado e framework está inicializado
    return { available: true };
  } catch (error) {
    return {
      available: false,
      reason: error instanceof Error ? error.message : "Erro desconhecido",
      details: { error },
    };
  }
}

