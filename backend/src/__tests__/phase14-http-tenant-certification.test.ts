import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "@jest/globals";

describe("Phase 14 real HTTP tenant certification", () => {
  const certificationTest = process.env.NIDUS_PHASE14_HTTP_E2E === "1" ? it : it.skip;
  certificationTest("runs the authenticated two-institution staging certification", () => {
    const tsxCli = path.resolve(process.cwd(), "..", "node_modules", "tsx", "dist", "cli.mjs");
    execFileSync(process.execPath, [tsxCli, "src/scripts/phase14-http-tenant-certification.ts"], { cwd: process.cwd(), stdio: "inherit", env: process.env });
    const root = path.basename(process.cwd()).toLowerCase() === "backend" ? path.resolve(process.cwd(), "..") : process.cwd();
    const report = JSON.parse(fs.readFileSync(path.join(root, "docs", "phase14-tenant-security-certification.json"), "utf8")) as { totalHttpTests: number; passed: number; failed: number; skipped: number; blocked: number };
    expect(report.totalHttpTests).toBeGreaterThan(0);
    expect(report.failed).toBe(0);
    expect(report.skipped).toBe(0);
    expect(report.blocked).toBe(0);
    expect(report.passed).toBe(report.totalHttpTests);
  });
});
