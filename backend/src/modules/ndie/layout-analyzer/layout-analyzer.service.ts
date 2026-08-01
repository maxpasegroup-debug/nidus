import type { Prisma } from "../../../generated/prisma/client.js";
import { env } from "../../../config/env.js";
import { prisma } from "../../../config/prisma.js";
import type { LayoutProvider } from "../contracts/providers.js";
import { createNdieContainer } from "../ndie.container.js";

const container = createNdieContainer();

export const ndieLayoutAnalyzerService = {
  async analyzeImport(importJobId: string) {
    const provider = container.providerRegistry.get<LayoutProvider>(env.NDIE_LAYOUT_PROVIDER);
    if (!provider) throw new Error(`NDIE layout provider ${env.NDIE_LAYOUT_PROVIDER} is not registered`);

    const pages = await prisma.ndiePage.findMany({
      where: { importJobId },
      orderBy: { pageNumber: "asc" }
    });

    const results = [];
    for (const page of pages) {
      const startedAt = new Date();
      const result = await provider.analyze({
        importJobId,
        pageId: page.id,
        pageNumber: page.pageNumber,
        width: page.width,
        height: page.height,
        imageUrl: page.imageUrl,
        ocrText: page.ocrText
      });

      await prisma.$transaction(async (tx) => {
        await tx.ndieElement.deleteMany({
          where: {
            importJobId,
            pageId: page.id,
            elementType: { in: ["PAGE_REGION", "TEXT_LINE", "COLUMN_REGION"] }
          }
        });

        if (result.elements.length) {
          await tx.ndieElement.createMany({
            data: result.elements.map((element) => ({
              importJobId,
              sourceDocumentId: page.sourceDocumentId,
              pageId: page.id,
              pageNumber: page.pageNumber,
              elementType: element.elementType,
              text: element.text ?? null,
              normalizedText: element.normalizedText ?? null,
              coordinates: element.coordinates as Prisma.InputJsonValue,
              readingOrder: element.readingOrder ?? null,
              confidence: element.confidence ?? null,
              providerId: provider.id,
              metadata: (element.metadata ?? {}) as Prisma.InputJsonValue
            }))
          });
        }

        await tx.ndiePage.update({
          where: { id: page.id },
          data: {
            layoutJson: result.layoutJson as Prisma.InputJsonValue
          }
        });

        await tx.ndieProviderRun.create({
          data: {
            importJobId,
            providerId: provider.id,
            providerKind: provider.kind,
            stage: "LAYOUT_ANALYZED",
            status: "SUCCEEDED",
            inputSummary: { pageId: page.id, pageNumber: page.pageNumber, hasOcrText: Boolean(page.ocrText), hasImage: Boolean(page.imageUrl) },
            outputSummary: { elements: result.elements.length, layoutJson: result.layoutJson } as Prisma.InputJsonValue,
            confidence: result.confidence,
            startedAt,
            completedAt: new Date()
          }
        });
      });

      results.push({ pageId: page.id, pageNumber: page.pageNumber, elements: result.elements.length, confidence: result.confidence });
    }

    await prisma.ndieImportJob.update({
      where: { id: importJobId },
      data: {
        status: "LAYOUT_ANALYZED",
        currentCheckpoint: "LAYOUT_ANALYZED",
        providerSummary: {
          layoutProvider: provider.id,
          pages: results
        } as Prisma.InputJsonValue
      }
    });

    return { providerId: provider.id, pages: results };
  }
};
