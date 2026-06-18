import type { TopRankSignalBundle, TopRankTrend } from "./toprank-types.js";

function scoreFrom(signals: TopRankSignalBundle) {
  const scores = [
    signals.tests.averageScore,
    signals.assignments.averageScore,
    signals.assignments.completionPercentage,
    signals.attendance.percentage
  ].filter((score): score is number => typeof score === "number" && Number.isFinite(score));
  if (!scores.length) return 0;
  return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
}

function classify(score: number): TopRankTrend {
  if (score === 0) return "INSUFFICIENT_DATA";
  if (score >= 75) return "RISING";
  if (score >= 55) return "STABLE";
  return "DECLINING";
}

export const topRankPerformanceService = {
  calculate(signals: TopRankSignalBundle) {
    const score = scoreFrom(signals);
    return {
      score,
      performanceTrend: classify(score),
      completionTrend: classify(signals.assignments.completionPercentage ?? 0),
      improvementTrend: classify(score),
      studyTrend: classify(signals.progress.enrollmentProgress ?? 0),
      metrics: {
        testAverage: signals.tests.averageScore,
        assignmentAverage: signals.assignments.averageScore,
        assignmentCompletion: signals.assignments.completionPercentage,
        attendancePercentage: signals.attendance.percentage,
        lectureCompleted: signals.progress.lectureCompleted
      }
    };
  }
};
