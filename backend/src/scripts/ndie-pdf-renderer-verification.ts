import PDFDocument from "pdfkit";
import { PdfJsRendererProvider } from "../modules/ndie/pdf-renderer/pdfjs-pdf-renderer.provider.js";
import type { NdieAssetStorageProvider } from "../modules/ndie/storage/storage-provider.js";

function makePdf(pageCount: number) {
  return new Promise<Buffer>((resolve) => {
    const doc = new PDFDocument({ autoFirstPage: false, margin: 24 });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    for (let page = 1; page <= pageCount; page += 1) {
      doc.addPage({ size: "A4" });
      doc.fontSize(18).text(`NIDUS PDF render verification page ${page}`);
      doc.fontSize(12).text("PDF rendering only. OCR, layout and formula recognition are intentionally not executed.");
    }
    doc.end();
  });
}

class VerificationStorage implements NdieAssetStorageProvider {
  readonly id = "verification-storage";
  uploads: Array<{ fileName: string; size: number; mimeType: string }> = [];

  async uploadPageImage(input: { buffer: Buffer; fileName: string; folder: string; mimeType: "image/png" | "image/jpeg" }) {
    this.uploads.push({ fileName: input.fileName, size: input.buffer.length, mimeType: input.mimeType });
    return {
      secureUrl: `verification://${input.folder}/${input.fileName}`,
      publicId: `${input.folder}/${input.fileName}`,
      resourceType: "image",
      checksum: `verification-${this.uploads.length}-${input.buffer.length}`,
      sizeBytes: input.buffer.length,
      storageProvider: this.id
    };
  }
}

async function main() {
  const storage = new VerificationStorage();
  const renderer = new PdfJsRendererProvider(storage);
  const startedAt = Date.now();
  const result = await renderer.render({
    importJobId: "verification-import",
    sourceDocumentId: "verification-source",
    fileType: "application/pdf",
    fileBuffer: await makePdf(2)
  });

  if (result.pageCount !== 2) throw new Error(`Expected 2 pages, got ${result.pageCount}`);
  if (result.pages.length !== 2) throw new Error(`Expected 2 page results, got ${result.pages.length}`);
  if (storage.uploads.length !== 8) throw new Error(`Expected 8 page assets, got ${storage.uploads.length}`);
  for (const page of result.pages) {
    if (page.renderStatus !== "PAGE_RENDERED") throw new Error(`Page ${page.pageNumber} render status ${page.renderStatus}`);
    if (!page.reviewImage || !page.ocrImage || !page.previewImage || !page.thumbnailImage) throw new Error(`Page ${page.pageNumber} missing image variants`);
    if (!page.width || !page.height || !page.checksum) throw new Error(`Page ${page.pageNumber} missing metadata`);
  }

  console.log(JSON.stringify({
    status: "PASS",
    renderer: result.providerRun.renderer,
    pageCount: result.pageCount,
    pagesRendered: result.providerRun.pagesRendered,
    assetsUploaded: storage.uploads.length,
    durationMs: Date.now() - startedAt
  }));
}

main().catch((error) => {
  console.error(JSON.stringify({
    status: "FAIL",
    message: error instanceof Error ? error.message : "PDF render verification failed"
  }));
  process.exit(1);
});
