import { prisma } from "../../config/prisma.js";
import { aiPlannerAiService, type StudyPlanInput } from "./ai-planner-ai.service.js";

export const aiPlannerService = {
  async generate(userId: string, input: StudyPlanInput) {
    const generatedPlan = aiPlannerAiService.generateStudyPlan(input);
    const weakAnalysis = aiPlannerAiService.analyzeWeakTopics(input.weaknesses);
    const aiSuggestions = aiPlannerAiService.generateRecommendations({
      weakTopics: input.weaknesses,
      strongTopics: input.strengths
    });

    const plan = await prisma.studyPlan.create({
      data: {
        userId,
        targetExam: input.targetExam,
        studyHoursPerDay: input.studyHoursPerDay,
        targetDate: new Date(input.targetDate),
        strengths: input.strengths,
        weaknesses: input.weaknesses,
        generatedPlan
      }
    });

    await prisma.performanceAnalytics.upsert({
      where: { userId },
      create: {
        userId,
        testAccuracy: 68,
        weakTopics: input.weaknesses,
        strongTopics: input.strengths,
        averageScore: 72,
        studyConsistency: 64,
        revisionRate: 58,
        aiSuggestions
      },
      update: {
        weakTopics: input.weaknesses,
        strongTopics: input.strengths,
        aiSuggestions
      }
    });

    await prisma.revisionSchedule.createMany({
      data: weakAnalysis.map((item, index) => ({
        userId,
        topic: item.topic,
        revisionDate: new Date(Date.now() + (index + 1) * 24 * 60 * 60 * 1000),
        priority: index === 0 ? "HIGH" : "MEDIUM",
        status: "PENDING"
      }))
    });

    return plan;
  },

  myPlan(userId: string) {
    return prisma.studyPlan.findFirst({ where: { userId }, orderBy: { createdAt: "desc" } });
  },

  async performance(userId: string) {
    return (
      (await prisma.performanceAnalytics.findUnique({ where: { userId } })) ??
      (await prisma.performanceAnalytics.create({
        data: {
          userId,
          testAccuracy: 0,
          weakTopics: [],
          strongTopics: [],
          averageScore: 0,
          studyConsistency: 0,
          revisionRate: 0,
          aiSuggestions: aiPlannerAiService.generateRecommendations({ weakTopics: [], strongTopics: [] })
        }
      }))
    );
  },

  async recommendations(userId: string) {
    const analytics = await this.performance(userId);
    return {
      recommendations: analytics.aiSuggestions,
      weakTopicAnalysis: aiPlannerAiService.analyzeWeakTopics(analytics.weakTopics as string[])
    };
  },

  createRevision(userId: string, input: { topic: string; revisionDate: string; priority: string }) {
    return prisma.revisionSchedule.create({
      data: {
        userId,
        topic: input.topic,
        revisionDate: new Date(input.revisionDate),
        priority: input.priority,
        status: "PENDING"
      }
    });
  },

  revisionSchedule(userId: string) {
    return prisma.revisionSchedule.findMany({
      where: { userId },
      orderBy: [{ revisionDate: "asc" }, { priority: "asc" }]
    });
  }
};
