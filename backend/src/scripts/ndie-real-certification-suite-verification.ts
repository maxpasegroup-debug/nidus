import { realCertificationSuiteService } from "../modules/ndie/certification/real-certification-suite.service.js";

const suite = realCertificationSuiteService.run();

const requiredSteps = [
  "real-file-intake",
  "real-file-baseline",
  "real-certification-report",
  "real-launch-gate",
  "real-evidence-readiness",
  "real-certification-dossier",
  "real-release-pack",
  "real-release-archive"
];

const hasRequiredSteps = requiredSteps.every((stepId) => suite.steps.some((step) => step.id === stepId));
const commandSequenceComplete = requiredSteps.length === suite.commandSequence.length &&
  suite.commandSequence.every((command) => command.startsWith("npm run "));
const noFalseLaunch = suite.safeToBeginProductionLaunch
  ? suite.status === "PASS" && suite.launchGateStatus === "PASS" && suite.executiveDecision === "GO"
  : true;
const nextCommandMatchesFailure = suite.failedSteps.length
  ? suite.nextRequiredCommand === suite.steps.find((step) => step.status === "FAIL")?.command
  : suite.nextRequiredCommand === null;
const scoreBounds = [
  suite.productionReadinessScore,
  suite.mathematicsReadinessScore,
  suite.chemistryReadinessScore,
  suite.internationalCompetitivenessScore
].every((score) => score >= 0 && score <= 100);

const checks = [
  ["required steps", hasRequiredSteps],
  ["command sequence complete", commandSequenceComplete],
  ["no false launch", noFalseLaunch],
  ["next command matches failure", nextCommandMatchesFailure],
  ["score bounds", scoreBounds]
] as const;

const failures = checks.filter(([, passed]) => !passed).map(([name]) => name);

const output = {
  status: failures.length ? "FAIL" : "PASS",
  phase: "phase-12-real-certification-suite",
  suiteStatus: suite.status,
  releaseScope: suite.releaseScope,
  launchGateStatus: suite.launchGateStatus,
  executiveDecision: suite.executiveDecision,
  scores: {
    productionReadiness: suite.productionReadinessScore,
    mathematicsReadiness: suite.mathematicsReadinessScore,
    chemistryReadiness: suite.chemistryReadinessScore,
    internationalCompetitiveness: suite.internationalCompetitivenessScore
  },
  failedSteps: suite.failedSteps,
  nextRequiredCommand: suite.nextRequiredCommand,
  safeToBeginProductionLaunch: suite.safeToBeginProductionLaunch,
  recommendation: suite.recommendation
};

if (failures.length) {
  console.error(JSON.stringify({ ...output, failures }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify(output, null, 2));
