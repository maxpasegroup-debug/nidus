import {
  REAL_FILE_BASELINE_STAGES,
  REAL_FILE_BASELINE_SLOTS,
  type RealFileBaselineStage,
  type RealFileBaselineSubject,
  type RealFileDocumentBaselineReport,
  realFileBaselineService
} from "./real-file-baseline.service.js";
import { realFileIntakeService } from "./real-file-intake.service.js";

export type RealCertificationRiskPriority = "P0" | "P1" | "P2" | "P3";
export type RealCertificationDecision = "GO" | "NO_GO";

export type RealCertificationStageSummary = {
  stage: RealFileBaselineStage;
  pass: number;
  fail: number;
  blocked: number;
  notRun: number;
  averageScore: number;
  status: "CERTIFIED" | "BLOCKED" | "INCOMPLETE";
};

export type RealCertificationSubjectSummary = {
  subject: RealFileBaselineSubject;
  requiredDocuments: number;
  filesPresent: number;
  fullPipelinesExecuted: number;
  averageScore: number;
  readiness: "CERTIFIED" | "BLOCKED" | "INCOMPLETE";
  blockers: string[];
};

export type RealCertificationFeatureSummary = {
  feature: string;
  requiredDocuments: number;
  certifiedDocuments: number;
  readiness: "CERTIFIED" | "UNPROVEN";
  missingProof: string[];
};

export type RealCertificationBlocker = {
  priority: RealCertificationRiskPriority;
  area: string;
  message: string;
  affectedSlots: string[];
  action: string;
};

export type RealCertificationReport = {
  reportVersion: string;
  generatedAt: string;
  decision: RealCertificationDecision;
  productionReadinessScore: number;
  mathematicsReadinessScore: number;
  chemistryReadinessScore: number;
  internationalCompetitivenessScore: number;
  baseline: {
    requiredDocuments: number;
    filesPresent: number;
    fullPipelinesExecuted: number;
    certificationStatus: string;
  };
  intake: {
    filesScanned: number;
    readyForSlot: number;
    duplicates: number;
    unsupported: number;
    needsManualReview: number;
  };
  stages: RealCertificationStageSummary[];
  subjects: RealCertificationSubjectSummary[];
  features: RealCertificationFeatureSummary[];
  blockers: RealCertificationBlocker[];
  launchRecommendation: string;
};

export const REAL_CERTIFICATION_REPORT_VERSION = "real-certification-report-v1";

function round(value: number) {
  return Math.round(value * 100) / 100;
}

function average(values: number[]) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function stageSummary(documents: RealFileDocumentBaselineReport[]): RealCertificationStageSummary[] {
  return REAL_FILE_BASELINE_STAGES.map((stage) => {
    const rows = documents.map((document) => document.stageResults.find((result) => result.stage === stage)).filter(Boolean);
    const pass = rows.filter((row) => row?.status === "PASS").length;
    const fail = rows.filter((row) => row?.status === "FAIL").length;
    const blocked = rows.filter((row) => row?.status === "BLOCKED").length;
    const notRun = rows.filter((row) => row?.status === "NOT_RUN").length;
    return {
      stage,
      pass,
      fail,
      blocked,
      notRun,
      averageScore: round(average(rows.map((row) => Number(row?.score ?? 0))) * 100),
      status: pass === documents.length ? "CERTIFIED" : blocked || fail ? "BLOCKED" : "INCOMPLETE"
    };
  });
}

function subjectSummary(documents: RealFileDocumentBaselineReport[]): RealCertificationSubjectSummary[] {
  const subjects = Array.from(new Set(REAL_FILE_BASELINE_SLOTS.map((slot) => slot.subject))).sort() as RealFileBaselineSubject[];
  return subjects.map((subject) => {
    const rows = documents.filter((document) => document.subject === subject);
    const missing = rows.filter((document) => !document.evidence.exists).map((document) => document.slotId);
    const incomplete = rows.filter((document) => document.evidence.exists && !document.fullPipelineExecuted).map((document) => document.slotId);
    const fullPipelinesExecuted = rows.filter((document) => document.fullPipelineExecuted).length;
    return {
      subject,
      requiredDocuments: rows.length,
      filesPresent: rows.filter((document) => document.evidence.exists).length,
      fullPipelinesExecuted,
      averageScore: round(average(rows.map((document) => document.overallScore))),
      readiness: fullPipelinesExecuted === rows.length ? "CERTIFIED" : missing.length ? "BLOCKED" : "INCOMPLETE",
      blockers: [
        ...missing.map((slotId) => `${slotId}: real source file missing`),
        ...incomplete.map((slotId) => `${slotId}: full pipeline evidence missing`)
      ]
    };
  });
}

const featureMap = [
  ["Mathematical formulas", "formulas"],
  ["Chemistry structures", "chemistryStructures"],
  ["Diagrams", "diagrams"],
  ["Graphs", "graphs"],
  ["Tables", "tables"],
  ["Scanned papers", "scanned"],
  ["Mobile camera papers", "mobilePhoto"],
  ["DOCX Office Math", "docxOfficeMath"],
  ["Answer keys", "answerKey"],
  ["Solutions", "solutions"]
] as const;

function featureSummary(documents: RealFileDocumentBaselineReport[]): RealCertificationFeatureSummary[] {
  return featureMap.map(([label, key]) => {
    const requiredSlots = REAL_FILE_BASELINE_SLOTS.filter((slot) => slot.mustProve[key]);
    const requiredDocuments = requiredSlots.length;
    const certifiedDocuments = requiredSlots.filter((slot) => documents.find((document) => document.slotId === slot.id)?.productionCertified).length;
    return {
      feature: label,
      requiredDocuments,
      certifiedDocuments,
      readiness: requiredDocuments > 0 && certifiedDocuments === requiredDocuments ? "CERTIFIED" : "UNPROVEN",
      missingProof: requiredSlots
        .filter((slot) => !documents.find((document) => document.slotId === slot.id)?.productionCertified)
        .map((slot) => slot.id)
    };
  });
}

function blockers(documents: RealFileDocumentBaselineReport[]): RealCertificationBlocker[] {
  const missingFiles = documents.filter((document) => !document.evidence.exists);
  const missingEvidence = documents.filter((document) => document.evidence.exists && !document.fullPipelineExecuted);
  const failedStages = documents.filter((document) => document.stageResults.some((stage) => stage.status === "FAIL"));
  return [
    missingFiles.length ? {
      priority: "P0" as const,
      area: "Real source files",
      message: `${missingFiles.length} required real exam file(s) are missing.`,
      affectedSlots: missingFiles.map((document) => document.slotId),
      action: "Place real papers into the required real-exam-files slot folders or run the intake scanner first."
    } : null,
    missingEvidence.length ? {
      priority: "P0" as const,
      area: "Pipeline evidence",
      message: `${missingEvidence.length} file(s) exist but do not have complete upload-to-CBT evidence.`,
      affectedSlots: missingEvidence.map((document) => document.slotId),
      action: "Process each file through NDIE, then export evidence with ndie:evidence:export."
    } : null,
    failedStages.length ? {
      priority: "P1" as const,
      area: "Failed stage evidence",
      message: `${failedStages.length} document(s) have at least one failed certification stage.`,
      affectedSlots: failedStages.map((document) => document.slotId),
      action: "Open each evidence manifest and fix the failed stage before rerunning certification."
    } : null
  ].filter(Boolean) as RealCertificationBlocker[];
}

function subjectScore(subjects: RealCertificationSubjectSummary[], subject: RealFileBaselineSubject) {
  return subjects.find((row) => row.subject === subject)?.averageScore ?? 0;
}

export const realCertificationReportService = {
  version: REAL_CERTIFICATION_REPORT_VERSION,

  run(): RealCertificationReport {
    const baseline = realFileBaselineService.run();
    const intake = realFileIntakeService.scan();
    const stages = stageSummary(baseline.documentReports);
    const subjects = subjectSummary(baseline.documentReports);
    const features = featureSummary(baseline.documentReports);
    const foundBlockers = blockers(baseline.documentReports);
    const productionReadinessScore = baseline.overallScore;
    const mathematicsReadinessScore = subjectScore(subjects, "Mathematics");
    const chemistryReadinessScore = subjectScore(subjects, "Chemistry");
    const internationalCompetitivenessScore = round(average([
      productionReadinessScore,
      mathematicsReadinessScore,
      chemistryReadinessScore,
      average(features.map((feature) => feature.readiness === "CERTIFIED" ? 100 : 0))
    ]));
    const decision: RealCertificationDecision = foundBlockers.some((blocker) => blocker.priority === "P0") || productionReadinessScore < 95 ? "NO_GO" : "GO";

    return {
      reportVersion: REAL_CERTIFICATION_REPORT_VERSION,
      generatedAt: new Date().toISOString(),
      decision,
      productionReadinessScore,
      mathematicsReadinessScore,
      chemistryReadinessScore,
      internationalCompetitivenessScore,
      baseline: {
        requiredDocuments: baseline.requiredDocuments,
        filesPresent: baseline.filesPresent,
        fullPipelinesExecuted: baseline.fullPipelinesExecuted,
        certificationStatus: baseline.productionCertificationStatus
      },
      intake: {
        filesScanned: intake.filesScanned,
        readyForSlot: intake.readyForSlot,
        duplicates: intake.duplicates,
        unsupported: intake.unsupported,
        needsManualReview: intake.needsManualReview
      },
      stages,
      subjects,
      features,
      blockers: foundBlockers,
      launchRecommendation: decision === "GO"
        ? "Real-file certification is complete. Production launch may proceed for the certified scope."
        : "Do not launch as internationally certified until P0 blockers are cleared and the full real-file pipeline evidence reaches at least 95%."
    };
  }
};
