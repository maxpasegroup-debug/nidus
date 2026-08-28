type PdfJsModule = typeof import("pdfjs-dist/legacy/build/pdf.mjs");
type MammothModule = typeof import("mammoth");
type WordExtractorModule = { default?: new () => { extract(buffer: Buffer): Promise<{ getBody(): string }> } } & (new () => { extract(buffer: Buffer): Promise<{ getBody(): string }> });

// Keep PDF.js as a native ESM boundary; the backend runs as ESM while Jest's
// TypeScript transform evaluates test modules through CommonJS.
const loadPdfJs = new Function("return import('pdfjs-dist/legacy/build/pdf.mjs')") as () => Promise<PdfJsModule>;
const loadMammoth = new Function("return import('mammoth')") as () => Promise<MammothModule>;
const loadWordExtractor = new Function("return import('word-extractor')") as () => Promise<WordExtractorModule>;

export type ExtractedExamQuestion = {
  number: number;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer?: string;
  sourcePageNumber: number;
  sourceReference: string;
  reviewStatus: "READY" | "MISSING_ANSWER" | "NEEDS_REVIEW";
};

export type ExtractedPdf = { pages: Array<{ pageNumber: number; text: string }>; textCharacters: number };
export type ExtractedDocument = ExtractedPdf;

function pdfError(error: unknown) {
  const message = error instanceof Error ? error.message : "PDF parsing failed";
  if (/password/i.test(message)) return Object.assign(new Error("This PDF is password protected. Upload an unlocked PDF."), { statusCode: 422 });
  return Object.assign(new Error("This PDF appears corrupt or unreadable. Upload a valid text-based PDF."), { statusCode: 422 });
}

export async function extractTextPdf(buffer: Buffer): Promise<ExtractedPdf> {
  if (buffer.subarray(0, 4).toString("utf8") !== "%PDF") {
    throw Object.assign(new Error("Uploaded source is not a valid PDF."), { statusCode: 415 });
  }
  try {
    const pdfjs = await loadPdfJs();
    const document = await pdfjs.getDocument({ data: new Uint8Array(buffer), disableFontFace: true, useSystemFonts: true }).promise;
    const pages: ExtractedPdf["pages"] = [];
    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
      const page = await document.getPage(pageNumber);
      const content = await page.getTextContent();
      const text = content.items.map((item) => "str" in item ? item.str : "").join(" ").replace(/\s+/g, " ").trim();
      pages.push({ pageNumber, text });
    }
    const textCharacters = pages.reduce((sum, page) => sum + page.text.replace(/\s/g, "").length, 0);
    if (textCharacters < 20) {
      throw Object.assign(new Error("This PDF appears to contain scanned images without readable text. Please upload a text-based PDF, DOC, or DOCX file."), { statusCode: 422, code: "SCANNED_PDF_UNSUPPORTED" });
    }
    return { pages, textCharacters };
  } catch (error) {
    if (error && typeof error === "object" && "statusCode" in error) throw error;
    throw pdfError(error);
  }
}

export async function extractTextDocx(buffer: Buffer): Promise<ExtractedDocument> {
  if (buffer[0] !== 0x50 || buffer[1] !== 0x4b) {
    throw Object.assign(new Error("Uploaded source is not a valid DOCX file."), { statusCode: 415 });
  }
  try {
    const mammoth = await loadMammoth();
    const result = await mammoth.extractRawText({ buffer });
    const text = result.value.replace(/\r\n?/g, "\n").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
    const textCharacters = text.replace(/\s/g, "").length;
    if (textCharacters < 20) {
      throw Object.assign(new Error("This DOCX does not contain enough readable text. Please upload a document containing editable question text."), { statusCode: 422, code: "DOCX_TEXT_UNAVAILABLE" });
    }
    // DOCX does not carry stable rendered page boundaries. Preserve one
    // truthful document-level source reference rather than inventing pages.
    return { pages: [{ pageNumber: 1, text }], textCharacters };
  } catch (error) {
    if (error && typeof error === "object" && "statusCode" in error) throw error;
    throw Object.assign(new Error("This DOCX appears corrupt or unreadable. Upload a valid DOCX file."), { statusCode: 422 });
  }
}

export async function extractTextDoc(buffer: Buffer): Promise<ExtractedDocument> {
  const oleSignature = Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]);
  if (!buffer.subarray(0, oleSignature.length).equals(oleSignature)) {
    throw Object.assign(new Error("Uploaded source is not a valid DOC file."), { statusCode: 415 });
  }
  try {
    const module = await loadWordExtractor();
    const WordExtractor = module.default ?? module;
    const document = await new WordExtractor().extract(buffer);
    const text = document.getBody().replace(/\r\n?/g, "\n").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
    const textCharacters = text.replace(/\s/g, "").length;
    if (textCharacters < 20) {
      throw Object.assign(new Error("This DOC does not contain enough readable text. Please upload a document containing editable question text."), { statusCode: 422, code: "DOC_TEXT_UNAVAILABLE" });
    }
    return { pages: [{ pageNumber: 1, text }], textCharacters };
  } catch (error) {
    if (error && typeof error === "object" && "statusCode" in error) throw error;
    throw Object.assign(new Error("This DOC appears corrupt or unreadable. Upload a valid DOC file."), { statusCode: 422 });
  }
}

function answerMap(text: string) {
  const answers = new Map<number, string>();
  for (const match of text.matchAll(/(?:^|\s)(\d{1,3})\s*[.)\-:]?\s*(?:answer\s*[:\-]?\s*)?([A-D])\b/gi)) answers.set(Number(match[1]), match[2].toUpperCase());
  return answers;
}

export function parseExamQuestions(pages: ExtractedPdf["pages"], keyPages: ExtractedPdf["pages"] = []): ExtractedExamQuestion[] {
  const key = answerMap(keyPages.map((page) => page.text).join("\n"));
  const questions: ExtractedExamQuestion[] = [];
  let expectedNumber = 1;
  for (const page of pages) {
    const directions = new Map<number, string>();
    for (const direction of page.text.matchAll(/Direction for questions\s+(\d+)\s+to\s+(\d+)\s*:\s*(.*?)Then\s+\1\./gi)) {
      directions.set(Number(direction[1]), `Direction for questions ${direction[1]} to ${direction[2]}: ${direction[3].trim()}`);
    }
    // Word extraction commonly joins a base/subscript to the following
    // question (for example `...10` + `2.Convert` becomes `...102.Convert`).
    // Select the sequential suffix instead of treating the whole run as 102.
    const candidates = [...page.text.matchAll(/(\d{1,4})\.\s*(?=\S)/g)].map((match) => ({
      rawNumber: match[1],
      matchIndex: match.index ?? 0,
      end: (match.index ?? 0) + match[0].length,
    }));
    const starts: Array<{ index: number; end: number; number: number }> = [];
    let candidateCursor = 0;
    while (candidateCursor < candidates.length) {
      const expected = String(expectedNumber);
      const nextExpected = String(expectedNumber + 1);
      const nextBoundary = candidates.findIndex((candidate, candidateIndex) => candidateIndex >= candidateCursor && candidate.rawNumber.endsWith(nextExpected));
      const windowEnd = nextBoundary < 0 ? candidates.length : nextBoundary;
      const exactIndex = candidates.findIndex((candidate, candidateIndex) => candidateIndex >= candidateCursor && candidateIndex < windowEnd && candidate.rawNumber === expected);
      const suffixIndex = candidates.findIndex((candidate, candidateIndex) => candidateIndex >= candidateCursor && candidateIndex < windowEnd && candidate.rawNumber.endsWith(expected));
      const selectedIndex = exactIndex >= 0 ? exactIndex : suffixIndex;
      if (selectedIndex < 0) break;
      const selected = candidates[selectedIndex];
      const prefixLength = selected.rawNumber.length - expected.length;
      starts.push({ index: selected.matchIndex + prefixLength, end: selected.end, number: expectedNumber });
      expectedNumber += 1;
      candidateCursor = selectedIndex + 1;
    }
    for (let index = 0; index < starts.length; index += 1) {
      const start = starts[index];
      const chunk = page.text.slice(start.end, starts[index + 1]?.index ?? page.text.length).trim();
      const optionMatches = [...chunk.matchAll(/(?:^|\s|\()([A-D])[.)]\s*/gi)];
      const optionText = (letter: string) => {
        const optionIndex = optionMatches.findIndex((candidate) => candidate[1].toUpperCase() === letter);
        if (optionIndex < 0) return "";
        const option = optionMatches[optionIndex];
        return chunk.slice((option.index ?? 0) + option[0].length, optionMatches[optionIndex + 1]?.index ?? chunk.length)
          .replace(/\s+Answer\s*[:\-].*$/i, "")
          .replace(/Direction for questions\s+\d+\s+to\s+\d+\s*:.*$/i, "")
          .trim();
      };
      const number = start.number;
      const inlineAnswer = chunk.match(/\bAnswer\s*[:\-]\s*([A-D])\b/i)?.[1]?.toUpperCase();
      const correctAnswer = key.get(number) || inlineAnswer;
      const ownText = chunk.slice(0, optionMatches[0]?.index ?? chunk.length).trim();
      const questionText = [directions.get(number), ownText].filter(Boolean).join(" ");
      const options = [optionText("A"), optionText("B"), optionText("C"), optionText("D")];
      questions.push({ number, questionText, optionA: options[0], optionB: options[1], optionC: options[2], optionD: options[3], correctAnswer, sourcePageNumber: page.pageNumber, sourceReference: `Page ${page.pageNumber}`, reviewStatus: correctAnswer && options.every(Boolean) ? "READY" : options.some(Boolean) ? "MISSING_ANSWER" : "NEEDS_REVIEW" });
    }
  }
  return questions;
}
