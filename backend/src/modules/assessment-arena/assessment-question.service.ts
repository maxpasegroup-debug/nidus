import { prisma } from "../../config/prisma.js";
import { AssessmentStatus, type Prisma } from "../../generated/prisma/client.js";

const workflowAliases: Record<string, AssessmentStatus> = {
  DRAFT: AssessmentStatus.DRAFT,
  UNDER_REVIEW: AssessmentStatus.REVIEW,
  REVIEW: AssessmentStatus.REVIEW,
  REVISION_REQUIRED: AssessmentStatus.REVIEW,
  APPROVED: AssessmentStatus.APPROVED,
  PUBLISHED: AssessmentStatus.PUBLISHED,
  ARCHIVED: AssessmentStatus.DEPRECATED,
  DEPRECATED: AssessmentStatus.DEPRECATED,
  RETIRED: AssessmentStatus.RETIRED
};

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function optionalText(value: unknown) {
  const valueText = text(value);
  return valueText || undefined;
}

function numberValue(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function json(value: unknown): Prisma.InputJsonValue {
  if (value && typeof value === "object") return value as Prisma.InputJsonValue;
  return {};
}

function status(value: unknown, fallback: AssessmentStatus = AssessmentStatus.DRAFT) {
  const key = text(value).toUpperCase();
  return workflowAliases[key] ?? fallback;
}

async function createVersion(questionId: string, changedBy?: string, changeReason?: string) {
  const question = await prisma.assessmentQuestion.findUnique({
    where: { id: questionId },
    include: { options: { orderBy: { displayOrder: "asc" } } }
  });
  if (!question) throw new Error("Question not found");
  return prisma.assessmentQuestionVersion.create({
    data: {
      questionId: question.id,
      version: question.version,
      questionText: question.questionText,
      optionsSnapshot: json(question.options),
      metadataSnapshot: json({
        assessmentId: question.assessmentId,
        traitId: question.traitId,
        dimensionId: question.dimensionId,
        questionType: question.questionType,
        difficultyLevel: question.difficultyLevel,
        programRelevance: question.programRelevance,
        serviceRelevance: question.serviceRelevance,
        status: question.status
      }),
      changedBy,
      changeReason
    }
  });
}

export const assessmentQuestionManagementService = {
  list(input: {
    assessmentId?: string;
    traitId?: string;
    dimensionId?: string;
    status?: string;
    q?: string;
  }) {
    return prisma.assessmentQuestion.findMany({
      where: {
        assessmentId: input.assessmentId,
        traitId: input.traitId,
        dimensionId: input.dimensionId,
        status: input.status ? status(input.status) : undefined,
        questionText: input.q ? { contains: input.q, mode: "insensitive" } : undefined
      },
      orderBy: [{ updatedAt: "desc" }],
      include: {
        assessment: { select: { id: true, name: true, slug: true } },
        trait: true,
        dimension: true,
        options: { orderBy: { displayOrder: "asc" } },
        reviews: { take: 5, orderBy: { createdAt: "desc" } },
        _count: { select: { versions: true, exposures: true, answers: true, reviews: true } }
      }
    });
  },

  get(id: string) {
    return prisma.assessmentQuestion.findUnique({
      where: { id },
      include: {
        assessment: true,
        trait: true,
        dimension: true,
        options: { orderBy: { displayOrder: "asc" } },
        versions: { orderBy: { version: "desc" } },
        reviews: { orderBy: { createdAt: "desc" } },
        _count: { select: { exposures: true, answers: true } }
      }
    });
  },

  async create(input: Record<string, unknown>) {
    const assessmentId = text(input.assessmentId);
    const traitId = text(input.traitId);
    const dimensionId = text(input.dimensionId);
    const questionText = text(input.questionText);
    const questionType = text(input.questionType);
    if (!assessmentId || !traitId || !dimensionId || !questionText || !questionType) {
      throw new Error("assessmentId, traitId, dimensionId, questionText and questionType are required");
    }

    const question = await prisma.assessmentQuestion.create({
      data: {
        assessmentId,
        traitId,
        dimensionId,
        questionText,
        instructionText: optionalText(input.instructionText),
        questionType: questionType as Prisma.AssessmentQuestionUncheckedCreateInput["questionType"],
        difficultyLevel: numberValue(input.difficultyLevel, 1),
        programRelevance: json(input.programRelevance),
        serviceRelevance: json(input.serviceRelevance),
        authorId: optionalText(input.authorId),
        authorRole: optionalText(input.authorRole),
        status: status(input.status)
      }
    });

    const options = Array.isArray(input.options) ? input.options : [];
    for (const [index, option] of options.entries()) {
      if (!option || typeof option !== "object") continue;
      const optionRecord = option as Record<string, unknown>;
      const optionText = text(optionRecord.optionText);
      if (!optionText) continue;
      await prisma.assessmentQuestionOption.create({
        data: {
          questionId: question.id,
          optionText,
          displayOrder: numberValue(optionRecord.displayOrder, index + 1),
          rawScore: numberValue(optionRecord.rawScore),
          reverseScore: optionRecord.reverseScore === undefined ? undefined : numberValue(optionRecord.reverseScore),
          integrityWeight: numberValue(optionRecord.integrityWeight),
          riskWeight: numberValue(optionRecord.riskWeight),
          readinessWeight: numberValue(optionRecord.readinessWeight, 1),
          dimensionWeight: numberValue(optionRecord.dimensionWeight, 1),
          traitWeight: numberValue(optionRecord.traitWeight, 1),
          flags: optionRecord.flags === undefined ? undefined : json(optionRecord.flags),
          interpretationHint: optionalText(optionRecord.interpretationHint)
        }
      });
    }

    return this.get(question.id);
  },

  async update(id: string, input: Record<string, unknown>) {
    const current = await this.get(id);
    if (!current) throw new Error("Question not found");
    await createVersion(id, optionalText(input.changedBy), optionalText(input.changeReason) ?? "Question updated");
    await prisma.assessmentQuestion.update({
      where: { id },
      data: {
        assessmentId: optionalText(input.assessmentId),
        traitId: optionalText(input.traitId),
        dimensionId: optionalText(input.dimensionId),
        questionText: optionalText(input.questionText),
        instructionText: optionalText(input.instructionText),
        questionType: input.questionType as Prisma.AssessmentQuestionUpdateInput["questionType"],
        difficultyLevel: input.difficultyLevel === undefined ? undefined : numberValue(input.difficultyLevel, current.difficultyLevel),
        programRelevance: input.programRelevance === undefined ? undefined : json(input.programRelevance),
        serviceRelevance: input.serviceRelevance === undefined ? undefined : json(input.serviceRelevance),
        authorId: optionalText(input.authorId),
        authorRole: optionalText(input.authorRole),
        status: input.status === undefined ? undefined : status(input.status, current.status),
        version: { increment: 1 }
      }
    });
    return this.get(id);
  },

  async clone(id: string, input: Record<string, unknown>) {
    const source = await this.get(id);
    if (!source) throw new Error("Question not found");
    const question = await prisma.assessmentQuestion.create({
      data: {
        assessmentId: optionalText(input.assessmentId) ?? source.assessmentId,
        traitId: optionalText(input.traitId) ?? source.traitId,
        dimensionId: optionalText(input.dimensionId) ?? source.dimensionId,
        questionText: optionalText(input.questionText) ?? `${source.questionText} (Clone)`,
        instructionText: source.instructionText,
        questionType: source.questionType,
        difficultyLevel: source.difficultyLevel,
        programRelevance: json(source.programRelevance),
        serviceRelevance: json(source.serviceRelevance),
        authorId: optionalText(input.authorId) ?? source.authorId,
        authorRole: optionalText(input.authorRole) ?? source.authorRole,
        status: AssessmentStatus.DRAFT
      }
    });
    await prisma.assessmentQuestionOption.createMany({
      data: source.options.map((option) => ({
        questionId: question.id,
        optionText: option.optionText,
        displayOrder: option.displayOrder,
        rawScore: option.rawScore,
        reverseScore: option.reverseScore,
        integrityWeight: option.integrityWeight,
        riskWeight: option.riskWeight,
        readinessWeight: option.readinessWeight,
        dimensionWeight: option.dimensionWeight,
        traitWeight: option.traitWeight,
        flags: option.flags === null ? undefined : option.flags,
        interpretationHint: option.interpretationHint
      }))
    });
    return this.get(question.id);
  },

  async transition(id: string, nextStatus: AssessmentStatus, input: Record<string, unknown> = {}) {
    const current = await this.get(id);
    if (!current) throw new Error("Question not found");
    const allowed = this.allowedTransitions(current.status);
    if (!allowed.includes(nextStatus)) throw new Error(`Cannot transition question from ${current.status} to ${nextStatus}`);
    await createVersion(id, optionalText(input.changedBy), optionalText(input.reason) ?? `Question transitioned to ${nextStatus}`);
    await prisma.assessmentQuestion.update({
      where: { id },
      data: {
        status: nextStatus,
        version: { increment: 1 },
        reviewedAt: nextStatus === AssessmentStatus.APPROVED ? new Date() : undefined,
        approvedAt: nextStatus === AssessmentStatus.APPROVED || nextStatus === AssessmentStatus.PUBLISHED ? new Date() : undefined,
        publishedAt: nextStatus === AssessmentStatus.PUBLISHED ? new Date() : undefined,
        retiredAt: nextStatus === AssessmentStatus.RETIRED ? new Date() : undefined,
        retirementReason: nextStatus === AssessmentStatus.RETIRED ? optionalText(input.reason) : undefined
      }
    });
    return this.get(id);
  },

  allowedTransitions(current: AssessmentStatus) {
    const transitions: Record<AssessmentStatus, AssessmentStatus[]> = {
      [AssessmentStatus.DRAFT]: [AssessmentStatus.REVIEW, AssessmentStatus.DEPRECATED, AssessmentStatus.RETIRED],
      [AssessmentStatus.REVIEW]: [AssessmentStatus.DRAFT, AssessmentStatus.APPROVED, AssessmentStatus.DEPRECATED, AssessmentStatus.RETIRED],
      [AssessmentStatus.PILOT]: [AssessmentStatus.APPROVED, AssessmentStatus.DEPRECATED, AssessmentStatus.RETIRED],
      [AssessmentStatus.APPROVED]: [AssessmentStatus.REVIEW, AssessmentStatus.PUBLISHED, AssessmentStatus.DEPRECATED, AssessmentStatus.RETIRED],
      [AssessmentStatus.PUBLISHED]: [AssessmentStatus.DEPRECATED, AssessmentStatus.RETIRED],
      [AssessmentStatus.DEPRECATED]: [AssessmentStatus.DRAFT, AssessmentStatus.RETIRED],
      [AssessmentStatus.RETIRED]: [AssessmentStatus.DRAFT]
    };
    return transitions[current] ?? [];
  },

  archive: (id: string, input?: Record<string, unknown>) => assessmentQuestionManagementService.transition(id, AssessmentStatus.DEPRECATED, input),
  retire: (id: string, input?: Record<string, unknown>) => assessmentQuestionManagementService.transition(id, AssessmentStatus.RETIRED, input),
  restore: (id: string, input?: Record<string, unknown>) => assessmentQuestionManagementService.transition(id, AssessmentStatus.DRAFT, input)
};
