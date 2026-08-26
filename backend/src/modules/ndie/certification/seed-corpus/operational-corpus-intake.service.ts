import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import {
  operationalCorpusManifestSchema,
  type OperationalCorpusManifest,
  type OperationalSourceFormat
} from "./operational-contracts.js";

export const OPERATIONAL_CORPUS_INTAKE_VERSION = "nuee-operational-intake-1.0.0" as const;
const backendRoot = process.cwd().endsWith("backend") ? process.cwd() : path.join(process.cwd(), "backend");
export const OPERATIONAL_CORPUS_ROOT = path.join(backendRoot, "src", "modules", "ndie", "certification", "seed-corpus", "real-documents");

export type OperationalIntakeMetadata = {
  documentId: string;
  originalFilename?: string;
  subject: OperationalCorpusManifest["subject"];
  examType: string;
  educationLevel: string;
  institutionOrBoard?: string | null;
  countryOrRegion?: string | null;
  documentType: OperationalCorpusManifest["documentType"];
  pageCount?: number | null;
  partition: OperationalCorpusManifest["partition"];
  evidenceClass: OperationalCorpusManifest["evidenceClass"];
  rightsBasis?: OperationalCorpusManifest["source"]["rightsBasis"];
  rightsVerifiedBy?: string | null;
  rightsVerifiedAt?: string | null;
  anonymizationStatus?: OperationalCorpusManifest["source"]["anonymizationStatus"];
  piiReported?: boolean;
  provenance: OperationalCorpusManifest["source"]["provenance"];
};

export class OperationalCorpusIntakeError extends Error {
  constructor(readonly code: "UNSUPPORTED_FORMAT" | "FORMAT_MISMATCH" | "DUPLICATE_CHECKSUM" | "DUPLICATE_DOCUMENT_ID" | "INVALID_MANIFEST" | "SOURCE_MISSING", message: string) {
    super(message);
    this.name = "OperationalCorpusIntakeError";
  }
}

function sha256(buffer: Buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

function extension(filename: string) {
  return path.extname(filename).slice(1).toUpperCase();
}

function detectSourceFormat(buffer: Buffer): OperationalSourceFormat | null {
  if (buffer.subarray(0, 4).toString("utf8") === "%PDF") return "PDF";
  if (buffer.subarray(0, 8).equals(Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]))) return "DOC";
  if (buffer[0] === 0x50 && buffer[1] === 0x4b) return "DOCX";
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return "JPEG";
  if (buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "PNG";
  if (buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP") return "WEBP";
  if (buffer.subarray(0, 4).equals(Buffer.from([0x49, 0x49, 0x2a, 0x00])) || buffer.subarray(0, 4).equals(Buffer.from([0x4d, 0x4d, 0x00, 0x2a]))) return "TIFF";
  if (buffer.subarray(4, 8).toString("ascii") === "ftyp" && /heic|heix|hevc|mif1/.test(buffer.subarray(8, 16).toString("ascii"))) return "HEIC";
  if (!buffer.subarray(0, Math.min(buffer.length, 4096)).includes(0)) return "TXT";
  return null;
}

function formatsMatch(detected: OperationalSourceFormat, fileExtension: string) {
  if (detected === "JPEG") return ["JPG", "JPEG"].includes(fileExtension);
  return detected === fileExtension;
}

function listManifestPaths(root: string): string[] {
  if (!fs.existsSync(root)) return [];
  return fs.readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const current = path.join(root, entry.name);
    if (entry.isDirectory()) return listManifestPaths(current);
    return entry.isFile() && entry.name === "manifest.json" ? [current] : [];
  });
}

export function readOperationalManifests(root: string) {
  return listManifestPaths(root).map((manifestPath) => {
    try {
      const raw = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
      const parsed = operationalCorpusManifestSchema.safeParse(raw);
      return { manifestPath, manifest: parsed.success ? parsed.data : null, problems: parsed.success ? [] : parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`) };
    } catch (error) {
      return { manifestPath, manifest: null, problems: [error instanceof Error ? error.message : "Manifest could not be read."] };
    }
  });
}

function writeAtomicJson(filePath: string, value: unknown) {
  const temporary = `${filePath}.${crypto.randomUUID()}.tmp`;
  fs.writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`, { encoding: "utf8", flag: "wx" });
  fs.renameSync(temporary, filePath);
}

function safeSegment(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "");
}

function buildManifest(input: { buffer: Buffer; originalFilename: string; sourceFormat: OperationalSourceFormat; metadata: OperationalIntakeMetadata; sourceRelativePath: string }): OperationalCorpusManifest {
  const now = new Date().toISOString();
  return operationalCorpusManifestSchema.parse({
    schemaVersion: "nuee-operational-manifest-1.0.0",
    documentId: input.metadata.documentId,
    originalFilename: input.originalFilename,
    subject: input.metadata.subject,
    examType: input.metadata.examType,
    educationLevel: input.metadata.educationLevel,
    institutionOrBoard: input.metadata.institutionOrBoard ?? null,
    countryOrRegion: input.metadata.countryOrRegion ?? null,
    documentType: input.metadata.documentType,
    sourceFormat: input.sourceFormat,
    pageCount: input.metadata.pageCount ?? null,
    fileSizeBytes: input.buffer.length,
    ingestedAt: now,
    partition: input.metadata.partition,
    evidenceClass: input.metadata.evidenceClass,
    source: {
      relativePath: input.sourceRelativePath,
      sha256: sha256(input.buffer),
      rightsBasis: input.metadata.rightsBasis ?? "RIGHTS_BASIS_PENDING",
      rightsVerifiedBy: input.metadata.rightsVerifiedBy ?? null,
      rightsVerifiedAt: input.metadata.rightsVerifiedAt ?? null,
      anonymizationStatus: input.metadata.piiReported ? "PII_REVIEW_REQUIRED" : input.metadata.anonymizationStatus ?? "NOT_REVIEWED",
      piiReported: input.metadata.piiReported ?? false,
      provenance: input.metadata.provenance
    },
    annotation: {
      status: "ANNOTATION_PENDING",
      applicabilityPath: "annotations/applicability.json",
      expertAComplete: false,
      expertBComplete: false,
      expertIds: [],
      agreement: null,
      adjudicationComplete: false
    },
    certificationStatus: "BLOCKED"
  });
}

function intakeBuffer(input: { buffer: Buffer; originalFilename: string; corpusRoot: string; metadata: OperationalIntakeMetadata }) {
  if (!input.buffer.length) throw new OperationalCorpusIntakeError("SOURCE_MISSING", "Source is empty.");
  const detected = detectSourceFormat(input.buffer);
  if (!detected) throw new OperationalCorpusIntakeError("UNSUPPORTED_FORMAT", "Source signature is not supported.");
  const ext = extension(input.originalFilename);
  if (!formatsMatch(detected, ext)) throw new OperationalCorpusIntakeError("FORMAT_MISMATCH", `File extension ${ext || "NONE"} does not match detected format ${detected}.`);

  const existing = readOperationalManifests(input.corpusRoot);
  const hash = sha256(input.buffer);
  const duplicateId = existing.find((record) => record.manifest?.documentId === input.metadata.documentId);
  if (duplicateId) throw new OperationalCorpusIntakeError("DUPLICATE_DOCUMENT_ID", `Document ID already exists: ${duplicateId.manifestPath}`);
  const duplicateHash = existing.find((record) => record.manifest?.source.sha256 === hash);
  if (duplicateHash) throw new OperationalCorpusIntakeError("DUPLICATE_CHECKSUM", `Source checksum already exists: ${duplicateHash.manifestPath}`);

  const partition = safeSegment(input.metadata.partition);
  const subject = safeSegment(input.metadata.subject);
  const documentId = safeSegment(input.metadata.documentId);
  if (documentId !== input.metadata.documentId) throw new OperationalCorpusIntakeError("INVALID_MANIFEST", "Document ID must already be lowercase and URL-safe.");
  const targetDirectory = path.resolve(input.corpusRoot, partition, subject, documentId);
  const resolvedRoot = path.resolve(input.corpusRoot);
  if (!targetDirectory.startsWith(`${resolvedRoot}${path.sep}`)) throw new OperationalCorpusIntakeError("INVALID_MANIFEST", "Corpus target escapes the configured root.");

  const staging = path.join(resolvedRoot, `.staging-${documentId}-${crypto.randomUUID()}`);
  const safeExtension = detected === "JPEG" ? "jpg" : detected.toLowerCase();
  const sourceRelativePath = `original/source.${safeExtension}`;
  const sourceTarget = path.join(staging, "original", `source.${safeExtension}`);
  try {
    fs.mkdirSync(path.dirname(sourceTarget), { recursive: true });
    fs.mkdirSync(path.join(staging, "annotations"), { recursive: true });
    fs.mkdirSync(path.join(staging, "evidence"), { recursive: true });
    fs.writeFileSync(sourceTarget, input.buffer, { flag: "wx" });
    if (sha256(fs.readFileSync(sourceTarget)) !== hash) throw new Error("Preserved source checksum verification failed.");
    fs.chmodSync(sourceTarget, 0o444);
    const manifest = buildManifest({ buffer: input.buffer, originalFilename: input.originalFilename, sourceFormat: detected, metadata: input.metadata, sourceRelativePath });
    writeAtomicJson(path.join(staging, "manifest.json"), manifest);
    writeAtomicJson(path.join(staging, "provenance.json"), manifest.source.provenance);
    fs.writeFileSync(path.join(staging, "checksum.sha256"), `${hash}  ${sourceRelativePath}\n`, { encoding: "utf8", flag: "wx" });
    fs.mkdirSync(path.dirname(targetDirectory), { recursive: true });
    fs.renameSync(staging, targetDirectory);
    return { intakeVersion: OPERATIONAL_CORPUS_INTAKE_VERSION, targetDirectory, manifest, sourceChecksumVerified: true, countedAsRealEvidence: false };
  } catch (error) {
    if (fs.existsSync(staging)) fs.rmSync(staging, { recursive: true, force: true });
    throw error;
  }
}

export const operationalCorpusIntakeService = {
  intakeFile(input: { sourcePath: string; corpusRoot: string; metadata: OperationalIntakeMetadata }) {
    if (!fs.existsSync(input.sourcePath) || !fs.statSync(input.sourcePath).isFile()) throw new OperationalCorpusIntakeError("SOURCE_MISSING", "Source file does not exist.");
    return intakeBuffer({ buffer: fs.readFileSync(input.sourcePath), originalFilename: input.metadata.originalFilename ?? path.basename(input.sourcePath), corpusRoot: input.corpusRoot, metadata: input.metadata });
  },
  intakePastedText(input: { content: string; originalFilename: string; corpusRoot: string; metadata: OperationalIntakeMetadata }) {
    return intakeBuffer({ buffer: Buffer.from(input.content, "utf8"), originalFilename: input.originalFilename, corpusRoot: input.corpusRoot, metadata: input.metadata });
  },
  scan: readOperationalManifests
};
