import {
  type RealCertificationBlocker,
  type RealCertificationReport,
  realCertificationReportService
} from "./real-certification-report.service.js";
import { chemistryStructureService } from "../chemistry-structure/chemistry-structure.service.js";
import { educationalVisualSemanticsService } from "../educational-visual-semantics/educational-visual-semantics.service.js";
import { formulaPerfectionService } from "../formula-perfection/formula-perfection.service.js";
import { ndiePageUnderstandingService } from "../page-understanding/page-understanding.service.js";
import { stemQuestionIntegrityService } from "../stem-question-integrity/stem-question-integrity.service.js";

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

export type RealLaunchGateEngineReadiness = {
  id: string;
  label: string;
  version: string;
  status: "READY" | "NOT_READY";
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
  physicsReadinessScore: number;
  chemistryReadinessScore: number;
  internationalCompetitivenessScore: number;
  engineReadiness: RealLaunchGateEngineReadiness[];
  checks: RealLaunchGateCheck[];
  blockers: RealCertificationBlocker[];
  releaseScope: "INTERNATIONAL_CERTIFIED" | "INTERNAL_TESTING_ONLY" | "PRODUCTION_BLOCKED";
  recommendation: string;
};

export const REAL_LAUNCH_GATE_VERSION = "real-launch-gate-v2";

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

function engineReadiness(): RealLaunchGateEngineReadiness[] {
  const engines = [
    ["page-understanding", "Page Understanding", ndiePageUnderstandingService.health()],
    ["formula-perfection", "Formula Perfection", formulaPerfectionService.health()],
    ["chemistry-structure", "Chemistry Structure", chemistryStructureService.health()],
    ["educational-visual-semantics", "Educational Visual Semantics", educationalVisualSemanticsService.health()],
    ["stem-question-integrity", "STEM Question Integrity", stemQuestionIntegrityService.health()]
  ] as const;
  return engines.map(([id, label, health]) => ({
    id,
    label,
    version: String("version" in health ? health.version : health.providerVersion),
    status: health.status === "ready" ? "READY" : "NOT_READY"
  }));
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
    const engines = engineReadiness();
    const allEnginesReady = engines.every((engine) => engine.status === "READY");
    const realEvidenceComplete = report.baseline.filesPresent === report.baseline.requiredDocuments && report.baseline.fullPipelinesExecuted === report.baseline.requiredDocuments;

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
        id: "physics-readiness-score",
        label: "Physics readiness score",
        condition: report.physicsReadinessScore >= MINIMUM_CERTIFICATION_SCORE,
        pass: `Physics readiness is at least ${MINIMUM_CERTIFICATION_SCORE}%.`,
        fail: `Physics readiness is ${report.physicsReadinessScore}%, below launch threshold.`,
        remediation: "Certify JEE, NEET and graph-heavy Physics slots with real evidence for equations, units, circuits, diagrams and answer mapping."
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
        id: "phase-intelligence-readiness",
        label: "Phase 2-6 intelligence readiness",
        condition: allEnginesReady,
        pass: "Page, formula, chemistry, visual and question-integrity engines report ready.",
        fail: "One or more Phase 2-6 intelligence engines are not ready.",
        remediation: "Restore every required intelligence service to ready status and rerun its focused verification suite."
      }),
      check({
        id: "real-evidence-completeness",
        label: "Real-document evidence completeness",
        condition: realEvidenceComplete,
        pass: "Every required real document has complete upload-to-CBT evidence.",
        fail: `${report.baseline.filesPresent}/${report.baseline.requiredDocuments} real files are present and ${report.baseline.fullPipelinesExecuted}/${report.baseline.requiredDocuments} full pipelines are evidenced.`,
        remediation: "Add every required real paper and export complete, checksum-bound pipeline evidence for each slot."
      }),
      check({
        id: "international-competitiveness-score",
        label: "International competitiveness score",
        condition: report.internationalCompetitivenessScore >= MINIMUM_CERTIFICATION_SCORE,
        pass: `International competitiveness is at least ${MINIMUM_CERTIFICATION_SCORE}%.`,
        fail: `International competitiveness is ${report.internationalCompetitivenessScore}%, below launch threshold.`,
        remediation: "Close all subject and feature-proof gaps before claiming international certification."
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
      physicsReadinessScore: report.physicsReadinessScore,
      chemistryReadinessScore: report.chemistryReadinessScore,
      internationalCompetitivenessScore: report.internationalCompetitivenessScore,
      engineReadiness: engines,
      checks,
      blockers: report.blockers,
      releaseScope,
      recommendation: failed
        ? "Do not launch as production-certified. Continue collecting real exam files, run them end to end, export evidence and rerun this gate."
        : "Real launch gate passed. Production launch may proceed for the certified scope."
    };
  }
};
