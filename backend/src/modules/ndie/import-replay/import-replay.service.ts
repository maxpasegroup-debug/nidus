import type { Prisma } from "../../../generated/prisma/client.js";
import { prisma } from "../../../config/prisma.js";
import { ndieAiValidatorService } from "../ai-validator/ai-validator.service.js";
import { ndieAnswerKeyMapperService } from "../answer-key-mapper/answer-key-mapper.service.js";
import { ndieLayoutAnalyzerService } from "../layout-analyzer/layout-analyzer.service.js";
import { ndieQuestionDetectorService } from "../question-detector/question-detector.service.js";
import { ndieVisualDetectorService } from "../visual-detector/visual-detector.service.js";

export type NdieReplayInput = {
  importJobId: string;
  requestedBy?: string;
  fromVersion?: string;
  toVersion?: string;
  fromCheckpoint?: string;
  stages?: string[];
};

const defaultStages = ["LAYOUT", "VISUALS", "QUESTIONS", "ANSWERS", "AI_VALIDATION"];

function normalizeStages(stages?: string[]) {
  const values = stages?.length ? stages : defaultStages;
  return Array.from(new Set(values.map((stage) => stage.toUpperCase().trim()).filter(Boolean)));
}

async function snapshot(importJobId: string) {
  const [job, candidates, answers, solutions, elements, pages, quality] = await Promise.all([
    prisma.ndieImportJob.findUnique({ where: { id: importJobId } }),
    prisma.ndieQuestionCandidate.count({ where: { importJobId } }),
    prisma.ndieAnswerKeyCandidate.count({ where: { importJobId } }),
    prisma.ndieSolutionCandidate.count({ where: { importJobId } }),
    prisma.ndieElement.groupBy({ by: ["elementType"], where: { importJobId }, _count: { _all: true } }),
    prisma.ndiePage.count({ where: { importJobId } }),
    prisma.ndieQualityScore.findFirst({ where: { importJobId }, orderBy: { createdAt: "desc" } })
  ]);
  return {
    status: job?.status ?? null,
    checkpoint: job?.currentCheckpoint ?? null,
    reviewStatus: job?.reviewStatus ?? null,
    candidates,
    answers,
    solutions,
    pages,
    elements: elements.reduce<Record<string, number>>((acc, row) => {
      acc[row.elementType] = row._count._all;
      return acc;
    }, {}),
    quality: quality ? {
      overall: quality.overall,
      grade: quality.grade,
      ocrConfidence: quality.ocrConfidence,
      formulaAccuracy: quality.formulaAccuracy,
      layoutAccuracy: quality.layoutAccuracy,
      tableAccuracy: quality.tableAccuracy,
      diagramPreservation: quality.diagramPreservation,
      optionCompleteness: quality.optionCompleteness,
      aiConfidence: quality.aiConfidence
    } : null
  };
}

function diff(before: Awaited<ReturnType<typeof snapshot>>, after: Awaited<ReturnType<typeof snapshot>>) {
  return {
    candidatesDelta: after.candidates - before.candidates,
    answersDelta: after.answers - before.answers,
    solutionsDelta: after.solutions - before.solutions,
    pagesDelta: after.pages - before.pages,
    qualityDelta: before.quality && after.quality ? Number((after.quality.overall - before.quality.overall).toFixed(4)) : null,
    before,
    after
  };
}

async function runStage(importJobId: string, stage: string) {
  if (stage === "LAYOUT") return ndieLayoutAnalyzerService.analyzeImport(importJobId);
  if (stage === "VISUALS") return ndieVisualDetectorService.detectImport(importJobId);
  if (stage === "QUESTIONS") return ndieQuestionDetectorService.detectImport(importJobId);
  if (stage === "ANSWERS") return ndieAnswerKeyMapperService.mapImport(importJobId);
  if (stage === "AI_VALIDATION") return ndieAiValidatorService.validateImport(importJobId);
  return { skipped: true, reason: `Unknown NDIE replay stage: ${stage}` };
}

export const ndieImportReplayService = {
  async replay(input: NdieReplayInput) {
    const importJob = await prisma.ndieImportJob.findUnique({ where: { id: input.importJobId } });
    if (!importJob) throw Object.assign(new Error("NDIE import not found"), { statusCode: 404 });

    const stages = normalizeStages(input.stages);
    const before = await snapshot(input.importJobId);
    const run = await prisma.ndieReplayRun.create({
      data: {
        importJobId: input.importJobId,
        requestedBy: input.requestedBy || null,
        fromVersion: input.fromVersion || importJob.pipelineVersion,
        toVersion: input.toVersion || importJob.pipelineVersion,
        status: "RUNNING",
        checkpoint: input.fromCheckpoint || importJob.currentCheckpoint || "REQUESTED",
        comparisonJson: { before, stages } as Prisma.InputJsonValue
      }
    });

    const stageResults: Array<Record<string, unknown>> = [];
    try {
      for (const stage of stages) {
        const startedAt = Date.now();
        const result = await runStage(input.importJobId, stage);
        stageResults.push({
          stage,
          durationMs: Date.now() - startedAt,
          result
        });
      }

      const after = await snapshot(input.importJobId);
      const comparison = {
        replayRunId: run.id,
        stages,
        stageResults,
        ...diff(before, after)
      };

      return prisma.ndieReplayRun.update({
        where: { id: run.id },
        data: {
          status: "SUCCEEDED",
          checkpoint: stages.at(-1) || run.checkpoint,
          comparisonJson: comparison as Prisma.InputJsonValue,
          completedAt: new Date()
        }
      });
    } catch (error) {
      await prisma.ndieReplayRun.update({
        where: { id: run.id },
        data: {
          status: "FAILED",
          comparisonJson: {
            before,
            stages,
            stageResults,
            error: error instanceof Error ? error.message : "Replay failed"
          } as Prisma.InputJsonValue,
          completedAt: new Date()
        }
      });
      throw error;
    }
  },

  async list(importJobId: string) {
    return prisma.ndieReplayRun.findMany({
      where: { importJobId },
      orderBy: { createdAt: "desc" }
    });
  }
};
