import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, extname, resolve } from "node:path";

import { prisma } from "../config/prisma.js";
import { ndieComplianceService } from "../modules/ndie/security/compliance.service.js";
import { validateNdieUpload } from "../modules/ndie/security/ndie-security.js";
import { ndieSourceStorageService } from "../modules/ndie/source-storage/source-storage.service.js";

function argument(name: string) {
  return process.argv.find((value) => value.startsWith(`--${name}=`))?.slice(name.length + 3);
}

function mimeFor(path: string) {
  const extension = extname(path).toLowerCase();
  return ({
    ".pdf": "application/pdf", ".doc": "application/msword", ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp", ".tif": "image/tiff", ".tiff": "image/tiff",
    ".heic": "image/heic", ".heif": "image/heif", ".txt": "text/plain"
  } as Record<string, string>)[extension] ?? "application/octet-stream";
}

let importJobId = argument("import-job-id");
const fileArg = argument("file");
if (!importJobId && fileArg) {
  const filePath = resolve(fileArg);
  const userId = argument("user-id");
  if (!userId) throw new Error("--user-id is required to preserve ownership and audit scope for a real file.");
  if (!existsSync(filePath)) throw new Error(`Real paper not found: ${filePath}`);
  const buffer = readFileSync(filePath);
  const file = { fieldname: "file", originalname: basename(filePath), encoding: "7bit", mimetype: mimeFor(filePath), size: buffer.length, buffer, destination: "", filename: basename(filePath), path: filePath, stream: null as never } satisfies Express.Multer.File;
  validateNdieUpload(file);
  const security = ndieComplianceService.inspectUpload(file);
  if (security.status !== "ACCEPTED") throw new Error(`Real paper is blocked by upload safety: ${security.quarantineReasons.join(", ")}`);
  const created = await ndieSourceStorageService.createImport({ file, userId, subject: argument("subject"), sourceKind: argument("source-kind") ?? "QUESTION_PAPER", uploadSecurity: security });
  importJobId = created.importJob.id;
}

if (!importJobId) throw new Error("Provide --file=<path> --user-id=<id> to start a real run, or --import-job-id=<id> to export its evidence.");
const job = await prisma.ndieImportJob.findUnique({
  where: { id: importJobId },
  include: {
    sourceDocuments: true, pages: { include: { assets: true }, orderBy: { pageNumber: "asc" } }, elements: true,
    questionCandidates: true, answerKeyCandidates: true, solutionCandidates: true, reviewDecisions: true,
    providerRuns: { orderBy: { startedAt: "asc" } }, queueJobs: { orderBy: { queuedAt: "asc" } }
  }
});
if (!job) throw new Error(`NDIE import not found: ${importJobId}`);
const latestQueueState = (stage: string) => job.queueJobs.slice().reverse().find((queueJob) => queueJob.stage === stage)?.state ?? "NOT_REQUESTED";

const report = {
  schemaVersion: "ndie-real-paper-verification-v1",
  generatedAt: new Date().toISOString(),
  certificationClaim: false,
  importJobId: job.id,
  original: job.sourceDocuments.map((source) => ({ name: source.originalName, mime: source.fileType, size: source.fileSize, checksum: source.checksum, storageUrl: source.storageUrl, preservationState: source.preservationState })),
  processedEvidence: { pages: job.pages.length, pageAssets: job.pages.reduce((sum, page) => sum + page.assets.length, 0), elements: job.elements.length, providerRuns: job.providerRuns.map((run) => ({ providerId: run.providerId, stage: run.stage, status: run.status, confidence: run.confidence })) },
  reconstructedExam: { questions: job.questionCandidates.length, candidates: job.questionCandidates.map((candidate) => ({ id: candidate.id, number: candidate.questionNumber, type: candidate.questionType, confidence: candidate.confidence, reviewStatus: candidate.reviewStatus, sourceMap: candidate.sourceMap })) },
  teacherReview: { status: job.reviewStatus, decisions: job.reviewDecisions.length, complete: job.reviewStatus === "COMPLETED" },
  publish: { status: latestQueueState("PUBLISH"), blockedUntilTeacherApproval: job.reviewStatus !== "COMPLETED" },
  studentRendering: { status: latestQueueState("STUDENT_DELIVERY") },
  pipeline: { status: job.status, checkpoint: job.currentCheckpoint, queue: job.queueJobs.map((queueJob) => ({ stage: queueJob.stage, state: queueJob.state })) },
  evidenceChecksum: createHash("sha256").update(JSON.stringify({ importJobId: job.id, sources: job.sourceDocuments.map((source) => source.checksum), providers: job.providerRuns.map((run) => [run.providerId, run.stage, run.status]) })).digest("hex")
};

const outputRoot = resolve(argument("output") ?? "artifacts/ndie-real-paper-verification");
mkdirSync(outputRoot, { recursive: true });
const outputPath = resolve(outputRoot, `${job.id}.json`);
writeFileSync(outputPath, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ status: "REPORT_CREATED", outputPath, report }, null, 2));
await prisma.$disconnect();
