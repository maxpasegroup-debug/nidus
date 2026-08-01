import { randomUUID } from "node:crypto";
import type { Prisma } from "../../../generated/prisma/client.js";
import { env } from "../../../config/env.js";
import { logger } from "../../../utils/logger.js";
import { DatabaseNdieQueueProvider } from "./database-queue.provider.js";
import type { NdieQueueJobInput, NdieQueueProvider, NdieRetryPolicy } from "./queue.types.js";

const provider: NdieQueueProvider = new DatabaseNdieQueueProvider();

export const ndieQueueConfig = {
  provider: env.NDIE_QUEUE_PROVIDER,
  workersEnabled: env.NDIE_QUEUE_WORKERS_ENABLED,
  workerConcurrency: env.NDIE_WORKER_CONCURRENCY,
  retryPolicy: {
    maxAttempts: env.NDIE_JOB_MAX_ATTEMPTS,
    retryDelayMs: env.NDIE_JOB_RETRY_DELAY_MS,
    backoffStrategy: env.NDIE_JOB_BACKOFF_STRATEGY
  } satisfies NdieRetryPolicy,
  jobTimeoutMs: env.NDIE_JOB_TIMEOUT_MS
};

export const ndieQueueService = {
  providerId: provider.id,

  enqueue(input: NdieQueueJobInput) {
    return provider.enqueue({
      ...input,
      retryPolicy: {
        ...ndieQueueConfig.retryPolicy,
        ...input.retryPolicy
      }
    });
  },

  async enqueueImport(input: { importJobId: string; sourceDocumentId?: string; fileType?: string }) {
    return this.enqueue({
      importJobId: input.importJobId,
      jobType: "IMPORT_PIPELINE",
      stage: input.fileType === "application/pdf" ? "PDF_RENDERING" : "IMPORT_PIPELINE_PLACEHOLDER",
      payload: {
        pipelineVersion: env.NDIE_PIPELINE_VERSION,
        queuedBy: "ndie-source-storage",
        sourceDocumentId: input.sourceDocumentId ?? null,
        fileType: input.fileType ?? null
      } as Prisma.InputJsonValue
    });
  },

  async enqueueReplay(input: { importJobId: string; replayRunId: string; stages: string[]; requestedBy?: string }) {
    return this.enqueue({
      importJobId: input.importJobId,
      replayRunId: input.replayRunId,
      jobType: "REPLAY_PIPELINE",
      stage: "REPLAY_PIPELINE_PLACEHOLDER",
      payload: {
        stages: input.stages,
        requestedBy: input.requestedBy ?? null,
        pipelineVersion: env.NDIE_PIPELINE_VERSION
      } as Prisma.InputJsonValue
    });
  },

  async enqueueOcr(input: { importJobId: string; requestedBy?: string }) {
    return this.enqueue({
      importJobId: input.importJobId,
      jobType: "PLACEHOLDER_STAGE",
      stage: "OCR",
      payload: {
        pipelineVersion: env.NDIE_PIPELINE_VERSION,
        queuedBy: input.requestedBy ?? "ndie-worker",
        consumes: "RENDERED_PAGE_OCR_IMAGE",
        produces: "NORMALIZED_OCR_JSON"
      } as Prisma.InputJsonValue
    });
  },

  async enqueueLayout(input: { importJobId: string; requestedBy?: string }) {
    return this.enqueue({
      importJobId: input.importJobId,
      jobType: "PLACEHOLDER_STAGE",
      stage: "LAYOUT",
      payload: {
        pipelineVersion: env.NDIE_PIPELINE_VERSION,
        queuedBy: input.requestedBy ?? "ndie-worker",
        consumes: "NORMALIZED_OCR_JSON",
        produces: "NORMALIZED_LAYOUT_JSON"
      } as Prisma.InputJsonValue
    });
  },

  async enqueueFormula(input: { importJobId: string; requestedBy?: string }) {
    return this.enqueue({
      importJobId: input.importJobId,
      jobType: "PLACEHOLDER_STAGE",
      stage: "FORMULA",
      payload: {
        pipelineVersion: env.NDIE_PIPELINE_VERSION,
        queuedBy: input.requestedBy ?? "ndie-worker",
        consumes: ["RENDERED_PAGE_IMAGES", "NORMALIZED_OCR_JSON", "NORMALIZED_LAYOUT_JSON"],
        produces: "NORMALIZED_FORMULA_JSON"
      } as Prisma.InputJsonValue
    });
  },

  async enqueueVisual(input: { importJobId: string; requestedBy?: string }) {
    return this.enqueue({
      importJobId: input.importJobId,
      jobType: "PLACEHOLDER_STAGE",
      stage: "VISUAL",
      payload: {
        pipelineVersion: env.NDIE_PIPELINE_VERSION,
        queuedBy: input.requestedBy ?? "ndie-worker",
        consumes: ["RENDERED_PAGE_IMAGES", "NORMALIZED_OCR_JSON", "NORMALIZED_LAYOUT_JSON", "NORMALIZED_FORMULA_JSON"],
        produces: "NORMALIZED_VISUAL_JSON"
      } as Prisma.InputJsonValue
    });
  },

  async enqueueQuestion(input: { importJobId: string; requestedBy?: string }) {
    return this.enqueue({
      importJobId: input.importJobId,
      jobType: "PLACEHOLDER_STAGE",
      stage: "QUESTION",
      payload: {
        pipelineVersion: env.NDIE_PIPELINE_VERSION,
        queuedBy: input.requestedBy ?? "ndie-worker",
        consumes: ["NORMALIZED_OCR_JSON", "NORMALIZED_LAYOUT_JSON", "NORMALIZED_FORMULA_JSON", "NORMALIZED_VISUAL_JSON"],
        produces: "NORMALIZED_QUESTION_JSON"
      } as Prisma.InputJsonValue
    });
  },

  transition: provider.transition.bind(provider),
  updateProgress: provider.updateProgress.bind(provider),
  cancel: provider.cancel.bind(provider),
  failOrRetry: provider.failOrRetry.bind(provider),
  metrics: provider.metrics.bind(provider),
  health: provider.health.bind(provider)
};

export function ndieWorkerId(prefix = "ndie-worker") {
  return `${prefix}-${process.pid}-${randomUUID()}`;
}

export async function logNdieQueueEvent(input: {
  jobId: string;
  importJobId: string;
  stage: string;
  workerId?: string | null;
  durationMs?: number | null;
  result: string;
  retryCount?: number;
  errorCategory?: string | null;
}) {
  logger.info("NDIE queue event", {
    jobId: input.jobId,
    importId: input.importJobId,
    stage: input.stage,
    worker: input.workerId ?? null,
    durationMs: input.durationMs ?? null,
    result: input.result,
    retryCount: input.retryCount ?? 0,
    errorCategory: input.errorCategory ?? null
  });
}
