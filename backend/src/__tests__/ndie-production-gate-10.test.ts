import { describe, expect, it } from "@jest/globals";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { RuleBasedAiValidatorProvider } from "../modules/ndie/ai-validator/rule-based-ai.provider.js";
import { assertNdieJobTransition } from "../modules/ndie/queue/state-machine.js";

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");

function candidate(id: string, questionNumber: string, confidence = 0.88, options = 4) {
  return {
    id,
    questionNumber,
    questionType: "SINGLE_CORRECT_MCQ",
    confidence,
    candidateJson: {
      assessment: {
        questionId: id,
        questionNumber,
        questionType: "SINGLE_CORRECT_MCQ",
        options: Array.from({ length: options }, (_, index) => ({ key: String.fromCharCode(65 + index), text: `Option ${index + 1}` })),
        diagnostics: { missingOptions: options < 2, issues: [] },
        relationships: [],
        confidence
      }
    }
  };
}

const evaluationDiagnostics = {
  missingAnswer: false,
  duplicateAnswer: true,
  answerMismatch: false,
  questionMismatch: false,
  solutionMismatch: false,
  missingExplanation: false,
  brokenNumbering: false,
  orphanSolutions: false,
  conflictingMarking: false,
  lowConfidence: false,
  issues: []
};

function evaluationDoc(duplicateAnswer: boolean) {
  return {
    schemaVersion: "ndie-evaluation-document-v1" as const,
    providerId: "evaluation.rule-based",
    providerVersion: "1.0-gate9",
    pipelineVersion: "test",
    importJobId: "validation-import",
    answers: [],
    solutions: [],
    rubrics: [],
    evaluations: [],
    relationships: [],
    diagnostics: { ...evaluationDiagnostics, duplicateAnswer },
    metrics: {
      questions: 3,
      answers: 1,
      solutions: 1,
      rubrics: 0,
      answerCoverage: 0.33,
      solutionCoverage: 0.33,
      rubricCoverage: 0,
      averageConfidence: 0.7,
      reviewRequired: 2,
      missingAnswers: 2,
      duplicateAnswers: duplicateAnswer ? 1 : 0,
      conflicts: duplicateAnswer ? 1 : 0
    },
    rawProviderOutput: {},
    checksum: "evaluation",
    durationMs: 0,
    createdAt: new Date().toISOString()
  };
}

describe("NDIE Production Gate 10 AI validation and confidence engine", () => {
  const contract = read("src/modules/ndie/contracts/validation-result.ts");
  const providers = read("src/modules/ndie/contracts/providers.ts");
  const validator = read("src/modules/ndie/ai-validator/rule-based-ai.provider.ts");
  const service = read("src/modules/ndie/ai-validator/ai-validator.service.ts");
  const worker = read("src/modules/ndie/worker/worker.service.ts");
  const queue = read("src/modules/ndie/queue/queue.service.ts");
  const stateMachine = read("src/modules/ndie/queue/state-machine.ts");
  const ndieService = read("src/modules/ndie/ndie.service.ts");

  it("defines normalized validation JSON, risk and readiness models", () => {
    expect(contract).toContain("NdieValidationDocument");
    expect(contract).toContain("NdieValidationIssue");
    expect(contract).toContain("NdiePublishReadiness");
    expect(contract).toContain("READY_WITH_REVIEW");
    expect(contract).toContain("confidenceImpact");
    expect(contract).toContain("riskDistribution");
    expect(contract).toContain("providerAgreement");
  });

  it("extends AI providers to consume prior NDIE outputs only", () => {
    expect(providers).toContain("NdieValidationResult");
    expect(providers).toContain("ocrPages?");
    expect(providers).toContain("layoutPages?");
    expect(providers).toContain("formulaElements?");
    expect(providers).toContain("visualElements?");
    expect(providers).toContain("assessment?");
    expect(providers).toContain("evaluation?");
    expect(validator).toContain("DETERMINISTIC_LAYER_VALIDATION");
    expect(validator).not.toContain("rawPdf");
  });

  it("validates confidence, issues, risks and publish readiness", async () => {
    const provider = new RuleBasedAiValidatorProvider();
    const result = await provider.validate({
      importJobId: "validation-import",
      ocrPages: [{ pageId: "ocr-1", confidence: 0.91 }],
      layoutPages: [{ pageId: "layout-1", confidence: 0.86 }],
      formulaElements: [{ id: "formula-1", elementType: "FORMULA", text: "\\frac", confidence: 0.48 }],
      visualElements: [{ id: "visual-1", elementType: "DIAGRAM", confidence: 0.55 }],
      assessment: null,
      evaluation: evaluationDoc(true),
      candidates: [candidate("q1", "1", 0.9, 4), candidate("q2", "2", 0.72, 1), candidate("q3", "2", 0.7, 4)],
      answerKeys: [{ questionNumber: "1", answerJson: { correctOption: "B" }, confidence: 0.86 }],
      solutions: [{ questionNumber: "1", solutionJson: { text: "Solution" }, confidence: 0.78 }]
    });

    expect(result.validation.schemaVersion).toBe("ndie-validation-v1");
    expect(result.validation.issues.map((issue) => issue.issueType)).toEqual(expect.arrayContaining(["BROKEN_LATEX", "DIAGRAM_MISMATCH", "DUPLICATE_QUESTION", "MISSING_ANSWER"]));
    expect(result.validation.metrics.riskDistribution.CRITICAL).toBeGreaterThanOrEqual(1);
    expect(result.validation.publishReadiness.status).toBe("BLOCKED");
    expect(result.validation.confidence.questions).toHaveLength(3);
    expect(result.validations.some((validation) => validation.reviewStatus === "MANUAL_CORRECTION_REQUIRED")).toBe(true);
  });

  it("integrates validation with queue and worker checkpoints only", () => {
    expect(worker).toContain('job.stage === "AI_VALIDATION"');
    expect(worker).toContain("ndieAiValidatorService.validateImport");
    expect(queue).toContain("enqueueAiValidation");
    expect(stateMachine).toContain('"AI_VALIDATION_RUNNING"');
    expect(stateMachine).toContain('"AI_VALIDATION_COMPLETED"');
    expect(stateMachine).toContain('"READY_FOR_TEACHER_REVIEW"');
    expect(() => assertNdieJobTransition("READY_FOR_AI_VALIDATION", "AI_VALIDATION_RUNNING")).not.toThrow();
    expect(() => assertNdieJobTransition("AI_VALIDATION_RUNNING", "READY_FOR_TEACHER_REVIEW")).toThrow();
    expect(() => assertNdieJobTransition("AI_VALIDATION_COMPLETED", "READY_FOR_TEACHER_REVIEW")).not.toThrow();
  });

  it("adds validation health, storage and teacher-review readiness without CBT changes", () => {
    expect(service).toContain("providerKind: \"AI\"");
    expect(service).toContain("AI_VALIDATION_COMPLETED");
    expect(service).toContain("READY_FOR_TEACHER_REVIEW");
    expect(service).toContain("publishReadiness");
    expect(ndieService).toContain("ndieAiValidatorService.health()");
    expect(worker).not.toContain("ndiePublisherService.publish");
  });
});
