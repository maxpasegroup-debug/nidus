export const assessmentReportFixture = {
  id: "fixture-report",
  audience: "STUDENT",
  createdAt: new Date("2026-06-18T12:00:00.000Z"),
  report: {
    title: "Officer Potential Index Report",
    audience: "STUDENT",
    summary: {
      assessmentScore: 72,
      readinessScore: 76,
      readinessBand: "GREEN",
      readinessLabel: "Ready for next level",
      readinessDescription: "Readiness is usable. Continue structured improvement around the weakest dimensions."
    },
    traits: [
      { name: "Leadership", score: 82, confidenceScore: 88 },
      { name: "Discipline", score: 68, confidenceScore: 80 },
      { name: "Focus", score: 58, confidenceScore: 74 }
    ],
    dimensions: [
      { name: "Command Presence", trait: "Leadership", score: 84, confidenceScore: 86 },
      { name: "Routine Discipline", trait: "Discipline", score: 68, confidenceScore: 80 },
      { name: "Distraction Resistance", trait: "Focus", score: 58, confidenceScore: 74 }
    ],
    strengths: ["Leadership"],
    improvementAreas: ["Focus"],
    riskSignals: [{ type: "FOCUS_RISK", level: "MODERATE", reason: "Focus score requires structured practice." }],
    integritySummary: { score: 92, flags: [] },
    confidenceSummary: { score: 84, band: "GREEN" },
    actionRecommendations: ["Build consistency for 30 days.", "Ask a mentor before repeating the assessment."],
    retakeRecommendation: "Retake after 30-90 days to measure growth.",
    metadata: {
      version: 1,
      assessmentVersion: 1,
      scoringVersion: "v2-foundation-1",
      generatedAt: "2026-06-18T12:00:00.000Z"
    }
  }
};
