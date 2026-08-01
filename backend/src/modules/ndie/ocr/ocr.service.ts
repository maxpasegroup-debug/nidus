import { Prisma } from "../../../generated/prisma/client.js";
import { env } from "../../../config/env.js";
import { prisma } from "../../../config/prisma.js";
import type { OcrProvider } from "../contracts/providers.js";
import { createNdieContainer } from "../ndie.container.js";
import { preprocessOcrImage } from "./image-preprocessing.js";

const container = createNdieContainer();

async function bufferFromImageUrl(url: string) {
  const response = await fetch(url);
  if (!response.ok) throw Object.assign(new Error("Unable to load rendered page image for OCR."), { statusCode: 502, retryable: true });
  return Buffer.from(await response.arrayBuffer());
}

function deterministicOcrFailure(error: unknown) {
  const retryable = typeof error === "object" && error !== null && "retryable" in error ? Boolean((error as { retryable?: unknown }).retryable) : true;
  return !retryable;
}

export const ndieOcrService = {
  async health() {
    const provider = container.providerRegistry.get<OcrProvider>(env.NDIE_OCR_PROVIDER);
    const [aggregate, failedOcrJobs, providerRuns, languageRows] = await Promise.all([
      prisma.ndieProviderRun.aggregate({ where: { providerKind: "OCR", confidence: { not: null } }, _avg: { confidence: true } }),
      prisma.ndiePage.count({ where: { ocrStatus: "OCR_FAILED" } }),
      prisma.ndieProviderRun.count({ where: { providerKind: "OCR" } }),
      prisma.ndiePage.findMany({
        where: { ocrJson: { not: Prisma.JsonNull } },
        select: { ocrJson: true },
        take: 500,
        orderBy: { updatedAt: "desc" }
      })
    ]);
    const languageDistribution = languageRows.reduce<Record<string, number>>((acc, page) => {
      const json = page.ocrJson;
      if (json && typeof json === "object" && !Array.isArray(json) && "normalized" in json) {
        const normalized = (json as { normalized?: { language?: unknown } }).normalized;
        const language = typeof normalized?.language === "string" ? normalized.language : "unknown";
        acc[language] = (acc[language] ?? 0) + 1;
      }
      return acc;
    }, {});
    return {
      provider: provider?.id ?? env.NDIE_OCR_PROVIDER,
      providerVersion: provider && "version" in provider ? String(provider.version) : provider?.id ?? "unknown",
      providerStatus: provider?.health().status ?? "NOT_CONFIGURED",
      ocrJobs: providerRuns,
      averageConfidence: Number((aggregate._avg.confidence ?? 0).toFixed(4)),
      failedOcrJobs,
      languageDistribution
    };
  },

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
      const ocrAsset = await prisma.ndiePageAsset.findFirst({
        where: {
          pageId: page.id,
          assetType: "RENDERED_PAGE_IMAGE",
          role: "OCR_IMAGE"
        },
        orderBy: { createdAt: "desc" }
      });
      const imageUrl = ocrAsset?.url ?? page.imageUrl;

      try {
        if (!imageUrl) throw Object.assign(new Error("OCR requires a rendered page image."), { statusCode: 422, retryable: false });
        const sourceBuffer = await bufferFromImageUrl(imageUrl);
        const preprocessed = env.NDIE_OCR_PREPROCESSING_ENABLED
          ? await preprocessOcrImage(sourceBuffer, {
            denoise: env.NDIE_OCR_PREPROCESS_DENOISE,
            contrast: env.NDIE_OCR_PREPROCESS_CONTRAST,
            binarize: env.NDIE_OCR_PREPROCESS_BINARIZE,
            rotateDegrees: page.rotation ? Number(page.rotation) : undefined
          })
          : { buffer: sourceBuffer, metadata: { enabled: false, operations: [], inputSizeBytes: sourceBuffer.length, outputSizeBytes: sourceBuffer.length } };

        const result = await provider.recognize({
          importJobId,
          pageId: page.id,
          pageNumber: page.pageNumber,
          imageUrl,
          imageBuffer: preprocessed.buffer,
          languageHints: env.NDIE_OCR_LANGUAGES.split(/[,+]/).map((language) => language.trim()).filter(Boolean),
          rotation: page.rotation,
          preprocessing: preprocessed.metadata
        });
        const normalized = result.normalized ?? {
          schemaVersion: "ndie-ocr-v1",
          providerId: provider.id,
          providerVersion: provider.id,
          pageId: page.id,
          pageNumber: page.pageNumber,
          language: result.language ?? null,
          languages: result.languages ?? [],
          rotation: page.rotation ?? null,
          confidence: result.confidence,
          text: result.text,
          blocks: [],
          diagnostics: {
            blankPage: !result.text,
            lowConfidence: result.confidence !== null && result.confidence < env.NDIE_OCR_CONFIDENCE_WARNING,
            missingText: !result.text,
            languageMismatch: false,
            rotatedPage: Boolean(page.rotation && page.rotation % 360 !== 0),
            providerFailure: false,
            retryable: false,
            issues: []
          },
          preprocessing: preprocessed.metadata,
          durationMs: Date.now() - startedAt.getTime(),
          createdAt: new Date().toISOString()
        };
        results.push({ pageId: page.id, pageNumber: page.pageNumber, confidence: result.confidence, language: normalized.language, status: "OCR_COMPLETED" });

        await prisma.$transaction([
          prisma.ndiePage.update({
            where: { id: page.id },
            data: {
              ocrStatus: result.text ? "OCR_COMPLETED" : "OCR_COMPLETED_EMPTY",
              ocrText: result.text || null,
              ocrJson: {
                normalized,
                rawProviderResponse: result.raw,
                diagnostics: normalized.diagnostics
              } as Prisma.InputJsonValue
            }
          }),
          prisma.ndieProviderRun.create({
            data: {
              importJobId,
              providerId: provider.id,
              providerKind: provider.kind,
              stage: "OCR_COMPLETED",
              status: normalized.diagnostics.providerFailure ? "FAILED" : "SUCCEEDED",
              inputSummary: { pageId: page.id, pageNumber: page.pageNumber, hasImage: Boolean(imageUrl), imageAssetId: ocrAsset?.id ?? null },
              outputSummary: {
                normalized,
                rawProviderResponse: result.raw,
                diagnostics: normalized.diagnostics
              } as Prisma.InputJsonValue,
              confidence: result.confidence,
              startedAt,
              completedAt: new Date()
            }
          })
        ]);
      } catch (error) {
        const retryable = !deterministicOcrFailure(error);
        const message = error instanceof Error ? error.message : "OCR failed";
        results.push({ pageId: page.id, pageNumber: page.pageNumber, confidence: null, language: null, status: "OCR_FAILED", retryable });
        await prisma.$transaction([
          prisma.ndiePage.update({
            where: { id: page.id },
            data: {
              ocrStatus: retryable ? "OCR_RETRY_PENDING" : "OCR_FAILED",
              ocrJson: {
                normalized: null,
                rawProviderResponse: null,
                diagnostics: {
                  blankPage: false,
                  lowConfidence: false,
                  missingText: false,
                  languageMismatch: false,
                  rotatedPage: Boolean(page.rotation && page.rotation % 360 !== 0),
                  providerFailure: true,
                  retryable,
                  issues: [retryable ? "PROVIDER_FAILURE_RETRYABLE" : "PROVIDER_FAILURE_DETERMINISTIC"]
                },
                error: message
              } as Prisma.InputJsonValue
            }
          }),
          prisma.ndieProviderRun.create({
            data: {
              importJobId,
              providerId: provider.id,
              providerKind: provider.kind,
              stage: "OCR_COMPLETED",
              status: retryable ? "RETRY_PENDING" : "FAILED",
              inputSummary: { pageId: page.id, pageNumber: page.pageNumber, hasImage: Boolean(imageUrl) },
              outputSummary: { error: message, retryable } as Prisma.InputJsonValue,
              confidence: null,
              startedAt,
              completedAt: new Date()
            }
          })
        ]);
        if (retryable) throw error;
      }
    }

    const successfulPages = results.filter((result) => result.status === "OCR_COMPLETED").length;
    const averageConfidence = results.reduce((sum, result) => sum + (typeof result.confidence === "number" ? result.confidence : 0), 0) / Math.max(1, results.filter((result) => typeof result.confidence === "number").length);
    await prisma.ndieImportJob.update({
      where: { id: importJobId },
      data: {
        status: "READY_FOR_LAYOUT",
        currentCheckpoint: "READY_FOR_LAYOUT",
        providerSummary: {
          ocrProvider: provider.id,
          pagesProcessed: results.length,
          pagesSucceeded: successfulPages,
          failedPages: results.length - successfulPages,
          averageConfidence: Number(averageConfidence.toFixed(4)),
          languageDistribution: results.reduce<Record<string, number>>((acc, result) => {
            const language = typeof result.language === "string" ? result.language : "unknown";
            acc[language] = (acc[language] ?? 0) + 1;
            return acc;
          }, {}),
          pages: results
        } as Prisma.InputJsonValue
      }
    });

    return { providerId: provider.id, pages: results };
  }
};
