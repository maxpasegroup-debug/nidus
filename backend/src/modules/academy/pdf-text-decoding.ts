import type { MathConversionWarning } from "../document-intelligence/question-content.schema.js";

export type PdfTextLayerStatus = "TEXT_LAYER_OK" | "GLYPH_ENCODING_SUSPECT" | "MATH_LAYOUT_AMBIGUOUS" | "VISUAL_ONLY_CONTENT";

export type PdfTextDecodingResult = {
  rawText: string;
  normalizedText: string;
  encodingStatus: PdfTextLayerStatus;
  warnings?: MathConversionWarning[];
};

function warning(code: string, message: string): MathConversionWarning {
  return { code, message, severity: "HIGH" };
}

/**
 * Normalize a PDF.js text item without compatibility-folding mathematical
 * glyphs. NFC keeps characters such as ², ₁, √, π and ∫ available to the
 * layout/math stage. The raw item is intentionally retained by the caller.
 */
export function decodePdfTextItem(rawValue: string): PdfTextDecodingResult {
  const rawText = String(rawValue ?? "");
  const normalizedText = rawText
    .normalize("NFC")
    .replace(/[\u00a0\u2007\u202f]/gu, " ");
  const warnings: MathConversionWarning[] = [];

  if (/\uFFFD/u.test(normalizedText)) {
    warnings.push(warning("PDF_GLYPH_ENCODING_NEEDS_REVIEW", "PDF.js returned a replacement character; the original glyph mapping may be unavailable."));
  }
  // Private-use characters have no portable mathematical identity. They may
  // be valid custom-font glyphs, but must never be assigned a meaning by
  // visual similarity or a producer-specific workaround.
  if (/[\uE000-\uF8FF\u{F0000}-\u{FFFFD}\u{100000}-\u{10FFFD}]/u.test(normalizedText)) {
    warnings.push(warning("PDF_PRIVATE_USE_GLYPH_NEEDS_REVIEW", "A private-use PDF glyph was preserved without assigning it a mathematical meaning."));
  }
  if (/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/u.test(normalizedText)) {
    warnings.push(warning("PDF_CONTROL_CHARACTER_NEEDS_REVIEW", "A control character was present in the PDF text layer."));
  }
  // A small set of punctuation values is frequently produced when a
  // mathematical font has no usable ToUnicode mapping (for example a square
  // root becoming a quote or a subscript becoming U+201A). These characters
  // remain untouched; the warning prevents downstream code from treating the
  // surrounding expression as authoritative math.
  if (/[\u201A\u20AC\u2022]/u.test(normalizedText)) {
    warnings.push(warning("PDF_GLYPH_ENCODING_NEEDS_REVIEW", "The PDF text layer contains a suspicious unmapped punctuation glyph near document content."));
  }

  return {
    rawText,
    normalizedText,
    encodingStatus: warnings.length ? "GLYPH_ENCODING_SUSPECT" : "TEXT_LAYER_OK",
    ...(warnings.length ? { warnings } : {}),
  };
}

export function isSuspectPdfText(value: { encodingStatus?: PdfTextLayerStatus; warnings?: MathConversionWarning[] }) {
  return value.encodingStatus === "GLYPH_ENCODING_SUSPECT" || Boolean(value.warnings?.length);
}
