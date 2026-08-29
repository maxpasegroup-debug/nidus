import { describe, expect, it } from "@jest/globals";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { extractTextDoc, extractTextDocx, extractTextPdf, parseExamQuestions, renderOfficeMathFragment } from "../modules/academy/exam-document-extraction.js";

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

  it("recognizes closing-parenthesis question numbering from Word papers", () => {
    const text = [
      "1) If the major axis of an ellipse is 3 times its minor axis, its eccentricity is:",
      "(a) √8/2(b) 3/2",
      "(c) √8/3(d) 3/4",
      "2) The focal distance of a point on the parabola y² = 12x is 4. What is the abscissa of the point?",
      "(a) 1(b) -1",
      "(c) 3/2(d) -2",
    ].join("\n");

    const questions = parseExamQuestions([{ pageNumber: 1, text }]);

    expect(questions).toHaveLength(2);
    expect(questions[0]).toMatchObject({
      number: 1,
      questionText: expect.stringContaining("major axis"),
      optionA: "√8/2",
      optionB: "3/2",
      optionC: "√8/3",
      optionD: "3/4",
    });
    expect(questions[1]).toMatchObject({ number: 2, optionA: "1", optionB: "-1", optionC: "3/2", optionD: "-2" });
  });

  it("recognizes Word papers with one unlabeled option per paragraph", () => {
    const text = [
      "1. If the major axis of an ellipse is twice its minor axis, then its eccentricity is:",
      "1/2",
      "√2/2",
      "√3/2",
      "3/4",
      "2. The equation of the ellipse whose vertices are (±6, 0) and foci are (±4, 0) is:",
      "x²/36 + y²/20 = 1",
      "x²/20 + y²/36 = 1",
      "x²/36 + y²/16 = 1",
      "x²/16 + y²/20 = 1",
    ].join("\n");
    const questions = parseExamQuestions([{ pageNumber: 1, text }]);

    expect(questions).toHaveLength(2);
    expect(questions[0]).toMatchObject({
      questionText: expect.stringContaining("major axis"),
      optionA: "1/2",
      optionB: "√2/2",
      optionC: "√3/2",
      optionD: "3/4",
      reviewStatus: "MISSING_ANSWER",
    });
  });

  it("recognizes Q/Question labels, parenthesized numbering, colon options, and safe answer-key formats", () => {
    const paper = [
      "Q1: Which value is prime?",
      "A: 2",
      "B: 4",
      "C: 6",
      "D: 8",
      "Question 2)",
      "(a) Mercury",
      "(b) Venus",
      "(c) Earth",
      "(d) Mars",
      "(3) Which expression contains (1024)10 but is not a new question?",
      "A. one",
      "B. two",
      "C. three",
      "D. four",
    ].join("\n");
    const key = [{ pageNumber: 1, text: "Q1: B\nAnswer 2: C\n3-B" }];
    const questions = parseExamQuestions([{ pageNumber: 1, text: paper }], key);

    expect(questions).toHaveLength(3);
    expect(questions.map((question) => question.number)).toEqual([1, 2, 3]);
    expect(questions[0]).toMatchObject({ optionA: "2", optionB: "4", optionC: "6", optionD: "8", correctAnswer: "B" });
    expect(questions[1]).toMatchObject({ optionA: "Mercury", optionB: "Venus", optionC: "Earth", optionD: "Mars", correctAnswer: "C" });
    expect(questions[2]).toMatchObject({ correctAnswer: "B" });
  });

  it("preserves explicit marks and leaves explanations optional", () => {
    const questions = parseExamQuestions([{ pageNumber: 2, text: "1. Select the answer. (a) A (b) B (c) C (d) D\n2 marks" }]);
    expect(questions[0]).toMatchObject({ marks: 2, correctAnswer: undefined });
  });

  it("standardizes a ten-question conic-sections style paper", () => {
    const text = Array.from({ length: 10 }, (_, index) => [
      `${index + 1}) Conic sections question ${index + 1}?`,
      `(a) Option ${index + 1}A\t(b) Option ${index + 1}B`,
      `(c) Option ${index + 1}C\t(d) Option ${index + 1}D`,
    ]).flat().join("\n");
    const questions = parseExamQuestions([{ pageNumber: 1, text }]);
    expect(questions).toHaveLength(10);
    expect(questions.map((question) => question.number)).toEqual(Array.from({ length: 10 }, (_, index) => index + 1));
    expect(questions.every((question) => question.optionA && question.optionB && question.optionC && question.optionD)).toBe(true);
  });

  it("renders common Office Math matrix and superscript structures", () => {
    expect(renderOfficeMathFragment("<m:d><m:dPr><m:begChr m:val=\"[\"/><m:endChr m:val=\"]\"/></m:dPr><m:e><m:m><m:mr><m:e><m:r><m:t>2</m:t></m:r></m:e><m:e><m:r><m:t>3</m:t></m:r></m:e></m:mr><m:mr><m:e><m:r><m:t>1</m:t></m:r></m:e><m:e><m:r><m:t>4</m:t></m:r></m:e></m:mr></m:m></m:e></m:d>")).toBe("[2 3; 1 4]");
    expect(renderOfficeMathFragment("<m:sSup><m:e><m:r><m:t>x</m:t></m:r></m:e><m:sup><m:r><m:t>2</m:t></m:r></m:sup></m:sSup>")).toBe("x^2");
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
    expect(service).toContain('standardizationMode: "DETERMINISTIC"');
    const reconstruction = readFileSync(join(process.cwd(), "src/modules/ndie/ai-reconstruction/ai-reconstruction.service.ts"), "utf8");
    expect(reconstruction).toContain('standardizationMode?: "DETERMINISTIC" | "AI_ALLOWED"');
    expect(reconstruction).toContain('input.standardizationMode !== "DETERMINISTIC"');
  });
});
