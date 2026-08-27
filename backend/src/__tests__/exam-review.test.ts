import { blockingIssues, calculateExamEnd, deriveReviewIssues, reviewReadiness } from "../modules/tests/exam-review.js";
import { describe, expect, it } from "@jest/globals";

const complete = { questionText: "2 + 2?", optionA: "3", optionB: "4", optionC: "5", optionD: "6", correctAnswer: "B", sourcePageNumber: 1 };

describe("exam review authority", () => {
  it("treats structural defects as blocking and non-approvable", () => {
    const issue = deriveReviewIssues({ ...complete, correctAnswer: "" }).find((item) => item.id === "INVALID_CORRECT_ANSWER");
    expect(issue).toMatchObject({ severity: "HIGH", state: "OPEN", approvable: false });
    expect(blockingIssues(issue ? [issue] : [])).toHaveLength(1);
  });

  it("resolves structural issues deterministically after editing", () => {
    const before = deriveReviewIssues({ ...complete, questionText: "" });
    const after = deriveReviewIssues(complete, before);
    expect(after.find((item) => item.id === "MISSING_QUESTION_TEXT")?.state).toBe("RESOLVED");
  });

  it("makes absent source coordinates a real non-blocking issue", () => {
    expect(deriveReviewIssues({ ...complete, sourcePageNumber: null }).find((item) => item.id === "SOURCE_COORDINATES_UNAVAILABLE")).toMatchObject({ severity: "LOW", state: "OPEN", approvable: true });
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
