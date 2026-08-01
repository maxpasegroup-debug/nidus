export type NdieValidationTargetType =
  | "IMPORT"
  | "PAGE"
  | "OCR"
  | "LAYOUT"
  | "REGION"
  | "FORMULA"
  | "VISUAL"
  | "QUESTION"
  | "ANSWER"
  | "SOLUTION"
  | "RELATIONSHIP"
  | "PIPELINE";

export type NdieValidationRisk = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type NdiePublishReadiness = "READY" | "READY_WITH_REVIEW" | "BLOCKED";

export type NdieValidationIssue = {
  issueId: string;
  targetType: NdieValidationTargetType;
  targetId: string | null;
  issueType:
    | "LOW_OCR_CONFIDENCE"
    | "BROKEN_LAYOUT"
    | "READING_ORDER_ISSUE"
    | "MISSING_FORMULA"
    | "BROKEN_LATEX"
    | "BROKEN_MATHML"
    | "ORPHAN_VISUAL"
    | "DUPLICATE_QUESTION"
    | "BROKEN_NUMBERING"
    | "MISSING_OPTIONS"
    | "DUPLICATE_OPTIONS"
    | "MISSING_ANSWER"
    | "ANSWER_MISMATCH"
    | "SOLUTION_MISMATCH"
    | "DIAGRAM_MISMATCH"
    | "TABLE_MISMATCH"
    | "RELATIONSHIP_MISMATCH"
    | "SECTION_MISMATCH"
    | "QUESTION_SPLIT"
    | "UNSUPPORTED_STRUCTURE"
    | "PROVIDER_DISAGREEMENT"
    | "PIPELINE_CORRUPTION";
  severity: NdieValidationRisk;
  reason: string;
  recommendedAction: string;
  reviewRequired: boolean;
  confidenceImpact: number;
};

export type NdieConfidenceItem = {
  targetType: NdieValidationTargetType;
  targetId: string | null;
  confidence: number | null;
  risk: NdieValidationRisk;
  reasons: string[];
};

export type NdieValidationDocument = {
  schemaVersion: "ndie-validation-v1";
  validationId: string;
  importJobId: string;
  providerId: string;
  providerVersion: string;
  pipelineVersion: string;
  confidence: {
    import: NdieConfidenceItem;
    pages: NdieConfidenceItem[];
    regions: NdieConfidenceItem[];
    formulas: NdieConfidenceItem[];
    visuals: NdieConfidenceItem[];
    questions: NdieConfidenceItem[];
    answers: NdieConfidenceItem[];
    solutions: NdieConfidenceItem[];
    relationships: NdieConfidenceItem[];
    overallExam: NdieConfidenceItem;
  };
  issues: NdieValidationIssue[];
  warnings: NdieValidationIssue[];
  recommendations: string[];
  publishReadiness: {
    status: NdiePublishReadiness;
    reasons: string[];
  };
  metrics: {
    averageConfidence: number | null;
    issueDistribution: Record<string, number>;
    riskDistribution: Record<NdieValidationRisk, number>;
    publishReadiness: NdiePublishReadiness;
    providerAgreement: number | null;
    validationFailures: number;
    validationDurationMs: number;
  };
  providerAgreement: {
    supported: boolean;
    score: number | null;
    providers: string[];
    notes: string[];
  };
  rawProviderOutput: Record<string, unknown>;
  checksum: string;
  createdAt: string;
};

export type NdieValidationResult = {
  validation: NdieValidationDocument;
  validations: Array<{
    candidateId: string;
    confidence: number;
    reviewStatus: "AUTO_APPROVED" | "NEEDS_REVIEW" | "MANUAL_CORRECTION_REQUIRED";
    issues: string[];
    notes: string[];
  }>;
  confidence: number | null;
  raw: Record<string, unknown>;
};
