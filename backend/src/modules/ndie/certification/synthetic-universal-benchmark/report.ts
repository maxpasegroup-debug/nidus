import type { SyntheticBenchmarkCase } from "./contracts.js";

function count(values: string[]) {
  return Object.fromEntries([...new Set(values)].sort().map((value) => [value, values.filter((candidate) => candidate === value).length]));
}

export function summarizeSyntheticUniversalBenchmark(cases: SyntheticBenchmarkCase[], coverageGaps: string[] = []) {
  return {
    benchmarkVersion: cases[0]?.schemaVersion ?? "nuee-synthetic-universal-benchmark-1.0.0",
    evidenceClass: "SYNTHETIC_BENCHMARK",
    realCertificationContribution: 0,
    totalCases: cases.length,
    byDomain: count(cases.map((item) => item.benchmarkDomain)),
    bySubject: count(cases.map((item) => item.subject)),
    byQuestionType: count(cases.map((item) => item.questionType)),
    byFormulaType: count(cases.flatMap((item) => item.expectedFormula.map((formula) => formula.structureType))),
    byVisualType: count(cases.flatMap((item) => item.expectedVisualStructure.map((visual) => visual.objectType))),
    byLayoutType: count(cases.map((item) => item.inputRepresentation.layoutType)),
    byDifficulty: count(cases.map((item) => item.difficulty)),
    negativeCases: cases.filter((item) => item.expectedFailureMode !== null).length,
    reviewCases: cases.filter((item) => item.expectedConfidenceRules.outcome === "NEEDS_REVIEW").length,
    blockedCases: cases.filter((item) => item.expectedConfidenceRules.outcome === "BLOCK").length,
    coverageGaps
  };
}

