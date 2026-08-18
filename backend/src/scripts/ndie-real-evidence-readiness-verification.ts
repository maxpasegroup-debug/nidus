import { realEvidenceReadinessService } from "../modules/ndie/certification/real-evidence-readiness.service.js";
import { REAL_FILE_BASELINE_STAGES } from "../modules/ndie/certification/real-file-baseline.service.js";

const report = realEvidenceReadinessService.run();

const allSlotsPlanned = report.summary.requiredSlots === report.slotPlans.length;
const actionCountMatchesOpenSlots = report.orderedActions.length === report.slotPlans.filter((plan) => plan.status !== "CERTIFIED").length;
const everyPlanHasProofAreas = report.slotPlans.every((plan) => plan.proofAreas.length > 0);
const missingStageCoverage = report.slotPlans.every((plan) => (
  plan.status === "CERTIFIED" ||
  plan.missingStages.every((stage) => REAL_FILE_BASELINE_STAGES.includes(stage as typeof REAL_FILE_BASELINE_STAGES[number]))
));
const everyOpenPlanHasCommand = report.slotPlans
  .filter((plan) => plan.status !== "CERTIFIED")
  .every((plan) => typeof plan.command === "string" && plan.command.length > 0);
const everyOpenPlanHasCommandSequence = report.slotPlans
  .filter((plan) => plan.status !== "CERTIFIED")
  .every((plan) => plan.commands.length >= 2 && plan.verificationCommand.includes("test:ndie-real-launch-gate"));
const subjectCoverage = ["Mathematics", "Physics", "Chemistry"].every((subject) => report.subjectReadiness.some((row) => row.subject === subject));
const workflowComplete = report.workflow.length === 6 && report.workflow.every((step, index) => step.step === index + 1);
const engineReadinessCovered = report.summary.requiredEngines === report.engineReadiness.length && report.summary.readyEngines === report.engineReadiness.filter((engine) => engine.status === "READY").length;
const engineActionsCovered = report.engineActions.length === report.summary.blockedEngines && report.engineActions.every((action) => action.command.startsWith("npm run "));
const noFalseCompletion = report.summary.certifiedSlots < report.summary.requiredSlots
  ? report.nextBestAction !== "All real evidence is certified. Rerun the launch gate in enforced mode."
  : true;

const checks = [
  ["all slots planned", allSlotsPlanned],
  ["action count matches open slots", actionCountMatchesOpenSlots],
  ["every plan has proof areas", everyPlanHasProofAreas],
  ["missing stage coverage", missingStageCoverage],
  ["every open plan has command", everyOpenPlanHasCommand],
  ["every open plan has command sequence", everyOpenPlanHasCommandSequence],
  ["subject coverage", subjectCoverage],
  ["workflow complete", workflowComplete],
  ["engine readiness covered", engineReadinessCovered],
  ["engine actions covered", engineActionsCovered],
  ["no false completion", noFalseCompletion]
] as const;

const failures = checks.filter(([, passed]) => !passed).map(([name]) => name);

const output = {
  status: failures.length ? "FAIL" : "PASS",
  phase: "phase-8-real-evidence-readiness",
  launchGateStatus: report.launchGateStatus,
  launchGateReleaseScope: report.launchGateReleaseScope,
  summary: report.summary,
  engineReadiness: report.engineReadiness,
  engineActions: report.engineActions,
  subjectReadiness: report.subjectReadiness,
  workflow: report.workflow,
  nextBestAction: report.nextBestAction,
  orderedActions: report.orderedActions.map((action) => ({
    priority: action.priority,
    slotId: action.slotId,
    status: action.status,
    action: action.action,
    command: action.command,
    commands: action.commands
  }))
};

if (failures.length) {
  console.error(JSON.stringify({ ...output, failures }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify(output, null, 2));
