import { educationalVisualSemanticsService } from "../modules/ndie/educational-visual-semantics/educational-visual-semantics.service.js";
import type { NdieNormalizedVisual, NdieEducationalVisualType } from "../modules/ndie/contracts/visual-result.js";

function visual(id: string, visualType: NdieEducationalVisualType, caption: string, labels: string[] = [], confidence = 0.88): NdieNormalizedVisual {
  const box = { page: 1, x: 0.1, y: 0.1, width: 0.4, height: 0.2, rotation: 0, normalized: { x: 0.1, y: 0.1, width: 0.4, height: 0.2 }, polygon: [] };
  return {
    schemaVersion: "ndie-visual-v1",
    visualId: id,
    sourcePage: 1,
    sourcePageId: "page-1",
    sourceRegionId: id,
    coordinates: box,
    confidence,
    providerId: "visual.rule-based",
    providerVersion: "test",
    pipelineVersion: "test",
    visualType,
    caption,
    labels,
    linkedOcrRegionIds: [],
    linkedFormulaRegionIds: [],
    linkedQuestionRegionIds: [],
    readingOrder: 1,
    table: visualType === "TABLE" ? { rows: 4, columns: 3, mergedCells: false, nestedTables: false, headers: ["x", "y", "z"], bodyRegionIds: [], footers: [], captions: [caption], coordinates: box } : undefined,
    graph: ["GRAPH", "LINE_GRAPH", "COORDINATE_PLANE"].includes(visualType) ? { axes: [{ axis: "x", label: "x-axis" }, { axis: "y", label: "y-axis" }], origin: { x: 0, y: 0 }, grid: true, legends: [], labels, scale: null, curves: 1, bars: 0, pieSlices: 0, trendLines: 0, coordinateSystem: "CARTESIAN" } : undefined,
    diagram: ["TRIANGLE", "CIRCUIT_DIAGRAM", "CHEMISTRY_STRUCTURE"].includes(visualType) ? { shapes: [{ type: visualType === "TRIANGLE" ? "TRIANGLE" : "UNKNOWN", label: caption }], connectors: visualType === "CIRCUIT_DIAGRAM" ? 4 : 1, arrows: visualType === "CHEMISTRY_STRUCTURE" ? 2 : 0, labels, nodes: 2, groups: 1, relationships: [], geometryObjects: visualType === "TRIANGLE" ? ["triangle", "angle"] : [], circuitSymbols: visualType === "CIRCUIT_DIAGRAM" ? ["resistor", "battery"] : [] } : undefined,
    crop: { sourcePageImageUrl: `https://assets.nidus.test/${id}.png`, status: "REFERENCE_ONLY" },
    diagnostics: { lowConfidence: false, brokenFigure: false, overlappingVisuals: false, missingCaption: false, missingLabels: false, lowResolution: false, unreadableGraph: false, unreadableTable: false, unreadableDiagram: false, issues: [] },
    providerMetadata: {},
    checksum: id,
    durationMs: 1,
    createdAt: new Date().toISOString()
  };
}

const result = educationalVisualSemanticsService.understand({
  importJobId: "phase-5-visual-semantics",
  visuals: [
    visual("table", "TABLE", "Data table for chemistry kinetics", ["Rate", "Time"]),
    visual("graph", "COORDINATE_PLANE", "Coordinate graph with x-axis y-axis origin and curve", ["x", "y"]),
    visual("geometry", "TRIANGLE", "Triangle ABC with angle and radius", ["A", "B", "C"]),
    visual("circuit", "CIRCUIT_DIAGRAM", "Circuit with battery resistor and ammeter", ["R", "V"]),
    visual("chem", "CHEMISTRY_STRUCTURE", "Benzene organic reaction mechanism structure", ["benzene"]),
    visual("uncertain", "GENERIC_IMAGE", "", [], 0.55)
  ]
});

const checks: Array<[string, boolean, unknown?]> = [
  ["health ready", educationalVisualSemanticsService.health().status === "ready", educationalVisualSemanticsService.health()],
  ["all visuals preserved", result.summary.visualCount === 6, result.summary],
  ["table understood", result.summary.tables === 1, result.objects.map((object) => object.semanticKind)],
  ["graph understood", result.summary.graphs === 1, result.objects.map((object) => object.semanticKind)],
  ["geometry understood", result.summary.geometryDiagrams === 1, result.objects.map((object) => object.semanticKind)],
  ["physics diagram understood", result.summary.physicsDiagrams === 1, result.objects.map((object) => object.semanticKind)],
  ["chemistry visual understood", result.summary.chemistryVisuals === 1, result.objects.map((object) => object.semanticKind)],
  ["review flags uncertain visual", result.objects.some((object) => object.sourceVisualId === "uncertain" && object.teacherReviewRequired), result.objects.map((object) => ({ id: object.sourceVisualId, risks: object.risks }))],
  ["no invented diagrams", result.objects.every((object) => object.guarantees.noInventedDiagram), result.objects.map((object) => object.guarantees)],
  ["relationships created", result.objects.every((object) => object.relationships.some((relationship) => relationship.type === "USES_VISUAL")), result.objects.map((object) => object.relationships)]
];

const failed = checks.filter(([, ok]) => !ok);
for (const [name, ok, details] of checks) {
  console.log(`${ok ? "PASS" : "FAIL"} ${name}`, details ? JSON.stringify(details) : "");
}
if (failed.length) throw new Error(`NDIE visual semantics verification failed: ${failed.map(([name]) => name).join(", ")}`);