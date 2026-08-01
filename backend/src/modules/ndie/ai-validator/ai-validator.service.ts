import type { Prisma } from "../../../generated/prisma/client.js";
import { env } from "../../../config/env.js";
import { prisma } from "../../../config/prisma.js";
import { logger } from "../../../utils/logger.js";
import type { NdieAssessmentDocument } from "../contracts/assessment-result.js";
import type { NdieEvaluationDocument } from "../contracts/evaluation-result.js";
import type { AiProvider } from "../contracts/providers.js";
import { ndieOverallConfidence, ndieReviewStatusFromConfidence } from "../confidence-engine/confidence-engine.service.js";
import { createNdieContainer } from "../ndie.container.js";

const container = createNdieContainer();

function asRecord(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function assessmentFromCandidates(candidates: Array<{ candidateJson: Prisma.JsonValue }>): NdieAssessmentDocument | null {
  const questions = candidates
    .map((candidate) => asRecord(candidate.candidateJson).assessment)
    .filter((assessment): assessment is Record<string, unknown> => Boolean(assessment && typeof assessment === "object" && !Array.isArray(assessment)));
  if (!questions.length) return null;
  const normalizedQuestions = questions as unknown as NdieAssessmentDocument["questions"];
  return {
    schemaVersion: "ndie-assessment-v1",
    providerId: String(questions[0].providerId ?? "question.rule-based"),
    providerVersion: String(questions[0].providerVersion ?? "1.0-gate8"),
    pipelineVersion: String(questions[0].pipelineVersion ?? env.NDIE_PIPELINE_VERSION),
    importJobId: String(questions[0].importJobId ?? ""),
    structure: [],
    questions: normalizedQuestions,
    relationships: normalizedQuestions.flatMap((question) => question.relationships ?? []),
    diagnostics: {
      missingOptions: normalizedQuestions.some((question) => question.diagnostics?.missingOptions),
      duplicateNumbering: false,
      brokenNumbering: false,
      sharedDiagramAmbiguity: normalizedQuestions.some((question) => question.diagnostics?.sharedDiagramAmbiguity),
      questionSplitAcrossPages: normalizedQuestions.some((question) => question.diagnostics?.questionSplitAcrossPages),
      lowConfidence: normalizedQuestions.some((question) => Number(question.confidence ?? 0) < 0.7),
      orphanVisuals: normalizedQuestions.some((question) => question.diagnostics?.orphanVisuals),
      orphanFormulas: normalizedQuestions.some((question) => question.diagnostics?.orphanFormulas),
      missingMarks: normalizedQuestions.some((question) => question.diagnostics?.missingMarks),
      unsupportedStructures: normalizedQuestions.some((question) => question.diagnostics?.unsupportedStructures),
      issues: normalizedQuestions.flatMap((question) => question.diagnostics?.issues ?? [])
    },
    metrics: {
      questions: normalizedQuestions.length,
      sections: 0,
      groups: 0,
      passages: 0,
      options: normalizedQuestions.reduce((sum, question) => sum + (question.options?.length ?? 0), 0),
      questionTypes: normalizedQuestions.reduce<Record<string, number>>((counts, question) => {
        counts[question.questionType] = (counts[question.questionType] ?? 0) + 1;
        return counts;
      }, {}),
      averageConfidence: ndieOverallConfidence(normalizedQuestions.map((question) => question.confidence)),
      reviewRequired: normalizedQuestions.filter((question) => question.diagnostics?.issues?.length).length
    },
    rawProviderOutput: { rebuiltFromQuestionCandidates: true },
    checksum: "",
    durationMs: 0,
    createdAt: new Date().toISOString()
  };
}

function latestEvaluation(providerRun: { outputSummary: Prisma.JsonValue | null } | null): NdieEvaluationDocument | null {
  const output = asRecord(providerRun?.outputSummary);
  const evaluation = output.evaluation;
  if (!evaluation || typeof evaluation !== "object" || Array.isArray(evaluation)) return null;
  return evaluation as unknown as NdieEvaluationDocument;
}

export const ndieAiValidatorService = {
  async health() {
    const provider = container.providerRegistry.get<AiProvider>(env.NDIE_AI_PROVIDER);
    const [latestRun, aggregate, validationJobs, readyImports, blockedRuns] = await Promise.all([
      prisma.ndieProviderRun.findFirst({ where: { providerKind: "AI" }, orderBy: { completedAt: "desc" } }),
      prisma.ndieProviderRun.aggregate({ where: { providerKind: "AI", status: "SUCCEEDED", confidence: { not: null } }, _avg: { confidence: true } }),
      prisma.ndieProviderRun.count({ where: { providerKind: "AI" } }),
      prisma.ndieImportJob.count({ where: { status: "READY_FOR_TEACHER_REVIEW" } }),
      prisma.ndieProviderRun.count({
        where: {
          providerKind: "AI",
          outputSummary: { path: ["validation", "publishReadiness", "status"], equals: "BLOCKED" }
        }
      })
    ]);
    const validation = asRecord(asRecord(latestRun?.outputSummary).validation);
    const riskDistribution = asRecord(asRecord(validation.metrics).riskDistribution);
    const riskOrder = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];
    const averageRisk = riskOrder.find((risk) => Number(riskDistribution[risk] ?? 0) > 0) ?? "LOW";
    return {
      provider: provider?.id ?? env.NDIE_AI_PROVIDER,
      status: provider?.health().status.toLowerCase() ?? "not_configured",
      averageConfidence: aggregate._avg.confidence ?? null,
      averageRisk,
      validationJobs,
      readyImports,
      blockedImports: blockedRuns,
      latestReadiness: asRecord(validation.publishReadiness).status ?? null
    };
  },

  async validateImport(importJobId: string) {
    const provider = container.providerRegistry.get<AiProvider>(env.NDIE_AI_PROVIDER);
    if (!provider) throw new Error(`NDIE AI provider ${env.NDIE_AI_PROVIDER} is not registered`);

    const [candidates, answerKeys, solutions, pages, elements, evaluationRun] = await Promise.all([
      prisma.ndieQuestionCandidate.findMany({ where: { importJobId }, orderBy: [{ questionNumber: "asc" }, { createdAt: "asc" }] }),
      prisma.ndieAnswerKeyCandidate.findMany({ where: { importJobId } }),
      prisma.ndieSolutionCandidate.findMany({ where: { importJobId } }),
      prisma.ndiePage.findMany({ where: { importJobId }, orderBy: [{ pageNumber: "asc" }] }),
      prisma.ndieElement.findMany({ where: { importJobId }, orderBy: [{ pageNumber: "asc" }, { readingOrder: "asc" }] }),
      prisma.ndieProviderRun.findFirst({ where: { importJobId, providerKind: "EVALUATION", status: "SUCCEEDED" }, orderBy: { completedAt: "desc" } })
    ]);

    logger.info("NDIE AI validation started", { importId: importJobId, aiProvider: provider.id });
    const startedAt = new Date();
    const result = await provider.validate({
      importJobId,
      ocrPages: pages.map((page) => page.ocrJson).filter(Boolean),
      layoutPages: pages.map((page) => page.layoutJson).filter(Boolean),
      formulaElements: elements.filter((element) => element.elementType === "FORMULA"),
      visualElements: elements.filter((element) => ["DIAGRAM", "GRAPH", "TABLE", "IMAGE"].includes(element.elementType)),
      assessment: assessmentFromCandidates(candidates),
      evaluation: latestEvaluation(evaluationRun),
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
              aiValidation: validation,
              validationId: result.validation.validationId
            } as Prisma.InputJsonValue
          }
        });
      }

      await tx.ndieProviderRun.create({
        data: {
          importJobId,
          providerId: provider.id,
          providerKind: provider.kind,
          stage: "AI_VALIDATION_COMPLETED",
          status: "SUCCEEDED",
          inputSummary: {
            candidates: candidates.length,
            answerKeys: answerKeys.length,
            solutions: solutions.length,
            ocrPages: pages.filter((page) => page.ocrJson).length,
            layoutPages: pages.filter((page) => page.layoutJson).length,
            formulas: elements.filter((element) => element.elementType === "FORMULA").length,
            visuals: elements.filter((element) => ["DIAGRAM", "GRAPH", "TABLE", "IMAGE"].includes(element.elementType)).length,
            consumes: ["OCR_JSON", "LAYOUT_JSON", "FORMULA_JSON", "VISUAL_JSON", "ASSESSMENT_JSON", "EVALUATION_JSON"]
          } as Prisma.InputJsonValue,
          outputSummary: {
            validation: result.validation,
            publishReadiness: result.validation.publishReadiness,
            issueDistribution: result.validation.metrics.issueDistribution,
            riskDistribution: result.validation.metrics.riskDistribution,
            recommendations: result.validation.recommendations
          } as Prisma.InputJsonValue,
          confidence: result.confidence,
          startedAt,
          completedAt: new Date()
        }
      });

      const overallConfidence = result.validation.metrics.averageConfidence ?? ndieOverallConfidence(result.validations.map((validation) => validation.confidence));
      await tx.ndieQualityScore.create({
        data: {
          importJobId,
          overall: overallConfidence ?? 0,
          grade: result.validation.publishReadiness.status === "BLOCKED" ? "POOR" : overallConfidence === null ? "REVIEW_REQUIRED" : overallConfidence >= 0.85 ? "EXCELLENT" : overallConfidence >= 0.7 ? "GOOD" : overallConfidence >= 0.45 ? "REVIEW_REQUIRED" : "POOR",
          aiConfidence: overallConfidence,
          optionCompleteness: candidates.length ? candidates.filter((candidate) => {
            const assessment = asRecord(asRecord(candidate.candidateJson).assessment);
            const options = assessment.options;
            return Array.isArray(options) && options.length >= 2;
          }).length / candidates.length : null,
          answerKeyConfidence: ndieOverallConfidence(answerKeys.map((answer) => answer.confidence)),
          teacherReviewCompletion: 0,
          details: {
            providerId: provider.id,
            validation: result.validation
          } as Prisma.InputJsonValue
        }
      });

      await tx.ndieImportJob.update({
        where: { id: importJobId },
        data: {
          status: "READY_FOR_TEACHER_REVIEW",
          currentCheckpoint: "READY_FOR_TEACHER_REVIEW",
          reviewStatus: result.validation.publishReadiness.status === "READY" ? "READY" : "PENDING_REVIEW",
          qualitySummary: {
            aiProvider: provider.id,
            aiConfidence: overallConfidence,
            candidates: candidates.length,
            needsReview: result.validations.filter((validation) => validation.reviewStatus !== "AUTO_APPROVED").length,
            publishReadiness: result.validation.publishReadiness,
            riskDistribution: result.validation.metrics.riskDistribution,
            issueDistribution: result.validation.metrics.issueDistribution
          } as Prisma.InputJsonValue
        }
      });
    });

    logger.info("NDIE AI validation completed", {
      importId: importJobId,
      aiProvider: provider.id,
      confidence: result.confidence,
      readiness: result.validation.publishReadiness.status,
      issues: result.validation.issues.length,
      warnings: result.validation.warnings.length
    });

    return {
      providerId: provider.id,
      candidates: candidates.length,
      validations: result.validations,
      validation: result.validation,
      confidence: result.confidence
    };
  }
};
