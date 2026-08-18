import type { NdieProvider } from "./providers.js";

export type NdiePageUnderstandingType =
  | "QUESTION_PAGE"
  | "ANSWER_KEY_PAGE"
  | "SOLUTION_PAGE"
  | "INSTRUCTION_PAGE"
  | "COVER_PAGE"
  | "MIXED_PAGE"
  | "UNKNOWN_PAGE";

export type NdiePageSubjectSignal = "MATHEMATICS" | "PHYSICS" | "CHEMISTRY" | "BIOLOGY" | "GENERAL" | "UNKNOWN";

export type NdiePageUnderstandingRisk =
  | "FORMULA_HEAVY"
  | "DIAGRAM_HEAVY"
  | "GRAPH_HEAVY"
  | "TABLE_HEAVY"
  | "CHEMISTRY_STRUCTURE_HEAVY"
  | "HANDWRITING_RISK"
  | "LOW_TEXT_CONFIDENCE"
  | "MISSING_PAGE_IMAGE"
  | "MULTI_COLUMN_RISK"
  | "QUESTION_SPLIT_RISK";

export type NdiePageUnderstandingBox = {
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  normalized: { x: number; y: number; width: number; height: number };
  polygon: Array<{ x: number; y: number }>;
};

export type NdiePageUnderstandingRegion = {
  id: string;
  page: number;
  role: "QUESTION" | "OPTION" | "FORMULA" | "VISUAL" | "TABLE" | "GRAPH" | "ANSWER" | "SOLUTION" | "INSTRUCTION" | "UNKNOWN";
  text?: string | null;
  box: NdiePageUnderstandingBox;
  sourceIds: string[];
  readingOrder: number;
  confidence: number;
};

export type NdiePageUnderstandingRelationship = {
  from: string;
  to: string;
  type: "NEAR" | "USES_FORMULA" | "USES_VISUAL" | "HAS_OPTION" | "HAS_ANSWER" | "CONTINUES_ON_NEXT_PAGE" | "CAPTION_OF";
  confidence: number;
  reason: string;
};

export type NdiePageUnderstandingDiagnostics = {
  risks: NdiePageUnderstandingRisk[];
  warnings: string[];
  reviewRequired: boolean;
  reasons: string[];
};

export type NdiePageUnderstandingInput = {
  importJobId: string;
  pages: Array<{
    pageId: string;
    pageNumber: number;
    width?: number | null;
    height?: number | null;
    rotation?: number | null;
    dpi?: number | null;
    pageImageUrl?: string | null;
    thumbnailUrl?: string | null;
    ocrText?: string | null;
    ocrJson?: unknown;
    layoutJson?: unknown;
    formulaJson?: unknown;
    visualJson?: unknown;
    assessmentJson?: unknown;
    evaluationJson?: unknown;
    validationJson?: unknown;
  }>;
};

export type NdiePageUnderstandingPage = {
  schemaVersion: "ndie-page-understanding-v1";
  pageId: string;
  pageNumber: number;
  pageType: NdiePageUnderstandingType;
  subjectSignals: Array<{ subject: NdiePageSubjectSignal; confidence: number; reasons: string[] }>;
  regions: NdiePageUnderstandingRegion[];
  relationships: NdiePageUnderstandingRelationship[];
  diagnostics: NdiePageUnderstandingDiagnostics;
  source: {
    consumesRenderedPageImage: boolean;
    consumesOcr: boolean;
    consumesLayout: boolean;
    consumesFormula: boolean;
    consumesVisual: boolean;
    consumesAssessment: boolean;
    consumesEvaluation: boolean;
    consumesValidation: boolean;
    neverReadsRawPdf: true;
  };
  confidence: number;
  providerId: string;
  providerVersion: string;
  pipelineVersion: string;
  checksum: string;
  durationMs: number;
  createdAt: string;
};

export type NdiePageUnderstandingResult = {
  schemaVersion: "ndie-page-understanding-document-v1";
  importJobId: string;
  providerId: string;
  providerVersion: string;
  pipelineVersion: string;
  pages: NdiePageUnderstandingPage[];
  summary: {
    pageCount: number;
    questionPages: number;
    answerKeyPages: number;
    solutionPages: number;
    formulaHeavyPages: number;
    visualHeavyPages: number;
    chemistryStructurePages: number;
    reviewRequiredPages: number;
    averageConfidence: number;
    dominantSubject: NdiePageSubjectSignal;
  };
  diagnostics: {
    reviewRequired: boolean;
    risks: NdiePageUnderstandingRisk[];
    warnings: string[];
  };
  checksum: string;
  durationMs: number;
  createdAt: string;
};

export interface DocumentUnderstandingProvider extends NdieProvider {
  kind: "DOCUMENT_UNDERSTANDING";
  understand(input: NdiePageUnderstandingInput): Promise<NdiePageUnderstandingResult>;
}
