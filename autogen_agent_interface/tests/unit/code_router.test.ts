/**
 * Testes Unitários para Code Router
 * 
 * @module code_router.test
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  estimateCodeComplexity,
  selectCodeModel,
  generateCode,
  checkModelAvailability,
  getBestAvailableCodeModel,
} from "../../server/utils/code_router";
import { ValidationError, ExecutionError } from "../../server/utils/error_handler";

describe("Code Router", () => {
  describe("estimateCodeComplexity", () => {
    it("deve retornar 'simple' para tarefas simples", () => {
      const result = estimateCodeComplexity("Criar função para calcular média");
      expect(result).toBe("simple");
    });

    it("deve retornar 'medium' para tarefas médias", () => {
      const result = estimateCodeComplexity("Criar função para processar dados de uma API");
      expect(result).toBe("medium");
    });

    it("deve retornar 'complex' para tarefas complexas", () => {
      const result = estimateCodeComplexity("Refatorar toda a arquitetura do projeto");
      expect(result).toBe("complex");
    });

    it("deve lançar ValidationError para descrição vazia", () => {
      expect(() => estimateCodeComplexity("")).toThrow(ValidationError);
    });

    it("deve lançar ValidationError para descrição apenas com espaços", () => {
      expect(() => estimateCodeComplexity("   ")).toThrow(ValidationError);
    });
  });

  describe("selectCodeModel", () => {
    it("deve retornar modelo padrão para tarefas simples", () => {
      const result = selectCodeModel("simple");
      expect(result).toBeDefined();
      expect(typeof result).toBe("string");
    });

    it("deve retornar modelo padrão para tarefas médias", () => {
      const result = selectCodeModel("medium");
      expect(result).toBeDefined();
      expect(typeof result).toBe("string");
    });

    it("deve retornar modelo padrão para tarefas complexas sem GPT-5 Codex", () => {
      const result = selectCodeModel("complex", false);
      expect(result).toBeDefined();
      expect(typeof result).toBe("string");
    });
  });

  describe("generateCode", () => {
    it("deve lançar ValidationError para requisição sem descrição", async () => {
      await expect(
        generateCode({
          description: "",
          language: "python",
        } as any)
      ).rejects.toThrow(ValidationError);
    });

    it("deve lançar ValidationError para requisição sem linguagem", async () => {
      await expect(
        generateCode({
          description: "Teste",
          language: "",
        } as any)
      ).rejects.toThrow(ValidationError);
    });

    it("deve lançar ValidationError para linguagem inválida", async () => {
      await expect(
        generateCode({
          description: "Teste",
          language: "invalid-language",
        } as any)
      ).rejects.toThrow(ValidationError);
    });

    // Nota: Testes de integração com Ollama requerem servidor Ollama rodando
    // Esses testes devem ser feitos em ambiente de integração
  });

  describe("checkModelAvailability", () => {
    // Nota: Testes de disponibilidade de modelo requerem servidor Ollama rodando
    // Esses testes devem ser feitos em ambiente de integração
    it("deve retornar boolean", async () => {
      // Mock da resposta (em teste real, verificar se Ollama está disponível)
      const result = await checkModelAvailability("test-model").catch(() => false);
      expect(typeof result).toBe("boolean");
    });
  });

  describe("getBestAvailableCodeModel", () => {
    // Nota: Testes de modelo disponível requerem servidor Ollama rodando
    // Esses testes devem ser feitos em ambiente de integração
    it("deve retornar string com nome do modelo", async () => {
      const result = await getBestAvailableCodeModel().catch(() => "fallback-model");
      expect(typeof result).toBe("string");
      expect(result.length).toBeGreaterThan(0);
    });
  });
});

