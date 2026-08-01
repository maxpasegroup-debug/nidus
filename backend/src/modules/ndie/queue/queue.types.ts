import type { Prisma } from "../../../generated/prisma/client.js";
import type { NdieJobState } from "./state-machine.js";

export type NdieJobType = "IMPORT_PIPELINE" | "REPLAY_PIPELINE" | "PLACEHOLDER_STAGE";

export type NdieRetryPolicy = {
  maxAttempts: number;
  retryDelayMs: number;
  backoffStrategy: "FIXED" | "EXPONENTIAL";
};

export type NdieQueueJobInput = {
  importJobId: string;
  replayRunId?: string | null;
  jobType: NdieJobType;
  stage: string;
  payload?: Prisma.InputJsonValue;
  retryPolicy?: Partial<NdieRetryPolicy>;
};

export type NdieQueueJobSnapshot = {
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
};

export type NdieQueueMetrics = {
  provider: string;
  queued: number;
  processing: number;
  completed: number;
  failed: number;
  cancelled: number;
  retry: number;
  rendering: number;
  pagesCreated: number;
  readyForOcr: number;
  ocrRunning: number;
  ocrCompleted: number;
  readyForLayout: number;
  layoutRunning: number;
  layoutCompleted: number;
  readyForFormulaEngine: number;
  formulaRunning: number;
  formulaCompleted: number;
  readyForVisualEngine: number;
  visualRunning: number;
  visualCompleted: number;
  readyForQuestionEngine: number;
  questionRunning: number;
  questionCompleted: number;
  readyForAnswerEngine: number;
  answerRunning: number;
  answerCompleted: number;
  readyForAiValidation: number;
  dlq: number;
  averageDurationMs: number;
  pendingJobs: number;
  failedJobs: number;
  dlqCount: number;
};

export interface NdieQueueProvider {
  id: string;
  health(): Promise<{ provider: string; status: "ready" | "degraded" | "disabled"; pendingJobs: number; failedJobs: number; dlqCount: number }>;
  enqueue(input: NdieQueueJobInput): Promise<NdieQueueJobSnapshot>;
  transition(jobId: string, nextState: NdieJobState, metadata?: Record<string, unknown>): Promise<NdieQueueJobSnapshot>;
  updateProgress(jobId: string, progress: number, currentStage: string): Promise<NdieQueueJobSnapshot>;
  cancel(jobId: string, reason?: string): Promise<NdieQueueJobSnapshot>;
  failOrRetry(jobId: string, error: Error, workerId?: string): Promise<NdieQueueJobSnapshot>;
  metrics(): Promise<NdieQueueMetrics>;
}
