import { describe, expect, it } from "@jest/globals";
import { realReleasePackService } from "../modules/ndie/certification/real-release-pack.service.js";

describe("NDIE Phase 10 - Real Release Pack", () => {
  it("packages every required real certification artifact", () => {
    const pack = realReleasePackService.run();
    const verification = realReleasePackService.verify(pack);

    expect(verification.valid).toBe(true);
    expect(pack.artifacts.map((artifact) => artifact.name)).toEqual(expect.arrayContaining([
      "real-file-baseline.json",
      "real-certification-report.json",
      "real-launch-gate.json",
      "real-evidence-readiness.json",
      "real-certification-dossier.json",
      "real-certification-dossier.md"
    ]));
  });

  it("creates SHA-256 integrity hashes for every artifact and the package", () => {
    const pack = realReleasePackService.run();

    expect(pack.manifestSha256).toMatch(/^[a-f0-9]{64}$/);
    expect(pack.packageSha256).toMatch(/^[a-f0-9]{64}$/);
    for (const artifact of pack.artifacts) {
      expect(artifact.sha256).toMatch(/^[a-f0-9]{64}$/);
      expect(artifact.bytes).toBeGreaterThan(0);
    }
  });

  it("does not mark failed launch packs as immutable production archives", () => {
    const pack = realReleasePackService.run();

    if (pack.launchGateStatus === "FAIL") {
      expect(pack.releaseScope).not.toBe("INTERNATIONAL_CERTIFIED");
      expect(pack.immutableArchiveRequired).toBe(false);
      expect(pack.recommendation).toContain("Do not use this pack as production certification evidence");
    }
  });

  it("keeps Mathematics and Chemistry readiness visible in the package summary", () => {
    const pack = realReleasePackService.run();

    expect(pack.mathematicsReadinessScore).toBeGreaterThanOrEqual(0);
    expect(pack.chemistryReadinessScore).toBeGreaterThanOrEqual(0);
    expect(pack.internationalCompetitivenessScore).toBeGreaterThanOrEqual(0);
  });
});
