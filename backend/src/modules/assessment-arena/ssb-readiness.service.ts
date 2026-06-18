import { bandFor, clampScore, type SsbEngineResult } from "./ssb-engine.types.js";

export const ssbReadinessService = {
  calculate(input: {
    olqScore: number;
    psychology: SsbEngineResult;
    group: SsbEngineResult;
    leadership: SsbEngineResult;
  }) {
    const score = clampScore(
      input.olqScore * 0.35 +
      input.psychology.score * 0.25 +
      input.group.score * 0.2 +
      input.leadership.score * 0.2
    );
    const allStrengths = [...input.psychology.strengths, ...input.group.strengths, ...input.leadership.strengths];
    const allDevelopment = [...input.psychology.developmentAreas, ...input.group.developmentAreas, ...input.leadership.developmentAreas];
    return {
      ssbReadinessScore: score,
      ssbReadinessBand: bandFor(score),
      strengthAreas: [...new Set(allStrengths)].slice(0, 8),
      developmentAreas: [...new Set(allDevelopment)].slice(0, 8),
      mentorAttentionAreas: [
        ...input.psychology.riskIndicators,
        ...input.group.riskIndicators,
        ...input.leadership.riskIndicators
      ].filter((risk) => ["HIGH", "CRITICAL"].includes(risk.level))
    };
  }
};
