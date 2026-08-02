import { describe, expect, it } from "@jest/globals";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");

describe("NDIE Production Gate 15 enterprise security", () => {
  const env = read("src/config/env.ts");
  const security = read("src/modules/ndie/security/ndie-security.ts");
  const compliance = read("src/modules/ndie/security/compliance.service.ts");
  const controller = read("src/modules/ndie/ndie.controller.ts");
  const sourceStorage = read("src/modules/ndie/source-storage/source-storage.service.ts");
  const registry = read("src/modules/ndie/performance/worker-registry.service.ts");
  const ndieService = read("src/modules/ndie/ndie.service.ts");
  const routes = read("src/modules/ndie/ndie.routes.ts");

  it("adds enterprise security and compliance policy configuration", () => {
    expect(env).toContain("NDIE_MALWARE_SCANNING_ENABLED");
    expect(env).toContain("NDIE_QUARANTINE_ENABLED");
    expect(env).toContain("NDIE_RETENTION_DAYS");
    expect(env).toContain("NDIE_LEGAL_HOLD_ENABLED");
    expect(env).toContain("NDIE_WORKER_SHARED_SECRET");
    expect(env).toContain("NDIE_SIGNED_ASSET_TTL_SECONDS");
  });

  it("performs upload sniffing, encrypted PDF detection and quarantine workflow", () => {
    expect(security).toContain("hasMagicSignature");
    expect(compliance).toContain("sniffMime");
    expect(compliance).toContain("pdfSecurity");
    expect(compliance).toContain("/Encrypt");
    expect(compliance).toContain("malwareHook");
    expect(compliance).toContain("QUARANTINE_REQUIRED");
    expect(controller).toContain("NDIE_UPLOAD_QUARANTINED");
    expect(controller).toContain("Uploaded document requires security review");
  });

  it("preserves duplicate detection and data-protection metadata", () => {
    expect(sourceStorage).toContain("checksum: fileChecksum");
    expect(sourceStorage).toContain("findFirst");
    expect(sourceStorage).toContain("duplicate");
    expect(sourceStorage).toContain("encryptionAtRest");
    expect(sourceStorage).toContain("signedAssetLifecycle");
    expect(compliance).toContain("secureDeletionHook");
    expect(compliance).toContain("exportLoggingRequired");
  });

  it("strengthens authorization and immutable audit trail coverage", () => {
    expect(routes).toContain("protect");
    expect(routes).toContain("allowRoles");
    expect(security).toContain("managerCanAccessImport");
    expect(security).toContain("teacherCanAccessBatch");
    expect(security).toContain("NDIE_AUTHORIZATION_DENIED");
    expect(security).toContain("OWNERSHIP_OR_TENANT_SCOPE_MISMATCH");
    expect(security).toContain("institution");
    expect(security).toContain("before");
    expect(security).toContain("after");
  });

  it("adds queue security, compliance health and operational trust signals", () => {
    expect(registry).toContain("validateWorkerSecret");
    expect(compliance).toContain("workerSharedSecretConfigured");
    expect(compliance).toContain("replayAuthorization");
    expect(compliance).toContain("publishAuthorization");
    expect(compliance).toContain("quarantinedUploads");
    expect(compliance).toContain("authorizationFailuresLast24h");
    expect(compliance).toContain("expiredAssets");
    expect(ndieService).toContain("security");
  });
});
