import { env } from "../../../config/env.js";
import { callOpenAIMultimodalJson } from "../../ai-engine/openai.service.js";
import type { AiProvider } from "../contracts/providers.js";
import { RuleBasedAiValidatorProvider } from "./rule-based-ai.provider.js";

const fallbackProvider = new RuleBasedAiValidatorProvider();

export class OpenAiValidatorProvider implements AiProvider {
  readonly id = "ai.openai";
  readonly kind = "AI" as const;
  readonly displayName = "OpenAI NDIE Validator";

  isEnabled() {
    return env.OPENAI_ENABLED && Boolean(env.OPENAI_API_KEY);
  }

  health() {
    return {
      id: this.id,
      kind: this.kind,
      enabled: this.isEnabled(),
      configured: env.OPENAI_ENABLED && Boolean(env.OPENAI_API_KEY),
      status: this.isEnabled() ? "READY" as const : "NOT_CONFIGURED" as const
    };
  }

  async validate(input: Parameters<AiProvider["validate"]>[0]) {
    const fallback = await fallbackProvider.validate(input);
    if (!this.isEnabled()) return fallback;

    const response = await callOpenAIMultimodalJson({
      instructions: "Verify reconstructed examination questions against supplied structured evidence and preserved page images. Never invent or repair academic content. Preserve numbering, formulas, diagrams, options, answers and solutions exactly. When evidence is absent or ambiguous, return NEEDS_REVIEW.",
      text: JSON.stringify({
        candidates: input.candidates.map((candidate) => ({
          id: candidate.id,
          questionNumber: candidate.questionNumber,
          questionType: candidate.questionType,
          confidence: candidate.confidence,
          candidateJson: candidate.candidateJson
        })),
        answerKeys: input.answerKeys,
        solutions: input.solutions,
        evidencePolicy: "Every assertion must be grounded in candidate source maps or the supplied page images."
      }),
      imageUrls: (input.pageAssets ?? []).map((asset) => asset.url),
      schemaName: "ndie_exam_verification",
      schema: {
        type: "object",
        additionalProperties: false,
        properties: {
          validations: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              properties: {
                candidateId: { type: "string" },
                confidence: { type: "number", minimum: 0, maximum: 1 },
                reviewStatus: { type: "string", enum: ["AUTO_APPROVED", "NEEDS_REVIEW", "MANUAL_CORRECTION_REQUIRED"] },
                issues: { type: "array", items: { type: "string" } },
                notes: { type: "array", items: { type: "string" } }
              },
              required: ["candidateId", "confidence", "reviewStatus", "issues", "notes"]
            }
          }
        },
        required: ["validations"]
      },
      fallback: { validations: fallback.validations } as unknown as Record<string, unknown>
    });

    const returned = Array.isArray(response.validations) ? response.validations : [];
    const byId = new Map(returned.map((item) => {
      const row = item && typeof item === "object" && !Array.isArray(item) ? item as Record<string, unknown> : {};
      return [String(row.candidateId ?? ""), row];
    }));
    const validations = fallback.validations.map((validation) => {
      const verified = byId.get(validation.candidateId);
      if (!verified) return validation;
      const confidence = Math.max(0, Math.min(validation.confidence, Number(verified.confidence ?? 0)));
      const issues = Array.isArray(verified.issues) ? verified.issues.map(String) : validation.issues;
      return {
        ...validation,
        confidence,
        reviewStatus: issues.length || confidence < 0.85 ? "NEEDS_REVIEW" as const : validation.reviewStatus,
        issues: Array.from(new Set([...validation.issues, ...issues])),
        notes: Array.isArray(verified.notes) ? verified.notes.map(String) : validation.notes
      };
    });

    return {
      ...fallback,
      validations,
      confidence: validations.length ? validations.reduce((sum, item) => sum + item.confidence, 0) / validations.length : fallback.confidence,
      raw: { provider: this.id, response, evidenceImages: input.pageAssets?.length ?? 0, policy: "confidence-can-only-decrease-with-verification" }
    };
  }
}
