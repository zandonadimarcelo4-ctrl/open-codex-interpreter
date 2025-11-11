/**
 * Code Router - Roteamento Inteligente de Modelos para Geração de Código
 * 
 * Seleciona o melhor modelo (Ollama local vs GPT-5 Codex) baseado em:
 * - Complexidade da tarefa
 * - Tipo de código (simples, médio, complexo)
 * - Disponibilidade de modelos
 * - Custo e performance
 * 
 * @module code_router
 * @author ANIMA Project
 * @since 1.0.0
 */

import { callOllamaChat } from "../ollama";
import { ValidationError, ExecutionError, withErrorHandling } from "./error_handler";
import {
  validateNonEmptyString,
  validateProgrammingLanguage,
  validateRequiredFields,
} from "./validators";

/**
 * Fallback para chamar Ollama diretamente se callOllamaChat não estiver disponível
 * 
 * @param messages - Array de mensagens para enviar ao modelo
 * @param options - Opções de configuração do modelo
 * @returns Resposta do modelo como string
 * @throws {ExecutionError} Se houver erro ao chamar a API do Ollama
 * @internal
 */
async function callOllamaChatFallback(messages: any[], options: any): Promise<string> {
  return withErrorHandling(async () => {
    const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
    
    const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: options.model || DEFAULT_CODING_MODEL,
        messages,
        options: {
          temperature: options.temperature || 0.3,
          top_p: options.top_p || 0.9,
          top_k: options.top_k || 40,
          num_predict: options.num_predict || 4096,
        },
      }),
    });

    if (!response.ok) {
      throw new ExecutionError(
        `Ollama API error: ${response.statusText}`,
        { status: response.status, statusText: response.statusText }
      );
    }

    const data = await response.json();
    return data.message?.content || "";
  }, { context: "callOllamaChatFallback" });
}

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434";

// Modelos disponíveis
// Modelo quantizado otimizado para RTX NVIDIA (Q4_K_M)
const DEFAULT_CODING_MODEL = process.env.DEFAULT_MODEL || "deepseek-coder-v2-16b-q4_k_m-rtx";
const FALLBACK_MODEL = "deepseek-coder"; // Fallback se modelo principal não disponível

interface CodeGenerationRequest {
  description: string;
  language: string;
  context?: string;
  complexity?: 'simple' | 'medium' | 'complex';
  useGPT5Codex?: boolean; // Para futura integração com GPT-5 Codex
}

interface CodeGenerationResult {
  code: string;
  model: string;
  language: string;
  complexity: 'simple' | 'medium' | 'complex';
  executionTime?: number;
}

/**
 * Estima a complexidade de uma tarefa de código baseado em palavras-chave
 * 
 * @param description - Descrição da tarefa de código
 * @returns Nível de complexidade: 'simple', 'medium' ou 'complex'
 * @throws {ValidationError} Se a descrição estiver vazia
 * 
 * @example
 * ```typescript
 * const complexity = estimateCodeComplexity("Criar função para calcular média");
 * // Retorna: 'simple'
 * 
 * const complexity2 = estimateCodeComplexity("Refatorar toda a arquitetura do projeto");
 * // Retorna: 'complex'
 * ```
 */
export function estimateCodeComplexity(description: string): 'simple' | 'medium' | 'complex' {
  return withErrorHandlingSync(() => {
    // Validar input
    const desc = validateNonEmptyString(description, "description");
    const descLower = desc.toLowerCase();
    
    // Keywords para tarefas complexas
    const complexKeywords = [
      'refactor', 'migrate', 'restructure', 'optimize',
      'entire project', 'multiple files', 'large codebase',
      'architecture', 'design pattern', 'framework',
      'whole application', 'complete system', 'full stack',
      'database migration', 'api redesign', 'system overhaul'
    ];
    
    // Keywords para tarefas médias
    const mediumKeywords = [
      'function', 'class', 'module', 'component',
      'API', 'endpoint', 'service', 'database',
      'script', 'program', 'application', 'tool',
      'library', 'package', 'plugin', 'extension'
    ];
    
    // Verificar complexidade
    if (complexKeywords.some(keyword => descLower.includes(keyword))) {
      return 'complex';
    }
    
    if (mediumKeywords.some(keyword => descLower.includes(keyword))) {
      return 'medium';
    }
    
    return 'simple';
  }, { context: "estimateCodeComplexity" });
}

/**
 * Seleciona o modelo apropriado para geração de código baseado na complexidade
 * 
 * @param complexity - Nível de complexidade da tarefa ('simple', 'medium', 'complex')
 * @param useGPT5Codex - Se deve tentar usar GPT-5 Codex para tarefas complexas (opcional)
 * @returns Nome do modelo a ser usado
 * 
 * @example
 * ```typescript
 * const model = selectCodeModel('complex', true);
 * // Retorna: 'gpt-5-codex' se disponível, senão 'deepseek-coder-v2-16b-q4_k_m'
 * ```
 */
export function selectCodeModel(
  complexity: 'simple' | 'medium' | 'complex',
  useGPT5Codex?: boolean
): string {
  // Se GPT-5 Codex está disponível e solicitado, usar para tarefas complexas
  if (useGPT5Codex && complexity === 'complex' && process.env.GPT5_CODEX_API_KEY) {
    return 'gpt-5-codex';
  }
  
  // Usar DeepSeek-Coder-V2-16B-Q4_K_M como padrão (melhor para código)
  return DEFAULT_CODING_MODEL;
}

/**
 * Gera código usando o modelo apropriado baseado na complexidade da tarefa
 * 
 * @param request - Requisição de geração de código contendo descrição, linguagem, contexto, etc.
 * @returns Resultado da geração de código com código gerado, modelo usado, linguagem, complexidade e tempo de execução
 * @throws {ValidationError} Se a requisição estiver inválida
 * @throws {ExecutionError} Se houver erro ao gerar código
 * 
 * @example
 * ```typescript
 * const result = await generateCode({
 *   description: "Criar função para calcular média de números",
 *   language: "python",
 *   context: "Usar numpy se necessário",
 *   complexity: "simple"
 * });
 * // Retorna: { code: "...", model: "deepseek-coder-v2-16b-q4_k_m", ... }
 * ```
 */
export async function generateCode(
  request: CodeGenerationRequest
): Promise<CodeGenerationResult> {
  return withErrorHandling(async () => {
    // Validar requisição
    validateRequiredFields(request, "request", ["description", "language"]);
    const description = validateNonEmptyString(request.description, "description");
    const language = validateProgrammingLanguage(request.language, "language");
    
    const startTime = Date.now();
    
    // Estimar complexidade se não fornecida
    const complexity = request.complexity || estimateCodeComplexity(description);
    
    // Selecionar modelo
    const model = selectCodeModel(complexity, request.useGPT5Codex);
    
    console.log(`[CodeRouter] Gerando código: complexidade=${complexity}, modelo=${model}, linguagem=${language}`);
    
    // Gerar código usando Ollama (GPT-5 Codex será adicionado depois)
    const code = await generateCodeWithOllama({ ...request, description, language }, model);
    
    const executionTime = Date.now() - startTime;
    
    return {
      code,
      model,
      language,
      complexity,
      executionTime
    };
  }, { context: "generateCode", request });
}

/**
 * Gerar código usando Ollama
 */
async function generateCodeWithOllama(
  request: CodeGenerationRequest,
  model: string
): Promise<string> {
  const prompt = createCodeGenerationPrompt(request);
  
  try {
    let response: string;
    
    // Tentar usar callOllamaChat se disponível
    try {
      response = await callOllamaChat(
        [
          {
            role: 'system',
            content: `You are an expert ${request.language} programmer. Generate clean, well-documented, and efficient code.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        model, // Modelo como segundo parâmetro
        {
          temperature: 0.3, // Baixa temperatura para código mais determinístico
          top_p: 0.9,
          top_k: 40,
          num_predict: 4096, // Permite código longo
        }
      );
    } catch (error: any) {
      // Fallback para chamada direta
      console.log(`[CodeRouter] Usando fallback para chamada Ollama`);
      response = await callOllamaChatFallback(
        [
          {
            role: 'system',
            content: `You are an expert ${request.language} programmer. Generate clean, well-documented, and efficient code.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        {
          model,
          temperature: 0.3,
          top_p: 0.9,
          top_k: 40,
          num_predict: 4096,
        }
      );
    }
    
    // Extrair código da resposta
    return extractCode(response, request.language);
  } catch (error: any) {
    console.error(`[CodeRouter] Erro ao gerar código com ${model}:`, error);
    
    // Tentar com modelo de fallback
    if (model !== FALLBACK_MODEL) {
      console.log(`[CodeRouter] Tentando com modelo de fallback: ${FALLBACK_MODEL}`);
      return generateCodeWithOllama(request, FALLBACK_MODEL);
    }
    
    throw error;
  }
}

/**
 * Cria prompt otimizado para geração de código (função interna)
 * 
 * @param request - Requisição de geração de código
 * @returns Prompt formatado para o modelo
 * @internal
 */
function createCodeGenerationPrompt(request: CodeGenerationRequest): string {
  let prompt = `Generate ${request.language} code for the following task:\n\n`;
  prompt += `Task: ${request.description}\n\n`;
  
  if (request.context) {
    prompt += `Context:\n${request.context}\n\n`;
  }
  
  prompt += `Requirements:\n`;
  prompt += `- Write clean, well-formatted code\n`;
  prompt += `- Add comments where necessary\n`;
  prompt += `- Follow ${request.language} best practices\n`;
  prompt += `- Handle errors appropriately\n`;
  prompt += `- Make the code production-ready\n`;
  
  if (request.complexity === 'complex') {
    prompt += `- This is a complex task - break it down into logical components\n`;
    prompt += `- Use proper architecture and design patterns\n`;
    prompt += `- Ensure scalability and maintainability\n`;
  }
  
  prompt += `\nReturn only the code in a code block (no explanations before or after):`;
  
  return prompt;
}

/**
 * Extrai código da resposta do modelo, removendo markdown e texto explicativo (função interna)
 * 
 * @param response - Resposta completa do modelo
 * @param language - Linguagem de programação esperada
 * @returns Código extraído como string
 * @internal
 */
function extractCode(response: string, language: string): string {
  // Procurar por blocos de código
  const codeBlockRegex = new RegExp(`\`\`\`${language}\\n([\\s\\S]*?)\`\`\``, 'i');
  const match = response.match(codeBlockRegex);
  
  if (match && match[1]) {
    return match[1].trim();
  }
  
  // Tentar blocos de código genéricos
  const genericCodeBlockRegex = /```(?:[a-z]+)?\n?([\s\S]*?)```/;
  const genericMatch = response.match(genericCodeBlockRegex);
  
  if (genericMatch && genericMatch[1]) {
    return genericMatch[1].trim();
  }
  
  // Se não encontrou blocos de código, procurar por código direto
  // Remover markdown e explicações
  const lines = response.split('\n');
  const codeLines: string[] = [];
  let inCodeBlock = false;
  
  for (const line of lines) {
    if (line.trim().startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    
    if (inCodeBlock || (!line.trim().startsWith('#') && !line.trim().startsWith('//') && line.trim().length > 0)) {
      codeLines.push(line);
    }
  }
  
  const code = codeLines.join('\n').trim();
  
  // Se ainda não encontrou código, retornar resposta completa
  if (code.length > 50) {
    return code;
  }
  
  return response.trim();
}

/**
 * Verificar se modelo está disponível
 */
export async function checkModelAvailability(model: string): Promise<boolean> {
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`);
    if (!response.ok) {
      return false;
    }
    
    const data = await response.json();
    const models = data.models || [];
    
    // Verificar se modelo está na lista (pode ser com ou sem tag)
    return models.some((m: any) => 
      m.name === model || 
      m.name.startsWith(model + ':') ||
      m.name === model.replace(/-/g, '_')
    );
  } catch (error) {
    console.error(`[CodeRouter] Erro ao verificar disponibilidade do modelo ${model}:`, error);
    return false;
  }
}

/**
 * Obter melhor modelo disponível para código
 */
/**
 * Obtém o melhor modelo de código disponível no Ollama
 * Tenta usar o modelo padrão, se não disponível, tenta fallback
 * 
 * @returns Nome do melhor modelo disponível
 * @throws {ExecutionError} Se nenhum modelo estiver disponível
 * 
 * @example
 * ```typescript
 * const model = await getBestAvailableCodeModel();
 * // Retorna: "deepseek-coder-v2-16b-q4_k_m" ou modelo de fallback
 * ```
 */
export async function getBestAvailableCodeModel(): Promise<string> {
  // Verificar modelos em ordem de preferência
  const preferredModels = [
    DEFAULT_CODING_MODEL,
    'deepseek-coder',
    'deepseek-coder:1.3b',
    'codellama',
    'qwen2.5-coder:32b'
  ];
  
  for (const model of preferredModels) {
    if (await checkModelAvailability(model)) {
      console.log(`[CodeRouter] Modelo disponível: ${model}`);
      return model;
    }
  }
  
  // Se nenhum modelo específico de código estiver disponível, usar modelo padrão
  console.warn(`[CodeRouter] Nenhum modelo de código específico disponível, usando modelo padrão`);
  return DEFAULT_CODING_MODEL;
}

export { CodeGenerationRequest, CodeGenerationResult };

