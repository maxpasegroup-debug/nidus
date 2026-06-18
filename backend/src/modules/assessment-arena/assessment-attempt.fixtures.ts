export const assessmentAttemptFixture = {
  assessment: {
    id: "mock-officer-potential-index",
    name: "Officer Potential Index",
    questionsPerAttempt: 6
  },
  traits: [
    { id: "mock-leadership", name: "Leadership" },
    { id: "mock-decision-making", name: "Decision Making" },
    { id: "mock-responsibility", name: "Responsibility" }
  ],
  dimensions: [
    { id: "mock-command-presence", traitId: "mock-leadership", name: "Command Presence" },
    { id: "mock-pressure-judgment", traitId: "mock-decision-making", name: "Pressure Judgment" },
    { id: "mock-accountability", traitId: "mock-responsibility", name: "Accountability" }
  ],
  questions: Array.from({ length: 12 }, (_, index) => {
    const trait = ["mock-leadership", "mock-decision-making", "mock-responsibility"][index % 3];
    const dimension = ["mock-command-presence", "mock-pressure-judgment", "mock-accountability"][index % 3];
    return {
      id: `mock-question-${index + 1}`,
      traitId: trait,
      dimensionId: dimension,
      difficultyLevel: (index % 5) + 1,
      version: 1,
      exposureCount: index % 4
    };
  })
};

export function simulateAttemptFixture() {
  const selected = assessmentAttemptFixture.questions
    .sort((a, b) => a.exposureCount - b.exposureCount || a.difficultyLevel - b.difficultyLevel)
    .slice(0, assessmentAttemptFixture.assessment.questionsPerAttempt);

  return {
    selectedQuestionIds: selected.map((question) => question.id),
    traitCoverage: new Set(selected.map((question) => question.traitId)).size,
    dimensionCoverage: new Set(selected.map((question) => question.dimensionId)).size,
    difficultyCoverage: new Set(selected.map((question) => question.difficultyLevel)).size,
    snapshots: selected.map((question, index) => ({
      questionId: question.id,
      questionVersion: question.version,
      displayOrder: index + 1,
      traitId: question.traitId,
      dimensionId: question.dimensionId
    }))
  };
}
