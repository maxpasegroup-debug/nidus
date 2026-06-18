import type { TopRankComponentScores, TopRankSignalBundle } from "./toprank-types.js";

function clamp(score: number) {
  return Math.max(0, Math.min(100, Math.round(Number.isFinite(score) ? score : 0)));
}

function percentScore(value: number | null, fallback = 0) {
  return clamp(value ?? fallback);
}

export const topRankDisciplineService = {
  calculate(signals: TopRankSignalBundle): Pick<
    TopRankComponentScores,
    "attendanceDiscipline" | "assignmentDiscipline" | "practiceDiscipline" | "fitnessDiscipline" | "consistencyDiscipline"
  > {
    const attendanceDiscipline = percentScore(signals.attendance.percentage);
    const assignmentDiscipline = percentScore(signals.assignments.completionPercentage);
    const practiceDiscipline = signals.tests.available
      ? clamp((signals.tests.attempts / signals.tests.available) * 100)
      : signals.tests.attempts
        ? 70
        : 0;
    const fitnessDiscipline = signals.fitness.logCount || signals.fitness.profileCount
      ? clamp(Math.min(100, signals.fitness.logCount * 12 + signals.fitness.profileCount * 20))
      : 0;
    const activeSignals = [attendanceDiscipline, assignmentDiscipline, practiceDiscipline, fitnessDiscipline].filter((score) => score > 0);
    const consistencyDiscipline = activeSignals.length
      ? clamp(activeSignals.reduce((sum, score) => sum + score, 0) / activeSignals.length)
      : 0;

    return {
      attendanceDiscipline,
      assignmentDiscipline,
      practiceDiscipline,
      fitnessDiscipline,
      consistencyDiscipline
    };
  }
};
