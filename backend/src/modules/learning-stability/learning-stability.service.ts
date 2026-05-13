import { prisma } from "../../config/prisma.js";
import { enqueuePDF } from "../../queues/pdf.queue.js";
import { enqueueAI } from "../../queues/ai.queue.js";

export const learningStabilityService = {
  async offlineSync(userId: string, events: Array<{ entityType: string; entityId: string; operation: string; payload: unknown }>) {
    if (!events.length) return { synced: 0 };
    await prisma.offlineSyncEvent.createMany({
      data: events.map((event) => ({
        userId,
        entityType: String(event.entityType),
        entityId: String(event.entityId),
        operation: String(event.operation),
        payload: (event.payload ?? {}) as object,
        status: "SYNCED",
        syncedAt: new Date()
      }))
    });
    return { synced: events.length };
  },

  async analytics(userId: string) {
    const [attempts, progress] = await Promise.all([
      prisma.testAttempt.findMany({ where: { userId }, include: { answers: { include: { question: true } } }, orderBy: { startedAt: "desc" }, take: 20 }),
      prisma.lectureProgress.findMany({ where: { userId }, orderBy: { updatedAt: "desc" }, take: 50 })
    ]);
    const completedLectures = progress.filter((item) => item.completed).length;
    const completionRate = progress.length ? Math.round((completedLectures / progress.length) * 100) : 0;
    const lectureEngagement = progress.length ? Math.round(progress.reduce((sum, item) => sum + item.engagementScore, 0) / progress.length) : 0;
    const wrongTopics = attempts.flatMap((attempt) => attempt.answers.filter((answer) => !answer.isCorrect).map((answer) => answer.question.topic));
    const weakTopics = Array.from(new Set(wrongTopics)).slice(0, 10);
    const studyConsistency = Math.min(100, attempts.length * 5 + completedLectures * 3);
    const productivityScore = Math.round((studyConsistency + lectureEngagement + completionRate) / 3);
    return prisma.learningAnalyticsSnapshot.create({
      data: {
        userId,
        studyConsistency,
        lectureEngagement,
        completionRate,
        productivityScore,
        weakTopics,
        heatmap: { shell: "completion-heatmap-ready" },
        aiInsights: { shell: "learning-insights-ready" }
      }
    });
  },

  async createTutorSession(userId: string, input: { subject: string; topic?: string }) {
    return prisma.aITutorSession.create({ data: { userId, subject: input.subject, topic: input.topic, context: { memoryShell: [] } }, include: { messages: true } });
  },

  async tutorMessage(userId: string, sessionId: string, content: string) {
    const session = await prisma.aITutorSession.findFirst({ where: { id: sessionId, userId }, include: { messages: { orderBy: { createdAt: "asc" }, take: 10 } } });
    if (!session) throw new Error("Tutor session not found");
    await prisma.aITutorMessage.create({ data: { sessionId, role: "USER", content } });
    await enqueueAI({ feature: "tutor-response", input: { sessionId, subject: session.subject, content } });
    return prisma.aITutorMessage.create({
      data: {
        sessionId,
        role: "ASSISTANT",
        content: "AI tutor response queued. Use this shell for persisted conversation, context memory, retry, and escalation handling.",
        metadata: { fallback: true, escalationReady: true }
      }
    });
  },

  async tutorSession(userId: string, sessionId: string) {
    const session = await prisma.aITutorSession.findFirst({ where: { id: sessionId, userId }, include: { messages: { orderBy: { createdAt: "asc" } } } });
    if (!session) throw new Error("Tutor session not found");
    return session;
  },

  async dailyIssueDraft(input: { title: string; issueDate: string; categories: string[] }) {
    const issue = await prisma.dailyIntelligenceIssue.upsert({
      where: { issueDate: new Date(input.issueDate) },
      update: { title: input.title, categories: input.categories },
      create: {
        title: input.title,
        issueDate: new Date(input.issueDate),
        categories: input.categories,
        currentAffairs: { shell: "generation-ready" },
        vocabulary: { shell: "generation-ready" },
        quiz: { shell: "generation-ready" },
        whatsappText: "WhatsApp-ready formatting shell"
      }
    });
    await enqueuePDF({ title: issue.title, lines: ["Daily Intelligence Engine shell", "Current affairs", "Vocabulary", "Quiz"] });
    await prisma.contentModerationItem.create({ data: { contentType: "DAILY_INTELLIGENCE", contentId: issue.id, status: "PENDING" } });
    return issue;
  },

  dailyIssues() {
    return prisma.dailyIntelligenceIssue.findMany({ orderBy: { issueDate: "desc" }, take: 60 });
  },

  moderationQueue() {
    return prisma.contentModerationItem.findMany({ where: { status: "PENDING" }, orderBy: { createdAt: "asc" }, take: 100 });
  },

  publishIssue(id: string) {
    return prisma.dailyIntelligenceIssue.update({ where: { id }, data: { status: "PUBLISHED", moderationStatus: "APPROVED", publishedAt: new Date() } });
  },

  archiveIssue(id: string) {
    return prisma.dailyIntelligenceIssue.update({ where: { id }, data: { status: "ARCHIVED", archivedAt: new Date() } });
  }
};
