import { Prisma } from "../../../generated/prisma/client.js";
import { env } from "../../../config/env.js";
import { prisma } from "../../../config/prisma.js";
import { logger } from "../../../utils/logger.js";
import type { VisualProvider } from "../contracts/providers.js";
import { createNdieContainer } from "../ndie.container.js";

const container = createNdieContainer();

function visualMetadata(value: unknown) {
  const metadata = value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
  const visual = metadata.visual && typeof metadata.visual === "object" && !Array.isArray(metadata.visual) ? metadata.visual as Record<string, unknown> : null;
  return visual;
}

export const ndieVisualDetectorService = {
  async health() {
    const provider = container.providerRegistry.get<VisualProvider>(env.NDIE_VISUAL_PROVIDER);
    const [aggregate, providerRuns, failedJobs, visualElements] = await Promise.all([
      prisma.ndieProviderRun.aggregate({ where: { providerKind: "VISUAL", confidence: { not: null } }, _avg: { confidence: true } }),
      prisma.ndieProviderRun.count({ where: { providerKind: "VISUAL" } }),
      prisma.ndieProviderRun.count({ where: { providerKind: "VISUAL", status: { in: ["FAILED", "RETRY_PENDING"] } } }),
      prisma.ndieElement.findMany({
        where: { elementType: { in: ["TABLE", "GRAPH", "DIAGRAM", "IMAGE"] } },
        select: { elementType: true, metadata: true, confidence: true },
        take: 1000,
        orderBy: { createdAt: "desc" }
      })
    ]);
    const visualTypes = visualElements.reduce<Record<string, number>>((acc, element) => {
      const visual = visualMetadata(element.metadata);
      const type = typeof visual?.visualType === "string" ? visual.visualType : element.elementType;
      acc[type] = (acc[type] ?? 0) + 1;
      return acc;
    }, {});
    return {
      provider: provider?.id ?? env.NDIE_VISUAL_PROVIDER,
      providerVersion: provider && "version" in provider ? String(provider.version) : provider?.id ?? "unknown",
      providerStatus: provider?.health().status ?? "NOT_CONFIGURED",
      visualJobs: providerRuns,
      visualCount: visualElements.length,
      tableCount: visualElements.filter((element) => element.elementType === "TABLE").length,
      graphCount: visualElements.filter((element) => element.elementType === "GRAPH").length,
      diagramCount: visualElements.filter((element) => element.elementType === "DIAGRAM").length,
      imageCount: visualElements.filter((element) => element.elementType === "IMAGE").length,
      averageConfidence: Number((aggregate._avg.confidence ?? 0).toFixed(4)),
      failedVisualJobs: failedJobs,
      visualTypes
    };
  },

  async detectImport(importJobId: string) {
    const provider = container.providerRegistry.get<VisualProvider>(env.NDIE_VISUAL_PROVIDER);
    if (!provider) throw new Error(`NDIE visual provider ${env.NDIE_VISUAL_PROVIDER} is not registered`);

    const pages = await prisma.ndiePage.findMany({
      where: { importJobId },
      include: { assets: true },
      orderBy: { pageNumber: "asc" }
    });

    const results = [];
    for (const page of pages) {
      const startedAt = new Date();
      logger.info("NDIE visual detection started", { importId: importJobId, pageId: page.id, pageNumber: page.pageNumber, provider: provider.id });
      const [layoutElements, formulaElements] = await Promise.all([
        prisma.ndieElement.findMany({
          where: {
            importJobId,
            pageId: page.id,
            elementType: {
              in: [
                "TEXT_REGION",
                "QUESTION_AREA",
                "ANSWER_AREA",
                "INSTRUCTION_AREA",
                "DIAGRAM_AREA",
                "GRAPH_AREA",
                "TABLE_AREA",
                "FORMULA_AREA",
                "HEADER",
                "FOOTER"
              ]
            }
          },
          orderBy: [{ pageNumber: "asc" }, { readingOrder: "asc" }]
        }),
        prisma.ndieElement.findMany({
          where: {
            importJobId,
            pageId: page.id,
            elementType: { in: ["FORMULA", "CHEMICAL_EQUATION"] }
          },
          orderBy: [{ pageNumber: "asc" }, { readingOrder: "asc" }]
        })
      ]);
      const pageImage = page.assets.find((asset) => asset.role === "REVIEW_IMAGE") ?? page.assets.find((asset) => asset.role === "OCR_IMAGE");
      const result = await provider.detect({
        importJobId,
        pageId: page.id,
        pageNumber: page.pageNumber,
        pageImageUrl: pageImage?.url ?? page.imageUrl,
        ocrJson: page.ocrJson,
        layoutJson: page.layoutJson,
        formulaElements: formulaElements.map((element) => ({
          id: element.id,
          elementType: element.elementType,
          text: element.text,
          coordinates: element.coordinates,
          readingOrder: element.readingOrder,
          confidence: element.confidence,
          metadata: element.metadata
        })),
        layoutElements: layoutElements.map((element) => ({
          id: element.id,
          elementType: element.elementType,
          text: element.text,
          coordinates: element.coordinates,
          readingOrder: element.readingOrder,
          confidence: element.confidence,
          metadata: element.metadata
        }))
      });

      await prisma.$transaction(async (tx) => {
        await tx.ndieElement.deleteMany({
          where: {
            importJobId,
            pageId: page.id,
            elementType: { in: ["TABLE", "GRAPH", "DIAGRAM", "IMAGE"] }
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

        await tx.ndieProviderRun.create({
          data: {
            importJobId,
            providerId: provider.id,
            providerKind: provider.kind,
            stage: "VISUAL_COMPLETED",
            status: "SUCCEEDED",
            inputSummary: {
              pageId: page.id,
              pageNumber: page.pageNumber,
              layoutElements: layoutElements.length,
              formulaElements: formulaElements.length,
              hasLayoutJson: Boolean(page.layoutJson),
              hasOcrJson: Boolean(page.ocrJson),
              hasPageImage: Boolean(pageImage?.url ?? page.imageUrl)
            },
            outputSummary: {
              visuals: result.visuals,
              rawProviderOutput: result.raw,
              visualCount: result.visuals.length,
              diagnostics: result.visuals.flatMap((visual) => visual.diagnostics.issues)
            } as Prisma.InputJsonValue,
            confidence: result.confidence,
            startedAt,
            completedAt: new Date()
          }
        });
      });

      const typeCounts = result.visuals.reduce<Record<string, number>>((acc, visual) => {
        acc[visual.visualType] = (acc[visual.visualType] ?? 0) + 1;
        return acc;
      }, {});
      logger.info("NDIE visual page processed", {
        importId: importJobId,
        pageId: page.id,
        pageNumber: page.pageNumber,
        provider: provider.id,
        visuals: result.visuals.length,
        typeCounts,
        durationMs: Date.now() - startedAt.getTime()
      });
      results.push({
        pageId: page.id,
        pageNumber: page.pageNumber,
        visuals: result.visuals.length,
        confidence: result.confidence,
        tableCount: result.elements.filter((element) => element.elementType === "TABLE").length,
        graphCount: result.elements.filter((element) => element.elementType === "GRAPH").length,
        diagramCount: result.elements.filter((element) => element.elementType === "DIAGRAM").length,
        imageCount: result.elements.filter((element) => element.elementType === "IMAGE").length,
        typeCounts
      });
    }

    const visualCount = results.reduce((sum, result) => sum + result.visuals, 0);
    const averageConfidence = results.reduce((sum, result) => sum + (typeof result.confidence === "number" ? result.confidence : 0), 0) / Math.max(1, results.filter((result) => typeof result.confidence === "number").length);
    await prisma.ndieImportJob.update({
      where: { id: importJobId },
      data: {
        status: "READY_FOR_QUESTION_ENGINE",
        currentCheckpoint: "READY_FOR_QUESTION_ENGINE",
        providerSummary: {
          visualProvider: provider.id,
          pagesProcessed: results.length,
          visualCount,
          tableCount: results.reduce((sum, result) => sum + result.tableCount, 0),
          graphCount: results.reduce((sum, result) => sum + result.graphCount, 0),
          diagramCount: results.reduce((sum, result) => sum + result.diagramCount, 0),
          imageCount: results.reduce((sum, result) => sum + result.imageCount, 0),
          averageConfidence: Number(averageConfidence.toFixed(4)),
          pages: results
        } as Prisma.InputJsonValue
      }
    });

    logger.info("NDIE visual detection complete", { importId: importJobId, provider: provider.id, pages: results.length, visualCount, averageConfidence });
    return { providerId: provider.id, pages: results, visualCount };
  }
};
