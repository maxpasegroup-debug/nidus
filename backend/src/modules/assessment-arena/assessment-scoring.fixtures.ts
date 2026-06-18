import type { ScoringInput } from "./assessment-scoring.types.js";

export const assessmentScoringFixture: ScoringInput = {
  totalQuestions: 12,
  answeredQuestions: 12,
  traits: [
    {
      traitId: "mock-leadership",
      traitName: "Leadership",
      weight: 0.35,
      isCritical: true,
      dimensions: [
        {
          dimensionId: "mock-command-presence",
          dimensionName: "Command Presence",
          traitId: "mock-leadership",
          weight: 0.5,
          answers: [
            { traitId: "mock-leadership", traitName: "Leadership", dimensionId: "mock-command-presence", dimensionName: "Command Presence", rawScore: 3, maxScore: 4 },
            { traitId: "mock-leadership", traitName: "Leadership", dimensionId: "mock-command-presence", dimensionName: "Command Presence", rawScore: 4, maxScore: 4, flags: { heroAnswer: true } }
          ]
        },
        {
          dimensionId: "mock-accountability",
          dimensionName: "Accountability",
          traitId: "mock-leadership",
          weight: 0.5,
          answers: [
            { traitId: "mock-leadership", traitName: "Leadership", dimensionId: "mock-accountability", dimensionName: "Accountability", rawScore: 3, maxScore: 4 },
            { traitId: "mock-leadership", traitName: "Leadership", dimensionId: "mock-accountability", dimensionName: "Accountability", rawScore: 2, maxScore: 4 }
          ]
        }
      ]
    },
    {
      traitId: "mock-discipline",
      traitName: "Discipline",
      weight: 0.35,
      isCritical: true,
      dimensions: [
        {
          dimensionId: "mock-routine-discipline",
          dimensionName: "Routine Discipline",
          traitId: "mock-discipline",
          weight: 1,
          answers: [
            { traitId: "mock-discipline", traitName: "Discipline", dimensionId: "mock-routine-discipline", dimensionName: "Routine Discipline", rawScore: 2, maxScore: 4 },
            { traitId: "mock-discipline", traitName: "Discipline", dimensionId: "mock-routine-discipline", dimensionName: "Routine Discipline", rawScore: 3, maxScore: 4 }
          ]
        }
      ]
    },
    {
      traitId: "mock-focus",
      traitName: "Focus",
      weight: 0.3,
      dimensions: [
        {
          dimensionId: "mock-distraction-resistance",
          dimensionName: "Distraction Resistance",
          traitId: "mock-focus",
          weight: 1,
          answers: [
            { traitId: "mock-focus", traitName: "Focus", dimensionId: "mock-distraction-resistance", dimensionName: "Distraction Resistance", rawScore: 2, maxScore: 4, flags: { riskSignal: true } },
            { traitId: "mock-focus", traitName: "Focus", dimensionId: "mock-distraction-resistance", dimensionName: "Distraction Resistance", rawScore: 1, maxScore: 4, flags: { contradictionProbe: true } }
          ]
        }
      ]
    }
  ]
};
