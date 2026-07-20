type AssessmentPayload = Record<string, unknown>;

function numberValue(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function confidence(value: unknown) {
  return clamp(numberValue(value) * 10);
}

function inverseTen(value: unknown) {
  return clamp((10 - numberValue(value)) * 10);
}

function runningScore(value: unknown) {
  const minutes = numberValue(value, 12);
  if (minutes <= 6) return 100;
  if (minutes <= 7) return 90;
  if (minutes <= 8) return 78;
  if (minutes <= 9) return 65;
  if (minutes <= 10) return 52;
  return 38;
}

function repsScore(value: unknown, excellent: number) {
  return clamp((numberValue(value) / excellent) * 100);
}

function textChoiceScore(value: unknown, scores: Record<string, number>, fallback = 60) {
  const key = String(value ?? "").trim().toLowerCase();
  return scores[key] ?? fallback;
}

function average(values: number[]) {
  return values.length ? clamp(values.reduce((sum, value) => sum + value, 0) / values.length) : 0;
}

function band(score: number) {
  if (score >= 85) return "Excellent";
  if (score >= 70) return "Strong";
  if (score >= 50) return "Average";
  return "Weak";
}

function labels(scores: Record<string, number>, mode: "strong" | "weak") {
  return Object.entries(scores)
    .filter(([, score]) => mode === "strong" ? score >= 70 : score < 55)
    .map(([key]) => key);
}

export const topRankReadinessService = {
  calculate(payload: AssessmentPayload) {
    const academicParts = {
      mathematics: confidence(payload.mathematicsConfidence),
      english: confidence(payload.englishConfidence),
      reasoning: confidence(payload.reasoningConfidence),
      generalKnowledge: confidence(payload.generalKnowledgeConfidence),
      currentAffairs: confidence(payload.currentAffairsConfidence),
      computerKnowledge: confidence(payload.computerKnowledge),
      mockScore: clamp(numberValue(payload.previousMockScore))
    };
    const academicScore = average(Object.values(academicParts));

    const physicalParts = {
      running: runningScore(payload.running1600mTiming),
      pushUps: repsScore(payload.pushUps, 40),
      sitUps: repsScore(payload.sitUps, 50),
      medical: textChoiceScore(payload.medicalStatus, { fit: 100, minor: 65, review: 40, unfit: 20 }),
      exerciseFrequency: confidence(payload.exerciseFrequency)
    };
    const physicalScore = average(Object.values(physicalParts));

    const learningParts = {
      dailyStudyHours: clamp((numberValue(payload.dailyStudyHours) / 6) * 100),
      studyTime: textChoiceScore(payload.preferredStudyTime, { morning: 90, afternoon: 72, night: 78 }),
      learningStyle: textChoiceScore(payload.learningStyle, { practicing: 92, reading: 78, watching: 72, revision: 86 }),
      revisionHabits: confidence(payload.revisionHabits),
      distractionLevel: inverseTen(payload.distractionLevel)
    };
    const learningScore = average(Object.values(learningParts));

    const disciplineParts = {
      attendanceConsistency: confidence(payload.attendanceConsistency),
      goalClarity: confidence(payload.goalClarity),
      selfConfidence: confidence(payload.selfConfidence),
      timeManagement: confidence(payload.timeManagement),
      motivation: confidence(payload.motivation),
      stressLevel: inverseTen(payload.stressLevel),
      commitment: confidence(payload.commitment)
    };
    const disciplineScore = average(Object.values(disciplineParts));

    const careerParts = {
      preferredForce: textChoiceScore(payload.preferredForce, { army: 88, navy: 88, "air force": 88, "general defence": 74 }),
      reasonForJoining: String(payload.reasonForJoining ?? "").trim().length > 20 ? 90 : 60,
      familySupport: confidence(payload.familySupport),
      targetExam: String(payload.targetExam ?? "").trim() ? 85 : 50
    };
    const careerScore = average(Object.values(careerParts));

    const overallScore = clamp((academicScore * 0.3) + (physicalScore * 0.25) + (learningScore * 0.2) + (disciplineScore * 0.15) + (careerScore * 0.1));
    const categoryScores = { academicScore, physicalScore, learningScore, disciplineScore, careerScore };
    const strengths = labels(categoryScores, "strong");
    const weaknesses = labels(categoryScores, "weak");
    const improvementAreas = weaknesses.length ? weaknesses : Object.entries(categoryScores).sort((a, b) => a[1] - b[1]).slice(0, 2).map(([key]) => key);

    return {
      academicScore,
      physicalScore,
      learningScore,
      disciplineScore,
      careerScore,
      overallScore,
      readinessBand: band(overallScore),
      strengths,
      weaknesses,
      improvementAreas,
      componentScores: {
        academicParts,
        physicalParts,
        learningParts,
        disciplineParts,
        careerParts
      }
    };
  }
};

