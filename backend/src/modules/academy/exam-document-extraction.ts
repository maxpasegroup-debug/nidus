type PdfJsModule = typeof import("pdfjs-dist/legacy/build/pdf.mjs");
type MammothModule = typeof import("mammoth");
type JsZipModule = typeof import("jszip");
type WordExtractorModule = { default?: new () => { extract(buffer: Buffer): Promise<{ getBody(): string }> } } & (new () => { extract(buffer: Buffer): Promise<{ getBody(): string }> });

// Keep PDF.js as a native ESM boundary; the backend runs as ESM while Jest's
// TypeScript transform evaluates test modules through CommonJS.
const loadPdfJs = new Function("return import('pdfjs-dist/legacy/build/pdf.mjs')") as () => Promise<PdfJsModule>;
const loadMammoth = new Function("return import('mammoth')") as () => Promise<MammothModule>;
const loadJsZip = new Function("return import('jszip')") as () => Promise<JsZipModule>;
const loadWordExtractor = new Function("return import('word-extractor')") as () => Promise<WordExtractorModule>;

export type ExtractedExamQuestion = {
  number: number;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer?: string;
  marks?: number;
  sourcePageNumber: number;
  sourceReference: string;
  reviewStatus: "READY" | "MISSING_ANSWER" | "NEEDS_REVIEW";
};

export type NormalizedDocumentBlock = {
  type: "paragraph" | "table" | "line";
  text: string;
  order: number;
};

export type NormalizedDocumentPage = {
  pageNumber: number;
  text: string;
  blocks?: NormalizedDocumentBlock[];
};

export type ExtractedPdf = { pages: NormalizedDocumentPage[]; textCharacters: number };
export type ExtractedDocument = ExtractedPdf;

function normalizeDocumentText(value: string) {
  return value
    .normalize("NFKC")
    .replace(/\r\n?/g, "\n")
    .replace(/[\u00a0\u2007\u202f]/g, " ")
    .replace(/ +/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function blocksFromText(text: string): NormalizedDocumentBlock[] {
  return text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, order) => ({
      type: /\t|\s{2,}/.test(line) ? "table" : "line",
      text: line,
      order
    }));
}

function normalizedPage(pageNumber: number, rawText: string, blocks?: NormalizedDocumentBlock[]) {
  const text = normalizeDocumentText(rawText);
  return { pageNumber, text, blocks: blocks ?? blocksFromText(text) };
}

function decodeXml(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)));
}

/**
 * Mammoth intentionally prioritizes readable prose and may omit Office Math
 * runs. Read the document XML as a small, dependency-light supplement so
 * m:t math text remains in the normalized representation. This is not an XML
 * renderer: unsupported drawing/image content is left for review.
 */
async function extractDocxXmlParagraphs(buffer: Buffer) {
  try {
    const module = await loadJsZip();
    const jszip = (module as unknown as { default?: JsZipModule }).default ?? module;
    const zip = await jszip.loadAsync(buffer);
    const entry = zip.file("word/document.xml");
    if (!entry) return "";
    const xml = (await entry.async("string")).replace(/<m:rad\b[^>]*>([\s\S]*?)<\/m:rad>/g, (_, body: string) => {
      const radicand = Array.from(body.matchAll(/<m:t\b[^>]*>([\s\S]*?)<\/m:t>/g)).map((token) => decodeXml(token[1])).join("");
      return `<w:t>√(${radicand})</w:t>`;
    });
    const paragraphs: string[] = [];
    for (const paragraph of xml.matchAll(/<w:p\b[^>]*>[\s\S]*?<\/w:p>/g)) {
      const tokens: string[] = [];
      for (const token of paragraph[0].matchAll(/<(?:w|m):t\b[^>]*>([\s\S]*?)<\/(?:w|m):t>|<w:tab\b[^>]*\/?\s*>/g)) tokens.push(token[1] === undefined ? "\t" : decodeXml(token[1]));
      const text = tokens.join("").trim();
      if (text) paragraphs.push(text);
    }
    return paragraphs.join("\n");
  } catch {
    return "";
  }
}

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
      const positioned = content.items
        .map((item, order) => {
          if (!("str" in item) || !item.str) return null;
          const transform = "transform" in item && Array.isArray(item.transform) ? item.transform : [];
          return { text: item.str, x: Number(transform[4] ?? 0), y: Number(transform[5] ?? 0), order };
        })
        .filter((item): item is { text: string; x: number; y: number; order: number } => Boolean(item));
      const lines: Array<{ y: number; items: typeof positioned }> = [];
      for (const item of positioned) {
        const line = lines.find((candidate) => Math.abs(candidate.y - item.y) <= 3);
        if (line) line.items.push(item);
        else lines.push({ y: item.y, items: [item] });
      }
      const text = lines
        .sort((a, b) => b.y - a.y)
        .map((line) => line.items.sort((a, b) => a.x - b.x || a.order - b.order).map((item) => item.text).join(" "))
        .join("\n");
      pages.push(normalizedPage(pageNumber, text));
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
    const xmlText = await extractDocxXmlParagraphs(buffer);
    const text = normalizeDocumentText(xmlText || result.value);
    const textCharacters = text.replace(/\s/g, "").length;
    if (textCharacters < 20) {
      throw Object.assign(new Error("This DOCX does not contain enough readable text. Please upload a document containing editable question text."), { statusCode: 422, code: "DOCX_TEXT_UNAVAILABLE" });
    }
    // DOCX does not carry stable rendered page boundaries. Preserve one
    // truthful document-level source reference rather than inventing pages.
    return { pages: [normalizedPage(1, text)], textCharacters };
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
    const text = normalizeDocumentText(document.getBody());
    const textCharacters = text.replace(/\s/g, "").length;
    if (textCharacters < 20) {
      throw Object.assign(new Error("This DOC does not contain enough readable text. Please upload a document containing editable question text."), { statusCode: 422, code: "DOC_TEXT_UNAVAILABLE" });
    }
    return { pages: [normalizedPage(1, text)], textCharacters };
  } catch (error) {
    if (error && typeof error === "object" && "statusCode" in error) throw error;
    throw Object.assign(new Error("This DOC appears corrupt or unreadable. Upload a valid DOC file."), { statusCode: 422 });
  }
}

function answerMap(text: string) {
  const answers = new Map<number, string>();
  for (const match of text.matchAll(/(?:^|[\s|,;])(?:answer\s*(?:for\s*)?)?(?:question\s*|q\s*)?(\d{1,3})\s*[.)\-:]?\s*(?:answer\s*[:\-]?\s*)?([A-D])\b/gi)) answers.set(Number(match[1]), match[2].toUpperCase());
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
    // Accept both common question-number styles (`1.` and `1)`). A closing
    // parenthesis must be followed by whitespace, which prevents mathematical
    // groups such as `(1024)10` from being mistaken for a new question while
    // preserving compact `...102.Convert` Word extraction.
    const candidates: Array<{ rawNumber: string; matchIndex: number; startIndex: number; end: number; lineStart: boolean }> = [...page.text.matchAll(/(\d{1,4})(?:\.(?=\s*\S)|\)(?=\s+\S))\s*/g)].map((match) => {
      const matchIndex = match.index ?? 0;
      return {
        rawNumber: match[1],
        matchIndex,
        startIndex: matchIndex,
        end: matchIndex + match[0].length,
        lineStart: matchIndex === 0 || page.text[matchIndex - 1] === "\n" || page.text[matchIndex - 1] === "\r",
      };
    });
    for (const match of page.text.matchAll(/(?:^|[\r\n])\s*(?:question\s*|q\s*)(\d{1,4})\s*[.):\-]?\s*(?=\S)/gi)) {
      const rawNumber = match[1];
      const numberOffset = (match[0].indexOf(rawNumber));
      const matchIndex = (match.index ?? 0) + numberOffset;
      candidates.push({ rawNumber, matchIndex, startIndex: match.index ?? 0, end: (match.index ?? 0) + match[0].length, lineStart: true });
    }
    for (const match of page.text.matchAll(/(?:^|[\r\n]|\s)\((\d{1,4})\)\s+(?=\S)/g)) {
      const rawNumber = match[1];
      const numberOffset = match[0].indexOf(rawNumber);
      const matchIndex = (match.index ?? 0) + numberOffset;
      const startIndex = (match.index ?? 0) + match[0].indexOf("(");
      candidates.push({ rawNumber, matchIndex, startIndex, end: (match.index ?? 0) + match[0].length, lineStart: startIndex === 0 || page.text[startIndex - 1] === "\n" || page.text[startIndex - 1] === "\r" });
    }
    const dedupedCandidates = Array.from(new Map(candidates.map((candidate) => [`${candidate.matchIndex}:${candidate.rawNumber}`, candidate])).values())
      .sort((a, b) => a.matchIndex - b.matchIndex);
    const starts: Array<{ index: number; end: number; number: number }> = [];
    let candidateCursor = 0;
    while (candidateCursor < dedupedCandidates.length) {
      const expected = String(expectedNumber);
      const lineStartExactIndex = dedupedCandidates.findIndex((candidate, candidateIndex) => candidateIndex >= candidateCursor && candidate.lineStart && candidate.rawNumber === expected);
      const exactIndex = lineStartExactIndex >= 0
        ? lineStartExactIndex
        : dedupedCandidates.findIndex((candidate, candidateIndex) => candidateIndex >= candidateCursor && candidate.rawNumber === expected);
      const lineStartSuffixIndex = dedupedCandidates.findIndex((candidate, candidateIndex) => candidateIndex >= candidateCursor && candidate.lineStart && candidate.rawNumber.endsWith(expected));
      const suffixIndex = lineStartSuffixIndex >= 0
        ? lineStartSuffixIndex
        : dedupedCandidates.findIndex((candidate, candidateIndex) => candidateIndex >= candidateCursor && candidate.rawNumber.endsWith(expected));
      const selectedIndex = exactIndex >= 0 ? exactIndex : suffixIndex;
      if (selectedIndex < 0) break;
      const selected = dedupedCandidates[selectedIndex];
      const prefixLength = selected.rawNumber.length - expected.length;
      starts.push({ index: selected.startIndex + prefixLength, end: selected.end, number: expectedNumber });
      expectedNumber += 1;
      candidateCursor = selectedIndex + 1;
    }
    for (let index = 0; index < starts.length; index += 1) {
      const start = starts[index];
      const chunk = page.text.slice(start.end, starts[index + 1]?.index ?? page.text.length).trim();
      const optionMatches = [...chunk.matchAll(/(?:^|\s|\()([A-D])[.):]\s*/gi)];
      // Some Word papers use four unlabeled option paragraphs (one value per
      // line) instead of explicit A-D prefixes. When no labels are present,
      // treat the final four non-empty lines as the options and keep all
      // preceding lines as the question text. This preserves the source
      // faithfully without inventing answers.
      const unlabeledLines = optionMatches.length === 0
        ? chunk.split(/\r?\n+/).map((line) => line.trim()).filter(Boolean)
        : [];
      const unlabeledOptions = unlabeledLines.length >= 5 ? unlabeledLines.slice(-4) : [];
      const optionText = (letter: string) => {
        const optionIndex = optionMatches.findIndex((candidate) => candidate[1].toUpperCase() === letter);
        if (optionIndex < 0) return "";
        const option = optionMatches[optionIndex];
        return chunk.slice((option.index ?? 0) + option[0].length, optionMatches[optionIndex + 1]?.index ?? chunk.length)
          .replace(/\s+Answer\s*[:\-].*$/i, "")
          .replace(/\s+\d+(?:\.\d+)?\s*marks?\b.*$/i, "")
          .replace(/Direction for questions\s+\d+\s+to\s+\d+\s*:.*$/i, "")
          .trim();
      };
      const number = start.number;
      const inlineAnswer = chunk.match(/\b(?:correct\s+)?answer\s*[:\-]\s*([A-D])\b/i)?.[1]?.toUpperCase();
      const correctAnswer = key.get(number) || inlineAnswer;
      const marksMatch = chunk.match(/(?:^|\s)(\d+(?:\.\d+)?)\s*marks?\b/i);
      const marks = marksMatch ? Number(marksMatch[1]) : undefined;
      const ownText = optionMatches.length > 0
        ? chunk.slice(0, optionMatches[0]?.index ?? chunk.length).trim()
        : (unlabeledOptions.length ? unlabeledLines.slice(0, -4).join(" ").trim() : chunk.trim());
      const questionText = [directions.get(number), ownText].filter(Boolean).join(" ");
      const options = optionMatches.length > 0
        ? [optionText("A"), optionText("B"), optionText("C"), optionText("D")]
        : unlabeledOptions;
      const optionsComplete = options.length === 4 && options.every(Boolean);
      const reviewStatus = optionsComplete ? (correctAnswer ? "READY" : "MISSING_ANSWER") : "NEEDS_REVIEW";
      questions.push({ number, questionText, optionA: options[0] || "", optionB: options[1] || "", optionC: options[2] || "", optionD: options[3] || "", correctAnswer, marks, sourcePageNumber: page.pageNumber, sourceReference: `Page ${page.pageNumber}`, reviewStatus });
    }
  }
  return questions;
}
