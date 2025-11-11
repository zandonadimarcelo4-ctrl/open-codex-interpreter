/**
 * Bug Detection Agent - Agente de Detecção de Bugs
 * 
 * Capacidades:
 * - Análise estática de código
 * - Detecção de bugs críticos
 * - Análise de padrões de erro
 * - Sugestões de correção
 * - Classificação por severidade
 */

import * as fs from "fs";
import * as path from "path";

interface BugDetectionRequest {
  filePath?: string;
  code?: string;
  language: string;
  severityFilter?: 'low' | 'medium' | 'high' | 'critical' | 'all';
}

interface Bug {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  line?: number;
  column?: number;
  code: string;
  suggestion: string;
  category: 'syntax' | 'logic' | 'performance' | 'security' | 'style' | 'other';
}

interface BugDetectionResult {
  bugs: Bug[];
  summary: {
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  recommendations: string[];
  codeQuality: {
    score: number;
    issues: string[];
  };
}

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
// Modelo quantizado otimizado para RTX NVIDIA (Q4_K_M)
const DEFAULT_MODEL = process.env.DEFAULT_MODEL || "deepseek-coder-v2-16b-q4_k_m-rtx";

/**
 * Detectar bugs no código
 */
export async function detectBugs(request: BugDetectionRequest): Promise<BugDetectionResult> {
  console.log(`[BugDetectionAgent] 🐛 Detectando bugs no código (${request.language})...`);
  
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
    throw new Error("No code provided for bug detection");
  }
  
  const prompt = `Analyze the following ${request.language} code and detect all bugs, errors, and potential issues.

Code:
\`\`\`${request.language}
${code}
\`\`\`

Provide a JSON response with:
- bugs: Array of bugs with id, type, severity (low/medium/high/critical), message, line (optional), column (optional), code snippet, suggestion, and category (syntax/logic/performance/security/style/other)
- summary: Object with total, critical, high, medium, and low counts
- recommendations: Array of general recommendations
- codeQuality: Object with score (0-100) and issues array

Focus on:
- Syntax errors
- Logic errors
- Performance issues
- Security vulnerabilities
- Code style issues
- Potential runtime errors
- Edge cases
- Null pointer exceptions
- Memory leaks
- Race conditions

Return only valid JSON, no markdown formatting.`;

  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        messages: [
          { role: "system", content: "You are an expert bug detection specialist. Return only valid JSON." },
          { role: "user", content: prompt }
        ],
        options: {
          temperature: 0.2,
          num_predict: 4096,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`);
    }

    const data = await response.json();
    const detectionText = data.message?.content || "{}";
    
    // Extrair JSON da resposta
    const jsonMatch = detectionText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const detection = JSON.parse(jsonMatch[0]);
      
      // Filtrar por severidade se solicitado
      let bugs = detection.bugs || [];
      if (request.severityFilter && request.severityFilter !== 'all') {
        bugs = bugs.filter((bug: Bug) => bug.severity === request.severityFilter);
      }
      
      // Gerar IDs únicos se não existirem
      bugs = bugs.map((bug: Bug, index: number) => ({
        ...bug,
        id: bug.id || `bug-${index + 1}`,
      }));
      
      return {
        bugs,
        summary: detection.summary || {
          total: bugs.length,
          critical: bugs.filter((b: Bug) => b.severity === 'critical').length,
          high: bugs.filter((b: Bug) => b.severity === 'high').length,
          medium: bugs.filter((b: Bug) => b.severity === 'medium').length,
          low: bugs.filter((b: Bug) => b.severity === 'low').length,
        },
        recommendations: detection.recommendations || [],
        codeQuality: detection.codeQuality || {
          score: 50,
          issues: ["Unable to analyze code quality"],
        },
      };
    }
    
    // Fallback
    return {
      bugs: [],
      summary: {
        total: 0,
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
      },
      recommendations: ["Unable to detect bugs automatically"],
      codeQuality: {
        score: 50,
        issues: ["Unable to analyze code quality"],
      },
    };
  } catch (error: any) {
    console.error(`[BugDetectionAgent] ❌ Erro ao detectar bugs:`, error);
    return {
      bugs: [],
      summary: {
        total: 0,
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
      },
      recommendations: [`Error detecting bugs: ${error.message}`],
      codeQuality: {
        score: 50,
        issues: [`Error: ${error.message}`],
      },
    };
  }
}

/**
 * Detectar bugs em múltiplos arquivos
 */
export async function detectBugsInFiles(
  filePaths: string[],
  language: string,
  severityFilter?: 'low' | 'medium' | 'high' | 'critical' | 'all'
): Promise<Map<string, BugDetectionResult>> {
  console.log(`[BugDetectionAgent] 📁 Detectando bugs em ${filePaths.length} arquivos...`);
  
  const results = new Map<string, BugDetectionResult>();
  
  for (const filePath of filePaths) {
    try {
      const result = await detectBugs({
        filePath,
        language,
        severityFilter,
      });
      results.set(filePath, result);
    } catch (error: any) {
      console.error(`[BugDetectionAgent] ❌ Erro ao analisar ${filePath}:`, error);
      results.set(filePath, {
        bugs: [],
        summary: {
          total: 0,
          critical: 0,
          high: 0,
          medium: 0,
          low: 0,
        },
        recommendations: [`Error: ${error.message}`],
        codeQuality: {
          score: 0,
          issues: [`Error: ${error.message}`],
        },
      });
    }
  }
  
  return results;
}

/**
 * Gerar relatório de bugs
 */
export function generateBugReport(result: BugDetectionResult, language: string = 'unknown'): string {
  let report = `# 🐛 Bug Detection Report\n\n`;
  
  report += `## Summary\n\n`;
  report += `- **Total Bugs**: ${result.summary.total}\n`;
  report += `- **Critical**: ${result.summary.critical}\n`;
  report += `- **High**: ${result.summary.high}\n`;
  report += `- **Medium**: ${result.summary.medium}\n`;
  report += `- **Low**: ${result.summary.low}\n`;
  report += `- **Code Quality Score**: ${result.codeQuality.score}/100\n\n`;
  
  if (result.bugs.length > 0) {
    report += `## Bugs\n\n`;
    
    // Agrupar por severidade
    const bySeverity = {
      critical: result.bugs.filter(b => b.severity === 'critical'),
      high: result.bugs.filter(b => b.severity === 'high'),
      medium: result.bugs.filter(b => b.severity === 'medium'),
      low: result.bugs.filter(b => b.severity === 'low'),
    };
    
    for (const [severity, bugs] of Object.entries(bySeverity)) {
      if (bugs.length > 0) {
        report += `### ${severity.toUpperCase()} (${bugs.length})\n\n`;
        for (const bug of bugs) {
          report += `#### ${bug.id}: ${bug.type}\n\n`;
          report += `- **Severity**: ${bug.severity}\n`;
          report += `- **Category**: ${bug.category}\n`;
          if (bug.line) {
            report += `- **Line**: ${bug.line}\n`;
          }
          report += `- **Message**: ${bug.message}\n`;
          report += `- **Code**: \`\`\`\n${bug.code}\n\`\`\`\n`;
          report += `- **Suggestion**: ${bug.suggestion}\n\n`;
        }
      }
    }
  }
  
  if (result.recommendations.length > 0) {
    report += `## Recommendations\n\n`;
    for (const recommendation of result.recommendations) {
      report += `- ${recommendation}\n`;
    }
    report += `\n`;
  }
  
  if (result.codeQuality.issues.length > 0) {
    report += `## Code Quality Issues\n\n`;
    for (const issue of result.codeQuality.issues) {
      report += `- ${issue}\n`;
    }
    report += `\n`;
  }
  
  return report;
}

export { BugDetectionRequest, Bug, BugDetectionResult };

