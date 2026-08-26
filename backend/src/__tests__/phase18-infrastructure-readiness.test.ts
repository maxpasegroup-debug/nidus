import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "@jest/globals";

describe("Phase 18 infrastructure readiness evidence", () => {
  it("does not claim unavailable infrastructure is ready", () => {
    const report = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), "..", "docs", "phase18-production-readiness.json"), "utf8")) as { finalDecision: string; categories: Record<string, { status: string }> };
    expect(report.finalDecision).toBe("NO");
    expect(report.categories.redis.status).toBe("BLOCKED — ENVIRONMENT");
    expect(report.categories.backupRecovery.status).toBe("BLOCKED — ENVIRONMENT");
  });
});
