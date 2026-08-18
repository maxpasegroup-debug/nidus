import { describe, expect, it } from "@jest/globals";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { educationalVisualSemanticsService } from "../modules/ndie/educational-visual-semantics/educational-visual-semantics.service.js";
import type { NdieEducationalVisualType, NdieNormalizedVisual } from "../modules/ndie/contracts/visual-result.js";

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");

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

describe("NDIE Phase 5 educational visual semantics", () => {
  it("defines visual semantics contracts and service", () => {
    const contract = read("src/modules/ndie/contracts/educational-visual-semantics-result.ts");
    const service = read("src/modules/ndie/educational-visual-semantics/educational-visual-semantics.service.ts");
    expect(contract).toContain("NdieEducationalVisualSemanticObject");
    expect(contract).toContain("GRAPH_STRUCTURE");
    expect(contract).toContain("PHYSICS_DIAGRAM");
    expect(contract).toContain("noInventedDiagram: true");
    expect(service).toContain("educationalVisualSemanticsService");
    expect(service).toContain("noVisualDiscarded");
  });

  it("wires visual semantics into NDIE health and scripts", () => {
    const ndie = read("src/modules/ndie/ndie.service.ts");
    const container = read("src/modules/ndie/ndie.container.ts");
    const packageJson = read("package.json");
    expect(ndie).toContain("educationalVisualSemanticsService.health");
    expect(container).toContain("EducationalVisualSemantics");
    expect(packageJson).toContain("test:ndie-visual-semantics");
  });

  it("preserves and classifies tables, graphs, geometry, physics and chemistry visuals", () => {
    const result = educationalVisualSemanticsService.understand({
      importJobId: "visuals",
      visuals: [
        visual("table", "TABLE", "Data table for chemistry kinetics", ["Rate", "Time"]),
        visual("graph", "COORDINATE_PLANE", "Coordinate graph with x-axis y-axis origin and curve", ["x", "y"]),
        visual("geometry", "TRIANGLE", "Triangle ABC with angle and radius", ["A", "B", "C"]),
        visual("circuit", "CIRCUIT_DIAGRAM", "Circuit with battery resistor and ammeter", ["R", "V"]),
        visual("chem", "CHEMISTRY_STRUCTURE", "Benzene organic reaction mechanism structure", ["benzene"])
      ]
    });
    expect(result.summary.visualCount).toBe(5);
    expect(result.summary.tables).toBe(1);
    expect(result.summary.graphs).toBe(1);
    expect(result.summary.geometryDiagrams).toBe(1);
    expect(result.summary.physicsDiagrams).toBe(1);
    expect(result.summary.chemistryVisuals).toBe(1);
    expect(result.objects.every((object) => object.guarantees.noVisualDiscarded)).toBe(true);
  });

  it("requires review for uncertain visuals instead of discarding them", () => {
    const result = educationalVisualSemanticsService.understand({ importJobId: "uncertain", visuals: [visual("uncertain", "GENERIC_IMAGE", "", [], 0.55)] });
    expect(result.summary.visualCount).toBe(1);
    expect(result.objects[0]?.teacherReviewRequired).toBe(true);
    expect(result.objects[0]?.canAutoPublish).toBe(false);
    expect(result.objects[0]?.risks).toContain("LOW_VISUAL_CONFIDENCE");
    expect(result.objects[0]?.risks).toContain("MISSING_CAPTION");
  });
});