import { describe, expect, it } from "@jest/globals";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import JSZip from "jszip";

import { extractDocxXmlParagraphs, extractTextDoc, extractTextDocx, extractTextPdf, parseExamQuestions, renderOfficeMathFragment, convertOfficeMathFragment, joinLatexFragments } from "../modules/academy/exam-document-extraction.js";
import { analyzePdfPage } from "../modules/academy/pdf-layout-analysis.js";
import { reconstructPdfMath } from "../modules/academy/pdf-math-reconstruction.js";
import { decodePdfTextItem } from "../modules/academy/pdf-text-decoding.js";
import { detectPdfVisualRegions, questionRequiresVisual, renderPdfVisualCrops, visualStats } from "../modules/academy/pdf-visual-analysis.js";
import { buildLegacyQuestionContent, buildRichSegments, parseQuestionContentJson, synchronizeEditableQuestionContentJson } from "../modules/document-intelligence/question-content.schema.js";

describe("exam upload PDF extraction", () => {
  it("detects embedded visual operators with normalized source evidence", () => {
    const regions = detectPdfVisualRegions({
      pageNumber: 2,
      pageWidth: 600,
      pageHeight: 800,
      sourceText: "Refer to the figure below.",
      ops: { transform: 1, paintImageXObject: 2 },
      operatorList: { fnArray: [1, 2], argsArray: [[240, 0, 0, 160, 120, 420], ["img"]] },
    });
    expect(regions).toHaveLength(1);
    expect(regions[0]).toMatchObject({ pageNumber: 2, sourceType: "DIAGRAM", reviewRequired: false, confidence: 0.9, sourceReference: "Page 2" });
    expect(regions[0].boundingBox).toEqual(expect.objectContaining({ page: 2, x: 0.2, y: 0.275, width: 0.4, height: 0.2 }));
    expect(visualStats(regions)).toMatchObject({ candidateVisualRegions: 1, unassignedVisualRegions: 1, visualCropsGenerated: 0 });
  });

  it("filters decorative full-width header visuals and flags visual dependencies", () => {
    const regions = detectPdfVisualRegions({ pageNumber: 1, pageWidth: 600, pageHeight: 800, sourceText: "logo header", ops: { paintImageXObject: 3 }, operatorList: { fnArray: [3], argsArray: [["logo"]] } });
    expect(regions).toHaveLength(0);
    expect(questionRequiresVisual("Refer to the diagram below to answer.")).toBe(true);
    expect(questionRequiresVisual("What is 2 + 2?")).toBe(false);
  });

  it("retains path-heavy vector figures as reviewable visual evidence", () => {
    const regions = detectPdfVisualRegions({
      pageNumber: 1,
      pageWidth: 600,
      pageHeight: 800,
      sourceText: "Refer to the graph below.",
      ops: { constructPath: 4 },
      operatorList: {
        fnArray: [4, 4, 4, 4],
        argsArray: [
          [[2], [120, 500, 260, 500]],
          [[2], [120, 500, 120, 350]],
          [[2], [120, 350, 260, 350]],
          [[2], [260, 350, 260, 500]],
        ],
      },
    });
    expect(regions).toEqual(expect.arrayContaining([expect.objectContaining({ sourceType: "GRAPH", reviewRequired: true })]));
    expect(regions[0]?.boundingBox).toEqual(expect.objectContaining({ page: 1, x: 0.2, width: expect.closeTo(0.2333, 3) }));
  });

  it("renders bounded visual crops from one page raster", async () => {
    const page = {
      getViewport: () => ({ width: 120, height: 160 }),
      render: () => ({ promise: Promise.resolve() }),
    };
    const regions = await renderPdfVisualCrops(page, [{
      id: "visual-1",
      pageNumber: 1,
      boundingBox: { page: 1, x: 0.2, y: 0.25, width: 0.4, height: 0.3 },
      sourceType: "FIGURE",
      confidence: 0.9,
      reviewRequired: false,
    }]);
    expect(regions).toHaveLength(1);
    expect(regions[0].mimeType).toBe("image/jpeg");
    expect(regions[0].buffer.length).toBeGreaterThan(0);
    expect(regions[0].width).toBeGreaterThan(0);
    expect(regions[0].height).toBeGreaterThan(0);
  });
  it("preserves mathematical Unicode while classifying suspect font glyphs", () => {
    expect(decodePdfTextItem("x² + π ≤ θ")).toMatchObject({ normalizedText: "x² + π ≤ θ", encodingStatus: "TEXT_LAYER_OK" });
    const privateGlyph = decodePdfTextItem("x");
    expect(privateGlyph).toMatchObject({ normalizedText: "x", encodingStatus: "GLYPH_ENCODING_SUSPECT" });
    expect(privateGlyph.warnings).toEqual(expect.arrayContaining([expect.objectContaining({ code: "PDF_PRIVATE_USE_GLYPH_NEEDS_REVIEW" })]));
    expect(decodePdfTextItem("x�").warnings).toEqual(expect.arrayContaining([expect.objectContaining({ code: "PDF_GLYPH_ENCODING_NEEDS_REVIEW" })]));
    expect(decodePdfTextItem("sin²;€").encodingStatus).toBe("GLYPH_ENCODING_SUSPECT");
    expect(decodePdfTextItem("mulƟples and MathemaƟcs")).toMatchObject({ normalizedText: "multiples and Mathematics", encodingStatus: "TEXT_LAYER_OK" });
    expect(decodePdfTextItem("Ɵ").normalizedText).toBe("Ɵ");
  });

  it("keeps positioned PDF geometry and reconstructs clear scripts conservatively", () => {
    const superscript = reconstructPdfMath([
      { text: "x", pageNumber: 1, x: 10, y: 100, width: 8, height: 10, order: 0 },
      { text: "2", pageNumber: 1, x: 18, y: 106, width: 4, height: 5, order: 1 },
    ], 100, 120);
    expect(superscript).toEqual(expect.arrayContaining([
      expect.objectContaining({ latex: "x^{2}", origin: "NORMALIZED_SOURCE", confidence: 0.94, boundingBox: expect.objectContaining({ page: 1 }) }),
    ]));

    const subscript = reconstructPdfMath([
      { text: "x", pageNumber: 1, x: 10, y: 100, width: 8, height: 10, order: 0 },
      { text: "1", pageNumber: 1, x: 18, y: 95, width: 4, height: 5, order: 1 },
    ], 100, 120);
    expect(subscript).toEqual(expect.arrayContaining([expect.objectContaining({ latex: "x_{1}" })]));

    expect(reconstructPdfMath([{ text: "2 x 4 boards", pageNumber: 1, x: 0, y: 0, width: 60, height: 10 }])).toHaveLength(0);
  });

  it("recovers a geometry-backed Cambria Math complement without rewriting prose", () => {
    const complement = reconstructPdfMath([
      { text: "𝐵", rawText: "𝐵", pageNumber: 1, x: 115.2, y: 214.92, width: 7.68, height: 11.26, fontName: "g_d0_f3", order: 0 },
      { text: "஼", rawText: "஼", pageNumber: 1, x: 122.88, y: 219.12, width: 4.84, height: 7.99, fontName: "g_d0_f3", order: 1 },
    ], 600, 800);
    expect(complement).toEqual(expect.arrayContaining([
      expect.objectContaining({
        sourceText: "𝐵஼",
        matchText: "𝐵 ஼",
        latex: "B^{C}",
        confidence: 0.55,
        warnings: expect.arrayContaining([expect.objectContaining({ code: "PDF_GLYPH_ENCODING_NEEDS_REVIEW" })]),
      }),
    ]));
    expect(reconstructPdfMath([{ text: "Tamil ஼ prose", pageNumber: 1, x: 0, y: 0, width: 60, height: 10 }])).toHaveLength(0);
  });

  it("does not drop the argument after a compact function script", () => {
    expect(reconstructPdfMath([{ text: "sin²θ", pageNumber: 1, x: 10, y: 100, width: 30, height: 10 }])).toEqual(expect.arrayContaining([expect.objectContaining({ latex: "\\sin^{2} \\theta", sourceText: "sin²θ" })]));
    expect(reconstructPdfMath([{ text: "log₂x", pageNumber: 1, x: 10, y: 100, width: 24, height: 10 }])).toEqual(expect.arrayContaining([expect.objectContaining({ latex: "\\log_{2} x", sourceText: "log₂x" })]));
  });

  it("reconstructs only geometry-backed stacked fractions", () => {
    const regions = reconstructPdfMath([
      { text: "a", pageNumber: 1, x: 20, y: 110, width: 8, height: 10 },
      { text: "────", pageNumber: 1, x: 18, y: 100, width: 20, height: 2 },
      { text: "b", pageNumber: 1, x: 20, y: 86, width: 8, height: 10 },
    ], 100, 140);
    expect(regions).toEqual(expect.arrayContaining([expect.objectContaining({ latex: "\\frac{a}{b}", confidence: 0.93 })]));
  });

  it("recursively nests a fraction contained in another denominator", () => {
    const regions = reconstructPdfMath([
      { text: "1", pageNumber: 1, x: 30, y: 130, width: 8, height: 10 },
      { text: "────", pageNumber: 1, x: 25, y: 120, width: 20, height: 2 },
      { text: "x+1", pageNumber: 1, x: 30, y: 110, width: 20, height: 10 },
      { text: "───", pageNumber: 1, x: 30, y: 100, width: 15, height: 2 },
      { text: "y", pageNumber: 1, x: 34, y: 88, width: 8, height: 10 },
    ], 100, 150);
    expect(regions).toEqual(expect.arrayContaining([expect.objectContaining({ latex: "\\frac{1}{\\frac{x+1}{y}}" })]));
  });

  it("associates bounds with large PDF operators", () => {
    const regions = reconstructPdfMath([
      { text: "∫", pageNumber: 1, x: 10, y: 100, width: 8, height: 20 },
      { text: "0", pageNumber: 1, x: 12, y: 88, width: 4, height: 5 },
      { text: "π", pageNumber: 1, x: 12, y: 126, width: 5, height: 5 },
      { text: "sin x dx", pageNumber: 1, x: 22, y: 100, width: 35, height: 10 },
    ], 100, 150);
    expect(regions).toEqual(expect.arrayContaining([expect.objectContaining({ latex: "\\int_{0}^{\\pi} sin x dx" })]));
  });

  it("reconstructs limits and clearly aligned equation rows", () => {
    const limit = reconstructPdfMath([
      { text: "lim", pageNumber: 1, x: 10, y: 100, width: 15, height: 12 },
      { text: "x→0", pageNumber: 1, x: 11, y: 86, width: 18, height: 5 },
      { text: "sin x", pageNumber: 1, x: 30, y: 100, width: 20, height: 10 },
    ]);
    expect(limit).toEqual(expect.arrayContaining([expect.objectContaining({ latex: "\\lim_{x\\to0} sin x" })]));

    const aligned = reconstructPdfMath([
      { text: "x + y = 5", pageNumber: 1, x: 10, y: 100, width: 45, height: 10 },
      { text: "x - y = 1", pageNumber: 1, x: 10, y: 85, width: 45, height: 10 },
    ]);
    expect(aligned).toEqual(expect.arrayContaining([expect.objectContaining({ latex: "\\begin{aligned}x + y = 5 \\\\ x - y = 1\\end{aligned}" })]));
  });

  it("reconstructs delimited matrix and determinant rows from aligned geometry", () => {
    const matrix = reconstructPdfMath([
      { text: "[", pageNumber: 1, x: 10, y: 100, width: 4, height: 10 }, { text: "1  2", pageNumber: 1, x: 16, y: 100, width: 20, height: 10 }, { text: "]", pageNumber: 1, x: 38, y: 100, width: 4, height: 10 },
      { text: "[", pageNumber: 1, x: 10, y: 85, width: 4, height: 10 }, { text: "3  4", pageNumber: 1, x: 16, y: 85, width: 20, height: 10 }, { text: "]", pageNumber: 1, x: 38, y: 85, width: 4, height: 10 },
    ], 100, 120);
    expect(matrix).toEqual(expect.arrayContaining([expect.objectContaining({ latex: "\\begin{bmatrix}1 & 2 \\\\ 3 & 4\\end{bmatrix}" })]));

    const determinant = reconstructPdfMath([
      { text: "|", pageNumber: 1, x: 10, y: 100, width: 4, height: 10 }, { text: "a  b", pageNumber: 1, x: 16, y: 100, width: 20, height: 10 }, { text: "|", pageNumber: 1, x: 38, y: 100, width: 4, height: 10 },
      { text: "|", pageNumber: 1, x: 10, y: 85, width: 4, height: 10 }, { text: "c  d", pageNumber: 1, x: 16, y: 85, width: 20, height: 10 }, { text: "|", pageNumber: 1, x: 38, y: 85, width: 4, height: 10 },
    ], 100, 120);
    expect(determinant).toEqual(expect.arrayContaining([expect.objectContaining({ latex: "\\begin{vmatrix}a & b \\\\ c & d\\end{vmatrix}" })]));
  });

  it("preserves uncertain PDF math as a reviewable source hint", () => {
    const regions = reconstructPdfMath([{ text: "∫ ?", pageNumber: 1, x: 5, y: 5, width: 15, height: 10 }]);
    expect(regions[0]).toMatchObject({ sourceText: "∫ ?", confidence: 0.55, warnings: [expect.objectContaining({ code: "MATH_EXPRESSION_NEEDS_REVIEW", severity: "HIGH" })] });
  });

  it("feeds PDF math hints into canonical question content", () => {
    const page = {
      pageNumber: 1,
      text: "1. If x² = 16, find x. A. 4 B. 8 C. 16 D. 2",
      mathSegments: [{ sourceText: "x²", matchText: "x²", latex: "x^{2}", origin: "NORMALIZED_SOURCE" as const, confidence: 0.92, boundingBox: { page: 1, x: 0.1, y: 0.1, width: 0.1, height: 0.05 } }],
    };
    const questions = parseExamQuestions([page]);
    const paragraph = (questions[0].contentJson as { blocks: Array<{ type: string; segments?: Array<{ type: string; latex?: string; origin?: string }> }> }).blocks.find((block) => block.type === "paragraph");
    expect(paragraph?.segments).toEqual(expect.arrayContaining([expect.objectContaining({ type: "math", latex: "x^{2}", origin: "NORMALIZED_SOURCE" })]));
  });

  it("retains page-local line ordering and extraction statistics", () => {
    const analysis = analyzePdfPage([
      { text: "bottom", pageNumber: 1, x: 0, y: 10, width: 20, height: 10, order: 1 },
      { text: "top", pageNumber: 1, x: 0, y: 30, width: 20, height: 10, order: 0 },
    ], 100, 100);
    expect(analysis.text).toBe("top\nbottom");
    expect(analysis.mathRegionsDetected).toBe(0);
  });

  it("keeps an isolated PDF superscript in reading order with its base", () => {
    const analysis = analyzePdfPage([
      { text: "x", pageNumber: 1, x: 10, y: 100, width: 8, height: 10, order: 0 },
      { text: "2", pageNumber: 1, x: 18, y: 106, width: 4, height: 5, order: 1 },
    ], 100, 120);
    expect(analysis.text).toBe("x 2");
    expect(analysis.mathSegments).toEqual(expect.arrayContaining([expect.objectContaining({ latex: "x^{2}" })]));
  });

  it("reattaches a shared PDF script row to each base without leaking into the previous line", () => {
    const analysis = analyzePdfPage([
      { text: "d) +0.5 D", pageNumber: 1, x: 309, y: 479.4, width: 44, height: 10.5, order: 0 },
      { text: "4. coefficient is", pageNumber: 1, x: 51, y: 447.2, width: 260, height: 10.5, order: 1 },
      { text: "1.6 × 10", pageNumber: 1, x: 314.4, y: 447.2, width: 34.9, height: 10.5, order: 2 },
      { text: "−5", pageNumber: 1, x: 349.3, y: 451.7, width: 10, height: 9, order: 3 },
      { text: "K", pageNumber: 1, x: 361.9, y: 447.2, width: 7, height: 10.5, order: 4 },
      { text: "−1", pageNumber: 1, x: 368.9, y: 451.7, width: 10, height: 9, order: 5 },
    ], 600, 800);
    expect(analysis.text).toBe("d) +0.5 D\n4. coefficient is 1.6 × 10 −5 K −1");
    expect(analysis.mathSegments).toEqual(expect.arrayContaining([
      expect.objectContaining({ matchText: "1.6 × 10 −5", latex: "1.6 \\times 10^{-5}" }),
      expect.objectContaining({ matchText: "K −1", latex: "K^{-1}" }),
    ]));
  });


  it("reconstructs extracted PDF page text without guessing a missing answer", () => {
    const questions = parseExamQuestions([{ pageNumber: 1, text: "1. What is the capital of India? A. Mumbai B. Delhi C. Chennai D. Kolkata" }]);
    expect(questions).toHaveLength(1);
    expect(questions[0]).toMatchObject({ number: 1, correctAnswer: undefined, sourcePageNumber: 1, reviewStatus: "MISSING_ANSWER" });
  });

  it("associates a page visual with the only question on that page", () => {
    const regions = detectPdfVisualRegions({ pageNumber: 1, pageWidth: 600, pageHeight: 800, sourceText: "Refer to the diagram below.", ops: { paintImageXObject: 2 }, operatorList: { fnArray: [2], argsArray: [["diagram"]] } });
    const questions = parseExamQuestions([{ pageNumber: 1, text: "1. Refer to the diagram below. A. One B. Two C. Three D. Four", visualRegions: regions }]);
    expect(questions[0]).toMatchObject({ visualReviewRequired: true, visualAssets: [expect.objectContaining({ sourceType: "DIAGRAM", pageNumber: 1 })] });
    expect((questions[0].contentJson as { blocks: Array<{ type: string }> }).blocks.some((block) => block.type === "visual")).toBe(true);
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

  it("recognizes Q.1 labels and keeps adjacent question options isolated", () => {
    const questions = parseExamQuestions([{ pageNumber: 1, text: [
      "Q.11 First question?", "A. eleven-a", "B. eleven-b", "C. eleven-c", "D. eleven-d",
      "Q.12 Second question?", "A. twelve-a", "B. twelve-b", "C. twelve-c", "D. twelve-d",
    ].join("\n") }]);
    expect(questions).toHaveLength(2);
    expect(questions[0]).toMatchObject({ number: 11, optionD: "eleven-d" });
    expect(questions[1]).toMatchObject({ number: 12, optionA: "twelve-a" });
    expect(questions[0].optionD).not.toContain("Second question");
  });

  it("accepts spaced-dot numbering and preserves source numbers across a small gap", () => {
    const questions = parseExamQuestions([{ pageNumber: 1, text: [
      "1 . First? (a) A1 (b) B1 (c) C1 (d) D1",
      "2 . Second? (a) A2 (b) B2 (c) C2 (d) D2",
      "4 . Fourth after an omitted source number? (a) A4 (b) B4 (c) C4 (d) D4",
    ].join("\n") }]);
    expect(questions.map((question) => question.number)).toEqual([1, 2, 4]);
    expect(questions[2]).toMatchObject({ optionA: "A4", optionD: "D4" });
  });

  it("preserves explicit labelled questions across a large source-number gap", () => {
    const questions = parseExamQuestions([{ pageNumber: 1, text: [
      "Q40. Last question in the first source section", "A. A40", "B. B40", "C. C40", "D. D40",
      "Q81. First question in the next source section", "A. A81", "B. B81", "C. C81", "D. D81",
      "Q82. Following question", "A. A82", "B. B82", "C. C82", "D. D82",
    ].join("\n") }]);
    expect(questions.map((question) => question.number)).toEqual([40, 81, 82]);
    expect(questions[0].optionD).toBe("D40");
    expect(questions[1]).toMatchObject({ questionText: "First question in the next source section", optionA: "A81" });
  });

  it("canonicalizes an explicit Unicode logarithm base without flattening its argument", () => {
    const [question] = parseExamQuestions([{
      pageNumber: 1,
      text: [
        "2. The value of log₁₀100 is",
        "A. 1",
        "B. 2",
        "C. 10",
        "D. 100",
      ].join("\n"),
    }]);

    const content = question.contentJson as { blocks?: Array<{ type?: string; segments?: Array<{ type?: string; latex?: string; sourceText?: string }> }> };
    const paragraph = content.blocks?.find((block) => block.type === "paragraph");
    expect(question.questionText).toContain("log₁₀100");
    expect(paragraph?.segments).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: "math", latex: "\\log_{10}100", sourceText: "log₁₀100" }),
    ]));
  });

  it("preserves an explicitly subscripted letter as a logarithm base", () => {
    const [question] = parseExamQuestions([{ pageNumber: 1, text: "1. If logₐ x = 2, find x. A. a² B. 2a C. a+2 D. x" }]);
    const paragraph = (question.contentJson as { blocks: Array<{ type: string; segments?: Array<{ type: string; latex?: string; sourceText?: string }> }> }).blocks.find((block) => block.type === "paragraph");
    expect(paragraph?.segments).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: "math", latex: "\\log_{a}x", sourceText: "logₐ x" }),
    ]));
  });

  it("preserves Word subscript formatting for the letter a", async () => {
    const zip = new JSZip();
    zip.file("word/document.xml", '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>1. Evaluate log</w:t></w:r><w:r><w:rPr><w:vertAlign w:val="subscript"/></w:rPr><w:t>a</w:t></w:r><w:r><w:t>x. A. one B. two C. three D. four</w:t></w:r></w:p></w:body></w:document>');
    const text = await extractDocxXmlParagraphs(await zip.generateAsync({ type: "nodebuffer" }), JSZip as never);
    const [question] = parseExamQuestions([{ pageNumber: 1, text }]);
    const paragraph = (question.contentJson as { blocks: Array<{ type: string; segments?: Array<{ type: string; latex?: string }> }> }).blocks.find((block) => block.type === "paragraph");
    expect(text).toContain("logₐx");
    expect(paragraph?.segments).toEqual(expect.arrayContaining([expect.objectContaining({ type: "math", latex: "\\log_{a}x" })]));
  });

  it("keeps a native Word fraction authoritative when it follows a Unicode logarithm base", () => {
    const equation = Buffer.from(JSON.stringify({
      sourceText: "16=23",
      latex: "\\frac{1}{6}=\\frac{2}{3}",
      confidence: 1,
    }), "utf8").toString("base64");
    const [question] = parseExamQuestions([{ pageNumber: 1, text: `5. If log₈ m+log₈[[NIDUS_OMML:${equation}]] then m is equal to A. 24 B. 18 C. 12 D. 4` }]);
    const paragraph = (question.contentJson as { blocks: Array<{ type: string; segments?: Array<{ type: string; latex?: string }> }> }).blocks.find((block) => block.type === "paragraph");
    expect(paragraph?.segments).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: "math", latex: "\\frac{1}{6}=\\frac{2}{3}" }),
    ]));
    expect(paragraph?.segments).not.toEqual(expect.arrayContaining([
      expect.objectContaining({ type: "math", latex: "\\log_{8}16" }),
    ]));
  });

  it("preserves a confirmed question whose options are incomplete", () => {
    const questions = parseExamQuestions([{ pageNumber: 1, text: [
      "Q30. Complete question", "A. A30", "B. B30", "C. C30", "D. D30",
      "Q31. Confirmed but incomplete question", "A. only one option",
      "Q32. Next complete question", "A. A32", "B. B32", "C. C32", "D. D32",
    ].join("\n") }]);
    expect(questions.map((question) => question.number)).toEqual([30, 31, 32]);
    expect(questions[1]).toMatchObject({ questionText: "Confirmed but incomplete question", optionA: "only one option", optionB: "", reviewStatus: "NEEDS_REVIEW" });
    expect(questions[2]).toMatchObject({ number: 32, optionA: "A32", optionD: "D32" });
  });

  it("does not reinterpret numbered stem statements as unlabeled options", () => {
    const questions = parseExamQuestions([{ pageNumber: 1, text: [
      "Q1. Consider these relations:",
      "10. relation one", "11. relation two", "12. relation three", "13. relation four",
      "Which relations are not functions?",
      "Q2. Next question", "A. A2", "B. B2", "C. C2", "D. D2",
    ].join("\n") }]);
    expect(questions).toHaveLength(2);
    expect(questions[0]).toMatchObject({ number: 1, optionA: "", optionB: "", optionC: "", optionD: "", reviewStatus: "NEEDS_REVIEW" });
    expect(questions[0].questionText).toContain("Which relations are not functions?");
    expect(questions[1]).toMatchObject({ number: 2, optionA: "A2" });
  });

  it("extracts inline parenthesized algebra options without treating variables as labels", () => {
    const [question] = parseExamQuestions([{ pageNumber: 1, text: [
      "Q19. Which one of the following is one root of (b − c)x² + (c − a)x + (a − b) = 0?",
      "(a) (c − a)/(b − c) (b) (a − b)/(b − c) (c) (b − c)/(a − b) (d) (c − a)/(a − b)",
    ].join("\n") }]);
    expect(question).toMatchObject({
      questionText: "Which one of the following is one root of (b − c)x² + (c − a)x + (a − b) = 0?",
      optionA: "(c − a)/(b − c)",
      optionB: "(a − b)/(b − c)",
      optionC: "(b − c)/(a − b)",
      optionD: "(c − a)/(a − b)",
      reviewStatus: "MISSING_ANSWER",
    });
    expect(question.visualReviewRequired).toBeUndefined();
  });

  it("preserves four inline options when the source repeats the final C label", () => {
    const [question] = parseExamQuestions([{ pageNumber: 1, text: "Q1. Given n(A)=30, n(B)=28 and n(C)=25, find the union. (a) 36 (b) 63 (c) 57 (c) 75" }]);
    expect(question.questionText).toContain("n(A)=30");
    expect(question).toMatchObject({ optionA: "36", optionB: "63", optionC: "57", optionD: "75", reviewStatus: "MISSING_ANSWER" });
  });

  it("combines parenthesized A-C options with a closing-parenthesis D option", () => {
    const [question] = parseExamQuestions([{ pageNumber: 1, sourceKind: "PDF", text: [
      "Q19. If a set A contains 3 elements and another set B contains 6 elements, then how many elements may A union B contain?",
      "(A) 9",
      "(B) either 8 or 9",
      "(C) either 7 or 8 or 9",
      "D) either 6 or 7 or 8 or 9",
    ].join("\n") }]);
    expect(question).toMatchObject({
      questionText: expect.not.stringContaining("(A)"),
      optionA: "9",
      optionB: "either 8 or 9",
      optionC: "either 7 or 8 or 9",
      optionD: "either 6 or 7 or 8 or 9",
    });
  });

  it("recognizes compact closing-parenthesis and single-letter-article question starts", () => {
    const questions = parseExamQuestions([{ pageNumber: 1, text: [
      "Q9. Previous question? (a) A (b) B (c) C (d) D",
      "10)Set A contains values. (a) A10 (b) B10 (c) C10 (d) D10",
      "Q38. Previous section? (a) A38 (b) B38 (c) C38 (d) D38",
      "39 A class has students. (a) A39 (b) B39 (c) C39 (d) D39",
    ].join("\n") }]);
    expect(questions.map((question) => question.number)).toEqual([9, 10, 38, 39]);
    expect(questions[1]).toMatchObject({ optionA: "A10", optionD: "D10" });
    expect(questions[3]).toMatchObject({ questionText: "A class has students.", optionD: "D39" });
  });

  it("preserves structurally complete questions across duplicate numbers, jumps, and resets", () => {
    const questions = parseExamQuestions([{ pageNumber: 1, sourceKind: "DOCX", text: [
      "1. First? (A) A1 (B) B1 (C) C1 (D) D1",
      "1. Repeated number? (A) A1b (B) B1b (C) C1b (D) D1b",
      "31. Jumped section? (A) A31 (B) B31 (C) C31 (D) D31",
      "2. Reset section? (A) A2 (B) B2 (C) C2 (D) D2",
    ].join("\n") }]);
    expect(questions.map((question) => question.number)).toEqual([1, 1, 31, 2]);
    expect(questions.map((question) => question.optionD)).toEqual(["D1", "D1b", "D31", "D2"]);
  });

  it("preserves a complete unnumbered item after a preceding option D", () => {
    const questions = parseExamQuestions([{ pageNumber: 1, sourceKind: "DOCX", text: [
      "1. Numbered question?", "(A) A1", "(B) B1", "(C) C1", "(D) D1",
      "Unnumbered but complete question?", "(A) AU", "(B) BU", "(C) CU", "(D) DU",
      "2. Next numbered question?", "(A) A2", "(B) B2", "(C) C2", "(D) D2",
    ].join("\n") }]);
    expect(questions.map((question) => question.number)).toEqual([1, 3, 2]);
    expect(questions[0].optionD).toBe("D1");
    expect(questions[1]).toMatchObject({ questionText: "Unnumbered but complete question?", optionA: "AU", optionD: "DU" });
  });

  it("does not append following section directions to option D", () => {
    const [question] = parseExamQuestions([{ pageNumber: 1, text: [
      "1. Section question?", "(A) A", "(B) B", "(C) C", "(D) D",
      "Directions for questions 2 to 4: Use the following information.",
    ].join("\n") }]);
    expect(question.optionD).toBe("D");
  });

  it("exposes a question number embedded at the start of an OMML marker", () => {
    const payload = Buffer.from(JSON.stringify({ sourceText: "47.A={-1,2,5,8}", latex: "47.A=\\left\\{-1,2,5,8\\right\\}", confidence: 1 }), "utf8").toString("base64");
    const questions = parseExamQuestions([{ pageNumber: 1, text: [
      "Q46. Previous? A. a B. b C. c D. d",
      `[[NIDUS_OMML:${payload}]] is a set.`, "(a) 2", "(b) 3", "(c) 4", "(d) 5",
      "Q48. Next? A. a B. b C. c D. d",
    ].join("\n") }]);
    expect(questions.map((question) => question.number)).toEqual([46, 47, 48]);
    expect(questions[1].questionText).toContain("A={-1,2,5,8}");
    expect((questions[1].contentJson as { metadata?: { sourceQuestionNumber?: number } }).metadata?.sourceQuestionNumber).toBe(47);
  });

  it("prefers a complete OMML set expression over an overlapping standalone symbol", () => {
    const source = "Let A=x∈R:-1<x<1. Which functions map from A to itself?";
    const segments = buildRichSegments(source, [
      { sourceText: "A=x∈R:-1<x<1.", latex: "A=\\left\\{x\\in R:-1<x<1\\right\\}.", origin: "OMML", confidence: 1 },
      { sourceText: "A", latex: "A", origin: "OMML", confidence: 1 },
    ]);
    expect(segments[1]).toMatchObject({
      type: "math",
      latex: "A=\\left\\{x\\in R:-1<x<1\\right\\}.",
    });
  });

  it("recovers an omitted visual A label before explicit B-D without misreading Assertion (A)", () => {
    const questions = parseExamQuestions([{ pageNumber: 1, text: [
      "1. Assertion (A): The statement is true.",
      "Reason (R): Supporting reason.",
      "Both A and R are true.",
      "B. A is true and R is false.",
      "C. A is false and R is true.",
      "D. Both are false.",
    ].join("\n") }]);
    expect(questions[0]).toMatchObject({
      questionText: expect.stringContaining("Assertion (A)"),
      optionA: "Both A and R are true.",
      optionB: "A is true and R is false.",
      optionC: "A is false and R is true.",
      optionD: "Both are false.",
    });
  });

  it("restores Word auto-numbering and preserves manual line breaks in DOCX option paragraphs", async () => {
    const zip = new JSZip();
    zip.file("[Content_Types].xml", '<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/></Types>');
    zip.file("_rels/.rels", '<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>');
    zip.file("word/_rels/document.xml.rels", '<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering" Target="numbering.xml"/></Relationships>');
    zip.file("word/numbering.xml", '<w:numbering xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:abstractNum w:abstractNumId="1"><w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="decimal"/><w:lvlText w:val="%1."/></w:lvl></w:abstractNum><w:num w:numId="4"><w:abstractNumId w:val="1"/></w:num></w:numbering>');
    zip.file("word/document.xml", '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="4"/></w:numPr></w:pPr><w:r><w:t>First question?</w:t></w:r></w:p><w:p><w:r><w:t>alpha</w:t><w:br/><w:t>B. beta</w:t><w:br/><w:t>C. gamma</w:t><w:br/><w:t>D. delta</w:t></w:r></w:p><w:p><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="4"/></w:numPr></w:pPr><w:r><w:t>Second question?</w:t></w:r></w:p><w:p><w:r><w:t>A. one</w:t><w:br/><w:t>B. two</w:t><w:br/><w:t>C. three</w:t><w:br/><w:t>D. four</w:t></w:r></w:p></w:body></w:document>');
    const text = await extractDocxXmlParagraphs(await zip.generateAsync({ type: "nodebuffer" }), JSZip as never);
    const questions = parseExamQuestions([{ pageNumber: 1, text }]);
    expect(text).toContain("1. First question?");
    expect(questions).toHaveLength(2);
    expect(questions[0]).toMatchObject({ optionA: "alpha", optionB: "beta", optionC: "gamma", optionD: "delta" });
    expect(questions[1]).toMatchObject({ optionA: "one", optionD: "four" });
  });

  it("preserves ordinary Word superscript runs and emits canonical powers", async () => {
    const zip = new JSZip();
    zip.file("word/document.xml", '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>1. Solve ax</w:t></w:r><w:r><w:rPr><w:vertAlign w:val="superscript"/></w:rPr><w:t>2</w:t></w:r><w:r><w:t> + bx + c. A. one B. two C. three D. four</w:t></w:r></w:p></w:body></w:document>');
    const text = await extractDocxXmlParagraphs(await zip.generateAsync({ type: "nodebuffer" }), JSZip as never);
    const [question] = parseExamQuestions([{ pageNumber: 1, text }]);
    const paragraph = (question.contentJson as { blocks: Array<{ type: string; segments?: Array<{ type: string; latex?: string }> }> }).blocks.find((block) => block.type === "paragraph");
    expect(text).toContain("ax²");
    expect(question.questionText).toContain("ax²");
    expect(paragraph?.segments).toEqual(expect.arrayContaining([expect.objectContaining({ type: "math", latex: "ax^{2}" })]));
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
    expect(renderOfficeMathFragment("<m:d><m:dPr><m:begChr m:val=\"[\"/><m:endChr m:val=\"]\"/></m:dPr><m:e><m:m><m:mr><m:e><m:r><m:t>2</m:t></m:r></m:e><m:e><m:r><m:t>3</m:t></m:r></m:e></m:mr><m:mr><m:e><m:r><m:t>1</m:t></m:r></m:e><m:e><m:r><m:t>4</m:t></m:r></m:e></m:mr></m:m></m:e></m:d>")).toBe("\\begin{bmatrix}2 & 3 \\\\ 1 & 4\\end{bmatrix}");
    expect(renderOfficeMathFragment("<m:sSup><m:e><m:r><m:t>x</m:t></m:r></m:e><m:sup><m:r><m:t>2</m:t></m:r></m:sup></m:sSup>")).toBe("{x}^{2}");
  });

  it("joins LaTeX control words without consuming following identifiers", () => {
    expect(joinLatexFragments(["R", "\\to", "R"])).toBe("R\\to R");
    expect(joinLatexFragments(["x", "\\in", "A"])).toBe("x\\in A");
    expect(joinLatexFragments(["\\sin", "x"])).toBe("\\sin x");
    expect(joinLatexFragments(["\\theta", "x"])).toBe("\\theta x");
    expect(joinLatexFragments(["x^2", "_1", "+", "\\frac{x}{y}", "\\sqrt{x}", "\\log_2 x", "\\begin{bmatrix}1&2\\\\3&4\\end{bmatrix}"])).toBe("x^2_1+\\frac{x}{y}\\sqrt{x}\\log_2 x\\begin{bmatrix}1&2\\\\3&4\\end{bmatrix}");
  });

  it("preserves comma-separated OMML delimiter elements", () => {
    const set = renderOfficeMathFragment('<m:d><m:dPr><m:begChr m:val="{"/><m:sepChr m:val=","/><m:endChr m:val="}"/></m:dPr><m:e><m:r><m:t>1</m:t></m:r></m:e><m:e><m:r><m:t>2</m:t></m:r></m:e><m:e><m:r><m:t>3</m:t></m:r></m:e><m:e><m:r><m:t>4</m:t></m:r></m:e></m:d>');
    expect(set).toBe("\\left\\{1,2,3,4\\right\\}");
  });

  it("renders ordinary OMML delimiter terminals as content instead of invalid KaTeX delimiters", () => {
    const expression = convertOfficeMathFragment('<m:d><m:dPr><m:sepChr m:val="="/><m:endChr m:val="?"/></m:dPr><m:e><m:r><m:t>AB</m:t></m:r><m:sSup><m:e><m:r><m:t>)</m:t></m:r></m:e><m:sup><m:r><m:t>T</m:t></m:r></m:sup></m:sSup></m:e><m:e><m:r><m:t> </m:t></m:r></m:e></m:d>');
    expect(expression.latex).toBe("(AB{)}^{T}=?");
    expect(expression.sourceText).toBe("(AB)T= ?");
    expect(expression.latex).not.toContain("\\right?");
  });

  it("converts nested OMML structures recursively without regex substitution", () => {
    const fragment = "<m:f><m:num><m:sSup><m:e><m:r><m:t>x</m:t></m:r></m:e><m:sup><m:r><m:t>2</m:t></m:r></m:sup></m:sSup><m:rad><m:e><m:r><m:t>y</m:t></m:r></m:e></m:rad></m:num><m:den><m:func><m:fName><m:r><m:t>log</m:t></m:r></m:fName><m:e><m:sSub><m:e><m:r><m:t>z</m:t></m:r></m:e><m:sub><m:r><m:t>2</m:t></m:r></m:sub></m:sSub></m:e></m:func></m:den></m:f>";
    expect(convertOfficeMathFragment(fragment)).toMatchObject({ latex: "\\frac{{x}^{2}\\sqrt{y}}{\\log {z}_{2}}", confidence: 1 });
  });

  it("converts roots, bounded n-ary operators, accents, and unicode operators", () => {
    expect(renderOfficeMathFragment("<m:rad><m:deg><m:r><m:t>3</m:t></m:r></m:deg><m:e><m:r><m:t>x</m:t></m:r></m:e></m:rad>")).toBe("\\sqrt[3]{x}");
    expect(renderOfficeMathFragment("<m:nary><m:naryPr><m:chr m:val=\"∑\"/></m:naryPr><m:sub><m:r><m:t>i=1</m:t></m:r></m:sub><m:sup><m:r><m:t>n</m:t></m:r></m:sup><m:e><m:sSup><m:e><m:r><m:t>i</m:t></m:r></m:e><m:sup><m:r><m:t>2</m:t></m:r></m:sup></m:sSup></m:e></m:nary>")).toBe("\\sum_{i=1}^{n} {i}^{2}");
    expect(renderOfficeMathFragment("<m:acc><m:accPr><m:chr m:val=\"^\"/></m:accPr><m:e><m:r><m:t>x</m:t></m:r></m:e></m:acc>")).toBe("\\hat{x}");
    expect(renderOfficeMathFragment("<m:r><m:t>π ≤ θ → ∞</m:t></m:r>")).toBe("\\pi \\le \\theta \\to \\infty");
  });

  it("preserves an unsupported OMML node as readable output with a warning", () => {
    const result = convertOfficeMathFragment("<m:unknown><m:r><m:t>x</m:t></m:r></m:unknown>");
    expect(result.latex).toContain("x");
    expect(result.confidence).toBeLessThan(1);
    expect(result.warnings?.[0]).toMatchObject({ code: "UNSUPPORTED_OMML_ELEMENT" });
  });

  it("attaches OMML conversion results to canonical question content", () => {
    const payload = Buffer.from(JSON.stringify({ sourceText: "x2", latex: "{x}^{2}", confidence: 1 }), "utf8").toString("base64");
    const questions = parseExamQuestions([{ pageNumber: 1, text: `1. If [[NIDUS_OMML:${payload}]] = 4? A. 2 B. 4 C. 8 D. 16` }]);
    const paragraph = (questions[0].contentJson as { blocks: Array<{ type: string; segments?: Array<{ type: string; latex?: string; origin?: string }> }> }).blocks.find((block) => block.type === "paragraph");
    expect(paragraph?.segments).toEqual(expect.arrayContaining([expect.objectContaining({ type: "math", latex: "{x}^{2}", origin: "OMML" })]));
  });

  it("rejects malformed PDFs and keeps an explicit scanned-PDF guard", async () => {
    await expect(extractTextPdf(Buffer.from("not a pdf"))).rejects.toThrow(/not a valid PDF/i);
    const source = readFileSync(join(process.cwd(), "src/modules/academy/exam-document-extraction.ts"), "utf8");
    expect(source).toContain("no usable text layer");
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

  it("creates and validates canonical mixed text/math content without guessing", () => {
    const content = buildLegacyQuestionContent({
      questionText: "If $x^2 = 16$, find x.",
      optionA: "$\\frac{x+1}{x-1}$",
      optionB: "4",
      optionC: "8",
      optionD: "16",
      correctAnswer: "A",
      explanation: "Using $x^2=16$ gives x=4.",
      contentSource: "TEACHER_IMPORT",
    });
    expect(content.schemaVersion).toBe(1);
    const paragraph = content.blocks.find((block) => block.type === "paragraph");
    expect(paragraph && paragraph.type === "paragraph" ? paragraph.segments : undefined).toEqual([
      { type: "text", text: "If " },
      { type: "math", latex: "x^2 = 16", sourceText: "$x^2 = 16$", origin: "EXPLICIT_LATEX" },
      { type: "text", text: ", find x." },
    ]);
    const options = content.blocks.find((block) => block.type === "options");
    expect(options && options.type === "options" ? options.options[0].segments : undefined).toEqual([
      { type: "math", latex: "\\frac{x+1}{x-1}", sourceText: "$\\frac{x+1}{x-1}$", origin: "EXPLICIT_LATEX" },
    ]);
    expect(parseQuestionContentJson(content).success).toBe(true);
  });

  it("round-trips canonical math content while keeping legacy fields", () => {
    const content = buildLegacyQuestionContent({
      questionText: "Matrix $\\begin{bmatrix}1&2\\\\3&4\\end{bmatrix}$",
      optionA: "one", optionB: "two", optionC: "three", optionD: "four", correctAnswer: "B",
    });
    const parsed = parseQuestionContentJson(JSON.parse(JSON.stringify(content)));
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      const paragraph = parsed.data.blocks.find((block) => block.type === "paragraph");
      expect(paragraph && paragraph.type === "paragraph" ? paragraph.segments?.[1] : undefined).toMatchObject({ type: "math", latex: "\\begin{bmatrix}1&2\\\\3&4\\end{bmatrix}" });
    }
  });

  it("normalizes legacy null AI confidence when saving a Director question edit", () => {
    const content = buildLegacyQuestionContent({
      questionText: "Which option is correct?",
      optionA: "one", optionB: "two", optionC: "three", optionD: "four", correctAnswer: "",
    }) as unknown as { metadata: Record<string, unknown> };
    content.metadata.aiConfidence = null;

    const parsed = parseQuestionContentJson(content);
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.metadata.aiConfidence).toBeUndefined();

    expect(() => synchronizeEditableQuestionContentJson({
      questionText: "Which option is correct?",
      optionA: "one", optionB: "two", optionC: "three", optionD: "four", correctAnswer: "C",
      explanation: "", marks: 1, negativeMarks: 0, contentJson: content,
    })).not.toThrow();
  });

  it("keeps visual source evidence as a canonical review block", () => {
    const content = buildLegacyQuestionContent({
      questionText: "Refer to the figure below.",
      optionA: "1", optionB: "2", optionC: "3", optionD: "4", correctAnswer: "A",
      visualAssets: [{ id: "pdf-1-visual-1", sourceType: "DIAGRAM", pageNumber: 1, boundingBox: { page: 1, x: 0.2, y: 0.3, width: 0.4, height: 0.2 }, confidence: 0.9, reviewRequired: true, sourceReference: "Page 1" }],
    });
    const visual = content.blocks.find((block) => block.type === "visual");
    expect(visual).toMatchObject({ type: "visual", assetId: "pdf-1-visual-1", assetRole: "DIAGRAM", pageNumber: 1, reviewRequired: true });
    expect(parseQuestionContentJson(content).success).toBe(true);
  });

  it("rejects malformed or executable canonical segments", () => {
    const result = parseQuestionContentJson({
      schemaVersion: 1,
      format: "NIDUS_QUESTION_CONTENT_V1",
      questionType: "SINGLE_CHOICE",
      source: "TEACHER_IMPORT",
      blocks: [
        { id: "p-1", type: "paragraph", text: "safe", segments: [{ type: "math", latex: "" }] },
        { id: "o-1", type: "options", options: [
          { key: "A", text: "<script>alert(1)</script>" }, { key: "B", text: "b" }, { key: "C", text: "c" }, { key: "D", text: "d" },
        ] },
      ],
      answer: { type: "SINGLE_CHOICE" },
    });
    expect(result.success).toBe(false);
  });
});
