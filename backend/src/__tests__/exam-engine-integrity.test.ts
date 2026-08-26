import { describe, expect, it } from "@jest/globals";
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
});
