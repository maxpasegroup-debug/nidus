import { createHash } from "node:crypto";
import type { Prisma } from "../../../generated/prisma/client.js";
import { uploadBufferToCloudinary } from "../../../config/cloudinary.js";
import { env } from "../../../config/env.js";
import { prisma } from "../../../config/prisma.js";
import type { NdieImportManifest } from "../contracts/import-manifest.js";
import type { NdieCheckpoint } from "../contracts/pipeline-events.js";
import { ndieAnswerKeyMapperService } from "../answer-key-mapper/answer-key-mapper.service.js";
import { ndieAiValidatorService } from "../ai-validator/ai-validator.service.js";
import { ndieLayoutAnalyzerService } from "../layout-analyzer/layout-analyzer.service.js";
import { ndieOcrService } from "../ocr/ocr.service.js";
import { ndiePdfRendererService } from "../pdf-renderer/pdf-renderer.service.js";
import { ndieQuestionDetectorService } from "../question-detector/question-detector.service.js";
import { ndieVisualDetectorService } from "../visual-detector/visual-detector.service.js";

export type NdieCreateImportInput = {
  file: Express.Multer.File;
  userId: string;
  examId?: string;
  testId?: string;
  batchId?: string;
  subject?: string;
  topic?: string;
  sourceKind?: string;
};

function normalizedSourceKind(value?: string) {
  const normalized = String(value || "QUESTION_PAPER").trim().toUpperCase().replace(/[^A-Z0-9_]/g, "_");
  return normalized || "QUESTION_PAPER";
}

function documentClassForMime(fileType: string) {
  if (fileType === "application/pdf") return "PDF";
  if (fileType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") return "DOCX";
  if (fileType === "application/msword") return "DOC";
  if (fileType.startsWith("image/")) return "IMAGE";
  if (fileType === "text/plain") return "TEXT";
  return "UNKNOWN";
}

function pipelineForDocumentClass(documentClass: string) {
  if (documentClass === "PDF") return "PDF_RENDER_PENDING";
  if (documentClass === "DOCX" || documentClass === "DOC") return "DOCX_PARSE_PENDING";
  if (documentClass === "IMAGE") return "IMAGE_OCR_PENDING";
  if (documentClass === "TEXT") return "TEXT_ANALYSIS_PENDING";
  return "CLASSIFICATION_REQUIRED";
}

function checksum(buffer: Buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

function foundationCheckpoints(sourceStored: boolean): NdieCheckpoint[] {
  return [
    { name: "IMPORT_CREATED", status: "SUCCEEDED", retryable: false, completedAt: new Date().toISOString() },
    { name: "SOURCE_STORED", status: sourceStored ? "SUCCEEDED" : "FAILED", retryable: true, completedAt: sourceStored ? new Date().toISOString() : undefined },
    { name: "DOCUMENT_CLASSIFIED", status: "PENDING", retryable: true },
    { name: "PAGES_RENDERED", status: "PENDING", retryable: true },
    { name: "OCR_COMPLETED", status: "PENDING", retryable: true },
    { name: "LAYOUT_ANALYZED", status: "PENDING", retryable: true },
    { name: "FORMULAS_DETECTED", status: "PENDING", retryable: true },
    { name: "VISUALS_DETECTED", status: "PENDING", retryable: true },
    { name: "QUESTIONS_DETECTED", status: "PENDING", retryable: true },
    { name: "OPTIONS_DETECTED", status: "PENDING", retryable: true },
    { name: "ANSWER_KEYS_MAPPED", status: "PENDING", retryable: true },
    { name: "SOLUTIONS_MAPPED", status: "PENDING", retryable: true },
    { name: "AI_VALIDATED", status: "PENDING", retryable: true },
    { name: "CONFIDENCE_SCORED", status: "PENDING", retryable: true },
    { name: "READY_FOR_REVIEW", status: "PENDING", retryable: true }
  ];
}

function buildManifest(input: {
  file: Express.Multer.File;
  sourceKind: string;
  pageCount: number | null;
  checkpoints: NdieCheckpoint[];
}): NdieImportManifest {
  return {
    source: input.file.originalname,
    sourceKind: input.sourceKind,
    fileType: input.file.mimetype,
    fileSize: input.file.size,
    pages: input.pageCount,
    questionsDetected: 0,
    formulaCount: 0,
    tables: 0,
    diagrams: 0,
    graphs: 0,
    ocrConfidence: null,
    quality: "Not Scored",
    pipelineVersion: env.NDIE_PIPELINE_VERSION,
    checkpoints: input.checkpoints.map((checkpoint) => ({ name: checkpoint.name, status: checkpoint.status }))
  };
}

export const ndieSourceStorageService = {
  async createImport(input: NdieCreateImportInput) {
    if (!env.NDIE_SERVER_IMPORT_ENABLED) {
      throw new Error("NDIE server import is disabled. Set NDIE_SERVER_IMPORT_ENABLED=true to enable Phase 3 source preservation.");
    }

    const sourceKind = normalizedSourceKind(input.sourceKind);
    const documentClass = documentClassForMime(input.file.mimetype);
    const pipeline = pipelineForDocumentClass(documentClass);
    const pageCount = input.file.mimetype.startsWith("image/") ? 1 : null;
    const checkpoints = foundationCheckpoints(true);
    const manifest = buildManifest({ file: input.file, sourceKind, pageCount, checkpoints });
    const uploadResult = await uploadBufferToCloudinary(input.file, "nidus/ndie/sources");
    const fileChecksum = checksum(input.file.buffer);

    const created = await prisma.$transaction(async (tx) => {
      const importJob = await tx.ndieImportJob.create({
        data: {
          examId: input.examId || null,
          testId: input.testId || null,
          batchId: input.batchId || null,
          subject: input.subject || null,
          topic: input.topic || null,
          sourceKind,
          status: "SOURCE_STORED",
          reviewStatus: "PENDING_REVIEW",
          pipelineVersion: env.NDIE_PIPELINE_VERSION,
          manifest: manifest as unknown as Prisma.InputJsonValue,
          checkpoints: checkpoints as unknown as Prisma.InputJsonValue,
          currentCheckpoint: "SOURCE_STORED",
          uploadedBy: input.userId
        }
      });

      const sourceDocument = await tx.ndieSourceDocument.create({
        data: {
          importJobId: importJob.id,
          sourceKind,
          originalName: input.file.originalname,
          fileName: input.file.originalname.replace(/\s+/g, "-"),
          fileType: input.file.mimetype,
          fileSize: input.file.size,
          storageProvider: "cloudinary",
          storageUrl: uploadResult.secureUrl,
          storagePublicId: uploadResult.publicId,
          checksum: fileChecksum,
          documentClass,
          pipeline,
          classification: { documentClass, pipeline, phase: "SOURCE_STORAGE" },
          pageCount,
          preservationState: "PRESERVED",
          uploadedBy: input.userId
        }
      });

      return {
        importJob,
        sourceDocument,
        manifest
      };
    });

    const renderResult = await ndiePdfRendererService.renderSourceDocument({
      importJobId: created.importJob.id,
      sourceDocumentId: created.sourceDocument.id,
      fileType: input.file.mimetype,
      fileBuffer: input.file.buffer,
      storageUrl: uploadResult.secureUrl,
      storagePublicId: uploadResult.publicId
    });

    const ocrResult = await ndieOcrService.runOcr(created.importJob.id);
    const layoutResult = await ndieLayoutAnalyzerService.analyzeImport(created.importJob.id);
    const visualResult = await ndieVisualDetectorService.detectImport(created.importJob.id);
    const questionResult = await ndieQuestionDetectorService.detectImport(created.importJob.id);
    const answerResult = await ndieAnswerKeyMapperService.mapImport(created.importJob.id);
    const aiResult = await ndieAiValidatorService.validateImport(created.importJob.id);
    const completedManifest: NdieImportManifest = {
      ...manifest,
      pages: renderResult.pageCount,
      questionsDetected: questionResult.questionsDetected,
      formulaCount: visualResult.formulaCount,
      tables: visualResult.tableCount,
      diagrams: visualResult.diagramCount,
      graphs: visualResult.graphCount,
      ocrConfidence: null,
      checkpoints: manifest.checkpoints.map((checkpoint) => {
        if (["DOCUMENT_CLASSIFIED", "PAGES_RENDERED", "OCR_COMPLETED", "LAYOUT_ANALYZED", "FORMULAS_DETECTED", "VISUALS_DETECTED", "QUESTIONS_DETECTED", "OPTIONS_DETECTED", "ANSWER_KEYS_MAPPED", "SOLUTIONS_MAPPED", "AI_VALIDATED", "CONFIDENCE_SCORED"].includes(checkpoint.name)) {
          return { ...checkpoint, status: "SUCCEEDED" };
        }
        return checkpoint;
      })
    };

    await prisma.ndieImportJob.update({
      where: { id: created.importJob.id },
      data: {
        status: "READY_FOR_REVIEW",
        currentCheckpoint: "READY_FOR_REVIEW",
        manifest: completedManifest as unknown as Prisma.InputJsonValue
      }
    });

    return {
      ...created,
      manifest: completedManifest,
      renderResult,
      ocrResult,
      layoutResult,
      visualResult,
      questionResult,
      answerResult,
      aiResult
    };
  },

  async getImport(importJobId: string) {
    return prisma.ndieImportJob.findUnique({
      where: { id: importJobId },
      include: {
        sourceDocuments: true,
        pages: { orderBy: { pageNumber: "asc" } },
        assets: true,
        qualityScores: { orderBy: { createdAt: "desc" }, take: 1 },
        providerRuns: { orderBy: { startedAt: "desc" }, take: 20 }
      }
    });
  }
};
