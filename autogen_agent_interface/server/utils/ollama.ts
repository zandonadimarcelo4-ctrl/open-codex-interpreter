/**
 * Utilitários para integração com Ollama
 */

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
const DEFAULT_MODEL = process.env.DEFAULT_MODEL || "okamototk/deepseek-r1:8b";

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
 * Chamar Ollama para gerar resposta de chat
 */
export async function callOllamaChat(
  messages: OllamaChatMessage[],
  model: string = DEFAULT_MODEL,
  options?: OllamaChatRequest["options"]
): Promise<string> {
  try {
    const url = `${OLLAMA_BASE_URL}/api/chat`;
    
    const requestBody: OllamaChatRequest = {
      model,
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
      throw new Error(`Ollama API error: ${response.status} - ${errorText}`);
    }

    const data: OllamaChatResponse = await response.json();
    return data.message.content;
  } catch (error) {
    console.error("[Ollama] Error calling Ollama:", error);
    throw error;
  }
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
 * Verificar se o modelo está disponível
 */
export async function checkModelAvailable(model: string = DEFAULT_MODEL): Promise<boolean> {
  try {
    const url = `${OLLAMA_BASE_URL}/api/tags`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 segundos timeout
    
    const response = await fetch(url, {
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) return false;
    
    const data = await response.json();
    const models = data.models || [];
    return models.some((m: { name: string }) => m.name === model || m.name.startsWith(`${model}:`));
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.error("[Ollama] Timeout checking model availability");
    } else {
      console.error("[Ollama] Error checking model:", error);
    }
    return false;
  }
}

