import { describe, expect, it } from "@jest/globals";
import { realEvidenceReadinessService } from "../modules/ndie/certification/real-evidence-readiness.service.js";

describe("NDIE Phase 8 - Real Evidence Readiness Planner", () => {
  it("creates a readiness plan for every required real certification slot", () => {
    const report = realEvidenceReadinessService.run();

    expect(report.slotPlans).toHaveLength(report.summary.requiredSlots);
    expect(report.summary.requiredSlots).toBe(17);
  });

  it("gives every uncertified slot a concrete next action and command", () => {
    const report = realEvidenceReadinessService.run();
    const openPlans = report.slotPlans.filter((plan) => plan.status !== "CERTIFIED");

    expect(report.orderedActions).toHaveLength(openPlans.length);
    for (const plan of openPlans) {
      expect(plan.nextAction.length).toBeGreaterThan(0);
      expect(plan.command).toEqual(expect.any(String));
      expect(plan.commands.length).toBeGreaterThanOrEqual(2);
      expect(plan.sourceDestination.length).toBeGreaterThan(0);
      expect(plan.verificationCommand).toContain("test:ndie-real-launch-gate");
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

  it("tracks Mathematics, Physics and Chemistry proof areas explicitly", () => {
    const report = realEvidenceReadinessService.run();
    const mathematicsPlans = report.slotPlans.filter((plan) => plan.subject === "Mathematics");
    const chemistryPlans = report.slotPlans.filter((plan) => plan.subject === "Chemistry");
    const physicsPlans = report.slotPlans.filter((plan) => plan.subject === "Physics");

    expect(mathematicsPlans.some((plan) => plan.proofAreas.includes("Formula preservation"))).toBe(true);
    expect(chemistryPlans.some((plan) => plan.proofAreas.includes("Chemistry structures"))).toBe(true);
    expect(chemistryPlans.some((plan) => plan.proofAreas.includes("Answer key mapping"))).toBe(true);
    expect(physicsPlans.some((plan) => plan.proofAreas.includes("Physics diagrams and circuits"))).toBe(true);
    expect(report.subjectReadiness.map((subject) => subject.subject)).toEqual(["Mathematics", "Physics", "Chemistry"]);
  });

  it("provides the complete source-to-certification workflow", () => {
    const report = realEvidenceReadinessService.run();

    expect(report.workflow.map((step) => step.label)).toEqual([
      "Add source",
      "Run intake",
      "Process document",
      "Review and deliver",
      "Export evidence",
      "Certify"
    ]);
    expect(report.summary.readinessPercent).toBeGreaterThanOrEqual(0);
    expect(report.summary.readinessPercent).toBeLessThanOrEqual(100);
  });

  it("carries Phase 2-6 engine readiness into the evidence plan", () => {
    const report = realEvidenceReadinessService.run();

    expect(report.summary.requiredEngines).toBe(5);
    expect(report.summary.readyEngines).toBe(5);
    expect(report.summary.blockedEngines).toBe(0);
    expect(report.engineReadiness.every((engine) => engine.status === "READY")).toBe(true);
    expect(report.engineActions).toEqual([]);
  });
});
