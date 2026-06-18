import { prisma } from "../../config/prisma.js";

function percentage(part: number, total: number) {
  return total > 0 ? Math.round((part / total) * 100) : 0;
}

function health(input: { timesShown: number; completionRate: number; exposureCount: number }) {
  if (input.exposureCount >= 250) return "OVEREXPOSED";
  if (input.timesShown >= 50 && input.completionRate < 40) return "REVIEW";
  if (input.timesShown === 0) return "UNUSED";
  return "HEALTHY";
}

export const assessmentAnalyticsService = {
  async questionHealth(input: { assessmentId?: string; questionId?: string }) {
    const questions = await prisma.assessmentQuestion.findMany({
      where: {
        assessmentId: input.assessmentId,
        id: input.questionId
      },
      include: {
        assessment: { select: { id: true, name: true } },
        trait: { select: { id: true, name: true } },
        dimension: { select: { id: true, name: true } },
        exposures: { select: { id: true, exposedAt: true, userId: true } },
        answers: { select: { rawScore: true, createdAt: true } },
        _count: { select: { reviews: true, versions: true } }
      },
      orderBy: [{ exposureCount: "desc" }, { updatedAt: "desc" }]
    });

    return questions.map((question) => {
      const timesShown = question.exposures.length;
      const timesAnswered = question.answers.length;
      const averageScore = timesAnswered
        ? Math.round(question.answers.reduce((sum, answer) => sum + answer.rawScore, 0) / timesAnswered)
        : 0;
      const completionRate = percentage(timesAnswered, timesShown);
      return {
        questionId: question.id,
        assessment: question.assessment.name,
        trait: question.trait.name,
        dimension: question.dimension.name,
        status: question.status,
        difficultyLevel: question.difficultyLevel,
        timesShown,
        timesAnswered,
        completionRate,
        averageScore,
        exposureCount: question.exposureCount,
        lastUsedAt: question.lastUsedAt,
        reviewCount: question._count.reviews,
        versionCount: question._count.versions,
        health: health({ timesShown, completionRate, exposureCount: question.exposureCount })
      };
    });
  },

  async dashboard(input: { assessmentId?: string }) {
    const [questions, exposures, answers] = await Promise.all([
      prisma.assessmentQuestion.findMany({
        where: { assessmentId: input.assessmentId },
        select: { id: true, status: true, difficultyLevel: true, exposureCount: true }
      }),
      prisma.assessmentQuestionExposure.count({
        where: { assessmentId: input.assessmentId }
      }),
      prisma.assessmentAnswer.findMany({
        where: input.assessmentId
          ? { question: { assessmentId: input.assessmentId } }
          : undefined,
        select: { rawScore: true, question: { select: { difficultyLevel: true } } }
      })
    ]);

    const averageScore = answers.length ? Math.round(answers.reduce((sum, answer) => sum + answer.rawScore, 0) / answers.length) : 0;
    const byStatus = questions.reduce<Record<string, number>>((acc, question) => {
      acc[question.status] = (acc[question.status] ?? 0) + 1;
      return acc;
    }, {});
    const byDifficulty = answers.reduce<Record<string, { count: number; averageScore: number; total: number }>>((acc, answer) => {
      const key = `LEVEL_${answer.question.difficultyLevel}`;
      const item = acc[key] ?? { count: 0, averageScore: 0, total: 0 };
      item.count += 1;
      item.total += answer.rawScore;
      item.averageScore = Math.round(item.total / item.count);
      acc[key] = item;
      return acc;
    }, {});

    return {
      questionCount: questions.length,
      byStatus,
      totalExposures: exposures,
      totalAnswers: answers.length,
      averageScore,
      difficultyPerformance: byDifficulty,
      overexposedCandidates: questions.filter((question) => question.exposureCount >= 250).length,
      retirementCandidates: questions.filter((question) => question.exposureCount >= 250).map((question) => question.id)
    };
  }
};
