import { stemQuestionIntegrityService } from "../modules/ndie/stem-question-integrity/stem-question-integrity.service.js";

const result = stemQuestionIntegrityService.evaluate({
  importJobId: "phase-6-stem-question-integrity",
  subject: "Mathematics and Physics",
  questions: [
    {
      questionId: "ready-question",
      number: 1,
      questionType: "SINGLE_CORRECT_MCQ",
      questionText: "Which expression gives the magnitude of vector a?",
      options: [
        { label: "A", text: "sqrt(x^2 + y^2)" },
        { label: "B", text: "x + y" },
        { label: "C", text: "x - y" },
        { label: "D", text: "xy" }
      ],
      linkedAnswer: "A",
      linkedAssets: ["formula-vector-magnitude"],
      recoveredFormula: "\\sqrt{x^2+y^2}",
      sourcePage: 1,
      originalCrop: "https://assets.nidus.test/question-1.png",
      draftConfidence: 0.96,
      reviewStatus: "READY"
    },
    {
      questionId: "incomplete-question",
      number: 2,
      questionType: "SINGLE_CORRECT_MCQ",
      questionText: "For the circuit shown, calculate the current.",
      options: [{ label: "A", text: "2 A" }],
      linkedAnswer: null,
      linkedAssets: [],
      recoveredFormula: null,
      sourcePage: 2,
      originalCrop: "https://assets.nidus.test/question-2.png",
      draftConfidence: 0.54,
      reviewStatus: "NEEDS_REVIEW",
      missingItems: ["diagram", "formula"]
    },
    {
      questionId: "preserved-question",
      number: 3,
      questionType: "NUMERICAL",
      questionText: "Content preserved for teacher review.",
      sourcePage: 3,
      originalCrop: "https://assets.nidus.test/question-3.png",
      draftConfidence: 0.25,
      reviewStatus: "INCOMPLETE"
    }
  ],
  formulaPerfection: { summary: { formulaCount: 2, teacherReviewRequired: 0 } },
  visualSemantics: { summary: { visualCount: 1, teacherReviewRequired: 0 } },
  chemistryStructure: { summary: { objectCount: 0, teacherReviewRequired: 0 } }
});

const ready = result.questions.find((question) => question.questionId === "ready-question");
const incomplete = result.questions.find((question) => question.questionId === "incomplete-question");
const preserved = result.questions.find((question) => question.questionId === "preserved-question");
const mappingResult = stemQuestionIntegrityService.evaluate({
  importJobId: "phase-6-answer-mapping",
  subject: "Chemistry",
  questions: [{
    questionId: "answer-mismatch",
    number: 1,
    questionType: "SINGLE_CORRECT_MCQ",
    questionText: "Select the balanced chemical equation.",
    options: [
      { label: "A", text: "H2 + O2 -> H2O" },
      { label: "B", text: "2H2 + O2 -> 2H2O" }
    ],
    linkedAnswer: "D",
    linkedAssets: ["formula-balanced-equation"],
    recoveredFormula: "2H_2 + O_2 \\rightarrow 2H_2O",
    sourcePage: 1,
    originalCrop: "https://assets.nidus.test/answer-mismatch.png",
    draftConfidence: 0.95,
    reviewStatus: "READY"
  }]
});

const checks: Array<[string, boolean, unknown?]> = [
  ["health ready", stemQuestionIntegrityService.health().status === "ready", stemQuestionIntegrityService.health()],
  ["all questions preserved", result.summary.totalQuestions === 3, result.summary],
  ["complete question ready", ready?.readiness === "READY", ready],
  ["missing options detected", Boolean(incomplete?.issues.some((item) => item.code === "INCOMPLETE_OPTIONS")), incomplete?.issues],
  ["missing answer detected", Boolean(incomplete?.issues.some((item) => item.code === "MISSING_ANSWER")), incomplete?.issues],
  ["missing formula detected", Boolean(incomplete?.issues.some((item) => item.code === "MISSING_FORMULA_REFERENCE")), incomplete?.issues],
  ["missing visual detected", Boolean(incomplete?.issues.some((item) => item.code === "MISSING_VISUAL_REFERENCE")), incomplete?.issues],
  ["uncertain content blocked", preserved?.readiness === "BLOCKED", preserved],
  ["wrong answer mapping blocked", Boolean(mappingResult.questions[0]?.issues.some((item) => item.code === "ANSWER_OPTION_MISMATCH") && mappingResult.summary.publishReadiness === "BLOCKED"), mappingResult],
  ["critical content blocks publishing", result.summary.publishReadiness === "BLOCKED", result.summary],
  ["uncertainty preserved", result.questions.every((question) => question.guarantees.uncertaintyPreserved), result.questions.map((question) => question.guarantees)]
];

const failed = checks.filter(([, ok]) => !ok);
for (const [name, ok, details] of checks) {
  console.log(`${ok ? "PASS" : "FAIL"} ${name}`, details ? JSON.stringify(details) : "");
}

if (failed.length) {
  throw new Error(`NDIE STEM question integrity verification failed: ${failed.map(([name]) => name).join(", ")}`);
}
