import { Prisma } from "../../../generated/prisma/client.js";
import { env } from "../../../config/env.js";
import { prisma } from "../../../config/prisma.js";
import { logger } from "../../../utils/logger.js";
import type { FormulaProvider } from "../contracts/providers.js";
import { createNdieContainer } from "../ndie.container.js";

const container = createNdieContainer();

function formulaMetadata(value: unknown) {
  const metadata = value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
  const formula = metadata.formula && typeof metadata.formula === "object" && !Array.isArray(metadata.formula) ? metadata.formula as Record<string, unknown> : null;
  return formula;
}

export const ndieFormulaAnalyzerService = {
  async health() {
    const provider = container.providerRegistry.get<FormulaProvider>(env.NDIE_FORMULA_PROVIDER);
    const [aggregate, providerRuns, failedJobs, formulaElements] = await Promise.all([
      prisma.ndieProviderRun.aggregate({ where: { providerKind: "FORMULA", confidence: { not: null } }, _avg: { confidence: true } }),
      prisma.ndieProviderRun.count({ where: { providerKind: "FORMULA" } }),
      prisma.ndieProviderRun.count({ where: { providerKind: "FORMULA", status: { in: ["FAILED", "RETRY_PENDING"] } } }),
      prisma.ndieElement.findMany({
        where: { elementType: { in: ["FORMULA", "CHEMICAL_EQUATION"] } },
        select: { metadata: true, confidence: true },
        take: 1000,
        orderBy: { createdAt: "desc" }
      })
    ]);
    const formulaTypes = formulaElements.reduce<Record<string, number>>((acc, element) => {
      const formula = formulaMetadata(element.metadata);
      const type = typeof formula?.semanticType === "string" ? formula.semanticType : "UNKNOWN";
      acc[type] = (acc[type] ?? 0) + 1;
      return acc;
    }, {});
    const validationErrors = formulaElements.reduce((sum, element) => {
      const formula = formulaMetadata(element.metadata);
      const diagnostics = formula?.diagnostics && typeof formula.diagnostics === "object" && !Array.isArray(formula.diagnostics) ? formula.diagnostics as { issues?: unknown[] } : null;
      return sum + (Array.isArray(diagnostics?.issues) ? diagnostics.issues.length : 0);
    }, 0);
    const latexSuccess = formulaElements.filter((element) => {
      const formula = formulaMetadata(element.metadata);
      return typeof formula?.representations === "object" && formula.representations !== null && "latex" in formula.representations && Boolean((formula.representations as { latex?: unknown }).latex);
    }).length;
    const mathMlSuccess = formulaElements.filter((element) => {
      const formula = formulaMetadata(element.metadata);
      return typeof formula?.representations === "object" && formula.representations !== null && "mathml" in formula.representations && Boolean((formula.representations as { mathml?: unknown }).mathml);
    }).length;

    return {
      provider: provider?.id ?? env.NDIE_FORMULA_PROVIDER,
      providerVersion: provider && "version" in provider ? String(provider.version) : provider?.id ?? "unknown",
      providerStatus: provider?.health().status ?? "NOT_CONFIGURED",
      formulaJobs: providerRuns,
      averageConfidence: Number((aggregate._avg.confidence ?? 0).toFixed(4)),
      formulaCount: formulaElements.length,
      formulaTypes,
      latexSuccessRate: formulaElements.length ? Number((latexSuccess / formulaElements.length).toFixed(4)) : 0,
      mathMlSuccessRate: formulaElements.length ? Number((mathMlSuccess / formulaElements.length).toFixed(4)) : 0,
      validationErrors,
      failedFormulaJobs: failedJobs
    };
  },

  async detectImport(importJobId: string) {
    const provider = container.providerRegistry.get<FormulaProvider>(env.NDIE_FORMULA_PROVIDER);
    if (!provider) throw new Error(`NDIE formula provider ${env.NDIE_FORMULA_PROVIDER} is not registered`);

    const pages = await prisma.ndiePage.findMany({
      where: { importJobId },
      include: { assets: true },
      orderBy: { pageNumber: "asc" }
    });

    const results = [];
    for (const page of pages) {
      const startedAt = new Date();
      logger.info("NDIE formula detection started", { importId: importJobId, pageId: page.id, pageNumber: page.pageNumber, provider: provider.id });
      const layoutElements = await prisma.ndieElement.findMany({
        where: {
          importJobId,
          pageId: page.id,
          elementType: {
            in: [
              "TEXT_REGION",
              "QUESTION_AREA",
              "ANSWER_AREA",
              "INSTRUCTION_AREA",
              "FORMULA_AREA",
              "TABLE_AREA",
              "GRAPH_AREA",
              "DIAGRAM_AREA",
              "CHEMICAL_EQUATION"
            ]
          }
        },
        orderBy: [{ pageNumber: "asc" }, { readingOrder: "asc" }]
      });
      const pageImage = page.assets.find((asset) => asset.role === "REVIEW_IMAGE") ?? page.assets.find((asset) => asset.role === "OCR_IMAGE");
      const result = await provider.detect({
        importJobId,
        pageId: page.id,
        pageNumber: page.pageNumber,
        ocrText: page.ocrText,
        ocrJson: page.ocrJson,
        layoutJson: page.layoutJson,
        pageImageUrl: pageImage?.url ?? page.imageUrl,
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
            elementType: { in: ["FORMULA", "CHEMICAL_EQUATION"] }
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
              text: element.text,
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
            stage: "FORMULA_COMPLETED",
            status: "SUCCEEDED",
            inputSummary: {
              pageId: page.id,
              pageNumber: page.pageNumber,
              layoutElements: layoutElements.length,
              hasLayoutJson: Boolean(page.layoutJson),
              hasOcrJson: Boolean(page.ocrJson),
              hasPageImage: Boolean(pageImage?.url ?? page.imageUrl)
            },
            outputSummary: {
              formulas: result.formulas,
              rawProviderOutput: result.raw,
              formulaCount: result.formulas.length,
              validationFailures: result.formulas.reduce((sum, formula) => sum + formula.diagnostics.issues.length, 0)
            } as Prisma.InputJsonValue,
            confidence: result.confidence,
            startedAt,
            completedAt: new Date()
          }
        });
      });

      const validationFailures = result.formulas.reduce((sum, formula) => sum + formula.diagnostics.issues.length, 0);
      logger.info("NDIE formula page processed", {
        importId: importJobId,
        pageId: page.id,
        pageNumber: page.pageNumber,
        provider: provider.id,
        formulas: result.formulas.length,
        validationFailures,
        durationMs: Date.now() - startedAt.getTime()
      });
      results.push({
        pageId: page.id,
        pageNumber: page.pageNumber,
        formulas: result.formulas.length,
        confidence: result.confidence,
        validationFailures,
        semanticTypes: result.raw.semanticTypes ?? {}
      });
    }

    const formulaCount = results.reduce((sum, result) => sum + result.formulas, 0);
    const averageConfidence = results.reduce((sum, result) => sum + (typeof result.confidence === "number" ? result.confidence : 0), 0) / Math.max(1, results.filter((result) => typeof result.confidence === "number").length);
    await prisma.ndieImportJob.update({
      where: { id: importJobId },
      data: {
        status: "READY_FOR_VISUAL_ENGINE",
        currentCheckpoint: "READY_FOR_VISUAL_ENGINE",
        providerSummary: {
          formulaProvider: provider.id,
          pagesProcessed: results.length,
          formulaCount,
          averageConfidence: Number(averageConfidence.toFixed(4)),
          validationFailures: results.reduce((sum, result) => sum + result.validationFailures, 0),
          pages: results
        } as Prisma.InputJsonValue
      }
    });

    logger.info("NDIE formula detection complete", { importId: importJobId, provider: provider.id, pages: results.length, formulaCount, averageConfidence });
    return { providerId: provider.id, pages: results, formulaCount };
  }
};
