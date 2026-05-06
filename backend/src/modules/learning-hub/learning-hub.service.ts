import { prisma } from "../../config/prisma.js";

const userSelect = { id: true, name: true, email: true, role: true } as const;

async function refreshRanks() {
  const rows = await prisma.leaderboard.findMany({ orderBy: [{ points: "desc" }, { streak: "desc" }] });
  await Promise.all(rows.map((row, index) => prisma.leaderboard.update({ where: { id: row.id }, data: { rank: index + 1 } })));
}

export const learningHubService = {
  pyqCategories() {
    return prisma.pYQCategory.findMany({ orderBy: [{ examType: "asc" }, { name: "asc" }], include: { _count: { select: { questions: true } } } });
  },
  pyqQuestions(filters: { examType?: string; subject?: string; year?: number; search?: string }) {
    return prisma.pYQQuestion.findMany({
      where: {
        subject: filters.subject,
        year: filters.year,
        category: filters.examType ? { examType: filters.examType } : undefined,
        OR: filters.search ? [
          { questionText: { contains: filters.search, mode: "insensitive" } },
          { topic: { contains: filters.search, mode: "insensitive" } },
          { explanation: { contains: filters.search, mode: "insensitive" } }
        ] : undefined
      },
      orderBy: [{ year: "desc" }, { createdAt: "desc" }],
      include: { category: true }
    });
  },
  createPYQQuestion(input: { categoryId: string; year: number; subject: string; topic: string; questionText: string; optionA: string; optionB: string; optionC: string; optionD: string; correctAnswer: string; explanation: string; difficultyLevel: string }) {
    return prisma.pYQQuestion.create({ data: input, include: { category: true } });
  },
  currentAffairs(filters: { category?: string }) {
    return prisma.currentAffair.findMany({ where: { category: filters.category }, orderBy: { publishedDate: "desc" }, include: { quizzes: true } });
  },
  createCurrentAffair(input: { title: string; description: string; category: string; imageUrl?: string; publishedDate: string; quizzes?: Array<{ question: string; optionA: string; optionB: string; optionC: string; optionD: string; correctAnswer: string }> }) {
    return prisma.currentAffair.create({
      data: { title: input.title, description: input.description, category: input.category, imageUrl: input.imageUrl, publishedDate: new Date(input.publishedDate), quizzes: input.quizzes?.length ? { create: input.quizzes } : undefined },
      include: { quizzes: true }
    });
  },
  quizBattles() {
    return prisma.quizBattle.findMany({ orderBy: { startTime: "asc" }, include: { participants: { include: { user: { select: userSelect } }, orderBy: { score: "desc" } } } });
  },
  createQuizBattle(input: { title: string; category: string; startTime: string; endTime: string }) {
    return prisma.quizBattle.create({ data: { ...input, startTime: new Date(input.startTime), endTime: new Date(input.endTime) } });
  },
  joinBattle(userId: string, battleId: string) {
    return prisma.quizBattleParticipant.upsert({
      where: { battleId_userId: { battleId, userId } },
      update: {},
      create: { battleId, userId },
      include: { battle: true, user: { select: userSelect } }
    });
  },
  async submitBattle(userId: string, input: { battleId: string; score: number; timeTaken: number }) {
    const participant = await prisma.quizBattleParticipant.upsert({
      where: { battleId_userId: { battleId: input.battleId, userId } },
      update: { score: input.score, timeTaken: input.timeTaken },
      create: { battleId: input.battleId, userId, score: input.score, timeTaken: input.timeTaken }
    });
    const sorted = await prisma.quizBattleParticipant.findMany({ where: { battleId: input.battleId }, orderBy: [{ score: "desc" }, { timeTaken: "asc" }] });
    await Promise.all(sorted.map((row, index) => prisma.quizBattleParticipant.update({ where: { id: row.id }, data: { rank: index + 1 } })));
    await prisma.leaderboard.upsert({
      where: { userId },
      update: { points: { increment: input.score }, streak: { increment: 1 } },
      create: { userId, points: input.score, streak: 1 }
    });
    await refreshRanks();
    return prisma.quizBattleParticipant.findUnique({ where: { id: participant.id }, include: { battle: true, user: { select: userSelect } } });
  },
  leaderboard() {
    return prisma.leaderboard.findMany({ orderBy: [{ rank: "asc" }, { points: "desc" }], include: { user: { select: userSelect } } });
  }
};
