import assert from "node:assert/strict";
import { prisma } from "../config/prisma.js";

function assertDisposableStaging() {
  const url = new URL(process.env.DATABASE_URL ?? "");
  const database = url.pathname.replace(/^\//, "");
  assert.ok(["127.0.0.1", "localhost", "::1"].includes(url.hostname), "Phase 8 integrity checks may only use local PostgreSQL");
  assert.match(database, /^nidus_staging_/i, "Phase 8 database must start with nidus_staging_");
  return database;
}

const database = assertDisposableStaging();

const [
  duplicateAttempts,
  duplicateAnswers,
  duplicateAnswerStates,
  orphanAnswers,
  orphanAnswerStates,
  submittedWithoutTimestamp,
  publishedWithoutApproval,
  publishedWithoutSnapshots,
  approvedQuestionsWithoutVersions,
  testsWithoutQuestions,
  usersMissingInstitution,
  studentsWithoutBatch,
  teachersWithoutAssignment,
  mediaRecords
] = await Promise.all([
  prisma.$queryRaw<Array<{ count: number }>>`SELECT COUNT(*)::int AS count FROM (SELECT "userId", "testId" FROM "TestAttempt" GROUP BY "userId", "testId" HAVING COUNT(*) > 1) duplicate_groups`,
  prisma.$queryRaw<Array<{ count: number }>>`SELECT COUNT(*)::int AS count FROM (SELECT "attemptId", "questionId" FROM "Answer" GROUP BY "attemptId", "questionId" HAVING COUNT(*) > 1) duplicate_groups`,
  prisma.$queryRaw<Array<{ count: number }>>`SELECT COUNT(*)::int AS count FROM (SELECT "attemptId", "questionId" FROM "CBTAnswerState" GROUP BY "attemptId", "questionId" HAVING COUNT(*) > 1) duplicate_groups`,
  prisma.$queryRaw<Array<{ count: number }>>`SELECT COUNT(*)::int AS count FROM "Answer" item LEFT JOIN "TestAttempt" parent ON parent.id = item."attemptId" WHERE parent.id IS NULL`,
  prisma.$queryRaw<Array<{ count: number }>>`SELECT COUNT(*)::int AS count FROM "CBTAnswerState" item LEFT JOIN "TestAttempt" parent ON parent.id = item."attemptId" WHERE parent.id IS NULL`,
  prisma.testAttempt.count({ where: { status: "SUBMITTED", submittedAt: null } }),
  prisma.test.count({ where: { status: "PUBLISHED", OR: [{ approvedAt: null }, { approvedById: null }] } }),
  prisma.test.count({ where: { status: "PUBLISHED", questions: { some: { versions: { none: {} } } } } }),
  prisma.question.count({ where: { reviewStatus: "APPROVED", versions: { none: {} } } }),
  prisma.test.count({ where: { status: { in: ["APPROVED", "PUBLISHED"] }, questions: { none: {} } } }),
  prisma.user.count({ where: { role: { in: ["STUDENT", "TEACHER", "ACADEMIC_HEAD", "DIRECTOR"] }, instituteId: null, isDisabled: false } }),
  prisma.user.count({ where: { role: "STUDENT", isDisabled: false, batchEnrollments: { none: { status: "ACTIVE" } } } }),
  prisma.user.count({ where: { role: "TEACHER", isDisabled: false, teachingAssignments: { none: { status: "ACTIVE" } } } }),
  prisma.mediaFile.count()
]);

const critical = {
  duplicateAttemptGroups: duplicateAttempts[0]?.count ?? -1,
  duplicateAnswerGroups: duplicateAnswers[0]?.count ?? -1,
  duplicateAnswerStateGroups: duplicateAnswerStates[0]?.count ?? -1,
  orphanAnswers: orphanAnswers[0]?.count ?? -1,
  orphanAnswerStates: orphanAnswerStates[0]?.count ?? -1,
  submittedWithoutTimestamp,
  publishedWithoutApproval,
  publishedWithoutSnapshots,
  approvedQuestionsWithoutVersions,
  approvedOrPublishedTestsWithoutQuestions: testsWithoutQuestions
};
const warnings = { usersMissingInstitution, studentsWithoutBatch, teachersWithoutAssignment, mediaRecordsRequireProviderReconciliation: mediaRecords };

for (const [name, count] of Object.entries(critical)) assert.equal(count, 0, `${name} must be zero`);
console.log(JSON.stringify({ database, status: "PASS", critical, warnings }, null, 2));
await prisma.$disconnect();
