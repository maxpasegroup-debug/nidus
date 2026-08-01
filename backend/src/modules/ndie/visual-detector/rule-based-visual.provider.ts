import { createHash } from "node:crypto";
import { env } from "../../../config/env.js";
import type { NdieLayoutBox } from "../contracts/layout-result.js";
import type { NdieEducationalVisualType, NdieNormalizedVisual, NdieVisualDiagnostics } from "../contracts/visual-result.js";
import type { VisualProvider } from "../contracts/providers.js";

type VisualInput = Parameters<VisualProvider["detect"]>[0];
type VisualElement = VisualInput["layoutElements"][number];

const tableSignal = /\b(table|tabular|row|column|data given|following data|schedule)\b|[|]\s*[^|]+\s*[|]/i;
const graphSignal = /\b(graph|chart|plot|coordinate plane|x-axis|y-axis|axis|axes|histogram|curve|slope|origin)\b/i;
const barSignal = /\bbar graph|bar chart|histogram\b/i;
const pieSignal = /\bpie chart|pie diagram|sector\b/i;
const lineSignal = /\bline graph|trend line|curve\b/i;
const scatterSignal = /\bscatter|scatter plot\b/i;
const geometrySignal = /\btriangle|circle|polygon|quadrilateral|parabola|ellipse|hyperbola|geometry|angle|radius|diameter|chord|tangent\b/i;
const circuitSignal = /\bcircuit|resistor|capacitor|battery|switch|ammeter|voltmeter|diode|current|wire\b/i;
const flowSignal = /\bflow chart|flowchart|process diagram|workflow|arrow\b/i;
const biologySignal = /\bcell|organ|heart|leaf|flower|digestive|respiratory|biology|neuron|tissue\b/i;
const chemistrySignal = /\bstructure|benzene|organic|molecule|bond|compound|chemical structure|lewis\b/i;
const mapSignal = /\bmap|route|region|state|country|river|mountain|latitude|longitude\b/i;
const imageSignal = /\bimage|photo|photograph|picture|icon|figure|fig\.|diagram|shown below|given below\b/i;

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function asBox(raw: unknown, page: number): NdieLayoutBox {
  const source = record(raw);
  const normalized = record(source.normalized);
  const x = Number(source.x ?? normalized.x ?? 0.06);
  const y = Number(source.y ?? normalized.y ?? 0.08);
  const width = Number(source.width ?? normalized.width ?? 0.35);
  const height = Number(source.height ?? normalized.height ?? 0.12);
  const rotation = Number(source.rotation ?? 0);
  const polygon = Array.isArray(source.polygon) ? source.polygon as Array<{ x: number; y: number }> : [
    { x, y },
    { x: x + width, y },
    { x: x + width, y: y + height },
    { x, y: y + height }
  ];
  return { page, x, y, width, height, rotation, normalized: { x, y, width, height }, polygon };
}

function visualElementType(visualType: NdieEducationalVisualType): "TABLE" | "GRAPH" | "DIAGRAM" | "IMAGE" {
  if (visualType === "TABLE") return "TABLE";
  if (["GRAPH", "BAR_CHART", "PIE_CHART", "LINE_GRAPH", "SCATTER_PLOT", "COORDINATE_PLANE"].includes(visualType)) return "GRAPH";
  if (["PHOTOGRAPH", "ICON", "GENERIC_IMAGE"].includes(visualType)) return "IMAGE";
  return "DIAGRAM";
}

function classify(text: string, elementType: string): NdieEducationalVisualType | null {
  if (elementType === "TABLE_AREA" || tableSignal.test(text)) return "TABLE";
  if (barSignal.test(text)) return "BAR_CHART";
  if (pieSignal.test(text)) return "PIE_CHART";
  if (lineSignal.test(text)) return "LINE_GRAPH";
  if (scatterSignal.test(text)) return "SCATTER_PLOT";
  if (/coordinate plane|x-axis|y-axis|origin/i.test(text)) return "COORDINATE_PLANE";
  if (elementType === "GRAPH_AREA" || graphSignal.test(text)) return "GRAPH";
  if (/triangle/i.test(text)) return "TRIANGLE";
  if (/circle/i.test(text)) return "CIRCLE";
  if (/polygon|quadrilateral/i.test(text)) return "POLYGON";
  if (geometrySignal.test(text)) return "GEOMETRY_FIGURE";
  if (circuitSignal.test(text)) return "CIRCUIT_DIAGRAM";
  if (flowSignal.test(text)) return "FLOW_CHART";
  if (biologySignal.test(text)) return "BIOLOGY_DIAGRAM";
  if (chemistrySignal.test(text)) return "CHEMISTRY_STRUCTURE";
  if (/engineering|machine|drawing|blueprint|sectional view/i.test(text)) return "ENGINEERING_DRAWING";
  if (mapSignal.test(text)) return "MAP";
  if (/photo|photograph/i.test(text)) return "PHOTOGRAPH";
  if (/icon/i.test(text)) return "ICON";
  if (elementType === "DIAGRAM_AREA") return "SCIENTIFIC_FIGURE";
  if (imageSignal.test(text)) return "GENERIC_IMAGE";
  return null;
}

function close(a: NdieLayoutBox, b: NdieLayoutBox) {
  const ax = a.x + a.width / 2;
  const ay = a.y + a.height / 2;
  const bx = b.x + b.width / 2;
  const by = b.y + b.height / 2;
  return Math.hypot(ax - bx, ay - by) <= 0.24;
}

function labelsFrom(text: string) {
  return Array.from(new Set((text.match(/\b[A-Z][A-Za-z0-9]{0,5}\b/g) ?? []).slice(0, 8)));
}

function diagnosticsFor(input: { confidence: number; caption: string | null; labels: string[]; type: NdieEducationalVisualType; box: NdieLayoutBox }): NdieVisualDiagnostics {
  const graph = ["GRAPH", "BAR_CHART", "PIE_CHART", "LINE_GRAPH", "SCATTER_PLOT", "COORDINATE_PLANE"].includes(input.type);
  const table = input.type === "TABLE";
  const diagram = !graph && !table && !["PHOTOGRAPH", "ICON", "GENERIC_IMAGE"].includes(input.type);
  const diagnostics: NdieVisualDiagnostics = {
    lowConfidence: input.confidence < env.NDIE_VISUAL_CONFIDENCE_WARNING,
    brokenFigure: input.box.width <= 0 || input.box.height <= 0,
    overlappingVisuals: false,
    missingCaption: !input.caption,
    missingLabels: diagram && input.labels.length === 0,
    lowResolution: input.box.width * input.box.height < 0.002,
    unreadableGraph: graph && input.confidence < 0.65,
    unreadableTable: table && input.confidence < 0.65,
    unreadableDiagram: diagram && input.confidence < 0.65,
    issues: []
  };
  if (diagnostics.lowConfidence) diagnostics.issues.push("LOW_CONFIDENCE");
  if (diagnostics.brokenFigure) diagnostics.issues.push("BROKEN_FIGURE");
  if (diagnostics.missingCaption) diagnostics.issues.push("MISSING_CAPTION");
  if (diagnostics.missingLabels) diagnostics.issues.push("MISSING_LABELS");
  if (diagnostics.lowResolution) diagnostics.issues.push("LOW_RESOLUTION");
  if (diagnostics.unreadableGraph) diagnostics.issues.push("UNREADABLE_GRAPH");
  if (diagnostics.unreadableTable) diagnostics.issues.push("UNREADABLE_TABLE");
  if (diagnostics.unreadableDiagram) diagnostics.issues.push("UNREADABLE_DIAGRAM");
  return diagnostics;
}

function tableStructure(text: string, box: NdieLayoutBox) {
  const rows = text.split(/\n|;/).filter(Boolean);
  const columns = Math.max(1, ...rows.map((row) => row.split(/[|\t,]/).filter(Boolean).length));
  return {
    rows: Math.max(1, rows.length),
    columns,
    mergedCells: false,
    nestedTables: false,
    headers: rows[0] ? rows[0].split(/[|\t,]/).map((cell) => cell.trim()).filter(Boolean) : [],
    bodyRegionIds: [],
    footers: [],
    captions: [],
    coordinates: box
  };
}

function graphStructure(text: string) {
  return {
    axes: [
      ...(text.match(/x-axis|x axis/i) ? [{ axis: "x" as const, label: "x-axis" }] : []),
      ...(text.match(/y-axis|y axis/i) ? [{ axis: "y" as const, label: "y-axis" }] : [])
    ],
    origin: /origin|\(0,\s*0\)/i.test(text) ? { x: 0, y: 0 } : null,
    grid: /grid|coordinate plane/i.test(text),
    legends: text.match(/legend[^.]+/i) ? [text.match(/legend[^.]+/i)![0]] : [],
    labels: labelsFrom(text),
    scale: text.match(/scale\s*[:=]\s*([^.]+)/i)?.[1] ?? null,
    curves: /curve|parabola|ellipse|hyperbola/i.test(text) ? 1 : 0,
    bars: /bar|histogram/i.test(text) ? 1 : 0,
    pieSlices: /pie|sector/i.test(text) ? 1 : 0,
    trendLines: /trend line|line graph/i.test(text) ? 1 : 0,
    coordinateSystem: /coordinate|x-axis|y-axis|origin/i.test(text) ? "CARTESIAN" as const : "UNKNOWN" as const
  };
}

function diagramStructure(text: string) {
  return {
    shapes: [
      ...(text.match(/triangle/i) ? [{ type: "TRIANGLE" as const, label: "triangle" }] : []),
      ...(text.match(/circle/i) ? [{ type: "CIRCLE" as const, label: "circle" }] : []),
      ...(text.match(/rectangle/i) ? [{ type: "RECTANGLE" as const, label: "rectangle" }] : [])
    ],
    connectors: (text.match(/\bconnect|joined|linked|wire|line\b/gi) ?? []).length,
    arrows: (text.match(/arrow|->|→/gi) ?? []).length,
    labels: labelsFrom(text),
    nodes: (text.match(/\bnode|junction|point\b/gi) ?? []).length,
    groups: 1,
    relationships: [],
    geometryObjects: (text.match(/\btriangle|circle|polygon|angle|radius|diameter|chord|tangent\b/gi) ?? []),
    circuitSymbols: (text.match(/\bresistor|capacitor|battery|switch|ammeter|voltmeter|diode\b/gi) ?? [])
  };
}

export class RuleBasedVisualProvider implements VisualProvider {
  readonly id = "visual.rule-based";
  readonly kind = "VISUAL" as const;
  readonly displayName = "NDIE Rule-Based Educational Visual Intelligence";
  readonly version = "1.0-gate7";

  isEnabled() {
    return true;
  }

  health() {
    return {
      id: this.id,
      kind: this.kind,
      enabled: true,
      configured: true,
      status: "READY" as const
    };
  }

  async detect(input: VisualInput) {
    const startedAt = Date.now();
    const candidates = input.layoutElements
      .map((element) => ({ element, text: String(element.text ?? ""), type: classify(String(element.text ?? ""), element.elementType) }))
      .filter((candidate): candidate is { element: VisualElement; text: string; type: NdieEducationalVisualType } => Boolean(candidate.type));

    const visuals: NdieNormalizedVisual[] = candidates.map((candidate, index) => {
      const box = asBox(candidate.element.coordinates, input.pageNumber);
      const nearbyOcr = input.layoutElements.filter((element) => close(box, asBox(element.coordinates, input.pageNumber))).map((element) => element.id);
      const nearbyFormula = input.formulaElements.filter((element) => close(box, asBox(element.coordinates, input.pageNumber))).map((element) => element.id);
      const caption = /(?:fig\.?|figure|table|graph|chart|diagram)\s*\d*[:.-]?\s*(.+)/i.exec(candidate.text)?.[1]?.trim() ?? candidate.text;
      const labels = labelsFrom(candidate.text);
      const confidence = Math.max(0.2, Math.min(0.96, Number(candidate.element.confidence ?? 0.72) + (caption ? 0.05 : 0) + (labels.length ? 0.03 : 0)));
      const diagnostics = diagnosticsFor({ confidence, caption, labels, type: candidate.type, box });
      const visualId = `visual-${input.pageNumber}-${index + 1}-${createHash("sha1").update(`${candidate.element.id}:${candidate.text}`).digest("hex").slice(0, 10)}`;
      return {
        schemaVersion: "ndie-visual-v1",
        visualId,
        sourcePage: input.pageNumber,
        sourcePageId: input.pageId,
        sourceRegionId: candidate.element.id,
        coordinates: box,
        confidence,
        providerId: this.id,
        providerVersion: this.version,
        pipelineVersion: env.NDIE_PIPELINE_VERSION,
        visualType: candidate.type,
        caption,
        labels,
        linkedOcrRegionIds: nearbyOcr,
        linkedFormulaRegionIds: nearbyFormula,
        linkedQuestionRegionIds: [],
        readingOrder: candidate.element.readingOrder ?? index + 1,
        ...(candidate.type === "TABLE" ? { table: tableStructure(candidate.text, box) } : {}),
        ...(["GRAPH", "BAR_CHART", "PIE_CHART", "LINE_GRAPH", "SCATTER_PLOT", "COORDINATE_PLANE"].includes(candidate.type) ? { graph: graphStructure(candidate.text) } : {}),
        ...(visualElementType(candidate.type) === "DIAGRAM" ? { diagram: diagramStructure(candidate.text) } : {}),
        crop: {
          sourcePageImageUrl: input.pageImageUrl ?? null,
          status: input.pageImageUrl ? "REFERENCE_ONLY" : "UNAVAILABLE"
        },
        diagnostics,
        providerMetadata: {
          provider: this.id,
          sourceElementType: candidate.element.elementType,
          layoutJsonConsumed: Boolean(input.layoutJson),
          ocrJsonConsumed: Boolean(input.ocrJson),
          formulaElementsAvailable: input.formulaElements.length
        },
        checksum: createHash("sha256").update(JSON.stringify({ visualId, type: candidate.type, box, caption, labels })).digest("hex"),
        durationMs: Date.now() - startedAt,
        createdAt: new Date().toISOString()
      };
    });

    const averageConfidence = visuals.length ? Number((visuals.reduce((sum, visual) => sum + Number(visual.confidence ?? 0), 0) / visuals.length).toFixed(4)) : null;
    return {
      visuals,
      elements: visuals.map((visual) => ({
        elementType: visualElementType(visual.visualType),
        text: visual.caption ?? undefined,
        normalizedText: visual.caption?.toLowerCase(),
        coordinates: visual.coordinates,
        readingOrder: visual.readingOrder,
        confidence: visual.confidence,
        metadata: {
          visual,
          provider: this.id,
          visualId: visual.visualId,
          visualType: visual.visualType,
          linkedOcrRegionIds: visual.linkedOcrRegionIds,
          linkedFormulaRegionIds: visual.linkedFormulaRegionIds,
          requiresTeacherVisualReview: visual.diagnostics.issues.length > 0
        }
      })),
      confidence: averageConfidence,
      raw: {
        provider: this.id,
        candidateCount: candidates.length,
        visualCount: visuals.length,
        visualTypes: visuals.reduce<Record<string, number>>((acc, visual) => {
          acc[visual.visualType] = (acc[visual.visualType] ?? 0) + 1;
          return acc;
        }, {})
      }
    };
  }
}
