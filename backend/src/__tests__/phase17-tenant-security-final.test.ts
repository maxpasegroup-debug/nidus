import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "@jest/globals";

describe("Phase 17 final tenant security closure", () => {
  const run = process.env.NIDUS_PHASE17_HTTP_E2E === "1" ? it : it.skip;
  run("generates the final route ledger from real staging HTTP evidence", () => {
    const backend = process.cwd();
    const tsxCli = path.resolve(backend, "..", "node_modules", "tsx", "dist", "cli.mjs");
    execFileSync(process.execPath, [tsxCli, "src/scripts/phase17-final-tenant-security.ts"], { cwd: backend, stdio: "inherit", env: process.env });
    const report = JSON.parse(fs.readFileSync(path.join(backend, "..", "docs", "phase17-final-tenant-security-certification.json"), "utf8")) as { totalSensitiveRoutes: number; httpChecksPassed: number; certification: string };
    expect(report.totalSensitiveRoutes).toBe(125);
    expect(report.httpChecksPassed).toBeGreaterThan(0);
    expect(["CERTIFIED", "NOT_CERTIFIED"]).toContain(report.certification);
  });
});
