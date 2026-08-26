import assert from "node:assert/strict";
import { prisma } from "../config/prisma.js";
import { safeMediaFileName } from "../config/cloudinary.js";

const apiBase = process.env.NIDUS_PHASE5_API_URL ?? "http://127.0.0.1:8180/api";
const testPin = process.env.NIDUS_PHASE5_TEST_PIN;

function assertDisposableStaging() {
  const url = new URL(process.env.DATABASE_URL ?? "");
  const database = url.pathname.replace(/^\//, "");
  assert.ok(["127.0.0.1", "localhost", "::1"].includes(url.hostname));
  assert.match(database, /^nidus_staging_/i);
  assert.match(apiBase, /^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?\/api$/);
  assert.ok(testPin && /^\d{4}$/.test(testPin));
  return database;
}

async function api(path: string, options: { method?: string; cookie?: string; body?: unknown; ip?: string } = {}) {
  const method = options.method ?? "GET";
  const sendsJson = !["GET", "HEAD"].includes(method.toUpperCase());
  const response = await fetch(`${apiBase}${path}`, {
    method,
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
  return { status: response.status, body: body as Record<string, any>, cookie: session ? `session=${session}` : undefined };
}

async function login(mobile: string, ip: string) {
  const response = await api("/auth/login", { method: "POST", ip, body: { mobile, pin: testPin } });
  assert.equal(response.status, 200, `Login failed for ${mobile}: ${JSON.stringify(response.body)}`);
  assert.ok(response.cookie);
  return response.cookie;
}

async function upload(cookie: string, bytes: Uint8Array, mimeType: string, name: string, ip: string) {
  const form = new FormData();
  form.set("file", new Blob([Uint8Array.from(bytes).buffer], { type: mimeType }), name);
  const response = await fetch(`${apiBase}/media/upload`, {
    method: "POST",
    headers: { cookie, "x-forwarded-for": ip },
    body: form,
  });
  return { status: response.status, body: await response.text() };
}

async function run() {
  const database = assertDisposableStaging();
  const teacherA = await login("9100000011", "198.19.1.1");
  const teacherB = await login("9200000011", "198.19.1.2");
  const student = await login("9100000104", "198.19.1.3");

  const authChecks = await Promise.all(Array.from({ length: 40 }, () => api("/auth/me", { cookie: teacherA, ip: "198.19.1.1" })));
  assert.ok(authChecks.every((response) => response.status === 200), "Authenticated profile reads must not consume the credential-attempt limiter");

  await prisma.mediaFile.deleteMany({ where: { id: { startsWith: "phase5-media-" } } });
  await prisma.document.deleteMany({ where: { id: { startsWith: "phase5-document-" } } });
  await prisma.mediaFile.createMany({
    data: [
      { id: "phase5-media-a", fileName: "a.png", originalName: "a.png", fileType: "image/png", fileSize: 8, cloudinaryUrl: "https://invalid.test/a", publicId: "phase5/a", uploadedBy: "phase4-teacher-a1" },
      { id: "phase5-media-b", fileName: "b.png", originalName: "b.png", fileType: "image/png", fileSize: 8, cloudinaryUrl: "https://invalid.test/b", publicId: "phase5/b", uploadedBy: "phase4-teacher-b" },
    ],
  });
  await prisma.document.createMany({
    data: [
      { id: "phase5-document-a", title: "Institution A exam asset", category: "Exam", fileUrl: "https://invalid.test/a.pdf", uploadedBy: "phase4-teacher-a1" },
      { id: "phase5-document-b", title: "Institution B exam asset", category: "Exam", fileUrl: "https://invalid.test/b.pdf", uploadedBy: "phase4-teacher-b" },
    ],
  });

  const [filesA, filesB, documentsA, studentFiles] = await Promise.all([
    api("/media/files", { cookie: teacherA, ip: "198.19.1.1" }),
    api("/media/files", { cookie: teacherB, ip: "198.19.1.2" }),
    api("/documents", { cookie: teacherA, ip: "198.19.1.1" }),
    api("/media/files", { cookie: student, ip: "198.19.1.3" }),
  ]);
  assert.equal(filesA.status, 200);
  assert.ok(filesA.body.files.some((file: { id: string }) => file.id === "phase5-media-a"));
  assert.ok(!filesA.body.files.some((file: { id: string }) => file.id === "phase5-media-b"));
  assert.equal(filesB.status, 200);
  assert.ok(filesB.body.files.some((file: { id: string }) => file.id === "phase5-media-b"));
  assert.ok(!filesB.body.files.some((file: { id: string }) => file.id === "phase5-media-a"));
  assert.ok(documentsA.body.documents.some((document: { id: string }) => document.id === "phase5-document-a"));
  assert.ok(!documentsA.body.documents.some((document: { id: string }) => document.id === "phase5-document-b"));
  assert.equal(studentFiles.status, 403);
  assert.notEqual((await api("/media/files/phase5-media-b", { method: "DELETE", cookie: teacherA, ip: "198.19.1.1" })).status, 200);
  assert.equal(await prisma.mediaFile.count({ where: { id: "phase5-media-b" } }), 1);

  const spoofedImage = await upload(teacherA, new TextEncoder().encode("not a png"), "image/png", "../../exam.png", "198.19.1.1");
  assert.equal(spoofedImage.status, 400);
  assert.match(spoofedImage.body, /does not match/i);
  assert.equal(safeMediaFileName("../../unsafe exam.png"), "unsafe-exam.png");
  const validPngWithoutProvider = await upload(teacherA, Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), "image/png", "valid.png", "198.19.1.1");
  assert.equal(validPngWithoutProvider.status, 400);
  assert.match(validPngWithoutProvider.body, /Cloudinary is not configured/i);

  await prisma.test.deleteMany({ where: { title: { startsWith: "PHASE5 TIMER" } } });
  const created = await api("/tests", {
    method: "POST",
    cookie: teacherA,
    ip: "198.19.1.1",
    body: {
      title: `PHASE5 TIMER ${Date.now()}`,
      description: "Disposable staging server-timer verification.",
      examType: "NDA",
      category: "Reliability QA",
      subject: "Mathematics",
      topic: "Arithmetic",
      batchId: "phase4-batch-a1",
      duration: 1,
      totalMarks: 4,
      questions: [{
        questionText: "What is 2 + 3?",
        optionA: "4",
        optionB: "5",
        optionC: "6",
        optionD: "7",
        correctAnswer: "B",
        explanation: "Two plus three is five.",
        topic: "Arithmetic",
        marks: 4,
        negativeMarks: 1,
        difficultyLevel: "EASY",
        reviewStatus: "DRAFT",
      }],
    },
  });
  assert.equal(created.status, 201);
  const testId = created.body.test.id as string;
  const questionId = created.body.test.questions[0].id as string;
  assert.equal((await api(`/tests/${testId}/approve`, { method: "POST", cookie: teacherA, ip: "198.19.1.1", body: { attestation: "TEACHER_REVIEW_CONFIRMED", questionIds: [questionId] } })).status, 200);
  assert.equal((await api(`/tests/${testId}/publish`, { method: "POST", cookie: teacherA, ip: "198.19.1.1", body: { batchId: "phase4-batch-a1" } })).status, 200);
  const started = await api("/tests/start", { method: "POST", cookie: student, ip: "198.19.1.3", body: { testId } });
  assert.equal(started.status, 201);
  const attemptId = started.body.attempt.id as string;
  assert.equal((await api("/tests/autosave", { method: "POST", cookie: student, ip: "198.19.1.3", body: { attemptId, currentQuestionId: questionId, answers: [{ questionId, selectedAnswer: "B", status: "ANSWERED" }] } })).status, 200);
  await prisma.testAttempt.update({ where: { id: attemptId }, data: { startedAt: new Date(Date.now() - 70_000) } });
  const expiredResume = await api(`/tests/attempts/${attemptId}/resume`, { cookie: student, ip: "198.19.1.3" });
  assert.equal(expiredResume.status, 200);
  const expiredAttempt = await prisma.testAttempt.findUniqueOrThrow({ where: { id: attemptId }, include: { answers: true } });
  assert.equal(expiredAttempt.status, "SUBMITTED");
  assert.ok(expiredAttempt.timeTaken >= 60 && expiredAttempt.timeTaken < 999_999);
  assert.equal(expiredAttempt.answers.length, 1);
  assert.equal((expiredAttempt.sectionState as { submitReason?: string } | null)?.submitReason, "TIMER_EXPIRED");

  console.log(JSON.stringify({
    database,
    authLimiter: { profileReads: 40, result: "PASS" },
    storage: {
      institutionIsolation: "PASS",
      studentAccessDenied: "PASS",
      crossTenantDeleteDenied: "PASS",
      mimeSpoofRejected: "PASS",
      filenameSanitized: "PASS",
      providerUpload: "BLOCKED_ENVIRONMENT_CLOUDINARY",
    },
    timer: {
      serverAuthoritative: "PASS",
      expiredAttemptAutoSubmitted: "PASS",
      clientTimeIgnored: "PASS",
      submitReason: "TIMER_EXPIRED",
    },
  }, null, 2));
}

run()
  .catch((error) => {
    console.error(error instanceof Error ? error.stack ?? error.message : String(error));
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
