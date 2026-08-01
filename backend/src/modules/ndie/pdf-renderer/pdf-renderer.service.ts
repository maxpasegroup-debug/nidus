import type { Prisma } from "../../../generated/prisma/client.js";
import { env } from "../../../config/env.js";
import { prisma } from "../../../config/prisma.js";
import type { RendererProvider } from "../contracts/providers.js";
import { createNdieContainer } from "../ndie.container.js";

const container = createNdieContainer();

export const ndiePdfRendererService = {
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
    const result = await provider.render(input);

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
          completedAt: new Date()
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
            renderStatus: page.renderStatus,
            imageUrl: page.imageUrl ?? null,
            imagePublicId: page.imagePublicId ?? null,
            thumbnailUrl: page.thumbnailUrl ?? null,
            ocrStatus: page.imageUrl ? "PENDING_OCR" : "WAITING_FOR_RENDER"
          }
        });

        if (page.imageUrl && page.imagePublicId) {
          await tx.ndiePageAsset.create({
            data: {
              importJobId: input.importJobId,
              sourceDocumentId: input.sourceDocumentId,
              pageId: storedPage.id,
              assetType: "RENDERED_PAGE_IMAGE",
              role: "PAGE_SOURCE",
              pageNumber: page.pageNumber,
              url: page.imageUrl,
              publicId: page.imagePublicId,
              metadata: {
                providerId: provider.id,
                renderStatus: page.renderStatus
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
          status: "PAGES_RENDERED",
          currentCheckpoint: "PAGES_RENDERED",
          manifest: {
            pageCount: result.pageCount,
            rendererProvider: provider.id,
            renderStrategy: result.providerRun,
            phase: "PAGES_RENDERED"
          } as Prisma.InputJsonValue
        }
      });
    });

    return result;
  }
};
