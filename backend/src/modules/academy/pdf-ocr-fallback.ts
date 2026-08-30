import type { OcrProvider } from "../ndie/contracts/providers.js";
import { renderPdfVisualCrop, type PdfVisualRegion } from "./pdf-visual-analysis.js";

export type PdfOcrPageResult = {
  text: string;
  rawText: string;
  normalizedText: string;
  confidence: number | null;
  providerId: string;
  reviewRequired: boolean;
  reviewNotes: string[];
  warnings: string[];
  blocks: Array<{ type: "line"; text: string; order: number; boundingBox?: { x: number; y: number; width: number; height: number } }>;
  crop?: { buffer: Buffer; mimeType: "image/jpeg" | "image/png"; width: number; height: number };
};

type PdfPageLike = Parameters<typeof renderPdfVisualCrop>[0];

const mathSignal = /(?:\\(?:frac|sqrt|int|sum|prod|lim|log|sin|cos)|[²³ⁿ₀₁₂₃√∫∑∏πθ≤≥≠≈±×÷∞]|\^|_\{?\w)/u;
const ocrConfidenceThreshold = () => Number(process.env.NDIE_OCR_CONFIDENCE_WARNING || 0.75);
const ocrMaxPixels = () => Number(process.env.NDIE_OCR_MAX_IMAGE_PIXELS || 80_000_000);

/** A page is OCR-eligible only when its native text layer has no useful text. */
export function shouldUsePdfOcrFallback(input: { text?: string; encodingStatus?: string }) {
  const characterCount = String(input.text || "").replace(/\s/gu, "").length;
  return characterCount < 20 || input.encodingStatus === "VISUAL_ONLY_CONTENT";
}

function normalizedLines(result: { normalized?: { blocks?: Array<{ paragraphs?: Array<{ lines?: Array<{ text?: string; boundingBox?: { x?: unknown; y?: unknown; width?: unknown; height?: unknown } }> }> }> } } | undefined, text: string) {
  const lines = result?.normalized?.blocks?.flatMap((block) => block.paragraphs?.flatMap((paragraph) => paragraph.lines?.map((line) => ({
    text: String(line.text || "").trim(),
    ...(line.boundingBox && typeof line.boundingBox === "object" ? {
      boundingBox: {
        x: Number(line.boundingBox.x || 0),
        y: Number(line.boundingBox.y || 0),
        width: Number(line.boundingBox.width || 0),
        height: Number(line.boundingBox.height || 0),
      },
    } : {}),
  })) || []) || []) || [];
  const fallback = lines.length ? lines : text.split(/\r?\n/gu).map((line) => line.trim()).filter(Boolean);
  return fallback.map((line, order) => typeof line === "string"
    ? { type: "line" as const, text: line, order }
    : { type: "line" as const, text: line.text, order, ...(line.boundingBox ? { boundingBox: line.boundingBox } : {}) });
}

/**
 * Render one page and run the existing routed OCR provider. OCR is deliberately
 * an opt-in fallback: native PDF text remains authoritative whenever usable.
 */
export async function recognizePdfPageWithOcr(page: PdfPageLike, pageNumber: number, options: { provider?: OcrProvider; importJobId?: string; dpi?: number } = {}): Promise<PdfOcrPageResult> {
  const fullPage: PdfVisualRegion = {
    id: `pdf-${pageNumber}-ocr-source`, pageNumber,
    boundingBox: { page: pageNumber, x: 0, y: 0, width: 1, height: 1 },
    sourceType: "UNKNOWN_VISUAL", confidence: 0.8, reviewRequired: false,
    sourceReference: `Page ${pageNumber}`,
  };
  const crop = await renderPdfVisualCrop(page, fullPage, { dpi: options.dpi || 160, padding: 0, maxPixels: Math.min(ocrMaxPixels(), 12_000_000) });
  if (!crop.buffer.length) throw Object.assign(new Error("The scanned page could not be rendered for OCR."), { statusCode: 422, code: "OCR_RENDER_FAILED" });
  const provider = options.provider || new (await import("../ndie/provider-orchestrator/production-providers.js")).ProductionOcrProvider();
  let result: Awaited<ReturnType<OcrProvider["recognize"]>>;
  try {
    result = await provider.recognize({
      importJobId: options.importJobId || `pdf-ocr-${pageNumber}`,
      pageId: `pdf-page-${pageNumber}`,
      pageNumber,
      imageBuffer: crop.buffer,
      languageHints: String(process.env.NDIE_OCR_LANGUAGES || "eng").split(/[,+]/u).map((value) => value.trim()).filter(Boolean),
      preprocessing: { enabled: process.env.NDIE_OCR_PREPROCESSING_ENABLED !== "false" },
    });
  } catch (error) {
    // Preserve the rendered source even when the provider is unavailable or
    // transiently fails. The caller can retry against the same draft without
    // losing the evidence needed for director review.
    return {
      text: "", rawText: "", normalizedText: "", confidence: null,
      providerId: provider.id,
      reviewRequired: true,
      reviewNotes: ["OCR_REGION_UNREADABLE"],
      warnings: [error instanceof Error ? error.message : "OCR could not process this page."],
      blocks: [], crop,
    };
  }
  const text = String(result.text || "").normalize("NFC").replace(/[\u00a0\u2007\u202f]/gu, " ").replace(/\r\n?/gu, "\n").trim();
  const confidence = typeof result.confidence === "number" && Number.isFinite(result.confidence) ? Math.max(0, Math.min(1, result.confidence)) : null;
  const selectedProvider = String((result.raw as { routing?: { selected?: unknown }; provider?: unknown }).routing?.selected || (result.normalized as { providerId?: unknown } | undefined)?.providerId || provider.id);
  const reviewNotes: string[] = [];
  const warnings: string[] = [];
  if (!text) { reviewNotes.push("OCR_REGION_UNREADABLE"); warnings.push("OCR returned no readable text from this page."); }
  if (confidence === null && text) {
    reviewNotes.push("OCR_TEXT_NEEDS_REVIEW");
    warnings.push("OCR provider did not return a confidence score.");
  } else if (confidence !== null && confidence < ocrConfidenceThreshold()) {
    reviewNotes.push("OCR_TEXT_NEEDS_REVIEW");
    warnings.push(`OCR confidence ${(confidence * 100).toFixed(0)}% is below the review threshold.`);
  }
  // OCR text is never treated as authoritative mathematics. A specialist may
  // preserve LaTeX delimiters, but the director must still confirm math meaning.
  if (mathSignal.test(text)) { reviewNotes.push("MATH_OCR_NEEDS_REVIEW"); warnings.push("Mathematical text came from OCR and requires director confirmation."); }
  return {
    text,
    rawText: String(result.raw?.text || (result.raw as { latex_styled?: unknown } | undefined)?.latex_styled || text),
    normalizedText: text,
    confidence,
    providerId: selectedProvider,
    reviewRequired: reviewNotes.length > 0,
    reviewNotes: Array.from(new Set(reviewNotes)),
    warnings,
    blocks: normalizedLines(result, text),
    crop,
  };
}
