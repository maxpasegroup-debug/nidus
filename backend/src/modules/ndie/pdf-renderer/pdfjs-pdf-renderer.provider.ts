import { createHash } from "node:crypto";
import { createCanvas } from "@napi-rs/canvas";
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";
import sharp from "sharp";
import { env } from "../../../config/env.js";
import type { RendererProvider } from "../contracts/providers.js";
import { ndieAssetStorageProvider, readNdieStoredUrl, type NdieAssetStorageProvider, type NdieStoredAsset } from "../storage/storage-provider.js";

type PdfAssetRole = "previewImage" | "reviewImage" | "ocrImage" | "thumbnailImage";

type PageAssetMap = Record<PdfAssetRole, NdieStoredAsset>;

function checksum(buffer: Buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

function isEncryptedPdf(buffer: Buffer) {
  return buffer.subarray(0, Math.min(buffer.length, 4096 * 16)).toString("latin1").includes("/Encrypt");
}

async function bufferFromUrl(url: string) {
  return readNdieStoredUrl(url);
}

function classifyPdfError(error: unknown) {
  const message = error instanceof Error ? error.message : "PDF render failed";
  const name = error instanceof Error ? error.name : "PdfRenderError";
  if (/password/i.test(name) || /password/i.test(message)) return Object.assign(new Error("PDF is password protected. Upload an unlocked PDF for NDIE rendering."), { statusCode: 422 });
  if (/invalid|corrupt|format/i.test(message)) return Object.assign(new Error("PDF appears corrupted or unsupported. Upload a valid PDF file."), { statusCode: 422 });
  return Object.assign(new Error("PDF rendering failed. Please retry or upload a clean PDF."), { statusCode: 500 });
}

function assertValidPdf(buffer: Buffer) {
  if (buffer.subarray(0, 4).toString("utf8") !== "%PDF") {
    throw Object.assign(new Error("Uploaded source is not a valid PDF."), { statusCode: 415 });
  }
  if (isEncryptedPdf(buffer)) {
    throw Object.assign(new Error("PDF is encrypted or password protected. Upload an unlocked PDF for NDIE rendering."), { statusCode: 422 });
  }
}

async function renderPageToPng(page: pdfjs.PDFPageProxy, dpi: number) {
  const scale = dpi / 72;
  const viewport = page.getViewport({ scale });
  const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
  const context = canvas.getContext("2d");
  const startedAt = Date.now();
  await page.render({ canvasContext: context as never, viewport } as never).promise;
  return {
    buffer: canvas.toBuffer("image/png"),
    width: viewport.width,
    height: viewport.height,
    renderDurationMs: Date.now() - startedAt
  };
}

async function makeJpeg(input: Buffer, width: number, quality: number) {
  return sharp(input).resize({ width, withoutEnlargement: true }).jpeg({ quality }).toBuffer();
}

function assetSummary(asset: NdieStoredAsset) {
  return {
    url: asset.secureUrl,
    publicId: asset.publicId,
    sizeBytes: asset.sizeBytes,
    checksum: asset.checksum
  };
}

export class PdfJsRendererProvider implements RendererProvider {
  readonly id = "renderer.pdfjs";
  readonly kind = "RENDERER" as const;
  readonly displayName = "NDIE PDF.js Enterprise Renderer";
  readonly version = "pdfjs-dist";

  constructor(private readonly storage: NdieAssetStorageProvider = ndieAssetStorageProvider) {}

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

  async render(input: {
    importJobId: string;
    sourceDocumentId: string;
    fileType: string;
    fileBuffer?: Buffer;
    storageUrl?: string;
    storagePublicId?: string;
  }) {
    if (input.fileType !== "application/pdf") {
      return {
        pageCount: 0,
        pages: [],
        diagnostics: { skipped: true, reason: "PDF.js renderer only handles PDF sources." },
        providerRun: { renderer: this.id, status: "SKIPPED_NON_PDF" }
      };
    }

    const sourceBuffer = input.fileBuffer ?? (input.storageUrl ? await bufferFromUrl(input.storageUrl) : undefined);
    if (!sourceBuffer?.length) throw Object.assign(new Error("No preserved PDF source was available for rendering."), { statusCode: 422 });
    assertValidPdf(sourceBuffer);

    const startedAt = Date.now();
    const pages: Awaited<ReturnType<RendererProvider["render"]>>["pages"] = [];
    const diagnostics = {
      missingPages: [] as number[],
      duplicatePages: [] as number[],
      failedPages: [] as Array<{ pageNumber: number; reason: string }>,
      emptyPages: [] as number[],
      corruptedPages: [] as number[],
      rotationWarnings: [] as Array<{ pageNumber: number; rotation: number }>,
      sourceChecksum: checksum(sourceBuffer)
    };

    let document: pdfjs.PDFDocumentProxy;
    try {
      document = await pdfjs.getDocument({
        data: new Uint8Array(sourceBuffer),
        disableFontFace: true,
        useSystemFonts: true
      }).promise;
    } catch (error) {
      throw classifyPdfError(error);
    }

    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
      const pageStartedAt = Date.now();
      try {
        const page = await document.getPage(pageNumber);
        const rotation = page.rotate || 0;
        if (rotation) diagnostics.rotationWarnings.push({ pageNumber, rotation });

        const review = await renderPageToPng(page, env.NDIE_RENDER_REVIEW_DPI);
        const ocr = env.NDIE_RENDER_OCR_DPI === env.NDIE_RENDER_REVIEW_DPI
          ? review
          : await renderPageToPng(page, env.NDIE_RENDER_OCR_DPI);
        const previewBuffer = await makeJpeg(review.buffer, env.NDIE_RENDER_PREVIEW_WIDTH, 82);
        const thumbnailBuffer = await makeJpeg(review.buffer, env.NDIE_RENDER_THUMBNAIL_WIDTH, 72);
        const folder = `nidus/ndie/rendered/${input.importJobId}/${input.sourceDocumentId}/page-${pageNumber}`;

        const assets: PageAssetMap = {
          reviewImage: await this.storage.uploadPageImage({ buffer: review.buffer, fileName: `page-${pageNumber}-review.png`, folder, mimeType: "image/png" }),
          ocrImage: await this.storage.uploadPageImage({ buffer: ocr.buffer, fileName: `page-${pageNumber}-ocr.png`, folder, mimeType: "image/png" }),
          previewImage: await this.storage.uploadPageImage({ buffer: previewBuffer, fileName: `page-${pageNumber}-preview.jpg`, folder, mimeType: "image/jpeg" }),
          thumbnailImage: await this.storage.uploadPageImage({ buffer: thumbnailBuffer, fileName: `page-${pageNumber}-thumb.jpg`, folder, mimeType: "image/jpeg" })
        };

        const stats = await sharp(review.buffer).stats();
        if (stats.channels.every((channel) => channel.mean > 250 && channel.stdev < 2)) diagnostics.emptyPages.push(pageNumber);

        pages.push({
          pageNumber,
          width: Number((review.width / (env.NDIE_RENDER_REVIEW_DPI / 72)).toFixed(2)),
          height: Number((review.height / (env.NDIE_RENDER_REVIEW_DPI / 72)).toFixed(2)),
          rotation,
          dpi: env.NDIE_RENDER_REVIEW_DPI,
          aspectRatio: Number((review.width / review.height).toFixed(6)),
          imageSizeBytes: assets.reviewImage.sizeBytes,
          checksum: assets.reviewImage.checksum,
          storageProvider: assets.reviewImage.storageProvider,
          storageLocation: assets.reviewImage.publicId,
          providerVersion: this.version,
          renderDurationMs: Date.now() - pageStartedAt,
          renderedAt: new Date().toISOString(),
          diagnostics: {
            reviewDurationMs: review.renderDurationMs,
            ocrDurationMs: ocr.renderDurationMs,
            previewSizeBytes: assets.previewImage.sizeBytes,
            ocrSizeBytes: assets.ocrImage.sizeBytes,
            thumbnailSizeBytes: assets.thumbnailImage.sizeBytes
          },
          imageUrl: assets.reviewImage.secureUrl,
          imagePublicId: assets.reviewImage.publicId,
          thumbnailUrl: assets.thumbnailImage.secureUrl,
          previewImage: assetSummary(assets.previewImage),
          reviewImage: assetSummary(assets.reviewImage),
          ocrImage: assetSummary(assets.ocrImage),
          thumbnailImage: assetSummary(assets.thumbnailImage),
          renderStatus: "PAGE_RENDERED"
        });
      } catch (error) {
        diagnostics.failedPages.push({ pageNumber, reason: error instanceof Error ? error.message : "Page render failed" });
        pages.push({
          pageNumber,
          renderStatus: "RENDER_FAILED",
          renderDurationMs: Date.now() - pageStartedAt,
          renderedAt: new Date().toISOString(),
          diagnostics: { error: error instanceof Error ? error.message : "Page render failed" }
        });
      }
    }

    const pageNumbers = new Set(pages.map((page) => page.pageNumber));
    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
      if (!pageNumbers.has(pageNumber)) diagnostics.missingPages.push(pageNumber);
    }

    const failedPageCount = diagnostics.failedPages.length;
    return {
      pageCount: document.numPages,
      pages,
      diagnostics,
      providerRun: {
        renderer: this.id,
        rendererVersion: this.version,
        sourcePublicId: input.storagePublicId,
        pageCount: document.numPages,
        pagesRendered: pages.filter((page) => page.renderStatus === "PAGE_RENDERED").length,
        failedPages: failedPageCount,
        totalDurationMs: Date.now() - startedAt,
        reviewDpi: env.NDIE_RENDER_REVIEW_DPI,
        ocrDpi: env.NDIE_RENDER_OCR_DPI,
        storageProvider: this.storage.id,
        status: failedPageCount ? "PARTIAL_RENDER" : "PAGES_CREATED"
      }
    };
  }
}
