import { prisma } from "../../config/prisma.js";
import { AssessmentReviewStatus, AssessmentStatus, type Prisma } from "../../generated/prisma/client.js";

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function optionalText(value: unknown) {
  const valueText = text(value);
  return valueText || undefined;
}

function numberValue(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function reviewStatus(value: unknown) {
  const normalized = text(value).toUpperCase();
  if (normalized in AssessmentReviewStatus) return normalized as AssessmentReviewStatus;
  return AssessmentReviewStatus.PENDING;
}

export const assessmentReviewWorkflowService = {
  async submit(input: Record<string, unknown>) {
    const assessmentId = text(input.assessmentId);
    const questionId = text(input.questionId);
    const reviewerRole = text(input.reviewerRole);
    if (!assessmentId || !questionId || !reviewerRole) throw new Error("assessmentId, questionId and reviewerRole are required");

    const review = await prisma.assessmentQuestionReview.create({
      data: {
        assessmentId,
        questionId,
        reviewerRole,
        reviewerId: optionalText(input.reviewerId),
        boardType: optionalText(input.boardType),
        status: reviewStatus(input.status),
        comments: optionalText(input.comments) ?? optionalText(input.reviewNotes),
        score: numberValue(input.score)
      },
      include: { question: true }
    });

    const nextQuestionStatus = this.questionStatusForReview(review.status);
    if (nextQuestionStatus) {
      await prisma.assessmentQuestion.update({
        where: { id: questionId },
        data: {
          status: nextQuestionStatus,
          reviewerId: optionalText(input.reviewerId),
          seniorReviewerId: optionalText(input.seniorReviewerId),
          approvalBoard: optionalText(input.boardType),
          reviewedAt: new Date(),
          approvedAt: review.status === AssessmentReviewStatus.APPROVED ? new Date() : undefined
        }
      });
    }

    return review;
  },

  async history(questionId: string) {
    return prisma.assessmentQuestionReview.findMany({
      where: { questionId },
      orderBy: { createdAt: "desc" },
      include: { assessment: { select: { id: true, name: true } } }
    });
  },

  questionStatusForReview(status: AssessmentReviewStatus): AssessmentStatus | null {
    if (status === AssessmentReviewStatus.APPROVED) return AssessmentStatus.APPROVED;
    if (status === AssessmentReviewStatus.REVISION_REQUIRED) return AssessmentStatus.REVIEW;
    if (status === AssessmentReviewStatus.REJECTED) return AssessmentStatus.DRAFT;
    return AssessmentStatus.REVIEW;
  },

  async createBoard(input: Record<string, unknown>) {
    const name = text(input.name);
    const boardType = text(input.boardType);
    if (!name || !boardType) throw new Error("name and boardType are required");
    return prisma.assessmentReviewBoard.create({
      data: {
        assessmentId: optionalText(input.assessmentId),
        name,
        boardType,
        responsibilities: input.responsibilities as Prisma.InputJsonValue,
        status: optionalText(input.status) ?? "ACTIVE"
      }
    });
  }
};
