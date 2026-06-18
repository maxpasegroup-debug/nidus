import type { ScoreBand } from "./assessment-scoring.types.js";

function clamp(score: number) {
  return Math.max(0, Math.min(100, Math.round(score)));
}

export const assessmentReadinessService = {
  band(scoreValue: number): ScoreBand {
    const score = clamp(scoreValue);
    if (score >= 90) {
      return {
        band: "ELITE",
        score,
        label: "Elite readiness signal",
        description: "Strong readiness pattern. Candidate can move into advanced challenge and sharpening."
      };
    }
    if (score >= 75) {
      return {
        band: "GREEN",
        score,
        label: "Ready for next level",
        description: "Readiness is usable. Continue structured improvement around the weakest dimensions."
      };
    }
    if (score >= 60) {
      return {
        band: "YELLOW",
        score,
        label: "Developing readiness",
        description: "Trainable profile. Needs planned correction and consistency before higher pressure."
      };
    }
    if (score >= 45) {
      return {
        band: "ORANGE",
        score,
        label: "Correction required",
        description: "Weak readiness signal. Requires guided improvement and mentor monitoring."
      };
    }
    return {
      band: "RED",
      score,
      label: "Intervention required",
      description: "Readiness is not dependable yet. Human review and structured intervention are required."
    };
  }
};
