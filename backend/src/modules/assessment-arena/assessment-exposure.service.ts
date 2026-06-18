import { prisma } from "../../config/prisma.js";

export const assessmentExposureService = {
  async recentlyShownQuestionIds(input: { assessmentId: string; userId: string; withinDays: number }) {
    const since = new Date(Date.now() - input.withinDays * 24 * 60 * 60 * 1000);
    const exposures = await prisma.assessmentQuestionExposure.findMany({
      where: {
        assessmentId: input.assessmentId,
        userId: input.userId,
        exposedAt: { gte: since }
      },
      select: { questionId: true }
    });
    return new Set(exposures.map((exposure) => exposure.questionId));
  },

  async exposureCounts(input: { assessmentId: string; userId?: string }) {
    const exposures = await prisma.assessmentQuestionExposure.findMany({
      where: {
        assessmentId: input.assessmentId,
        userId: input.userId
      },
      select: {
        questionId: true,
        exposedAt: true
      },
      orderBy: { exposedAt: "desc" }
    });

    const counts = new Map<string, { timesShown: number; lastShown: Date | null }>();
    for (const exposure of exposures) {
      const current = counts.get(exposure.questionId) ?? { timesShown: 0, lastShown: null };
      counts.set(exposure.questionId, {
        timesShown: current.timesShown + 1,
        lastShown: current.lastShown ?? exposure.exposedAt
      });
    }
    return counts;
  },

  async record(input: {
    assessmentId: string;
    attemptId: string;
    userId: string;
    questions: Array<{ id: string; version: number }>;
  }) {
    await prisma.$transaction([
      prisma.assessmentQuestionExposure.createMany({
        data: input.questions.map((question) => ({
          assessmentId: input.assessmentId,
          attemptId: input.attemptId,
          userId: input.userId,
          questionId: question.id,
          questionVersion: question.version
        }))
      }),
      ...input.questions.map((question) => prisma.assessmentQuestion.update({
        where: { id: question.id },
        data: {
          exposureCount: { increment: 1 },
          lastUsedAt: new Date()
        }
      }))
    ]);
  }
};
