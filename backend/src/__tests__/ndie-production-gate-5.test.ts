import { describe, expect, it } from "@jest/globals";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { assertNdieJobTransition } from "../modules/ndie/queue/state-machine.js";
import { RuleBasedLayoutProvider } from "../modules/ndie/layout-analyzer/rule-based-layout.provider.js";

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");

describe("NDIE Production Gate 5 layout intelligence", () => {
  const contract = read("src/modules/ndie/contracts/layout-result.ts");
  const providers = read("src/modules/ndie/contracts/providers.ts");
  const layoutProvider = read("src/modules/ndie/layout-analyzer/rule-based-layout.provider.ts");
  const layoutService = read("src/modules/ndie/layout-analyzer/layout-analyzer.service.ts");
  const worker = read("src/modules/ndie/worker/worker.service.ts");
  const stateMachine = read("src/modules/ndie/queue/state-machine.ts");
  const queueService = read("src/modules/ndie/queue/queue.service.ts");
  const ndieService = read("src/modules/ndie/ndie.service.ts");

  it("defines a provider-independent normalized layout object model", () => {
    expect(contract).toContain("NdieNormalizedLayoutPage");
    expect(contract).toContain("regions");
    expect(contract).toContain("paragraphs");
    expect(contract).toContain("columns");
    expect(contract).toContain("tables");
    expect(contract).toContain("figures");
    expect(contract).toContain("headers");
    expect(contract).toContain("footers");
    expect(contract).toContain("pageNumbers");
    expect(contract).toContain("readingGroups");
    expect(contract).toContain("polygon");
    expect(contract).toContain("normalized");
  });

  it("keeps layout providers swappable and normalized", () => {
    expect(providers).toContain("interface LayoutProvider");
    expect(providers).toContain("NdieLayoutResult");
    expect(providers).toContain("ocrJson?: unknown");
    expect(layoutProvider).toContain('readonly id = "layout.rule-based"');
    expect(layoutProvider).toContain("schemaVersion: \"ndie-layout-v1\"");
  });

  it("classifies page regions without interpreting questions or formulas", async () => {
    const provider = new RuleBasedLayoutProvider();
    const result = await provider.analyze({
      importJobId: "layout-import",
      pageId: "layout-page-1",
      pageNumber: 1,
      width: 1000,
      height: 1400,
      rotation: 0,
      dpi: 300,
      aspectRatio: 0.714,
      imageUrl: "https://example.test/page.png",
      ocrText: "NIDUS Academy\nInstructions: Choose the correct answer\nQ1. Find x\nA | B | C | D\nFigure 1 graph\nPage 1"
    });

    expect(result.normalized.regions.some((region) => region.classification === "HEADER")).toBe(true);
    expect(result.normalized.regions.some((region) => region.classification === "INSTRUCTION_AREA")).toBe(true);
    expect(result.normalized.regions.some((region) => region.classification === "QUESTION_AREA")).toBe(true);
    expect(result.normalized.tables.length).toBeGreaterThanOrEqual(1);
    expect(result.normalized.figures.length).toBeGreaterThanOrEqual(1);
    expect(result.normalized.readingOrder.length).toBe(result.normalized.regions.length);
  });

  it("integrates layout with worker and queue checkpoints only", () => {
    expect(worker).toContain('job.stage === "LAYOUT"');
    expect(worker).toContain("ndieLayoutAnalyzerService.analyzeImport");
    expect(stateMachine).toContain('"LAYOUT_RUNNING"');
    expect(stateMachine).toContain('"LAYOUT_COMPLETED"');
    expect(stateMachine).toContain('"READY_FOR_FORMULA_ENGINE"');
    expect(queueService).toContain("enqueueLayout");
    expect(() => assertNdieJobTransition("READY_FOR_LAYOUT", "LAYOUT_RUNNING")).not.toThrow();
    expect(() => assertNdieJobTransition("LAYOUT_RUNNING", "READY_FOR_FORMULA_ENGINE")).toThrow();
    expect(() => assertNdieJobTransition("LAYOUT_COMPLETED", "READY_FOR_FORMULA_ENGINE")).not.toThrow();
  });

  it("persists raw and normalized layout JSON with diagnostics and metrics", () => {
    expect(layoutService).toContain("rawProviderOutput");
    expect(layoutService).toContain("normalized");
    expect(layoutService).toContain("diagnostics");
    expect(layoutService).toContain("averageRegionsPerPage");
    expect(layoutService).toContain("failedLayoutJobs");
    expect(layoutService).toContain("READY_FOR_FORMULA_ENGINE");
    expect(ndieService).toContain("ndieLayoutAnalyzerService.health()");
  });
});
