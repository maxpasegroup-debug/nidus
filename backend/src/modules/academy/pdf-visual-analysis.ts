import { createCanvas } from "@napi-rs/canvas";
import sharp from "sharp";

export type PdfVisualType = "DIAGRAM" | "GRAPH" | "FIGURE" | "TABLE" | "EQUATION_IMAGE" | "UNKNOWN_VISUAL";
export type PdfVisualBoundingBox = { page: number; x: number; y: number; width: number; height: number };
export type PdfVisualRegion = {
  id: string;
  pageNumber: number;
  boundingBox: PdfVisualBoundingBox;
  sourceType: PdfVisualType;
  confidence: number;
  reviewRequired: boolean;
  sourceText?: string;
  sourceReference?: string;
  assetUrl?: string;
  cropMimeType?: "image/jpeg" | "image/png";
  cropWidth?: number;
  cropHeight?: number;
  /** Internal import-only crop. Never serialize this into API JSON. */
  cropBuffer?: Buffer;
  warnings?: string[];
};

export type PdfVisualStats = {
  candidateVisualRegions: number;
  visualRegionsAttached: number;
  visualRegionsReviewRequired: number;
  unassignedVisualRegions: number;
  visualCropsGenerated: number;
};

type OperatorListLike = { fnArray?: number[]; argsArray?: unknown[][] };
type PdfPageLike = {
  getViewport: (input: { scale: number }) => { width: number; height: number };
  // PDF.js has version-specific required render parameters (notably `canvas`).
  // Keep this internal adapter permissive so the extractor remains compatible
  // across supported pdfjs-dist releases while still supplying the parameters
  // required by the runtime below.
  render: (...args: any[]) => { promise: Promise<unknown> };
};

const IDENTITY = [1, 0, 0, 1, 0, 0];
function multiply(a: number[], b: number[]) {
  return [
    a[0] * b[0] + a[2] * b[1], a[1] * b[0] + a[3] * b[1],
    a[0] * b[2] + a[2] * b[3], a[1] * b[2] + a[3] * b[3],
    a[0] * b[4] + a[2] * b[5] + a[4], a[1] * b[4] + a[3] * b[5] + a[5],
  ];
}

function finiteMatrix(value: unknown): number[] | undefined {
  if (!Array.isArray(value) || value.length < 6) return undefined;
  const matrix = value.slice(0, 6).map(Number);
  return matrix.every(Number.isFinite) ? matrix : undefined;
}

function clamp(value: number, min = 0, max = 1) { return Math.max(min, Math.min(max, value)); }

function boxFromTransform(matrix: number[], pageNumber: number, pageWidth: number, pageHeight: number): PdfVisualBoundingBox {
  const points = [[0, 0], [1, 0], [0, 1], [1, 1]].map(([x, y]) => [matrix[0] * x + matrix[2] * y + matrix[4], matrix[1] * x + matrix[3] * y + matrix[5]]);
  const xs = points.map((point) => point[0]);
  const ys = points.map((point) => point[1]);
  const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
  return {
    page: pageNumber,
    x: clamp(minX / Math.max(1, pageWidth)),
    // PDF coordinates are bottom-up; normalize to a top-down document box.
    y: clamp(1 - maxY / Math.max(1, pageHeight)),
    width: clamp((maxX - minX) / Math.max(1, pageWidth)),
    height: clamp((maxY - minY) / Math.max(1, pageHeight)),
  };
}

function likelyDecorative(box: PdfVisualBoundingBox) {
  // Header/footer strips and full-page backgrounds are not question visuals.
  return box.width > 0.92 || (box.height < 0.08 && (box.y < 0.08 || box.y + box.height > 0.92));
}

function visualType(sourceText = ""): PdfVisualType {
  if (/graph|axis|coordinate/i.test(sourceText)) return "GRAPH";
  if (/table|row|column/i.test(sourceText)) return "TABLE";
  if (/equation|formula|matrix/i.test(sourceText)) return "EQUATION_IMAGE";
  if (/diagram|figure|shape|triangle|circle|circuit/i.test(sourceText)) return "DIAGRAM";
  return "UNKNOWN_VISUAL";
}

/**
 * Finds embedded image XObjects without attempting to understand their pixels.
 * `ops` is supplied by PDF.js so this module remains testable without loading
 * the native ESM PDF.js runtime in Jest.
 */
export function detectPdfVisualRegions(input: {
  pageNumber: number;
  pageWidth: number;
  pageHeight: number;
  operatorList?: OperatorListLike;
  ops?: Record<string, number>;
  sourceText?: string;
}): PdfVisualRegion[] {
  const list = input.operatorList;
  if (!list?.fnArray?.length) return [];
  const imageFns = new Set([
    input.ops?.paintImageMaskXObject,
    input.ops?.paintImageXObject,
    input.ops?.paintInlineImageXObject,
    input.ops?.paintImageXObjectRepeat,
  ].filter((value): value is number => typeof value === "number"));
  const canInspectPaths = typeof input.ops?.constructPath === "number";
  if (!imageFns.size && !canInspectPaths) return [];
  const regions: PdfVisualRegion[] = [];
  let transform = IDENTITY;
  let transformSeen = false;
  let imageIndex = 0;
  let pathCount = 0;
  const pathPoints: Array<[number, number]> = [];
  for (let index = 0; index < list.fnArray.length; index += 1) {
    const fn = list.fnArray[index];
    const args = list.argsArray?.[index] || [];
    if (typeof input.ops?.transform === "number" && fn === input.ops.transform) {
      const next = finiteMatrix(args.length >= 6 ? args : args[0] ?? args);
      if (next) { transform = multiply(transform, next); transformSeen = true; }
      continue;
    }
    if (typeof input.ops?.constructPath === "number" && fn === input.ops.constructPath) {
      // PDF.js exposes constructPath as [path operators, coordinate array].
      // We only use the coordinate envelope; interpreting the drawing's
      // semantics is intentionally out of scope for this phase.
      const coordinates = Array.isArray(args[1]) || ArrayBuffer.isView(args[1] as object) ? Array.from(args[1] as ArrayLike<unknown>).map(Number) : [];
      if (coordinates.length >= 4 && coordinates.every(Number.isFinite)) {
        pathCount += 1;
        for (let point = 0; point + 1 < coordinates.length; point += 2) {
          const x = Number(coordinates[point]);
          const y = Number(coordinates[point + 1]);
          pathPoints.push([transform[0] * x + transform[2] * y + transform[4], transform[1] * x + transform[3] * y + transform[5]]);
        }
      }
      continue;
    }
    if (!imageFns.has(fn)) continue;
    // Image operators use the current CTM. The unit image square is enough to
    // derive a normalized evidence box; if a producer omits a transform, the
    // candidate is retained but explicitly marked uncertain.
    const box = boxFromTransform(transform, input.pageNumber, input.pageWidth, input.pageHeight);
    const hasUsefulSize = box.width > 0.01 && box.height > 0.01;
    if ((transformSeen && likelyDecorative(box)) || /logo|watermark|header|footer/i.test(input.sourceText || "")) continue;
    const source = input.sourceText?.trim();
    regions.push({
      id: `pdf-${input.pageNumber}-visual-${imageIndex += 1}-${Math.round(box.x * 10000)}-${Math.round(box.y * 10000)}`,
      pageNumber: input.pageNumber,
      boundingBox: hasUsefulSize ? box : { ...box, x: 0, y: 0, width: 1, height: 1 },
      sourceType: visualType(source),
      confidence: hasUsefulSize ? 0.9 : 0.35,
      reviewRequired: !hasUsefulSize,
      sourceText: source,
      sourceReference: `Page ${input.pageNumber}`,
      ...(hasUsefulSize ? {} : { warnings: ["PDF visual bounds were not recoverable from the operator transform."] }),
    });
  }
  if (pathCount >= 4 && pathPoints.length) {
    const xs = pathPoints.map(([x]) => x), ys = pathPoints.map(([, y]) => y);
    const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
    const box = {
      page: input.pageNumber,
      x: clamp(minX / Math.max(1, input.pageWidth)),
      y: clamp(1 - maxY / Math.max(1, input.pageHeight)),
      width: clamp((maxX - minX) / Math.max(1, input.pageWidth)),
      height: clamp((maxY - minY) / Math.max(1, input.pageHeight)),
    };
    if (box.width > 0.01 && box.height > 0.01 && !likelyDecorative(box) && !/logo|watermark|header|footer/i.test(input.sourceText || "")) {
      regions.push({
        id: `pdf-${input.pageNumber}-visual-path-${pathCount}-${Math.round(box.x * 10000)}-${Math.round(box.y * 10000)}`,
        pageNumber: input.pageNumber,
        boundingBox: box,
        sourceType: visualType(input.sourceText?.trim()),
        confidence: 0.55,
        reviewRequired: true,
        sourceText: input.sourceText?.trim(),
        sourceReference: `Page ${input.pageNumber}`,
        warnings: ["Visual region inferred from PDF drawing operations; confirm the attachment in review."],
      });
    }
  }
  return regions;
}

/** Render one bounded source crop. It intentionally returns a raster image,
 * avoiding unsafe SVG/HTML derived from an uploaded PDF. */
export async function renderPdfVisualCrop(page: PdfPageLike, region: PdfVisualRegion, options: { dpi?: number; padding?: number; maxPixels?: number } = {}) {
  const crops = await renderPdfVisualCrops(page, [region], options);
  return crops[0] || { buffer: Buffer.alloc(0), mimeType: "image/jpeg" as const, width: 1, height: 1 };
}

/**
 * Render a page once and derive all requested crops from that raster. PDF
 * imports can contain several figures on one page; sharing the page render
 * avoids a costly render per image while keeping output bounded.
 */
export async function renderPdfVisualCrops(page: PdfPageLike, regions: PdfVisualRegion[], options: { dpi?: number; padding?: number; maxPixels?: number } = {}) {
  if (!regions.length) return [];
  const dpi = Math.max(72, Math.min(180, options.dpi || 120));
  const scale = dpi / 72;
  const viewport = page.getViewport({ scale });
  const canvas = createCanvas(Math.max(1, Math.ceil(viewport.width)), Math.max(1, Math.ceil(viewport.height)));
  const context = canvas.getContext("2d");
  // Match the repository's existing PDF.js server renderer. The canvas
  // implementation is supplied through canvasContext; passing browser-only
  // fields can make some PDF.js releases reject the render parameters.
  await page.render({ canvasContext: context, viewport }).promise;
  const padding = Math.max(0, Math.min(0.08, options.padding ?? 0.02));
  const maxPixels = Math.max(250_000, options.maxPixels || 4_000_000);
  const pagePng = canvas.toBuffer("image/png");
  return Promise.all(regions.map(async (region) => {
    const box = region.boundingBox;
    const x = Math.max(0, Math.floor((box.x - padding) * viewport.width));
    const y = Math.max(0, Math.floor((box.y - padding) * viewport.height));
    const right = Math.min(viewport.width, Math.ceil((box.x + box.width + padding) * viewport.width));
    const bottom = Math.min(viewport.height, Math.ceil((box.y + box.height + padding) * viewport.height));
    const width = Math.max(1, right - x), height = Math.max(1, bottom - y);
    const pixelScale = Math.min(1, Math.sqrt(maxPixels / Math.max(1, width * height)));
    const outputWidth = Math.max(1, Math.round(width * pixelScale));
    const outputHeight = Math.max(1, Math.round(height * pixelScale));
    const crop = await sharp(pagePng).extract({ left: x, top: y, width, height }).resize({ width: outputWidth, height: outputHeight, fit: "fill" }).jpeg({ quality: 86 }).toBuffer();
    return { buffer: crop, mimeType: "image/jpeg" as const, width: outputWidth, height: outputHeight };
  }));
}

export function visualStats(regions: PdfVisualRegion[], attached = 0): PdfVisualStats {
  return {
    candidateVisualRegions: regions.length,
    visualRegionsAttached: attached,
    visualRegionsReviewRequired: regions.filter((region) => region.reviewRequired).length,
    unassignedVisualRegions: Math.max(0, regions.length - attached),
    visualCropsGenerated: regions.filter((region) => Boolean(region.cropBuffer)).length,
  };
}

export function questionRequiresVisual(text: string) {
  const visual = "(?:figure|diagram|graph|chart|table|image|circuit|ray diagram|number line|venn diagram)";
  return new RegExp(
    `\\b(?:` +
    `(?:refer to|according to)\\s+(?:the\\s+)?(?:following\\s+)?${visual}` +
    `|${visual}\\s+(?:shown\\s+)?(?:above|below|following)` +
    `|(?:shown|depicted|illustrated)\\s+(?:in\\s+)?(?:the\\s+)?${visual}` +
    `)\\b`,
    "i",
  ).test(text);
}
