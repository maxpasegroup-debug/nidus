import { describe, expect, it } from "@jest/globals";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(process.cwd(), "..");
const sourceRoot = path.resolve(process.cwd(), "src");
const read = (relativePath: string) => fs.readFileSync(path.join(sourceRoot, relativePath), "utf8");

describe("Phase 12 tenant security hardening", () => {
  it("classifies every Prisma model without guessing ambiguous ownership", () => {
    const report = JSON.parse(fs.readFileSync(path.join(root, "docs/phase12-tenant-ownership-matrix.json"), "utf8")) as { summary: { totalModels: number; unknown: number }; models: Array<{ entity: string; classification: string }> };
    expect(report.summary.totalModels).toBe(227);
    expect(report.models).toHaveLength(227);
    expect(new Set(report.models.map((model) => model.entity)).size).toBe(227);
    expect(report.summary.unknown).toBe(98);
    expect(report.models.every((model) => ["GLOBAL", "TENANT_OWNED", "USER_OWNED", "DERIVED_TENANT", "DERIVED_GLOBAL", "SYSTEM", "HISTORICAL_AUDIT", "LEGACY_REQUIRES_MIGRATION", "UNKNOWN"].includes(model.classification))).toBe(true);
  });

  it("scopes legacy ERP relations that have authoritative user ownership", () => {
    const service = read("modules/erp/erp.service.ts");
    expect(service).toContain("Attendance user is outside the institution");
    expect(service).toContain("where: { user: { instituteId } }");
    expect(service).toContain("where: { faculty: { user: { instituteId } } }");
    expect(service).toContain("createdBy: scope.id");
  });

  it("fails closed for the unscopable legacy timetable model", () => {
    const routes = read("modules/erp/erp.routes.ts");
    expect(routes).toContain("Timetable is temporarily unavailable until institution ownership is enforced");
    expect(routes).not.toContain('timetableRouter.get("/", protect, erpController.timetable)');
  });

  it("records critical tenant gaps and orphan users without reassignment", () => {
    const gaps = JSON.parse(fs.readFileSync(path.join(root, "docs/phase12-critical-tenant-gaps.json"), "utf8")) as { summary: { criticalModelsReviewed: number; ownershipReviewRequired: number } };
    const orphans = JSON.parse(fs.readFileSync(path.join(root, "docs/phase12-orphan-user-report.json"), "utf8")) as { status: string; usersWithoutInstitution: number };
    expect(gaps.summary.criticalModelsReviewed).toBeGreaterThan(0);
    expect(gaps.summary.ownershipReviewRequired).toBeGreaterThan(0);
    expect(orphans.status).toBe("MANUAL_REMEDIATION_REQUIRED");
    expect(orphans.usersWithoutInstitution).toBeGreaterThanOrEqual(0);
  });
});
