export const assessmentQuestionWorkflowFixture = {
  assessment: { id: "fixture-assessment", name: "Officer Potential Index" },
  trait: { id: "fixture-trait", name: "Leadership" },
  dimension: { id: "fixture-dimension", name: "Command Presence" },
  draftQuestion: {
    id: "fixture-question",
    version: 1,
    status: "DRAFT",
    difficultyLevel: 3,
    questionType: "SITUATIONAL",
    optionCount: 5
  },
  workflow: [
    { action: "create", from: null, to: "DRAFT" },
    { action: "submit_review", from: "DRAFT", to: "REVIEW" },
    { action: "senior_review", from: "REVIEW", to: "APPROVED" },
    { action: "publish", from: "APPROVED", to: "PUBLISHED" },
    { action: "retire", from: "PUBLISHED", to: "RETIRED" }
  ]
};

export function simulateQuestionWorkflowFixture() {
  return {
    questionId: assessmentQuestionWorkflowFixture.draftQuestion.id,
    versioning: {
      initialVersion: 1,
      afterEdit: 2,
      versionSnapshotCreated: true
    },
    publication: {
      requiresApproval: true,
      requiresOptions: true,
      allowedFinalStatus: "PUBLISHED"
    },
    analytics: {
      tracksShown: true,
      tracksAnswered: true,
      tracksCompletionRate: true,
      tracksAverageScore: true,
      flagsOverexposure: true
    },
    workflow: assessmentQuestionWorkflowFixture.workflow
  };
}
