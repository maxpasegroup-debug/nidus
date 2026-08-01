import { describe, expect, it } from "@jest/globals";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { RuleBasedEvaluationProvider } from "../modules/ndie/evaluation-intelligence/rule-based-evaluation.provider.js";
import { assertNdieJobTransition } from "../modules/ndie/queue/state-machine.js";
import type { NdieAssessmentDocument } from "../modules/ndie/contracts/assessment-result.js";

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");

const assessment: NdieAssessmentDocument = {
  schemaVersion: "ndie-assessment-v1",
  providerId: "question.rule-based",
  providerVersion: "1.0-gate8",
  pipelineVersion: "test",
  importJobId: "evaluation-import",
  structure: [],
  questions: [
    {
      schemaVersion: "ndie-question-v1",
      questionId: "question-1",
      questionNumber: "1",
      questionType: "SINGLE_CORRECT_MCQ",
      parentQuestionId: null,
      childQuestionIds: [],
      linkedQuestionIds: [],
      sectionId: null,
      passageId: null,
      sharedResourceIds: [],
      marks: 4,
      difficulty: "UNKNOWN",
      subject: "Physics",
      topic: null,
      bloomLevel: "UNKNOWN",
      text: "Q1. A circuit has current I. Choose the correct option. (A) 1 (B) 2 (C) 3 (D) 4",
      options: [],
      relationships: [],
      visualLinks: ["visual-circuit"],
      formulaLinks: ["formula-ohm"],
      ocrLinks: ["ocr-1"],
      layoutLinks: ["layout-1"],
      boundingBoxes: [],
      readingOrder: 1,
      confidence: 0.88,
      diagnostics: {
        missingOptions: false,
        duplicateNumbering: false,
        brokenNumbering: false,
        sharedDiagramAmbiguity: false,
        questionSplitAcrossPages: false,
        lowConfidence: false,
        orphanVisuals: false,
        orphanFormulas: false,
        missingMarks: false,
        unsupportedStructures: false,
        issues: []
      },
      version: 1,
      pipelineVersion: "test",
      checksum: "q1"
    },
    {
      schemaVersion: "ndie-question-v1",
      questionId: "question-2",
      questionNumber: "2",
      questionType: "MULTIPLE_CORRECT_MCQ",
      parentQuestionId: null,
      childQuestionIds: [],
      linkedQuestionIds: [],
      sectionId: null,
      passageId: null,
      sharedResourceIds: [],
      marks: 4,
      difficulty: "UNKNOWN",
      subject: "Mathematics",
      topic: null,
      bloomLevel: "UNKNOWN",
      text: "Q2. Choose all correct roots.",
      options: [],
      relationships: [],
      visualLinks: [],
      formulaLinks: ["formula-roots"],
      ocrLinks: ["ocr-2"],
      layoutLinks: ["layout-2"],
      boundingBoxes: [],
      readingOrder: 2,
      confidence: 0.86,
      diagnostics: {
        missingOptions: false,
        duplicateNumbering: false,
        brokenNumbering: false,
        sharedDiagramAmbiguity: false,
        questionSplitAcrossPages: false,
        lowConfidence: false,
        orphanVisuals: false,
        orphanFormulas: false,
        missingMarks: false,
        unsupportedStructures: false,
        issues: []
      },
      version: 1,
      pipelineVersion: "test",
      checksum: "q2"
    }
  ],
  relationships: [],
  diagnostics: {
    missingOptions: false,
    duplicateNumbering: false,
    brokenNumbering: false,
    sharedDiagramAmbiguity: false,
    questionSplitAcrossPages: false,
    lowConfidence: false,
    orphanVisuals: false,
    orphanFormulas: false,
    missingMarks: false,
    unsupportedStructures: false,
    issues: []
  },
  metrics: { questions: 2, sections: 0, groups: 0, passages: 0, options: 0, questionTypes: {}, averageConfidence: 0.87, reviewRequired: 0 },
  rawProviderOutput: {},
  checksum: "assessment",
  durationMs: 0,
  createdAt: new Date().toISOString()
};

describe("NDIE Production Gate 9 evaluation intelligence", () => {
  const contract = read("src/modules/ndie/contracts/evaluation-result.ts");
  const providerContract = read("src/modules/ndie/contracts/providers.ts");
  const provider = read("src/modules/ndie/evaluation-intelligence/rule-based-evaluation.provider.ts");
  const service = read("src/modules/ndie/answer-key-mapper/answer-key-mapper.service.ts");
  const worker = read("src/modules/ndie/worker/worker.service.ts");
  const queue = read("src/modules/ndie/queue/queue.service.ts");
  const stateMachine = read("src/modules/ndie/queue/state-machine.ts");
  const ndieService = read("src/modules/ndie/ndie.service.ts");

  it("defines normalized evaluation JSON", () => {
    expect(contract).toContain("NdieEvaluationDocument");
    expect(contract).toContain("NdieNormalizedEvaluation");
    expect(contract).toContain("NdieMarkingRule");
    expect(contract).toContain("NdieRubric");
    expect(contract).toContain("answerCoverage");
    expect(contract).toContain("solutionCoverage");
    expect(contract).toContain("conflictingMarking");
  });

  it("adds a provider abstraction for evaluation intelligence", () => {
    expect(providerContract).toContain("EvaluationProvider");
    expect(providerContract).toContain("NdieEvaluationResult");
    expect(providerContract).toContain('kind: "EVALUATION"');
    expect(provider).toContain('readonly id = "evaluation.rule-based"');
  });

  it("maps answers, solutions, marking rules, relationships and diagnostics", async () => {
    const evaluationProvider = new RuleBasedEvaluationProvider();
    const result = await evaluationProvider.evaluate({
      importJobId: "evaluation-import",
      sourceKind: "ANSWER_KEY",
      assessment,
      elements: [
        { id: "answer-1", pageNumber: 3, elementType: "ANSWER_AREA", text: "1 - B", coordinates: { page: 3, x: 0.1, y: 0.1, width: 0.4, height: 0.05 }, readingOrder: 1, confidence: 0.9 },
        { id: "answer-2", pageNumber: 3, elementType: "ANSWER_AREA", text: "2 - A,C", coordinates: { page: 3, x: 0.1, y: 0.16, width: 0.4, height: 0.05 }, readingOrder: 2, confidence: 0.9 },
        { id: "solution-1", pageNumber: 4, elementType: "ANSWER_AREA", text: "Solution 1: Use Ohm law V = IR, therefore option B.", coordinates: { page: 4, x: 0.1, y: 0.1, width: 0.7, height: 0.08 }, readingOrder: 3, confidence: 0.85 },
        { id: "rubric-1", pageNumber: 5, elementType: "ANSWER_AREA", text: "Rubric Q2: keywords: roots, discriminant; expected concepts: quadratic equation", coordinates: { page: 5, x: 0.1, y: 0.1, width: 0.7, height: 0.08 }, readingOrder: 4, confidence: 0.8 }
      ],
      ocrPages: [{}],
      layoutPages: [{}],
      formulaElements: [{ id: "formula-ohm", pageNumber: 4, elementType: "FORMULA" }],
      visualElements: [{ id: "visual-circuit", pageNumber: 1, elementType: "DIAGRAM" }]
    });

    expect(result.evaluation.schemaVersion).toBe("ndie-evaluation-document-v1");
    expect(result.answers).toHaveLength(2);
    expect(result.solutions).toHaveLength(1);
    expect(result.evaluation.rubrics).toHaveLength(1);
    expect(result.evaluation.evaluations).toHaveLength(2);
    expect(result.evaluation.evaluations[0].answerId).toContain("answer-");
    expect(result.evaluation.evaluations[0].markingRule.positiveMarks).toBe(4);
    expect(result.evaluation.evaluations[0].relationships.map((relationship) => relationship.relationshipType)).toEqual(expect.arrayContaining(["QUESTION", "ANSWER_KEY", "SOLUTION"]));
    expect(result.evaluation.metrics.answerCoverage).toBe(1);
    expect(result.evaluation.metrics.solutionCoverage).toBe(0.5);
    expect(result.evaluation.evaluations[1].diagnostics.missingExplanation).toBe(true);
  });

  it("integrates evaluation intelligence with queue and worker checkpoints only", () => {
    expect(worker).toContain('job.stage === "ANSWER"');
    expect(worker).toContain("ndieAnswerKeyMapperService.mapImport");
    expect(queue).toContain("enqueueAnswer");
    expect(stateMachine).toContain('"ANSWER_RUNNING"');
    expect(stateMachine).toContain('"ANSWER_COMPLETED"');
    expect(stateMachine).toContain('"READY_FOR_AI_VALIDATION"');
    expect(() => assertNdieJobTransition("READY_FOR_ANSWER_ENGINE", "ANSWER_RUNNING")).not.toThrow();
    expect(() => assertNdieJobTransition("ANSWER_RUNNING", "READY_FOR_AI_VALIDATION")).toThrow();
    expect(() => assertNdieJobTransition("ANSWER_COMPLETED", "READY_FOR_AI_VALIDATION")).not.toThrow();
  });

  it("adds evaluation health, metrics and storage without running AI inside the answer stage", () => {
    expect(service).toContain("coveragePercentage");
    expect(service).toContain("providerKind: \"EVALUATION\"");
    expect(service).toContain("READY_FOR_AI_VALIDATION");
    expect(service).toContain("evaluationResult.evaluation");
    expect(ndieService).toContain("ndieAnswerKeyMapperService.health()");
    expect(worker).toContain('job.stage === "ANSWER"');
    expect(worker).toContain("ndieAnswerKeyMapperService.mapImport");
  });
});
