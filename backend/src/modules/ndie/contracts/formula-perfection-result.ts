import type { NdieNormalizedFormula } from "./formula-result.js";

export type NdieFormulaPerfectionIssue = {
  code:
    | "LATEX_REPAIRED"
    | "MATHML_REGENERATED"
    | "SOURCE_CROP_REQUIRED"
    | "LOW_COMPONENT_CONFIDENCE"
    | "CHEMISTRY_ARROW_NORMALIZED"
    | "MATRIX_NORMALIZED"
    | "FRACTION_NORMALIZED"
    | "VECTOR_NORMALIZED"
    | "TEACHER_REVIEW_REQUIRED";
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  message: string;
};

export type NdieFormulaPerfectionScore = {
  preservation: number;
  latexValidity: number;
  mathmlValidity: number;
  semanticCompleteness: number;
  sourceTraceability: number;
  renderReadiness: number;
  overall: number;
};

export type NdieFormulaPerfectionResult = {
  schemaVersion: "ndie-formula-perfection-v1";
  formulaId: string;
  formula: NdieNormalizedFormula;
  score: NdieFormulaPerfectionScore;
  issues: NdieFormulaPerfectionIssue[];
  teacherReviewRequired: boolean;
  canAutoPublish: boolean;
  guarantees: {
    originalTextPreserved: boolean;
    originalCropPreservedOrRequired: boolean;
    noFormulaDiscarded: true;
    noHallucinatedFormula: true;
  };
};

export type NdieFormulaPerfectionDocumentResult = {
  schemaVersion: "ndie-formula-perfection-document-v1";
  provider: "ndie-formula-perfection-v1";
  formulas: NdieFormulaPerfectionResult[];
  summary: {
    formulaCount: number;
    teacherReviewRequired: number;
    autoPublishSafe: number;
    averageScore: number;
    lowestScore: number;
    latexRepairs: number;
    cropRequired: number;
  };
};
