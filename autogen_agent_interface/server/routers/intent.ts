/**
 * Intent Classification Router - Rota para classificação de intenção via LLM
 */

import { z } from "zod";
import { router, publicProcedure } from "../_core/index";
import { classifyIntentLLM, classifyIntentHybrid } from "../utils/intent_classifier_bridge";

export const intentRouter = router({
  /**
   * Classificar intenção usando LLM
   */
  classify: publicProcedure
    .input(
      z.object({
        message: z.string(),
        model: z.string().optional(),
        baseUrl: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const result = await classifyIntentLLM(
          input.message,
          input.model,
          input.baseUrl
        );
        return {
          success: true,
          ...result,
        };
      } catch (error) {
        console.error("[IntentRouter] Erro ao classificar intenção:", error);
        return {
          success: false,
          intent: "conversation" as const,
          reasoning: `Erro ao classificar: ${error}`,
          action_type: null,
          confidence: 0.5,
        };
      }
    }),

  /**
   * Classificação híbrida (regras + LLM)
   */
  classifyHybrid: publicProcedure
    .input(
      z.object({
        message: z.string(),
        rulesResult: z
          .object({
            type: z.string(),
            confidence: z.number(),
            actionType: z.string().optional(),
          })
          .optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const result = await classifyIntentHybrid(
          input.message,
          input.rulesResult
        );
        return {
          success: true,
          ...result,
        };
      } catch (error) {
        console.error("[IntentRouter] Erro na classificação híbrida:", error);
        return {
          success: false,
          intent: "conversation" as const,
          reasoning: `Erro ao classificar: ${error}`,
          action_type: null,
          confidence: 0.5,
        };
      }
    }),
});

