import { describe, expect, it } from "@jest/globals";
import { realLaunchGateService } from "../modules/ndie/certification/real-launch-gate.service.js";

describe("NDIE Phase 7 - Real Launch Gate", () => {
  it("contains the required production launch checks", () => {
    const gate = realLaunchGateService.run();

    expect(gate.checks.map((check) => check.id)).toEqual(expect.arrayContaining([
      "real-certification-go",
      "production-readiness-score",
      "mathematics-readiness-score",
      "chemistry-readiness-score",
      "pipeline-stage-certification",
      "subject-certification",
      "feature-proof-certification",
      "critical-blocker-clearance"
    ]));
  });

  it("does not pass while real certification is not GO", () => {
    const gate = realLaunchGateService.run();

    if (gate.certificationDecision !== "GO") {
      expect(gate.status).toBe("FAIL");
      expect(gate.releaseScope).not.toBe("INTERNATIONAL_CERTIFIED");
    }
  });

  it("keeps advisory mode non-breaking for development checks", () => {
    const gate = realLaunchGateService.run();

    expect(gate.mode).toBe("ADVISORY");
    expect(gate.exitCode).toBe(0);
  });

  it("returns a failing exit code only when enforcement is enabled and launch checks fail", () => {
    const advisory = realLaunchGateService.run();
    const enforced = realLaunchGateService.run({ enforce: true });

    expect(enforced.mode).toBe("ENFORCED");
    expect(enforced.exitCode).toBe(advisory.failed ? 1 : 0);
  });
});
