import { UNIVERSAL_ACCURACY_TARGETS } from "../universal-specification/universal-exam-engine.spec.js";

export type UniversalMetricId = keyof typeof UNIVERSAL_ACCURACY_TARGETS;
export type MetricObservation = { metricId: UniversalMetricId; numerator: number; denominator: number; evidenceDocumentIds: string[] };

export const UNIVERSAL_METRIC_DEFINITIONS: Record<UniversalMetricId, { method: string; direction: "AT_LEAST" | "AT_MOST"; target: number }> = {
  sourcePreservation: { method: "Checksum-matched immutable sources / accepted source documents", direction: "AT_LEAST", target: 1 },
  pagePreservation: { method: "Rendered and indexed source pages / expected source pages", direction: "AT_LEAST", target: 1 },
  questionCountAndOrder: { method: "Order-aware exact question matches / expert-annotated questions", direction: "AT_LEAST", target: 0.9995 },
  questionTypeAccuracy: { method: "Correct question-type classifications / matched questions", direction: "AT_LEAST", target: 0.99 },
  formulaPreservation: { method: "Required formulas preserved with source evidence / expert-annotated required formulas", direction: "AT_LEAST", target: 0.995 },
  formulaSemanticAccuracy: { method: "Symbolically or expert-verified equivalent formulas / matched formulas", direction: "AT_LEAST", target: 0.99 },
  requiredVisualPreservation: { method: "Required visuals preserved and linked / expert-annotated required visuals", direction: "AT_LEAST", target: 1 },
  answerMapping: { method: "Correct question-answer relationships / expert-annotated answer relationships", direction: "AT_LEAST", target: 0.9999 },
  deterministicScoring: { method: "Correct deterministic score decisions / scoring test decisions", direction: "AT_LEAST", target: 1 },
  publishPackageIntegrity: { method: "Checksum-valid complete packages / attempted publish packages", direction: "AT_LEAST", target: 1 },
  studentRenderingFidelity: { method: "Approved elements rendered equivalently / approved elements", direction: "AT_LEAST", target: 1 },
  maximumSilentContentLoss: { method: "Required academic objects lost without a blocking diagnostic", direction: "AT_MOST", target: 0 },
  maximumInventedAcademicContent: { method: "Published academic objects without source provenance", direction: "AT_MOST", target: 0 }
};

export function measureObservation(observation: MetricObservation) {
  if (observation.numerator < 0 || observation.denominator < 0) throw new Error("Metric counts cannot be negative.");
  if (!observation.evidenceDocumentIds.length) return { score: null, passed: false, reason: "REAL_EVIDENCE_REQUIRED" as const };
  const definition = UNIVERSAL_METRIC_DEFINITIONS[observation.metricId];
  const score = observation.denominator === 0 ? (definition.direction === "AT_MOST" && observation.numerator === 0 ? 0 : null) : observation.numerator / observation.denominator;
  const passed = score !== null && (definition.direction === "AT_LEAST" ? score >= definition.target : score <= definition.target);
  return { score, passed, reason: passed ? "TARGET_MET" as const : "TARGET_NOT_MET" as const };
}

