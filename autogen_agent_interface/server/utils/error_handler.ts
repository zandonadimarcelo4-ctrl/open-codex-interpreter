/**
 * Error Handler - Gerenciador de Erros Centralizado
 * Fornece tipos de erro customizados, mensagens claras e tratamento estruturado
 */

/**
 * Tipos de erro customizados
 */
export enum ErrorType {
  VALIDATION_ERROR = "VALIDATION_ERROR",
  EXECUTION_ERROR = "EXECUTION_ERROR",
  NETWORK_ERROR = "NETWORK_ERROR",
  TIMEOUT_ERROR = "TIMEOUT_ERROR",
  PERMISSION_ERROR = "PERMISSION_ERROR",
  NOT_FOUND_ERROR = "NOT_FOUND_ERROR",
  CONFIGURATION_ERROR = "CONFIGURATION_ERROR",
  UNKNOWN_ERROR = "UNKNOWN_ERROR",
}

/**
 * Classe base para erros customizados
 */
export class CustomError extends Error {
  public readonly type: ErrorType;
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: Record<string, any>;
  public readonly timestamp: Date;

  constructor(
    message: string,
    type: ErrorType = ErrorType.UNKNOWN_ERROR,
    code: string = "UNKNOWN",
    statusCode: number = 500,
    details?: Record<string, any>
  ) {
    super(message);
    this.name = this.constructor.name;
    this.type = type;
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.timestamp = new Date();

    // Mantém stack trace correto
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Converte erro para formato JSON
   */
  toJSON(): Record<string, any> {
    return {
      name: this.name,
      message: this.message,
      type: this.type,
      code: this.code,
      statusCode: this.statusCode,
      details: this.details,
      timestamp: this.timestamp.toISOString(),
      stack: this.stack,
    };
  }
}

/**
 * Erro de validação
 */
export class ValidationError extends CustomError {
  constructor(message: string, details?: Record<string, any>) {
    super(
      message,
      ErrorType.VALIDATION_ERROR,
      "VALIDATION_ERROR",
      400,
      details
    );
  }
}

/**
 * Erro de execução
 */
export class ExecutionError extends CustomError {
  constructor(message: string, details?: Record<string, any>) {
    super(
      message,
      ErrorType.EXECUTION_ERROR,
      "EXECUTION_ERROR",
      500,
      details
    );
  }
}

/**
 * Erro de rede
 */
export class NetworkError extends CustomError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, ErrorType.NETWORK_ERROR, "NETWORK_ERROR", 503, details);
  }
}

/**
 * Erro de timeout
 */
export class TimeoutError extends CustomError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, ErrorType.TIMEOUT_ERROR, "TIMEOUT_ERROR", 504, details);
  }
}

/**
 * Erro de permissão
 */
export class PermissionError extends CustomError {
  constructor(message: string, details?: Record<string, any>) {
    super(
      message,
      ErrorType.PERMISSION_ERROR,
      "PERMISSION_ERROR",
      403,
      details
    );
  }
}

/**
 * Erro de não encontrado
 */
export class NotFoundError extends CustomError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, ErrorType.NOT_FOUND_ERROR, "NOT_FOUND_ERROR", 404, details);
  }
}

/**
 * Erro de configuração
 */
export class ConfigurationError extends CustomError {
  constructor(message: string, details?: Record<string, any>) {
    super(
      message,
      ErrorType.CONFIGURATION_ERROR,
      "CONFIGURATION_ERROR",
      500,
      details
    );
  }
}

/**
 * Converte erro genérico para CustomError
 */
export function normalizeError(error: unknown): CustomError {
  if (error instanceof CustomError) {
    return error;
  }

  if (error instanceof Error) {
    // Tentar identificar tipo de erro pela mensagem
    const message = error.message.toLowerCase();

    if (message.includes("timeout") || message.includes("timed out")) {
      return new TimeoutError(error.message, { originalError: error.message });
    }

    if (message.includes("network") || message.includes("fetch")) {
      return new NetworkError(error.message, { originalError: error.message });
    }

    if (message.includes("permission") || message.includes("denied")) {
      return new PermissionError(error.message, {
        originalError: error.message,
      });
    }

    if (message.includes("not found") || message.includes("404")) {
      return new NotFoundError(error.message, { originalError: error.message });
    }

    if (message.includes("validation") || message.includes("invalid")) {
      return new ValidationError(error.message, {
        originalError: error.message,
      });
    }

    // Erro genérico
    return new ExecutionError(error.message, {
      originalError: error.message,
      stack: error.stack,
    });
  }

  // Erro desconhecido
  return new CustomError(
    String(error),
    ErrorType.UNKNOWN_ERROR,
    "UNKNOWN_ERROR",
    500,
    { originalError: error }
  );
}

/**
 * Loga erro de forma estruturada
 */
export function logError(error: CustomError, context?: Record<string, any>): void {
  const logData = {
    error: error.toJSON(),
    context: context || {},
    timestamp: new Date().toISOString(),
  };

  // Log baseado no tipo de erro
  if (error.statusCode >= 500) {
    console.error("[ERROR]", JSON.stringify(logData, null, 2));
  } else if (error.statusCode >= 400) {
    console.warn("[WARN]", JSON.stringify(logData, null, 2));
  } else {
    console.info("[INFO]", JSON.stringify(logData, null, 2));
  }
}

/**
 * Cria mensagem de erro user-friendly
 */
export function getUserFriendlyMessage(error: CustomError): string {
  switch (error.type) {
    case ErrorType.VALIDATION_ERROR:
      return `Erro de validação: ${error.message}`;
    case ErrorType.EXECUTION_ERROR:
      return `Erro ao executar: ${error.message}`;
    case ErrorType.NETWORK_ERROR:
      return `Erro de rede: ${error.message}`;
    case ErrorType.TIMEOUT_ERROR:
      return `Timeout: ${error.message}`;
    case ErrorType.PERMISSION_ERROR:
      return `Erro de permissão: ${error.message}`;
    case ErrorType.NOT_FOUND_ERROR:
      return `Não encontrado: ${error.message}`;
    case ErrorType.CONFIGURATION_ERROR:
      return `Erro de configuração: ${error.message}`;
    default:
      return `Erro: ${error.message}`;
  }
}

/**
 * Wrapper para funções async que captura e normaliza erros
 */
export async function withErrorHandling<T>(
  fn: () => Promise<T>,
  context?: Record<string, any>
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    const normalizedError = normalizeError(error);
    logError(normalizedError, context);
    throw normalizedError;
  }
}

/**
 * Wrapper para funções sync que captura e normaliza erros
 */
export function withErrorHandlingSync<T>(
  fn: () => T,
  context?: Record<string, any>
): T {
  try {
    return fn();
  } catch (error) {
    const normalizedError = normalizeError(error);
    logError(normalizedError, context);
    throw normalizedError;
  }
}

