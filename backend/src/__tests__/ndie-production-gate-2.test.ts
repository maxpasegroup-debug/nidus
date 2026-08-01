import { describe, expect, it } from "@jest/globals";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { assertNdieJobTransition, nextRetryDelayMs } from "../modules/ndie/queue/state-machine.js";

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");

describe("NDIE Production Gate 2 queue foundation", () => {
  const schema = read("prisma/schema.prisma");
  const env = read("src/config/env.ts");
  const sourceStorage = read("src/modules/ndie/source-storage/source-storage.service.ts");
  const replay = read("src/modules/ndie/import-replay/import-replay.service.ts");
  const queueTypes = read("src/modules/ndie/queue/queue.types.ts");
  const queueProvider = read("src/modules/ndie/queue/database-queue.provider.ts");
  const queueService = read("src/modules/ndie/queue/queue.service.ts");
  const worker = read("src/modules/ndie/worker/worker.service.ts");
  const service = read("src/modules/ndie/ndie.service.ts");
  const controller = read("src/modules/ndie/ndie.controller.ts");
  const routes = read("src/modules/ndie/ndie.routes.ts");

  it("adds a persistent queue model with progress, retry, DLQ and metrics fields", () => {
    expect(schema).toContain("model NdieQueueJob");
    expect(schema).toContain("importJobId");
    expect(schema).toContain("replayRunId");
    expect(schema).toContain("state");
    expect(schema).toContain("progress");
    expect(schema).toContain("attempts");
    expect(schema).toContain("maxAttempts");
    expect(schema).toContain("retryHistory");
    expect(schema).toContain("diagnostics");
    expect(schema).toContain("durationMs");
    expect(schema).toContain("@@index([state])");
  });

  it("keeps the queue provider abstract and defaults to a database adapter", () => {
    expect(queueTypes).toContain("interface NdieQueueProvider");
    expect(queueTypes).toContain("enqueue(input");
    expect(queueTypes).toContain("transition(jobId");
    expect(queueTypes).toContain("failOrRetry(jobId");
    expect(queueProvider).toContain("class DatabaseNdieQueueProvider");
    expect(queueService).toContain("provider: env.NDIE_QUEUE_PROVIDER");
  });

  it("defines production-safe queue configuration", () => {
    expect(env).toContain("NDIE_QUEUE_PROVIDER");
    expect(env).toContain("NDIE_QUEUE_WORKERS_ENABLED");
    expect(env).toContain("NDIE_WORKER_CONCURRENCY");
    expect(env).toContain("NDIE_JOB_MAX_ATTEMPTS");
    expect(env).toContain("NDIE_JOB_RETRY_DELAY_MS");
    expect(env).toContain("NDIE_JOB_BACKOFF_STRATEGY");
    expect(env).toContain("NDIE_JOB_TIMEOUT_MS");
    expect(env).toContain("envBoolean(false)");
  });

  it("uses an explicit state machine and rejects illegal transitions", () => {
    expect(() => assertNdieJobTransition("QUEUED", "PROCESSING")).not.toThrow();
    expect(() => assertNdieJobTransition("COMPLETED", "PROCESSING")).toThrow(/Illegal NDIE queue transition/);
    expect(nextRetryDelayMs({ retryDelayMs: 1000, attempts: 3, backoffStrategy: "EXPONENTIAL" })).toBe(4000);
  });

  it("moves exhausted retries to DLQ without infinite retries", () => {
    expect(queueProvider).toContain("retryLimitExceeded");
    expect(queueProvider).toContain('const state = retryLimitExceeded ? "DLQ" : "RETRY_PENDING"');
    expect(queueProvider).toContain("nextRunAt");
    expect(queueProvider).toContain("maxAttempts");
  });

  it("converts source import processing into queued placeholder pipeline work", () => {
    expect(sourceStorage).toContain("ndieQueueService.enqueueImport({");
    expect(sourceStorage).toContain('status: "QUEUED"');
    expect(sourceStorage).not.toContain("ndiePdfRendererService.renderSourceDocument");
    expect(sourceStorage).not.toContain("ndieOcrService.runOcr");
  });

  it("converts replay into a linked queue job instead of synchronous reprocessing", () => {
    expect(replay).toContain('status: "QUEUED"');
    expect(replay).toContain("ndieQueueService.enqueueReplay");
    expect(replay).toContain("queueJobId");
    expect(replay).not.toContain("runStage(");
  });

  it("adds worker lifecycle infrastructure without running document intelligence", () => {
    expect(worker).toContain("runPlaceholderJob");
    expect(queueService).toContain("NDIE_QUEUE_WORKERS_ENABLED");
    expect(worker).toContain("PLACEHOLDER_CHECKPOINT");
  });

  it("extends health and metrics with queue and worker status", () => {
    expect(service).toContain("ndieQueueService.health()");
    expect(service).toContain("ndieWorkerService.health()");
    expect(service).toContain("ndieQueueService.metrics()");
    expect(controller).toContain("await ndieService.health()");
    expect(queueProvider).toContain("averageDurationMs");
    expect(queueProvider).toContain("dlqCount");
  });

  it("supports cancelling queued imports through authorized NDIE routes", () => {
    expect(routes).toContain('ndieRouter.post("/imports/:id/cancel"');
    expect(controller).toContain("cancelImport");
    expect(service).toContain("ndieQueueService.cancel");
    expect(controller).toContain("NDIE_IMPORT_CANCELLED");
  });
});
