import type { AssessmentQuestion, AssessmentQuestionOption, AssessmentTrait, AssessmentDimension, Prisma } from "../../generated/prisma/client.js";

type SnapshotQuestion = AssessmentQuestion & {
  trait: AssessmentTrait;
  dimension: AssessmentDimension;
  options: AssessmentQuestionOption[];
};

function json(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

export const assessmentSnapshotService = {
  question(question: SnapshotQuestion): Prisma.InputJsonValue {
    return json({
      id: question.id,
      version: question.version,
      questionText: question.questionText,
      instructionText: question.instructionText,
      questionType: question.questionType,
      difficultyLevel: question.difficultyLevel,
      programRelevance: question.programRelevance,
      serviceRelevance: question.serviceRelevance,
      trait: {
        id: question.trait.id,
        name: question.trait.name,
        weight: question.trait.weight,
        priority: question.trait.priority,
        isMandatory: question.trait.isMandatory,
        isCritical: question.trait.isCritical
      },
      dimension: {
        id: question.dimension.id,
        name: question.dimension.name,
        weight: question.dimension.weight,
        priority: question.dimension.priority
      },
      snapshottedAt: new Date().toISOString()
    });
  },

  options(question: SnapshotQuestion): Prisma.InputJsonValue {
    return json(question.options.map((option) => ({
      id: option.id,
      optionText: option.optionText,
      displayOrder: option.displayOrder,
      rawScore: option.rawScore,
      reverseScore: option.reverseScore,
      integrityWeight: option.integrityWeight,
      riskWeight: option.riskWeight,
      readinessWeight: option.readinessWeight,
      dimensionWeight: option.dimensionWeight,
      traitWeight: option.traitWeight,
      flags: option.flags,
      interpretationHint: option.interpretationHint
    })));
  }
};
