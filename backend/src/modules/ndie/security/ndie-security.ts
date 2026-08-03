import { randomUUID } from "node:crypto";
import { extname } from "node:path";
import type { NextFunction, Response } from "express";
import multer from "multer";
import { Prisma, Role } from "../../../generated/prisma/client.js";
import { prisma } from "../../../config/prisma.js";
import { env } from "../../../config/env.js";
import type { AuthenticatedRequest } from "../../../middlewares/session.middleware.js";
import { logger } from "../../../utils/logger.js";

export type NdieActor = {
  id: string;
  role: Role;
  instituteId?: string | null;
  branchId?: string | null;
  roleMetadata?: Record<string, unknown> | null;
};

export type NdieAuditAction =
  | "NDIE_IMPORT_CREATED"
  | "NDIE_IMPORT_VIEWED"
  | "NDIE_IMPORT_UPDATED"
  | "NDIE_IMPORT_CANCELLED"
  | "NDIE_REPLAY_REQUESTED"
  | "NDIE_PUBLISH_REQUESTED"
  | "NDIE_REVIEW_APPROVED"
  | "NDIE_REVIEW_REJECTED"
  | "NDIE_REVIEW_NEEDS_EDIT"
  | "NDIE_REVIEW_BULK_UPDATED"
  | "NDIE_REVIEW_SESSION_SAVED"
  | "NDIE_QUALITY_REPORT_REQUESTED"
  | "NDIE_ANALYTICS_VIEWED"
  | "NDIE_OPERATIONS_VIEWED"
  | "NDIE_DIAGNOSTICS_VIEWED"
  | "NDIE_TIMELINE_VIEWED"
  | "NDIE_UPLOAD_QUARANTINED"
  | "NDIE_SECURITY_EVENT"
  | "NDIE_AUTHORIZATION_DENIED"
  | "NDIE_EXPORT_REQUESTED";

const managementRoles = new Set<Role>([Role.ADMIN, Role.DIRECTOR, Role.ACADEMIC_HEAD]);
const teacherRoles = new Set<Role>([Role.TEACHER, Role.PHYSICAL_TRAINER]);

function statusError(message: string, statusCode: number) {
  return Object.assign(new Error(message), { statusCode });
}

export function ndieActorFromRequest(req: AuthenticatedRequest): NdieActor {
  if (!req.user) throw statusError("Authentication required", 401);
  return {
    id: req.user.id,
    role: req.user.role,
    instituteId: req.user.instituteId,
    branchId: req.user.branchId,
    roleMetadata: req.user.roleMetadata
  };
}

export function isNdieManager(actor: NdieActor) {
  return managementRoles.has(actor.role);
}

function managerCanAccessImport(
  actor: NdieActor,
  importJob: {
    uploadedBy: string;
    batchId?: string | null;
    batch?: { instituteId?: string | null; branchId?: string | null } | null;
  }
) {
  if (!isNdieManager(actor)) return false;
  if (actor.role === Role.ADMIN && !actor.instituteId && !actor.branchId) return true;
  if (importJob.uploadedBy === actor.id) return true;
  if (!actor.instituteId && !actor.branchId) return true;
  if (!importJob.batchId || !importJob.batch) return false;
  if (actor.branchId) return importJob.batch.branchId === actor.branchId;
  if (actor.instituteId) return importJob.batch.instituteId === actor.instituteId;
  return false;
}

async function teacherCanAccessBatch(actor: NdieActor, batchId?: string | null, subject?: string | null) {
  if (!teacherRoles.has(actor.role) || !batchId) return false;
  const assignment = await prisma.teacherBatchAssignment.findFirst({
    where: {
      batchId,
      teacherId: actor.id,
      status: "ACTIVE",
      ...(subject?.trim() ? { subject: { equals: subject.trim(), mode: "insensitive" } } : {})
    },
    select: { id: true }
  });
  return Boolean(assignment);
}

export async function assertNdieImportAccess(actor: NdieActor, importJobId: string, mode: "READ" | "WRITE" | "PUBLISH" = "READ") {
  const importJob = await prisma.ndieImportJob.findUnique({
    where: { id: importJobId },
    select: {
      id: true,
      uploadedBy: true,
      batchId: true,
      subject: true,
      status: true,
      reviewStatus: true,
      batch: {
        select: {
          instituteId: true,
          branchId: true
        }
      }
    }
  });
  if (!importJob) throw statusError("NDIE import not found", 404);

  if (managerCanAccessImport(actor, importJob)) return importJob;
  if (teacherRoles.has(actor.role)) {
    const ownsImport = importJob.uploadedBy === actor.id;
    const hasBatchAccess = await teacherCanAccessBatch(actor, importJob.batchId, importJob.subject);
    if (ownsImport || hasBatchAccess) return importJob;
  }

  logger.warn("NDIE import access denied", { actorId: actor.id, role: actor.role, instituteId: actor.instituteId, branchId: actor.branchId, importJobId, mode });
  await auditNdie({
    actor,
    action: "NDIE_AUTHORIZATION_DENIED",
    description: "NDIE authorization denied",
    metadata: { importJobId, mode, resource: "NdieImportJob", result: "DENIED", reason: "OWNERSHIP_OR_TENANT_SCOPE_MISMATCH" }
  });
  throw statusError("NDIE import access denied", 403);
}

export async function assertNdieCandidateAccess(actor: NdieActor, candidateId: string, mode: "READ" | "WRITE" = "WRITE") {
  const candidate = await prisma.ndieQuestionCandidate.findUnique({
    where: { id: candidateId },
    select: { id: true, importJobId: true }
  });
  if (!candidate) throw statusError("NDIE question candidate not found", 404);
  await assertNdieImportAccess(actor, candidate.importJobId, mode);
  return candidate;
}

export async function auditNdie(input: {
  actor?: NdieActor;
  action: NdieAuditAction;
  description: string;
  ipAddress?: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: input.actor?.id ?? null,
        action: input.action,
        module: "ndie",
        description: JSON.stringify({
          message: input.description,
          actor: input.actor ? {
            id: input.actor.id,
            role: input.actor.role,
            institution: input.actor.instituteId ?? null,
            branch: input.actor.branchId ?? null
          } : null,
          resource: input.metadata?.resource ?? input.metadata?.importJobId ?? input.metadata?.candidateId ?? null,
          result: input.metadata?.result ?? "RECORDED",
          reason: input.metadata?.reason ?? null,
          before: input.metadata?.before ?? null,
          after: input.metadata?.after ?? null,
          metadata: input.metadata ?? {},
          timestamp: new Date().toISOString()
        }),
        ipAddress: input.ipAddress ?? null
      }
    });
  } catch (error) {
    logger.warn("NDIE audit logging failed", {
      action: input.action,
      actorId: input.actor?.id,
      error: error instanceof Error ? error.message : "Unknown error",
      metadata: input.metadata
    });
  }
}

export const ndieAllowedMimeTypes = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "text/plain"
]);

function hasMagicSignature(file: Express.Multer.File) {
  const buffer = file.buffer;
  if (!buffer?.length) return false;
  const mime = file.mimetype;
  if (mime === "application/pdf") return buffer.subarray(0, 4).toString("utf8") === "%PDF";
  if (mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") return buffer[0] === 0x50 && buffer[1] === 0x4b;
  if (mime === "image/png") return buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  if (mime === "image/jpeg") return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  if (mime === "image/gif") return ["GIF87a", "GIF89a"].includes(buffer.subarray(0, 6).toString("ascii"));
  if (mime === "image/webp") return buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP";
  if (mime === "text/plain") return !buffer.subarray(0, Math.min(buffer.length, 512)).includes(0);
  return false;
}

export function safeNdieFileName(originalName: string, mimeType: string) {
  const originalExtension = extname(originalName).toLowerCase().replace(/[^.a-z0-9]/g, "");
  const fallbackExtension =
    mimeType === "application/pdf" ? ".pdf" :
    mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ? ".docx" :
    mimeType === "image/jpeg" ? ".jpg" :
    mimeType === "image/png" ? ".png" :
    mimeType === "image/webp" ? ".webp" :
    mimeType === "image/gif" ? ".gif" :
    mimeType === "text/plain" ? ".txt" :
    "";
  return `ndie-${randomUUID()}${originalExtension || fallbackExtension}`;
}

export function validateNdieUpload(file?: Express.Multer.File) {
  if (!file) throw statusError("Upload a PDF, DOCX, image, or TXT source file.", 400);
  if (!ndieAllowedMimeTypes.has(file.mimetype)) {
    throw statusError("Unsupported NDIE file type. Upload PDF, DOCX, JPG, PNG, WEBP, GIF, or TXT only.", 415);
  }
  if (file.size > env.MAX_UPLOAD_MB * 1024 * 1024) {
    throw statusError(`File exceeds ${env.MAX_UPLOAD_MB}MB upload limit.`, 413);
  }
  if (!hasMagicSignature(file)) {
    throw statusError("Uploaded file signature does not match its document type.", 415);
  }
}

export const ndieUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: env.MAX_UPLOAD_MB * 1024 * 1024
  },
  fileFilter: (_req, file, callback) => {
    if (!ndieAllowedMimeTypes.has(file.mimetype)) {
      callback(statusError("Unsupported NDIE file type. Upload PDF, DOCX, JPG, PNG, WEBP, GIF, or TXT only.", 415));
      return;
    }
    callback(null, true);
  }
});

export function requireNdieEnabled(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!env.NDIE_ENABLED) {
    res.status(503).json({ success: false, message: "NDIE is not enabled for this environment." });
    return;
  }
  next();
}

export function ndieErrorHandler(error: unknown, req: AuthenticatedRequest, res: Response, _next: NextFunction) {
  const candidate = error as { statusCode?: number; status?: number; code?: unknown; message?: string };
  const statusCode =
    typeof candidate.statusCode === "number" ? candidate.statusCode :
    typeof candidate.status === "number" ? candidate.status :
    candidate instanceof Prisma.PrismaClientKnownRequestError ? 400 :
    500;
  const safeMessage = statusCode >= 500 ? "NDIE request could not be completed. Please try again or contact support." : candidate.message || "NDIE request could not be completed.";

  logger.warn("NDIE route error", {
    requestId: req.requestId,
    method: req.method,
    path: req.originalUrl,
    statusCode,
    actorId: req.user?.id,
    error: candidate.message || "Unknown error"
  });

  res.status(statusCode).json({
    success: false,
    message: safeMessage,
    code: statusCode
  });
}
