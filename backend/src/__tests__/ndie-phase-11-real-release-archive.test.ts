import { describe, expect, it } from "@jest/globals";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { realReleaseArchiveService } from "../modules/ndie/certification/real-release-archive.service.js";

describe("NDIE Phase 11 - Real Release Archive", () => {
  it("plans an archive without writing files by default", () => {
    const report = realReleaseArchiveService.plan({ now: new Date("2026-08-05T00:00:00.000Z") });

    expect(report.mode).toBe("DRY_RUN");
    expect(report.verified).toBe(true);
    expect(report.files.every((file) => file.written === false)).toBe(true);
    expect(report.files.map((file) => file.name)).toEqual(expect.arrayContaining([
      "real-file-baseline.json",
      "real-certification-report.json",
      "real-launch-gate.json",
      "real-evidence-readiness.json",
      "real-certification-dossier.json",
      "real-certification-dossier.md",
      "release-pack-manifest.json",
      "archive-seal.json"
    ]));
    expect(report.bundleVerified).toBe(true);
    expect(report.sealPlanned).toBe(true);
    expect(report.sealed).toBe(false);
    expect(report.overwriteProtected).toBe(true);
  });

  it("writes and verifies an archive when explicitly requested", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "ndie-release-archive-"));
    const report = realReleaseArchiveService.write({
      archiveRoot: root,
      archiveId: "phase-11-test"
    });

    expect(report.mode).toBe("WRITE");
    expect(report.verified).toBe(true);
    expect(report.sealed).toBe(true);
    for (const file of report.files) {
      expect(fs.existsSync(file.path)).toBe(true);
      expect(fs.statSync(file.path).size).toBe(file.bytes);
    }
    expect(realReleaseArchiveService.verifyWrittenArchive(report)).toBe(true);

    const firstArtifact = report.files.find((file) => file.name === "real-file-baseline.json");
    expect(firstArtifact).toBeDefined();
    fs.appendFileSync(firstArtifact!.path, "tampered", "utf8");
    expect(realReleaseArchiveService.verifyWrittenArchive(report)).toBe(false);
  });

  it("refuses to overwrite an existing archive", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "ndie-release-overwrite-"));
    realReleaseArchiveService.write({ archiveRoot: root, archiveId: "immutable-test" });

    expect(() => realReleaseArchiveService.write({ archiveRoot: root, archiveId: "immutable-test" }))
      .toThrow("already exists and cannot be overwritten");
  });

  it("rejects unsafe archive identifiers", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "ndie-release-id-"));

    expect(() => realReleaseArchiveService.write({ archiveRoot: root, archiveId: "../escape" })).toThrow("Archive ID must be a safe identifier");
    expect(() => realReleaseArchiveService.write({ archiveRoot: root, archiveId: "nested/archive" })).toThrow("Archive ID must be a safe identifier");
  });

  it("does not mark a failed launch archive as production certification evidence", () => {
    const report = realReleaseArchiveService.plan();

    if (report.launchGateStatus === "FAIL") {
      expect(report.archiveUsableForProductionCertification).toBe(false);
      expect(report.certificationState).toBe("PRELAUNCH_FAILED");
      expect(report.signoffStatus).toBe("BLOCKED");
      expect(report.recommendation).toContain("failed pre-launch dossier");
    }
  });

  it("rejects archive roots outside the approved archive or temp directories", () => {
    expect(() => realReleaseArchiveService.plan({ archiveRoot: path.parse(process.cwd()).root })).toThrow("Archive root must be inside");
  });
});
