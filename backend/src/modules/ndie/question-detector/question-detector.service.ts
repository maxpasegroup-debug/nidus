import type { Prisma } from "../../../generated/prisma/client.js";
import { env } from "../../../config/env.js";
import { prisma } from "../../../config/prisma.js";
import { logger } from "../../../utils/logger.js";
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
  async health() {
    const questionProvider = container.providerRegistry.get<QuestionProvider>(env.NDIE_QUESTION_PROVIDER);
    const [aggregate, questionJobs, failedQuestionJobs, candidates] = await Promise.all([
      prisma.ndieProviderRun.aggregate({ where: { providerKind: "QUESTION", confidence: { not: null } }, _avg: { confidence: true } }),
      prisma.ndieProviderRun.count({ where: { providerKind: "QUESTION" } }),
      prisma.ndieProviderRun.count({ where: { providerKind: "QUESTION", status: { in: ["FAILED", "RETRY_PENDING"] } } }),
      prisma.ndieQuestionCandidate.findMany({
        select: { questionType: true, candidateJson: true, confidence: true },
        take: 1000,
        orderBy: { createdAt: "desc" }
      })
    ]);
    const questionTypeDistribution = candidates.reduce<Record<string, number>>((acc, candidate) => {
      acc[candidate.questionType] = (acc[candidate.questionType] ?? 0) + 1;
      return acc;
    }, {});
    return {
      provider: questionProvider?.id ?? env.NDIE_QUESTION_PROVIDER,
      providerVersion: questionProvider && "version" in questionProvider ? String(questionProvider.version) : questionProvider?.id ?? "unknown",
      providerStatus: questionProvider?.health().status ?? "NOT_CONFIGURED",
      questionJobs,
      questionCount: candidates.length,
      questionTypeDistribution,
      averageConfidence: Number((aggregate._avg.confidence ?? 0).toFixed(4)),
      failedQuestionJobs
    };
  },

  async detectImport(importJobId: string) {
    const questionProvider = container.providerRegistry.get<QuestionProvider>(env.NDIE_QUESTION_PROVIDER);
    const optionProvider = container.providerRegistry.get<OptionProvider>(env.NDIE_OPTION_PROVIDER);
    if (!questionProvider) throw new Error(`NDIE question provider ${env.NDIE_QUESTION_PROVIDER} is not registered`);
    if (!optionProvider) throw new Error(`NDIE option provider ${env.NDIE_OPTION_PROVIDER} is not registered`);

    logger.info("NDIE assessment detection started", { importId: importJobId, questionProvider: questionProvider.id, optionProvider: optionProvider.id });
    const [elements, pages] = await Promise.all([
      prisma.ndieElement.findMany({
      where: { importJobId },
      orderBy: [{ pageNumber: "asc" }, { readingOrder: "asc" }, { createdAt: "asc" }]
      }),
      prisma.ndiePage.findMany({
        where: { importJobId },
        orderBy: { pageNumber: "asc" },
        select: { id: true, pageNumber: true, ocrJson: true, layoutJson: true }
      })
    ]);

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
      })),
      ocrPages: pages.map((page) => page.ocrJson),
      layoutPages: pages.map((page) => page.layoutJson),
      formulaElements: elements.filter((element) => ["FORMULA", "CHEMICAL_EQUATION"].includes(element.elementType)).map((element) => element.metadata),
      visualElements: elements.filter((element) => ["TABLE", "GRAPH", "DIAGRAM", "IMAGE"].includes(element.elementType)).map((element) => element.metadata)
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
        assessment: question.normalizedQuestion,
        relationships: question.normalizedQuestion.relationships,
        diagnostics: question.normalizedQuestion.diagnostics,
        metadata: {
          sourceElementIds: question.sourceElementIds,
          normalizedQuestionId: question.normalizedQuestion.questionId,
          sectionId: question.normalizedQuestion.sectionId,
          passageId: question.normalizedQuestion.passageId,
          visualLinks: question.normalizedQuestion.visualLinks,
          formulaLinks: question.normalizedQuestion.formulaLinks,
          optionCompleteness: options.length,
          requiresTeacherReview: question.normalizedQuestion.diagnostics.issues.length > 0 || question.confidence < 0.8
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
          stage: "QUESTION_COMPLETED",
          status: "SUCCEEDED",
          inputSummary: {
            elements: elements.length,
            ocrPages: pages.filter((page) => page.ocrJson).length,
            layoutPages: pages.filter((page) => page.layoutJson).length,
            formulaElements: elements.filter((element) => ["FORMULA", "CHEMICAL_EQUATION"].includes(element.elementType)).length,
            visualElements: elements.filter((element) => ["TABLE", "GRAPH", "DIAGRAM", "IMAGE"].includes(element.elementType)).length
          },
          outputSummary: {
            assessment: questionResult.assessment,
            questions: questionResult.questions.length,
            sections: questionResult.assessment.metrics.sections,
            passages: questionResult.assessment.metrics.passages,
            options: questionResult.assessment.metrics.options,
            diagnostics: questionResult.assessment.diagnostics
          } as Prisma.InputJsonValue,
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
          status: "READY_FOR_ANSWER_ENGINE",
          currentCheckpoint: "READY_FOR_ANSWER_ENGINE",
          teacherSummary: {
            questionCandidates: candidateRows.length,
            optionProvider: optionProvider.id,
            assessment: questionResult.assessment.metrics,
            pendingReview: candidateRows.filter((row) => Number(row.confidence ?? 0) < 0.8).length
          } as Prisma.InputJsonValue
        }
      });
    });

    logger.info("NDIE assessment detection complete", {
      importId: importJobId,
      questions: candidateRows.length,
      questionTypes: questionResult.assessment.metrics.questionTypes,
      averageConfidence: questionResult.confidence
    });
    return {
      questionProvider: questionProvider.id,
      optionProvider: optionProvider.id,
      questionsDetected: candidateRows.length,
      optionsMapped: optionResult.optionsByQuestion.length,
      assessment: questionResult.assessment.metrics
    };
  }
};
