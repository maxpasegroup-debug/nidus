import { createHash } from "node:crypto";
import type { NdieEducationalVisualSemanticKind, NdieEducationalVisualSemanticObject, NdieEducationalVisualSemanticRisk, NdieEducationalVisualSemanticsInput, NdieEducationalVisualSemanticsResult } from "../contracts/educational-visual-semantics-result.js";

const engineVersion = "ndie-educational-visual-semantics-v1" as const;

function clamp01(value: number) {
  return Math.max(0, Math.min(1, Math.round(value * 10000) / 10000));
}

function hash(value: unknown) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, 16);
}

function textOf(input: NdieEducationalVisualSemanticsInput["visuals"][number]) {
  return [input.visualType, input.caption, ...input.labels, ...(input.diagram?.labels ?? []), ...(input.graph?.labels ?? []), ...(input.table?.headers ?? [])].filter(Boolean).join(" ");
}

function semanticKind(visual: NdieEducationalVisualSemanticsInput["visuals"][number]): NdieEducationalVisualSemanticKind {
  const text = textOf(visual);
  if (visual.visualType === "TABLE") return "TABLE_STRUCTURE";
  if (["GRAPH", "BAR_CHART", "PIE_CHART", "LINE_GRAPH", "SCATTER_PLOT", "COORDINATE_PLANE"].includes(visual.visualType)) return "GRAPH_STRUCTURE";
  if (["TRIANGLE", "CIRCLE", "POLYGON", "GEOMETRY_FIGURE"].includes(visual.visualType) || /triangle|circle|polygon|angle|radius|coordinate|geometry/i.test(text)) return "GEOMETRY_DIAGRAM";
  if (visual.visualType === "CIRCUIT_DIAGRAM" || /circuit|resistor|battery|ammeter|voltmeter|ray|lens|mirror|force|free-body/i.test(text)) return "PHYSICS_DIAGRAM";
  if (visual.visualType === "CHEMISTRY_STRUCTURE" || /benzene|organic|molecule|lewis|reaction|bond|structure/i.test(text)) return "CHEMISTRY_VISUAL";
  if (visual.visualType === "BIOLOGY_DIAGRAM") return "BIOLOGY_DIAGRAM";
  if (visual.visualType === "ENGINEERING_DRAWING") return "ENGINEERING_DIAGRAM";
  if (visual.visualType === "MAP") return "MAP_VISUAL";
  return "GENERIC_EDUCATIONAL_VISUAL";
}

function concepts(kind: NdieEducationalVisualSemanticKind, visual: NdieEducationalVisualSemanticsInput["visuals"][number]) {
  const text = textOf(visual);
  return Array.from(new Set([
    kind.replace(/_/g, " "),
    ...(visual.table ? ["Rows", "Columns", ...(visual.table.mergedCells ? ["Merged Cells"] : []), ...(visual.table.nestedTables ? ["Nested Table"] : [])] : []),
    ...(visual.graph ? ["Axes", ...(visual.graph.origin ? ["Origin"] : []), ...(visual.graph.curves ? ["Curve"] : []), ...(visual.graph.bars ? ["Bars"] : []), ...(visual.graph.pieSlices ? ["Pie Slices"] : [])] : []),
    ...(visual.diagram?.geometryObjects?.length ? ["Geometry Objects"] : []),
    ...(visual.diagram?.circuitSymbols?.length ? ["Circuit Symbols"] : []),
    ...(/coordinate|x-axis|y-axis|origin/i.test(text) ? ["Coordinate System"] : []),
    ...(/benzene|organic|molecule|lewis|bond/i.test(text) ? ["Chemical Structure"] : [])
  ]));
}

function risks(visual: NdieEducationalVisualSemanticsInput["visuals"][number], kind: NdieEducationalVisualSemanticKind, confidence: number): NdieEducationalVisualSemanticRisk[] {
  const output = new Set<NdieEducationalVisualSemanticRisk>();
  if (confidence < 0.72) output.add("LOW_VISUAL_CONFIDENCE");
  if (!visual.crop?.sourcePageImageUrl && !visual.crop?.assetId) output.add("MISSING_VISUAL_CROP");
  if (!visual.caption) output.add("MISSING_CAPTION");
  if (!visual.labels.length && !(visual.diagram?.labels?.length) && !(visual.graph?.labels?.length)) output.add("MISSING_LABELS");
  if (kind === "TABLE_STRUCTURE" && (!visual.table || visual.table.rows <= 0 || visual.table.columns <= 0)) output.add("TABLE_STRUCTURE_REVIEW_REQUIRED");
  if (kind === "GRAPH_STRUCTURE" && (!visual.graph || visual.graph.axes.length === 0 && visual.graph.coordinateSystem === "UNKNOWN")) output.add("GRAPH_AXES_REVIEW_REQUIRED");
  if (["GEOMETRY_DIAGRAM", "PHYSICS_DIAGRAM", "CHEMISTRY_VISUAL", "ENGINEERING_DIAGRAM"].includes(kind) && !visual.diagram && kind !== "CHEMISTRY_VISUAL") output.add("DIAGRAM_RELATIONSHIP_REVIEW_REQUIRED");
  if (!visual.caption && !visual.labels.length) output.add("VISUAL_LINKING_REVIEW_REQUIRED");
  return Array.from(output);
}

function buildStructure(visual: NdieEducationalVisualSemanticsInput["visuals"][number]) {
  return {
    rows: visual.table?.rows,
    columns: visual.table?.columns,
    axes: visual.graph?.axes.map((axis) => axis.label ?? axis.axis),
    originDetected: Boolean(visual.graph?.origin),
    curves: visual.graph?.curves,
    bars: visual.graph?.bars,
    pieSlices: visual.graph?.pieSlices,
    geometryObjects: visual.diagram?.geometryObjects,
    circuitSymbols: visual.diagram?.circuitSymbols,
    shapes: visual.diagram?.shapes.map((shape) => shape.label ?? shape.type),
    arrows: visual.diagram?.arrows,
    connectors: visual.diagram?.connectors
  };
}

function buildObject(visual: NdieEducationalVisualSemanticsInput["visuals"][number]): NdieEducationalVisualSemanticObject {
  const kind = semanticKind(visual);
  const confidence = clamp01(Number(visual.confidence ?? 0.6) + (visual.crop?.sourcePageImageUrl || visual.crop?.assetId ? 0.05 : 0) + (visual.caption ? 0.04 : 0) + (visual.labels.length ? 0.03 : 0));
  const riskList = risks(visual, kind, confidence);
  const semanticVisualId = `visual-sem-${visual.sourcePage}-${hash({ id: visual.visualId, kind })}`;
  const labelRelationships = Array.from(new Set([...visual.labels, ...(visual.diagram?.labels ?? []), ...(visual.graph?.labels ?? [])])).slice(0, 12).map((label) => ({ from: semanticVisualId, to: label, type: "HAS_LABEL" as const, confidence: 0.72 }));
  const axisRelationships = (visual.graph?.axes ?? []).map((axis) => ({ from: semanticVisualId, to: axis.label ?? axis.axis, type: "HAS_AXIS" as const, confidence: 0.72 }));
  return {
    schemaVersion: "ndie-educational-visual-semantics-v1",
    semanticVisualId,
    sourceVisualId: visual.visualId,
    sourceVisualType: visual.visualType,
    sourcePage: visual.sourcePage,
    coordinates: visual.coordinates,
    semanticKind: kind,
    caption: visual.caption,
    labels: visual.labels,
    concepts: concepts(kind, visual),
    extractedStructure: buildStructure(visual),
    relationships: [
      { from: semanticVisualId, to: visual.visualId, type: "USES_VISUAL", confidence },
      ...labelRelationships,
      ...axisRelationships,
      ...(riskList.length ? [{ from: semanticVisualId, to: "TEACHER_REVIEW", type: "NEEDS_REVIEW" as const, confidence: 1 }] : [])
    ],
    confidence,
    risks: riskList,
    teacherReviewRequired: riskList.length > 0 || confidence < 0.88,
    canAutoPublish: riskList.length === 0 && confidence >= 0.96,
    guarantees: {
      originalVisualPreserved: true,
      sourceCropPreservedOrRequired: true,
      noVisualDiscarded: true,
      noInventedDiagram: true
    }
  };
}

export const educationalVisualSemanticsService = {
  version: engineVersion,

  understand(input: NdieEducationalVisualSemanticsInput): NdieEducationalVisualSemanticsResult {
    const objects = input.visuals.map(buildObject);
    const count = (kind: NdieEducationalVisualSemanticKind) => objects.filter((object) => object.semanticKind === kind).length;
    return {
      schemaVersion: "ndie-educational-visual-semantics-document-v1",
      engineVersion,
      importJobId: input.importJobId,
      objects,
      summary: {
        visualCount: objects.length,
        tables: count("TABLE_STRUCTURE"),
        graphs: count("GRAPH_STRUCTURE"),
        diagrams: objects.filter((object) => !["TABLE_STRUCTURE", "GRAPH_STRUCTURE", "GENERIC_EDUCATIONAL_VISUAL"].includes(object.semanticKind)).length,
        geometryDiagrams: count("GEOMETRY_DIAGRAM"),
        physicsDiagrams: count("PHYSICS_DIAGRAM"),
        chemistryVisuals: count("CHEMISTRY_VISUAL"),
        teacherReviewRequired: objects.filter((object) => object.teacherReviewRequired).length,
        autoPublishSafe: objects.filter((object) => object.canAutoPublish).length,
        averageConfidence: clamp01(objects.reduce((sum, object) => sum + object.confidence, 0) / Math.max(1, objects.length))
      }
    };
  },

  health() {
    return {
      status: "ready",
      version: engineVersion,
      supports: ["tables", "graphs", "coordinate planes", "geometry diagrams", "physics circuits", "chemistry structures", "engineering drawings", "labels", "axes", "visual review risks"],
      guarantees: ["no visual discarded", "no invented diagram", "source crop preserved or required", "teacher review required for uncertain visuals"]
    };
  }
};