type OLQMap = Record<string, number>;

type DimensionScore = {
  dimension: string;
  label: string;
  score: number;
  answered: number;
  total: number;
};

export const psychometricAiService = {
  analyzePersonality(answers: Array<{ answerText?: string | null; selectedOption?: string | null }>, dimensionScores: DimensionScore[] = []) {
    const responseCount = answers.filter((answer) => answer.answerText || answer.selectedOption).length;
    const strengths = dimensionScores.filter((item) => item.score >= 75).map((item) => item.label);
    const development = dimensionScores.filter((item) => item.score > 0 && item.score < 60).map((item) => item.label);
    const strengthText = strengths.length ? ` Strong signals: ${strengths.join(", ")}.` : "";
    const developmentText = development.length ? ` Development areas: ${development.join(", ")}.` : "";
    return `NIDUS AI reviewed ${responseCount} meaningful responses and generated dimension-wise assessment intelligence.${strengthText}${developmentText}`;
  },

  generateOLQInsights(scores: OLQMap) {
    const entries = Object.entries(scores);
    const strengths = entries.filter(([, value]) => value >= 75).map(([key]) => key);
    const weaknesses = entries.filter(([, value]) => value < 55).map(([key]) => key);
    const average = entries.length
      ? Math.round(entries.reduce((sum, [, value]) => sum + value, 0) / entries.length)
      : 0;

    return {
      officerReadinessScore: average,
      strengths,
      weaknesses,
      summary: `OLQ readiness score is ${average}. Connect OpenAI analysis to add deeper behavioural evidence and interview recommendations.`
    };
  },

  generateRecommendations(type: string, weakAreas: string[]) {
    return [
      `Practice ${type} under timed conditions for consistency.`,
      weakAreas.length ? `Focus on ${weakAreas.join(", ")}.` : "Maintain balanced OLQ development across all dimensions.",
      "Review SSB response structure: clarity, responsibility, initiative, and practical action."
    ];
  }
};
