import { NDIE_PIPELINE_EVENTS } from "./contracts/pipeline-events.js";
import { ndieAnswerKeyMapperService } from "./answer-key-mapper/answer-key-mapper.service.js";
import { ndieAiValidatorService } from "./ai-validator/ai-validator.service.js";
import { ndieAnalyticsService } from "./analytics/analytics.service.js";
import { ndieImportReplayService, type NdieReplayInput } from "./import-replay/import-replay.service.js";
import { ndieFormulaAnalyzerService } from "./formula-analyzer/formula-analyzer.service.js";
import { ndieLayoutAnalyzerService } from "./layout-analyzer/layout-analyzer.service.js";
import { createNdieContainer } from "./ndie.container.js";
import { ndiePublisherService, type NdiePublishInput } from "./publisher/publisher.service.js";
import { ndieQualityScoringService } from "./quality-scoring/quality-scoring.service.js";
import { ndieQuestionDetectorService } from "./question-detector/question-detector.service.js";
import { ndieReviewEngineService, type NdieReviewInput } from "./review-engine/review-engine.service.js";
import { ndieQueueConfig, ndieQueueService } from "./queue/queue.service.js";
import { ndiePdfRendererService } from "./pdf-renderer/pdf-renderer.service.js";
import { ndieOcrService } from "./ocr/ocr.service.js";
import { assertNdieCandidateAccess, assertNdieImportAccess, isNdieManager, type NdieActor } from "./security/ndie-security.js";
import { ndieSourceStorageService, type NdieCreateImportInput } from "./source-storage/source-storage.service.js";
import { ndieVisualDetectorService } from "./visual-detector/visual-detector.service.js";
import { ndieWorkerService } from "./worker/worker.service.js";

const container = createNdieContainer();

export const ndieService = {
  async health() {
    const [queue, worker, metrics, renderer, ocr, layout, formula, visual, question] = await Promise.all([
      ndieQueueService.health(),
      ndieWorkerService.health(),
      ndieQueueService.metrics(),
      ndiePdfRendererService.health(),
      ndieOcrService.health(),
      ndieLayoutAnalyzerService.health(),
      ndieFormulaAnalyzerService.health(),
      ndieVisualDetectorService.health(),
      ndieQuestionDetectorService.health()
    ]);
    return {
      service: "ndie",
      status: container.flags.enabled ? "ready" : "disabled",
      philosophy: "NDIE understands structured visual documents, not plain text dumps.",
      flags: container.flags,
      queueConfig: ndieQueueConfig,
      queue,
      worker,
      metrics,
      renderer,
      ocr,
      layout,
      formula,
      visual,
      question,
      pipelineEvents: NDIE_PIPELINE_EVENTS,
      services: container.services.map((service) => service.health()),
      providers: container.providerRegistry.health()
    };
  },

  createImport(input: NdieCreateImportInput) {
    return ndieSourceStorageService.createImport(input);
  },

  async getImport(actor: NdieActor, importJobId: string) {
    await assertNdieImportAccess(actor, importJobId, "READ");
    return ndieSourceStorageService.getImport(importJobId);
  },

  async analyzeLayout(actor: NdieActor, importJobId: string) {
    await assertNdieImportAccess(actor, importJobId, "WRITE");
    return ndieLayoutAnalyzerService.analyzeImport(importJobId);
  },

  async detectVisuals(actor: NdieActor, importJobId: string) {
    await assertNdieImportAccess(actor, importJobId, "WRITE");
    return ndieVisualDetectorService.detectImport(importJobId);
  },

  async detectFormulas(actor: NdieActor, importJobId: string) {
    await assertNdieImportAccess(actor, importJobId, "WRITE");
    return ndieFormulaAnalyzerService.detectImport(importJobId);
  },

  async detectQuestions(actor: NdieActor, importJobId: string) {
    await assertNdieImportAccess(actor, importJobId, "WRITE");
    return ndieQuestionDetectorService.detectImport(importJobId);
  },

  async mapAnswers(actor: NdieActor, importJobId: string) {
    await assertNdieImportAccess(actor, importJobId, "WRITE");
    return ndieAnswerKeyMapperService.mapImport(importJobId);
  },

  async validateAi(actor: NdieActor, importJobId: string) {
    await assertNdieImportAccess(actor, importJobId, "WRITE");
    return ndieAiValidatorService.validateImport(importJobId);
  },

  async getReviewWorkspace(actor: NdieActor, importJobId: string) {
    await assertNdieImportAccess(actor, importJobId, "READ");
    return ndieReviewEngineService.getReviewWorkspace(importJobId);
  },

  async reviewCandidate(actor: NdieActor, input: NdieReviewInput) {
    await assertNdieCandidateAccess(actor, input.candidateId, "WRITE");
    return ndieReviewEngineService.reviewCandidate(input);
  },

  async publish(input: NdiePublishInput) {
    await assertNdieImportAccess(input.requester, input.importJobId, "PUBLISH");
    return ndiePublisherService.publish(input);
  },

  async replay(actor: NdieActor, input: NdieReplayInput) {
    await assertNdieImportAccess(actor, input.importJobId, "WRITE");
    return ndieImportReplayService.replay(input);
  },

  async replayRuns(actor: NdieActor, importJobId: string) {
    await assertNdieImportAccess(actor, importJobId, "READ");
    return ndieImportReplayService.list(importJobId);
  },

  async cancelImport(actor: NdieActor, importJobId: string, reason?: string) {
    await assertNdieImportAccess(actor, importJobId, "WRITE");
    const importJob = await ndieSourceStorageService.getImport(importJobId);
    const activeJob = importJob?.queueJobs.find((job) => ["QUEUED", "PROCESSING", "RENDERING", "OCR_RUNNING", "READY_FOR_LAYOUT", "LAYOUT_RUNNING", "READY_FOR_FORMULA_ENGINE", "FORMULA_RUNNING", "READY_FOR_VISUAL_ENGINE", "VISUAL_RUNNING", "READY_FOR_QUESTION_ENGINE", "QUESTION_RUNNING", "RETRY_PENDING", "REPLAY_PENDING"].includes(job.state));
    if (!activeJob) throw Object.assign(new Error("No cancellable NDIE queue job found"), { statusCode: 404 });
    return ndieQueueService.cancel(activeJob.id, reason);
  },

  async qualityReport(actor: NdieActor, importJobId: string) {
    await assertNdieImportAccess(actor, importJobId, "READ");
    return ndieQualityScoringService.generate(importJobId);
  },

  analytics(actor: NdieActor) {
    if (!isNdieManager(actor)) throw Object.assign(new Error("NDIE analytics access denied"), { statusCode: 403 });
    return ndieAnalyticsService.overview();
  }
};
