import { realCertificationDossierService } from "./real-certification-dossier.service.js";
import { realCertificationReportService } from "./real-certification-report.service.js";
import { realEvidenceReadinessService } from "./real-evidence-readiness.service.js";
import { realFileBaselineService } from "./real-file-baseline.service.js";
import { realFileIntakeService } from "./real-file-intake.service.js";
import { realLaunchGateService } from "./real-launch-gate.service.js";
import { realReleaseArchiveService } from "./real-release-archive.service.js";
import { realReleasePackService } from "./real-release-pack.service.js";

export type RealCertificationSuiteStepStatus = "PASS" | "FAIL" | "INFO";

export type RealCertificationSuiteStep = {
  id: string;
  label: string;
  status: RealCertificationSuiteStepStatus;
  command: string;
  summary: string;
};

export type RealCertificationSuiteReport = {
  suiteVersion: string;
  generatedAt: string;
  status: "PASS" | "FAIL";
  releaseScope: string;
  launchGateStatus: string;
  executiveDecision: string;
  productionReadinessScore: number;
  mathematicsReadinessScore: number;
  physicsReadinessScore: number;
  chemistryReadinessScore: number;
  internationalCompetitivenessScore: number;
  steps: RealCertificationSuiteStep[];
  failedSteps: string[];
  commandSequence: string[];
  nextRequiredCommand: string | null;
  safeToBeginProductionLaunch: boolean;
  recommendation: string;
};

export const REAL_CERTIFICATION_SUITE_VERSION = "real-certification-suite-v2";

function step(input: RealCertificationSuiteStep): RealCertificationSuiteStep {
  return input;
}

export const realCertificationSuiteService = {
  version: REAL_CERTIFICATION_SUITE_VERSION,

  run(): RealCertificationSuiteReport {
    const intake = realFileIntakeService.scan();
    const baseline = realFileBaselineService.run();
    const report = realCertificationReportService.run();
    const launchGate = realLaunchGateService.run();
    const readiness = realEvidenceReadinessService.run();
    const dossier = realCertificationDossierService.run();
    const releasePack = realReleasePackService.run();
    const archive = realReleaseArchiveService.plan();

    const steps: RealCertificationSuiteStep[] = [
      step({
        id: "real-file-intake",
        label: "Real file intake scan",
        status: intake.unsupported > 0 ? "FAIL" : "PASS",
        command: "npm run test:ndie-real-intake --workspace backend",
        summary: `${intake.filesScanned} intake file(s), ${intake.readyForSlot} ready for slot assignment, ${intake.unsupported} unsupported.`
      }),
      step({
        id: "real-file-baseline",
        label: "Real file baseline",
        status: baseline.filesPresent === baseline.requiredDocuments ? "PASS" : "FAIL",
        command: "npm run test:ndie-real-file-baseline --workspace backend",
        summary: `${baseline.filesPresent}/${baseline.requiredDocuments} required real file(s) present.`
      }),
      step({
        id: "real-certification-report",
        label: "Executive certification report",
        status: report.decision === "GO" ? "PASS" : "FAIL",
        command: "npm run test:ndie-real-certification-report --workspace backend",
        summary: `${report.decision}, production ${report.productionReadinessScore}/100, math ${report.mathematicsReadinessScore}/100, physics ${report.physicsReadinessScore}/100, chemistry ${report.chemistryReadinessScore}/100.`
      }),
      step({
        id: "real-launch-gate",
        label: "Real launch gate",
        status: launchGate.status,
        command: "npm run test:ndie-real-launch-gate --workspace backend",
        summary: `${launchGate.status}, release scope ${launchGate.releaseScope}, failed checks ${launchGate.checks.filter((check) => check.status === "FAIL").length}.`
      }),
      step({
        id: "real-evidence-readiness",
        label: "Evidence readiness planner",
        status: readiness.summary.certifiedSlots === readiness.summary.requiredSlots ? "PASS" : "FAIL",
        command: "npm run test:ndie-real-evidence-readiness --workspace backend",
        summary: `${readiness.summary.certifiedSlots}/${readiness.summary.requiredSlots} certified slot(s), ${readiness.orderedActions.length} ordered action(s).`
      }),
      step({
        id: "real-certification-dossier",
        label: "Certification dossier",
        status: dossier.launchGateStatus === "PASS" ? "PASS" : "FAIL",
        command: "npm run test:ndie-real-certification-dossier --workspace backend",
        summary: `${dossier.sections.length} dossier section(s), ${dossier.blockers.length} blocker(s), ${dossier.orderedActions.length} action(s).`
      }),
      step({
        id: "real-release-pack",
        label: "Release pack",
        status: releasePack.launchGateStatus === "PASS" ? "PASS" : "FAIL",
        command: "npm run test:ndie-real-release-pack --workspace backend",
        summary: `${releasePack.artifactCount} artifact(s), package ${releasePack.packageSha256}.`
      }),
      step({
        id: "real-release-archive",
        label: "Release archive dry run",
        status: archive.verified ? "PASS" : "FAIL",
        command: "npm run test:ndie-real-release-archive --workspace backend",
        summary: `${archive.files.length} archive file(s) verified in ${archive.mode} mode.`
      })
    ];
    const failedSteps = steps.filter((item) => item.status === "FAIL").map((item) => item.id);
    const safeToBeginProductionLaunch = launchGate.status === "PASS" &&
      report.decision === "GO" &&
      releasePack.immutableArchiveRequired &&
      failedSteps.length === 0;

    return {
      suiteVersion: REAL_CERTIFICATION_SUITE_VERSION,
      generatedAt: new Date().toISOString(),
      status: failedSteps.length ? "FAIL" : "PASS",
      releaseScope: launchGate.releaseScope,
      launchGateStatus: launchGate.status,
      executiveDecision: report.decision,
      productionReadinessScore: report.productionReadinessScore,
      mathematicsReadinessScore: report.mathematicsReadinessScore,
      physicsReadinessScore: report.physicsReadinessScore,
      chemistryReadinessScore: report.chemistryReadinessScore,
      internationalCompetitivenessScore: report.internationalCompetitivenessScore,
      steps,
      failedSteps,
      commandSequence: steps.map((item) => item.command),
      nextRequiredCommand: steps.find((item) => item.status === "FAIL")?.command ?? null,
      safeToBeginProductionLaunch,
      recommendation: safeToBeginProductionLaunch
        ? "All real certification suite checks passed. Run the enforced launch gate and write the immutable release archive."
        : "Do not begin production launch. Execute the next required command, resolve real-file/evidence blockers and rerun this suite."
    };
  }
};
