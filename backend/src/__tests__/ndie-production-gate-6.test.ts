import { describe, expect, it } from "@jest/globals";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { RuleBasedFormulaProvider } from "../modules/ndie/formula-analyzer/rule-based-formula.provider.js";
import { assertNdieJobTransition } from "../modules/ndie/queue/state-machine.js";

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");

describe("NDIE Production Gate 6 formula intelligence engine", () => {
  const contract = read("src/modules/ndie/contracts/formula-result.ts");
  const providers = read("src/modules/ndie/contracts/providers.ts");
  const provider = read("src/modules/ndie/formula-analyzer/rule-based-formula.provider.ts");
  const service = read("src/modules/ndie/formula-analyzer/formula-analyzer.service.ts");
  const worker = read("src/modules/ndie/worker/worker.service.ts");
  const queue = read("src/modules/ndie/queue/queue.service.ts");
  const stateMachine = read("src/modules/ndie/queue/state-machine.ts");
  const container = read("src/modules/ndie/ndie.container.ts");
  const ndieService = read("src/modules/ndie/ndie.service.ts");

  it("defines normalized formula JSON with semantic, render, edit, validation and confidence fields", () => {
    expect(contract).toContain("NdieNormalizedFormula");
    expect(contract).toContain("formulaId");
    expect(contract).toContain("semanticType");
    expect(contract).toContain("representations");
    expect(contract).toContain("originalImageCrop");
    expect(contract).toContain("latex");
    expect(contract).toContain("mathml");
    expect(contract).toContain("ast");
    expect(contract).toContain("editState");
    expect(contract).toContain("diagnostics");
    expect(contract).toContain("confidence");
  });

  it("keeps formula providers swappable", () => {
    expect(providers).toContain("interface FormulaProvider");
    expect(providers).toContain("NdieFormulaResult");
    expect(container).toContain("formula.mathpix");
    expect(container).toContain("formula.azure");
    expect(container).toContain("formula.google-document-ai");
    expect(container).toContain("formula.pix2tex");
    expect(container).toContain("formula.nougat");
    expect(container).toContain("formula.local-vision");
    expect(provider).toContain('readonly id = "formula.rule-based"');
  });

  it("classifies STEM formula semantics and preserves representations", async () => {
    const formulaProvider = new RuleBasedFormulaProvider();
    const result = await formulaProvider.detect({
      importJobId: "formula-import",
      pageId: "formula-page",
      pageNumber: 1,
      pageImageUrl: "https://example.test/page.png",
      layoutJson: { normalized: { schemaVersion: "ndie-layout-v1" } },
      ocrJson: { normalized: { schemaVersion: "ndie-ocr-v1" } },
      layoutElements: [
        { id: "r1", elementType: "FORMULA_AREA", text: "x/y + \\sqrt{5}", coordinates: { page: 1, x: 0.1, y: 0.2, width: 0.4, height: 0.05, rotation: 0 }, readingOrder: 1, confidence: 0.9 },
        { id: "r2", elementType: "FORMULA_AREA", text: "\\int x dx", coordinates: { page: 1, x: 0.1, y: 0.3, width: 0.4, height: 0.05, rotation: 0 }, readingOrder: 2, confidence: 0.92 },
        { id: "r3", elementType: "FORMULA_AREA", text: "F = ma", coordinates: { page: 1, x: 0.1, y: 0.4, width: 0.4, height: 0.05, rotation: 0 }, readingOrder: 3, confidence: 0.91 },
        { id: "r4", elementType: "FORMULA_AREA", text: "H2 + O2 -> H2O", coordinates: { page: 1, x: 0.1, y: 0.5, width: 0.4, height: 0.05, rotation: 0 }, readingOrder: 4, confidence: 0.88 }
      ]
    });

    expect(result.formulas.length).toBe(4);
    expect(result.formulas.map((formula) => formula.semanticType)).toEqual(expect.arrayContaining(["INTEGRATION", "PHYSICS_EQUATION", "CHEMISTRY_EQUATION"]));
    expect(result.formulas[0].representations.latex).toContain("\\frac");
    expect(result.formulas[0].representations.mathml).toContain("<math>");
    expect(result.formulas[0].representations.ocrTokens.length).toBeGreaterThan(0);
    expect(result.formulas[0].representations.originalImageCrop?.status).toBe("REFERENCE_ONLY");
    expect(result.formulas[0].confidence.tokens).not.toBeNull();
    expect(result.formulas[0].renderer.provider).toBe("KATEX_COMPATIBLE");
  });

  it("validates formula defects and marks low trust formulas for teacher review", async () => {
    const formulaProvider = new RuleBasedFormulaProvider();
    const result = await formulaProvider.detect({
      importJobId: "formula-import",
      pageId: "formula-page",
      pageNumber: 1,
      layoutElements: [
        { id: "bad", elementType: "FORMULA_AREA", text: "\\frac", coordinates: { page: 1, x: 0.1, y: 0.2, width: 0.4, height: 0.05, rotation: 0 }, readingOrder: 1, confidence: 0.4 }
      ]
    });
    expect(result.formulas[0].diagnostics.issues).toEqual(expect.arrayContaining(["LOW_CONFIDENCE", "INVALID_LATEX", "MISSING_FRACTION"]));
    expect(result.formulas[0].renderStatus).toBe("REQUIRES_TEACHER_REVIEW");
    expect(result.formulas[0].editState.approvalStatus).toBe("PENDING_REVIEW");
  });

  it("integrates formula intelligence with worker and queue checkpoints only", () => {
    expect(worker).toContain('job.stage === "FORMULA"');
    expect(worker).toContain("ndieFormulaAnalyzerService.detectImport");
    expect(queue).toContain("enqueueFormula");
    expect(stateMachine).toContain('"FORMULA_RUNNING"');
    expect(stateMachine).toContain('"FORMULA_COMPLETED"');
    expect(stateMachine).toContain('"READY_FOR_VISUAL_ENGINE"');
    expect(() => assertNdieJobTransition("READY_FOR_FORMULA_ENGINE", "FORMULA_RUNNING")).not.toThrow();
    expect(() => assertNdieJobTransition("FORMULA_RUNNING", "READY_FOR_VISUAL_ENGINE")).toThrow();
    expect(() => assertNdieJobTransition("FORMULA_COMPLETED", "READY_FOR_VISUAL_ENGINE")).not.toThrow();
  });

  it("adds formula health, metrics and persistence without touching CBT", () => {
    expect(service).toContain("formulaCount");
    expect(service).toContain("averageConfidence");
    expect(service).toContain("validationErrors");
    expect(service).toContain("latexSuccessRate");
    expect(service).toContain("mathMlSuccessRate");
    expect(service).toContain("FORMULA_COMPLETED");
    expect(service).toContain("READY_FOR_VISUAL_ENGINE");
    expect(ndieService).toContain("ndieFormulaAnalyzerService.health()");
  });
});
