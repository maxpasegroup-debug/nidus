import { prisma } from "../../config/prisma.js";
import type { Role } from "../../generated/prisma/client.js";
import { aiEngineAIService } from "./ai-engine-ai.service.js";

function scopeUser(requester: { id: string; role: Role }, userId?: string) {
  return requester.role === "ADMIN" && userId ? userId : requester.id;
}

export const aiEngineService = {
  async startInterview(requester: { id: string; role: Role }, input: { examType: string; interviewType: string }) {
    const session = await prisma.aIInterviewSession.create({ data: { userId: requester.id, examType: input.examType, interviewType: input.interviewType } });
    const generated = await aiEngineAIService.generateInterviewQuestion({ ...input, previousQuestions: [] });
    const question = await prisma.aIInterviewQuestion.create({ data: { sessionId: session.id, question: String(generated.question) } });
    return { session, question };
  },
  async nextQuestion(input: { sessionId: string }) {
    const session = await prisma.aIInterviewSession.findUnique({ where: { id: input.sessionId }, include: { questions: true } });
    if (!session) throw new Error("Interview session not found");
    const generated = await aiEngineAIService.generateInterviewQuestion({ examType: session.examType, interviewType: session.interviewType, previousQuestions: session.questions.map((item) => item.question) });
    return prisma.aIInterviewQuestion.create({ data: { sessionId: session.id, question: String(generated.question) } });
  },
  async submitAnswer(input: { questionId: string; userAnswer: string }) {
    const question = await prisma.aIInterviewQuestion.findUnique({ where: { id: input.questionId } });
    if (!question) throw new Error("Interview question not found");
    const analysis = await aiEngineAIService.analyzeInterviewAnswer({ question: question.question, answer: input.userAnswer });
    return prisma.aIInterviewQuestion.update({ where: { id: input.questionId }, data: { userAnswer: input.userAnswer, aiAnalysis: String(analysis.analysis ?? analysis.feedback), score: Number(analysis.score ?? 70) } });
  },
  async result(sessionId: string) {
    const session = await prisma.aIInterviewSession.findUnique({ where: { id: sessionId }, include: { questions: { orderBy: { createdAt: "asc" } } } });
    if (!session) throw new Error("Interview session not found");
    const scores = session.questions.map((item) => item.score).filter((score): score is number => typeof score === "number");
    const overallScore = scores.length ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) : session.overallScore;
    const aiFeedback = session.aiFeedback ?? "Interview completed. Keep answers concise, example-backed and aligned with officer-like qualities.";
    if (overallScore && session.status !== "COMPLETED") {
      await prisma.aIInterviewSession.update({ where: { id: sessionId }, data: { overallScore, aiFeedback, status: "COMPLETED", completedAt: new Date() } });
    }
    return { ...session, overallScore, aiFeedback };
  },
  async solveDoubt(requester: { id: string; role: Role }, input: { question: string; subject: string }) {
    const solved = await aiEngineAIService.solveStudentDoubt(input);
    return prisma.doubtQuery.create({ data: { userId: requester.id, question: input.question, subject: input.subject, aiResponse: String(solved.answer) } });
  },
  doubtsHistory(requester: { id: string; role: Role }) {
    return prisma.doubtQuery.findMany({ where: { userId: requester.id }, orderBy: { createdAt: "desc" } });
  },
  async recommendations(requester: { id: string; role: Role }) {
    const existing = await prisma.aIRecommendation.findMany({ where: { userId: requester.id }, orderBy: { createdAt: "desc" }, take: 6 });
    if (existing.length) return existing;
    const generated = await aiEngineAIService.generateRecommendations({ userId: requester.id });
    const items = Array.isArray(generated.items) ? generated.items : [];
    await prisma.aIRecommendation.createMany({ data: items.map((item) => ({ userId: requester.id, category: String(item.category), recommendation: String(item.recommendation), priority: String(item.priority) })) });
    return prisma.aIRecommendation.findMany({ where: { userId: requester.id }, orderBy: { createdAt: "desc" } });
  },
  async officerPotential(requester: { id: string; role: Role }, userId?: string) {
    const scoped = scopeUser(requester, userId);
    const existing = await prisma.officerPotential.findUnique({ where: { userId: scoped } });
    if (existing) return existing;
    const analysis = await aiEngineAIService.analyzeOfficerPotential({ userId: scoped });
    return prisma.officerPotential.create({ data: { userId: scoped, leadershipScore: Number(analysis.leadershipScore), communicationScore: Number(analysis.communicationScore), disciplineScore: Number(analysis.disciplineScore), confidenceScore: Number(analysis.confidenceScore), officerReadiness: Number(analysis.officerReadiness), aiSummary: String(analysis.aiSummary) } });
  }
};
