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
      "neet-chemistry-pdf",
      "scanned-chemistry-paper",
      "mobile-camera-maths-paper",
      "docx-office-math",
      "answer-key-pdf",
      "solution-book-pdf",
      "organic-chemistry-structure-paper",
      "graph-heavy-physics-math-paper"
    ]));
    expect(REAL_FILE_BASELINE_SLOTS).toHaveLength(10);
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

    expect(report.requiredDocuments).toBe(10);
    expect(report.filesPresent).toBeLessThanOrEqual(report.requiredDocuments);
    expect(report.missingFixturePaths).toHaveLength(report.requiredDocuments - report.filesPresent);
    expect(Array.isArray(report.missingEvidencePaths)).toBe(true);
    expect(report.stopRule).toContain("No paper can be production certified");
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
