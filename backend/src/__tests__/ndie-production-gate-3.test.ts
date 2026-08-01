import { describe, expect, it } from "@jest/globals";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { assertNdieJobTransition } from "../modules/ndie/queue/state-machine.js";

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");

describe("NDIE Production Gate 3 enterprise PDF rendering", () => {
  const schema = read("prisma/schema.prisma");
  const env = read("src/config/env.ts");
  const provider = read("src/modules/ndie/pdf-renderer/pdfjs-pdf-renderer.provider.ts");
  const rendererService = read("src/modules/ndie/pdf-renderer/pdf-renderer.service.ts");
  const worker = read("src/modules/ndie/worker/worker.service.ts");
  const stateMachine = read("src/modules/ndie/queue/state-machine.ts");
  const container = read("src/modules/ndie/ndie.container.ts");

  it("renders every page into review, OCR, preview and thumbnail assets", () => {
    expect(provider).toContain("for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1)");
    expect(provider).toContain("reviewImage");
    expect(provider).toContain("ocrImage");
    expect(provider).toContain("previewImage");
    expect(provider).toContain("thumbnailImage");
    expect(provider).toContain("renderStatus: \"PAGE_RENDERED\"");
  });

  it("reports unsupported, encrypted, password or corrupted PDFs as professional validation errors", () => {
    expect(provider).toContain("Uploaded source is not a valid PDF.");
    expect(provider).toContain("PDF is encrypted or password protected");
    expect(provider).toContain("PDF is password protected");
    expect(provider).toContain("PDF appears corrupted or unsupported");
  });

  it("persists enterprise page metadata and page asset roles", () => {
    expect(schema).toContain("dpi");
    expect(schema).toContain("aspectRatio");
    expect(schema).toContain("imageSizeBytes");
    expect(schema).toContain("checksum");
    expect(schema).toContain("storageLocation");
    expect(schema).toContain("renderDurationMs");
    expect(schema).toContain("renderedAt");
    expect(rendererService).toContain("PREVIEW_IMAGE");
    expect(rendererService).toContain("REVIEW_IMAGE");
    expect(rendererService).toContain("OCR_IMAGE");
    expect(rendererService).toContain("THUMBNAIL");
  });

  it("uses PDF.js provider abstraction with production renderer defaults", () => {
    expect(container).toContain("new PdfJsRendererProvider()");
    expect(env).toContain('NDIE_RENDERER_PROVIDER: z.string().default("renderer.pdfjs")');
    expect(provider).toContain("pdfjs-dist/legacy/build/pdf.mjs");
    expect(provider).toContain("@napi-rs/canvas");
    expect(provider).toContain("sharp");
  });

  it("integrates PDF rendering with worker checkpoints only", () => {
    expect(worker).toContain('job.stage === "PDF_RENDERING"');
    expect(worker).toContain("ndiePdfRendererService.renderSourceDocument");
    expect(worker).toContain('"RENDERING"');
    expect(worker).toContain('"PAGES_CREATED"');
    expect(worker).toContain('"READY_FOR_OCR"');
    expect(() => assertNdieJobTransition("PROCESSING", "RENDERING")).not.toThrow();
    expect(() => assertNdieJobTransition("RENDERING", "READY_FOR_OCR")).toThrow();
    expect(stateMachine).toContain('"READY_FOR_OCR"');
  });

  it("adds page integrity, large PDF and renderer health signals", () => {
    expect(provider).toContain("missingPages");
    expect(provider).toContain("duplicatePages");
    expect(provider).toContain("failedPages");
    expect(provider).toContain("emptyPages");
    expect(provider).toContain("rotationWarnings");
    expect(provider).toContain("for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1)");
    expect(rendererService).toContain("averageRenderDurationMs");
    expect(rendererService).toContain("failedRenders");
    expect(rendererService).toContain("pageRenderingStatus");
  });
});
