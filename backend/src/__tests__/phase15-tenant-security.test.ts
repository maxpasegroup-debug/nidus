import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "@jest/globals";

describe("Phase 15 complete HTTP tenant certification", () => {
  const run = process.env.NIDUS_PHASE15_HTTP_E2E === "1" ? it : it.skip;
  run("executes the expanded two-institution route certification", () => {
    const backend = process.cwd();
    const tsxCli = path.resolve(backend, "..", "node_modules", "tsx", "dist", "cli.mjs");
    execFileSync(process.execPath, [tsxCli, "src/scripts/phase15-http-tenant-certification.ts"], { cwd: backend, stdio: "inherit", env: { ...process.env, NIDUS_PHASE15_SKIP_PHASE14: "1" } });
    const root = path.resolve(backend, "..");
    const report = JSON.parse(fs.readFileSync(path.join(root, "docs", "phase15-tenant-security-certification.json"), "utf8")) as { totalHttpTests: number; passed: number; failed: number };
    expect(report.totalHttpTests).toBeGreaterThan(0);
    expect(report.failed).toBe(0);
    expect(report.passed).toBe(report.totalHttpTests);
  });
});
