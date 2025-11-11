/**
 * Code Router - Roteamento Inteligente de Modelos para Geração de Código
 * 
 * Seleciona o melhor modelo (Ollama local vs GPT-5 Codex) baseado em:
 * - Complexidade da tarefa
 * - Tipo de código (simples, médio, complexo)
 * - Disponibilidade de modelos
 * - Custo e performance
 */

import { callOllamaChat } from "../ollama";

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434";

// Modelos disponíveis
const DEFAULT_CODING_MODEL = process.env.DEFAULT_MODEL || "deepseek-coder-v2-16b-q4_k_m";
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
 * Estimar complexidade da tarefa de código
 */
export function estimateCodeComplexity(description: string): 'simple' | 'medium' | 'complex' {
  const descLower = description.toLowerCase();
  
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
}

/**
 * Selecionar modelo apropriado para geração de código
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
 * Gerar código usando o modelo selecionado
 */
export async function generateCode(
  request: CodeGenerationRequest
): Promise<CodeGenerationResult> {
  const startTime = Date.now();
  
  // Estimar complexidade se não fornecida
  const complexity = request.complexity || estimateCodeComplexity(request.description);
  
  // Selecionar modelo
  const model = selectCodeModel(complexity, request.useGPT5Codex);
  
  console.log(`[CodeRouter] Gerando código: complexidade=${complexity}, modelo=${model}, linguagem=${request.language}`);
  
  // Gerar código usando Ollama (GPT-5 Codex será adicionado depois)
  const code = await generateCodeWithOllama(request, model);
  
  const executionTime = Date.now() - startTime;
  
  return {
    code,
    model,
    language: request.language,
    complexity,
    executionTime
  };
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
    const response = await callOllamaChat(
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
        temperature: 0.3, // Baixa temperatura para código mais determinístico
        top_p: 0.9,
        top_k: 40,
        num_predict: 4096, // Permite código longo
      }
    );
    
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
 * Criar prompt para geração de código
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
 * Extrair código da resposta do modelo
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

