export const NDIE_PIPELINE_EVENTS = [
  "IMPORT_CREATED",
  "SOURCE_STORED",
  "DOCUMENT_CLASSIFIED",
  "PAGES_RENDERED",
  "OCR_COMPLETED",
  "LAYOUT_ANALYZED",
  "FORMULAS_DETECTED",
  "VISUALS_DETECTED",
  "QUESTIONS_DETECTED",
  "OPTIONS_DETECTED",
  "ANSWER_KEYS_MAPPED",
  "SOLUTIONS_MAPPED",
  "AI_VALIDATED",
  "CONFIDENCE_SCORED",
  "QUALITY_SCORED",
  "READY_FOR_REVIEW",
  "TEACHER_APPROVED",
  "PUBLISHED_TO_CBT",
  "REPLAY_REQUESTED",
  "REPLAY_COMPLETED"
] as const;

export type NdiePipelineEventName = typeof NDIE_PIPELINE_EVENTS[number];

export type NdieCheckpointStatus = "PENDING" | "RUNNING" | "SUCCEEDED" | "FAILED" | "SKIPPED";

export type NdieCheckpoint = {
  name: NdiePipelineEventName;
  status: NdieCheckpointStatus;
  startedAt?: string;
  completedAt?: string;
  retryable: boolean;
  error?: string;
};

export type NdiePipelineEvent = {
  id: string;
  importJobId?: string;
  name: NdiePipelineEventName;
  occurredAt: string;
  payload?: Record<string, unknown>;
};
