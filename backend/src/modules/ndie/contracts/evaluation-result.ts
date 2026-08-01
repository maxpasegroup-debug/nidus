import type { NdieLayoutBox } from "./layout-result.js";

export type NdieAnswerKind =
  | "OFFICIAL_ANSWER_KEY"
  | "INLINE_ANSWER_KEY"
  | "SEPARATE_ANSWER_KEY_DOCUMENT"
  | "COMBINED_QUESTION_ANSWER_DOCUMENT"
  | "MULTI_VERSION_ANSWER_KEY";

export type NdieSolutionKind =
  | "STEP_BY_STEP"
  | "SHORT_EXPLANATION"
  | "LONG_EXPLANATION"
  | "WORKED_EXAMPLE"
  | "FORMULA_DERIVATION"
  | "DIAGRAM_EXPLANATION"
  | "TABLE_EXPLANATION";

export type NdieMarkingRule = {
  positiveMarks: number | null;
  negativeMarks: number | null;
  partialMarks: boolean;
  bonusMarks: number | null;
  noNegative: boolean;
  sectionRule: string | null;
  questionRule: string | null;
  multiCorrectScoring: "ALL_OR_NOTHING" | "PARTIAL" | "UNKNOWN";
};

export type NdieRubric = {
  rubricId: string;
  questionId: string | null;
  criteria: string[];
  keywords: string[];
  expectedConcepts: string[];
  modelAnswer: string | null;
  manualEvaluationHints: string[];
  confidence: number | null;
};

export type NdieEvaluationRelationship = {
  relationshipType: "QUESTION" | "ANSWER_KEY" | "SOLUTION" | "RUBRIC" | "MARKING_SCHEME" | "FORMULA" | "DIAGRAM" | "TABLE" | "GRAPH" | "OCR" | "LAYOUT";
  sourceId: string;
  targetId: string;
  confidence: number | null;
  reason: string;
};

export type NdieEvaluationDiagnostics = {
  missingAnswer: boolean;
  duplicateAnswer: boolean;
  answerMismatch: boolean;
  questionMismatch: boolean;
  solutionMismatch: boolean;
  missingExplanation: boolean;
  brokenNumbering: boolean;
  orphanSolutions: boolean;
  conflictingMarking: boolean;
  lowConfidence: boolean;
  issues: string[];
};

export type NdieNormalizedAnswer = {
  answerId: string;
  questionId: string | null;
  questionNumber: string;
  answerKind: NdieAnswerKind;
  correctOptions: string[];
  rawAnswer: string;
  versionLabel: string | null;
  sourceElementIds: string[];
  boundingBoxes: NdieLayoutBox[];
  confidence: number | null;
};

export type NdieNormalizedSolution = {
  solutionId: string;
  questionIds: string[];
  questionNumbers: string[];
  solutionKind: NdieSolutionKind;
  text: string;
  formulaLinks: string[];
  visualLinks: string[];
  sourceElementIds: string[];
  boundingBoxes: NdieLayoutBox[];
  confidence: number | null;
};

export type NdieNormalizedEvaluation = {
  schemaVersion: "ndie-evaluation-v1";
  evaluationId: string;
  questionId: string;
  questionNumber: string;
  answerId: string | null;
  solutionId: string | null;
  rubricId: string | null;
  markingRule: NdieMarkingRule;
  relationships: NdieEvaluationRelationship[];
  confidence: number | null;
  diagnostics: NdieEvaluationDiagnostics;
  version: number;
  pipelineVersion: string;
  checksum: string;
};

export type NdieEvaluationDocument = {
  schemaVersion: "ndie-evaluation-document-v1";
  providerId: string;
  providerVersion: string;
  pipelineVersion: string;
  importJobId: string;
  answers: NdieNormalizedAnswer[];
  solutions: NdieNormalizedSolution[];
  rubrics: NdieRubric[];
  evaluations: NdieNormalizedEvaluation[];
  relationships: NdieEvaluationRelationship[];
  diagnostics: NdieEvaluationDiagnostics;
  metrics: {
    questions: number;
    answers: number;
    solutions: number;
    rubrics: number;
    answerCoverage: number;
    solutionCoverage: number;
    rubricCoverage: number;
    averageConfidence: number | null;
    reviewRequired: number;
    missingAnswers: number;
    duplicateAnswers: number;
    conflicts: number;
  };
  rawProviderOutput: Record<string, unknown>;
  checksum: string;
  durationMs: number;
  createdAt: string;
};

export type NdieEvaluationResult = {
  evaluation: NdieEvaluationDocument;
  answers: Array<{
    questionNumber: string;
    answerJson: Record<string, unknown>;
    sourceDocumentId?: string;
    confidence: number;
  }>;
  solutions: Array<{
    questionNumber: string;
    solutionJson: Record<string, unknown>;
    sourceDocumentId?: string;
    confidence: number;
  }>;
  confidence: number | null;
  raw: Record<string, unknown>;
};
