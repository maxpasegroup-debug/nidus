import path from "node:path";
import { type RealCertificationDossierReport, realCertificationDossierService } from "./real-certification-dossier.service.js";
import type { RealCertificationReport } from "./real-certification-report.service.js";
import type { RealEvidenceReadinessReport } from "./real-evidence-readiness.service.js";
import { realFileBaselineService } from "./real-file-baseline.service.js";
import { realFileIntakeService } from "./real-file-intake.service.js";
import type { RealLaunchGateReport } from "./real-launch-gate.service.js";
import { realReleaseArchiveService } from "./real-release-archive.service.js";
import { realReleasePackService } from "./real-release-pack.service.js";

export type RealCertificationSuiteStepStatus = "PASS" | "FAIL" | "INFO";
export type RealCertificationSuiteMode = "ASSESSMENT" | "RELEASE";
export type RealCertificationSuiteState = "BLOCKED" | "READY_TO_ARCHIVE" | "CERTIFIED_FOR_LAUNCH";

export type RealCertificationSuiteStep = {
  id: string;
  label: string;
  status: RealCertificationSuiteStepStatus;
  blocking: boolean;
  command: string;
  summary: string;
};

export type RealCertificationSuiteReport = {
  suiteVersion: string;
  suiteRunId: string;
  generatedAt: string;
  mode: RealCertificationSuiteMode;
  state: RealCertificationSuiteState;
  status: "PASS" | "FAIL";
  releaseScope: string;
  launchGateStatus: string;
  executiveDecision: string;
  productionReadinessScore: number;
  mathematicsReadinessScore: number;
  physicsReadinessScore: number;
  chemistryReadinessScore: number;
  internationalCompetitivenessScore: number;
  evidenceReadinessPercent: number;
  snapshotId: string;
  packageSha256: string;
  dossierSha256: string;
  inputVersions: Record<string, string>;
  integrity: {
    dossierVerified: boolean;
    releasePackVerified: boolean;
    archiveBundleVerified: boolean;
    archiveVerified: boolean;
    archiveSealed: boolean;
    snapshotConsistent: boolean;
  };
  archive: {
    mode: string;
    archiveId: string;
    directory: string;
    sealSha256: string;
    usableForProductionCertification: boolean;
  };
  steps: RealCertificationSuiteStep[];
  failedSteps: string[];
  blockingFailures: Array<{ id: string; label: string; summary: string; command: string }>;
  commandSequence: string[];
  nextRequiredAction: string | null;
  nextRequiredCommand: string | null;
  readyToWriteProductionArchive: boolean;
  safeToBeginProductionLaunch: boolean;
  recommendation: string;
};

export type RealCertificationSuiteOptions = {
  writeArchive?: boolean;
  archiveRoot?: string;
  archiveId?: string;
};

export const REAL_CERTIFICATION_SUITE_VERSION = "real-certification-suite-v3";

function step(input: RealCertificationSuiteStep): RealCertificationSuiteStep {
  return input;
}

function artifactJson<T>(bundle: ReturnType<typeof realReleasePackService.bundle>, name: string): T {
  const artifact = bundle.files.find((file) => file.name === name);
  if (!artifact) throw new Error(`Release bundle is missing ${name}.`);
  return JSON.parse(artifact.content) as T;
}

export const realCertificationSuiteService = {
  version: REAL_CERTIFICATION_SUITE_VERSION,

  run(options: RealCertificationSuiteOptions = {}): RealCertificationSuiteReport {
    const generatedAt = new Date().toISOString();
    const mode: RealCertificationSuiteMode = options.writeArchive ? "RELEASE" : "ASSESSMENT";
    const intake = realFileIntakeService.scan();
    const releaseBundle = realReleasePackService.bundle();
    const releasePack = releaseBundle.pack;
    const baseline = artifactJson<ReturnType<typeof realFileBaselineService.run>>(releaseBundle, "real-file-baseline.json");
    const report = artifactJson<RealCertificationReport>(releaseBundle, "real-certification-report.json");
    const launchGate = artifactJson<RealLaunchGateReport>(releaseBundle, "real-launch-gate.json");
    const readiness = artifactJson<RealEvidenceReadinessReport>(releaseBundle, "real-evidence-readiness.json");
    const dossier = artifactJson<RealCertificationDossierReport>(releaseBundle, "real-certification-dossier.json");
    const dossierVerified = realCertificationDossierService.verify(dossier);
    const releasePackVerification = realReleasePackService.verifyBundle(releaseBundle);
    const snapshotConsistent = dossier.dossierSha256 === releasePack.dossierSha256 &&
      baseline.certificationVersion === releasePack.inputVersions.baseline &&
      report.reportVersion === releasePack.inputVersions.certificationReport &&
      launchGate.gateVersion === releasePack.inputVersions.launchGate &&
      readiness.reportVersion === releasePack.inputVersions.evidenceReadiness &&
      dossier.dossierVersion === releasePack.inputVersions.dossier;
    const evidenceComplete = readiness.summary.certifiedSlots === readiness.summary.requiredSlots && readiness.summary.blockedEngines === 0;
    const readyToWriteProductionArchive = report.decision === "GO" && launchGate.status === "PASS" &&
      evidenceComplete && dossierVerified && dossier.signoff.status === "READY_FOR_SIGNATURE" &&
      releasePackVerification.valid && snapshotConsistent && releasePack.certificationState === "READY_FOR_IMMUTABLE_ARCHIVE";
    const archiveRoot = options.archiveRoot ? path.resolve(options.archiveRoot) : undefined;
    const archive = options.writeArchive && readyToWriteProductionArchive
      ? realReleaseArchiveService.writeBundle(releaseBundle, { archiveRoot, archiveId: options.archiveId })
      : realReleaseArchiveService.planBundle(releaseBundle, { archiveRoot });
    const archiveWriteVerified = archive.mode === "WRITE" && realReleaseArchiveService.verifyWrittenArchive(archive);

    const steps: RealCertificationSuiteStep[] = [
      step({
        id: "real-file-intake",
        label: "Real file intake scan",
        status: intake.unsupported > 0 ? "FAIL" : intake.filesScanned > 0 ? "PASS" : "INFO",
        blocking: intake.unsupported > 0,
        command: "npm run test:ndie-real-intake --workspace backend",
        summary: `${intake.filesScanned} intake file(s), ${intake.readyForSlot} ready, ${intake.duplicates} duplicate, ${intake.unsupported} unsupported.`
      }),
      step({
        id: "real-file-baseline",
        label: "Real file baseline",
        status: baseline.filesPresent === baseline.requiredDocuments && baseline.fullPipelinesExecuted === baseline.requiredDocuments ? "PASS" : "FAIL",
        blocking: true,
        command: "npm run test:ndie-real-file-baseline --workspace backend",
        summary: `${baseline.filesPresent}/${baseline.requiredDocuments} real file(s), ${baseline.fullPipelinesExecuted}/${baseline.requiredDocuments} complete pipeline(s).`
      }),
      step({
        id: "real-certification-report",
        label: "Executive certification report",
        status: report.decision === "GO" ? "PASS" : "FAIL",
        blocking: true,
        command: "npm run test:ndie-real-certification-report --workspace backend",
        summary: `${report.decision}, production ${report.productionReadinessScore}/100, math ${report.mathematicsReadinessScore}/100, physics ${report.physicsReadinessScore}/100, chemistry ${report.chemistryReadinessScore}/100.`
      }),
      step({
        id: "real-launch-gate",
        label: "Real launch gate",
        status: launchGate.status,
        blocking: true,
        command: "npm run test:ndie-real-launch-gate --workspace backend",
        summary: `${launchGate.status}, scope ${launchGate.releaseScope}, ${launchGate.checks.filter((check) => check.status === "FAIL").length} failed check(s).`
      }),
      step({
        id: "real-evidence-readiness",
        label: "Evidence readiness planner",
        status: evidenceComplete ? "PASS" : "FAIL",
        blocking: true,
        command: "npm run test:ndie-real-evidence-readiness --workspace backend",
        summary: `${readiness.summary.certifiedSlots}/${readiness.summary.requiredSlots} certified slot(s), ${readiness.summary.readyEngines}/${readiness.summary.requiredEngines} engine(s), ${readiness.summary.readinessPercent}% evidence.`
      }),
      step({
        id: "real-certification-dossier",
        label: "Certification dossier integrity",
        status: dossierVerified ? "PASS" : "FAIL",
        blocking: true,
        command: "npm run test:ndie-real-certification-dossier --workspace backend",
        summary: `${dossier.sections.length} section(s), checksum ${dossier.dossierSha256}, sign-off ${dossier.signoff.status}.`
      }),
      step({
        id: "real-release-pack",
        label: "Release pack integrity",
        status: releasePackVerification.valid ? "PASS" : "FAIL",
        blocking: true,
        command: "npm run test:ndie-real-release-pack --workspace backend",
        summary: `${releasePack.artifactCount} artifact(s), snapshot ${releasePack.snapshotId}, package ${releasePack.packageSha256}.`
      }),
      step({
        id: "real-release-archive",
        label: options.writeArchive ? "Immutable release archive" : "Release archive dry run",
        status: options.writeArchive
          ? readyToWriteProductionArchive && archiveWriteVerified ? "PASS" : "FAIL"
          : archive.verified && archive.bundleVerified && archive.sealPlanned ? "INFO" : "FAIL",
        blocking: Boolean(options.writeArchive),
        command: options.writeArchive
          ? "npm run test:ndie-real-release-archive --workspace backend -- --write"
          : "npm run test:ndie-real-release-archive --workspace backend",
        summary: options.writeArchive && !readyToWriteProductionArchive
          ? "Archive write blocked because certification prerequisites have not passed."
          : `${archive.files.length} file(s), ${archive.mode}, bundle verified ${archive.bundleVerified}, sealed ${archive.sealed}.`
      })
    ];

    const blockingFailures = steps
      .filter((item) => item.status === "FAIL" && item.blocking)
      .map((item) => ({ id: item.id, label: item.label, summary: item.summary, command: item.command }));
    const failedSteps = steps.filter((item) => item.status === "FAIL").map((item) => item.id);
    const safeToBeginProductionLaunch = readyToWriteProductionArchive && archiveWriteVerified &&
      archive.archiveUsableForProductionCertification && blockingFailures.length === 0;
    const state: RealCertificationSuiteState = safeToBeginProductionLaunch
      ? "CERTIFIED_FOR_LAUNCH"
      : readyToWriteProductionArchive ? "READY_TO_ARCHIVE" : "BLOCKED";
    const nextReadinessAction = readiness.engineActions[0]?.action ?? readiness.orderedActions[0]?.action ?? null;
    const nextReadinessCommand = readiness.engineActions[0]?.command ?? readiness.orderedActions[0]?.commands[0] ?? null;
    const firstFailure = blockingFailures[0];
    const nextRequiredAction = state === "READY_TO_ARCHIVE"
      ? "Write and verify the immutable release archive."
      : nextReadinessAction ?? firstFailure?.summary ?? null;
    const nextRequiredCommand = state === "READY_TO_ARCHIVE"
      ? "npm run test:ndie-real-certification-suite --workspace backend -- --write-archive"
      : nextReadinessCommand ?? firstFailure?.command ?? null;

    return {
      suiteVersion: REAL_CERTIFICATION_SUITE_VERSION,
      suiteRunId: `ndie-suite-${generatedAt.replace(/[:.]/g, "-")}`,
      generatedAt,
      mode,
      state,
      status: blockingFailures.length ? "FAIL" : "PASS",
      releaseScope: launchGate.releaseScope,
      launchGateStatus: launchGate.status,
      executiveDecision: report.decision,
      productionReadinessScore: report.productionReadinessScore,
      mathematicsReadinessScore: report.mathematicsReadinessScore,
      physicsReadinessScore: report.physicsReadinessScore,
      chemistryReadinessScore: report.chemistryReadinessScore,
      internationalCompetitivenessScore: report.internationalCompetitivenessScore,
      evidenceReadinessPercent: readiness.summary.readinessPercent,
      snapshotId: releasePack.snapshotId,
      packageSha256: releasePack.packageSha256,
      dossierSha256: dossier.dossierSha256,
      inputVersions: {
        baseline: baseline.certificationVersion,
        certificationReport: report.reportVersion,
        launchGate: launchGate.gateVersion,
        evidenceReadiness: readiness.reportVersion,
        dossier: dossier.dossierVersion,
        releasePack: releasePack.packVersion,
        releaseArchive: archive.archiveVersion
      },
      integrity: {
        dossierVerified,
        releasePackVerified: releasePackVerification.valid,
        archiveBundleVerified: archive.bundleVerified,
        archiveVerified: archive.verified,
        archiveSealed: archive.sealed,
        snapshotConsistent
      },
      archive: {
        mode: archive.mode,
        archiveId: archive.archiveId,
        directory: archive.archiveDirectory,
        sealSha256: archive.sealSha256,
        usableForProductionCertification: archive.archiveUsableForProductionCertification
      },
      steps,
      failedSteps,
      blockingFailures,
      commandSequence: steps.map((item) => item.command),
      nextRequiredAction,
      nextRequiredCommand,
      readyToWriteProductionArchive,
      safeToBeginProductionLaunch,
      recommendation: safeToBeginProductionLaunch
        ? "Certification is complete and the immutable archive is verified. Production launch may proceed under the approved release process."
        : state === "READY_TO_ARCHIVE"
          ? "All certification checks passed. Write and verify the immutable archive before production launch."
          : "Do not begin production launch. Resolve the next required action and rerun the certification suite."
    };
  }
};
