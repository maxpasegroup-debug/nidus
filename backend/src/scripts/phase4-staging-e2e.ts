import assert from "node:assert/strict";
import bcrypt from "bcryptjs";
import { prisma } from "../config/prisma.js";
import { Role } from "../generated/prisma/client.js";

const apiBase = process.env.NIDUS_PHASE4_API_URL ?? "http://127.0.0.1:8180/api";
const testPin = process.env.NIDUS_PHASE4_TEST_PIN;

function assertDisposableStaging() {
  const url = new URL(process.env.DATABASE_URL ?? "");
  const database = url.pathname.replace(/^\//, "");
  assert.ok(["127.0.0.1", "localhost", "::1"].includes(url.hostname), "Phase 4 may only use a local database host");
  assert.match(database, /^nidus_staging_/i, "Phase 4 database name must start with nidus_staging_");
  assert.match(apiBase, /^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?\/api$/, "Phase 4 API must be local");
  assert.ok(testPin && /^\d{4}$/.test(testPin), "NIDUS_PHASE4_TEST_PIN must be a four digit staging-only PIN");
  return database;
}

type ApiResult<T = unknown> = { status: number; body: T; cookie?: string };

async function api<T = Record<string, unknown>>(path: string, options: { method?: string; cookie?: string; body?: unknown } = {}): Promise<ApiResult<T>> {
  const method = options.method ?? "GET";
  const sendsJson = !["GET", "HEAD"].includes(method.toUpperCase());
  const response = await fetch(`${apiBase}${path}`, {
    method,
    headers: {
      ...(options.cookie ? { cookie: options.cookie } : {}),
      ...(sendsJson ? { "content-type": "application/json" } : {}),
    },
    body: sendsJson ? JSON.stringify(options.body ?? {}) : undefined,
  });
  const text = await response.text();
  let body: unknown = {};
  try { body = text ? JSON.parse(text) : {}; } catch { body = { raw: text }; }
  const setCookie = response.headers.get("set-cookie");
  const session = setCookie?.match(/(?:^|,\s*)session=([^;]*)/)?.[1];
  return { status: response.status, body: body as T, cookie: session ? `session=${session}` : undefined };
}

async function login(mobile: string) {
  const result = await api<{ user: { id: string; role: string } }>("/auth/login", { method: "POST", body: { mobile, pin: testPin } });
  assert.equal(result.status, 200, `Login failed for staging account ${mobile}`);
  assert.ok(result.cookie, "Login did not set a session cookie");
  return result.cookie;
}

const ids = {
  instituteA: "phase4-institute-a",
  instituteB: "phase4-institute-b",
  branchA: "phase4-branch-a",
  branchB: "phase4-branch-b",
  directorA: "phase4-director-a",
  adminA: "phase4-admin-a",
  teacherA1: "phase4-teacher-a1",
  teacherA2: "phase4-teacher-a2",
  teacherB: "phase4-teacher-b",
  course: "phase4-nda-course",
  batchA1: "phase4-batch-a1",
  batchA2: "phase4-batch-a2",
  batchB1: "phase4-batch-b1",
};

const mobiles = {
  directorA: "9100000001",
  adminA: "9100000002",
  teacherA1: "9100000011",
  teacherA2: "9100000012",
  teacherB: "9200000011",
  studentsA: Array.from({ length: 10 }, (_, index) => `91000001${String(index).padStart(2, "0")}`),
  studentsB: ["9200000101", "9200000102"],
};

async function seed() {
  const password = await bcrypt.hash(testPin!, 12);
  await prisma.institute.upsert({
    where: { code: "PHASE4-A" },
    update: { name: "Phase 4 Institution A", status: "ACTIVE" },
    create: { id: ids.instituteA, code: "PHASE4-A", name: "Phase 4 Institution A", status: "ACTIVE" },
  });
  await prisma.institute.upsert({
    where: { code: "PHASE4-B" },
    update: { name: "Phase 4 Institution B", status: "ACTIVE" },
    create: { id: ids.instituteB, code: "PHASE4-B", name: "Phase 4 Institution B", status: "ACTIVE" },
  });
  await prisma.branch.upsert({
    where: { id: ids.branchA }, update: {},
    create: { id: ids.branchA, instituteId: ids.instituteA, name: "Phase 4 Branch A", location: "Staging", contactNumber: "9100000991" },
  });
  await prisma.branch.upsert({
    where: { id: ids.branchB }, update: {},
    create: { id: ids.branchB, instituteId: ids.instituteB, name: "Phase 4 Branch B", location: "Staging", contactNumber: "9200000991" },
  });
  await prisma.course.upsert({
    where: { slug: "phase4-nda" }, update: {},
    create: {
      id: ids.course, title: "Phase 4 NDA Practice", slug: "phase4-nda", description: "Disposable staging NDA practice course.",
      thumbnail: "/staging/nda.png", category: "Defence", examType: "NDA", duration: "4 weeks", price: 0,
    },
  });
  const batches = [
    { id: ids.batchA1, name: "Phase 4 Batch A1", instituteId: ids.instituteA, branchId: ids.branchA },
    { id: ids.batchA2, name: "Phase 4 Batch A2", instituteId: ids.instituteA, branchId: ids.branchA },
    { id: ids.batchB1, name: "Phase 4 Batch B1", instituteId: ids.instituteB, branchId: ids.branchB },
  ];
  for (const batch of batches) {
    await prisma.batch.upsert({
      where: { name_programSlug: { name: batch.name, programSlug: "phase4-nda" } },
      update: { instituteId: batch.instituteId, branchId: batch.branchId, status: "ACTIVE" },
      create: { ...batch, batchType: "ONLINE", programSlug: "phase4-nda", courseId: ids.course, status: "ACTIVE" },
    });
  }

  const users = [
    { id: ids.directorA, name: "Phase 4 Director A", email: "phase4.director.a@invalid.test", mobile: mobiles.directorA, role: Role.DIRECTOR, instituteId: ids.instituteA, branchId: ids.branchA },
    { id: ids.adminA, name: "Phase 4 Admin A", email: "phase4.admin.a@invalid.test", mobile: mobiles.adminA, role: Role.ADMIN, instituteId: ids.instituteA, branchId: ids.branchA },
    { id: ids.teacherA1, name: "Phase 4 Teacher A1", email: "phase4.teacher.a1@invalid.test", mobile: mobiles.teacherA1, role: Role.TEACHER, instituteId: ids.instituteA, branchId: ids.branchA },
    { id: ids.teacherA2, name: "Phase 4 Teacher A2", email: "phase4.teacher.a2@invalid.test", mobile: mobiles.teacherA2, role: Role.TEACHER, instituteId: ids.instituteA, branchId: ids.branchA },
    { id: ids.teacherB, name: "Phase 4 Teacher B", email: "phase4.teacher.b@invalid.test", mobile: mobiles.teacherB, role: Role.TEACHER, instituteId: ids.instituteB, branchId: ids.branchB },
    ...mobiles.studentsA.map((mobile, index) => ({ id: `phase4-student-a-${index + 1}`, name: `Phase 4 Student A${index + 1}`, email: `phase4.student.a${index + 1}@invalid.test`, mobile, role: Role.STUDENT, instituteId: ids.instituteA, branchId: ids.branchA })),
    ...mobiles.studentsB.map((mobile, index) => ({ id: `phase4-student-b-${index + 1}`, name: `Phase 4 Student B${index + 1}`, email: `phase4.student.b${index + 1}@invalid.test`, mobile, role: Role.STUDENT, instituteId: ids.instituteB, branchId: ids.branchB })),
  ];
  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: { password, mobile: user.mobile, role: user.role, instituteId: user.instituteId, branchId: user.branchId, isDisabled: false, roleMetadata: { loginMobile: user.mobile, authMobile: user.mobile, phase4Staging: true } },
      create: { ...user, password, emailVerified: true, mobileVerified: true, roleOnboardingStatus: "ACTIVE", roleActivatedAt: new Date(), roleMetadata: { loginMobile: user.mobile, authMobile: user.mobile, phase4Staging: true } },
    });
  }
  for (let index = 0; index < 10; index += 1) {
    await prisma.batchStudent.upsert({
      where: { batchId_studentId: { batchId: index < 8 ? ids.batchA1 : ids.batchA2, studentId: `phase4-student-a-${index + 1}` } },
      update: { status: "ACTIVE" }, create: { batchId: index < 8 ? ids.batchA1 : ids.batchA2, studentId: `phase4-student-a-${index + 1}`, status: "ACTIVE" },
    });
  }
  for (let index = 0; index < 2; index += 1) {
    await prisma.batchStudent.upsert({
      where: { batchId_studentId: { batchId: ids.batchB1, studentId: `phase4-student-b-${index + 1}` } },
      update: { status: "ACTIVE" }, create: { batchId: ids.batchB1, studentId: `phase4-student-b-${index + 1}`, status: "ACTIVE" },
    });
  }
  const assignments = [
    { batchId: ids.batchA1, teacherId: ids.teacherA1, subject: "Mathematics" },
    { batchId: ids.batchA2, teacherId: ids.teacherA2, subject: "Mathematics" },
    { batchId: ids.batchB1, teacherId: ids.teacherB, subject: "Mathematics" },
  ];
  for (const assignment of assignments) {
    await prisma.teacherBatchAssignment.upsert({
      where: { batchId_teacherId_subject: assignment }, update: { status: "ACTIVE" }, create: { ...assignment, status: "ACTIVE" },
    });
  }
  await prisma.test.deleteMany({ where: { title: { startsWith: "PHASE4 QA" } } });
}

const questions = [
  ["What is 15% of 240?", "24", "36", "40", "48", "B", "Fifteen percent of 240 is 0.15 × 240 = 36.", "Percentage"],
  ["What are the roots of x² - 5x + 6 = 0?", "1 and 6", "-2 and -3", "2 and 3", "-1 and -6", "C", "The polynomial factors as (x - 2)(x - 3).", "Algebra"],
  ["What is tan 45°?", "1", "0", "√3", "1/√3", "A", "For a 45° angle, opposite and adjacent sides are equal, so tan 45° = 1.", "Trigonometry"],
  ["What is √144?", "10", "11", "13", "12", "D", "Twelve squared is 144.", "Arithmetic"],
  ["What is the SI unit of force?", "joule", "newton", "watt", "pascal", "B", "Force is measured in newtons (N).", "Units"],
  ["A body starts from rest and accelerates at 2 m/s² for 5 s. What is its final speed?", "5 m/s", "8 m/s", "10 m/s", "12 m/s", "C", "Using v = u + at gives v = 0 + 2 × 5 = 10 m/s.", "Kinematics"],
  ["A machine does 100 J of work in 20 s. What power does it develop?", "2 W", "4 W", "10 W", "5 W", "D", "Power is work divided by time: 100/20 = 5 W.", "Work and Power"],
  ["What is the common name of H₂SO₄?", "sulfuric acid", "hydrochloric acid", "nitric acid", "acetic acid", "A", "H₂SO₄ is sulfuric acid.", "Chemical Formulae"],
  ["Which equation correctly represents the complete combustion of hydrogen?", "H₂ + O₂ → H₂O", "H₂ + O → H₂O", "2H₂ + O₂ → 2H₂O", "H₂ + 2O₂ → H₂O₂", "C", "The balanced equation is 2H₂ + O₂ → 2H₂O.", "Chemical Equations"],
  ["What is the atomic number of sodium?", "10", "11", "12", "23", "B", "Sodium has 11 protons, so its atomic number is 11.", "Atomic Structure"],
].map(([questionText, optionA, optionB, optionC, optionD, correctAnswer, explanation, topic]) => ({
  questionText, optionA, optionB, optionC, optionD, correctAnswer, explanation, topic,
  marks: 4, negativeMarks: 1, difficultyLevel: "MEDIUM", reviewStatus: "APPROVED",
}));

async function run() {
  const database = assertDisposableStaging();
  await seed();
  const evidence: Record<string, unknown> = { database, seeded: { institutions: 2, teachers: 3, students: 12, batches: 3 } };

  const unauthenticated = await api("/tests");
  assert.equal(unauthenticated.status, 401);
  const invalidLogin = await api("/auth/login", { method: "POST", body: { mobile: mobiles.teacherA1, pin: "0000" } });
  assert.equal(invalidLogin.status, 401);

  const directorA = await login(mobiles.directorA);
  const adminA = await login(mobiles.adminA);
  const teacherA1 = await login(mobiles.teacherA1);
  const teacherA2 = await login(mobiles.teacherA2);
  const teacherB = await login(mobiles.teacherB);
  const studentA1 = await login(mobiles.studentsA[0]);
  const studentA2 = await login(mobiles.studentsA[1]);
  const studentA3 = await login(mobiles.studentsA[2]);
  const studentA9 = await login(mobiles.studentsA[8]);
  const studentB1 = await login(mobiles.studentsB[0]);
  assert.equal((await api("/auth/me", { cookie: adminA })).status, 200);

  const expiringCookie = await login(mobiles.studentsB[1]);
  const expiringSessionId = decodeURIComponent(expiringCookie.replace(/^session=/, ""));
  await prisma.sessionToken.update({ where: { sessionId: expiringSessionId }, data: { expiresAt: new Date(Date.now() - 1_000) } });
  assert.equal((await api("/auth/me", { cookie: expiringCookie })).status, 401);
  const logoutCookie = await login(mobiles.teacherA2);
  assert.equal((await api("/auth/logout", { method: "POST", cookie: logoutCookie })).status, 200);
  assert.equal((await api("/auth/me", { cookie: logoutCookie })).status, 401);
  evidence.authentication = { valid: "PASS", invalidCredentials: "PASS", expiredSession: "PASS", logout: "PASS", unauthenticated: "PASS" };

  const legacyQuestionPayload = {
    questionText: "What is 25% of 80?", questionType: "SINGLE_CHOICE", optionA: "10", optionB: "20", optionC: "25", optionD: "40",
    correctAnswer: "B", explanation: "Twenty-five percent of 80 is 20.", category: "Defence", subCategory: "NDA",
    topic: "Percentage", difficulty: "EASY", marks: 4, negativeMarks: 1, status: "ACTIVE",
  };
  const legacyCreated = await api<{ question: { id: string; status: string } }>("/examination/question-bank", {
    method: "POST", cookie: teacherA1, body: legacyQuestionPayload,
  });
  assert.equal(legacyCreated.status, 201);
  assert.equal(legacyCreated.body.question.status, "DRAFT");
  const legacyId = legacyCreated.body.question.id;
  const directLegacyActivation = await api(`/examination/question-bank/${legacyId}`, { method: "PUT", cookie: teacherA1, body: { status: "ACTIVE" } });
  assert.equal(directLegacyActivation.status, 400, `Legacy activation response: ${JSON.stringify(directLegacyActivation.body)}`);
  assert.equal((await api(`/examination/question-bank/${legacyId}/approve`, { method: "POST", cookie: teacherA2, body: { attestation: "TEACHER_REVIEW_CONFIRMED" } })).status, 404);
  assert.equal((await api(`/examination/question-bank/${legacyId}/approve`, { method: "POST", cookie: teacherA1, body: {} })).status, 400);
  const legacyApproved = await api<{ question: { status: string } }>(`/examination/question-bank/${legacyId}/approve`, {
    method: "POST", cookie: teacherA1, body: { attestation: "TEACHER_REVIEW_CONFIRMED" },
  });
  assert.equal(legacyApproved.status, 200);
  assert.equal(legacyApproved.body.question.status, "ACTIVE");
  assert.equal((await api("/examination/question-bank", { cookie: teacherB })).status, 200);
  evidence.legacyQuestionFlow = { draftByDefault: "PASS", directActivationBlocked: "PASS", ownershipEnforced: "PASS", explicitApproval: "PASS" };

  const create = await api<{ test: { id: string; status: string; isLive: boolean; questions: Array<{ id: string; reviewStatus: string }> } }>("/tests", {
    method: "POST", cookie: teacherA1, body: {
      title: "PHASE4 QA NDA Practice Test 01", description: "Real PostgreSQL staging lifecycle examination.", examType: "NDA", category: "Practice",
      subject: "Mathematics", topic: "NDA mixed science and mathematics", batchId: ids.batchA1, duration: 30, totalMarks: 40,
      questions,
    },
  });
  assert.equal(create.status, 201);
  const test = create.body.test;
  assert.equal(test.status, "DRAFT");
  assert.equal(test.isLive, false);
  assert.ok(test.questions.every((question) => question.reviewStatus === "DRAFT"));

  const publishBeforeApproval = await api(`/tests/${test.id}/publish`, { method: "POST", cookie: teacherA1, body: {} });
  assert.equal(publishBeforeApproval.status, 400);
  const teacherA2Read = await api(`/tests/${test.id}`, { cookie: teacherA2 });
  assert.equal(teacherA2Read.status, 403, `Teacher A2 read response: ${JSON.stringify(teacherA2Read.body)}`);
  const teacherBRead = await api(`/tests/${test.id}`, { cookie: teacherB });
  assert.equal(teacherBRead.status, 403, `Teacher B read response: ${JSON.stringify(teacherBRead.body)}`);

  const createB = await api<{ test: { id: string } }>("/tests", {
    method: "POST", cookie: teacherB, body: {
      title: "PHASE4 QA Institution B Draft", description: "Cross-tenant isolation control examination.", examType: "NDA", category: "Practice",
      subject: "Mathematics", topic: "Isolation", batchId: ids.batchB1, duration: 10, totalMarks: 4, questions: [questions[0]],
    },
  });
  assert.equal(createB.status, 201);
  assert.equal((await api(`/tests/${createB.body.test.id}`, { cookie: directorA })).status, 403);
  assert.equal((await api(`/tests/${createB.body.test.id}`, { cookie: teacherA1 })).status, 403);

  assert.equal((await api(`/tests/${test.id}/approve`, { method: "POST", cookie: teacherA2, body: { attestation: "TEACHER_REVIEW_CONFIRMED", questionIds: test.questions.map((question) => question.id) } })).status, 403);
  const approval = await api<{ test: { status: string } }>(`/tests/${test.id}/approve`, { method: "POST", cookie: teacherA1, body: { attestation: "TEACHER_REVIEW_CONFIRMED", questionIds: test.questions.map((question) => question.id) } });
  assert.equal(approval.status, 200);
  assert.equal(approval.body.test.status, "APPROVED");
  const published = await api<{ test: { status: string; isLive: boolean } }>(`/tests/${test.id}/publish`, { method: "POST", cookie: teacherA1, body: {} });
  assert.equal(published.status, 200);
  assert.equal(published.body.test.status, "PUBLISHED");
  assert.equal(published.body.test.isLive, true);
  evidence.authorization = { teacherOwnership: "PASS", crossInstitution: "PASS", unauthorizedApproval: "PASS", directorTenantScope: "PASS" };

  const availableA1 = await api<{ tests: Array<{ id: string }> }>("/tests/available", { cookie: studentA1 });
  assert.equal(availableA1.status, 200);
  assert.ok(availableA1.body.tests.some((item) => item.id === test.id));
  const availableA2 = await api<{ tests: Array<{ id: string }> }>("/tests/available", { cookie: studentA9 });
  assert.equal(availableA2.status, 200);
  assert.ok(!availableA2.body.tests.some((item) => item.id === test.id));
  assert.equal((await api(`/tests/${test.id}`, { cookie: studentA9 })).status, 403);
  assert.equal((await api(`/tests/${test.id}`, { cookie: studentB1 })).status, 403);
  const studentPaper = await api<{ test: { questions: Array<Record<string, unknown>> } }>(`/tests/${test.id}`, { cookie: studentA1 });
  assert.equal(studentPaper.status, 200);
  assert.ok(studentPaper.body.test.questions.every((question) => !("correctAnswer" in question) && !("explanation" in question)));
  assert.equal((await api(`/tests/${createB.body.test.id}`, { cookie: studentB1 })).status, 403);
  evidence.assignment = { assignedBatchVisible: "PASS", otherBatchHidden: "PASS", unpublishedHidden: "PASS" };

  const started = await api<{ attempt: { id: string; test: { questions: Array<{ id: string }> } } }>("/tests/start", { method: "POST", cookie: studentA1, body: { testId: test.id } });
  assert.equal(started.status, 201);
  const attemptId = started.body.attempt.id;
  const answerPlan = test.questions.slice(0, 9).map((question, index) => ({
    questionId: question.id,
    selectedAnswer: index < 7 ? questions[index].correctAnswer : questions[index].correctAnswer === "A" ? "B" : "A",
    status: "ANSWERED",
    markedForReview: index === 4,
    timeSpent: 12,
  }));
  const autosave = await api<{ attempt: { answerStates: Array<{ questionId: string; selectedAnswer?: string }> } }>("/tests/autosave", {
    method: "POST", cookie: studentA1, body: { attemptId, currentQuestionId: test.questions[4].id, sectionState: { section: "Mixed" }, answers: answerPlan.slice(0, 5) },
  });
  assert.equal(autosave.status, 200);
  assert.equal(autosave.body.attempt.answerStates.filter((item) => item.selectedAnswer).length, 5);
  await fetch("http://127.0.0.1:1/disconnected").catch(() => undefined);
  const resumed = await api<{ attempt: { answerStates: Array<{ selectedAnswer?: string }> } }>(`/tests/attempts/${attemptId}/resume`, { cookie: studentA1 });
  assert.equal(resumed.status, 200);
  assert.equal(resumed.body.attempt.answerStates.filter((item) => item.selectedAnswer).length, 5);

  const submitBody = { attemptId, answers: answerPlan, timeTaken: 120 };
  const submissions = await Promise.all([
    api<{ result: { id: string; score: number; totalCorrect: number; totalWrong: number } }>("/tests/submit", { method: "POST", cookie: studentA1, body: submitBody }),
    api<{ result: { id: string; score: number; totalCorrect: number; totalWrong: number } }>("/tests/submit", { method: "POST", cookie: studentA1, body: submitBody }),
  ]);
  assert.ok(submissions.every((item) => item.status === 200 || item.status === 409));
  assert.ok(submissions.some((item) => item.status === 200));
  const completed = submissions.find((item) => item.status === 200)!.body.result;
  assert.equal(completed.score, 26);
  assert.equal(completed.totalCorrect, 7);
  assert.equal(completed.totalWrong, 2);

  const result = await api<{ resultsReleased: boolean; attempt: { score: number; totalCorrect: number; totalWrong: number }; analytics: { accuracy: number } }>(`/tests/result/${attemptId}`, { cookie: studentA1 });
  assert.equal(result.status, 200);
  assert.equal(result.body.attempt.score, 26);
  assert.equal(result.body.attempt.totalCorrect, 7);
  assert.equal(result.body.attempt.totalWrong, 2);
  assert.equal(result.body.analytics.accuracy, 78);
  assert.equal((await api(`/tests/result/${attemptId}`, { cookie: studentA9 })).status, 404);
  assert.equal((await api(`/tests/result/${attemptId}`, { cookie: studentB1 })).status, 404);

  const [attemptCount, answerCount, analytics, ndpReview, submittedAttempts] = await Promise.all([
    prisma.testAttempt.count({ where: { id: attemptId, status: "SUBMITTED" } }),
    prisma.answer.count({ where: { attemptId } }),
    prisma.performanceAnalytics.findUnique({ where: { userId: "phase4-student-a-1" } }),
    prisma.ndpReview.findFirst({ where: { studentId: "phase4-student-a-1", batchId: ids.batchA1 }, include: { entries: true }, orderBy: { updatedAt: "desc" } }),
    prisma.testAttempt.findMany({
      where: { userId: "phase4-student-a-1", status: "SUBMITTED", submittedAt: { not: null } },
      include: { answers: { select: { isCorrect: true } }, test: { select: { totalMarks: true } } },
    }),
  ]);
  const submittedAnswers = submittedAttempts.flatMap((item) => item.answers);
  const expectedCumulativeAccuracy = submittedAnswers.length
    ? Math.round((submittedAnswers.filter((answer) => answer.isCorrect).length / submittedAnswers.length) * 100)
    : 0;
  const expectedAverageScore = submittedAttempts.length
    ? Math.round(submittedAttempts.reduce((sum, item) => sum + (item.test.totalMarks > 0 ? (item.score / item.test.totalMarks) * 100 : 0), 0) / submittedAttempts.length)
    : 0;
  assert.equal(attemptCount, 1);
  assert.equal(answerCount, 9);
  assert.equal(analytics?.testAccuracy, expectedCumulativeAccuracy);
  assert.equal(analytics?.averageScore, expectedAverageScore);
  assert.equal(ndpReview?.status, "DRAFT");
  assert.ok(ndpReview?.entries.some((entry) => entry.category === "TEST_PERFORMANCE" && entry.item === "PHASE4 QA NDA Practice Test 01"));
  evidence.lifecycle = { draft: "PASS", approval: "PASS", publish: "PASS", assignment: "PASS", start: "PASS", autosave: "PASS", reconnect: "PASS", submit: "PASS", result: "PASS" };
  evidence.scoring = { expected: 26, persisted: completed.score, correct: 7, wrong: 2, unanswered: 1, accuracy: 78 };
  const concurrencyRuns = [{ statuses: submissions.map((item) => item.status), attempts: attemptCount, answers: answerCount }];
  const repeatStudentCookies = [studentA2, studentA3];
  for (let runIndex = 0; runIndex < 2; runIndex += 1) {
    const repeatStudent = repeatStudentCookies[runIndex];
    const repeatStart = await api<{ attempt: { id: string } }>("/tests/start", {
      method: "POST", cookie: repeatStudent, body: { testId: test.id },
    });
    assert.equal(repeatStart.status, 201);
    const repeatAttemptId = repeatStart.body.attempt.id;
    const repeatBody = { attemptId: repeatAttemptId, answers: answerPlan, timeTaken: 120 };
    const repeatSubmissions = await Promise.all([
      api("/tests/submit", { method: "POST", cookie: repeatStudent, body: repeatBody }),
      api("/tests/submit", { method: "POST", cookie: repeatStudent, body: repeatBody }),
    ]);
    const repeatStatuses = repeatSubmissions.map((item) => item.status);
    assert.ok(repeatStatuses.every((status) => status === 200 || status === 409));
    assert.ok(repeatStatuses.includes(200));
    const [repeatAttemptCount, repeatAnswerCount] = await Promise.all([
      prisma.testAttempt.count({ where: { id: repeatAttemptId, status: "SUBMITTED" } }),
      prisma.answer.count({ where: { attemptId: repeatAttemptId } }),
    ]);
    assert.equal(repeatAttemptCount, 1);
    assert.equal(repeatAnswerCount, 9);
    concurrencyRuns.push({ statuses: repeatStatuses, attempts: repeatAttemptCount, answers: repeatAnswerCount });
  }
  evidence.concurrency = { runs: concurrencyRuns.length, results: concurrencyRuns };
  evidence.ndp = { performanceAnalytics: "PASS", draftReviewUpdated: "PASS", teacherApprovalPreserved: ndpReview?.status === "DRAFT" };
  evidence.answerSecurity = { activePaperSanitized: "PASS", otherStudentResultDenied: "PASS", crossTenantDenied: "PASS", unpublishedExamDenied: "PASS" };

  const orphanRows = await prisma.$queryRaw<Array<{ count: number }>>`
    SELECT COUNT(*)::int AS count
    FROM "Answer" answer
    LEFT JOIN "TestAttempt" attempt ON attempt."id" = answer."attemptId"
    WHERE attempt."id" IS NULL
  `;
  evidence.integrity = { duplicateFinalResults: attemptCount !== 1 ? 1 : 0, duplicateAnswers: answerCount !== 9 ? answerCount : 0, orphanAnswers: orphanRows[0]?.count ?? -1 };
  console.log(JSON.stringify(evidence, null, 2));
}

run()
  .catch((error) => {
    console.error(error instanceof Error ? error.stack ?? error.message : String(error));
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
