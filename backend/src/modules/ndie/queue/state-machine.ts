export const NDIE_JOB_STATES = [
  "CREATED",
  "SOURCE_STORED",
  "QUEUED",
  "PROCESSING",
  "WAITING_FOR_PROVIDER",
  "COMPLETED",
  "FAILED",
  "CANCELLED",
  "RETRY_PENDING",
  "REPLAY_PENDING",
  "RENDERING",
  "PAGES_CREATED",
  "READY_FOR_OCR",
  "OCR_RUNNING",
  "OCR_COMPLETED",
  "READY_FOR_LAYOUT",
  "DLQ"
] as const;

export type NdieJobState = (typeof NDIE_JOB_STATES)[number];

const transitions: Record<NdieJobState, NdieJobState[]> = {
  CREATED: ["SOURCE_STORED", "QUEUED", "CANCELLED", "FAILED"],
  SOURCE_STORED: ["QUEUED", "CANCELLED", "FAILED"],
  QUEUED: ["PROCESSING", "CANCELLED", "FAILED"],
  PROCESSING: ["RENDERING", "WAITING_FOR_PROVIDER", "COMPLETED", "FAILED", "RETRY_PENDING", "CANCELLED"],
  RENDERING: ["PAGES_CREATED", "FAILED", "RETRY_PENDING", "CANCELLED"],
  PAGES_CREATED: ["READY_FOR_OCR", "FAILED", "RETRY_PENDING", "CANCELLED"],
  READY_FOR_OCR: ["OCR_RUNNING", "COMPLETED", "REPLAY_PENDING"],
  OCR_RUNNING: ["OCR_COMPLETED", "FAILED", "RETRY_PENDING", "CANCELLED"],
  OCR_COMPLETED: ["READY_FOR_LAYOUT", "FAILED", "RETRY_PENDING", "CANCELLED"],
  READY_FOR_LAYOUT: ["COMPLETED", "REPLAY_PENDING"],
  WAITING_FOR_PROVIDER: ["PROCESSING", "COMPLETED", "FAILED", "RETRY_PENDING", "CANCELLED"],
  COMPLETED: ["REPLAY_PENDING"],
  FAILED: ["RETRY_PENDING", "DLQ", "REPLAY_PENDING"],
  CANCELLED: ["REPLAY_PENDING"],
  RETRY_PENDING: ["QUEUED", "PROCESSING", "CANCELLED", "DLQ"],
  REPLAY_PENDING: ["QUEUED", "CANCELLED", "FAILED"],
  DLQ: ["REPLAY_PENDING"]
};

export function assertNdieJobTransition(from: string, to: NdieJobState) {
  const current = from as NdieJobState;
  if (!NDIE_JOB_STATES.includes(current)) {
    throw Object.assign(new Error(`Unknown NDIE queue state: ${from}`), { statusCode: 500 });
  }
  if (!transitions[current].includes(to)) {
    throw Object.assign(new Error(`Illegal NDIE queue transition: ${from} -> ${to}`), { statusCode: 409 });
  }
}

export function nextRetryDelayMs(input: { retryDelayMs: number; attempts: number; backoffStrategy: string }) {
  if (input.backoffStrategy !== "EXPONENTIAL") return input.retryDelayMs;
  const multiplier = 2 ** Math.max(0, input.attempts - 1);
  return Math.min(input.retryDelayMs * multiplier, 15 * 60 * 1000);
}
