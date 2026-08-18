import { describe, expect, it } from "@jest/globals";
import { realCertificationSuiteService } from "../modules/ndie/certification/real-certification-suite.service.js";

describe("NDIE Phase 12 - Real Certification Suite", () => {
  it("runs every real certification step in order", () => {
    const suite = realCertificationSuiteService.run();

    expect(suite.steps.map((step) => step.id)).toEqual([
      "real-file-intake",
      "real-file-baseline",
      "real-certification-report",
      "real-launch-gate",
      "real-evidence-readiness",
      "real-certification-dossier",
      "real-release-pack",
      "real-release-archive"
    ]);
  });

  it("provides a runnable command for every step", () => {
    const suite = realCertificationSuiteService.run();

    expect(suite.commandSequence).toHaveLength(suite.steps.length);
    expect(suite.commandSequence.every((command) => command.startsWith("npm run "))).toBe(true);
  });

  it("does not allow production launch unless all certification checks pass", () => {
    const suite = realCertificationSuiteService.run();

    if (suite.status === "FAIL") {
      expect(suite.safeToBeginProductionLaunch).toBe(false);
      expect(suite.nextRequiredCommand).toEqual(expect.any(String));
    }
  });

  it("keeps Mathematics, Physics and Chemistry readiness in the suite summary", () => {
    const suite = realCertificationSuiteService.run();

    expect(suite.mathematicsReadinessScore).toBeGreaterThanOrEqual(0);
    expect(suite.physicsReadinessScore).toBeGreaterThanOrEqual(0);
    expect(suite.chemistryReadinessScore).toBeGreaterThanOrEqual(0);
    expect(suite.internationalCompetitivenessScore).toBeGreaterThanOrEqual(0);
  });
});
