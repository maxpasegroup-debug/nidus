import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

describe("NDIE staging storage safety", () => {
  beforeEach(() => {
    jest.resetModules();
    Object.assign(process.env, { NODE_ENV: "test" });
    process.env.DATABASE_URL = process.env.DATABASE_URL || "postgresql://unused:unused@127.0.0.1:1/unused";
    process.env.JWT_SECRET = "phase6-test-secret-that-is-longer-than-thirty-two-characters";
    process.env.NDIE_LOCAL_STORAGE_ENABLED = "true";
  });

  it("preserves bytes and reads only from the configured root", async () => {
    const root = await mkdtemp(join(tmpdir(), "nidus-ndie-stage-"));
    process.env.NDIE_LOCAL_STORAGE_ROOT = root;
    const { LocalNdieAssetStorageProvider, readNdieStoredUrl } = await import("../modules/ndie/storage/storage-provider.js");
    const source = Buffer.from("real academic evidence bytes");
    const stored = await new LocalNdieAssetStorageProvider().uploadPageImage({ buffer: source, fileName: "page.png", folder: "safe/pages", mimeType: "image/png" });
    expect(stored.storageProvider).toBe("local-staging");
    expect(await readNdieStoredUrl(stored.secureUrl)).toEqual(source);
    expect(await readFile(new URL(stored.secureUrl))).toEqual(source);
  });

  it("refuses local storage in production", async () => {
    jest.resetModules();
    Object.assign(process.env, { NODE_ENV: "production" });
    process.env.NDIE_LOCAL_STORAGE_ENABLED = "true";
    process.env.CORS_ORIGIN = "https://nidusacademy.in";
    await expect(import("../config/env.js")).rejects.toThrow("NDIE_LOCAL_STORAGE_ENABLED is forbidden in production");
  });
});
