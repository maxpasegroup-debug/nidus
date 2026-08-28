import { describe, expect, it } from "@jest/globals";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { extractTextPdf, parseExamQuestions } from "../modules/academy/exam-document-extraction.js";

describe("exam upload PDF extraction", () => {
  it("reconstructs extracted PDF page text without guessing a missing answer", () => {
    const questions = parseExamQuestions([{ pageNumber: 1, text: "1. What is the capital of India? A. Mumbai B. Delhi C. Chennai D. Kolkata" }]);
    expect(questions).toHaveLength(1);
    expect(questions[0]).toMatchObject({ number: 1, correctAnswer: undefined, sourcePageNumber: 1, reviewStatus: "MISSING_ANSWER" });
  });

  it("uses an optional answer-key document when supplied", () => {
    const paper = [{ pageNumber: 1, text: "1. What is the capital of India? A. Mumbai B. Delhi C. Chennai D. Kolkata" }];
    const key = [{ pageNumber: 1, text: "Answer key 1. B" }];
    expect(parseExamQuestions(paper, key)[0]).toMatchObject({ correctAnswer: "B", reviewStatus: "READY" });
  });

  it("rejects malformed PDFs and keeps an explicit scanned-PDF guard", async () => {
    await expect(extractTextPdf(Buffer.from("not a pdf"))).rejects.toThrow(/not a valid PDF/i);
    const source = readFileSync(join(process.cwd(), "src/modules/academy/exam-document-extraction.ts"), "utf8");
    expect(source).toContain("scanned images without readable text");
    expect(source).toContain("textCharacters < 20");
  });

  it("keeps question paper required and answer key optional across UI and reconstruction", () => {
    const studio = readFileSync(join(process.cwd(), "../frontend/src/components/teacher/simple-exam-studio.tsx"), "utf8");
    const service = readFileSync(join(process.cwd(), "src/modules/academy/academy.service.ts"), "utf8");
    expect(studio).toContain('if (!questionPaper) { setUploadError("Question paper is required.")');
    expect(studio).toContain("disabled={busy || !questionPaper}");
    expect(studio).not.toContain("!questionPaper || !solutionPaper");
    expect(studio).toContain(".pdf,.doc,.docx");
    expect(service).toContain('if (uploadIds.length && !questionPaper)');
    expect(service).toContain('linkedUploadRows.find((row) => row.sourceKind === "ANSWER_KEY")');
  });
});
