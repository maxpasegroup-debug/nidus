import { createHash } from "node:crypto";
import type { Prisma } from "../../../generated/prisma/client.js";
import { uploadBufferToCloudinary } from "../../../config/cloudinary.js";
import { env } from "../../../config/env.js";
import { prisma } from "../../../config/prisma.js";
import type { NdieImportManifest } from "../contracts/import-manifest.js";
import type { NdieCheckpoint } from "../contracts/pipeline-events.js";
import { ndieQueueService } from "../queue/queue.service.js";
import { safeNdieFileName } from "../security/ndie-security.js";
import type { NdieUploadSecurityResult } from "../security/compliance.service.js";

export type NdieCreateImportInput = {
  file: Express.Multer.File;
  userId: string;
  examId?: string;
  testId?: string;
  batchId?: string;
  subject?: string;
  topic?: string;
  sourceKind?: string;
  uploadSecurity?: NdieUploadSecurityResult;
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
    const fileChecksum = input.uploadSecurity?.sha256 ?? checksum(input.file.buffer);
    const duplicate = await prisma.ndieSourceDocument.findFirst({
      where: { checksum: fileChecksum },
      select: { id: true, importJobId: true, originalName: true, uploadedBy: true, createdAt: true },
      orderBy: { createdAt: "desc" }
    });

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
          fileName: safeNdieFileName(input.file.originalname, input.file.mimetype),
          fileType: input.file.mimetype,
          fileSize: input.file.size,
          storageProvider: "cloudinary",
          storageUrl: uploadResult.secureUrl,
          storagePublicId: uploadResult.publicId,
          checksum: fileChecksum,
          documentClass,
          pipeline,
          classification: {
            documentClass,
            pipeline,
            phase: "SOURCE_STORAGE",
            checksum: fileChecksum,
            security: input.uploadSecurity ?? null,
            duplicate: duplicate ? {
              sourceDocumentId: duplicate.id,
              importJobId: duplicate.importJobId,
              originalName: duplicate.originalName,
              uploadedBy: duplicate.uploadedBy,
              createdAt: duplicate.createdAt.toISOString()
            } : null,
            compliance: {
              encryptionAtRest: "provider-managed-required",
              retentionPolicy: "NDIE_RETENTION_DAYS",
              signedAssetLifecycle: "refresh-required",
              secureDeletion: "policy-hook"
            }
          },
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

    const queueJob = await ndieQueueService.enqueueImport({
      importJobId: created.importJob.id,
      sourceDocumentId: created.sourceDocument.id,
      fileType: input.file.mimetype
    });
    const queuedManifest: NdieImportManifest = {
      ...manifest,
      checkpoints: manifest.checkpoints.map((checkpoint) => {
        if (checkpoint.name === "READY_FOR_REVIEW") {
          return { ...checkpoint, status: "PENDING" };
        }
        return checkpoint;
      })
    };

    const importJob = await prisma.ndieImportJob.update({
      where: { id: created.importJob.id },
      data: {
        status: "QUEUED",
        currentCheckpoint: queueJob.stage,
        manifest: queuedManifest as unknown as Prisma.InputJsonValue
      }
    });

    return {
      ...created,
      importJob,
      manifest: queuedManifest,
      queueJob
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
        providerRuns: { orderBy: { startedAt: "desc" }, take: 20 },
        queueJobs: { orderBy: { queuedAt: "desc" }, take: 20 }
      }
    });
  }
};
