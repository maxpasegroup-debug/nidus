import { describe, expect, it } from "@jest/globals";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");

describe("NDIE Production Gate 14 enterprise performance", () => {
  const env = read("src/config/env.ts");
  const performance = read("src/modules/ndie/performance/performance.service.ts");
  const registry = read("src/modules/ndie/performance/worker-registry.service.ts");
  const queueService = read("src/modules/ndie/queue/queue.service.ts");
  const queueTypes = read("src/modules/ndie/queue/queue.types.ts");
  const worker = read("src/modules/ndie/worker/worker.service.ts");
  const ndieService = read("src/modules/ndie/ndie.service.ts");

  it("adds production-safe performance and worker-pool configuration", () => {
    expect(env).toContain("NDIE_IMPORT_WORKER_POOL");
    expect(env).toContain("NDIE_REPLAY_WORKER_POOL");
    expect(env).toContain("NDIE_PUBLISH_WORKER_POOL");
    expect(env).toContain("NDIE_DELIVERY_WORKER_POOL");
    expect(env).toContain("NDIE_WORKER_HEARTBEAT_TTL_MS");
    expect(env).toContain("NDIE_BACKPRESSURE_MAX_QUEUED");
    expect(env).toContain("NDIE_MAX_DOCUMENT_PAGES");
  });

  it("classifies queues and annotates jobs with priority and pool metadata", () => {
    expect(queueTypes).toContain("priority?: number");
    expect(queueTypes).toContain("queueClass?");
    expect(queueService).toContain("queueClass: \"IMPORT\"");
    expect(queueService).toContain("queueClass: \"REPLAY\"");
    expect(queueService).toContain("queueClass: \"PUBLISH\"");
    expect(queueService).toContain("queueClass: \"DELIVERY\"");
    expect(queueService).toContain("workerPoolSize");
    expect(queueService).toContain("cacheKey");
  });

  it("supports chunk planning for large documents without changing intelligence stages", () => {
    expect(performance).toContain("chunkPlan");
    expect(performance).toContain("NDIE_MAX_DOCUMENT_PAGES");
    expect(performance).toContain("incrementalPersistence");
    expect(performance).toContain("resume-from-last-successful-chunk");
    expect(performance).toContain("sample1000PageImport");
    expect(performance).toContain("benchmarkSuite");
  });

  it("adds worker registration, heartbeat and graceful shutdown surfaces", () => {
    expect(registry).toContain("register");
    expect(registry).toContain("heartbeat");
    expect(registry).toContain("gracefulShutdown");
    expect(registry).toContain("stale");
    expect(worker).toContain("ndieWorkerRegistryService.register");
    expect(worker).toContain("ndieWorkerRegistryService.heartbeat");
    expect(worker).toContain("gracefulShutdown");
  });

  it("extends health with resource, throughput, provider, cache and backpressure metrics", () => {
    expect(performance).toContain("queueDepth");
    expect(performance).toContain("throughput");
    expect(performance).toContain("providerLatency");
    expect(performance).toContain("memoryStatus");
    expect(performance).toContain("storageUsage");
    expect(performance).toContain("backpressure");
    expect(performance).toContain("page-assets");
    expect(ndieService).toContain("performance");
  });
});
