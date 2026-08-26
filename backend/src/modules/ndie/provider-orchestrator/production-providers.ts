import { createHash } from "node:crypto";

import { env } from "../../../config/env.js";
import type { NdieLayoutBox, NdieLayoutRegionClassification } from "../contracts/layout-result.js";
import type { AiProvider, FormulaProvider, LayoutProvider, OcrProvider } from "../contracts/providers.js";
import { OpenAiValidatorProvider } from "../ai-validator/openai-ai.provider.js";
import { RuleBasedAiValidatorProvider } from "../ai-validator/rule-based-ai.provider.js";
import { RuleBasedFormulaProvider } from "../formula-analyzer/rule-based-formula.provider.js";
import { RuleBasedLayoutProvider } from "../layout-analyzer/rule-based-layout.provider.js";
import { TesseractOcrProvider } from "../ocr/tesseract-ocr.provider.js";
import { callAzureLayout, azureDocumentIntelligenceConfigured } from "./azure-document-intelligence.client.js";
import { callMathpix, mathpixConfigured, type MathpixLine } from "./mathpix.client.js";
import { clamp, finite, record } from "./provider-http.js";

const mathSignal = /\\(?:frac|sqrt|int|sum|lim|begin)|[∫√ΣπθλΩ≈≤≥∞]|\^|_\{|\b(?:matrix|determinant|vector|calculus|equation)\b/i;
const chemistrySignal = /(?:[A-Z][a-z]?\d*){2,}|→|⇌|charge|reaction|benzene|lewis|organic|molecule/i;

const ESTIMATED_PAGE_COST_USD = {
  azureLayout: 0.004,
  mathpix: 0.006,
  openAiVerification: 0.012
} as const;

function withinPageCost(estimatedCostUsd: number) {
  return estimatedCostUsd <= env.NDIE_PROVIDER_MAX_PAGE_COST_USD;
}

function health(id: string, kind: "OCR" | "LAYOUT" | "FORMULA" | "AI", configured: boolean) {
  return { id, kind, enabled: configured, configured, status: configured ? "READY" as const : "NOT_CONFIGURED" as const };
}

function lineBox(line: MathpixLine, imageWidth = 1, imageHeight = 1) {
  const points = Array.isArray(line.cnt) ? line.cnt : [];
  const xs = points.map((point) => finite(point[0]));
  const ys = points.map((point) => finite(point[1]));
  const left = xs.length ? Math.min(...xs) : 0;
  const top = ys.length ? Math.min(...ys) : 0;
  const right = xs.length ? Math.max(...xs) : imageWidth;
  const bottom = ys.length ? Math.max(...ys) : imageHeight;
  return {
    x: left / Math.max(1, imageWidth),
    y: top / Math.max(1, imageHeight),
    width: (right - left) / Math.max(1, imageWidth),
    height: (bottom - top) / Math.max(1, imageHeight)
  };
}

export class MathpixOcrProvider implements OcrProvider {
  readonly id = "ocr.mathpix";
  readonly kind = "OCR" as const;
  readonly displayName = "Mathpix STEM OCR";
  readonly version = "v3-text";
  isEnabled() { return mathpixConfigured(); }
  health() { return health(this.id, this.kind, this.isEnabled()); }

  async recognize(input: Parameters<OcrProvider["recognize"]>[0]) {
    const startedAt = Date.now();
    const raw = await callMathpix(input);
    const lines = Array.isArray(raw.line_data) ? raw.line_data : [];
    const confidence = clamp(raw.confidence, clamp(raw.confidence_rate, 0.5));
    const normalizedLines = lines.map((line, index) => ({
      text: String(line.text ?? ""),
      confidence: clamp(line.confidence, confidence),
      boundingBox: lineBox(line, finite(raw.image_width, 1), finite(raw.image_height, 1)),
      readingOrder: index + 1,
      words: String(line.text ?? "").split(/\s+/).filter(Boolean).map((text) => ({ text, confidence: clamp(line.confidence, confidence) }))
    }));
    const text = String(raw.text ?? raw.latex_styled ?? "").trim();
    return {
      text,
      confidence,
      language: null,
      languages: [],
      normalized: {
        schemaVersion: "ndie-ocr-v1" as const,
        providerId: this.id,
        providerVersion: String(raw.version ?? this.version),
        pageId: input.pageId,
        pageNumber: input.pageNumber,
        language: null,
        languages: [],
        rotation: input.rotation ?? null,
        confidence,
        text,
        blocks: [{
          blockType: "TEXT" as const,
          text,
          confidence,
          readingOrder: 1,
          paragraphs: [{ text, confidence, readingOrder: 1, lines: normalizedLines }]
        }],
        diagnostics: {
          blankPage: !text,
          lowConfidence: confidence < env.NDIE_OCR_CONFIDENCE_WARNING,
          missingText: !text,
          languageMismatch: false,
          rotatedPage: Boolean(input.rotation && input.rotation % 360 !== 0),
          providerFailure: false,
          retryable: false,
          issues: !text ? ["MISSING_TEXT_REVIEW_REQUIRED"] : confidence < env.NDIE_OCR_CONFIDENCE_WARNING ? ["LOW_CONFIDENCE_REVIEW_REQUIRED"] : []
        },
        preprocessing: input.preprocessing ?? {},
        durationMs: Date.now() - startedAt,
        createdAt: new Date().toISOString()
      },
      raw
    };
  }
}

export class ProductionOcrProvider implements OcrProvider {
  readonly id = "ocr.production";
  readonly kind = "OCR" as const;
  readonly displayName = "NIDUS Routed OCR";
  private readonly base = new TesseractOcrProvider();
  private readonly mathpix = new MathpixOcrProvider();
  isEnabled() { return true; }
  health() { return health(this.id, this.kind, true); }

  async recognize(input: Parameters<OcrProvider["recognize"]>[0]) {
    const base = await this.base.recognize(input);
    const useMathpix = this.mathpix.isEnabled()
      && withinPageCost(ESTIMATED_PAGE_COST_USD.mathpix)
      && env.MATHPIX_STEM_OCR_MODE !== "DISABLED" && (
      env.MATHPIX_STEM_OCR_MODE === "ALWAYS"
      || Number(base.confidence ?? 0) < env.NDIE_OCR_CONFIDENCE_WARNING
      || mathSignal.test(base.text)
      || chemistrySignal.test(base.text)
    );
    if (!useMathpix) return { ...base, raw: { ...base.raw, routing: { selected: this.base.id, reason: "normal-text-or-cost-control" } } };
    try {
      const specialist = await this.mathpix.recognize(input);
      const selected = Number(specialist.confidence ?? 0) >= Number(base.confidence ?? 0) ? specialist : base;
      return { ...selected, raw: { ...selected.raw, routing: { selected: selected === specialist ? this.mathpix.id : this.base.id, compared: [this.base.id, this.mathpix.id] } } };
    } catch {
      return { ...base, raw: { ...base.raw, routing: { selected: this.base.id, fallbackFrom: this.mathpix.id, reviewRequired: Number(base.confidence ?? 0) < env.NDIE_OCR_CONFIDENCE_WARNING } } };
    }
  }
}

function azurePolygon(raw: unknown, page: number, pageWidth: number, pageHeight: number): NdieLayoutBox {
  const points = Array.isArray(raw) ? raw.map((value) => finite(value)) : [];
  const xs = points.filter((_, index) => index % 2 === 0);
  const ys = points.filter((_, index) => index % 2 === 1);
  const x = xs.length ? Math.min(...xs) : 0;
  const y = ys.length ? Math.min(...ys) : 0;
  const right = xs.length ? Math.max(...xs) : pageWidth;
  const bottom = ys.length ? Math.max(...ys) : pageHeight;
  const width = Math.max(0, right - x);
  const height = Math.max(0, bottom - y);
  return {
    page, x, y, width, height, rotation: 0,
    normalized: { x: x / Math.max(1, pageWidth), y: y / Math.max(1, pageHeight), width: width / Math.max(1, pageWidth), height: height / Math.max(1, pageHeight) },
    polygon: xs.map((value, index) => ({ x: value, y: ys[index] ?? 0 }))
  };
}

function azureRegionClassification(role: unknown): NdieLayoutRegionClassification {
  const normalized = String(role ?? "").toLowerCase();
  if (normalized.includes("header") || normalized === "title" || normalized === "sectionheading") return "HEADER";
  if (normalized.includes("footer")) return "FOOTER";
  if (normalized.includes("pagenumber")) return "PAGE_NUMBER";
  return "TEXT_REGION";
}

export class AzureLayoutProvider implements LayoutProvider {
  readonly id = "layout.azure";
  readonly kind = "LAYOUT" as const;
  readonly displayName = "Azure Document Intelligence Layout";
  readonly version = "2024-11-30";
  isEnabled() { return azureDocumentIntelligenceConfigured(); }
  health() { return health(this.id, this.kind, this.isEnabled()); }

  async analyze(input: Parameters<LayoutProvider["analyze"]>[0]) {
    if (!input.imageUrl) throw Object.assign(new Error("Azure layout requires a rendered page image."), { retryable: false });
    const startedAt = Date.now();
    const raw = await callAzureLayout(input.imageUrl);
    const azurePage = record(raw.pages?.[0]);
    const pageWidth = finite(azurePage.width, input.width ?? 1);
    const pageHeight = finite(azurePage.height, input.height ?? 1);
    const words = (Array.isArray(azurePage.words) ? azurePage.words : []).map((item, index) => {
      const word = record(item);
      return { text: String(word.content ?? ""), confidence: clamp(word.confidence, 0.7), coordinates: azurePolygon(word.polygon, input.pageNumber, pageWidth, pageHeight), readingOrder: index + 1, sourceReference: { provider: this.id, page: input.pageNumber } };
    });
    const lines = (Array.isArray(azurePage.lines) ? azurePage.lines : []).map((item, index) => {
      const line = record(item);
      return { text: String(line.content ?? ""), confidence: null, coordinates: azurePolygon(line.polygon, input.pageNumber, pageWidth, pageHeight), readingOrder: index + 1, words: [], sourceReference: { provider: this.id, page: input.pageNumber } };
    });
    const paragraphs = (raw.paragraphs ?? []).map((item, index) => {
      const paragraph = record(item);
      const bounding = record((Array.isArray(paragraph.boundingRegions) ? paragraph.boundingRegions[0] : null));
      return { text: String(paragraph.content ?? ""), confidence: null, coordinates: azurePolygon(bounding.polygon, input.pageNumber, pageWidth, pageHeight), readingOrder: index + 1, lines: [], sourceReference: { provider: this.id, role: paragraph.role ?? null } };
    });
    const regions = paragraphs.map((paragraph, index) => {
      const source = record(paragraph.sourceReference);
      return { id: `azure-region-${input.pageNumber}-${index + 1}`, classification: azureRegionClassification(source.role), text: paragraph.text, normalizedText: paragraph.text.replace(/\s+/g, " ").trim(), confidence: paragraph.confidence, coordinates: paragraph.coordinates, readingOrder: index + 1, paragraphIds: [`azure-paragraph-${index + 1}`], lineIds: [], sourceReference: paragraph.sourceReference, providerMetadata: { role: source.role ?? null } };
    });
    const tables = (raw.tables ?? []).map((item, index) => {
      const table = record(item);
      const bounding = record((Array.isArray(table.boundingRegions) ? table.boundingRegions[0] : null));
      const cells = (Array.isArray(table.cells) ? table.cells : []).map((item) => {
        const cell = record(item);
        const cellBounding = record((Array.isArray(cell.boundingRegions) ? cell.boundingRegions[0] : null));
        return { row: finite(cell.rowIndex), column: finite(cell.columnIndex), rowSpan: finite(cell.rowSpan, 1), colSpan: finite(cell.columnSpan, 1), text: String(cell.content ?? ""), coordinates: azurePolygon(cellBounding.polygon, input.pageNumber, pageWidth, pageHeight), confidence: null };
      });
      return { id: `azure-table-${input.pageNumber}-${index + 1}`, coordinates: azurePolygon(bounding.polygon, input.pageNumber, pageWidth, pageHeight), rows: finite(table.rowCount), columns: finite(table.columnCount), cells, multiPage: false, nested: false, confidence: 0.9, sourceRegionIds: [] };
    });
    const figures = (raw.figures ?? []).map((item, index) => {
      const figure = record(item);
      const bounding = record((Array.isArray(figure.boundingRegions) ? figure.boundingRegions[0] : null));
      const caption = record(figure.caption);
      return { id: `azure-figure-${input.pageNumber}-${index + 1}`, kind: "FIGURE" as const, coordinates: azurePolygon(bounding.polygon, input.pageNumber, pageWidth, pageHeight), caption: String(caption.content ?? "") || undefined, confidence: 0.85, sourceRegionIds: [] };
    });
    const confidenceValues = words.map((word) => Number(word.confidence ?? 0)).filter((value) => value > 0);
    const confidence = confidenceValues.length ? confidenceValues.reduce((sum, value) => sum + value, 0) / confidenceValues.length : 0.75;
    const normalized = {
      schemaVersion: "ndie-layout-v1" as const, providerId: this.id, providerVersion: String(raw.apiVersion ?? this.version), pipelineVersion: env.NDIE_PIPELINE_VERSION,
      pageId: input.pageId, pageNumber: input.pageNumber,
      page: { width: input.width ?? pageWidth, height: input.height ?? pageHeight, rotation: input.rotation ?? null, dpi: input.dpi ?? null, aspectRatio: input.aspectRatio ?? null },
      regions, paragraphs, lines, words, columns: [], tables, figures,
      headers: regions.filter((region) => region.classification === "HEADER"), footers: regions.filter((region) => region.classification === "FOOTER"), pageNumbers: regions.filter((region) => region.classification === "PAGE_NUMBER"), margins: [], readingGroups: [], readingOrder: regions.map((region) => region.id), confidence,
      diagnostics: { overlappingRegions: false, missingReadingOrder: false, lowConfidence: confidence < env.NDIE_LAYOUT_CONFIDENCE_WARNING, pageSkew: false, brokenColumns: false, tableAmbiguity: false, figureAmbiguity: false, issues: confidence < env.NDIE_LAYOUT_CONFIDENCE_WARNING ? ["LOW_CONFIDENCE_REVIEW_REQUIRED"] : [] },
      providerMetadata: { modelId: raw.modelId ?? "prebuilt-layout", contentFormat: "markdown" }, checksum: createHash("sha256").update(JSON.stringify({ regions, tables, figures })).digest("hex"), durationMs: Date.now() - startedAt, createdAt: new Date().toISOString()
    };
    return { normalized, raw, elements: regions.map((region) => ({ elementType: region.classification, text: region.text, normalizedText: region.normalizedText, coordinates: region.coordinates, readingOrder: region.readingOrder, confidence: region.confidence, metadata: region.providerMetadata })), layoutJson: normalized, confidence };
  }
}

export class ProductionLayoutProvider implements LayoutProvider {
  readonly id = "layout.production"; readonly kind = "LAYOUT" as const; readonly displayName = "NIDUS Routed Layout";
  private readonly base = new RuleBasedLayoutProvider(); private readonly azure = new AzureLayoutProvider();
  isEnabled() { return true; } health() { return health(this.id, this.kind, true); }
  async analyze(input: Parameters<LayoutProvider["analyze"]>[0]) {
    if (this.azure.isEnabled() && input.imageUrl && withinPageCost(ESTIMATED_PAGE_COST_USD.azureLayout)) {
      try { return await this.azure.analyze(input); } catch { /* preserve deterministic fallback */ }
    }
    const result = await this.base.analyze(input);
    return { ...result, raw: { ...result.raw, routing: { selected: this.base.id, fallbackFrom: this.azure.isEnabled() ? this.azure.id : null } } };
  }
}

export class MathpixFormulaProvider implements FormulaProvider {
  readonly id = "formula.mathpix"; readonly kind = "FORMULA" as const; readonly displayName = "Mathpix Formula and Chemistry"; readonly version = "v3-text";
  private readonly normalizer = new RuleBasedFormulaProvider();
  isEnabled() { return mathpixConfigured(); } health() { return health(this.id, this.kind, this.isEnabled()); }
  async detect(input: Parameters<FormulaProvider["detect"]>[0]) {
    const raw = await callMathpix({ imageUrl: input.pageImageUrl });
    const lines = (raw.line_data ?? []).filter((line) => mathSignal.test(String(line.text ?? "")) || chemistrySignal.test(String(line.text ?? "")) || /math|chem/i.test(String(line.type ?? "")));
    const sourceLines = lines.length ? lines : (mathSignal.test(String(raw.text ?? "")) || chemistrySignal.test(String(raw.text ?? "")) ? [{ text: raw.text, confidence: raw.confidence }] : []);
    const normalized = await this.normalizer.detect({ ...input, layoutElements: sourceLines.map((line, index) => ({ id: `mathpix-${input.pageNumber}-${index + 1}`, elementType: "FORMULA_AREA", text: String(line.text ?? ""), coordinates: lineBox(line, finite(raw.image_width, 1), finite(raw.image_height, 1)), readingOrder: index + 1, confidence: clamp(line.confidence, clamp(raw.confidence, 0.7)), metadata: { mathpixType: line.type ?? null } })) });
    const formulas = normalized.formulas.map((formula) => ({ ...formula, providerId: this.id, providerVersion: String(raw.version ?? this.version), rawProviderOutput: { ...formula.rawProviderOutput, mathpixRequestId: raw.request_id ?? null } }));
    return { formulas, elements: normalized.elements.map((element, index) => ({ ...element, metadata: { ...element.metadata, formula: formulas[index] ?? record(element.metadata).formula, provider: this.id } })), confidence: formulas.length ? clamp(raw.confidence, normalized.confidence ?? 0.7) : null, raw: { provider: this.id, response: raw, formulaCount: formulas.length } };
  }
}

export class ProductionFormulaProvider implements FormulaProvider {
  readonly id = "formula.production"; readonly kind = "FORMULA" as const; readonly displayName = "NIDUS Routed Formula";
  private readonly base = new RuleBasedFormulaProvider(); private readonly mathpix = new MathpixFormulaProvider();
  isEnabled() { return true; } health() { return health(this.id, this.kind, true); }
  async detect(input: Parameters<FormulaProvider["detect"]>[0]) {
    const base = await this.base.detect(input);
    const text = `${input.ocrText ?? ""} ${input.layoutElements.map((element) => element.text ?? "").join(" ")}`;
    const specialistRequired = this.mathpix.isEnabled()
      && withinPageCost(ESTIMATED_PAGE_COST_USD.mathpix)
      && Boolean(input.pageImageUrl)
      && (mathSignal.test(text) || chemistrySignal.test(text) || Number(base.confidence ?? 0) < env.NDIE_FORMULA_CONFIDENCE_WARNING);
    if (!specialistRequired) return { ...base, raw: { ...base.raw, routing: { selected: this.base.id, reason: "no-specialist-signal" } } };
    try {
      const specialist = await this.mathpix.detect(input);
      if (specialist.formulas.length) return { ...specialist, raw: { ...specialist.raw, routing: { selected: this.mathpix.id, fallback: this.base.id } } };
    } catch { /* retain source-grounded fallback */ }
    return { ...base, raw: { ...base.raw, routing: { selected: this.base.id, fallbackFrom: this.mathpix.id, reviewRequired: true } } };
  }
}

export class ProductionAiProvider implements AiProvider {
  readonly id = "ai.production"; readonly kind = "AI" as const; readonly displayName = "NIDUS Evidence-Grounded Verification";
  private readonly base = new RuleBasedAiValidatorProvider(); private readonly openai = new OpenAiValidatorProvider();
  isEnabled() { return true; } health() { return health(this.id, this.kind, true); }
  async validate(input: Parameters<AiProvider["validate"]>[0]) {
    const deterministic = await this.base.validate(input);
    const uncertain = deterministic.validations.some((item) => item.reviewStatus !== "AUTO_APPROVED" || item.confidence < 0.85);
    const openAiAllowed = this.openai.isEnabled() && withinPageCost(ESTIMATED_PAGE_COST_USD.openAiVerification);
    if (!uncertain || !openAiAllowed) return { ...deterministic, raw: { ...deterministic.raw, routing: { selected: this.base.id, reason: uncertain ? "openai-not-configured-or-cost-limited" : "high-confidence" } } };
    try {
      const verified = await this.openai.validate(input);
      return { ...verified, raw: { ...verified.raw, routing: { selected: this.openai.id, fallback: this.base.id, evidenceImages: input.pageAssets?.length ?? 0 } } };
    } catch {
      return { ...deterministic, raw: { ...deterministic.raw, routing: { selected: this.base.id, fallbackFrom: this.openai.id, reviewRequired: true } } };
    }
  }
}
