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

type SaveStateInput = {
  attemptId: string;
  currentQuestionId?: string;
  sectionState?: unknown;
  answers: Array<{
    questionId: string;
    selectedAnswer?: string;
    status?: string;
    confidence?: string;
    timeSpent?: number;
    markedForReview?: boolean;
  }>;
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
    const test = await this.details(testId);

    const attempt = await prisma.testAttempt.create({
      data: { userId, testId },
      include: {
        test: {
          include: testInclude
        }
      }
    });
    await prisma.cBTAnswerState.createMany({
      data: test.questions.map((question) => ({ attemptId: attempt.id, questionId: question.id })),
      skipDuplicates: true
    });
    return attempt;
  },

  async resume(userId: string, attemptId: string) {
    const attempt = await prisma.testAttempt.findFirst({
      where: { id: attemptId, userId },
      include: {
        test: { include: testInclude },
        answerStates: true,
        integrityEvents: { orderBy: { createdAt: "desc" }, take: 20 }
      }
    });
    if (!attempt) throw new Error("Attempt not found");
    return attempt;
  },

  async saveState(userId: string, input: SaveStateInput) {
    const attempt = await prisma.testAttempt.findFirst({
      where: { id: input.attemptId, userId },
      include: { test: { include: { questions: true } } }
    });
    if (!attempt) throw new Error("Attempt not found");
    if (attempt.submittedAt) throw new Error("Attempt already submitted");

    const questionIds = new Set(attempt.test.questions.map((question) => question.id));
    await prisma.$transaction([
      prisma.testAttempt.update({
        where: { id: input.attemptId },
        data: {
          currentQuestionId: input.currentQuestionId,
          sectionState: input.sectionState as object,
          lastSavedAt: new Date(),
          status: "IN_PROGRESS"
        }
      }),
      ...input.answers
        .filter((answer) => questionIds.has(answer.questionId))
        .map((answer) =>
          prisma.cBTAnswerState.upsert({
            where: { attemptId_questionId: { attemptId: input.attemptId, questionId: answer.questionId } },
            update: {
              selectedAnswer: answer.selectedAnswer,
              status: answer.status ?? (answer.selectedAnswer ? "ANSWERED" : "UNANSWERED"),
              confidence: answer.confidence,
              timeSpent: answer.timeSpent,
              markedForReview: answer.markedForReview,
              visitCount: { increment: 1 }
            },
            create: {
              attemptId: input.attemptId,
              questionId: answer.questionId,
              selectedAnswer: answer.selectedAnswer,
              status: answer.status ?? (answer.selectedAnswer ? "ANSWERED" : "UNANSWERED"),
              confidence: answer.confidence,
              timeSpent: answer.timeSpent ?? 0,
              markedForReview: answer.markedForReview ?? false,
              visitCount: 1
            }
          })
        )
    ]);
    return this.resume(userId, input.attemptId);
  },

  async integrityEvent(userId: string, input: { attemptId: string; eventType: string; severity?: string; metadata?: unknown }) {
    const attempt = await prisma.testAttempt.findFirst({ where: { id: input.attemptId, userId } });
    if (!attempt) throw new Error("Attempt not found");
    const penalty = input.severity === "HIGH" ? 10 : input.severity === "MEDIUM" ? 5 : 1;
    await prisma.testAttempt.update({
      where: { id: input.attemptId },
      data: { integrityScore: { decrement: penalty } }
    });
    return prisma.cBTIntegrityEvent.create({
      data: { attemptId: input.attemptId, eventType: input.eventType, severity: input.severity ?? "LOW", metadata: input.metadata as object }
    });
  },

  async reviewPlan(userId: string, attemptId: string) {
    const attempt = await this.resume(userId, attemptId);
    const states = attempt.answerStates;
    const skipped = states.filter((state) => state.status === "SKIPPED" || !state.selectedAnswer);
    const review = states.filter((state) => state.markedForReview);
    const lowConfidence = states.filter((state) => state.confidence === "LOW");
    const orderedIds = [...skipped, ...lowConfidence, ...review].map((state) => state.questionId);
    return {
      skippedQuestionIds: skipped.map((state) => state.questionId),
      reviewQuestionIds: review.map((state) => state.questionId),
      lowConfidenceQuestionIds: lowConfidence.map((state) => state.questionId),
      aiReviewOrder: Array.from(new Set(orderedIds)),
      quickWinShell: Array.from(new Set(orderedIds)).slice(0, 5)
    };
  },

  async intelligenceReport(userId: string, attemptId: string) {
    const attempt = await prisma.testAttempt.findFirst({
      where: { id: attemptId, userId },
      include: { test: { include: { questions: true } }, answerStates: { include: { question: true } }, answers: { include: { question: true } } }
    });
    if (!attempt) throw new Error("Attempt not found");
    const skipped = attempt.answerStates.filter((state) => state.status === "SKIPPED" || !state.selectedAnswer);
    const lowConfidence = attempt.answerStates.filter((state) => state.confidence === "LOW");
    const highTime = attempt.answerStates.filter((state) => state.timeSpent > 120);
    const topicAnalysis = getTopicAnalysis(attempt.answers);
    const weakTopicAnalytics = topicAnalysis.filter((topic) => topic.accuracy < 60);
    const aiReviewOrder = Array.from(new Set([...skipped, ...lowConfidence, ...highTime].map((state) => state.questionId)));
    const accuracy = attempt.answers.length ? Math.round((attempt.totalCorrect / attempt.answers.length) * 100) : 0;
    const reportData = {
      attemptId,
      userId,
      skippedQuestionIds: skipped.map((state) => state.questionId),
      aiReviewOrder,
      confidenceAnalysis: {
        lowConfidence: lowConfidence.length,
        confidenceMismatch: attempt.answerStates.filter((state) => state.confidence === "HIGH" && state.selectedAnswer && attempt.answers.some((answer) => answer.questionId === state.questionId && !answer.isCorrect)).length
      },
      accuracyAnalytics: { accuracy, correct: attempt.totalCorrect, wrong: attempt.totalWrong },
      speedAnalytics: { averagePerQuestion: attempt.answers.length ? Math.round(attempt.timeTaken / attempt.answers.length) : 0, slowQuestionIds: highTime.map((state) => state.questionId) },
      timePressureAnalysis: { timeTaken: attempt.timeTaken, duration: attempt.test.duration, pressure: attempt.timeTaken > attempt.test.duration * 60 * 0.85 ? "HIGH" : "NORMAL" },
      weakTopicAnalytics,
      quickWinSuggestions: aiReviewOrder.slice(0, 5).map((questionId) => ({ questionId, action: "Review explanation, then solve one similar question." })),
      rankPrediction: { predictedRank: Math.max(1, 500 - Math.round(attempt.score * 3)), confidence: "SHELL" }
    };
    return prisma.cBTIntelligenceReport.upsert({
      where: { attemptId },
      update: reportData,
      create: reportData
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
        submittedAt: new Date(),
        status: "SUBMITTED"
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
