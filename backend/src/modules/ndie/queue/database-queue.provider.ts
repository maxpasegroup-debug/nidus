import { Prisma } from "../../../generated/prisma/client.js";
import { prisma } from "../../../config/prisma.js";
import { logger } from "../../../utils/logger.js";
import { assertNdieJobTransition, nextRetryDelayMs, type NdieJobState } from "./state-machine.js";
import type { NdieQueueJobInput, NdieQueueJobSnapshot, NdieQueueMetrics, NdieQueueProvider, NdieRetryPolicy } from "./queue.types.js";

const defaultRetryPolicy: NdieRetryPolicy = {
  maxAttempts: 3,
  retryDelayMs: 30_000,
  backoffStrategy: "EXPONENTIAL"
};

function snapshot(job: {
  id: string;
  importJobId: string;
  replayRunId: string | null;
  jobType: string;
  stage: string;
  state: string;
  provider: string;
  workerId: string | null;
  progress: number;
  currentStage: string | null;
  attempts: number;
  maxAttempts: number;
  queuedAt: Date;
  startedAt: Date | null;
  completedAt: Date | null;
  failedAt: Date | null;
  cancelledAt: Date | null;
  durationMs: number | null;
}): NdieQueueJobSnapshot {
  return job;
}

function retryHistory(previous: Prisma.JsonValue | null, entry: Record<string, unknown>) {
  return [...(Array.isArray(previous) ? previous : []), entry] as Prisma.InputJsonValue;
}

function publicError(error: Error) {
  return error.message.slice(0, 500);
}

export class DatabaseNdieQueueProvider implements NdieQueueProvider {
  readonly id = "database";

  async health() {
    const [pendingJobs, failedJobs, dlqCount] = await Promise.all([
      prisma.ndieQueueJob.count({ where: { state: { in: ["QUEUED", "RETRY_PENDING", "REPLAY_PENDING"] } } }),
      prisma.ndieQueueJob.count({ where: { state: "FAILED" } }),
      prisma.ndieQueueJob.count({ where: { state: "DLQ" } })
    ]);
    return { provider: this.id, status: "ready" as const, pendingJobs, failedJobs, dlqCount };
  }

  async enqueue(input: NdieQueueJobInput) {
    const retryPolicy = { ...defaultRetryPolicy, ...input.retryPolicy };
    const state = input.replayRunId ? "REPLAY_PENDING" : "QUEUED";
    const job = await prisma.ndieQueueJob.create({
      data: {
        importJobId: input.importJobId,
        replayRunId: input.replayRunId ?? null,
        jobType: input.jobType,
        stage: input.stage,
        state,
        provider: this.id,
        progress: 0,
        currentStage: input.stage,
        maxAttempts: retryPolicy.maxAttempts,
        retryDelayMs: retryPolicy.retryDelayMs,
        backoffStrategy: retryPolicy.backoffStrategy,
        payload: input.payload ?? Prisma.JsonNull
      }
    });
    await prisma.ndieImportJob.update({
      where: { id: input.importJobId },
      data: {
        status: state,
        currentCheckpoint: input.stage,
        checkpoints: {
          queueJobId: job.id,
          queuedAt: job.queuedAt.toISOString(),
          stage: input.stage,
          state
        } as Prisma.InputJsonValue
      }
    });
    logger.info("NDIE queue job enqueued", { jobId: job.id, importJobId: job.importJobId, stage: job.stage, provider: this.id });
    return snapshot(job);
  }

  async transition(jobId: string, nextState: NdieJobState, metadata: Record<string, unknown> = {}) {
    const current = await prisma.ndieQueueJob.findUnique({ where: { id: jobId } });
    if (!current) throw Object.assign(new Error("NDIE queue job not found"), { statusCode: 404 });
    assertNdieJobTransition(current.state, nextState);
    const now = new Date();
    const startedAt = nextState === "PROCESSING" && !current.startedAt ? now : current.startedAt;
    const completedAt = nextState === "COMPLETED" ? now : current.completedAt;
    const failedAt = nextState === "FAILED" || nextState === "DLQ" ? now : current.failedAt;
    const cancelledAt = nextState === "CANCELLED" ? now : current.cancelledAt;
    const durationMs = completedAt && startedAt ? completedAt.getTime() - startedAt.getTime() : current.durationMs;
    const progress = nextState === "COMPLETED" ? 100 : current.progress;

    const job = await prisma.ndieQueueJob.update({
      where: { id: jobId },
      data: {
        state: nextState,
        startedAt,
        completedAt,
        failedAt,
        cancelledAt,
        durationMs,
        progress,
        ...(Object.keys(metadata).length ? { diagnostics: metadata as Prisma.InputJsonValue } : {})
      }
    });
    await prisma.ndieImportJob.update({
      where: { id: job.importJobId },
      data: { status: nextState, currentCheckpoint: job.stage }
    });
    logger.info("NDIE queue state transition", { jobId, importId: job.importJobId, stage: job.stage, result: nextState, durationMs, retryCount: job.attempts });
    return snapshot(job);
  }

  async updateProgress(jobId: string, progress: number, currentStage: string) {
    const boundedProgress = Math.max(0, Math.min(100, Math.round(progress)));
    const job = await prisma.ndieQueueJob.update({
      where: { id: jobId },
      data: { progress: boundedProgress, currentStage }
    });
    await prisma.ndieImportJob.update({
      where: { id: job.importJobId },
      data: { currentCheckpoint: currentStage }
    });
    logger.info("NDIE queue progress updated", { jobId, importId: job.importJobId, stage: currentStage, result: "PROGRESS", progress: boundedProgress, retryCount: job.attempts });
    return snapshot(job);
  }

  async cancel(jobId: string, reason = "Cancelled") {
    const job = await this.transition(jobId, "CANCELLED", { reason });
    logger.info("NDIE queue job cancelled", { jobId, importId: job.importJobId, stage: job.stage, result: "CANCELLED", retryCount: job.attempts });
    return job;
  }

  async failOrRetry(jobId: string, error: Error, workerId?: string) {
    const current = await prisma.ndieQueueJob.findUnique({ where: { id: jobId } });
    if (!current) throw Object.assign(new Error("NDIE queue job not found"), { statusCode: 404 });
    const attempts = current.attempts + 1;
    const entry = {
      attempt: attempts,
      reason: publicError(error),
      workerId: workerId ?? current.workerId,
      at: new Date().toISOString()
    };
    const retryLimitExceeded = attempts >= current.maxAttempts;
    const state = retryLimitExceeded ? "DLQ" : "RETRY_PENDING";
    assertNdieJobTransition(current.state, state);
    const delayMs = nextRetryDelayMs({ retryDelayMs: current.retryDelayMs, attempts, backoffStrategy: current.backoffStrategy });
    const now = new Date();
    const job = await prisma.ndieQueueJob.update({
      where: { id: jobId },
      data: {
        state,
        attempts,
        workerId: workerId ?? current.workerId,
        retryHistory: retryHistory(current.retryHistory, entry),
        errorCategory: error.name || "NDIE_JOB_ERROR",
        errorMessage: publicError(error),
        failedAt: retryLimitExceeded ? now : null,
        nextRunAt: retryLimitExceeded ? null : new Date(now.getTime() + delayMs),
        diagnostics: { lastFailure: entry, movedToDlq: retryLimitExceeded } as Prisma.InputJsonValue
      }
    });
    await prisma.ndieImportJob.update({
      where: { id: job.importJobId },
      data: { status: state, currentCheckpoint: job.stage }
    });
    logger.warn("NDIE queue job failed", { jobId, importId: job.importJobId, stage: job.stage, worker: workerId, result: state, retryCount: attempts, errorCategory: job.errorCategory });
    return snapshot(job);
  }

  async metrics(): Promise<NdieQueueMetrics> {
    const [states, aggregate] = await Promise.all([
      prisma.ndieQueueJob.groupBy({ by: ["state"], _count: { _all: true } }),
      prisma.ndieQueueJob.aggregate({ where: { durationMs: { not: null } }, _avg: { durationMs: true } })
    ]);
    const count = (state: string) => states.find((row) => row.state === state)?._count._all ?? 0;
    return {
      provider: this.id,
      queued: count("QUEUED"),
      processing: count("PROCESSING"),
      completed: count("COMPLETED"),
      failed: count("FAILED"),
      cancelled: count("CANCELLED"),
      retry: count("RETRY_PENDING"),
      rendering: count("RENDERING"),
      pagesCreated: count("PAGES_CREATED"),
      readyForOcr: count("READY_FOR_OCR"),
      ocrRunning: count("OCR_RUNNING"),
      ocrCompleted: count("OCR_COMPLETED"),
      readyForLayout: count("READY_FOR_LAYOUT"),
      layoutRunning: count("LAYOUT_RUNNING"),
      layoutCompleted: count("LAYOUT_COMPLETED"),
      readyForFormulaEngine: count("READY_FOR_FORMULA_ENGINE"),
      formulaRunning: count("FORMULA_RUNNING"),
      formulaCompleted: count("FORMULA_COMPLETED"),
      readyForVisualEngine: count("READY_FOR_VISUAL_ENGINE"),
      visualRunning: count("VISUAL_RUNNING"),
      visualCompleted: count("VISUAL_COMPLETED"),
      readyForQuestionEngine: count("READY_FOR_QUESTION_ENGINE"),
      questionRunning: count("QUESTION_RUNNING"),
      questionCompleted: count("QUESTION_COMPLETED"),
      readyForAnswerEngine: count("READY_FOR_ANSWER_ENGINE"),
      answerRunning: count("ANSWER_RUNNING"),
      answerCompleted: count("ANSWER_COMPLETED"),
      readyForAiValidation: count("READY_FOR_AI_VALIDATION"),
      dlq: count("DLQ"),
      averageDurationMs: Math.round(aggregate._avg.durationMs ?? 0),
      pendingJobs: count("QUEUED") + count("RETRY_PENDING") + count("REPLAY_PENDING"),
      failedJobs: count("FAILED"),
      dlqCount: count("DLQ")
    };
  }
}
