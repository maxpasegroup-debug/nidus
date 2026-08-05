import {
  REAL_FILE_BASELINE_STAGES,
  type RealFileBaselineSlot,
  type RealFileDocumentBaselineReport,
  type RealFileStageResult,
  realFileBaselineService
} from "./real-file-baseline.service.js";
import { realLaunchGateService } from "./real-launch-gate.service.js";

export type RealEvidenceReadinessStatus =
  | "WAITING_FOR_SOURCE_FILE"
  | "WAITING_FOR_PIPELINE_RUN"
  | "FIX_FAILED_EVIDENCE"
  | "CERTIFIED";

export type RealEvidenceReadinessPriority = "P0" | "P1" | "P2";

export type RealEvidenceReadinessAction = {
  priority: RealEvidenceReadinessPriority;
  slotId: string;
  title: string;
  status: RealEvidenceReadinessStatus;
  action: string;
  command: string | null;
  reason: string;
};

export type RealEvidenceReadinessSlotPlan = {
  slotId: string;
  title: string;
  subject: RealFileBaselineSlot["subject"];
  exam: RealFileBaselineSlot["exam"];
  requiredInput: string;
  acceptedExtensions: string[];
  status: RealEvidenceReadinessStatus;
  priority: RealEvidenceReadinessPriority;
  selectedFile: string | null;
  sourceSha256: string | null;
  expectedSourceFiles: string[];
  expectedEvidenceFile: string;
  proofAreas: string[];
  completedStages: string[];
  missingStages: string[];
  failedStages: Array<{
    stage: string;
    status: RealFileStageResult["status"];
    reason: string;
  }>;
  nextAction: string;
  command: string | null;
};

export type RealEvidenceReadinessReport = {
  reportVersion: string;
  generatedAt: string;
  launchGateStatus: string;
  launchGateReleaseScope: string;
  summary: {
    requiredSlots: number;
    certifiedSlots: number;
    waitingForSourceFiles: number;
    waitingForPipelineRuns: number;
    failedEvidenceSlots: number;
    missingSourceFiles: number;
    missingStageEvidence: number;
  };
  slotPlans: RealEvidenceReadinessSlotPlan[];
  orderedActions: RealEvidenceReadinessAction[];
  nextBestAction: string;
};

export const REAL_EVIDENCE_READINESS_VERSION = "real-evidence-readiness-v1";

function proofAreas(slot: RealFileBaselineSlot) {
  const labels: Array<[keyof RealFileBaselineSlot["mustProve"], string]> = [
    ["formulas", "Formula preservation"],
    ["chemistryStructures", "Chemistry structures"],
    ["diagrams", "Diagram preservation"],
    ["graphs", "Graph preservation"],
    ["tables", "Table preservation"],
    ["scanned", "Scanned document handling"],
    ["mobilePhoto", "Mobile camera handling"],
    ["docxOfficeMath", "DOCX Office Math"],
    ["answerKey", "Answer key mapping"],
    ["solutions", "Solution mapping"]
  ];
  return labels.filter(([key]) => slot.mustProve[key]).map(([, label]) => label);
}

function statusFor(document: RealFileDocumentBaselineReport): RealEvidenceReadinessStatus {
  if (document.productionCertified) return "CERTIFIED";
  if (!document.evidence.exists) return "WAITING_FOR_SOURCE_FILE";
  if (document.stageResults.some((stage) => stage.status === "FAIL")) return "FIX_FAILED_EVIDENCE";
  return "WAITING_FOR_PIPELINE_RUN";
}

function priorityFor(status: RealEvidenceReadinessStatus, document: RealFileDocumentBaselineReport): RealEvidenceReadinessPriority {
  if (status === "WAITING_FOR_SOURCE_FILE") return "P0";
  if (status === "FIX_FAILED_EVIDENCE") return "P0";
  if (document.subject === "Mathematics" || document.subject === "Chemistry") return "P1";
  return "P2";
}

function commandFor(status: RealEvidenceReadinessStatus, document: RealFileDocumentBaselineReport) {
  if (status === "CERTIFIED") return null;
  if (status === "WAITING_FOR_SOURCE_FILE") {
    return "npm run test:ndie-real-intake --workspace backend";
  }
  return `npm run ndie:evidence:export --workspace backend -- --slot ${document.slotId} --import <ndie-import-job-id> --write`;
}

function actionFor(status: RealEvidenceReadinessStatus, document: RealFileDocumentBaselineReport) {
  if (status === "CERTIFIED") return "No action required.";
  if (status === "WAITING_FOR_SOURCE_FILE") {
    return `Add ${document.requiredInput} to ${document.slotId}/source.<extension>.`;
  }
  if (status === "FIX_FAILED_EVIDENCE") {
    return "Fix the failed evidence manifest or rerun the real NDIE import and export fresh evidence.";
  }
  return "Upload this real paper through NDIE, complete teacher review/publish/CBT render, then export evidence.";
}

function reasonFor(status: RealEvidenceReadinessStatus, document: RealFileDocumentBaselineReport) {
  if (status === "CERTIFIED") return "This slot has complete passing real-file evidence.";
  if (status === "WAITING_FOR_SOURCE_FILE") return document.evidence.problem ?? "The real source file is missing.";
  if (status === "FIX_FAILED_EVIDENCE") {
    return document.stageResults
      .filter((stage) => stage.status === "FAIL")
      .map((stage) => `${stage.stage}: ${stage.reason}`)
      .join(" ");
  }
  return "The source file exists but complete upload-to-CBT evidence has not been recorded.";
}

function slotPlan(slot: RealFileBaselineSlot, document: RealFileDocumentBaselineReport): RealEvidenceReadinessSlotPlan {
  const status = statusFor(document);
  const completedStages = document.stageResults.filter((stage) => stage.status === "PASS").map((stage) => stage.stage);
  const missingStages = REAL_FILE_BASELINE_STAGES.filter((stage) => !completedStages.includes(stage));
  const failedStages = document.stageResults
    .filter((stage) => stage.status === "FAIL" || stage.status === "BLOCKED")
    .map((stage) => ({ stage: stage.stage, status: stage.status, reason: stage.reason }));
  return {
    slotId: document.slotId,
    title: document.title,
    subject: document.subject,
    exam: document.exam,
    requiredInput: document.requiredInput,
    acceptedExtensions: slot.acceptedExtensions,
    status,
    priority: priorityFor(status, document),
    selectedFile: document.evidence.selectedFile,
    sourceSha256: document.evidence.sha256,
    expectedSourceFiles: document.evidence.expectedFiles,
    expectedEvidenceFile: document.evidence.expectedEvidenceFile,
    proofAreas: proofAreas(slot),
    completedStages,
    missingStages,
    failedStages,
    nextAction: actionFor(status, document),
    command: commandFor(status, document)
  };
}

function actionFromPlan(plan: RealEvidenceReadinessSlotPlan): RealEvidenceReadinessAction | null {
  if (plan.status === "CERTIFIED") return null;
  return {
    priority: plan.priority,
    slotId: plan.slotId,
    title: plan.title,
    status: plan.status,
    action: plan.nextAction,
    command: plan.command,
    reason: plan.failedStages[0]?.reason ?? (
      plan.status === "WAITING_FOR_PIPELINE_RUN"
        ? "Source exists but evidence is incomplete."
        : "Required real certification input is missing."
    )
  };
}

function isReadinessAction(action: RealEvidenceReadinessAction | null): action is RealEvidenceReadinessAction {
  return action !== null;
}

function priorityOrder(priority: RealEvidenceReadinessPriority) {
  return priority === "P0" ? 0 : priority === "P1" ? 1 : 2;
}

export const realEvidenceReadinessService = {
  version: REAL_EVIDENCE_READINESS_VERSION,

  run(): RealEvidenceReadinessReport {
    const baseline = realFileBaselineService.run();
    const launchGate = realLaunchGateService.run();
    const slotPlans = realFileBaselineService.slots.map((slot) => {
      const document = baseline.documentReports.find((report) => report.slotId === slot.id);
      if (!document) throw new Error(`Missing real-file baseline document for ${slot.id}`);
      return slotPlan(slot, document);
    });
    const orderedActions = slotPlans
      .map(actionFromPlan)
      .filter(isReadinessAction)
      .sort((left, right) => priorityOrder(left.priority) - priorityOrder(right.priority));

    return {
      reportVersion: REAL_EVIDENCE_READINESS_VERSION,
      generatedAt: new Date().toISOString(),
      launchGateStatus: launchGate.status,
      launchGateReleaseScope: launchGate.releaseScope,
      summary: {
        requiredSlots: slotPlans.length,
        certifiedSlots: slotPlans.filter((plan) => plan.status === "CERTIFIED").length,
        waitingForSourceFiles: slotPlans.filter((plan) => plan.status === "WAITING_FOR_SOURCE_FILE").length,
        waitingForPipelineRuns: slotPlans.filter((plan) => plan.status === "WAITING_FOR_PIPELINE_RUN").length,
        failedEvidenceSlots: slotPlans.filter((plan) => plan.status === "FIX_FAILED_EVIDENCE").length,
        missingSourceFiles: baseline.missingFixturePaths.length,
        missingStageEvidence: slotPlans.reduce((sum, plan) => sum + plan.missingStages.length, 0)
      },
      slotPlans,
      orderedActions,
      nextBestAction: orderedActions[0]?.action ?? "All real evidence is certified. Rerun the launch gate in enforced mode."
    };
  }
};
