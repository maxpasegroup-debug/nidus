import { prisma } from "../../config/prisma.js";
import { jsonValue } from "./assessment-input.js";
import { assessmentReadinessService } from "./assessment-readiness.service.js";
import { assessmentReportVersionService } from "./assessment-report-version.service.js";

type ReportAudience = "STUDENT" | "PARENT" | "TEACHER" | "ACADEMIC_HEAD" | "DIRECTOR";

function clamp(score: number) {
  return Math.max(0, Math.min(100, Math.round(score)));
}

function audience(value: unknown): ReportAudience {
  const normalized = typeof value === "string" ? value.toUpperCase() : "STUDENT";
  if (["STUDENT", "PARENT", "TEACHER", "ACADEMIC_HEAD", "DIRECTOR"].includes(normalized)) return normalized as ReportAudience;
  return "STUDENT";
}

function rankTraits<T extends { rawScore: number }>(traits: T[]) {
  return [...traits].sort((a, b) => b.rawScore - a.rawScore);
}

function recommendationsFor(audienceType: ReportAudience, readinessScore: number) {
  const band = assessmentReadinessService.band(readinessScore);
  const base = {
    retakeRecommendation: readinessScore >= 75 ? "Retake after 30-90 days to measure growth." : "Retake after guided improvement and mentor review.",
    actionLevel: band.band,
    actions: [] as string[]
  };

  if (audienceType === "PARENT") {
    base.actions = ["Encourage routine discipline.", "Support regular study hours.", "Discuss progress positively without pressure."];
  } else if (audienceType === "TEACHER") {
    base.actions = ["Watch focus and consistency patterns.", "Use short corrective tasks.", "Escalate repeated risk signals to Academic Head."];
  } else if (audienceType === "ACADEMIC_HEAD") {
    base.actions = ["Group students by risk signal.", "Plan batch-level interventions.", "Track participation and retake readiness."];
  } else if (audienceType === "DIRECTOR") {
    base.actions = ["Monitor academy readiness distribution.", "Review program-level risk clusters.", "Use reports for intervention planning only."];
  } else {
    base.actions = ["Follow the improvement areas.", "Build consistency for 30 days.", "Ask a mentor before repeating the assessment."];
  }
  return base;
}

function buildReport(audienceType: ReportAudience, attempt: Awaited<ReturnType<typeof loadAttempt>>) {
  if (!attempt) throw new Error("Assessment attempt not found");
  const readiness = assessmentReadinessService.band(attempt.readinessScore || attempt.assessmentScore);
  const traits = rankTraits(attempt.traitScores);
  const dimensions = [...attempt.dimensionScores].sort((a, b) => b.rawScore - a.rawScore);
  const strengths = traits.filter((trait) => trait.rawScore >= 75).slice(0, 5).map((trait) => trait.trait.name);
  const improvementAreas = traits.filter((trait) => trait.rawScore < 60).slice(0, 5).map((trait) => trait.trait.name);
  const riskSignals = attempt.riskSignals.map((signal) => ({
    type: signal.riskType,
    level: signal.riskLevel,
    score: signal.score,
    reason: signal.description
  }));

  const common = {
    title: `${attempt.assessment.name} Report`,
    audience: audienceType,
    assessment: {
      id: attempt.assessment.id,
      name: attempt.assessment.name,
      slug: attempt.assessment.slug
    },
    attempt: {
      id: attempt.id,
      status: attempt.status,
      startedAt: attempt.startedAt,
      submittedAt: attempt.submittedAt
    },
    summary: {
      assessmentScore: clamp(attempt.assessmentScore),
      readinessScore: readiness.score,
      readinessBand: readiness.band,
      readinessLabel: readiness.label,
      readinessDescription: readiness.description
    },
    traits: traits.map((trait) => ({
      id: trait.traitId,
      name: trait.trait.name,
      score: clamp(trait.rawScore),
      confidenceScore: clamp(trait.confidenceScore)
    })),
    dimensions: dimensions.map((dimension) => ({
      id: dimension.dimensionId,
      name: dimension.dimension.name,
      trait: dimension.dimension.trait.name,
      score: clamp(dimension.rawScore),
      confidenceScore: clamp(dimension.confidenceScore)
    })),
    strengths,
    improvementAreas,
    riskSignals,
    integritySummary: {
      score: clamp(attempt.integrityScore),
      flags: attempt.integritySignals.map((signal) => ({
        type: signal.signalType,
        severity: signal.severity,
        reason: signal.description
      }))
    },
    confidenceSummary: {
      score: clamp(attempt.confidenceScore),
      band: assessmentReadinessService.band(attempt.confidenceScore).band
    },
    metadata: {
      version: 1,
      assessmentVersion: 1,
      scoringVersion: "v2-foundation-1",
      generatedAt: new Date().toISOString()
    }
  };

  if (audienceType === "PARENT") {
    return {
      ...common,
      language: "simple",
      parentGuidance: {
        readinessOverview: common.summary.readinessDescription,
        disciplineIndicators: dimensions.filter((item) => item.dimension.name.toLowerCase().includes("discipline")).map((item) => item.dimension.name),
        focusIndicators: dimensions.filter((item) => item.dimension.name.toLowerCase().includes("focus")).map((item) => item.dimension.name),
        consistencyIndicators: traits.filter((item) => item.trait.name.toLowerCase().includes("consistency")).map((item) => item.trait.name),
        positiveGuidance: "Use this report for support and encouragement, not comparison."
      }
    };
  }

  if (audienceType === "TEACHER") {
    return {
      ...common,
      classroomReadiness: readiness,
      learningBehaviourSummary: `${common.summary.readinessLabel}. Track focus, discipline and consistency during class tasks.`,
      interventionSuggestions: recommendationsFor(audienceType, readiness.score).actions
    };
  }

  if (audienceType === "ACADEMIC_HEAD") {
    return {
      ...common,
      batchReadiness: readiness,
      riskClusters: riskSignals.reduce<Record<string, number>>((acc, signal) => {
        acc[signal.type] = (acc[signal.type] ?? 0) + 1;
        return acc;
      }, {}),
      studentsNeedingSupport: readiness.score < 60 ? [attempt.userId] : [],
      participation: { attemptStatus: attempt.status }
    };
  }

  if (audienceType === "DIRECTOR") {
    return {
      ...common,
      academyReadiness: readiness,
      programReadiness: readiness,
      assessmentCompletion: { status: attempt.status, submittedAt: attempt.submittedAt },
      riskClusters: riskSignals.map((signal) => signal.type),
      growthIndicators: "Growth engine snapshots will be connected in a later phase."
    };
  }

  return {
    ...common,
    actionRecommendations: recommendationsFor(audienceType, readiness.score).actions,
    retakeRecommendation: recommendationsFor(audienceType, readiness.score).retakeRecommendation
  };
}

async function loadAttempt(attemptId: string) {
  return prisma.assessmentAttempt.findUnique({
    where: { id: attemptId },
    include: {
      assessment: true,
      traitScores: { include: { trait: true } },
      dimensionScores: { include: { dimension: { include: { trait: true } } } },
      integritySignals: true,
      riskSignals: true
    }
  });
}

export const assessmentReportService = {
  async generate(input: { attemptId: string; audience?: string; scoringVersion?: string }) {
    const attempt = await loadAttempt(input.attemptId);
    if (!attempt) throw new Error("Assessment attempt not found");
    const reportAudience = audience(input.audience);
    const version = await assessmentReportVersionService.nextVersion({ attemptId: attempt.id, audience: reportAudience });
    const report = {
      ...buildReport(reportAudience, attempt),
      metadata: {
        version,
        assessmentVersion: 1,
        scoringVersion: input.scoringVersion ?? "v2-foundation-1",
        generatedAt: new Date().toISOString()
      }
    };
    const scoring = {
      assessmentScore: attempt.assessmentScore,
      readinessScore: attempt.readinessScore,
      integrityScore: attempt.integrityScore,
      riskScore: attempt.riskScore,
      confidenceScore: attempt.confidenceScore,
      scoringVersion: input.scoringVersion ?? "v2-foundation-1"
    };
    const recommendations = recommendationsFor(reportAudience, attempt.readinessScore || attempt.assessmentScore);

    return prisma.assessmentReportSnapshot.upsert({
      where: { attemptId_audience: { attemptId: attempt.id, audience: reportAudience } },
      create: {
        assessmentId: attempt.assessmentId,
        attemptId: attempt.id,
        userId: attempt.userId,
        audience: reportAudience,
        report: jsonValue(report),
        scoring: jsonValue(scoring),
        recommendations: jsonValue(recommendations)
      },
      update: {
        report: jsonValue(report),
        scoring: jsonValue(scoring),
        recommendations: jsonValue(recommendations)
      }
    });
  },

  get(id: string) {
    return prisma.assessmentReportSnapshot.findUnique({
      where: { id },
      include: {
        assessment: { select: { id: true, name: true, slug: true } },
        attempt: { select: { id: true, status: true, startedAt: true, submittedAt: true } }
      }
    });
  }
};
