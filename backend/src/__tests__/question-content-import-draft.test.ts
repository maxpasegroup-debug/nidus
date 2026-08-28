import { describe, expect, it } from "@jest/globals";

import { buildLegacyQuestionContent, parseQuestionContentJson, synchronizeEditableQuestionContentJson } from "../modules/document-intelligence/question-content.schema.js";
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

  it("synchronizes draft edits without discarding rich structured content", () => {
    const original = buildLegacyQuestionContent({ ...incompleteImportedQuestion, optionA: "Old A", optionB: "Old B", optionC: "Old C", optionD: "Old D" });
    original.blocks.push({ id: "diagram-1", type: "image", url: "https://example.test/diagram.png", assetRole: "DIAGRAM", sourceReference: { page: 2 } });
    original.sourceReferences.push({ documentId: "source-1", page: 2 });

    const synchronized = synchronizeEditableQuestionContentJson({
      ...incompleteImportedQuestion,
      questionText: "Updated question text",
      optionA: "New A",
      optionB: "New B",
      optionC: "New C",
      optionD: "New D",
      correctAnswer: "c",
      explanation: "Updated explanation",
      marks: 2,
      contentJson: original,
    });
    const parsed = parseQuestionContentJson(synchronized);
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    expect(parsed.data.blocks).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: "paragraph", text: "Updated question text" }),
      expect.objectContaining({ type: "options", options: expect.arrayContaining([{ key: "C", text: "New C" }]) }),
      expect.objectContaining({ type: "explanation", text: "Updated explanation" }),
      expect.objectContaining({ type: "image", url: "https://example.test/diagram.png", assetRole: "DIAGRAM" }),
    ]));
    expect(parsed.data.answer).toEqual({ type: "SINGLE_CHOICE", correctOption: "C" });
    expect(parsed.data.sourceReferences).toEqual([{ documentId: "source-1", page: 2 }]);
    expect(parsed.data.metadata.marks).toBe(2);

    const deferred = synchronizeEditableQuestionContentJson({ ...incompleteImportedQuestion, optionA: "New A", optionB: "New B", optionC: "New C", optionD: "New D", contentJson: synchronized });
    const deferredParsed = parseQuestionContentJson(deferred);
    expect(deferredParsed.success).toBe(true);
    if (!deferredParsed.success) return;
    expect(deferredParsed.data.answer).toEqual({ type: "SINGLE_CHOICE" });
    expect(deferredParsed.data.blocks.some((block) => block.type === "explanation")).toBe(false);
    expect(deferredParsed.data.blocks.some((block) => block.type === "image")).toBe(true);
  });
});
