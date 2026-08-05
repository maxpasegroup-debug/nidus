import { describe, expect, it } from "@jest/globals";
import { realCertificationReportService } from "../modules/ndie/certification/real-certification-report.service.js";
import { REAL_FILE_BASELINE_STAGES } from "../modules/ndie/certification/real-file-baseline.service.js";

describe("NDIE Phase 6 - Real Certification Report", () => {
  it("summarizes every required pipeline stage", () => {
    const report = realCertificationReportService.run();

    expect(report.stages.map((stage) => stage.stage)).toEqual(REAL_FILE_BASELINE_STAGES);
    expect(report.stages).toHaveLength(10);
  });

  it("reports subject readiness for mathematics, physics and chemistry", () => {
    const report = realCertificationReportService.run();

    expect(report.subjects.map((subject) => subject.subject)).toEqual(expect.arrayContaining([
      "Mathematics",
      "Physics",
      "Chemistry"
    ]));
    expect(report.mathematicsReadinessScore).toBeGreaterThanOrEqual(0);
    expect(report.chemistryReadinessScore).toBeGreaterThanOrEqual(0);
  });

  it("does not allow a GO decision while required real files are missing", () => {
    const report = realCertificationReportService.run();

    if (report.baseline.filesPresent < report.baseline.requiredDocuments) {
      expect(report.decision).toBe("NO_GO");
      expect(report.blockers.some((blocker) => blocker.priority === "P0" && blocker.area === "Real source files")).toBe(true);
    }
  });

  it("tracks STEM proof areas separately from generic production readiness", () => {
    const report = realCertificationReportService.run();
    const featureNames = report.features.map((feature) => feature.feature);

    expect(featureNames).toEqual(expect.arrayContaining([
      "Mathematical formulas",
      "Chemistry structures",
      "Diagrams",
      "Graphs",
      "Tables",
      "Answer keys",
      "Solutions"
    ]));
    expect(report.internationalCompetitivenessScore).toBeGreaterThanOrEqual(0);
    expect(report.internationalCompetitivenessScore).toBeLessThanOrEqual(100);
  });
});
