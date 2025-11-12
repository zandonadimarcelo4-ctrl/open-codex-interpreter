/**
 * Hook para Execução de Código (Open Interpreter)
 * Executa código em várias linguagens de forma segura
 */
import { useState, useCallback } from 'react';

export interface CodeExecutionResult {
  success: boolean;
  output?: string;
  error?: string;
  exitCode?: number;
  executionTime?: number;
}

export interface UseCodeExecutionOptions {
  enabled?: boolean;
  onExecutionComplete?: (result: CodeExecutionResult) => void;
  language?: string;
  timeout?: number;
}

export function useCodeExecution(options: UseCodeExecutionOptions = {}) {
  const {
    enabled = true,
    onExecutionComplete,
    language = 'python',
    timeout = 30000, // 30 segundos
  } = options;

  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Executar código
   */
  const executeCode = useCallback(async (
    code: string,
    codeLanguage?: string
  ): Promise<CodeExecutionResult> => {
    if (!enabled) {
      throw new Error('Execução de código não está habilitada');
    }

    setIsExecuting(true);
    setError(null);

    const startTime = Date.now();
    const lang = codeLanguage || language;

    try {
      // Enviar código para o backend Python via API REST
      // IMPORTANTE: Backend Python agora processa tudo via /api/chat
      const PYTHON_BACKEND_URL = import.meta.env.VITE_PYTHON_BACKEND_URL || 'http://localhost:8000';
      const response = await fetch(`${PYTHON_BACKEND_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `Executa código ${lang}: ${code}`,
          context: {
            language: lang,
            timeout: timeout,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Erro ao executar código: ${response.statusText}`);
      }

      const result: CodeExecutionResult = await response.json();
      const executionTime = Date.now() - startTime;
      
      const finalResult = {
        ...result,
        executionTime,
      };

      onExecutionComplete?.(finalResult);
      setIsExecuting(false);

      return finalResult;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao executar código';
      setError(errorMessage);
      setIsExecuting(false);
      
      const errorResult: CodeExecutionResult = {
        success: false,
        error: errorMessage,
        executionTime: Date.now() - startTime,
      };

      onExecutionComplete?.(errorResult);
      throw err;
    }
  }, [enabled, language, timeout, onExecutionComplete]);

  /**
   * Executar código Python
   */
  const executePython = useCallback(async (code: string) => {
    return executeCode(code, 'python');
  }, [executeCode]);

  /**
   * Executar código JavaScript
   */
  const executeJavaScript = useCallback(async (code: string) => {
    return executeCode(code, 'javascript');
  }, [executeCode]);

  /**
   * Executar código Shell/Bash
   */
  const executeShell = useCallback(async (code: string) => {
    return executeCode(code, 'shell');
  }, [executeCode]);

  return {
    executeCode,
    executePython,
    executeJavaScript,
    executeShell,
    isExecuting,
    error,
  };
}

