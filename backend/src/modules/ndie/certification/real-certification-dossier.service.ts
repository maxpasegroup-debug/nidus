import { createHash } from "node:crypto";
import {
  type RealCertificationBlocker,
  type RealCertificationFeatureSummary,
  type RealCertificationStageSummary,
  type RealCertificationSubjectSummary,
  realCertificationReportService
} from "./real-certification-report.service.js";
import {
  type RealEvidenceReadinessAction,
  type RealEvidenceReadinessEngineAction,
  type RealEvidenceReadinessSlotPlan,
  realEvidenceReadinessService
} from "./real-evidence-readiness.service.js";
import { realLaunchGateService } from "./real-launch-gate.service.js";

export type RealCertificationDossierSection = {
  title: string;
  status: "PASS" | "FAIL" | "INFO";
  lines: string[];
};

export type RealCertificationDossierReport = {
  dossierVersion: string;
  generatedAt: string;
  title: string;
  executiveDecision: "GO" | "NO_GO";
  launchGateStatus: string;
  releaseScope: string;
  productionReadinessScore: number;
  mathematicsReadinessScore: number;
  physicsReadinessScore: number;
  chemistryReadinessScore: number;
  internationalCompetitivenessScore: number;
  inputVersions: {
    certificationReport: string;
    launchGate: string;
    evidenceReadiness: string;
  };
  evidenceSummary: {
    requiredSlots: number;
    sourceFilesPresent: number;
    checksumBoundSources: number;
    certifiedSlots: number;
    completedStages: number;
    requiredStages: number;
    readinessPercent: number;
  };
  decisionReasons: string[];
  engineReadiness: ReturnType<typeof realLaunchGateService.run>["engineReadiness"];
  engineActions: RealEvidenceReadinessEngineAction[];
  signoff: {
    status: "BLOCKED" | "READY_FOR_SIGNATURE";
    requiredRoles: string[];
    reason: string;
  };
  sections: RealCertificationDossierSection[];
  blockers: RealCertificationBlocker[];
  stages: RealCertificationStageSummary[];
  subjects: RealCertificationSubjectSummary[];
  features: RealCertificationFeatureSummary[];
  slotChecklist: RealEvidenceReadinessSlotPlan[];
  orderedActions: RealEvidenceReadinessAction[];
  dossierSha256: string;
  markdown: string;
};

export const REAL_CERTIFICATION_DOSSIER_VERSION = "real-certification-dossier-v3";

function scoreLine(label: string, score: number) {
  return `${label}: ${score}/100`;
}

function blockerLines(blockers: RealCertificationBlocker[]) {
  if (!blockers.length) return ["No blockers remain."];
  return blockers.map((blocker) => `${blocker.priority} ${blocker.area}: ${blocker.message} Action: ${blocker.action}`);
}

function stageLines(stages: RealCertificationStageSummary[]) {
  return stages.map((stage) => (
    `${stage.stage}: ${stage.status} - pass ${stage.pass}, fail ${stage.fail}, blocked ${stage.blocked}, not run ${stage.notRun}, average ${stage.averageScore}/100`
  ));
}

function subjectLines(subjects: RealCertificationSubjectSummary[]) {
  return subjects.map((subject) => (
    `${subject.subject}: ${subject.readiness} - files ${subject.filesPresent}/${subject.requiredDocuments}, full pipelines ${subject.fullPipelinesExecuted}/${subject.requiredDocuments}, average ${subject.averageScore}/100`
  ));
}

function featureLines(features: RealCertificationFeatureSummary[]) {
  return features.map((feature) => (
    `${feature.feature}: ${feature.readiness} - certified ${feature.certifiedDocuments}/${feature.requiredDocuments}${feature.missingProof.length ? `, missing ${feature.missingProof.join(", ")}` : ""}`
  ));
}

function slotLines(slots: RealEvidenceReadinessSlotPlan[]) {
  return slots.map((slot) => (
    `${slot.slotId}: ${slot.status} - ${slot.nextAction} Proof: ${slot.proofAreas.join(", ")}`
  ));
}

function actionLines(actions: RealEvidenceReadinessAction[]) {
  if (!actions.length) return ["No remaining actions."];
  return actions.map((action, index) => (
    `${index + 1}. ${action.priority} ${action.slotId}: ${action.action}${action.command ? ` Command: ${action.command}` : ""}`
  ));
}

function engineLines(
  engines: RealCertificationDossierReport["engineReadiness"],
  actions: RealEvidenceReadinessEngineAction[]
) {
  const actionByEngine = new Map(actions.map((action) => [action.engineId, action]));
  return engines.map((engine) => {
    const action = actionByEngine.get(engine.id);
    return `${engine.label} ${engine.version}: ${engine.status}${action ? ` - ${action.action} Command: ${action.command}` : ""}`;
  });
}

function evidenceLines(summary: RealCertificationDossierReport["evidenceSummary"]) {
  return [
    `Real source files: ${summary.sourceFilesPresent}/${summary.requiredSlots}`,
    `Checksum-bound sources: ${summary.checksumBoundSources}/${summary.requiredSlots}`,
    `Certified slots: ${summary.certifiedSlots}/${summary.requiredSlots}`,
    `Passing pipeline stages: ${summary.completedStages}/${summary.requiredStages}`,
    `Evidence readiness: ${summary.readinessPercent}%`
  ];
}

function dossierFingerprint(report: Omit<RealCertificationDossierReport, "dossierSha256" | "markdown">) {
  return createHash("sha256").update(JSON.stringify({
    dossierVersion: report.dossierVersion,
    generatedAt: report.generatedAt,
    executiveDecision: report.executiveDecision,
    launchGateStatus: report.launchGateStatus,
    releaseScope: report.releaseScope,
    scores: {
      production: report.productionReadinessScore,
      mathematics: report.mathematicsReadinessScore,
      physics: report.physicsReadinessScore,
      chemistry: report.chemistryReadinessScore,
      international: report.internationalCompetitivenessScore
    },
    inputVersions: report.inputVersions,
    evidenceSummary: report.evidenceSummary,
    decisionReasons: report.decisionReasons,
    engineReadiness: report.engineReadiness,
    signoff: report.signoff,
    blockers: report.blockers,
    stages: report.stages,
    subjects: report.subjects,
    features: report.features,
    slots: report.slotChecklist.map((slot) => ({
      slotId: slot.slotId,
      status: slot.status,
      sourceSha256: slot.sourceSha256,
      completedStages: slot.completedStages,
      failedStages: slot.failedStages
    }))
  })).digest("hex");
}

function markdownSection(section: RealCertificationDossierSection) {
  return [
    `## ${section.title}`,
    `Status: ${section.status}`,
    "",
    ...section.lines.map((line) => `- ${line}`)
  ].join("\n");
}

function buildMarkdown(input: {
  generatedAt: string;
  decision: string;
  releaseScope: string;
  dossierSha256: string;
  inputVersions: RealCertificationDossierReport["inputVersions"];
  sections: RealCertificationDossierSection[];
}) {
  return [
    "# NIDUS NDIE Real Certification Dossier",
    "",
    `Generated: ${input.generatedAt}`,
    `Executive decision: ${input.decision}`,
    `Release scope: ${input.releaseScope}`,
    `Dossier SHA-256: ${input.dossierSha256}`,
    `Inputs: report ${input.inputVersions.certificationReport}, gate ${input.inputVersions.launchGate}, readiness ${input.inputVersions.evidenceReadiness}`,
    "",
    ...input.sections.map(markdownSection)
  ].join("\n\n");
}

export const realCertificationDossierService = {
  version: REAL_CERTIFICATION_DOSSIER_VERSION,

  verify(report: RealCertificationDossierReport) {
    const { dossierSha256: _dossierSha256, markdown: _markdown, ...fingerprintInput } = report;
    return dossierFingerprint(fingerprintInput) === report.dossierSha256;
  },

  run(): RealCertificationDossierReport {
    const certification = realCertificationReportService.run();
    const launchGate = realLaunchGateService.run();
    const readiness = realEvidenceReadinessService.run();
    const generatedAt = new Date().toISOString();
    const completedStages = readiness.slotPlans.reduce((sum, slot) => sum + slot.completedStages.length, 0);
    const requiredStages = readiness.slotPlans.reduce((sum, slot) => sum + slot.completedStages.length + slot.missingStages.length, 0);
    const evidenceSummary: RealCertificationDossierReport["evidenceSummary"] = {
      requiredSlots: readiness.summary.requiredSlots,
      sourceFilesPresent: readiness.slotPlans.filter((slot) => Boolean(slot.selectedFile)).length,
      checksumBoundSources: readiness.slotPlans.filter((slot) => Boolean(slot.sourceSha256)).length,
      certifiedSlots: readiness.summary.certifiedSlots,
      completedStages,
      requiredStages,
      readinessPercent: readiness.summary.readinessPercent
    };
    const decisionReasons = launchGate.checks
      .filter((check) => check.status === "FAIL")
      .map((check) => `${check.label}: ${check.message}`);
    if (!decisionReasons.length) decisionReasons.push("Every mandatory launch-gate check passed.");
    const signoff: RealCertificationDossierReport["signoff"] = {
      status: launchGate.status === "PASS" && certification.decision === "GO" ? "READY_FOR_SIGNATURE" : "BLOCKED",
      requiredRoles: ["Academic QA", "Engineering QA", "Security", "Release Authority"],
      reason: launchGate.status === "PASS" && certification.decision === "GO"
        ? "All technical evidence is complete. Human release signatures may now be collected."
        : "Sign-off is blocked until all mandatory launch-gate checks pass."
    };
    const inputVersions = {
      certificationReport: certification.reportVersion,
      launchGate: launchGate.gateVersion,
      evidenceReadiness: readiness.reportVersion
    };
    const sections: RealCertificationDossierSection[] = [
      {
        title: "Executive Summary",
        status: launchGate.status,
        lines: [
          `Launch gate: ${launchGate.status}`,
          `Release scope: ${launchGate.releaseScope}`,
          scoreLine("Production readiness", certification.productionReadinessScore),
          scoreLine("Mathematics readiness", certification.mathematicsReadinessScore),
          scoreLine("Physics readiness", certification.physicsReadinessScore),
          scoreLine("Chemistry readiness", certification.chemistryReadinessScore),
          scoreLine("International competitiveness", certification.internationalCompetitivenessScore),
          launchGate.recommendation
        ]
      },
      {
        title: "Critical Blockers",
        status: certification.blockers.length ? "FAIL" : "PASS",
        lines: blockerLines(certification.blockers)
      },
      {
        title: "Decision Rationale",
        status: launchGate.status,
        lines: decisionReasons
      },
      {
        title: "Engine Readiness",
        status: readiness.summary.blockedEngines ? "FAIL" : "PASS",
        lines: engineLines(readiness.engineReadiness, readiness.engineActions)
      },
      {
        title: "Evidence Integrity",
        status: evidenceSummary.certifiedSlots === evidenceSummary.requiredSlots &&
          evidenceSummary.checksumBoundSources === evidenceSummary.requiredSlots ? "PASS" : "FAIL",
        lines: evidenceLines(evidenceSummary)
      },
      {
        title: "Pipeline Stage Evidence",
        status: certification.stages.every((stage) => stage.status === "CERTIFIED") ? "PASS" : "FAIL",
        lines: stageLines(certification.stages)
      },
      {
        title: "Subject Readiness",
        status: certification.subjects.every((subject) => subject.readiness === "CERTIFIED") ? "PASS" : "FAIL",
        lines: subjectLines(certification.subjects)
      },
      {
        title: "STEM Feature Proof",
        status: certification.features.every((feature) => feature.readiness === "CERTIFIED") ? "PASS" : "FAIL",
        lines: featureLines(certification.features)
      },
      {
        title: "Real File Slot Checklist",
        status: readiness.summary.certifiedSlots === readiness.summary.requiredSlots ? "PASS" : "FAIL",
        lines: slotLines(readiness.slotPlans)
      },
      {
        title: "Ordered Next Actions",
        status: readiness.engineActions.length || readiness.orderedActions.length ? "FAIL" : "PASS",
        lines: [
          ...readiness.engineActions.map((action, index) => `${index + 1}. P0 ${action.label}: ${action.action} Command: ${action.command}`),
          ...actionLines(readiness.orderedActions)
        ]
      },
      {
        title: "Certification Sign-off",
        status: signoff.status === "READY_FOR_SIGNATURE" ? "PASS" : "FAIL",
        lines: [
          `Status: ${signoff.status}`,
          `Required roles: ${signoff.requiredRoles.join(", ")}`,
          signoff.reason
        ]
      }
    ];
    const reportWithoutPresentation: Omit<RealCertificationDossierReport, "dossierSha256" | "markdown"> = {
      dossierVersion: REAL_CERTIFICATION_DOSSIER_VERSION,
      generatedAt,
      title: "NIDUS NDIE Real Certification Dossier",
      executiveDecision: certification.decision,
      launchGateStatus: launchGate.status,
      releaseScope: launchGate.releaseScope,
      productionReadinessScore: certification.productionReadinessScore,
      mathematicsReadinessScore: certification.mathematicsReadinessScore,
      physicsReadinessScore: certification.physicsReadinessScore,
      chemistryReadinessScore: certification.chemistryReadinessScore,
      internationalCompetitivenessScore: certification.internationalCompetitivenessScore,
      inputVersions,
      evidenceSummary,
      decisionReasons,
      engineReadiness: readiness.engineReadiness,
      engineActions: readiness.engineActions,
      signoff,
      sections,
      blockers: certification.blockers,
      stages: certification.stages,
      subjects: certification.subjects,
      features: certification.features,
      slotChecklist: readiness.slotPlans,
      orderedActions: readiness.orderedActions
    };
    const dossierSha256 = dossierFingerprint(reportWithoutPresentation);
    return {
      ...reportWithoutPresentation,
      dossierSha256,
      markdown: buildMarkdown({
        generatedAt,
        decision: certification.decision,
        releaseScope: launchGate.releaseScope,
        dossierSha256,
        inputVersions,
        sections
      })
    };
  }
};
