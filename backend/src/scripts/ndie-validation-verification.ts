import { RuleBasedAiValidatorProvider } from "../modules/ndie/ai-validator/rule-based-ai.provider.js";

function candidate(id: string, questionNumber: string, confidence: number, options: number) {
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

const evaluationDiagnostics = (duplicateAnswer: boolean) => ({
  missingAnswer: false,
  duplicateAnswer,
  answerMismatch: false,
  questionMismatch: false,
  solutionMismatch: false,
  missingExplanation: false,
  brokenNumbering: false,
  orphanSolutions: false,
  conflictingMarking: false,
  lowConfidence: false,
  issues: []
});

function evaluationDoc(importJobId: string, duplicateAnswer: boolean) {
  return {
    schemaVersion: "ndie-evaluation-document-v1" as const,
    providerId: "evaluation.rule-based",
    providerVersion: "1.0-gate9",
    pipelineVersion: "verification",
    importJobId,
    answers: [],
    solutions: [],
    rubrics: [],
    evaluations: [],
    relationships: [],
    diagnostics: evaluationDiagnostics(duplicateAnswer),
    metrics: {
      questions: 3,
      answers: duplicateAnswer ? 1 : 2,
      solutions: duplicateAnswer ? 0 : 2,
      rubrics: 0,
      answerCoverage: duplicateAnswer ? 0.33 : 1,
      solutionCoverage: duplicateAnswer ? 0 : 1,
      rubricCoverage: 0,
      averageConfidence: duplicateAnswer ? 0.55 : 0.88,
      reviewRequired: duplicateAnswer ? 3 : 0,
      missingAnswers: duplicateAnswer ? 2 : 0,
      duplicateAnswers: duplicateAnswer ? 1 : 0,
      conflicts: duplicateAnswer ? 1 : 0
    },
    rawProviderOutput: {},
    checksum: "evaluation",
    durationMs: 0,
    createdAt: new Date().toISOString()
  };
}

async function main() {
  const provider = new RuleBasedAiValidatorProvider();
  const perfect = await provider.validate({
    importJobId: "perfect-validation-import",
    ocrPages: [{ pageId: "ocr-1", confidence: 0.95 }],
    layoutPages: [{ pageId: "layout-1", confidence: 0.92 }],
    formulaElements: [{ id: "formula-ok", elementType: "FORMULA", text: "\\frac{1}{2}", confidence: 0.9 }],
    visualElements: [{ id: "visual-ok", elementType: "GRAPH", confidence: 0.88 }],
    assessment: null,
    evaluation: evaluationDoc("perfect-validation-import", false),
    candidates: [candidate("q1", "1", 0.9, 4), candidate("q2", "2", 0.88, 4)],
    answerKeys: [
      { questionNumber: "1", answerJson: { correctOption: "A" }, confidence: 0.9 },
      { questionNumber: "2", answerJson: { correctOption: "C" }, confidence: 0.88 }
    ],
    solutions: [
      { questionNumber: "1", solutionJson: { text: "Solution 1" }, confidence: 0.84 },
      { questionNumber: "2", solutionJson: { text: "Solution 2" }, confidence: 0.84 }
    ]
  });

  const broken = await provider.validate({
    importJobId: "broken-validation-import",
    ocrPages: [{ pageId: "ocr-1", confidence: 0.42 }],
    layoutPages: [],
    formulaElements: [{ id: "formula-broken", elementType: "FORMULA", text: "\\frac", confidence: 0.35 }],
    visualElements: [{ id: "visual-broken", elementType: "DIAGRAM", confidence: 0.44 }],
    assessment: null,
    evaluation: evaluationDoc("broken-validation-import", true),
    candidates: [candidate("q1", "1", 0.55, 1), candidate("q2", "1", 0.5, 4), candidate("q3", "3", 0.52, 4)],
    answerKeys: [{ questionNumber: "1", answerJson: { correctOption: "A" }, confidence: 0.62 }],
    solutions: []
  });

  const failures = [];
  if (perfect.validation.publishReadiness.status !== "READY") failures.push("Perfect corpus should be READY");
  if ((perfect.confidence ?? 0) < 0.85) failures.push("Perfect corpus confidence is too low");
  if (broken.validation.publishReadiness.status !== "BLOCKED") failures.push("Broken corpus should be BLOCKED");
  if (!broken.validation.issues.some((issue) => issue.issueType === "LOW_OCR_CONFIDENCE")) failures.push("Low OCR issue not detected");
  if (!broken.validation.issues.some((issue) => issue.issueType === "BROKEN_LATEX")) failures.push("Broken formula issue not detected");
  if (!broken.validation.issues.some((issue) => issue.issueType === "DUPLICATE_QUESTION")) failures.push("Duplicate question issue not detected");
  if (!broken.validation.issues.some((issue) => issue.issueType === "MISSING_ANSWER")) failures.push("Missing answer issue not detected");
  if (broken.validation.metrics.riskDistribution.CRITICAL < 1) failures.push("Critical risk not classified");

  if (failures.length) {
    console.error(JSON.stringify({ status: "FAIL", failures }, null, 2));
    process.exit(1);
  }

  console.log(JSON.stringify({
    status: "PASS",
    provider: provider.id,
    perfect: {
      readiness: perfect.validation.publishReadiness.status,
      confidence: perfect.confidence
    },
    broken: {
      readiness: broken.validation.publishReadiness.status,
      confidence: broken.confidence,
      issues: broken.validation.metrics.issueDistribution,
      risks: broken.validation.metrics.riskDistribution
    }
  }));
}

main().catch((error) => {
  console.error(JSON.stringify({ status: "FAIL", message: error instanceof Error ? error.message : "Unknown error" }));
  process.exit(1);
});
