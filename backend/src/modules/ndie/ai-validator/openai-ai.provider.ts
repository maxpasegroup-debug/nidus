import { env } from "../../../config/env.js";
import { callOpenAIJson } from "../../ai-engine/openai.service.js";
import type { AiProvider } from "../contracts/providers.js";
import { RuleBasedAiValidatorProvider } from "./rule-based-ai.provider.js";

const fallbackProvider = new RuleBasedAiValidatorProvider();

export class OpenAiValidatorProvider implements AiProvider {
  readonly id = "ai.openai";
  readonly kind = "AI" as const;
  readonly displayName = "OpenAI NDIE Validator";

  isEnabled() {
    return Boolean(env.OPENAI_API_KEY);
  }

  health() {
    return {
      id: this.id,
      kind: this.kind,
      enabled: this.isEnabled(),
      configured: Boolean(env.OPENAI_API_KEY),
      status: this.isEnabled() ? "READY" as const : "NOT_CONFIGURED" as const
    };
  }

  async validate(input: Parameters<AiProvider["validate"]>[0]) {
    const fallback = await fallbackProvider.validate(input);
    if (!this.isEnabled()) return fallback;

    const response = await callOpenAIJson(
      "You validate exam import candidates for NIDUS NDIE. Return strict JSON with validations: candidateId, confidence 0-1, reviewStatus AUTO_APPROVED|NEEDS_REVIEW|MANUAL_CORRECTION_REQUIRED, issues, notes. Do not publish anything.",
      JSON.stringify({
        candidates: input.candidates.map((candidate) => ({
          id: candidate.id,
          questionNumber: candidate.questionNumber,
          questionType: candidate.questionType,
          confidence: candidate.confidence,
          candidateJson: candidate.candidateJson
        })),
        answerKeys: input.answerKeys,
        solutions: input.solutions
      }),
      fallback as unknown as Record<string, unknown>
    );

    return {
      ...fallback,
      ...(response as unknown as typeof fallback),
      raw: { provider: this.id, response }
    };
  }
}
