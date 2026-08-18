import {
  REAL_FILE_BASELINE_SLOTS,
  REAL_FILE_BASELINE_STAGES,
  realFileBaselineService
} from "../modules/ndie/certification/real-file-baseline.service.js";

const requiredSlots = [
  "nda-maths-pdf",
  "jee-maths-pdf",
  "jee-physics-pdf",
  "neet-physics-pdf",
  "neet-chemistry-pdf",
  "university-maths-paper",
  "university-chemistry-paper",
  "scanned-chemistry-paper",
  "mobile-camera-maths-paper",
  "handwritten-stem-paper",
  "docx-office-math",
  "answer-key-pdf",
  "solution-book-pdf",
  "organic-chemistry-structure-paper",
  "graph-heavy-physics-math-paper",
  "table-heavy-chemistry-paper",
  "olympiad-maths-paper"
];

const report = realFileBaselineService.run();

const requiredSlotCoverage = requiredSlots.every((slotId) => REAL_FILE_BASELINE_SLOTS.some((slot) => slot.id === slotId));
const stageCoverage = report.documentReports.every((document) => (
  REAL_FILE_BASELINE_STAGES.every((stage) => document.stageResults.some((result) => result.stage === stage))
));
const noFalseCertification = report.documentReports.every((document) => (
  document.productionCertified === (document.fullPipelineExecuted && document.overallScore >= 95)
));
const missingFilesAreReported = report.filesPresent === report.requiredDocuments ||
  report.missingFixturePaths.length === report.requiredDocuments - report.filesPresent;
const realEvidenceIsRequired = report.productionCertificationStatus === "NOT_CERTIFIED" ||
  report.fullPipelinesExecuted === report.requiredDocuments;
const sha256WhenPresent = report.documentReports.every((document) => (
  !document.evidence.exists || Boolean(document.evidence.sha256)
));
const blockedStagesWhenMissing = report.documentReports
  .filter((document) => !document.evidence.exists)
  .every((document) => document.stageResults.every((stage) => stage.status === "BLOCKED" && stage.score === 0));
const missingEvidenceIsTracked = report.missingEvidencePaths.length === report.documentReports
  .filter((document) => document.evidence.exists && !document.fullPipelineExecuted)
  .length;
const evidenceManifestContract = report.documentReports.every((document) => (
  Boolean(document.evidence.expectedEvidenceFile) &&
  document.evidence.expectedEvidenceFile.endsWith("evidence.json") &&
  (!document.evidence.pipelineEvidence.exists || document.evidence.pipelineEvidence.valid)
));

const stemCoverage = report.coverage.subjects.Mathematics >= 6 && report.coverage.subjects.Physics >= 3 && report.coverage.subjects.Chemistry >= 6;
const hardFeatureCoverage = report.coverage.proofAreas.formulas >= 12 &&
  report.coverage.proofAreas.chemistryStructures >= 5 &&
  report.coverage.proofAreas.physicsDiagrams >= 4 &&
  report.coverage.proofAreas.handwritten >= 1 &&
  report.coverage.proofAreas.docxOfficeMath >= 2 &&
  report.coverage.proofAreas.answerKey >= 2 &&
  report.coverage.proofAreas.solutions >= 1;

const checks = [
  ["required real-file slots", requiredSlotCoverage],
  ["upload-to-CBT stage coverage", stageCoverage],
  ["no false production certification", noFalseCertification],
  ["missing fixture paths reported", missingFilesAreReported],
  ["real evidence required for certification", realEvidenceIsRequired],
  ["sha256 generated for present files", sha256WhenPresent],
  ["missing files block all stages", blockedStagesWhenMissing],
  ["missing evidence paths tracked", missingEvidenceIsTracked],
  ["evidence manifest contract", evidenceManifestContract],
  ["STEM subject coverage", stemCoverage],
  ["hard STEM feature coverage", hardFeatureCoverage]
] as const;

const failures = checks.filter(([, passed]) => !passed).map(([name]) => name);

if (failures.length) {
  console.error(JSON.stringify({
    status: "FAIL",
    phase: "phase-1-real-file-certification-baseline",
    failures,
    summary: {
      requiredDocuments: report.requiredDocuments,
      filesPresent: report.filesPresent,
      fullPipelinesExecuted: report.fullPipelinesExecuted,
      productionCertificationStatus: report.productionCertificationStatus
    }
  }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({
  status: "PASS",
  phase: "phase-1-real-file-certification-baseline",
  certificationStatus: report.productionCertificationStatus,
  requiredDocuments: report.requiredDocuments,
  filesPresent: report.filesPresent,
  fullPipelinesExecuted: report.fullPipelinesExecuted,
  overallScore: report.overallScore,
  missingFixturePaths: report.missingFixturePaths,
  missingEvidencePaths: report.missingEvidencePaths,
  coverage: report.coverage,
  documentSummary: report.documentReports.map((document) => ({
    slotId: document.slotId,
    title: document.title,
    sourcePresent: document.evidence.exists,
    overallScore: document.overallScore,
    fullPipelineExecuted: document.fullPipelineExecuted,
    productionCertified: document.productionCertified
  }))
}, null, 2));
