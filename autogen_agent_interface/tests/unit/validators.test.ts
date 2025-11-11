/**
 * Testes Unitários para Validators
 * 
 * @module validators.test
 */

import { describe, it, expect } from "vitest";
import {
  validateNonEmptyString,
  validateNumberRange,
  validateEnum,
  validateURL,
  validateFilePath,
  validateRequiredFields,
  validateProgrammingLanguage,
  validateNonEmptyArray,
  validateBoolean,
  validateObject,
  validateStringLength,
  validateEmail,
} from "../../server/utils/validators";
import { ValidationError } from "../../server/utils/error_handler";

describe("Validators", () => {
  describe("validateNonEmptyString", () => {
    it("deve retornar string válida", () => {
      const result = validateNonEmptyString("test", "field");
      expect(result).toBe("test");
    });

    it("deve lançar ValidationError para string vazia", () => {
      expect(() => validateNonEmptyString("", "field")).toThrow(ValidationError);
    });

    it("deve lançar ValidationError para string apenas com espaços", () => {
      expect(() => validateNonEmptyString("   ", "field")).toThrow(ValidationError);
    });

    it("deve lançar ValidationError para não-string", () => {
      expect(() => validateNonEmptyString(123 as any, "field")).toThrow(ValidationError);
    });
  });

  describe("validateNumberRange", () => {
    it("deve retornar número válido", () => {
      const result = validateNumberRange(5, "field", 0, 10);
      expect(result).toBe(5);
    });

    it("deve lançar ValidationError para número menor que mínimo", () => {
      expect(() => validateNumberRange(5, "field", 10, 20)).toThrow(ValidationError);
    });

    it("deve lançar ValidationError para número maior que máximo", () => {
      expect(() => validateNumberRange(25, "field", 10, 20)).toThrow(ValidationError);
    });

    it("deve lançar ValidationError para não-número", () => {
      expect(() => validateNumberRange("123" as any, "field")).toThrow(ValidationError);
    });
  });

  describe("validateEnum", () => {
    it("deve retornar valor válido", () => {
      const result = validateEnum("value1", "field", ["value1", "value2", "value3"]);
      expect(result).toBe("value1");
    });

    it("deve lançar ValidationError para valor inválido", () => {
      expect(() => validateEnum("invalid", "field", ["value1", "value2"])).toThrow(ValidationError);
    });
  });

  describe("validateURL", () => {
    it("deve retornar URL válida", () => {
      const result = validateURL("https://example.com", "field");
      expect(result).toBe("https://example.com");
    });

    it("deve lançar ValidationError para URL inválida", () => {
      expect(() => validateURL("not-a-url", "field")).toThrow(ValidationError);
    });
  });

  describe("validateFilePath", () => {
    it("deve retornar caminho válido", () => {
      const result = validateFilePath("/path/to/file", "field");
      expect(result).toBe("/path/to/file");
    });

    it("deve lançar ValidationError para caminho com ..", () => {
      expect(() => validateFilePath("../file", "field")).toThrow(ValidationError);
    });

    it("deve lançar ValidationError para caminho com null byte", () => {
      expect(() => validateFilePath("file\0", "field")).toThrow(ValidationError);
    });
  });

  describe("validateRequiredFields", () => {
    it("deve retornar objeto válido", () => {
      const result = validateRequiredFields(
        { field1: "value1", field2: "value2" },
        "obj",
        ["field1", "field2"]
      );
      expect(result).toEqual({ field1: "value1", field2: "value2" });
    });

    it("deve lançar ValidationError para campo faltando", () => {
      expect(() =>
        validateRequiredFields({ field1: "value1" }, "obj", ["field1", "field2"])
      ).toThrow(ValidationError);
    });
  });

  describe("validateProgrammingLanguage", () => {
    it("deve retornar linguagem válida", () => {
      const result = validateProgrammingLanguage("python", "field");
      expect(result).toBe("python");
    });

    it("deve retornar linguagem em lowercase", () => {
      const result = validateProgrammingLanguage("PYTHON", "field");
      expect(result).toBe("python");
    });

    it("deve lançar ValidationError para linguagem inválida", () => {
      expect(() => validateProgrammingLanguage("invalid-language", "field")).toThrow(ValidationError);
    });
  });

  describe("validateNonEmptyArray", () => {
    it("deve retornar array válido", () => {
      const result = validateNonEmptyArray([1, 2, 3], "field");
      expect(result).toEqual([1, 2, 3]);
    });

    it("deve lançar ValidationError para array vazio", () => {
      expect(() => validateNonEmptyArray([], "field")).toThrow(ValidationError);
    });

    it("deve lançar ValidationError para não-array", () => {
      expect(() => validateNonEmptyArray("not-array" as any, "field")).toThrow(ValidationError);
    });
  });

  describe("validateBoolean", () => {
    it("deve retornar boolean válido", () => {
      const result = validateBoolean(true, "field");
      expect(result).toBe(true);
    });

    it("deve lançar ValidationError para não-boolean", () => {
      expect(() => validateBoolean("true" as any, "field")).toThrow(ValidationError);
    });
  });

  describe("validateObject", () => {
    it("deve retornar objeto válido", () => {
      const result = validateObject({ key: "value" }, "field");
      expect(result).toEqual({ key: "value" });
    });

    it("deve lançar ValidationError para array", () => {
      expect(() => validateObject([], "field")).toThrow(ValidationError);
    });

    it("deve lançar ValidationError para null", () => {
      expect(() => validateObject(null, "field")).toThrow(ValidationError);
    });
  });

  describe("validateStringLength", () => {
    it("deve retornar string válida", () => {
      const result = validateStringLength("test", "field", 2, 10);
      expect(result).toBe("test");
    });

    it("deve lançar ValidationError para string muito curta", () => {
      expect(() => validateStringLength("a", "field", 2, 10)).toThrow(ValidationError);
    });

    it("deve lançar ValidationError para string muito longa", () => {
      expect(() => validateStringLength("a".repeat(20), "field", 2, 10)).toThrow(ValidationError);
    });
  });

  describe("validateEmail", () => {
    it("deve retornar email válido", () => {
      const result = validateEmail("test@example.com", "field");
      expect(result).toBe("test@example.com");
    });

    it("deve lançar ValidationError para email inválido", () => {
      expect(() => validateEmail("not-an-email", "field")).toThrow(ValidationError);
    });
  });
});

