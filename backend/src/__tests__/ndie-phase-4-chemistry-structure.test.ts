import { describe, expect, it } from "@jest/globals";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { chemistryStructureService } from "../modules/ndie/chemistry-structure/chemistry-structure.service.js";
import type { NdieNormalizedFormula } from "../modules/ndie/contracts/formula-result.js";
import type { NdieNormalizedVisual } from "../modules/ndie/contracts/visual-result.js";

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");

function formula(id: string, text: string, semanticType: NdieNormalizedFormula["semanticType"] = "CHEMISTRY_EQUATION", confidence = 0.9): NdieNormalizedFormula {
  return {
    schemaVersion: "ndie-formula-v1",
    formulaId: id,
    sourcePage: 1,
    sourcePageId: "page-1",
    sourceRegionId: id,
    sourceElementId: id,
    coordinates: { page: 1, x: 0.1, y: 0.1, width: 0.5, height: 0.05, rotation: 0, normalized: { x: 0.1, y: 0.1, width: 0.5, height: 0.05 }, polygon: [] },
    confidence: { overall: confidence, tokens: confidence, operators: confidence, symbols: confidence, fractions: null, exponents: null, roots: null },
    providerId: "formula.rule-based",
    providerVersion: "test",
    pipelineVersion: "test",
    formulaType: "DISPLAY",
    semanticType,
    equationNumber: null,
    readingOrder: 1,
    dependencies: [],
    renderStatus: "PREVIEW_READY",
    renderer: { provider: "KATEX_COMPATIBLE", previewSvg: null, previewImageUrl: null, error: null },
    representations: { originalImageCrop: { sourcePageImageUrl: "https://assets.nidus.test/page.png", coordinates: { page: 1, x: 0.1, y: 0.1, width: 0.5, height: 0.05, rotation: 0, normalized: { x: 0.1, y: 0.1, width: 0.5, height: 0.05 }, polygon: [] }, status: "REFERENCE_ONLY" }, latex: text.replace(/->/g, "\\rightarrow"), mathml: `<math><mtext>${text}</mtext></math>`, plainText: text, unicode: text, ocrTokens: [], ast: null, normalizedExpression: text.replace(/->/g, "\\rightarrow") },
    diagnostics: { brokenFormula: false, missingSymbols: false, lowConfidence: false, unreadableFormula: false, multipleFormulaRegions: false, nestedFormula: false, equationSplitAcrossLines: false, invalidLatex: false, invalidMathML: false, balancedBrackets: true, unknownSymbols: [], brokenSuperscripts: false, brokenSubscripts: false, missingRadicals: false, missingFractions: false, invalidMatrices: false, brokenIntegrals: false, brokenSummations: false, issues: [] },
    editState: { originalLatex: text, editedLatex: null, revision: 1, diff: [], approvalStatus: "APPROVED" },
    rawProviderOutput: {},
    checksum: id,
    durationMs: 1,
    createdAt: new Date().toISOString()
  };
}

function visual(id = "v1", caption = "Organic benzene structure with reaction mechanism curved arrow", confidence = 0.86): NdieNormalizedVisual {
  return { schemaVersion: "ndie-visual-v1", visualId: id, sourcePage: 1, sourcePageId: "page-1", sourceRegionId: id, coordinates: { page: 1, x: 0.2, y: 0.2, width: 0.4, height: 0.3, rotation: 0, normalized: { x: 0.2, y: 0.2, width: 0.4, height: 0.3 }, polygon: [] }, confidence, providerId: "visual.rule-based", providerVersion: "test", pipelineVersion: "test", visualType: "CHEMISTRY_STRUCTURE", caption, labels: ["benzene", "organic"], linkedOcrRegionIds: [], linkedFormulaRegionIds: [], linkedQuestionRegionIds: [], readingOrder: 2, crop: { sourcePageImageUrl: "https://assets.nidus.test/visual.png", status: "REFERENCE_ONLY" }, diagnostics: { lowConfidence: false, brokenFigure: false, overlappingVisuals: false, missingCaption: false, missingLabels: false, lowResolution: false, unreadableGraph: false, unreadableTable: false, unreadableDiagram: false, issues: [] }, providerMetadata: {}, checksum: id, durationMs: 1, createdAt: new Date().toISOString() };
}

describe("NDIE Phase 4 chemistry structure engine", () => {
  it("defines chemistry structure contracts and engine modules", () => {
    const contract = read("src/modules/ndie/contracts/chemistry-structure-result.ts");
    const service = read("src/modules/ndie/chemistry-structure/chemistry-structure.service.ts");
    expect(contract).toContain("NdieChemistryStructureObject");
    expect(contract).toContain("ORGANIC_STRUCTURE");
    expect(contract).toContain("LEWIS_STRUCTURE");
    expect(contract).toContain("REACTION_MECHANISM");
    expect(contract).toContain("noInventedStructure: true");
    expect(service).toContain("chemistryStructureService");
    expect(service).toContain("noChemistryObjectDiscarded");
  });

  it("wires chemistry structure health and STEM chemistry coverage", () => {
    const ndie = read("src/modules/ndie/ndie.service.ts");
    const container = read("src/modules/ndie/ndie.container.ts");
    const stem = read("src/modules/ndie/stem-intelligence/stem-intelligence.service.ts");
    const packageJson = read("package.json");
    expect(ndie).toContain("chemistryStructureService.health");
    expect(container).toContain("ChemistryStructureEngine");
    expect(stem).toContain("Lewis Structures");
    expect(stem).toContain("Reaction Mechanisms");
    expect(stem).toContain("Coordination Chemistry");
    expect(packageJson).toContain("test:ndie-chemistry-structure");
  });

  it("understands equations, charges, states and relationships", () => {
    const result = chemistryStructureService.understand({ importJobId: "chem", formulas: [formula("eq", "H2(g) + O2(g) -> H2O(l)"), formula("ionic", "Na+ + Cl- -> NaCl(aq)")], visuals: [visual()] });
    expect(result.summary.objectCount).toBeGreaterThanOrEqual(2);
    expect(result.objects.some((object) => object.notation.states.includes("GAS") && object.notation.states.includes("LIQUID"))).toBe(true);
    expect(result.objects.some((object) => object.notation.charges.length > 0)).toBe(true);
    expect(result.objects.some((object) => object.relationships.some((relationship) => relationship.type === "USES_FORMULA"))).toBe(true);
    expect(result.objects.every((object) => object.guarantees.noInventedStructure)).toBe(true);
  });

  it("classifies organic, Lewis, redox and coordination chemistry", () => {
    const result = chemistryStructureService.understand({
      importJobId: "advanced-chem",
      formulas: [
        formula("lewis", "Lewis structure lone pair octet valence electron", "GENERIC_SYMBOLIC_EXPRESSION"),
        formula("redox", "Redox oxidation reduction Fe2+ -> Fe3+"),
        formula("complex", "[Cu(NH3)4]2+ coordination complex ligand")
      ],
      visuals: [visual("organic", "Organic benzene structure with mechanism curved arrow")]
    });
    expect(result.summary.lewisStructures).toBeGreaterThanOrEqual(1);
    expect(result.summary.redoxReactions).toBeGreaterThanOrEqual(1);
    expect(result.summary.coordinationComplexes).toBeGreaterThanOrEqual(1);
    expect(result.summary.organicStructures + result.summary.reactionMechanisms).toBeGreaterThanOrEqual(1);
  });

  it("requires teacher review when a structure needs visual evidence", () => {
    const result = chemistryStructureService.understand({ importJobId: "missing-visual", formulas: [formula("organic", "benzene organic ring structure", "CHEMISTRY_EQUATION", 0.86)], visuals: [] });
    expect(result.objects[0]?.risks).toContain("MISSING_STRUCTURE_IMAGE");
    expect(result.objects[0]?.teacherReviewRequired).toBe(true);
    expect(result.objects[0]?.canAutoPublish).toBe(false);
  });
});
