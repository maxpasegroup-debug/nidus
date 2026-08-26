import { BENCHMARK_DOMAINS, BENCHMARK_LAYOUT_TYPES, BENCHMARK_QUESTION_TYPES, syntheticBenchmarkCaseSchema, type SyntheticBenchmarkCase } from "./contracts.js";
import { FORMULA_STRUCTURES, TOPICS, VISUAL_STRUCTURES } from "./catalogs.js";

export type BenchmarkValidationIssue = { benchmarkId: string; code: string; message: string };

function balancedLatex(value: string) {
  const stack: string[] = [];
  const pairs: Record<string, string> = { "}": "{", "]": "[", ")": "(" };
  for (const character of value) {
    if (["{", "[", "("].includes(character)) stack.push(character);
    if (["}", "]", ")"].includes(character) && stack.pop() !== pairs[character]) return false;
  }
  return stack.length === 0;
}

export function validMathMl(value: string) {
  if (!value.startsWith("<math") || !value.endsWith("</math>")) return false;
  const stack: string[] = [];
  const tag = /<\/?([A-Za-z][\w:-]*)(?:\s[^<>]*)?\/?>/g;
  let match: RegExpExecArray | null;
  while ((match = tag.exec(value))) {
    const token = match[0];
    const name = match[1];
    if (token.startsWith("</")) {
      if (stack.pop() !== name) return false;
    } else if (!token.endsWith("/>")) stack.push(name);
  }
  return stack.length === 0;
}

function add(issues: BenchmarkValidationIssue[], benchmarkId: string, code: string, message: string) {
  issues.push({ benchmarkId, code, message });
}

export function validateSyntheticUniversalBenchmark(input: unknown[]) {
  const issues: BenchmarkValidationIssue[] = [];
  const cases: SyntheticBenchmarkCase[] = [];
  input.forEach((candidate, index) => {
    const parsed = syntheticBenchmarkCaseSchema.safeParse(candidate);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) add(issues, typeof candidate === "object" && candidate && "benchmarkId" in candidate ? String(candidate.benchmarkId) : `INDEX_${index}`, "SCHEMA_INVALID", `${issue.path.join(".")}: ${issue.message}`);
    } else cases.push(parsed.data);
  });

  const idCounts = new Map<string, number>();
  const contentKeys = new Map<string, string>();
  for (const benchmarkCase of cases) {
    idCounts.set(benchmarkCase.benchmarkId, (idCounts.get(benchmarkCase.benchmarkId) ?? 0) + 1);
    const contentKey = JSON.stringify({ domain: benchmarkCase.benchmarkDomain, topic: benchmarkCase.topic, questionType: benchmarkCase.questionType, layout: benchmarkCase.inputRepresentation.layoutType, content: benchmarkCase.inputRepresentation.content });
    const prior = contentKeys.get(contentKey);
    if (prior) add(issues, benchmarkCase.benchmarkId, "DUPLICATE_CONTENT", `Duplicates academic structure from ${prior}.`);
    else contentKeys.set(contentKey, benchmarkCase.benchmarkId);
  }
  for (const [benchmarkId, count] of idCounts) if (count > 1) add(issues, benchmarkId, "DUPLICATE_ID", `Benchmark ID occurs ${count} times.`);

  for (const benchmarkCase of cases) {
    if (benchmarkCase.sourceType !== "SYNTHETIC_BENCHMARK" || benchmarkCase.certificationContribution) add(issues, benchmarkCase.benchmarkId, "CERTIFICATION_BOUNDARY", "Synthetic cases cannot contribute to certification.");
    if (!benchmarkCase.expectedQuestionStructure.questionId) add(issues, benchmarkCase.benchmarkId, "QUESTION_EXPECTATION_MISSING", "Expected question structure is required.");
    for (const formula of benchmarkCase.expectedFormula) {
      if (!balancedLatex(formula.latex)) add(issues, benchmarkCase.benchmarkId, "LATEX_INVALID", `Unbalanced LaTeX in ${formula.formulaId}.`);
      if (formula.mathML && !validMathMl(formula.mathML)) add(issues, benchmarkCase.benchmarkId, "MATHML_INVALID", `Invalid MathML in ${formula.formulaId}.`);
      if (!formula.originalExpression || !formula.plainTextFallback || !Object.keys(formula.semanticRepresentation).length) add(issues, benchmarkCase.benchmarkId, "FORMULA_OUTPUT_MISSING", `Formula ${formula.formulaId} lacks a required representation.`);
    }
    const formulaExpected = ["MATHEMATICS", "PHYSICS", "CHEMISTRY", "FORMULA_RECOGNITION"].includes(benchmarkCase.benchmarkDomain);
    if (formulaExpected && !benchmarkCase.expectedFormula.length) add(issues, benchmarkCase.benchmarkId, "FORMULA_EXPECTATION_MISSING", "Formula-bearing domain requires formula expectations.");
    const visualFeature = benchmarkCase.inputRepresentation.features.some((feature) => (VISUAL_STRUCTURES as readonly string[]).includes(feature));
    if ((benchmarkCase.benchmarkDomain === "VISUAL_RECOGNITION" || visualFeature) && !benchmarkCase.expectedVisualStructure.length) add(issues, benchmarkCase.benchmarkId, "VISUAL_EXPECTATION_MISSING", "Visual input requires a visual expectation.");
    if (!benchmarkCase.expectedFailureMode && !benchmarkCase.expectedAnswer) add(issues, benchmarkCase.benchmarkId, "ANSWER_EXPECTATION_MISSING", "Non-failure case requires an expected answer or manual-review answer contract.");
    const knownIds = new Set([
      benchmarkCase.expectedQuestionStructure.questionId, ...benchmarkCase.expectedQuestionStructure.optionIds, ...benchmarkCase.expectedQuestionStructure.childQuestionIds,
      ...benchmarkCase.expectedFormula.map((formula) => formula.formulaId), ...benchmarkCase.expectedVisualStructure.map((visual) => visual.visualId),
      ...(benchmarkCase.expectedAnswer ? [benchmarkCase.expectedAnswer.answerId] : []), ...(benchmarkCase.expectedSolution ? [benchmarkCase.expectedSolution.solutionId] : [])
    ]);
    for (const relationship of benchmarkCase.expectedRelationships) {
      if (!knownIds.has(relationship.sourceId) || !knownIds.has(relationship.targetId)) add(issues, benchmarkCase.benchmarkId, "RELATIONSHIP_INVALID", `Relationship ${relationship.relationshipId} references an unknown object.`);
    }
    for (const id of benchmarkCase.expectedReadingOrder) if (!knownIds.has(id)) add(issues, benchmarkCase.benchmarkId, "READING_ORDER_INVALID", `Reading order references unknown object ${id}.`);
    if (benchmarkCase.expectedFailureMode && benchmarkCase.expectedConfidenceRules.outcome === "AUTO_CONTINUE") add(issues, benchmarkCase.benchmarkId, "FAILURE_POLICY_INVALID", "Failure cases must review or block.");
  }

  const covered = {
    domains: new Set(cases.map((item) => item.benchmarkDomain)),
    questionTypes: new Set(cases.map((item) => item.questionType)),
    layouts: new Set(cases.map((item) => item.inputRepresentation.layoutType)),
    formulas: new Set(cases.flatMap((item) => item.expectedFormula.map((formula) => formula.structureType))),
    visuals: new Set(cases.flatMap((item) => item.expectedVisualStructure.map((visual) => visual.objectType))),
    topics: new Set(cases.map((item) => `${item.benchmarkDomain}:${item.topic}`))
  };
  const coverageGaps = [
    ...BENCHMARK_DOMAINS.filter((value) => !covered.domains.has(value)).map((value) => `DOMAIN:${value}`),
    ...BENCHMARK_QUESTION_TYPES.filter((value) => !covered.questionTypes.has(value)).map((value) => `QUESTION_TYPE:${value}`),
    ...BENCHMARK_LAYOUT_TYPES.filter((value) => !covered.layouts.has(value)).map((value) => `LAYOUT:${value}`),
    ...FORMULA_STRUCTURES.filter((value) => !covered.formulas.has(value)).map((value) => `FORMULA:${value}`),
    ...VISUAL_STRUCTURES.filter((value) => !covered.visuals.has(value)).map((value) => `VISUAL:${value}`),
    ...Object.entries(TOPICS).flatMap(([domain, topics]) => topics.filter((topic) => !covered.topics.has(`${domain}:${topic}`)).map((topic) => `TOPIC:${domain}:${topic}`))
  ];
  return { valid: issues.length === 0 && coverageGaps.length === 0, parsedCases: cases, issues, coverageGaps };
}

