import type { NdieLayoutBox } from "./layout-result.js";
import type { NdieEducationalVisualType } from "./visual-result.js";

export type NdieEducationalVisualSemanticKind =
  | "TABLE_STRUCTURE"
  | "GRAPH_STRUCTURE"
  | "GEOMETRY_DIAGRAM"
  | "PHYSICS_DIAGRAM"
  | "CHEMISTRY_VISUAL"
  | "BIOLOGY_DIAGRAM"
  | "ENGINEERING_DIAGRAM"
  | "MAP_VISUAL"
  | "GENERIC_EDUCATIONAL_VISUAL";

export type NdieEducationalVisualSemanticRisk =
  | "LOW_VISUAL_CONFIDENCE"
  | "MISSING_VISUAL_CROP"
  | "MISSING_CAPTION"
  | "MISSING_LABELS"
  | "TABLE_STRUCTURE_REVIEW_REQUIRED"
  | "GRAPH_AXES_REVIEW_REQUIRED"
  | "DIAGRAM_RELATIONSHIP_REVIEW_REQUIRED"
  | "VISUAL_LINKING_REVIEW_REQUIRED";

export type NdieEducationalVisualSemanticObject = {
  schemaVersion: "ndie-educational-visual-semantics-v1";
  semanticVisualId: string;
  sourceVisualId: string;
  sourceVisualType: NdieEducationalVisualType;
  sourcePage: number;
  coordinates: NdieLayoutBox;
  semanticKind: NdieEducationalVisualSemanticKind;
  caption: string | null;
  labels: string[];
  concepts: string[];
  extractedStructure: {
    rows?: number;
    columns?: number;
    axes?: string[];
    originDetected?: boolean;
    curves?: number;
    bars?: number;
    pieSlices?: number;
    geometryObjects?: string[];
    circuitSymbols?: string[];
    shapes?: string[];
    arrows?: number;
    connectors?: number;
  };
  relationships: Array<{ from: string; to: string; type: "USES_VISUAL" | "HAS_LABEL" | "HAS_AXIS" | "HAS_STRUCTURE" | "NEEDS_REVIEW"; confidence: number }>;
  confidence: number;
  risks: NdieEducationalVisualSemanticRisk[];
  teacherReviewRequired: boolean;
  canAutoPublish: boolean;
  guarantees: {
    originalVisualPreserved: true;
    sourceCropPreservedOrRequired: true;
    noVisualDiscarded: true;
    noInventedDiagram: true;
  };
};

export type NdieEducationalVisualSemanticsInput = {
  importJobId: string;
  visuals: Array<{
    visualId: string;
    sourcePage: number;
    visualType: NdieEducationalVisualType;
    coordinates: NdieLayoutBox;
    confidence: number | null;
    caption: string | null;
    labels: string[];
    crop?: { sourcePageImageUrl?: string | null; assetId?: string | null; status: "REFERENCE_ONLY" | "CROP_CREATED" | "UNAVAILABLE" };
    table?: { rows: number; columns: number; mergedCells: boolean; nestedTables: boolean; headers: string[] };
    graph?: { axes: Array<{ axis: "x" | "y" | "unknown"; label?: string }>; origin?: { x: number; y: number } | null; curves: number; bars: number; pieSlices: number; coordinateSystem: "CARTESIAN" | "POLAR" | "UNKNOWN"; labels: string[] };
    diagram?: { shapes: Array<{ type: string; label?: string }>; connectors: number; arrows: number; labels: string[]; geometryObjects: string[]; circuitSymbols: string[] };
  }>;
};

export type NdieEducationalVisualSemanticsResult = {
  schemaVersion: "ndie-educational-visual-semantics-document-v1";
  engineVersion: string;
  importJobId: string;
  objects: NdieEducationalVisualSemanticObject[];
  summary: {
    visualCount: number;
    tables: number;
    graphs: number;
    diagrams: number;
    geometryDiagrams: number;
    physicsDiagrams: number;
    chemistryVisuals: number;
    teacherReviewRequired: number;
    autoPublishSafe: number;
    averageConfidence: number;
  };
};