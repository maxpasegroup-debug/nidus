import {
  type RealCertificationBlocker,
  type RealCertificationFeatureSummary,
  type RealCertificationStageSummary,
  type RealCertificationSubjectSummary,
  realCertificationReportService
} from "./real-certification-report.service.js";
import {
  type RealEvidenceReadinessAction,
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
  chemistryReadinessScore: number;
  internationalCompetitivenessScore: number;
  sections: RealCertificationDossierSection[];
  blockers: RealCertificationBlocker[];
  stages: RealCertificationStageSummary[];
  subjects: RealCertificationSubjectSummary[];
  features: RealCertificationFeatureSummary[];
  slotChecklist: RealEvidenceReadinessSlotPlan[];
  orderedActions: RealEvidenceReadinessAction[];
  markdown: string;
};

export const REAL_CERTIFICATION_DOSSIER_VERSION = "real-certification-dossier-v1";

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
  sections: RealCertificationDossierSection[];
}) {
  return [
    "# NIDUS NDIE Real Certification Dossier",
    "",
    `Generated: ${input.generatedAt}`,
    `Executive decision: ${input.decision}`,
    `Release scope: ${input.releaseScope}`,
    "",
    ...input.sections.map(markdownSection)
  ].join("\n\n");
}

export const realCertificationDossierService = {
  version: REAL_CERTIFICATION_DOSSIER_VERSION,

  run(): RealCertificationDossierReport {
    const certification = realCertificationReportService.run();
    const launchGate = realLaunchGateService.run();
    const readiness = realEvidenceReadinessService.run();
    const generatedAt = new Date().toISOString();
    const sections: RealCertificationDossierSection[] = [
      {
        title: "Executive Summary",
        status: launchGate.status,
        lines: [
          `Launch gate: ${launchGate.status}`,
          `Release scope: ${launchGate.releaseScope}`,
          scoreLine("Production readiness", certification.productionReadinessScore),
          scoreLine("Mathematics readiness", certification.mathematicsReadinessScore),
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
        status: readiness.orderedActions.length ? "FAIL" : "PASS",
        lines: actionLines(readiness.orderedActions)
      }
    ];

    return {
      dossierVersion: REAL_CERTIFICATION_DOSSIER_VERSION,
      generatedAt,
      title: "NIDUS NDIE Real Certification Dossier",
      executiveDecision: certification.decision,
      launchGateStatus: launchGate.status,
      releaseScope: launchGate.releaseScope,
      productionReadinessScore: certification.productionReadinessScore,
      mathematicsReadinessScore: certification.mathematicsReadinessScore,
      chemistryReadinessScore: certification.chemistryReadinessScore,
      internationalCompetitivenessScore: certification.internationalCompetitivenessScore,
      sections,
      blockers: certification.blockers,
      stages: certification.stages,
      subjects: certification.subjects,
      features: certification.features,
      slotChecklist: readiness.slotPlans,
      orderedActions: readiness.orderedActions,
      markdown: buildMarkdown({
        generatedAt,
        decision: certification.decision,
        releaseScope: launchGate.releaseScope,
        sections
      })
    };
  }
};
