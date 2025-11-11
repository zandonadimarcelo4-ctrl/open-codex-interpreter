/**
 * Utilitários para integração com Ollama
 * 
 * @module ollama
 * @author ANIMA Project
 * @since 1.0.0
 */

import { ExecutionError, NotFoundError, NetworkError, withErrorHandling } from "./error_handler";
import { validateNonEmptyString } from "./validators";

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
const DEFAULT_MODEL = process.env.DEFAULT_MODEL || "lucasmg/deepseek-r1-8b-0528-qwen3-q4_K_M-tool-true";

// Modelos de fallback em ordem de preferência
const FALLBACK_MODELS = [
  "deepseek-coder-v2-16b-q4_k_m",
  "deepseek-coder",
  "deepseek-coder:1.3b",
  "codellama",
  "mistral",
  "llama3.2",
  "qwen2.5-coder",
];

export interface OllamaChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface OllamaChatRequest {
  model: string;
  messages: OllamaChatMessage[];
  stream?: boolean;
  options?: {
    temperature?: number;
    top_p?: number;
    top_k?: number;
    num_predict?: number;
  };
}

export interface OllamaChatResponse {
  message: {
    role: string;
    content: string;
  };
  done: boolean;
}

/**
 * Lista todos os modelos disponíveis no Ollama
 * 
 * @returns Array com nomes dos modelos disponíveis
 * @throws {NetworkError} Se houver erro de rede ao acessar Ollama
 * 
 * @example
 * ```typescript
 * const models = await listAvailableModels();
 * // Retorna: ["deepseek-coder-v2-16b-q4_k_m", "mistral", "llama3.2", ...]
 * ```
 */
export async function listAvailableModels(): Promise<string[]> {
  return withErrorHandling(async () => {
    const url = `${OLLAMA_BASE_URL}/api/tags`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    try {
      const response = await fetch(url, {
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new NetworkError(
          `Erro ao listar modelos: ${response.status} ${response.statusText}`,
          { url, status: response.status }
        );
      }
      
      const data = await response.json();
      const models = data.models || [];
      return models.map((m: any) => m.name || "").filter((name: string) => name);
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new NetworkError("Timeout ao listar modelos do Ollama", { url });
      }
      throw error;
    }
  }, { context: "listAvailableModels" });
}

/**
 * Encontra o melhor modelo disponível da lista de modelos preferidos
 * 
 * @param preferredModels - Lista de modelos em ordem de preferência
 * @returns Nome do primeiro modelo disponível, ou null se nenhum estiver disponível
 * 
 * @example
 * ```typescript
 * const model = await findBestAvailableModel(["deepseek-coder-v2-16b-q4_k_m", "deepseek-coder"]);
 * // Retorna: "deepseek-coder-v2-16b-q4_k_m" se disponível, senão "deepseek-coder", ou null
 * ```
 */
export async function findBestAvailableModel(
  preferredModels: string[] = [DEFAULT_MODEL, ...FALLBACK_MODELS]
): Promise<string | null> {
  return withErrorHandling(async () => {
    const availableModels = await listAvailableModels();
    
    // Tentar encontrar modelo exato ou parcial
    for (const preferred of preferredModels) {
      // Verificar match exato
      if (availableModels.includes(preferred)) {
        return preferred;
      }
      
      // Verificar match parcial (ex: "deepseek-coder" matcha "deepseek-coder:1.3b")
      const found = availableModels.find((available) => {
        const availableBase = available.split(":")[0];
        const preferredBase = preferred.split(":")[0];
        return availableBase === preferredBase || available.includes(preferredBase);
      });
      
      if (found) {
        console.log(`[Ollama] Modelo '${preferred}' não encontrado, usando '${found}' como alternativa`);
        return found;
      }
    }
    
    // Se nenhum modelo preferido está disponível, retornar o primeiro disponível
    if (availableModels.length > 0) {
      console.warn(`[Ollama] Nenhum modelo preferido disponível, usando '${availableModels[0]}'`);
      return availableModels[0];
    }
    
    return null;
  }, { context: "findBestAvailableModel" });
}

/**
 * Chama Ollama para gerar resposta de chat com verificação de modelo e fallback automático
 * 
 * @param messages - Array de mensagens para enviar ao modelo
 * @param model - Nome do modelo a usar (opcional, usa DEFAULT_MODEL se não fornecido)
 * @param options - Opções de configuração do modelo (opcional)
 * @returns Resposta do modelo como string
 * @throws {NotFoundError} Se o modelo não estiver disponível e nenhum fallback funcionar
 * @throws {NetworkError} Se houver erro de rede
 * @throws {ExecutionError} Se houver erro ao gerar resposta
 * 
 * @example
 * ```typescript
 * const response = await callOllamaChat(
 *   [{ role: "user", content: "Olá!" }],
 *   "deepseek-coder-v2-16b-q4_k_m"
 * );
 * ```
 */
export async function callOllamaChat(
  messages: OllamaChatMessage[],
  model: string = DEFAULT_MODEL,
  options?: OllamaChatRequest["options"]
): Promise<string> {
  return withErrorHandling(async () => {
    // Validar inputs
    validateNonEmptyString(model, "model");
    if (!messages || messages.length === 0) {
      throw new ExecutionError("Mensagens não podem estar vazias", { messages });
    }
    
    const url = `${OLLAMA_BASE_URL}/api/chat`;
    
    // Verificar se modelo está disponível antes de usar
    const modelAvailable = await checkModelAvailable(model);
    
    // Se modelo não está disponível, tentar encontrar alternativa
    let modelToUse = model;
    if (!modelAvailable) {
      console.warn(`[Ollama] Modelo '${model}' não está disponível, procurando alternativa...`);
      
      const alternativeModel = await findBestAvailableModel([model, ...FALLBACK_MODELS]);
      
      if (!alternativeModel) {
        const availableModels = await listAvailableModels();
        throw new NotFoundError(
          `Modelo '${model}' não encontrado no Ollama. Modelos disponíveis: ${availableModels.join(", ") || "nenhum"}`,
          {
            requestedModel: model,
            availableModels,
            suggestion: availableModels.length > 0
              ? `Use um dos modelos disponíveis: ${availableModels.join(", ")}`
              : `Execute 'ollama pull ${model}' para instalar o modelo, ou 'ollama list' para ver modelos instalados`,
          }
        );
      }
      
      modelToUse = alternativeModel;
      console.log(`[Ollama] Usando modelo alternativo: '${modelToUse}'`);
    }
    
    const requestBody: OllamaChatRequest = {
      model: modelToUse,
      messages,
      stream: false,
      options: {
        temperature: 0.7,
        top_p: 0.9,
        ...options,
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
      const errorData = errorText ? (JSON.parse(errorText).catch(() => ({})) : {});
      
      // Detectar erro de modelo não encontrado
      if (response.status === 404 || errorText.includes("model") && errorText.includes("not found")) {
        // Tentar com modelo de fallback
        if (modelToUse !== model) {
          throw new NotFoundError(
            `Modelo '${model}' não encontrado no Ollama`,
            {
              requestedModel: model,
              triedAlternative: modelToUse,
              error: errorText,
              suggestion: `Execute 'ollama pull ${model}' para instalar o modelo`,
            }
          );
        }
        
        // Tentar encontrar modelo alternativo
        const alternativeModel = await findBestAvailableModel(FALLBACK_MODELS);
        if (alternativeModel && alternativeModel !== modelToUse) {
          console.log(`[Ollama] Tentando com modelo de fallback: '${alternativeModel}'`);
          return callOllamaChat(messages, alternativeModel, options);
        }
        
        const availableModels = await listAvailableModels();
        throw new NotFoundError(
          `Modelo '${model}' não encontrado no Ollama. Modelos disponíveis: ${availableModels.join(", ") || "nenhum"}`,
          {
            requestedModel: model,
            availableModels,
            error: errorText,
            suggestion: availableModels.length > 0
              ? `Use um dos modelos disponíveis: ${availableModels.join(", ")}`
              : `Execute 'ollama pull ${model}' para instalar o modelo`,
          }
        );
      }
      
      // Outros erros de API
      throw new ExecutionError(
        `Erro na API do Ollama: ${response.status} - ${errorText}`,
        {
          status: response.status,
          statusText: response.statusText,
          error: errorText,
          model: modelToUse,
        }
      );
    }

    const data: OllamaChatResponse = await response.json();
    
    if (!data.message || !data.message.content) {
      throw new ExecutionError(
        "Resposta do Ollama não contém conteúdo",
        { response: data, model: modelToUse }
      );
    }
    
    return data.message.content;
  }, { context: "callOllamaChat", model, messagesCount: messages.length });
}

/**
 * Chamar Ollama com streaming
 */
export async function* callOllamaChatStream(
  messages: OllamaChatMessage[],
  model: string = DEFAULT_MODEL,
  options?: OllamaChatRequest["options"]
): AsyncGenerator<string, void, unknown> {
  try {
    const url = `${OLLAMA_BASE_URL}/api/chat`;
    
    const requestBody: OllamaChatRequest = {
      model,
      messages,
      stream: true,
      options: {
        temperature: 0.7,
        top_p: 0.9,
        ...options,
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

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("Response body is not readable");
    }

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.trim()) {
          try {
            const data = JSON.parse(line) as OllamaChatResponse;
            if (data.message?.content) {
              yield data.message.content;
            }
            if (data.done) return;
          } catch (e) {
            // Ignorar linhas inválidas
          }
        }
      }
    }
  } catch (error) {
    console.error("[Ollama] Error streaming from Ollama:", error);
    throw error;
  }
}

/**
 * Verificar se Ollama está disponível
 */
export async function checkOllamaAvailable(): Promise<boolean> {
  try {
    const url = `${OLLAMA_BASE_URL}/api/tags`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 segundos timeout
    
    const response = await fetch(url, {
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.error("[Ollama] Timeout checking Ollama availability");
    } else {
      console.error("[Ollama] Error checking Ollama availability:", error);
    }
    return false;
  }
}

/**
 * Verifica se um modelo específico está disponível no Ollama
 * 
 * @param model - Nome do modelo a verificar
 * @returns True se o modelo está disponível, False caso contrário
 * @throws {NetworkError} Se houver erro de rede
 * 
 * @example
 * ```typescript
 * const available = await checkModelAvailable("deepseek-coder-v2-16b-q4_k_m");
 * // Retorna: true se o modelo estiver disponível
 * ```
 */
export async function checkModelAvailable(model: string = DEFAULT_MODEL): Promise<boolean> {
  return withErrorHandling(async () => {
    validateNonEmptyString(model, "model");
    
    const availableModels = await listAvailableModels();
    
    // Verificar match exato
    if (availableModels.includes(model)) {
      return true;
    }
    
    // Verificar match parcial (ex: "deepseek-coder" matcha "deepseek-coder:1.3b")
    const modelBase = model.split(":")[0];
    return availableModels.some((available) => {
      const availableBase = available.split(":")[0];
      return availableBase === modelBase || available.includes(modelBase);
    });
  }, { context: "checkModelAvailable", model }).catch(() => false);
}

