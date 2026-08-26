import assert from "node:assert/strict";
import { performance } from "node:perf_hooks";
import bcrypt from "bcryptjs";
import { prisma } from "../config/prisma.js";
import { Role } from "../generated/prisma/client.js";

const apiBase = process.env.NIDUS_PHASE5_API_URL ?? "http://127.0.0.1:8180/api";
const testPin = process.env.NIDUS_PHASE5_TEST_PIN;
const requestedLevels = (process.env.NIDUS_PHASE5_LOAD_LEVELS ?? "25,50,100,250")
  .split(",")
  .map((value) => Number(value.trim()))
  .filter((value) => Number.isInteger(value) && value > 0 && value <= 250);
const levels = [...new Set(requestedLevels)].sort((a, b) => a - b);
const batchId = "phase4-batch-a1";
const teacherMobile = "9100000011";
const studentPrefix = "phase5-load-student-";
const testPrefix = "PHASE5 LOAD";

type TimedResult<T = unknown> = { status: number; durationMs: number; body: T; cookie?: string };
type MetricName = "login" | "dashboard" | "examStart" | "questionLoad" | "autosave" | "submit" | "result";
type VirtualResult = {
  studentId: string;
  ok: boolean;
  statuses: Partial<Record<MetricName, number>>;
  timings: Partial<Record<MetricName, number>>;
  attemptId?: string;
  error?: string;
};

function assertDisposableStaging() {
  const url = new URL(process.env.DATABASE_URL ?? "");
  const database = url.pathname.replace(/^\//, "");
  assert.ok(["127.0.0.1", "localhost", "::1"].includes(url.hostname), "Phase 5 may only use local PostgreSQL");
  assert.match(database, /^nidus_staging_/i, "Phase 5 database name must start with nidus_staging_");
  assert.match(apiBase, /^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?\/api$/, "Phase 5 API must be local");
  assert.ok(testPin && /^\d{4}$/.test(testPin), "NIDUS_PHASE5_TEST_PIN must be a four digit staging-only PIN");
  assert.ok(levels.length > 0, "At least one valid load level is required");
  return database;
}

function clientIp(index: number) {
  return `198.18.${Math.floor(index / 250)}.${(index % 250) + 1}`;
}

async function api<T = Record<string, unknown>>(
  path: string,
  options: { method?: string; cookie?: string; body?: unknown; ip?: string; timeoutMs?: number } = {},
): Promise<TimedResult<T>> {
  const method = options.method ?? "GET";
  const sendsJson = !["GET", "HEAD"].includes(method.toUpperCase());
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 60_000);
  const started = performance.now();
  try {
    const response = await fetch(`${apiBase}${path}`, {
      method,
      signal: controller.signal,
      headers: {
        ...(options.cookie ? { cookie: options.cookie } : {}),
        ...(options.ip ? { "x-forwarded-for": options.ip } : {}),
        ...(sendsJson ? { "content-type": "application/json" } : {}),
      },
      body: sendsJson ? JSON.stringify(options.body ?? {}) : undefined,
    });
    const text = await response.text();
    let body: unknown = {};
    try { body = text ? JSON.parse(text) : {}; } catch { body = { raw: text }; }
    const session = response.headers.get("set-cookie")?.match(/(?:^|,\s*)session=([^;]*)/)?.[1];
    return {
      status: response.status,
      durationMs: performance.now() - started,
      body: body as T,
      cookie: session ? `session=${session}` : undefined,
    };
  } finally {
    clearTimeout(timeout);
  }
}

function percentile(values: number[], percentileValue: number) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.ceil((percentileValue / 100) * sorted.length) - 1);
  return Number(sorted[index].toFixed(1));
}

function summarize(values: number[]) {
  return {
    count: values.length,
    p50Ms: percentile(values, 50),
    p95Ms: percentile(values, 95),
    p99Ms: percentile(values, 99),
    maxMs: values.length ? Number(Math.max(...values).toFixed(1)) : null,
  };
}

const questions = Array.from({ length: 10 }, (_, index) => ({
  questionText: `NDA load verification question ${index + 1}: what is ${index + 2} + ${index + 3}?`,
  optionA: String(index + 4),
  optionB: String(index + 5),
  optionC: String(index + 6),
  optionD: String(index + 7),
  correctAnswer: "B",
  explanation: `${index + 2} + ${index + 3} = ${index + 5}.`,
  topic: "Arithmetic",
  marks: 4,
  negativeMarks: 1,
  difficultyLevel: "MEDIUM",
  reviewStatus: "DRAFT",
}));

async function seedStudents(maxStudents: number) {
  const password = await bcrypt.hash(testPin!, 12);
  for (let offset = 0; offset < maxStudents; offset += 50) {
    const count = Math.min(50, maxStudents - offset);
    await prisma.$transaction(
      Array.from({ length: count }, (_, localIndex) => {
        const index = offset + localIndex + 1;
        const id = `${studentPrefix}${index}`;
        const mobile = `93000${String(index).padStart(5, "0")}`;
        return prisma.user.upsert({
          where: { email: `${id}@invalid.test` },
          update: {
            name: `Phase 5 Load Student ${index}`,
            mobile,
            password,
            role: Role.STUDENT,
            instituteId: "phase4-institute-a",
            branchId: "phase4-branch-a",
            isDisabled: false,
          },
          create: {
            id,
            name: `Phase 5 Load Student ${index}`,
            email: `${id}@invalid.test`,
            mobile,
            password,
            role: Role.STUDENT,
            instituteId: "phase4-institute-a",
            branchId: "phase4-branch-a",
            emailVerified: true,
            mobileVerified: true,
            roleOnboardingStatus: "ACTIVE",
            roleActivatedAt: new Date(),
            roleMetadata: { loginMobile: mobile, authMobile: mobile, phase5Staging: true },
          },
        });
      }),
    );
    await prisma.$transaction(
      Array.from({ length: count }, (_, localIndex) => {
        const index = offset + localIndex + 1;
        return prisma.batchStudent.upsert({
          where: { batchId_studentId: { batchId, studentId: `${studentPrefix}${index}` } },
          update: { status: "ACTIVE" },
          create: { batchId, studentId: `${studentPrefix}${index}`, status: "ACTIVE" },
        });
      }),
    );
  }
}

async function teacherLogin() {
  const result = await api("/auth/login", {
    method: "POST",
    ip: "198.19.0.1",
    body: { mobile: teacherMobile, pin: testPin },
  });
  assert.equal(result.status, 200, `Teacher login failed: ${JSON.stringify(result.body)}`);
  assert.ok(result.cookie, "Teacher login did not return a session cookie");
  return result.cookie;
}

async function createPublishedTest(cookie: string, level: number) {
  const title = `${testPrefix} ${level} ${Date.now()}`;
  const created = await api<{ test: { id: string; questions: Array<{ id: string }> } }>("/tests", {
    method: "POST",
    cookie,
    ip: "198.19.0.1",
    body: {
      title,
      description: `Disposable staging load examination for ${level} concurrent students.`,
      examType: "NDA",
      category: "Performance QA",
      subject: "Mathematics",
      topic: "Load verification",
      batchId,
      duration: 30,
      totalMarks: 40,
      isMockTest: true,
      isLive: false,
      status: "DRAFT",
      questions,
    },
  });
  assert.equal(created.status, 201, `Create failed: ${JSON.stringify(created.body)}`);
  const questionIds = created.body.test.questions.map((question) => question.id);
  const approved = await api(`/tests/${created.body.test.id}/approve`, {
    method: "POST",
    cookie,
    ip: "198.19.0.1",
    body: { attestation: "TEACHER_REVIEW_CONFIRMED", questionIds },
  });
  assert.equal(approved.status, 200, `Approval failed: ${JSON.stringify(approved.body)}`);
  const published = await api(`/tests/${created.body.test.id}/publish`, {
    method: "POST",
    cookie,
    ip: "198.19.0.1",
    body: { batchId },
  });
  assert.equal(published.status, 200, `Publish failed: ${JSON.stringify(published.body)}`);
  return { id: created.body.test.id, title, questionIds };
}

async function runStudent(index: number, testId: string, expectedQuestionIds: string[]): Promise<VirtualResult> {
  const mobile = `93000${String(index).padStart(5, "0")}`;
  const studentId = `${studentPrefix}${index}`;
  const ip = clientIp(index);
  const statuses: Partial<Record<MetricName, number>> = {};
  const timings: Partial<Record<MetricName, number>> = {};
  try {
    const login = await api("/auth/login", { method: "POST", ip, body: { mobile, pin: testPin } });
    statuses.login = login.status;
    timings.login = login.durationMs;
    if (login.status !== 200 || !login.cookie) throw new Error(`login:${login.status}`);

    const dashboard = await api<{ tests: Array<{ id: string }> }>("/tests/available", { cookie: login.cookie, ip });
    statuses.dashboard = dashboard.status;
    timings.dashboard = dashboard.durationMs;
    if (dashboard.status !== 200 || !dashboard.body.tests.some((test) => test.id === testId)) throw new Error(`dashboard:${dashboard.status}`);

    const start = await api<{ attempt: { id: string; test: { questions: Array<{ id: string }> } } }>("/tests/start", {
      method: "POST",
      cookie: login.cookie,
      ip,
      body: { testId },
    });
    statuses.examStart = start.status;
    timings.examStart = start.durationMs;
    if (start.status !== 201) throw new Error(`start:${start.status}`);
    const attemptId = start.body.attempt.id;
    const questionIds = start.body.attempt.test.questions.map((question) => question.id);
    if (questionIds.length !== expectedQuestionIds.length) throw new Error(`question-count:${questionIds.length}`);

    const loaded = await api(`/tests/attempts/${attemptId}/resume`, { cookie: login.cookie, ip });
    statuses.questionLoad = loaded.status;
    timings.questionLoad = loaded.durationMs;
    if (loaded.status !== 200) throw new Error(`question-load:${loaded.status}`);

    const answers = questionIds.map((questionId, questionIndex) => ({
      questionId,
      selectedAnswer: "B",
      status: "ANSWERED",
      markedForReview: questionIndex === 2,
      timeSpent: 3,
    }));
    const autosave = await api("/tests/autosave", {
      method: "POST",
      cookie: login.cookie,
      ip,
      body: { attemptId, currentQuestionId: questionIds[2], sectionState: { section: "NDA" }, answers },
    });
    statuses.autosave = autosave.status;
    timings.autosave = autosave.durationMs;
    if (autosave.status !== 200) throw new Error(`autosave:${autosave.status}`);

    if (index === 1) {
      for (const selectedAnswer of ["A", "C", "D", "B"]) {
        const rapid = await api("/tests/autosave", {
          method: "POST",
          cookie: login.cookie,
          ip,
          body: { attemptId, currentQuestionId: questionIds[0], answers: [{ ...answers[0], selectedAnswer }] },
        });
        if (rapid.status !== 200) throw new Error(`rapid-autosave:${rapid.status}`);
      }
      const resumed = await api<{ attempt: { answerStates: Array<{ questionId: string; selectedAnswer?: string }> } }>(`/tests/attempts/${attemptId}/resume`, { cookie: login.cookie, ip });
      const finalState = resumed.body.attempt.answerStates.find((answer) => answer.questionId === questionIds[0]);
      if (finalState?.selectedAnswer !== "B") throw new Error(`stale-autosave:${finalState?.selectedAnswer ?? "missing"}`);
    }

    const submitOptions = {
      method: "POST",
      cookie: login.cookie,
      ip,
      body: { attemptId, answers, timeTaken: 999_999 },
      timeoutMs: 90_000,
    };
    const submitStarted = performance.now();
    const submissionResults = index === 1
      ? await Promise.all([api("/tests/submit", submitOptions), api("/tests/submit", submitOptions)])
      : [await api("/tests/submit", submitOptions)];
    timings.submit = performance.now() - submitStarted;
    statuses.submit = submissionResults[0].status;
    if (!submissionResults.some((result) => result.status === 200) || submissionResults.some((result) => ![200, 409].includes(result.status))) {
      throw new Error(`submit:${submissionResults.map((result) => result.status).join(",")}`);
    }

    const result = await api<{ attempt: { score: number; timeTaken: number } }>(`/tests/result/${attemptId}`, { cookie: login.cookie, ip });
    statuses.result = result.status;
    timings.result = result.durationMs;
    if (result.status !== 200 || result.body.attempt.score !== 40) throw new Error(`result:${result.status}:${result.body.attempt?.score}`);
    if (result.body.attempt.timeTaken >= 999_999) throw new Error("client-timer-was-authoritative");
    return { studentId, ok: true, statuses, timings, attemptId };
  } catch (error) {
    return { studentId, ok: false, statuses, timings, error: error instanceof Error ? error.message : String(error) };
  }
}

async function databaseEvidence(testId: string, expectedStudents: number) {
  const [attempts, submitted, answers, answerStates, duplicateAttempts, duplicateAnswers, orphans, activity, locks] = await Promise.all([
    prisma.testAttempt.count({ where: { testId } }),
    prisma.testAttempt.count({ where: { testId, status: "SUBMITTED" } }),
    prisma.answer.count({ where: { attempt: { testId } } }),
    prisma.cBTAnswerState.count({ where: { attempt: { testId } } }),
    prisma.$queryRaw<Array<{ count: number }>>`
      SELECT COUNT(*)::int AS count FROM (
        SELECT "userId", "testId" FROM "TestAttempt" WHERE "testId" = ${testId}
        GROUP BY "userId", "testId" HAVING COUNT(*) > 1
      ) duplicates
    `,
    prisma.$queryRaw<Array<{ count: number }>>`
      SELECT COUNT(*)::int AS count FROM (
        SELECT "attemptId", "questionId" FROM "Answer"
        WHERE "attemptId" IN (SELECT "id" FROM "TestAttempt" WHERE "testId" = ${testId})
        GROUP BY "attemptId", "questionId" HAVING COUNT(*) > 1
      ) duplicates
    `,
    prisma.$queryRaw<Array<{ count: number }>>`
      SELECT COUNT(*)::int AS count FROM "Answer" answer
      LEFT JOIN "TestAttempt" attempt ON attempt."id" = answer."attemptId"
      WHERE attempt."id" IS NULL
    `,
    prisma.$queryRaw<Array<{ connections: number }>>`
      SELECT COUNT(*)::int AS connections FROM pg_stat_activity WHERE datname = current_database()
    `,
    prisma.$queryRaw<Array<{ waiting: number }>>`
      SELECT COUNT(*) FILTER (WHERE NOT granted)::int AS waiting FROM pg_locks
    `,
  ]);
  return {
    expectedStudents,
    attempts,
    submitted,
    answers,
    answerStates,
    duplicateAttemptGroups: duplicateAttempts[0]?.count ?? -1,
    duplicateAnswerGroups: duplicateAnswers[0]?.count ?? -1,
    orphanAnswers: orphans[0]?.count ?? -1,
    databaseConnections: activity[0]?.connections ?? -1,
    waitingLocks: locks[0]?.waiting ?? -1,
  };
}

async function run() {
  const database = assertDisposableStaging();
  const maxStudents = Math.max(...levels);
  await seedStudents(maxStudents);
  await prisma.test.deleteMany({ where: { title: { startsWith: testPrefix } } });
  const teacherCookie = await teacherLogin();
  const report: Record<string, unknown> = {
    database,
    apiBase,
    levels,
    studentsSeeded: maxStudents,
    distinctProxyIps: true,
    startedAt: new Date().toISOString(),
    runs: [],
  };

  for (const level of levels) {
    const test = await createPublishedTest(teacherCookie, level);
    const wallStarted = performance.now();
    const settled = await Promise.all(Array.from({ length: level }, (_, index) => runStudent(index + 1, test.id, test.questionIds)));
    const wallMs = performance.now() - wallStarted;
    const successful = settled.filter((result) => result.ok);
    const metrics = Object.fromEntries(
      (["login", "dashboard", "examStart", "questionLoad", "autosave", "submit", "result"] as MetricName[]).map((name) => [
        name,
        summarize(successful.map((result) => result.timings[name]).filter((value): value is number => typeof value === "number")),
      ]),
    );
    const integrity = await databaseEvidence(test.id, level);
    (report.runs as unknown[]).push({
      concurrentStudents: level,
      testId: test.id,
      wallMs: Number(wallMs.toFixed(1)),
      throughputStudentsPerSecond: Number((successful.length / (wallMs / 1000)).toFixed(2)),
      success: successful.length,
      failed: settled.length - successful.length,
      successRate: Number(((successful.length / settled.length) * 100).toFixed(2)),
      errors: settled.filter((result) => !result.ok).slice(0, 20).map(({ studentId, error, statuses }) => ({ studentId, error, statuses })),
      metrics,
      integrity,
    });
    console.log(JSON.stringify((report.runs as unknown[]).at(-1)));
  }
  report.completedAt = new Date().toISOString();
  console.log(JSON.stringify(report, null, 2));
}

run()
  .catch((error) => {
    console.error(error instanceof Error ? error.stack ?? error.message : String(error));
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
