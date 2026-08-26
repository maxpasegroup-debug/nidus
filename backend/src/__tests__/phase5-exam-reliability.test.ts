import { describe, expect, it } from "@jest/globals";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { hasExpectedMediaSignature, safeMediaFileName } from "../modules/media/media-upload-security.js";

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");

describe("Phase 5 exam reliability protections", () => {
  it("accepts supported signatures and rejects MIME spoofing", () => {
    expect(hasExpectedMediaSignature(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), "image/png")).toBe(true);
    expect(hasExpectedMediaSignature(Buffer.from("not a png"), "image/png")).toBe(false);
    expect(hasExpectedMediaSignature(Buffer.from("%PDF-1.7"), "application/pdf")).toBe(true);
    expect(hasExpectedMediaSignature(Buffer.from([0x50, 0x4b, 0x03, 0x04]), "application/vnd.openxmlformats-officedocument.wordprocessingml.document")).toBe(true);
    expect(hasExpectedMediaSignature(Buffer.from("safe text", "utf8"), "text/plain")).toBe(true);
    expect(hasExpectedMediaSignature(Buffer.from([0x00, 0x01]), "text/plain")).toBe(false);
  });

  it("removes paths and unsafe characters from stored filenames", () => {
    expect(safeMediaFileName("../../unsafe exam (final).png")).toBe("unsafe-exam-final-.png");
    expect(safeMediaFileName("..\\..\\windows exam.png")).not.toContain("\\");
    expect(safeMediaFileName("..\\..\\windows exam.png")).not.toContain("/");
  });

  it("enforces one attempt per student and test at both schema and service layers", () => {
    const schema = read("prisma/schema.prisma");
    const service = read("src/modules/tests/tests.service.ts");
    const migration = read("prisma/migrations/20260824193000_enforce_single_test_attempt/migration.sql");
    expect(schema).toContain("@@unique([userId, testId])");
    expect(service).toContain("userId_testId");
    expect(service).toContain('error as { code?: string }).code !== "P2002"');
    expect(migration).toContain('CREATE UNIQUE INDEX "TestAttempt_userId_testId_key"');
    expect(migration).toContain('("userId", "testId")');
  });

  it("does not spend the credential limiter budget on authenticated profile reads", () => {
    const app = read("src/app.ts");
    expect(app).toContain('"/api/auth/login"');
    expect(app).not.toContain('app.use("/api/auth", authRateLimiter)');
  });

  it("scopes media and document queries through the authenticated uploader institution", () => {
    const service = read("src/modules/media/media.service.ts");
    const controller = read("src/modules/media/media.controller.ts");
    expect(service).toContain("uploaderScope(requester)");
    expect(service).toContain("creatorScope(requester)");
    expect(controller).toContain("req.user.instituteId");
    expect(controller).toContain("mediaService.deleteFile(getParam(req, \"id\"), requester)");
  });
});
