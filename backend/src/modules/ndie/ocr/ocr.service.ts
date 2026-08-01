import type { Prisma } from "../../../generated/prisma/client.js";
import { env } from "../../../config/env.js";
import { prisma } from "../../../config/prisma.js";
import type { OcrProvider } from "../contracts/providers.js";
import { createNdieContainer } from "../ndie.container.js";

const container = createNdieContainer();

export const ndieOcrService = {
  async runOcr(importJobId: string) {
    const provider = container.providerRegistry.get<OcrProvider>(env.NDIE_OCR_PROVIDER);
    if (!provider) throw new Error(`NDIE OCR provider ${env.NDIE_OCR_PROVIDER} is not registered`);

    const pages = await prisma.ndiePage.findMany({
      where: { importJobId },
      orderBy: { pageNumber: "asc" }
    });

    const results = [];
    for (const page of pages) {
      const startedAt = new Date();
      const result = await provider.recognize({
        importJobId,
        pageId: page.id,
        pageNumber: page.pageNumber,
        imageUrl: page.imageUrl
      });
      results.push({ pageId: page.id, pageNumber: page.pageNumber, confidence: result.confidence });

      await prisma.$transaction([
        prisma.ndiePage.update({
          where: { id: page.id },
          data: {
            ocrStatus: result.text ? "OCR_COMPLETED" : "WAITING_FOR_OCR_PROVIDER",
            ocrText: result.text || null,
            ocrJson: result.raw as Prisma.InputJsonValue
          }
        }),
        prisma.ndieProviderRun.create({
          data: {
            importJobId,
            providerId: provider.id,
            providerKind: provider.kind,
            stage: "OCR_COMPLETED",
            status: result.text ? "SUCCEEDED" : "WAITING_FOR_PROVIDER",
            inputSummary: { pageId: page.id, pageNumber: page.pageNumber, hasImage: Boolean(page.imageUrl) },
            outputSummary: result.raw as Prisma.InputJsonValue,
            confidence: result.confidence,
            startedAt,
            completedAt: new Date()
          }
        })
      ]);
    }

    await prisma.ndieImportJob.update({
      where: { id: importJobId },
      data: {
        currentCheckpoint: "OCR_COMPLETED",
        providerSummary: {
          ocrProvider: provider.id,
          pages: results
        } as Prisma.InputJsonValue
      }
    });

    return { providerId: provider.id, pages: results };
  }
};
