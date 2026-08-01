import { describe, expect, it } from "@jest/globals";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { RuleBasedQuestionProvider } from "../modules/ndie/question-detector/rule-based-question.provider.js";
import { assertNdieJobTransition } from "../modules/ndie/queue/state-machine.js";

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");

describe("NDIE Production Gate 8 assessment intelligence", () => {
  const contract = read("src/modules/ndie/contracts/assessment-result.ts");
  const providers = read("src/modules/ndie/contracts/providers.ts");
  const provider = read("src/modules/ndie/question-detector/rule-based-question.provider.ts");
  const service = read("src/modules/ndie/question-detector/question-detector.service.ts");
  const worker = read("src/modules/ndie/worker/worker.service.ts");
  const queue = read("src/modules/ndie/queue/queue.service.ts");
  const stateMachine = read("src/modules/ndie/queue/state-machine.ts");
  const ndieService = read("src/modules/ndie/ndie.service.ts");

  it("defines normalized assessment and question JSON", () => {
    expect(contract).toContain("NdieAssessmentDocument");
    expect(contract).toContain("NdieNormalizedQuestion");
    expect(contract).toContain("questionId");
    expect(contract).toContain("relationships");
    expect(contract).toContain("visualLinks");
    expect(contract).toContain("formulaLinks");
    expect(contract).toContain("boundingBoxes");
    expect(contract).toContain("diagnostics");
    expect(contract).toContain("pipelineVersion");
  });

  it("extends question provider into assessment intelligence", () => {
    expect(providers).toContain("NdieAssessmentResult");
    expect(providers).toContain("ocrPages?");
    expect(providers).toContain("layoutPages?");
    expect(providers).toContain("formulaElements?");
    expect(providers).toContain("visualElements?");
    expect(provider).toContain('readonly id = "question.rule-based"');
  });

  it("detects structure, question types, options and relationships", async () => {
    const questionProvider = new RuleBasedQuestionProvider();
    const result = await questionProvider.detect({
      importJobId: "assessment-import",
      elements: [
        { id: "i1", pageNumber: 1, elementType: "INSTRUCTION_AREA", text: "Instructions: choose the correct answer", coordinates: { page: 1, x: 0.1, y: 0.1, width: 0.7, height: 0.05, rotation: 0 }, readingOrder: 1, confidence: 0.9 },
        { id: "s1", pageNumber: 1, elementType: "TEXT_REGION", text: "Section A Mathematics", coordinates: { page: 1, x: 0.1, y: 0.16, width: 0.7, height: 0.05, rotation: 0 }, readingOrder: 2, confidence: 0.9 },
        { id: "p1", pageNumber: 1, elementType: "TEXT_REGION", text: "Passage: Read the following case study", coordinates: { page: 1, x: 0.1, y: 0.22, width: 0.7, height: 0.06, rotation: 0 }, readingOrder: 3, confidence: 0.88 },
        { id: "q1", pageNumber: 1, elementType: "QUESTION_AREA", text: "Q1. Find x from the graph. (A) 1 (B) 2 (C) 3 (D) 4 [1 mark]", coordinates: { page: 1, x: 0.1, y: 0.32, width: 0.7, height: 0.08, rotation: 0 }, readingOrder: 4, confidence: 0.9 },
        { id: "f1", pageNumber: 1, elementType: "FORMULA", text: "x = 2", coordinates: { page: 1, x: 0.1, y: 0.41, width: 0.2, height: 0.04, rotation: 0 }, readingOrder: 5, confidence: 0.91 },
        { id: "g1", pageNumber: 1, elementType: "GRAPH", text: "Line graph with x-axis y-axis", coordinates: { page: 1, x: 0.52, y: 0.31, width: 0.28, height: 0.18, rotation: 0 }, readingOrder: 6, confidence: 0.9 },
        { id: "q2", pageNumber: 1, elementType: "QUESTION_AREA", text: "Q2. Assertion: Force changes motion. Reason: F = ma. Choose assertion reason.", coordinates: { page: 1, x: 0.1, y: 0.62, width: 0.7, height: 0.08, rotation: 0 }, readingOrder: 7, confidence: 0.86 }
      ],
      ocrPages: [{}],
      layoutPages: [{}],
      formulaElements: [{}],
      visualElements: [{}]
    });

    expect(result.assessment.structure.map((node) => node.type)).toEqual(expect.arrayContaining(["INSTRUCTIONS", "SECTION", "PASSAGE"]));
    expect(result.assessment.questions.length).toBe(2);
    expect(result.assessment.questions[0].questionType).toBe("GRAPH_BASED");
    expect(result.assessment.questions[0].options.length).toBe(4);
    expect(result.assessment.questions[0].visualLinks).toContain("g1");
    expect(result.assessment.questions[0].formulaLinks).toContain("f1");
    expect(result.assessment.questions[1].questionType).toBe("ASSERTION_REASON");
    expect(result.assessment.metrics.questionTypes.GRAPH_BASED).toBe(1);
  });

  it("integrates assessment intelligence with queue and worker checkpoints only", () => {
    expect(worker).toContain('job.stage === "QUESTION"');
    expect(worker).toContain("ndieQuestionDetectorService.detectImport");
    expect(queue).toContain("enqueueQuestion");
    expect(stateMachine).toContain('"QUESTION_RUNNING"');
    expect(stateMachine).toContain('"QUESTION_COMPLETED"');
    expect(stateMachine).toContain('"READY_FOR_ANSWER_ENGINE"');
    expect(() => assertNdieJobTransition("READY_FOR_QUESTION_ENGINE", "QUESTION_RUNNING")).not.toThrow();
    expect(() => assertNdieJobTransition("QUESTION_RUNNING", "READY_FOR_ANSWER_ENGINE")).toThrow();
    expect(() => assertNdieJobTransition("QUESTION_COMPLETED", "READY_FOR_ANSWER_ENGINE")).not.toThrow();
  });

  it("adds assessment health, metrics and storage", () => {
    expect(service).toContain("questionTypeDistribution");
    expect(service).toContain("questionCount");
    expect(service).toContain("assessment: questionResult.assessment");
    expect(service).toContain("READY_FOR_ANSWER_ENGINE");
    expect(ndieService).toContain("ndieQuestionDetectorService.health()");
  });
});
