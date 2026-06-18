import type { RiskSignal, TraitScoreResult } from "./assessment-scoring.types.js";

const riskKeywordMap: Array<[string, string]> = [
  ["discipline", "DISCIPLINE_RISK"],
  ["routine", "DISCIPLINE_RISK"],
  ["focus", "FOCUS_RISK"],
  ["attention", "FOCUS_RISK"],
  ["motivation", "MOTIVATION_RISK"],
  ["service", "SERVICE_MOTIVATION_RISK"],
  ["consistency", "CONSISTENCY_RISK"],
  ["leadership", "LEADERSHIP_RISK"],
  ["exam", "EXAM_RISK"],
  ["accuracy", "EXAM_RISK"],
  ["fitness", "FITNESS_RISK"],
  ["physical", "FITNESS_RISK"],
  ["ssb", "SSB_RISK"],
  ["olq", "SSB_RISK"]
];

function riskTypeFor(name: string) {
  const normalized = name.toLowerCase();
  return riskKeywordMap.find(([keyword]) => normalized.includes(keyword))?.[1] ?? "GENERAL_READINESS_RISK";
}

function riskLevel(score: number): RiskSignal["riskLevel"] {
  if (score < 40) return "CRITICAL";
  if (score < 55) return "HIGH";
  if (score < 70) return "MODERATE";
  return "LOW";
}

export const assessmentRiskService = {
  evaluate(traits: TraitScoreResult[]) {
    const signals: RiskSignal[] = [];
    for (const trait of traits) {
      const level = riskLevel(trait.weightedScore);
      if (level === "LOW") continue;
      signals.push({
        riskType: riskTypeFor(trait.traitName),
        riskLevel: level,
        score: Math.round(100 - trait.weightedScore),
        reason: `${trait.traitName} scored ${Math.round(trait.weightedScore)}/100 and needs ${level.toLowerCase()} attention.`
      });
    }
    return {
      riskScore: signals.length ? Math.min(100, Math.round(signals.reduce((sum, item) => sum + item.score, 0) / signals.length)) : 0,
      signals
    };
  }
};
