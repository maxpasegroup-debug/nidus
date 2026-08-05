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
  generatedAt: string;
  releaseScope: string;
  launchGateStatus: string;
  executiveDecision: string;
  productionReadinessScore: number;
  mathematicsReadinessScore: number;
  chemistryReadinessScore: number;
  internationalCompetitivenessScore: number;
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

export const REAL_RELEASE_PACK_VERSION = "real-release-pack-v1";

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
    const manifest = {
      packVersion: REAL_RELEASE_PACK_VERSION,
      generatedAt: new Date().toISOString(),
      artifacts
    };
    const manifestSha256 = sha256(serialize(manifest));
    const packageSha256 = sha256(serialize({
      manifestSha256,
      releaseScope: launchGate.releaseScope,
      launchGateStatus: launchGate.status,
      executiveDecision: certificationReport.decision,
      artifacts
    }));

    return {
      pack: {
        packVersion: REAL_RELEASE_PACK_VERSION,
        generatedAt: manifest.generatedAt,
        releaseScope: launchGate.releaseScope,
        launchGateStatus: launchGate.status,
        executiveDecision: certificationReport.decision,
        productionReadinessScore: certificationReport.productionReadinessScore,
        mathematicsReadinessScore: certificationReport.mathematicsReadinessScore,
        chemistryReadinessScore: certificationReport.chemistryReadinessScore,
        internationalCompetitivenessScore: certificationReport.internationalCompetitivenessScore,
        artifactCount: artifacts.length,
        artifacts,
        manifestSha256,
        packageSha256,
        immutableArchiveRequired: launchGate.status === "PASS",
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
    return {
      valid: pack.packVersion === REAL_RELEASE_PACK_VERSION &&
        pack.artifactCount === pack.artifacts.length &&
        requiredArtifacts.every((name) => artifactNames.has(name)) &&
        pack.artifacts.every((item) => item.sha256.length === 64 && item.bytes > 0) &&
        pack.manifestSha256.length === 64 &&
        pack.packageSha256.length === 64,
      requiredArtifacts,
      missingArtifacts: requiredArtifacts.filter((name) => !artifactNames.has(name))
    };
  }
};
