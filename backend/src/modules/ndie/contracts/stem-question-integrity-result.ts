export type NdieStemQuestionIntegritySeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type NdieStemQuestionIntegrityIssueCode =
  | "EMPTY_QUESTION_TEXT"
  | "MISSING_QUESTION_NUMBER"
  | "INCOMPLETE_OPTIONS"
  | "MISSING_OPTION_LABEL"
  | "DUPLICATE_OPTION_LABEL"
  | "DUPLICATE_OPTION_TEXT"
  | "MISSING_ANSWER"
  | "ANSWER_OPTION_MISMATCH"
  | "MISSING_FORMULA_REFERENCE"
  | "MISSING_VISUAL_REFERENCE"
  | "LOW_DRAFT_CONFIDENCE"
  | "QUESTION_NEEDS_REVIEW"
  | "FORMULA_REVIEW_REQUIRED"
  | "VISUAL_REVIEW_REQUIRED"
  | "CHEMISTRY_STRUCTURE_REVIEW_REQUIRED"
  | "SOURCE_PAGE_MISSING"
  | "SOURCE_CROP_MISSING"
  | "DUPLICATE_QUESTION_NUMBER"
  | "BROKEN_NUMBERING";

export type NdieStemQuestionIntegrityIssue = {
  code: NdieStemQuestionIntegrityIssueCode;
  severity: NdieStemQuestionIntegritySeverity;
  message: string;
  recommendedAction: string;
};

export type NdieStemQuestionIntegrityQuestionInput = {
  questionId?: string;
  number: number | string;
  questionText?: string;
  questionType?: string;
  options?: Array<{ label?: string; text?: string }>;
  linkedAnswer?: string | null;
  linkedSolution?: string | null;
  linkedAssets?: string[];
  recoveredFormula?: string | null;
  sourcePage?: number | null;
  originalCrop?: string | null;
  draftConfidence?: number | null;
  reviewStatus?: string | null;
  missingItems?: string[];
};

export type NdieStemQuestionIntegrityInput = {
  importJobId: string;
  subject?: string | null;
  questions: NdieStemQuestionIntegrityQuestionInput[];
  formulaPerfection?: { summary?: { teacherReviewRequired?: number; formulaCount?: number }; formulae?: Array<{ formulaId?: string; teacherReviewRequired?: boolean }> } | null;
  chemistryStructure?: { summary?: { teacherReviewRequired?: number; objectCount?: number }; objects?: Array<{ chemistryId?: string; teacherReviewRequired?: boolean }> } | null;
  visualSemantics?: { summary?: { teacherReviewRequired?: number; visualCount?: number }; objects?: Array<{ semanticVisualId?: string; teacherReviewRequired?: boolean }> } | null;
};

export type NdieStemQuestionIntegrityQuestionResult = {
  questionId: string;
  number: string;
  readiness: "READY" | "NEEDS_REVIEW" | "BLOCKED";
  confidence: number;
  issues: NdieStemQuestionIntegrityIssue[];
  guarantees: {
    questionPreserved: true;
    uncertaintyPreserved: true;
    noAutoPublishWhenCritical: true;
  };
};

export type NdieStemQuestionIntegrityResult = {
  schemaVersion: "ndie-stem-question-integrity-v1";
  engineVersion: string;
  importJobId: string;
  subject: string | null;
  questions: NdieStemQuestionIntegrityQuestionResult[];
  summary: {
    totalQuestions: number;
    ready: number;
    needsReview: number;
    blocked: number;
    criticalIssues: number;
    highIssues: number;
    averageConfidence: number;
    publishReadiness: "READY" | "READY_WITH_REVIEW" | "BLOCKED";
    readinessScore: number;
  };
};
