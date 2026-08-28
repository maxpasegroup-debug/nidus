import { describe, expect, it } from "@jest/globals";

import { buildLegacyQuestionContent, parseQuestionContentJson } from "../modules/document-intelligence/question-content.schema.js";
import { deriveReviewIssues } from "../modules/tests/exam-review.js";

const incompleteImportedQuestion = {
  questionText: "Question content preserved for teacher review.",
  optionA: "",
  optionB: "",
  optionC: "",
  optionD: "",
  correctAnswer: "",
  explanation: "",
  marks: 1,
  negativeMarks: 0,
  difficultyLevel: "MEDIUM",
  topic: "General Studies",
};

describe("reviewable imported question content", () => {
  it("serializes missing DOCX options and answer without inventing values", () => {
    const content = buildLegacyQuestionContent(incompleteImportedQuestion);
    const parsed = parseQuestionContentJson(content);

    expect(parsed.success).toBe(true);
    expect(content.blocks[1]).toMatchObject({
      type: "options",
      options: [
        { key: "A", text: "" },
        { key: "B", text: "" },
        { key: "C", text: "" },
        { key: "D", text: "" },
      ],
    });
    expect(content.answer).toEqual({ type: "SINGLE_CHOICE" });
  });

  it("keeps missing options and answer as blocking review issues", () => {
    expect(deriveReviewIssues(incompleteImportedQuestion)).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "MISSING_REQUIRED_OPTIONS", severity: "HIGH", state: "OPEN", approvable: false }),
      expect.objectContaining({ id: "INVALID_CORRECT_ANSWER", severity: "HIGH", state: "OPEN", approvable: false }),
    ]));
  });
});
