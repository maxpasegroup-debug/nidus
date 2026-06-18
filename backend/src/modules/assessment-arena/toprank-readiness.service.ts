import type { TopRankBand, TopRankReadinessResult, TopRankSignalBundle } from "./toprank-types.js";
import { topRankDisciplineService } from "./toprank-discipline.service.js";

function clamp(score: number) {
  return Math.max(0, Math.min(100, Math.round(Number.isFinite(score) ? score : 0)));
}

function average(scores: Array<number | null | undefined>) {
  const usable = scores.filter((score): score is number => typeof score === "number" && Number.isFinite(score));
  if (!usable.length) return 0;
  return clamp(usable.reduce((sum, score) => sum + score, 0) / usable.length);
}

export function topRankBand(score: number): TopRankBand {
  if (score >= 90) return "ELITE";
  if (score >= 75) return "GREEN";
  if (score >= 60) return "YELLOW";
  if (score >= 45) return "ORANGE";
  return "RED";
}

function explanation(band: TopRankBand) {
  switch (band) {
    case "ELITE":
      return "Student is showing elite TOP RANK readiness signals across discipline, performance and consistency.";
    case "GREEN":
      return "Student is ready for structured advancement with normal mentor monitoring.";
    case "YELLOW":
      return "Student is developing well but needs steady correction in weaker signals.";
    case "ORANGE":
      return "Student needs active intervention before higher-pressure performance work.";
    default:
      return "Student needs immediate mentor review before TOP RANK acceleration.";
  }
}

export const topRankReadinessService = {
  calculate(signals: TopRankSignalBundle): TopRankReadinessResult {
    const discipline = topRankDisciplineService.calculate(signals);
    const academicPerformance = average([
      signals.tests.averageScore,
      signals.assignments.averageScore,
      signals.exams.teacherExamAverage
    ]);
    const learningProgress = average([
      signals.progress.enrollmentProgress,
      signals.progress.lectureProgressCount ? (signals.progress.lectureCompleted / signals.progress.lectureProgressCount) * 100 : null
    ]);
    const liveClassParticipation = signals.liveClasses.scheduled
      ? clamp(((signals.liveClasses.completed + signals.liveClasses.recordings) / Math.max(1, signals.liveClasses.scheduled)) * 100)
      : 0;
    const disciplineScore = average(Object.values(discipline));
    const performanceScore = average([academicPerformance, signals.tests.averageScore, signals.assignments.averageScore]);
    const growthScore = average([learningProgress, discipline.consistencyDiscipline, liveClassParticipation]);
    const riskScore = clamp(100 - average([disciplineScore, performanceScore, growthScore]));
    const score = clamp(
      disciplineScore * 0.35 +
      performanceScore * 0.30 +
      growthScore * 0.20 +
      liveClassParticipation * 0.10 +
      learningProgress * 0.05
    );
    const band = topRankBand(score);

    return {
      score,
      band,
      explanation: explanation(band),
      academicScore: academicPerformance,
      disciplineScore,
      performanceScore,
      growthScore,
      riskScore,
      components: {
        ...discipline,
        academicPerformance,
        learningProgress,
        liveClassParticipation
      }
    };
  }
};
