import { Prisma, Role } from "../../generated/prisma/client.js";
import { prisma } from "../../config/prisma.js";

type Requester = {
  id: string;
  role: Role;
};

export type QuestionBankPayload = {
  questionText: string;
  questionType?: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: string;
  explanation: string;
  category?: string;
  subCategory: string;
  topic: string;
  subTopic?: string;
  difficulty?: string;
  marks?: number;
  negativeMarks?: number;
  status?: string;
};

export type QuestionBankFilters = {
  search?: string;
  category?: string;
  subCategory?: string;
  topic?: string;
  difficulty?: string;
  status?: string;
};

export type ExamFromBankPayload = {
  title: string;
  description: string;
  examType: string;
  category: string;
  subject?: string;
  topic?: string;
  batchId?: string;
  batchIds?: string[];
  duration: number;
  totalQuestions?: number;
  marks?: number;
  negativeMarks?: number;
  passingPercentage?: number;
  randomization?: boolean;
  questionSelection?: "MANUAL" | "RANDOM" | "HYBRID";
  questionIds?: string[];
  publishNow?: boolean;
  publishAt?: string;
};

function cleanText(value: unknown, fallback = "") {
  return typeof value === "string" ? value.trim() : fallback;
}

function normalizeDifficulty(value?: string) {
  const normalized = cleanText(value || "MEDIUM").toUpperCase();
  return ["EASY", "MEDIUM", "HARD"].includes(normalized) ? normalized : "MEDIUM";
}

function normalizeStatus(value?: string) {
  const normalized = cleanText(value || "DRAFT").toUpperCase();
  return ["DRAFT", "ACTIVE"].includes(normalized) ? normalized : "DRAFT";
}

function normalizeQuestionType(value?: string) {
  const normalized = cleanText(value || "SINGLE_CHOICE").toUpperCase().replace(/\s+/g, "_");
  return ["SINGLE_CHOICE", "MULTIPLE_CHOICE", "TRUE_FALSE"].includes(normalized) ? normalized : "SINGLE_CHOICE";
}

function normalizeCorrectAnswer(value: string) {
  const normalized = cleanText(value).toUpperCase();
  if (!["A", "B", "C", "D"].includes(normalized)) throw new Error("Correct answer must be A, B, C or D");
  return normalized;
}

function parseNumber(value: unknown, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toQuestionBankData(payload: QuestionBankPayload, requesterId?: string) {
  if (!cleanText(payload.questionText)) throw new Error("Question text is required");
  if (!cleanText(payload.subCategory)) throw new Error("Sub category is required");
  if (!cleanText(payload.topic)) throw new Error("Topic is required");

  return {
    questionText: cleanText(payload.questionText),
    questionType: normalizeQuestionType(payload.questionType),
    optionA: cleanText(payload.optionA),
    optionB: cleanText(payload.optionB),
    optionC: cleanText(payload.optionC),
    optionD: cleanText(payload.optionD),
    correctAnswer: normalizeCorrectAnswer(payload.correctAnswer),
    explanation: cleanText(payload.explanation, "Faculty explanation pending."),
    category: cleanText(payload.category, "Defence"),
    subCategory: cleanText(payload.subCategory),
    topic: cleanText(payload.topic),
    subTopic: cleanText(payload.subTopic),
    difficulty: normalizeDifficulty(payload.difficulty),
    marks: parseNumber(payload.marks, 1),
    negativeMarks: parseNumber(payload.negativeMarks, 0),
    status: normalizeStatus(payload.status),
    createdById: requesterId
  };
}

function csvCells(row: string) {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < row.length; index += 1) {
    const char = row[index];
    const next = row[index + 1];
    if (char === '"' && next === '"') {
      current += '"';
      index += 1;
      continue;
    }
    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (char === "," && !inQuotes) {
      cells.push(current.trim());
      current = "";
      continue;
    }
    current += char;
  }

  cells.push(current.trim());
  return cells;
}

function parseCsv(csvText: string) {
  const rows = csvText
    .split(/\r?\n/)
    .map((row) => row.trim())
    .filter(Boolean);

  if (rows.length < 2) return [];
  const headers = csvCells(rows[0]).map((header) => header.trim());

  return rows.slice(1).map((row) => {
    const cells = csvCells(row);
    return headers.reduce<Record<string, string>>((acc, header, index) => {
      acc[header] = cells[index] ?? "";
      return acc;
    }, {});
  });
}

function mapImportRow(row: Record<string, string>): QuestionBankPayload {
  return {
    questionText: row.questionText || row.Question || row.question || "",
    questionType: row.questionType || row.Type || row.type || "SINGLE_CHOICE",
    optionA: row.optionA || row.A || "",
    optionB: row.optionB || row.B || "",
    optionC: row.optionC || row.C || "",
    optionD: row.optionD || row.D || "",
    correctAnswer: row.correctAnswer || row.Answer || row.answer || "",
    explanation: row.explanation || row.Explanation || "",
    category: row.category || row.Category || "Defence",
    subCategory: row.subCategory || row.SubCategory || row.exam || row.Exam || "",
    topic: row.topic || row.Topic || "",
    subTopic: row.subTopic || row.SubTopic || "",
    difficulty: row.difficulty || row.Difficulty || "MEDIUM",
    marks: parseNumber(row.marks || row.Marks, 1),
    negativeMarks: parseNumber(row.negativeMarks || row.NegativeMarks, 0),
    status: row.status || row.Status || "DRAFT"
  };
}

function testInclude() {
  return {
    questions: { orderBy: { id: "asc" as const } },
    batch: { select: { id: true, name: true, batchType: true, programSlug: true } },
    teacher: { select: { id: true, name: true, email: true, role: true } },
    approvedBy: { select: { id: true, name: true, email: true, role: true } },
    _count: { select: { attempts: true, questions: true } }
  };
}

export const examinationService = {
  async questionBank(filters: QuestionBankFilters) {
    const where: Prisma.QuestionBankItemWhereInput = {
      AND: [
        filters.search
          ? {
              OR: [
                { questionText: { contains: filters.search, mode: "insensitive" } },
                { explanation: { contains: filters.search, mode: "insensitive" } },
                { topic: { contains: filters.search, mode: "insensitive" } },
                { subTopic: { contains: filters.search, mode: "insensitive" } }
              ]
            }
          : {},
        filters.category ? { category: filters.category } : {},
        filters.subCategory ? { subCategory: filters.subCategory } : {},
        filters.topic ? { topic: filters.topic } : {},
        filters.difficulty ? { difficulty: filters.difficulty } : {},
        filters.status ? { status: filters.status } : {}
      ]
    };

    return prisma.questionBankItem.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { createdBy: { select: { id: true, name: true, email: true, role: true } } }
    });
  },

  async createQuestion(requester: Requester, payload: QuestionBankPayload) {
    return prisma.questionBankItem.create({
      data: toQuestionBankData(payload, requester.id),
      include: { createdBy: { select: { id: true, name: true, email: true, role: true } } }
    });
  },

  async updateQuestion(id: string, payload: Partial<QuestionBankPayload>) {
    await this.getQuestion(id);
    const data: Prisma.QuestionBankItemUpdateInput = {};
    if (payload.questionText !== undefined) data.questionText = cleanText(payload.questionText);
    if (payload.questionType !== undefined) data.questionType = normalizeQuestionType(payload.questionType);
    if (payload.optionA !== undefined) data.optionA = cleanText(payload.optionA);
    if (payload.optionB !== undefined) data.optionB = cleanText(payload.optionB);
    if (payload.optionC !== undefined) data.optionC = cleanText(payload.optionC);
    if (payload.optionD !== undefined) data.optionD = cleanText(payload.optionD);
    if (payload.correctAnswer !== undefined) data.correctAnswer = normalizeCorrectAnswer(payload.correctAnswer);
    if (payload.explanation !== undefined) data.explanation = cleanText(payload.explanation);
    if (payload.category !== undefined) data.category = cleanText(payload.category, "Defence");
    if (payload.subCategory !== undefined) data.subCategory = cleanText(payload.subCategory);
    if (payload.topic !== undefined) data.topic = cleanText(payload.topic);
    if (payload.subTopic !== undefined) data.subTopic = cleanText(payload.subTopic);
    if (payload.difficulty !== undefined) data.difficulty = normalizeDifficulty(payload.difficulty);
    if (payload.marks !== undefined) data.marks = parseNumber(payload.marks, 1);
    if (payload.negativeMarks !== undefined) data.negativeMarks = parseNumber(payload.negativeMarks, 0);
    if (payload.status !== undefined) data.status = normalizeStatus(payload.status);

    return prisma.questionBankItem.update({
      where: { id },
      data,
      include: { createdBy: { select: { id: true, name: true, email: true, role: true } } }
    });
  },

  async getQuestion(id: string) {
    const question = await prisma.questionBankItem.findUnique({ where: { id } });
    if (!question) throw new Error("Question not found");
    return question;
  },

  async deleteQuestion(id: string) {
    await this.getQuestion(id);
    await prisma.questionBankItem.delete({ where: { id } });
    return { message: "Question deleted successfully" };
  },

  async importQuestions(requester: Requester, input: { csvText?: string; items?: QuestionBankPayload[] }) {
    const rows = input.items?.length ? input.items : parseCsv(input.csvText ?? "").map(mapImportRow);
    if (!rows.length) throw new Error("No import rows found");
    const validRows = rows.map((row) => toQuestionBankData(row, requester.id));
    const result = await prisma.questionBankItem.createMany({ data: validRows, skipDuplicates: true });
    return { imported: result.count };
  },

  async createExamFromBank(requester: Requester, payload: ExamFromBankPayload) {
    if (!cleanText(payload.title)) throw new Error("Exam name is required");
    if (!cleanText(payload.examType)) throw new Error("Exam type is required");
    const selection = payload.questionSelection ?? (payload.questionIds?.length ? "MANUAL" : "RANDOM");
    const totalQuestions = Math.max(1, Math.min(200, Math.floor(parseNumber(payload.totalQuestions, payload.questionIds?.length || 100))));

    const where: Prisma.QuestionBankItemWhereInput =
      selection === "MANUAL" && payload.questionIds?.length
        ? { id: { in: payload.questionIds }, status: "ACTIVE" }
        : {
            status: "ACTIVE",
            category: payload.category || "Defence",
            subCategory: payload.examType,
            ...(payload.topic ? { topic: payload.topic } : {})
          };

    const bankQuestions = await prisma.questionBankItem.findMany({
      where,
      orderBy: payload.randomization ? { createdAt: "desc" } : { createdAt: "asc" },
      take: totalQuestions
    });

    if (!bankQuestions.length) {
      throw new Error("No active question bank items found for this exam selection.");
    }

    const questions = bankQuestions.map((question) => ({
      questionText: question.questionText,
      optionA: question.optionA,
      optionB: question.optionB,
      optionC: question.optionC,
      optionD: question.optionD,
      correctAnswer: question.correctAnswer,
      explanation: question.explanation,
      marks: payload.marks ?? question.marks,
      negativeMarks: payload.negativeMarks ?? question.negativeMarks,
      difficultyLevel: question.difficulty,
      topic: question.topic
    }));

    const totalMarks = questions.reduce((sum, question) => sum + question.marks, 0);
    const workflowNote = `Passing ${payload.passingPercentage ?? 50}%. Selection ${selection}. Randomization ${payload.randomization ? "enabled" : "disabled"}.`;

    const batchIds = Array.from(new Set([payload.batchId, ...(payload.batchIds ?? [])].filter((value): value is string => Boolean(cleanText(value)))));
    const baseData = {
        title: cleanText(payload.title),
        description: `${cleanText(payload.description, "NIDUS Academy CBT exam.")}\n\n${workflowNote}`,
        examType: cleanText(payload.examType),
        category: cleanText(payload.category, "Defence"),
        subject: cleanText(payload.subject),
        topic: cleanText(payload.topic),
        teacherId: requester.role === Role.TEACHER ? requester.id : undefined,
        publishAt: payload.publishAt ? new Date(payload.publishAt) : undefined,
        status: payload.publishNow ? "PUBLISHED" : "DRAFT",
        reviewedAt: payload.publishNow ? new Date() : undefined,
        approvedAt: payload.publishNow ? new Date() : undefined,
        approvedById: payload.publishNow ? requester.id : undefined,
        duration: Math.max(1, Math.floor(parseNumber(payload.duration, 60))),
        totalMarks,
        isMockTest: true,
        isLive: Boolean(payload.publishNow)
    };

    if (batchIds.length <= 1) {
      return prisma.test.create({
        data: {
          ...baseData,
          batchId: batchIds[0] || undefined,
          questions: { create: questions }
        },
        include: testInclude()
      });
    }

    const created = await prisma.$transaction(
      batchIds.map((batchId) =>
        prisma.test.create({
          data: {
            ...baseData,
            title: `${baseData.title} - ${batchId.slice(-4).toUpperCase()}`,
            batchId,
            questions: { create: questions }
          },
          include: testInclude()
        })
      )
    );

    return { ...created[0], publishedCopies: created.length };
  },

  async publishExam(requester: Requester, id: string, input: { publishAt?: string; batchId?: string }) {
    await prisma.test.findUniqueOrThrow({ where: { id } });
    return prisma.test.update({
      where: { id },
      data: {
        status: "PUBLISHED",
        isLive: true,
        batchId: cleanText(input.batchId) || undefined,
        publishAt: input.publishAt ? new Date(input.publishAt) : undefined,
        reviewedAt: new Date(),
        approvedAt: new Date(),
        approvedById: requester.id
      },
      include: testInclude()
    });
  },

  async closeExam(id: string) {
    await prisma.test.findUniqueOrThrow({ where: { id } });
    return prisma.test.update({
      where: { id },
      data: { status: "CLOSED", isLive: false },
      include: testInclude()
    });
  },

  async deleteExam(id: string) {
    await prisma.test.findUniqueOrThrow({ where: { id } });
    await prisma.test.delete({ where: { id } });
    return { message: "Exam deleted successfully" };
  },

  async results() {
    return prisma.testAttempt.findMany({
      where: { submittedAt: { not: null } },
      orderBy: { submittedAt: "desc" },
      take: 100,
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
        test: { select: { id: true, title: true, examType: true, totalMarks: true, duration: true, batch: { select: { id: true, name: true } } } }
      }
    });
  },

  async analytics() {
    const [tests, questions, attempts] = await Promise.all([
      prisma.test.findMany({ include: { _count: { select: { questions: true, attempts: true } } } }),
      prisma.questionBankItem.groupBy({ by: ["subCategory", "topic", "difficulty", "status"], _count: { _all: true } }),
      prisma.testAttempt.findMany({ where: { submittedAt: { not: null } }, include: { test: true } })
    ]);

    const totalScore = attempts.reduce((sum, attempt) => sum + attempt.score, 0);
    return {
      totals: {
        exams: tests.length,
        published: tests.filter((test) => test.status === "PUBLISHED" || test.isLive).length,
        questions: tests.reduce((sum, test) => sum + (test._count.questions ?? 0), 0),
        questionBank: questions.reduce((sum, row) => sum + row._count._all, 0),
        attempts: attempts.length,
        averageScore: attempts.length ? Math.round(totalScore / attempts.length) : 0
      },
      questionBankBreakdown: questions,
      examBreakdown: tests.map((test) => ({
        id: test.id,
        title: test.title,
        examType: test.examType,
        status: test.status,
        questions: test._count.questions,
        attempts: test._count.attempts
      }))
    };
  }
};
