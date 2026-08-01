import type { Prisma } from "../../../generated/prisma/client.js";
import { prisma } from "../../../config/prisma.js";

export type NdieReviewInput = {
  candidateId: string;
  decision: "APPROVED" | "REJECTED" | "NEEDS_EDIT";
  notes?: string;
  candidateJson?: unknown;
  reviewedBy: string;
  reviewedByRole?: string;
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

function reviewInsights(workspace: NonNullable<Awaited<ReturnType<typeof prisma.ndieImportJob.findUnique>>>) {
  const questionCandidates = "questionCandidates" in workspace && Array.isArray(workspace.questionCandidates) ? workspace.questionCandidates : [];
  const elements = "elements" in workspace && Array.isArray(workspace.elements) ? workspace.elements : [];
  const revisions = "revisions" in workspace && Array.isArray(workspace.revisions) ? workspace.revisions : [];
  const visualTypes = new Set(["FORMULA", "TABLE", "DIAGRAM", "GRAPH", "CHEMICAL_EQUATION"]);
  const visualElements = elements.filter((element) => visualTypes.has(element.elementType));
  const reviewQueue = questionCandidates
    .filter((candidate) => !["APPROVED", "REJECTED"].includes(candidate.reviewStatus))
    .map((candidate) => ({
      candidateId: candidate.id,
      questionNumber: candidate.questionNumber,
      confidence: candidate.confidence,
      band: confidenceBand(candidate.confidence),
      reviewStatus: candidate.reviewStatus,
      pageNumber: Number((candidate.sourceMap && typeof candidate.sourceMap === "object" && !Array.isArray(candidate.sourceMap) ? candidate.sourceMap as Record<string, unknown> : {}).firstPage || 1)
    }));
  const heatmap = questionCandidates.map((candidate) => ({
    candidateId: candidate.id,
    questionNumber: candidate.questionNumber,
    confidence: candidate.confidence,
    band: confidenceBand(candidate.confidence),
    reviewStatus: candidate.reviewStatus
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
      reviewQueue: reviewQueue.length,
      revisions: revisions.length,
      ...statusCounts(questionCandidates)
    },
    heatmap,
    reviewQueue,
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
    const snapshot = (input.candidateJson ?? candidate.candidateJson) as Prisma.InputJsonValue;
    const reviewStatus = input.decision === "APPROVED" ? "APPROVED" : input.decision === "REJECTED" ? "REJECTED" : "NEEDS_EDIT";

    return prisma.$transaction(async (tx) => {
      const updated = await tx.ndieQuestionCandidate.update({
        where: { id: candidate.id },
        data: {
          candidateJson: snapshot,
          reviewStatus,
          status: input.decision === "APPROVED" ? "TEACHER_APPROVED" : input.decision === "REJECTED" ? "TEACHER_REJECTED" : "PENDING_REVIEW"
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
          snapshot,
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
          reviewStatus: counts.every((row) => row.reviewStatus === "APPROVED" || row.reviewStatus === "REJECTED") ? "REVIEWED" : "PENDING_REVIEW",
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
  }
};
