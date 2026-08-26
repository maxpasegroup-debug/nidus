import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createCanvas } from "@napi-rs/canvas";
import PDFDocument from "pdfkit";
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const backendRoot = resolve(scriptDirectory, "../..");
const repositoryRoot = resolve(backendRoot, "..");
const evidenceRoot = resolve(repositoryRoot, ".staging/phase6-real-ndie-evidence");
const inputRoot = resolve(repositoryRoot, "real-exam-inputs");

function applyEnvironmentFile(contents: string) {
  for (const line of contents.split(/\r?\n/)) {
    const match = line.match(/^([A-Z][A-Z0-9_]*)=(.*)$/);
    if (!match) continue;
    const value = match[2].trim().replace(/^(["'])(.*)\1$/, "$2");
    process.env[match[1]] = value;
  }
}

function sha256(buffer: Buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

function normalizedText(value: string) {
  return value.normalize("NFKC").replace(/\s+/g, " ").trim();
}

function tokenRecall(source: string, candidate: string) {
  const sourceTokens = normalizedText(source).toLowerCase().split(/\s+/).filter(Boolean);
  const candidateTokens = new Set(normalizedText(candidate).toLowerCase().split(/\s+/).filter(Boolean));
  if (!sourceTokens.length) return null;
  const matched = sourceTokens.filter((token) => candidateTokens.has(token)).length;
  return Number((matched / sourceTokens.length).toFixed(4));
}

async function renderSourcePage(sourcePath: string, pageNumber: number) {
  const source = await readFile(sourcePath);
  const document = await pdfjs.getDocument({ data: new Uint8Array(source), disableFontFace: true, useSystemFonts: true }).promise;
  const page = await document.getPage(pageNumber);
  const viewport = page.getViewport({ scale: 2.2 });
  const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
  await page.render({ canvasContext: canvas.getContext("2d") as never, viewport } as never).promise;
  const text = await page.getTextContent();
  return {
    buffer: canvas.toBuffer("image/png"),
    embeddedText: text.items.map((item) => "str" in item ? item.str : "").join(" "),
    width: viewport.width,
    height: viewport.height,
    sourceChecksum: sha256(source),
    sourcePageCount: document.numPages
  };
}

async function wrapImageAsPdf(image: Buffer, width: number, height: number) {
  return new Promise<Buffer>((resolvePromise, reject) => {
    const chunks: Buffer[] = [];
    const scale = 72 / 158.4;
    const document = new PDFDocument({ autoFirstPage: false, compress: false });
    document.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    document.on("end", () => resolvePromise(Buffer.concat(chunks)));
    document.on("error", reject);
    document.addPage({ size: [width * scale, height * scale], margin: 0 });
    document.image(image, 0, 0, { width: width * scale, height: height * scale });
    document.end();
  });
}

type CaseDefinition = {
  id: string;
  sourceFile: string;
  pageNumber: number;
  transport: "PDF" | "IMAGE";
  evidenceClass: "DIGITAL_TEXT_PAGE" | "FORMULA_PAGE" | "SCANNED_PAGE";
};

const cases: CaseDefinition[] = [
  { id: "math-digital-pdf", sourceFile: "Sainik School Matematics Nidus Academy.pdf", pageNumber: 78, transport: "PDF", evidenceClass: "DIGITAL_TEXT_PAGE" },
  { id: "math-formula-image", sourceFile: "NDA Math Book Nidus Academy-3.pdf", pageNumber: 139, transport: "IMAGE", evidenceClass: "FORMULA_PAGE" },
  { id: "math-scanned-image", sourceFile: "NDA Mathematics 1.1__Nidus Academy Kollam.pdf", pageNumber: 190, transport: "IMAGE", evidenceClass: "SCANNED_PAGE" }
];

await readFile(resolve(backendRoot, ".env"), "utf8").then(applyEnvironmentFile).catch(() => undefined);
await applyEnvironmentFile(await readFile(resolve(backendRoot, ".env.staging.local"), "utf8"));
process.env.JWT_SECRET ||= `${randomUUID()}${randomUUID()}`;
Object.assign(process.env, { NODE_ENV: "test" });
process.env.NDIE_ENABLED = "true";
process.env.NDIE_SERVER_IMPORT_ENABLED = "true";
process.env.NDIE_QUEUE_WORKERS_ENABLED = "true";
process.env.NDIE_LOCAL_STORAGE_ENABLED = "true";
process.env.NDIE_LOCAL_STORAGE_ROOT = resolve(repositoryRoot, ".staging/phase6-ndie-assets");
process.env.NDIE_RENDER_REVIEW_DPI = "144";
process.env.NDIE_RENDER_OCR_DPI = "180";
process.env.MATHPIX_ENABLED = "false";
process.env.AZURE_DOCUMENT_INTELLIGENCE_ENABLED = "false";
process.env.OPENAI_ENABLED = "false";

const [{ prisma }, { ndieComplianceService }, { ndieSourceStorageService }, { ndieWorkerService }, { ndieQueueService }, { ndieReviewEngineService }, { ndiePublisherService }] = await Promise.all([
  import("../config/prisma.js"),
  import("../modules/ndie/security/compliance.service.js"),
  import("../modules/ndie/source-storage/source-storage.service.js"),
  import("../modules/ndie/worker/worker.service.js"),
  import("../modules/ndie/queue/queue.service.js"),
  import("../modules/ndie/review-engine/review-engine.service.js"),
  import("../modules/ndie/publisher/publisher.service.js")
]);

await mkdir(evidenceRoot, { recursive: true });
const user = await prisma.user.findFirst({ where: { role: { in: ["TEACHER", "DIRECTOR", "ADMIN"] } }, orderBy: { createdAt: "asc" } });
if (!user) throw new Error("Phase 6 staging validation requires a staging teacher/director/admin user.");

async function runJob(jobId: string) {
  const completed = await ndieWorkerService.runPlaceholderJob(jobId);
  if (completed.state !== "COMPLETED") {
    const details = completed as { state: string; stage?: string; errorMessage?: string | null };
    throw new Error(`NDIE stage ${details.stage ?? "unknown"} ended in ${details.state}: ${details.errorMessage ?? "unknown error"}`);
  }
  return completed;
}

async function runStage(importJobId: string, stage: "OCR" | "LAYOUT" | "FORMULA" | "VISUAL" | "QUESTION" | "ANSWER" | "AI_VALIDATION") {
  const methods = {
    OCR: ndieQueueService.enqueueOcr,
    LAYOUT: ndieQueueService.enqueueLayout,
    FORMULA: ndieQueueService.enqueueFormula,
    VISUAL: ndieQueueService.enqueueVisual,
    QUESTION: ndieQueueService.enqueueQuestion,
    ANSWER: ndieQueueService.enqueueAnswer,
    AI_VALIDATION: ndieQueueService.enqueueAiValidation
  } as const;
  const job = await methods[stage].call(ndieQueueService, { importJobId, requestedBy: "phase6-real-validation" });
  return runJob(job.id);
}

const results = [];
for (const definition of cases) {
  const sourcePath = join(inputRoot, definition.sourceFile);
  const rendered = await renderSourcePage(sourcePath, definition.pageNumber);
  const pngName = `${definition.id}-source-page-${definition.pageNumber}.png`;
  const pngPath = join(evidenceRoot, pngName);
  await writeFile(pngPath, rendered.buffer);
  const payload = definition.transport === "PDF"
    ? await wrapImageAsPdf(rendered.buffer, rendered.width, rendered.height)
    : rendered.buffer;
  const fileName = definition.transport === "PDF" ? `${definition.id}.pdf` : pngName;
  const mimetype = definition.transport === "PDF" ? "application/pdf" : "image/png";
  const evidencePath = join(evidenceRoot, fileName);
  if (definition.transport === "PDF") await writeFile(evidencePath, payload);

  const file = {
    fieldname: "file",
    originalname: fileName,
    encoding: "7bit",
    mimetype,
    size: payload.length,
    buffer: payload,
    destination: "",
    filename: fileName,
    path: evidencePath,
    stream: undefined as never
  } as Express.Multer.File;
  const security = ndieComplianceService.inspectUpload(file);
  const created = await ndieSourceStorageService.createImport({
    file,
    userId: user.id,
    subject: "Mathematics",
    topic: `Real source page ${definition.pageNumber}`,
    sourceKind: "QUESTION_PAPER",
    uploadSecurity: security
  });
  const stages: string[] = [];
  await runJob(created.queueJob.id);
  stages.push(created.queueJob.stage);
  if (definition.transport === "PDF") await runStage(created.importJob.id, "OCR");
  stages.push("OCR");
  for (const stage of ["LAYOUT", "FORMULA", "VISUAL", "QUESTION", "ANSWER", "AI_VALIDATION"] as const) {
    await runStage(created.importJob.id, stage);
    stages.push(stage);
  }

  const [record, questions, providerRuns, elementCounts, answerCount, reviewWorkspace] = await Promise.all([
    ndieSourceStorageService.getImport(created.importJob.id),
    prisma.ndieQuestionCandidate.findMany({ where: { importJobId: created.importJob.id }, orderBy: { createdAt: "asc" } }),
    prisma.ndieProviderRun.findMany({ where: { importJobId: created.importJob.id }, orderBy: { startedAt: "asc" } }),
    prisma.ndieElement.groupBy({ by: ["elementType"], where: { importJobId: created.importJob.id }, _count: { _all: true } }),
    prisma.ndieAnswerKeyCandidate.count({ where: { importJobId: created.importJob.id } }),
    ndieReviewEngineService.getReviewWorkspace(created.importJob.id)
  ]);
  let publishBlocked = false;
  let publishBlockReason: string | null = null;
  try {
    await ndiePublisherService.publish({
      importJobId: created.importJob.id,
      requester: { id: user.id, role: user.role, roleMetadata: null },
      title: `Phase 6 unsafe publishing check - ${definition.id}`,
      subject: "Mathematics"
    });
  } catch (error) {
    publishBlocked = true;
    publishBlockReason = error instanceof Error ? error.message : "Publishing was blocked.";
  }
  const ocrText = record?.pages.map((page) => page.ocrText ?? "").join("\n") ?? "";
  const hasEmbeddedGroundTruth = normalizedText(rendered.embeddedText).length > 40;
  const questionNumbers = questions.map((question) => question.questionNumber).filter((value): value is string => Boolean(value));
  const duplicateQuestionNumbers = [...new Set(questionNumbers.filter((value, index) => questionNumbers.indexOf(value) !== index))];
  results.push({
    caseId: definition.id,
    importJobId: created.importJob.id,
    subject: "Mathematics",
    evidenceClass: definition.evidenceClass,
    transport: definition.transport,
    parentSource: basename(sourcePath),
    parentSourceChecksum: rendered.sourceChecksum,
    parentPage: definition.pageNumber,
    parentPageCount: rendered.sourcePageCount,
    derivativeChecksum: sha256(payload),
    sourcePreserved: record?.sourceDocuments[0]?.checksum === sha256(payload),
    stages,
    status: record?.status ?? "UNKNOWN",
    ocrProvider: providerRuns.find((run) => run.providerKind === "OCR")?.providerId ?? null,
    layoutProvider: providerRuns.find((run) => run.providerKind === "LAYOUT")?.providerId ?? null,
    formulaProvider: providerRuns.find((run) => run.providerKind === "FORMULA")?.providerId ?? null,
    validationProvider: providerRuns.find((run) => run.providerKind === "AI_VALIDATION")?.providerId ?? null,
    ocrCharacters: normalizedText(ocrText).length,
    embeddedGroundTruthAvailable: hasEmbeddedGroundTruth,
    embeddedTextTokenRecall: hasEmbeddedGroundTruth ? tokenRecall(rendered.embeddedText, ocrText) : null,
    questionCount: questions.length,
    elementCounts: Object.fromEntries(elementCounts.map((row) => [row.elementType, row._count._all])),
    answerCandidateCount: answerCount,
    duplicateQuestionNumbers,
    reviewWorkspaceAvailable: Boolean(reviewWorkspace),
    reviewInsights: reviewWorkspace?.reviewInsights ?? null,
    publishBlocked,
    publishBlockReason,
    questions: questions.map((question) => ({
      number: question.questionNumber,
      type: question.questionType,
      confidence: question.confidence,
      status: question.status,
      reviewStatus: question.reviewStatus,
      sourceMapPresent: Boolean(question.sourceMap)
    })),
    readyWithoutReview: questions.length > 0 && questions.every((question) => question.reviewStatus === "APPROVED"),
    academicAccuracy: "NOT_EXPERT_VERIFIED"
  });
}

const report = {
  schemaVersion: "nidus-phase6-real-ndie-evidence-v1",
  generatedAt: new Date().toISOString(),
  scope: "Representative real Mathematics pages supplied in the workspace; not full-paper or subject certification.",
  providerCredentialsUsed: false,
  externalProviders: { mathpix: "NOT_CONFIGURED", azureDocumentIntelligence: "NOT_CONFIGURED", openAi: "NOT_CONFIGURED" },
  results
};
await writeFile(join(evidenceRoot, "phase6-real-ndie-report.json"), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
await prisma.$disconnect();
