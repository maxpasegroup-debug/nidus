import type { NdieLayoutBox } from "./layout-result.js";

export type NdieAssessmentRegionType =
  | "COVER_PAGE"
  | "INSTRUCTIONS"
  | "SECTION"
  | "SUBSECTION"
  | "QUESTION_GROUP"
  | "PASSAGE"
  | "SHARED_DIAGRAM"
  | "SHARED_GRAPH"
  | "SHARED_TABLE"
  | "ANSWER_KEY_SECTION"
  | "SOLUTION_SECTION"
  | "APPENDIX"
  | "REFERENCE";

export type NdieQuestionType =
  | "SINGLE_CORRECT_MCQ"
  | "MULTIPLE_CORRECT_MCQ"
  | "TRUE_FALSE"
  | "FILL_BLANK"
  | "NUMERICAL_ANSWER"
  | "INTEGER_TYPE"
  | "MATCH_THE_FOLLOWING"
  | "ASSERTION_REASON"
  | "PASSAGE_BASED"
  | "CASE_STUDY"
  | "DIAGRAM_BASED"
  | "GRAPH_BASED"
  | "TABLE_BASED"
  | "DESCRIPTIVE"
  | "PROGRAMMING"
  | "FILE_UPLOAD"
  | "DRAWING"
  | "VOICE_RESPONSE";

export type NdieAssessmentOption = {
  key: string;
  text: string;
  blocks: Array<{
    type: "ParagraphBlock" | "FormulaBlock" | "ImageBlock" | "TableBlock" | "DiagramBlock" | "GraphBlock";
    text?: string;
    sourceElementIds: string[];
  }>;
  confidence: number | null;
  nestedOptions: NdieAssessmentOption[];
  visualLinks: string[];
  formulaLinks: string[];
  tableLinks: string[];
};

export type NdieAssessmentRelationship = {
  relationshipType: "PASSAGE" | "DIAGRAM" | "FORMULA" | "TABLE" | "GRAPH" | "CAPTION" | "LABEL" | "QUESTION" | "OCR" | "LAYOUT";
  targetId: string;
  confidence: number | null;
  reason: string;
};

export type NdieAssessmentDiagnostics = {
  missingOptions: boolean;
  duplicateNumbering: boolean;
  brokenNumbering: boolean;
  sharedDiagramAmbiguity: boolean;
  questionSplitAcrossPages: boolean;
  lowConfidence: boolean;
  orphanVisuals: boolean;
  orphanFormulas: boolean;
  missingMarks: boolean;
  unsupportedStructures: boolean;
  issues: string[];
};

export type NdieAssessmentStructureNode = {
  id: string;
  type: NdieAssessmentRegionType;
  title: string;
  pageNumber: number;
  sourceElementIds: string[];
  coordinates?: NdieLayoutBox | null;
  readingOrder: number;
  confidence: number | null;
};

export type NdieNormalizedQuestion = {
  schemaVersion: "ndie-question-v1";
  questionId: string;
  questionNumber: string;
  questionType: NdieQuestionType;
  parentQuestionId: string | null;
  childQuestionIds: string[];
  linkedQuestionIds: string[];
  sectionId: string | null;
  passageId: string | null;
  sharedResourceIds: string[];
  marks: number | null;
  difficulty: "EASY" | "MEDIUM" | "HARD" | "UNKNOWN";
  subject: string | null;
  topic: string | null;
  bloomLevel: "REMEMBER" | "UNDERSTAND" | "APPLY" | "ANALYZE" | "EVALUATE" | "CREATE" | "UNKNOWN";
  text: string;
  options: NdieAssessmentOption[];
  relationships: NdieAssessmentRelationship[];
  visualLinks: string[];
  formulaLinks: string[];
  ocrLinks: string[];
  layoutLinks: string[];
  boundingBoxes: NdieLayoutBox[];
  readingOrder: number;
  confidence: number | null;
  diagnostics: NdieAssessmentDiagnostics;
  version: number;
  pipelineVersion: string;
  checksum: string;
};

export type NdieAssessmentDocument = {
  schemaVersion: "ndie-assessment-v1";
  providerId: string;
  providerVersion: string;
  pipelineVersion: string;
  importJobId: string;
  structure: NdieAssessmentStructureNode[];
  questions: NdieNormalizedQuestion[];
  relationships: NdieAssessmentRelationship[];
  diagnostics: NdieAssessmentDiagnostics;
  metrics: {
    questions: number;
    sections: number;
    groups: number;
    passages: number;
    options: number;
    questionTypes: Record<string, number>;
    averageConfidence: number | null;
    reviewRequired: number;
  };
  rawProviderOutput: Record<string, unknown>;
  checksum: string;
  durationMs: number;
  createdAt: string;
};

export type NdieAssessmentResult = {
  assessment: NdieAssessmentDocument;
  questions: Array<{
    questionNumber: string;
    questionType: string;
    text: string;
    sourceElementIds: string[];
    sourceMap: Record<string, unknown>;
    confidence: number;
    normalizedQuestion: NdieNormalizedQuestion;
  }>;
  confidence: number | null;
  raw: Record<string, unknown>;
};
