import { prisma } from "../../../config/prisma.js";

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

export const ndieStudentDeliveryService = {
  async health() {
    const [richQuestions, richTests, deliveryReadyImports, latestPublishRuns] = await Promise.all([
      prisma.question.count({ where: { renderMode: "NDIE_RICH_V1" } }),
      prisma.test.count({ where: { examType: "NDIE_IMPORT", status: "PUBLISHED", isLive: true } }),
      prisma.ndieImportJob.count({ where: { status: { in: ["READY_FOR_STUDENT_DELIVERY", "DELIVERY_READY"] } } }),
      prisma.ndieProviderRun.findMany({
        where: { providerKind: "PUBLISHER", stage: "PUBLISH_COMPLETED", status: "COMPLETED" },
        select: { outputSummary: true, confidence: true },
        orderBy: { completedAt: "desc" },
        take: 50
      })
    ]);

    const assetFailures = latestPublishRuns
      .map((run) => asRecord(asRecord(run.outputSummary).integrity))
      .flatMap((integrity) => Array.isArray(integrity.issues) ? integrity.issues : [])
      .map(asRecord)
      .filter((issue) => issue.issueType === "MISSING_ASSET").length;
    const integrityScores = latestPublishRuns
      .map((run) => Number(asRecord(asRecord(run.outputSummary).integrity).score ?? (run.confidence ? run.confidence * 100 : 0)))
      .filter((score) => Number.isFinite(score));
    const averageIntegrity = integrityScores.length ? Math.round(integrityScores.reduce((sum, score) => sum + score, 0) / integrityScores.length) : null;

    return {
      rendererVersion: "student-rich-renderer-v1",
      status: "ready",
      deliveryReadiness: {
        richTests,
        richQuestions,
        deliveryReadyImports
      },
      assetIntegrity: {
        averageIntegrity,
        assetFailures
      },
      renderSuccess: {
        formulaFallback: "KaTeX with text fallback",
        visualFallback: "source image with zoom viewer",
        legacyCompatibility: "A-D CBT projection retained"
      }
    };
  },

  async markDeliveryReady(importJobId: string) {
    const importJob = await prisma.ndieImportJob.findUnique({
      where: { id: importJobId },
      select: { id: true, testId: true, status: true, teacherSummary: true }
    });
    if (!importJob) throw Object.assign(new Error("NDIE import not found"), { statusCode: 404 });
    if (!importJob.testId) throw Object.assign(new Error("NDIE import has not been published to CBT."), { statusCode: 409 });

    return prisma.ndieImportJob.update({
      where: { id: importJob.id },
      data: {
        status: "DELIVERY_READY",
        currentCheckpoint: "DELIVERY_READY",
        teacherSummary: {
          ...asRecord(importJob.teacherSummary),
          deliveryReadyAt: new Date().toISOString(),
          testId: importJob.testId,
          previousStatus: importJob.status,
          rendererVersion: "student-rich-renderer-v1"
        }
      }
    });
  }
};
