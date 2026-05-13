import { prisma } from "../../config/prisma.js";
import { enqueuePDF } from "../../queues/pdf.queue.js";
import { enqueueAI } from "../../queues/ai.queue.js";
import { callOpenAIJson } from "../ai-engine/openai.service.js";

const supportedExams = ["NDA", "CDS", "AFCAT", "Agniveer", "AISSEE", "RIMC", "RMS", "SSB", "defence GK", "current affairs"];

function sanitizePrompt(content: string) {
  return content.replace(/<script/gi, "").replace(/ignore previous instructions/gi, "").trim().slice(0, 3000);
}

function addDays(days: number) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

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
    await Promise.all(
      Array.from(new Set(wrongTopics)).slice(0, 20).map((topic) =>
        prisma.learningTopicInsight.upsert({
          where: { userId_subject_topic: { userId, subject: "CBT", topic } },
          update: {
            weaknessScore: { increment: 8 },
            confidenceScore: { decrement: 3 },
            recommendations: { revision: `Revise ${topic} with short notes, examples and 10 timed questions.` }
          },
          create: {
            userId,
            subject: "CBT",
            topic,
            weaknessScore: 70,
            confidenceScore: 42,
            recommendations: { revision: `Revise ${topic} with short notes, examples and 10 timed questions.` }
          }
        })
      )
    );
    await Promise.all(
      weakTopics.slice(0, 5).map((topic, index) =>
        prisma.revisionQueueItem.upsert({
          where: { id: `${userId}-${topic}` },
          update: {},
          create: {
            id: `${userId}-${topic}`,
            userId,
            subject: "CBT",
            topic,
            priority: index < 2 ? "HIGH" : "MEDIUM",
            reason: "Detected from recent wrong-answer pattern",
            dueAt: addDays(index + 1)
          }
        }).catch(() => undefined)
      )
    );
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

  async adaptiveLearning(userId: string) {
    const [snapshot, insights, queue] = await Promise.all([
      this.analytics(userId),
      prisma.learningTopicInsight.findMany({ where: { userId }, orderBy: [{ weaknessScore: "desc" }, { updatedAt: "desc" }], take: 20 }),
      prisma.revisionQueueItem.findMany({ where: { userId, status: "PENDING" }, orderBy: [{ priority: "asc" }, { dueAt: "asc" }], take: 20 })
    ]);
    return {
      snapshot,
      insights,
      revisionQueue: queue,
      heatmap: snapshot.heatmap,
      smartStudyPlan: insights.slice(0, 6).map((item, index) => ({
        day: index + 1,
        subject: item.subject,
        topic: item.topic,
        action: item.weaknessScore > 60 ? "Remedial concept + timed practice" : "Mixed revision"
      }))
    };
  },

  async createTutorSession(userId: string, input: { subject: string; topic?: string; examType?: string }) {
    const examType = input.examType && supportedExams.includes(input.examType) ? input.examType : "NDA";
    return prisma.aITutorSession.create({ data: { userId, subject: input.subject, topic: input.topic, context: { examType, memory: [], weakAreaSupport: true, escalationReady: true } }, include: { messages: true } });
  },

  async tutorMessage(userId: string, sessionId: string, content: string) {
    const session = await prisma.aITutorSession.findFirst({ where: { id: sessionId, userId }, include: { messages: { orderBy: { createdAt: "asc" }, take: 10 } } });
    if (!session) throw new Error("Tutor session not found");
    const cleanContent = sanitizePrompt(content);
    await prisma.aITutorMessage.create({ data: { sessionId, role: "USER", content: cleanContent, metadata: { moderation: "SANITIZED" } } });
    await enqueueAI({ feature: "tutor-response", input: { sessionId, subject: session.subject, content } });
    const context = session.context as { examType?: string } | null;
    const weakInsights = await prisma.learningTopicInsight.findMany({ where: { userId }, orderBy: { weaknessScore: "desc" }, take: 5 });
    const generated = await callOpenAIJson(
      "You are NIDUS AI Tutor for Indian defence exam preparation. Return JSON with answer, revisionSupport, motivation, escalationSuggested.",
      JSON.stringify({ examType: context?.examType ?? "NDA", subject: session.subject, topic: session.topic, weakInsights, recentMessages: session.messages, question: cleanContent }),
      {
        answer: `Let's handle ${session.subject}${session.topic ? `/${session.topic}` : ""} step by step for defence exam readiness. First identify the concept, then apply one rule, then solve a similar timed question.`,
        revisionSupport: "Add this topic to today's 25-minute revision block.",
        motivation: "Steady effort beats last-minute pressure. One clear concept at a time.",
        escalationSuggested: false
      }
    );
    return prisma.aITutorMessage.create({
      data: {
        sessionId,
        role: "ASSISTANT",
        content: String(generated.answer),
        metadata: { revisionSupport: generated.revisionSupport, motivationalCoaching: generated.motivation, escalationSuggested: generated.escalationSuggested }
      }
    });
  },

  async tutorFeedback(userId: string, sessionId: string, input: { rating: number; feedback?: string; escalationRequested?: boolean }) {
    const session = await prisma.aITutorSession.findFirst({ where: { id: sessionId, userId } });
    if (!session) throw new Error("Tutor session not found");
    if (input.escalationRequested) {
      await prisma.aITutorSession.update({ where: { id: sessionId }, data: { escalationStatus: "REQUESTED" } });
    }
    return prisma.aITutorFeedback.create({
      data: { sessionId, userId, rating: input.rating, feedback: input.feedback, escalationRequested: input.escalationRequested ?? false }
    });
  },

  async tutorSession(userId: string, sessionId: string) {
    const session = await prisma.aITutorSession.findFirst({ where: { id: sessionId, userId }, include: { messages: { orderBy: { createdAt: "asc" } } } });
    if (!session) throw new Error("Tutor session not found");
    return session;
  },

  async dailyIssueDraft(input: { title: string; issueDate: string; categories: string[] }) {
    const generated = await callOpenAIJson(
      "Generate a Daily Intelligence package for defence aspirants. Return JSON with currentAffairs, defenceNews, vocabulary, staticGK, quiz, tags, whatsappText.",
      JSON.stringify(input),
      {
        currentAffairs: [],
        defenceNews: [],
        vocabulary: [],
        staticGK: [],
        quiz: [],
        tags: input.categories,
        whatsappText: "Daily Intelligence issue queued for editorial moderation."
      }
    );
    const issue = await prisma.dailyIntelligenceIssue.upsert({
      where: { issueDate: new Date(input.issueDate) },
      update: { title: input.title, categories: input.categories, currentAffairs: generated.currentAffairs as object, vocabulary: generated.vocabulary as object, quiz: generated.quiz as object, whatsappText: String(generated.whatsappText) },
      create: {
        title: input.title,
        issueDate: new Date(input.issueDate),
        categories: input.categories,
        currentAffairs: { items: generated.currentAffairs, defenceNews: generated.defenceNews, staticGK: generated.staticGK },
        vocabulary: generated.vocabulary as object,
        quiz: generated.quiz as object,
        whatsappText: String(generated.whatsappText)
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
  },

  scheduleIssue(input: { title: string; issueDate: string; categories: string[]; publishAt?: string }) {
    return this.dailyIssueDraft(input).then(async (issue) => {
      await enqueueAI({ feature: "daily-intelligence-scheduled-publish", input: { issueId: issue.id, publishAt: input.publishAt } });
      return issue;
    });
  },

  async generateContent(userId: string, input: { contentType: string; sourceId?: string; title: string; prompt: string; tags?: string[] }) {
    const generated = await callOpenAIJson(
      "Generate defence-learning content. Return JSON suitable for summaries, quizzes, explanations, revision notes, flashcards, or practice sets.",
      JSON.stringify(input),
      { summary: sanitizePrompt(input.prompt), items: [], explanation: "Generated content pending model configuration." }
    );
    return prisma.generatedContentAsset.create({
      data: { contentType: input.contentType, sourceId: input.sourceId, title: input.title, body: generated, tags: input.tags ?? [], createdBy: userId }
    });
  },

  async createIngestionJob(userId: string, input: { sourceType: string; sourceUrl?: string; uploadUrl?: string; targetModule: string; metadata?: unknown }) {
    const job = await prisma.contentIngestionJob.create({
      data: { sourceType: input.sourceType, sourceUrl: input.sourceUrl, uploadUrl: input.uploadUrl, targetModule: input.targetModule, metadata: (input.metadata ?? {}) as object, createdBy: userId }
    });
    await enqueueAI({ feature: "content-ingestion", input: { jobId: job.id, targetModule: job.targetModule } });
    return job;
  },

  ingestionJobs() {
    return prisma.contentIngestionJob.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
  },

  aiGovernance() {
    return Promise.all([
      prisma.aIRequestLog.findMany({ orderBy: { createdAt: "desc" }, take: 50 }),
      prisma.aIResponseCache.count(),
      prisma.aITutorFeedback.findMany({ orderBy: { createdAt: "desc" }, take: 25 }),
      prisma.contentModerationItem.count({ where: { status: "PENDING" } })
    ]).then(([requests, cacheEntries, feedback, pendingModeration]) => ({ requests, cacheEntries, feedback, pendingModeration }));
  }
};
