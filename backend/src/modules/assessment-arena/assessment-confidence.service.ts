import type { ScoreBand } from "./assessment-scoring.types.js";
import { assessmentReadinessService } from "./assessment-readiness.service.js";

function percentage(part: number, total: number) {
  return total > 0 ? Math.round((part / total) * 100) : 0;
}

export const assessmentConfidenceService = {
  calculate(input: {
    totalQuestions: number;
    answeredQuestions: number;
    expectedTraits: number;
    coveredTraits: number;
    expectedDimensions: number;
    coveredDimensions: number;
    integrityScore: number;
  }): ScoreBand & {
    completionRate: number;
    traitCoverage: number;
    dimensionCoverage: number;
    confidenceScore: number;
  } {
    const completionRate = percentage(input.answeredQuestions, input.totalQuestions);
    const traitCoverage = percentage(input.coveredTraits, input.expectedTraits);
    const dimensionCoverage = percentage(input.coveredDimensions, input.expectedDimensions);
    const confidenceScore = Math.round(
      completionRate * 0.35 +
      traitCoverage * 0.2 +
      dimensionCoverage * 0.2 +
      input.integrityScore * 0.25
    );
    return {
      ...assessmentReadinessService.band(confidenceScore),
      confidenceScore,
      completionRate,
      traitCoverage,
      dimensionCoverage
    };
  }
};
