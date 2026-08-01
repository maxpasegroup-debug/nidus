import type { NdieLayoutBox } from "./layout-result.js";

export type NdieFormulaSemanticType =
  | "ARITHMETIC"
  | "ALGEBRA"
  | "LINEAR_ALGEBRA"
  | "MATRIX"
  | "DETERMINANT"
  | "CALCULUS"
  | "LIMIT"
  | "DIFFERENTIATION"
  | "INTEGRATION"
  | "PROBABILITY"
  | "STATISTICS"
  | "COORDINATE_GEOMETRY"
  | "ANALYTICAL_GEOMETRY"
  | "TRIGONOMETRY"
  | "VECTOR"
  | "COMPLEX_NUMBER"
  | "NUMBER_THEORY"
  | "SEQUENCE"
  | "SERIES"
  | "LOGIC"
  | "BOOLEAN_ALGEBRA"
  | "PHYSICS_EQUATION"
  | "CHEMISTRY_EQUATION"
  | "ENGINEERING_EQUATION"
  | "GENERIC_SYMBOLIC_EXPRESSION";

export type NdieFormulaDisplayType = "INLINE" | "DISPLAY";

export type NdieFormulaToken = {
  text: string;
  tokenType: "NUMBER" | "VARIABLE" | "OPERATOR" | "FUNCTION" | "SYMBOL" | "GROUPING" | "UNKNOWN";
  confidence: number | null;
  sourceIndex: number;
};

export type NdieFormulaDiagnostics = {
  brokenFormula: boolean;
  missingSymbols: boolean;
  lowConfidence: boolean;
  unreadableFormula: boolean;
  multipleFormulaRegions: boolean;
  nestedFormula: boolean;
  equationSplitAcrossLines: boolean;
  invalidLatex: boolean;
  invalidMathML: boolean;
  balancedBrackets: boolean;
  unknownSymbols: string[];
  brokenSuperscripts: boolean;
  brokenSubscripts: boolean;
  missingRadicals: boolean;
  missingFractions: boolean;
  invalidMatrices: boolean;
  brokenIntegrals: boolean;
  brokenSummations: boolean;
  issues: string[];
};

export type NdieFormulaConfidence = {
  overall: number | null;
  tokens: number | null;
  operators: number | null;
  symbols: number | null;
  fractions: number | null;
  exponents: number | null;
  roots: number | null;
};

export type NdieFormulaRepresentations = {
  originalImageCrop?: {
    assetId?: string | null;
    sourcePageImageUrl?: string | null;
    coordinates: NdieLayoutBox;
    checksum?: string | null;
    status: "REFERENCE_ONLY" | "CROP_CREATED" | "UNAVAILABLE";
  };
  latex: string | null;
  mathml: string | null;
  plainText: string;
  unicode: string;
  ocrTokens: NdieFormulaToken[];
  ast: Record<string, unknown> | null;
  normalizedExpression: string;
};

export type NdieFormulaEditState = {
  originalLatex: string | null;
  editedLatex: string | null;
  revision: number;
  diff: Array<{ op: "equal" | "insert" | "delete" | "replace"; value: string }>;
  approvalStatus: "PENDING_REVIEW" | "APPROVED" | "REJECTED" | "EDITED";
};

export type NdieNormalizedFormula = {
  schemaVersion: "ndie-formula-v1";
  formulaId: string;
  sourcePage: number;
  sourcePageId: string;
  sourceRegionId: string | null;
  sourceElementId: string | null;
  coordinates: NdieLayoutBox;
  confidence: NdieFormulaConfidence;
  providerId: string;
  providerVersion: string;
  pipelineVersion: string;
  formulaType: NdieFormulaDisplayType;
  semanticType: NdieFormulaSemanticType;
  equationNumber: string | null;
  readingOrder: number;
  dependencies: string[];
  renderStatus: "NOT_RENDERED" | "PREVIEW_READY" | "RENDER_FAILED" | "REQUIRES_TEACHER_REVIEW";
  renderer: {
    provider: "KATEX_COMPATIBLE" | "MATHJAX_COMPATIBLE" | "PLACEHOLDER";
    previewSvg?: string | null;
    previewImageUrl?: string | null;
    error?: string | null;
  };
  representations: NdieFormulaRepresentations;
  diagnostics: NdieFormulaDiagnostics;
  editState: NdieFormulaEditState;
  rawProviderOutput: Record<string, unknown>;
  checksum: string;
  durationMs: number;
  createdAt: string;
};

export type NdieFormulaResult = {
  formulas: NdieNormalizedFormula[];
  elements: Array<{
    elementType: "FORMULA" | "CHEMICAL_EQUATION";
    text: string;
    normalizedText?: string;
    coordinates: Record<string, unknown>;
    readingOrder?: number;
    confidence?: number | null;
    metadata?: Record<string, unknown>;
  }>;
  confidence: number | null;
  raw: Record<string, unknown>;
};
