import os from "node:os";
import { prisma } from "../../../config/prisma.js";
import { env } from "../../../config/env.js";

type StageKind = "IMPORT" | "REPLAY" | "PUBLISH" | "DELIVERY" | "INTELLIGENCE";

function queueClass(stage: string): StageKind {
  if (stage === "PUBLISH") return "PUBLISH";
  if (stage === "STUDENT_DELIVERY") return "DELIVERY";
  if (stage.includes("REPLAY")) return "REPLAY";
  if (["PDF_RENDERING", "OCR", "LAYOUT", "FORMULA", "VISUAL", "QUESTION", "ANSWER", "AI_VALIDATION"].includes(stage)) return "IMPORT";
  return "INTELLIGENCE";
}

function poolSize(kind: StageKind) {
  if (kind === "PUBLISH") return env.NDIE_PUBLISH_WORKER_POOL;
  if (kind === "DELIVERY") return env.NDIE_DELIVERY_WORKER_POOL;
  if (kind === "REPLAY") return env.NDIE_REPLAY_WORKER_POOL;
  if (kind === "IMPORT") return env.NDIE_IMPORT_WORKER_POOL;
  return env.NDIE_WORKER_CONCURRENCY;
}

function chunkSize(stage: string) {
  if (stage === "PDF_RENDERING") return env.NDIE_RENDER_CHUNK_SIZE;
  if (stage === "OCR") return Math.max(1, Math.min(10, env.NDIE_RENDER_CHUNK_SIZE * 2));
  if (stage === "LAYOUT") return 10;
  if (stage === "FORMULA" || stage === "VISUAL") return 5;
  return 25;
}

function chunkPlan(pageCount: number, stage: string) {
  const safePageCount = Math.max(0, Math.min(env.NDIE_MAX_DOCUMENT_PAGES, Math.floor(pageCount)));
  const size = chunkSize(stage);
  const chunks: Array<{ index: number; startPage: number; endPage: number; size: number }> = [];
  for (let start = 1; start <= safePageCount; start += size) {
    const end = Math.min(safePageCount, start + size - 1);
    chunks.push({ index: chunks.length + 1, startPage: start, endPage: end, size: end - start + 1 });
  }
  return {
    pageCount: safePageCount,
    rejectedPages: Math.max(0, Math.floor(pageCount) - safePageCount),
    stage,
    chunkSize: size,
    chunks,
    resumable: true,
    incrementalPersistence: true
  };
}

function memoryStatus() {
  const memory = process.memoryUsage();
  const total = os.totalmem();
  const free = os.freemem();
  const usedRatio = total ? (total - free) / total : 0;
  return {
    rssMb: Math.round(memory.rss / 1024 / 1024),
    heapUsedMb: Math.round(memory.heapUsed / 1024 / 1024),
    heapTotalMb: Math.round(memory.heapTotal / 1024 / 1024),
    systemUsedPercent: Math.round(usedRatio * 100),
    status: usedRatio > 0.9 ? "CRITICAL" : usedRatio > 0.8 ? "PRESSURE" : "OK"
  };
}

function benchmarkPlan(pages: number) {
  return {
    pages,
    renderChunks: chunkPlan(pages, "PDF_RENDERING").chunks.length,
    ocrChunks: chunkPlan(pages, "OCR").chunks.length,
    layoutChunks: chunkPlan(pages, "LAYOUT").chunks.length,
    expectedMode: pages >= 250 ? "LONG_RUNNING_CHUNKED_IMPORT" : pages >= 50 ? "STANDARD_CHUNKED_IMPORT" : "FAST_IMPORT",
    memoryMode: "incremental-page-persistence",
    recovery: "resume-from-last-successful-chunk"
  };
}

export const ndiePerformanceService = {
  queueClass,
  chunkPlan,

  cacheKey(input: { importJobId: string; stage: string; version?: string; checksum?: string | null }) {
    return [
      "ndie",
      env.NDIE_PIPELINE_VERSION,
      input.version ?? "v1",
      input.importJobId,
      input.stage,
      input.checksum ?? "no-checksum"
    ].join(":");
  },

  async health() {
    const now = new Date();
    const heartbeatCutoff = new Date(now.getTime() - env.NDIE_WORKER_HEARTBEAT_TTL_MS);
    const [
      queueStates,
      durations,
      recentCompleted,
      providerRuns,
      activeImports,
      largeDocs,
      storage
    ] = await Promise.all([
      prisma.ndieQueueJob.groupBy({ by: ["state", "stage"], _count: { _all: true } }),
      prisma.ndieQueueJob.groupBy({ by: ["stage"], where: { durationMs: { not: null } }, _avg: { durationMs: true }, _count: { _all: true } }),
      prisma.ndieQueueJob.count({ where: { completedAt: { gte: new Date(now.getTime() - 60 * 60 * 1000) } } }),
      prisma.ndieProviderRun.groupBy({ by: ["providerKind"], where: { completedAt: { not: null } }, _avg: { confidence: true }, _count: { _all: true } }),
      prisma.ndieImportJob.count({ where: { status: { in: ["QUEUED", "PROCESSING", "RETRY_PENDING", "REPLAY_PENDING"] } } }),
      prisma.ndieSourceDocument.count({ where: { pageCount: { gte: 250 } } }),
      prisma.ndiePage.aggregate({ _sum: { imageSizeBytes: true }, _count: { _all: true } })
    ]);

    const stateCount = (state: string) => queueStates.filter((row) => row.state === state).reduce((sum, row) => sum + row._count._all, 0);
    const queued = stateCount("QUEUED") + stateCount("RETRY_PENDING") + stateCount("REPLAY_PENDING");
    const processing = stateCount("PROCESSING") + queueStates
      .filter((row) => row.state.endsWith("_RUNNING") || row.state === "RENDERING")
      .reduce((sum, row) => sum + row._count._all, 0);
    const backpressure = queued >= env.NDIE_BACKPRESSURE_MAX_QUEUED || processing >= env.NDIE_BACKPRESSURE_MAX_PROCESSING;

    return {
      status: backpressure ? "degraded" : "ready",
      performanceVersion: "ndie-enterprise-performance-v1",
      workerPools: {
        import: env.NDIE_IMPORT_WORKER_POOL,
        replay: env.NDIE_REPLAY_WORKER_POOL,
        publish: env.NDIE_PUBLISH_WORKER_POOL,
        delivery: env.NDIE_DELIVERY_WORKER_POOL,
        defaultConcurrency: env.NDIE_WORKER_CONCURRENCY,
        heartbeatTtlMs: env.NDIE_WORKER_HEARTBEAT_TTL_MS,
        staleWorkerCutoff: heartbeatCutoff.toISOString()
      },
      queueDepth: {
        queued,
        processing,
        failed: stateCount("FAILED"),
        dlq: stateCount("DLQ"),
        backpressure,
        thresholds: {
          queued: env.NDIE_BACKPRESSURE_MAX_QUEUED,
          processing: env.NDIE_BACKPRESSURE_MAX_PROCESSING
        }
      },
      throughput: {
        completedLastHour: recentCompleted,
        activeImports,
        largeDocuments: largeDocs
      },
      averageProcessingTimeMs: Object.fromEntries(durations.map((row) => [row.stage, Math.round(row._avg.durationMs ?? 0)])),
      providerLatency: providerRuns.map((run) => ({
        providerKind: run.providerKind,
        runs: run._count._all,
        averageConfidence: run._avg.confidence
      })),
      memory: memoryStatus(),
      storageUsage: {
        renderedPages: storage._count._all,
        imageSizeMb: Math.round(Number(storage._sum.imageSizeBytes ?? 0) / 1024 / 1024)
      },
      cache: {
        enabled: env.NDIE_CACHE_ENABLED,
        ttlSeconds: env.NDIE_CACHE_TTL_SECONDS,
        strategy: ["page-assets", "ocr-json", "layout-json", "formula-json", "visual-json", "assessment-json", "validation-json", "published-packages"]
      },
      largeDocumentPlan: {
        maxPages: env.NDIE_MAX_DOCUMENT_PAGES,
        sample1000PageImport: benchmarkPlan(1000)
      }
    };
  },

  benchmarkSuite() {
    const pageCases = [10, 50, 250, 500, 1000];
    return {
      generatedAt: new Date().toISOString(),
      benchmarkVersion: "ndie-performance-benchmark-v1",
      pageCases: pageCases.map(benchmarkPlan),
      concurrencyCases: [
        { scenario: "concurrent-imports", jobs: env.NDIE_IMPORT_WORKER_POOL, backpressureLimit: env.NDIE_BACKPRESSURE_MAX_QUEUED },
        { scenario: "concurrent-publishing", jobs: env.NDIE_PUBLISH_WORKER_POOL, queueClass: "PUBLISH" },
        { scenario: "concurrent-delivery", jobs: env.NDIE_DELIVERY_WORKER_POOL, queueClass: "DELIVERY" }
      ],
      reliabilityChecks: ["retry-with-backoff", "dlq-after-max-attempts", "chunk-resume", "worker-heartbeat", "graceful-shutdown", "backpressure"]
    };
  },

  poolForStage(stage: string) {
    const kind = queueClass(stage);
    return { kind, poolSize: poolSize(kind), chunkSize: chunkSize(stage) };
  }
};
