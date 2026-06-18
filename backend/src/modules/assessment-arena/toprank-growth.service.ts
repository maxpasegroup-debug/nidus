import { prisma } from "../../config/prisma.js";
import type { TopRankGrowthClassification, TopRankSignalBundle } from "./toprank-types.js";

function classify(delta: number): TopRankGrowthClassification {
  if (delta >= 20) return "RAPID_GROWTH";
  if (delta >= 8) return "HEALTHY_GROWTH";
  if (delta >= 2) return "SLOW_GROWTH";
  if (delta >= -5) return "FLAT";
  return "DECLINING";
}

export const topRankGrowthService = {
  async calculate(signals: TopRankSignalBundle, currentScore: number, dayLabel = "DAY_30") {
    const previous = await prisma.topRankReadinessScore.findFirst({
      where: { userId: signals.userId, ...(signals.batchId ? { batchId: signals.batchId } : {}) },
      orderBy: { createdAt: "asc" }
    });
    const baselineScore = previous?.readinessScore ?? null;
    const delta = baselineScore === null ? 0 : currentScore - baselineScore;

    return {
      dayLabel,
      growthScore: Math.max(0, Math.min(100, Math.round(50 + delta))),
      growthClassification: baselineScore === null ? "FLAT" as const : classify(delta),
      baselineScore,
      currentScore,
      comparisonData: {
        baselineScore,
        currentScore,
        delta,
        availableHistory: Boolean(previous)
      }
    };
  }
};
