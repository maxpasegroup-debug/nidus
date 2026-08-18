import { chemistryStructureService } from "../modules/ndie/chemistry-structure/chemistry-structure.service.js";
import type { NdieNormalizedFormula } from "../modules/ndie/contracts/formula-result.js";
import type { NdieNormalizedVisual } from "../modules/ndie/contracts/visual-result.js";

function formula(id: string, text: string, page = 1, confidence = 0.9): NdieNormalizedFormula {
  return {
    schemaVersion: "ndie-formula-v1",
    formulaId: id,
    sourcePage: page,
    sourcePageId: `page-${page}`,
    sourceRegionId: id,
    sourceElementId: id,
    coordinates: { page, x: 0.1, y: 0.1, width: 0.5, height: 0.05, rotation: 0, normalized: { x: 0.1, y: 0.1, width: 0.5, height: 0.05 }, polygon: [] },
    confidence: { overall: confidence, tokens: confidence, operators: confidence, symbols: confidence, fractions: null, exponents: null, roots: null },
    providerId: "formula.rule-based",
    providerVersion: "test",
    pipelineVersion: "test",
    formulaType: "DISPLAY",
    semanticType: "CHEMISTRY_EQUATION",
    equationNumber: null,
    readingOrder: 1,
    dependencies: [],
    renderStatus: "PREVIEW_READY",
    renderer: { provider: "KATEX_COMPATIBLE", previewSvg: null, previewImageUrl: null, error: null },
    representations: {
      originalImageCrop: { sourcePageImageUrl: `https://assets.nidus.test/page-${page}.png`, coordinates: { page, x: 0.1, y: 0.1, width: 0.5, height: 0.05, rotation: 0, normalized: { x: 0.1, y: 0.1, width: 0.5, height: 0.05 }, polygon: [] }, status: "REFERENCE_ONLY" },
      latex: text.replace(/->/g, "\\rightarrow"),
      mathml: `<math><mtext>${text}</mtext></math>`,
      plainText: text,
      unicode: text,
      ocrTokens: [],
      ast: null,
      normalizedExpression: text.replace(/->/g, "\\rightarrow")
    },
    diagnostics: { brokenFormula: false, missingSymbols: false, lowConfidence: false, unreadableFormula: false, multipleFormulaRegions: false, nestedFormula: false, equationSplitAcrossLines: false, invalidLatex: false, invalidMathML: false, balancedBrackets: true, unknownSymbols: [], brokenSuperscripts: false, brokenSubscripts: false, missingRadicals: false, missingFractions: false, invalidMatrices: false, brokenIntegrals: false, brokenSummations: false, issues: [] },
    editState: { originalLatex: text, editedLatex: null, revision: 1, diff: [], approvalStatus: "APPROVED" },
    rawProviderOutput: {},
    checksum: id,
    durationMs: 1,
    createdAt: new Date().toISOString()
  };
}

function visual(id: string, caption: string, page = 1, confidence = 0.86): NdieNormalizedVisual {
  return {
    schemaVersion: "ndie-visual-v1",
    visualId: id,
    sourcePage: page,
    sourcePageId: `page-${page}`,
    sourceRegionId: id,
    coordinates: { page, x: 0.2, y: 0.2, width: 0.4, height: 0.3, rotation: 0, normalized: { x: 0.2, y: 0.2, width: 0.4, height: 0.3 }, polygon: [] },
    confidence,
    providerId: "visual.rule-based",
    providerVersion: "test",
    pipelineVersion: "test",
    visualType: "CHEMISTRY_STRUCTURE",
    caption,
    labels: ["benzene", "organic"],
    linkedOcrRegionIds: [],
    linkedFormulaRegionIds: [],
    linkedQuestionRegionIds: [],
    readingOrder: 2,
    crop: { sourcePageImageUrl: `https://assets.nidus.test/visual-${page}.png`, status: "REFERENCE_ONLY" },
    diagnostics: { lowConfidence: false, brokenFigure: false, overlappingVisuals: false, missingCaption: false, missingLabels: false, lowResolution: false, unreadableGraph: false, unreadableTable: false, unreadableDiagram: false, issues: [] },
    providerMetadata: {},
    checksum: id,
    durationMs: 1,
    createdAt: new Date().toISOString()
  };
}

const result = chemistryStructureService.understand({
  importJobId: "phase-4-chemistry",
  formulas: [
    formula("eq1", "H2(g) + O2(g) -> H2O(l)"),
    formula("ionic", "Na+ + Cl- -> NaCl(aq)"),
    formula("redox", "Redox oxidation reduction Fe2+ -> Fe3+"),
    formula("complex", "[Cu(NH3)4]2+ coordination complex ligand")
  ],
  visuals: [visual("v1", "Organic benzene structure with reaction mechanism curved arrow")]
});

const checks: Array<[string, boolean, unknown?]> = [
  ["health ready", chemistryStructureService.health().status === "ready", chemistryStructureService.health()],
  ["objects detected", result.summary.objectCount >= 4, result.summary],
  ["equation detected", result.summary.equations >= 1, result.objects.map((object) => object.objectType)],
  ["ionic detected", result.summary.ionicEquations >= 1, result.objects.map((object) => object.objectType)],
  ["redox detected", result.summary.redoxReactions >= 1, result.objects.map((object) => object.objectType)],
  ["coordination detected", result.summary.coordinationComplexes >= 1, result.objects.map((object) => object.objectType)],
  ["charges parsed", result.objects.some((object) => object.notation.charges.length > 0), result.objects.map((object) => object.notation.charges)],
  ["states parsed", result.objects.some((object) => object.notation.states.includes("GAS") && object.notation.states.includes("LIQUID")), result.objects.map((object) => object.notation.states)],
  ["relationships created", result.objects.some((object) => object.relationships.some((relationship) => relationship.type === "USES_FORMULA")), result.objects.map((object) => object.relationships)],
  ["no invented structures", result.objects.every((object) => object.guarantees.noInventedStructure), result.objects.map((object) => object.guarantees)]
];

const failed = checks.filter(([, ok]) => !ok);
for (const [name, ok, details] of checks) {
  console.log(`${ok ? "PASS" : "FAIL"} ${name}`, details ? JSON.stringify(details) : "");
}
if (failed.length) throw new Error(`NDIE chemistry structure verification failed: ${failed.map(([name]) => name).join(", ")}`);
