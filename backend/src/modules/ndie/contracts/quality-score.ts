export type NdieQualityGrade = "EXCELLENT" | "GOOD" | "REVIEW_REQUIRED" | "POOR" | "BLOCKED";

export type NdieQualityScore = {
  overall: number;
  grade: NdieQualityGrade;
  ocrConfidence?: number;
  formulaAccuracy?: number;
  layoutAccuracy?: number;
  tableAccuracy?: number;
  diagramPreservation?: number;
  optionCompleteness?: number;
  answerKeyConfidence?: number;
  aiConfidence?: number;
  teacherReviewCompletion?: number;
};
