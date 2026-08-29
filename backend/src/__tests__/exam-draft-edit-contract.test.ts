import { describe, expect, it } from "@jest/globals";
import type { Request } from "express";
import { validationResult } from "express-validator";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { draftQuestionValidators } from "../modules/tests/exam-draft-question.validation.js";
import { blockingIssues, deriveReviewIssues } from "../modules/tests/exam-review.js";
import { validateEditableDraftQuestions, validatePublishedQuestions } from "../modules/tests/exam-publishing-gate.js";

const editableQuestion = {
  questionText: "Which value is prime?",
  optionA: "4",
  optionB: "5",
  optionC: "6",
  optionD: "8",
  correctAnswer: "",
  explanation: "",
  marks: 1,
  negativeMarks: 0,
  reviewStatus: "NEEDS_REVIEW",
};

async function validateRequestBody(body: Record<string, unknown>) {
  const request = { body } as Request;
  for (const validator of draftQuestionValidators()) await validator.run(request);
  return { body: request.body as Record<string, unknown>, errors: validationResult(request).array() };
}

describe("editable DRAFT question contract", () => {
  it("allows an unresolved answer and explanation during draft editing", () => {
    expect(() => validateEditableDraftQuestions([editableQuestion])).not.toThrow();
    const issues = deriveReviewIssues(editableQuestion);
    expect(blockingIssues(issues)).toEqual([
      expect.objectContaining({ id: "INVALID_CORRECT_ANSWER", severity: "HIGH", approvable: false }),
    ]);
  });

  it("keeps the unresolved answer blocked at publication", () => {
    expect(() => validatePublishedQuestions([{ ...editableQuestion, reviewStatus: "APPROVED" }])).toThrow(/invalid answer key/i);
  });

  it("accepts missing deferred fields at the real HTTP validation boundary", async () => {
    const { errors } = await validateRequestBody({
      questionText: editableQuestion.questionText,
      optionA: editableQuestion.optionA,
      optionB: editableQuestion.optionB,
      optionC: editableQuestion.optionC,
      optionD: editableQuestion.optionD,
      marks: editableQuestion.marks,
      negativeMarks: editableQuestion.negativeMarks,
      difficultyLevel: "MEDIUM",
      topic: "Numbers",
    });
    expect(errors).toEqual([]);
  });

  it("normalizes valid answers and returns specific structural errors", async () => {
    const valid = await validateRequestBody({ ...editableQuestion, correctAnswer: " b ", difficultyLevel: "MEDIUM", topic: "Numbers" });
    expect(valid.errors).toEqual([]);
    expect(valid.body.correctAnswer).toBe("B");

    const invalid = await validateRequestBody({ ...editableQuestion, optionA: "", correctAnswer: "E", marks: 0, difficultyLevel: "MEDIUM", topic: "Numbers" });
    expect(invalid.errors.map((error) => error.msg)).toEqual(expect.arrayContaining([
      "Option A is required.",
      "Correct answer must be blank or one of A, B, C or D.",
      "Marks must be greater than 0 and no more than 1000.",
    ]));
  });

  it("wires the route and service to the editable contract without weakening lifecycle authority", () => {
    const root = process.cwd();
    const routes = readFileSync(join(root, "src/modules/tests/tests.routes.ts"), "utf8");
    const service = readFileSync(join(root, "src/modules/tests/tests.service.ts"), "utf8");
    expect(routes).toContain("draftQuestionValidators()");
    expect(service).toContain("validateEditableDraftQuestions([candidate])");
    expect(service).toContain("synchronizeEditableQuestionContentJson(reviewedCandidate)");
    expect(service).toContain('blockingIssues(reviewIssues).length ? "NEEDS_REVIEW" : "REVIEWED"');
    expect(service).toContain('if (test.lifecycle !== "DRAFT")');
    expect(service).toContain('"DRAFT_EDITED"');
    expect(service).toContain("questionVersion.create");
  });

  it("exposes persisted progress and a backend-derived resume path", () => {
    const root = process.cwd();
    const service = readFileSync(join(root, "src/modules/tests/tests.service.ts"), "utf8");
    const studio = readFileSync(join(root, "../frontend/src/components/teacher/simple-exam-studio.tsx"), "utf8");
    const control = readFileSync(join(root, "../frontend/src/components/director/director-exam-control.tsx"), "utf8");
    expect(service).toContain("reviewAnswerProgress(test.questions)");
    expect(service).toContain('readiness.reviewStatus === "READY" ? "release" : "review"');
    expect(studio).toContain("Answers to complete later");
    expect(studio).toContain("Return to Exam Control");
    expect(control).toContain("stage=${test.resumeStage}");
  });

  it("makes deferred-answer draft behavior explicit and protects unsaved edits", () => {
    const studio = readFileSync(join(process.cwd(), "../frontend/src/components/teacher/simple-exam-studio.tsx"), "utf8");
    expect(studio).toContain("Not set — complete later");
    expect(studio).toContain("Can be completed later; required before Release.");
    expect(studio).toContain("Explanation");
    expect(studio).toContain("Optional");
    expect(studio).toContain("Save draft changes");
    expect(studio).toContain("Review next unanswered question");
    expect(studio).toContain("dirtyQuestionIndexes.size");
    expect(studio).toContain("Leave without saving your question changes?");
    expect(studio).toContain("questionEditErrors");
    expect(studio).toContain('role="alert"');
  });

  it("uses plain-language copy for review issues", () => {
    const studio = readFileSync(join(process.cwd(), "../frontend/src/components/teacher/simple-exam-studio.tsx"), "utf8");
    expect(studio).toContain("Correct answer is missing");
    expect(studio).toContain("Explanation is missing");
    expect(studio).toContain("Source location is missing");
  });
});
