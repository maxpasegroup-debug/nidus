import { prisma } from "../../config/prisma.js";

function category(delta: number) {
  if (delta >= 15) return "RAPID_GROWTH";
  if (delta >= 8) return "HEALTHY_GROWTH";
  if (delta >= 3) return "SLOW_GROWTH";
  if (delta >= -2) return "FLAT";
  return "DECLINING";
}

export const assessmentGrowthService = {
  calculate(input: {
    baselineScore: number;
    currentScore: number;
    dayLabel: "DAY_1" | "DAY_30" | "DAY_60" | "DAY_90" | "DAY_120" | string;
    consistencyScore?: number;
  }) {
    const delta = Math.round(input.currentScore - input.baselineScore);
    const consistencyScore = Math.max(0, Math.min(100, Math.round(input.consistencyScore ?? 70)));
    const growthScore = Math.max(0, Math.min(100, Math.round(50 + delta * 1.5 + (consistencyScore - 70) * 0.25)));
    const growthCategory = category(delta);
    return {
      dayLabel: input.dayLabel,
      baselineScore: input.baselineScore,
      currentScore: input.currentScore,
      delta,
      consistencyScore,
      growthScore,
      growthCategory,
      trend: delta > 2 ? "UPWARD" : delta < -2 ? "DOWNWARD" : "STABLE"
    };
  },

  async store(input: {
    assessmentId?: string;
    userId: string;
    dayLabel: string;
    baselineAttemptId?: string;
    currentAttemptId?: string;
    baselineScore: number;
    currentScore: number;
    consistencyScore?: number;
  }) {
    const result = this.calculate(input);
    return prisma.assessmentGrowthSnapshot.create({
      data: {
        assessmentId: input.assessmentId,
        userId: input.userId,
        dayLabel: input.dayLabel,
        baselineAttemptId: input.baselineAttemptId,
        currentAttemptId: input.currentAttemptId,
        growthScore: result.growthScore,
        comparisonData: result
      }
    });
  }
};
