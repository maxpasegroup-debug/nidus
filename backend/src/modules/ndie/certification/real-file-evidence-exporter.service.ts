import fs from "node:fs";
import crypto from "node:crypto";
import path from "node:path";
import { prisma } from "../../../config/prisma.js";
import type { Prisma } from "../../../generated/prisma/client.js";
import {
  REAL_FILE_BASELINE_STAGES,
  REAL_FILE_BASELINE_SLOTS,
  type RealFileBaselineSlot,
  type RealFileBaselineStage,
  type RealFilePipelineEvidenceManifest,
  type RealFilePipelineStageEvidence,
  type RealFileStageStatus,
  realFileBaselineService
} from "./real-file-baseline.service.js";

type EvidenceImportRecord = {
  id: string;
  status: string;
  testId?: string | null;
  currentCheckpoint?: string | null;
  uploadedBy: string;
  createdAt: Date;
  updatedAt: Date;
  sourceDocuments: Array<{
    id: string;
    sourceKind: string;
    fileType: string;
    fileSize: number;
    checksum?: string | null;
    preservationState: string;
    pageCount?: number | null;
  }>;
  pages: Array<{
    id: string;
    pageNumber: number;
    renderStatus: string;
    ocrStatus: string;
    ocrText?: string | null;
    ocrJson?: Prisma.JsonValue | null;
    layoutJson?: Prisma.JsonValue | null;
    checksum?: string | null;
    renderDurationMs?: number | null;
  }>;
  assets: Array<{ id: string; assetType: string; role?: string | null; pageNumber?: number | null; url: string }>;
  elements: Array<{ id: string; elementType: string; confidence?: number | null; pageNumber: number }>;
  questionCandidates: Array<{ id: string; reviewStatus: string; confidence?: number | null; approvedQuestionId?: string | null }>;
  answerKeyCandidates: Array<{ id: string; status: string; confidence?: number | null }>;
  solutionCandidates: Array<{ id: string; status: string; confidence?: number | null }>;
  reviewDecisions: Array<{ id: string; decision: string; createdAt: Date }>;
  qualityScores: Array<{ overall: number; grade: string; createdAt: Date }>;
  providerRuns: Array<{
    providerId: string;
    providerKind: string;
    stage: string;
    status: string;
    confidence?: number | null;
    error?: string | null;
    startedAt: Date;
    completedAt?: Date | null;
  }>;
  queueJobs: Array<{
    id: string;
    stage: string;
    state: string;
    workerId?: string | null;
    progress: number;
    errorMessage?: string | null;
    startedAt?: Date | null;
    completedAt?: Date | null;
  }>;
};

export type RealFileEvidenceExportInput = {
  slotId: string;
  importJobId: string;
  executedBy?: string;
  write?: boolean;
};

export type RealFileEvidenceExportResult = {
  slotId: string;
  importJobId: string;
  fixtureSourcePath: string | null;
  fixtureSourceSha256: string | null;
  sourceChecksumMatchesImport: boolean;
  evidencePath: string | null;
  manifest: RealFilePipelineEvidenceManifest;
  certificationPreview: ReturnType<typeof realFileBaselineService.certifySlot>;
};

function asError(value: unknown) {
  return value instanceof Error ? value : new Error(String(value));
}

function sha256(filePath: string) {
  const hash = crypto.createHash("sha256");
  hash.update(fs.readFileSync(filePath));
  return hash.digest("hex");
}

function fixtureSource(slotId: string) {
  const files = realFileBaselineService.expectedFiles(slotId);
  const selected = files.find((file) => fs.existsSync(file)) ?? null;
  return selected ? { path: selected, sha256: sha256(selected) } : null;
}

function average(values: number[]) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
}

function confidence(values: Array<number | null | undefined>) {
  return average(values.filter((value): value is number => typeof value === "number"));
}

function providerRun(importJob: EvidenceImportRecord, stages: string[]) {
  return importJob.providerRuns
    .filter((run) => stages.includes(run.stage))
    .sort((a, b) => (b.completedAt ?? b.startedAt).getTime() - (a.completedAt ?? a.startedAt).getTime())[0];
}

function queueJob(importJob: EvidenceImportRecord, stages: string[]) {
  return importJob.queueJobs
    .filter((job) => stages.includes(job.stage) || stages.includes(job.state))
    .sort((a, b) => (b.completedAt ?? b.startedAt ?? new Date(0)).getTime() - (a.completedAt ?? a.startedAt ?? new Date(0)).getTime())[0];
}

function stageEvidence(input: {
  stage: RealFileBaselineStage;
  status: RealFileStageStatus;
  score: number;
  importJob: EvidenceImportRecord;
  providerStages?: string[];
  notes: string;
  metrics?: Record<string, number | string | boolean | null>;
  failures?: string[];
}): RealFilePipelineStageEvidence {
  const run = input.providerStages ? providerRun(input.importJob, input.providerStages) : undefined;
  const job = input.providerStages ? queueJob(input.importJob, input.providerStages) : undefined;
  return {
    stage: input.stage,
    status: input.status,
    score: input.score,
    provider: run?.providerId,
    workerId: job?.workerId ?? undefined,
    startedAt: (run?.startedAt ?? job?.startedAt ?? input.importJob.createdAt).toISOString(),
    completedAt: (run?.completedAt ?? job?.completedAt ?? input.importJob.updatedAt).toISOString(),
    metrics: input.metrics,
    failures: input.failures,
    notes: input.notes
  };
}

function passIf(condition: boolean, score: number, failures: string[]): { status: RealFileStageStatus; score: number; failures?: string[] } {
  return condition ? { status: "PASS", score } : { status: "FAIL", score: 0, failures };
}

export function buildRealFilePipelineEvidence(input: {
  slot: RealFileBaselineSlot;
  importJob: EvidenceImportRecord;
  sourceSha256: string;
  executedBy?: string;
}): RealFilePipelineEvidenceManifest {
  const source = input.importJob.sourceDocuments[0];
  const renderedPages = input.importJob.pages.filter((page) => ["PAGE_RENDERED", "SOURCE_IMAGE"].includes(page.renderStatus));
  const ocrPages = input.importJob.pages.filter((page) => Boolean(page.ocrText || page.ocrJson));
  const layoutPages = input.importJob.pages.filter((page) => Boolean(page.layoutJson));
  const formulaElements = input.importJob.elements.filter((element) => ["FORMULA", "CHEMICAL_EQUATION"].includes(element.elementType));
  const visualElements = input.importJob.elements.filter((element) => ["TABLE", "GRAPH", "DIAGRAM", "IMAGE", "FIGURE", "CHEMICAL_STRUCTURE"].includes(element.elementType));
  const approvedOrFinal = input.importJob.questionCandidates.filter((candidate) => ["APPROVED", "REJECTED", "SKIPPED"].includes(candidate.reviewStatus));
  const publishedQuestions = input.importJob.questionCandidates.filter((candidate) => Boolean(candidate.approvedQuestionId));
  const finalQuality = input.importJob.qualityScores[0];
  const allPagesRendered = input.importJob.pages.length > 0 && renderedPages.length === input.importJob.pages.length;
  const allPagesOcr = input.importJob.pages.length > 0 && ocrPages.length === input.importJob.pages.length;
  const allPagesLayout = input.importJob.pages.length > 0 && layoutPages.length === input.importJob.pages.length;
  const needsAnswerEvidence = input.slot.mustProve.answerKey;
  const needsFormulaEvidence = input.slot.mustProve.formulas || input.slot.mustProve.chemistryStructures;
  const needsVisualEvidence = input.slot.mustProve.diagrams || input.slot.mustProve.graphs || input.slot.mustProve.tables || input.slot.mustProve.chemistryStructures;

  const upload = passIf(Boolean(source?.checksum), 1, ["Source document was not preserved with checksum."]);
  const render = passIf(allPagesRendered, 1, ["Rendered page evidence is incomplete."]);
  const ocr = passIf(allPagesOcr, confidence(input.importJob.pages.map((page) => Number((page.ocrJson as { confidence?: number } | null)?.confidence))) ?? 0.8, ["OCR evidence is incomplete."]);
  const layout = passIf(allPagesLayout, 0.9, ["Layout evidence is incomplete."]);
  const formula = passIf(!needsFormulaEvidence || formulaElements.length > 0, confidence(formulaElements.map((element) => element.confidence)) ?? 0.9, ["Formula or chemistry structure evidence is missing."]);
  const visual = passIf(!needsVisualEvidence || visualElements.length > 0, confidence(visualElements.map((element) => element.confidence)) ?? 0.9, ["Visual evidence is missing."]);
  const reconstruction = passIf(input.importJob.questionCandidates.length > 0, confidence(input.importJob.questionCandidates.map((candidate) => candidate.confidence)) ?? 0.85, ["No reconstructed question candidates found."]);
  const review = passIf(input.importJob.questionCandidates.length > 0 && approvedOrFinal.length === input.importJob.questionCandidates.length, 1, ["Teacher review is incomplete."]);
  const publish = passIf(Boolean(input.importJob.testId) && publishedQuestions.length > 0 && (!needsAnswerEvidence || input.importJob.answerKeyCandidates.length > 0), 1, ["Publish evidence is incomplete."]);
  const cbtRender = passIf(["DELIVERY_READY", "READY_FOR_STUDENT_DELIVERY"].includes(input.importJob.status) && Boolean(input.importJob.testId), 1, ["CBT delivery evidence is incomplete."]);

  return {
    manifestVersion: "real-file-pipeline-evidence-v1",
    slotId: input.slot.id,
    pipelineRunId: input.importJob.id,
    sourceSha256: input.sourceSha256,
    executedAt: new Date().toISOString(),
    executedBy: input.executedBy,
    stages: [
      stageEvidence({
        stage: "UPLOAD",
        importJob: input.importJob,
        ...upload,
        notes: "Source document evidence exported from NDIE source storage.",
        metrics: { sourceDocuments: input.importJob.sourceDocuments.length, fileSize: source?.fileSize ?? null, preservationState: source?.preservationState ?? null }
      }),
      stageEvidence({
        stage: "RENDER",
        importJob: input.importJob,
        providerStages: ["PAGES_RENDERED", "RENDERING", "READY_FOR_OCR"],
        ...render,
        notes: "Rendered page evidence exported from NDIE page records.",
        metrics: { pages: input.importJob.pages.length, renderedPages: renderedPages.length, averageRenderDurationMs: average(input.importJob.pages.map((page) => page.renderDurationMs ?? 0)) }
      }),
      stageEvidence({
        stage: "OCR",
        importJob: input.importJob,
        providerStages: ["OCR_COMPLETED", "OCR_RUNNING", "READY_FOR_LAYOUT"],
        ...ocr,
        notes: "OCR evidence exported from NDIE page OCR fields.",
        metrics: { pages: input.importJob.pages.length, ocrPages: ocrPages.length }
      }),
      stageEvidence({
        stage: "LAYOUT",
        importJob: input.importJob,
        providerStages: ["LAYOUT_COMPLETED", "LAYOUT_RUNNING", "READY_FOR_FORMULA_ENGINE"],
        ...layout,
        notes: "Layout evidence exported from NDIE page layout fields.",
        metrics: { pages: input.importJob.pages.length, layoutPages: layoutPages.length, elements: input.importJob.elements.length }
      }),
      stageEvidence({
        stage: "FORMULA",
        importJob: input.importJob,
        providerStages: ["FORMULA_COMPLETED", "FORMULA_RUNNING", "READY_FOR_VISUAL_ENGINE"],
        ...formula,
        notes: "Formula evidence exported from NDIE formula elements.",
        metrics: { formulaElements: formulaElements.length, required: needsFormulaEvidence }
      }),
      stageEvidence({
        stage: "VISUAL",
        importJob: input.importJob,
        providerStages: ["VISUAL_COMPLETED", "VISUAL_RUNNING", "READY_FOR_QUESTION_ENGINE"],
        ...visual,
        notes: "Visual evidence exported from NDIE visual elements and page assets.",
        metrics: { visualElements: visualElements.length, assets: input.importJob.assets.length, required: needsVisualEvidence }
      }),
      stageEvidence({
        stage: "AI_RECONSTRUCTION",
        importJob: input.importJob,
        providerStages: ["QUESTION_COMPLETED", "QUESTION_RUNNING", "READY_FOR_ANSWER_ENGINE"],
        ...reconstruction,
        notes: "Question reconstruction evidence exported from NDIE question candidates.",
        metrics: { questions: input.importJob.questionCandidates.length, averageConfidence: confidence(input.importJob.questionCandidates.map((candidate) => candidate.confidence)) }
      }),
      stageEvidence({
        stage: "TEACHER_REVIEW",
        importJob: input.importJob,
        ...review,
        notes: "Teacher review evidence exported from NDIE review decisions and candidate final statuses.",
        metrics: { candidates: input.importJob.questionCandidates.length, finalReviewCandidates: approvedOrFinal.length, reviewDecisions: input.importJob.reviewDecisions.length }
      }),
      stageEvidence({
        stage: "PUBLISH",
        importJob: input.importJob,
        providerStages: ["PUBLISH_COMPLETED", "PUBLISH_RUNNING", "READY_FOR_STUDENT_DELIVERY"],
        ...publish,
        notes: "Publish evidence exported from NDIE approved question links and CBT test id.",
        metrics: { testId: input.importJob.testId ?? null, publishedQuestions: publishedQuestions.length, answers: input.importJob.answerKeyCandidates.length, finalQuality: finalQuality?.overall ?? null }
      }),
      stageEvidence({
        stage: "CBT_RENDER",
        importJob: input.importJob,
        providerStages: ["DELIVERY_READY", "READY_FOR_STUDENT_DELIVERY"],
        ...cbtRender,
        notes: "CBT render evidence exported from NDIE delivery status.",
        metrics: { status: input.importJob.status, testId: input.importJob.testId ?? null }
      })
    ]
  };
}

export const realFileEvidenceExporterService = {
  async export(input: RealFileEvidenceExportInput): Promise<RealFileEvidenceExportResult> {
    const slot = REAL_FILE_BASELINE_SLOTS.find((candidate) => candidate.id === input.slotId);
    if (!slot) throw Object.assign(new Error(`Unknown real-file certification slot: ${input.slotId}`), { statusCode: 400 });

    const importJob = await prisma.ndieImportJob.findUnique({
      where: { id: input.importJobId },
      include: {
        sourceDocuments: true,
        pages: { orderBy: { pageNumber: "asc" } },
        assets: true,
        elements: true,
        questionCandidates: true,
        answerKeyCandidates: true,
        solutionCandidates: true,
        reviewDecisions: true,
        qualityScores: { orderBy: { createdAt: "desc" }, take: 1 },
        providerRuns: { orderBy: { startedAt: "desc" } },
        queueJobs: { orderBy: { queuedAt: "desc" } }
      }
    });
    if (!importJob) throw Object.assign(new Error(`NDIE import job not found: ${input.importJobId}`), { statusCode: 404 });

    const fixture = fixtureSource(slot.id);
    if (!fixture) throw Object.assign(new Error(`Real fixture source is missing for slot ${slot.id}`), { statusCode: 409 });

    const importChecksum = importJob.sourceDocuments[0]?.checksum ?? null;
    if (importChecksum && importChecksum !== fixture.sha256) {
      throw Object.assign(new Error("Fixture source hash does not match the NDIE import source checksum."), { statusCode: 409 });
    }

    const manifest = buildRealFilePipelineEvidence({
      slot,
      importJob,
      sourceSha256: fixture.sha256,
      executedBy: input.executedBy
    });

    const evidencePath = realFileBaselineService.expectedEvidenceFile(slot.id);
    if (input.write && evidencePath) {
      fs.writeFileSync(evidencePath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
    }

    return {
      slotId: slot.id,
      importJobId: input.importJobId,
      fixtureSourcePath: fixture.path,
      fixtureSourceSha256: fixture.sha256,
      sourceChecksumMatchesImport: !importChecksum || importChecksum === fixture.sha256,
      evidencePath,
      manifest,
      certificationPreview: realFileBaselineService.certifySlot(slot)
    };
  }
};
