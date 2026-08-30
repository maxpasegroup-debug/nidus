import { describe, expect, it } from "@jest/globals";
import { shouldUsePdfOcrFallback } from "../modules/academy/pdf-ocr-fallback.js";
import { buildLegacyQuestionContent, parseQuestionContentJson } from "../modules/document-intelligence/question-content.schema.js";

describe("PDF OCR fallback safety", () => {
  it("uses OCR only for pages without a usable native text layer", () => {
    expect(shouldUsePdfOcrFallback({ text: "A complete native text page with questions" })).toBe(false);
    expect(shouldUsePdfOcrFallback({ text: "", encodingStatus: "VISUAL_ONLY_CONTENT" })).toBe(true);
    expect(shouldUsePdfOcrFallback({ text: "short" })).toBe(true);
  });

  it("preserves OCR review metadata in the canonical content contract", () => {
    const content = buildLegacyQuestionContent({
      questionText: "If $x^2=4$, find x.", optionA: "1", optionB: "2", optionC: "3", optionD: "4",
      correctAnswer: "", explanation: "", marks: 1, negativeMarks: 0, topic: "Math",
      ocrReviewRequired: true, ocrReviewNotes: ["OCR_TEXT_NEEDS_REVIEW", "MATH_OCR_NEEDS_REVIEW"], ocrConfidence: 0.61,
    });
    expect(parseQuestionContentJson(content).success).toBe(true);
    expect(content.metadata).toMatchObject({ ocrReviewRequired: true, ocrConfidence: 0.61 });
    expect(content.metadata.ocrReviewNotes).toEqual(["OCR_TEXT_NEEDS_REVIEW", "MATH_OCR_NEEDS_REVIEW"]);
  });

  it("does not treat OCR without a confidence score as authoritative", () => {
    const content = buildLegacyQuestionContent({
      questionText: "Scanned question", optionA: "one", optionB: "two", optionC: "three", optionD: "four",
      correctAnswer: "", explanation: "", marks: 1, negativeMarks: 0, topic: "Math",
      ocrReviewRequired: true, ocrReviewNotes: ["OCR_TEXT_NEEDS_REVIEW"], ocrConfidence: null,
    });
    expect(content.metadata).toMatchObject({ ocrReviewRequired: true, ocrReviewNotes: ["OCR_TEXT_NEEDS_REVIEW"] });
  });
});
