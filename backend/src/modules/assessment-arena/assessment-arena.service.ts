import { AssessmentReviewStatus, AssessmentStatus, type Prisma } from "../../generated/prisma/client.js";
import {
  assessmentRepository,
  attemptRepository,
  dimensionRepository,
  pilotRepository,
  questionRepository,
  reviewRepository,
  traitRepository
} from "./assessment-arena.repository.js";

const emptyRelevance = {};

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function optionalText(value: unknown) {
  const trimmed = text(value);
  return trimmed || undefined;
}

function numberValue(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function booleanValue(value: unknown, fallback = false) {
  return typeof value === "boolean" ? value : fallback;
}

function jsonValue(value: unknown): Prisma.InputJsonValue {
  if (value && typeof value === "object") return value as Prisma.InputJsonValue;
  return emptyRelevance;
}

export const assessmentArenaService = {
  assessments: {
    list: () => assessmentRepository.list(),
    get: (id: string) => assessmentRepository.get(id),
    create(input: Record<string, unknown>) {
      const name = text(input.name);
      const slug = text(input.slug);
      const level = text(input.level);
      const purpose = text(input.purpose);
      if (!name || !slug || !level || !purpose) throw new Error("name, slug, level and purpose are required");
      return assessmentRepository.create({
        name,
        slug,
        level,
        purpose,
        description: optionalText(input.description),
        status: input.status as Prisma.AssessmentArenaAssessmentCreateInput["status"],
        recommendedMinutes: input.recommendedMinutes === undefined ? undefined : numberValue(input.recommendedMinutes),
        minimumQuestionBank: numberValue(input.minimumQuestionBank),
        recommendedQuestionBank: numberValue(input.recommendedQuestionBank),
        idealQuestionBank: numberValue(input.idealQuestionBank),
        questionsPerAttempt: numberValue(input.questionsPerAttempt)
      });
    },
    update(id: string, input: Record<string, unknown>) {
      return assessmentRepository.update(id, {
        name: optionalText(input.name),
        slug: optionalText(input.slug),
        level: optionalText(input.level),
        purpose: optionalText(input.purpose),
        description: optionalText(input.description),
        status: input.status as Prisma.AssessmentArenaAssessmentUpdateInput["status"],
        recommendedMinutes: input.recommendedMinutes === undefined ? undefined : numberValue(input.recommendedMinutes),
        minimumQuestionBank: input.minimumQuestionBank === undefined ? undefined : numberValue(input.minimumQuestionBank),
        recommendedQuestionBank: input.recommendedQuestionBank === undefined ? undefined : numberValue(input.recommendedQuestionBank),
        idealQuestionBank: input.idealQuestionBank === undefined ? undefined : numberValue(input.idealQuestionBank),
        questionsPerAttempt: input.questionsPerAttempt === undefined ? undefined : numberValue(input.questionsPerAttempt)
      });
    }
  },

  traits: {
    list: (assessmentId?: string) => traitRepository.list(assessmentId),
    create(input: Record<string, unknown>) {
      const assessmentId = text(input.assessmentId);
      const name = text(input.name);
      if (!assessmentId || !name) throw new Error("assessmentId and name are required");
      return traitRepository.create({
        assessmentId,
        name,
        definition: optionalText(input.definition),
        weight: numberValue(input.weight),
        priority: optionalText(input.priority) ?? "NORMAL",
        isMandatory: booleanValue(input.isMandatory),
        isCritical: booleanValue(input.isCritical)
      });
    },
    update(id: string, input: Record<string, unknown>) {
      return traitRepository.update(id, {
        name: optionalText(input.name),
        definition: optionalText(input.definition),
        weight: input.weight === undefined ? undefined : numberValue(input.weight),
        priority: optionalText(input.priority),
        isMandatory: input.isMandatory === undefined ? undefined : booleanValue(input.isMandatory),
        isCritical: input.isCritical === undefined ? undefined : booleanValue(input.isCritical)
      });
    }
  },

  dimensions: {
    list: (input: { assessmentId?: string; traitId?: string }) => dimensionRepository.list(input),
    create(input: Record<string, unknown>) {
      const assessmentId = text(input.assessmentId);
      const traitId = text(input.traitId);
      const name = text(input.name);
      if (!assessmentId || !traitId || !name) throw new Error("assessmentId, traitId and name are required");
      return dimensionRepository.create({
        assessmentId,
        traitId,
        name,
        definition: optionalText(input.definition),
        weight: numberValue(input.weight),
        priority: optionalText(input.priority) ?? "NORMAL",
        minimumQuestions: numberValue(input.minimumQuestions),
        recommendedQuestions: numberValue(input.recommendedQuestions),
        idealQuestions: numberValue(input.idealQuestions)
      });
    },
    update(id: string, input: Record<string, unknown>) {
      return dimensionRepository.update(id, {
        name: optionalText(input.name),
        definition: optionalText(input.definition),
        weight: input.weight === undefined ? undefined : numberValue(input.weight),
        priority: optionalText(input.priority),
        minimumQuestions: input.minimumQuestions === undefined ? undefined : numberValue(input.minimumQuestions),
        recommendedQuestions: input.recommendedQuestions === undefined ? undefined : numberValue(input.recommendedQuestions),
        idealQuestions: input.idealQuestions === undefined ? undefined : numberValue(input.idealQuestions)
      });
    }
  },

  questions: {
    list: (input: { assessmentId?: string; traitId?: string; dimensionId?: string; status?: string }) => questionRepository.list({
      ...input,
      status: input.status as AssessmentStatus | undefined
    }),
    create(input: Record<string, unknown>) {
      const assessmentId = text(input.assessmentId);
      const traitId = text(input.traitId);
      const dimensionId = text(input.dimensionId);
      const questionText = text(input.questionText);
      const questionType = text(input.questionType);
      if (!assessmentId || !traitId || !dimensionId || !questionText || !questionType) {
        throw new Error("assessmentId, traitId, dimensionId, questionText and questionType are required");
      }
      return questionRepository.create({
        assessmentId,
        traitId,
        dimensionId,
        questionText,
        instructionText: optionalText(input.instructionText),
        questionType: questionType as Prisma.AssessmentQuestionUncheckedCreateInput["questionType"],
        difficultyLevel: numberValue(input.difficultyLevel, 1),
        programRelevance: jsonValue(input.programRelevance),
        serviceRelevance: jsonValue(input.serviceRelevance),
        version: numberValue(input.version, 1),
        status: input.status as Prisma.AssessmentQuestionUncheckedCreateInput["status"],
        authorId: optionalText(input.authorId),
        authorRole: optionalText(input.authorRole)
      });
    },
    update(id: string, input: Record<string, unknown>) {
      return questionRepository.update(id, {
        questionText: optionalText(input.questionText),
        instructionText: optionalText(input.instructionText),
        questionType: input.questionType as Prisma.AssessmentQuestionUpdateInput["questionType"],
        difficultyLevel: input.difficultyLevel === undefined ? undefined : numberValue(input.difficultyLevel, 1),
        programRelevance: input.programRelevance === undefined ? undefined : jsonValue(input.programRelevance),
        serviceRelevance: input.serviceRelevance === undefined ? undefined : jsonValue(input.serviceRelevance),
        status: input.status as Prisma.AssessmentQuestionUpdateInput["status"],
        reviewerId: optionalText(input.reviewerId),
        seniorReviewerId: optionalText(input.seniorReviewerId),
        approvalBoard: optionalText(input.approvalBoard),
        retirementReason: optionalText(input.retirementReason)
      });
    },
    createOption(input: Record<string, unknown>) {
      const questionId = text(input.questionId);
      const optionText = text(input.optionText);
      if (!questionId || !optionText) throw new Error("questionId and optionText are required");
      return questionRepository.createOption({
        questionId,
        optionText,
        displayOrder: numberValue(input.displayOrder, 1),
        rawScore: numberValue(input.rawScore),
        reverseScore: input.reverseScore === undefined ? undefined : numberValue(input.reverseScore),
        integrityWeight: numberValue(input.integrityWeight),
        riskWeight: numberValue(input.riskWeight),
        readinessWeight: numberValue(input.readinessWeight, 1),
        dimensionWeight: numberValue(input.dimensionWeight, 1),
        traitWeight: numberValue(input.traitWeight, 1),
        flags: input.flags === undefined ? undefined : jsonValue(input.flags),
        interpretationHint: optionalText(input.interpretationHint)
      });
    },
    createVersion(input: Record<string, unknown>) {
      const questionId = text(input.questionId);
      const questionText = text(input.questionText);
      if (!questionId || !questionText) throw new Error("questionId and questionText are required");
      return questionRepository.createVersion({
        questionId,
        version: numberValue(input.version, 1),
        questionText,
        optionsSnapshot: input.optionsSnapshot === undefined ? undefined : jsonValue(input.optionsSnapshot),
        metadataSnapshot: jsonValue(input.metadataSnapshot),
        changedBy: optionalText(input.changedBy),
        changeReason: optionalText(input.changeReason)
      });
    }
  },

  reviews: {
    list: (input: { assessmentId?: string; questionId?: string; status?: string }) => reviewRepository.list({
      ...input,
      status: input.status as AssessmentReviewStatus | undefined
    }),
    create(input: Record<string, unknown>) {
      const assessmentId = text(input.assessmentId);
      const questionId = text(input.questionId);
      const reviewerRole = text(input.reviewerRole);
      if (!assessmentId || !questionId || !reviewerRole) throw new Error("assessmentId, questionId and reviewerRole are required");
      return reviewRepository.create({
        assessmentId,
        questionId,
        reviewerRole,
        reviewerId: optionalText(input.reviewerId),
        boardType: optionalText(input.boardType),
        status: input.status as Prisma.AssessmentQuestionReviewUncheckedCreateInput["status"],
        comments: optionalText(input.comments),
        score: input.score === undefined ? undefined : numberValue(input.score)
      });
    },
    update: (id: string, input: Record<string, unknown>) => reviewRepository.update(id, {
      status: input.status as Prisma.AssessmentQuestionReviewUpdateInput["status"],
      comments: optionalText(input.comments),
      score: input.score === undefined ? undefined : numberValue(input.score)
    }),
    listBoards: () => reviewRepository.listBoards(),
    createBoard(input: Record<string, unknown>) {
      const name = text(input.name);
      const boardType = text(input.boardType);
      if (!name || !boardType) throw new Error("name and boardType are required");
      return reviewRepository.createBoard({
        assessmentId: optionalText(input.assessmentId),
        name,
        boardType,
        responsibilities: input.responsibilities === undefined ? undefined : jsonValue(input.responsibilities),
        status: optionalText(input.status) ?? "ACTIVE"
      });
    }
  },

  pilots: {
    list: (assessmentId?: string) => pilotRepository.list(assessmentId),
    create(input: Record<string, unknown>) {
      const assessmentId = text(input.assessmentId);
      const name = text(input.name);
      if (!assessmentId || !name) throw new Error("assessmentId and name are required");
      return pilotRepository.create({
        assessmentId,
        name,
        status: optionalText(input.status) ?? "PLANNED",
        sampleSize: numberValue(input.sampleSize),
        validationMetrics: input.validationMetrics === undefined ? undefined : jsonValue(input.validationMetrics),
        acceptanceNotes: optionalText(input.acceptanceNotes)
      });
    },
    update: (id: string, input: Record<string, unknown>) => pilotRepository.update(id, {
      status: optionalText(input.status),
      sampleSize: input.sampleSize === undefined ? undefined : numberValue(input.sampleSize),
      validationMetrics: input.validationMetrics === undefined ? undefined : jsonValue(input.validationMetrics),
      acceptanceNotes: optionalText(input.acceptanceNotes)
    }),
    createResponse(input: Record<string, unknown>) {
      const pilotRunId = text(input.pilotRunId);
      if (!pilotRunId) throw new Error("pilotRunId is required");
      return pilotRepository.createResponse({
        pilotRunId,
        questionId: optionalText(input.questionId),
        participantId: optionalText(input.participantId),
        response: jsonValue(input.response),
        metrics: input.metrics === undefined ? undefined : jsonValue(input.metrics)
      });
    }
  },

  attempts: {
    list: (assessmentId?: string) => attemptRepository.list(assessmentId),
    get: (id: string) => attemptRepository.get(id)
  }
};
