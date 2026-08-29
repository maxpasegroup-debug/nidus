/*
 * C2.1 development check. Generates a real text-layer PDF in memory, runs it
 * through the built extractor, and prints the evidence needed for the fidelity
 * report. This deliberately does not add OCR or inspect PDF drawing paths.
 * Run after `npm run build --workspace backend`:
 *   node backend/scripts/pdf-fidelity-validation.mjs
 */
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const PdfDocument = require("pdfkit");
const { extractTextPdf, parseExamQuestions } = await import("../dist/modules/academy/exam-document-extraction.js");

function makePdf(text) {
  const document = new PdfDocument({ size: [600, 800], margin: 42 });
  const chunks = [];
  document.on("data", (chunk) => chunks.push(chunk));
  const complete = new Promise((resolve, reject) => {
    document.on("end", resolve);
    document.on("error", reject);
  });
  document.fontSize(12).text(text, { lineGap: 4 });
  document.end();
  return complete.then(() => Buffer.concat(chunks));
}

const source = [
  "1. If x² + 5x + 6 = 0, find x.",
  "A. x² + 1",
  "B. √x",
  "C. (x+1)/(x-1)",
  "D. ∫x dx",
  "2. Evaluate log₂x and 10³.",
  "A. sin²θ",
  "B. cos θ",
  "C. ln x",
  "D. x₁",
].join("\n");

const pdf = await makePdf(source);
const extracted = await extractTextPdf(pdf);
const questions = parseExamQuestions(extracted.pages);
const regions = extracted.pages.flatMap((page) => page.mathSegments || []);
const boxesValid = regions.every((region) => {
  const box = region.boundingBox;
  return box && box.page > 0 && [box.x, box.y, box.width, box.height].every((value) => value >= 0 && value <= 1);
});

console.log(JSON.stringify({
  bytes: pdf.length,
  pages: extracted.pages.length,
  pageTexts: extracted.pages.map((page) => page.text),
  glyphSample: extracted.pages[0]?.glyphs?.map((glyph) => ({ text: glyph.text, x: glyph.x, y: glyph.y, width: glyph.width, height: glyph.height, fontName: glyph.fontName })),
  questionsDetected: questions.length,
  optionsDetected: questions.reduce((count, question) => count + [question.optionA, question.optionB, question.optionC, question.optionD].filter(Boolean).length, 0),
  totalTextItems: extracted.pages.reduce((count, page) => count + (page.mathStats?.totalTextItems || page.glyphs?.length || 0), 0),
  suspectTextItems: extracted.pages.reduce((count, page) => count + (page.mathStats?.suspectTextItems || 0), 0),
  privateUseGlyphs: extracted.pages.reduce((count, page) => count + (page.mathStats?.privateUseGlyphs || 0), 0),
  replacementCharacters: extracted.pages.reduce((count, page) => count + (page.mathStats?.replacementCharacters || 0), 0),
  encodingWarnings: extracted.pages.reduce((count, page) => count + (page.mathStats?.encodingWarnings || 0), 0),
  mathRegionsDetected: regions.length,
  mathRegionsCanonicalized: regions.filter((region) => (region.confidence || 0) >= 0.9).length,
  mathRegionsReviewRequired: regions.filter((region) => (region.confidence || 0) < 0.9 || region.warnings?.length).length,
  boundingBoxesValid: boxesValid,
  sourcePreserved: regions.every((region) => Boolean(region.sourceText)),
  latex: regions.map((region) => region.latex),
}, null, 2));
