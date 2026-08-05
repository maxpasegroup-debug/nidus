import {
  type RealCertificationBlocker,
  type RealCertificationReport,
  realCertificationReportService
} from "./real-certification-report.service.js";

export type RealLaunchGateStatus = "PASS" | "FAIL";
export type RealLaunchGateSeverity = "BLOCKER" | "WARNING";
export type RealLaunchGateMode = "ADVISORY" | "ENFORCED";

export type RealLaunchGateCheck = {
  id: string;
  label: string;
  status: RealLaunchGateStatus;
  severity: RealLaunchGateSeverity;
  message: string;
  remediation: string;
};

export type RealLaunchGateReport = {
  gateVersion: string;
  generatedAt: string;
  mode: RealLaunchGateMode;
  status: RealLaunchGateStatus;
  failed: boolean;
  exitCode: number;
  certificationDecision: RealCertificationReport["decision"];
  productionReadinessScore: number;
  mathematicsReadinessScore: number;
  chemistryReadinessScore: number;
  internationalCompetitivenessScore: number;
  checks: RealLaunchGateCheck[];
  blockers: RealCertificationBlocker[];
  releaseScope: "INTERNATIONAL_CERTIFIED" | "INTERNAL_TESTING_ONLY" | "PRODUCTION_BLOCKED";
  recommendation: string;
};

export const REAL_LAUNCH_GATE_VERSION = "real-launch-gate-v1";

const MINIMUM_CERTIFICATION_SCORE = 95;

function status(condition: boolean): RealLaunchGateStatus {
  return condition ? "PASS" : "FAIL";
}

function check(input: {
  id: string;
  label: string;
  condition: boolean;
  severity?: RealLaunchGateSeverity;
  pass: string;
  fail: string;
  remediation: string;
}): RealLaunchGateCheck {
  return {
    id: input.id,
    label: input.label,
    status: status(input.condition),
    severity: input.severity ?? "BLOCKER",
    message: input.condition ? input.pass : input.fail,
    remediation: input.remediation
  };
}

function hasCriticalBlockers(report: RealCertificationReport) {
  return report.blockers.some((blocker) => blocker.priority === "P0" || blocker.priority === "P1");
}

export const realLaunchGateService = {
  version: REAL_LAUNCH_GATE_VERSION,
  minimumCertificationScore: MINIMUM_CERTIFICATION_SCORE,

  run(options: { enforce?: boolean } = {}): RealLaunchGateReport {
    const mode: RealLaunchGateMode = options.enforce ? "ENFORCED" : "ADVISORY";
    const report = realCertificationReportService.run();
    const stageCertified = report.stages.every((stage) => stage.status === "CERTIFIED");
    const subjectCertified = report.subjects.every((subject) => subject.readiness === "CERTIFIED");
    const featureCertified = report.features.every((feature) => feature.readiness === "CERTIFIED");
    const noCriticalBlockers = !hasCriticalBlockers(report);

    const checks: RealLaunchGateCheck[] = [
      check({
        id: "real-certification-go",
        label: "Executive certification decision",
        condition: report.decision === "GO",
        pass: "The real-file certification report allows production launch.",
        fail: "The real-file certification report is NO-GO.",
        remediation: "Clear all P0 blockers and rerun the real certification report."
      }),
      check({
        id: "production-readiness-score",
        label: "Production readiness score",
        condition: report.productionReadinessScore >= MINIMUM_CERTIFICATION_SCORE,
        pass: `Production readiness is at least ${MINIMUM_CERTIFICATION_SCORE}%.`,
        fail: `Production readiness is ${report.productionReadinessScore}%, below the ${MINIMUM_CERTIFICATION_SCORE}% launch threshold.`,
        remediation: "Run real exam files through upload, review, publish and CBT render until every required slot has passing evidence."
      }),
      check({
        id: "mathematics-readiness-score",
        label: "Mathematics readiness score",
        condition: report.mathematicsReadinessScore >= MINIMUM_CERTIFICATION_SCORE,
        pass: `Mathematics readiness is at least ${MINIMUM_CERTIFICATION_SCORE}%.`,
        fail: `Mathematics readiness is ${report.mathematicsReadinessScore}%, below launch threshold.`,
        remediation: "Certify the NDA/JEE/mobile/DOCX Mathematics slots with real evidence for formulas, graphs and rendered CBT output."
      }),
      check({
        id: "chemistry-readiness-score",
        label: "Chemistry readiness score",
        condition: report.chemistryReadinessScore >= MINIMUM_CERTIFICATION_SCORE,
        pass: `Chemistry readiness is at least ${MINIMUM_CERTIFICATION_SCORE}%.`,
        fail: `Chemistry readiness is ${report.chemistryReadinessScore}%, below launch threshold.`,
        remediation: "Certify NEET, scanned and organic Chemistry slots with real evidence for structures, subscripts, charges and answer mapping."
      }),
      check({
        id: "pipeline-stage-certification",
        label: "Upload-to-CBT stage certification",
        condition: stageCertified,
        pass: "Every required upload-to-CBT pipeline stage is certified.",
        fail: "One or more upload-to-CBT stages are not certified.",
        remediation: "Export complete evidence for UPLOAD, RENDER, OCR, LAYOUT, FORMULA, VISUAL, AI_RECONSTRUCTION, TEACHER_REVIEW, PUBLISH and CBT_RENDER."
      }),
      check({
        id: "subject-certification",
        label: "Subject certification",
        condition: subjectCertified,
        pass: "Mathematics, Physics and Chemistry are certified.",
        fail: "One or more STEM subjects are blocked or incomplete.",
        remediation: "Complete real-file certification for each required subject slot."
      }),
      check({
        id: "feature-proof-certification",
        label: "STEM feature proof",
        condition: featureCertified,
        pass: "All mandatory STEM proof areas are certified.",
        fail: "One or more STEM proof areas are unproven.",
        remediation: "Provide real-file evidence for formulas, chemistry structures, diagrams, graphs, tables, answer keys and solutions."
      }),
      check({
        id: "critical-blocker-clearance",
        label: "Critical blocker clearance",
        condition: noCriticalBlockers,
        pass: "No P0/P1 blockers remain.",
        fail: "P0 or P1 blockers remain.",
        remediation: "Resolve blocker actions from the real certification report before production launch."
      })
    ];

    const failed = checks.some((row) => row.status === "FAIL" && row.severity === "BLOCKER");
    const releaseScope = !failed
      ? "INTERNATIONAL_CERTIFIED"
      : report.baseline.filesPresent > 0
        ? "INTERNAL_TESTING_ONLY"
        : "PRODUCTION_BLOCKED";

    return {
      gateVersion: REAL_LAUNCH_GATE_VERSION,
      generatedAt: new Date().toISOString(),
      mode,
      status: failed ? "FAIL" : "PASS",
      failed,
      exitCode: mode === "ENFORCED" && failed ? 1 : 0,
      certificationDecision: report.decision,
      productionReadinessScore: report.productionReadinessScore,
      mathematicsReadinessScore: report.mathematicsReadinessScore,
      chemistryReadinessScore: report.chemistryReadinessScore,
      internationalCompetitivenessScore: report.internationalCompetitivenessScore,
      checks,
      blockers: report.blockers,
      releaseScope,
      recommendation: failed
        ? "Do not launch as production-certified. Continue collecting real exam files, run them end to end, export evidence and rerun this gate."
        : "Real launch gate passed. Production launch may proceed for the certified scope."
    };
  }
};
