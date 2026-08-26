import { beforeAll, describe, expect, it } from "@jest/globals";
import crypto from "node:crypto";
import { BENCHMARK_DOMAINS, BENCHMARK_LAYOUT_TYPES, BENCHMARK_QUESTION_TYPES, syntheticBenchmarkCaseSchema, type SyntheticBenchmarkCase } from "../modules/ndie/certification/synthetic-universal-benchmark/contracts.js";
import { FORMULA_STRUCTURES, VISUAL_STRUCTURES } from "../modules/ndie/certification/synthetic-universal-benchmark/catalogs.js";
import { generateSyntheticUniversalBenchmark, SYNTHETIC_BENCHMARK_TARGET, SYNTHETIC_CASES_PER_DOMAIN } from "../modules/ndie/certification/synthetic-universal-benchmark/generator.js";
import { summarizeSyntheticUniversalBenchmark } from "../modules/ndie/certification/synthetic-universal-benchmark/report.js";
import { validateSyntheticUniversalBenchmark } from "../modules/ndie/certification/synthetic-universal-benchmark/validator.js";
import { universalExamPhaseOneStatusService } from "../modules/ndie/universal-specification/phase-1-status.service.js";

let cases: SyntheticBenchmarkCase[];
let validation: ReturnType<typeof validateSyntheticUniversalBenchmark>;

beforeAll(() => {
  cases = generateSyntheticUniversalBenchmark();
  validation = validateSyntheticUniversalBenchmark(cases);
});

describe("NDIE synthetic universal exam intelligence benchmark", () => {
  it("generates at least 5,000 deterministic, versioned structured cases", () => {
    expect(cases).toHaveLength(SYNTHETIC_BENCHMARK_TARGET);
    expect(cases.length).toBeGreaterThanOrEqual(5000);
    const digest = (input: SyntheticBenchmarkCase[]) => crypto.createHash("sha256").update(JSON.stringify(input)).digest("hex");
    expect(digest(generateSyntheticUniversalBenchmark())).toBe(digest(cases));
  });

  it("validates every case and reports no duplicate or coverage failures", () => {
    expect(validation.issues).toEqual([]);
    expect(validation.coverageGaps).toEqual([]);
    expect(validation.valid).toBe(true);
  });

  it("distributes 500 structurally varied cases across every benchmark domain", () => {
    const summary = summarizeSyntheticUniversalBenchmark(cases);
    for (const domain of BENCHMARK_DOMAINS) expect(summary.byDomain[domain]).toBe(SYNTHETIC_CASES_PER_DOMAIN);
    expect(Object.keys(summary.byQuestionType)).toEqual(expect.arrayContaining([...BENCHMARK_QUESTION_TYPES]));
    expect(Object.keys(summary.byLayoutType)).toEqual(expect.arrayContaining([...BENCHMARK_LAYOUT_TYPES]));
  });

  it("covers every declared formula and visual structure", () => {
    const summary = summarizeSyntheticUniversalBenchmark(cases);
    expect(Object.keys(summary.byFormulaType)).toEqual(expect.arrayContaining([...FORMULA_STRUCTURES]));
    expect(Object.keys(summary.byVisualType)).toEqual(expect.arrayContaining([...VISUAL_STRUCTURES]));
  });

  it("contains explicit negative cases that preserve sources and prohibit invention", () => {
    const failures = cases.filter((item) => item.expectedFailureMode);
    expect(failures).toHaveLength(SYNTHETIC_CASES_PER_DOMAIN);
    expect(failures.every((item) => item.expectedFailureMode?.preserveOriginal && !item.expectedFailureMode.inventedContentAllowed)).toBe(true);
    expect(failures.every((item) => item.expectedConfidenceRules.outcome !== "AUTO_CONTINUE")).toBe(true);
  });

  it("never presents a benchmark case as real or certification-contributing evidence", () => {
    expect(cases.every((item) => item.sourceType === "SYNTHETIC_BENCHMARK")).toBe(true);
    expect(cases.every((item) => item.certificationContribution === false)).toBe(true);
    expect(JSON.stringify(cases)).not.toContain('"REAL_SOURCE"');
  });

  it("detects duplicate IDs and rejects certification-boundary tampering", () => {
    const duplicated = validateSyntheticUniversalBenchmark([...cases, cases[0]]);
    expect(duplicated.valid).toBe(false);
    expect(duplicated.issues.some((issue) => issue.code === "DUPLICATE_ID")).toBe(true);
    expect(syntheticBenchmarkCaseSchema.safeParse({ ...cases[0], sourceType: "REAL_SOURCE", certificationContribution: true }).success).toBe(false);
  });

  it("does not alter the locked Phase 1 real-evidence failure", () => {
    const phaseOne = universalExamPhaseOneStatusService.evaluateOperational();
    expect(phaseOne.evidence.overall.validRealDocuments).toBe(0);
    expect(phaseOne.evidence.overall.certificationReady).toBe(0);
    expect(phaseOne.realEvidenceStatus).toBe("PHASE 1 CORPUS EVIDENCE INCOMPLETE");
    expect(phaseOne.exitGate).toBe("FAIL");
    expect(phaseOne.productionCertified).toBe(false);
  });
});

