import { AssessmentReviewStatus, AssessmentStatus, type Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../config/prisma.js";

const assessmentInclude = {
  _count: {
    select: {
      traits: true,
      dimensions: true,
      questions: true,
      attempts: true,
      pilotRuns: true
    }
  }
} satisfies Prisma.AssessmentArenaAssessmentInclude;

export const assessmentRepository = {
  list() {
    return prisma.assessmentArenaAssessment.findMany({
      orderBy: [{ level: "asc" }, { name: "asc" }],
      include: assessmentInclude
    });
  },

  get(id: string) {
    return prisma.assessmentArenaAssessment.findUnique({
      where: { id },
      include: {
        traits: { orderBy: { name: "asc" }, include: { dimensions: { orderBy: { name: "asc" } } } },
        dimensions: { orderBy: { name: "asc" } },
        questions: { take: 25, orderBy: { createdAt: "desc" } },
        pilotRuns: { take: 10, orderBy: { createdAt: "desc" } },
        _count: { select: { questions: true, attempts: true, reviews: true } }
      }
    });
  },

  create(data: Prisma.AssessmentArenaAssessmentCreateInput) {
    return prisma.assessmentArenaAssessment.create({ data, include: assessmentInclude });
  },

  update(id: string, data: Prisma.AssessmentArenaAssessmentUpdateInput) {
    return prisma.assessmentArenaAssessment.update({ where: { id }, data, include: assessmentInclude });
  }
};

export const traitRepository = {
  list(assessmentId?: string) {
    return prisma.assessmentTrait.findMany({
      where: assessmentId ? { assessmentId } : undefined,
      orderBy: [{ assessmentId: "asc" }, { name: "asc" }],
      include: { dimensions: { orderBy: { name: "asc" } } }
    });
  },

  create(data: Prisma.AssessmentTraitUncheckedCreateInput) {
    return prisma.assessmentTrait.create({ data });
  },

  update(id: string, data: Prisma.AssessmentTraitUpdateInput) {
    return prisma.assessmentTrait.update({ where: { id }, data });
  }
};

export const dimensionRepository = {
  list(input: { assessmentId?: string; traitId?: string }) {
    return prisma.assessmentDimension.findMany({
      where: {
        assessmentId: input.assessmentId,
        traitId: input.traitId
      },
      orderBy: [{ assessmentId: "asc" }, { name: "asc" }],
      include: { trait: true }
    });
  },

  create(data: Prisma.AssessmentDimensionUncheckedCreateInput) {
    return prisma.assessmentDimension.create({ data });
  },

  update(id: string, data: Prisma.AssessmentDimensionUpdateInput) {
    return prisma.assessmentDimension.update({ where: { id }, data });
  }
};

export const questionRepository = {
  list(input: { assessmentId?: string; traitId?: string; dimensionId?: string; status?: AssessmentStatus }) {
    return prisma.assessmentQuestion.findMany({
      where: {
        assessmentId: input.assessmentId,
        traitId: input.traitId,
        dimensionId: input.dimensionId,
        status: input.status
      },
      orderBy: [{ updatedAt: "desc" }],
      include: {
        trait: true,
        dimension: true,
        options: { orderBy: { displayOrder: "asc" } },
        _count: { select: { reviews: true, versions: true, exposures: true } }
      }
    });
  },

  create(data: Prisma.AssessmentQuestionUncheckedCreateInput) {
    return prisma.assessmentQuestion.create({ data, include: { options: true } });
  },

  update(id: string, data: Prisma.AssessmentQuestionUpdateInput) {
    return prisma.assessmentQuestion.update({ where: { id }, data, include: { options: true } });
  },

  createOption(data: Prisma.AssessmentQuestionOptionUncheckedCreateInput) {
    return prisma.assessmentQuestionOption.create({ data });
  },

  createVersion(data: Prisma.AssessmentQuestionVersionUncheckedCreateInput) {
    return prisma.assessmentQuestionVersion.create({ data });
  }
};

export const reviewRepository = {
  list(input: { assessmentId?: string; questionId?: string; status?: AssessmentReviewStatus }) {
    return prisma.assessmentQuestionReview.findMany({
      where: {
        assessmentId: input.assessmentId,
        questionId: input.questionId,
        status: input.status
      },
      orderBy: { createdAt: "desc" },
      include: { question: true, assessment: true }
    });
  },

  create(data: Prisma.AssessmentQuestionReviewUncheckedCreateInput) {
    return prisma.assessmentQuestionReview.create({ data });
  },

  update(id: string, data: Prisma.AssessmentQuestionReviewUpdateInput) {
    return prisma.assessmentQuestionReview.update({ where: { id }, data });
  },

  listBoards() {
    return prisma.assessmentReviewBoard.findMany({ orderBy: [{ boardType: "asc" }, { name: "asc" }] });
  },

  createBoard(data: Prisma.AssessmentReviewBoardUncheckedCreateInput) {
    return prisma.assessmentReviewBoard.create({ data });
  }
};

export const pilotRepository = {
  list(assessmentId?: string) {
    return prisma.assessmentPilotRun.findMany({
      where: assessmentId ? { assessmentId } : undefined,
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { responses: true } } }
    });
  },

  create(data: Prisma.AssessmentPilotRunUncheckedCreateInput) {
    return prisma.assessmentPilotRun.create({ data });
  },

  update(id: string, data: Prisma.AssessmentPilotRunUpdateInput) {
    return prisma.assessmentPilotRun.update({ where: { id }, data });
  },

  createResponse(data: Prisma.AssessmentPilotResponseUncheckedCreateInput) {
    return prisma.assessmentPilotResponse.create({ data });
  }
};

export const attemptRepository = {
  list(assessmentId?: string) {
    return prisma.assessmentAttempt.findMany({
      where: assessmentId ? { assessmentId } : undefined,
      orderBy: { startedAt: "desc" },
      include: {
        assessment: { select: { id: true, name: true, slug: true } },
        _count: { select: { attemptQuestions: true, answers: true, reportSnapshots: true } }
      }
    });
  },

  get(id: string) {
    return prisma.assessmentAttempt.findUnique({
      where: { id },
      include: {
        assessment: true,
        attemptQuestions: { orderBy: { displayOrder: "asc" } },
        answers: true,
        traitScores: true,
        dimensionScores: true,
        integritySignals: true,
        riskSignals: true,
        reportSnapshots: true
      }
    });
  }
};
