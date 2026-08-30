import { blockingIssues, calculateExamEnd, deriveReviewIssues, reviewAnswerProgress, reviewReadiness } from "../modules/tests/exam-review.js";
import { validateEditableDraftQuestions, validatePublishedQuestions } from "../modules/tests/exam-publishing-gate.js";
import { describe, expect, it } from "@jest/globals";

const complete = { questionText: "2 + 2?", optionA: "3", optionB: "4", optionC: "5", optionD: "6", correctAnswer: "B", sourcePageNumber: 1 };

describe("exam review authority", () => {
  it("treats structural defects as blocking and non-approvable", () => {
    const issue = deriveReviewIssues({ ...complete, correctAnswer: "" }).find((item) => item.id === "INVALID_CORRECT_ANSWER");
    expect(issue).toMatchObject({ severity: "HIGH", state: "OPEN", approvable: false });
    expect(blockingIssues(issue ? [issue] : [])).toHaveLength(1);
  });

  it("keeps missing explanations visible but non-blocking", () => {
    const issue = deriveReviewIssues({ ...complete, explanation: "" }).find((item) => item.id === "MISSING_EXPLANATION");
    expect(issue).toMatchObject({ severity: "LOW", state: "OPEN", approvable: true });
    expect(blockingIssues(issue ? [issue] : [])).toHaveLength(0);
  });

  it("defines an editable DRAFT contract with deferred answers and explanations", () => {
    const incomplete = { ...complete, correctAnswer: "", explanation: "", marks: 1, negativeMarks: 0 };
    expect(() => validateEditableDraftQuestions([incomplete])).not.toThrow();
    expect(() => validateEditableDraftQuestions([{ ...incomplete, optionD: "" }])).toThrow(/four answer options/i);
    expect(() => validateEditableDraftQuestions([{ ...incomplete, marks: 0 }])).toThrow(/invalid marks/i);
  });

  it("still requires a valid answer for publication while allowing an empty explanation", () => {
    const publishable = { ...complete, explanation: "", marks: 1, negativeMarks: 0, reviewStatus: "APPROVED" };
    expect(() => validatePublishedQuestions([publishable])).not.toThrow();
    expect(() => validatePublishedQuestions([{ ...publishable, correctAnswer: "" }])).toThrow(/invalid answer key/i);
  });

  it("reports persisted answer progress for deferred-answer resume flows", () => {
    expect(reviewAnswerProgress([
      { ...complete, explanation: "Because 4 is even." },
      { ...complete, correctAnswer: "", explanation: "" },
      { ...complete, correctAnswer: "c", explanation: "" },
    ])).toEqual({ answeredQuestionCount: 2, unresolvedAnswerCount: 1, missingExplanationCount: 2 });
  });

  it("resolves structural issues deterministically after editing", () => {
    const before = deriveReviewIssues({ ...complete, questionText: "" });
    const after = deriveReviewIssues(complete, before);
    expect(after.find((item) => item.id === "MISSING_QUESTION_TEXT")?.state).toBe("RESOLVED");
  });

  it("makes absent source coordinates a real non-blocking issue", () => {
    expect(deriveReviewIssues({ ...complete, sourcePageNumber: null }).find((item) => item.id === "SOURCE_COORDINATES_UNAVAILABLE")).toMatchObject({ severity: "LOW", state: "OPEN", approvable: true });
  });

  it("blocks a referenced visual until an image-backed asset is confirmed", () => {
    const issue = deriveReviewIssues({
      ...complete,
      visualReviewRequired: true,
      visualReviewNotes: ["This question refers to a visual source that could not be assigned safely."],
      contentJson: { blocks: [{ type: "visual", assetId: "visual-1", pageNumber: 1 }] },
    }).find((item) => item.id === "MISSING_REQUIRED_VISUAL");
    expect(issue).toMatchObject({ severity: "HIGH", state: "OPEN", approvable: false });
    const resolved = deriveReviewIssues({
      ...complete,
      visualReviewRequired: true,
      visualReviewNotes: ["Visual source attached."],
      contentJson: { blocks: [{ type: "visual", assetId: "visual-1", assetUrl: "https://cdn.example.test/visual.jpg", pageNumber: 1 }] },
    }).find((item) => item.id === "MISSING_REQUIRED_VISUAL");
    expect(resolved?.state).toBe("RESOLVED");
  });

  it("blocks visual crops that still carry an association review flag", () => {
    const issue = deriveReviewIssues({
      ...complete,
      contentJson: { blocks: [{ type: "visual", assetId: "visual-1", assetUrl: "https://cdn.example.test/visual.jpg", pageNumber: 1, reviewRequired: true }] },
    }).find((item) => item.id === "VISUAL_SOURCE_NEEDS_REVIEW");
    expect(issue).toMatchObject({ severity: "HIGH", state: "OPEN", approvable: false });
  });

  it("blocks OCR text and math until a director confirms the scan", () => {
    const issues = deriveReviewIssues({
      ...complete,
      contentJson: { metadata: { ocrReviewRequired: true, ocrReviewNotes: ["OCR_TEXT_NEEDS_REVIEW", "MATH_OCR_NEEDS_REVIEW"] } },
    });
    expect(issues.find((item) => item.id === "OCR_TEXT_NEEDS_REVIEW")).toMatchObject({ severity: "HIGH", approvable: false, state: "OPEN" });
    expect(issues.find((item) => item.id === "MATH_OCR_NEEDS_REVIEW")).toMatchObject({ severity: "HIGH", approvable: false, state: "OPEN" });
  });

  it("derives end time from start and duration, including cross-day", () => {
    expect(calculateExamEnd("2026-08-29T09:00:00+05:30", 60).toISOString()).toBe("2026-08-29T04:30:00.000Z");
    expect(calculateExamEnd("2026-08-29T23:30:00+05:30", 120).toISOString()).toBe("2026-08-29T20:00:00.000Z");
  });

  it("requires explicit count and marks reconciliation", () => {
    expect(reviewReadiness({ lifecycle: "DRAFT", actualQuestionCount: 23, authoritativeQuestionCount: 25, actualMarksTotal: 96, authoritativeMarks: 100, unresolvedHighIssueCount: 0 })).toMatchObject({ reviewStatus: "REVIEW_REQUIRED" });
    expect(reviewReadiness({ lifecycle: "DRAFT", actualQuestionCount: 23, authoritativeQuestionCount: 23, actualMarksTotal: 96, authoritativeMarks: 96, unresolvedHighIssueCount: 0 })).toEqual({ reviewStatus: "READY", blockingReasons: [] });
  });
});
