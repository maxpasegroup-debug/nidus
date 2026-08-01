import type { Prisma } from "../../../generated/prisma/client.js";
import { env } from "../../../config/env.js";
import { prisma } from "../../../config/prisma.js";
import type { OptionProvider, QuestionProvider } from "../contracts/providers.js";
import { createNdieContainer } from "../ndie.container.js";

const container = createNdieContainer();

function paragraphBlock(questionNumber: string, text: string, sourceMap: Record<string, unknown>) {
  return {
    id: `q-${questionNumber}-paragraph-1`,
    type: "ParagraphBlock",
    text,
    confidence: 0.7,
    sourceReference: {
      pageNumber: Number(sourceMap.firstPage || 1),
      coordinates: sourceMap.coordinates || { page: Number(sourceMap.firstPage || 1), x: 0, y: 0, width: 1, height: 1 }
    }
  };
}

function optionBlocks(questionNumber: string, options: Array<{ key: string; text: string; confidence: number }>) {
  return options.map((option) => ({
    id: `q-${questionNumber}-option-${option.key}`,
    type: "OptionBlock",
    key: option.key,
    confidence: option.confidence,
    blocks: [{
      id: `q-${questionNumber}-option-${option.key}-text`,
      type: "ParagraphBlock",
      text: option.text,
      confidence: option.confidence
    }]
  }));
}

export const ndieQuestionDetectorService = {
  async detectImport(importJobId: string) {
    const questionProvider = container.providerRegistry.get<QuestionProvider>(env.NDIE_QUESTION_PROVIDER);
    const optionProvider = container.providerRegistry.get<OptionProvider>(env.NDIE_OPTION_PROVIDER);
    if (!questionProvider) throw new Error(`NDIE question provider ${env.NDIE_QUESTION_PROVIDER} is not registered`);
    if (!optionProvider) throw new Error(`NDIE option provider ${env.NDIE_OPTION_PROVIDER} is not registered`);

    const elements = await prisma.ndieElement.findMany({
      where: { importJobId },
      orderBy: [{ pageNumber: "asc" }, { readingOrder: "asc" }, { createdAt: "asc" }]
    });

    const questionStartedAt = new Date();
    const questionResult = await questionProvider.detect({
      importJobId,
      elements: elements.map((element) => ({
        id: element.id,
        pageNumber: element.pageNumber,
        elementType: element.elementType,
        text: element.text,
        normalizedText: element.normalizedText,
        coordinates: element.coordinates,
        readingOrder: element.readingOrder,
        confidence: element.confidence,
        metadata: element.metadata
      }))
    });

    const optionStartedAt = new Date();
    const optionResult = await optionProvider.detect({
      importJobId,
      questions: questionResult.questions.map((question) => ({
        questionNumber: question.questionNumber,
        text: question.text,
        sourceElementIds: question.sourceElementIds,
        sourceMap: question.sourceMap
      }))
    });

    const optionsByQuestion = new Map(optionResult.optionsByQuestion.map((entry) => [entry.questionNumber, entry]));
    const candidateRows = questionResult.questions.map((question) => {
      const options = optionsByQuestion.get(question.questionNumber)?.options ?? [];
      const candidateJson = {
        schemaVersion: 1,
        format: "NIDUS_NDIE_EXTRACTION_CANDIDATE_V1",
        questionNumber: question.questionNumber,
        questionType: question.questionType,
        blocks: [
          paragraphBlock(question.questionNumber, question.text, question.sourceMap),
          ...optionBlocks(question.questionNumber, options)
        ],
        metadata: {
          sourceElementIds: question.sourceElementIds,
          optionCompleteness: options.length,
          requiresTeacherReview: options.length !== 4 || question.confidence < 0.8
        }
      };
      return {
        importJobId,
        questionNumber: question.questionNumber,
        questionType: question.questionType,
        candidateJson: candidateJson as Prisma.InputJsonValue,
        sourceMap: question.sourceMap as Prisma.InputJsonValue,
        confidence: Math.min(question.confidence, optionsByQuestion.get(question.questionNumber)?.confidence ?? 0.18),
        status: "PENDING_REVIEW",
        reviewStatus: "PENDING_REVIEW"
      };
    });

    await prisma.$transaction(async (tx) => {
      await tx.ndieQuestionCandidate.deleteMany({ where: { importJobId, approvedQuestionId: null } });
      if (candidateRows.length) await tx.ndieQuestionCandidate.createMany({ data: candidateRows });

      await tx.ndieProviderRun.create({
        data: {
          importJobId,
          providerId: questionProvider.id,
          providerKind: questionProvider.kind,
          stage: "QUESTIONS_DETECTED",
          status: "SUCCEEDED",
          inputSummary: { elements: elements.length },
          outputSummary: { questions: questionResult.questions.length } as Prisma.InputJsonValue,
          confidence: questionResult.confidence,
          startedAt: questionStartedAt,
          completedAt: new Date()
        }
      });

      await tx.ndieProviderRun.create({
        data: {
          importJobId,
          providerId: optionProvider.id,
          providerKind: optionProvider.kind,
          stage: "OPTIONS_DETECTED",
          status: "SUCCEEDED",
          inputSummary: { questions: questionResult.questions.length },
          outputSummary: { mappedQuestions: optionResult.optionsByQuestion.length } as Prisma.InputJsonValue,
          confidence: optionResult.confidence,
          startedAt: optionStartedAt,
          completedAt: new Date()
        }
      });

      await tx.ndieImportJob.update({
        where: { id: importJobId },
        data: {
          status: "OPTIONS_DETECTED",
          currentCheckpoint: "OPTIONS_DETECTED",
          teacherSummary: {
            questionCandidates: candidateRows.length,
            optionProvider: optionProvider.id,
            pendingReview: candidateRows.length
          } as Prisma.InputJsonValue
        }
      });
    });

    return {
      questionProvider: questionProvider.id,
      optionProvider: optionProvider.id,
      questionsDetected: candidateRows.length,
      optionsMapped: optionResult.optionsByQuestion.length
    };
  }
};
