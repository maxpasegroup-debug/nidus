import { prisma } from "../../../config/prisma.js";
import { env } from "../../../config/env.js";
import { Prisma } from "../../../generated/prisma/client.js";
import { ndieComplianceService } from "../security/compliance.service.js";
import { ndiePerformanceService } from "../performance/performance.service.js";
import { ndieWorkerRegistryService } from "../performance/worker-registry.service.js";
import { ndieQueueService } from "../queue/queue.service.js";

const operationsVersion = "ndie-operations-center-v1";
const oneDayMs = 24 * 60 * 60 * 1000;

const activeImportStates = [
  "QUEUED",
  "PROCESSING",
  "RENDERING",
  "READY_FOR_OCR",
  "OCR_RUNNING",
  "READY_FOR_LAYOUT",
  "LAYOUT_RUNNING",
  "READY_FOR_FORMULA_ENGINE",
  "FORMULA_RUNNING",
  "READY_FOR_VISUAL_ENGINE",
  "VISUAL_RUNNING",
  "READY_FOR_QUESTION_ENGINE",
  "QUESTION_RUNNING",
  "READY_FOR_ANSWER_ENGINE",
  "ANSWER_RUNNING",
  "READY_FOR_AI_VALIDATION",
  "AI_VALIDATION_RUNNING",
  "READY_FOR_PUBLISH",
  "PUBLISH_RUNNING",
  "READY_FOR_STUDENT_DELIVERY"
];

const completedImportStates = [
  "READY_FOR_TEACHER_REVIEW",
  "PUBLISH_COMPLETED",
  "DELIVERY_READY",
  "COMPLETED"
];

const failedImportStates = ["FAILED", "DLQ", "CANCELLED"];

function durationMs(start?: Date | null, end?: Date | null) {
  return start && end ? Math.max(0, end.getTime() - start.getTime()) : null;
}

function average(values: Array<number | null | undefined>) {
  const filtered = values.filter((value): value is number => typeof value === "number" && Number.isFinite(value));
  if (!filtered.length) return 0;
  return Math.round(filtered.reduce((sum, value) => sum + value, 0) / filtered.length);
}

function ratio(part: number, whole: number) {
  return whole ? Math.round((part / whole) * 1000) / 10 : 0;
}

function statusFromSignals(input: { failed: number; dlq: number; staleWorkers: number; securityEvents: number; backpressure: boolean }) {
  if (input.dlq > 0 || input.securityEvents > 10) return "CRITICAL" as const;
  if (input.failed > 0 || input.staleWorkers > 0 || input.backpressure) return "WARNING" as const;
  return "READY" as const;
}

function providerKey(run: { providerId: string; providerKind: string; stage: string }) {
  return [run.providerKind, run.providerId, run.stage].join(":");
}

function queueClass(stage: string, jobType?: string | null) {
  if (stage === "PUBLISH") return "PUBLISH";
  if (stage === "STUDENT_DELIVERY") return "DELIVERY";
  if ((jobType ?? "").includes("REPLAY") || stage.includes("REPLAY")) return "REPLAY";
  if (["PDF_RENDERING", "OCR", "LAYOUT", "FORMULA", "VISUAL", "QUESTION", "ANSWER", "AI_VALIDATION"].includes(stage)) return "IMPORT";
  return "INTELLIGENCE";
}

function costRound(value: number) {
  return Math.round(value * 10000) / 10000;
}

function buildCostEstimate(input: {
  pages: number;
  ocrPages: number;
  validationRuns: number;
  renderedBytes: number;
  sourceBytes: number;
  bandwidthBytes: number;
}) {
  const rates = {
    renderPerPageUsd: 0.0002,
    ocrPerPageUsd: 0.001,
    aiValidationPerRunUsd: 0.002,
    storagePerGbMonthUsd: 0.023,
    bandwidthPerGbUsd: 0.09
  };
  const storageGb = (input.renderedBytes + input.sourceBytes) / 1024 / 1024 / 1024;
  const bandwidthGb = input.bandwidthBytes / 1024 / 1024 / 1024;
  const renderCost = input.pages * rates.renderPerPageUsd;
  const ocrCost = input.ocrPages * rates.ocrPerPageUsd;
  const aiCost = input.validationRuns * rates.aiValidationPerRunUsd;
  const storageCost = storageGb * rates.storagePerGbMonthUsd;
  const bandwidthCost = bandwidthGb * rates.bandwidthPerGbUsd;
  return {
    mode: "provider-independent-estimate",
    currency: "USD",
    rates,
    totals: {
      render: costRound(renderCost),
      ocr: costRound(ocrCost),
      ai: costRound(aiCost),
      storageMonthly: costRound(storageCost),
      bandwidth: costRound(bandwidthCost),
      estimatedTotal: costRound(renderCost + ocrCost + aiCost + storageCost + bandwidthCost)
    },
    note: "Gate 16 estimates operational cost from usage counters only; provider billing adapters can replace these rates later."
  };
}

async function operationalState() {
  const [
    activeImports,
    queuedImports,
    completedImports,
    failedImports,
    replayJobs,
    publishingJobs,
    deliveryJobs
  ] = await Promise.all([
    prisma.ndieImportJob.count({ where: { status: { in: activeImportStates } } }),
    prisma.ndieImportJob.count({ where: { status: { in: ["QUEUED", "RETRY_PENDING", "REPLAY_PENDING"] } } }),
    prisma.ndieImportJob.count({ where: { status: { in: completedImportStates } } }),
    prisma.ndieImportJob.count({ where: { status: { in: failedImportStates } } }),
    prisma.ndieQueueJob.count({ where: { jobType: { contains: "REPLAY" } } }),
    prisma.ndieQueueJob.count({ where: { stage: "PUBLISH" } }),
    prisma.ndieQueueJob.count({ where: { stage: "STUDENT_DELIVERY" } })
  ]);
  return { activeImports, queuedImports, completedImports, failedImports, replayJobs, publishingJobs, deliveryJobs };
}

async function providerMonitoring() {
  const runs = await prisma.ndieProviderRun.findMany({
    orderBy: { startedAt: "desc" },
    take: 1000,
    select: {
      providerId: true,
      providerKind: true,
      stage: true,
      status: true,
      confidence: true,
      error: true,
      startedAt: true,
      completedAt: true
    }
  });
  const grouped = new Map<string, typeof runs>();
  for (const run of runs) {
    const key = providerKey(run);
    grouped.set(key, [...(grouped.get(key) ?? []), run]);
  }
  return Array.from(grouped.values()).map((group) => {
    const first = group[0];
    const successes = group.filter((run) => ["COMPLETED", "SUCCESS", "READY", "PUBLISH_COMPLETED"].includes(run.status)).length;
    const failures = group.filter((run) => run.status === "FAILED" || Boolean(run.error)).length;
    const lastSuccess = group.find((run) => ["COMPLETED", "SUCCESS", "READY", "PUBLISH_COMPLETED"].includes(run.status));
    const lastFailure = group.find((run) => run.status === "FAILED" || Boolean(run.error));
    return {
      providerName: first.providerId,
      providerVersion: "tracked-by-provider-run",
      providerKind: first.providerKind,
      stage: first.stage,
      runs: group.length,
      successRate: ratio(successes, group.length),
      failureRate: ratio(failures, group.length),
      averageDurationMs: average(group.map((run) => durationMs(run.startedAt, run.completedAt))),
      averageConfidence: Math.round((group.reduce((sum, run) => sum + (run.confidence ?? 0), 0) / Math.max(1, group.filter((run) => typeof run.confidence === "number").length)) * 1000) / 1000,
      availability: failures === group.length ? "DOWN" : failures > 0 ? "DEGRADED" : "AVAILABLE",
      lastSuccessfulRun: lastSuccess?.completedAt?.toISOString() ?? null,
      lastFailure: lastFailure ? { at: lastFailure.completedAt?.toISOString() ?? lastFailure.startedAt.toISOString(), error: lastFailure.error ?? "Provider run failed" } : null
    };
  });
}

async function queueDashboard() {
  const jobs = await prisma.ndieQueueJob.findMany({
    orderBy: { queuedAt: "desc" },
    take: 2000,
    select: {
      id: true,
      jobType: true,
      stage: true,
      state: true,
      progress: true,
      workerId: true,
      provider: true,
      queuedAt: true,
      startedAt: true,
      completedAt: true,
      durationMs: true,
      attempts: true,
      errorCategory: true
    }
  });
  const countState = (state: string) => jobs.filter((job) => job.state === state).length;
  const processingJobs = jobs.filter((job) => job.state === "PROCESSING" || job.state.endsWith("_RUNNING") || job.state === "RENDERING");
  const queuedJobs = jobs.filter((job) => ["QUEUED", "RETRY_PENDING", "REPLAY_PENDING"].includes(job.state));
  const priorityDistribution = jobs.reduce<Record<string, number>>((acc, job) => {
    const key = queueClass(job.stage, job.jobType);
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
  return {
    queueDepth: queuedJobs.length,
    processing: processingJobs.length,
    retry: countState("RETRY_PENDING"),
    dlq: countState("DLQ"),
    failed: countState("FAILED"),
    cancelled: countState("CANCELLED"),
    averageWaitTimeMs: average(jobs.map((job) => durationMs(job.queuedAt, job.startedAt))),
    averageProcessingTimeMs: average(jobs.map((job) => job.durationMs ?? durationMs(job.startedAt, job.completedAt))),
    throughput: {
      completedLast24h: jobs.filter((job) => job.completedAt && job.completedAt.getTime() >= Date.now() - oneDayMs).length,
      totalSampled: jobs.length
    },
    backpressure: queuedJobs.length >= env.NDIE_BACKPRESSURE_MAX_QUEUED || processingJobs.length >= env.NDIE_BACKPRESSURE_MAX_PROCESSING,
    priorityDistribution,
    recentFailures: jobs.filter((job) => job.errorCategory).slice(0, 10).map((job) => ({
      jobId: job.id,
      stage: job.stage,
      state: job.state,
      errorCategory: job.errorCategory,
      attempts: job.attempts
    }))
  };
}

async function storageDashboard() {
  const [documents, pages, pageAssets, assetsByType, elementsByType, sources, renderedStorage] = await Promise.all([
    prisma.ndieSourceDocument.aggregate({ _count: { _all: true }, _sum: { fileSize: true }, _avg: { fileSize: true } }),
    prisma.ndiePage.aggregate({ _count: { _all: true }, _sum: { imageSizeBytes: true }, _avg: { imageSizeBytes: true } }),
    prisma.ndiePageAsset.count(),
    prisma.ndiePageAsset.groupBy({ by: ["assetType"], _count: { _all: true } }),
    prisma.ndieElement.groupBy({ by: ["elementType"], _count: { _all: true } }),
    prisma.ndieSourceDocument.groupBy({ by: ["checksum"], where: { checksum: { not: null } }, _count: { _all: true } }),
    prisma.ndiePage.findMany({
      orderBy: { imageSizeBytes: "desc" },
      take: 5,
      select: { importJobId: true, pageNumber: true, imageSizeBytes: true, storageLocation: true }
    })
  ]);
  const duplicateUploads = sources.filter((source) => source.checksum && source._count._all > 1).length;
  return {
    documents: documents._count._all,
    pageAssets,
    pageImages: pages._count._all,
    ocrJson: await prisma.ndiePage.count({ where: { ocrJson: { not: Prisma.JsonNull } } }),
    layoutJson: await prisma.ndiePage.count({ where: { layoutJson: { not: Prisma.JsonNull } } }),
    formulaJson: elementsByType.filter((row) => row.elementType.includes("FORMULA")).reduce((sum, row) => sum + row._count._all, 0),
    visualJson: elementsByType.filter((row) => ["VISUAL", "DIAGRAM", "GRAPH", "TABLE", "FIGURE", "IMAGE"].some((type) => row.elementType.includes(type))).reduce((sum, row) => sum + row._count._all, 0),
    publishPackages: await prisma.ndieRevision.count({ where: { changeType: "PUBLISH_VERSION" } }),
    storageUsageMb: Math.round((Number(documents._sum.fileSize ?? 0) + Number(pages._sum.imageSizeBytes ?? 0)) / 1024 / 1024),
    averageAssetSizeKb: Math.round(Number(pages._avg.imageSizeBytes ?? documents._avg.fileSize ?? 0) / 1024),
    largestImports: renderedStorage,
    duplicateUploads,
    assetTypes: Object.fromEntries(assetsByType.map((row) => [row.assetType, row._count._all])),
    elementTypes: Object.fromEntries(elementsByType.map((row) => [row.elementType, row._count._all]))
  };
}

async function qualityDashboard() {
  const [quality, importsByStatus, decisions, revisions] = await Promise.all([
    prisma.ndieQualityScore.aggregate({ _avg: { overall: true, ocrConfidence: true, formulaAccuracy: true, layoutAccuracy: true, aiConfidence: true, teacherReviewCompletion: true }, _count: { _all: true } }),
    prisma.ndieImportJob.groupBy({ by: ["status", "reviewStatus"], _count: { _all: true } }),
    prisma.ndieReviewDecision.groupBy({ by: ["decision"], _count: { _all: true } }),
    prisma.ndieRevision.groupBy({ by: ["changeType"], _count: { _all: true } })
  ]);
  const decisionCount = (decision: string) => decisions.find((row) => row.decision === decision)?._count._all ?? 0;
  const totalDecisions = decisions.reduce((sum, row) => sum + row._count._all, 0);
  return {
    averageConfidence: Math.round((quality._avg.overall ?? 0) * 1000) / 1000,
    componentAverages: {
      ocr: quality._avg.ocrConfidence,
      formula: quality._avg.formulaAccuracy,
      layout: quality._avg.layoutAccuracy,
      ai: quality._avg.aiConfidence,
      teacherReview: quality._avg.teacherReviewCompletion
    },
    blockedImports: importsByStatus.filter((row) => ["FAILED", "DLQ"].includes(row.status)).reduce((sum, row) => sum + row._count._all, 0),
    reviewRequiredImports: importsByStatus.filter((row) => row.reviewStatus === "PENDING_REVIEW" || row.status === "READY_FOR_TEACHER_REVIEW").reduce((sum, row) => sum + row._count._all, 0),
    publishReadyImports: importsByStatus.filter((row) => row.status === "READY_FOR_PUBLISH" || row.reviewStatus === "APPROVED").reduce((sum, row) => sum + row._count._all, 0),
    manualEdits: revisions.filter((row) => row.changeType === "TEACHER_EDIT").reduce((sum, row) => sum + row._count._all, 0),
    teacherApprovalRate: ratio(decisionCount("APPROVED"), totalDecisions),
    falsePositiveRate: null,
    qualityTrend: {
      sampleSize: quality._count._all,
      direction: "requires-historical-baseline"
    }
  };
}

async function diagnosticsDashboard() {
  const [providerFailures, queueFailures, securityFailures, validationFailures] = await Promise.all([
    prisma.ndieProviderRun.findMany({
      where: { OR: [{ status: "FAILED" }, { error: { not: null } }] },
      orderBy: { startedAt: "desc" },
      take: 20,
      select: { providerId: true, providerKind: true, stage: true, error: true, startedAt: true }
    }),
    prisma.ndieQueueJob.findMany({
      where: { OR: [{ state: { in: ["FAILED", "DLQ"] } }, { errorCategory: { not: null } }] },
      orderBy: { updatedAt: "desc" },
      take: 20,
      select: { id: true, importJobId: true, stage: true, state: true, errorCategory: true, errorMessage: true, attempts: true, updatedAt: true }
    }),
    prisma.auditLog.findMany({
      where: { module: "ndie", action: { in: ["NDIE_SECURITY_EVENT", "NDIE_AUTHORIZATION_DENIED", "NDIE_UPLOAD_QUARANTINED"] } },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { action: true, description: true, createdAt: true }
    }),
    prisma.ndieProviderRun.findMany({
      where: { providerKind: { contains: "VALIDATION" }, OR: [{ status: "FAILED" }, { error: { not: null } }] },
      orderBy: { startedAt: "desc" },
      take: 20,
      select: { providerId: true, stage: true, error: true, startedAt: true }
    })
  ]);
  const stageCount = (stage: string) => queueFailures.filter((failure) => failure.stage.includes(stage)).length;
  return {
    topFailures: queueFailures.slice(0, 10),
    providerFailures,
    ocrFailures: stageCount("OCR"),
    layoutFailures: stageCount("LAYOUT"),
    formulaFailures: stageCount("FORMULA"),
    validationFailures,
    securityFailures,
    workerFailures: queueFailures.filter((failure) => failure.errorCategory?.includes("WORKER")),
    queueFailures
  };
}

export const ndieOperationsService = {
  async overview() {
    const [
      operations,
      queue,
      worker,
      providers,
      storage,
      quality,
      diagnostics,
      performance,
      security
    ] = await Promise.all([
      operationalState(),
      queueDashboard(),
      Promise.resolve(ndieWorkerRegistryService.health()),
      providerMonitoring(),
      storageDashboard(),
      qualityDashboard(),
      diagnosticsDashboard(),
      ndiePerformanceService.health(),
      ndieComplianceService.health()
    ]);
    const cost = buildCostEstimate({
      pages: storage.pageImages,
      ocrPages: storage.ocrJson,
      validationRuns: providers.filter((provider) => provider.providerKind.includes("VALIDATION") || provider.stage.includes("VALIDATION")).reduce((sum, provider) => sum + provider.runs, 0),
      renderedBytes: storage.storageUsageMb * 1024 * 1024,
      sourceBytes: 0,
      bandwidthBytes: storage.storageUsageMb * 1024 * 1024
    });
    const status = statusFromSignals({
      failed: operations.failedImports + queue.failed,
      dlq: queue.dlq,
      staleWorkers: worker.stale,
      securityEvents: security.securityEventsLast24h,
      backpressure: queue.backpressure
    });
    return {
      operationsVersion,
      generatedAt: new Date().toISOString(),
      overall: {
        status,
        summary: status === "READY" ? "NDIE operations are healthy." : status === "WARNING" ? "NDIE operations need attention." : "NDIE operations are critical.",
        pipelineVersion: env.NDIE_PIPELINE_VERSION
      },
      operations,
      pipelineTimeline: {
        supportedStages: [
          "IMPORT_CREATED",
          "SOURCE_STORED",
          "PDF_RENDERED",
          "OCR_COMPLETED",
          "LAYOUT_COMPLETED",
          "FORMULA_COMPLETED",
          "VISUAL_COMPLETED",
          "QUESTION_COMPLETED",
          "EVALUATION_COMPLETED",
          "AI_VALIDATED",
          "READY_FOR_REVIEW",
          "PUBLISHED",
          "DELIVERED"
        ],
        api: "/api/ndie/imports/:id/timeline"
      },
      providers,
      workers: worker,
      queues: queue,
      storage,
      cost,
      quality,
      diagnostics,
      performance,
      security
    };
  },

  async health() {
    const [queue, worker, providers, quality, security] = await Promise.all([
      ndieQueueService.metrics(),
      Promise.resolve(ndieWorkerRegistryService.health()),
      providerMonitoring(),
      qualityDashboard(),
      ndieComplianceService.health()
    ]);
    const providerFailures = providers.reduce((sum, provider) => sum + Math.round((provider.failureRate / 100) * provider.runs), 0);
    const status = statusFromSignals({
      failed: queue.failedJobs + providerFailures,
      dlq: queue.dlqCount,
      staleWorkers: worker.stale,
      securityEvents: security.securityEventsLast24h,
      backpressure: false
    });
    return {
      status,
      operationsVersion,
      queueDepth: queue.pendingJobs,
      failedJobs: queue.failedJobs,
      dlqCount: queue.dlqCount,
      workerCount: worker.registered,
      staleWorkers: worker.stale,
      providerCount: providers.length,
      providerFailures,
      averageConfidence: quality.averageConfidence,
      quality,
      categories: {
        security: security.status,
        performance: queue.dlqCount || queue.failedJobs ? "warning" : "ready",
        workers: worker.stale ? "warning" : "ready",
        queues: queue.dlqCount ? "critical" : queue.failedJobs ? "warning" : "ready",
        providers: providerFailures ? "warning" : "ready",
        storage: "ready",
        operations: status
      }
    };
  },

  diagnostics() {
    return diagnosticsDashboard();
  },

  async timeline(importJobId: string) {
    const importJob = await prisma.ndieImportJob.findUnique({
      where: { id: importJobId },
      include: {
        sourceDocuments: { orderBy: { createdAt: "asc" } },
        pages: { orderBy: { pageNumber: "asc" } },
        providerRuns: { orderBy: { startedAt: "asc" } },
        queueJobs: { orderBy: { queuedAt: "asc" } },
        reviewDecisions: { orderBy: { createdAt: "asc" } },
        revisions: { orderBy: { createdAt: "asc" } }
      }
    });
    if (!importJob) throw Object.assign(new Error("NDIE import not found"), { statusCode: 404 });

    const providerStage = (patterns: string[]) => importJob.providerRuns.find((run) => patterns.some((pattern) => run.stage.includes(pattern) || run.providerKind.includes(pattern)));
    const queueStage = (patterns: string[]) => importJob.queueJobs.find((job) => patterns.some((pattern) => job.stage.includes(pattern) || job.state.includes(pattern) || (job.currentStage ?? "").includes(pattern)));
    const revisionStage = (changeType: string) => importJob.revisions.find((revision) => revision.changeType === changeType);
    const entries = [
      {
        stage: "IMPORT_CREATED",
        startTime: importJob.createdAt.toISOString(),
        endTime: importJob.createdAt.toISOString(),
        durationMs: 0,
        provider: "ndie-source-storage",
        worker: null,
        result: "COMPLETED",
        diagnostics: importJob.manifest ?? null
      },
      ...importJob.sourceDocuments.map((document) => ({
        stage: "SOURCE_STORED",
        startTime: document.createdAt.toISOString(),
        endTime: document.createdAt.toISOString(),
        durationMs: 0,
        provider: document.storageProvider,
        worker: null,
        result: document.preservationState,
        diagnostics: { sourceDocumentId: document.id, fileType: document.fileType, checksum: document.checksum, size: document.fileSize }
      })),
      {
        stage: "PDF_RENDERED",
        source: providerStage(["PDF", "RENDER"]) ?? queueStage(["PDF_RENDERING", "PAGES_CREATED"])
      },
      {
        stage: "OCR_COMPLETED",
        source: providerStage(["OCR"]) ?? queueStage(["OCR_COMPLETED", "OCR"])
      },
      {
        stage: "LAYOUT_COMPLETED",
        source: providerStage(["LAYOUT"]) ?? queueStage(["LAYOUT_COMPLETED", "LAYOUT"])
      },
      {
        stage: "FORMULA_COMPLETED",
        source: providerStage(["FORMULA"]) ?? queueStage(["FORMULA_COMPLETED", "FORMULA"])
      },
      {
        stage: "VISUAL_COMPLETED",
        source: providerStage(["VISUAL"]) ?? queueStage(["VISUAL_COMPLETED", "VISUAL"])
      },
      {
        stage: "QUESTION_COMPLETED",
        source: providerStage(["QUESTION"]) ?? queueStage(["QUESTION_COMPLETED", "QUESTION"])
      },
      {
        stage: "EVALUATION_COMPLETED",
        source: providerStage(["EVALUATION", "ANSWER"]) ?? queueStage(["ANSWER_COMPLETED", "ANSWER"])
      },
      {
        stage: "AI_VALIDATED",
        source: providerStage(["VALIDATION", "AI"]) ?? queueStage(["AI_VALIDATION_COMPLETED", "AI_VALIDATION"])
      },
      {
        stage: "READY_FOR_REVIEW",
        source: queueStage(["READY_FOR_TEACHER_REVIEW"]) ?? importJob.reviewDecisions[0] ?? null
      },
      {
        stage: "PUBLISHED",
        source: revisionStage("PUBLISH_VERSION") ?? providerStage(["PUBLISH"]) ?? queueStage(["PUBLISH_COMPLETED", "PUBLISH"])
      },
      {
        stage: "DELIVERED",
        source: queueStage(["DELIVERY_READY", "STUDENT_DELIVERY"]) ?? (importJob.status === "DELIVERY_READY" ? importJob : null)
      }
    ];

    const normalized = entries.map((entry) => {
      if (!("source" in entry)) return entry;
      const source = entry.source as Record<string, unknown> | null | undefined;
      const start = source?.startedAt instanceof Date ? source.startedAt : source?.queuedAt instanceof Date ? source.queuedAt : source?.createdAt instanceof Date ? source.createdAt : null;
      const end = source?.completedAt instanceof Date ? source.completedAt : source?.renderedAt instanceof Date ? source.renderedAt : source?.updatedAt instanceof Date ? source.updatedAt : start;
      return {
        stage: entry.stage,
        startTime: start?.toISOString() ?? null,
        endTime: end?.toISOString() ?? null,
        durationMs: typeof source?.durationMs === "number" ? source.durationMs : durationMs(start, end),
        provider: typeof source?.providerId === "string" ? source.providerId : typeof source?.provider === "string" ? source.provider : typeof source?.storageProvider === "string" ? source.storageProvider : null,
        worker: typeof source?.workerId === "string" ? source.workerId : null,
        result: typeof source?.status === "string" ? source.status : typeof source?.state === "string" ? source.state : source ? "RECORDED" : "NOT_RECORDED",
        diagnostics: source?.diagnostics ?? source?.error ?? source?.outputSummary ?? null
      };
    });

    return {
      importJobId,
      status: importJob.status,
      reviewStatus: importJob.reviewStatus,
      pipelineVersion: importJob.pipelineVersion,
      timelineVersion: "ndie-pipeline-timeline-v1",
      stages: normalized,
      summary: {
        stagesRecorded: normalized.filter((entry) => entry.result !== "NOT_RECORDED").length,
        totalStages: normalized.length,
        pages: importJob.pages.length,
        sourceDocuments: importJob.sourceDocuments.length,
        providerRuns: importJob.providerRuns.length,
        queueJobs: importJob.queueJobs.length,
        reviewActions: importJob.reviewDecisions.length,
        revisions: importJob.revisions.length
      }
    };
  }
};
