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

  it("cryptographically rejects tampered manifest and package metadata", () => {
    const pack = realReleasePackService.run();

    expect(realReleasePackService.verify({ ...pack, releaseScope: "INTERNATIONAL_CERTIFIED" }).valid).toBe(false);
    expect(realReleasePackService.verify({
      ...pack,
      artifacts: pack.artifacts.map((artifact, index) => index === 0 ? { ...artifact, bytes: artifact.bytes + 1 } : artifact)
    }).valid).toBe(false);
  });

  it("verifies every artifact payload in the complete bundle", () => {
    const bundle = realReleasePackService.bundle();

    expect(realReleasePackService.verifyBundle(bundle).valid).toBe(true);
    const tampered = {
      pack: bundle.pack,
      files: bundle.files.map((file, index) => index === 0 ? { ...file, content: `${file.content}\ntampered` } : file)
    };
    expect(realReleasePackService.verifyBundle(tampered).valid).toBe(false);
  });

  it("records complete provenance and certification state", () => {
    const pack = realReleasePackService.run();

    expect(pack.snapshotId).toMatch(/^ndie-release-/);
    expect(pack.hashAlgorithm).toBe("SHA-256");
    expect(Object.values(pack.inputVersions).every(Boolean)).toBe(true);
    expect(pack.dossierSha256).toMatch(/^[a-f0-9]{64}$/);
    expect(pack.certificationState).toBe(pack.launchGateStatus === "PASS" ? "READY_FOR_IMMUTABLE_ARCHIVE" : "PRELAUNCH_FAILED");
  });

  it("does not mark failed launch packs as immutable production archives", () => {
    const pack = realReleasePackService.run();

    if (pack.launchGateStatus === "FAIL") {
      expect(pack.releaseScope).not.toBe("INTERNATIONAL_CERTIFIED");
      expect(pack.immutableArchiveRequired).toBe(false);
      expect(pack.recommendation).toContain("Do not use this pack as production certification evidence");
    }
  });

  it("keeps Mathematics, Physics and Chemistry readiness visible in the package summary", () => {
    const pack = realReleasePackService.run();

    expect(pack.mathematicsReadinessScore).toBeGreaterThanOrEqual(0);
    expect(pack.physicsReadinessScore).toBeGreaterThanOrEqual(0);
    expect(pack.chemistryReadinessScore).toBeGreaterThanOrEqual(0);
    expect(pack.internationalCompetitivenessScore).toBeGreaterThanOrEqual(0);
  });
});
