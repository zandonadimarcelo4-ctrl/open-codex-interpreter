/**
 * Validators - Validação de Inputs
 * Fornece validadores reutilizáveis para tipos de dados comuns
 */

import { ValidationError } from "./error_handler";

/**
 * Valida se uma string não está vazia
 */
export function validateNonEmptyString(
  value: unknown,
  fieldName: string
): string {
  if (typeof value !== "string") {
    throw new ValidationError(
      `${fieldName} deve ser uma string`,
      { field: fieldName, value, type: typeof value }
    );
  }

  if (value.trim().length === 0) {
    throw new ValidationError(
      `${fieldName} não pode estar vazio`,
      { field: fieldName, value }
    );
  }

  return value;
}

/**
 * Valida se um número está em um range
 */
export function validateNumberRange(
  value: unknown,
  fieldName: string,
  min?: number,
  max?: number
): number {
  if (typeof value !== "number" || isNaN(value)) {
    throw new ValidationError(
      `${fieldName} deve ser um número`,
      { field: fieldName, value, type: typeof value }
    );
  }

  if (min !== undefined && value < min) {
    throw new ValidationError(
      `${fieldName} deve ser maior ou igual a ${min}`,
      { field: fieldName, value, min }
    );
  }

  if (max !== undefined && value > max) {
    throw new ValidationError(
      `${fieldName} deve ser menor ou igual a ${max}`,
      { field: fieldName, value, max }
    );
  }

  return value;
}

/**
 * Valida se um valor está em uma lista de valores permitidos
 */
export function validateEnum<T>(
  value: unknown,
  fieldName: string,
  allowedValues: readonly T[]
): T {
  if (!allowedValues.includes(value as T)) {
    throw new ValidationError(
      `${fieldName} deve ser um dos valores: ${allowedValues.join(", ")}`,
      { field: fieldName, value, allowedValues }
    );
  }

  return value as T;
}

/**
 * Valida se uma URL é válida
 */
export function validateURL(value: unknown, fieldName: string): string {
  const str = validateNonEmptyString(value, fieldName);

  try {
    new URL(str);
    return str;
  } catch (error) {
    throw new ValidationError(
      `${fieldName} deve ser uma URL válida`,
      { field: fieldName, value: str, error: String(error) }
    );
  }
}

/**
 * Valida se um caminho de arquivo é válido
 */
export function validateFilePath(value: unknown, fieldName: string): string {
  const str = validateNonEmptyString(value, fieldName);

  // Validar caracteres perigosos
  if (str.includes("..") || str.includes("\0")) {
    throw new ValidationError(
      `${fieldName} contém caracteres perigosos`,
      { field: fieldName, value: str }
    );
  }

  return str;
}

/**
 * Valida se um objeto tem propriedades obrigatórias
 */
export function validateRequiredFields<T extends Record<string, any>>(
  obj: unknown,
  fieldName: string,
  requiredFields: (keyof T)[]
): T {
  if (typeof obj !== "object" || obj === null || Array.isArray(obj)) {
    throw new ValidationError(
      `${fieldName} deve ser um objeto`,
      { field: fieldName, value: obj, type: typeof obj }
    );
  }

  const missingFields = requiredFields.filter(
    (field) => !(field in obj) || obj[field] === undefined || obj[field] === null
  );

  if (missingFields.length > 0) {
    throw new ValidationError(
      `${fieldName} deve ter os seguintes campos: ${missingFields.join(", ")}`,
      { field: fieldName, missingFields, obj }
    );
  }

  return obj as T;
}

/**
 * Valida se uma linguagem de programação é válida
 */
export function validateProgrammingLanguage(
  value: unknown,
  fieldName: string = "language"
): string {
  const validLanguages = [
    "python",
    "javascript",
    "typescript",
    "java",
    "cpp",
    "c",
    "csharp",
    "go",
    "rust",
    "php",
    "ruby",
    "swift",
    "kotlin",
    "sql",
    "html",
    "css",
    "shell",
    "bash",
    "powershell",
  ];

  const str = validateNonEmptyString(value, fieldName).toLowerCase();
  return validateEnum(str, fieldName, validLanguages);
}

/**
 * Valida se um array não está vazio
 */
export function validateNonEmptyArray<T>(
  value: unknown,
  fieldName: string
): T[] {
  if (!Array.isArray(value)) {
    throw new ValidationError(
      `${fieldName} deve ser um array`,
      { field: fieldName, value, type: typeof value }
    );
  }

  if (value.length === 0) {
    throw new ValidationError(
      `${fieldName} não pode estar vazio`,
      { field: fieldName, value }
    );
  }

  return value as T[];
}

/**
 * Valida se um valor é um boolean
 */
export function validateBoolean(
  value: unknown,
  fieldName: string
): boolean {
  if (typeof value !== "boolean") {
    throw new ValidationError(
      `${fieldName} deve ser um boolean`,
      { field: fieldName, value, type: typeof value }
    );
  }

  return value;
}

/**
 * Valida se um objeto é um objeto válido (não array, não null)
 */
export function validateObject<T extends Record<string, any>>(
  value: unknown,
  fieldName: string
): T {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new ValidationError(
      `${fieldName} deve ser um objeto`,
      { field: fieldName, value, type: typeof value }
    );
  }

  return value as T;
}

/**
 * Valida se uma string tem um comprimento mínimo/máximo
 */
export function validateStringLength(
  value: unknown,
  fieldName: string,
  minLength?: number,
  maxLength?: number
): string {
  const str = validateNonEmptyString(value, fieldName);

  if (minLength !== undefined && str.length < minLength) {
    throw new ValidationError(
      `${fieldName} deve ter pelo menos ${minLength} caracteres`,
      { field: fieldName, value: str, minLength, actualLength: str.length }
    );
  }

  if (maxLength !== undefined && str.length > maxLength) {
    throw new ValidationError(
      `${fieldName} deve ter no máximo ${maxLength} caracteres`,
      { field: fieldName, value: str, maxLength, actualLength: str.length }
    );
  }

  return str;
}

/**
 * Valida se um email é válido (validação básica)
 */
export function validateEmail(value: unknown, fieldName: string): string {
  const str = validateNonEmptyString(value, fieldName);
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(str)) {
    throw new ValidationError(
      `${fieldName} deve ser um email válido`,
      { field: fieldName, value: str }
    );
  }

  return str;
}

