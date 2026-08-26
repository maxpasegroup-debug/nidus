import { summarizeSeedCorpus } from "../certification/seed-corpus/seed-corpus.js";
import type { SeedCorpusManifest } from "../certification/seed-corpus/contracts.js";
import { UNIVERSAL_EXAM_ENGINE_SPECIFICATION } from "./universal-exam-engine.spec.js";
import { operationalCorpusStatusService } from "../certification/seed-corpus/operational-corpus-status.service.js";

export const universalExamPhaseOneStatusService = {
  evaluate(manifests: SeedCorpusManifest[] = []) {
    const corpus = summarizeSeedCorpus(manifests);
    return {
      phase: 1,
      specificationVersion: UNIVERSAL_EXAM_ENGINE_SPECIFICATION.schemaVersion,
      specificationLocked: UNIVERSAL_EXAM_ENGINE_SPECIFICATION.status === "LOCKED_CORE_PROGRAM",
      corpus,
      corpusStatus: corpus.evidenceComplete ? "COMPLETE" as const : "PHASE 1 CORPUS EVIDENCE INCOMPLETE" as const,
      productionCertified: false,
      mathematicsReady: false,
      physicsReady: false,
      exitGate: corpus.evidenceComplete ? "PASS" as const : "FAIL" as const,
      nextStep: "Collect, license, anonymize and dual-expert annotate at least 150 real documents using the seed corpus contracts."
    };
  },
  evaluateOperational(corpusRoot?: string) {
    const evidence = operationalCorpusStatusService.report(corpusRoot);
    return {
      phase: 1,
      specificationVersion: UNIVERSAL_EXAM_ENGINE_SPECIFICATION.schemaVersion,
      technicalFoundationStatus: evidence.technicalFoundation,
      realEvidenceStatus: evidence.realEvidenceStatus,
      evidence,
      productionCertified: false,
      exitGate: evidence.phaseOneExitGate,
      nextStep: evidence.phaseOneExitGate === "PASS"
        ? "Run independent Phase 1 validation without beginning Phase 2 automatically."
        : "Ingest legitimate sources and complete rights, privacy, two-expert annotation and adjudication until at least 150 records are certification ready."
    };
  }
};
