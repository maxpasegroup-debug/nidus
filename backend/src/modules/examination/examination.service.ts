import { Prisma, Role } from "../../generated/prisma/client.js";
import { prisma } from "../../config/prisma.js";
import { validatePublishedQuestions } from "../tests/exam-publishing-gate.js";
import { testsService } from "../tests/tests.service.js";

type Requester = {
  id: string;
  role: Role;
  instituteId?: string | null;
  branchId?: string | null;
  roleMetadata?: Record<string, unknown> | null;
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
  testId?: string;
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
  approvalAttestation?: "TEACHER_REVIEW_CONFIRMED";
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
  if (normalized !== "SINGLE_CHOICE") {
    throw Object.assign(new Error("Only SINGLE_CHOICE questions are supported by this CBT path."), { statusCode: 400 });
  }
  return normalized;
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

  const optionValues = [payload.optionA, payload.optionB, payload.optionC, payload.optionD].map((value) => cleanText(value));
  if (optionValues.some((value) => !value)) throw Object.assign(new Error("All four answer options are required."), { statusCode: 400 });
  if (new Set(optionValues).size !== optionValues.length) throw Object.assign(new Error("Answer options must be unique."), { statusCode: 400 });
  const marks = parseNumber(payload.marks, 1);
  const negativeMarks = parseNumber(payload.negativeMarks, 0);
  if (!Number.isFinite(marks) || marks <= 0 || marks > 1000) throw Object.assign(new Error("Marks must be greater than 0 and no more than 1000."), { statusCode: 400 });
  if (!Number.isFinite(negativeMarks) || negativeMarks < 0 || negativeMarks > 1000) throw Object.assign(new Error("Negative marks must be between 0 and 1000."), { statusCode: 400 });

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
    marks,
    negativeMarks,
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

function isManager(requester: Requester) {
  return requester.role === Role.ADMIN || requester.role === Role.DIRECTOR || requester.role === Role.ACADEMIC_HEAD;
}

function questionScope(requester: Requester): Prisma.QuestionBankItemWhereInput {
  if (requester.role === Role.TEACHER || requester.role === Role.PHYSICAL_TRAINER) return { createdById: requester.id };
  if (requester.instituteId) return { OR: [{ createdById: requester.id }, { createdBy: { instituteId: requester.instituteId } }] };
  return isManager(requester) ? {} : { id: "__NO_ACCESS__" };
}

async function assertQuestionAccess(requester: Requester, id: string) {
  const question = await prisma.questionBankItem.findFirst({ where: { id, ...questionScope(requester) } });
  if (!question) throw Object.assign(new Error("Question not found or access denied"), { statusCode: 404 });
  return question;
}

async function accessibleTestIds(requester: Requester) {
  if (isManager(requester)) {
    const tests = await prisma.test.findMany({
      where: requester.instituteId
        ? { OR: [{ batch: { instituteId: requester.instituteId } }, { teacher: { instituteId: requester.instituteId } }] }
        : {},
      select: { id: true }
    });
    return tests.map((test) => test.id);
  }
  if (requester.role === Role.TEACHER || requester.role === Role.PHYSICAL_TRAINER) {
    const assignments = await prisma.teacherBatchAssignment.findMany({
      where: { teacherId: requester.id, status: "ACTIVE" },
      select: { batchId: true, subject: true }
    });
    const tests = await prisma.test.findMany({
      where: {
        OR: [
          { teacherId: requester.id },
          ...assignments.map((assignment) => ({ batchId: assignment.batchId, subject: { equals: assignment.subject, mode: "insensitive" as const } }))
        ]
      },
      select: { id: true }
    });
    return tests.map((test) => test.id);
  }
  return [];
}

export const examinationService = {
  async questionBank(requester: Requester, filters: QuestionBankFilters) {
    const where: Prisma.QuestionBankItemWhereInput = {
      AND: [
        questionScope(requester),
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
      data: { ...toQuestionBankData(payload, requester.id), status: "DRAFT" },
      include: { createdBy: { select: { id: true, name: true, email: true, role: true } } }
    });
  },

  async updateQuestion(requester: Requester, id: string, payload: Partial<QuestionBankPayload>) {
    await assertQuestionAccess(requester, id);
    if (payload.status !== undefined && normalizeStatus(payload.status) === "ACTIVE") {
      throw Object.assign(new Error("Use the explicit teacher approval action to activate a question."), { statusCode: 400 });
    }
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
    data.status = "DRAFT";

    return prisma.questionBankItem.update({
      where: { id },
      data,
      include: { createdBy: { select: { id: true, name: true, email: true, role: true } } }
    });
  },

  async getQuestion(requester: Requester, id: string) {
    return assertQuestionAccess(requester, id);
  },

  async approveQuestion(requester: Requester, id: string, attestation?: string) {
    if (attestation !== "TEACHER_REVIEW_CONFIRMED") {
      throw Object.assign(new Error("Explicit teacher review confirmation is required."), { statusCode: 400 });
    }
    const question = await assertQuestionAccess(requester, id);
    validatePublishedQuestions([{
      questionText: question.questionText,
      optionA: question.optionA,
      optionB: question.optionB,
      optionC: question.optionC,
      optionD: question.optionD,
      correctAnswer: question.correctAnswer,
      explanation: question.explanation,
      marks: question.marks,
      reviewStatus: "APPROVED",
    }]);
    return prisma.questionBankItem.update({
      where: { id },
      data: { status: "ACTIVE" },
      include: { createdBy: { select: { id: true, name: true, email: true, role: true } } },
    });
  },

  async deleteQuestion(requester: Requester, id: string) {
    await assertQuestionAccess(requester, id);
    await prisma.questionBankItem.delete({ where: { id } });
    return { message: "Question deleted successfully" };
  },

  async importQuestions(requester: Requester, input: { csvText?: string; items?: QuestionBankPayload[] }) {
    const rows = input.items?.length ? input.items : parseCsv(input.csvText ?? "").map(mapImportRow);
    if (!rows.length) throw new Error("No import rows found");
    const validRows = rows.map((row) => ({ ...toQuestionBankData(row, requester.id), status: "DRAFT" }));
    const fingerprints = validRows.map((row) => [row.questionText, row.optionA, row.optionB, row.optionC, row.optionD, row.correctAnswer].map((value) => value.trim().toLowerCase()).join("\u001f"));
    if (new Set(fingerprints).size !== fingerprints.length) {
      throw Object.assign(new Error("The import contains duplicate questions."), { statusCode: 409 });
    }
    const existing = await prisma.questionBankItem.findMany({
      where: { createdById: requester.id, questionText: { in: validRows.map((row) => row.questionText) } },
      select: { questionText: true, optionA: true, optionB: true, optionC: true, optionD: true, correctAnswer: true }
    });
    const existingFingerprints = new Set(existing.map((row) => [row.questionText, row.optionA, row.optionB, row.optionC, row.optionD, row.correctAnswer].map((value) => value.trim().toLowerCase()).join("\u001f")));
    if (fingerprints.some((fingerprint) => existingFingerprints.has(fingerprint))) {
      throw Object.assign(new Error("One or more questions already exist in this teacher's question bank."), { statusCode: 409 });
    }
    const result = await prisma.questionBankItem.createMany({ data: validRows, skipDuplicates: true });
    return { imported: result.count };
  },

  async createExamFromBank(requester: Requester, payload: ExamFromBankPayload) {
    if (!cleanText(payload.title)) throw new Error("Exam name is required");
    if (!cleanText(payload.examType)) throw new Error("Exam type is required");
    if (payload.publishNow && payload.approvalAttestation !== "TEACHER_REVIEW_CONFIRMED") {
      throw Object.assign(new Error("Teacher review confirmation is required before immediate publication."), { statusCode: 400 });
    }
    const selection = payload.questionSelection ?? (payload.questionIds?.length ? "MANUAL" : "RANDOM");
    const totalQuestions = Math.max(1, Math.min(200, Math.floor(parseNumber(payload.totalQuestions, payload.questionIds?.length || 100))));

    const where: Prisma.QuestionBankItemWhereInput =
      selection === "MANUAL" && payload.questionIds?.length
        ? { id: { in: payload.questionIds }, status: "ACTIVE", ...questionScope(requester) }
        : {
            ...questionScope(requester),
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
      topic: question.topic,
      reviewStatus: "DRAFT"
    }));

    const totalMarks = questions.reduce((sum, question) => sum + question.marks, 0);
    const workflowNote = `Passing ${payload.passingPercentage ?? 50}%. Selection ${selection}. Randomization ${payload.randomization ? "enabled" : "disabled"}.`;

    const batchIds = Array.from(new Set([payload.batchId, ...(payload.batchIds ?? [])].filter((value): value is string => Boolean(cleanText(value)))));
    if (payload.testId) {
      if (batchIds.length > 1) throw Object.assign(new Error("A shared draft supports one batch only."), { statusCode: 400 });
      const exam = await testsService.create(requester, {
        testId: payload.testId,
        title: cleanText(payload.title),
        description: cleanText(payload.description, "NIDUS Academy CBT exam."),
        examType: cleanText(payload.examType),
        category: cleanText(payload.category, "Defence"),
        subject: cleanText(payload.subject),
        topic: cleanText(payload.topic),
        batchId: batchIds[0],
        duration: Math.max(1, Math.floor(parseNumber(payload.duration, 60))),
        totalMarks,
        isMockTest: true,
        questions,
      });
      return { ...exam, testId: exam.id };
    }
    const baseData = {
        title: cleanText(payload.title),
        description: `${cleanText(payload.description, "NIDUS Academy CBT exam.")}\n\n${workflowNote}`,
        examType: cleanText(payload.examType),
        category: cleanText(payload.category, "Defence"),
        subject: cleanText(payload.subject),
        topic: cleanText(payload.topic),
        teacherId: requester.role === Role.TEACHER ? requester.id : undefined,
        publishAt: payload.publishAt ? new Date(payload.publishAt) : undefined,
        status: "DRAFT",
        duration: Math.max(1, Math.floor(parseNumber(payload.duration, 60))),
        totalMarks,
        isMockTest: true,
        isLive: false
    };

    if (batchIds.length <= 1) {
      const created = await prisma.test.create({
        data: {
          ...baseData,
          batchId: batchIds[0] || undefined,
          questions: { create: questions }
        },
        include: testInclude()
      });
      if (!payload.publishNow) return { ...created, testId: created.id };
      await testsService.approve(requester, created.id, { questionIds: created.questions.map((question) => question.id), attestation: "TEACHER_REVIEW_CONFIRMED" });
      const exam = await testsService.publishApproved(requester, created.id, { publishAt: payload.publishAt, batchId: batchIds[0] });
      return { ...exam, testId: exam.id };
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

    if (payload.publishNow) {
      await Promise.all(created.map(async (test) => {
        await testsService.approve(requester, test.id, { questionIds: test.questions.map((question) => question.id), attestation: "TEACHER_REVIEW_CONFIRMED" });
        await testsService.publishApproved(requester, test.id, { publishAt: payload.publishAt, batchId: test.batchId ?? undefined });
      }));
    }
    return { ...created[0], testId: created[0].id, publishedCopies: created.length };
  },

  async publishExam(requester: Requester, id: string, input: { publishAt?: string; batchId?: string }) {
    const test = await testsService.details(requester, id);
    if (test.status !== "APPROVED") {
      throw Object.assign(new Error("Review and approve every question before publishing this exam."), { statusCode: 400 });
    }
    return testsService.publishApproved(requester, id, { publishAt: input.publishAt, batchId: cleanText(input.batchId) || undefined });
  },

  async closeExam(requester: Requester, id: string) {
    await testsService.details(requester, id);
    return prisma.test.update({
      where: { id },
      data: { status: "CLOSED", isLive: false },
      include: testInclude()
    });
  },

  async deleteExam(requester: Requester, id: string) {
    await testsService.details(requester, id);
    await prisma.test.delete({ where: { id } });
    return { message: "Exam deleted successfully" };
  },

  async results(requester: Requester) {
    const testIds = await accessibleTestIds(requester);
    return prisma.testAttempt.findMany({
      where: { submittedAt: { not: null }, testId: { in: testIds } },
      orderBy: { submittedAt: "desc" },
      take: 100,
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
        test: { select: { id: true, title: true, examType: true, totalMarks: true, duration: true, batch: { select: { id: true, name: true } } } }
      }
    });
  },

  async analytics(requester: Requester) {
    const testIds = await accessibleTestIds(requester);
    const [tests, questions, attempts] = await Promise.all([
      prisma.test.findMany({ where: { id: { in: testIds } }, include: { _count: { select: { questions: true, attempts: true } } } }),
      prisma.questionBankItem.groupBy({ where: questionScope(requester), by: ["subCategory", "topic", "difficulty", "status"], _count: { _all: true } }),
      prisma.testAttempt.findMany({ where: { submittedAt: { not: null }, testId: { in: testIds } }, include: { test: true } })
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
