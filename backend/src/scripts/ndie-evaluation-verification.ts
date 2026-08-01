import { RuleBasedEvaluationProvider } from "../modules/ndie/evaluation-intelligence/rule-based-evaluation.provider.js";
import type { NdieAssessmentDocument } from "../modules/ndie/contracts/assessment-result.js";

const diagnostics = {
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
};

const assessment: NdieAssessmentDocument = {
  schemaVersion: "ndie-assessment-v1",
  providerId: "question.rule-based",
  providerVersion: "1.0-gate8",
  pipelineVersion: "verification",
  importJobId: "golden-evaluation-import",
  structure: [],
  questions: [1, 2, 3].map((number) => ({
    schemaVersion: "ndie-question-v1" as const,
    questionId: `question-${number}`,
    questionNumber: String(number),
    questionType: number === 2 ? "MULTIPLE_CORRECT_MCQ" as const : "SINGLE_CORRECT_MCQ" as const,
    parentQuestionId: null,
    childQuestionIds: [],
    linkedQuestionIds: [],
    sectionId: "section-a",
    passageId: null,
    sharedResourceIds: [],
    marks: 4,
    difficulty: "UNKNOWN" as const,
    subject: number === 1 ? "Physics" : number === 2 ? "Mathematics" : "Chemistry",
    topic: null,
    bloomLevel: "UNKNOWN" as const,
    text: `Q${number}. Golden corpus question ${number}.`,
    options: [],
    relationships: [],
    visualLinks: number === 1 ? ["visual-circuit"] : [],
    formulaLinks: number === 2 ? ["formula-roots"] : [],
    ocrLinks: [`ocr-${number}`],
    layoutLinks: [`layout-${number}`],
    boundingBoxes: [],
    readingOrder: number,
    confidence: 0.86,
    diagnostics,
    version: 1,
    pipelineVersion: "verification",
    checksum: `question-${number}`
  })),
  relationships: [],
  diagnostics,
  metrics: { questions: 3, sections: 1, groups: 0, passages: 0, options: 0, questionTypes: { SINGLE_CORRECT_MCQ: 2, MULTIPLE_CORRECT_MCQ: 1 }, averageConfidence: 0.86, reviewRequired: 0 },
  rawProviderOutput: {},
  checksum: "assessment",
  durationMs: 0,
  createdAt: new Date().toISOString()
};

async function main() {
  const provider = new RuleBasedEvaluationProvider();
  const result = await provider.evaluate({
    importJobId: "golden-evaluation-import",
    sourceKind: "ANSWER_KEY_AND_SOLUTIONS",
    assessment,
    elements: [
      { id: "key-header", pageNumber: 10, elementType: "ANSWER_AREA", text: "Official Answer Key - Version A", coordinates: { page: 10, x: 0.1, y: 0.1, width: 0.8, height: 0.04 }, readingOrder: 1, confidence: 0.9 },
      { id: "answer-1", pageNumber: 10, elementType: "ANSWER_AREA", text: "1 - B", coordinates: { page: 10, x: 0.1, y: 0.16, width: 0.4, height: 0.04 }, readingOrder: 2, confidence: 0.9 },
      { id: "answer-2", pageNumber: 10, elementType: "ANSWER_AREA", text: "2 - A,C", coordinates: { page: 10, x: 0.1, y: 0.21, width: 0.4, height: 0.04 }, readingOrder: 3, confidence: 0.9 },
      { id: "answer-3a", pageNumber: 10, elementType: "ANSWER_AREA", text: "3 - D", coordinates: { page: 10, x: 0.1, y: 0.26, width: 0.4, height: 0.04 }, readingOrder: 4, confidence: 0.9 },
      { id: "answer-3b", pageNumber: 11, elementType: "ANSWER_AREA", text: "3 - C", coordinates: { page: 11, x: 0.1, y: 0.1, width: 0.4, height: 0.04 }, readingOrder: 5, confidence: 0.9 },
      { id: "solution-1", pageNumber: 12, elementType: "ANSWER_AREA", text: "Solution 1: Step 1 use circuit law, therefore answer is B.", coordinates: { page: 12, x: 0.1, y: 0.1, width: 0.7, height: 0.08 }, readingOrder: 6, confidence: 0.86 },
      { id: "solution-2", pageNumber: 13, elementType: "ANSWER_AREA", text: "Solution 2: Formula derivation using roots and discriminant.", coordinates: { page: 13, x: 0.1, y: 0.1, width: 0.7, height: 0.08 }, readingOrder: 7, confidence: 0.86 },
      { id: "rubric-2", pageNumber: 14, elementType: "ANSWER_AREA", text: "Rubric Q2: keywords: roots, discriminant; expected concepts: quadratic equation; partial marks allowed.", coordinates: { page: 14, x: 0.1, y: 0.1, width: 0.7, height: 0.08 }, readingOrder: 8, confidence: 0.8 }
    ],
    ocrPages: [{}],
    layoutPages: [{}],
    formulaElements: [{ id: "formula-roots", pageNumber: 13, elementType: "FORMULA" }],
    visualElements: [{ id: "visual-circuit", pageNumber: 12, elementType: "DIAGRAM" }]
  });

  const failures = [];
  if (result.evaluation.schemaVersion !== "ndie-evaluation-document-v1") failures.push("Wrong evaluation schema version");
  if (result.evaluation.metrics.answers !== 4) failures.push("Expected four answer candidates including one duplicate");
  if (result.evaluation.metrics.answerCoverage !== 1) failures.push("Expected full answer coverage");
  if (result.evaluation.metrics.solutionCoverage !== 0.6667) failures.push("Expected two of three solutions mapped");
  if (result.evaluation.metrics.duplicateAnswers !== 1) failures.push("Expected duplicate answer diagnostic");
  if (!result.evaluation.diagnostics.duplicateAnswer) failures.push("Duplicate answer diagnostic not raised");
  if (!result.evaluation.evaluations.some((evaluation) => evaluation.rubricId)) failures.push("Rubric not linked");
  if (!result.answers.some((answer) => Array.isArray(answer.answerJson.correctOptions) && answer.answerJson.correctOptions.length === 2)) failures.push("Multi-correct answer not normalized");

  if (failures.length) {
    console.error(JSON.stringify({ status: "FAIL", failures }, null, 2));
    process.exit(1);
  }

  console.log(JSON.stringify({
    status: "PASS",
    provider: result.evaluation.providerId,
    schemaVersion: result.evaluation.schemaVersion,
    questions: result.evaluation.metrics.questions,
    answers: result.evaluation.metrics.answers,
    solutions: result.evaluation.metrics.solutions,
    answerCoverage: result.evaluation.metrics.answerCoverage,
    solutionCoverage: result.evaluation.metrics.solutionCoverage,
    duplicateAnswers: result.evaluation.metrics.duplicateAnswers,
    averageConfidence: result.evaluation.metrics.averageConfidence,
    diagnostics: result.evaluation.diagnostics.issues
  }));
}

main().catch((error) => {
  console.error(JSON.stringify({ status: "FAIL", message: error instanceof Error ? error.message : "Unknown error" }));
  process.exit(1);
});
