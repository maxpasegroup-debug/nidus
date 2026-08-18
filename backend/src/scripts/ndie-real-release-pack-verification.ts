import { realReleasePackService } from "../modules/ndie/certification/real-release-pack.service.js";

const bundle = realReleasePackService.bundle();
const pack = bundle.pack;
const verification = realReleasePackService.verify(pack);
const bundleVerification = realReleasePackService.verifyBundle(bundle);

const noFalseCertification = pack.launchGateStatus === "FAIL"
  ? pack.releaseScope !== "INTERNATIONAL_CERTIFIED" && !pack.immutableArchiveRequired
  : pack.executiveDecision === "GO";
const scoreBounds = [
  pack.productionReadinessScore,
  pack.mathematicsReadinessScore,
  pack.physicsReadinessScore,
  pack.chemistryReadinessScore,
  pack.internationalCompetitivenessScore
].every((score) => score >= 0 && score <= 100);
const uniqueArtifactChecksums = new Set(pack.artifacts.map((artifact) => artifact.sha256)).size === pack.artifacts.length;
const hasMarkdownArtifact = pack.artifacts.some((artifact) => artifact.name.endsWith(".md") && artifact.kind === "MARKDOWN");

const checks = [
  ["pack integrity", verification.valid],
  ["artifact payload integrity", bundleVerification.valid],
  ["no false certification", noFalseCertification],
  ["score bounds", scoreBounds],
  ["unique artifact checksums", uniqueArtifactChecksums],
  ["markdown artifact", hasMarkdownArtifact]
] as const;

const failures = checks.filter(([, passed]) => !passed).map(([name]) => name);

const output = {
  status: failures.length ? "FAIL" : "PASS",
  phase: "phase-10-real-release-pack",
  releaseScope: pack.releaseScope,
  launchGateStatus: pack.launchGateStatus,
  executiveDecision: pack.executiveDecision,
  scores: {
    productionReadiness: pack.productionReadinessScore,
    mathematicsReadiness: pack.mathematicsReadinessScore,
    physicsReadiness: pack.physicsReadinessScore,
    chemistryReadiness: pack.chemistryReadinessScore,
    internationalCompetitiveness: pack.internationalCompetitivenessScore
  },
  artifactCount: pack.artifactCount,
  artifacts: pack.artifacts.map((artifact) => ({
    name: artifact.name,
    kind: artifact.kind,
    sha256: artifact.sha256,
    bytes: artifact.bytes
  })),
  manifestSha256: pack.manifestSha256,
  packageSha256: pack.packageSha256,
  dossierSha256: pack.dossierSha256,
  snapshotId: pack.snapshotId,
  certificationState: pack.certificationState,
  evidenceReadinessPercent: pack.evidenceReadinessPercent,
  inputVersions: pack.inputVersions,
  immutableArchiveRequired: pack.immutableArchiveRequired,
  recommendation: pack.recommendation
};

if (failures.length) {
  console.error(JSON.stringify({ ...output, failures, missingArtifacts: verification.missingArtifacts }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify(output, null, 2));
