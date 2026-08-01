export type NdieLayoutPoint = {
  x: number;
  y: number;
};

export type NdieLayoutBox = {
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  normalized: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  polygon: NdieLayoutPoint[];
};

export type NdieLayoutRegionClassification =
  | "TEXT_REGION"
  | "HEADER"
  | "FOOTER"
  | "PAGE_NUMBER"
  | "QUESTION_AREA"
  | "ANSWER_AREA"
  | "INSTRUCTION_AREA"
  | "DIAGRAM_AREA"
  | "GRAPH_AREA"
  | "TABLE_AREA"
  | "FORMULA_AREA"
  | "MARGIN_NOTE"
  | "UNKNOWN_REGION";

export type NdieLayoutWord = {
  text: string;
  confidence: number | null;
  coordinates: NdieLayoutBox;
  readingOrder: number;
  sourceReference: Record<string, unknown>;
};

export type NdieLayoutLine = {
  text: string;
  confidence: number | null;
  coordinates: NdieLayoutBox;
  readingOrder: number;
  words: NdieLayoutWord[];
  sourceReference: Record<string, unknown>;
};

export type NdieLayoutParagraph = {
  text: string;
  confidence: number | null;
  coordinates: NdieLayoutBox;
  readingOrder: number;
  lines: NdieLayoutLine[];
  sourceReference: Record<string, unknown>;
};

export type NdieLayoutColumn = {
  columnNumber: number;
  coordinates: NdieLayoutBox;
  readingOrder: number;
  confidence: number | null;
  regionIds: string[];
};

export type NdieLayoutTableCell = {
  row: number;
  column: number;
  rowSpan: number;
  colSpan: number;
  text?: string;
  coordinates: NdieLayoutBox;
  confidence: number | null;
};

export type NdieLayoutTable = {
  id: string;
  coordinates: NdieLayoutBox;
  rows: number;
  columns: number;
  cells: NdieLayoutTableCell[];
  multiPage: boolean;
  nested: boolean;
  confidence: number | null;
  sourceRegionIds: string[];
};

export type NdieLayoutFigureKind = "IMAGE" | "FIGURE" | "CHART" | "GRAPH" | "DIAGRAM" | "UNKNOWN";

export type NdieLayoutFigure = {
  id: string;
  kind: NdieLayoutFigureKind;
  coordinates: NdieLayoutBox;
  caption?: string;
  confidence: number | null;
  sourceRegionIds: string[];
};

export type NdieLayoutRegion = {
  id: string;
  classification: NdieLayoutRegionClassification;
  text?: string;
  normalizedText?: string;
  confidence: number | null;
  coordinates: NdieLayoutBox;
  readingOrder: number;
  columnNumber?: number;
  paragraphIds: string[];
  lineIds: string[];
  sourceReference: Record<string, unknown>;
  providerMetadata: Record<string, unknown>;
};

export type NdieReadingGroup = {
  id: string;
  groupType: "COLUMN" | "QUESTION_GROUP" | "TABLE" | "FIGURE" | "INSTRUCTION" | "UNKNOWN";
  readingOrder: number;
  coordinates: NdieLayoutBox;
  regionIds: string[];
  confidence: number | null;
};

export type NdieLayoutDiagnostics = {
  overlappingRegions: boolean;
  missingReadingOrder: boolean;
  lowConfidence: boolean;
  pageSkew: boolean;
  brokenColumns: boolean;
  tableAmbiguity: boolean;
  figureAmbiguity: boolean;
  issues: string[];
};

export type NdieNormalizedLayoutPage = {
  schemaVersion: "ndie-layout-v1";
  providerId: string;
  providerVersion: string;
  pipelineVersion: string;
  pageId: string;
  pageNumber: number;
  page: {
    width: number | null;
    height: number | null;
    rotation: number | null;
    dpi: number | null;
    aspectRatio: number | null;
  };
  regions: NdieLayoutRegion[];
  paragraphs: NdieLayoutParagraph[];
  lines: NdieLayoutLine[];
  words: NdieLayoutWord[];
  columns: NdieLayoutColumn[];
  tables: NdieLayoutTable[];
  figures: NdieLayoutFigure[];
  headers: NdieLayoutRegion[];
  footers: NdieLayoutRegion[];
  pageNumbers: NdieLayoutRegion[];
  margins: NdieLayoutRegion[];
  readingGroups: NdieReadingGroup[];
  readingOrder: string[];
  confidence: number | null;
  diagnostics: NdieLayoutDiagnostics;
  providerMetadata: Record<string, unknown>;
  checksum: string;
  durationMs: number;
  createdAt: string;
};

export type NdieLayoutResult = {
  normalized: NdieNormalizedLayoutPage;
  raw: Record<string, unknown>;
  elements: Array<{
    elementType: string;
    text?: string;
    normalizedText?: string;
    coordinates: Record<string, unknown>;
    readingOrder?: number;
    confidence?: number | null;
    metadata?: Record<string, unknown>;
  }>;
  layoutJson: NdieNormalizedLayoutPage;
  confidence: number | null;
};
