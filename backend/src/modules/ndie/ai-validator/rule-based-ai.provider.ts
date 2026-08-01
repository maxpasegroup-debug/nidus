import type { AiProvider } from "../contracts/providers.js";

function blockCount(candidateJson: unknown) {
  const value = candidateJson as { blocks?: unknown[] };
  return Array.isArray(value?.blocks) ? value.blocks.length : 0;
}

function optionCount(candidateJson: unknown) {
  const value = candidateJson as { blocks?: Array<{ type?: string }> };
  return Array.isArray(value?.blocks) ? value.blocks.filter((block) => block.type === "OptionBlock").length : 0;
}

export class RuleBasedAiValidatorProvider implements AiProvider {
  readonly id = "ai.rule-based";
  readonly kind = "AI" as const;
  readonly displayName = "NDIE Rule-Based AI Validator";

  isEnabled() {
    return true;
  }

  health() {
    return {
      id: this.id,
      kind: this.kind,
      enabled: true,
      configured: true,
      status: "READY" as const
    };
  }

  async validate(input: {
    candidates: Array<{ id: string; questionNumber?: string | null; questionType: string; candidateJson: unknown; confidence?: number | null }>;
    answerKeys: Array<{ questionNumber?: string | null }>;
    solutions: Array<{ questionNumber?: string | null }>;
  }) {
    const answerSet = new Set(input.answerKeys.map((answer) => answer.questionNumber).filter(Boolean));
    const solutionSet = new Set(input.solutions.map((solution) => solution.questionNumber).filter(Boolean));
    const validations = input.candidates.map((candidate) => {
      const issues: string[] = [];
      const notes: string[] = [];
      const options = optionCount(candidate.candidateJson);
      if (blockCount(candidate.candidateJson) < 1) issues.push("No readable content block detected.");
      if (candidate.questionType === "MCQ" && options !== 4) issues.push(`Expected 4 options, detected ${options}.`);
      if (!answerSet.has(candidate.questionNumber || "")) notes.push("No mapped answer key yet.");
      if (!solutionSet.has(candidate.questionNumber || "")) notes.push("No worked solution mapped.");
      const baseConfidence = candidate.confidence ?? 0.35;
      const penalty = issues.length * 0.22 + notes.length * 0.06;
      const confidence = Math.max(0.05, Math.min(0.98, baseConfidence - penalty));
      return {
        candidateId: candidate.id,
        confidence,
        reviewStatus: issues.length ? "MANUAL_CORRECTION_REQUIRED" as const : confidence >= 0.82 ? "AUTO_APPROVED" as const : "NEEDS_REVIEW" as const,
        issues,
        notes
      };
    });

    return {
      validations,
      confidence: validations.length ? Math.min(...validations.map((validation) => validation.confidence)) : null,
      raw: {
        provider: this.id,
        strategy: "DETERMINISTIC_REVIEW_HEURISTICS",
        candidates: validations.length
      }
    };
  }
}
