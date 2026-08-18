import { describe, expect, it } from "@jest/globals";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { RuleBasedFormulaProvider } from "../modules/ndie/formula-analyzer/rule-based-formula.provider.js";
import { formulaPerfectionService } from "../modules/ndie/formula-perfection/formula-perfection.service.js";

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");

describe("NDIE Phase 3 formula perfection engine", () => {
  it("defines a formula perfection contract and service", () => {
    const contract = read("src/modules/ndie/contracts/formula-perfection-result.ts");
    const service = read("src/modules/ndie/formula-perfection/formula-perfection.service.ts");
    expect(contract).toContain("NdieFormulaPerfectionResult");
    expect(contract).toContain("NdieFormulaPerfectionScore");
    expect(contract).toContain("noFormulaDiscarded: true");
    expect(contract).toContain("noHallucinatedFormula: true");
    expect(service).toContain("perfectFormula");
    expect(service).toContain("perfectDocument");
    expect(service).toContain("SOURCE_CROP_REQUIRED");
  });

  it("wires formula perfection into provider output and health", () => {
    const provider = read("src/modules/ndie/formula-analyzer/rule-based-formula.provider.ts");
    const ndieService = read("src/modules/ndie/ndie.service.ts");
    const container = read("src/modules/ndie/ndie.container.ts");
    const packageJson = read("package.json");
    expect(provider).toContain("formulaPerfectionService.perfectDocument");
    expect(provider).toContain("formulaPerfection: perfection.summary");
    expect(ndieService).toContain("formulaPerfectionService.health");
    expect(container).toContain("FormulaPerfection");
    expect(packageJson).toContain("test:ndie-formula-perfection");
  });

  it("repairs and preserves fractions, roots, matrices, vectors and chemistry arrows", async () => {
    const provider = new RuleBasedFormulaProvider();
    const result = await provider.detect({
      importJobId: "formula-perfection-import",
      pageId: "formula-perfection-page",
      pageNumber: 1,
      pageImageUrl: "https://assets.nidus.test/page.png",
      layoutJson: { normalized: { schemaVersion: "ndie-layout-v1" } },
      ocrJson: { normalized: { schemaVersion: "ndie-ocr-v1" } },
      layoutElements: [
        { id: "fraction", elementType: "FORMULA_AREA", text: "x/y + sqrt(5)", coordinates: { page: 1, x: 0.1, y: 0.1, width: 0.4, height: 0.05 }, readingOrder: 1, confidence: 0.91 },
        { id: "matrix", elementType: "FORMULA_AREA", text: "[1 2;3 4]", coordinates: { page: 1, x: 0.1, y: 0.2, width: 0.4, height: 0.05 }, readingOrder: 2, confidence: 0.9 },
        { id: "chemistry", elementType: "FORMULA_AREA", text: "H2 + O2 -> H2O", coordinates: { page: 1, x: 0.1, y: 0.3, width: 0.4, height: 0.05 }, readingOrder: 3, confidence: 0.88 },
        { id: "vector", elementType: "FORMULA_AREA", text: "vector a = 2i + 3j", coordinates: { page: 1, x: 0.1, y: 0.4, width: 0.4, height: 0.05 }, readingOrder: 4, confidence: 0.86 }
      ]
    });

    const formulaBySource = (id: string) => result.formulas.find((formula) => formula.sourceElementId === id);
    expect(formulaBySource("fraction")?.representations.latex).toContain("\\frac{x}{y}");
    expect(formulaBySource("fraction")?.representations.latex).toContain("\\sqrt{5}");
    expect(formulaBySource("matrix")?.representations.latex).toContain("\\begin{bmatrix}");
    expect(formulaBySource("chemistry")?.representations.latex).toContain("\\rightarrow");
    expect(formulaBySource("vector")?.representations.latex).toContain("\\vec{a}");
    expect(result.raw.formulaPerfection).toBeTruthy();
    expect(result.formulas.every((formula) => formula.rawProviderOutput.formulaPerfectionVersion === "ndie-formula-perfection-v1")).toBe(true);
  });

  it("requires review instead of trusting formulas without source crop", async () => {
    const provider = new RuleBasedFormulaProvider();
    const result = await provider.detect({
      importJobId: "formula-crop-import",
      pageId: "formula-crop-page",
      pageNumber: 1,
      layoutElements: [
        { id: "no-crop", elementType: "FORMULA_AREA", text: "x/y", coordinates: { page: 1, x: 0.1, y: 0.1, width: 0.4, height: 0.05 }, readingOrder: 1, confidence: 0.95 }
      ]
    });
    const perfection = formulaPerfectionService.perfectFormula(result.formulas[0]);
    expect(perfection.guarantees.noFormulaDiscarded).toBe(true);
    expect(perfection.guarantees.noHallucinatedFormula).toBe(true);
    expect(perfection.issues.some((issue) => issue.code === "SOURCE_CROP_REQUIRED")).toBe(true);
    expect(perfection.teacherReviewRequired).toBe(true);
    expect(perfection.canAutoPublish).toBe(false);
  });

  it("keeps high-trust formulas scored while still preserving original text", async () => {
    const provider = new RuleBasedFormulaProvider();
    const result = await provider.detect({
      importJobId: "formula-score-import",
      pageId: "formula-score-page",
      pageNumber: 1,
      pageImageUrl: "https://assets.nidus.test/page.png",
      layoutElements: [
        { id: "clean", elementType: "FORMULA_AREA", text: "F = ma", coordinates: { page: 1, x: 0.1, y: 0.1, width: 0.4, height: 0.05 }, readingOrder: 1, confidence: 0.96 }
      ]
    });
    const perfection = formulaPerfectionService.perfectFormula(result.formulas[0]);
    expect(perfection.score.overall).toBeGreaterThan(0.7);
    expect(perfection.guarantees.originalTextPreserved).toBe(true);
    expect(result.formulas[0].representations.plainText).toBe("F = ma");
  });
});
