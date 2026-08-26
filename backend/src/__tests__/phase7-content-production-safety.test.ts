import { describe, expect, it } from "@jest/globals";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { assertNdieJobTransition } from "../modules/ndie/queue/state-machine.js";
import { ndieQuestionSourceFingerprint } from "../modules/ndie/question-detector/question-fingerprint.js";
import { validateCandidateIntegrity } from "../modules/ndie/review-engine/candidate-integrity.js";
import { validatePublishableExam } from "../modules/tests/exam-publishing-gate.js";

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");

const candidate = {
  assessment: {
    text: "What is 15% of 240?",
    marks: 4,
    options: [
      { key: "A", text: "24" },
      { key: "B", text: "36" },
      { key: "C", text: "40" },
      { key: "D", text: "48" }
    ]
  },
  metadata: { marks: 4 }
};

describe("Phase 7 content production safety", () => {
  it("uses stable source evidence to prevent duplicate reconstruction without merging different regions", () => {
    const first = ndieQuestionSourceFingerprint({ sourceElementIds: ["page-1-line-4"], sourceMap: { firstPage: 1, coordinates: { x: 0.1, y: 0.2 } }, questionNumber: "1", text: "Original OCR" });
    const retry = ndieQuestionSourceFingerprint({ sourceElementIds: ["page-1-line-4"], sourceMap: { coordinates: { y: 0.2, x: 0.1 }, firstPage: 1 }, questionNumber: "1", text: "Improved OCR" });
    const differentRegion = ndieQuestionSourceFingerprint({ sourceElementIds: ["page-2-line-4"], sourceMap: { firstPage: 2 }, questionNumber: "1", text: "Original OCR" });
    const regeneratedElements = ndieQuestionSourceFingerprint({ sourceElementIds: ["new-database-element-id"], sourceMap: { coordinates: { y: 0.2, x: 0.1 }, firstPage: 1, aiValidation: { confidence: 0.2 } }, questionNumber: "1", text: "Improved OCR" });
    expect(retry).toBe(first);
    expect(regeneratedElements).toBe(first);
    expect(differentRegion).not.toBe(first);
  });

  it("blocks incomplete, duplicate-option and answerless candidates", () => {
    expect(validateCandidateIntegrity({ questionType: "SINGLE_CORRECT_MCQ", candidateJson: candidate, sourceMap: { firstPage: 1 }, answerJson: { correctOption: "B" } }).valid).toBe(true);
    expect(validateCandidateIntegrity({ questionType: "SINGLE_CORRECT_MCQ", candidateJson: { ...candidate, assessment: { ...candidate.assessment, options: candidate.assessment.options.slice(0, 3) } }, sourceMap: { firstPage: 1 }, answerJson: { correctOption: "B" } }).errors).toContain("Four labelled options (A-D) are required.");
    expect(validateCandidateIntegrity({ questionType: "SINGLE_CORRECT_MCQ", candidateJson: candidate, sourceMap: { firstPage: 1 } }).errors).toContain("A teacher-verified answer is required.");
    expect(validateCandidateIntegrity({ questionType: "SINGLE_CORRECT_MCQ", candidateJson: candidate, sourceMap: null, answerJson: { correctOption: "B" } }).errors).toContain("Original source page evidence is missing.");
  });

  it("rejects illegal lifecycle shortcuts", () => {
    expect(() => assertNdieJobTransition("FAILED", "PUBLISH_RUNNING")).toThrow(/Illegal NDIE queue transition/);
    expect(() => assertNdieJobTransition("READY_FOR_TEACHER_REVIEW", "PUBLISH_RUNNING")).toThrow(/Illegal NDIE queue transition/);
    expect(() => assertNdieJobTransition("READY_FOR_PUBLISH", "PUBLISH_RUNNING")).not.toThrow();
  });

  it("chains stages but stops automatic progression at teacher review", () => {
    const queue = read("src/modules/ndie/queue/queue.service.ts");
    const worker = read("src/modules/ndie/worker/worker.service.ts");
    expect(queue).toContain("PDF_RENDERING: this.enqueueOcr.bind(this)");
    expect(queue).toContain("ANSWER: this.enqueueAiValidation.bind(this)");
    expect(queue).not.toMatch(/AI_VALIDATION:\s*this\.enqueuePublish/);
    expect(worker).toContain("enqueueNextStage");
  });

  it("revokes approval after edits and forbids bulk approval", () => {
    const review = read("src/modules/ndie/review-engine/review-engine.service.ts");
    expect(review).toContain("Save the correction first, then approve");
    expect(review).toContain("CORRECTION_SAVED_APPROVAL_REVOKED");
    expect(review).toContain("Bulk approval is disabled");
  });

  it("keeps published question versions and excludes generated browser reports from lint", () => {
    const tests = read("src/modules/tests/tests.service.ts");
    const eslint = read("../frontend/eslint.config.mjs");
    expect(tests).toContain("createInitialQuestionVersions");
    expect(tests).toContain("Initial published teacher-approved question version");
    expect(eslint).toContain('"playwright-report/**"');
    expect(eslint).toContain('"test-results/**"');
  });

  it("reconciles exam-level total marks before publishing", () => {
    const question = {
      questionText: "What is two plus two?", optionA: "1", optionB: "2", optionC: "3", optionD: "4",
      correctAnswer: "D", explanation: "Two plus two equals four.", marks: 4, reviewStatus: "APPROVED"
    };
    expect(() => validatePublishableExam({ title: "Safe exam", subject: "Mathematics", duration: 30, totalMarks: 5, questions: [question] })).toThrow(/do not match/);
    expect(() => validatePublishableExam({ title: "Safe exam", subject: "Mathematics", duration: 30, totalMarks: 4, questions: [question] })).not.toThrow();
  });
});
