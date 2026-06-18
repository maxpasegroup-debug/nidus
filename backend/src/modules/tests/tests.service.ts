import { Role } from "../../generated/prisma/client.js";
import { prisma } from "../../config/prisma.js";

export type TestPayload = {
  title: string;
  description: string;
  examType: string;
  category: string;
  subject?: string;
  topic?: string;
  batchId?: string;
  teacherId?: string;
  publishAt?: string;
  status?: string;
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

type Requester = {
  id: string;
  role: Role;
  roleMetadata?: Record<string, unknown> | null;
};

type DraftInput = {
  prompt: string;
  examType?: string;
  subject?: string;
  topic?: string;
  questionCount?: number;
  difficultyLevel?: string;
  batchId?: string;
};

type PublishDraftInput = TestPayload & {
  publishAt?: string;
};

const testInclude = {
  questions: {
    orderBy: { id: "asc" as const }
  },
  batch: {
    select: { id: true, name: true, batchType: true, programSlug: true }
  },
  teacher: {
    select: { id: true, name: true, email: true, role: true }
  },
  _count: {
    select: { attempts: true, questions: true }
  }
};

const topicSeeds = [
  "concept clarity",
  "application",
  "speed accuracy",
  "reasoning",
  "exam trap",
  "revision recall"
];

function requesterMetadata(requester: Requester) {
  return requester.roleMetadata && typeof requester.roleMetadata === "object" ? requester.roleMetadata : {};
}

function isAcademicHead(requester: Requester) {
  const template = requesterMetadata(requester).dashboardTemplate;
  return typeof template === "string" && template.toUpperCase() === "ACADEMIC_HEAD";
}

function isAcademicManager(requester: Requester) {
  return requester.role === Role.ADMIN || requester.role === Role.DIRECTOR || requester.role === Role.ACADEMIC_HEAD || isAcademicHead(requester);
}

async function assignedBatchIdsForTeacher(teacherId: string) {
  const rows = await prisma.teacherBatchAssignment.findMany({
    where: { teacherId, status: "ACTIVE" },
    select: { batchId: true }
  });
  return Array.from(new Set(rows.map((row) => row.batchId)));
}

async function assertTeacherBatchSubjectAccess(requester: Requester, batchId?: string, subject?: string | null) {
  if (isAcademicManager(requester)) return;
  if (requester.role !== Role.TEACHER && requester.role !== Role.PHYSICAL_TRAINER) return;
  if (!batchId) throw Object.assign(new Error("Batch is required for teacher exam actions."), { statusCode: 403 });

  const where = {
    batchId,
    teacherId: requester.id,
    status: "ACTIVE",
    ...(subject?.trim() ? { subject: { equals: subject.trim(), mode: "insensitive" as const } } : {})
  };

  const assignment = await prisma.teacherBatchAssignment.findFirst({ where, select: { id: true } });
  if (!assignment) {
    throw Object.assign(new Error(subject?.trim() ? "This subject is not assigned to this teacher for the selected batch." : "Teacher is not assigned to this batch."), { statusCode: 403 });
  }
}

async function assertStudentTestAccess(userId: string, test: { batchId?: string | null }) {
  if (!test.batchId) throw Object.assign(new Error("This exam is not assigned to your batch."), { statusCode: 403 });
  const enrollment = await prisma.batchStudent.findFirst({
    where: { studentId: userId, batchId: test.batchId, status: "ACTIVE" },
    select: { id: true }
  });
  if (!enrollment) throw Object.assign(new Error("This exam is not assigned to your batch."), { statusCode: 403 });
}

async function assertTestAccess(requester: Requester, test: { batchId?: string | null; teacherId?: string | null; subject?: string | null }) {
  if (isAcademicManager(requester)) return;
  if (requester.role === Role.STUDENT) {
    await assertStudentTestAccess(requester.id, test);
    return;
  }
  if (requester.role === Role.TEACHER || requester.role === Role.PHYSICAL_TRAINER) {
    await assertTeacherBatchSubjectAccess(requester, test.batchId ?? undefined, test.subject);
    return;
  }
  throw Object.assign(new Error("Exam access denied."), { statusCode: 403 });
}

function normalizeCount(count?: number) {
  return Math.min(100, Math.max(5, Number.isFinite(Number(count)) ? Number(count) : 30));
}

function inferQuestionCount(prompt: string, requested?: number) {
  const promptCount = Number(prompt.match(/(\d+)\s*(mcq|question|questions|marks)/i)?.[1] ?? requested ?? 30);
  return normalizeCount(promptCount);
}

function uniqueOptions(topic: string, index: number) {
  const seed = topicSeeds[index % topicSeeds.length];
  return [
    `Correct ${topic} ${seed} approach`,
    `Partially correct but incomplete ${topic} method`,
    `Common misconception in ${topic}`,
    `Irrelevant shortcut for this ${topic} context`
  ];
}

function draftTitle(input: DraftInput) {
  const subject = input.subject?.trim() || "NIDUS";
  const topic = input.topic?.trim() || input.prompt.trim().split(/\s+/).slice(0, 6).join(" ");
  return `${input.examType || "Academy"} ${subject} - ${topic} Test`;
}

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
  async list(requester: Requester, filters: { search?: string; examType?: string; topic?: string }) {
    const accessWhere = isAcademicManager(requester)
      ? {}
      : requester.role === Role.STUDENT
        ? { batchId: { in: (await prisma.batchStudent.findMany({ where: { studentId: requester.id, status: "ACTIVE" }, select: { batchId: true } })).map((row) => row.batchId) } }
        : requester.role === Role.TEACHER || requester.role === Role.PHYSICAL_TRAINER
          ? { batchId: { in: await assignedBatchIdsForTeacher(requester.id) } }
          : { id: "__NO_ACCESS__" };

    return prisma.test.findMany({
      where: {
        AND: [
          accessWhere,
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

  async available(userId: string, role?: Role) {
    if (role === Role.ADMIN) {
      return this.list({ id: userId, role }, {});
    }

    const enrollments = await prisma.batchStudent.findMany({
      where: { studentId: userId, status: "ACTIVE" },
      select: { batchId: true }
    });
    const batchIds = enrollments.map((enrollment) => enrollment.batchId);
    if (!batchIds.length) return [];

    const attempts = await prisma.testAttempt.findMany({
      where: { userId },
      select: { testId: true, status: true, submittedAt: true }
    });
    const attemptByTest = new Map(attempts.map((attempt) => [attempt.testId, attempt]));

    const tests = await prisma.test.findMany({
      where: {
        batchId: { in: batchIds },
        status: "PUBLISHED",
        isLive: true,
        OR: [{ publishAt: null }, { publishAt: { lte: new Date() } }]
      },
      orderBy: [{ publishAt: "desc" }, { createdAt: "desc" }],
      include: {
        batch: { select: { id: true, name: true, batchType: true, programSlug: true } },
        _count: { select: { attempts: true, questions: true } }
      }
    });

    return tests.map((test) => ({
      ...test,
      studentStatus: attemptByTest.get(test.id)?.submittedAt ? "SUBMITTED" : attemptByTest.has(test.id) ? "IN_PROGRESS" : "NOT_STARTED"
    }));
  },

  async details(requester: Requester, id: string) {
    const test = await prisma.test.findUnique({ where: { id }, include: testInclude });

    if (!test) {
      throw new Error("Test not found");
    }

    await assertTestAccess(requester, test);
    return test;
  },

  async create(requester: Requester, payload: TestPayload) {
    await assertTeacherBatchSubjectAccess(requester, payload.batchId, payload.subject);
    return prisma.test.create({
      data: {
        title: payload.title,
        description: payload.description,
        examType: payload.examType,
        category: payload.category,
        subject: payload.subject,
        topic: payload.topic,
        batchId: payload.batchId || undefined,
        teacherId: payload.teacherId || undefined,
        publishAt: payload.publishAt ? new Date(payload.publishAt) : undefined,
        status: payload.status ?? "PUBLISHED",
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

  async update(requester: Requester, id: string, payload: Partial<TestPayload>) {
    const test = await prisma.test.findUnique({ where: { id } });

    if (!test) {
      throw new Error("Test not found");
    }
    await assertTestAccess(requester, test);
    await assertTeacherBatchSubjectAccess(requester, payload.batchId ?? test.batchId ?? undefined, payload.subject ?? test.subject);

    return prisma.test.update({
      where: { id },
      data: {
        title: payload.title,
        description: payload.description,
        examType: payload.examType,
        category: payload.category,
        subject: payload.subject,
        topic: payload.topic,
        batchId: payload.batchId,
        teacherId: payload.teacherId,
        publishAt: payload.publishAt ? new Date(payload.publishAt) : undefined,
        status: payload.status,
        duration: payload.duration,
        totalMarks: payload.totalMarks,
        isMockTest: payload.isMockTest,
        isLive: payload.isLive
      },
      include: testInclude
    });
  },

  async remove(requester: Requester, id: string) {
    await this.details(requester, id);
    await prisma.test.delete({ where: { id } });
    return { message: "Test deleted successfully" };
  },

  async generateDraft(requester: Requester, input: DraftInput) {
    await assertTeacherBatchSubjectAccess(requester, input.batchId, input.subject);
    const prompt = input.prompt.trim();
    if (!prompt) throw new Error("Prompt is required");
    const count = inferQuestionCount(prompt, input.questionCount);
    const subject = input.subject?.trim() || "General Studies";
    const topic = input.topic?.trim() || prompt.replace(/^(create|make|generate)\s+/i, "").split(/[,.]/)[0]?.slice(0, 80) || "Teacher topic";
    const difficultyLevel = (input.difficultyLevel || (/hard|advanced/i.test(prompt) ? "HARD" : /easy|basic/i.test(prompt) ? "EASY" : "MEDIUM")).toUpperCase();
    const questions = Array.from({ length: count }).map((_, index) => {
      const options = uniqueOptions(topic, index);
      return {
        questionText: `Q${index + 1}. In ${topic}, which option best matches the expected ${input.examType || "NIDUS"} exam approach for ${topicSeeds[index % topicSeeds.length]}?`,
        optionA: options[0],
        optionB: options[1],
        optionC: options[2],
        optionD: options[3],
        correctAnswer: "A",
        explanation: `Review note: this draft checks ${topicSeeds[index % topicSeeds.length]} in ${topic}. Faculty should verify facts, final answer, and wording before publishing.`,
        marks: 1,
        negativeMarks: 0,
        difficultyLevel,
        topic
      };
    });

    return {
      title: draftTitle(input),
      description: `AI arranged draft from faculty prompt. Faculty approval is required before students receive the test.`,
      examType: input.examType || "NIDUS",
      category: "Teacher Generated",
      subject,
      topic,
      batchId: input.batchId,
      duration: Math.max(15, Math.ceil(count * 1.5)),
      totalMarks: questions.reduce((sum, question) => sum + question.marks, 0),
      isMockTest: true,
      isLive: false,
      status: "DRAFT",
      questions
    };
  },

  async publishDraft(requester: Requester, payload: PublishDraftInput) {
    if (!payload.questions?.length) throw new Error("At least one reviewed question is required before publishing.");
    await assertTeacherBatchSubjectAccess(requester, payload.batchId, payload.subject);
    return prisma.test.create({
      data: {
        title: payload.title,
        description: payload.description,
        examType: payload.examType,
        category: payload.category,
        subject: payload.subject,
        topic: payload.topic,
        batchId: payload.batchId || undefined,
        teacherId: requester.role === Role.TEACHER ? requester.id : payload.teacherId || requester.id,
        publishAt: payload.publishAt ? new Date(payload.publishAt) : undefined,
        status: "PUBLISHED",
        reviewedAt: new Date(),
        approvedAt: new Date(),
        approvedById: requester.id,
        duration: payload.duration,
        totalMarks: payload.totalMarks,
        isMockTest: payload.isMockTest ?? true,
        isLive: true,
        questions: {
          create: payload.questions
        }
      },
      include: testInclude
    });
  },

  async start(userId: string, role: Role | undefined, testId: string) {
    const test = await this.details({ id: userId, role: role ?? Role.STUDENT }, testId);
    if (test.status !== "PUBLISHED") {
      throw new Error("This test is not published for students yet.");
    }
    if (test.publishAt && test.publishAt > new Date()) {
      throw new Error("This test will open at the scheduled time.");
    }

    const existingAttempt = await prisma.testAttempt.findFirst({
      where: { userId, testId },
      orderBy: { startedAt: "desc" },
      include: {
        test: {
          include: testInclude
        }
      }
    });
    if (existingAttempt?.submittedAt) {
      throw new Error("This test has already been submitted.");
    }
    if (existingAttempt) {
      return existingAttempt;
    }

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
