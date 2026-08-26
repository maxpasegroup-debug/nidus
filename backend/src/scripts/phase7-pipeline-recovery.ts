import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createCanvas } from "@napi-rs/canvas";
import PDFDocument from "pdfkit";
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";

function loadEnvironment(contents: string) {
  for (const line of contents.split(/\r?\n/)) {
    const match = line.match(/^([A-Z][A-Z0-9_]*)=(.*)$/);
    if (match && process.env[match[1]] === undefined) process.env[match[1]] = match[2].trim().replace(/^(\"|')(.*)\1$/, "$2");
  }
}

const backendRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const repositoryRoot = resolve(backendRoot, "..");

await readFile(resolve(backendRoot, ".env.staging.local"), "utf8").then(loadEnvironment);
process.env.JWT_SECRET ||= `${randomUUID()}${randomUUID()}`;
Object.assign(process.env, {
  NODE_ENV: "test",
  NDIE_ENABLED: "true",
  NDIE_SERVER_IMPORT_ENABLED: "true",
  NDIE_QUEUE_WORKERS_ENABLED: "true",
  NDIE_LOCAL_STORAGE_ENABLED: "true",
  NDIE_LOCAL_STORAGE_ROOT: resolve(repositoryRoot, ".staging/phase7-pipeline-assets"),
  NDIE_TESSERACT_LANG_PATH: backendRoot,
  NDIE_TESSERACT_LANG_GZIP: "false",
  MATHPIX_ENABLED: "false",
  AZURE_DOCUMENT_INTELLIGENCE_ENABLED: "false",
  OPENAI_ENABLED: "false"
});

const databaseUrl = new URL(process.env.DATABASE_URL ?? "");
assert.ok(["127.0.0.1", "localhost"].includes(databaseUrl.hostname), "Phase 7 pipeline test requires local PostgreSQL.");
assert.match(databaseUrl.pathname.slice(1), /^nidus_staging_/i, "Phase 7 pipeline test requires a staging database.");

const [{ prisma }, { ndieComplianceService }, { ndieSourceStorageService }, { ndieQueueService }, { ndieWorkerService }, { ndieImportReplayService }] = await Promise.all([
  import("../config/prisma.js"),
  import("../modules/ndie/security/compliance.service.js"),
  import("../modules/ndie/source-storage/source-storage.service.js"),
  import("../modules/ndie/queue/queue.service.js"),
  import("../modules/ndie/worker/worker.service.js"),
  import("../modules/ndie/import-replay/import-replay.service.js")
]);

async function onePagePdf() {
  const parent = await readFile(resolve(repositoryRoot, "real-exam-inputs/Sainik School Matematics Nidus Academy.pdf"));
  const source = await pdfjs.getDocument({ data: new Uint8Array(parent), disableFontFace: true, useSystemFonts: true }).promise;
  const page = await source.getPage(78);
  const viewport = page.getViewport({ scale: 1.6 });
  const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
  await page.render({ canvasContext: canvas.getContext("2d") as never, viewport } as never).promise;
  const image = canvas.toBuffer("image/png");
  const pdf = await new Promise<Buffer>((resolvePromise, reject) => {
    const chunks: Buffer[] = [];
    const document = new PDFDocument({ autoFirstPage: false, compress: false });
    document.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    document.on("end", () => resolvePromise(Buffer.concat(chunks)));
    document.on("error", reject);
    document.addPage({ size: [viewport.width, viewport.height], margin: 0 });
    document.image(image, 0, 0, { width: viewport.width, height: viewport.height });
    document.end();
  });
  return { pdf, parentChecksum: createHash("sha256").update(parent).digest("hex") };
}

async function main() {
  const teacher = await prisma.user.findFirstOrThrow({ where: { id: "phase4-teacher-a1" } });
  const prior = await prisma.ndieImportJob.findMany({ where: { topic: "PHASE7 automatic pipeline" }, select: { id: true } });
  if (prior.length) await prisma.ndieImportJob.deleteMany({ where: { id: { in: prior.map((row) => row.id) } } });
  const source = await onePagePdf();
  const file = {
    fieldname: "file", originalname: "phase7-real-mathematics-page.pdf", encoding: "7bit", mimetype: "application/pdf",
    size: source.pdf.length, buffer: source.pdf, destination: "", filename: "phase7-real-mathematics-page.pdf", path: "", stream: undefined as never
  } as Express.Multer.File;
  const created = await ndieSourceStorageService.createImport({
    file, userId: teacher.id, subject: "Mathematics", topic: "PHASE7 automatic pipeline", sourceKind: "QUESTION_PAPER",
    uploadSecurity: ndieComplianceService.inspectUpload(file)
  });

  const claims = await Promise.all(Array.from({ length: 10 }, (_, index) => ndieQueueService.claimNext?.(`phase7-race-${index}`)));
  const claimed = claims.filter((job): job is NonNullable<(typeof claims)[number]> => Boolean(job));
  assert.equal(claimed.length, 1, "Concurrent workers must claim one initial job exactly once.");
  assert.equal(claimed[0].id, created.queueJob.id);
  await ndieWorkerService.runPlaceholderJob(claimed[0].id, claimed[0].workerId ?? "phase7-race-0");

  const ocrClaim = await ndieQueueService.claimNext?.("phase7-stale-worker");
  assert.ok(ocrClaim && ocrClaim.importJobId === created.importJob.id && ocrClaim.stage === "OCR");
  await prisma.ndieQueueJob.update({ where: { id: ocrClaim.id }, data: { startedAt: new Date(Date.now() - 120_000) } });
  assert.equal(await ndieQueueService.recoverStale?.(60_000), 1);
  await prisma.ndieQueueJob.update({ where: { id: ocrClaim.id }, data: { nextRunAt: new Date(0) } });

  const stages: string[] = ["PDF_RENDERING"];
  for (let guard = 0; guard < 10; guard += 1) {
    const job = await ndieQueueService.claimNext?.(`phase7-chain-${guard}`);
    if (!job) break;
    assert.equal(job.importJobId, created.importJob.id);
    stages.push(job.stage);
    await ndieWorkerService.runPlaceholderJob(job.id, job.workerId ?? `phase7-chain-${guard}`);
  }
  assert.deepEqual(stages, ["PDF_RENDERING", "OCR", "LAYOUT", "FORMULA", "VISUAL", "QUESTION", "ANSWER", "AI_VALIDATION"]);

  const [record, jobs, candidates] = await Promise.all([
    prisma.ndieImportJob.findUniqueOrThrow({ where: { id: created.importJob.id } }),
    prisma.ndieQueueJob.findMany({ where: { importJobId: created.importJob.id }, orderBy: { createdAt: "asc" } }),
    prisma.ndieQuestionCandidate.count({ where: { importJobId: created.importJob.id } })
  ]);
  assert.equal(record.status, "READY_FOR_TEACHER_REVIEW");
  assert.ok(jobs.every((job) => job.state === "COMPLETED"));
  assert.equal(new Set(jobs.map((job) => job.idempotencyKey)).size, jobs.length);

  const duplicateEnqueues = await Promise.all(Array.from({ length: 10 }, () => ndieQueueService.enqueueAiValidation({ importJobId: created.importJob.id, requestedBy: "phase7-idempotency" })));
  assert.equal(new Set(duplicateEnqueues.map((job) => job.id)).size, 1);
  assert.equal(await prisma.ndieQueueJob.count({ where: { importJobId: created.importJob.id, stage: "AI_VALIDATION" } }), 1);

  const replay = await ndieImportReplayService.replay({
    importJobId: created.importJob.id, requestedBy: teacher.id, stages: ["LAYOUT", "QUESTION", "AI_VALIDATION"]
  });
  for (let guard = 0; guard < 5; guard += 1) {
    const job = await ndieQueueService.claimNext?.(`phase7-replay-${guard}`);
    if (!job) break;
    assert.equal(job.replayRunId, replay.id);
    await ndieWorkerService.runPlaceholderJob(job.id, job.workerId ?? `phase7-replay-${guard}`);
  }
  const completedReplay = await prisma.ndieReplayRun.findUniqueOrThrow({ where: { id: replay.id } });
  assert.equal(completedReplay.status, "COMPLETED");
  assert.equal(await prisma.ndieQuestionCandidate.count({ where: { importJobId: created.importJob.id } }), candidates);

  console.log(JSON.stringify({
    database: databaseUrl.pathname.slice(1), importJobId: created.importJob.id, sourcePreserved: true,
    parentSourceChecksum: source.parentChecksum, stages, concurrentClaimWinners: claimed.length,
    staleJobsRecovered: 1, duplicateStageJobs: 0, candidates, replayStages: 3,
    replayStatus: completedReplay.status, candidatesAfterReplay: candidates, finalState: record.status, status: "PASS"
  }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack ?? error.message : String(error));
  process.exitCode = 1;
}).finally(() => prisma.$disconnect());
