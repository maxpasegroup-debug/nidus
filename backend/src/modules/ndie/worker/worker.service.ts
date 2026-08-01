import { prisma } from "../../../config/prisma.js";
import { logger } from "../../../utils/logger.js";
import { ndieOcrService } from "../ocr/ocr.service.js";
import { ndiePdfRendererService } from "../pdf-renderer/pdf-renderer.service.js";
import { ndieQueueConfig, ndieQueueService, ndieWorkerId, logNdieQueueEvent } from "../queue/queue.service.js";

async function renderPdfForJob(jobId: string, workerId: string) {
  const job = await prisma.ndieQueueJob.findUnique({
    where: { id: jobId },
    include: {
      importJob: {
        include: {
          sourceDocuments: { orderBy: { createdAt: "asc" } }
        }
      }
    }
  });
  if (!job) throw Object.assign(new Error("NDIE queue job not found"), { statusCode: 404 });

  const payload = job.payload && typeof job.payload === "object" && !Array.isArray(job.payload) ? job.payload as Record<string, unknown> : {};
  const sourceDocumentId = typeof payload.sourceDocumentId === "string" ? payload.sourceDocumentId : undefined;
  const sourceDocument = job.importJob.sourceDocuments.find((document) => document.id === sourceDocumentId)
    ?? job.importJob.sourceDocuments.find((document) => document.fileType === "application/pdf");
  if (!sourceDocument) throw Object.assign(new Error("No preserved PDF source document found for rendering."), { statusCode: 404 });

  await ndieQueueService.transition(jobId, "RENDERING", { workerId, provider: "renderer.pdfjs" });
  await ndieQueueService.updateProgress(jobId, 10, "PDF_RENDERING");
  const result = await ndiePdfRendererService.renderSourceDocument({
    importJobId: job.importJobId,
    sourceDocumentId: sourceDocument.id,
    fileType: sourceDocument.fileType,
    storagePublicId: sourceDocument.storagePublicId
  });
  await ndieQueueService.updateProgress(jobId, 90, "PAGES_CREATED");
  await ndieQueueService.transition(jobId, "PAGES_CREATED", { workerId, pagesRendered: result.pages.length });
  await ndieQueueService.transition(jobId, "READY_FOR_OCR", { workerId, pageCount: result.pageCount });
  return result;
}

async function runOcrForJob(jobId: string, workerId: string) {
  const job = await prisma.ndieQueueJob.findUnique({ where: { id: jobId } });
  if (!job) throw Object.assign(new Error("NDIE queue job not found"), { statusCode: 404 });

  await ndieQueueService.transition(jobId, "OCR_RUNNING", { workerId, provider: "ocr.tesseract" });
  await ndieQueueService.updateProgress(jobId, 15, "OCR_RUNNING");
  const result = await ndieOcrService.runOcr(job.importJobId);
  await ndieQueueService.updateProgress(jobId, 90, "OCR_COMPLETED");
  await ndieQueueService.transition(jobId, "OCR_COMPLETED", { workerId, pagesProcessed: result.pages.length });
  await ndieQueueService.transition(jobId, "READY_FOR_LAYOUT", { workerId, providerId: result.providerId });
  return result;
}

export const ndieWorkerService = {
  async health() {
    const processing = await prisma.ndieQueueJob.count({ where: { state: "PROCESSING" } });
    return {
      status: ndieQueueConfig.workersEnabled ? "ready" : "disabled",
      workerIdPrefix: "ndie-worker",
      concurrency: ndieQueueConfig.workerConcurrency,
      processing,
      note: "Gate 2 workers execute checkpoint-safe placeholder jobs only."
    };
  },

  async runPlaceholderJob(jobId: string) {
    if (!ndieQueueConfig.workersEnabled) {
      throw Object.assign(new Error("NDIE workers are disabled for this environment."), { statusCode: 503 });
    }

    const workerId = ndieWorkerId();
    const startedAt = Date.now();
    const job = await prisma.ndieQueueJob.update({
      where: { id: jobId },
      data: { workerId }
    });

    try {
      await ndieQueueService.transition(jobId, "PROCESSING", { workerId });
      await ndieQueueService.updateProgress(jobId, 10, job.stage);

      const latest = await prisma.ndieQueueJob.findUnique({ where: { id: jobId }, select: { state: true } });
      if (latest?.state === "CANCELLED") return latest;

      if (job.stage === "PDF_RENDERING") {
        await renderPdfForJob(jobId, workerId);
      } else if (job.stage === "OCR") {
        await runOcrForJob(jobId, workerId);
      } else {
        await ndieQueueService.updateProgress(jobId, 60, "PLACEHOLDER_CHECKPOINT");
      }

      await ndieQueueService.updateProgress(jobId, 100, job.stage);
      const completed = await ndieQueueService.transition(jobId, "COMPLETED", {
        workerId,
        result: job.stage === "PDF_RENDERING" ? "PDF pages rendered and ready for OCR." : job.stage === "OCR" ? "OCR completed and ready for layout." : "Placeholder queue infrastructure completed without running document intelligence."
      });
      if (job.stage === "PDF_RENDERING") {
        await prisma.ndieImportJob.update({
          where: { id: completed.importJobId },
          data: { status: "READY_FOR_OCR", currentCheckpoint: "READY_FOR_OCR" }
        });
      } else if (job.stage === "OCR") {
        await prisma.ndieImportJob.update({
          where: { id: completed.importJobId },
          data: { status: "READY_FOR_LAYOUT", currentCheckpoint: "READY_FOR_LAYOUT" }
        });
      }
      await logNdieQueueEvent({
        jobId,
        importJobId: completed.importJobId,
        stage: completed.stage,
        workerId,
        durationMs: Date.now() - startedAt,
        result: "COMPLETED",
        retryCount: completed.attempts
      });
      return completed;
    } catch (error) {
      const failed = await ndieQueueService.failOrRetry(jobId, error instanceof Error ? error : new Error("NDIE worker failed"), workerId);
      logger.warn("NDIE worker placeholder job failed", {
        jobId,
        importId: failed.importJobId,
        stage: failed.stage,
        worker: workerId,
            durationMs: Date.now() - startedAt,
            result: failed.state,
            retryCount: failed.attempts
          });
      return failed;
    }
  }
};
