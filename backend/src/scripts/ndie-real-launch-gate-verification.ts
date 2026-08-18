import { realLaunchGateService } from "../modules/ndie/certification/real-launch-gate.service.js";

const enforce = process.argv.includes("--enforce");
const gate = realLaunchGateService.run({ enforce });

const hasRequiredChecks = [
  "real-certification-go",
  "production-readiness-score",
  "mathematics-readiness-score",
  "physics-readiness-score",
  "chemistry-readiness-score",
  "pipeline-stage-certification",
  "subject-certification",
  "feature-proof-certification",
  "phase-intelligence-readiness",
  "real-evidence-completeness",
  "international-competitiveness-score",
  "critical-blocker-clearance"
].every((checkId) => gate.checks.some((check) => check.id === checkId));

const exitCodeMatchesMode = enforce
  ? gate.exitCode === (gate.failed ? 1 : 0)
  : gate.exitCode === 0;

const noFalsePass = gate.status === "FAIL" || (
  gate.certificationDecision === "GO" &&
  gate.productionReadinessScore >= realLaunchGateService.minimumCertificationScore &&
  gate.mathematicsReadinessScore >= realLaunchGateService.minimumCertificationScore &&
  gate.physicsReadinessScore >= realLaunchGateService.minimumCertificationScore &&
  gate.chemistryReadinessScore >= realLaunchGateService.minimumCertificationScore &&
  gate.internationalCompetitivenessScore >= realLaunchGateService.minimumCertificationScore &&
  gate.engineReadiness.every((engine) => engine.status === "READY")
);

const releaseScopeMatchesStatus = gate.status === "PASS"
  ? gate.releaseScope === "INTERNATIONAL_CERTIFIED"
  : gate.releaseScope !== "INTERNATIONAL_CERTIFIED";

const checks = [
  ["required launch checks", hasRequiredChecks],
  ["exit code matches mode", exitCodeMatchesMode],
  ["no false launch pass", noFalsePass],
  ["release scope matches status", releaseScopeMatchesStatus]
] as const;

const failures = checks.filter(([, passed]) => !passed).map(([name]) => name);

const output = {
  status: failures.length ? "FAIL" : "PASS",
  phase: "phase-7-real-launch-gate",
  gateStatus: gate.status,
  mode: gate.mode,
  releaseScope: gate.releaseScope,
  exitCode: gate.exitCode,
  scores: {
    productionReadiness: gate.productionReadinessScore,
    mathematicsReadiness: gate.mathematicsReadinessScore,
    physicsReadiness: gate.physicsReadinessScore,
    chemistryReadiness: gate.chemistryReadinessScore,
    internationalCompetitiveness: gate.internationalCompetitivenessScore
  },
  failedChecks: gate.checks.filter((check) => check.status === "FAIL").map((check) => ({
    id: check.id,
    label: check.label,
    message: check.message,
    remediation: check.remediation
  })),
  engineReadiness: gate.engineReadiness,
  blockers: gate.blockers,
  recommendation: gate.recommendation
};

if (failures.length) {
  console.error(JSON.stringify({ ...output, failures }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify(output, null, 2));

if (gate.exitCode !== 0) {
  process.exit(gate.exitCode);
}
