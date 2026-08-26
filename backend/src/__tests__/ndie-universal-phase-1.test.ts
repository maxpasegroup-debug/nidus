import { describe, expect, it } from "@jest/globals";
import { expertAnnotationSchema, seedCorpusManifestSchema } from "../modules/ndie/certification/seed-corpus/contracts.js";
import { summarizeSeedCorpus } from "../modules/ndie/certification/seed-corpus/seed-corpus.js";
import { measureObservation, UNIVERSAL_METRIC_DEFINITIONS } from "../modules/ndie/certification/universal-certification-metrics.js";
import { universalExamPhaseOneStatusService } from "../modules/ndie/universal-specification/phase-1-status.service.js";
import { UNIVERSAL_ACCURACY_TARGETS, UNIVERSAL_EXAM_ENGINE_SPECIFICATION } from "../modules/ndie/universal-specification/universal-exam-engine.spec.js";

describe("Universal Exam Engine Phase 1", () => {
  it("locks a versioned complete capability specification", () => {
    expect(UNIVERSAL_EXAM_ENGINE_SPECIFICATION.schemaVersion).toBe("nuee-spec-1.0.0");
    expect(UNIVERSAL_EXAM_ENGINE_SPECIFICATION.documentTypes).toContain("OFFICE_MATH");
    expect(UNIVERSAL_EXAM_ENGINE_SPECIFICATION.questionTypes).toContain("UNKNOWN_FUTURE");
    expect(UNIVERSAL_EXAM_ENGINE_SPECIFICATION.failurePolicy.neverInventAcademicContent).toBe(true);
  });

  it("rejects malformed manifests and blind-label leakage", () => {
    expect(seedCorpusManifestSchema.safeParse({}).success).toBe(false);
    const result = seedCorpusManifestSchema.safeParse({
      schemaVersion: "nuee-seed-manifest-1.0.0", documentId: "blind-1", partition: "BLIND_CERTIFICATION", evidenceClass: "REAL",
      source: { relativePath: "source.pdf", sha256: "a".repeat(64), rightsBasis: "INSTITUTION_OWNED", anonymized: true, collectedAt: "2026-08-18T00:00:00.000Z" },
      subject: "MATHEMATICS", examType: "JEE", documentType: "PDF", languageCodes: ["en"], pageCount: 1,
      expectedQuestionCount: 1, difficultyTags: [], riskTags: ["FORMULA_HEAVY"],
      annotation: { status: "IN_PROGRESS", expectedPath: "processing-input/expected.json", expertCount: 1, agreement: null }
    });
    expect(result.success).toBe(false);
  });

  it("requires source-grounded expert annotation objects", () => {
    expect(expertAnnotationSchema.safeParse({ schemaVersion: "nuee-expert-annotation-1.0.0" }).success).toBe(false);
  });

  it("excludes development fixtures from real evidence", () => {
    const summary = summarizeSeedCorpus([]);
    expect(summary.realDocuments).toBe(0);
    expect(summary.evidenceComplete).toBe(false);
  });

  it("requires real evidence before a metric can pass", () => {
    expect(Object.keys(UNIVERSAL_METRIC_DEFINITIONS)).toEqual(Object.keys(UNIVERSAL_ACCURACY_TARGETS));
    expect(measureObservation({ metricId: "sourcePreservation", numerator: 1, denominator: 1, evidenceDocumentIds: [] })).toEqual({ score: null, passed: false, reason: "REAL_EVIDENCE_REQUIRED" });
  });

  it("fails the phase gate honestly while the real corpus is empty", () => {
    const status = universalExamPhaseOneStatusService.evaluate();
    expect(status.corpusStatus).toBe("PHASE 1 CORPUS EVIDENCE INCOMPLETE");
    expect(status.exitGate).toBe("FAIL");
    expect(status.productionCertified).toBe(false);
    expect(status.mathematicsReady).toBe(false);
    expect(status.physicsReady).toBe(false);
  });
});

