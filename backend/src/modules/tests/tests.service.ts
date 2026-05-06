import { prisma } from "../../config/prisma.js";

export type TestPayload = {
  title: string;
  description: string;
  examType: string;
  category: string;
  duration: number;
  totalMarks: number;
  isMockTest?: boolean;
  isLive?: boolean;
  questions?: QuestionPayload[];
};

type QuestionPayload = {
  questionText: string;
  questionImage?: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: string;
  explanation: string;
  marks: number;
  negativeMarks: number;
  difficultyLevel: string;
  topic: string;
};

type SubmitAnswer = {
  questionId: string;
  selectedAnswer: string;
};

const testInclude = {
  questions: {
    orderBy: { id: "asc" as const }
  },
  _count: {
    select: { attempts: true, questions: true }
  }
};

function getTopicAnalysis(answers: Array<{ isCorrect: boolean; question: { topic: string } }>) {
  const topics = new Map<string, { correct: number; total: number }>();

  for (const answer of answers) {
    const current = topics.get(answer.question.topic) ?? { correct: 0, total: 0 };
    topics.set(answer.question.topic, {
      correct: current.correct + (answer.isCorrect ? 1 : 0),
      total: current.total + 1
    });
  }

  return Array.from(topics.entries()).map(([topic, value]) => ({
    topic,
    correct: value.correct,
    total: value.total,
    accuracy: value.total > 0 ? Math.round((value.correct / value.total) * 100) : 0
  }));
}

export const testsService = {
  async list(filters: { search?: string; examType?: string; topic?: string }) {
    return prisma.test.findMany({
      where: {
        AND: [
          filters.search
            ? {
                OR: [
                  { title: { contains: filters.search, mode: "insensitive" } },
                  { description: { contains: filters.search, mode: "insensitive" } }
                ]
              }
            : {},
          filters.examType ? { examType: filters.examType } : {},
          filters.topic ? { questions: { some: { topic: filters.topic } } } : {}
        ]
      },
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { questions: true, attempts: true }
        }
      }
    });
  },

  async details(id: string) {
    const test = await prisma.test.findUnique({ where: { id }, include: testInclude });

    if (!test) {
      throw new Error("Test not found");
    }

    return test;
  },

  async create(payload: TestPayload) {
    return prisma.test.create({
      data: {
        title: payload.title,
        description: payload.description,
        examType: payload.examType,
        category: payload.category,
        duration: payload.duration,
        totalMarks: payload.totalMarks,
        isMockTest: payload.isMockTest ?? true,
        isLive: payload.isLive ?? false,
        questions: {
          create: payload.questions ?? []
        }
      },
      include: testInclude
    });
  },

  async update(id: string, payload: Partial<TestPayload>) {
    const test = await prisma.test.findUnique({ where: { id } });

    if (!test) {
      throw new Error("Test not found");
    }

    return prisma.test.update({
      where: { id },
      data: {
        title: payload.title,
        description: payload.description,
        examType: payload.examType,
        category: payload.category,
        duration: payload.duration,
        totalMarks: payload.totalMarks,
        isMockTest: payload.isMockTest,
        isLive: payload.isLive
      },
      include: testInclude
    });
  },

  async remove(id: string) {
    await this.details(id);
    await prisma.test.delete({ where: { id } });
    return { message: "Test deleted successfully" };
  },

  async start(userId: string, testId: string) {
    await this.details(testId);

    return prisma.testAttempt.create({
      data: { userId, testId },
      include: {
        test: {
          include: testInclude
        }
      }
    });
  },

  async submit(userId: string, attemptId: string, answers: SubmitAnswer[], timeTaken: number) {
    const attempt = await prisma.testAttempt.findFirst({
      where: { id: attemptId, userId },
      include: { test: { include: { questions: true } } }
    });

    if (!attempt) {
      throw new Error("Attempt not found");
    }

    if (attempt.submittedAt) {
      throw new Error("Attempt already submitted");
    }

    const questions = new Map(attempt.test.questions.map((question) => [question.id, question]));
    let score = 0;
    let totalCorrect = 0;
    let totalWrong = 0;

    const answerData = answers
      .filter((answer) => questions.has(answer.questionId))
      .map((answer) => {
        const question = questions.get(answer.questionId)!;
        const isCorrect = question.correctAnswer === answer.selectedAnswer;
        score += isCorrect ? question.marks : -question.negativeMarks;
        totalCorrect += isCorrect ? 1 : 0;
        totalWrong += isCorrect ? 0 : 1;

        return {
          attemptId,
          questionId: answer.questionId,
          selectedAnswer: answer.selectedAnswer,
          isCorrect
        };
      });

    await prisma.answer.createMany({ data: answerData, skipDuplicates: true });

    return prisma.testAttempt.update({
      where: { id: attemptId },
      data: {
        score,
        totalCorrect,
        totalWrong,
        timeTaken,
        submittedAt: new Date()
      },
      include: {
        test: true,
        answers: { include: { question: true } }
      }
    });
  },

  async history(userId: string) {
    return prisma.testAttempt.findMany({
      where: { userId },
      orderBy: { startedAt: "desc" },
      include: {
        test: {
          select: {
            id: true,
            title: true,
            examType: true,
            totalMarks: true,
            duration: true
          }
        }
      }
    });
  },

  async result(userId: string, attemptId: string) {
    const attempt = await prisma.testAttempt.findFirst({
      where: { id: attemptId, userId },
      include: {
        test: true,
        answers: { include: { question: true } }
      }
    });

    if (!attempt) {
      throw new Error("Result not found");
    }

    const attempted = attempt.answers.length;
    const accuracy = attempted > 0 ? Math.round((attempt.totalCorrect / attempted) * 100) : 0;
    const topicAnalysis = getTopicAnalysis(attempt.answers);
    const weakTopics = topicAnalysis.filter((topic) => topic.accuracy < 60).map((topic) => topic.topic);
    const estimatedRank = Math.max(1, 500 - Math.round(attempt.score * 3));

    return {
      attempt,
      analytics: {
        accuracy,
        weakTopics,
        timeAnalysis: {
          timeTaken: attempt.timeTaken,
          averagePerQuestion: attempted > 0 ? Math.round(attempt.timeTaken / attempted) : 0
        },
        rankEstimation: estimatedRank,
        topicAnalysis,
        aiInsights:
          weakTopics.length > 0
            ? `Focus revision on ${weakTopics.join(", ")} before the next mock.`
            : "Strong attempt. Maintain speed and accuracy with mixed revision drills."
      }
    };
  }
};
