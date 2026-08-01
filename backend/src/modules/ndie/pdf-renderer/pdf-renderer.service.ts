import type { Prisma } from "../../../generated/prisma/client.js";
import { env } from "../../../config/env.js";
import { prisma } from "../../../config/prisma.js";
import { signedMediaUrl } from "../../../config/cloudinary.js";
import type { RendererProvider } from "../contracts/providers.js";
import { createNdieContainer } from "../ndie.container.js";

const container = createNdieContainer();

export const ndiePdfRendererService = {
  async health() {
    const provider = container.providerRegistry.get<RendererProvider>(env.NDIE_RENDERER_PROVIDER);
    const [aggregate, failedRenders, pageRenderingStatus] = await Promise.all([
      prisma.ndiePage.aggregate({ where: { renderDurationMs: { not: null } }, _avg: { renderDurationMs: true }, _count: { _all: true } }),
      prisma.ndiePage.count({ where: { renderStatus: "RENDER_FAILED" } }),
      prisma.ndiePage.groupBy({ by: ["renderStatus"], _count: { _all: true } })
    ]);
    return {
      renderer: provider?.id ?? env.NDIE_RENDERER_PROVIDER,
      rendererVersion: provider && "version" in provider ? String(provider.version) : provider?.id ?? "unknown",
      rendererStatus: provider?.health().status ?? "NOT_CONFIGURED",
      storageProvider: "cloudinary",
      averageRenderDurationMs: Math.round(aggregate._avg.renderDurationMs ?? 0),
      renderedPageRecords: aggregate._count._all,
      failedRenders,
      pageRenderingStatus: pageRenderingStatus.reduce<Record<string, number>>((acc, row) => {
        acc[row.renderStatus] = row._count._all;
        return acc;
      }, {})
    };
  },

  async renderSourceDocument(input: {
    importJobId: string;
    sourceDocumentId: string;
    fileType: string;
    fileBuffer?: Buffer;
    storageUrl?: string;
    storagePublicId?: string;
  }) {
    const provider = container.providerRegistry.get<RendererProvider>(env.NDIE_RENDERER_PROVIDER);
    if (!provider) throw new Error(`NDIE renderer provider ${env.NDIE_RENDERER_PROVIDER} is not registered`);

    const startedAt = new Date();
    const storageUrl = input.storageUrl ?? (input.storagePublicId ? signedMediaUrl(input.storagePublicId, input.fileType) : undefined);
    const result = await provider.render({ ...input, storageUrl });
    const completedAt = new Date();
    const failedPages = result.pages.filter((page) => !["PAGE_RENDERED", "SOURCE_IMAGE"].includes(page.renderStatus));
    const renderedPages = result.pages.length - failedPages.length;
    const totalDurationMs = completedAt.getTime() - startedAt.getTime();

    await prisma.$transaction(async (tx) => {
      await tx.ndieProviderRun.create({
        data: {
          importJobId: input.importJobId,
          providerId: provider.id,
          providerKind: provider.kind,
          stage: "PAGES_RENDERED",
          status: "SUCCEEDED",
          inputSummary: {
            sourceDocumentId: input.sourceDocumentId,
            fileType: input.fileType,
            hasBuffer: Boolean(input.fileBuffer?.length)
          },
          outputSummary: result.providerRun as Prisma.InputJsonValue,
          startedAt,
          completedAt
        }
      });

      for (const page of result.pages) {
        const storedPage = await tx.ndiePage.upsert({
          where: {
            sourceDocumentId_pageNumber: {
              sourceDocumentId: input.sourceDocumentId,
              pageNumber: page.pageNumber
            }
          },
          create: {
            importJobId: input.importJobId,
            sourceDocumentId: input.sourceDocumentId,
            pageNumber: page.pageNumber,
            width: page.width ?? null,
            height: page.height ?? null,
            rotation: page.rotation ?? null,
            dpi: page.dpi ?? null,
            aspectRatio: page.aspectRatio ?? null,
            imageSizeBytes: page.imageSizeBytes ?? null,
            checksum: page.checksum ?? null,
            storageProvider: page.storageProvider ?? null,
            storageLocation: page.storageLocation ?? null,
            pipelineVersion: env.NDIE_PIPELINE_VERSION,
            providerVersion: page.providerVersion ?? provider.id,
            renderDurationMs: page.renderDurationMs ?? null,
            renderedAt: page.renderedAt ? new Date(page.renderedAt) : null,
            diagnostics: page.diagnostics as Prisma.InputJsonValue,
            renderStatus: page.renderStatus,
            imageUrl: page.imageUrl ?? null,
            imagePublicId: page.imagePublicId ?? null,
            thumbnailUrl: page.thumbnailUrl ?? null,
            ocrStatus: page.imageUrl ? "PENDING_OCR" : "WAITING_FOR_RENDER"
          },
          update: {
            width: page.width ?? null,
            height: page.height ?? null,
            rotation: page.rotation ?? null,
            dpi: page.dpi ?? null,
            aspectRatio: page.aspectRatio ?? null,
            imageSizeBytes: page.imageSizeBytes ?? null,
            checksum: page.checksum ?? null,
            storageProvider: page.storageProvider ?? null,
            storageLocation: page.storageLocation ?? null,
            pipelineVersion: env.NDIE_PIPELINE_VERSION,
            providerVersion: page.providerVersion ?? provider.id,
            renderDurationMs: page.renderDurationMs ?? null,
            renderedAt: page.renderedAt ? new Date(page.renderedAt) : null,
            diagnostics: page.diagnostics as Prisma.InputJsonValue,
            renderStatus: page.renderStatus,
            imageUrl: page.imageUrl ?? null,
            imagePublicId: page.imagePublicId ?? null,
            thumbnailUrl: page.thumbnailUrl ?? null,
            ocrStatus: page.imageUrl ? "PENDING_OCR" : "WAITING_FOR_RENDER"
          }
        });

        await tx.ndiePageAsset.deleteMany({
          where: {
            pageId: storedPage.id,
            assetType: "RENDERED_PAGE_IMAGE"
          }
        });

        const pageAssets = [
          ["PREVIEW_IMAGE", page.previewImage],
          ["REVIEW_IMAGE", page.reviewImage],
          ["OCR_IMAGE", page.ocrImage],
          ["THUMBNAIL", page.thumbnailImage]
        ] as const;

        for (const [role, asset] of pageAssets) {
          if (!asset) continue;
          await tx.ndiePageAsset.create({
            data: {
              importJobId: input.importJobId,
              sourceDocumentId: input.sourceDocumentId,
              pageId: storedPage.id,
              assetType: "RENDERED_PAGE_IMAGE",
              role,
              pageNumber: page.pageNumber,
              url: asset.url,
              publicId: asset.publicId,
              metadata: {
                providerId: provider.id,
                renderStatus: page.renderStatus,
                checksum: asset.checksum,
                sizeBytes: asset.sizeBytes,
                pipelineVersion: env.NDIE_PIPELINE_VERSION
              }
            }
          });
        }
      }

      await tx.ndieSourceDocument.update({
        where: { id: input.sourceDocumentId },
        data: { pageCount: result.pageCount }
      });

      await tx.ndieImportJob.update({
        where: { id: input.importJobId },
        data: {
          status: failedPages.length ? "PAGES_RENDERED" : "READY_FOR_OCR",
          currentCheckpoint: failedPages.length ? "PAGES_RENDERED" : "READY_FOR_OCR",
          manifest: {
            pageCount: result.pageCount,
            rendererProvider: provider.id,
            renderStrategy: result.providerRun,
            phase: failedPages.length ? "PAGES_RENDERED_WITH_FAILURES" : "READY_FOR_OCR",
            pagesRendered: renderedPages,
            failedPages: failedPages.length,
            totalDurationMs,
            diagnostics: result.diagnostics ?? {}
          } as Prisma.InputJsonValue
        }
      });
    });

    return result;
  }
};
