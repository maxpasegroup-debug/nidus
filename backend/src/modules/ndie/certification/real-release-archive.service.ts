import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  type RealReleasePackArtifactFile,
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
  releaseScope: string;
  launchGateStatus: string;
  executiveDecision: string;
  packageSha256: string;
  manifestSha256: string;
  files: RealReleaseArchiveFile[];
  verified: boolean;
  archiveUsableForProductionCertification: boolean;
  recommendation: string;
};

export const REAL_RELEASE_ARCHIVE_VERSION = "real-release-archive-v1";

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
  if (resolved === configuredRoot || isInside(configuredRoot, resolved) || resolved === tempRoot || isInside(tempRoot, resolved)) {
    return resolved;
  }
  throw new Error("Archive root must be inside the configured NDIE release archive directory or the system temp directory.");
}

function manifestContent(pack: RealReleasePackReport) {
  return serialize({
    archiveManifestVersion: REAL_RELEASE_ARCHIVE_VERSION,
    packVersion: pack.packVersion,
    generatedAt: pack.generatedAt,
    releaseScope: pack.releaseScope,
    launchGateStatus: pack.launchGateStatus,
    executiveDecision: pack.executiveDecision,
    packageSha256: pack.packageSha256,
    manifestSha256: pack.manifestSha256,
    artifacts: pack.artifacts
  });
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

export const realReleaseArchiveService = {
  version: REAL_RELEASE_ARCHIVE_VERSION,
  defaultArchiveRoot,

  plan(options: { archiveRoot?: string; now?: Date } = {}): RealReleaseArchiveReport {
    const root = assertSafeArchiveRoot(options.archiveRoot ?? defaultArchiveRoot);
    const archiveId = archiveIdFromDate(options.now ?? new Date());
    return this.create({ archiveRoot: root, archiveId, write: false });
  },

  write(options: { archiveRoot?: string; archiveId?: string; now?: Date } = {}): RealReleaseArchiveReport {
    const root = assertSafeArchiveRoot(options.archiveRoot ?? defaultArchiveRoot);
    const archiveId = options.archiveId ?? archiveIdFromDate(options.now ?? new Date());
    return this.create({ archiveRoot: root, archiveId, write: true });
  },

  create(input: { archiveRoot: string; archiveId: string; write: boolean }): RealReleaseArchiveReport {
    const bundle = realReleasePackService.bundle();
    const archiveDirectory = path.join(input.archiveRoot, input.archiveId);
    if (!isInside(input.archiveRoot, archiveDirectory)) {
      throw new Error("Archive directory escapes the configured archive root.");
    }
    const manifest = manifestContent(bundle.pack);
    const files = [
      ...bundle.files,
      {
        name: "release-pack-manifest.json",
        kind: "JSON" as const,
        sha256: sha256(manifest),
        bytes: Buffer.byteLength(manifest, "utf8"),
        certificationRole: "Archive manifest with package metadata and artifact checksums.",
        content: manifest
      }
    ];

    if (input.write) {
      fs.mkdirSync(archiveDirectory, { recursive: true });
      for (const file of files) {
        const filePath = path.join(archiveDirectory, file.name);
        if (!isInside(archiveDirectory, filePath)) {
          throw new Error(`Unsafe archive file path for ${file.name}.`);
        }
        fs.writeFileSync(filePath, file.content, "utf8");
      }
    }

    const archiveFiles = files.map((file) => archiveFile(file, archiveDirectory, input.write));
    const verified = input.write
      ? archiveFiles.every((file) => fs.existsSync(file.path) && sha256(fs.readFileSync(file.path)) === file.sha256)
      : archiveFiles.every((file) => file.sha256.length === 64 && file.bytes > 0);

    return {
      archiveVersion: REAL_RELEASE_ARCHIVE_VERSION,
      generatedAt: new Date().toISOString(),
      mode: input.write ? "WRITE" : "DRY_RUN",
      archiveId: input.archiveId,
      archiveRoot: input.archiveRoot,
      archiveDirectory,
      releaseScope: bundle.pack.releaseScope,
      launchGateStatus: bundle.pack.launchGateStatus,
      executiveDecision: bundle.pack.executiveDecision,
      packageSha256: bundle.pack.packageSha256,
      manifestSha256: bundle.pack.manifestSha256,
      files: archiveFiles,
      verified,
      archiveUsableForProductionCertification: bundle.pack.launchGateStatus === "PASS" && input.write && verified,
      recommendation: bundle.pack.launchGateStatus === "PASS"
        ? "Archive verified. Preserve this directory as immutable production certification evidence."
        : "Archive verified as a failed pre-launch dossier only. Do not present it as production certification evidence."
    };
  }
};
