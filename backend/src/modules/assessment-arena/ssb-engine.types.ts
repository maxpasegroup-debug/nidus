export type SsbScoreInput = {
  name: string;
  score: number;
};

export type SsbEngineResult = {
  score: number;
  band: string;
  strengths: string[];
  developmentAreas: string[];
  riskIndicators: Array<{ type: string; level: string; reason: string }>;
};

export function clampScore(score: number) {
  return Math.max(0, Math.min(100, Math.round(score)));
}

export function bandFor(score: number) {
  const normalized = clampScore(score);
  if (normalized >= 90) return "ELITE";
  if (normalized >= 75) return "GREEN";
  if (normalized >= 60) return "YELLOW";
  if (normalized >= 45) return "ORANGE";
  return "RED";
}

export function average(inputs: SsbScoreInput[], names: string[]) {
  const selected = inputs.filter((input) => names.some((name) => input.name.toLowerCase() === name.toLowerCase()));
  if (!selected.length) return 0;
  return clampScore(selected.reduce((sum, item) => sum + item.score, 0) / selected.length);
}

export function resultFrom(score: number, inputs: SsbScoreInput[], riskType: string): SsbEngineResult {
  const normalized = clampScore(score);
  const strengths = inputs.filter((input) => input.score >= 75).map((input) => input.name);
  const developmentAreas = inputs.filter((input) => input.score < 60).map((input) => input.name);
  return {
    score: normalized,
    band: bandFor(normalized),
    strengths,
    developmentAreas,
    riskIndicators: developmentAreas.map((area) => ({
      type: riskType,
      level: normalized < 45 ? "CRITICAL" : normalized < 60 ? "HIGH" : "MODERATE",
      reason: `${area} is below dependable SSB readiness level.`
    }))
  };
}
