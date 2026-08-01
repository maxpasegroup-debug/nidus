import { createWorker } from "tesseract.js";
import { env } from "../../../config/env.js";
import type { OcrProvider } from "../contracts/providers.js";
import type { NdieNormalizedOcrPage, NdieOcrBlock, NdieOcrBox, NdieOcrLine, NdieOcrParagraph, NdieOcrWord } from "../contracts/ocr-result.js";

type TesseractWord = {
  text?: string;
  confidence?: number;
  bbox?: { x0: number; y0: number; x1: number; y1: number };
};

type TesseractLine = {
  text?: string;
  confidence?: number;
  bbox?: { x0: number; y0: number; x1: number; y1: number };
  words?: TesseractWord[];
};

type TesseractParagraph = {
  text?: string;
  confidence?: number;
  bbox?: { x0: number; y0: number; x1: number; y1: number };
  lines?: TesseractLine[];
};

type TesseractBlock = {
  text?: string;
  confidence?: number;
  bbox?: { x0: number; y0: number; x1: number; y1: number };
  paragraphs?: TesseractParagraph[];
};

function normalizedConfidence(value?: number) {
  if (typeof value !== "number" || Number.isNaN(value)) return null;
  return Math.max(0, Math.min(1, value / 100));
}

function box(input?: { x0: number; y0: number; x1: number; y1: number }): NdieOcrBox | undefined {
  if (!input) return undefined;
  return {
    x: input.x0,
    y: input.y0,
    width: Math.max(0, input.x1 - input.x0),
    height: Math.max(0, input.y1 - input.y0)
  };
}

function normalizeWords(words: TesseractWord[] = []): NdieOcrWord[] {
  return words.filter((word) => word.text?.trim()).map((word) => ({
    text: word.text?.trim() ?? "",
    confidence: normalizedConfidence(word.confidence),
    boundingBox: box(word.bbox),
    symbols: []
  }));
}

function normalizeLines(lines: TesseractLine[] = [], startOrder = 1): NdieOcrLine[] {
  return lines.filter((line) => line.text?.trim()).map((line, index) => ({
    text: line.text?.trim() ?? "",
    confidence: normalizedConfidence(line.confidence),
    boundingBox: box(line.bbox),
    readingOrder: startOrder + index,
    words: normalizeWords(line.words)
  }));
}

function normalizeParagraphs(paragraphs: TesseractParagraph[] = []): NdieOcrParagraph[] {
  let lineOrder = 1;
  return paragraphs.filter((paragraph) => paragraph.text?.trim()).map((paragraph, index) => {
    const lines = normalizeLines(paragraph.lines, lineOrder);
    lineOrder += lines.length;
    return {
      text: paragraph.text?.trim() ?? "",
      confidence: normalizedConfidence(paragraph.confidence),
      boundingBox: box(paragraph.bbox),
      readingOrder: index + 1,
      lines
    };
  });
}

function normalizeBlocks(blocks: TesseractBlock[] = []): NdieOcrBlock[] {
  return blocks.filter((block) => block.text?.trim()).map((block, index) => ({
    blockType: "TEXT",
    text: block.text?.trim() ?? "",
    confidence: normalizedConfidence(block.confidence),
    boundingBox: box(block.bbox),
    readingOrder: index + 1,
    paragraphs: normalizeParagraphs(block.paragraphs)
  }));
}

function collectLanguages(primary: string | null, hints: string[]) {
  return Array.from(new Set([primary, ...hints].filter((language): language is string => Boolean(language))));
}

export class TesseractOcrProvider implements OcrProvider {
  readonly id = "ocr.tesseract";
  readonly kind = "OCR" as const;
  readonly displayName = "NDIE Tesseract OCR Provider";
  readonly version = "tesseract.js";

  isEnabled() {
    return true;
  }

  health() {
    return {
      id: this.id,
      kind: this.kind,
      enabled: true,
      configured: true,
      status: "READY" as const
    };
  }

  async recognize(input: {
    importJobId: string;
    pageId: string;
    pageNumber: number;
    imageUrl?: string | null;
    imageBuffer?: Buffer;
    languageHints?: string[];
    rotation?: number | null;
    preprocessing?: Record<string, unknown>;
  }) {
    const startedAt = Date.now();
    const languageHints = input.languageHints?.length ? input.languageHints : env.NDIE_OCR_LANGUAGES.split(/[,+]/).map((language) => language.trim()).filter(Boolean);
    const language = languageHints.join("+") || "eng";
    const source = input.imageBuffer ?? input.imageUrl;
    if (!source) throw Object.assign(new Error("OCR requires a rendered page image."), { statusCode: 422, retryable: false });

    const worker = await createWorker(language);
    try {
      const response = await worker.recognize(source);
      const data = response.data as typeof response.data & {
        blocks?: TesseractBlock[];
        paragraphs?: TesseractParagraph[];
        lines?: TesseractLine[];
        words?: TesseractWord[];
      };

      const blocks = data.blocks?.length
        ? normalizeBlocks(data.blocks)
        : [{
          blockType: "TEXT" as const,
          text: data.text?.trim() ?? "",
          confidence: normalizedConfidence(data.confidence),
          readingOrder: 1,
          paragraphs: [{
            text: data.text?.trim() ?? "",
            confidence: normalizedConfidence(data.confidence),
            readingOrder: 1,
            lines: normalizeLines(data.lines)
          }]
        }];
      const text = data.text?.trim() ?? "";
      const confidence = normalizedConfidence(data.confidence);
      const primaryLanguage = languageHints[0] ?? null;
      const diagnostics = {
        blankPage: text.length === 0,
        lowConfidence: confidence !== null && confidence < env.NDIE_OCR_CONFIDENCE_WARNING,
        missingText: text.length === 0,
        languageMismatch: false,
        rotatedPage: Boolean(input.rotation && input.rotation % 360 !== 0),
        providerFailure: false,
        retryable: false,
        issues: [
          ...(text.length === 0 ? ["MISSING_TEXT"] : []),
          ...(confidence !== null && confidence < env.NDIE_OCR_CONFIDENCE_WARNING ? ["LOW_CONFIDENCE"] : []),
          ...(input.rotation && input.rotation % 360 !== 0 ? ["ROTATED_PAGE"] : [])
        ]
      };
      const normalized: NdieNormalizedOcrPage = {
        schemaVersion: "ndie-ocr-v1",
        providerId: this.id,
        providerVersion: this.version,
        pageId: input.pageId,
        pageNumber: input.pageNumber,
        language: primaryLanguage,
        languages: collectLanguages(primaryLanguage, languageHints),
        rotation: input.rotation ?? null,
        confidence,
        text,
        blocks,
        diagnostics,
        preprocessing: input.preprocessing ?? {},
        durationMs: Date.now() - startedAt,
        createdAt: new Date().toISOString()
      };

      return {
        text,
        confidence,
        language: primaryLanguage,
        languages: normalized.languages,
        normalized,
        raw: {
          provider: this.id,
          providerVersion: this.version,
          confidence: data.confidence,
          text: data.text,
          blockCount: data.blocks?.length ?? 0,
          paragraphCount: data.paragraphs?.length ?? 0,
          lineCount: data.lines?.length ?? 0,
          wordCount: data.words?.length ?? 0
        }
      };
    } finally {
      await worker.terminate();
    }
  }
}
