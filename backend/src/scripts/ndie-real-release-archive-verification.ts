import { realReleaseArchiveService } from "../modules/ndie/certification/real-release-archive.service.js";

const write = process.argv.includes("--write");
const report = write ? realReleaseArchiveService.write() : realReleaseArchiveService.plan();

const hasManifest = report.files.some((file) => file.name === "release-pack-manifest.json");
const hasDossierMarkdown = report.files.some((file) => file.name === "real-certification-dossier.md");
const hashesValid = report.files.every((file) => file.sha256.length === 64 && file.bytes > 0);
const writeModeMatchesFiles = report.files.every((file) => file.written === write);
const noFalseProductionArchive = report.launchGateStatus === "FAIL"
  ? report.archiveUsableForProductionCertification === false
  : true;

const checks = [
  ["archive verified", report.verified],
  ["manifest present", hasManifest],
  ["dossier markdown present", hasDossierMarkdown],
  ["hashes valid", hashesValid],
  ["write mode matches files", writeModeMatchesFiles],
  ["no false production archive", noFalseProductionArchive]
] as const;

const failures = checks.filter(([, passed]) => !passed).map(([name]) => name);

const output = {
  status: failures.length ? "FAIL" : "PASS",
  phase: "phase-11-real-release-archive",
  mode: report.mode,
  archiveId: report.archiveId,
  archiveDirectory: report.archiveDirectory,
  releaseScope: report.releaseScope,
  launchGateStatus: report.launchGateStatus,
  executiveDecision: report.executiveDecision,
  packageSha256: report.packageSha256,
  manifestSha256: report.manifestSha256,
  files: report.files.map((file) => ({
    name: file.name,
    sha256: file.sha256,
    bytes: file.bytes,
    written: file.written
  })),
  archiveUsableForProductionCertification: report.archiveUsableForProductionCertification,
  recommendation: report.recommendation
};

if (failures.length) {
  console.error(JSON.stringify({ ...output, failures }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify(output, null, 2));
