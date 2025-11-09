/**
 * Code Executor - Execução de Código Segura
 * Similar ao Open Interpreter, mas integrado com AutoGen
 */
import { spawn, exec } from "child_process";
import { promisify } from "util";
import * as fs from "fs";
import * as path from "path";
import { nanoid } from "nanoid";

const execAsync = promisify(exec);

export interface CodeExecutionResult {
  success: boolean;
  output?: string;
  error?: string;
  exitCode?: number;
  executionTime?: number;
  language?: string;
}

export interface CodeExecutionOptions {
  language?: string;
  timeout?: number;
  workspace?: string;
  autoApprove?: boolean;
}

const DEFAULT_TIMEOUT = 30000; // 30 segundos
const DEFAULT_WORKSPACE = path.join(process.cwd(), "workspace");

/**
 * Executar código Python
 */
async function executePython(
  code: string,
  options: CodeExecutionOptions = {}
): Promise<CodeExecutionResult> {
  const { timeout = DEFAULT_TIMEOUT, workspace = DEFAULT_WORKSPACE } = options;
  const startTime = Date.now();

  try {
    // Garantir que o workspace existe
    if (!fs.existsSync(workspace)) {
      fs.mkdirSync(workspace, { recursive: true });
    }

    // Criar arquivo temporário
    const fileId = nanoid();
    const filePath = path.join(workspace, `${fileId}.py`);

    // Escrever código no arquivo
    fs.writeFileSync(filePath, code, "utf-8");

    // Executar código Python
    const { stdout, stderr } = await execAsync(`python "${filePath}"`, {
      cwd: workspace,
      timeout,
      maxBuffer: 10 * 1024 * 1024, // 10MB
    });

    // Limpar arquivo temporário
    try {
      fs.unlinkSync(filePath);
    } catch (e) {
      // Ignorar erro de limpeza
    }

    const executionTime = Date.now() - startTime;

    if (stderr && stderr.trim()) {
      return {
        success: false,
        output: stdout,
        error: stderr,
        exitCode: 1,
        executionTime,
        language: "python",
      };
    }

    return {
      success: true,
      output: stdout || "Código executado com sucesso (sem saída)",
      executionTime,
      language: "python",
    };
  } catch (error: any) {
    const executionTime = Date.now() - startTime;
    const errorMessage = error.message || String(error);
    const errorOutput = error.stdout || "";
    const errorStderr = error.stderr || "";

    return {
      success: false,
      output: errorOutput,
      error: errorStderr || errorMessage,
      exitCode: error.code || 1,
      executionTime,
      language: "python",
    };
  }
}

/**
 * Executar código JavaScript/Node.js
 */
async function executeJavaScript(
  code: string,
  options: CodeExecutionOptions = {}
): Promise<CodeExecutionResult> {
  const { timeout = DEFAULT_TIMEOUT, workspace = DEFAULT_WORKSPACE } = options;
  const startTime = Date.now();

  try {
    // Garantir que o workspace existe
    if (!fs.existsSync(workspace)) {
      fs.mkdirSync(workspace, { recursive: true });
    }

    // Criar arquivo temporário
    const fileId = nanoid();
    const filePath = path.join(workspace, `${fileId}.js`);

    // Escrever código no arquivo
    fs.writeFileSync(filePath, code, "utf-8");

    // Executar código JavaScript
    const { stdout, stderr } = await execAsync(`node "${filePath}"`, {
      cwd: workspace,
      timeout,
      maxBuffer: 10 * 1024 * 1024, // 10MB
    });

    // Limpar arquivo temporário
    try {
      fs.unlinkSync(filePath);
    } catch (e) {
      // Ignorar erro de limpeza
    }

    const executionTime = Date.now() - startTime;

    if (stderr && stderr.trim()) {
      return {
        success: false,
        output: stdout,
        error: stderr,
        exitCode: 1,
        executionTime,
        language: "javascript",
      };
    }

    return {
      success: true,
      output: stdout || "Código executado com sucesso (sem saída)",
      executionTime,
      language: "javascript",
    };
  } catch (error: any) {
    const executionTime = Date.now() - startTime;
    const errorMessage = error.message || String(error);
    const errorOutput = error.stdout || "";
    const errorStderr = error.stderr || "";

    return {
      success: false,
      output: errorOutput,
      error: errorStderr || errorMessage,
      exitCode: error.code || 1,
      executionTime,
      language: "javascript",
    };
  }
}

/**
 * Executar código Shell/Bash
 */
async function executeShell(
  code: string,
  options: CodeExecutionOptions = {}
): Promise<CodeExecutionResult> {
  const { timeout = DEFAULT_TIMEOUT, workspace = DEFAULT_WORKSPACE } = options;
  const startTime = Date.now();

  try {
    // Garantir que o workspace existe
    if (!fs.existsSync(workspace)) {
      fs.mkdirSync(workspace, { recursive: true });
    }

    // Executar comando shell diretamente
    const { stdout, stderr } = await execAsync(code, {
      cwd: workspace,
      timeout,
      maxBuffer: 10 * 1024 * 1024, // 10MB
      shell: process.platform === "win32" ? "cmd.exe" : "/bin/bash",
    });

    const executionTime = Date.now() - startTime;

    if (stderr && stderr.trim()) {
      return {
        success: false,
        output: stdout,
        error: stderr,
        exitCode: 1,
        executionTime,
        language: "shell",
      };
    }

    return {
      success: true,
      output: stdout || "Comando executado com sucesso (sem saída)",
      executionTime,
      language: "shell",
    };
  } catch (error: any) {
    const executionTime = Date.now() - startTime;
    const errorMessage = error.message || String(error);
    const errorOutput = error.stdout || "";
    const errorStderr = error.stderr || "";

    return {
      success: false,
      output: errorOutput,
      error: errorStderr || errorMessage,
      exitCode: error.code || 1,
      executionTime,
      language: "shell",
    };
  }
}

/**
 * Detectar linguagem do código
 */
function detectLanguage(code: string): string {
  // Detectar Python
  if (
    code.includes("import ") ||
    code.includes("def ") ||
    code.includes("print(") ||
    code.includes("if __name__")
  ) {
    return "python";
  }

  // Detectar JavaScript
  if (
    code.includes("const ") ||
    code.includes("let ") ||
    code.includes("function ") ||
    code.includes("require(") ||
    code.includes("console.log")
  ) {
    return "javascript";
  }

  // Detectar Shell
  if (
    code.includes("#!/bin/bash") ||
    code.includes("#!/bin/sh") ||
    code.includes("ls ") ||
    code.includes("cd ") ||
    code.includes("mkdir ") ||
    code.includes("echo ")
  ) {
    return "shell";
  }

  // Padrão: Python
  return "python";
}

/**
 * Extrair blocos de código de uma mensagem
 */
export function extractCodeBlocks(text: string): Array<{ language: string; code: string }> {
  const codeBlocks: Array<{ language: string; code: string }> = [];

  // Padrão para blocos de código markdown: ```language\ncode\n```
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
  let match;

  while ((match = codeBlockRegex.exec(text)) !== null) {
    const language = match[1] || detectLanguage(match[2]);
    const code = match[2].trim();
    codeBlocks.push({ language, code });
  }

  // Se não encontrou blocos de código, tentar detectar código inline
  if (codeBlocks.length === 0) {
    const lines = text.split("\n");
    const codeLines: string[] = [];
    let inCodeBlock = false;

    for (const line of lines) {
      // Detectar início de bloco de código
      if (line.trim().startsWith("```") || line.trim().startsWith("`")) {
        inCodeBlock = !inCodeBlock;
        continue;
      }

      if (inCodeBlock || line.trim().match(/^(import|def|class|const|let|function|if|for|while|print|console)/)) {
        codeLines.push(line);
      }
    }

    if (codeLines.length > 0) {
      const code = codeLines.join("\n");
      const language = detectLanguage(code);
      codeBlocks.push({ language, code });
    }
  }

  return codeBlocks;
}

/**
 * Executar código
 */
export async function executeCode(
  code: string,
  language?: string,
  options: CodeExecutionOptions = {}
): Promise<CodeExecutionResult> {
  const detectedLanguage = language || detectLanguage(code);

  switch (detectedLanguage.toLowerCase()) {
    case "python":
    case "py":
      return executePython(code, options);

    case "javascript":
    case "js":
    case "node":
    case "nodejs":
      return executeJavaScript(code, options);

    case "shell":
    case "bash":
    case "sh":
    case "cmd":
      return executeShell(code, options);

    default:
      // Tentar Python como padrão
      return executePython(code, options);
  }
}

/**
 * Executar múltiplos blocos de código
 */
export async function executeCodeBlocks(
  codeBlocks: Array<{ language: string; code: string }>,
  options: CodeExecutionOptions = {}
): Promise<CodeExecutionResult[]> {
  const results: CodeExecutionResult[] = [];

  for (const block of codeBlocks) {
    const result = await executeCode(block.code, block.language, options);
    results.push(result);
  }

  return results;
}

