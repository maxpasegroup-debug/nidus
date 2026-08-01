import { createHash } from "node:crypto";
import { env } from "../../../config/env.js";
import type { NdieLayoutBox, NdieLayoutLine, NdieLayoutRegion, NdieLayoutRegionClassification, NdieNormalizedLayoutPage } from "../contracts/layout-result.js";
import type { NdieOcrBlock, NdieOcrLine, NdieNormalizedOcrPage, NdieOcrParagraph, NdieOcrWord } from "../contracts/ocr-result.js";
import type { LayoutProvider } from "../contracts/providers.js";

type LayoutInput = Parameters<LayoutProvider["analyze"]>[0];

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function normalizedOcr(value: unknown): NdieNormalizedOcrPage | null {
  const root = asRecord(value);
  const normalized = asRecord(root?.normalized);
  if (normalized?.schemaVersion === "ndie-ocr-v1") return normalized as NdieNormalizedOcrPage;
  return null;
}

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

function average(values: Array<number | null | undefined>) {
  const valid = values.filter((value): value is number => typeof value === "number" && Number.isFinite(value));
  if (!valid.length) return null;
  return Number((valid.reduce((sum, value) => sum + value, 0) / valid.length).toFixed(4));
}

function unionBox(pageNumber: number, rotation: number, boxes: Array<NdieLayoutBox | undefined>): NdieLayoutBox {
  const valid = boxes.filter((box): box is NdieLayoutBox => Boolean(box));
  if (!valid.length) return makeBox(pageNumber, 0, 0, 1, 1, rotation);
  const x = Math.min(...valid.map((box) => box.x));
  const y = Math.min(...valid.map((box) => box.y));
  const right = Math.max(...valid.map((box) => box.x + box.width));
  const bottom = Math.max(...valid.map((box) => box.y + box.height));
  return makeBox(pageNumber, x, y, right - x, bottom - y, rotation);
}

function makeBox(page: number, x: number, y: number, width: number, height: number, rotation = 0): NdieLayoutBox {
  const box = {
    page,
    x: clamp01(x),
    y: clamp01(y),
    width: clamp01(width),
    height: clamp01(height),
    rotation,
    normalized: {
      x: clamp01(x),
      y: clamp01(y),
      width: clamp01(width),
      height: clamp01(height)
    },
    polygon: [
      { x: clamp01(x), y: clamp01(y) },
      { x: clamp01(x + width), y: clamp01(y) },
      { x: clamp01(x + width), y: clamp01(y + height) },
      { x: clamp01(x), y: clamp01(y + height) }
    ]
  };
  return box;
}

function fromOcrBox(input: LayoutInput, box?: { x: number; y: number; width: number; height: number }): NdieLayoutBox {
  const width = input.width && input.width > 1 ? input.width : 1;
  const height = input.height && input.height > 1 ? input.height : 1;
  return makeBox(
    input.pageNumber,
    box ? box.x / width : 0.06,
    box ? box.y / height : 0.06,
    box ? box.width / width : 0.88,
    box ? box.height / height : 0.04,
    Number(input.rotation ?? 0)
  );
}

function fallbackLines(input: LayoutInput): NdieLayoutLine[] {
  const lines = String(input.ocrText || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const lineHeight = Math.min(0.05, 0.86 / Math.max(1, lines.length));
  return lines.map((line, index) => ({
    text: line,
    confidence: 0.62,
    coordinates: makeBox(input.pageNumber, 0.06, Math.min(0.94, 0.07 + index * lineHeight), 0.88, lineHeight, Number(input.rotation ?? 0)),
    readingOrder: index + 1,
    words: line.split(/\s+/).map((word, wordIndex) => ({
      text: word,
      confidence: 0.62,
      coordinates: makeBox(input.pageNumber, 0.06 + wordIndex * 0.08, Math.min(0.94, 0.07 + index * lineHeight), Math.min(0.08, word.length * 0.012), lineHeight, Number(input.rotation ?? 0)),
      readingOrder: wordIndex + 1,
      sourceReference: { source: "OCR_TEXT_FALLBACK", lineIndex: index, wordIndex }
    })),
    sourceReference: { source: "OCR_TEXT_FALLBACK", lineIndex: index }
  }));
}

function flattenOcr(input: LayoutInput, ocr: NdieNormalizedOcrPage | null) {
  if (!ocr?.blocks.length) {
    const lines = fallbackLines(input);
    return { paragraphs: [], lines, words: lines.flatMap((line) => line.words), rawBlocks: [] as NdieOcrBlock[] };
  }
  const paragraphs = ocr.blocks.flatMap((block) => block.paragraphs);
  const lines = paragraphs.flatMap((paragraph) => paragraph.lines);
  const words = lines.flatMap((line) => line.words);
  return { paragraphs, lines, words, rawBlocks: ocr.blocks };
}

function classifyRegion(line: NdieLayoutLine, input: LayoutInput): NdieLayoutRegionClassification {
  const text = line.text.trim();
  const lower = text.toLowerCase();
  const centerY = line.coordinates.y + line.coordinates.height / 2;
  const centerX = line.coordinates.x + line.coordinates.width / 2;
  if (centerY <= 0.1) return "HEADER";
  if (centerY > 0.92) return /^\s*(page\s*)?\d+\s*$/i.test(text) ? "PAGE_NUMBER" : "FOOTER";
  if (centerX < 0.04 || centerX > 0.96) return "MARGIN_NOTE";
  if (/instructions?|directions?|read carefully|choose the correct/i.test(text)) return "INSTRUCTION_AREA";
  if (/^\s*(answer|solution|key)\b/i.test(text)) return "ANSWER_AREA";
  if (/^\s*(q\.?\s*)?\d+[\).]/i.test(text)) return "QUESTION_AREA";
  if (/[|]\s*[^|]+\s*[|]/.test(text) || /\t/.test(text)) return "TABLE_AREA";
  if (/\b(fig\.?|figure|diagram|graph|chart)\b/i.test(lower)) return lower.includes("graph") || lower.includes("chart") ? "GRAPH_AREA" : "DIAGRAM_AREA";
  if (/[∫∑√πθλμαβγΔ∞≈≤≥]|\\frac|\\sqrt|[_^]/.test(text)) return "FORMULA_AREA";
  return "TEXT_REGION";
}

function makeLines(input: LayoutInput, ocrLines: NdieOcrLine[]) {
  return ocrLines.map((line, index): NdieLayoutLine => ({
    text: line.text,
    confidence: line.confidence,
    coordinates: fromOcrBox(input, line.boundingBox),
    readingOrder: line.readingOrder || index + 1,
    words: line.words.map((word: NdieOcrWord, wordIndex) => ({
      text: word.text,
      confidence: word.confidence,
      coordinates: fromOcrBox(input, word.boundingBox),
      readingOrder: wordIndex + 1,
      sourceReference: { source: "NORMALIZED_OCR", wordIndex }
    })),
    sourceReference: { source: "NORMALIZED_OCR", lineReadingOrder: line.readingOrder }
  }));
}

function columnNumber(box: NdieLayoutBox, columns: number) {
  if (columns <= 1) return 1;
  const center = box.x + box.width / 2;
  return Math.max(1, Math.min(columns, Math.floor(center * columns) + 1));
}

function detectColumnCount(regions: NdieLayoutRegion[]) {
  const body = regions.filter((region) => !["HEADER", "FOOTER", "PAGE_NUMBER", "MARGIN_NOTE"].includes(region.classification));
  if (body.length < 3) return 1;
  const centers = body.map((region) => region.coordinates.x + region.coordinates.width / 2);
  const left = centers.filter((center) => center < 0.38).length;
  const middle = centers.filter((center) => center >= 0.38 && center <= 0.62).length;
  const right = centers.filter((center) => center > 0.62).length;
  if (left >= 2 && middle >= 2 && right >= 2) return 3;
  if (left >= 2 && right >= 2 && middle <= Math.max(2, body.length * 0.25)) return 2;
  return 1;
}

function overlaps(a: NdieLayoutBox, b: NdieLayoutBox) {
  const x = Math.max(0, Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x));
  const y = Math.max(0, Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y));
  const area = x * y;
  const minArea = Math.min(a.width * a.height, b.width * b.height);
  return minArea > 0 && area / minArea > 0.4;
}

export class RuleBasedLayoutProvider implements LayoutProvider {
  readonly id = "layout.rule-based";
  readonly kind = "LAYOUT" as const;
  readonly displayName = "NDIE Rule-Based Layout Analyzer";
  readonly version = "1.0-gate5";

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

  async analyze(input: LayoutInput) {
    const startedAt = Date.now();
    const ocr = normalizedOcr(input.ocrJson);
    const flattened = flattenOcr(input, ocr);
    const lines = flattened.lines.length && ocr ? makeLines(input, flattened.lines as NdieOcrLine[]) : fallbackLines(input);
    const words = lines.flatMap((line) => line.words);
    const paragraphs = (flattened.paragraphs as NdieOcrParagraph[]).map((paragraph, index) => ({
      text: paragraph.text,
      confidence: paragraph.confidence,
      coordinates: fromOcrBox(input, paragraph.boundingBox),
      readingOrder: paragraph.readingOrder || index + 1,
      lines: lines.filter((line) => paragraph.lines.some((ocrLine) => ocrLine.text === line.text)),
      sourceReference: { source: "NORMALIZED_OCR", paragraphReadingOrder: paragraph.readingOrder }
    }));

    const provisionalRegions = lines.map((line, index): NdieLayoutRegion => ({
      id: `layout-region-${input.pageNumber}-${index + 1}`,
      classification: classifyRegion(line, input),
      text: line.text,
      normalizedText: line.text.toLowerCase(),
      confidence: line.confidence,
      coordinates: line.coordinates,
      readingOrder: index + 1,
      paragraphIds: [],
      lineIds: [`line-${input.pageNumber}-${index + 1}`],
      sourceReference: line.sourceReference,
      providerMetadata: {
        provider: this.id,
        source: ocr ? "NORMALIZED_OCR" : "OCR_TEXT_FALLBACK"
      }
    }));

    const columnCount = detectColumnCount(provisionalRegions);
    const regions = provisionalRegions
      .map((region) => ({ ...region, columnNumber: columnNumber(region.coordinates, columnCount) }))
      .sort((a, b) => {
        const aHeader = ["HEADER", "FOOTER", "PAGE_NUMBER"].includes(a.classification) ? 0 : 1;
        const bHeader = ["HEADER", "FOOTER", "PAGE_NUMBER"].includes(b.classification) ? 0 : 1;
        return aHeader - bHeader || (a.columnNumber ?? 1) - (b.columnNumber ?? 1) || a.coordinates.y - b.coordinates.y || a.coordinates.x - b.coordinates.x;
      })
      .map((region, index) => ({ ...region, readingOrder: index + 1 }));

    const columns = Array.from({ length: columnCount }, (_, index) => {
      const column = index + 1;
      const columnRegions = regions.filter((region) => region.columnNumber === column && !["HEADER", "FOOTER", "PAGE_NUMBER"].includes(region.classification));
      return {
        columnNumber: column,
        coordinates: unionBox(input.pageNumber, Number(input.rotation ?? 0), columnRegions.map((region) => region.coordinates)),
        readingOrder: column,
        confidence: columnRegions.length ? average(columnRegions.map((region) => region.confidence)) : 0.5,
        regionIds: columnRegions.map((region) => region.id)
      };
    });

    const tableRegions = regions.filter((region) => region.classification === "TABLE_AREA");
    const tables = tableRegions.length ? [{
      id: `layout-table-${input.pageNumber}-1`,
      coordinates: unionBox(input.pageNumber, Number(input.rotation ?? 0), tableRegions.map((region) => region.coordinates)),
      rows: tableRegions.length,
      columns: Math.max(2, Math.max(...tableRegions.map((region) => String(region.text ?? "").split(/[|\t]/).filter(Boolean).length), 2)),
      cells: tableRegions.flatMap((region, row) => String(region.text ?? "").split(/[|\t]/).filter(Boolean).map((cell, column) => ({
        row: row + 1,
        column: column + 1,
        rowSpan: 1,
        colSpan: 1,
        text: cell.trim(),
        coordinates: region.coordinates,
        confidence: region.confidence
      }))),
      multiPage: false,
      nested: false,
      confidence: average(tableRegions.map((region) => region.confidence)),
      sourceRegionIds: tableRegions.map((region) => region.id)
    }] : [];

    const figureRegions = regions.filter((region) => ["DIAGRAM_AREA", "GRAPH_AREA"].includes(region.classification));
    const figures = figureRegions.map((region, index) => ({
      id: `layout-figure-${input.pageNumber}-${index + 1}`,
      kind: region.classification === "GRAPH_AREA" ? "GRAPH" as const : "DIAGRAM" as const,
      coordinates: region.coordinates,
      caption: region.text,
      confidence: region.confidence,
      sourceRegionIds: [region.id]
    }));

    const pairOverlaps = regions.some((region, index) => regions.slice(index + 1).some((other) => overlaps(region.coordinates, other.coordinates)));
    const lowConfidence = average(regions.map((region) => region.confidence)) ?? 0;
    const diagnostics = {
      overlappingRegions: pairOverlaps,
      missingReadingOrder: regions.some((region) => !region.readingOrder),
      lowConfidence: lowConfidence < env.NDIE_LAYOUT_CONFIDENCE_WARNING,
      pageSkew: Boolean(input.rotation && input.rotation % 360 !== 0),
      brokenColumns: columnCount > 1 && columns.some((column) => column.regionIds.length === 0),
      tableAmbiguity: tableRegions.length > 0 && (tables[0]?.columns ?? 0) < 2,
      figureAmbiguity: figureRegions.length > 0 && figureRegions.some((region) => !region.text),
      issues: [] as string[]
    };
    if (diagnostics.overlappingRegions) diagnostics.issues.push("OVERLAPPING_REGIONS");
    if (diagnostics.missingReadingOrder) diagnostics.issues.push("MISSING_READING_ORDER");
    if (diagnostics.lowConfidence) diagnostics.issues.push("LOW_LAYOUT_CONFIDENCE");
    if (diagnostics.pageSkew) diagnostics.issues.push("PAGE_ROTATION_OR_SKEW");
    if (diagnostics.brokenColumns) diagnostics.issues.push("BROKEN_COLUMNS");
    if (diagnostics.tableAmbiguity) diagnostics.issues.push("TABLE_AMBIGUITY");
    if (diagnostics.figureAmbiguity) diagnostics.issues.push("FIGURE_AMBIGUITY");

    const confidence = Number(((lowConfidence || (input.imageUrl ? 0.65 : 0.35)) - diagnostics.issues.length * 0.03).toFixed(4));
    const normalized: NdieNormalizedLayoutPage = {
      schemaVersion: "ndie-layout-v1",
      providerId: this.id,
      providerVersion: this.version,
      pipelineVersion: env.NDIE_PIPELINE_VERSION,
      pageId: input.pageId,
      pageNumber: input.pageNumber,
      page: {
        width: input.width ?? null,
        height: input.height ?? null,
        rotation: input.rotation ?? null,
        dpi: input.dpi ?? null,
        aspectRatio: input.aspectRatio ?? null
      },
      regions,
      paragraphs,
      lines,
      words,
      columns,
      tables,
      figures,
      headers: regions.filter((region) => region.classification === "HEADER"),
      footers: regions.filter((region) => region.classification === "FOOTER"),
      pageNumbers: regions.filter((region) => region.classification === "PAGE_NUMBER"),
      margins: regions.filter((region) => region.classification === "MARGIN_NOTE"),
      readingGroups: columns.map((column) => ({
        id: `reading-group-page-${input.pageNumber}-column-${column.columnNumber}`,
        groupType: "COLUMN",
        readingOrder: column.readingOrder,
        coordinates: column.coordinates,
        regionIds: column.regionIds,
        confidence: column.confidence
      })),
      readingOrder: regions.map((region) => region.id),
      confidence,
      diagnostics,
      providerMetadata: {
        provider: this.id,
        ocrProvider: ocr?.providerId ?? null,
        source: ocr ? "NORMALIZED_OCR" : "OCR_TEXT_FALLBACK",
        layoutMode: `${columnCount}_COLUMN_ESTIMATED`
      },
      checksum: createHash("sha256").update(JSON.stringify({ input: input.pageId, regions, columns, tables, figures })).digest("hex"),
      durationMs: Date.now() - startedAt,
      createdAt: new Date().toISOString()
    };

    return {
      normalized,
      raw: {
        provider: this.id,
        sourceOcrSchema: ocr?.schemaVersion ?? null,
        lineCount: lines.length,
        regionCount: regions.length,
        columnCount
      },
      elements: regions.map((region) => ({
        elementType: region.classification,
        text: region.text,
        normalizedText: region.normalizedText,
        coordinates: region.coordinates,
        readingOrder: region.readingOrder,
        confidence: region.confidence,
        metadata: {
          ...region.providerMetadata,
          regionId: region.id,
          columnNumber: region.columnNumber
        }
      })),
      layoutJson: normalized,
      confidence
    };
  }
}
