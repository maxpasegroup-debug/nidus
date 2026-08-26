import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "@jest/globals";

describe("Phase 16 final security route closure", () => {
  const run = process.env.NIDUS_PHASE16_HTTP_E2E === "1" ? it : it.skip;
  run("executes remaining security checks against disposable staging PostgreSQL", () => {
    const backend = process.cwd();
    const tsxCli = path.resolve(backend, "..", "node_modules", "tsx", "dist", "cli.mjs");
    execFileSync(process.execPath, [tsxCli, "src/scripts/phase16-security-closure.ts"], { cwd: backend, stdio: "inherit", env: process.env });
    const root = path.resolve(backend, "..");
    const report = JSON.parse(fs.readFileSync(path.join(root, "docs", "phase16-http-security-closure.json"), "utf8")) as { totalHttpTests: number; passed: number; failed: number };
    expect(report.totalHttpTests).toBeGreaterThan(0);
    expect(report.failed).toBe(0);
    expect(report.passed).toBeGreaterThan(0);
  });
});
