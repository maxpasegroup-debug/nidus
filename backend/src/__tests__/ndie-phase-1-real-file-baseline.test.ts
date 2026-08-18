import { describe, expect, it } from "@jest/globals";
import {
  REAL_FILE_BASELINE_SLOTS,
  REAL_FILE_BASELINE_STAGES,
  realFileBaselineService,
  validateRealFilePipelineEvidenceManifest
} from "../modules/ndie/certification/real-file-baseline.service.js";

describe("NDIE Phase 1 - Real File Certification Baseline", () => {
  it("defines the required real-document certification slots", () => {
    const slotIds = REAL_FILE_BASELINE_SLOTS.map((slot) => slot.id);

    expect(slotIds).toEqual(expect.arrayContaining([
      "nda-maths-pdf",
      "jee-maths-pdf",
      "jee-physics-pdf",
      "neet-physics-pdf",
      "neet-chemistry-pdf",
      "university-maths-paper",
      "university-chemistry-paper",
      "scanned-chemistry-paper",
      "mobile-camera-maths-paper",
      "handwritten-stem-paper",
      "docx-office-math",
      "answer-key-pdf",
      "solution-book-pdf",
      "organic-chemistry-structure-paper",
      "graph-heavy-physics-math-paper",
      "table-heavy-chemistry-paper",
      "olympiad-maths-paper"
    ]));
    expect(REAL_FILE_BASELINE_SLOTS).toHaveLength(17);
    expect(new Set(REAL_FILE_BASELINE_SLOTS.map((slot) => slot.id)).size).toBe(REAL_FILE_BASELINE_SLOTS.length);
  });

  it("requires every slot to prove the complete upload-to-CBT pipeline", () => {
    const report = realFileBaselineService.run();

    for (const document of report.documentReports) {
      expect(document.stageResults.map((stage) => stage.stage)).toEqual(REAL_FILE_BASELINE_STAGES);
      expect(document.stageResults).toHaveLength(10);
    }
  });

  it("does not production-certify documents without full executable evidence", () => {
    const report = realFileBaselineService.run();

    for (const document of report.documentReports) {
      expect(document.productionCertified).toBe(document.fullPipelineExecuted && document.overallScore >= 95);
    }
    if (report.fullPipelinesExecuted < report.requiredDocuments) {
      expect(report.productionCertificationStatus).toBe("NOT_CERTIFIED");
    }
  });

  it("reports exact missing fixture paths instead of assuming real-file results", () => {
    const report = realFileBaselineService.run();

    expect(report.requiredDocuments).toBe(17);
    expect(report.filesPresent).toBeLessThanOrEqual(report.requiredDocuments);
    expect(report.missingFixturePaths).toHaveLength(report.requiredDocuments - report.filesPresent);
    expect(Array.isArray(report.missingEvidencePaths)).toBe(true);
    expect(report.stopRule).toContain("No paper can be production certified");
    expect(report.coverage.subjects.Mathematics).toBeGreaterThanOrEqual(6);
    expect(report.coverage.subjects.Physics).toBeGreaterThanOrEqual(3);
    expect(report.coverage.subjects.Chemistry).toBeGreaterThanOrEqual(6);
    expect(report.coverage.proofAreas.formulas).toBeGreaterThanOrEqual(12);
    expect(report.coverage.proofAreas.chemistryStructures).toBeGreaterThanOrEqual(5);
    expect(report.coverage.proofAreas.physicsDiagrams).toBeGreaterThanOrEqual(4);
    expect(report.coverage.proofAreas.handwritten).toBeGreaterThanOrEqual(1);
    expect(report.coverage.proofAreas.docxOfficeMath).toBeGreaterThanOrEqual(2);
    expect(report.coverage.proofAreas.answerKey).toBeGreaterThanOrEqual(2);
    expect(report.coverage.proofAreas.solutions).toBeGreaterThanOrEqual(1);
  });

  it("rejects evidence manifests that do not match the source checksum", () => {
    const slot = REAL_FILE_BASELINE_SLOTS[0];
    const validation = validateRealFilePipelineEvidenceManifest({
      slot,
      sourceSha256: "source-hash",
      fixtureDirectory: process.cwd(),
      manifest: {
        manifestVersion: "real-file-pipeline-evidence-v1",
        slotId: slot.id,
        pipelineRunId: "run-001",
        sourceSha256: "different-hash",
        executedAt: new Date().toISOString(),
        stages: [{ stage: "UPLOAD", status: "PASS", score: 1 }]
      }
    });

    expect(validation.valid).toBe(false);
    expect(validation.problems.join(" ")).toContain("sourceSha256");
  });

  it("rejects unsafe artifact paths in stage evidence", () => {
    const slot = REAL_FILE_BASELINE_SLOTS[0];
    const validation = validateRealFilePipelineEvidenceManifest({
      slot,
      sourceSha256: "source-hash",
      fixtureDirectory: process.cwd(),
      manifest: {
        manifestVersion: "real-file-pipeline-evidence-v1",
        slotId: slot.id,
        pipelineRunId: "run-002",
        sourceSha256: "source-hash",
        executedAt: new Date().toISOString(),
        stages: [{
          stage: "RENDER",
          status: "PASS",
          score: 1,
          artifacts: [{ kind: "page-image", path: "../outside.png" }]
        }]
      }
    });

    expect(validation.valid).toBe(false);
    expect(validation.problems.join(" ")).toContain("escapes the fixture directory");
  });
});
