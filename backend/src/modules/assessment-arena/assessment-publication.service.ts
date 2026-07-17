import { prisma } from "../../config/prisma.js";
import { AssessmentStatus } from "../../generated/prisma/client.js";
import { optionalText } from "./assessment-input.js";
import { assessmentQuestionManagementService } from "./assessment-question.service.js";

export const assessmentPublicationService = {
  async submitForReview(id: string, input: Record<string, unknown> = {}) {
    return assessmentQuestionManagementService.transition(id, AssessmentStatus.REVIEW, input);
  },

  async approve(id: string, input: Record<string, unknown> = {}) {
    return assessmentQuestionManagementService.transition(id, AssessmentStatus.APPROVED, input);
  },

  async publish(id: string, input: Record<string, unknown> = {}) {
    const question = await prisma.assessmentQuestion.findUnique({
      where: { id },
      include: { options: true, reviews: { orderBy: { createdAt: "desc" }, take: 5 } }
    });
    if (!question) throw new Error("Question not found");
    if (question.status !== AssessmentStatus.APPROVED) throw new Error("Only approved questions can be published");
    if (!question.options.length) throw new Error("Question must have answer options before publication");
    return assessmentQuestionManagementService.transition(id, AssessmentStatus.PUBLISHED, {
      ...input,
      reason: optionalText(input.reason) ?? "Question published"
    });
  },

  async retire(id: string, input: Record<string, unknown> = {}) {
    return assessmentQuestionManagementService.retire(id, input);
  },

  async archive(id: string, input: Record<string, unknown> = {}) {
    return assessmentQuestionManagementService.archive(id, input);
  },

  async restore(id: string, input: Record<string, unknown> = {}) {
    return assessmentQuestionManagementService.restore(id, input);
  }
};
