import type { MathConversionWarning, MathSegmentHint } from "../document-intelligence/question-content.schema.js";
import { isSuspectPdfText, type PdfTextLayerStatus } from "./pdf-text-decoding.js";

export type PdfGlyphRun = { text: string; rawText?: string; normalizedText?: string; pageNumber: number; x: number; y: number; width: number; height: number; fontSize?: number; fontName?: string; transform?: number[]; order?: number; sourceOrder?: number; encodingStatus?: PdfTextLayerStatus; warnings?: MathConversionWarning[] };
export type PdfMathNode =
  | { kind: "sequence"; children: PdfMathNode[] } | { kind: "symbol"; text: string }
  | { kind: "script"; base: PdfMathNode; sub?: PdfMathNode; sup?: PdfMathNode }
  | { kind: "fraction"; numerator: PdfMathNode; denominator: PdfMathNode }
  | { kind: "root"; radicand: PdfMathNode; degree?: PdfMathNode }
  | { kind: "largeOperator"; operator: string; body: PdfMathNode; lower?: PdfMathNode; upper?: PdfMathNode }
  | { kind: "matrix"; rows: PdfMathNode[][]; delimiter?: "bmatrix" | "pmatrix" | "vmatrix" | "cases" }
  | { kind: "delimited"; open: string; close: string; body: PdfMathNode }
  | { kind: "alignment"; rows: PdfMathNode[] }
  | { kind: "accent"; accent: "bar" | "hat" | "vec"; base: PdfMathNode };
export type PdfMathRegion = MathSegmentHint & { sourceText: string; boundingBox: { page: number; x: number; y: number; width: number; height: number } };

const superscripts: Record<string, string> = { "⁰": "0", "¹": "1", "²": "2", "³": "3", "⁴": "4", "⁵": "5", "⁶": "6", "⁷": "7", "⁸": "8", "⁹": "9", "⁺": "+", "⁻": "-", "⁽": "(", "⁾": ")" };
const subscripts: Record<string, string> = { "₀": "0", "₁": "1", "₂": "2", "₃": "3", "₄": "4", "₅": "5", "₆": "6", "₇": "7", "₈": "8", "₉": "9", "₊": "+", "₋": "-", "₌": "=" };
const symbols: Record<string, string> = { "π": "\\pi", "θ": "\\theta", "α": "\\alpha", "β": "\\beta", "γ": "\\gamma", "λ": "\\lambda", "μ": "\\mu", "σ": "\\sigma", "Δ": "\\Delta", "∞": "\\infty", "≤": "\\le", "≥": "\\ge", "≠": "\\ne", "≈": "\\approx", "±": "\\pm", "×": "\\times", "÷": "\\div", "∈": "\\in", "∉": "\\notin", "∪": "\\cup", "∩": "\\cap", "→": "\\to", "⇒": "\\Rightarrow", "⇔": "\\Leftrightarrow", "∫": "\\int", "∑": "\\sum", "∏": "\\prod", "−": "-" };
function normalizeUnicode(value: string) { return Array.from(value).map((char) => symbols[char] || char).join(""); }
function unicodePowers(value: string) { return value.replace(/([A-Za-z0-9])([⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻⁽⁾]+)/gu, (_, base: string, power: string) => `${base}^{${Array.from(power).map((char) => superscripts[char] || char).join("")}}`).replace(/([A-Za-z]+)([₀₁₂₃₄₅₆₇₈₉₊₋₌]+)/gu, (_, base: string, subscript: string) => `${base}_{${Array.from(subscript).map((char) => subscripts[char] || char).join("")}}`); }
function nodeText(text: string): PdfMathNode { return { kind: "symbol", text }; }
function sequence(text: string): PdfMathNode { return nodeText(normalizeUnicode(text).replace(/\s+/gu, " ").trim()); }

export function serializePdfMathNode(node: PdfMathNode): string {
  switch (node.kind) {
    case "symbol": return node.text;
    case "sequence": return node.children.map(serializePdfMathNode).join("");
    case "script": return `${serializePdfMathNode(node.base)}${node.sub ? `_{${serializePdfMathNode(node.sub)}}` : ""}${node.sup ? `^{${serializePdfMathNode(node.sup)}}` : ""}`;
    case "fraction": return `\\frac{${serializePdfMathNode(node.numerator)}}{${serializePdfMathNode(node.denominator)}}`;
    case "root": return `${node.degree ? `\\sqrt[${serializePdfMathNode(node.degree)}]` : "\\sqrt"}{${serializePdfMathNode(node.radicand)}}`;
    case "largeOperator": return `${node.operator}${node.lower ? `_{${serializePdfMathNode(node.lower)}}` : ""}${node.upper ? `^{${serializePdfMathNode(node.upper)}}` : ""} ${serializePdfMathNode(node.body)}`;
    case "matrix": return `\\begin{${node.delimiter || "matrix"}}${node.rows.map((row) => row.map(serializePdfMathNode).join(" & ")).join(" \\\\ ")}\\end{${node.delimiter || "matrix"}}`;
    case "delimited": return `\\left${node.open === "{" ? "\\{" : node.open}${serializePdfMathNode(node.body)}\\right${node.close === "}" ? "\\}" : node.close}`;
    case "alignment": return `\\begin{aligned}${node.rows.map(serializePdfMathNode).join(" \\\\ ")}\\end{aligned}`;
    case "accent": return `\\${node.accent}{${serializePdfMathNode(node.base)}}`;
  }
}
function warning(code: string, message: string, severity: MathConversionWarning["severity"] = "HIGH"): MathConversionWarning { return { code, message, severity }; }
function box(glyphs: PdfGlyphRun[], pageNumber: number, pageWidth: number, pageHeight: number) { const left = Math.min(...glyphs.map((glyph) => glyph.x)); const right = Math.max(...glyphs.map((glyph) => glyph.x + glyph.width)); const bottom = Math.min(...glyphs.map((glyph) => glyph.y)); const top = Math.max(...glyphs.map((glyph) => glyph.y + glyph.height)); return { page: pageNumber, x: Math.max(0, Math.min(1, left / pageWidth)), y: Math.max(0, Math.min(1, bottom / pageHeight)), width: Math.max(0, Math.min(1, (right - left) / pageWidth)), height: Math.max(0, Math.min(1, (top - bottom) / pageHeight)) }; }

function simpleInlineLatex(source: string): { latex: string; confidence: number; sourceText: string } | null {
  const value = source.trim(); if (!value) return null;
  const matrix = value.match(/^\[([^\[\]]+;[^\[\]]+)\]$/u);
  if (!matrix && !/[=+*/^√²³⁴⁵⁶⁷⁸⁹₀₁₂₃₄₅₆₇₈₉πθ≤≥≠≈±×÷∞∫∑∏→]/u.test(value)) return null;
  if (/^\d{1,4}[-/]\d{1,2}[-/]\d{1,4}$/u.test(value)) return null;
  if (matrix) { const rows = matrix[1].split(";").map((row) => row.trim().split(/\s+/u).join(" & ")).join(" \\\\ "); return { latex: `\\begin{bmatrix}${rows}\\end{bmatrix}`, confidence: 0.9, sourceText: value }; }
  // PDF text producers frequently keep a complete function/script expression
  // in one item (for example `log₂x` or `sin²θ`).  Capture the argument after
  // the script so it is not left behind as unrelated prose.
  const scriptedFunction = value.match(/^([A-Za-z]+)([²³⁴⁵⁶⁷⁸⁹₀₁₂₃₄₅₆₇₈₉]+)([A-Za-z0-9πθ]+)$/u);
  if (scriptedFunction) {
    const name = scriptedFunction[1].toLowerCase();
    const base = Array.from(scriptedFunction[2]).map((char) => superscripts[char] || subscripts[char] || char).join("");
    const argument = normalizeUnicode(scriptedFunction[3]);
    const isSubscript = /[₀₁₂₃₄₅₆₇₈₉]/u.test(scriptedFunction[2]);
    const functionName = ["sin", "cos", "tan", "log", "ln"].includes(name) ? `\\${name}` : name;
    return { latex: `${functionName}${isSubscript ? `_{${base}}` : `^{${base}}`} ${argument}`, confidence: 0.92, sourceText: value };
  }
  const limit = value.match(/^lim\s+([A-Za-z]+)\s*→\s*([A-Za-z0-9πθ]+)/u);
  if (limit) return { latex: `\\lim_{${limit[1]}\\to${normalizeUnicode(limit[2])}}`, confidence: 0.88, sourceText: limit[0] };
  const candidate = value.match(/(?:[A-Za-z0-9πθ√]+[²³⁴⁵⁶⁷⁸⁹₀₁₂₃₄₅₆₇₈₉]+|\([^()]+\)\s*\/\s*\([^()]+\)|[A-Za-z0-9πθ]+(?:\s*[=+*/^×÷≤≥≠≈±]\s*[A-Za-z0-9πθ√²³⁴⁵⁶⁷⁸⁹₀₁₂₃₄₅₆₇₈₉]+)+|[∫∑∏]\s*[A-Za-z0-9πθ√²³⁴⁵⁶⁷⁸⁹₀₁₂₃₄₅₆₇₈₉]+(?:\s+[A-Za-z0-9πθ]+)*)/u)?.[0] || (!/\s/u.test(value) ? value : "");
  if (!candidate) return null;
  let normalized = unicodePowers(normalizeUnicode(candidate)); const fraction = candidate.match(/^\(([^()]*)\)\s*\/\s*\(([^()]*)\)$/u);
  normalized = normalized.replace(/√\s*\(([^()]*)\)/gu, "\\sqrt{$1}").replace(/√\s*([A-Za-z0-9]+)/gu, "\\sqrt{$1}");
  if (fraction) normalized = `\\frac{${fraction[1]}}{${fraction[2]}}`;
  normalized = normalized.replace(/\b(log|ln|sin|cos|tan)_\{([^\x7B\x7D]+)\}\s*([A-Za-z0-9]+)/giu, (_match, name: string, base: string, argument: string) => `\\${name.toLowerCase()}_{${base}} ${argument}`);
  return { latex: normalized.replace(/\s+/gu, " ").trim(), confidence: 0.92, sourceText: candidate };
}
// A PDF text layer may expose a rule as one long dash, several dash glyphs,
// or an underscore run.  Require a wide glyph so ordinary minus signs are not
// interpreted as fraction bars.
function isFractionBar(glyph: PdfGlyphRun) { return /^(?:[-‐‑‒–—―─━═_]+)$/u.test(glyph.text.trim()) && glyph.width >= Math.max(4, glyph.height * 2); }
function horizontalOverlap(a: PdfGlyphRun, b: PdfGlyphRun) { return Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x); }
type PdfLine = { y: number; glyphs: PdfGlyphRun[]; text: string };
function groupLines(glyphs: PdfGlyphRun[]): PdfLine[] { const lines: PdfLine[] = []; for (const glyph of glyphs) { const tolerance = Math.max(2, (glyph.height || 10) * 0.35); const line = lines.find((candidate) => Math.abs(candidate.y - glyph.y) <= tolerance); if (line) line.glyphs.push(glyph); else lines.push({ y: glyph.y, glyphs: [glyph], text: "" }); } for (const line of lines) { line.glyphs.sort((a, b) => a.x - b.x || (a.order ?? 0) - (b.order ?? 0)); line.text = line.glyphs.map((glyph) => glyph.text).join(" ").replace(/\s+/gu, " ").trim(); } return lines.sort((a, b) => b.y - a.y); }
function lineMathNode(line: PdfLine): PdfMathNode { return sequence(line.text); }

function matrixRegion(lines: PdfLine[], pageWidth: number, pageHeight: number): PdfMathRegion | null {
  if (lines.length < 2 || lines.length > 6 || !lines.every((line) => (line.text.startsWith("[") || line.text.startsWith("|")) && (line.text.trimEnd().endsWith("]") || line.text.trimEnd().endsWith("|")))) return null;
  const delimiter = lines.every((line) => line.text.startsWith("|")) ? "vmatrix" : "bmatrix";
  const rows = lines.map((line) => {
    const innerGlyphs = line.glyphs.slice(1, -1);
    const cells = innerGlyphs.length === 1
      ? innerGlyphs[0].text.trim().split(/\s{2,}|\t+/u).filter(Boolean)
      : innerGlyphs.map((glyph) => glyph.text.trim()).filter(Boolean);
    return cells.map((cell) => sequence(cell));
  });
  if (rows.some((row) => row.length < 2) || new Set(rows.map((row) => row.length)).size !== 1) return null;
  const glyphs = lines.flatMap((line) => line.glyphs); const sourceText = lines.map((line) => line.text).join(" ");
  return { sourceText, matchText: sourceText, latex: serializePdfMathNode({ kind: "matrix", rows, delimiter }), origin: "NORMALIZED_SOURCE", confidence: 0.9, boundingBox: box(glyphs, glyphs[0].pageNumber, pageWidth, pageHeight) };
}
function alignedRegion(lines: PdfLine[], pageWidth: number, pageHeight: number): PdfMathRegion | null {
  if (lines.length < 2 || !lines.every((line) => /[=]/u.test(line.text) && simpleInlineLatex(line.text))) return null;
  const starts = lines.map((line) => line.glyphs[0]?.x ?? 0); if (Math.max(...starts) - Math.min(...starts) > 8) return null;
  const glyphs = lines.flatMap((line) => line.glyphs); const sourceText = lines.map((line) => line.text).join(" ");
  return { sourceText, matchText: sourceText, latex: serializePdfMathNode({ kind: "alignment", rows: lines.map(lineMathNode) }), origin: "NORMALIZED_SOURCE", confidence: 0.88, boundingBox: box(glyphs, glyphs[0].pageNumber, pageWidth, pageHeight) };
}

function fractionRegions(glyphs: PdfGlyphRun[], lines: PdfLine[], pageWidth: number, pageHeight: number): PdfMathRegion[] {
  const regions: PdfMathRegion[] = [];
  const bars = glyphs.filter(isFractionBar);
  const build = (bar: PdfGlyphRun, visiting = new Set<PdfGlyphRun>()): { latex: string; sourceText: string; glyphs: PdfGlyphRun[]; confidence: number } | null => {
    if (visiting.has(bar)) return null;
    const nextVisiting = new Set(visiting).add(bar);
    const overlap = (line: PdfLine) => line.glyphs.some((glyph) => horizontalOverlap(glyph, bar) > Math.min(glyph.width, bar.width) * 0.35);
    const above = lines.filter((line) => line.y > bar.y && overlap(line)).sort((a, b) => a.y - b.y)[0];
    const below = lines.filter((line) => line.y < bar.y && overlap(line)).sort((a, b) => b.y - a.y)[0];
    if (!above || !below) return null;
    // A nested denominator has its own bar below the outer bar and below the
    // first denominator line (the latter is the nested numerator).
    const nestedBar = bars.filter((candidate) => candidate !== bar && candidate.y < below.y && horizontalOverlap(candidate, bar) > Math.min(candidate.width, bar.width) * 0.35).sort((a, b) => b.y - a.y)[0];
    const nested = nestedBar ? build(nestedBar, nextVisiting) : null;
    const denominatorLatex = nested?.latex || serializePdfMathNode(lineMathNode(below));
    const used = nested ? [...above.glyphs, bar, ...nested.glyphs] : [...above.glyphs, bar, ...below.glyphs];
    return { latex: serializePdfMathNode({ kind: "fraction", numerator: lineMathNode(above), denominator: nodeText(denominatorLatex) }), sourceText: used.map((glyph) => glyph.text).join(" ").replace(/\s+/gu, " ").trim(), glyphs: used, confidence: nested ? 0.86 : 0.93 };
  };
  for (const bar of bars) {
    const result = build(bar);
    if (!result) continue;
    regions.push({ sourceText: result.sourceText, matchText: result.sourceText, latex: result.latex, origin: "NORMALIZED_SOURCE", confidence: result.confidence, ...(result.confidence < 0.9 ? { warnings: [warning("AMBIGUOUS_NESTED_FRACTION", "Nested PDF fraction grouping should be verified.")] } : {}), boundingBox: box(result.glyphs, bar.pageNumber, pageWidth, pageHeight) });
  }
  return regions;
}
function largeOperatorRegions(glyphs: PdfGlyphRun[], pageWidth: number, pageHeight: number): PdfMathRegion[] {
  const regions: PdfMathRegion[] = [];
  for (const operatorGlyph of glyphs.filter((glyph) => /^[∫∑∏]$/u.test(glyph.text.trim()) || /^lim$/iu.test(glyph.text.trim()))) {
    const operator = /^lim$/iu.test(operatorGlyph.text.trim()) ? "\\lim" : operatorGlyph.text === "∫" ? "\\int" : operatorGlyph.text === "∏" ? "\\prod" : "\\sum";
    const nearby = glyphs.filter((glyph) => glyph !== operatorGlyph && glyph.pageNumber === operatorGlyph.pageNumber && Math.abs(glyph.x - operatorGlyph.x) <= Math.max(operatorGlyph.width * 2, 12));
    const lower = nearby.filter((glyph) => glyph.y + glyph.height < operatorGlyph.y + operatorGlyph.height * 0.45 && glyph.height <= operatorGlyph.height * 0.8).sort((a, b) => b.y - a.y)[0];
    const upper = nearby.filter((glyph) => glyph.y > operatorGlyph.y + operatorGlyph.height * 0.45 && glyph.height <= operatorGlyph.height * 0.8).sort((a, b) => a.y - b.y)[0];
    const body = glyphs.filter((glyph) => glyph.pageNumber === operatorGlyph.pageNumber && glyph.x > operatorGlyph.x + operatorGlyph.width && Math.abs(glyph.y - operatorGlyph.y) <= operatorGlyph.height).sort((a, b) => a.x - b.x)[0];
    if (!body && !lower && !upper) continue;
    const used = [operatorGlyph, ...(lower ? [lower] : []), ...(upper ? [upper] : []), ...(body ? [body] : [])]; const sourceText = used.map((glyph) => glyph.text).join(" ");
    regions.push({ sourceText, matchText: sourceText, latex: serializePdfMathNode({ kind: "largeOperator", operator, body: body ? sequence(body.text) : nodeText("?"), ...(lower ? { lower: sequence(lower.text) } : {}), ...(upper ? { upper: sequence(upper.text) } : {}) }), origin: "NORMALIZED_SOURCE", confidence: lower || upper ? 0.88 : 0.82, ...(lower || upper ? {} : { warnings: [warning("LARGE_OPERATOR_BODY_UNCERTAIN", "The body of this PDF operator needs review.")] }), boundingBox: box(used, operatorGlyph.pageNumber, pageWidth, pageHeight) });
  }
  return regions;
}

export function reconstructPdfMath(glyphs: PdfGlyphRun[], pageWidth = Math.max(1, ...glyphs.map((glyph) => glyph.x + glyph.width)), pageHeight = Math.max(1, ...glyphs.map((glyph) => glyph.y + glyph.height))): PdfMathRegion[] {
  if (!glyphs.length) return [];
  const lines = groupLines(glyphs); const regions: PdfMathRegion[] = [];
  // Scan small adjacent line windows so a matrix/equation embedded in a full
  // question page is isolated instead of requiring the entire page to match.
  let matrix: PdfMathRegion | null = null;
  for (let start = 0; start < lines.length && !matrix; start += 1) for (let size = Math.min(6, lines.length - start); size >= 2 && !matrix; size -= 1) matrix = matrixRegion(lines.slice(start, start + size), pageWidth, pageHeight);
  if (matrix) regions.push(matrix);
  let aligned: PdfMathRegion | null = null;
  if (!matrix) for (let start = 0; start < lines.length && !aligned; start += 1) if (lines.slice(start, start + 2).length === 2) aligned = alignedRegion(lines.slice(start, start + 2), pageWidth, pageHeight);
  if (aligned) regions.push(aligned);
  regions.push(...fractionRegions(glyphs, lines, pageWidth, pageHeight), ...largeOperatorRegions(glyphs, pageWidth, pageHeight));
  const ordered = [...glyphs].sort((a, b) => a.pageNumber - b.pageNumber || a.x - b.x || (a.order ?? 0) - (b.order ?? 0));
  for (let index = 0; index < ordered.length; index += 1) {
    const glyph = ordered[index]; const direct = simpleInlineLatex(glyph.text);
    if (direct) regions.push({ sourceText: direct.sourceText, matchText: direct.sourceText, latex: direct.latex, origin: "NORMALIZED_SOURCE", confidence: direct.confidence, boundingBox: box([glyph], glyph.pageNumber, pageWidth, pageHeight) });
    else if (glyph.text.trim().length <= 40 && (/[∫∑∏√]/u.test(glyph.text) || (glyph.text.match(/[=+*/^]/gu) || []).length >= 2)) {
      const sourceText = glyph.text.trim();
      regions.push({ sourceText, matchText: sourceText, latex: normalizeUnicode(sourceText), origin: "NORMALIZED_SOURCE", confidence: 0.55, warnings: [warning("MATH_EXPRESSION_NEEDS_REVIEW", "PDF math layout could not be reconstructed with high confidence; verify this expression.")], boundingBox: box([glyph], glyph.pageNumber, pageWidth, pageHeight) });
    }
    const next = ordered[index + 1]; if (!next || next.pageNumber !== glyph.pageNumber || next.x < glyph.x + glyph.width - 1) continue;
    const above = next.y > glyph.y + glyph.height * 0.45 && next.height <= glyph.height * 0.8; const below = next.y + next.height < glyph.y + glyph.height * 0.55 && next.height <= glyph.height * 0.8;
    if (!above && !below) continue;
    // A root sign and its radicand are commonly emitted as adjacent PDF text
    // items.  The horizontal adjacency plus shared baseline is sufficient to
    // form a conservative root region; longer/ambiguous radicands stay as
    // source text for review.
    if (glyph.text.trim() === "√" && !above && !below && next.x >= glyph.x + glyph.width - 1 && Math.abs(next.y - glyph.y) <= glyph.height * 0.45) {
      const radicand = normalizeUnicode(next.text);
      regions.push({ sourceText: `${glyph.text}${next.text}`, matchText: `${glyph.text} ${next.text}`, latex: `\\sqrt{${radicand}}`, origin: "NORMALIZED_SOURCE", confidence: 0.9, boundingBox: box([glyph, next], glyph.pageNumber, pageWidth, pageHeight) });
      continue;
    }
    const base = normalizeUnicode(glyph.text), script = normalizeUnicode(next.text); if (!/^[A-Za-z0-9]+$/u.test(base) || !/^[A-Za-z0-9+\-=]+$/u.test(script)) continue;
    const nextNext = ordered[index + 2];
    if (nextNext && nextNext.pageNumber === glyph.pageNumber && nextNext.x >= glyph.x + glyph.width - 1 && nextNext.height <= glyph.height * 0.8 && Math.abs(nextNext.y - glyph.y) > glyph.height * 0.45) {
      const secondAbove = nextNext.y > glyph.y + glyph.height * 0.45;
      const secondBelow = nextNext.y + nextNext.height < glyph.y + glyph.height * 0.55;
      const secondScript = normalizeUnicode(nextNext.text);
      if ((above && secondBelow || below && secondAbove) && /^[A-Za-z0-9+\-=]+$/u.test(secondScript)) {
        const sub = below ? script : secondScript;
        const sup = above ? script : secondScript;
        regions.push({ sourceText: `${glyph.text}${next.text}${nextNext.text}`, matchText: `${glyph.text} ${next.text} ${nextNext.text}`, latex: `${base}_{${sub}}^{${sup}}`, origin: "NORMALIZED_SOURCE", confidence: 0.9, boundingBox: box([glyph, next, nextNext], glyph.pageNumber, pageWidth, pageHeight) });
        continue;
      }
    }
    const scriptedBase = base.toLowerCase() === "log" ? "\\log" : base;
    regions.push({ sourceText: `${glyph.text}${next.text}`, matchText: `${glyph.text} ${next.text}`, latex: `${scriptedBase}${above ? `^{${script}}` : `_{${script}}`}`, origin: "NORMALIZED_SOURCE", confidence: 0.94, boundingBox: box([glyph, next], glyph.pageNumber, pageWidth, pageHeight) });
  }
  const seen = new Set<string>();
  const pageHasSuspectEncoding = ordered.some((glyph) => isSuspectPdfText(glyph));
  return regions
    .map((region) => {
      const suspectGlyph = ordered.find((glyph) => isSuspectPdfText(glyph) && (region.sourceText.includes(glyph.text) || Boolean(glyph.rawText && region.sourceText.includes(glyph.rawText))));
      if (!suspectGlyph && !pageHasSuspectEncoding) return region;
      const encodingWarning = warning("PDF_GLYPH_ENCODING_NEEDS_REVIEW", "This PDF page contains an unreliable glyph mapping; verify the mathematical expression.");
      return { ...region, confidence: Math.min(region.confidence ?? 0.5, 0.55), warnings: [...(region.warnings || []), encodingWarning] };
    })
    .filter((region) => { const key = `${region.sourceText}|${region.latex}|${region.boundingBox.page}|${region.boundingBox.x.toFixed(4)}|${region.boundingBox.y.toFixed(4)}`; if (seen.has(key)) return false; seen.add(key); return Boolean(region.latex.trim()); });
}
export function analyzePdfMathRegions(glyphs: PdfGlyphRun[], pageWidth?: number, pageHeight?: number) { const regions = reconstructPdfMath(glyphs, pageWidth, pageHeight); return { regions, mathRegionsDetected: regions.length, mathRegionsCanonicalized: regions.filter((region) => (region.confidence ?? 0) >= 0.9).length, mathRegionsReviewRequired: regions.filter((region) => (region.confidence ?? 0) < 0.9 || Boolean(region.warnings?.length)).length }; }
