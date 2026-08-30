import { buildLegacyQuestionContent, type MathConversionWarning, type MathSegmentHint } from "../document-intelligence/question-content.schema.js";
import { analyzePdfPage } from "./pdf-layout-analysis.js";
import type { PdfGlyphRun } from "./pdf-math-reconstruction.js";
import { decodePdfTextItem } from "./pdf-text-decoding.js";
import { detectPdfVisualRegions, questionRequiresVisual, renderPdfVisualCrops, visualStats, type PdfVisualRegion, type PdfVisualStats } from "./pdf-visual-analysis.js";
import { recognizePdfPageWithOcr, shouldUsePdfOcrFallback, type PdfOcrPageResult } from "./pdf-ocr-fallback.js";

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
  contentJson?: unknown;
  visualAssets?: PdfVisualRegion[];
  visualReviewRequired?: boolean;
  visualReviewNotes?: string[];
  ocrReviewRequired?: boolean;
  ocrReviewNotes?: string[];
  ocrConfidence?: number | null;
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
  glyphs?: PdfGlyphRun[];
  mathSegments?: MathSegmentHint[];
  mathStats?: { mathRegionsDetected: number; mathRegionsCanonicalized: number; mathRegionsReviewRequired: number; totalTextItems: number; suspectTextItems: number; privateUseGlyphs: number; replacementCharacters: number; encodingWarnings: number };
  encodingStatus?: "TEXT_LAYER_OK" | "GLYPH_ENCODING_SUSPECT" | "MATH_LAYOUT_AMBIGUOUS" | "VISUAL_ONLY_CONTENT";
  visualRegions?: PdfVisualRegion[];
  visualStats?: PdfVisualStats;
  ocr?: { text: string; rawText: string; normalizedText: string; confidence: number | null; providerId: string; reviewRequired: boolean; reviewNotes: string[]; warnings: string[]; blocks: Array<{ type: "line"; text: string; order: number; boundingBox?: { x: number; y: number; width: number; height: number } }> };
};

export type ExtractedPdf = { pages: NormalizedDocumentPage[]; textCharacters: number; visualStats?: PdfVisualStats; ocrStats?: { pagesNative: number; pagesOCR: number; ocrTextRegions: number; ocrMathRegions: number; ocrReviewRequired: number; ocrUnreadableRegions: number } };
export type ExtractedDocument = ExtractedPdf;

function normalizeDocumentText(value: string, form: "NFKC" | "NFC" = "NFKC") {
  return value
    // PDF math relies on compatibility glyphs (², ₁, √, …) as evidence.
    // Preserve those glyphs for positioned PDF text while retaining the
    // historical NFKC normalization for DOC/DOCX prose.
    .normalize(form)
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

function normalizedPage(pageNumber: number, rawText: string, blocks?: NormalizedDocumentBlock[], normalizationForm: "NFKC" | "NFC" = "NFKC") {
  const text = normalizeDocumentText(rawText, normalizationForm);
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

type OmmlNode = { name: string; attrs: Record<string, string>; children: OmmlNode[]; text?: string };
export type MathConversionResult = { latex: string; sourceText?: string; confidence: number; warnings?: MathConversionWarning[] };
const emptyOmmlNode = (): OmmlNode => ({ name: "#empty", attrs: {}, children: [] });

const mathSymbolMap: Record<string, string> = { "π": "\\pi", "θ": "\\theta", "α": "\\alpha", "β": "\\beta", "γ": "\\gamma", "δ": "\\delta", "Δ": "\\Delta", "λ": "\\lambda", "μ": "\\mu", "σ": "\\sigma", "Σ": "\\Sigma", "Ω": "\\Omega", "∞": "\\infty", "≤": "\\le", "≥": "\\ge", "≠": "\\ne", "≈": "\\approx", "±": "\\pm", "∈": "\\in", "∉": "\\notin", "∪": "\\cup", "∩": "\\cap", "→": "\\to", "←": "\\leftarrow", "⇒": "\\Rightarrow", "⇔": "\\Leftrightarrow", "×": "\\times", "÷": "\\div", "−": "-" };
const accentMap: Record<string, string> = { "¯": "\\bar", "‾": "\\bar", "^": "\\hat", "⃗": "\\vec", "~": "\\tilde", "˙": "\\dot", "¨": "\\ddot" };

const unicodeMathSymbolMap: Record<string, string> = {
  "\u03c0": "\\pi", "\u03b8": "\\theta", "\u03b1": "\\alpha", "\u03b2": "\\beta", "\u03b3": "\\gamma", "\u03b4": "\\delta", "\u0394": "\\Delta", "\u03bb": "\\lambda", "\u03bc": "\\mu", "\u03c3": "\\sigma", "\u03a3": "\\Sigma", "\u03a9": "\\Omega", "\u221e": "\\infty", "\u2264": "\\le", "\u2265": "\\ge", "\u2260": "\\ne", "\u2248": "\\approx", "\u00b1": "\\pm", "\u2208": "\\in", "\u2209": "\\notin", "\u222a": "\\cup", "\u2229": "\\cap", "\u2192": "\\to", "\u2190": "\\leftarrow", "\u21d2": "\\Rightarrow", "\u21d4": "\\Leftrightarrow", "\u00d7": "\\times", "\u00f7": "\\div", "\u2212": "-"
};

function parseOmmlXml(xml: string): OmmlNode[] {
  const roots: OmmlNode[] = [], stack: OmmlNode[] = [], attrPattern = /([:\w-]+)=(?:"([^"]*)"|'([^']*)')/g;
  for (const token of xml.matchAll(/<[^>]+>|[^<]+/g)) {
    const raw = token[0];
    if (!raw.startsWith("<")) { if (stack.length) stack[stack.length - 1].children.push({ name: "#text", attrs: {}, children: [], text: decodeXml(raw) }); continue; }
    if (/^<\/?[!?]/.test(raw)) continue;
    if (/^<\//.test(raw)) { stack.pop(); continue; }
    const selfClosing = /\/\s*>$/.test(raw), match = raw.match(/^<\s*([^\s/>]+)/); if (!match) continue;
    const attrs: Record<string, string> = {}; for (const attr of raw.matchAll(attrPattern)) attrs[attr[1]] = decodeXml(attr[2] ?? attr[3] ?? "");
    const node: OmmlNode = { name: match[1], attrs, children: [] }; if (stack.length) stack[stack.length - 1].children.push(node); else roots.push(node); if (!selfClosing) stack.push(node);
  }
  return roots;
}

function child(node: OmmlNode, name: string) { return node.children.find((item) => item.name === name); }
function children(node: OmmlNode, name: string) { return node.children.filter((item) => item.name === name); }
function textOf(node: OmmlNode): string { return node.name === "#text" ? node.text || "" : node.children.map(textOf).join(""); }
function normalizeMathText(value: string) { return Array.from(value).map((symbol) => unicodeMathSymbolMap[symbol] || mathSymbolMap[symbol] || symbol).join("").replace(/\s+/g, " ").trim(); }
function group(value: string) { return `{${value || "\\text{?}"}}`; }
function combine(results: MathConversionResult[]): MathConversionResult { const warnings = results.flatMap((result) => result.warnings || []); return { latex: results.map((result) => result.latex).join(""), sourceText: results.map((result) => result.sourceText || "").join(""), confidence: results.length ? Math.min(...results.map((result) => result.confidence)) : 1, ...(warnings.length ? { warnings } : {}) }; }
function warning(code: string, message: string, severity: MathConversionWarning["severity"] = "MEDIUM"): MathConversionWarning { return { code, message, severity }; }

export function convertOmmlNode(node: OmmlNode): MathConversionResult {
  if (node.name === "#text") return { latex: normalizeMathText(node.text || ""), sourceText: node.text || "", confidence: 1 };
  const convert = (item?: OmmlNode): MathConversionResult => item ? convertOmmlNode(item) : { latex: "", sourceText: "", confidence: 0.4, warnings: [warning("MISSING_OMML_CHILD", "An expected equation component is missing.", "HIGH")] };
  const all = () => combine(node.children.filter((item) => item.name !== "m:rPr" && item.name !== "m:ctrlPr" && !item.name.startsWith("w:") && !item.name.endsWith("Pr")).map(convertOmmlNode));
  switch (node.name) {
    case "m:t": return { latex: normalizeMathText(textOf(node)), sourceText: textOf(node), confidence: 1 };
    case "m:r": case "m:e": case "m:num": case "m:den": case "m:sub": case "m:sup": case "m:deg": case "m:lim": case "m:arg": return all();
    case "m:f": { const n = convert(child(node, "m:num")), d = convert(child(node, "m:den")); return { ...combine([n, d]), latex: `\\frac${group(n.latex)}${group(d.latex)}` }; }
    case "m:sSup": { const b = convert(child(node, "m:e")), s = convert(child(node, "m:sup")); return { ...combine([b, s]), latex: `${group(b.latex)}^${group(s.latex)}` }; }
    case "m:sSub": { const b = convert(child(node, "m:e")), s = convert(child(node, "m:sub")); return { ...combine([b, s]), latex: `${group(b.latex)}_${group(s.latex)}` }; }
    case "m:sSubSup": { const b = convert(child(node, "m:e")), sub = convert(child(node, "m:sub")), sup = convert(child(node, "m:sup")); return { ...combine([b, sub, sup]), latex: `${group(b.latex)}_${group(sub.latex)}^${group(sup.latex)}` }; }
    case "m:rad": { const d = child(node, "m:deg"), e = convert(child(node, "m:e")), candidateDegree = d ? convert(d) : undefined, degree = candidateDegree?.latex.trim() ? candidateDegree : undefined; return { ...combine(degree ? [degree, e] : [e]), latex: degree ? `\\sqrt[${degree.latex}]${group(e.latex)}` : `\\sqrt${group(e.latex)}` }; }
    case "m:fName": { const name = textOf(node).trim(), known = ["sin", "cos", "tan", "cot", "sec", "csc", "log", "ln", "lim", "max", "min"].includes(name.toLowerCase()); return { latex: known ? `\\${name.toLowerCase()} ` : `\\operatorname{${name}} `, sourceText: name, confidence: 1 }; }
    case "m:func": { const fn = convert(child(node, "m:fName")), arg = convert(child(node, "m:e")); return { ...combine([fn, arg]), latex: `${fn.latex}${arg.latex}` }; }
    case "m:nary": { const props = child(node, "m:naryPr"), chr = child(props || emptyOmmlNode(), "m:chr")?.attrs["m:val"] || "∑", operator = ({ "∫": "\\int", "∑": "\\sum", "∏": "\\prod", "∮": "\\oint" } as Record<string, string>)[chr] || `\\operatorname{${chr}}`, sub = child(node, "m:sub"), sup = child(node, "m:sup"), e = convert(child(node, "m:e")), sr = sub ? convert(sub) : undefined, ur = sup ? convert(sup) : undefined; return { ...combine([...(sr ? [sr] : []), ...(ur ? [ur] : []), e]), latex: `${operator}${sr ? `_${group(sr.latex)}` : ""}${ur ? `^${group(ur.latex)}` : ""} ${e.latex}` }; }
    case "m:limLow": { const b = convert(child(node, "m:e")), s = convert(child(node, "m:lim") || child(node, "m:sub")); return { ...combine([b, s]), latex: `${group(b.latex)}_${group(s.latex)}` }; }
    case "m:limUpp": { const b = convert(child(node, "m:e")), s = convert(child(node, "m:lim") || child(node, "m:sup")); return { ...combine([b, s]), latex: `${group(b.latex)}^${group(s.latex)}` }; }
    case "m:mc": return all();
    case "m:m": { const rows = children(node, "m:mr").map((row) => { const cells = children(row, "m:e").length ? children(row, "m:e") : children(row, "m:mc"); return cells.map((cell) => convert(cell).latex).join(" & "); }).join(" \\\\ "); return { latex: `\\begin{matrix}${rows}\\end{matrix}`, sourceText: textOf(node), confidence: 1 }; }
    case "m:eqArr": { const rows = children(node, "m:e").map((row) => convert(row).latex).join(" \\\\ "); return { latex: `\\begin{aligned}${rows}\\end{aligned}`, sourceText: textOf(node), confidence: 1 }; }
    case "m:d": { const props = child(node, "m:dPr"), begin = child(props || emptyOmmlNode(), "m:begChr")?.attrs["m:val"] || "(", end = child(props || emptyOmmlNode(), "m:endChr")?.attrs["m:val"] || ")", body = child(node, "m:e"), inner = convert(body), matrix = body && child(body, "m:m"); if (matrix && begin === "[" && end === "]") return { ...inner, latex: inner.latex.replace(/^\\begin\{matrix\}/, "\\begin{bmatrix}").replace(/\\end\{matrix\}$/, "\\end{bmatrix}") }; if (matrix && begin === "|" && end === "|") return { ...inner, latex: inner.latex.replace(/^\\begin\{matrix\}/, "\\begin{vmatrix}").replace(/\\end\{matrix\}$/, "\\end{vmatrix}") }; if (matrix && begin === "{" && end === "}") return { ...inner, latex: inner.latex.replace(/^\\begin\{matrix\}/, "\\begin{cases}").replace(/\\end\{matrix\}$/, "\\end{cases}") }; return { ...inner, latex: `\\left${begin === "{" ? "\\{" : begin}${inner.latex}\\right${end === "}" ? "\\}" : end}` }; }
    case "m:bar": { const b = convert(child(node, "m:e")); return { ...b, latex: `\\bar${group(b.latex)}` }; }
    case "m:acc": { const b = convert(child(node, "m:e")), chr = child(child(node, "m:accPr") || emptyOmmlNode(), "m:chr")?.attrs["m:val"] || "^", op = accentMap[chr]; return { ...b, latex: op ? `${op}${group(b.latex)}` : `\\operatorname{${chr}}${group(b.latex)}`, ...(op ? {} : { confidence: 0.6, warnings: [warning("UNSUPPORTED_OMML_ACCENT", "This equation accent needs review.")] }) }; }
    case "m:groupChr": { const b = convert(child(node, "m:e")), chr = child(child(node, "m:groupChrPr") || emptyOmmlNode(), "m:chr")?.attrs["m:val"] || "", op = chr === "⏞" ? "\\overbrace" : chr === "⏟" ? "\\underbrace" : "\\overline"; return { ...b, latex: `${op}${group(b.latex)}` }; }
    default: { const fallback = all(), readable = fallback.sourceText || textOf(node), issue = warning("UNSUPPORTED_OMML_ELEMENT", `Unsupported Office Math element ${node.name} was preserved for review.`); return { latex: fallback.latex || normalizeMathText(readable), sourceText: readable, confidence: Math.min(fallback.confidence, 0.7), warnings: [...(fallback.warnings || []), issue] }; }
  }
}

export function convertOfficeMathFragment(fragment: string): MathConversionResult { const result = combine(parseOmmlXml(fragment).map(convertOmmlNode)); return { ...result, latex: result.latex.trim(), sourceText: result.sourceText?.trim() }; }

export function renderOfficeMathFragment(fragment: string): string {
  return convertOfficeMathFragment(fragment).latex;
}

/**
 * Mammoth intentionally prioritizes readable prose and may omit Office Math
 * runs. Read the document XML as a small, dependency-light supplement so
 * m:t math text remains in the normalized representation. This is not an XML
 * renderer: unsupported drawing/image content is left for review.
 */
export async function extractDocxXmlParagraphs(buffer: Buffer, jszipOverride?: JsZipModule) {
  try {
    const module = jszipOverride ?? await loadJsZip();
    const jszip = (module as unknown as { default?: JsZipModule }).default ?? module;
    const zip = await jszip.loadAsync(buffer);
    const entry = zip.file("word/document.xml");
    if (!entry) return "";
    const numberingEntry = zip.file("word/numbering.xml");
    const numberingXml = numberingEntry ? await numberingEntry.async("string") : "";
    const abstractLevels = new Map<string, Map<number, { start: number; format: string; template: string }>>();
    for (const abstractMatch of numberingXml.matchAll(/<w:abstractNum\b[^>]*w:abstractNumId="(\d+)"[^>]*>([\s\S]*?)<\/w:abstractNum>/g)) {
      const levels = new Map<number, { start: number; format: string; template: string }>();
      for (const levelMatch of abstractMatch[2].matchAll(/<w:lvl\b[^>]*w:ilvl="(\d+)"[^>]*>([\s\S]*?)<\/w:lvl>/g)) {
        const body = levelMatch[2];
        levels.set(Number(levelMatch[1]), {
          start: Number(body.match(/<w:start\b[^>]*w:val="(\d+)"/)?.[1] || 1),
          format: body.match(/<w:numFmt\b[^>]*w:val="([^"]+)"/)?.[1] || "decimal",
          template: decodeXml(body.match(/<w:lvlText\b[^>]*w:val="([^"]*)"/)?.[1] || `%${Number(levelMatch[1]) + 1}.`),
        });
      }
      abstractLevels.set(abstractMatch[1], levels);
    }
    const numbering = new Map<string, Map<number, { start: number; format: string; template: string }>>();
    for (const numMatch of numberingXml.matchAll(/<w:num\b[^>]*w:numId="(\d+)"[^>]*>([\s\S]*?)<\/w:num>/g)) {
      const abstractId = numMatch[2].match(/<w:abstractNumId\b[^>]*w:val="(\d+)"/)?.[1];
      if (abstractId && abstractLevels.has(abstractId)) numbering.set(numMatch[1], abstractLevels.get(abstractId)!);
    }
    const counters = new Map<string, number>();
    const alpha = (value: number) => String.fromCharCode(96 + Math.max(1, Math.min(26, value)));
    const roman = (value: number) => {
      const pairs: Array<[number, string]> = [[1000, "m"], [900, "cm"], [500, "d"], [400, "cd"], [100, "c"], [90, "xc"], [50, "l"], [40, "xl"], [10, "x"], [9, "ix"], [5, "v"], [4, "iv"], [1, "i"]];
      let remaining = value;
      return pairs.map(([amount, symbol]) => { const count = Math.floor(remaining / amount); remaining %= amount; return symbol.repeat(count); }).join("");
    };
    const formatCounter = (value: number, format: string) => format === "lowerLetter" ? alpha(value) : format === "upperLetter" ? alpha(value).toUpperCase() : format === "lowerRoman" ? roman(value) : format === "upperRoman" ? roman(value).toUpperCase() : String(value);
    const xml = (await entry.async("string")).replace(/<m:oMath\b[^>]*>([\s\S]*?)<\/m:oMath>/g, (_, body: string) => {
      const converted = convertOfficeMathFragment(body);
      // Keep an internal, lossless marker until question parsing so the
      // canonical adapter can distinguish OMML math from ordinary text.
      const encoded = Buffer.from(JSON.stringify(converted), "utf8").toString("base64");
      return `<w:t>[[NIDUS_OMML:${encoded}]]</w:t>`;
    });
    const paragraphs: string[] = [];
    for (const paragraph of xml.matchAll(/<w:p\b[^>]*>[\s\S]*?<\/w:p>/g)) {
      const tokens: string[] = [];
      for (const token of paragraph[0].matchAll(/<(?:w|m):t\b[^>]*>([\s\S]*?)<\/(?:w|m):t>|<w:tab\b[^>]*\/?\s*>|<w:(?:br|cr)\b[^>]*\/?\s*>/g)) {
        if (token[1] !== undefined) tokens.push(decodeXml(token[1]));
        else tokens.push(/^<w:tab\b/.test(token[0]) ? "\t" : "\n");
      }
      let text = tokens.join("").trim();
      const numId = paragraph[0].match(/<w:numId\b[^>]*w:val="(\d+)"/)?.[1];
      const level = Number(paragraph[0].match(/<w:ilvl\b[^>]*w:val="(\d+)"/)?.[1] || 0);
      const levelDefinition = numId ? numbering.get(numId)?.get(level) : undefined;
      if (text && numId && levelDefinition && levelDefinition.format !== "bullet") {
        const counterKey = `${numId}:${level}`;
        const value = counters.has(counterKey) ? (counters.get(counterKey) || 0) + 1 : levelDefinition.start;
        counters.set(counterKey, value);
        const marker = levelDefinition.template.replace(new RegExp(`%${level + 1}`, "g"), formatCounter(value, levelDefinition.format));
        text = `${marker} ${text}`;
      }
      if (text) paragraphs.push(text);
    }
    return paragraphs.join("\n");
  } catch {
    return "";
  }
}

function pdfError(error: unknown) {
  const message = error instanceof Error ? error.message : "PDF parsing failed";
  if (/password/i.test(message)) return Object.assign(new Error("This PDF is password protected. Upload an unlocked PDF."), { statusCode: 422, code: "PDF_PASSWORD_PROTECTED", stage: "DOCUMENT_OPEN" });
  return Object.assign(new Error("This PDF could not be opened or decoded. Upload a valid text-based PDF."), { statusCode: 422, code: "PDF_DOCUMENT_OPEN_FAILED", stage: "DOCUMENT_OPEN" });
}

export async function extractTextPdf(buffer: Buffer): Promise<ExtractedPdf> {
  if (buffer.subarray(0, 4).toString("utf8") !== "%PDF") {
    throw Object.assign(new Error("Uploaded source is not a valid PDF."), { statusCode: 415, code: "PDF_SIGNATURE_INVALID", stage: "FILE_VALIDATION" });
  }
  try {
    const pdfjs = await loadPdfJs();
    const document = await pdfjs.getDocument({ data: new Uint8Array(buffer), disableFontFace: true, useSystemFonts: true }).promise;
    const pages: ExtractedPdf["pages"] = [];
    let pagesNative = 0;
    let pagesOCR = 0;
    let ocrTextRegions = 0;
    let ocrMathRegions = 0;
    let ocrReviewRequired = 0;
    let ocrUnreadableRegions = 0;
    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
      const page = await document.getPage(pageNumber);
      const content = await page.getTextContent();
      const viewport = page.getViewport({ scale: 1 });
      const glyphs = content.items
        .map((item, order): PdfGlyphRun | null => {
          if (!("str" in item) || !item.str) return null;
          const transform = "transform" in item && Array.isArray(item.transform) ? Array.from(item.transform) : [];
          const height = Number(("height" in item ? item.height : 0) || 0);
          const fontSize = transform.length >= 2
            ? Math.hypot(Number(transform[0] ?? 0), Number(transform[1] ?? 0)) || height
            : height;
          const decoded = decodePdfTextItem(item.str);
          return {
            text: decoded.normalizedText,
            rawText: decoded.rawText,
            normalizedText: decoded.normalizedText,
            pageNumber,
            x: Number(transform[4] ?? 0),
            y: Number(transform[5] ?? 0),
            width: Number(("width" in item ? item.width : 0) || 0),
            height: height || fontSize || 10,
            fontSize: fontSize || undefined,
            fontName: "fontName" in item ? String(item.fontName || "") : undefined,
            transform,
            order,
            sourceOrder: order,
            encodingStatus: decoded.encodingStatus,
            warnings: decoded.warnings,
          };
        })
        .filter((item): item is PdfGlyphRun => Boolean(item));
      const analysis = analyzePdfPage(glyphs, viewport.width, viewport.height);
      let ocr: PdfOcrPageResult | undefined;
      if (shouldUsePdfOcrFallback({ text: analysis.text, encodingStatus: analysis.encodingStatus }) && pagesOCR < Number(process.env.NDIE_OCR_MAX_PAGES || 20)) {
        try {
          ocr = await recognizePdfPageWithOcr(page, pageNumber);
          pagesOCR += 1;
          if (ocr.text) ocrTextRegions += 1;
          if (/[²³ⁿ₀₁₂₃√∫∑∏πθ≤≥≠≈±×÷∞]|\\(?:frac|sqrt|int|sum|prod|lim|log|sin|cos)/u.test(ocr.text)) ocrMathRegions += 1;
          if (ocr.reviewRequired) ocrReviewRequired += 1;
          if (ocr.reviewNotes.includes("OCR_REGION_UNREADABLE")) ocrUnreadableRegions += 1;
        } catch (error) {
          pagesOCR += 1;
          ocrReviewRequired += 1;
          ocrUnreadableRegions += 1;
          ocr = {
            text: "", rawText: "", normalizedText: "", confidence: null, providerId: "ocr.unavailable",
            reviewRequired: true, reviewNotes: ["OCR_REGION_UNREADABLE"],
            warnings: [error instanceof Error ? error.message : "OCR could not process this page."], blocks: [],
          };
        }
      } else {
        pagesNative += 1;
      }
      const pageText = ocr?.text || analysis.text;
      const pageBlocks = ocr?.blocks?.length ? ocr.blocks : analysis.lines.map((line, order) => ({ type: "line" as const, text: line.text, order }));
      let visualRegions: PdfVisualRegion[] = [];
      try {
        const operatorList = await page.getOperatorList();
        visualRegions = detectPdfVisualRegions({
          pageNumber,
          pageWidth: viewport.width,
          pageHeight: viewport.height,
          operatorList,
          ops: pdfjs.OPS as unknown as Record<string, number>,
          sourceText: analysis.text,
        });
      } catch {
        // PDF.js can expose text while denying operator/image access for a
        // malformed page. Text extraction must remain usable; review metadata
        // is added by the question parser when the text references a visual.
        visualRegions = [];
      }
      if (visualRegions.length) {
        try {
          const crops = await renderPdfVisualCrops(page, visualRegions);
          visualRegions = visualRegions.map((region, index) => ({
            ...region,
            ...(crops[index] ? {
              cropBuffer: crops[index].buffer,
              cropMimeType: crops[index].mimeType,
              cropWidth: crops[index].width,
              cropHeight: crops[index].height,
            } : {}),
          }));
        } catch (error) {
          // A page may expose image operators but fail raster rendering. Keep
          // the evidence box and force review rather than dropping the visual.
          const message = error instanceof Error ? error.message : "PDF visual crop could not be rendered.";
          visualRegions = visualRegions.map((region) => ({
            ...region,
            reviewRequired: true,
            warnings: [...(region.warnings || []), message],
          }));
        }
      }
      // Keep a rendered source page for OCR review when the text layer was
      // unavailable or the recognition needs confirmation. It is evidence,
      // not a semantic interpretation, and is intentionally marked for review.
      if (ocr?.crop && ocr.reviewRequired && !visualRegions.some((region) => region.id === `pdf-${pageNumber}-ocr-source`)) {
        visualRegions.push({
          id: `pdf-${pageNumber}-ocr-source`,
          pageNumber,
          boundingBox: { page: pageNumber, x: 0, y: 0, width: 1, height: 1 },
          sourceType: "UNKNOWN_VISUAL",
          confidence: ocr.confidence ?? 0.4,
          reviewRequired: true,
          sourceReference: `Page ${pageNumber} (OCR source)`,
          cropBuffer: ocr.crop.buffer,
          cropMimeType: ocr.crop.mimeType,
          cropWidth: ocr.crop.width,
          cropHeight: ocr.crop.height,
          warnings: ocr.warnings,
        });
      }
      pages.push({
        ...normalizedPage(pageNumber, pageText, pageBlocks, "NFC"),
        glyphs,
        mathSegments: [...analysis.mathSegments, ...(ocr ? explicitOcrMathHints(ocr.text, ocr.confidence) : [])],
        mathStats: {
          mathRegionsDetected: analysis.mathRegionsDetected,
          mathRegionsCanonicalized: analysis.mathRegionsCanonicalized,
          mathRegionsReviewRequired: analysis.mathRegionsReviewRequired,
          totalTextItems: analysis.totalTextItems,
          suspectTextItems: analysis.suspectTextItems,
          privateUseGlyphs: analysis.privateUseGlyphs,
          replacementCharacters: analysis.replacementCharacters,
          encodingWarnings: analysis.encodingWarnings,
        },
        encodingStatus: ocr ? "VISUAL_ONLY_CONTENT" : analysis.encodingStatus,
        visualRegions,
        visualStats: visualStats(visualRegions),
        ...(ocr ? { ocr: { text: ocr.text, rawText: ocr.rawText, normalizedText: ocr.normalizedText, confidence: ocr.confidence, providerId: ocr.providerId, reviewRequired: ocr.reviewRequired, reviewNotes: ocr.reviewNotes, warnings: ocr.warnings, blocks: ocr.blocks } } : {}),
      });
    }
    const textCharacters = pages.reduce((sum, page) => sum + page.text.replace(/\s/g, "").length, 0);
    if (textCharacters < 20) {
      throw Object.assign(new Error("This PDF has no usable text layer and OCR could not recover readable questions."), { statusCode: 422, code: "PDF_TEXT_LAYER_UNUSABLE", stage: "TEXT_EXTRACTION" });
    }
    const regions = pages.flatMap((page) => page.visualRegions || []);
    return { pages, textCharacters, visualStats: visualStats(regions), ocrStats: { pagesNative, pagesOCR, ocrTextRegions, ocrMathRegions, ocrReviewRequired, ocrUnreadableRegions } };
  } catch (error) {
    if (error && typeof error === "object" && "statusCode" in error) throw error;
    throw pdfError(error);
  }
}

export async function extractTextDocx(buffer: Buffer): Promise<ExtractedDocument> {
  if (buffer[0] !== 0x50 || buffer[1] !== 0x4b) {
    throw Object.assign(new Error("Uploaded source is not a valid DOCX file."), { statusCode: 415, code: "DOCX_SIGNATURE_INVALID", stage: "FILE_VALIDATION" });
  }
  try {
    const mammoth = await loadMammoth();
    let mammothText = "";
    try {
      const result = await mammoth.extractRawText({ buffer });
      mammothText = result.value;
    } catch {
      // The XML supplement below is sufficient for text/OMML extraction even
      // when a malformed optional DOCX part makes Mammoth reject the package.
    }
    const xmlText = await extractDocxXmlParagraphs(buffer);
    const text = normalizeDocumentText(xmlText || mammothText);
    const textCharacters = text.replace(/\s/g, "").length;
    if (textCharacters < 20) {
      throw Object.assign(new Error("This DOCX opened, but no usable question text was found. Check that the content is editable text rather than only images."), { statusCode: 422, code: "DOCX_TEXT_UNAVAILABLE", stage: "TEXT_EXTRACTION" });
    }
    // DOCX does not carry stable rendered page boundaries. Preserve one
    // truthful document-level source reference rather than inventing pages.
    return { pages: [normalizedPage(1, text)], textCharacters };
  } catch (error) {
    if (error && typeof error === "object" && "statusCode" in error) throw error;
    throw Object.assign(new Error("This DOCX package could not be opened or decoded. Upload a valid DOCX file."), { statusCode: 422, code: "DOCX_DOCUMENT_OPEN_FAILED", stage: "DOCUMENT_OPEN" });
  }
}

export async function extractTextDoc(buffer: Buffer): Promise<ExtractedDocument> {
  const oleSignature = Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]);
  if (!buffer.subarray(0, oleSignature.length).equals(oleSignature)) {
    throw Object.assign(new Error("Uploaded source is not a valid DOC file."), { statusCode: 415, code: "DOC_SIGNATURE_INVALID", stage: "FILE_VALIDATION" });
  }
  try {
    const module = await loadWordExtractor();
    const WordExtractor = module.default ?? module;
    const document = await new WordExtractor().extract(buffer);
    const text = normalizeDocumentText(document.getBody());
    const textCharacters = text.replace(/\s/g, "").length;
    if (textCharacters < 20) {
      throw Object.assign(new Error("This DOC opened, but no usable question text was found."), { statusCode: 422, code: "DOC_TEXT_UNAVAILABLE", stage: "TEXT_EXTRACTION" });
    }
    return { pages: [normalizedPage(1, text)], textCharacters };
  } catch (error) {
    if (error && typeof error === "object" && "statusCode" in error) throw error;
    throw Object.assign(new Error("This DOC could not be opened or decoded. Upload a valid DOC file."), { statusCode: 422, code: "DOC_DOCUMENT_OPEN_FAILED", stage: "DOCUMENT_OPEN" });
  }
}

function answerMap(text: string) {
  const answers = new Map<number, string>();
  for (const match of text.matchAll(/(?:^|[\s|,;])(?:answer\s*(?:for\s*)?)?(?:question\s*|q\s*)?(\d{1,3})\s*[.)\-:]?\s*(?:answer\s*[:\-]?\s*)?([A-D])\b/gi)) answers.set(Number(match[1]), match[2].toUpperCase());
  return answers;
}

const ommlMarkerPattern = /\[\[NIDUS_OMML:([A-Za-z0-9+/=]+)\]\]/g;

function normalizeOmmlLatex(value: string) {
  const trimmed = value.trim();
  const matrix = trimmed.match(/^\[([^\[\]]*(?:;[^\[\]]+)+)\]$/);
  if (matrix) return `\\begin{bmatrix}${matrix[1].split(";").map((row) => row.trim().split(/\s+/).join(" & ")).join("\\\\")}\\end{bmatrix}`;
  const determinant = trimmed.match(/^\|([^|]+(?:;[^|]+)+)\|$/);
  if (determinant) return `\\begin{vmatrix}${determinant[1].split(";").map((row) => row.trim().split(/\s+/).join(" & ")).join("\\\\")}\\end{vmatrix}`;
  const fraction = trimmed.match(/^\(([^()]*)\)\/\(([^()]*)\)$/);
  if (fraction) return `\\frac{${fraction[1]}}{${fraction[2]}}`;
  const root = trimmed.match(/^(?:√|âˆš)\(([^()]*)\)$/);
  if (root) return `\\sqrt{${root[1]}}`;
  return trimmed;
}

function materializeOmml(value: string): { text: string; hints: MathSegmentHint[] } {
  const hints: MathSegmentHint[] = [];
  const text = value.replace(ommlMarkerPattern, (_, encoded: string) => {
    try {
      const payload = JSON.parse(Buffer.from(encoded, "base64").toString("utf8")) as { sourceText?: string; latex?: string; confidence?: number; warnings?: MathConversionWarning[] };
      const sourceText = payload.sourceText || payload.latex || "";
      hints.push({ sourceText, latex: payload.latex || normalizeOmmlLatex(sourceText), origin: "OMML", confidence: payload.confidence ?? 1, warnings: payload.warnings });
      return sourceText;
    } catch {
      return "";
    }
  });
  return { text, hints };
}

/**
 * Merge the explicit OMML markers and page-local PDF math regions into the
 * same hint stream consumed by the canonical content adapter. PDF hints are
 * only attached when their source token is actually present in the parsed
 * question/option text; this prevents unrelated nearby glyphs leaking into a
 * different question.
 */
function materializeCombined(value: string, pdfHints: MathSegmentHint[] = []) {
  const materialized = materializeOmml(value);
  const normalized = materialized.text;
  const hints = pdfHints.filter((hint) => {
    const token = hint.matchText || hint.sourceText;
    return Boolean(token && normalized.includes(token));
  });
  return { text: normalized, hints: [...materialized.hints, ...hints] };
}

function explicitOcrMathHints(value: string, confidence: number | null): MathSegmentHint[] {
  const hints: MathSegmentHint[] = [];
  for (const match of String(value || "").matchAll(/(\$\$[\s\S]+?\$\$|\\\[[\s\S]+?\\\]|\\\([\s\S]+?\\\)|\$[^$\n]+?\$)/g)) {
    const sourceText = match[0];
    const latex = sourceText.startsWith("$$") ? sourceText.slice(2, -2).trim() : sourceText.startsWith("$") ? sourceText.slice(1, -1).trim() : sourceText.slice(2, -2).trim();
    if (latex) hints.push({ sourceText, matchText: sourceText, latex, origin: "OCR", confidence: confidence ?? 0.5, warnings: [{ code: "MATH_OCR_NEEDS_REVIEW", message: "Mathematical content was recognized from a scanned page and requires review.", severity: "HIGH" }] });
  }
  return hints;
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
    const candidates: Array<{ rawNumber: string; matchIndex: number; startIndex: number; end: number; lineStart: boolean; explicitLabel?: boolean }> = [...page.text.matchAll(/(\d{1,4})\s*(?:\.(?=\s*\S)|\)(?=\s+\S))\s*/g)].map((match) => {
      const matchIndex = match.index ?? 0;
      return {
        rawNumber: match[1],
        matchIndex,
        startIndex: matchIndex,
        end: matchIndex + match[0].length,
        lineStart: matchIndex === 0 || page.text[matchIndex - 1] === "\n" || page.text[matchIndex - 1] === "\r",
      };
    });
    for (const match of page.text.matchAll(/(?:^|[\r\n])\s*(?:question\s*|q\s*\.?\s*)(\d{1,4})\s*[.):\-]?\s*(?=\S)/gi)) {
      const rawNumber = match[1];
      const numberOffset = (match[0].indexOf(rawNumber));
      const matchIndex = (match.index ?? 0) + numberOffset;
      candidates.push({ rawNumber, matchIndex, startIndex: match.index ?? 0, end: (match.index ?? 0) + match[0].length, lineStart: true, explicitLabel: true });
    }
    for (const match of page.text.matchAll(/(?:^|[\r\n]|\s)\((\d{1,4})\)\s+(?=\S)/g)) {
      const rawNumber = match[1];
      const numberOffset = match[0].indexOf(rawNumber);
      const matchIndex = (match.index ?? 0) + numberOffset;
      const startIndex = (match.index ?? 0) + match[0].indexOf("(");
      candidates.push({ rawNumber, matchIndex, startIndex, end: (match.index ?? 0) + match[0].length, lineStart: startIndex === 0 || page.text[startIndex - 1] === "\n" || page.text[startIndex - 1] === "\r", explicitLabel: true });
    }
    // A minority of exported papers omit punctuation after the question
    // number (`9 The roots...`). Restrict this fallback to a physical line
    // start and an alphabetic stem so numbers inside formulas/options are not
    // promoted to question boundaries.
    for (const match of page.text.matchAll(/(?:^|[\r\n])\s*(\d{1,4})\s+(?=[A-Z][A-Za-z])/g)) {
      const rawNumber = match[1];
      const numberOffset = match[0].indexOf(rawNumber);
      const matchIndex = (match.index ?? 0) + numberOffset;
      candidates.push({ rawNumber, matchIndex, startIndex: match.index ?? 0, end: (match.index ?? 0) + match[0].length, lineStart: true });
    }
    const dedupedCandidates = Array.from(new Map(candidates.map((candidate) => [`${candidate.matchIndex}:${candidate.rawNumber}`, candidate])).values())
      .sort((a, b) => a.matchIndex - b.matchIndex);
    if (questions.length === 0 && expectedNumber === 1 && !dedupedCandidates.some((candidate) => candidate.rawNumber === "1")) {
      const firstExplicit = dedupedCandidates.find((candidate) => candidate.lineStart && candidate.explicitLabel);
      if (firstExplicit) expectedNumber = Number(firstExplicit.rawNumber);
    }
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
      const gapIndex = dedupedCandidates.findIndex((candidate, candidateIndex) => {
        const value = Number(candidate.rawNumber);
        return candidateIndex >= candidateCursor && candidate.lineStart && value > expectedNumber && value <= expectedNumber + 5;
      });
      const selectedIndex = exactIndex >= 0 ? exactIndex : suffixIndex >= 0 ? suffixIndex : gapIndex;
      if (selectedIndex < 0) break;
      const selected = dedupedCandidates[selectedIndex];
      const isGap = exactIndex < 0 && suffixIndex < 0;
      const selectedNumber = isGap ? Number(selected.rawNumber) : expectedNumber;
      const prefixLength = isGap ? 0 : selected.rawNumber.length - expected.length;
      starts.push({ index: selected.startIndex + prefixLength, end: selected.end, number: selectedNumber });
      expectedNumber = selectedNumber + 1;
      candidateCursor = selectedIndex + 1;
    }
    for (let index = 0; index < starts.length; index += 1) {
      const start = starts[index];
      const chunk = page.text.slice(start.end, starts[index + 1]?.index ?? page.text.length).trim();
      // Prefer option labels at physical line boundaries. Broad whitespace
      // matching mistakes prose such as `Assertion (A):` for Option A and can
      // leak question text into the options. Inline labels remain supported
      // only when a complete ordered A-D sequence is present.
      let optionMatches = [...chunk.matchAll(/(?:^|[\r\n])\s*([A-D])[.):]\s*/gi)];
      if (optionMatches.length < 3) {
        const inlineCandidates = [...chunk.matchAll(/(?:^|\s|\()([A-D])[.):]\s*/gi)];
        const ordered = inlineCandidates.map((candidate) => candidate[1].toUpperCase()).join("");
        if (ordered.includes("ABCD")) optionMatches = inlineCandidates.slice(ordered.indexOf("ABCD"), ordered.indexOf("ABCD") + 4);
      }
      const firstExplicitLetter = optionMatches[0]?.[1]?.toUpperCase();
      const firstExplicitIndex = optionMatches[0]?.index ?? chunk.length;
      const beforeExplicit = chunk.slice(0, firstExplicitIndex).trim();
      const beforeExplicitLines = beforeExplicit.split(/\r?\n+/).map((line) => line.trim()).filter(Boolean);
      // Several real Word exports omit only the visual `A.` list label while
      // retaining B/C/D. The final paragraph immediately before B is then the
      // only safe Option A candidate; earlier paragraphs remain the stem.
      const inferredOptionA = firstExplicitLetter === "B" && beforeExplicitLines.length >= 2
        ? beforeExplicitLines.at(-1) || ""
        : "";
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
        if (letter === "A" && inferredOptionA) return inferredOptionA;
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
        ? (inferredOptionA ? beforeExplicitLines.slice(0, -1).join("\n").trim() : beforeExplicit)
        : (unlabeledOptions.length ? unlabeledLines.slice(0, -4).join(" ").trim() : chunk.trim());
      const questionText = [directions.get(number), ownText].filter(Boolean).join(" ");
      const options = optionMatches.length > 0
        ? [optionText("A"), optionText("B"), optionText("C"), optionText("D")]
        : unlabeledOptions;
      const questionMaterialized = materializeCombined(questionText, page.mathSegments);
      const optionMaterialized = options.map((option) => materializeCombined(option, page.mathSegments));
      const optionsComplete = options.length === 4 && options.every(Boolean);
      const reviewStatus = optionsComplete ? (correctAnswer ? "READY" : "MISSING_ANSWER") : "NEEDS_REVIEW";
      const visualReferences = questionRequiresVisual(questionText);
      // A page with one detected question is the only case where page-local
      // visual ownership is unambiguous without a full layout model. On pages
      // containing multiple questions, retain the candidates at page level and
      // require review rather than attaching a figure to the wrong question.
      const pageVisuals = page.visualRegions || [];
      const associatedVisuals = starts.length === 1 ? pageVisuals : [];
      const visualReviewNotes = visualReferences && !associatedVisuals.length
        ? ["This question refers to a visual source that could not be assigned safely. Review the original paper."]
        : associatedVisuals.filter((asset) => asset.reviewRequired).length
          ? ["Visual source bounds or association need review before release."]
          : [];
      const ocrReviewNotes = page.ocr?.reviewNotes || [];
      const ocrReviewRequired = Boolean(page.ocr?.reviewRequired);
      const question = {
        number,
        questionText: questionMaterialized.text,
        optionA: optionMaterialized[0]?.text || "",
        optionB: optionMaterialized[1]?.text || "",
        optionC: optionMaterialized[2]?.text || "",
        optionD: optionMaterialized[3]?.text || "",
        correctAnswer,
        marks,
        sourcePageNumber: page.pageNumber,
        sourceReference: `Page ${page.pageNumber}`,
        reviewStatus,
        ...(associatedVisuals.length ? { visualAssets: associatedVisuals } : {}),
        ...(visualReferences || visualReviewNotes.length ? { visualReviewRequired: Boolean(visualReferences || visualReviewNotes.length), visualReviewNotes } : {}),
        ...(ocrReviewRequired ? { ocrReviewRequired: true, ocrReviewNotes, ocrConfidence: page.ocr?.confidence } : {}),
      } as const;
      questions.push({
        ...question,
        contentJson: buildLegacyQuestionContent({
        ...question,
        questionText: question.questionText || "Question text requires review.",
        correctAnswer: correctAnswer || "",
          mathSegments: {
            question: questionMaterialized.hints,
            optionA: optionMaterialized[0]?.hints,
            optionB: optionMaterialized[1]?.hints,
            optionC: optionMaterialized[2]?.hints,
            optionD: optionMaterialized[3]?.hints,
          },
          visualAssets: question.visualAssets?.map((asset) => ({
            id: asset.id,
            assetUrl: asset.assetUrl,
            sourceType: asset.sourceType,
            pageNumber: asset.pageNumber,
            boundingBox: asset.boundingBox,
            confidence: asset.confidence,
            reviewRequired: asset.reviewRequired,
            sourceReference: asset.sourceReference,
          })),
          ocrReviewRequired: question.ocrReviewRequired,
          ocrReviewNotes: question.ocrReviewNotes,
          ocrConfidence: question.ocrConfidence,
          contentSource: "TEACHER_IMPORT",
        }),
      });
    }
  }
  return questions;
}
