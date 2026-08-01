import { Prisma } from "../../../generated/prisma/client.js";
import { env } from "../../../config/env.js";
import { prisma } from "../../../config/prisma.js";
import { logger } from "../../../utils/logger.js";
import type { LayoutProvider } from "../contracts/providers.js";
import { createNdieContainer } from "../ndie.container.js";

const container = createNdieContainer();

export const ndieLayoutAnalyzerService = {
  async health() {
    const provider = container.providerRegistry.get<LayoutProvider>(env.NDIE_LAYOUT_PROVIDER);
    const [aggregate, providerRuns, failedJobs, pages] = await Promise.all([
      prisma.ndieProviderRun.aggregate({ where: { providerKind: "LAYOUT", confidence: { not: null } }, _avg: { confidence: true } }),
      prisma.ndieProviderRun.count({ where: { providerKind: "LAYOUT" } }),
      prisma.ndieProviderRun.count({ where: { providerKind: "LAYOUT", status: { in: ["FAILED", "RETRY_PENDING"] } } }),
      prisma.ndiePage.findMany({
        where: { layoutJson: { not: Prisma.JsonNull } },
        select: { layoutJson: true },
        take: 500,
        orderBy: { updatedAt: "desc" }
      })
    ]);
    const totals = pages.reduce((acc, page) => {
      const json = page.layoutJson;
      const normalized = json && typeof json === "object" && !Array.isArray(json) && "normalized" in json
        ? (json as { normalized?: { regions?: unknown[]; tables?: unknown[]; figures?: unknown[]; headers?: unknown[]; footers?: unknown[]; columns?: unknown[] } }).normalized
        : json as { regions?: unknown[]; tables?: unknown[]; figures?: unknown[]; headers?: unknown[]; footers?: unknown[]; columns?: unknown[] } | null;
      acc.regions += Array.isArray(normalized?.regions) ? normalized.regions.length : 0;
      acc.tables += Array.isArray(normalized?.tables) ? normalized.tables.length : 0;
      acc.figures += Array.isArray(normalized?.figures) ? normalized.figures.length : 0;
      acc.headers += Array.isArray(normalized?.headers) ? normalized.headers.length : 0;
      acc.footers += Array.isArray(normalized?.footers) ? normalized.footers.length : 0;
      acc.columns += Array.isArray(normalized?.columns) ? normalized.columns.length : 0;
      return acc;
    }, { regions: 0, tables: 0, figures: 0, headers: 0, footers: 0, columns: 0 });
    return {
      provider: provider?.id ?? env.NDIE_LAYOUT_PROVIDER,
      providerVersion: provider && "version" in provider ? String(provider.version) : provider?.id ?? "unknown",
      providerStatus: provider?.health().status ?? "NOT_CONFIGURED",
      layoutJobs: providerRuns,
      averageConfidence: Number((aggregate._avg.confidence ?? 0).toFixed(4)),
      averageRegionsPerPage: pages.length ? Number((totals.regions / pages.length).toFixed(2)) : 0,
      failedLayoutJobs: failedJobs,
      totals
    };
  },

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
      logger.info("NDIE layout started", { importId: importJobId, pageId: page.id, pageNumber: page.pageNumber, provider: provider.id });
      const result = await provider.analyze({
        importJobId,
        pageId: page.id,
        pageNumber: page.pageNumber,
        width: page.width,
        height: page.height,
        rotation: page.rotation,
        dpi: page.dpi,
        aspectRatio: page.aspectRatio,
        imageUrl: page.imageUrl,
        ocrText: page.ocrText,
        ocrJson: page.ocrJson
      });

      await prisma.$transaction(async (tx) => {
        await tx.ndieElement.deleteMany({
          where: {
            importJobId,
            pageId: page.id,
            elementType: {
              in: [
                "TEXT_REGION",
                "HEADER",
                "FOOTER",
                "PAGE_NUMBER",
                "QUESTION_AREA",
                "ANSWER_AREA",
                "INSTRUCTION_AREA",
                "DIAGRAM_AREA",
                "GRAPH_AREA",
                "TABLE_AREA",
                "FORMULA_AREA",
                "MARGIN_NOTE",
                "UNKNOWN_REGION",
                "PAGE_REGION",
                "TEXT_LINE",
                "COLUMN_REGION"
              ]
            }
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
            layoutJson: {
              normalized: result.normalized,
              rawProviderOutput: result.raw,
              diagnostics: result.normalized.diagnostics,
              checksum: result.normalized.checksum,
              providerVersion: result.normalized.providerVersion,
              pipelineVersion: result.normalized.pipelineVersion,
              durationMs: result.normalized.durationMs
            } as Prisma.InputJsonValue
          }
        });

        await tx.ndieProviderRun.create({
          data: {
            importJobId,
              providerId: provider.id,
              providerKind: provider.kind,
            stage: "LAYOUT_COMPLETED",
            status: "SUCCEEDED",
            inputSummary: { pageId: page.id, pageNumber: page.pageNumber, hasOcrText: Boolean(page.ocrText), hasOcrJson: Boolean(page.ocrJson), hasImage: Boolean(page.imageUrl) },
            outputSummary: { normalized: result.normalized, rawProviderOutput: result.raw, diagnostics: result.normalized.diagnostics } as Prisma.InputJsonValue,
            confidence: result.confidence,
            startedAt,
            completedAt: new Date()
          }
        });
      });

      logger.info("NDIE layout page analyzed", {
        importId: importJobId,
        pageId: page.id,
        pageNumber: page.pageNumber,
        provider: provider.id,
        regions: result.normalized.regions.length,
        tables: result.normalized.tables.length,
        figures: result.normalized.figures.length,
        durationMs: result.normalized.durationMs,
        diagnostics: result.normalized.diagnostics.issues
      });
      results.push({
        pageId: page.id,
        pageNumber: page.pageNumber,
        elements: result.elements.length,
        regions: result.normalized.regions.length,
        tables: result.normalized.tables.length,
        figures: result.normalized.figures.length,
        headers: result.normalized.headers.length,
        footers: result.normalized.footers.length,
        columns: result.normalized.columns.length,
        durationMs: result.normalized.durationMs,
        confidence: result.confidence
      });
    }

    const averageConfidence = results.reduce((sum, result) => sum + (typeof result.confidence === "number" ? result.confidence : 0), 0) / Math.max(1, results.filter((result) => typeof result.confidence === "number").length);
    await prisma.ndieImportJob.update({
      where: { id: importJobId },
      data: {
        status: "READY_FOR_FORMULA_ENGINE",
        currentCheckpoint: "READY_FOR_FORMULA_ENGINE",
        providerSummary: {
          layoutProvider: provider.id,
          pagesAnalyzed: results.length,
          regions: results.reduce((sum, result) => sum + result.regions, 0),
          tables: results.reduce((sum, result) => sum + result.tables, 0),
          figures: results.reduce((sum, result) => sum + result.figures, 0),
          headers: results.reduce((sum, result) => sum + result.headers, 0),
          footers: results.reduce((sum, result) => sum + result.footers, 0),
          columns: results.reduce((sum, result) => sum + result.columns, 0),
          averageConfidence: Number(averageConfidence.toFixed(4)),
          pages: results
        } as Prisma.InputJsonValue
      }
    });

    logger.info("NDIE layout complete", { importId: importJobId, provider: provider.id, pages: results.length, averageConfidence });
    return { providerId: provider.id, pages: results };
  }
};
