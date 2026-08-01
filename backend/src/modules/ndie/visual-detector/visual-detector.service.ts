import type { Prisma } from "../../../generated/prisma/client.js";
import { env } from "../../../config/env.js";
import { prisma } from "../../../config/prisma.js";
import type { FormulaProvider } from "../contracts/providers.js";
import { createNdieContainer } from "../ndie.container.js";

const container = createNdieContainer();

const diagramSignal = /\b(diagram|figure|fig\.|shown|image|circuit|ray diagram|lens|mirror|triangle|circle|geometry|map|structure)\b/i;
const tableSignal = /\b(table|tabular|row|column|data given|following data)\b/i;
const graphSignal = /\b(graph|chart|plot|coordinate plane|x-axis|y-axis|bar graph|pie chart|line graph|histogram)\b/i;

function coordinates(raw: unknown, pageNumber: number) {
  if (raw && typeof raw === "object") return raw as Record<string, unknown>;
  return { page: pageNumber, x: 0.06, y: 0.08, width: 0.88, height: 0.08, rotation: 0 };
}

function visualType(text: string) {
  if (tableSignal.test(text)) return "TABLE";
  if (graphSignal.test(text)) return "GRAPH";
  if (diagramSignal.test(text)) return "DIAGRAM";
  return null;
}

export const ndieVisualDetectorService = {
  async detectImport(importJobId: string) {
    const provider = container.providerRegistry.get<FormulaProvider>(env.NDIE_FORMULA_PROVIDER);
    if (!provider) throw new Error(`NDIE formula provider ${env.NDIE_FORMULA_PROVIDER} is not registered`);

    const pages = await prisma.ndiePage.findMany({
      where: { importJobId },
      orderBy: { pageNumber: "asc" }
    });

    let formulaCount = 0;
    let tableCount = 0;
    let diagramCount = 0;
    let graphCount = 0;

    for (const page of pages) {
      const layoutElements = await prisma.ndieElement.findMany({
        where: {
          importJobId,
          pageId: page.id,
          elementType: { in: ["TEXT_LINE", "PAGE_REGION"] }
        },
        orderBy: [{ readingOrder: "asc" }, { createdAt: "asc" }]
      });

      const startedAt = new Date();
      const formulaResult = await provider.detect({
        importJobId,
        pageId: page.id,
        pageNumber: page.pageNumber,
        ocrText: page.ocrText,
        layoutElements: layoutElements.map((element) => ({
          id: element.id,
          elementType: element.elementType,
          text: element.text,
          coordinates: element.coordinates,
          readingOrder: element.readingOrder
        }))
      });

      const visualElements = layoutElements
        .filter((element) => element.text && visualType(element.text))
        .map((element) => ({
          kind: visualType(String(element.text))!,
          text: String(element.text),
          coordinates: coordinates(element.coordinates, page.pageNumber),
          readingOrder: element.readingOrder ?? undefined,
          sourceElementId: element.id
        }));

      formulaCount += formulaResult.elements.filter((element) => element.elementType === "FORMULA" || element.elementType === "CHEMICAL_EQUATION").length;
      tableCount += visualElements.filter((element) => element.kind === "TABLE").length;
      diagramCount += visualElements.filter((element) => element.kind === "DIAGRAM").length;
      graphCount += visualElements.filter((element) => element.kind === "GRAPH").length;

      await prisma.$transaction(async (tx) => {
        await tx.ndieElement.deleteMany({
          where: {
            importJobId,
            pageId: page.id,
            elementType: { in: ["FORMULA", "CHEMICAL_EQUATION", "TABLE", "DIAGRAM", "GRAPH"] }
          }
        });

        const formulaRows = formulaResult.elements.map((element) => ({
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
        }));

        const visualRows = visualElements.map((element) => ({
          importJobId,
          sourceDocumentId: page.sourceDocumentId,
          pageId: page.id,
          pageNumber: page.pageNumber,
          elementType: element.kind,
          text: element.text,
          normalizedText: element.text.toLowerCase(),
          coordinates: element.coordinates as Prisma.InputJsonValue,
          readingOrder: element.readingOrder ?? null,
          confidence: 0.62,
          providerId: "visual.rule-based",
          metadata: {
            provider: "visual.rule-based",
            sourceElementId: element.sourceElementId,
            requiresTeacherVisualReview: true
          } as Prisma.InputJsonValue
        }));

        if (formulaRows.length || visualRows.length) await tx.ndieElement.createMany({ data: [...formulaRows, ...visualRows] });

        await tx.ndieProviderRun.create({
          data: {
            importJobId,
            providerId: provider.id,
            providerKind: provider.kind,
            stage: "FORMULAS_DETECTED",
            status: "SUCCEEDED",
            inputSummary: { pageId: page.id, pageNumber: page.pageNumber, layoutElements: layoutElements.length },
            outputSummary: { formulas: formulaRows.length, visuals: visualRows.length } as Prisma.InputJsonValue,
            confidence: formulaResult.confidence,
            startedAt,
            completedAt: new Date()
          }
        });

        await tx.ndieProviderRun.create({
          data: {
            importJobId,
            providerId: "visual.rule-based",
            providerKind: "LAYOUT",
            stage: "VISUALS_DETECTED",
            status: "SUCCEEDED",
            inputSummary: { pageId: page.id, pageNumber: page.pageNumber, layoutElements: layoutElements.length },
            outputSummary: {
              tables: visualRows.filter((row) => row.elementType === "TABLE").length,
              diagrams: visualRows.filter((row) => row.elementType === "DIAGRAM").length,
              graphs: visualRows.filter((row) => row.elementType === "GRAPH").length
            } as Prisma.InputJsonValue,
            confidence: visualRows.length ? 0.62 : null,
            startedAt,
            completedAt: new Date()
          }
        });
      });
    }

    await prisma.ndieImportJob.update({
      where: { id: importJobId },
      data: {
        status: "VISUALS_DETECTED",
        currentCheckpoint: "VISUALS_DETECTED",
        qualitySummary: {
          formulaCount,
          tableCount,
          diagramCount,
          graphCount,
          phase: "VISUALS_DETECTED"
        } as Prisma.InputJsonValue
      }
    });

    return {
      formulaCount,
      tableCount,
      diagramCount,
      graphCount
    };
  }
};
