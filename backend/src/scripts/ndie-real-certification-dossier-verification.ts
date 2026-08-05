import { realCertificationDossierService } from "../modules/ndie/certification/real-certification-dossier.service.js";

const dossier = realCertificationDossierService.run();

const requiredSections = [
  "Executive Summary",
  "Critical Blockers",
  "Pipeline Stage Evidence",
  "Subject Readiness",
  "STEM Feature Proof",
  "Real File Slot Checklist",
  "Ordered Next Actions"
];

const hasRequiredSections = requiredSections.every((title) => dossier.sections.some((section) => section.title === title));
const markdownHasRequiredSections = requiredSections.every((title) => dossier.markdown.includes(`## ${title}`));
const hasScores = [
  dossier.productionReadinessScore,
  dossier.mathematicsReadinessScore,
  dossier.chemistryReadinessScore,
  dossier.internationalCompetitivenessScore
].every((score) => score >= 0 && score <= 100);
const noFalseGo = dossier.launchGateStatus === "FAIL" || dossier.executiveDecision === "GO";
const actionConsistency = dossier.orderedActions.length === dossier.slotChecklist.filter((slot) => slot.status !== "CERTIFIED").length;
const markdownIsReadable = dossier.markdown.includes("# NIDUS NDIE Real Certification Dossier") &&
  dossier.markdown.includes("Executive decision:") &&
  dossier.markdown.includes("Release scope:");

const checks = [
  ["required sections", hasRequiredSections],
  ["markdown required sections", markdownHasRequiredSections],
  ["scores bounded", hasScores],
  ["no false GO", noFalseGo],
  ["action consistency", actionConsistency],
  ["markdown readable", markdownIsReadable]
] as const;

const failures = checks.filter(([, passed]) => !passed).map(([name]) => name);

const output = {
  status: failures.length ? "FAIL" : "PASS",
  phase: "phase-9-real-certification-dossier",
  executiveDecision: dossier.executiveDecision,
  launchGateStatus: dossier.launchGateStatus,
  releaseScope: dossier.releaseScope,
  scores: {
    productionReadiness: dossier.productionReadinessScore,
    mathematicsReadiness: dossier.mathematicsReadinessScore,
    chemistryReadiness: dossier.chemistryReadinessScore,
    internationalCompetitiveness: dossier.internationalCompetitivenessScore
  },
  sections: dossier.sections.map((section) => ({ title: section.title, status: section.status })),
  blockers: dossier.blockers.length,
  orderedActions: dossier.orderedActions.length,
  markdownPreview: dossier.markdown.split("\n").slice(0, 16).join("\n")
};

if (failures.length) {
  console.error(JSON.stringify({ ...output, failures }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify(output, null, 2));
