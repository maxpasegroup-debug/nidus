export function ndieReviewStatusFromConfidence(confidence: number, issues: string[]) {
  if (issues.length || confidence < 0.45) return "MANUAL_CORRECTION_REQUIRED";
  if (confidence < 0.82) return "NEEDS_REVIEW";
  return "AUTO_APPROVED";
}

export function ndieOverallConfidence(values: Array<number | null | undefined>) {
  const clean = values.filter((value): value is number => typeof value === "number" && Number.isFinite(value));
  if (!clean.length) return null;
  return Math.max(0, Math.min(1, clean.reduce((sum, value) => sum + value, 0) / clean.length));
}
