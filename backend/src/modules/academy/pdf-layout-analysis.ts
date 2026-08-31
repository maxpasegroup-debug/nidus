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

function meaningfulGlyphs(line: PdfLayoutLine) {
  return line.glyphs.filter((glyph) => glyph.text.trim());
}

/**
 * PDF producers commonly emit every superscript on a shared visual row.  A
 * unit such as `10^-5 K^-1` therefore arrives as one small line containing
 * both `-5` and `-1`, rather than two isolated glyph lines.  Associate that
 * row with a normal baseline only when every non-space glyph is anchored to
 * the right edge of a larger glyph.  This keeps scripts in reading order
 * without treating an unrelated small-font line as mathematics.
 */
function scriptLineScore(candidate: PdfLayoutLine, base: PdfLayoutLine): number | null {
  const scripts = meaningfulGlyphs(candidate);
  const bases = meaningfulGlyphs(base);
  if (!scripts.length || !bases.length) return null;
  const baseHeight = Math.max(...bases.map((glyph) => glyph.height || 10));
  if (scripts.some((glyph) => (glyph.height || 10) > baseHeight * 0.9)) return null;
  const verticalDistance = Math.abs(candidate.y - base.y);
  if (verticalDistance < baseHeight * 0.2 || verticalDistance > baseHeight * 0.75) return null;

  let horizontalDistance = 0;
  for (const script of scripts) {
    const anchors = bases
      .map((glyph) => Math.abs(script.x - (glyph.x + glyph.width)))
      .filter((distance) => distance <= Math.max(2, baseHeight * 0.4));
    if (!anchors.length) return null;
    horizontalDistance += Math.min(...anchors);
  }
  return verticalDistance + horizontalDistance;
}

export function analyzePdfPage(glyphs: PdfGlyphRun[], pageWidth?: number, pageHeight?: number): PdfLayoutAnalysis {
  const lines: PdfLayoutLine[] = [];
  for (const glyph of glyphs) {
    const tolerance = Math.max(2, (glyph.height || 10) * 0.35);
    const line = lines.find((candidate) => Math.abs(candidate.y - glyph.y) <= tolerance);
    if (line) line.glyphs.push(glyph); else lines.push({ y: glyph.y, glyphs: [glyph], text: "" });
  }
  // PDF.js often emits superscripts/subscripts as a separate visual line.
  // Merge both isolated scripts and multi-script rows into their geometrically
  // anchored baseline; otherwise leave the lines untouched.
  for (let index = lines.length - 1; index >= 0; index -= 1) {
    const candidate = lines[index];
    const match = lines
      .map((line, lineIndex) => ({ line, lineIndex, score: lineIndex === index ? null : scriptLineScore(candidate, line) }))
      .filter((entry): entry is { line: PdfLayoutLine; lineIndex: number; score: number } => entry.score !== null)
      .sort((a, b) => a.score - b.score)[0];
    if (match) {
      match.line.glyphs.push(...candidate.glyphs);
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
