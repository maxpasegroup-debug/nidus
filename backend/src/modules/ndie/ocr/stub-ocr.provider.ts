import type { OcrProvider } from "../contracts/providers.js";

export class StubOcrProvider implements OcrProvider {
  readonly id = "ocr.stub";
  readonly kind = "OCR" as const;
  readonly displayName = "NDIE OCR Stub";

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

  async recognize(input: { importJobId: string; pageId: string; pageNumber: number; imageUrl?: string | null }) {
    return {
      text: "",
      confidence: null,
      raw: {
        provider: this.id,
        pageId: input.pageId,
        pageNumber: input.pageNumber,
        imageUrl: input.imageUrl ?? null,
        status: input.imageUrl ? "PENDING_PROVIDER_OCR" : "WAITING_FOR_RENDERED_PAGE_IMAGE",
        note: "OCR provider interface is wired. Real OCR provider can replace this without changing NDIE pipeline storage."
      }
    };
  }
}
