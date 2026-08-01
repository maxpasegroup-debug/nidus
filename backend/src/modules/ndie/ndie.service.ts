import { NDIE_PIPELINE_EVENTS } from "./contracts/pipeline-events.js";
import { ndieAnswerKeyMapperService } from "./answer-key-mapper/answer-key-mapper.service.js";
import { ndieAiValidatorService } from "./ai-validator/ai-validator.service.js";
import { ndieAnalyticsService } from "./analytics/analytics.service.js";
import { ndieImportReplayService, type NdieReplayInput } from "./import-replay/import-replay.service.js";
import { ndieLayoutAnalyzerService } from "./layout-analyzer/layout-analyzer.service.js";
import { createNdieContainer } from "./ndie.container.js";
import { ndiePublisherService, type NdiePublishInput } from "./publisher/publisher.service.js";
import { ndieQualityScoringService } from "./quality-scoring/quality-scoring.service.js";
import { ndieQuestionDetectorService } from "./question-detector/question-detector.service.js";
import { ndieReviewEngineService, type NdieReviewInput } from "./review-engine/review-engine.service.js";
import { ndieSourceStorageService, type NdieCreateImportInput } from "./source-storage/source-storage.service.js";
import { ndieVisualDetectorService } from "./visual-detector/visual-detector.service.js";

const container = createNdieContainer();

export const ndieService = {
  health() {
    return {
      service: "ndie",
      status: container.flags.enabled ? "ready" : "disabled",
      philosophy: "NDIE understands structured visual documents, not plain text dumps.",
      flags: container.flags,
      pipelineEvents: NDIE_PIPELINE_EVENTS,
      services: container.services.map((service) => service.health()),
      providers: container.providerRegistry.health()
    };
  },

  createImport(input: NdieCreateImportInput) {
    return ndieSourceStorageService.createImport(input);
  },

  getImport(importJobId: string) {
    return ndieSourceStorageService.getImport(importJobId);
  },

  analyzeLayout(importJobId: string) {
    return ndieLayoutAnalyzerService.analyzeImport(importJobId);
  },

  detectVisuals(importJobId: string) {
    return ndieVisualDetectorService.detectImport(importJobId);
  },

  detectQuestions(importJobId: string) {
    return ndieQuestionDetectorService.detectImport(importJobId);
  },

  mapAnswers(importJobId: string) {
    return ndieAnswerKeyMapperService.mapImport(importJobId);
  },

  validateAi(importJobId: string) {
    return ndieAiValidatorService.validateImport(importJobId);
  },

  getReviewWorkspace(importJobId: string) {
    return ndieReviewEngineService.getReviewWorkspace(importJobId);
  },

  reviewCandidate(input: NdieReviewInput) {
    return ndieReviewEngineService.reviewCandidate(input);
  },

  publish(input: NdiePublishInput) {
    return ndiePublisherService.publish(input);
  },

  replay(input: NdieReplayInput) {
    return ndieImportReplayService.replay(input);
  },

  replayRuns(importJobId: string) {
    return ndieImportReplayService.list(importJobId);
  },

  qualityReport(importJobId: string) {
    return ndieQualityScoringService.generate(importJobId);
  },

  analytics() {
    return ndieAnalyticsService.overview();
  }
};
