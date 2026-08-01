import type { Prisma } from "../../../generated/prisma/client.js";
import { prisma } from "../../../config/prisma.js";

export type NdieReviewInput = {
  candidateId: string;
  decision: "APPROVED" | "REJECTED" | "NEEDS_EDIT" | "SKIPPED";
  notes?: string;
  candidateJson?: unknown;
  reviewedBy: string;
  reviewedByRole?: string;
};

export type NdieBulkReviewInput = {
  importJobId: string;
  candidateIds: string[];
  decision: "APPROVED" | "REJECTED" | "NEEDS_EDIT" | "SKIPPED";
  notes?: string;
  reviewedBy: string;
  reviewedByRole?: string;
};

export type NdieReviewSessionInput = {
  importJobId: string;
  selectedCandidateId?: string | null;
  selectedPageNumber?: number | null;
  filters?: Record<string, unknown>;
  scroll?: Record<string, unknown>;
  shortcuts?: Record<string, unknown>;
  savedBy: string;
  savedByRole?: string;
};

function nextRevision(existing: Array<{ revision: number }>) {
  return existing.length ? Math.max(...existing.map((item) => item.revision)) + 1 : 1;
}

function confidenceBand(value?: number | null) {
  if (typeof value !== "number") return "UNSCORED";
  if (value >= 0.82) return "GREEN";
  if (value >= 0.45) return "AMBER";
  return "RED";
}

function statusCounts<T extends { reviewStatus: string }>(rows: T[]) {
  return rows.reduce<Record<string, number>>((acc, row) => {
    acc[row.reviewStatus] = (acc[row.reviewStatus] ?? 0) + 1;
    return acc;
  }, {});
}

function asRecord(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function candidateAssessment(candidate: { candidateJson: Prisma.JsonValue }) {
  return asRecord(asRecord(candidate.candidateJson).assessment ?? candidate.candidateJson);
}

function candidateIssues(candidate: { candidateJson: Prisma.JsonValue; sourceMap: Prisma.JsonValue | null }) {
  const assessment = candidateAssessment(candidate);
  const validation = asRecord(asRecord(candidate.sourceMap).aiValidation);
  const diagnostics = asRecord(assessment.diagnostics);
  const issues = [
    ...((Array.isArray(diagnostics.issues) ? diagnostics.issues : []).map(String)),
    ...((Array.isArray(validation.issues) ? validation.issues : []).map(String)),
    ...((Array.isArray(validation.notes) ? validation.notes : []).map(String))
  ];
  return [...new Set(issues)];
}

function decisionStatus(decision: NdieReviewInput["decision"]) {
  if (decision === "APPROVED") return "APPROVED";
  if (decision === "REJECTED") return "REJECTED";
  if (decision === "SKIPPED") return "SKIPPED";
  return "NEEDS_EDIT";
}

function completionStats(candidates: Array<{ reviewStatus: string }>) {
  const reviewed = candidates.filter((candidate) => ["APPROVED", "REJECTED", "SKIPPED"].includes(candidate.reviewStatus)).length;
  const approved = candidates.filter((candidate) => candidate.reviewStatus === "APPROVED").length;
  const rejected = candidates.filter((candidate) => candidate.reviewStatus === "REJECTED").length;
  const needsReview = candidates.length - reviewed;
  return {
    completionPercent: candidates.length ? Math.round((reviewed / candidates.length) * 100) : 0,
    remainingIssues: needsReview,
    approvedQuestions: approved,
    rejectedQuestions: rejected,
    skippedQuestions: candidates.filter((candidate) => candidate.reviewStatus === "SKIPPED").length,
    needsReview,
    estimatedPublishReadiness: needsReview === 0 && approved > 0 ? "READY" : approved > 0 ? "READY_WITH_REVIEW" : "BLOCKED"
  };
}

function latestValidation(workspace: { providerRuns?: Array<{ providerKind: string; outputSummary: Prisma.JsonValue | null; confidence: number | null }> }) {
  const run = workspace.providerRuns?.find((providerRun) => providerRun.providerKind === "AI");
  const validation = asRecord(asRecord(run?.outputSummary).validation);
  return {
    confidence: run?.confidence ?? null,
    publishReadiness: asRecord(validation.publishReadiness),
    issues: Array.isArray(validation.issues) ? validation.issues : [],
    warnings: Array.isArray(validation.warnings) ? validation.warnings : [],
    recommendations: Array.isArray(validation.recommendations) ? validation.recommendations.map(String) : [],
    metrics: asRecord(validation.metrics)
  };
}

type ReviewWorkspaceRecord = {
  questionCandidates?: Array<{
    id: string;
    questionNumber?: string | null;
    candidateJson: Prisma.JsonValue;
    sourceMap: Prisma.JsonValue | null;
    confidence?: number | null;
    reviewStatus: string;
  }>;
  answerKeyCandidates?: Array<{ id: string; questionNumber?: string | null; answerJson: Prisma.JsonValue; confidence?: number | null; status: string }>;
  solutionCandidates?: Array<{ id: string; questionNumber?: string | null; solutionJson: Prisma.JsonValue; confidence?: number | null; status: string }>;
  elements?: Array<{ id: string; pageNumber: number; elementType: string; text?: string | null; confidence?: number | null; coordinates: Prisma.JsonValue; metadata: Prisma.JsonValue | null }>;
  revisions?: Array<{ id: string; questionCandidateId?: string | null; revision: number; changeType: string; changedBy?: string | null; createdAt: Date }>;
  providerRuns?: Array<{ providerKind: string; outputSummary: Prisma.JsonValue | null; confidence: number | null }>;
};

function reviewInsights(workspace: ReviewWorkspaceRecord) {
  const questionCandidates = "questionCandidates" in workspace && Array.isArray(workspace.questionCandidates) ? workspace.questionCandidates : [];
  const elements = "elements" in workspace && Array.isArray(workspace.elements) ? workspace.elements : [];
  const revisions = "revisions" in workspace && Array.isArray(workspace.revisions) ? workspace.revisions : [];
  const visualTypes = new Set(["FORMULA", "TABLE", "DIAGRAM", "GRAPH", "CHEMICAL_EQUATION"]);
  const visualElements = elements.filter((element) => visualTypes.has(element.elementType));
  const formulaElements = elements.filter((element) => element.elementType === "FORMULA");
  const tableElements = elements.filter((element) => element.elementType === "TABLE");
  const diagramElements = elements.filter((element) => ["DIAGRAM", "GRAPH", "IMAGE"].includes(element.elementType));
  const validation = latestValidation(workspace);
  const reviewQueue = questionCandidates
    .filter((candidate) => !["APPROVED", "REJECTED", "SKIPPED"].includes(candidate.reviewStatus))
    .map((candidate) => ({
      candidateId: candidate.id,
      questionNumber: candidate.questionNumber,
      confidence: candidate.confidence,
      band: confidenceBand(candidate.confidence),
      reviewStatus: candidate.reviewStatus,
      pageNumber: Number((candidate.sourceMap && typeof candidate.sourceMap === "object" && !Array.isArray(candidate.sourceMap) ? candidate.sourceMap as Record<string, unknown> : {}).firstPage || 1),
      issueCount: candidateIssues(candidate).length
    }));
  const heatmap = questionCandidates.map((candidate) => ({
    candidateId: candidate.id,
    questionNumber: candidate.questionNumber,
    confidence: candidate.confidence,
    band: confidenceBand(candidate.confidence),
    reviewStatus: candidate.reviewStatus,
    issueCount: candidateIssues(candidate).length
  }));
  const pageRisk = elements.reduce<Record<string, { pageNumber: number; lowConfidenceElements: number; visualElements: number }>>((acc, element) => {
    const key = String(element.pageNumber);
    acc[key] ??= { pageNumber: element.pageNumber, lowConfidenceElements: 0, visualElements: 0 };
    if (Number(element.confidence ?? 1) < 0.7) acc[key].lowConfidenceElements += 1;
    if (visualTypes.has(element.elementType)) acc[key].visualElements += 1;
    return acc;
  }, {});

  return {
    counts: {
      questions: questionCandidates.length,
      visualElements: visualElements.length,
      formulas: formulaElements.length,
      tables: tableElements.length,
      diagrams: diagramElements.length,
      answers: "answerKeyCandidates" in workspace && Array.isArray(workspace.answerKeyCandidates) ? workspace.answerKeyCandidates.length : 0,
      solutions: "solutionCandidates" in workspace && Array.isArray(workspace.solutionCandidates) ? workspace.solutionCandidates.length : 0,
      missingAnswers: validation.issues.filter((issue) => asRecord(issue).issueType === "MISSING_ANSWER").length,
      duplicateNumbering: validation.issues.filter((issue) => ["DUPLICATE_QUESTION", "BROKEN_NUMBERING"].includes(String(asRecord(issue).issueType))).length,
      missingDiagrams: validation.issues.filter((issue) => ["DIAGRAM_MISMATCH", "ORPHAN_VISUAL"].includes(String(asRecord(issue).issueType))).length,
      warnings: validation.warnings.length,
      reviewQueue: reviewQueue.length,
      revisions: revisions.length,
      ...statusCounts(questionCandidates)
    },
    dashboard: {
      overallConfidence: validation.confidence,
      riskLevel: Object.entries(asRecord(validation.metrics.riskDistribution)).sort((a, b) => Number(b[1]) - Number(a[1]))[0]?.[0] ?? "LOW",
      validationStatus: validation.publishReadiness.status ?? "PENDING",
      publishReadiness: validation.publishReadiness,
      recommendations: validation.recommendations,
      completion: completionStats(questionCandidates)
    },
    heatmap,
    reviewQueue,
    questionIssues: Object.fromEntries(questionCandidates.map((candidate) => [candidate.id, candidateIssues(candidate)])),
    formulas: formulaElements.map((element) => ({
      id: element.id,
      pageNumber: element.pageNumber,
      text: element.text,
      confidence: element.confidence,
      coordinates: element.coordinates,
      metadata: element.metadata,
      status: Number(element.confidence ?? 1) >= 0.78 ? "VERIFIED_CANDIDATE" : "NEEDS_CORRECTION"
    })),
    visuals: visualElements.map((element) => ({
      id: element.id,
      pageNumber: element.pageNumber,
      type: element.elementType,
      text: element.text,
      confidence: element.confidence,
      coordinates: element.coordinates,
      metadata: element.metadata,
      status: Number(element.confidence ?? 1) >= 0.72 ? "APPROVAL_CANDIDATE" : "NEEDS_REVIEW"
    })),
    answers: "answerKeyCandidates" in workspace && Array.isArray(workspace.answerKeyCandidates) ? workspace.answerKeyCandidates.map((answer) => ({
      id: answer.id,
      questionNumber: answer.questionNumber,
      answerJson: answer.answerJson,
      confidence: answer.confidence,
      status: answer.status
    })) : [],
    solutions: "solutionCandidates" in workspace && Array.isArray(workspace.solutionCandidates) ? workspace.solutionCandidates.map((solution) => ({
      id: solution.id,
      questionNumber: solution.questionNumber,
      solutionJson: solution.solutionJson,
      confidence: solution.confidence,
      status: solution.status
    })) : [],
    validation,
    pageRisk: Object.values(pageRisk).sort((a, b) => b.lowConfidenceElements - a.lowConfidenceElements || a.pageNumber - b.pageNumber),
    revisionSummary: revisions.slice(0, 10).map((revision) => ({
      id: revision.id,
      questionCandidateId: revision.questionCandidateId,
      revision: revision.revision,
      changeType: revision.changeType,
      changedBy: revision.changedBy,
      createdAt: revision.createdAt
    }))
  };
}

export const ndieReviewEngineService = {
  async getReviewWorkspace(importJobId: string) {
    const workspace = await prisma.ndieImportJob.findUnique({
      where: { id: importJobId },
      include: {
        sourceDocuments: true,
        pages: { orderBy: { pageNumber: "asc" } },
        assets: true,
        elements: { orderBy: [{ pageNumber: "asc" }, { readingOrder: "asc" }, { createdAt: "asc" }] },
        questionCandidates: { orderBy: [{ questionNumber: "asc" }, { createdAt: "asc" }] },
        answerKeyCandidates: { orderBy: [{ questionNumber: "asc" }, { createdAt: "asc" }] },
        solutionCandidates: { orderBy: [{ questionNumber: "asc" }, { createdAt: "asc" }] },
        reviewDecisions: { orderBy: { createdAt: "desc" } },
        revisions: { orderBy: { createdAt: "desc" } },
        qualityScores: { orderBy: { createdAt: "desc" }, take: 1 },
        providerRuns: { orderBy: { startedAt: "desc" }, take: 30 }
      }
    });
    if (!workspace) return null;
    return {
      ...workspace,
      reviewInsights: reviewInsights(workspace)
    };
  },

  async reviewCandidate(input: NdieReviewInput) {
    const candidate = await prisma.ndieQuestionCandidate.findUnique({ where: { id: input.candidateId } });
    if (!candidate) throw new Error("NDIE question candidate not found");
    const existingRevisions = await prisma.ndieRevision.findMany({
      where: { questionCandidateId: candidate.id },
      select: { revision: true }
    });
    const before = candidate.candidateJson as Prisma.InputJsonValue;
    const snapshot = (input.candidateJson ?? candidate.candidateJson) as Prisma.InputJsonValue;
    const reviewStatus = decisionStatus(input.decision);

    return prisma.$transaction(async (tx) => {
      const updated = await tx.ndieQuestionCandidate.update({
        where: { id: candidate.id },
        data: {
          candidateJson: snapshot,
          reviewStatus,
          status: input.decision === "APPROVED" ? "TEACHER_APPROVED" : input.decision === "REJECTED" ? "TEACHER_REJECTED" : input.decision === "SKIPPED" ? "TEACHER_SKIPPED" : "PENDING_REVIEW"
        }
      });

      const decision = await tx.ndieReviewDecision.create({
        data: {
          importJobId: candidate.importJobId,
          questionCandidateId: candidate.id,
          decision: input.decision,
          notes: input.notes || null,
          snapshot,
          reviewedBy: input.reviewedBy,
          reviewedByRole: input.reviewedByRole || null
        }
      });

      const revision = await tx.ndieRevision.create({
        data: {
          importJobId: candidate.importJobId,
          questionCandidateId: candidate.id,
          revision: nextRevision(existingRevisions),
          changeType: input.candidateJson ? "TEACHER_EDIT" : `TEACHER_${input.decision}`,
          changeReason: input.notes || null,
          snapshot: {
            before,
            after: snapshot,
            decision: input.decision,
            notes: input.notes || null
          } as Prisma.InputJsonValue,
          changedBy: input.reviewedBy,
          changedByRole: input.reviewedByRole || null
        }
      });

      const counts = await tx.ndieQuestionCandidate.groupBy({
        by: ["reviewStatus"],
        where: { importJobId: candidate.importJobId },
        _count: { _all: true }
      });

      await tx.ndieImportJob.update({
        where: { id: candidate.importJobId },
        data: {
          reviewStatus: counts.every((row) => ["APPROVED", "REJECTED", "SKIPPED"].includes(row.reviewStatus)) ? "REVIEWED" : "PENDING_REVIEW",
          teacherSummary: {
            reviewCounts: counts.reduce<Record<string, number>>((acc, row) => {
              acc[row.reviewStatus] = row._count._all;
              return acc;
            }, {}),
            lastDecision: input.decision
          } as Prisma.InputJsonValue
        }
      });

      return { candidate: updated, decision, revision };
    });
  },

  async bulkReview(input: NdieBulkReviewInput) {
    const candidates = await prisma.ndieQuestionCandidate.findMany({
      where: { importJobId: input.importJobId, id: { in: input.candidateIds } }
    });
    const results = [];
    for (const candidate of candidates) {
      results.push(await this.reviewCandidate({
        candidateId: candidate.id,
        decision: input.decision,
        notes: input.notes,
        reviewedBy: input.reviewedBy,
        reviewedByRole: input.reviewedByRole
      }));
    }
    return {
      importJobId: input.importJobId,
      decision: input.decision,
      requested: input.candidateIds.length,
      applied: results.length
    };
  },

  async saveReviewSession(input: NdieReviewSessionInput) {
    const importJob = await prisma.ndieImportJob.findUnique({ where: { id: input.importJobId } });
    if (!importJob) throw new Error("NDIE import not found");
    const previous = asRecord(importJob.teacherSummary);
    const reviewSession = {
      selectedCandidateId: input.selectedCandidateId ?? null,
      selectedPageNumber: input.selectedPageNumber ?? null,
      filters: input.filters ?? {},
      scroll: input.scroll ?? {},
      shortcuts: input.shortcuts ?? {},
      savedBy: input.savedBy,
      savedByRole: input.savedByRole ?? null,
      savedAt: new Date().toISOString()
    };
    return prisma.ndieImportJob.update({
      where: { id: input.importJobId },
      data: {
        teacherSummary: {
          ...previous,
          reviewSession
        } as Prisma.InputJsonValue
      }
    });
  }
};
