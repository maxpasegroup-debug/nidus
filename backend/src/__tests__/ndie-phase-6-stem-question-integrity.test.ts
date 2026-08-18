import { describe, expect, it } from "@jest/globals";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { stemQuestionIntegrityService } from "../modules/ndie/stem-question-integrity/stem-question-integrity.service.js";

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");

describe("NDIE Phase 6 STEM question integrity", () => {
  it("defines the integrity contract, service, health wiring and verification command", () => {
    const contract = read("src/modules/ndie/contracts/stem-question-integrity-result.ts");
    const service = read("src/modules/ndie/stem-question-integrity/stem-question-integrity.service.ts");
    const ndie = read("src/modules/ndie/ndie.service.ts");
    const container = read("src/modules/ndie/ndie.container.ts");
    const packageJson = read("package.json");

    expect(contract).toContain("NdieStemQuestionIntegrityResult");
    expect(contract).toContain("MISSING_FORMULA_REFERENCE");
    expect(contract).toContain("MISSING_VISUAL_REFERENCE");
    expect(service).toContain("stemQuestionIntegrityService");
    expect(ndie).toContain("stemQuestionIntegrityService.health");
    expect(container).toContain("StemQuestionIntegrity");
    expect(packageJson).toContain("test:ndie-stem-question-integrity");
  });

  it("keeps a complete STEM question ready", () => {
    const result = stemQuestionIntegrityService.evaluate({
      importJobId: "complete",
      subject: "Mathematics",
      questions: [{
        questionId: "q1",
        number: 1,
        questionType: "SINGLE_CORRECT_MCQ",
        questionText: "Evaluate the integral shown in the formula.",
        options: [
          { label: "A", text: "0" },
          { label: "B", text: "1" },
          { label: "C", text: "2" },
          { label: "D", text: "3" }
        ],
        linkedAnswer: "B",
        linkedAssets: ["formula-integral"],
        recoveredFormula: "\\int_0^1 2x\\,dx",
        sourcePage: 1,
        originalCrop: "https://assets.nidus.test/q1.png",
        draftConfidence: 0.97,
        reviewStatus: "READY"
      }]
    });

    expect(result.summary.publishReadiness).toBe("READY");
    expect(result.questions[0]?.readiness).toBe("READY");
    expect(result.questions[0]?.issues).toEqual([]);
  });

  it("flags incomplete options, answer, formula and visual references without discarding the question", () => {
    const result = stemQuestionIntegrityService.evaluate({
      importJobId: "incomplete",
      subject: "Physics",
      questions: [{
        questionId: "q1",
        number: 1,
        questionType: "SINGLE_CORRECT_MCQ",
        questionText: "For the circuit shown, use the formula to find current.",
        options: [{ label: "A", text: "2 A" }],
        linkedAnswer: null,
        linkedAssets: [],
        recoveredFormula: null,
        sourcePage: 2,
        originalCrop: "https://assets.nidus.test/q1.png",
        draftConfidence: 0.51,
        reviewStatus: "NEEDS_REVIEW",
        missingItems: ["formula", "diagram"]
      }]
    });

    const codes = result.questions[0]?.issues.map((item) => item.code);
    expect(codes).toEqual(expect.arrayContaining(["INCOMPLETE_OPTIONS", "MISSING_ANSWER", "MISSING_FORMULA_REFERENCE", "MISSING_VISUAL_REFERENCE", "LOW_DRAFT_CONFIDENCE"]));
    expect(result.summary.totalQuestions).toBe(1);
    expect(result.questions[0]?.guarantees.questionPreserved).toBe(true);
    expect(result.summary.publishReadiness).toBe("READY_WITH_REVIEW");
  });

  it("blocks publishing when reconstructed question text is not usable", () => {
    const result = stemQuestionIntegrityService.evaluate({
      importJobId: "critical",
      subject: "Chemistry",
      questions: [{
        questionId: "q1",
        number: 1,
        questionType: "DESCRIPTIVE",
        questionText: "Content preserved for teacher review.",
        sourcePage: 1,
        originalCrop: "https://assets.nidus.test/q1.png",
        draftConfidence: 0.2,
        reviewStatus: "INCOMPLETE"
      }]
    });

    expect(result.questions[0]?.issues.some((item) => item.code === "EMPTY_QUESTION_TEXT" && item.severity === "CRITICAL")).toBe(true);
    expect(result.questions[0]?.readiness).toBe("BLOCKED");
    expect(result.summary.publishReadiness).toBe("BLOCKED");
    expect(result.questions[0]?.guarantees.noAutoPublishWhenCritical).toBe(true);
  });

  it("blocks an answer mapped to a missing option and reports malformed option labels", () => {
    const result = stemQuestionIntegrityService.evaluate({
      importJobId: "answer-mismatch",
      subject: "Chemistry",
      questions: [{
        questionId: "q1",
        number: 1,
        questionType: "SINGLE_CORRECT_MCQ",
        questionText: "Which option represents the balanced reaction?",
        options: [
          { label: "A", text: "H2 + O2 -> H2O" },
          { label: "A", text: "H2 + O2 -> H2O" },
          { text: "2H2 + O2 -> 2H2O" }
        ],
        linkedAnswer: "D",
        linkedAssets: ["formula-reaction"],
        recoveredFormula: "2H_2 + O_2 \\rightarrow 2H_2O",
        sourcePage: 1,
        originalCrop: "https://assets.nidus.test/q1.png",
        draftConfidence: 0.94,
        reviewStatus: "READY"
      }]
    });

    const codes = result.questions[0]?.issues.map((item) => item.code);
    expect(codes).toEqual(expect.arrayContaining(["MISSING_OPTION_LABEL", "DUPLICATE_OPTION_LABEL", "DUPLICATE_OPTION_TEXT", "ANSWER_OPTION_MISMATCH"]));
    expect(result.questions[0]?.readiness).toBe("BLOCKED");
    expect(result.summary.publishReadiness).toBe("BLOCKED");
  });

  it("detects duplicate and broken question numbering", () => {
    const base = {
      questionType: "DESCRIPTIVE",
      questionText: "Explain the result.",
      sourcePage: 1,
      originalCrop: "https://assets.nidus.test/question.png",
      draftConfidence: 0.9,
      reviewStatus: "READY"
    };
    const result = stemQuestionIntegrityService.evaluate({
      importJobId: "numbering",
      subject: "General",
      questions: [
        { ...base, questionId: "q1", number: 1 },
        { ...base, questionId: "q2", number: 3 },
        { ...base, questionId: "q3", number: 3 }
      ]
    });

    expect(result.questions[1]?.issues.some((item) => item.code === "DUPLICATE_QUESTION_NUMBER")).toBe(true);
    expect(result.questions[1]?.issues.some((item) => item.code === "BROKEN_NUMBERING")).toBe(true);
    expect(result.summary.needsReview).toBe(2);
  });
});
