/**
 * Verification Agent
 * Inspirado no Manus AI - Verifica qualidade e correção de resultados
 * 
 * Este módulo implementa:
 * - Verificação de qualidade de resultados
 * - Validação de correção
 * - Sugestões de melhorias
 * - Verificação de segurança
 * - Validação de consistência
 */

import { callOllamaChat } from "./ollama";

export interface VerificationResult {
  isValid: boolean;
  quality: "excellent" | "good" | "fair" | "poor";
  issues: VerificationIssue[];
  suggestions: string[];
  confidence: number;
  verifiedAt: Date;
}

export interface VerificationIssue {
  type: "error" | "warning" | "info";
  severity: "critical" | "high" | "medium" | "low";
  message: string;
  suggestion?: string;
  location?: string;
}

export interface VerificationOptions {
  task?: string;
  expectedOutput?: string;
  context?: Record<string, any>;
  strictMode?: boolean;
}

// Modelo quantizado otimizado para RTX NVIDIA (Q4_K_M)
const DEFAULT_MODEL = process.env.DEFAULT_MODEL || "deepseek-coder-v2-16b-q4_k_m-rtx";

/**
 * Verificar resultado de execução de código
 */
export async function verifyCodeExecution(
  code: string,
  result: {
    success: boolean;
    output?: string;
    error?: string;
    exitCode?: number;
  },
  options: VerificationOptions = {}
): Promise<VerificationResult> {
  const { task, expectedOutput, context, strictMode = false } = options;

  console.log(`[Verification] Verificando execução de código...`);
  console.log(`[Verification] Task: ${task || "N/A"}`);
  console.log(`[Verification] Success: ${result.success}`);
  console.log(`[Verification] Exit Code: ${result.exitCode || 0}`);

  const issues: VerificationIssue[] = [];
  const suggestions: string[] = [];

  // Verificação básica de segurança
  const securityIssues = verifySecurity(code);
  issues.push(...securityIssues);

  // Verificação de erros de execução
  if (!result.success) {
    issues.push({
      type: "error",
      severity: "critical",
      message: `Código falhou na execução: ${result.error || "Erro desconhecido"}`,
      suggestion: "Revisar código e corrigir erros antes de continuar",
    });
  }

  // Verificação de saída esperada
  if (expectedOutput && result.output) {
    const outputMatch = verifyOutputMatch(result.output, expectedOutput);
    if (!outputMatch.isMatch) {
      issues.push({
        type: "warning",
        severity: "high",
        message: `Saída não corresponde ao esperado: ${outputMatch.reason}`,
        suggestion: outputMatch.suggestion,
      });
    }
  }

  // Verificação de qualidade usando LLM
  const qualityVerification = await verifyQualityWithLLM(code, result, task, context);
  issues.push(...qualityVerification.issues);
  suggestions.push(...qualityVerification.suggestions);

  // Calcular qualidade geral
  const quality = calculateQuality(issues, result.success);
  const confidence = calculateConfidence(issues, qualityVerification.confidence);

  return {
    isValid: issues.filter(i => i.severity === "critical" || (strictMode && i.severity === "high")).length === 0,
    quality,
    issues,
    suggestions,
    confidence,
    verifiedAt: new Date(),
  };
}

/**
 * Verificar resultado de tarefa genérica
 */
export async function verifyTaskResult(
  task: string,
  result: string,
  options: VerificationOptions = {}
): Promise<VerificationResult> {
  const { expectedOutput, context, strictMode = false } = options;

  console.log(`[Verification] Verificando resultado de tarefa...`);
  console.log(`[Verification] Task: ${task}`);
  console.log(`[Verification] Result length: ${result.length} chars`);

  const issues: VerificationIssue[] = [];
  const suggestions: string[] = [];

  // Verificação de completude
  if (!result || result.trim().length === 0) {
    issues.push({
      type: "error",
      severity: "critical",
      message: "Resultado vazio ou incompleto",
      suggestion: "Verificar se a tarefa foi executada corretamente",
    });
  }

  // Verificação de qualidade usando LLM
  const qualityVerification = await verifyTaskQualityWithLLM(task, result, expectedOutput, context);
  issues.push(...qualityVerification.issues);
  suggestions.push(...qualityVerification.suggestions);

  // Calcular qualidade geral
  const quality = calculateQuality(issues, true);
  const confidence = calculateConfidence(issues, qualityVerification.confidence);

  return {
    isValid: issues.filter(i => i.severity === "critical" || (strictMode && i.severity === "high")).length === 0,
    quality,
    issues,
    suggestions,
    confidence,
    verifiedAt: new Date(),
  };
}

/**
 * Verificar segurança do código
 */
function verifySecurity(code: string): VerificationIssue[] {
  const issues: VerificationIssue[] = [];
  const dangerousPatterns = [
    { pattern: /eval\(/gi, message: "Uso de eval() pode ser perigoso", severity: "high" as const },
    { pattern: /exec\(/gi, message: "Uso de exec() pode ser perigoso", severity: "high" as const },
    { pattern: /__import__\(/gi, message: "Uso de __import__() pode ser perigoso", severity: "high" as const },
    { pattern: /subprocess\.call\(/gi, message: "Uso de subprocess.call() pode ser perigoso", severity: "medium" as const },
    { pattern: /os\.system\(/gi, message: "Uso de os.system() pode ser perigoso", severity: "high" as const },
    { pattern: /shell=True/gi, message: "Uso de shell=True pode ser perigoso", severity: "high" as const },
    { pattern: /rm\s+-rf/gi, message: "Comando rm -rf pode ser perigoso", severity: "critical" as const },
    { pattern: /format\(/gi, message: "Uso de format() com strings não confiáveis pode ser perigoso", severity: "medium" as const },
  ];

  for (const { pattern, message, severity } of dangerousPatterns) {
    if (pattern.test(code)) {
      issues.push({
        type: "warning",
        severity,
        message,
        suggestion: "Revisar código e considerar alternativas mais seguras",
        location: "code",
      });
    }
  }

  return issues;
}

/**
 * Verificar correspondência de saída
 */
function verifyOutputMatch(output: string, expectedOutput: string): {
  isMatch: boolean;
  reason?: string;
  suggestion?: string;
} {
  // Verificação simples de correspondência
  if (output.trim() === expectedOutput.trim()) {
    return { isMatch: true };
  }

  // Verificação de correspondência parcial
  if (output.includes(expectedOutput) || expectedOutput.includes(output)) {
    return {
      isMatch: false,
      reason: "Saída parcialmente corresponde ao esperado",
      suggestion: "Verificar se a saída está completa e correta",
    };
  }

  return {
    isMatch: false,
    reason: "Saída não corresponde ao esperado",
    suggestion: "Revisar lógica do código e verificar se está produzindo o resultado correto",
  };
}

/**
 * Verificar qualidade usando LLM
 */
async function verifyQualityWithLLM(
  code: string,
  result: { success: boolean; output?: string; error?: string },
  task?: string,
  context?: Record<string, any>
): Promise<{ issues: VerificationIssue[]; suggestions: string[]; confidence: number }> {
  const issues: VerificationIssue[] = [];
  const suggestions: string[] = [];

  try {
    const messages = [
      {
        role: "system" as const,
        content: `Você é um Verification Agent especializado em verificar qualidade e correção de código.

Sua tarefa é:
1. Verificar se o código está correto e completo
2. Verificar se a saída/resultado está correto
3. Identificar possíveis problemas ou melhorias
4. Sugerir correções ou melhorias

Forneça uma análise detalhada em formato JSON:
{
  "isValid": boolean,
  "quality": "excellent" | "good" | "fair" | "poor",
  "issues": [
    {
      "type": "error" | "warning" | "info",
      "severity": "critical" | "high" | "medium" | "low",
      "message": "descrição do problema",
      "suggestion": "sugestão de correção"
    }
  ],
  "suggestions": ["sugestão 1", "sugestão 2"],
  "confidence": 0.0-1.0
}

Seja objetivo e preciso. Foque em problemas reais e sugestões úteis.`,
      },
      {
        role: "user" as const,
        content: `Tarefa: ${task || "Execução de código"}

Código:
\`\`\`python
${code}
\`\`\`

Resultado da execução:
- Sucesso: ${result.success}
- Saída: ${result.output || "N/A"}
- Erro: ${result.error || "N/A"}

Contexto: ${JSON.stringify(context || {}, null, 2)}

Analise o código e o resultado da execução. Forneça uma análise detalhada em formato JSON.`,
      },
    ];

    const response = await callOllamaChat(
      messages,
      DEFAULT_MODEL,
      {
        temperature: 0.3, // Mais conservador para verificação
        num_predict: 1024,
      }
    );

    // Tentar extrair JSON da resposta
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const analysis = JSON.parse(jsonMatch[0]);
        if (analysis.issues) {
          issues.push(...analysis.issues);
        }
        if (analysis.suggestions) {
          suggestions.push(...analysis.suggestions);
        }
        return {
          issues,
          suggestions,
          confidence: analysis.confidence || 0.5,
        };
      } catch (e) {
        console.error(`[Verification] Erro ao analisar resposta LLM: ${e}`);
      }
    }

    // Fallback: análise básica baseada em palavras-chave
    if (response.toLowerCase().includes("error") || response.toLowerCase().includes("problema")) {
      issues.push({
        type: "warning",
        severity: "medium",
        message: "LLM identificou possíveis problemas no código",
        suggestion: "Revisar código e considerar as sugestões do LLM",
      });
    }

    return {
      issues,
      suggestions,
      confidence: 0.5,
    };
  } catch (error) {
    console.error(`[Verification] Erro ao verificar qualidade com LLM: ${error}`);
    return {
      issues: [],
      suggestions: [],
      confidence: 0.3,
    };
  }
}

/**
 * Verificar qualidade de tarefa usando LLM
 */
async function verifyTaskQualityWithLLM(
  task: string,
  result: string,
  expectedOutput?: string,
  context?: Record<string, any>
): Promise<{ issues: VerificationIssue[]; suggestions: string[]; confidence: number }> {
  const issues: VerificationIssue[] = [];
  const suggestions: string[] = [];

  try {
    const messages = [
      {
        role: "system" as const,
        content: `Você é um Verification Agent especializado em verificar qualidade e correção de resultados de tarefas.

Sua tarefa é:
1. Verificar se o resultado está completo e correto
2. Verificar se o resultado corresponde à tarefa solicitada
3. Identificar possíveis problemas ou melhorias
4. Sugerir correções ou melhorias

Forneça uma análise detalhada em formato JSON:
{
  "isValid": boolean,
  "quality": "excellent" | "good" | "fair" | "poor",
  "issues": [
    {
      "type": "error" | "warning" | "info",
      "severity": "critical" | "high" | "medium" | "low",
      "message": "descrição do problema",
      "suggestion": "sugestão de correção"
    }
  ],
  "suggestions": ["sugestão 1", "sugestão 2"],
  "confidence": 0.0-1.0
}

Seja objetivo e preciso. Foque em problemas reais e sugestões úteis.`,
      },
      {
        role: "user" as const,
        content: `Tarefa: ${task}

Resultado:
${result}

${expectedOutput ? `Saída Esperada: ${expectedOutput}` : ""}

Contexto: ${JSON.stringify(context || {}, null, 2)}

Analise o resultado da tarefa. Forneça uma análise detalhada em formato JSON.`,
      },
    ];

    const response = await callOllamaChat(
      messages,
      DEFAULT_MODEL,
      {
        temperature: 0.3, // Mais conservador para verificação
        num_predict: 1024,
      }
    );

    // Tentar extrair JSON da resposta
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const analysis = JSON.parse(jsonMatch[0]);
        if (analysis.issues) {
          issues.push(...analysis.issues);
        }
        if (analysis.suggestions) {
          suggestions.push(...analysis.suggestions);
        }
        return {
          issues,
          suggestions,
          confidence: analysis.confidence || 0.5,
        };
      } catch (e) {
        console.error(`[Verification] Erro ao analisar resposta LLM: ${e}`);
      }
    }

    return {
      issues,
      suggestions,
      confidence: 0.5,
    };
  } catch (error) {
    console.error(`[Verification] Erro ao verificar qualidade com LLM: ${error}`);
    return {
      issues: [],
      suggestions: [],
      confidence: 0.3,
    };
  }
}

/**
 * Calcular qualidade geral
 */
function calculateQuality(issues: VerificationIssue[], success: boolean): "excellent" | "good" | "fair" | "poor" {
  if (!success) {
    return "poor";
  }

  const criticalIssues = issues.filter(i => i.severity === "critical").length;
  const highIssues = issues.filter(i => i.severity === "high").length;
  const mediumIssues = issues.filter(i => i.severity === "medium").length;

  if (criticalIssues > 0) {
    return "poor";
  }
  if (highIssues > 0) {
    return "fair";
  }
  if (mediumIssues > 2) {
    return "fair";
  }
  if (mediumIssues > 0 || issues.length > 0) {
    return "good";
  }
  return "excellent";
}

/**
 * Calcular confiança
 */
function calculateConfidence(issues: VerificationIssue[], llmConfidence: number): number {
  const criticalIssues = issues.filter(i => i.severity === "critical").length;
  const highIssues = issues.filter(i => i.severity === "high").length;

  let confidence = llmConfidence;

  // Reduzir confiança baseado em problemas críticos
  if (criticalIssues > 0) {
    confidence *= 0.5;
  }
  if (highIssues > 0) {
    confidence *= 0.7;
  }

  // Aumentar confiança se não houver problemas
  if (issues.length === 0) {
    confidence = Math.max(confidence, 0.9);
  }

  return Math.max(0, Math.min(1, confidence));
}

/**
 * Verificar consistência entre múltiplos resultados
 */
export async function verifyConsistency(
  results: Array<{ task: string; result: string }>
): Promise<VerificationResult> {
  const issues: VerificationIssue[] = [];
  const suggestions: string[] = [];

  // Verificar se todos os resultados estão completos
  for (const { task, result } of results) {
    if (!result || result.trim().length === 0) {
      issues.push({
        type: "error",
        severity: "high",
        message: `Resultado vazio para tarefa: ${task}`,
        suggestion: "Verificar se a tarefa foi executada corretamente",
      });
    }
  }

  // Verificar consistência entre resultados
  if (results.length > 1) {
    const firstResult = results[0].result;
    const allMatch = results.every(r => r.result === firstResult);

    if (!allMatch) {
      issues.push({
        type: "warning",
        severity: "medium",
        message: "Resultados inconsistentes entre tarefas",
        suggestion: "Verificar se as tarefas foram executadas corretamente e se os resultados são consistentes",
      });
    }
  }

  const quality = calculateQuality(issues, true);
  const confidence = calculateConfidence(issues, 0.7);

  return {
    isValid: issues.filter(i => i.severity === "critical" || i.severity === "high").length === 0,
    quality,
    issues,
    suggestions,
    confidence,
    verifiedAt: new Date(),
  };
}

