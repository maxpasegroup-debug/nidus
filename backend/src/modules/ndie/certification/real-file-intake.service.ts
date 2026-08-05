import fs from "node:fs";
import crypto from "node:crypto";
import path from "node:path";
import {
  REAL_FILE_BASELINE_SLOTS,
  type RealFileBaselineFormat,
  type RealFileBaselineSlot,
  realFileBaselineService
} from "./real-file-baseline.service.js";

export type RealFileIntakeDetectedFormat = RealFileBaselineFormat | "UNKNOWN";

export type RealFileIntakeCandidate = {
  filePath: string;
  fileName: string;
  sizeBytes: number;
  extension: string;
  detectedFormat: RealFileIntakeDetectedFormat;
  extensionMatchesSignature: boolean;
  sha256: string;
  duplicateOf?: string;
  suggestedSlots: Array<{
    slotId: string;
    title: string;
    confidence: number;
    reason: string[];
    targetFiles: string[];
  }>;
  status: "READY_FOR_SLOT" | "UNSUPPORTED" | "DUPLICATE" | "NEEDS_MANUAL_REVIEW";
  problems: string[];
};

export type RealFileIntakeReport = {
  intakeVersion: string;
  generatedAt: string;
  intakeRoot: string;
  filesScanned: number;
  readyForSlot: number;
  duplicates: number;
  unsupported: number;
  needsManualReview: number;
  candidates: RealFileIntakeCandidate[];
  emptySlots: Array<{ slotId: string; title: string; expectedFiles: string[] }>;
};

export const REAL_FILE_INTAKE_VERSION = "real-file-intake-v1";

const backendRoot = process.cwd().endsWith("backend") ? process.cwd() : path.join(process.cwd(), "backend");
const intakeRoot = path.join(backendRoot, "src", "modules", "ndie", "certification", "real-exam-intake");

const signatures: Array<{ format: RealFileBaselineFormat; detect: (buffer: Buffer) => boolean }> = [
  { format: "PDF", detect: (buffer) => buffer.subarray(0, 4).toString("utf8") === "%PDF" },
  { format: "DOCX", detect: (buffer) => buffer[0] === 0x50 && buffer[1] === 0x4b },
  { format: "JPG", detect: (buffer) => buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff },
  { format: "PNG", detect: (buffer) => buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  { format: "WEBP", detect: (buffer) => buffer.subarray(0, 4).toString("utf8") === "RIFF" && buffer.subarray(8, 12).toString("utf8") === "WEBP" }
];

function sha256(filePath: string) {
  const hash = crypto.createHash("sha256");
  hash.update(fs.readFileSync(filePath));
  return hash.digest("hex");
}

function extension(filePath: string) {
  return path.extname(filePath).replace(".", "").toUpperCase();
}

function detectFormat(filePath: string): RealFileIntakeDetectedFormat {
  const ext = extension(filePath);
  if (ext === "TXT") return "TXT";
  const buffer = fs.readFileSync(filePath).subarray(0, 32);
  return signatures.find((signature) => signature.detect(buffer))?.format ?? "UNKNOWN";
}

function listFiles(root: string): string[] {
  if (!fs.existsSync(root)) return [];
  return fs.readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(root, entry.name);
    if (entry.isDirectory()) return listFiles(entryPath);
    if (entry.isFile() && entry.name.toLowerCase() !== "readme.md") return [entryPath];
    return [];
  });
}

function keywords(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").split(/\s+/).filter(Boolean);
}

function subjectScore(slot: RealFileBaselineSlot, words: string[]) {
  const subject = slot.subject.toLowerCase();
  if (words.includes(subject.toLowerCase())) return 0.2;
  if (slot.subject === "Mathematics" && words.some((word) => ["math", "maths", "mathematics", "algebra", "geometry", "calculus"].includes(word))) return 0.2;
  if (slot.subject === "Chemistry" && words.some((word) => ["chem", "chemistry", "organic", "reaction", "neet"].includes(word))) return 0.2;
  if (slot.subject === "Physics" && words.some((word) => ["physics", "graph", "circuit", "jee"].includes(word))) return 0.2;
  return 0;
}

function slotScore(slot: RealFileBaselineSlot, candidate: { fileName: string; detectedFormat: RealFileIntakeDetectedFormat }) {
  const words = keywords(candidate.fileName);
  const reason: string[] = [];
  let score = 0;

  if (candidate.detectedFormat !== "UNKNOWN" && slot.acceptedExtensions.includes(candidate.detectedFormat)) {
    score += 0.35;
    reason.push(`format ${candidate.detectedFormat} is accepted`);
  }

  const subject = subjectScore(slot, words);
  if (subject > 0) {
    score += subject;
    reason.push(`filename suggests ${slot.subject}`);
  }

  if (words.includes(slot.exam.toLowerCase())) {
    score += 0.2;
    reason.push(`filename suggests ${slot.exam}`);
  }

  const joined = words.join(" ");
  const slotHints: Array<[boolean, string]> = [
    [slot.mustProve.answerKey && /answer|key/.test(joined), "filename suggests answer key"],
    [slot.mustProve.solutions && /solution|explanation/.test(joined), "filename suggests solutions"],
    [slot.mustProve.mobilePhoto && /mobile|camera|photo|screenshot/.test(joined), "filename suggests mobile photo"],
    [slot.mustProve.scanned && /scan|scanned/.test(joined), "filename suggests scanned paper"],
    [slot.mustProve.docxOfficeMath && /office|docx|word/.test(joined), "filename suggests Office Math DOCX"],
    [slot.mustProve.chemistryStructures && /organic|structure|reaction/.test(joined), "filename suggests chemistry structures"],
    [slot.mustProve.graphs && /graph|chart|coordinate/.test(joined), "filename suggests graphs"]
  ];
  for (const [matched, label] of slotHints) {
    if (matched) {
      score += 0.1;
      reason.push(label);
    }
  }

  return {
    slotId: slot.id,
    title: slot.title,
    confidence: Math.min(1, Math.round(score * 100) / 100),
    reason,
    targetFiles: realFileBaselineService.expectedFiles(slot.id)
  };
}

function candidateStatus(input: {
  detectedFormat: RealFileIntakeDetectedFormat;
  extensionMatchesSignature: boolean;
  duplicate: boolean;
  suggestedSlots: Array<{ confidence: number }>;
}) {
  if (input.duplicate) return "DUPLICATE" as const;
  if (input.detectedFormat === "UNKNOWN" || !input.extensionMatchesSignature) return "UNSUPPORTED" as const;
  if (input.suggestedSlots.some((slot) => slot.confidence >= 0.55)) return "READY_FOR_SLOT" as const;
  return "NEEDS_MANUAL_REVIEW" as const;
}

export function analyzeRealFileIntakeFile(filePath: string, seenHashes = new Map<string, string>()): RealFileIntakeCandidate {
  const stat = fs.statSync(filePath);
  const ext = extension(filePath);
  const detectedFormat = detectFormat(filePath);
  const hash = sha256(filePath);
  const duplicateOf = seenHashes.get(hash);
  if (!duplicateOf) seenHashes.set(hash, filePath);
  const extensionMatchesSignature = detectedFormat === "TXT"
    ? ext === "TXT"
    : detectedFormat !== "UNKNOWN" && detectedFormat === ext;
  const suggestedSlots = REAL_FILE_BASELINE_SLOTS
    .map((slot) => slotScore(slot, { fileName: path.basename(filePath), detectedFormat }))
    .filter((slot) => slot.confidence > 0)
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 3);
  const status = candidateStatus({ detectedFormat, extensionMatchesSignature, duplicate: Boolean(duplicateOf), suggestedSlots });
  const problems = [
    detectedFormat === "UNKNOWN" ? "Unsupported or unreadable file signature." : "",
    !extensionMatchesSignature ? `Extension ${ext || "NONE"} does not match detected format ${detectedFormat}.` : "",
    duplicateOf ? `Duplicate of ${duplicateOf}.` : "",
    suggestedSlots.length === 0 ? "No certification slot could be suggested automatically." : ""
  ].filter(Boolean);

  return {
    filePath,
    fileName: path.basename(filePath),
    sizeBytes: stat.size,
    extension: ext,
    detectedFormat,
    extensionMatchesSignature,
    sha256: hash,
    duplicateOf,
    suggestedSlots,
    status,
    problems
  };
}

export const realFileIntakeService = {
  version: REAL_FILE_INTAKE_VERSION,
  intakeRoot,

  scan(root = intakeRoot): RealFileIntakeReport {
    const hashes = new Map<string, string>();
    const candidates = listFiles(root).map((filePath) => analyzeRealFileIntakeFile(filePath, hashes));
    const existingBaseline = realFileBaselineService.run();
    return {
      intakeVersion: REAL_FILE_INTAKE_VERSION,
      generatedAt: new Date().toISOString(),
      intakeRoot: root,
      filesScanned: candidates.length,
      readyForSlot: candidates.filter((candidate) => candidate.status === "READY_FOR_SLOT").length,
      duplicates: candidates.filter((candidate) => candidate.status === "DUPLICATE").length,
      unsupported: candidates.filter((candidate) => candidate.status === "UNSUPPORTED").length,
      needsManualReview: candidates.filter((candidate) => candidate.status === "NEEDS_MANUAL_REVIEW").length,
      candidates,
      emptySlots: existingBaseline.documentReports
        .filter((report) => !report.evidence.exists)
        .map((report) => ({ slotId: report.slotId, title: report.title, expectedFiles: report.evidence.expectedFiles }))
    };
  }
};
