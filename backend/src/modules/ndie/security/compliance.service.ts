import { createHash } from "node:crypto";
import { prisma } from "../../../config/prisma.js";
import { env } from "../../../config/env.js";

export type NdieUploadSecurityResult = {
  status: "ACCEPTED" | "QUARANTINE_REQUIRED";
  sha256: string;
  mimeSniffed: string;
  encrypted: boolean;
  passwordProtected: boolean;
  malwareScan: {
    enabled: boolean;
    status: "SKIPPED" | "CLEAN" | "SUSPICIOUS";
    reason: string;
  };
  quarantineReasons: string[];
};

function sha256(buffer: Buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

function sniffMime(buffer: Buffer) {
  if (buffer.subarray(0, 4).toString("utf8") === "%PDF") return "application/pdf";
  if (buffer[0] === 0x50 && buffer[1] === 0x4b) return "application/zip";
  if (buffer.subarray(0, 8).equals(Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]))) return "application/msword";
  if (buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return "image/jpeg";
  if (["GIF87a", "GIF89a"].includes(buffer.subarray(0, 6).toString("ascii"))) return "image/gif";
  if (buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP") return "image/webp";
  if (buffer.subarray(0, 4).equals(Buffer.from([0x49, 0x49, 0x2a, 0x00])) || buffer.subarray(0, 4).equals(Buffer.from([0x4d, 0x4d, 0x00, 0x2a]))) return "image/tiff";
  if (buffer.subarray(4, 8).toString("ascii") === "ftyp" && /heic|heix|hevc|heif|mif1/.test(buffer.subarray(8, 16).toString("ascii"))) return "image/heic";
  return buffer.subarray(0, Math.min(buffer.length, 512)).includes(0) ? "application/octet-stream" : "text/plain";
}

function pdfSecurity(buffer: Buffer) {
  const sample = buffer.subarray(0, Math.min(buffer.length, 2_000_000)).toString("latin1");
  const encrypted = /\/Encrypt\b/.test(sample);
  return {
    encrypted,
    passwordProtected: encrypted || /\/Filter\s*\/Standard\b/.test(sample)
  };
}

function malwareHook(buffer: Buffer) {
  if (!env.NDIE_MALWARE_SCANNING_ENABLED) {
    return { enabled: false, status: "SKIPPED" as const, reason: "Malware scanner hook disabled; external scanner can be attached without changing NDIE." };
  }
  const sample = buffer.subarray(0, Math.min(buffer.length, 4096)).toString("latin1").toLowerCase();
  const suspicious = sample.includes("<script") || sample.includes("eicar-standard-antivirus-test-file") || sample.includes("/javascript");
  return {
    enabled: true,
    status: suspicious ? "SUSPICIOUS" as const : "CLEAN" as const,
    reason: suspicious ? "Suspicious script or antivirus test signature detected." : "No suspicious signature detected by local hook."
  };
}

function mimeMatches(declared: string, detected: string) {
  if (declared === detected) return true;
  if (detected === "application/zip" && declared === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") return true;
  if (detected === "text/plain" && ["text/plain", "text/csv"].includes(declared)) return true;
  return false;
}

export const ndieComplianceService = {
  inspectUpload(file: Express.Multer.File): NdieUploadSecurityResult {
    const checksum = sha256(file.buffer);
    const mimeSniffed = sniffMime(file.buffer);
    const pdf = file.mimetype === "application/pdf" || mimeSniffed === "application/pdf" ? pdfSecurity(file.buffer) : { encrypted: false, passwordProtected: false };
    const malwareScan = malwareHook(file.buffer);
    const quarantineReasons = [
      !mimeMatches(file.mimetype, mimeSniffed) ? "MIME_SIGNATURE_MISMATCH" : "",
      pdf.passwordProtected ? "PASSWORD_PROTECTED_DOCUMENT" : "",
      pdf.encrypted ? "ENCRYPTED_DOCUMENT" : "",
      malwareScan.status === "SUSPICIOUS" ? "MALWARE_HOOK_SUSPICIOUS" : ""
    ].filter(Boolean);
    return {
      status: quarantineReasons.length && env.NDIE_QUARANTINE_ENABLED ? "QUARANTINE_REQUIRED" : "ACCEPTED",
      sha256: checksum,
      mimeSniffed,
      encrypted: pdf.encrypted,
      passwordProtected: pdf.passwordProtected,
      malwareScan,
      quarantineReasons
    };
  },

  policies() {
    return {
      retention: {
        days: env.NDIE_RETENTION_DAYS,
        legalHoldEnabled: env.NDIE_LEGAL_HOLD_ENABLED,
        secureDeletionHook: "policy-hook",
        exportLoggingRequired: true
      },
      dataProtection: {
        encryptionAtRest: "provider-managed-required",
        signedAssetTtlSeconds: env.NDIE_SIGNED_ASSET_TTL_SECONDS,
        urlRefreshHook: "storage-provider-refresh",
        auditExport: "audit-log-backed"
      },
      uploadSecurity: {
        mimeSniffing: true,
        magicBytes: true,
        malwareScanningHook: env.NDIE_MALWARE_SCANNING_ENABLED,
        quarantineEnabled: env.NDIE_QUARANTINE_ENABLED,
        duplicateDetection: "sha256"
      },
      queueSecurity: {
        replayAuthorization: "ownership-and-role",
        publishAuthorization: "ownership-and-publish-role",
        cancelAuthorization: "ownership-and-write-role",
        workerSharedSecretConfigured: Boolean(env.NDIE_WORKER_SHARED_SECRET),
        heartbeatValidation: true
      }
    };
  },

  validateWorkerSecret(secret?: string | null) {
    if (!env.NDIE_WORKER_SHARED_SECRET) return { valid: true, mode: "UNCONFIGURED_DEV_HOOK" };
    return { valid: secret === env.NDIE_WORKER_SHARED_SECRET, mode: "SHARED_SECRET" };
  },

  async health() {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [auditCoverage, securityEvents, quarantinedUploads, authorizationFailures, integrityFailures, expiredAssets] = await Promise.all([
      prisma.auditLog.count({ where: { module: "ndie" } }),
      prisma.auditLog.count({ where: { module: "ndie", createdAt: { gte: since }, action: { contains: "SECURITY" } } }),
      prisma.auditLog.count({ where: { module: "ndie", action: "NDIE_UPLOAD_QUARANTINED" } }),
      prisma.auditLog.count({ where: { module: "ndie", action: "NDIE_AUTHORIZATION_DENIED", createdAt: { gte: since } } }),
      prisma.ndieProviderRun.count({ where: { providerKind: "PUBLISHER", stage: "PUBLISH_COMPLETED", outputSummary: { path: ["integrity", "status"], equals: "BLOCKED" } } }),
      prisma.ndiePageAsset.count({ where: { createdAt: { lt: new Date(Date.now() - env.NDIE_SIGNED_ASSET_TTL_SECONDS * 1000) } } })
    ]);
    return {
      status: "ready",
      securityVersion: "ndie-enterprise-security-v1",
      auditCoverage,
      securityEventsLast24h: securityEvents,
      quarantinedUploads,
      authorizationFailuresLast24h: authorizationFailures,
      integrityFailures,
      expiredAssets,
      policies: this.policies()
    };
  }
};
