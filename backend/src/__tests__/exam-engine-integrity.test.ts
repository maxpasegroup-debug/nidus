import { describe, expect, it } from "@jest/globals";
import { readFileSync } from "node:fs";
import { evaluateExamResponses, normalizeStoredResponse } from "../modules/tests/exam-evaluation.js";
import { calculateObjectiveScore } from "../modules/tests/exam-scoring.js";
import { validateDraftQuestions, validatePublishedQuestions } from "../modules/tests/exam-publishing-gate.js";

function question(id: string, correctAnswer = "A") {
  return {
    id,
    questionText: `Question ${id}`,
    optionA: "Alpha",
    optionB: "Bravo",
    optionC: "Charlie",
    optionD: "Delta",
    correctAnswer,
    explanation: "Teacher verified explanation.",
    marks: 1,
    negativeMarks: 0.25,
    reviewStatus: "APPROVED",
  };
}

describe("exam engine objective integrity", () => {
  it("calculates correct, incorrect, and unanswered marks independently", () => {
    const questions = Array.from({ length: 10 }, (_, index) => question(String(index + 1)));
    const answers = [
      ...["1", "2", "3", "4", "5"].map((questionId) => ({ questionId, selectedAnswer: "A" })),
      ...["6", "7", "8"].map((questionId) => ({ questionId, selectedAnswer: "B" })),
    ];

    expect(calculateObjectiveScore(questions, answers)).toEqual({
      score: 4.25,
      totalCorrect: 5,
      totalWrong: 3,
      totalUnanswered: 2,
    });
  });

  it("uses one final answer per question when duplicate payload entries arrive", () => {
    const questions = [question("1")];
    expect(calculateObjectiveScore(questions, [
      { questionId: "1", selectedAnswer: "B" },
      { questionId: "1", selectedAnswer: "A" },
    ])).toMatchObject({ score: 1, totalCorrect: 1, totalWrong: 0, totalUnanswered: 0 });
  });

  it("rejects malformed draft questions before persistence", () => {
    expect(() => validateDraftQuestions([{ ...question("1"), optionD: "Alpha" }])).toThrow(/duplicate answer options/i);
    expect(() => validateDraftQuestions([{ ...question("1"), correctAnswer: "E" }])).toThrow(/invalid answer key/i);
    expect(() => validateDraftQuestions([{ ...question("1"), marks: 0 }])).toThrow(/invalid marks/i);
  });

  it("blocks unsafe published question definitions", () => {
    expect(() => validatePublishedQuestions([{ ...question("1"), negativeMarks: -1 }])).toThrow(/non-negative negative marks/i);
    expect(() => validatePublishedQuestions([{ ...question("1"), renderMode: "NUMERICAL" }])).toThrow(/unsupported question rendering/i);
    expect(() => validatePublishedQuestions([{ ...question("1"), optionB: "Alpha" }])).toThrow(/duplicate answer options/i);
  });

  it("publishes canonical variable-option content without fake A-D requirements", () => {
    expect(() => validatePublishedQuestions([{
      ...question("1", ""),
      optionA: "",
      optionB: "",
      optionC: "",
      optionD: "",
      correctAnswer: "",
      renderMode: "CANONICAL_V1",
      contentJson: {
        schemaVersion: 1,
        format: "NIDUS_QUESTION_CONTENT_V1",
        questionType: "SINGLE_CHOICE",
        source: "MANUAL_ENTRY",
        blocks: [
          { id: "p1", type: "paragraph", text: "Choose the fifth option." },
          { id: "o1", type: "options", options: [
            { key: "A", text: "One" },
            { key: "B", text: "Two" },
            { key: "C", text: "Three" },
            { key: "D", text: "Four" },
            { key: "E", text: "Five" },
          ] },
        ],
        answer: { type: "SINGLE_CHOICE", correctOption: "E" },
        sourceReferences: [],
        metadata: {},
      },
      evaluationSpec: { strategy: "EXACT_OPTION", correctChoiceId: "E" },
    }])).not.toThrow();
  });

  it("evaluates canonical exact options without forcing A-D", () => {
    const canonicalQuestion = {
      ...question("1", ""),
      contentJson: {
        schemaVersion: 1,
        format: "NIDUS_QUESTION_CONTENT_V1",
        questionType: "SINGLE_CHOICE",
        source: "MANUAL_ENTRY",
        blocks: [
          { id: "p1", type: "paragraph", text: "Choose the fifth option." },
          { id: "o1", type: "options", options: [
            { key: "A", text: "One" },
            { key: "B", text: "Two" },
            { key: "C", text: "Three" },
            { key: "D", text: "Four" },
            { key: "E", text: "Five" },
          ] },
        ],
        answer: { type: "SINGLE_CHOICE", correctOption: "E" },
        sourceReferences: [],
        metadata: {},
      },
      evaluationSpec: { strategy: "EXACT_OPTION", correctChoiceId: "E" },
    };

    const stored = normalizeStoredResponse(canonicalQuestion, { schemaVersion: 1, responseType: "SINGLE_CHOICE", value: "E" });
    const result = evaluateExamResponses([canonicalQuestion], [stored]);

    expect(stored.selectedAnswer).toContain("\"value\":\"E\"");
    expect(result).toMatchObject({ score: 1, totalCorrect: 1, totalWrong: 0, pendingEvaluation: 0 });
  });

  it("keeps unresolved canonical answers pending instead of marking them wrong", () => {
    const pendingQuestion = {
      ...question("1", ""),
      contentJson: {
        schemaVersion: 1,
        format: "NIDUS_QUESTION_CONTENT_V1",
        questionType: "TEXT",
        source: "MANUAL_ENTRY",
        blocks: [{ id: "p1", type: "paragraph", text: "Explain the concept." }],
        answer: { type: "TEXT" },
        sourceReferences: [],
        metadata: {},
      },
      evaluationSpec: { strategy: "UNRESOLVED", reason: "Answer key pending" },
    };

    const stored = normalizeStoredResponse(pendingQuestion, { schemaVersion: 1, responseType: "TEXT", value: "Student response" });
    const result = evaluateExamResponses([pendingQuestion], [stored]);

    expect(stored.selectedAnswer).toContain("Student response");
    expect(result).toMatchObject({ score: 0, totalCorrect: 0, totalWrong: 0, pendingEvaluation: 1 });
    expect(result.evaluatedAnswers[0]).toMatchObject({ status: "PENDING_EVALUATION", isCorrect: false });
  });

  it("guards NDIE reconstruction against silent question truncation", () => {
    const source = readFileSync("src/modules/ndie/ai-reconstruction/ai-reconstruction.service.ts", "utf8");
    expect(source).not.toContain("questions.slice(0, 120)");
    expect(source).toContain("Refusing to truncate silently");
  });
});
