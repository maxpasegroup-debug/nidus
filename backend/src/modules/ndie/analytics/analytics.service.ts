import { prisma } from "../../../config/prisma.js";

function percent(value: number, total: number) {
  return total ? Math.round((value / total) * 100) : 0;
}

export const ndieAnalyticsService = {
  async overview() {
    const [totalImports, byStatus, byReviewStatus, bySourceKind, latestQuality, recentImports, providerRuns, replayRuns] = await Promise.all([
      prisma.ndieImportJob.count(),
      prisma.ndieImportJob.groupBy({ by: ["status"], _count: { _all: true } }),
      prisma.ndieImportJob.groupBy({ by: ["reviewStatus"], _count: { _all: true } }),
      prisma.ndieImportJob.groupBy({ by: ["sourceKind"], _count: { _all: true } }),
      prisma.ndieQualityScore.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
      prisma.ndieImportJob.findMany({
        orderBy: { createdAt: "desc" },
        take: 15,
        include: {
          sourceDocuments: { take: 1 },
          _count: { select: { questionCandidates: true, answerKeyCandidates: true, reviewDecisions: true } }
        }
      }),
      prisma.ndieProviderRun.groupBy({ by: ["stage", "status"], _count: { _all: true } }),
      prisma.ndieReplayRun.groupBy({ by: ["status"], _count: { _all: true } })
    ]);

    const completedReviews = byReviewStatus.find((row) => ["REVIEWED", "PUBLISHED"].includes(row.reviewStatus))?._count._all ?? 0;
    const qualityAverage = latestQuality.length
      ? latestQuality.reduce((sum, score) => sum + score.overall, 0) / latestQuality.length
      : null;
    const poorQuality = latestQuality.filter((score) => ["POOR", "REVIEW_REQUIRED"].includes(score.grade)).length;

    return {
      totals: {
        imports: totalImports,
        completedReviewPercent: percent(completedReviews, totalImports),
        averageQuality: qualityAverage,
        qualityRiskCount: poorQuality,
        replayRuns: replayRuns.reduce((sum, row) => sum + row._count._all, 0)
      },
      byStatus: byStatus.reduce<Record<string, number>>((acc, row) => {
        acc[row.status] = row._count._all;
        return acc;
      }, {}),
      byReviewStatus: byReviewStatus.reduce<Record<string, number>>((acc, row) => {
        acc[row.reviewStatus] = row._count._all;
        return acc;
      }, {}),
      bySourceKind: bySourceKind.reduce<Record<string, number>>((acc, row) => {
        acc[row.sourceKind] = row._count._all;
        return acc;
      }, {}),
      providerRuns: providerRuns.map((row) => ({ stage: row.stage, status: row.status, count: row._count._all })),
      replayRuns: replayRuns.reduce<Record<string, number>>((acc, row) => {
        acc[row.status] = row._count._all;
        return acc;
      }, {}),
      recentImports: recentImports.map((job) => ({
        id: job.id,
        subject: job.subject,
        topic: job.topic,
        sourceKind: job.sourceKind,
        status: job.status,
        reviewStatus: job.reviewStatus,
        currentCheckpoint: job.currentCheckpoint,
        sourceName: job.sourceDocuments[0]?.originalName ?? null,
        questions: job._count.questionCandidates,
        answers: job._count.answerKeyCandidates,
        reviews: job._count.reviewDecisions,
        createdAt: job.createdAt
      }))
    };
  }
};
