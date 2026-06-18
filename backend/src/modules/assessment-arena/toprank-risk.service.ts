import type { TopRankRiskLevel, TopRankRiskSignalResult, TopRankSignalBundle } from "./toprank-types.js";

function level(score: number): TopRankRiskLevel {
  if (score >= 75) return "CRITICAL";
  if (score >= 55) return "HIGH";
  if (score >= 30) return "MODERATE";
  return "LOW";
}

function riskFromPositiveScore(score: number | null | undefined) {
  if (typeof score !== "number" || !Number.isFinite(score)) return 50;
  return Math.max(0, Math.min(100, Math.round(100 - score)));
}

function signal(riskType: string, riskScore: number, reason: string): TopRankRiskSignalResult {
  return { riskType, riskLevel: level(riskScore), riskScore, reason };
}

export const topRankRiskService = {
  calculate(signals: TopRankSignalBundle): TopRankRiskSignalResult[] {
    const risks = [
      signal("ATTENDANCE_RISK", riskFromPositiveScore(signals.attendance.percentage), "Attendance readiness is below TOP RANK ideal range."),
      signal("EXAM_RISK", riskFromPositiveScore(signals.tests.averageScore ?? signals.exams.teacherExamAverage), "Assessment performance requires monitoring."),
      signal("MOTIVATION_RISK", riskFromPositiveScore(signals.progress.enrollmentProgress), "Learning activity and progress signals are weak."),
      signal("CONSISTENCY_RISK", riskFromPositiveScore(signals.assignments.completionPercentage), "Assignment completion consistency needs review."),
      signal("DISCIPLINE_RISK", riskFromPositiveScore(signals.attendance.percentage), "Daily execution discipline is not yet stable."),
      signal("PERFORMANCE_RISK", riskFromPositiveScore(signals.tests.averageScore), "Practice/test performance has not reached a reliable range.")
    ];
    return risks.filter((risk) => risk.riskLevel !== "LOW");
  }
};
