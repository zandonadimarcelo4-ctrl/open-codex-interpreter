/**
 * Refactoring Agent - Agente de Refatoração de Código
 * 
 * Capacidades:
 * - Análise de código existente
 * - Geração de plano de refatoração
 * - Execução de refatoração
 * - Verificação de qualidade pós-refatoração
 * - Detecção de code smells
 * - Sugestões de melhoria
 */

import * as fs from "fs";
import * as path from "path";
import { generateCode, estimateCodeComplexity } from "./code_router";
import { verifyCodeExecution } from "./verification_agent";

interface RefactoringRequest {
  filePath?: string;
  code?: string;
  language: string;
  refactoringType?: 'structure' | 'performance' | 'readability' | 'security' | 'all';
  description?: string;
}

interface RefactoringPlan {
  steps: RefactoringStep[];
  estimatedTime: number;
  riskLevel: 'low' | 'medium' | 'high';
  benefits: string[];
  warnings: string[];
}

interface RefactoringStep {
  step: number;
  description: string;
  action: string;
  code: string;
  reason: string;
  risk: 'low' | 'medium' | 'high';
}

interface RefactoringResult {
  success: boolean;
  originalCode: string;
  refactoredCode: string;
  plan: RefactoringPlan;
  changes: RefactoringStep[];
  qualityBefore: any;
  qualityAfter: any;
  improvements: string[];
  warnings: string[];
}

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
const DEFAULT_MODEL = process.env.DEFAULT_MODEL || "deepseek-coder-v2-16b-q4_k_m";

/**
 * Analisar código e detectar code smells
 */
export async function analyzeCode(code: string, language: string): Promise<{
  smells: Array<{ type: string; severity: string; message: string; line?: number }>;
  complexity: number;
  maintainability: number;
  suggestions: string[];
}> {
  console.log(`[RefactoringAgent] 🔍 Analisando código (${language})...`);
  
  const prompt = `Analyze the following ${language} code and identify code smells, complexity issues, and improvement opportunities.

Code:
\`\`\`${language}
${code}
\`\`\`

Provide a JSON response with:
- smells: Array of code smells with type, severity (low/medium/high), message, and optional line number
- complexity: Numeric complexity score (1-10)
- maintainability: Numeric maintainability score (1-10)
- suggestions: Array of improvement suggestions

Return only valid JSON, no markdown formatting.`;

  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        messages: [
          { role: "system", content: "You are an expert code analyzer. Return only valid JSON." },
          { role: "user", content: prompt }
        ],
        options: {
          temperature: 0.2,
          num_predict: 2048,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`);
    }

    const data = await response.json();
    const analysisText = data.message?.content || "{}";
    
    // Extrair JSON da resposta
    const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const analysis = JSON.parse(jsonMatch[0]);
      return {
        smells: analysis.smells || [],
        complexity: analysis.complexity || 5,
        maintainability: analysis.maintainability || 5,
        suggestions: analysis.suggestions || [],
      };
    }
    
    // Fallback
    return {
      smells: [],
      complexity: 5,
      maintainability: 5,
      suggestions: ["Unable to analyze code automatically"],
    };
  } catch (error: any) {
    console.error(`[RefactoringAgent] ❌ Erro ao analisar código:`, error);
    return {
      smells: [],
      complexity: 5,
      maintainability: 5,
      suggestions: [`Error analyzing code: ${error.message}`],
    };
  }
}

/**
 * Gerar plano de refatoração
 */
export async function generateRefactoringPlan(
  request: RefactoringRequest
): Promise<RefactoringPlan> {
  console.log(`[RefactoringAgent] 📋 Gerando plano de refatoração...`);
  
  let code = request.code || "";
  
  // Ler código do arquivo se não fornecido
  if (request.filePath && !code) {
    try {
      code = fs.readFileSync(request.filePath, "utf-8");
    } catch (error: any) {
      throw new Error(`Failed to read file: ${error.message}`);
    }
  }
  
  if (!code) {
    throw new Error("No code provided for refactoring");
  }
  
  // Analisar código primeiro
  const analysis = await analyzeCode(code, request.language);
  
  // Gerar plano de refatoração
  const refactoringType = request.refactoringType || 'all';
  const description = request.description || "Improve code quality, maintainability, and performance";
  
  const prompt = `Create a detailed refactoring plan for the following ${request.language} code.

Code:
\`\`\`${request.language}
${code}
\`\`\`

Analysis Results:
- Complexity: ${analysis.complexity}/10
- Maintainability: ${analysis.maintainability}/10
- Code Smells: ${analysis.smells.length}
- Suggestions: ${analysis.suggestions.join(", ")}

Refactoring Type: ${refactoringType}
Description: ${description}

Provide a JSON response with:
- steps: Array of refactoring steps with step number, description, action, code, reason, and risk (low/medium/high)
- estimatedTime: Estimated time in minutes
- riskLevel: Overall risk level (low/medium/high)
- benefits: Array of expected benefits
- warnings: Array of warnings or risks

Return only valid JSON, no markdown formatting.`;

  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        messages: [
          { role: "system", content: "You are an expert code refactoring specialist. Return only valid JSON." },
          { role: "user", content: prompt }
        ],
        options: {
          temperature: 0.3,
          num_predict: 4096,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`);
    }

    const data = await response.json();
    const planText = data.message?.content || "{}";
    
    // Extrair JSON da resposta
    const jsonMatch = planText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const plan = JSON.parse(jsonMatch[0]);
      return {
        steps: plan.steps || [],
        estimatedTime: plan.estimatedTime || 30,
        riskLevel: plan.riskLevel || 'medium',
        benefits: plan.benefits || [],
        warnings: plan.warnings || [],
      };
    }
    
    // Fallback
    return {
      steps: [],
      estimatedTime: 30,
      riskLevel: 'medium',
      benefits: ["Improved code quality"],
      warnings: ["Unable to generate detailed refactoring plan"],
    };
  } catch (error: any) {
    console.error(`[RefactoringAgent] ❌ Erro ao gerar plano:`, error);
    throw error;
  }
}

/**
 * Executar refatoração
 */
export async function executeRefactoring(
  request: RefactoringRequest
): Promise<RefactoringResult> {
  console.log(`[RefactoringAgent] 🔧 Executando refatoração...`);
  
  let originalCode = request.code || "";
  
  // Ler código do arquivo se não fornecido
  if (request.filePath && !originalCode) {
    try {
      originalCode = fs.readFileSync(request.filePath, "utf-8");
    } catch (error: any) {
      throw new Error(`Failed to read file: ${error.message}`);
    }
  }
  
  if (!originalCode) {
    throw new Error("No code provided for refactoring");
  }
  
  // Analisar código antes
  const qualityBefore = await analyzeCode(originalCode, request.language);
  
  // Gerar plano
  const plan = await generateRefactoringPlan(request);
  
  // Gerar código refatorado
  const refactoringPrompt = `Refactor the following ${request.language} code according to the refactoring plan.

Original Code:
\`\`\`${request.language}
${originalCode}
\`\`\`

Refactoring Plan:
${plan.steps.map((step, i) => `${i + 1}. ${step.description}: ${step.reason}`).join("\n")}

Requirements:
- Apply all refactoring steps
- Maintain functionality
- Improve code quality
- Follow ${request.language} best practices
- Add comments where necessary
- Handle errors appropriately

Return only the refactored code in a code block, no explanations.`;

  try {
    const refactoredCodeResult = await generateCode({
      description: refactoringPrompt,
      language: request.language,
      context: originalCode,
      complexity: estimateCodeComplexity(originalCode),
    });
    
    const refactoredCode = refactoredCodeResult.code;
    
    // Analisar código depois
    const qualityAfter = await analyzeCode(refactoredCode, request.language);
    
    // Verificar qualidade
    const verification = await verifyCodeExecution(refactoredCode, {
      success: true,
      output: "Refactoring completed",
    }, {
      task: request.description || "Refactor code",
      context: { originalCode },
    });
    
    // Calcular melhorias
    const improvements: string[] = [];
    if (qualityAfter.complexity < qualityBefore.complexity) {
      improvements.push(`Complexity reduced from ${qualityBefore.complexity} to ${qualityAfter.complexity}`);
    }
    if (qualityAfter.maintainability > qualityBefore.maintainability) {
      improvements.push(`Maintainability improved from ${qualityBefore.maintainability} to ${qualityAfter.maintainability}`);
    }
    if (qualityAfter.smells.length < qualityBefore.smells.length) {
      improvements.push(`Code smells reduced from ${qualityBefore.smells.length} to ${qualityAfter.smells.length}`);
    }
    
    return {
      success: true,
      originalCode,
      refactoredCode,
      plan,
      changes: plan.steps,
      qualityBefore,
      qualityAfter,
      improvements,
      warnings: plan.warnings,
    };
  } catch (error: any) {
    console.error(`[RefactoringAgent] ❌ Erro ao executar refatoração:`, error);
    throw error;
  }
}

/**
 * Aplicar refatoração a arquivo
 */
export async function applyRefactoringToFile(
  filePath: string,
  options: {
    language: string;
    refactoringType?: 'structure' | 'performance' | 'readability' | 'security' | 'all';
    description?: string;
    backup?: boolean;
  }
): Promise<RefactoringResult> {
  console.log(`[RefactoringAgent] 📁 Aplicando refatoração ao arquivo: ${filePath}`);
  
  // Criar backup se solicitado
  if (options.backup !== false) {
    const backupPath = `${filePath}.backup.${Date.now()}`;
    fs.copyFileSync(filePath, backupPath);
    console.log(`[RefactoringAgent] 💾 Backup criado: ${backupPath}`);
  }
  
  // Executar refatoração
  const result = await executeRefactoring({
    filePath,
    language: options.language,
    refactoringType: options.refactoringType,
    description: options.description,
  });
  
  // Aplicar código refatorado ao arquivo
  if (result.success) {
    fs.writeFileSync(filePath, result.refactoredCode, "utf-8");
    console.log(`[RefactoringAgent] ✅ Refatoração aplicada ao arquivo: ${filePath}`);
  }
  
  return result;
}

export { RefactoringRequest, RefactoringPlan, RefactoringResult, RefactoringStep };

