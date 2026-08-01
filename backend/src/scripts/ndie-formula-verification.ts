import { RuleBasedFormulaProvider } from "../modules/ndie/formula-analyzer/rule-based-formula.provider.js";

const corpus = [
  { id: "fraction", text: "x/y + \\sqrt{5}", expected: "ALGEBRA" },
  { id: "root", text: "\\sqrt{x^2 + y^2}", expected: "ALGEBRA" },
  { id: "matrix", text: "\\begin{bmatrix}1 & 2 \\\\ 3 & 4\\end{bmatrix}", expected: "MATRIX" },
  { id: "calculus", text: "\\int x dx", expected: "INTEGRATION" },
  { id: "limit", text: "\\lim_{x->0} sin x / x = 1", expected: "LIMIT" },
  { id: "trigonometry", text: "sin^2 x + cos^2 x = 1", expected: "TRIGONOMETRY" },
  { id: "vector", text: "vector a = 2i + 3j + 4k", expected: "VECTOR" },
  { id: "physics", text: "F = ma", expected: "PHYSICS_EQUATION" },
  { id: "chemistry", text: "H2 + O2 -> H2O", expected: "CHEMISTRY_EQUATION" },
  { id: "probability", text: "P(A) = n(A)/n(S)", expected: "PROBABILITY" }
];

async function main() {
  const provider = new RuleBasedFormulaProvider();
  const result = await provider.detect({
    importJobId: "formula-verification-import",
    pageId: "formula-verification-page",
    pageNumber: 1,
    pageImageUrl: "https://example.test/page.png",
    layoutJson: { normalized: { schemaVersion: "ndie-layout-v1" } },
    ocrJson: { normalized: { schemaVersion: "ndie-ocr-v1" } },
    layoutElements: corpus.map((item, index) => ({
      id: item.id,
      elementType: "FORMULA_AREA",
      text: item.text,
      coordinates: { page: 1, x: 0.08, y: 0.08 + index * 0.07, width: 0.72, height: 0.05, rotation: 0 },
      readingOrder: index + 1,
      confidence: 0.92
    }))
  });

  for (const item of corpus) {
    const formula = result.formulas.find((candidate) => candidate.sourceElementId === item.id);
    if (!formula) throw new Error(`Missing formula for ${item.id}`);
    if (formula.semanticType !== item.expected) throw new Error(`Expected ${item.id} to be ${item.expected}, got ${formula.semanticType}`);
    if (!formula.representations.latex) throw new Error(`Missing LaTeX for ${item.id}`);
    if (!formula.representations.mathml?.includes("<math>")) throw new Error(`Missing MathML for ${item.id}`);
    if (!formula.representations.ocrTokens.length) throw new Error(`Missing tokens for ${item.id}`);
    if (!formula.checksum) throw new Error(`Missing checksum for ${item.id}`);
  }

  const validationFailures = result.formulas.reduce((sum, formula) => sum + formula.diagnostics.issues.length, 0);
  console.log(JSON.stringify({
    status: "PASS",
    provider: provider.id,
    schemaVersion: result.formulas[0]?.schemaVersion,
    formulaCount: result.formulas.length,
    averageConfidence: result.confidence,
    semanticTypes: result.raw.semanticTypes,
    validationFailures
  }));
}

main().catch((error) => {
  console.error(JSON.stringify({
    status: "FAIL",
    message: error instanceof Error ? error.message : "Formula verification failed"
  }));
  process.exit(1);
});
