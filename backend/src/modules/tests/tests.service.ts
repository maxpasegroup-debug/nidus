import { Prisma, Role } from "../../generated/prisma/client.js";
import { prisma } from "../../config/prisma.js";
import { logger } from "../../utils/logger.js";
import { normalizeQuestionContentJson, synchronizeEditableQuestionContentJson } from "../document-intelligence/question-content.schema.js";
import { validateDraftQuestions, validateEditableDraftQuestions, validatePublishableExam, validatePublishedQuestions } from "./exam-publishing-gate.js";
import { calculateObjectiveScore } from "./exam-scoring.js";
import { assertLifecycleTransition, examAvailability, examDisplayStatus, isExamLifecycle, legacyExamStatus, lifecycleIsLive, parseExamWindow, validateScheduledRelease, type ExamDisplayStatus, type ExamLifecycle } from "./exam-lifecycle.js";
import { CONTROL_STATUSES, controlDisplayStatusWhere, examControlAllowedActions } from "./exam-control.js";
import { blockingIssues, calculateExamEnd, deriveReviewIssues, reviewAnswerProgress, reviewReadiness, type ReviewIssue } from "./exam-review.js";

export type TestPayload = {
  testId?: string;
  title: string;
  description: string;
  examType: string;
  category: string;
  subject?: string;
  topic?: string;
  batchId?: string;
  teacherId?: string;
  publishAt?: string;
  examStartsAt?: string;
  examEndsAt?: string;
  status?: string;
  duration: number;
  totalMarks: number;
  expectedQuestionCount?: number;
  authoritativeQuestionCount?: number;
  expectedTotalMarks?: number;
  isMockTest?: boolean;
  isLive?: boolean;
  questions?: QuestionPayload[];
};

export type QuestionPayload = {
  questionText: string;
  questionImage?: string;
  visualReviewRequired?: boolean;
  visualReviewNotes?: Prisma.InputJsonValue;
  contentJson?: Prisma.InputJsonValue;
  sourceDocumentId?: string;
  sourcePageNumber?: number;
  boundingBoxes?: Prisma.InputJsonValue;
  latex?: Prisma.InputJsonValue;
  assets?: Prisma.InputJsonValue;
  layout?: Prisma.InputJsonValue;
  renderMode?: string;
  aiConfidence?: number;
  reviewStatus?: string;
  reviewIssues?: Prisma.InputJsonValue;
  publishedVersion?: number;
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
  instituteId?: string | null;
  branchId?: string | null;
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
  approvalAttestation?: "TEACHER_REVIEW_CONFIRMED";
  approvalReferenceId?: string;
};

type LifecycleInput = {
  lifecycle: ExamLifecycle;
  examStartsAt?: string | null;
  examEndsAt?: string | null;
};

type ReleaseInput = {
  action: "SAVE_DRAFT" | "SCHEDULE" | "PUBLISH_NOW";
  releaseAt?: string;
};

export type DraftQuestionUpdate = Omit<QuestionPayload, "correctAnswer" | "explanation"> & {
  correctAnswer?: string;
  explanation?: string;
  changeReason?: string;
};

async function persistedReviewSummary(testId: string) {
  const test = await prisma.test.findUnique({ where: { id: testId }, include: { questions: true } });
  if (!test) throw Object.assign(new Error("Test not found"), { statusCode: 404 });
  const actualQuestionCount = test.questions.length;
  const actualMarksTotal = test.questions.reduce((sum, question) => sum + Number(question.marks), 0);
  const questionIssues = test.questions.map((question) => ({
    questionId: question.id,
    issues: deriveReviewIssues(question, Array.isArray(question.reviewIssues) ? question.reviewIssues as unknown as ReviewIssue[] : []),
  }));
  const unresolvedHighIssueCount = questionIssues.reduce((sum, entry) => sum + blockingIssues(entry.issues).length, 0);
  const answerProgress = reviewAnswerProgress(test.questions);
  const readiness = reviewReadiness({ lifecycle: test.lifecycle, actualQuestionCount, authoritativeQuestionCount: test.authoritativeQuestionCount, actualMarksTotal, authoritativeMarks: Number(test.totalMarks), unresolvedHighIssueCount });
  return { test, actualQuestionCount, actualMarksTotal, unresolvedHighIssueCount, ...answerProgress, questionIssues, ...readiness };
}

function persistedQuestionPayload(question: Prisma.QuestionGetPayload<object>): QuestionPayload {
  return {
    questionText: question.questionText,
    questionImage: question.questionImage ?? undefined,
    visualReviewRequired: question.visualReviewRequired,
    visualReviewNotes: question.visualReviewNotes == null ? undefined : question.visualReviewNotes as Prisma.InputJsonValue,
    contentJson: question.contentJson == null ? undefined : question.contentJson as Prisma.InputJsonValue,
    sourceDocumentId: question.sourceDocumentId ?? undefined,
    sourcePageNumber: question.sourcePageNumber ?? undefined,
    boundingBoxes: question.boundingBoxes == null ? undefined : question.boundingBoxes as Prisma.InputJsonValue,
    latex: question.latex == null ? undefined : question.latex as Prisma.InputJsonValue,
    assets: question.assets == null ? undefined : question.assets as Prisma.InputJsonValue,
    layout: question.layout == null ? undefined : question.layout as Prisma.InputJsonValue,
    renderMode: question.renderMode,
    aiConfidence: question.aiConfidence ?? undefined,
    reviewStatus: question.reviewStatus,
    reviewIssues: question.reviewIssues == null ? undefined : question.reviewIssues as Prisma.InputJsonValue,
    publishedVersion: question.publishedVersion,
    optionA: question.optionA,
    optionB: question.optionB,
    optionC: question.optionC,
    optionD: question.optionD,
    correctAnswer: question.correctAnswer,
    explanation: question.explanation,
    marks: question.marks,
    negativeMarks: question.negativeMarks,
    difficultyLevel: question.difficultyLevel,
    topic: question.topic,
  };
}

function normalizeSelectedAnswer(value: unknown) {
  const answer = typeof value === "string" ? value.trim().toUpperCase() : "";
  if (!/^[A-D]$/.test(answer)) {
    throw Object.assign(new Error("Selected answer must be A, B, C or D."), { statusCode: 400 });
  }
  return answer;
}

function normalizeDraftAnswer(value: unknown) {
  const answer = typeof value === "string" ? value.trim().toUpperCase() : "";
  return answer ? normalizeSelectedAnswer(answer) : "";
}

type VersionableQuestion = QuestionPayload & {
  id: string;
  testId: string;
};

function questionVersionData(question: VersionableQuestion, requester: Requester, changeType = "PUBLISHED", changeReason = "Initial published question version.") {
  return {
    questionId: question.id,
    testId: question.testId,
    version: Number(question.publishedVersion || 1),
    changeType,
    changeReason,
    changedById: requester.id,
    changedByRole: requester.role,
    questionText: question.questionText,
    questionImage: question.questionImage || null,
    contentJson: question.contentJson ?? undefined,
    optionsSnapshot: {
      A: question.optionA,
      B: question.optionB,
      C: question.optionC,
      D: question.optionD,
    },
    answerSnapshot: {
      type: "SINGLE_CHOICE",
      correctAnswer: question.correctAnswer,
    },
    explanation: question.explanation,
    renderMode: question.renderMode || "LEGACY_MCQ",
    aiConfidence: question.aiConfidence ?? null,
    reviewStatus: question.reviewStatus || "DRAFT",
    sourceDocumentId: question.sourceDocumentId || null,
    sourcePageNumber: question.sourcePageNumber ?? null,
    boundingBoxes: question.boundingBoxes ?? undefined,
    latex: question.latex ?? undefined,
    assets: question.assets ?? undefined,
    layout: question.layout ?? undefined,
    metadataSnapshot: {
      topic: question.topic,
      difficultyLevel: question.difficultyLevel,
      marks: question.marks,
      negativeMarks: question.negativeMarks,
      source: changeType,
      reviewIssues: question.reviewIssues,
    },
  };
}

async function createInitialQuestionVersions(questions: VersionableQuestion[], requester: Requester, changeType = "PUBLISHED", changeReason = "Initial published question version.") {
  if (!questions.length) return;
  await prisma.questionVersion.createMany({
    data: questions.map((question) => questionVersionData(question, requester, changeType, changeReason)),
    skipDuplicates: true,
  });
}

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

function attemptTiming(attempt: { startedAt: Date; submittedAt?: Date | null; test: { duration: number; examEndsAt?: Date | null } }) {
  const serverNow = new Date();
  const durationSeconds = Math.max(60, Number(attempt.test.duration || 0) * 60);
  const durationExpiresAt = new Date(attempt.startedAt.getTime() + durationSeconds * 1000);
  const expiresAt = attempt.test.examEndsAt && attempt.test.examEndsAt < durationExpiresAt
    ? attempt.test.examEndsAt
    : durationExpiresAt;
  const elapsedSeconds = Math.max(0, Math.floor((serverNow.getTime() - attempt.startedAt.getTime()) / 1000));
  const remainingSeconds = Math.max(0, Math.floor((expiresAt.getTime() - serverNow.getTime()) / 1000));
  return {
    serverTime: serverNow.toISOString(),
    startedAt: attempt.startedAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
    durationSeconds,
    elapsedSeconds,
    remainingSeconds,
    isExpired: !attempt.submittedAt && remainingSeconds <= 0
  };
}

function sanitizeActiveAttempt<T extends { test?: { questions?: Array<Record<string, unknown>> } }>(attempt: T): T {
  if (!attempt.test?.questions) return attempt;
  return {
    ...attempt,
    test: {
      ...attempt.test,
      questions: attempt.test.questions.map((question) => {
        const { correctAnswer: _correctAnswer, explanation: _explanation, ...safeQuestion } = question;
        return safeQuestion;
      })
    }
  };
}

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

async function assertBatchTenantAccess(requester: Requester, batchId?: string) {
  if (!batchId || (!requester.instituteId && !requester.branchId)) return;
  const batch = await prisma.batch.findUnique({
    where: { id: batchId },
    select: { instituteId: true, branchId: true }
  });
  if (!batch) throw Object.assign(new Error("Batch not found."), { statusCode: 404 });
  if (requester.instituteId && batch.instituteId !== requester.instituteId) {
    throw Object.assign(new Error("This batch belongs to another institution."), { statusCode: 403 });
  }
  if (requester.branchId && batch.branchId !== requester.branchId) {
    throw Object.assign(new Error("This batch belongs to another branch."), { statusCode: 403 });
  }
}

async function assertTeacherTenantAccess(requester: Requester, teacherId?: string | null) {
  if (!teacherId || (!requester.instituteId && !requester.branchId)) return;
  const teacher = await prisma.user.findUnique({
    where: { id: teacherId },
    select: { instituteId: true, branchId: true }
  });
  if (!teacher) throw Object.assign(new Error("Exam owner not found."), { statusCode: 404 });
  if (requester.instituteId && teacher.instituteId !== requester.instituteId) {
    throw Object.assign(new Error("This exam belongs to another institution."), { statusCode: 403 });
  }
  if (requester.branchId && teacher.branchId !== requester.branchId) {
    throw Object.assign(new Error("This exam belongs to another branch."), { statusCode: 403 });
  }
}

async function assertTeacherBatchSubjectAccess(requester: Requester, batchId?: string, subject?: string | null) {
  await assertBatchTenantAccess(requester, batchId);
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
  if (isAcademicManager(requester)) {
    await assertBatchTenantAccess(requester, test.batchId ?? undefined);
    await assertTeacherTenantAccess(requester, test.teacherId);
    return;
  }
  if (requester.role === Role.STUDENT) {
    await assertStudentTestAccess(requester.id, test);
    return;
  }
  if (requester.role === Role.TEACHER || requester.role === Role.PHYSICAL_TRAINER) {
    if (test.teacherId && test.teacherId !== requester.id) {
      throw Object.assign(new Error("Teachers may only manage their own exams."), { statusCode: 403 });
    }
    await assertTeacherBatchSubjectAccess(requester, test.batchId ?? undefined, test.subject);
    return;
  }
  throw Object.assign(new Error("Exam access denied."), { statusCode: 403 });
}

function tenantTestWhere(requester: Requester): Prisma.TestWhereInput {
  if (!requester.instituteId && !requester.branchId) return {};
  const batchScope = {
    ...(requester.instituteId ? { instituteId: requester.instituteId } : {}),
    ...(requester.branchId ? { branchId: requester.branchId } : {}),
  };
  const ownerScope = {
    ...(requester.instituteId ? { instituteId: requester.instituteId } : {}),
    ...(requester.branchId ? { branchId: requester.branchId } : {}),
  };
  return {
    OR: [
      { batchId: { not: null }, batch: { is: batchScope } },
      { batchId: null, teacher: { is: ownerScope } },
    ],
  };
}


function studentExamAvailability(test: { lifecycle: string; examStartsAt?: Date | null; examEndsAt?: Date | null }) {
  return examAvailability({
    lifecycle: isExamLifecycle(test.lifecycle) ? test.lifecycle : "DRAFT",
    examStartsAt: test.examStartsAt,
    examEndsAt: test.examEndsAt,
  });
}

function windowData(input: { examStartsAt?: string | null; examEndsAt?: string | null; duration?: number }, existing?: { examStartsAt?: Date | null; examEndsAt?: Date | null; duration?: number }) {
  const startsAt = input.examStartsAt === undefined ? existing?.examStartsAt : input.examStartsAt;
  const duration = input.duration ?? existing?.duration;
  const endsAt = startsAt && duration ? calculateExamEnd(startsAt, duration) : input.examEndsAt === undefined ? existing?.examEndsAt : input.examEndsAt;
  const window = parseExamWindow(startsAt, endsAt);
  if (window.startsAt === null && window.endsAt === null) {
    if (input.examStartsAt === undefined && input.examEndsAt === undefined) return {};
    return { examStartsAt: null, examEndsAt: null };
  }
  return { examStartsAt: window.startsAt, examEndsAt: window.endsAt };
}

function sanitizeTestForStudent<T extends { lifecycle: string; examStartsAt?: Date | null; examEndsAt?: Date | null; questions?: Array<Record<string, unknown>> }>(test: T): T & { availability: "UPCOMING" | "AVAILABLE" | "EXPIRED" | "UNAVAILABLE" } {
  const availability = studentExamAvailability(test);
  if (availability !== "AVAILABLE") {
    throw Object.assign(new Error("This exam is not available to students."), { statusCode: 403 });
  }
  return {
    ...test,
    availability,
    questions: test.questions?.map((question) => {
      const { correctAnswer: _correctAnswer, explanation: _explanation, ...safeQuestion } = question;
      return safeQuestion;
    })
  };
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

function currentReviewPeriod(date = new Date()) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

async function syncStudentExamPerformance(tx: Prisma.TransactionClient, userId: string, attemptId: string) {
  const attempts = await tx.testAttempt.findMany({
    where: { userId, status: "SUBMITTED", submittedAt: { not: null } },
    include: {
      test: { select: { id: true, title: true, subject: true, batchId: true, teacherId: true, totalMarks: true } },
      answers: { include: { question: { select: { topic: true } } } },
    },
  });
  const completedAttempt = attempts.find((item) => item.id === attemptId);
  if (!completedAttempt) return;

  const allAnswers = attempts.flatMap((item) => item.answers);
  const topicAnalysis = getTopicAnalysis(allAnswers);
  const testAccuracy = allAnswers.length
    ? Math.round((allAnswers.filter((answer) => answer.isCorrect).length / allAnswers.length) * 100)
    : 0;
  const averageScore = attempts.length
    ? Math.round(attempts.reduce((sum, item) => sum + (item.test.totalMarks > 0 ? (item.score / item.test.totalMarks) * 100 : 0), 0) / attempts.length)
    : 0;
  const weakTopics = topicAnalysis.filter((topic) => topic.accuracy < 60).map((topic) => topic.topic);
  const strongTopics = topicAnalysis.filter((topic) => topic.accuracy >= 75).map((topic) => topic.topic);

  await tx.performanceAnalytics.upsert({
    where: { userId },
    update: {
      testAccuracy,
      averageScore,
      weakTopics,
      strongTopics,
      studyConsistency: Math.min(100, attempts.length * 5),
      aiSuggestions: weakTopics.length
        ? { priorityTopics: weakTopics.slice(0, 5), action: "Review these topics with your teacher before the next exam." }
        : { priorityTopics: [], action: "Maintain mixed timed practice." },
    },
    create: {
      userId,
      testAccuracy,
      averageScore,
      weakTopics,
      strongTopics,
      studyConsistency: Math.min(100, attempts.length * 5),
      revisionRate: 0,
      aiSuggestions: weakTopics.length
        ? { priorityTopics: weakTopics.slice(0, 5), action: "Review these topics with your teacher before the next exam." }
        : { priorityTopics: [], action: "Maintain mixed timed practice." },
    },
  });

  if (!completedAttempt.test.batchId) return;
  const batch = await tx.batch.findUnique({
    where: { id: completedAttempt.test.batchId },
    select: {
      id: true,
      name: true,
      programSlug: true,
      students: { where: { studentId: userId, status: "ACTIVE" }, select: { student: { select: { name: true } } }, take: 1 },
    },
  });
  if (!batch?.students[0]) return;

  const reviewPeriod = currentReviewPeriod(completedAttempt.submittedAt ?? new Date());
  const existingReview = await tx.ndpReview.findUnique({
    where: { studentId_batchId_reviewPeriod: { studentId: userId, batchId: batch.id, reviewPeriod } },
  });
  if (existingReview && !["DRAFT", "RETURNED"].includes(existingReview.status)) return;
  const nextScores = {
    ...(existingReview?.scores && typeof existingReview.scores === "object" && !Array.isArray(existingReview.scores) ? existingReview.scores : {}),
    examAverage: averageScore,
    testAccuracy,
  };
  const review = existingReview ?? await tx.ndpReview.create({
    data: {
      studentId: userId,
      studentName: batch.students[0].student.name,
      batchId: batch.id,
      batchName: batch.name,
      reviewPeriod,
      reviewType: "MONTHLY",
      status: "DRAFT",
      teacherId: completedAttempt.test.teacherId,
      scores: nextScores,
      sections: { studentDetails: { studentName: batch.students[0].student.name, batchCourse: batch.programSlug, progressPeriod: reviewPeriod } },
      finalReview: {},
    },
  });
  if (existingReview) {
    await tx.ndpReview.update({ where: { id: review.id }, data: { scores: nextScores } });
  }

  const scorePercent = completedAttempt.test.totalMarks > 0
    ? Math.round((completedAttempt.score / completedAttempt.test.totalMarks) * 100)
    : 0;
  await tx.ndpManualEntry.upsert({
    where: {
      reviewId_category_item_subject: {
        reviewId: review.id,
        category: "TEST_PERFORMANCE",
        item: completedAttempt.test.title,
        subject: completedAttempt.test.subject ?? "General",
      },
    },
    update: {
      term3: `${completedAttempt.score}/${completedAttempt.test.totalMarks}`,
      score: scorePercent,
      remarks: `${completedAttempt.totalCorrect} correct, ${completedAttempt.totalWrong} incorrect.`,
      status: review.status,
    },
    create: {
      reviewId: review.id,
      studentId: userId,
      batchId: batch.id,
      teacherId: completedAttempt.test.teacherId,
      category: "TEST_PERFORMANCE",
      item: completedAttempt.test.title,
      subject: completedAttempt.test.subject ?? "General",
      term3: `${completedAttempt.score}/${completedAttempt.test.totalMarks}`,
      score: scorePercent,
      remarks: `${completedAttempt.totalCorrect} correct, ${completedAttempt.totalWrong} incorrect.`,
      status: review.status,
    },
  });
}

async function resultReleaseState(testId: string) {
  const record = await prisma.teacherExamRecord.findFirst({
    where: { testId },
    select: { id: true, status: true, updatedAt: true }
  });
  if (!record) return { managed: false, released: true, status: "LEGACY_RELEASED", releasedAt: null };
  const released = record.status === "RESULTS_RELEASED";
  return {
    managed: true,
    released,
    status: released ? "RESULTS_RELEASED" : "PENDING_RELEASE",
    releasedAt: released ? record.updatedAt.toISOString() : null
  };
}

function sanitizePendingResultAttempt<
  T extends {
    answers?: unknown[];
    test?: { questions?: Array<Record<string, unknown>> };
  }
>(attempt: T): T {
  return {
    ...attempt,
    answers: [],
    test: attempt.test
      ? {
          ...attempt.test,
          questions: attempt.test.questions?.map((question) => {
            const { correctAnswer: _correctAnswer, explanation: _explanation, ...safeQuestion } = question;
            return safeQuestion;
          })
        }
      : attempt.test
  };
}

export const testsService = {
  async controlList(requester: Requester, filters: { search?: string; status?: string; batchId?: string; page?: number; limit?: number }) {
    if (!isAcademicManager(requester)) throw Object.assign(new Error("Exam Control is available to academy management only."), { statusCode: 403 });
    const now = new Date();
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 10;
    const search = filters.search?.trim();
    const baseWhere: Prisma.TestWhereInput = { AND: [
      tenantTestWhere(requester),
      filters.batchId ? { batchId: filters.batchId } : {},
      search ? { OR: [
        { title: { contains: search, mode: "insensitive" } },
        { subject: { contains: search, mode: "insensitive" } },
        { topic: { contains: search, mode: "insensitive" } },
        { batch: { name: { contains: search, mode: "insensitive" } } },
      ] } : {},
    ] };
    const status = filters.status && (CONTROL_STATUSES as readonly string[]).includes(filters.status) ? filters.status as ExamDisplayStatus : undefined;
    const selectedWhere: Prisma.TestWhereInput = status ? { AND: [baseWhere, controlDisplayStatusWhere(status, now)] } : baseWhere;
    const [total, rows, drafts, scheduled, live] = await Promise.all([
      prisma.test.count({ where: selectedWhere }),
      prisma.test.findMany({
        where: selectedWhere,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        select: {
          id: true, title: true, subject: true, topic: true, lifecycle: true, publishAt: true, publishedAt: true,
          examStartsAt: true, examEndsAt: true, duration: true, totalMarks: true, expectedQuestionCount: true,
          authoritativeQuestionCount: true, batchId: true, createdAt: true,
          batch: { select: { id: true, name: true } },
          teacher: { select: { id: true, name: true, role: true } },
          _count: { select: { questions: true, attempts: true } },
        },
      }),
      prisma.test.count({ where: { AND: [baseWhere, controlDisplayStatusWhere("DRAFT", now)] } }),
      prisma.test.count({ where: { AND: [baseWhere, controlDisplayStatusWhere("SCHEDULED", now)] } }),
      prisma.test.count({ where: { AND: [baseWhere, controlDisplayStatusWhere("LIVE", now)] } }),
    ]);
    const ids = rows.map((row) => row.id);
    const aggregates = ids.length ? await prisma.$queryRaw<Array<{ testId: string; questionCount: bigint; marksTotal: number; blockingIssueCount: bigint }>>`
      SELECT
        "testId",
        COUNT(*)::bigint AS "questionCount",
        COALESCE(SUM("marks"), 0)::double precision AS "marksTotal",
        COALESCE(SUM(
          (CASE WHEN BTRIM("questionText") = '' THEN 1 ELSE 0 END) +
          (CASE WHEN BTRIM("optionA") = '' OR BTRIM("optionB") = '' OR BTRIM("optionC") = '' OR BTRIM("optionD") = '' THEN 1 ELSE 0 END) +
          (CASE WHEN UPPER(BTRIM("correctAnswer")) NOT IN ('A','B','C','D') THEN 1 ELSE 0 END) +
          (CASE WHEN LOWER(BTRIM("optionA")) IN (LOWER(BTRIM("optionB")), LOWER(BTRIM("optionC")), LOWER(BTRIM("optionD"))) OR LOWER(BTRIM("optionB")) IN (LOWER(BTRIM("optionC")), LOWER(BTRIM("optionD"))) OR LOWER(BTRIM("optionC")) = LOWER(BTRIM("optionD")) THEN 1 ELSE 0 END) +
          (CASE WHEN "marks" <= 0 OR "negativeMarks" < 0 THEN 1 ELSE 0 END)
        ), 0)::bigint AS "blockingIssueCount"
      FROM "Question"
      WHERE "testId" IN (${Prisma.join(ids)})
      GROUP BY "testId"
    ` : [];
    const aggregateByTest = new Map(aggregates.map((aggregate) => [aggregate.testId, aggregate]));
    const tests = rows.map(({ _count, ...test }) => {
      const aggregate = aggregateByTest.get(test.id);
      const questionCount = Number(aggregate?.questionCount ?? 0);
      const marksTotal = Number(aggregate?.marksTotal ?? 0);
      const blockingIssueCount = Number(aggregate?.blockingIssueCount ?? 0);
      const displayStatus = examDisplayStatus({ lifecycle: isExamLifecycle(test.lifecycle) ? test.lifecycle : "DRAFT", publishAt: test.publishAt, examStartsAt: test.examStartsAt, examEndsAt: test.examEndsAt, now });
      const readiness = reviewReadiness({ lifecycle: test.lifecycle, actualQuestionCount: questionCount, authoritativeQuestionCount: test.authoritativeQuestionCount, actualMarksTotal: marksTotal, authoritativeMarks: Number(test.totalMarks), unresolvedHighIssueCount: blockingIssueCount });
      const essentialsComplete = Boolean(test.title && test.subject && test.topic && test.batchId && test.duration > 0 && Number(test.totalMarks) > 0 && (test.expectedQuestionCount ?? 0) > 0 && test.examStartsAt && test.examEndsAt);
      const resumeStage = !essentialsComplete ? "essentials" : !questionCount ? "upload" : readiness.reviewStatus === "READY" ? "release" : "review";
      const lifecycle = isExamLifecycle(test.lifecycle) ? test.lifecycle : "DRAFT";
      return {
        ...test,
        teacher: test.teacher ? { id: test.teacher.id, name: test.teacher.name, role: test.teacher.role } : null,
        displayStatus,
        reviewStatus: readiness.reviewStatus,
        authoritativeQuestionCount: questionCount,
        totalMarks: marksTotal || Number(test.totalMarks),
        resumeStage,
        allowedActions: examControlAllowedActions({ lifecycle, displayStatus, reviewStatus: readiness.reviewStatus, attemptCount: _count.attempts, publishAt: test.publishAt, now }),
      };
    });
    return {
      tests,
      kpis: { drafts, scheduled, live },
      pagination: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) },
      serverNow: now.toISOString(),
    };
  },

  async list(requester: Requester, filters: { search?: string; examType?: string; topic?: string }) {
    const accessWhere = isAcademicManager(requester)
      ? tenantTestWhere(requester)
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
        lifecycle: { in: ["SCHEDULED", "LIVE"] },
        OR: [{ publishAt: null }, { publishAt: { lte: new Date() } }]
      },
      orderBy: [{ publishAt: "asc" }, { createdAt: "desc" }],
      include: {
        batch: { select: { id: true, name: true, batchType: true, programSlug: true } },
        _count: { select: { attempts: true, questions: true } }
      }
    });

    return tests
      .map((test) => ({
        ...test,
        availability: studentExamAvailability(test),
        studentStatus: attemptByTest.get(test.id)?.submittedAt ? "SUBMITTED" : attemptByTest.has(test.id) ? "IN_PROGRESS" : "NOT_STARTED"
      }))
      .filter((test) => test.availability === "UPCOMING" || test.availability === "AVAILABLE" || test.availability === "EXPIRED");
  },

  async details(requester: Requester, id: string) {
    const test = await prisma.test.findUnique({ where: { id }, include: testInclude });

    if (!test) {
      throw new Error("Test not found");
    }

    await assertTestAccess(requester, test);
    return requester.role === Role.STUDENT
      ? sanitizeTestForStudent(test as typeof test & { questions: Array<Record<string, unknown>> })
      : test;
  },

  async create(requester: Requester, payload: TestPayload, options: { reviewImport?: boolean } = {}) {
    if (payload.testId) {
      const existing = await prisma.test.findUnique({ where: { id: payload.testId }, include: { _count: { select: { questions: true } } } });
      if (!existing) throw Object.assign(new Error("Draft exam not found."), { statusCode: 404 });
      await assertTestAccess(requester, existing);
      if (existing.lifecycle !== "DRAFT") {
        throw Object.assign(new Error("Only DRAFT exams can receive questions."), { statusCode: 409 });
      }
      const questionsForCreate = (payload.questions ?? []).map((question) => ({
        ...question,
        reviewStatus: "DRAFT",
        reviewIssues: deriveReviewIssues(question),
        contentJson: normalizeQuestionContentJson(question),
      }));
      if (!questionsForCreate.length) {
        await assertTeacherBatchSubjectAccess(requester, payload.batchId, payload.subject);
        return prisma.test.update({
          where: { id: existing.id },
          data: {
            title: payload.title,
            description: payload.description,
            examType: payload.examType,
            category: payload.category,
            subject: payload.subject,
            topic: payload.topic,
            batchId: payload.batchId,
            ...windowData(payload, existing),
            duration: payload.duration,
            totalMarks: payload.totalMarks,
            expectedQuestionCount: payload.expectedQuestionCount,
            authoritativeQuestionCount: payload.authoritativeQuestionCount ?? payload.expectedQuestionCount,
            expectedTotalMarks: payload.expectedTotalMarks ?? payload.totalMarks,
            status: "DRAFT",
            lifecycle: "DRAFT",
            isLive: false,
          },
          include: testInclude,
        });
      }
      if (existing._count.questions > 0) {
        throw Object.assign(new Error("This draft already has questions. Explicit replacement is required before changing its creation method."), { statusCode: 409 });
      }
      if (!options.reviewImport) validateDraftQuestions(questionsForCreate);
      return prisma.$transaction(async (tx) => {
        if (questionsForCreate.length) await tx.question.createMany({ data: questionsForCreate.map((question) => ({ ...question, testId: existing.id })) });
        return tx.test.findUniqueOrThrow({ where: { id: existing.id }, include: testInclude });
      });
    }
    await assertTeacherBatchSubjectAccess(requester, payload.batchId, payload.subject);
    await assertTeacherTenantAccess(requester, payload.teacherId);
    const questionsForCreate = (payload.questions ?? []).map((question) => ({
      ...question,
      reviewStatus: "DRAFT",
      reviewIssues: deriveReviewIssues(question),
      contentJson: normalizeQuestionContentJson(question),
    }));
    if (!options.reviewImport) validateDraftQuestions(questionsForCreate);
    const test = await prisma.test.create({
      data: {
        title: payload.title,
        description: payload.description,
        examType: payload.examType,
        category: payload.category,
        subject: payload.subject,
        topic: payload.topic,
        batchId: payload.batchId || undefined,
        teacherId: requester.role === Role.TEACHER || requester.role === Role.PHYSICAL_TRAINER
          ? requester.id
          : payload.teacherId || requester.id,
        publishAt: payload.publishAt ? new Date(payload.publishAt) : undefined,
        status: "DRAFT",
        lifecycle: "DRAFT",
        ...windowData(payload),
        duration: payload.duration,
        totalMarks: payload.totalMarks,
        expectedQuestionCount: payload.expectedQuestionCount,
        authoritativeQuestionCount: payload.authoritativeQuestionCount ?? payload.expectedQuestionCount,
        expectedTotalMarks: payload.expectedTotalMarks ?? payload.totalMarks,
        isMockTest: payload.isMockTest ?? true,
        isLive: false,
        questions: {
          create: questionsForCreate
        }
      },
      include: testInclude
    });
    await createInitialQuestionVersions(test.questions as VersionableQuestion[], requester, "CREATED", "Initial question version created with test.");
    return test;
  },

  async update(requester: Requester, id: string, payload: Partial<TestPayload>) {
    const test = await prisma.test.findUnique({ where: { id } });

    if (!test) {
      throw new Error("Test not found");
    }
    await assertTestAccess(requester, test);
    await assertTeacherBatchSubjectAccess(requester, payload.batchId ?? test.batchId ?? undefined, payload.subject ?? test.subject);
    await assertTeacherTenantAccess(requester, payload.teacherId ?? test.teacherId);
    if ((requester.role === Role.TEACHER || requester.role === Role.PHYSICAL_TRAINER) && payload.teacherId && payload.teacherId !== requester.id) {
      throw Object.assign(new Error("Teachers cannot transfer an exam to another teacher."), { statusCode: 403 });
    }
    if (["LIVE", "CLOSED", "ARCHIVED"].includes(test.lifecycle)) {
      throw Object.assign(new Error("Published or closed exams are immutable."), { statusCode: 409 });
    }
    if (payload.status === "PUBLISHED" || payload.isLive === true) {
      throw Object.assign(new Error("Use the teacher approval and publishing workflow to publish an exam."), { statusCode: 400 });
    }

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
        teacherId: requester.role === Role.TEACHER || requester.role === Role.PHYSICAL_TRAINER
          ? undefined
          : payload.teacherId,
        publishAt: payload.publishAt ? new Date(payload.publishAt) : undefined,
        ...windowData(payload, test),
        status: payload.status === undefined ? undefined : "DRAFT",
        lifecycle: payload.status === undefined ? undefined : "DRAFT",
        duration: payload.duration,
        totalMarks: payload.totalMarks,
        isMockTest: payload.isMockTest,
        isLive: payload.isLive === undefined ? undefined : false
      },
      include: testInclude
    });
  },

  async updateDraftQuestion(requester: Requester, testId: string, questionId: string, payload: DraftQuestionUpdate) {
    const test = await prisma.test.findUnique({ where: { id: testId } });
    if (!test) throw Object.assign(new Error("Test not found"), { statusCode: 404 });
    await assertTestAccess(requester, test);
    if (requester.role === Role.STUDENT) {
      const now = new Date();
      const released = test.lifecycle === "LIVE" || (test.lifecycle === "SCHEDULED" && (!test.publishAt || test.publishAt <= now));
      if (!released) throw Object.assign(new Error("This exam has not been released yet."), { statusCode: 404 });
    }
    if (test.lifecycle !== "DRAFT") {
      throw Object.assign(new Error("Only questions in a DRAFT exam can be edited."), { statusCode: 409 });
    }
    const current = await prisma.question.findFirst({ where: { id: questionId, testId } });
    if (!current) throw Object.assign(new Error("Question not found in this exam."), { statusCode: 404 });

    const { changeReason: _changeReason, ...editablePayload } = payload;
    const candidate = {
      ...persistedQuestionPayload(current),
      ...editablePayload,
      correctAnswer: payload.correctAnswer === undefined ? current.correctAnswer : normalizeDraftAnswer(payload.correctAnswer),
      explanation: payload.explanation === undefined ? current.explanation : payload.explanation.trim(),
    };
    validateEditableDraftQuestions([candidate]);
    const reviewIssues = deriveReviewIssues(candidate, Array.isArray(current.reviewIssues) ? current.reviewIssues as unknown as ReviewIssue[] : []);
    const reviewedCandidate = {
      ...candidate,
      reviewStatus: blockingIssues(reviewIssues).length ? "NEEDS_REVIEW" : "REVIEWED",
      reviewIssues,
    };
    const next = {
      ...reviewedCandidate,
      contentJson: synchronizeEditableQuestionContentJson(reviewedCandidate),
    };
    const updated = await prisma.$transaction(async (tx) => {
      const latestVersion = await tx.questionVersion.aggregate({ where: { questionId }, _max: { version: true } });
      const question = await tx.question.update({
        where: { id: current.id },
        data: { ...next, publishedVersion: (latestVersion._max.version || 0) + 1 },
      });
      await tx.questionVersion.create({
        data: questionVersionData(
          question as VersionableQuestion,
          requester,
          "DRAFT_EDITED",
          payload.changeReason?.trim() || "Question edited during draft review."
        ),
      });
      return question;
    });
    return updated;
  },

  async reviewSummary(requester: Requester, testId: string) {
    const summary = await persistedReviewSummary(testId);
    await assertTestAccess(requester, summary.test);
    return summary;
  },

  async approveReviewIssue(requester: Requester, testId: string, questionId: string, issueId: string, reason: string) {
    if (!reason?.trim()) throw Object.assign(new Error("An approval reason is required."), { statusCode: 400 });
    const test = await prisma.test.findUnique({ where: { id: testId } });
    if (!test) throw Object.assign(new Error("Test not found"), { statusCode: 404 });
    await assertTestAccess(requester, test);
    if (test.lifecycle !== "DRAFT") throw Object.assign(new Error("Only DRAFT review issues can be approved."), { statusCode: 409 });
    const current = await prisma.question.findFirst({ where: { id: questionId, testId } });
    if (!current) throw Object.assign(new Error("Question not found in this exam."), { statusCode: 404 });
    const issues = deriveReviewIssues(current, Array.isArray(current.reviewIssues) ? current.reviewIssues as unknown as ReviewIssue[] : []);
    const issue = issues.find((entry) => entry.id === issueId);
    if (!issue || issue.state !== "OPEN") throw Object.assign(new Error("Open review issue not found."), { statusCode: 404 });
    if (!issue.approvable || issue.severity === "HIGH") throw Object.assign(new Error("This structural issue must be resolved by editing the question."), { statusCode: 409 });
    const decidedAt = new Date().toISOString();
    const nextIssues = issues.map((entry) => entry.id === issueId ? { ...entry, state: "APPROVED_AS_IS" as const, reason: reason.trim(), decidedById: requester.id, decidedAt } : entry);
    const version = await prisma.questionVersion.aggregate({ where: { questionId }, _max: { version: true } });
    return prisma.$transaction(async (tx) => {
      const question = await tx.question.update({ where: { id: questionId }, data: { reviewIssues: nextIssues, reviewStatus: "APPROVED_AS_IS", publishedVersion: (version._max.version || 0) + 1 } });
      await tx.questionVersion.create({ data: questionVersionData(question as VersionableQuestion, requester, "ISSUE_APPROVED_AS_IS", `${issueId}: OPEN -> APPROVED_AS_IS. ${reason.trim()}`) });
      return { question, issue: nextIssues.find((entry) => entry.id === issueId) };
    });
  },

  async reconcileReview(requester: Requester, testId: string, input: { count?: boolean; marks?: boolean }) {
    const summary = await persistedReviewSummary(testId);
    await assertTestAccess(requester, summary.test);
    if (summary.test.lifecycle !== "DRAFT") throw Object.assign(new Error("Only a DRAFT can be reconciled."), { statusCode: 409 });
    if (!input.count && !input.marks) throw Object.assign(new Error("Choose count and/or marks to reconcile."), { statusCode: 400 });
    await prisma.test.update({ where: { id: testId }, data: { authoritativeQuestionCount: input.count ? summary.actualQuestionCount : undefined, totalMarks: input.marks ? summary.actualMarksTotal : undefined, isLive: false, lifecycle: "DRAFT", status: "DRAFT" } });
    return persistedReviewSummary(testId);
  },

  async release(requester: Requester, testId: string, input: ReleaseInput) {
    const test = await prisma.test.findUnique({ where: { id: testId }, include: { questions: true } });
    if (!test) throw Object.assign(new Error("Test not found"), { statusCode: 404 });
    await assertTestAccess(requester, test);
    await assertTeacherBatchSubjectAccess(requester, test.batchId ?? undefined, test.subject);

    if (input.action === "SAVE_DRAFT") {
      if (test.lifecycle !== "DRAFT") throw Object.assign(new Error(`This exam is already ${test.lifecycle}.`), { statusCode: 409 });
      return test;
    }
    if (input.action === "SCHEDULE" && test.lifecycle === "SCHEDULED" && input.releaseAt && test.publishAt?.getTime() === new Date(input.releaseAt).getTime()) return test;
    if (input.action === "PUBLISH_NOW" && test.lifecycle === "LIVE") return test;
    if (input.action === "SCHEDULE" && test.lifecycle === "SCHEDULED" && test.publishAt && test.publishAt > new Date()) {
      const now = new Date();
      const releaseAt = new Date(input.releaseAt || "");
      const window = parseExamWindow(test.examStartsAt, test.examEndsAt);
      if (!window.startsAt || !window.endsAt) throw Object.assign(new Error("A valid examination window is required before release."), { statusCode: 400 });
      validateScheduledRelease(releaseAt, window.startsAt, window.endsAt, now);
      const review = await persistedReviewSummary(testId);
      const readiness = reviewReadiness({ lifecycle: "DRAFT", actualQuestionCount: review.actualQuestionCount, authoritativeQuestionCount: review.test.authoritativeQuestionCount, actualMarksTotal: review.actualMarksTotal, authoritativeMarks: Number(review.test.totalMarks), unresolvedHighIssueCount: review.unresolvedHighIssueCount });
      if (readiness.reviewStatus !== "READY") throw Object.assign(new Error(`This exam needs review before its schedule can change. ${readiness.blockingReasons.join(" ")}`), { statusCode: 409 });
      validatePublishableExam({ ...test, questions: test.questions.map((question) => ({ ...persistedQuestionPayload(question), reviewStatus: "APPROVED" })) });
      return prisma.$transaction(async (tx) => {
        const changed = await tx.test.updateMany({ where: { id: testId, lifecycle: "SCHEDULED", publishAt: test.publishAt }, data: { publishAt: releaseAt, releasedById: requester.id } });
        if (changed.count !== 1) throw Object.assign(new Error("The release schedule changed in another session. Refresh and try again."), { statusCode: 409 });
        await tx.auditLog.create({ data: { userId: requester.id, action: "EXAM_RELEASE_RESCHEDULED", module: "EXAMS", description: `Test ${testId} releaseAt=${releaseAt.toISOString()}` } });
        return tx.test.findUniqueOrThrow({ where: { id: testId }, include: testInclude });
      });
    }
    if (test.lifecycle !== "DRAFT") throw Object.assign(new Error(`This exam is already ${test.lifecycle}. Refresh to see its current state.`), { statusCode: 409 });

    const review = await persistedReviewSummary(testId);
    if (review.reviewStatus !== "READY") throw Object.assign(new Error(`This exam needs review before it can be released. ${review.blockingReasons.join(" ")}`), { statusCode: 409 });
    const window = parseExamWindow(test.examStartsAt, test.examEndsAt);
    if (!window.startsAt || !window.endsAt) throw Object.assign(new Error("A valid examination window is required before release."), { statusCode: 400 });
    const now = new Date();
    let releaseAt = now;
    let target: ExamLifecycle = "LIVE";
    if (input.action === "SCHEDULE") {
      releaseAt = new Date(input.releaseAt || "");
      validateScheduledRelease(releaseAt, window.startsAt, window.endsAt, now);
      target = "SCHEDULED";
    } else if (now >= window.endsAt) {
      throw Object.assign(new Error("This examination window has ended and cannot be published now."), { statusCode: 400 });
    }

    validatePublishableExam({ ...test, questions: test.questions.map((question) => ({ ...persistedQuestionPayload(question), reviewStatus: "APPROVED" })) });
    return prisma.$transaction(async (tx) => {
      const claimed = await tx.test.updateMany({
        where: { id: testId, lifecycle: "DRAFT" },
        data: { lifecycle: target, status: legacyExamStatus(target), isLive: lifecycleIsLive(target), publishAt: releaseAt, publishedAt: target === "LIVE" ? now : null, releasedById: requester.id, approvedAt: test.approvedAt || now, approvedById: test.approvedById || requester.id },
      });
      if (claimed.count !== 1) {
        const current = await tx.test.findUniqueOrThrow({ where: { id: testId }, include: testInclude });
        const equivalent = (target === "LIVE" && current.lifecycle === "LIVE") || (target === "SCHEDULED" && current.lifecycle === "SCHEDULED" && current.publishAt?.getTime() === releaseAt.getTime());
        if (equivalent) return current;
        throw Object.assign(new Error(`This exam is already ${current.lifecycle}. Refresh to see its current state.`), { statusCode: 409 });
      }
      await tx.question.updateMany({ where: { testId }, data: { reviewStatus: "APPROVED" } });
      await tx.auditLog.create({ data: { userId: requester.id, action: target === "LIVE" ? "EXAM_PUBLISHED" : "EXAM_RELEASE_SCHEDULED", module: "EXAMS", description: `Test ${testId} -> ${target}; releaseAt=${releaseAt.toISOString()}` } });
      return tx.test.findUniqueOrThrow({ where: { id: testId }, include: testInclude });
    });
  },

  async transitionLifecycle(requester: Requester, id: string, input: LifecycleInput) {
    let test = await prisma.test.findUnique({ where: { id } });
    if (!test) throw Object.assign(new Error("Test not found"), { statusCode: 404 });
    await assertTestAccess(requester, test);
    if (!isExamLifecycle(input.lifecycle)) {
      throw Object.assign(new Error("Invalid exam lifecycle."), { statusCode: 400 });
    }
    const now = new Date();
    if (input.lifecycle === "CLOSED" && test.lifecycle === "SCHEDULED" && (!test.publishAt || test.publishAt <= now)) {
      test = await prisma.$transaction(async (tx) => {
        await tx.test.updateMany({
          where: { id, lifecycle: "SCHEDULED", OR: [{ publishAt: null }, { publishAt: { lte: now } }] },
          data: { lifecycle: "LIVE", status: legacyExamStatus("LIVE"), isLive: true, publishedAt: test?.publishedAt || now },
        });
        return tx.test.findUniqueOrThrow({ where: { id } });
      });
    }
    if (test.lifecycle === input.lifecycle) return prisma.test.findUniqueOrThrow({ where: { id }, include: testInclude });
    const current = isExamLifecycle(test.lifecycle) ? test.lifecycle : "DRAFT";
    assertLifecycleTransition(current, input.lifecycle);
    const window = windowData(input, test);
    if (["SCHEDULED", "LIVE"].includes(input.lifecycle) && (!window.examStartsAt || !window.examEndsAt)) {
      throw Object.assign(new Error("An examination window is required before scheduling or making an exam live."), { statusCode: 400 });
    }
    if (input.lifecycle === "IN_REVIEW") {
      const questions = await prisma.question.findMany({ where: { testId: id } });
      validateDraftQuestions(questions.map(persistedQuestionPayload));
    }
    if (input.lifecycle === "SCHEDULED" || input.lifecycle === "LIVE") {
      const questions = await prisma.question.findMany({ where: { testId: id } });
      validatePublishableExam({ ...test, questions: questions.map(persistedQuestionPayload) });
    }
    return prisma.test.update({
      where: { id },
      data: {
        lifecycle: input.lifecycle,
        status: legacyExamStatus(input.lifecycle),
        isLive: lifecycleIsLive(input.lifecycle),
        ...window,
      },
      include: testInclude,
    });
  },

  async remove(requester: Requester, id: string) {
    const existing = await this.details(requester, id);
    if (existing.lifecycle !== "DRAFT") throw Object.assign(new Error("Only draft exams can be deleted. Archive released exams instead."), { statusCode: 409 });
    const attempts = await prisma.testAttempt.count({ where: { testId: id } });
    if (attempts > 0) throw Object.assign(new Error("This exam cannot be deleted because student attempts exist."), { statusCode: 409 });
    await prisma.test.delete({ where: { id } });
    return { message: "Test deleted successfully" };
  },

  /**
   * Remove the current question set from an editable draft so a replacement
   * paper can be imported deliberately. Essentials and the Test record are
   * preserved; callers must explicitly invoke this endpoint before re-upload.
   */
  async clearDraftQuestions(requester: Requester, id: string) {
    const existing = await prisma.test.findUnique({
      where: { id },
      include: { _count: { select: { questions: true } } },
    });
    if (!existing) throw Object.assign(new Error("Draft exam not found."), { statusCode: 404 });
    await assertTestAccess(requester, existing);
    if (existing.lifecycle !== "DRAFT") {
      throw Object.assign(new Error("Only DRAFT exams can have questions replaced."), { statusCode: 409 });
    }
    const attempts = await prisma.testAttempt.count({ where: { testId: id } });
    if (attempts > 0) {
      throw Object.assign(new Error("This exam cannot replace questions because student attempts exist."), { statusCode: 409 });
    }

    const cleared = await prisma.$transaction(async (tx) => {
      // QuestionVersion/answer-state relations cascade from Question. This
      // keeps the replacement atomic and leaves the Test/Essentials intact.
      await tx.question.deleteMany({ where: { testId: id } });
      await tx.auditLog.create({
        data: {
          userId: requester.id,
          action: "EXAM_QUESTIONS_CLEARED_FOR_REPLACEMENT",
          module: "EXAMS",
          description: `Test ${id} question set cleared for explicit paper replacement.`,
        },
      });
      return tx.test.findUniqueOrThrow({ where: { id }, include: testInclude });
    });
    return { message: "Questions cleared. You can upload a replacement paper.", test: cleared, testId: id };
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
        topic,
        aiConfidence: 0,
        reviewStatus: "DRAFT"
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
    if (payload.approvalAttestation !== "TEACHER_REVIEW_CONFIRMED") {
      throw Object.assign(new Error("Explicit teacher review confirmation is required before publishing."), { statusCode: 400 });
    }
    if (!payload.approvalReferenceId?.trim()) {
      throw Object.assign(new Error("A persisted teacher-review reference is required before publishing."), { statusCode: 400 });
    }
    validatePublishableExam(payload);
    if (!payload.title?.trim() || !payload.topic?.trim()) {
      throw Object.assign(new Error("Exam title and topic are required before publishing."), { statusCode: 400 });
    }
    if (!Number.isFinite(Number(payload.duration)) || Number(payload.duration) <= 0) {
      throw Object.assign(new Error("Exam duration must be greater than zero."), { statusCode: 400 });
    }
    await assertTeacherBatchSubjectAccess(requester, payload.batchId, payload.subject);
    await assertTeacherTenantAccess(requester, payload.teacherId);
    const questionsForCreate = payload.questions.map((question) => ({
      ...question,
      contentJson: normalizeQuestionContentJson(question),
    }));
    const test = await prisma.test.create({
      data: {
        title: payload.title,
        description: payload.description,
        examType: payload.examType,
        category: payload.category,
        subject: payload.subject,
        topic: payload.topic,
        batchId: payload.batchId || undefined,
        teacherId: requester.role === Role.TEACHER || requester.role === Role.PHYSICAL_TRAINER
          ? requester.id
          : payload.teacherId || requester.id,
        publishAt: payload.publishAt ? new Date(payload.publishAt) : undefined,
        status: "PUBLISHED",
        lifecycle: "LIVE",
        reviewedAt: new Date(),
        approvedAt: new Date(),
        approvedById: requester.id,
        duration: payload.duration,
        totalMarks: payload.totalMarks,
        isMockTest: payload.isMockTest ?? true,
        isLive: true,
        questions: {
          create: questionsForCreate
        }
      },
      include: testInclude
    });
    await createInitialQuestionVersions(test.questions as VersionableQuestion[], requester, "PUBLISHED", "Initial published teacher-approved question version.");
    return test;
  },

  async approve(requester: Requester, id: string, input: { questionIds?: string[]; attestation?: string }) {
    if (input.attestation !== "TEACHER_REVIEW_CONFIRMED") {
      throw Object.assign(new Error("Teacher review confirmation is required."), { statusCode: 400 });
    }
    const test = await prisma.test.findUnique({ where: { id }, include: { questions: true } });
    if (!test) throw Object.assign(new Error("Test not found"), { statusCode: 404 });
    await assertTestAccess(requester, test);
    const review = await persistedReviewSummary(id);
    if (review.reviewStatus !== "READY") {
      throw Object.assign(new Error(`Build & Review is not ready. ${review.blockingReasons.join(" ")}`), { statusCode: 409 });
    }
    await assertTeacherBatchSubjectAccess(requester, test.batchId ?? undefined, test.subject);
    if (!test.questions.length) throw Object.assign(new Error("At least one question is required."), { statusCode: 400 });
    const requested = new Set(input.questionIds ?? []);
    if (requested.size !== test.questions.length || test.questions.some((question) => !requested.has(question.id))) {
      throw Object.assign(new Error("Every question must be explicitly included in teacher approval."), { statusCode: 400 });
    }
    validatePublishedQuestions(test.questions.map((question) => ({ ...persistedQuestionPayload(question), reviewStatus: "APPROVED" })));
    await prisma.$transaction([
      prisma.question.updateMany({ where: { testId: id, id: { in: [...requested] } }, data: { reviewStatus: "APPROVED" } }),
      prisma.test.update({
        where: { id },
        data: { status: legacyExamStatus("IN_REVIEW"), lifecycle: "IN_REVIEW", isLive: false, reviewedAt: new Date(), approvedAt: new Date(), approvedById: requester.id }
      })
    ]);
    return this.details(requester, id);
  },

  async publishApproved(requester: Requester, id: string, input: { publishAt?: string; batchId?: string } = {}) {
    const test = await prisma.test.findUnique({ where: { id }, include: { questions: true } });
    if (!test) throw Object.assign(new Error("Test not found"), { statusCode: 404 });
    await assertTestAccess(requester, test);
    const batchId = input.batchId || test.batchId || undefined;
    await assertTeacherBatchSubjectAccess(requester, batchId, test.subject);
    if (test.lifecycle !== "IN_REVIEW" || !test.approvedAt || !test.approvedById) {
      throw Object.assign(new Error("This exam requires explicit teacher approval before publishing."), { statusCode: 400 });
    }
    validatePublishableExam({ ...test, questions: test.questions.map(persistedQuestionPayload) });
    const lifecycle: ExamLifecycle = input.publishAt && new Date(input.publishAt) > new Date() ? "SCHEDULED" : "LIVE";
    return prisma.test.update({
      where: { id },
      data: {
        status: legacyExamStatus(lifecycle),
        lifecycle,
        isLive: lifecycleIsLive(lifecycle),
        batchId,
        publishAt: input.publishAt ? new Date(input.publishAt) : test.publishAt
      },
      include: testInclude
    });
  },

  async start(userId: string, role: Role | undefined, testId: string) {
    const test = await this.details({ id: userId, role: role ?? Role.STUDENT }, testId);
    if (test.lifecycle !== "LIVE" && test.lifecycle !== "SCHEDULED") {
      throw new Error("This test is not published for students yet.");
    }
    const availability = studentExamAvailability(test);
    if (availability === "UPCOMING" || (test.publishAt && test.publishAt > new Date())) {
      throw new Error("This test will open at the scheduled time.");
    }
    if (availability === "EXPIRED") {
      throw new Error("This test window has closed.");
    }

    let attempt;
    try {
      attempt = await prisma.testAttempt.upsert({
        where: { userId_testId: { userId, testId } },
        update: {},
        create: { userId, testId },
        include: {
          test: {
            include: testInclude
          }
        }
      });
    } catch (error) {
      if ((error as { code?: string }).code !== "P2002") throw error;
      attempt = await prisma.testAttempt.findUniqueOrThrow({
        where: { userId_testId: { userId, testId } },
        include: {
          test: {
            include: testInclude
          }
        }
      });
    }
    if (attempt.submittedAt) {
      throw new Error("This test has already been submitted.");
    }
    await prisma.cBTAnswerState.createMany({
      data: test.questions.map((question) => ({ attemptId: attempt.id, questionId: question.id })),
      skipDuplicates: true
    });
    return this.resume(userId, attempt.id);
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
    const timing = attemptTiming(attempt);
    if (timing.isExpired) {
      return this.submitFromSavedState(userId, attempt.id, "TIMER_EXPIRED");
    }
    return sanitizeActiveAttempt({ ...attempt, timing });
  },

  async saveState(userId: string, input: SaveStateInput) {
    const attempt = await prisma.testAttempt.findFirst({
      where: { id: input.attemptId, userId },
      include: { test: { include: { questions: true } } }
    });
    if (!attempt) throw new Error("Attempt not found");
    if (attempt.submittedAt) throw new Error("Attempt already submitted");
    const timing = attemptTiming(attempt);
    if (timing.isExpired) {
      return this.submitFromSavedState(userId, input.attemptId, "TIMER_EXPIRED");
    }

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
    const attempt = await prisma.testAttempt.findFirst({
      where: { id: attemptId, userId },
      include: { answerStates: true }
    });
    if (!attempt) throw new Error("Attempt not found");
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

  async submitFromSavedState(userId: string, attemptId: string, reason = "MANUAL_SUBMIT") {
    let attempt = await prisma.testAttempt.findFirst({
      where: { id: attemptId, userId },
      include: { test: { include: { questions: true } }, answerStates: true }
    });

    if (!attempt) {
      throw new Error("Attempt not found");
    }

    if (attempt.submittedAt) {
      return prisma.testAttempt.findUniqueOrThrow({
        where: { id: attemptId },
        include: { test: true, answers: { include: { question: true } } }
      });
    }

    const claim = await prisma.testAttempt.updateMany({
      where: { id: attemptId, userId, submittedAt: null, status: { not: "SUBMITTING" } },
      data: { status: "SUBMITTING", lastSavedAt: new Date() }
    });
    if (claim.count !== 1) {
      const current = await prisma.testAttempt.findFirst({
        where: { id: attemptId, userId },
        include: { test: true, answers: { include: { question: true } } }
      });
      if (current?.submittedAt) return current;
      throw Object.assign(new Error("Submission is already being finalized. Please wait."), { statusCode: 409 });
    }

    attempt = await prisma.testAttempt.findFirstOrThrow({
      where: { id: attemptId, userId },
      include: { test: { include: { questions: true } }, answerStates: true }
    });

    const questions = new Map(attempt.test.questions.map((question) => [question.id, question]));
    const answers = attempt.answerStates
      .filter((state) => state.selectedAnswer && questions.has(state.questionId))
      .map((state) => ({ questionId: state.questionId, selectedAnswer: state.selectedAnswer! }));
    const normalizedAnswers = answers.map((answer) => ({
      questionId: answer.questionId,
      selectedAnswer: normalizeSelectedAnswer(answer.selectedAnswer),
    }));
    const scoreSummary = calculateObjectiveScore(attempt.test.questions, normalizedAnswers);

    const answerData = normalizedAnswers
      .filter((answer) => questions.has(answer.questionId))
      .map((answer) => {
        const question = questions.get(answer.questionId)!;
        const isCorrect = question.correctAnswer === answer.selectedAnswer;

        return {
          attemptId,
          questionId: answer.questionId,
          selectedAnswer: answer.selectedAnswer,
          isCorrect
        };
      });

    try {
      const timing = attemptTiming(attempt);
      await prisma.$transaction(async (tx) => {
        if (answerData.length) await tx.answer.createMany({ data: answerData, skipDuplicates: true });
        await tx.testAttempt.update({
          where: { id: attemptId },
          data: {
            score: scoreSummary.score,
            totalCorrect: scoreSummary.totalCorrect,
            totalWrong: scoreSummary.totalWrong,
            timeTaken: timing.elapsedSeconds,
            submittedAt: new Date(),
            status: "SUBMITTED",
            sectionState: {
              ...(attempt.sectionState && typeof attempt.sectionState === "object" ? attempt.sectionState : {}),
              submitReason: reason
            }
          }
        });
      });
      await prisma.$transaction((tx) => syncStudentExamPerformance(tx, userId, attemptId)).catch((error) => {
        logger.error("Exam result was saved but NDP performance synchronization failed", {
          attemptId,
          userId,
          error: error instanceof Error ? error.message : String(error),
        });
      });
      return prisma.testAttempt.findUniqueOrThrow({
        where: { id: attemptId },
        include: { test: true, answers: { include: { question: true } } }
      });
    } catch (error) {
      await prisma.testAttempt.updateMany({
        where: { id: attemptId, userId, status: "SUBMITTING", submittedAt: null },
        data: { status: "IN_PROGRESS" }
      }).catch(() => undefined);
      throw error;
    }
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
      return this.submitFromSavedState(userId, attemptId, "DUPLICATE_SUBMIT");
    }

    const timing = attemptTiming(attempt);
    const questions = new Map(attempt.test.questions.map((question) => [question.id, question]));
    const cleanAnswers = Array.from(new Map(
      answers
        .filter((answer) => answer.selectedAnswer && questions.has(answer.questionId))
        .map((answer) => [answer.questionId, { questionId: answer.questionId, selectedAnswer: normalizeSelectedAnswer(answer.selectedAnswer) }])
    ).values());

    if (cleanAnswers.length) {
      await prisma.$transaction(
        cleanAnswers.map((answer) =>
        prisma.cBTAnswerState.upsert({
          where: { attemptId_questionId: { attemptId, questionId: answer.questionId } },
          update: {
            selectedAnswer: answer.selectedAnswer,
            status: "ANSWERED",
            markedForReview: false
          },
          create: {
            attemptId,
            questionId: answer.questionId,
            selectedAnswer: answer.selectedAnswer,
            status: "ANSWERED"
          }
        })
        )
      );
    }

    return this.submitFromSavedState(userId, attemptId, timing.isExpired ? "TIMER_EXPIRED" : "MANUAL_SUBMIT");
  },

  async history(userId: string) {
    const attempts = await prisma.testAttempt.findMany({
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
    const testIds = attempts.map((attempt) => attempt.testId);
    const releaseRecords = testIds.length ? await prisma.teacherExamRecord.findMany({
      where: { testId: { in: testIds } },
      select: { testId: true, status: true }
    }) : [];
    const releaseStatusByTest = new Map(releaseRecords.map((record) => [record.testId, record.status]));
    return attempts.map((attempt) => {
      const releaseStatus = releaseStatusByTest.get(attempt.testId);
      return {
        ...attempt,
        resultsReleased: releaseStatus ? releaseStatus === "RESULTS_RELEASED" : true,
        resultStatus: releaseStatus ? releaseStatus === "RESULTS_RELEASED" ? "RESULTS_RELEASED" : "PENDING_RELEASE" : "LEGACY_RELEASED"
      };
    });
  },

  async result(userId: string, attemptId: string) {
    const attempt = await prisma.testAttempt.findFirst({
      where: { id: attemptId, userId },
      include: {
        test: { include: { questions: true } },
        answers: { include: { question: true } }
      }
    });

    if (!attempt) {
      throw new Error("Result not found");
    }

    const release = await resultReleaseState(attempt.testId);
    if (!attempt.submittedAt || !release.released) {
      const questionCount = attempt.test.questions.length;
      const submitted = Boolean(attempt.submittedAt);
      return {
        resultsReleased: false,
        resultStatus: submitted ? "PENDING_RELEASE" : "ATTEMPT_IN_PROGRESS",
        release,
        attempt: sanitizePendingResultAttempt(attempt),
        analytics: {
          accuracy: 0,
          weakTopics: [],
          timeAnalysis: {
            timeTaken: attempt.timeTaken,
            averagePerQuestion: 0
          },
          rankEstimation: null,
          batchRank: null,
          rankedStudents: 0,
          topicAnalysis: [],
          improvementAreas: [],
          feedbackSummary: submitted
            ? "Your exam has been submitted. The official result, answer key and explanations will appear after faculty release."
            : "Result is not available because this exam has not been submitted.",
          aiInsights: "Result review is pending.",
          submitted,
          questionCount
        }
      };
    }

    const attempted = attempt.answers.length;
    const accuracy = attempted > 0 ? Math.round((attempt.totalCorrect / attempted) * 100) : 0;
    const topicAnalysis = getTopicAnalysis(attempt.answers);
    const weakTopics = topicAnalysis.filter((topic) => topic.accuracy < 60).map((topic) => topic.topic);
    const improvementAreas = topicAnalysis
      .filter((topic) => topic.accuracy < 75)
      .map((topic) => ({
        topic: topic.topic,
        accuracy: topic.accuracy,
        message: topic.accuracy < 40
          ? `Restart the basics of ${topic.topic}, then solve short timed drills.`
          : topic.accuracy < 60
            ? `Revise ${topic.topic} and practise mixed questions before the next exam.`
            : `Polish speed and accuracy in ${topic.topic}.`
      }));
    const rankedAttempts = await prisma.testAttempt.findMany({
      where: { testId: attempt.testId, status: "SUBMITTED", submittedAt: { not: null } },
      orderBy: [{ score: "desc" }, { totalCorrect: "desc" }, { timeTaken: "asc" }, { submittedAt: "asc" }],
      select: { id: true }
    });
    const actualRank = Math.max(1, rankedAttempts.findIndex((item) => item.id === attempt.id) + 1);

    return {
      resultsReleased: true,
      resultStatus: release.status,
      release,
      attempt,
      analytics: {
        accuracy,
        weakTopics,
        timeAnalysis: {
          timeTaken: attempt.timeTaken,
          averagePerQuestion: attempted > 0 ? Math.round(attempt.timeTaken / attempted) : 0
        },
        rankEstimation: actualRank,
        batchRank: actualRank,
        rankedStudents: rankedAttempts.length,
        topicAnalysis,
        improvementAreas,
        feedbackSummary:
          improvementAreas.length > 0
            ? `Priority improvement: ${improvementAreas.slice(0, 3).map((area) => area.topic).join(", ")}.`
            : "No weak area detected. Keep practising full-length timed papers.",
        aiInsights:
          weakTopics.length > 0
            ? `Focus revision on ${weakTopics.join(", ")} before the next mock.`
            : "Strong attempt. Maintain speed and accuracy with mixed revision drills."
      }
    };
  }
};
