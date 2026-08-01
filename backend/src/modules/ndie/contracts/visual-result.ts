import type { NdieLayoutBox } from "./layout-result.js";

export type NdieEducationalVisualType =
  | "TABLE"
  | "GRAPH"
  | "BAR_CHART"
  | "PIE_CHART"
  | "LINE_GRAPH"
  | "SCATTER_PLOT"
  | "COORDINATE_PLANE"
  | "GEOMETRY_FIGURE"
  | "TRIANGLE"
  | "CIRCLE"
  | "POLYGON"
  | "ENGINEERING_DRAWING"
  | "CIRCUIT_DIAGRAM"
  | "FLOW_CHART"
  | "BIOLOGY_DIAGRAM"
  | "CHEMISTRY_STRUCTURE"
  | "MAP"
  | "PHOTOGRAPH"
  | "ICON"
  | "GENERIC_IMAGE"
  | "SCIENTIFIC_FIGURE";

export type NdieVisualDiagnostics = {
  lowConfidence: boolean;
  brokenFigure: boolean;
  overlappingVisuals: boolean;
  missingCaption: boolean;
  missingLabels: boolean;
  lowResolution: boolean;
  unreadableGraph: boolean;
  unreadableTable: boolean;
  unreadableDiagram: boolean;
  issues: string[];
};

export type NdieVisualTableStructure = {
  rows: number;
  columns: number;
  mergedCells: boolean;
  nestedTables: boolean;
  headers: string[];
  bodyRegionIds: string[];
  footers: string[];
  captions: string[];
  coordinates: NdieLayoutBox;
};

export type NdieVisualGraphStructure = {
  axes: Array<{ axis: "x" | "y" | "unknown"; label?: string; coordinates?: NdieLayoutBox }>;
  origin?: { x: number; y: number } | null;
  grid: boolean;
  legends: string[];
  labels: string[];
  scale?: string | null;
  curves: number;
  bars: number;
  pieSlices: number;
  trendLines: number;
  coordinateSystem: "CARTESIAN" | "POLAR" | "UNKNOWN";
};

export type NdieVisualDiagramStructure = {
  shapes: Array<{ type: "RECTANGLE" | "CIRCLE" | "TRIANGLE" | "POLYGON" | "LINE" | "UNKNOWN"; label?: string }>;
  connectors: number;
  arrows: number;
  labels: string[];
  nodes: number;
  groups: number;
  relationships: Array<{ from?: string; to?: string; relation: string }>;
  geometryObjects: string[];
  circuitSymbols: string[];
};

export type NdieNormalizedVisual = {
  schemaVersion: "ndie-visual-v1";
  visualId: string;
  sourcePage: number;
  sourcePageId: string;
  sourceRegionId: string | null;
  coordinates: NdieLayoutBox;
  confidence: number | null;
  providerId: string;
  providerVersion: string;
  pipelineVersion: string;
  visualType: NdieEducationalVisualType;
  caption: string | null;
  labels: string[];
  linkedOcrRegionIds: string[];
  linkedFormulaRegionIds: string[];
  linkedQuestionRegionIds: string[];
  readingOrder: number;
  table?: NdieVisualTableStructure;
  graph?: NdieVisualGraphStructure;
  diagram?: NdieVisualDiagramStructure;
  crop?: {
    sourcePageImageUrl?: string | null;
    assetId?: string | null;
    status: "REFERENCE_ONLY" | "CROP_CREATED" | "UNAVAILABLE";
    checksum?: string | null;
  };
  diagnostics: NdieVisualDiagnostics;
  providerMetadata: Record<string, unknown>;
  checksum: string;
  durationMs: number;
  createdAt: string;
};

export type NdieVisualResult = {
  visuals: NdieNormalizedVisual[];
  elements: Array<{
    elementType: "TABLE" | "GRAPH" | "DIAGRAM" | "IMAGE";
    text?: string;
    normalizedText?: string;
    coordinates: Record<string, unknown>;
    readingOrder?: number;
    confidence?: number | null;
    metadata?: Record<string, unknown>;
  }>;
  confidence: number | null;
  raw: Record<string, unknown>;
};
