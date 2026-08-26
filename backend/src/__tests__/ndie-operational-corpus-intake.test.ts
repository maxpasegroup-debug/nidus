import { afterEach, describe, expect, it } from "@jest/globals";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { evaluateIndependentExperts, transitionAnnotationStatus } from "../modules/ndie/certification/seed-corpus/annotation-lifecycle.js";
import { operationalAnnotationService } from "../modules/ndie/certification/seed-corpus/operational-annotation.service.js";
import { operationalCorpusIntakeService, type OperationalIntakeMetadata } from "../modules/ndie/certification/seed-corpus/operational-corpus-intake.service.js";
import { operationalCorpusStatusService } from "../modules/ndie/certification/seed-corpus/operational-corpus-status.service.js";
import { operationalCorpusManifestSchema, type ExpertAgreement, type ExpertAnnotationPayload, type ExpertAnnotationSubmission } from "../modules/ndie/certification/seed-corpus/operational-contracts.js";

const temporaryRoots: string[] = [];

function temporaryRoot() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "nidus-corpus-test-"));
  temporaryRoots.push(root);
  return root;
}

afterEach(() => {
  while (temporaryRoots.length) fs.rmSync(temporaryRoots.pop()!, { recursive: true, force: true });
});

function hash(buffer: Buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

function metadata(overrides: Partial<OperationalIntakeMetadata> = {}): OperationalIntakeMetadata {
  return {
    documentId: "math-real-001",
    subject: "MATHEMATICS",
    examType: "JEE",
    educationLevel: "ENTRANCE",
    institutionOrBoard: "Test Board",
    countryOrRegion: "IN",
    documentType: "PDF",
    pageCount: 1,
    partition: "DEVELOPMENT",
    evidenceClass: "REAL_SOURCE",
    rightsBasis: "INSTITUTION_OWNED",
    rightsVerifiedBy: "rights-reviewer",
    rightsVerifiedAt: "2026-08-18T00:00:00.000Z",
    anonymizationStatus: "COMPLETE",
    provenance: {
      description: "Test-only provenance record; never production evidence.",
      suppliedBy: "test-suite",
      sourceUri: null,
      collectedAt: "2026-08-18T00:00:00.000Z",
      verificationStatus: "VERIFIED",
      verifiedBy: "provenance-reviewer",
      verifiedAt: "2026-08-18T00:00:00.000Z"
    },
    ...overrides
  };
}

function writeSource(root: string, name: string, content = "%PDF-1.7\n% test-only\n") {
  const filePath = path.join(root, name);
  fs.writeFileSync(filePath, content);
  return filePath;
}

function writeJson(filePath: string, value: unknown) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function expertPayload(annotatorId: string): ExpertAnnotationPayload {
  return {
    schemaVersion: "nuee-expert-payload-1.0.0",
    documentId: "math-real-001",
    annotatorId,
    annotationVersion: 1,
    applicability: { questionBoundaries: true, questionOrder: true, questionTypes: true, parentChildRelationships: true, sourceCoordinates: true, formulas: true, diagrams: false, graphs: false, tables: false, answers: false, solutions: false, markingScheme: false, difficultRegions: true, expectedRepresentation: true },
    questions: [{ id: "q1", number: "1", order: 0, type: "MCQ", parentQuestionId: null, sourceReferences: [{ page: 1, x: 0, y: 0, width: 100, height: 50 }] }],
    formulas: [], diagrams: [], graphs: [], tables: [], answers: [], solutions: [], markingSchemes: [], difficultRegions: []
  };
}

describe("NDIE operational real corpus intake", () => {
  it("preserves a source, records its checksum and does not certify it at intake", () => {
    const root = temporaryRoot();
    const source = writeSource(root, "paper.pdf");
    const result = operationalCorpusIntakeService.intakeFile({ sourcePath: source, corpusRoot: path.join(root, "corpus"), metadata: metadata() });
    const preserved = path.join(result.targetDirectory, result.manifest.source.relativePath);
    expect(fs.readFileSync(preserved)).toEqual(fs.readFileSync(source));
    expect(hash(fs.readFileSync(preserved))).toBe(result.manifest.source.sha256);
    expect(result.manifest.annotation.status).toBe("ANNOTATION_PENDING");
    expect(result.manifest.certificationStatus).toBe("BLOCKED");
    expect(result.countedAsRealEvidence).toBe(false);
  });

  it("defaults missing rights and privacy verification to blocked states", () => {
    const root = temporaryRoot();
    const source = writeSource(root, "paper.pdf");
    const result = operationalCorpusIntakeService.intakeFile({ sourcePath: source, corpusRoot: path.join(root, "corpus"), metadata: metadata({ rightsBasis: undefined, rightsVerifiedBy: undefined, rightsVerifiedAt: undefined, anonymizationStatus: undefined }) });
    expect(result.manifest.source.rightsBasis).toBe("RIGHTS_BASIS_PENDING");
    expect(result.manifest.source.anonymizationStatus).toBe("NOT_REVIEWED");
    expect(operationalCorpusStatusService.report(path.join(root, "corpus")).overall.validRealDocuments).toBe(0);
  });

  it("forces reported PII into review without altering the original", () => {
    const root = temporaryRoot();
    const source = writeSource(root, "paper.pdf", "%PDF-1.7\nStudent: test-only\n");
    const result = operationalCorpusIntakeService.intakeFile({ sourcePath: source, corpusRoot: path.join(root, "corpus"), metadata: metadata({ piiReported: true }) });
    expect(result.manifest.source.anonymizationStatus).toBe("PII_REVIEW_REQUIRED");
    expect(fs.readFileSync(path.join(result.targetDirectory, result.manifest.source.relativePath))).toEqual(fs.readFileSync(source));
  });

  it("never counts fixtures as real evidence", () => {
    const root = temporaryRoot();
    const source = writeSource(root, "fixture.pdf");
    operationalCorpusIntakeService.intakeFile({ sourcePath: source, corpusRoot: path.join(root, "corpus"), metadata: metadata({ documentId: "math-fixture-001", evidenceClass: "SYNTHETIC_FIXTURE" }) });
    const report = operationalCorpusStatusService.report(path.join(root, "corpus"));
    expect(report.overall.ingested).toBe(0);
    expect(report.overall.blocked).toBe(1);
  });

  it("rejects duplicate checksums and duplicate document IDs", () => {
    const root = temporaryRoot();
    const corpusRoot = path.join(root, "corpus");
    const first = writeSource(root, "first.pdf", "%PDF-1.7\nfirst\n");
    const duplicate = writeSource(root, "duplicate.pdf", "%PDF-1.7\nfirst\n");
    const different = writeSource(root, "different.pdf", "%PDF-1.7\ndifferent\n");
    operationalCorpusIntakeService.intakeFile({ sourcePath: first, corpusRoot, metadata: metadata() });
    expect(() => operationalCorpusIntakeService.intakeFile({ sourcePath: duplicate, corpusRoot, metadata: metadata({ documentId: "math-real-002" }) })).toThrow(expect.objectContaining({ code: "DUPLICATE_CHECKSUM" }));
    expect(() => operationalCorpusIntakeService.intakeFile({ sourcePath: different, corpusRoot, metadata: metadata() })).toThrow(expect.objectContaining({ code: "DUPLICATE_DOCUMENT_ID" }));
  });

  it("rejects mismatched signatures and invalid manifest partitions", () => {
    const root = temporaryRoot();
    const source = writeSource(root, "paper.png");
    expect(() => operationalCorpusIntakeService.intakeFile({ sourcePath: source, corpusRoot: path.join(root, "corpus"), metadata: metadata() })).toThrow(expect.objectContaining({ code: "FORMAT_MISMATCH" }));
    expect(operationalCorpusManifestSchema.safeParse({ partition: "CERTIFICATION" }).success).toBe(false);
  });

  it("enforces annotation lifecycle and two independent experts", () => {
    expect(transitionAnnotationStatus("ANNOTATION_PENDING", "ANNOTATION_IN_PROGRESS")).toBe("ANNOTATION_IN_PROGRESS");
    expect(() => transitionAnnotationStatus("ANNOTATION_PENDING", "CERTIFICATION_READY")).toThrow("Illegal annotation transition");
    const submission = (id: string, expert: string, annotationHash: string): ExpertAnnotationSubmission => ({
      schemaVersion: "nuee-expert-submission-1.0.0", submissionId: id, documentId: "math-real-001", annotatorId: expert,
      annotationVersion: 1, submittedAt: "2026-08-18T00:00:00.000Z", independentAttestation: true,
      blindedFromOtherSubmission: true, fieldsAnnotated: ["questions"], annotationPath: `annotations/${id}.payload.json`, annotationSha256: annotationHash,
      applicability: { questionBoundaries: true, questionOrder: true, questionTypes: true, parentChildRelationships: true, sourceCoordinates: true, formulas: true, diagrams: false, graphs: false, tables: false, answers: false, solutions: false, markingScheme: false, difficultRegions: true, expectedRepresentation: true }
    });
    const one = submission("expert-a", "expert-a", "a".repeat(64));
    expect(evaluateIndependentExperts([one]).agreementEligible).toBe(false);
    expect(evaluateIndependentExperts([one, submission("expert-b", "expert-b", "b".repeat(64))]).agreementEligible).toBe(true);
    expect(evaluateIndependentExperts([one, submission("expert-b", "expert-a", "b".repeat(64))]).agreementEligible).toBe(false);
  });

  it("does not accept agreement before two actual submissions", () => {
    const agreement: ExpertAgreement = { documentId: "math-real-001", expertSubmissionIds: ["a", "b"], method: "PAIRWISE", score: 0.9, disagreements: [], measuredAt: "2026-08-18T00:00:00.000Z" };
    expect(() => evaluateIndependentExperts([], agreement)).toThrow("Agreement cannot be recorded");
  });

  it("registers two real expert payloads, agreement and adjudication without fabricating annotations", () => {
    const root = temporaryRoot();
    const source = writeSource(root, "paper.pdf");
    const intake = operationalCorpusIntakeService.intakeFile({ sourcePath: source, corpusRoot: path.join(root, "corpus"), metadata: metadata() });
    const first = operationalAnnotationService.registerSubmission({ documentRoot: intake.targetDirectory, slot: "A", payload: expertPayload("expert-a"), submissionId: "submission-a", submittedAt: "2026-08-18T01:00:00.000Z", fieldsAnnotated: ["questions"] });
    const second = operationalAnnotationService.registerSubmission({ documentRoot: intake.targetDirectory, slot: "B", payload: expertPayload("expert-b"), submissionId: "submission-b", submittedAt: "2026-08-18T02:00:00.000Z", fieldsAnnotated: ["questions"] });
    expect(first.annotationStatus).toBe("ANNOTATION_IN_PROGRESS");
    expect(second.annotationStatus).toBe("ANNOTATION_REVIEW");
    operationalAnnotationService.recordAgreement({ documentRoot: intake.targetDirectory, agreement: { documentId: "math-real-001", expertSubmissionIds: ["submission-a", "submission-b"], method: "PAIRWISE", score: 1, disagreements: [], measuredAt: "2026-08-18T03:00:00.000Z" } });
    operationalAnnotationService.recordAdjudication({ documentRoot: intake.targetDirectory, adjudication: { schemaVersion: "nuee-adjudication-1.0.0", documentId: "math-real-001", expertSubmissionIds: ["submission-a", "submission-b"], adjudicatorId: "adjudicator", status: "COMPLETE", resolvedDisagreements: [], completedAt: "2026-08-18T04:00:00.000Z" } });
    const ready = operationalAnnotationService.markCertificationReady(intake.targetDirectory);
    expect(ready.annotation.status).toBe("CERTIFICATION_READY");
    expect(ready.certificationStatus).toBe("READY_FOR_VALIDATION");
    expect(operationalCorpusStatusService.report(path.join(root, "corpus")).overall.certificationReady).toBe(1);
  });

  it("reports the exact Mathematics and Physics tranche targets without inflating counts", () => {
    const report = operationalCorpusStatusService.report(temporaryRoot());
    expect(report.mathematics).toMatchObject({ target: 30, ingested: 0, valid: 0, certificationReady: 0 });
    expect(report.physics).toMatchObject({ target: 30, ingested: 0, valid: 0, certificationReady: 0 });
    expect(report.overall.initialTarget).toBe(60);
    expect(report.overall.phaseOneMinimum).toBe(150);
  });

  it("prevents a false Phase 1 pass even when infrastructure works", () => {
    const report = operationalCorpusStatusService.report(temporaryRoot());
    expect(report.technicalFoundation).toBe("PASS");
    expect(report.phaseOneExitGate).toBe("FAIL");
    expect(report.realEvidenceStatus).toBe("PHASE 1 CORPUS EVIDENCE INCOMPLETE");
    expect(report.productionCertified).toBe(false);
  });
});
