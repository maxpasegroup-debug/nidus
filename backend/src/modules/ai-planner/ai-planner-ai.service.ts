export type StudyPlanInput = {
  targetExam: string;
  studyHoursPerDay: number;
  targetDate: string;
  strengths: string[];
  weaknesses: string[];
};

export const aiPlannerAiService = {
  generateStudyPlan(input: StudyPlanInput) {
    const weakBlocks = input.weaknesses.length > 0 ? input.weaknesses : ["mixed revision"];
    return [
      {
        day: "Monday",
        focus: weakBlocks[0],
        hours: input.studyHoursPerDay,
        mission: `Concept repair and timed drills for ${input.targetExam}`
      },
      {
        day: "Wednesday",
        focus: weakBlocks[1] ?? weakBlocks[0],
        hours: input.studyHoursPerDay,
        mission: "Mock practice, error review, and flash revision"
      },
      {
        day: "Saturday",
        focus: "full-spectrum readiness",
        hours: input.studyHoursPerDay + 1,
        mission: "Weekly mock, physical discipline review, and current affairs briefing"
      }
    ];
  },

  analyzeWeakTopics(topics: string[]) {
    return topics.map((topic) => ({
      topic,
      reason: `${topic} needs review based on the selected weak-topic list.`,
      action: `Schedule two revision cycles and one timed practice set for ${topic}.`
    }));
  },

  generateRecommendations(input: { weakTopics: string[]; strongTopics: string[] }) {
    return [
      "AI Predicting Officer Potential: Maintain consistency across academics, SSB psychology, and physical readiness.",
      "Smart Weakness Detection: Prioritize weak topics in the next 72 hours.",
      input.strongTopics.length
        ? `Use strengths in ${input.strongTopics.join(", ")} to stabilize mock-test scores.`
        : "Build a stronger baseline with short daily mixed-topic drills."
    ];
  }
};
