/**
 * Testes Unitários para Error Handler
 * 
 * @module error_handler.test
 */

import { describe, it, expect } from "vitest";
import {
  CustomError,
  ValidationError,
  ExecutionError,
  NetworkError,
  TimeoutError,
  PermissionError,
  NotFoundError,
  ConfigurationError,
  normalizeError,
  getUserFriendlyMessage,
  withErrorHandling,
  withErrorHandlingSync,
} from "../../server/utils/error_handler";
import { ErrorType } from "../../server/utils/error_handler";

describe("Error Handler", () => {
  describe("CustomError", () => {
    it("deve criar erro customizado", () => {
      const error = new CustomError("Test error", ErrorType.UNKNOWN_ERROR);
      expect(error.message).toBe("Test error");
      expect(error.type).toBe(ErrorType.UNKNOWN_ERROR);
      expect(error.statusCode).toBe(500);
    });

    it("deve converter para JSON", () => {
      const error = new CustomError("Test error", ErrorType.UNKNOWN_ERROR);
      const json = error.toJSON();
      expect(json.message).toBe("Test error");
      expect(json.type).toBe(ErrorType.UNKNOWN_ERROR);
      expect(json.timestamp).toBeDefined();
    });
  });

  describe("ValidationError", () => {
    it("deve criar erro de validação", () => {
      const error = new ValidationError("Invalid input");
      expect(error.type).toBe(ErrorType.VALIDATION_ERROR);
      expect(error.statusCode).toBe(400);
    });
  });

  describe("ExecutionError", () => {
    it("deve criar erro de execução", () => {
      const error = new ExecutionError("Execution failed");
      expect(error.type).toBe(ErrorType.EXECUTION_ERROR);
      expect(error.statusCode).toBe(500);
    });
  });

  describe("NetworkError", () => {
    it("deve criar erro de rede", () => {
      const error = new NetworkError("Network error");
      expect(error.type).toBe(ErrorType.NETWORK_ERROR);
      expect(error.statusCode).toBe(503);
    });
  });

  describe("TimeoutError", () => {
    it("deve criar erro de timeout", () => {
      const error = new TimeoutError("Timeout");
      expect(error.type).toBe(ErrorType.TIMEOUT_ERROR);
      expect(error.statusCode).toBe(504);
    });
  });

  describe("normalizeError", () => {
    it("deve normalizar CustomError", () => {
      const error = new ValidationError("Test");
      const normalized = normalizeError(error);
      expect(normalized).toBeInstanceOf(ValidationError);
    });

    it("deve normalizar Error genérico", () => {
      const error = new Error("Test error");
      const normalized = normalizeError(error);
      expect(normalized).toBeInstanceOf(CustomError);
    });

    it("deve normalizar erro desconhecido", () => {
      const error = "String error";
      const normalized = normalizeError(error);
      expect(normalized).toBeInstanceOf(CustomError);
    });
  });

  describe("getUserFriendlyMessage", () => {
    it("deve retornar mensagem user-friendly para ValidationError", () => {
      const error = new ValidationError("Invalid input");
      const message = getUserFriendlyMessage(error);
      expect(message).toContain("validação");
    });

    it("deve retornar mensagem user-friendly para ExecutionError", () => {
      const error = new ExecutionError("Execution failed");
      const message = getUserFriendlyMessage(error);
      expect(message).toContain("executar");
    });
  });

  describe("withErrorHandling", () => {
    it("deve executar função com sucesso", async () => {
      const result = await withErrorHandling(async () => "success");
      expect(result).toBe("success");
    });

    it("deve capturar e normalizar erro", async () => {
      await expect(
        withErrorHandling(async () => {
          throw new Error("Test error");
        })
      ).rejects.toThrow();
    });
  });

  describe("withErrorHandlingSync", () => {
    it("deve executar função com sucesso", () => {
      const result = withErrorHandlingSync(() => "success");
      expect(result).toBe("success");
    });

    it("deve capturar e normalizar erro", () => {
      expect(() =>
        withErrorHandlingSync(() => {
          throw new Error("Test error");
        })
      ).toThrow();
    });
  });
});

