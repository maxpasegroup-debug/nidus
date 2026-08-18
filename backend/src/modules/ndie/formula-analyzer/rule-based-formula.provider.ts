import { createHash } from "node:crypto";
import type { NdieFormulaDiagnostics, NdieFormulaSemanticType, NdieFormulaToken, NdieNormalizedFormula } from "../contracts/formula-result.js";
import type { NdieLayoutBox } from "../contracts/layout-result.js";
import type { FormulaProvider } from "../contracts/providers.js";
import { formulaPerfectionService } from "../formula-perfection/formula-perfection.service.js";

type FormulaInput = Parameters<FormulaProvider["detect"]>[0];
type FormulaElement = FormulaInput["layoutElements"][number];

const formulaSignal = /\\frac|\\sqrt|\\sum|\\int|\\lim|\^|_[{(]?\w|[∫√ΣπθλμΩαβγΔ≈≠≤≥∞±→⇌]|\b(sin|cos|tan|log|ln|det|matrix|vector|lim|integral|differentiate|probability)\b|[a-zA-Z]\s*=\s*[-+*/^()0-9a-zA-Z]+/i;
const chemistrySignal = /\b(H2O|CO2|NaCl|HCl|H2SO4|NH3|CH4|O2|N2)\b|(?:\b[A-Z][a-z]?\d*\b\s*){2,}(?:\+|->|→|⇌|=)|\b(acid|base|mole|mol|valency|oxidation)\b/i;
const physicsSignal = /\b(F\s*=\s*ma|v\s*=\s*u|s\s*=|E\s*=\s*mc|V\s*=\s*IR|P\s*=\s*VI|W\s*=|KE|PE|momentum|velocity|acceleration|force|current|resistance)\b/i;

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function asBox(raw: unknown, page: number): NdieLayoutBox {
  const source = record(raw);
  const normalized = record(source.normalized);
  const x = Number(source.x ?? normalized.x ?? 0.06);
  const y = Number(source.y ?? normalized.y ?? 0.08);
  const width = Number(source.width ?? normalized.width ?? 0.88);
  const height = Number(source.height ?? normalized.height ?? 0.05);
  const rotation = Number(source.rotation ?? 0);
  const polygon = Array.isArray(source.polygon) ? source.polygon as Array<{ x: number; y: number }> : [
    { x, y },
    { x: x + width, y },
    { x: x + width, y: y + height },
    { x, y: y + height }
  ];
  return { page, x, y, width, height, rotation, normalized: { x, y, width, height }, polygon };
}

function normalizeExpression(text: string) {
  return text
    .replace(/√/g, "\\sqrt")
    .replace(/∫/g, "\\int")
    .replace(/Σ/g, "\\sum")
    .replace(/π/g, "\\pi")
    .replace(/θ/g, "\\theta")
    .replace(/λ/g, "\\lambda")
    .replace(/μ/g, "\\mu")
    .replace(/Ω/g, "\\Omega")
    .replace(/α/g, "\\alpha")
    .replace(/β/g, "\\beta")
    .replace(/γ/g, "\\gamma")
    .replace(/Δ/g, "\\Delta")
    .replace(/≤/g, "\\le")
    .replace(/≥/g, "\\ge")
    .replace(/≠/g, "\\ne")
    .replace(/∞/g, "\\infty")
    .replace(/\s+/g, " ")
    .trim();
}

function plainToLatex(text: string) {
  const normalized = normalizeExpression(text);
  return normalized
    .replace(/\b(sqrt)\(([^)]+)\)/gi, "\\sqrt{$2}")
    .replace(/\b([a-zA-Z0-9]+)\/([a-zA-Z0-9]+)\b/g, "\\frac{$1}{$2}");
}

function toMathMl(text: string, diagnostics: NdieFormulaDiagnostics) {
  const escaped = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const mathml = `<math><mrow><mtext>${escaped}</mtext></mrow></math>`;
  if (!mathml.includes("<math>") || !mathml.includes("</math>")) diagnostics.invalidMathML = true;
  return mathml;
}

function tokenize(text: string): NdieFormulaToken[] {
  const matches = text.match(/\\[a-zA-Z]+|[A-Za-z]+|\d+(?:\.\d+)?|[+\-*/=^_()[\]{}<>≤≥≠≈→⇌√∫ΣπθλμΩαβγΔ∞]|[^\s]/g) ?? [];
  return matches.map((token, index) => ({
    text: token,
    tokenType: /^\d/.test(token) ? "NUMBER" : /^[A-Za-z]+$/.test(token) ? "VARIABLE" : /^[+\-*/=^_<>≤≥≠≈→⇌]$/.test(token) ? "OPERATOR" : /^\\[a-zA-Z]+$/.test(token) ? "FUNCTION" : /^[()[\]{}]$/.test(token) ? "GROUPING" : /[√∫ΣπθλμΩαβγΔ∞]/.test(token) ? "SYMBOL" : "UNKNOWN",
    confidence: /^[^\s]$/.test(token) || /^\\[a-zA-Z]+$/.test(token) ? 0.82 : 0.74,
    sourceIndex: index
  }));
}

function balanced(text: string, open: string, close: string) {
  let depth = 0;
  for (const char of text) {
    if (char === open) depth += 1;
    if (char === close) depth -= 1;
    if (depth < 0) return false;
  }
  return depth === 0;
}

function semanticType(text: string): NdieFormulaSemanticType {
  const lower = text.toLowerCase();
  if (physicsSignal.test(text)) return "PHYSICS_EQUATION";
  if (chemistrySignal.test(text)) return "CHEMISTRY_EQUATION";
  if (/\\int|∫/.test(text)) return "INTEGRATION";
  if (/\\lim|\blim\b/.test(lower)) return "LIMIT";
  if (/d\/dx|dy\/dx|differentiat/.test(lower)) return "DIFFERENTIATION";
  if (/matrix|det|\\begin\{matrix|\\begin\{bmatrix/.test(lower)) return lower.includes("det") ? "DETERMINANT" : "MATRIX";
  if (/\b(sin|cos|tan|cot|sec|cosec)\b/.test(lower)) return "TRIGONOMETRY";
  if (/\b(vector|vec|i\+j|i\s*,\s*j\s*,\s*k)\b/.test(lower)) return "VECTOR";
  if (/\b(probability|mean|median|mode|variance|standard deviation|p\()/i.test(text)) return /\bmean|median|variance|standard deviation/.test(lower) ? "STATISTICS" : "PROBABILITY";
  if (/\b(circle|parabola|ellipse|hyperbola|coordinate|slope|line)\b/i.test(text)) return "COORDINATE_GEOMETRY";
  if (/[+\-*/=^]/.test(text) && /[a-z]/i.test(text)) return "ALGEBRA";
  if (/[+\-*/=]/.test(text)) return "ARITHMETIC";
  return "GENERIC_SYMBOLIC_EXPRESSION";
}

function diagnosticsFor(text: string, confidence: number): NdieFormulaDiagnostics {
  const balancedBrackets = balanced(text, "(", ")") && balanced(text, "[", "]") && balanced(text, "{", "}");
  const unknownSymbols = Array.from(new Set((text.match(/[�]/g) ?? [])));
  const diagnostics: NdieFormulaDiagnostics = {
    brokenFormula: false,
    missingSymbols: unknownSymbols.length > 0,
    lowConfidence: confidence < (Number(process.env.NDIE_FORMULA_CONFIDENCE_WARNING ?? 0.75)),
    unreadableFormula: text.trim().length < 2,
    multipleFormulaRegions: false,
    nestedFormula: /\\frac\{.*\\frac\{/s.test(text),
    equationSplitAcrossLines: /\n/.test(text),
    invalidLatex: false,
    invalidMathML: false,
    balancedBrackets,
    unknownSymbols,
    brokenSuperscripts: /[\^]\s*$|\^\s+[+\-=]/.test(text),
    brokenSubscripts: /[_]\s*$|_\s+[+\-=]/.test(text),
    missingRadicals: /√\s*$|\\sqrt\s*$/.test(text),
    missingFractions: /\\frac\s*(?!\{)|\/\s*$/.test(text),
    invalidMatrices: /matrix/i.test(text) && !/(\\begin\{[a-z]*matrix\}|[\[(].*[\])])/s.test(text),
    brokenIntegrals: /\\int|∫/.test(text) && !/[dx|dy|dt]/.test(text),
    brokenSummations: /\\sum|Σ/.test(text) && !/[_^=]/.test(text),
    issues: []
  };
  diagnostics.invalidLatex = !balancedBrackets || /\\(frac|sqrt)\s*$/.test(text);
  if (diagnostics.brokenFormula) diagnostics.issues.push("BROKEN_FORMULA");
  if (diagnostics.missingSymbols) diagnostics.issues.push("MISSING_SYMBOLS");
  if (diagnostics.lowConfidence) diagnostics.issues.push("LOW_CONFIDENCE");
  if (diagnostics.unreadableFormula) diagnostics.issues.push("UNREADABLE_FORMULA");
  if (diagnostics.nestedFormula) diagnostics.issues.push("NESTED_FORMULA");
  if (diagnostics.equationSplitAcrossLines) diagnostics.issues.push("EQUATION_SPLIT_ACROSS_LINES");
  if (diagnostics.invalidLatex) diagnostics.issues.push("INVALID_LATEX");
  if (diagnostics.invalidMathML) diagnostics.issues.push("INVALID_MATHML");
  if (!diagnostics.balancedBrackets) diagnostics.issues.push("UNBALANCED_BRACKETS");
  if (diagnostics.brokenSuperscripts) diagnostics.issues.push("BROKEN_SUPERSCRIPT");
  if (diagnostics.brokenSubscripts) diagnostics.issues.push("BROKEN_SUBSCRIPT");
  if (diagnostics.missingRadicals) diagnostics.issues.push("MISSING_RADICAL");
  if (diagnostics.missingFractions) diagnostics.issues.push("MISSING_FRACTION");
  if (diagnostics.invalidMatrices) diagnostics.issues.push("INVALID_MATRIX");
  if (diagnostics.brokenIntegrals) diagnostics.issues.push("BROKEN_INTEGRAL");
  if (diagnostics.brokenSummations) diagnostics.issues.push("BROKEN_SUMMATION");
  return diagnostics;
}

function previewSvg(latex: string) {
  const escaped = latex.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="96" viewBox="0 0 900 96"><rect width="900" height="96" fill="#fff"/><text x="24" y="58" font-family="serif" font-size="28">${escaped}</text></svg>`;
}

function sourceId(element: FormulaElement) {
  const metadata = record(element.metadata);
  return typeof metadata.regionId === "string" ? metadata.regionId : element.id;
}

function formulaConfidence(text: string, elementConfidence: number | null | undefined) {
  const base = typeof elementConfidence === "number" ? elementConfidence : 0.72;
  const penalties = [
    /\�/.test(text) ? 0.2 : 0,
    /\\(frac|sqrt)\s*$/.test(text) ? 0.16 : 0,
    !balanced(text, "(", ")") ? 0.1 : 0
  ].reduce((sum, value) => sum + value, 0);
  const overall = Math.max(0.1, Math.min(0.99, base - penalties));
  return {
    overall: Number(overall.toFixed(4)),
    tokens: Number(Math.max(0.1, overall - 0.03).toFixed(4)),
    operators: Number(Math.max(0.1, overall - 0.04).toFixed(4)),
    symbols: Number(Math.max(0.1, overall - 0.05).toFixed(4)),
    fractions: /\\frac|\//.test(text) ? Number(Math.max(0.1, overall - 0.08).toFixed(4)) : null,
    exponents: /\^/.test(text) ? Number(Math.max(0.1, overall - 0.06).toFixed(4)) : null,
    roots: /\\sqrt|√/.test(text) ? Number(Math.max(0.1, overall - 0.08).toFixed(4)) : null
  };
}

export class RuleBasedFormulaProvider implements FormulaProvider {
  readonly id = "formula.rule-based";
  readonly kind = "FORMULA" as const;
  readonly displayName = "NDIE Rule-Based Formula Intelligence";
  readonly version = "1.0-gate6";

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

  async detect(input: FormulaInput) {
    const startedAt = Date.now();
    const candidates = input.layoutElements.filter((element) => {
      const text = String(element.text ?? "");
      return text && (formulaSignal.test(text) || chemistrySignal.test(text) || ["FORMULA_AREA"].includes(element.elementType));
    });

    const rawFormulas: NdieNormalizedFormula[] = candidates.map((element, index) => {
      const rawText = String(element.text ?? "");
      const normalizedExpression = normalizeExpression(rawText);
      const latex = plainToLatex(rawText);
      const confidence = formulaConfidence(rawText, element.confidence);
      const diagnostics = diagnosticsFor(latex, confidence.overall ?? 0);
      const mathml = toMathMl(normalizedExpression, diagnostics);
      const tokens = tokenize(normalizedExpression);
      const coordinates = asBox(element.coordinates, input.pageNumber);
      const semantic = semanticType(rawText);
      const formulaId = `formula-${input.pageNumber}-${index + 1}-${createHash("sha1").update(`${sourceId(element)}:${rawText}`).digest("hex").slice(0, 10)}`;
      const renderStatus = diagnostics.invalidLatex || diagnostics.lowConfidence ? "REQUIRES_TEACHER_REVIEW" : "PREVIEW_READY";
      return {
        schemaVersion: "ndie-formula-v1",
        formulaId,
        sourcePage: input.pageNumber,
        sourcePageId: input.pageId,
        sourceRegionId: sourceId(element),
        sourceElementId: element.id,
        coordinates,
        confidence,
        providerId: this.id,
        providerVersion: this.version,
        pipelineVersion: (process.env.NDIE_PIPELINE_VERSION ?? "ndie-pipeline-v1"),
        formulaType: coordinates.width > 0.45 || rawText.length > 36 ? "DISPLAY" : "INLINE",
        semanticType: semantic,
        equationNumber: rawText.match(/\((\d+(?:\.\d+)?)\)\s*$/)?.[1] ?? null,
        readingOrder: element.readingOrder ?? index + 1,
        dependencies: [],
        renderStatus,
        renderer: {
          provider: "KATEX_COMPATIBLE",
          previewSvg: renderStatus === "PREVIEW_READY" ? previewSvg(latex) : null,
          previewImageUrl: null,
          error: renderStatus === "PREVIEW_READY" ? null : "Formula requires teacher review before trusted rendering."
        },
        representations: {
          originalImageCrop: {
            sourcePageImageUrl: input.pageImageUrl ?? null,
            coordinates,
            status: input.pageImageUrl ? "REFERENCE_ONLY" : "UNAVAILABLE"
          },
          latex,
          mathml,
          plainText: rawText,
          unicode: rawText,
          ocrTokens: tokens,
          ast: {
            type: semantic,
            tokens: tokens.map((token) => ({ text: token.text, tokenType: token.tokenType }))
          },
          normalizedExpression
        },
        diagnostics,
        editState: {
          originalLatex: latex,
          editedLatex: null,
          revision: 1,
          diff: [],
          approvalStatus: diagnostics.issues.length ? "PENDING_REVIEW" : "APPROVED"
        },
        rawProviderOutput: {
          sourceText: rawText,
          sourceElementId: element.id,
          sourceElementType: element.elementType,
          layoutJsonConsumed: Boolean(input.layoutJson),
          ocrJsonConsumed: Boolean(input.ocrJson)
        },
        checksum: createHash("sha256").update(JSON.stringify({ formulaId, rawText, coordinates, latex, mathml })).digest("hex"),
        durationMs: Date.now() - startedAt,
        createdAt: new Date().toISOString()
      };
    });

    const perfection = formulaPerfectionService.perfectDocument(rawFormulas);
    const formulas = perfection.formulas.map((item) => item.formula);

    return {
      formulas,
      elements: formulas.map((formula) => ({
        elementType: formula.semanticType === "CHEMISTRY_EQUATION" ? "CHEMICAL_EQUATION" as const : "FORMULA" as const,
        text: formula.representations.plainText,
        normalizedText: formula.representations.normalizedExpression,
        coordinates: formula.coordinates,
        readingOrder: formula.readingOrder,
        confidence: formula.confidence.overall,
        metadata: {
          formula,
          provider: this.id,
          formulaId: formula.formulaId,
          semanticType: formula.semanticType,
          renderStatus: formula.renderStatus,
          requiresTeacherFormulaReview: formula.editState.approvalStatus !== "APPROVED"
        }
      })),
      confidence: formulas.length ? Number((formulas.reduce((sum, formula) => sum + Number(formula.confidence.overall ?? 0), 0) / formulas.length).toFixed(4)) : null,
      raw: {
        provider: this.id,
        candidateCount: candidates.length,
        formulaCount: formulas.length,
        formulaPerfection: perfection.summary,
        semanticTypes: formulas.reduce<Record<string, number>>((acc, formula) => {
          acc[formula.semanticType] = (acc[formula.semanticType] ?? 0) + 1;
          return acc;
        }, {})
      }
    };
  }
}
