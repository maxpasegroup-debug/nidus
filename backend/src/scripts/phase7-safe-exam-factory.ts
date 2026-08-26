import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { prisma } from "../config/prisma.js";
import { Role, type Prisma } from "../generated/prisma/client.js";
import { ndiePublisherService } from "../modules/ndie/publisher/publisher.service.js";
import { ndieService } from "../modules/ndie/ndie.service.js";
import { ndieReviewEngineService } from "../modules/ndie/review-engine/review-engine.service.js";
import { testsService } from "../modules/tests/tests.service.js";

const teacherId = "phase4-teacher-a1";
const secondTeacherId = "phase4-teacher-a2";
const studentId = "phase4-student-a-1";
const batchA1 = "phase4-batch-a1";
const batchA2 = "phase4-batch-a2";
const importId = "phase7-safe-factory-import";

function assertStaging() {
  const url = new URL(process.env.DATABASE_URL ?? "");
  const database = url.pathname.replace(/^\//, "");
  assert.ok(["127.0.0.1", "localhost", "::1"].includes(url.hostname), "Phase 7 may only use local PostgreSQL");
  assert.match(database, /^nidus_staging_/i, "Phase 7 database name must start with nidus_staging_");
  return database;
}

function questionCandidate(index: number) {
  const subject = index <= 10 ? "Mathematics" : index <= 20 ? "Physics" : "Chemistry";
  const optionValues = [`${index + 1}`, `${index + 2}`, `${index + 3}`, `${index + 4}`];
  const text = subject === "Mathematics"
    ? `If x + ${index} = ${index + 4}, what is x?`
    : subject === "Physics"
      ? `A ${index} N force acts on a body. Which listed value equals the stated force?`
      : `Which option identifies the test value ${index} for this verified chemistry item?`;
  const visualId = index === 22 ? "phase7-diagram-asset" : null;
  return {
    questionNumber: String(index),
    questionType: "SINGLE_CORRECT_MCQ",
    sourceFingerprint: createHash("sha256").update(`${importId}:page:${Math.ceil(index / 5)}:question:${index}`).digest("hex"),
    sourceMap: { firstPage: Math.ceil(index / 5), coordinates: { x: 0.1, y: ((index - 1) % 5) * 0.18, width: 0.8, height: 0.15 } },
    candidateJson: {
      schemaVersion: 1,
      format: "NIDUS_NDIE_EXTRACTION_CANDIDATE_V1",
      assessment: {
        text,
        marks: 4,
        difficulty: "MEDIUM",
        options: ["A", "B", "C", "D"].map((key, optionIndex) => ({ key, text: optionValues[optionIndex] })),
        diagnostics: { issues: [] }
      },
      blocks: [
        { id: `q${index}-text`, type: "ParagraphBlock", text },
        ...(index === 3 ? [{ id: "q3-formula", type: "FormulaBlock", latex: "x=\\frac{12}{3}" }] : []),
        ...(visualId ? [{ id: "q22-image", type: "ImageBlock", url: "/staging/phase7-diagram.png", alt: "Teacher verified diagram" }] : []),
        ...["A", "B", "C", "D"].map((key, optionIndex) => ({ id: `q${index}-${key}`, type: "OptionBlock", key, blocks: [{ id: `q${index}-${key}-text`, type: "ParagraphBlock", text: optionValues[optionIndex] }] }))
      ],
      metadata: { marks: 4, subject, visualLinks: visualId ? [visualId] : [], formulaLinks: index === 3 ? ["q3-formula"] : [] }
    } as Prisma.InputJsonValue,
    answerJson: { correctOption: "D" } as Prisma.InputJsonValue
  };
}

async function seedImport() {
  await prisma.ndieImportJob.deleteMany({ where: { id: importId } });
  await prisma.test.deleteMany({ where: { title: { startsWith: "PHASE7" } } });
  await prisma.teacherBatchAssignment.upsert({
    where: { batchId_teacherId_subject: { batchId: batchA1, teacherId, subject: "NDA Mixed STEM" } },
    update: { status: "ACTIVE" },
    create: { batchId: batchA1, teacherId, subject: "NDA Mixed STEM", status: "ACTIVE" }
  });
  await prisma.ndieImportJob.create({
    data: {
      id: importId,
      batchId: batchA1,
      subject: "NDA Mixed STEM",
      topic: "Teacher verified practice",
      sourceKind: "QUESTION_PAPER",
      status: "READY_FOR_TEACHER_REVIEW",
      uploadedBy: teacherId,
      sourceDocuments: {
        create: {
          id: "phase7-safe-source",
          originalName: "phase7-staging-safe-factory.pdf",
          fileName: "phase7-staging-safe-factory.pdf",
          fileType: "application/pdf",
          fileSize: 4096,
          storageProvider: "local-staging",
          storageUrl: "/staging/phase7-safe-factory.pdf",
          storagePublicId: "phase7-safe-factory",
          checksum: createHash("sha256").update("phase7-staging-safe-factory").digest("hex"),
          documentClass: "MIXED_DOCUMENT",
          pipeline: "STAGING_FACTORY",
          pageCount: 6,
          uploadedBy: teacherId
        }
      }
    }
  });
  await prisma.ndiePageAsset.create({
    data: {
      id: "phase7-diagram-asset",
      importJobId: importId,
      sourceDocumentId: "phase7-safe-source",
      assetType: "DIAGRAM",
      role: "QUESTION_VISUAL",
      pageNumber: 5,
      storageProvider: "local-staging",
      url: "/staging/phase7-diagram.png",
      publicId: "phase7-diagram"
    }
  });
  for (let index = 1; index <= 30; index += 1) {
    const row = questionCandidate(index);
    const candidate = await prisma.ndieQuestionCandidate.create({
      data: {
        importJobId: importId,
        questionNumber: row.questionNumber,
        questionType: row.questionType,
        sourceFingerprint: row.sourceFingerprint,
        sourceMap: row.sourceMap,
        candidateJson: row.candidateJson,
        confidence: 0.75,
        status: "PENDING_REVIEW",
        reviewStatus: "PENDING_REVIEW"
      }
    });
    await prisma.ndieAnswerKeyCandidate.create({
      data: { importJobId: importId, questionCandidateId: candidate.id, sourceDocumentId: "phase7-safe-source", questionNumber: row.questionNumber, answerJson: row.answerJson, status: "TEACHER_CORRECTED" }
    });
  }
}

async function runSafeFactory() {
  const teacher = await prisma.user.findUniqueOrThrow({ where: { id: teacherId } });
  const candidates = await prisma.ndieQuestionCandidate.findMany({ where: { importJobId: importId }, orderBy: { questionNumber: "asc" } });
  assert.equal(candidates.length, 30);

  await ndieReviewEngineService.reviewCandidate({ candidateId: candidates[0].id, decision: "REJECTED", reviewedBy: teacherId, reviewedByRole: Role.TEACHER });
  const corrected = structuredClone(candidates[0].candidateJson) as Record<string, unknown>;
  const assessment = corrected.assessment as Record<string, unknown>;
  assessment.text = `${String(assessment.text)} (teacher verified)`;
  await ndieReviewEngineService.reviewCandidate({ candidateId: candidates[0].id, decision: "NEEDS_EDIT", candidateJson: corrected, answerJson: { correctOption: "D" }, reviewedBy: teacherId, reviewedByRole: Role.TEACHER });
  const revoked = await prisma.ndieQuestionCandidate.findUniqueOrThrow({ where: { id: candidates[0].id } });
  assert.equal(revoked.reviewStatus, "NEEDS_EDIT");

  for (const candidate of candidates) {
    await ndieReviewEngineService.reviewCandidate({ candidateId: candidate.id, decision: "APPROVED", reviewedBy: teacherId, reviewedByRole: Role.TEACHER });
  }

  const published = await ndiePublisherService.publish({
    importJobId: importId,
    requester: { id: teacher.id, role: teacher.role, roleMetadata: teacher.roleMetadata as Record<string, unknown> },
    title: "PHASE7 Safe Exam Factory",
    description: "Staging-only teacher verified 30-question NDA exam.",
    batchId: batchA1,
    subject: "NDA Mixed STEM",
    topic: "Teacher verified practice",
    duration: 45
  });
  assert.equal(published.questionsPublished, 30);
  const testId = published.testId;
  const before = await prisma.question.findFirstOrThrow({ where: { testId }, orderBy: { id: "asc" } });
  await ndieReviewEngineService.reviewCandidate({
    candidateId: candidates[0].id, decision: "NEEDS_EDIT", candidateJson: { alteredAfterPublish: true },
    reviewedBy: teacherId, reviewedByRole: Role.TEACHER
  });
  const after = await prisma.question.findUniqueOrThrow({ where: { id: before.id } });
  assert.equal(after.questionText, before.questionText);
  assert.equal(after.correctAnswer, before.correctAnswer);

  const attempt = await testsService.start(studentId, Role.STUDENT, testId);
  const active = attempt as unknown as { id: string; test: { questions: Array<{ id: string; correctAnswer?: string }> } };
  const questions = await prisma.question.findMany({ where: { testId }, orderBy: { id: "asc" } });
  await testsService.saveState(studentId, {
    attemptId: active.id,
    answers: questions.map((question) => ({ questionId: question.id, selectedAnswer: question.correctAnswer, status: "ANSWERED" }))
  });
  const result = await testsService.submitFromSavedState(studentId, active.id, "PHASE7_SAFE_FACTORY");
  assert.equal(result.totalCorrect, 30);
  assert.equal(await prisma.testAttempt.count({ where: { id: active.id, status: "SUBMITTED" } }), 1);
  assert.ok(await prisma.performanceAnalytics.findUnique({ where: { userId: studentId } }));
  return { importId, testId, questions: 30, approved: 30, score: result.score, snapshotImmutable: true, ndpUpdated: true };
}

async function runSecurityRegression() {
  const [owner, collaborator, otherTenant, student] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: teacherId } }),
    prisma.user.findUniqueOrThrow({ where: { id: secondTeacherId } }),
    prisma.user.findUniqueOrThrow({ where: { id: "phase4-teacher-b" } }),
    prisma.user.findUniqueOrThrow({ where: { id: studentId } })
  ]);
  await prisma.teacherBatchAssignment.upsert({
    where: { batchId_teacherId_subject: { batchId: batchA1, teacherId: collaborator.id, subject: "NDA Mixed STEM" } },
    update: { status: "ACTIVE" },
    create: { batchId: batchA1, teacherId: collaborator.id, subject: "NDA Mixed STEM", status: "ACTIVE" }
  });
  const actor = (user: typeof owner) => ({
    id: user.id, role: user.role, instituteId: user.instituteId, branchId: user.branchId,
    roleMetadata: user.roleMetadata as Record<string, unknown> | null
  });
  const candidate = await prisma.ndieQuestionCandidate.findFirstOrThrow({ where: { importJobId: importId } });
  assert.ok(await ndieService.getImport(actor(owner), importId));
  assert.ok(await ndieService.getReviewWorkspace(actor(collaborator), importId));
  await assert.rejects(
    () => ndieService.reviewCandidate(actor(collaborator), { candidateId: candidate.id, decision: "APPROVED", reviewedBy: collaborator.id, reviewedByRole: collaborator.role }),
    /access denied/i
  );
  await assert.rejects(() => ndieService.publish({ importJobId: importId, requester: actor(collaborator), title: "Unauthorized" }), /access denied/i);
  await assert.rejects(() => ndieService.getImport(actor(otherTenant), importId), /access denied/i);
  await assert.rejects(() => ndieService.getImport(actor(student), importId), /access denied/i);
  return {
    ownerAccess: "ALLOWED", assignedTeacherRead: "ALLOWED", assignedTeacherApproval: "DENIED",
    assignedTeacherPublish: "DENIED", crossTenantAccess: "DENIED", studentSourceAccess: "DENIED"
  };
}

function simulationQuestion(exam: number, question: number) {
  return {
    questionText: `PHASE7 EXAM ${exam} QUESTION ${question}: Which option is correct?`,
    optionA: "One", optionB: "Two", optionC: "Three", optionD: "Four", correctAnswer: "A",
    explanation: "Teacher verified staging answer.", marks: 1, negativeMarks: 0.25,
    difficultyLevel: "MEDIUM", topic: `Simulation ${exam}`, reviewStatus: "DRAFT"
  };
}

async function runThirtyExamSimulation() {
  const teachers = await Promise.all([teacherId, secondTeacherId].map((id) => prisma.user.findUniqueOrThrow({ where: { id } })));
  const tests: Array<{ id: string; teacherId: string; batchId: string }> = [];
  for (let exam = 1; exam <= 30; exam += 1) {
    const teacher = teachers[(exam - 1) % 2];
    const batchId = exam % 2 ? batchA1 : batchA2;
    const requester = { id: teacher.id, role: teacher.role, instituteId: teacher.instituteId, branchId: teacher.branchId, roleMetadata: teacher.roleMetadata as Record<string, unknown> };
    const created = await testsService.create(requester, {
      title: `PHASE7 SIMULATION EXAM ${exam}`,
      description: "Staging-only cross-exam isolation simulation.", examType: "NDA", category: "Practice",
      subject: "Mathematics", topic: `Simulation ${exam}`, batchId, duration: 30, totalMarks: 30,
      questions: Array.from({ length: 30 }, (_, index) => simulationQuestion(exam, index + 1))
    });
    await testsService.approve(requester, created.id, { attestation: "TEACHER_REVIEW_CONFIRMED", questionIds: created.questions.map((question) => question.id) });
    await testsService.publishApproved(requester, created.id);
    tests.push({ id: created.id, teacherId: teacher.id, batchId });
  }
  assert.equal(tests.length, 30);
  for (let index = 0; index < tests.length; index += 1) {
    const questions = await prisma.question.findMany({ where: { testId: tests[index].id }, select: { questionText: true } });
    assert.equal(questions.length, 30);
    assert.ok(questions.every((question) => question.questionText.startsWith(`PHASE7 EXAM ${index + 1} QUESTION`)));
  }
  const firstTeacher = teachers[0];
  const foreign = tests.find((test) => test.teacherId !== firstTeacher.id)!;
  await assert.rejects(() => testsService.details({ id: firstTeacher.id, role: firstTeacher.role, instituteId: firstTeacher.instituteId, branchId: firstTeacher.branchId }, foreign.id), /own exams|access/i);
  return { exams: 30, questions: 900, crossExamContamination: 0, unauthorizedTeacherAccess: "DENIED" };
}

async function runReviewWorkspaceScale() {
  await prisma.ndieImportJob.deleteMany({ where: { topic: { startsWith: "PHASE7 review scale" } } });
  const results = [];
  for (const count of [10, 25, 50]) {
    const scaleImportId = `phase7-review-scale-${count}`;
    const sourceId = `${scaleImportId}-source`;
    await prisma.ndieImportJob.create({
      data: {
        id: scaleImportId, subject: "Mathematics", topic: `PHASE7 review scale ${count}`,
        sourceKind: "QUESTION_PAPER", status: "READY_FOR_TEACHER_REVIEW", uploadedBy: teacherId,
        sourceDocuments: { create: {
          id: sourceId, originalName: `${scaleImportId}.pdf`, fileName: `${scaleImportId}.pdf`, fileType: "application/pdf",
          fileSize: 1024, storageProvider: "local-staging", storageUrl: `/staging/${scaleImportId}.pdf`,
          storagePublicId: scaleImportId,
          checksum: createHash("sha256").update(scaleImportId).digest("hex"), documentClass: "MATHEMATICS_EXAM",
          pipeline: "STAGING_REVIEW_QA", pageCount: Math.ceil(count / 5), uploadedBy: teacherId
        } }
      }
    });
    await prisma.ndieQuestionCandidate.createMany({
      data: Array.from({ length: count }, (_, offset) => ({
        importJobId: scaleImportId, questionNumber: String(offset + 1), questionType: "SINGLE_CORRECT_MCQ",
        sourceFingerprint: createHash("sha256").update(`${scaleImportId}:${offset + 1}`).digest("hex"),
        sourceMap: { firstPage: Math.ceil((offset + 1) / 5) }, candidateJson: questionCandidate((offset % 30) + 1).candidateJson,
        confidence: 0.7, status: "PENDING_REVIEW", reviewStatus: "PENDING_REVIEW"
      }))
    });
    const startedAt = performance.now();
    const workspace = await ndieReviewEngineService.getReviewWorkspace(scaleImportId);
    const loadMs = Math.round((performance.now() - startedAt) * 100) / 100;
    assert.equal(workspace?.questionCandidates.length, count);
    const selected = workspace!.questionCandidates[Math.floor(count / 2)];
    await ndieReviewEngineService.saveReviewSession({
      importJobId: scaleImportId, selectedCandidateId: selected.id, selectedPageNumber: Math.ceil(count / 10),
      filters: { status: "PENDING_REVIEW" }, scroll: { questionIndex: Math.floor(count / 2) },
      savedBy: teacherId, savedByRole: Role.TEACHER
    });
    const restored = await ndieReviewEngineService.getReviewWorkspace(scaleImportId);
    const session = (restored?.teacherSummary as { reviewSession?: { selectedCandidateId?: string } } | null)?.reviewSession;
    assert.equal(session?.selectedCandidateId, selected.id);
    results.push({ questions: count, loadMs, selectedQuestionRestored: true, missingQuestions: 0 });
  }
  return results;
}

async function run() {
  const database = assertStaging();
  await Promise.all([teacherId, secondTeacherId, studentId, batchA1, batchA2].map(async (id) => {
    const exists = id.includes("batch") ? await prisma.batch.findUnique({ where: { id } }) : await prisma.user.findUnique({ where: { id } });
    assert.ok(exists, `Required Phase 4 staging fixture is missing: ${id}`);
  }));
  await seedImport();
  const security = await runSecurityRegression();
  const safeFactory = await runSafeFactory();
  const simulation = await runThirtyExamSimulation();
  const reviewWorkspace = await runReviewWorkspaceScale();
  console.log(JSON.stringify({ database, security, safeFactory, simulation, reviewWorkspace, status: "PASS" }, null, 2));
}

run().catch((error) => {
  console.error(error instanceof Error ? error.stack ?? error.message : String(error));
  process.exitCode = 1;
}).finally(() => prisma.$disconnect());
