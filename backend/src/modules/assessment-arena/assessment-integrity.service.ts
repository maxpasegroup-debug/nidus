import type { IntegrityFlag, ScoringAnswerInput } from "./assessment-scoring.types.js";

function severityFor(penalty: number): IntegrityFlag["severity"] {
  if (penalty >= 20) return "CRITICAL";
  if (penalty >= 12) return "HIGH";
  if (penalty >= 7) return "MODERATE";
  return "LOW";
}

function flag(type: string, penalty: number, reason: string): IntegrityFlag {
  return { type, penalty, reason, severity: severityFor(penalty) };
}

export const assessmentIntegrityService = {
  evaluate(answers: ScoringAnswerInput[]) {
    const flags: IntegrityFlag[] = [];
    const answered = answers.length;
    if (!answered) return { integrityScore: 0, flags: [flag("NO_RESPONSES", 100, "No answer signals were provided.")] };

    const heroAnswers = answers.filter((answer) => answer.flags?.heroAnswer).length;
    const overclaims = answers.filter((answer) => answer.flags?.overclaimSignal).length;
    const contradictionProbes = answers.filter((answer) => answer.flags?.contradictionProbe).length;
    const socialDesirability = answers.filter((answer) => answer.flags?.socialDesirability).length;
    const maxScoreAnswers = answers.filter((answer) => answer.rawScore >= (answer.maxScore ?? 4)).length;
    const minScoreAnswers = answers.filter((answer) => answer.rawScore <= 0).length;
    const average = answers.reduce((sum, answer) => sum + answer.rawScore / Math.max(answer.maxScore ?? 4, 1), 0) / answered;

    if (heroAnswers / answered >= 0.35) flags.push(flag("HERO_ANSWER_PATTERN", 12, "High heroic answer pattern detected."));
    if (overclaims / answered >= 0.25) flags.push(flag("OVERCLAIM_PATTERN", 15, "Answer pattern shows possible overclaiming."));
    if (socialDesirability / answered >= 0.25) flags.push(flag("SOCIAL_DESIRABILITY", 12, "Responses may be optimized to look ideal."));
    if (contradictionProbes >= 2 && average >= 0.82) flags.push(flag("CONTRADICTION_REVIEW", 10, "High scores appeared around contradiction probes."));
    if (maxScoreAnswers / answered >= 0.85) flags.push(flag("PERFECT_PROFILE_PATTERN", 20, "Nearly all responses selected the strongest pattern."));
    if (minScoreAnswers / answered >= 0.5) flags.push(flag("LOW_ENGAGEMENT_PATTERN", 12, "Many responses selected lowest readiness options."));

    const uniqueScores = new Set(answers.map((answer) => answer.rawScore));
    if (answered >= 12 && uniqueScores.size <= 1) flags.push(flag("REPETITIVE_RESPONSE_PATTERN", 18, "Same score pattern repeated across many answers."));

    const penalty = Math.min(100, flags.reduce((sum, item) => sum + item.penalty, 0));
    return { integrityScore: Math.max(0, 100 - penalty), flags };
  }
};
