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

export const ndieReviewEngineService = {
  async getReviewWorkspace(importJobId: string) {
    return prisma.ndieImportJob.findUnique({
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
