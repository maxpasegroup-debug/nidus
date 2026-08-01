import { describe, expect, it } from "@jest/globals";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");

describe("NDIE Production Gate 1 safety hardening", () => {
  const routes = read("src/modules/ndie/ndie.routes.ts");
  const controller = read("src/modules/ndie/ndie.controller.ts");
  const service = read("src/modules/ndie/ndie.service.ts");
  const security = read("src/modules/ndie/security/ndie-security.ts");
  const sourceStorage = read("src/modules/ndie/source-storage/source-storage.service.ts");

  it("protects NDIE routes with auth, role checks, feature flag and sanitized error handling", () => {
    expect(routes).toContain("protect, allowRoles");
    expect(routes).toContain("requireNdieEnabled");
    expect(routes).toContain("ndieRouter.use(requireNdieEnabled)");
    expect(routes).toContain("ndieRouter.use(ndieErrorHandler)");
    expect(routes).toContain("Role.ADMIN");
    expect(routes).toContain("Role.DIRECTOR");
    expect(routes).toContain("Role.ACADEMIC_HEAD");
    expect(routes).toContain("Role.TEACHER");
  });

  it("rate limits NDIE uploads through the existing upload limiter", () => {
    expect(routes).toContain("uploadRateLimiter");
    expect(routes).toContain('ndieRouter.post("/imports", uploadRateLimiter, ndieUpload.single("file"), ndieController.createImport)');
  });

  it("centralizes NDIE upload validation and blocks broad media-only formats", () => {
    expect(controller).toContain("validateNdieUpload(req.file)");
    expect(security).toContain("export const ndieUpload = multer");
    expect(security).toContain("ndieAllowedMimeTypes");
    expect(security).toContain('"application/pdf"');
    expect(security).toContain('"application/vnd.openxmlformats-officedocument.wordprocessingml.document"');
    expect(security).toContain('"image/jpeg"');
    expect(security).toContain('"image/png"');
    expect(security).toContain('"text/plain"');
    expect(security).not.toContain('"video/mp4"');
    expect(security).not.toContain('"text/csv"');
    expect(security).not.toContain('"application/vnd.ms-powerpoint"');
  });

  it("checks file size and binary signatures before accepting NDIE imports", () => {
    expect(security).toContain("env.MAX_UPLOAD_MB");
    expect(security).toContain("hasMagicSignature(file)");
    expect(security).toContain('toString("utf8") === "%PDF"');
    expect(security).toContain("buffer[0] === 0x50 && buffer[1] === 0x4b");
    expect(security).toContain("Uploaded file signature does not match");
  });

  it("uses generated safe filenames and stores upload hashes for integrity", () => {
    expect(security).toContain("safeNdieFileName");
    expect(security).toContain("randomUUID");
    expect(sourceStorage).toContain("createHash(\"sha256\")");
    expect(sourceStorage).toContain("checksum: fileChecksum");
    expect(sourceStorage).toContain("safeNdieFileName(input.file.originalname, input.file.mimetype)");
  });

  it("enforces ownership before import, candidate, replay, review, quality and publish operations", () => {
    expect(service).toContain("assertNdieImportAccess(actor, importJobId");
    expect(service).toContain("assertNdieCandidateAccess(actor, input.candidateId");
    expect(service).toContain("assertNdieImportAccess(input.requester, input.importJobId, \"PUBLISH\")");
    expect(service).toContain("assertNdieImportAccess(actor, input.importJobId, \"WRITE\")");
    expect(service).toContain("assertNdieImportAccess(actor, importJobId, \"READ\")");
  });

  it("supports manager scope and teacher batch assignment checks to reduce IDOR risk", () => {
    expect(security).toContain("managerCanAccessImport");
    expect(security).toContain("actor.branchId");
    expect(security).toContain("actor.instituteId");
    expect(security).toContain("teacherCanAccessBatch");
    expect(security).toContain("prisma.teacherBatchAssignment.findFirst");
    expect(security).toContain("uploadedBy === actor.id");
    expect(security).toContain("NDIE import access denied");
  });

  it("audits sensitive NDIE actions through the existing AuditLog model", () => {
    expect(controller).toContain("auditNdie");
    expect(security).toContain("prisma.auditLog.create");
    expect(security).toContain('module: "ndie"');
    expect(security).toContain("NDIE_IMPORT_CREATED");
    expect(security).toContain("NDIE_REPLAY_REQUESTED");
    expect(security).toContain("NDIE_PUBLISH_REQUESTED");
    expect(security).toContain("NDIE_REVIEW_APPROVED");
    expect(security).toContain("NDIE_REVIEW_REJECTED");
  });

  it("does not leak internal NDIE errors to API callers", () => {
    expect(security).toContain("ndieErrorHandler");
    expect(security).toContain("NDIE request could not be completed");
    expect(security).toContain("logger.warn(\"NDIE route error\"");
    expect(security).not.toContain("stack:");
  });
});
