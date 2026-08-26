import { realCertificationSuiteService } from "../modules/ndie/certification/real-certification-suite.service.js";

const writeArchive = process.argv.includes("--write-archive");
const suite = realCertificationSuiteService.run({ writeArchive });

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
  ? suite.status === "PASS" && suite.launchGateStatus === "PASS" && suite.executiveDecision === "GO" &&
    suite.mode === "RELEASE" && suite.integrity.archiveSealed && suite.archive.usableForProductionCertification
  : true;
const nextCommandIsActionable = suite.safeToBeginProductionLaunch
  ? suite.nextRequiredCommand === null
  : typeof suite.nextRequiredCommand === "string" && suite.nextRequiredCommand.startsWith("npm run ");
const scoreBounds = [
  suite.productionReadinessScore,
  suite.mathematicsReadinessScore,
  suite.physicsReadinessScore,
  suite.chemistryReadinessScore,
  suite.internationalCompetitivenessScore
].every((score) => score >= 0 && score <= 100);
const integrityComplete = suite.integrity.dossierVerified && suite.integrity.releasePackVerified &&
  suite.integrity.archiveBundleVerified && suite.integrity.archiveVerified && suite.integrity.snapshotConsistent;
const assessmentNeverLaunches = suite.mode !== "ASSESSMENT" || !suite.safeToBeginProductionLaunch;
const blockedReleaseDoesNotWrite = suite.mode !== "RELEASE" || suite.readyToWriteProductionArchive || suite.archive.mode === "DRY_RUN";

const checks = [
  ["required steps", hasRequiredSteps],
  ["command sequence complete", commandSequenceComplete],
  ["no false launch", noFalseLaunch],
  ["next command actionable", nextCommandIsActionable],
  ["score bounds", scoreBounds],
  ["integrity complete", integrityComplete],
  ["assessment never launches", assessmentNeverLaunches],
  ["blocked release does not write", blockedReleaseDoesNotWrite]
] as const;

const failures = checks.filter(([, passed]) => !passed).map(([name]) => name);

const output = {
  status: failures.length ? "FAIL" : "PASS",
  phase: "phase-12-real-certification-suite",
  suiteRunId: suite.suiteRunId,
  mode: suite.mode,
  state: suite.state,
  suiteStatus: suite.status,
  releaseScope: suite.releaseScope,
  launchGateStatus: suite.launchGateStatus,
  executiveDecision: suite.executiveDecision,
  scores: {
    productionReadiness: suite.productionReadinessScore,
    mathematicsReadiness: suite.mathematicsReadinessScore,
    physicsReadiness: suite.physicsReadinessScore,
    chemistryReadiness: suite.chemistryReadinessScore,
    internationalCompetitiveness: suite.internationalCompetitivenessScore
  },
  failedSteps: suite.failedSteps,
  blockingFailures: suite.blockingFailures,
  evidenceReadinessPercent: suite.evidenceReadinessPercent,
  snapshotId: suite.snapshotId,
  packageSha256: suite.packageSha256,
  dossierSha256: suite.dossierSha256,
  integrity: suite.integrity,
  archive: suite.archive,
  readyToWriteProductionArchive: suite.readyToWriteProductionArchive,
  nextRequiredAction: suite.nextRequiredAction,
  nextRequiredCommand: suite.nextRequiredCommand,
  safeToBeginProductionLaunch: suite.safeToBeginProductionLaunch,
  recommendation: suite.recommendation
};

if (failures.length) {
  console.error(JSON.stringify({ ...output, failures }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify(output, null, 2));
