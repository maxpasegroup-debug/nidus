import type { Prisma } from "../../../generated/prisma/client.js";
import { env } from "../../../config/env.js";
import { prisma } from "../../../config/prisma.js";
import { logger } from "../../../utils/logger.js";
import type { NdieAssessmentDocument } from "../contracts/assessment-result.js";
import type { EvaluationProvider } from "../contracts/providers.js";
import { createNdieContainer } from "../ndie.container.js";

const container = createNdieContainer();

function jsonRecord(value: Prisma.JsonValue | null | undefined) {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function assessmentFromCandidates(candidates: Array<{ candidateJson: Prisma.JsonValue }>): NdieAssessmentDocument | null {
  const questions = candidates
    .map((candidate) => jsonRecord(candidate.candidateJson).assessment)
    .filter((assessment): assessment is Record<string, unknown> => Boolean(assessment && typeof assessment === "object" && !Array.isArray(assessment)));
  if (!questions.length) return null;
  const first = questions[0];
  const importJobId = String(first.importJobId ?? "");
  const providerId = String(first.providerId ?? "question.rule-based");
  const providerVersion = String(first.providerVersion ?? "1.0-gate8");
  const pipelineVersion = String(first.pipelineVersion ?? env.NDIE_PIPELINE_VERSION);
  const structureById = new Map<string, unknown>();
  for (const candidate of candidates) {
    const rawAssessment = jsonRecord(candidate.candidateJson).assessment;
    if (!rawAssessment || typeof rawAssessment !== "object" || Array.isArray(rawAssessment)) continue;
    const assessment = rawAssessment as Record<string, unknown>;
    const sectionId = typeof assessment.sectionId === "string" ? assessment.sectionId : null;
    const passageId = typeof assessment.passageId === "string" ? assessment.passageId : null;
    const boxes = Array.isArray(assessment.boundingBoxes) ? assessment.boundingBoxes : [];
    const pageNumber = Number((boxes[0] as Record<string, unknown> | undefined)?.page ?? 1);
    if (sectionId) structureById.set(sectionId, { id: sectionId, type: "SECTION", title: sectionId, pageNumber, sourceElementIds: [], readingOrder: Number(assessment.readingOrder ?? 0), confidence: typeof assessment.confidence === "number" ? assessment.confidence : null });
    if (passageId) structureById.set(passageId, { id: passageId, type: "PASSAGE", title: passageId, pageNumber, sourceElementIds: [], readingOrder: Number(assessment.readingOrder ?? 0), confidence: typeof assessment.confidence === "number" ? assessment.confidence : null });
  }
  const normalizedQuestions = questions as unknown as NdieAssessmentDocument["questions"];
  return {
    schemaVersion: "ndie-assessment-v1",
    providerId,
    providerVersion,
    pipelineVersion,
    importJobId,
    structure: [...structureById.values()] as NdieAssessmentDocument["structure"],
    questions: normalizedQuestions,
    relationships: normalizedQuestions.flatMap((question) => question.relationships ?? []),
    diagnostics: {
      missingOptions: false,
      duplicateNumbering: false,
      brokenNumbering: false,
      sharedDiagramAmbiguity: false,
      questionSplitAcrossPages: false,
      lowConfidence: normalizedQuestions.some((question) => Number(question.confidence ?? 0) < 0.7),
      orphanVisuals: false,
      orphanFormulas: false,
      missingMarks: normalizedQuestions.some((question) => question.marks === null),
      unsupportedStructures: false,
      issues: []
    },
    metrics: {
      questions: normalizedQuestions.length,
      sections: structureById.size,
      groups: 0,
      passages: [...structureById.values()].filter((node) => (node as Record<string, unknown>).type === "PASSAGE").length,
      options: normalizedQuestions.reduce((sum, question) => sum + (question.options?.length ?? 0), 0),
      questionTypes: normalizedQuestions.reduce<Record<string, number>>((counts, question) => {
        counts[question.questionType] = (counts[question.questionType] ?? 0) + 1;
        return counts;
      }, {}),
      averageConfidence: normalizedQuestions.length ? normalizedQuestions.reduce((sum, question) => sum + Number(question.confidence ?? 0), 0) / normalizedQuestions.length : null,
      reviewRequired: normalizedQuestions.filter((question) => question.diagnostics?.issues?.length).length
    },
    rawProviderOutput: { rebuiltFromQuestionCandidates: true },
    checksum: "",
    durationMs: 0,
    createdAt: new Date().toISOString()
  };
}

export const ndieAnswerKeyMapperService = {
  async health() {
    const provider = container.providerRegistry.get<EvaluationProvider>(env.NDIE_EVALUATION_PROVIDER);
    const [latestRun, aggregate, candidates, answers, solutions] = await Promise.all([
      prisma.ndieProviderRun.findFirst({
        where: { providerKind: "EVALUATION" },
        orderBy: { completedAt: "desc" }
      }),
      prisma.ndieProviderRun.aggregate({
        where: { providerKind: "EVALUATION", status: "SUCCEEDED", confidence: { not: null } },
        _avg: { confidence: true }
      }),
      prisma.ndieQuestionCandidate.count(),
      prisma.ndieAnswerKeyCandidate.count(),
      prisma.ndieSolutionCandidate.count()
    ]);
    const output = jsonRecord(latestRun?.outputSummary ?? null);
    return {
      provider: provider?.id ?? env.NDIE_EVALUATION_PROVIDER,
      status: provider?.health().status.toLowerCase() ?? "not_configured",
      evaluationJobs: await prisma.ndieProviderRun.count({ where: { providerKind: "EVALUATION" } }),
      coveragePercentage: candidates ? Number(((answers / candidates) * 100).toFixed(2)) : 0,
      conflictCount: Number(output.conflicts ?? 0),
      averageConfidence: aggregate._avg.confidence ?? null,
      answers,
      solutions
    };
  },

  async mapImport(importJobId: string) {
    const evaluationProvider = container.providerRegistry.get<EvaluationProvider>(env.NDIE_EVALUATION_PROVIDER);
    if (!evaluationProvider) throw new Error(`NDIE evaluation provider ${env.NDIE_EVALUATION_PROVIDER} is not registered`);

    const importJob = await prisma.ndieImportJob.findUnique({ where: { id: importJobId } });
    if (!importJob) throw new Error("NDIE import not found");

    const [elements, pages, questionCandidates, sourceDocuments] = await Promise.all([
      prisma.ndieElement.findMany({
        where: { importJobId },
        orderBy: [{ pageNumber: "asc" }, { readingOrder: "asc" }, { createdAt: "asc" }]
      }),
      prisma.ndiePage.findMany({
        where: { importJobId },
        orderBy: [{ pageNumber: "asc" }]
      }),
      prisma.ndieQuestionCandidate.findMany({
        where: { importJobId },
        orderBy: [{ questionNumber: "asc" }, { createdAt: "asc" }]
      }),
      prisma.ndieSourceDocument.findMany({ where: { importJobId } })
    ]);

    logger.info("NDIE evaluation detection started", { importId: importJobId, evaluationProvider: evaluationProvider.id });
    const sourceByPage = new Map<number, string>();
    for (const doc of sourceDocuments) {
      const docPages = pages.filter((page) => page.sourceDocumentId === doc.id);
      for (const page of docPages) sourceByPage.set(page.pageNumber, doc.id);
    }

    const startedAt = new Date();
    const formulaElements = elements.filter((element) => element.elementType === "FORMULA");
    const visualElements = elements.filter((element) => ["DIAGRAM", "GRAPH", "TABLE", "IMAGE"].includes(element.elementType));
    const evaluationResult = await evaluationProvider.evaluate({
      importJobId,
      sourceKind: importJob.sourceKind,
      assessment: assessmentFromCandidates(questionCandidates),
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
      ocrPages: pages.map((page) => page.ocrJson).filter(Boolean),
      layoutPages: pages.map((page) => page.layoutJson).filter(Boolean),
      formulaElements,
      visualElements
    });

    await prisma.$transaction(async (tx) => {
      await tx.ndieAnswerKeyCandidate.deleteMany({ where: { importJobId } });
      await tx.ndieSolutionCandidate.deleteMany({ where: { importJobId } });

      if (evaluationResult.answers.length) {
        await tx.ndieAnswerKeyCandidate.createMany({
          data: evaluationResult.answers.map((answer) => ({
            importJobId,
            sourceDocumentId: answer.sourceDocumentId ?? sourceByPage.get(1) ?? null,
            questionNumber: answer.questionNumber,
            answerJson: answer.answerJson as Prisma.InputJsonValue,
            confidence: answer.confidence,
            status: "PENDING_REVIEW"
          }))
        });
      }

      if (evaluationResult.solutions.length) {
        await tx.ndieSolutionCandidate.createMany({
          data: evaluationResult.solutions.map((solution) => ({
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
          providerId: evaluationProvider.id,
          providerKind: evaluationProvider.kind,
          stage: "ANSWER_COMPLETED",
          status: "SUCCEEDED",
          inputSummary: {
            elements: elements.length,
            questions: questionCandidates.length,
            sourceKind: importJob.sourceKind,
            consumes: ["ASSESSMENT_JSON", "OCR_JSON", "LAYOUT_JSON", "FORMULA_JSON", "VISUAL_JSON"]
          } as Prisma.InputJsonValue,
          outputSummary: {
            evaluation: evaluationResult.evaluation,
            answers: evaluationResult.evaluation.metrics.answers,
            solutions: evaluationResult.evaluation.metrics.solutions,
            rubrics: evaluationResult.evaluation.metrics.rubrics,
            answerCoverage: evaluationResult.evaluation.metrics.answerCoverage,
            solutionCoverage: evaluationResult.evaluation.metrics.solutionCoverage,
            rubricCoverage: evaluationResult.evaluation.metrics.rubricCoverage,
            conflicts: evaluationResult.evaluation.metrics.conflicts,
            diagnostics: evaluationResult.evaluation.diagnostics
          } as Prisma.InputJsonValue,
          confidence: evaluationResult.confidence,
          startedAt,
          completedAt: new Date()
        }
      });

      await tx.ndieImportJob.update({
        where: { id: importJobId },
        data: {
          status: "READY_FOR_AI_VALIDATION",
          currentCheckpoint: "READY_FOR_AI_VALIDATION",
          qualitySummary: {
            ...(jsonRecord(importJob.qualitySummary)),
            evaluation: evaluationResult.evaluation.metrics,
            diagnostics: evaluationResult.evaluation.diagnostics,
            evaluationProvider: evaluationProvider.id
          } as Prisma.InputJsonValue
        }
      });
    });

    logger.info("NDIE evaluation detection complete", {
      importId: importJobId,
      answers: evaluationResult.evaluation.metrics.answers,
      solutions: evaluationResult.evaluation.metrics.solutions,
      answerCoverage: evaluationResult.evaluation.metrics.answerCoverage,
      conflicts: evaluationResult.evaluation.metrics.conflicts
    });

    return {
      evaluationProvider: evaluationProvider.id,
      answersMapped: evaluationResult.answers.length,
      solutionsMapped: evaluationResult.solutions.length,
      answerCoverage: evaluationResult.evaluation.metrics.answerCoverage,
      solutionCoverage: evaluationResult.evaluation.metrics.solutionCoverage,
      conflictCount: evaluationResult.evaluation.metrics.conflicts,
      confidence: evaluationResult.confidence
    };
  }
};
