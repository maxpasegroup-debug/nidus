import { prisma } from "../config/prisma.js";
import { Prisma } from "../generated/prisma/client.js";
import { TEST_ACCOUNT_EMAIL } from "../modules/auth/auth.v2.service.js";

const confirmToken = "NIDUS_PRODUCTION_CLEANUP";
const shouldDelete = process.env.CONFIRM_CLEANUP === confirmToken;
const targetEmail = process.env.CLEANUP_USER_EMAIL || TEST_ACCOUNT_EMAIL;
const cleanupDemoContent = process.env.CLEANUP_DEMO_CONTENT === "true";
const cleanupDemoFaculty = process.env.CLEANUP_DEMO_FACULTY === "true";

type CountMap = Record<string, number>;

async function countRows<T extends { id: string }>(name: string, action: Promise<T[]>, counts: CountMap) {
  const result = await action;
  counts[name] = result.length;
  return result;
}

async function runDelete(name: string, action: Promise<{ count: number }>, counts: CountMap) {
  if (!shouldDelete) return;
  const result = await action;
  counts[name] = result.count;
}

async function cleanupUserActivity(userId: string) {
  const planned: CountMap = {};
  const deleted: CountMap = {};

  const testAttempts = await countRows("testAttempts", prisma.testAttempt.findMany({ where: { userId }, select: { id: true } }), planned);
  const testAttemptIds = testAttempts.map((item) => item.id);
  const psychometricAttempts = await countRows("psychometricAttempts", prisma.psychometricAttempt.findMany({ where: { userId }, select: { id: true } }), planned);
  const psychometricAttemptIds = psychometricAttempts.map((item) => item.id);
  const aiInterviewSessions = await countRows("aiInterviewSessions", prisma.aIInterviewSession.findMany({ where: { userId }, select: { id: true } }), planned);
  const aiInterviewSessionIds = aiInterviewSessions.map((item) => item.id);
  const aiTutorSessions = await countRows("aiTutorSessions", prisma.aITutorSession.findMany({ where: { userId }, select: { id: true } }), planned);
  const aiTutorSessionIds = aiTutorSessions.map((item) => item.id);
  const payments = await countRows("payments", prisma.payment.findMany({ where: { userId }, select: { id: true } }), planned);
  const paymentIds = payments.map((item) => item.id);

  await countRows("enrollments", prisma.enrollment.findMany({ where: { userId }, select: { id: true } }), planned);
  await countRows("attendance", prisma.attendance.findMany({ where: { userId }, select: { id: true } }), planned);
  await countRows("lectureProgress", prisma.lectureProgress.findMany({ where: { userId }, select: { id: true } }), planned);
  await countRows("subscriptions", prisma.subscription.findMany({ where: { userId }, select: { id: true } }), planned);
  await countRows("aiRecommendations", prisma.aIRecommendation.findMany({ where: { userId }, select: { id: true } }), planned);
  await countRows("doubtQueries", prisma.doubtQuery.findMany({ where: { userId }, select: { id: true } }), planned);
  await countRows("studyPlans", prisma.studyPlan.findMany({ where: { userId }, select: { id: true } }), planned);
  await countRows("revisionSchedules", prisma.revisionSchedule.findMany({ where: { userId }, select: { id: true } }), planned);
  await countRows("fitnessLogs", prisma.dailyFitnessLog.findMany({ where: { userId }, select: { id: true } }), planned);
  await countRows("notifications", prisma.notification.findMany({ where: { userId }, select: { id: true } }), planned);

  if (!shouldDelete) return { planned, deleted };

  await runDelete("cbtIntegrityEvents", prisma.cBTIntegrityEvent.deleteMany({ where: { attemptId: { in: testAttemptIds } } }), deleted);
  await runDelete("cbtAnswerStates", prisma.cBTAnswerState.deleteMany({ where: { attemptId: { in: testAttemptIds } } }), deleted);
  await runDelete("answers", prisma.answer.deleteMany({ where: { attemptId: { in: testAttemptIds } } }), deleted);
  await runDelete("testAttempts", prisma.testAttempt.deleteMany({ where: { userId } }), deleted);

  await runDelete("psychometricAnswers", prisma.psychometricAnswer.deleteMany({ where: { attemptId: { in: psychometricAttemptIds } } }), deleted);
  await runDelete("psychometricReports", prisma.psychometricReport.deleteMany({ where: { userId } }), deleted);
  await runDelete("psychometricAttempts", prisma.psychometricAttempt.deleteMany({ where: { userId } }), deleted);
  await runDelete("olqScores", prisma.oLQScore.deleteMany({ where: { userId } }), deleted);

  await runDelete("aiInterviewQuestions", prisma.aIInterviewQuestion.deleteMany({ where: { sessionId: { in: aiInterviewSessionIds } } }), deleted);
  await runDelete("aiInterviewSessions", prisma.aIInterviewSession.deleteMany({ where: { userId } }), deleted);
  await runDelete("aiTutorMessages", prisma.aITutorMessage.deleteMany({ where: { sessionId: { in: aiTutorSessionIds } } }), deleted);
  await runDelete("aiTutorFeedback", prisma.aITutorFeedback.deleteMany({ where: { sessionId: { in: aiTutorSessionIds } } }), deleted);
  await runDelete("aiTutorSessions", prisma.aITutorSession.deleteMany({ where: { userId } }), deleted);

  await runDelete("paymentLogs", prisma.paymentTransactionLog.deleteMany({ where: { paymentId: { in: paymentIds } } }), deleted);
  await runDelete("payments", prisma.payment.deleteMany({ where: { userId } }), deleted);
  await runDelete("subscriptions", prisma.subscription.deleteMany({ where: { userId } }), deleted);

  await runDelete("enrollments", prisma.enrollment.deleteMany({ where: { userId } }), deleted);
  await runDelete("attendance", prisma.attendance.deleteMany({ where: { userId } }), deleted);
  await runDelete("lectureProgress", prisma.lectureProgress.deleteMany({ where: { userId } }), deleted);
  await runDelete("aiRecommendations", prisma.aIRecommendation.deleteMany({ where: { userId } }), deleted);
  await runDelete("doubtQueries", prisma.doubtQuery.deleteMany({ where: { userId } }), deleted);
  await runDelete("studyPlans", prisma.studyPlan.deleteMany({ where: { userId } }), deleted);
  await runDelete("revisionSchedules", prisma.revisionSchedule.deleteMany({ where: { userId } }), deleted);
  await runDelete("performanceAnalytics", prisma.performanceAnalytics.deleteMany({ where: { userId } }), deleted);
  await runDelete("fitnessProfile", prisma.fitnessProfile.deleteMany({ where: { userId } }), deleted);
  await runDelete("fitnessLogs", prisma.dailyFitnessLog.deleteMany({ where: { userId } }), deleted);
  await runDelete("ptAttendance", prisma.pTAttendance.deleteMany({ where: { studentId: userId } }), deleted);
  await runDelete("physicalEligibility", prisma.physicalEligibility.deleteMany({ where: { userId } }), deleted);
  await runDelete("officerPotential", prisma.officerPotential.deleteMany({ where: { userId } }), deleted);
  await runDelete("notifications", prisma.notification.deleteMany({ where: { userId } }), deleted);

  return { planned, deleted };
}

async function cleanupDemoContentRecords() {
  const demoText = ["demo", "sample", "placeholder"];
  const whereText = { OR: demoText.map((text) => ({ title: { contains: text, mode: "insensitive" as const } })) };
  const planned: CountMap = {};
  const deleted: CountMap = {};

  await countRows("demoCourses", prisma.course.findMany({ where: whereText, select: { id: true } }), planned);
  await countRows("demoTests", prisma.test.findMany({ where: whereText, select: { id: true } }), planned);
  await countRows("demoLiveClasses", prisma.liveClass.findMany({ where: whereText, select: { id: true } }), planned);
  await countRows("demoRecordedLectures", prisma.recordedLecture.findMany({ where: whereText, select: { id: true } }), planned);
  await countRows("demoAnnouncements", prisma.announcement.findMany({ where: whereText, select: { id: true } }), planned);

  if (!shouldDelete || !cleanupDemoContent) return { planned, deleted };

  await runDelete("demoCourses", prisma.course.deleteMany({ where: whereText }), deleted);
  await runDelete("demoTests", prisma.test.deleteMany({ where: whereText }), deleted);
  await runDelete("demoLiveClasses", prisma.liveClass.deleteMany({ where: whereText }), deleted);
  await runDelete("demoRecordedLectures", prisma.recordedLecture.deleteMany({ where: whereText }), deleted);
  await runDelete("demoAnnouncements", prisma.announcement.deleteMany({ where: whereText }), deleted);
  return { planned, deleted };
}

async function cleanupDemoFacultyAccounts() {
  const planned: CountMap = {};
  const deleted: CountMap = {};
  const demoUsers = await countRows(
    "demoFacultyUsers",
    prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: "Maj. Vikram", mode: "insensitive" } },
          { name: { contains: "Maj Vikram", mode: "insensitive" } },
          { email: { contains: "faculty.ssb@nidusacademy", mode: "insensitive" } },
          { mobile: { contains: "9000000003" } },
        ],
      },
      select: { id: true, email: true },
    }),
    planned,
  );
  const demoUserIds = demoUsers.map((user) => user.id);
  if (!demoUserIds.length) return { planned, deleted };

  await countRows("demoTeacherBatchAssignments", prisma.teacherBatchAssignment.findMany({ where: { teacherId: { in: demoUserIds } }, select: { id: true } }), planned);
  await countRows("demoTests", prisma.test.findMany({ where: { teacherId: { in: demoUserIds } }, select: { id: true } }), planned);

  const rawCounts = await prisma.$queryRaw<Array<{ tableName: string; count: bigint }>>`
    SELECT 'BatchTeacherAssignment' AS "tableName", COUNT(*) AS "count" FROM "BatchTeacherAssignment" WHERE "teacherId" IN (${Prisma.join(demoUserIds)})
    UNION ALL SELECT 'AcademicCalendarItem', COUNT(*) FROM "AcademicCalendarItem" WHERE "teacherId" IN (${Prisma.join(demoUserIds)}) OR LOWER(COALESCE("teacherName", '')) LIKE '%vikram%'
    UNION ALL SELECT 'TeacherCalendarLogRecord', COUNT(*) FROM "TeacherCalendarLogRecord" WHERE "teacherId" IN (${Prisma.join(demoUserIds)}) OR LOWER(COALESCE("teacherName", '')) LIKE '%vikram%'
    UNION ALL SELECT 'TeacherAttendanceRecord', COUNT(*) FROM "TeacherAttendanceRecord" WHERE "teacherId" IN (${Prisma.join(demoUserIds)}) OR LOWER(COALESCE("teacherName", '')) LIKE '%vikram%'
    UNION ALL SELECT 'TeacherAssignmentRecord', COUNT(*) FROM "TeacherAssignmentRecord" WHERE "teacherId" IN (${Prisma.join(demoUserIds)}) OR LOWER(COALESCE("teacherName", '')) LIKE '%vikram%'
    UNION ALL SELECT 'TeacherExamRecord', COUNT(*) FROM "TeacherExamRecord" WHERE "teacherId" IN (${Prisma.join(demoUserIds)}) OR LOWER(COALESCE("teacherName", '')) LIKE '%vikram%'
    UNION ALL SELECT 'TeacherStudyMaterialRecord', COUNT(*) FROM "TeacherStudyMaterialRecord" WHERE "teacherId" IN (${Prisma.join(demoUserIds)}) OR LOWER(COALESCE("teacherName", '')) LIKE '%vikram%'
    UNION ALL SELECT 'TeacherSyllabusProgressRecord', COUNT(*) FROM "TeacherSyllabusProgressRecord" WHERE "teacherId" IN (${Prisma.join(demoUserIds)}) OR LOWER(COALESCE("teacherName", '')) LIKE '%vikram%'
  `;
  for (const row of rawCounts) {
    planned[`demo${row.tableName}`] = Number(row.count);
  }

  if (!shouldDelete || !cleanupDemoFaculty) return { planned, deleted };

  await runDelete("demoTeacherBatchAssignments", prisma.teacherBatchAssignment.deleteMany({ where: { teacherId: { in: demoUserIds } } }), deleted);
  await runDelete("demoTests", prisma.test.deleteMany({ where: { teacherId: { in: demoUserIds } } }), deleted);
  await prisma.$executeRaw`DELETE FROM "BatchTeacherAssignment" WHERE "teacherId" IN (${Prisma.join(demoUserIds)})`;
  await prisma.$executeRaw`DELETE FROM "AcademicCalendarItem" WHERE "teacherId" IN (${Prisma.join(demoUserIds)}) OR LOWER(COALESCE("teacherName", '')) LIKE '%vikram%'`;
  await prisma.$executeRaw`DELETE FROM "TeacherCalendarLogRecord" WHERE "teacherId" IN (${Prisma.join(demoUserIds)}) OR LOWER(COALESCE("teacherName", '')) LIKE '%vikram%'`;
  await prisma.$executeRaw`DELETE FROM "TeacherAttendanceRecord" WHERE "teacherId" IN (${Prisma.join(demoUserIds)}) OR LOWER(COALESCE("teacherName", '')) LIKE '%vikram%'`;
  await prisma.$executeRaw`DELETE FROM "TeacherAssignmentRecord" WHERE "teacherId" IN (${Prisma.join(demoUserIds)}) OR LOWER(COALESCE("teacherName", '')) LIKE '%vikram%'`;
  await prisma.$executeRaw`DELETE FROM "TeacherExamRecord" WHERE "teacherId" IN (${Prisma.join(demoUserIds)}) OR LOWER(COALESCE("teacherName", '')) LIKE '%vikram%'`;
  await prisma.$executeRaw`DELETE FROM "TeacherStudyMaterialRecord" WHERE "teacherId" IN (${Prisma.join(demoUserIds)}) OR LOWER(COALESCE("teacherName", '')) LIKE '%vikram%'`;
  await prisma.$executeRaw`DELETE FROM "TeacherSyllabusProgressRecord" WHERE "teacherId" IN (${Prisma.join(demoUserIds)}) OR LOWER(COALESCE("teacherName", '')) LIKE '%vikram%'`;
  const archived = await prisma.user.updateMany({
    where: { id: { in: demoUserIds } },
    data: {
      isDisabled: true,
      disabledAt: new Date(),
      roleOnboardingStatus: "ARCHIVED",
      roleMetadata: {
        status: "ARCHIVED",
        archivedReason: "Removed demo SSB faculty account before production launch",
      },
    },
  });
  deleted.demoFacultyUsersArchived = archived.count;
  return { planned, deleted };
}

const user = await prisma.user.findUnique({ where: { email: targetEmail }, select: { id: true, email: true, role: true } });
const userCleanup = user ? await cleanupUserActivity(user.id) : null;
const demoContentCleanup = await cleanupDemoContentRecords();
const demoFacultyCleanup = await cleanupDemoFacultyAccounts();

console.log(JSON.stringify({
  dryRun: !shouldDelete,
  confirmRequired: confirmToken,
  targetUser: user,
  cleanupDemoContent,
  cleanupDemoFaculty,
  userCleanup,
  demoContentCleanup,
  demoFacultyCleanup
}, null, 2));

await prisma.$disconnect();
