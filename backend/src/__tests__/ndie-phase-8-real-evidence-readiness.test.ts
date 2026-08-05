import { describe, expect, it } from "@jest/globals";
import { realEvidenceReadinessService } from "../modules/ndie/certification/real-evidence-readiness.service.js";

describe("NDIE Phase 8 - Real Evidence Readiness Planner", () => {
  it("creates a readiness plan for every required real certification slot", () => {
    const report = realEvidenceReadinessService.run();

    expect(report.slotPlans).toHaveLength(report.summary.requiredSlots);
    expect(report.summary.requiredSlots).toBeGreaterThanOrEqual(10);
  });

  it("gives every uncertified slot a concrete next action and command", () => {
    const report = realEvidenceReadinessService.run();
    const openPlans = report.slotPlans.filter((plan) => plan.status !== "CERTIFIED");

    expect(report.orderedActions).toHaveLength(openPlans.length);
    for (const plan of openPlans) {
      expect(plan.nextAction.length).toBeGreaterThan(0);
      expect(plan.command).toEqual(expect.any(String));
    }
  });

  it("prioritizes missing source files before later pipeline work", () => {
    const report = realEvidenceReadinessService.run();
    const firstAction = report.orderedActions[0];

    if (report.summary.waitingForSourceFiles > 0) {
      expect(firstAction.priority).toBe("P0");
      expect(firstAction.status).toBe("WAITING_FOR_SOURCE_FILE");
    }
  });

  it("tracks Mathematics and Chemistry proof areas explicitly", () => {
    const report = realEvidenceReadinessService.run();
    const mathematicsPlans = report.slotPlans.filter((plan) => plan.subject === "Mathematics");
    const chemistryPlans = report.slotPlans.filter((plan) => plan.subject === "Chemistry");

    expect(mathematicsPlans.some((plan) => plan.proofAreas.includes("Formula preservation"))).toBe(true);
    expect(chemistryPlans.some((plan) => plan.proofAreas.includes("Chemistry structures"))).toBe(true);
    expect(chemistryPlans.some((plan) => plan.proofAreas.includes("Answer key mapping"))).toBe(true);
  });
});
