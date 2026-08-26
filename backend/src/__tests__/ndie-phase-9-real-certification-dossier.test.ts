import { describe, expect, it } from "@jest/globals";
import { realCertificationDossierService } from "../modules/ndie/certification/real-certification-dossier.service.js";

describe("NDIE Phase 9 - Real Certification Dossier", () => {
  it("builds an audit-ready dossier with required sections", () => {
    const dossier = realCertificationDossierService.run();

    expect(dossier.sections.map((section) => section.title)).toEqual(expect.arrayContaining([
      "Executive Summary",
      "Critical Blockers",
      "Decision Rationale",
      "Engine Readiness",
      "Evidence Integrity",
      "Pipeline Stage Evidence",
      "Subject Readiness",
      "STEM Feature Proof",
      "Real File Slot Checklist",
      "Ordered Next Actions",
      "Certification Sign-off"
    ]));
  });

  it("includes Mathematics, Physics and Chemistry readiness in the executive section", () => {
    const dossier = realCertificationDossierService.run();
    const executive = dossier.sections.find((section) => section.title === "Executive Summary");

    expect(executive?.lines.join("\n")).toContain("Mathematics readiness");
    expect(executive?.lines.join("\n")).toContain("Physics readiness");
    expect(executive?.lines.join("\n")).toContain("Chemistry readiness");
    expect(dossier.physicsReadinessScore).toBeGreaterThanOrEqual(0);
  });

  it("keeps the markdown report human-readable", () => {
    const dossier = realCertificationDossierService.run();

    expect(dossier.markdown).toContain("# NIDUS NDIE Real Certification Dossier");
    expect(dossier.markdown).toContain("## Executive Summary");
    expect(dossier.markdown).toContain("## Ordered Next Actions");
    expect(dossier.markdown).toContain("Dossier SHA-256:");
  });

  it("records input provenance, evidence completeness and engine readiness", () => {
    const dossier = realCertificationDossierService.run();

    expect(dossier.inputVersions.certificationReport).toMatch(/^real-certification-report-/);
    expect(dossier.inputVersions.launchGate).toMatch(/^real-launch-gate-/);
    expect(dossier.inputVersions.evidenceReadiness).toMatch(/^real-evidence-readiness-/);
    expect(dossier.evidenceSummary.requiredSlots).toBe(17);
    expect(dossier.evidenceSummary.requiredStages).toBeGreaterThan(0);
    expect(dossier.engineReadiness).toHaveLength(5);
  });

  it("creates a verifiable dossier checksum", () => {
    const dossier = realCertificationDossierService.run();

    expect(dossier.dossierSha256).toMatch(/^[a-f0-9]{64}$/);
    expect(realCertificationDossierService.verify(dossier)).toBe(true);
    expect(realCertificationDossierService.verify(JSON.parse(JSON.stringify(dossier)))).toBe(true);
    expect(realCertificationDossierService.verify({ ...dossier, releaseScope: "INTERNATIONAL_CERTIFIED" })).toBe(false);
  });

  it("blocks formal sign-off while mandatory evidence is incomplete", () => {
    const dossier = realCertificationDossierService.run();

    if (dossier.launchGateStatus === "FAIL") {
      expect(dossier.signoff.status).toBe("BLOCKED");
      expect(dossier.decisionReasons.length).toBeGreaterThan(0);
    }
  });

  it("does not present international certification while the launch gate is failing", () => {
    const dossier = realCertificationDossierService.run();

    if (dossier.launchGateStatus === "FAIL") {
      expect(dossier.releaseScope).not.toBe("INTERNATIONAL_CERTIFIED");
      expect(dossier.sections.find((section) => section.title === "Executive Summary")?.status).toBe("FAIL");
    }
  });
});
