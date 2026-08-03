import { describe, expect, it } from "@jest/globals";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");

describe("NDIE Production Gate 16 operations center", () => {
  const operations = read("src/modules/ndie/operations/operations.service.ts");
  const service = read("src/modules/ndie/ndie.service.ts");
  const controller = read("src/modules/ndie/ndie.controller.ts");
  const routes = read("src/modules/ndie/ndie.routes.ts");
  const security = read("src/modules/ndie/security/ndie-security.ts");
  const packageJson = read("package.json");

  it("adds a dedicated operations service without redesigning intelligence stages", () => {
    expect(operations).toContain("ndieOperationsService");
    expect(operations).toContain("operationsVersion");
    expect(operations).toContain("operationalState");
    expect(operations).toContain("activeImports");
    expect(operations).toContain("queuedImports");
    expect(operations).toContain("completedImports");
    expect(operations).toContain("failedImports");
    expect(operations).toContain("replayJobs");
    expect(operations).toContain("publishingJobs");
    expect(operations).toContain("deliveryJobs");
  });

  it("creates pipeline timeline support for every enterprise stage", () => {
    expect(operations).toContain("timeline(importJobId");
    expect(operations).toContain("IMPORT_CREATED");
    expect(operations).toContain("SOURCE_STORED");
    expect(operations).toContain("PDF_RENDERED");
    expect(operations).toContain("OCR_COMPLETED");
    expect(operations).toContain("LAYOUT_COMPLETED");
    expect(operations).toContain("FORMULA_COMPLETED");
    expect(operations).toContain("VISUAL_COMPLETED");
    expect(operations).toContain("QUESTION_COMPLETED");
    expect(operations).toContain("EVALUATION_COMPLETED");
    expect(operations).toContain("AI_VALIDATED");
    expect(operations).toContain("READY_FOR_REVIEW");
    expect(operations).toContain("PUBLISHED");
    expect(operations).toContain("DELIVERED");
  });

  it("monitors providers, workers, queues, storage, cost and quality", () => {
    expect(operations).toContain("providerMonitoring");
    expect(operations).toContain("successRate");
    expect(operations).toContain("failureRate");
    expect(operations).toContain("averageDurationMs");
    expect(operations).toContain("availability");
    expect(operations).toContain("ndieWorkerRegistryService.health");
    expect(operations).toContain("queueDashboard");
    expect(operations).toContain("queueDepth");
    expect(operations).toContain("backpressure");
    expect(operations).toContain("storageDashboard");
    expect(operations).toContain("duplicateUploads");
    expect(operations).toContain("buildCostEstimate");
    expect(operations).toContain("provider-independent-estimate");
    expect(operations).toContain("qualityDashboard");
    expect(operations).toContain("teacherApprovalRate");
  });

  it("adds diagnostics and enterprise health v2 signals", () => {
    expect(operations).toContain("diagnosticsDashboard");
    expect(operations).toContain("topFailures");
    expect(operations).toContain("providerFailures");
    expect(operations).toContain("ocrFailures");
    expect(operations).toContain("layoutFailures");
    expect(operations).toContain("formulaFailures");
    expect(operations).toContain("validationFailures");
    expect(operations).toContain("securityFailures");
    expect(operations).toContain("workerFailures");
    expect(operations).toContain("queueFailures");
    expect(service).toContain("enterpriseHealth");
    expect(service).toContain("overallStatus");
  });

  it("wires protected operations APIs with audit events", () => {
    expect(routes).toContain('"/operations"');
    expect(routes).toContain('"/operations/diagnostics"');
    expect(routes).toContain('"/imports/:id/timeline"');
    expect(controller).toContain("operationsDiagnostics");
    expect(controller).toContain("importTimeline");
    expect(controller).toContain("NDIE_OPERATIONS_VIEWED");
    expect(controller).toContain("NDIE_DIAGNOSTICS_VIEWED");
    expect(controller).toContain("NDIE_TIMELINE_VIEWED");
    expect(security).toContain("NDIE_OPERATIONS_VIEWED");
    expect(service).toContain("isNdieManager(actor)");
    expect(service).toContain("assertNdieImportAccess(actor, importJobId, \"READ\")");
  });

  it("adds the Gate 16 verification command", () => {
    expect(packageJson).toContain("test:ndie-operations");
    expect(packageJson).toContain("ndie-operations-verification.ts");
  });
});
