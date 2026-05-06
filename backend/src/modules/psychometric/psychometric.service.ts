import { prisma } from "../../config/prisma.js";
import { psychometricAiService } from "./psychometric-ai.service.js";

type SubmitAnswer = {
  questionId: string;
  answerText?: string;
  selectedOption?: string;
};

const includeQuestions = {
  questions: { orderBy: { order: "asc" as const } }
};

const olqKeys = [
  "effectiveIntelligence",
  "reasoningAbility",
  "organizingAbility",
  "socialAdaptability",
  "cooperation",
  "senseOfResponsibility",
  "initiative",
  "selfConfidence",
  "speedOfDecision",
  "abilityToInfluence",
  "liveliness",
  "determination",
  "courage",
  "stamina",
  "emotionalStability"
] as const;

function scoreAnswers(answers: SubmitAnswer[]) {
  return Math.min(100, Math.round(answers.filter((answer) => answer.answerText || answer.selectedOption).length * 18));
}

export const psychometricService = {
  async listTests() {
    return prisma.psychometricTest.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { questions: true } } }
    });
  },

  async getTest(id: string) {
    const test = await prisma.psychometricTest.findUnique({ where: { id }, include: includeQuestions });
    if (!test) throw new Error("Psychometric test not found");
    return test;
  },

  async start(userId: string, testId: string) {
    await this.getTest(testId);
    return prisma.psychometricAttempt.create({
      data: { userId, testId },
      include: { test: { include: includeQuestions } }
    });
  },

  async submit(userId: string, attemptId: string, answers: SubmitAnswer[]) {
    const attempt = await prisma.psychometricAttempt.findFirst({
      where: { id: attemptId, userId },
      include: { test: true }
    });
    if (!attempt) throw new Error("Psychometric attempt not found");
    if (attempt.completedAt) throw new Error("Attempt already completed");

    const score = scoreAnswers(answers);
    const answerRows = answers.map((answer) => ({
      attemptId,
      questionId: answer.questionId,
      answerText: answer.answerText,
      selectedOption: answer.selectedOption,
      score: answer.answerText || answer.selectedOption ? Math.min(10, Math.max(4, score / 10)) : 0
    }));

    await prisma.psychometricAnswer.createMany({ data: answerRows, skipDuplicates: true });
    const savedAnswers = await prisma.psychometricAnswer.findMany({ where: { attemptId } });
    const aiAnalysis = psychometricAiService.analyzePersonality(savedAnswers);
    const overallRemark = score >= 75 ? "Strong officer readiness indicators" : score >= 55 ? "Developing profile with focused improvement areas" : "Needs structured mentoring and response practice";

    if (attempt.test.type === "OLQ") {
      const base = Math.max(45, Math.min(92, score));
      const olqData = Object.fromEntries(olqKeys.map((key, index) => [key, Math.max(40, Math.min(95, base + ((index % 5) - 2) * 4))]));
      await prisma.oLQScore.upsert({
        where: { userId },
        create: { userId, ...olqData },
        update: olqData
      });
    }

    return prisma.psychometricAttempt.update({
      where: { id: attemptId },
      data: { score, aiAnalysis, overallRemark, completedAt: new Date() },
      include: { test: true, answers: { include: { question: true } } }
    });
  },

  async result(userId: string, attemptId: string) {
    const attempt = await prisma.psychometricAttempt.findFirst({
      where: { id: attemptId, userId },
      include: { test: true, answers: { include: { question: true } } }
    });
    if (!attempt) throw new Error("Psychometric result not found");
    const recommendations = psychometricAiService.generateRecommendations(attempt.test.type, []);
    return { attempt, recommendations };
  },

  async olqReport(userId: string) {
    const score =
      (await prisma.oLQScore.findUnique({ where: { userId } })) ??
      (await prisma.oLQScore.create({ data: { userId } }));
    const values = Object.fromEntries(olqKeys.map((key) => [key, score[key]]));
    const insights = psychometricAiService.generateOLQInsights(values);
    return { score, insights };
  }
};
