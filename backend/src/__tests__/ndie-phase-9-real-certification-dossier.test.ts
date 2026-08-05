import { describe, expect, it } from "@jest/globals";
import { realCertificationDossierService } from "../modules/ndie/certification/real-certification-dossier.service.js";

describe("NDIE Phase 9 - Real Certification Dossier", () => {
  it("builds an audit-ready dossier with required sections", () => {
    const dossier = realCertificationDossierService.run();

    expect(dossier.sections.map((section) => section.title)).toEqual(expect.arrayContaining([
      "Executive Summary",
      "Critical Blockers",
      "Pipeline Stage Evidence",
      "Subject Readiness",
      "STEM Feature Proof",
      "Real File Slot Checklist",
      "Ordered Next Actions"
    ]));
  });

  it("includes Mathematics and Chemistry readiness in the executive section", () => {
    const dossier = realCertificationDossierService.run();
    const executive = dossier.sections.find((section) => section.title === "Executive Summary");

    expect(executive?.lines.join("\n")).toContain("Mathematics readiness");
    expect(executive?.lines.join("\n")).toContain("Chemistry readiness");
  });

  it("keeps the markdown report human-readable", () => {
    const dossier = realCertificationDossierService.run();

    expect(dossier.markdown).toContain("# NIDUS NDIE Real Certification Dossier");
    expect(dossier.markdown).toContain("## Executive Summary");
    expect(dossier.markdown).toContain("## Ordered Next Actions");
  });

  it("does not present international certification while the launch gate is failing", () => {
    const dossier = realCertificationDossierService.run();

    if (dossier.launchGateStatus === "FAIL") {
      expect(dossier.releaseScope).not.toBe("INTERNATIONAL_CERTIFIED");
      expect(dossier.sections.find((section) => section.title === "Executive Summary")?.status).toBe("FAIL");
    }
  });
});
