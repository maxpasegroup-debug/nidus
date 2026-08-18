import { RuleBasedFormulaProvider } from "../modules/ndie/formula-analyzer/rule-based-formula.provider.js";
import { formulaPerfectionService } from "../modules/ndie/formula-perfection/formula-perfection.service.js";

const provider = new RuleBasedFormulaProvider();
const result = await provider.detect({
  importJobId: "phase-3-formula-perfection",
  pageId: "phase-3-page",
  pageNumber: 1,
  pageImageUrl: "https://assets.nidus.test/formula-page.png",
  layoutJson: { normalized: { schemaVersion: "ndie-layout-v1" } },
  ocrJson: { normalized: { schemaVersion: "ndie-ocr-v1" } },
  layoutElements: [
    { id: "fraction", elementType: "FORMULA_AREA", text: "x/y + sqrt(5)", coordinates: { page: 1, x: 0.1, y: 0.1, width: 0.4, height: 0.05 }, readingOrder: 1, confidence: 0.91 },
    { id: "matrix", elementType: "FORMULA_AREA", text: "[1 2;3 4]", coordinates: { page: 1, x: 0.1, y: 0.2, width: 0.4, height: 0.05 }, readingOrder: 2, confidence: 0.9 },
    { id: "chemistry", elementType: "FORMULA_AREA", text: "H2 + O2 -> H2O", coordinates: { page: 1, x: 0.1, y: 0.3, width: 0.4, height: 0.05 }, readingOrder: 3, confidence: 0.88 },
    { id: "vector", elementType: "FORMULA_AREA", text: "vector a = 2i + 3j", coordinates: { page: 1, x: 0.1, y: 0.4, width: 0.4, height: 0.05 }, readingOrder: 4, confidence: 0.86 }
  ]
});

const bySource = (id: string) => result.formulas.find((formula) => formula.sourceElementId === id);
const fraction = bySource("fraction");
const matrix = bySource("matrix");
const chemistry = bySource("chemistry");
const vector = bySource("vector");

const checks: Array<[string, boolean, unknown?]> = [
  ["health ready", formulaPerfectionService.health().status === "ready", formulaPerfectionService.health()],
  ["formula count", result.formulas.length === 4, result.formulas.length],
  ["fraction repaired", Boolean(fraction?.representations.latex?.includes("\\frac{x}{y}") && fraction.representations.latex.includes("\\sqrt{5}")), fraction?.representations.latex],
  ["matrix normalized", Boolean(matrix?.representations.latex?.includes("\\begin{bmatrix}")), matrix?.representations.latex],
  ["chemistry arrow normalized", Boolean(chemistry?.representations.latex?.includes("\\rightarrow")), chemistry?.representations.latex],
  ["vector normalized", Boolean(vector?.representations.latex?.includes("\\vec{a}")), vector?.representations.latex],
  ["MathML regenerated", result.formulas.every((formula) => formula.representations.mathml?.includes("<math>")), result.formulas.map((formula) => formula.representations.mathml)],
  ["perfection raw summary", Boolean(result.raw.formulaPerfection), result.raw],
  ["source crop preserved", result.formulas.every((formula) => formula.representations.originalImageCrop?.sourcePageImageUrl), result.formulas.map((formula) => formula.representations.originalImageCrop)],
  ["no formulas discarded", result.formulas.every((formula) => formula.rawProviderOutput.formulaPerfectionVersion === "ndie-formula-perfection-v1"), result.formulas.map((formula) => formula.rawProviderOutput)]
];

const failed = checks.filter(([, ok]) => !ok);
for (const [name, ok, details] of checks) {
  console.log(`${ok ? "PASS" : "FAIL"} ${name}`, details ? JSON.stringify(details) : "");
}

if (failed.length) {
  throw new Error(`NDIE formula perfection verification failed: ${failed.map(([name]) => name).join(", ")}`);
}
