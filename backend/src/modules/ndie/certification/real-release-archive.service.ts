import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  type RealReleasePackArtifactFile,
  type RealReleasePackBundle,
  type RealReleasePackReport,
  realReleasePackService
} from "./real-release-pack.service.js";

export type RealReleaseArchiveMode = "DRY_RUN" | "WRITE";

export type RealReleaseArchiveFile = {
  name: string;
  path: string;
  sha256: string;
  bytes: number;
  written: boolean;
};

export type RealReleaseArchiveReport = {
  archiveVersion: string;
  generatedAt: string;
  mode: RealReleaseArchiveMode;
  archiveId: string;
  archiveRoot: string;
  archiveDirectory: string;
  snapshotId: string;
  releaseScope: string;
  launchGateStatus: string;
  executiveDecision: string;
  certificationState: RealReleasePackReport["certificationState"];
  signoffStatus: RealReleasePackReport["signoffStatus"];
  packageSha256: string;
  manifestSha256: string;
  archiveManifestSha256: string;
  sealSha256: string;
  files: RealReleaseArchiveFile[];
  bundleVerified: boolean;
  verified: boolean;
  sealPlanned: boolean;
  sealed: boolean;
  overwriteProtected: boolean;
  archiveUsableForProductionCertification: boolean;
  recommendation: string;
};

export const REAL_RELEASE_ARCHIVE_VERSION = "real-release-archive-v2";

const backendRoot = process.cwd().endsWith("backend") ? process.cwd() : path.join(process.cwd(), "backend");
const defaultArchiveRoot = path.join(backendRoot, "src", "modules", "ndie", "certification", "real-release-archives");

function serialize(value: unknown) {
  return JSON.stringify(value, null, 2);
}

function sha256(content: string | Buffer) {
  return crypto.createHash("sha256").update(content).digest("hex");
}

function archiveIdFromDate(date: Date) {
  return date.toISOString().replace(/[:.]/g, "-");
}

function isInside(parent: string, child: string) {
  const relative = path.relative(parent, child);
  return Boolean(relative) && !relative.startsWith("..") && !path.isAbsolute(relative);
}

function assertSafeArchiveRoot(root: string) {
  const resolved = path.resolve(root);
  const tempRoot = path.resolve(os.tmpdir());
  const configuredRoot = path.resolve(defaultArchiveRoot);
  if (resolved === configuredRoot || isInside(configuredRoot, resolved) || resolved === tempRoot || isInside(tempRoot, resolved)) return resolved;
  throw new Error("Archive root must be inside the configured NDIE release archive directory or the system temp directory.");
}

function assertSafeArchiveId(archiveId: string) {
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(archiveId) || archiveId === "." || archiveId === "..") {
    throw new Error("Archive ID must be a safe identifier containing only letters, numbers, dots, underscores or hyphens.");
  }
  return archiveId;
}

function manifestContent(pack: RealReleasePackReport) {
  return serialize({
    archiveManifestVersion: REAL_RELEASE_ARCHIVE_VERSION,
    packVersion: pack.packVersion,
    canonicalizationVersion: pack.canonicalizationVersion,
    hashAlgorithm: pack.hashAlgorithm,
    snapshotId: pack.snapshotId,
    generatedAt: pack.generatedAt,
    releaseScope: pack.releaseScope,
    launchGateStatus: pack.launchGateStatus,
    executiveDecision: pack.executiveDecision,
    certificationState: pack.certificationState,
    signoffStatus: pack.signoffStatus,
    evidenceReadinessPercent: pack.evidenceReadinessPercent,
    dossierSha256: pack.dossierSha256,
    packageSha256: pack.packageSha256,
    manifestSha256: pack.manifestSha256,
    inputVersions: pack.inputVersions,
    artifacts: pack.artifacts
  });
}

function archiveSealContent(input: {
  archiveId: string;
  generatedAt: string;
  pack: RealReleasePackReport;
  files: RealReleasePackArtifactFile[];
}) {
  return serialize({
    sealVersion: REAL_RELEASE_ARCHIVE_VERSION,
    archiveId: input.archiveId,
    generatedAt: input.generatedAt,
    snapshotId: input.pack.snapshotId,
    packageSha256: input.pack.packageSha256,
    manifestSha256: input.pack.manifestSha256,
    releaseScope: input.pack.releaseScope,
    certificationState: input.pack.certificationState,
    files: input.files.map((file) => ({ name: file.name, sha256: file.sha256, bytes: file.bytes }))
  });
}

function generatedFile(name: string, content: string, role: string): RealReleasePackArtifactFile {
  return {
    name,
    kind: "JSON",
    sha256: sha256(content),
    bytes: Buffer.byteLength(content, "utf8"),
    certificationRole: role,
    content
  };
}

function archiveFile(file: RealReleasePackArtifactFile, archiveDirectory: string, written: boolean): RealReleaseArchiveFile {
  return {
    name: file.name,
    path: path.join(archiveDirectory, file.name),
    sha256: file.sha256,
    bytes: file.bytes,
    written
  };
}

function filesMatchPayload(files: RealReleasePackArtifactFile[]) {
  return files.every((file) => file.sha256 === sha256(file.content) && file.bytes === Buffer.byteLength(file.content, "utf8"));
}

function writeAtomically(input: {
  archiveRoot: string;
  archiveDirectory: string;
  archiveId: string;
  files: RealReleasePackArtifactFile[];
}) {
  if (fs.existsSync(input.archiveDirectory)) throw new Error(`Archive ${input.archiveId} already exists and cannot be overwritten.`);
  fs.mkdirSync(input.archiveRoot, { recursive: true });
  const stagingDirectory = path.join(input.archiveRoot, `.${input.archiveId}.staging-${crypto.randomUUID()}`);
  if (!isInside(input.archiveRoot, stagingDirectory)) throw new Error("Archive staging directory escapes the archive root.");
  try {
    fs.mkdirSync(stagingDirectory, { recursive: false });
    for (const file of input.files) {
      const filePath = path.join(stagingDirectory, file.name);
      if (!isInside(stagingDirectory, filePath)) throw new Error(`Unsafe archive file path for ${file.name}.`);
      fs.writeFileSync(filePath, file.content, { encoding: "utf8", flag: "wx" });
    }
    const stagedFilesValid = input.files.every((file) => {
      const stagedPath = path.join(stagingDirectory, file.name);
      return fs.existsSync(stagedPath) && sha256(fs.readFileSync(stagedPath)) === file.sha256 && fs.statSync(stagedPath).size === file.bytes;
    });
    if (!stagedFilesValid) throw new Error("Archive staging verification failed.");
    fs.renameSync(stagingDirectory, input.archiveDirectory);
  } catch (error) {
    if (fs.existsSync(stagingDirectory)) fs.rmSync(stagingDirectory, { recursive: true, force: true });
    throw error;
  }
}

function archiveFilesValid(files: RealReleaseArchiveFile[]) {
  return files.every((file) => fs.existsSync(file.path) && sha256(fs.readFileSync(file.path)) === file.sha256 && fs.statSync(file.path).size === file.bytes);
}

export const realReleaseArchiveService = {
  version: REAL_RELEASE_ARCHIVE_VERSION,
  defaultArchiveRoot,

  plan(options: { archiveRoot?: string; now?: Date } = {}): RealReleaseArchiveReport {
    const root = assertSafeArchiveRoot(options.archiveRoot ?? defaultArchiveRoot);
    return this.planBundle(realReleasePackService.bundle(), { archiveRoot: root, now: options.now });
  },

  write(options: { archiveRoot?: string; archiveId?: string; now?: Date } = {}): RealReleaseArchiveReport {
    const root = assertSafeArchiveRoot(options.archiveRoot ?? defaultArchiveRoot);
    return this.writeBundle(realReleasePackService.bundle(), { archiveRoot: root, archiveId: options.archiveId, now: options.now });
  },

  planBundle(bundle: RealReleasePackBundle, options: { archiveRoot?: string; now?: Date } = {}): RealReleaseArchiveReport {
    const root = assertSafeArchiveRoot(options.archiveRoot ?? defaultArchiveRoot);
    return this.createFromBundle(bundle, { archiveRoot: root, archiveId: archiveIdFromDate(options.now ?? new Date()), write: false });
  },

  writeBundle(bundle: RealReleasePackBundle, options: { archiveRoot?: string; archiveId?: string; now?: Date } = {}): RealReleaseArchiveReport {
    const root = assertSafeArchiveRoot(options.archiveRoot ?? defaultArchiveRoot);
    return this.createFromBundle(bundle, {
      archiveRoot: root,
      archiveId: options.archiveId ?? archiveIdFromDate(options.now ?? new Date()),
      write: true
    });
  },

  verifyWrittenArchive(report: RealReleaseArchiveReport) {
    if (report.mode !== "WRITE" || !report.sealed || !report.files.every((file) => file.written)) return false;
    if (!archiveFilesValid(report.files)) return false;
    const seal = report.files.find((file) => file.name === "archive-seal.json");
    const manifest = report.files.find((file) => file.name === "release-pack-manifest.json");
    return Boolean(seal && manifest && seal.sha256 === report.sealSha256 && manifest.sha256 === report.archiveManifestSha256);
  },

  create(input: { archiveRoot: string; archiveId: string; write: boolean }): RealReleaseArchiveReport {
    return this.createFromBundle(realReleasePackService.bundle(), input);
  },

  createFromBundle(bundle: RealReleasePackBundle, input: { archiveRoot: string; archiveId: string; write: boolean }): RealReleaseArchiveReport {
    const archiveId = assertSafeArchiveId(input.archiveId);
    const bundleVerification = realReleasePackService.verifyBundle(bundle);
    if (!bundleVerification.valid) throw new Error("Release pack bundle failed cryptographic verification and cannot be archived.");
    const archiveDirectory = path.join(input.archiveRoot, archiveId);
    if (!isInside(input.archiveRoot, archiveDirectory)) throw new Error("Archive directory escapes the configured archive root.");

    const generatedAt = new Date().toISOString();
    const manifest = generatedFile(
      "release-pack-manifest.json",
      manifestContent(bundle.pack),
      "Archive manifest with package provenance and artifact checksums."
    );
    const unsealedFiles = [...bundle.files, manifest];
    const seal = generatedFile(
      "archive-seal.json",
      archiveSealContent({ archiveId, generatedAt, pack: bundle.pack, files: unsealedFiles }),
      "Checksum-bound archive seal covering every archived certification artifact."
    );
    const files = [...unsealedFiles, seal];
    if (!filesMatchPayload(files)) throw new Error("Archive payload integrity validation failed.");
    if (input.write) writeAtomically({ archiveRoot: input.archiveRoot, archiveDirectory, archiveId, files });

    const archiveFiles = files.map((file) => archiveFile(file, archiveDirectory, input.write));
    const verified = input.write ? archiveFilesValid(archiveFiles) : filesMatchPayload(files);
    const sealPlanned = archiveFiles.some((file) => file.name === "archive-seal.json");
    const sealed = input.write && verified && sealPlanned;
    const productionReady = bundle.pack.launchGateStatus === "PASS" &&
      bundle.pack.certificationState === "READY_FOR_IMMUTABLE_ARCHIVE" &&
      bundle.pack.signoffStatus === "READY_FOR_SIGNATURE";

    return {
      archiveVersion: REAL_RELEASE_ARCHIVE_VERSION,
      generatedAt,
      mode: input.write ? "WRITE" : "DRY_RUN",
      archiveId,
      archiveRoot: input.archiveRoot,
      archiveDirectory,
      snapshotId: bundle.pack.snapshotId,
      releaseScope: bundle.pack.releaseScope,
      launchGateStatus: bundle.pack.launchGateStatus,
      executiveDecision: bundle.pack.executiveDecision,
      certificationState: bundle.pack.certificationState,
      signoffStatus: bundle.pack.signoffStatus,
      packageSha256: bundle.pack.packageSha256,
      manifestSha256: bundle.pack.manifestSha256,
      archiveManifestSha256: manifest.sha256,
      sealSha256: seal.sha256,
      files: archiveFiles,
      bundleVerified: bundleVerification.valid,
      verified,
      sealPlanned,
      sealed,
      overwriteProtected: true,
      archiveUsableForProductionCertification: productionReady && input.write && verified && sealed,
      recommendation: productionReady
        ? "Archive verified and sealed. Preserve this directory as immutable production certification evidence."
        : "Archive verified as a failed pre-launch dossier only. Do not present it as production certification evidence."
    };
  }
};
