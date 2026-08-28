import { describe, expect, it } from "@jest/globals";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { extractTextDoc, extractTextDocx, extractTextPdf, parseExamQuestions } from "../modules/academy/exam-document-extraction.js";

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

  it("recognizes compact DOCX numbering, joined base subscripts, and parenthesized lowercase options", () => {
    const text = "1.Convert values (i) (1024)10 (ii) (69)10" +
      "2.Convert to base 10 (i) (1101)2 (ii) (01101)2" +
      "3.Find the value of 1101+111011" +
      "4.If x is binary (a)0,0,1 (b)0,1,0 (c)1,1,0 (d)0,0,0";

    const questions = parseExamQuestions([{ pageNumber: 1, text }]);

    expect(questions).toHaveLength(4);
    expect(questions.map((question) => question.number)).toEqual([1, 2, 3, 4]);
    expect(questions[0]).toMatchObject({ questionText: expect.stringContaining("Convert values"), reviewStatus: "NEEDS_REVIEW" });
    expect(questions[3]).toMatchObject({ optionA: "0,0,1", optionB: "0,1,0", optionC: "1,1,0", optionD: "0,0,0", reviewStatus: "MISSING_ANSWER" });
  });

  it("rejects malformed PDFs and keeps an explicit scanned-PDF guard", async () => {
    await expect(extractTextPdf(Buffer.from("not a pdf"))).rejects.toThrow(/not a valid PDF/i);
    const source = readFileSync(join(process.cwd(), "src/modules/academy/exam-document-extraction.ts"), "utf8");
    expect(source).toContain("scanned images without readable text");
    expect(source).toContain("textCharacters < 20");
  });

  it("rejects malformed DOCX files with an actionable error", async () => {
    await expect(extractTextDocx(Buffer.from("not a docx"))).rejects.toThrow(/not a valid DOCX/i);
    await expect(extractTextDoc(Buffer.from("not a doc"))).rejects.toThrow(/not a valid DOC/i);
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
    expect(service).toContain("extractTextDocx");
    expect(service).toContain("extractTextDoc(");
  });
});
