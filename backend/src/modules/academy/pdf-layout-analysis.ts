import type { MathSegmentHint } from "../document-intelligence/question-content.schema.js";
import { analyzePdfMathRegions, type PdfGlyphRun } from "./pdf-math-reconstruction.js";
import { isSuspectPdfText, type PdfTextLayerStatus } from "./pdf-text-decoding.js";

export type PdfLayoutLine = { y: number; glyphs: PdfGlyphRun[]; text: string };
export type PdfLayoutAnalysis = {
  glyphs: PdfGlyphRun[];
  lines: PdfLayoutLine[];
  text: string;
  mathSegments: MathSegmentHint[];
  mathRegionsDetected: number;
  mathRegionsCanonicalized: number;
  mathRegionsReviewRequired: number;
  encodingStatus: PdfTextLayerStatus;
  totalTextItems: number;
  suspectTextItems: number;
  privateUseGlyphs: number;
  replacementCharacters: number;
  encodingWarnings: number;
};

export function analyzePdfPage(glyphs: PdfGlyphRun[], pageWidth?: number, pageHeight?: number): PdfLayoutAnalysis {
  const lines: PdfLayoutLine[] = [];
  for (const glyph of glyphs) {
    const tolerance = Math.max(2, (glyph.height || 10) * 0.35);
    const line = lines.find((candidate) => Math.abs(candidate.y - glyph.y) <= tolerance);
    if (line) line.glyphs.push(glyph); else lines.push({ y: glyph.y, glyphs: [glyph], text: "" });
  }
  // PDF.js often emits a superscript/subscript as its own line because its
  // baseline differs from the surrounding text. Attach an isolated, smaller
  // glyph to an adjacent baseline line when the horizontal relationship is
  // unambiguous; otherwise leave the lines untouched.
  for (let index = lines.length - 1; index >= 0; index -= 1) {
    const candidate = lines[index];
    if (candidate.glyphs.length !== 1) continue;
    const glyph = candidate.glyphs[0];
    const base = lines.find((line, lineIndex) => {
      if (lineIndex === index || !line.glyphs.length) return false;
      const baseGlyph = line.glyphs[line.glyphs.length - 1];
      const smaller = glyph.height <= baseGlyph.height * 0.8;
      const adjacent = glyph.x >= baseGlyph.x + baseGlyph.width - 2 && glyph.x <= baseGlyph.x + baseGlyph.width * 2.5;
      const verticallyRelated = Math.abs(glyph.y - baseGlyph.y) <= baseGlyph.height * 1.4;
      return smaller && adjacent && verticallyRelated;
    });
    if (base) {
      base.glyphs.push(glyph);
      lines.splice(index, 1);
    }
  }
  for (const line of lines) {
    line.glyphs.sort((a, b) => a.x - b.x || (a.transform?.[0] ?? 0) - (b.transform?.[0] ?? 0) || (a.order ?? 0) - (b.order ?? 0));
    line.text = line.glyphs.map((glyph) => glyph.text).join(" ").replace(/\s+/g, " ").trim();
  }
  lines.sort((a, b) => b.y - a.y);
  const math = analyzePdfMathRegions(glyphs, pageWidth, pageHeight);
  const suspect = glyphs.filter((glyph) => isSuspectPdfText(glyph));
  const privateUseGlyphs = glyphs.reduce((count, glyph) => count + Array.from(glyph.text).filter((char) => /[\uE000-\uF8FF\u{F0000}-\u{FFFFD}\u{100000}-\u{10FFFD}]/u.test(char)).length, 0);
  const replacementCharacters = glyphs.reduce((count, glyph) => count + Array.from(glyph.text).filter((char) => char === "\uFFFD").length, 0);
  const encodingWarnings = suspect.reduce((count, glyph) => count + (glyph.warnings?.length || 0), 0);
  return {
    glyphs,
    lines,
    text: lines.map((line) => line.text).filter(Boolean).join("\n"),
    mathSegments: math.regions,
    mathRegionsDetected: math.mathRegionsDetected,
    mathRegionsCanonicalized: math.mathRegionsCanonicalized,
    mathRegionsReviewRequired: math.mathRegionsReviewRequired,
    encodingStatus: suspect.length ? "GLYPH_ENCODING_SUSPECT" : "TEXT_LAYER_OK",
    totalTextItems: glyphs.length,
    suspectTextItems: suspect.length,
    privateUseGlyphs,
    replacementCharacters,
    encodingWarnings,
  };
}
