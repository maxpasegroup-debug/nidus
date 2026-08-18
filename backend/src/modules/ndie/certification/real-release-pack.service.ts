import crypto from "node:crypto";
import { realCertificationDossierService } from "./real-certification-dossier.service.js";
import { realCertificationReportService } from "./real-certification-report.service.js";
import { realEvidenceReadinessService } from "./real-evidence-readiness.service.js";
import { realFileBaselineService } from "./real-file-baseline.service.js";
import { realLaunchGateService } from "./real-launch-gate.service.js";

type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };

export type RealReleasePackArtifact = {
  name: string;
  kind: "JSON" | "MARKDOWN";
  sha256: string;
  bytes: number;
  certificationRole: string;
};

export type RealReleasePackArtifactFile = RealReleasePackArtifact & {
  content: string;
};

export type RealReleasePackReport = {
  packVersion: string;
  canonicalizationVersion: string;
  hashAlgorithm: "SHA-256";
  generatedAt: string;
  snapshotId: string;
  releaseScope: string;
  launchGateStatus: string;
  executiveDecision: string;
  productionReadinessScore: number;
  mathematicsReadinessScore: number;
  physicsReadinessScore: number;
  chemistryReadinessScore: number;
  internationalCompetitivenessScore: number;
  evidenceReadinessPercent: number;
  dossierSha256: string;
  signoffStatus: "BLOCKED" | "READY_FOR_SIGNATURE";
  certificationState: "PRELAUNCH_FAILED" | "READY_FOR_IMMUTABLE_ARCHIVE";
  inputVersions: {
    baseline: string;
    certificationReport: string;
    launchGate: string;
    evidenceReadiness: string;
    dossier: string;
  };
  artifactCount: number;
  artifacts: RealReleasePackArtifact[];
  manifestSha256: string;
  packageSha256: string;
  immutableArchiveRequired: boolean;
  verificationCommand: string;
  recommendation: string;
};

export type RealReleasePackBundle = {
  pack: RealReleasePackReport;
  files: RealReleasePackArtifactFile[];
};

export const REAL_RELEASE_PACK_VERSION = "real-release-pack-v3";
const REAL_RELEASE_PACK_CANONICALIZATION_VERSION = "canonical-json-v1";

function canonicalize(value: unknown): JsonValue {
  if (value === null || typeof value === "boolean" || typeof value === "number" || typeof value === "string") {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map(canonicalize);
  }
  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, item]) => [key, canonicalize(item)])
    );
  }
  return String(value);
}

function serialize(value: unknown) {
  return JSON.stringify(canonicalize(value), null, 2);
}

function sha256(content: string) {
  return crypto.createHash("sha256").update(content).digest("hex");
}

function artifactFile(input: {
  name: string;
  kind?: RealReleasePackArtifact["kind"];
  content: string;
  certificationRole: string;
}): RealReleasePackArtifactFile {
  return {
    name: input.name,
    kind: input.kind ?? "JSON",
    sha256: sha256(input.content),
    bytes: Buffer.byteLength(input.content, "utf8"),
    certificationRole: input.certificationRole,
    content: input.content
  };
}

function artifactMetadata(file: RealReleasePackArtifactFile): RealReleasePackArtifact {
  return {
    name: file.name,
    kind: file.kind,
    sha256: file.sha256,
    bytes: file.bytes,
    certificationRole: file.certificationRole
  };
}

function manifestPayload(pack: Pick<RealReleasePackReport, "packVersion" | "generatedAt" | "artifacts">) {
  return {
    packVersion: pack.packVersion,
    generatedAt: pack.generatedAt,
    artifacts: pack.artifacts
  };
}

function packagePayload(pack: Omit<RealReleasePackReport, "manifestSha256" | "packageSha256" | "verificationCommand" | "recommendation">) {
  return {
    manifestSha256: sha256(serialize(manifestPayload(pack))),
    packVersion: pack.packVersion,
    canonicalizationVersion: pack.canonicalizationVersion,
    hashAlgorithm: pack.hashAlgorithm,
    generatedAt: pack.generatedAt,
    snapshotId: pack.snapshotId,
    releaseScope: pack.releaseScope,
    launchGateStatus: pack.launchGateStatus,
    executiveDecision: pack.executiveDecision,
    certificationState: pack.certificationState,
    immutableArchiveRequired: pack.immutableArchiveRequired,
    evidenceReadinessPercent: pack.evidenceReadinessPercent,
    dossierSha256: pack.dossierSha256,
    signoffStatus: pack.signoffStatus,
    inputVersions: pack.inputVersions,
    artifacts: pack.artifacts
  };
}

function safeArtifactName(name: string) {
  return /^[a-z0-9][a-z0-9.-]*$/.test(name) && !name.includes("..");
}

export const realReleasePackService = {
  version: REAL_RELEASE_PACK_VERSION,

  bundle(): RealReleasePackBundle {
    const baseline = realFileBaselineService.run();
    const certificationReport = realCertificationReportService.run();
    const launchGate = realLaunchGateService.run();
    const readiness = realEvidenceReadinessService.run();
    const dossier = realCertificationDossierService.run();
    const files = [
      artifactFile({
        name: "real-file-baseline.json",
        content: serialize(baseline),
        certificationRole: "Required real paper slots, source hashes and upload-to-CBT evidence status."
      }),
      artifactFile({
        name: "real-certification-report.json",
        content: serialize(certificationReport),
        certificationRole: "Executive GO/NO-GO scores, blockers, subjects, stages and STEM proof areas."
      }),
      artifactFile({
        name: "real-launch-gate.json",
        content: serialize(launchGate),
        certificationRole: "Release control decision for advisory and enforced launch checks."
      }),
      artifactFile({
        name: "real-evidence-readiness.json",
        content: serialize(readiness),
        certificationRole: "Ordered action plan for missing source files and missing stage evidence."
      }),
      artifactFile({
        name: "real-certification-dossier.json",
        content: serialize(dossier),
        certificationRole: "Audit-ready structured management and QA certification dossier."
      }),
      artifactFile({
        name: "real-certification-dossier.md",
        kind: "MARKDOWN",
        content: dossier.markdown,
        certificationRole: "Human-readable certification dossier for launch review meetings."
      })
    ];
    const artifacts = files.map(artifactMetadata);
    const generatedAt = new Date().toISOString();
    const snapshotId = `ndie-release-${generatedAt.replace(/[:.]/g, "-")}`;
    const immutableArchiveRequired = launchGate.status === "PASS";
    const packWithoutHashes = {
      packVersion: REAL_RELEASE_PACK_VERSION,
      canonicalizationVersion: REAL_RELEASE_PACK_CANONICALIZATION_VERSION,
      hashAlgorithm: "SHA-256" as const,
      generatedAt,
      snapshotId,
      releaseScope: launchGate.releaseScope,
      launchGateStatus: launchGate.status,
      executiveDecision: certificationReport.decision,
      productionReadinessScore: certificationReport.productionReadinessScore,
      mathematicsReadinessScore: certificationReport.mathematicsReadinessScore,
      physicsReadinessScore: certificationReport.physicsReadinessScore,
      chemistryReadinessScore: certificationReport.chemistryReadinessScore,
      internationalCompetitivenessScore: certificationReport.internationalCompetitivenessScore,
      evidenceReadinessPercent: readiness.summary.readinessPercent,
      dossierSha256: dossier.dossierSha256,
      signoffStatus: dossier.signoff.status,
      certificationState: immutableArchiveRequired ? "READY_FOR_IMMUTABLE_ARCHIVE" as const : "PRELAUNCH_FAILED" as const,
      inputVersions: {
        baseline: baseline.certificationVersion,
        certificationReport: certificationReport.reportVersion,
        launchGate: launchGate.gateVersion,
        evidenceReadiness: readiness.reportVersion,
        dossier: dossier.dossierVersion
      },
      artifactCount: artifacts.length,
      artifacts,
      immutableArchiveRequired
    };
    const manifestSha256 = sha256(serialize(manifestPayload(packWithoutHashes)));
    const packageSha256 = sha256(serialize(packagePayload(packWithoutHashes)));

    return {
      pack: {
        ...packWithoutHashes,
        manifestSha256,
        packageSha256,
        verificationCommand: "npm run test:ndie-real-release-pack --workspace backend",
        recommendation: launchGate.status === "PASS"
          ? "Archive this release pack before production launch and rerun the enforced launch gate."
          : "Archive as a failed pre-launch dossier only. Do not use this pack as production certification evidence."
      },
      files
    };
  },

  run(): RealReleasePackReport {
    return this.bundle().pack;
  },

  verify(pack: RealReleasePackReport) {
    const artifactNames = new Set(pack.artifacts.map((item) => item.name));
    const requiredArtifacts = [
      "real-file-baseline.json",
      "real-certification-report.json",
      "real-launch-gate.json",
      "real-evidence-readiness.json",
      "real-certification-dossier.json",
      "real-certification-dossier.md"
    ];
    const duplicateArtifacts = pack.artifacts
      .map((artifact) => artifact.name)
      .filter((name, index, names) => names.indexOf(name) !== index);
    const expectedManifestSha256 = sha256(serialize(manifestPayload(pack)));
    const {
      manifestSha256: _manifestSha256,
      packageSha256: _packageSha256,
      verificationCommand: _verificationCommand,
      recommendation: _recommendation,
      ...packWithoutHashes
    } = pack;
    const expectedPackageSha256 = sha256(serialize(packagePayload(packWithoutHashes)));
    const releaseStateConsistent = pack.launchGateStatus === "PASS"
      ? pack.executiveDecision === "GO" && pack.releaseScope === "INTERNATIONAL_CERTIFIED" &&
        pack.immutableArchiveRequired && pack.certificationState === "READY_FOR_IMMUTABLE_ARCHIVE" &&
        pack.signoffStatus === "READY_FOR_SIGNATURE"
      : pack.executiveDecision !== "GO" && pack.releaseScope !== "INTERNATIONAL_CERTIFIED" &&
        !pack.immutableArchiveRequired && pack.certificationState === "PRELAUNCH_FAILED" &&
        pack.signoffStatus === "BLOCKED";
    const checks = {
      version: pack.packVersion === REAL_RELEASE_PACK_VERSION,
      canonicalization: pack.canonicalizationVersion === REAL_RELEASE_PACK_CANONICALIZATION_VERSION,
      hashAlgorithm: pack.hashAlgorithm === "SHA-256",
      artifactCount: pack.artifactCount === pack.artifacts.length,
      requiredArtifacts: requiredArtifacts.every((name) => artifactNames.has(name)),
      artifactMetadata: pack.artifacts.every((item) => /^[a-f0-9]{64}$/.test(item.sha256) && item.bytes > 0 && item.certificationRole.length > 0),
      artifactNames: duplicateArtifacts.length === 0 && pack.artifacts.every((item) => safeArtifactName(item.name)),
      manifestChecksum: pack.manifestSha256 === expectedManifestSha256,
      packageChecksum: pack.packageSha256 === expectedPackageSha256,
      dossierChecksum: /^[a-f0-9]{64}$/.test(pack.dossierSha256),
      releaseState: releaseStateConsistent
    };
    return {
      valid: Object.values(checks).every(Boolean),
      checks,
      requiredArtifacts,
      missingArtifacts: requiredArtifacts.filter((name) => !artifactNames.has(name)),
      duplicateArtifacts,
      expectedManifestSha256,
      expectedPackageSha256
    };
  },

  verifyBundle(bundle: RealReleasePackBundle) {
    const packVerification = this.verify(bundle.pack);
    const metadata = new Map(bundle.pack.artifacts.map((artifact) => [artifact.name, artifact]));
    const duplicateFiles = bundle.files
      .map((file) => file.name)
      .filter((name, index, names) => names.indexOf(name) !== index);
    const fileChecks = bundle.files.map((file) => {
      const expected = metadata.get(file.name);
      const actualSha256 = sha256(file.content);
      const actualBytes = Buffer.byteLength(file.content, "utf8");
      return {
        name: file.name,
        valid: Boolean(expected) && file.sha256 === actualSha256 && expected?.sha256 === actualSha256 &&
          file.bytes === actualBytes && expected?.bytes === actualBytes && expected?.kind === file.kind
      };
    });
    return {
      valid: packVerification.valid && duplicateFiles.length === 0 &&
        bundle.files.length === bundle.pack.artifactCount && fileChecks.every((file) => file.valid),
      packVerification,
      duplicateFiles,
      fileChecks
    };
  }
};
