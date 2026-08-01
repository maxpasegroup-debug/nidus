import type { Prisma } from "../../../generated/prisma/client.js";
import { env } from "../../../config/env.js";
import { prisma } from "../../../config/prisma.js";
import type { AiProvider } from "../contracts/providers.js";
import { ndieOverallConfidence, ndieReviewStatusFromConfidence } from "../confidence-engine/confidence-engine.service.js";
import { createNdieContainer } from "../ndie.container.js";

const container = createNdieContainer();

export const ndieAiValidatorService = {
  async validateImport(importJobId: string) {
    const provider = container.providerRegistry.get<AiProvider>(env.NDIE_AI_PROVIDER);
    if (!provider) throw new Error(`NDIE AI provider ${env.NDIE_AI_PROVIDER} is not registered`);

    const [candidates, answerKeys, solutions] = await Promise.all([
      prisma.ndieQuestionCandidate.findMany({ where: { importJobId }, orderBy: [{ questionNumber: "asc" }, { createdAt: "asc" }] }),
      prisma.ndieAnswerKeyCandidate.findMany({ where: { importJobId } }),
      prisma.ndieSolutionCandidate.findMany({ where: { importJobId } })
    ]);

    const startedAt = new Date();
    const result = await provider.validate({
      importJobId,
      candidates: candidates.map((candidate) => ({
        id: candidate.id,
        questionNumber: candidate.questionNumber,
        questionType: candidate.questionType,
        candidateJson: candidate.candidateJson,
        confidence: candidate.confidence
      })),
      answerKeys: answerKeys.map((answer) => ({
        questionNumber: answer.questionNumber,
        answerJson: answer.answerJson,
        confidence: answer.confidence
      })),
      solutions: solutions.map((solution) => ({
        questionNumber: solution.questionNumber,
        solutionJson: solution.solutionJson,
        confidence: solution.confidence
      }))
    });

    const validationById = new Map(result.validations.map((validation) => [validation.candidateId, validation]));

    await prisma.$transaction(async (tx) => {
      for (const candidate of candidates) {
        const validation = validationById.get(candidate.id);
        if (!validation) continue;
        const reviewStatus = ndieReviewStatusFromConfidence(validation.confidence, validation.issues);
        await tx.ndieQuestionCandidate.update({
          where: { id: candidate.id },
          data: {
            confidence: validation.confidence,
            reviewStatus,
            status: reviewStatus === "AUTO_APPROVED" ? "AUTO_VALIDATED" : "PENDING_REVIEW",
            sourceMap: {
              ...(candidate.sourceMap && typeof candidate.sourceMap === "object" ? candidate.sourceMap as Record<string, unknown> : {}),
              aiValidation: validation
            } as Prisma.InputJsonValue
          }
        });
      }

      await tx.ndieProviderRun.create({
        data: {
          importJobId,
          providerId: provider.id,
          providerKind: provider.kind,
          stage: "AI_VALIDATED",
          status: "SUCCEEDED",
          inputSummary: { candidates: candidates.length, answerKeys: answerKeys.length, solutions: solutions.length },
          outputSummary: result.raw as Prisma.InputJsonValue,
          confidence: result.confidence,
          startedAt,
          completedAt: new Date()
        }
      });

      const overallConfidence = ndieOverallConfidence(result.validations.map((validation) => validation.confidence));
      await tx.ndieQualityScore.create({
        data: {
          importJobId,
          overall: overallConfidence ?? 0,
          grade: overallConfidence === null ? "REVIEW_REQUIRED" : overallConfidence >= 0.85 ? "EXCELLENT" : overallConfidence >= 0.7 ? "GOOD" : overallConfidence >= 0.45 ? "REVIEW_REQUIRED" : "POOR",
          aiConfidence: overallConfidence,
          optionCompleteness: candidates.length ? candidates.filter((candidate) => {
            const blocks = (candidate.candidateJson as { blocks?: Array<{ type?: string }> }).blocks ?? [];
            return blocks.filter((block) => block.type === "OptionBlock").length === 4;
          }).length / candidates.length : null,
          answerKeyConfidence: ndieOverallConfidence(answerKeys.map((answer) => answer.confidence)),
          teacherReviewCompletion: 0,
          details: {
            providerId: provider.id,
            validations: result.validations
          } as Prisma.InputJsonValue
        }
      });

      await tx.ndieImportJob.update({
        where: { id: importJobId },
        data: {
          status: "AI_VALIDATED",
          currentCheckpoint: "AI_VALIDATED",
          reviewStatus: "PENDING_REVIEW",
          qualitySummary: {
            aiProvider: provider.id,
            aiConfidence: overallConfidence,
            candidates: candidates.length,
            needsReview: result.validations.filter((validation) => validation.reviewStatus !== "AUTO_APPROVED").length
          } as Prisma.InputJsonValue
        }
      });
    });

    return {
      providerId: provider.id,
      candidates: candidates.length,
      validations: result.validations,
      confidence: result.confidence
    };
  }
};
