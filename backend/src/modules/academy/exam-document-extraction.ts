import { buildLegacyQuestionContent, type MathConversionWarning, type MathSegmentHint } from "../document-intelligence/question-content.schema.js";
import { analyzePdfPage } from "./pdf-layout-analysis.js";
import type { PdfGlyphRun } from "./pdf-math-reconstruction.js";
import { decodePdfTextItem } from "./pdf-text-decoding.js";

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
};

export type ExtractedPdf = { pages: NormalizedDocumentPage[]; textCharacters: number };
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
async function extractDocxXmlParagraphs(buffer: Buffer) {
  try {
    const module = await loadJsZip();
    const jszip = (module as unknown as { default?: JsZipModule }).default ?? module;
    const zip = await jszip.loadAsync(buffer);
    const entry = zip.file("word/document.xml");
    if (!entry) return "";
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
      pages.push({
        ...normalizedPage(pageNumber, analysis.text, analysis.lines.map((line, order) => ({ type: "line", text: line.text, order })), "NFC"),
        glyphs,
        mathSegments: analysis.mathSegments,
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
        encodingStatus: analysis.encodingStatus,
      });
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
      const questionMaterialized = materializeCombined(questionText, page.mathSegments);
      const optionMaterialized = options.map((option) => materializeCombined(option, page.mathSegments));
      const optionsComplete = options.length === 4 && options.every(Boolean);
      const reviewStatus = optionsComplete ? (correctAnswer ? "READY" : "MISSING_ANSWER") : "NEEDS_REVIEW";
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
          contentSource: "TEACHER_IMPORT",
        }),
      });
    }
  }
  return questions;
}
