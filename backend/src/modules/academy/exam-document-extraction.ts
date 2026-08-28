type PdfJsModule = typeof import("pdfjs-dist/legacy/build/pdf.mjs");

// Keep PDF.js as a native ESM boundary; the backend runs as ESM while Jest's
// TypeScript transform evaluates test modules through CommonJS.
const loadPdfJs = new Function("return import('pdfjs-dist/legacy/build/pdf.mjs')") as () => Promise<PdfJsModule>;

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

function answerMap(text: string) {
  const answers = new Map<number, string>();
  for (const match of text.matchAll(/(?:^|\s)(\d{1,3})\s*[.)\-:]?\s*(?:answer\s*[:\-]?\s*)?([A-D])\b/gi)) answers.set(Number(match[1]), match[2].toUpperCase());
  return answers;
}

export function parseExamQuestions(pages: ExtractedPdf["pages"], keyPages: ExtractedPdf["pages"] = []): ExtractedExamQuestion[] {
  const key = answerMap(keyPages.map((page) => page.text).join("\n"));
  const questions: ExtractedExamQuestion[] = [];
  for (const page of pages) {
    const starts = [...page.text.matchAll(/(?:^|\s)(\d{1,3})[.)]\s+/g)];
    for (let index = 0; index < starts.length; index += 1) {
      const match = starts[index];
      const chunk = page.text.slice((match.index ?? 0) + match[0].length, starts[index + 1]?.index ?? page.text.length).trim();
      const optionMatches = [...chunk.matchAll(/(?:^|\s)([A-D])[.)]\s+/g)];
      if (optionMatches.length < 2) continue;
      const optionText = (letter: string) => {
        const optionIndex = optionMatches.findIndex((candidate) => candidate[1].toUpperCase() === letter);
        if (optionIndex < 0) return "";
        const option = optionMatches[optionIndex];
        return chunk.slice((option.index ?? 0) + option[0].length, optionMatches[optionIndex + 1]?.index ?? chunk.length).replace(/\s+Answer\s*[:\-].*$/i, "").trim();
      };
      const number = Number(match[1]);
      const inlineAnswer = chunk.match(/\bAnswer\s*[:\-]\s*([A-D])\b/i)?.[1]?.toUpperCase();
      const correctAnswer = key.get(number) || inlineAnswer;
      const questionText = chunk.slice(0, optionMatches[0].index).trim();
      questions.push({ number, questionText, optionA: optionText("A"), optionB: optionText("B"), optionC: optionText("C"), optionD: optionText("D"), correctAnswer, sourcePageNumber: page.pageNumber, sourceReference: `Page ${page.pageNumber}`, reviewStatus: correctAnswer ? "READY" : "MISSING_ANSWER" });
    }
  }
  return questions;
}
