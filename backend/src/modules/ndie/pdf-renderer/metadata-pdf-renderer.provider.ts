import type { RendererProvider } from "../contracts/providers.js";
import { assertCloudinaryReady, signedCloudinaryPageImageUrl, uploadBufferToCloudinaryResource } from "../../../config/cloudinary.js";

function pdfMetadata(buffer?: Buffer) {
  if (!buffer?.length) return { pageCount: 1, width: undefined, height: undefined };
  const text = buffer.toString("latin1");
  const pageMatches = text.match(/\/Type\s*\/Page\b/g);
  const mediaBox = text.match(/\/MediaBox\s*\[\s*0\s+0\s+([0-9.]+)\s+([0-9.]+)\s*\]/);
  return {
    pageCount: Math.max(1, pageMatches?.length ?? 1),
    width: mediaBox?.[1] ? Number(mediaBox[1]) : undefined,
    height: mediaBox?.[2] ? Number(mediaBox[2]) : undefined
  };
}

export class MetadataPdfRendererProvider implements RendererProvider {
  readonly id = "renderer.metadata";
  readonly kind = "RENDERER" as const;
  readonly displayName = "NDIE Metadata PDF Renderer";

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
    if (input.fileType.startsWith("image/")) {
      return {
        pageCount: 1,
        pages: [{
          pageNumber: 1,
          imageUrl: input.storageUrl,
          imagePublicId: input.storagePublicId,
          renderStatus: "SOURCE_IMAGE"
        }],
        providerRun: {
          renderer: this.id,
          strategy: "SOURCE_IMAGE",
          note: "Image source preserved as page 1."
        }
      };
    }

    if (input.fileType === "application/pdf") {
      const metadata = pdfMetadata(input.fileBuffer);
      let renderPublicId: string | undefined;
      let renderError: string | undefined;

      if (input.fileBuffer?.length && assertCloudinaryReady()) {
        try {
          const renderable = await uploadBufferToCloudinaryResource(
            { buffer: input.fileBuffer, originalname: `renderable-${input.sourceDocumentId}.pdf`, mimetype: "application/pdf" },
            "nidus/ndie/renderables",
            "image"
          );
          renderPublicId = renderable.publicId;
        } catch (error) {
          renderError = error instanceof Error ? error.message : "Cloudinary renderable upload failed";
        }
      }

      return {
        pageCount: metadata.pageCount,
        pages: Array.from({ length: metadata.pageCount }, (_item, index) => ({
          pageNumber: index + 1,
          width: metadata.width,
          height: metadata.height,
          imageUrl: renderPublicId ? signedCloudinaryPageImageUrl(renderPublicId, index + 1) : undefined,
          imagePublicId: renderPublicId,
          renderStatus: renderPublicId ? "PAGE_IMAGE_READY" : "PENDING_BITMAP_RENDER"
        })),
        providerRun: {
          renderer: this.id,
          strategy: renderPublicId ? "CLOUDINARY_PDF_PAGE_IMAGES" : "PDF_PAGE_MANIFEST",
          pageCount: metadata.pageCount,
          renderPublicId,
          renderError,
          note: renderPublicId
            ? "PDF was uploaded as a server-side renderable document and page image URLs were generated."
            : "Page records were created. Bitmap rendering remains pending because no renderable image provider completed."
        }
      };
    }

    return {
      pageCount: 1,
      pages: [{
        pageNumber: 1,
        renderStatus: "PENDING_RENDER"
      }],
      providerRun: {
        renderer: this.id,
        strategy: "DOCUMENT_PLACEHOLDER",
        note: "Document preserved; semantic parser or OCR provider must create visual pages."
      }
    };
  }
}
