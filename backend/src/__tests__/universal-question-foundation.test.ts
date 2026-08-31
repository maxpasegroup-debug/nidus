import { describe, expect, it } from "@jest/globals";
import {
  UNIVERSAL_QUESTION_FORMAT,
  evaluationSpecSchema,
  legacySingleChoiceFoundation,
  universalQuestionSchema,
} from "../modules/document-intelligence/universal-question.schema.js";

describe("universal question foundation", () => {
  it("represents a statement-combination question without flattening its statements", () => {
    const parsed = universalQuestionSchema.parse({
      schemaVersion: 1,
      format: UNIVERSAL_QUESTION_FORMAT,
      displayOrder: 7,
      sourceQuestionNumber: "5(b)",
      questionType: "SINGLE_CHOICE",
      questionStructure: "STATEMENT_COMBINATION",
      content: [
        { type: "paragraph", text: "Consider the following statements." },
        { type: "statementList", items: [{ text: "First statement" }, { text: "Second statement" }], ordered: true },
        { type: "instruction", text: "Which statements are correct?" },
      ],
      choices: [
        { id: "A", content: [{ type: "paragraph", text: "1 only" }] },
        { id: "B", content: [{ type: "paragraph", text: "2 only" }] },
        { id: "C", content: [{ type: "paragraph", text: "Both 1 and 2" }] },
      ],
      responseSpec: { type: "SINGLE_CHOICE", choiceIds: ["A", "B", "C"] },
      evaluationSpec: { strategy: "EXACT_OPTION", correctChoiceId: "C" },
    });

    expect(parsed.sourceQuestionNumber).toBe("5(b)");
    expect(parsed.content[1].type).toBe("statementList");
    expect(parsed.choices).toHaveLength(3);
  });

  it("supports type-aware response and evaluation specifications", () => {
    expect(evaluationSpecSchema.parse({ strategy: "OPTION_SET", correctChoiceIds: ["A", "C"] })).toEqual({ strategy: "OPTION_SET", correctChoiceIds: ["A", "C"] });
    expect(evaluationSpecSchema.parse({ strategy: "NUMERIC_TOLERANCE", value: 3.14, absoluteTolerance: 0.01 })).toMatchObject({ strategy: "NUMERIC_TOLERANCE", value: 3.14 });
    expect(evaluationSpecSchema.parse({ strategy: "PAIR_MATCH", pairs: { A: "3", B: "1" } })).toMatchObject({ strategy: "PAIR_MATCH" });
    expect(evaluationSpecSchema.parse({ strategy: "MANUAL_RUBRIC" })).toEqual({ strategy: "MANUAL_RUBRIC" });
  });

  it("projects legacy A-D metadata without inventing an answer or confidence", () => {
    const unresolved = legacySingleChoiceFoundation({ displayOrder: 2, sourceQuestionNumber: 12 });
    expect(unresolved).toMatchObject({
      displayOrder: 2,
      sourceQuestionNumber: "12",
      questionType: "SINGLE_CHOICE",
      questionStructure: "STANDARD",
      responseSpec: { type: "SINGLE_CHOICE", choiceIds: ["A", "B", "C", "D"] },
      evaluationSpec: { strategy: "UNRESOLVED" },
    });
    expect(unresolved).not.toHaveProperty("extractionConfidence");
  });

  it("preserves legacy answers and source evidence when they actually exist", () => {
    const projected = legacySingleChoiceFoundation({ displayOrder: 1, correctAnswer: "b", sourceDocumentId: "upload-1", sourcePageNumber: 3 });
    expect(projected.evaluationSpec).toEqual({ strategy: "EXACT_OPTION", correctChoiceId: "B" });
    expect(projected.sourceEvidence).toMatchObject({ documentId: "upload-1", pageNumbers: [3] });
  });

  it("rejects automatic evaluation disguised as a descriptive response", () => {
    expect(universalQuestionSchema.safeParse({
      schemaVersion: 1,
      format: UNIVERSAL_QUESTION_FORMAT,
      displayOrder: 1,
      questionType: "DESCRIPTIVE",
      questionStructure: "STANDARD",
      content: [{ type: "paragraph", text: "Explain the result." }],
      responseSpec: { type: "DESCRIPTIVE", manualEvaluation: false },
      evaluationSpec: { strategy: "EXACT_OPTION", correctChoiceId: "A" },
    }).success).toBe(false);
  });
});
