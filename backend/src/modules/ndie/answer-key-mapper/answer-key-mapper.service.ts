import type { Prisma } from "../../../generated/prisma/client.js";
import { env } from "../../../config/env.js";
import { prisma } from "../../../config/prisma.js";
import type { AnswerKeyProvider, SolutionProvider } from "../contracts/providers.js";
import { createNdieContainer } from "../ndie.container.js";

const container = createNdieContainer();

export const ndieAnswerKeyMapperService = {
  async mapImport(importJobId: string) {
    const answerProvider = container.providerRegistry.get<AnswerKeyProvider>(env.NDIE_ANSWER_KEY_PROVIDER);
    const solutionProvider = container.providerRegistry.get<SolutionProvider>(env.NDIE_SOLUTION_PROVIDER);
    if (!answerProvider) throw new Error(`NDIE answer-key provider ${env.NDIE_ANSWER_KEY_PROVIDER} is not registered`);
    if (!solutionProvider) throw new Error(`NDIE solution provider ${env.NDIE_SOLUTION_PROVIDER} is not registered`);

    const importJob = await prisma.ndieImportJob.findUnique({ where: { id: importJobId } });
    if (!importJob) throw new Error("NDIE import not found");

    const elements = await prisma.ndieElement.findMany({
      where: { importJobId, text: { not: null } },
      orderBy: [{ pageNumber: "asc" }, { readingOrder: "asc" }, { createdAt: "asc" }]
    });

    const sourceDocuments = await prisma.ndieSourceDocument.findMany({ where: { importJobId } });
    const sourceByPage = new Map<number, string>();
    for (const doc of sourceDocuments) {
      const pages = await prisma.ndiePage.findMany({ where: { sourceDocumentId: doc.id }, select: { pageNumber: true } });
      for (const page of pages) sourceByPage.set(page.pageNumber, doc.id);
    }

    const answerStartedAt = new Date();
    const answerResult = await answerProvider.map({
      importJobId,
      sourceKind: importJob.sourceKind,
      elements: elements.map((element) => ({
        id: element.id,
        pageNumber: element.pageNumber,
        text: element.text,
        coordinates: element.coordinates,
        readingOrder: element.readingOrder
      }))
    });

    const solutionStartedAt = new Date();
    const solutionResult = await solutionProvider.map({
      importJobId,
      elements: elements.map((element) => ({
        id: element.id,
        pageNumber: element.pageNumber,
        text: element.text,
        coordinates: element.coordinates,
        readingOrder: element.readingOrder
      }))
    });

    await prisma.$transaction(async (tx) => {
      await tx.ndieAnswerKeyCandidate.deleteMany({ where: { importJobId } });
      await tx.ndieSolutionCandidate.deleteMany({ where: { importJobId } });

      if (answerResult.answers.length) {
        await tx.ndieAnswerKeyCandidate.createMany({
          data: answerResult.answers.map((answer) => ({
            importJobId,
            sourceDocumentId: answer.sourceDocumentId ?? sourceByPage.get(1) ?? null,
            questionNumber: answer.questionNumber,
            answerJson: answer.answerJson as Prisma.InputJsonValue,
            confidence: answer.confidence,
            status: "PENDING_REVIEW"
          }))
        });
      }

      if (solutionResult.solutions.length) {
        await tx.ndieSolutionCandidate.createMany({
          data: solutionResult.solutions.map((solution) => ({
            importJobId,
            sourceDocumentId: solution.sourceDocumentId ?? sourceByPage.get(1) ?? null,
            questionNumber: solution.questionNumber,
            solutionJson: solution.solutionJson as Prisma.InputJsonValue,
            confidence: solution.confidence,
            status: "PENDING_REVIEW"
          }))
        });
      }

      await tx.ndieProviderRun.create({
        data: {
          importJobId,
          providerId: answerProvider.id,
          providerKind: answerProvider.kind,
          stage: "ANSWER_KEYS_MAPPED",
          status: "SUCCEEDED",
          inputSummary: { elements: elements.length, sourceKind: importJob.sourceKind },
          outputSummary: { answers: answerResult.answers.length } as Prisma.InputJsonValue,
          confidence: answerResult.confidence,
          startedAt: answerStartedAt,
          completedAt: new Date()
        }
      });

      await tx.ndieProviderRun.create({
        data: {
          importJobId,
          providerId: solutionProvider.id,
          providerKind: solutionProvider.kind,
          stage: "SOLUTIONS_MAPPED",
          status: "SUCCEEDED",
          inputSummary: { elements: elements.length },
          outputSummary: { solutions: solutionResult.solutions.length } as Prisma.InputJsonValue,
          confidence: solutionResult.confidence,
          startedAt: solutionStartedAt,
          completedAt: new Date()
        }
      });

      await tx.ndieImportJob.update({
        where: { id: importJobId },
        data: {
          status: "SOLUTIONS_MAPPED",
          currentCheckpoint: "SOLUTIONS_MAPPED",
          qualitySummary: {
            answersMapped: answerResult.answers.length,
            solutionsMapped: solutionResult.solutions.length,
            answerProvider: answerProvider.id,
            solutionProvider: solutionProvider.id
          } as Prisma.InputJsonValue
        }
      });
    });

    return {
      answerProvider: answerProvider.id,
      solutionProvider: solutionProvider.id,
      answersMapped: answerResult.answers.length,
      solutionsMapped: solutionResult.solutions.length
    };
  }
};
