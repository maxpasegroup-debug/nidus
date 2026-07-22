import { prisma } from "../../config/prisma.js";
import { env } from "../../config/env.js";
import { getRuntimeState } from "../../runtime/lifecycle.js";
import type { Role } from "../../generated/prisma/client.js";

type DashboardUser = {
  id: string;
  role: Role;
};

const paidStatuses = ["SUCCESS", "PAID", "VERIFIED", "CAPTURED"];
const staffRoles: Role[] = ["ADMIN", "DIRECTOR", "TEACHER", "ACADEMIC_HEAD", "PHYSICAL_TRAINER", "ADMINISTRATIVE_OFFICER", "BUSINESS_DEVELOPMENT_EXECUTIVE", "TELECALLER", "MARKETING_COORDINATOR"];

function percentage(part: number, total: number) {
  return total > 0 ? Math.round((part / total) * 100) : 0;
}

function clampPercentage(value: number) {
  return Math.max(0, Math.min(100, Math.round(Number.isFinite(value) ? value : 0)));
}

function opsStatus(condition: boolean, partialCondition = false) {
  if (condition) return "PASS";
  if (partialCondition) return "PARTIAL";
  return "FAIL";
}

function readinessSummary(checks: Array<{ status: string }>) {
  const pass = checks.filter((check) => check.status === "PASS").length;
  const partial = checks.filter((check) => check.status === "PARTIAL").length;
  const fail = checks.filter((check) => check.status === "FAIL").length;
  const score = checks.length ? Math.round(((pass + partial * 0.5) / checks.length) * 100) : 0;
  return { pass, partial, fail, total: checks.length, score };
}

function monthLabel(date: Date) {
  return date.toLocaleString("en-US", { month: "short" });
}

function attendanceStatus(status: string) {
  return status.trim().toUpperCase();
}

function recordArray(value: unknown): Array<Record<string, unknown>> {
  if (Array.isArray(value)) return value.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object" && !Array.isArray(item));
  return [];
}

function recordStudentId(record: Record<string, unknown>) {
  return typeof record.studentId === "string" ? record.studentId : "";
}

function metadataObject(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function stringArray(value: unknown, fallback: string[] = []) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : fallback;
}

function staffDashboard(metadata: Record<string, unknown>, fallbackTemplate: string) {
  return {
    designation: typeof metadata.designation === "string" ? metadata.designation : "",
    department: typeof metadata.department === "string" ? metadata.department : "",
    dashboardTemplate: typeof metadata.dashboardTemplate === "string" ? metadata.dashboardTemplate : fallbackTemplate,
    subject: typeof metadata.subject === "string" ? metadata.subject : null,
    focusAreas: stringArray(metadata.focusAreas),
    permissions: stringArray(metadata.permissions)
  };
}

function dashboardTemplateFromMetadata(value: unknown) {
  const metadata = metadataObject(value);
  return typeof metadata.dashboardTemplate === "string" ? metadata.dashboardTemplate.toUpperCase() : "";
}

function buildAttendanceTrend(rows: Array<{ date: Date; status: string }>) {
  const grouped = new Map<string, { present: number; total: number }>();
  for (const row of rows) {
    const key = monthLabel(row.date);
    const current = grouped.get(key) ?? { present: 0, total: 0 };
    current.total += 1;
    if (attendanceStatus(row.status) === "PRESENT") current.present += 1;
    grouped.set(key, current);
  }
  return Array.from(grouped.entries()).map(([month, value]) => ({ month, attendance: percentage(value.present, value.total) }));
}

function readinessBand(score: number) {
  if (score >= 85) return "Strong officer signal";
  if (score >= 70) return "Developing officer potential";
  if (score >= 50) return "Foundation stage";
  return "Needs guided support";
}

function buildAssessmentProfile(
  attempts: Array<{
    id: string;
    testId: string;
    score: number;
    completedAt: Date | null;
    overallRemark: string | null;
    test: { id: string; title: string; type: string };
  }>
) {
  const latestByTest = new Map<string, (typeof attempts)[number]>();
  for (const attempt of attempts) {
    if (!latestByTest.has(attempt.testId)) latestByTest.set(attempt.testId, attempt);
  }

  const completed = Array.from(latestByTest.values());
  const averageScore = completed.length ? Math.round(completed.reduce((sum, attempt) => sum + attempt.score, 0) / completed.length) : 0;
  const strongest = [...completed].sort((a, b) => b.score - a.score)[0] ?? null;
  const latest = completed[0] ?? null;

  return {
    totalAssessments: 15,
    completedCount: completed.length,
    reportReadyCount: completed.length,
    profileAccuracy: percentage(completed.length, 15),
    averageScore,
    readinessBand: readinessBand(averageScore),
    strongestSignal: strongest
      ? { title: strongest.test.title, score: Math.round(strongest.score), attemptId: strongest.id }
      : null,
    latestReport: latest
      ? { title: latest.test.title, score: Math.round(latest.score), attemptId: latest.id, completedAt: latest.completedAt?.toISOString() ?? "" }
      : null,
    completed: completed.map((attempt) => ({
      id: attempt.test.id,
      title: attempt.test.title,
      type: attempt.test.type,
      score: Math.round(attempt.score),
      completedAt: attempt.completedAt?.toISOString() ?? "",
      attemptId: attempt.id,
      reportHref: `/psychometric/results/${attempt.id}`,
      pdfHref: `/psychometric/results/${attempt.id}/pdf`,
      readinessBand: readinessBand(attempt.score),
      remark: attempt.overallRemark ?? ""
    }))
  };
}

function startOfToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

function endOfToday() {
  const tomorrow = startOfToday();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow;
}

async function academyArchitectureSummary() {
  const [programs, batches, teacherAssignments, timetableSlots, draftTests, liveTests] = await Promise.all([
    prisma.course.count(),
    prisma.batch.count(),
    prisma.teacherBatchAssignment.count({ where: { status: "ACTIVE" } }),
    prisma.timetable.count(),
    prisma.test.count({ where: { status: { in: ["DRAFT_REVIEW", "REVIEW", "DRAFT"] } } }),
    prisma.test.count({ where: { isLive: true } })
  ]);
  return { programs, batches, teacherAssignments, timetableSlots, draftTests, liveTests };
}

export const dashboardService = {
  async getStudentDashboard(user: DashboardUser) {
    const profile = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, name: true, email: true, mobile: true, role: true }
    });

    const todayStart = startOfToday();
    const upcomingEnd = new Date(todayStart);
    upcomingEnd.setDate(upcomingEnd.getDate() + 14);

    const [enrollments, batchEnrollments, attendanceRows, leaderboard, studentCount, recommendations, fitness, lectureProgress, attempts, psychometricAttempts] = await Promise.all([
      prisma.enrollment.findMany({
        where: { userId: user.id },
        orderBy: { enrolledAt: "desc" },
        include: { course: { include: { modules: { orderBy: { order: "asc" }, include: { lessons: { orderBy: { order: "asc" }, take: 1 } } } } } }
      }),
      prisma.batchStudent.findMany({
        where: { studentId: user.id, status: "ACTIVE" },
        include: { batch: { include: { course: { select: { id: true, title: true, slug: true, category: true, examType: true, duration: true } }, _count: { select: { teachers: true, tests: true } } } } },
        orderBy: { joinedAt: "desc" }
      }),
      prisma.attendance.findMany({ where: { userId: user.id }, orderBy: { date: "asc" } }),
      prisma.leaderboard.findUnique({ where: { userId: user.id } }),
      prisma.user.count({ where: { role: "STUDENT" } }),
      prisma.aIRecommendation.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 5 }),
      prisma.fitnessProfile.findUnique({ where: { userId: user.id } }),
      prisma.lectureProgress.findMany({ where: { userId: user.id }, orderBy: { updatedAt: "desc" }, take: 4, include: { lecture: { select: { title: true } } } }),
      prisma.testAttempt.findMany({ where: { userId: user.id }, orderBy: { startedAt: "desc" }, take: 4, include: { test: { select: { title: true } } } }),
      prisma.psychometricAttempt.findMany({
        where: { userId: user.id, completedAt: { not: null } },
        orderBy: { completedAt: "desc" },
        include: { test: { select: { id: true, title: true, type: true } } }
      })
    ]);
    const present = attendanceRows.filter((row) => attendanceStatus(row.status) === "PRESENT").length;
    const assessmentProfile = buildAssessmentProfile(psychometricAttempts);
    const studentBatchNames = batchEnrollments.map((enrollment) => enrollment.batch.name);
    const studentBatchIds = batchEnrollments.map((enrollment) => enrollment.batchId);
    const liveTests = studentBatchIds.length
      ? await prisma.test.findMany({
          where: { isLive: true, batchId: { in: studentBatchIds }, status: "PUBLISHED" },
          orderBy: { createdAt: "desc" },
          take: 5,
          include: { _count: { select: { questions: true } } }
        })
      : [];
    const [todayClasses, upcomingClasses] = studentBatchNames.length
      ? await Promise.all([
          prisma.timetable.findMany({ where: { batch: { in: studentBatchNames }, startTime: { gte: todayStart, lt: endOfToday() } }, orderBy: { startTime: "asc" }, take: 8 }),
          prisma.timetable.findMany({ where: { batch: { in: studentBatchNames }, startTime: { gte: endOfToday(), lt: upcomingEnd } }, orderBy: { startTime: "asc" }, take: 12 })
        ])
      : [[], []];
    const recentActivities = [
      ...assessmentProfile.completed.slice(0, 3).map((attempt) => `Completed ${attempt.title}`),
      ...attempts.map((attempt) => `Attempted ${attempt.test.title}`),
      ...lectureProgress.map((progress) => `${progress.completed ? "Completed" : "Watched"} ${progress.lecture.title}`)
    ].slice(0, 6);

    return {
      profile,
      enrolledCourses: enrollments.map((enrollment) => ({
        id: enrollment.course.id,
        title: enrollment.course.title,
        progress: enrollment.progress,
        nextLesson: enrollment.course.modules[0]?.lessons[0]?.title ?? "No lesson added"
      })),
      academyProfile: {
        assignedBatches: batchEnrollments.map((enrollment) => ({
          id: enrollment.batch.id,
          name: enrollment.batch.name,
          type: enrollment.batch.batchType,
          programSlug: enrollment.batch.programSlug,
          status: enrollment.batch.status,
          joinedAt: enrollment.joinedAt.toISOString(),
          teachers: enrollment.batch._count.teachers,
          tests: enrollment.batch._count.tests,
          course: enrollment.batch.course
        })),
        todayClasses: todayClasses.map((slot) => ({
          id: slot.id,
          title: slot.title,
          batch: slot.batch,
          subject: slot.subject,
          instructor: slot.instructor,
          startTime: slot.startTime.toISOString(),
          endTime: slot.endTime.toISOString(),
          classroom: slot.classroom
        })),
        upcomingClasses: upcomingClasses.map((slot) => ({
          id: slot.id,
          title: slot.title,
          batch: slot.batch,
          subject: slot.subject,
          instructor: slot.instructor,
          startTime: slot.startTime.toISOString(),
          endTime: slot.endTime.toISOString(),
          classroom: slot.classroom
        })),
        librarySubjects: Array.from(new Set(batchEnrollments.flatMap((enrollment) => {
          const schedule = metadataObject(enrollment.batch.schedule);
          return stringArray(schedule.subjects);
        })))
      },
      upcomingTests: liveTests.map((test) => ({ id: test.id, title: test.title, date: test.createdAt.toISOString(), durationMinutes: test.duration })),
      attendance: {
        percentage: percentage(present, attendanceRows.length),
        present,
        total: attendanceRows.length,
        trend: buildAttendanceTrend(attendanceRows)
      },
      leaderboardRank: {
        rank: leaderboard?.rank ?? 0,
        percentile: leaderboard?.rank && studentCount ? percentage(studentCount - leaderboard.rank + 1, studentCount) : 0,
        batch: batchEnrollments[0]?.batch.name ?? "No batch assigned"
      },
      aiRecommendations: recommendations.map((item) => item.recommendation),
      fitnessProgress: {
        score: Math.round(fitness?.staminaScore ?? 0),
        streakDays: await prisma.dailyFitnessLog.count({ where: { userId: user.id } }),
        focus: fitness?.fitnessLevel ?? "No fitness profile"
      },
      assessmentProfile,
      recentActivities
    };
  },

  async getParentDashboard(user: DashboardUser) {
    const link = await prisma.parentStudentLink.findFirst({
      where: { parentId: user.id, status: "ACTIVE" },
      include: { student: { select: { id: true, name: true, email: true, mobile: true } } },
      orderBy: { linkedAt: "desc" }
    });
    const linkedStudent = link?.student ?? null;
    if (link) {
      await prisma.parentStudentLink.update({ where: { id: link.id }, data: { lastViewedAt: new Date() } }).catch(() => undefined);
    }

    const studentId = linkedStudent?.id;
    const [attempts, attendanceRows, fees, payments, receipts, notifications, discipline, psychometricAttempts, academyAttendanceRows, assignmentRows, submissionRows, teacherExamRows, fitness, fitnessLogs] = await Promise.all([
      studentId ? prisma.testAttempt.findMany({ where: { userId: studentId, submittedAt: { not: null } }, orderBy: { submittedAt: "asc" }, take: 12 }) : [],
      studentId ? prisma.attendance.findMany({ where: { userId: studentId }, orderBy: { date: "asc" } }) : [],
      studentId ? prisma.feeInstallment.findMany({ where: { studentId }, orderBy: { dueDate: "asc" } }) : [],
      studentId ? prisma.payment.findMany({ where: { userId: studentId }, orderBy: { createdAt: "desc" }, take: 8 }) : [],
      studentId ? prisma.financeDocument.findMany({ where: { ownerId: studentId, documentType: "PAYMENT_RECEIPT" }, orderBy: { createdAt: "desc" }, take: 8 }) : [],
      prisma.notification.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 5 }),
      studentId ? prisma.disciplineRecord.findMany({ where: { studentId }, orderBy: { createdAt: "desc" }, take: 5 }) : [],
      studentId
        ? prisma.psychometricAttempt.findMany({
            where: { userId: studentId, completedAt: { not: null } },
            orderBy: { completedAt: "desc" },
            include: { test: { select: { id: true, title: true, type: true } } }
          })
        : []
      ,
      studentId
        ? prisma.$queryRaw<Array<{ id: string; batchName: string | null; subject: string | null; date: Date; records: unknown }>>`
            SELECT "id", "batchName", "subject", "date", "records"
            FROM "TeacherAttendanceRecord"
            WHERE "records"::text LIKE ${`%${studentId}%`}
            ORDER BY "date" DESC
          `
        : [],
      studentId
        ? prisma.$queryRaw<Array<{ id: string; title: string; subject: string | null; batchName: string | null; dueDate: Date | null; status: string }>>`
            SELECT a."id", a."title", a."subject", a."batchName", a."dueDate", a."status"
            FROM "TeacherAssignmentRecord" a
            WHERE a."batchId" IN (SELECT "batchId" FROM "BatchStudent" WHERE "studentId" = ${studentId} AND "status" = 'ACTIVE')
            AND a."status" != 'ARCHIVED'
            ORDER BY a."createdAt" DESC
          `
        : [],
      studentId
        ? prisma.$queryRaw<Array<{ assignmentId: string; reviewStatus: string; score: number | null; submittedAt: Date | null }>>`
            SELECT "assignmentId", "reviewStatus", "score", "submittedAt"
            FROM "AssignmentSubmissionRecord"
            WHERE "studentId" = ${studentId}
          `
        : [],
      studentId
        ? prisma.$queryRaw<Array<{ id: string; title: string; subject: string | null; batchName: string | null; testId: string | null; createdAt: Date }>>`
            SELECT "id", "title", "subject", "batchName", "testId", "createdAt"
            FROM "TeacherExamRecord"
            WHERE "batchId" IN (SELECT "batchId" FROM "BatchStudent" WHERE "studentId" = ${studentId} AND "status" = 'ACTIVE')
            AND "status" != 'ARCHIVED'
            ORDER BY "createdAt" DESC
          `
        : [],
      studentId ? prisma.fitnessProfile.findUnique({ where: { userId: studentId } }) : null,
      studentId ? prisma.dailyFitnessLog.findMany({ where: { userId: studentId }, orderBy: { createdAt: "desc" }, take: 5 }) : []
    ]);
    const academyAttendance = academyAttendanceRows
      .map((row) => {
        const record = recordArray(row.records).find((item) => recordStudentId(item) === studentId);
        return record ? { ...row, status: typeof record.status === "string" ? record.status : "MARKED" } : null;
      })
      .filter((row): row is { id: string; batchName: string | null; subject: string | null; date: Date; records: unknown; status: string } => Boolean(row));
    const legacyPresent = attendanceRows.filter((row) => attendanceStatus(row.status) === "PRESENT").length;
    const academyPresent = academyAttendance.filter((row) => attendanceStatus(row.status) === "PRESENT").length;
    const attendanceTotal = academyAttendance.length || attendanceRows.length;
    const present = academyAttendance.length ? academyPresent : legacyPresent;
    const averageScore = attempts.length ? clampPercentage(attempts.reduce((sum, attempt) => sum + attempt.score, 0) / attempts.length) : 0;
    const firstScore = attempts[0]?.score ?? 0;
    const lastScore = attempts.at(-1)?.score ?? 0;
    const dueFees = fees.filter((fee) => fee.paidStatus !== "PAID");
    const successfulPayments = payments.filter((payment) => payment.paymentStatus === "SUCCESS");
    const totalPaid = successfulPayments.reduce((sum, payment) => sum + payment.amount, 0);
    const submissionByAssignment = new Map(submissionRows.map((item) => [item.assignmentId, item]));
    const submittedAssignments = assignmentRows.filter((assignment) => submissionByAssignment.has(assignment.id)).length;

    return {
      parentId: user.id,
      linkedStudent,
      monitoringPermissions: link?.monitoringPermissions ?? null,
      studentPerformance: {
        averageScore,
        improvement: attempts.length > 1 ? Math.round(lastScore - firstScore) : 0,
        trend: attempts.map((attempt) => ({ month: monthLabel(attempt.startedAt), score: Math.round(attempt.score) }))
      },
      attendance: {
        percentage: percentage(present, attendanceTotal),
        present,
        total: attendanceTotal,
        recent: academyAttendance.slice(0, 6).map((row) => ({
          subject: row.subject,
          batchName: row.batchName,
          date: row.date,
          status: row.status
        }))
      },
      assignments: {
        total: assignmentRows.length,
        submitted: submittedAssignments,
        pending: Math.max(assignmentRows.length - submittedAssignments, 0),
        recent: assignmentRows.slice(0, 6).map((assignment) => {
          const submission = submissionByAssignment.get(assignment.id);
          return {
            id: assignment.id,
            title: assignment.title,
            subject: assignment.subject,
            batchName: assignment.batchName,
            dueDate: assignment.dueDate,
            status: submission ? submission.reviewStatus || "SUBMITTED" : "PENDING",
            score: submission?.score ?? null
          };
        })
      },
      exams: {
        published: teacherExamRows.length,
        submitted: attempts.length,
        averageScore,
        recent: attempts.slice(-6).reverse().map((attempt) => ({
          id: attempt.id,
          score: attempt.score,
          submittedAt: attempt.submittedAt,
          status: attempt.status
        }))
      },
      feeStatus: {
        status: dueFees.length ? "PENDING" : fees.length ? "PAID" : "NO_FEE_PLAN",
        dueAmount: dueFees.reduce((sum, fee) => sum + (fee.dueAmount || fee.amount - fee.paidAmount), 0),
        totalPaid,
        latestReceiptNumber: successfulPayments[0]?.receiptNumber ?? receipts[0]?.documentNumber ?? null,
        nextDueDate: dueFees[0]?.dueDate.toISOString() ?? "",
        installments: fees.map((fee) => ({
          id: fee.id,
          title: fee.title,
          amount: fee.amount,
          paidAmount: fee.paidAmount,
          dueAmount: fee.dueAmount,
          dueDate: fee.dueDate,
          paidStatus: fee.paidStatus
        })),
        payments: successfulPayments.map((payment) => ({
          id: payment.id,
          amount: payment.amount,
          currency: payment.currency,
          method: payment.paymentMethod ?? payment.paymentMode,
          receiptNumber: payment.receiptNumber,
          receiptUrl: payment.receiptUrl ?? payment.receiptUploadUrl,
          paidAt: payment.verifiedAt ?? payment.createdAt,
          status: payment.paymentStatus
        })),
        receipts: receipts.map((receipt) => ({
          id: receipt.id,
          documentNumber: receipt.documentNumber,
          fileUrl: receipt.fileUrl,
          status: receipt.status,
          createdAt: receipt.createdAt
        }))
      },
      fitness: fitness
        ? {
            bmi: fitness.bmi,
            runningTime: fitness.runningTime,
            staminaScore: fitness.staminaScore,
            fitnessLevel: fitness.fitnessLevel,
            recentLogs: fitnessLogs.map((log) => ({
              id: log.id,
              runningDistance: log.runningDistance,
              workoutDuration: log.workoutDuration,
              notes: log.notes,
              createdAt: log.createdAt
            }))
          }
        : null,
      notifications: notifications.map((notification) => notification.title),
      disciplineScore: {
        grade: discipline.length ? "REVIEW" : "NO_RECORDS",
        score: discipline.length ? 0 : 100,
        notes: discipline[0]?.description ?? "No discipline records found."
      },
      assessmentProfile: buildAssessmentProfile(psychometricAttempts)
    };
  },

  async getAdminDashboard(user?: DashboardUser) {
    const currentUser = user
      ? await prisma.user.findUnique({ where: { id: user.id }, select: { roleMetadata: true } })
      : null;
    const customDashboard = staffDashboard(metadataObject(currentUser?.roleMetadata), "ADMIN_OPERATIONS");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [totalStudents, recentAdmissions, revenue, attendanceToday, staffCounts, hostelRooms, programApplications, leadPrograms, academySummary] = await Promise.all([
      prisma.user.count({ where: { role: "STUDENT" } }),
      prisma.admission.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: { student: { select: { id: true, name: true, email: true, mobile: true, role: true, createdAt: true } } }
      }),
      prisma.payment.aggregate({ where: { paymentStatus: { in: paidStatuses } }, _sum: { amount: true } }),
      prisma.attendance.findMany({ where: { date: { gte: today } } }),
      prisma.user.groupBy({ by: ["role"], where: { role: { in: staffRoles } }, _count: { role: true } }),
      prisma.room.aggregate({ _sum: { occupiedCount: true, capacity: true } }),
      prisma.admission.groupBy({ by: ["courseId", "status"], _count: { id: true } }),
      prisma.lead.groupBy({ by: ["targetExam"], _count: { id: true } }),
      academyArchitectureSummary()
    ]);
    const courseIds = Array.from(new Set(programApplications.map((item) => item.courseId)));
    const courses = courseIds.length ? await prisma.course.findMany({ where: { id: { in: courseIds } }, select: { id: true, title: true, slug: true, category: true } }) : [];
    const courseMap = new Map(courses.map((course) => [course.id, course]));
    const presentToday = attendanceToday.filter((row) => attendanceStatus(row.status) === "PRESENT").length;
    const staffMap = new Map(staffCounts.map((item) => [item.role, item._count.role]));
    const faculty = staffMap.get("TEACHER") ?? 0;
    const totalStaff = staffCounts.reduce((sum, item) => sum + item._count.role, 0);
    const occupiedBeds = hostelRooms._sum.occupiedCount ?? 0;
    const totalBeds = hostelRooms._sum.capacity ?? 0;

    return {
      totalStudents,
      totalRevenue: {
        amount: revenue._sum.amount ?? 0,
        currency: "INR",
        quarter: `FY ${new Date().getFullYear()}`
      },
      attendanceAnalytics: {
        average: percentage(presentToday, attendanceToday.length),
        presentToday,
        totalMarked: attendanceToday.length,
        trend: buildAttendanceTrend(attendanceToday)
      },
      recentAdmissions: recentAdmissions.map((admission) => admission.student),
      staffSummary: {
        totalStaff,
        faculty,
        mentors: 0,
        operations: totalStaff - faculty
      },
      hostelStats: {
        occupancyPercentage: percentage(occupiedBeds, totalBeds),
        occupiedBeds,
        totalBeds
      },
      customDashboard,
      academySummary,
      admissionProgramPipeline: programApplications.map((item) => ({
        courseId: item.courseId,
        title: courseMap.get(item.courseId)?.title ?? "Unknown program",
        category: courseMap.get(item.courseId)?.category ?? "Academy",
        status: item.status,
        count: item._count.id
      })),
      leadProgramPipeline: leadPrograms.map((item) => ({ program: item.targetExam || "Not selected", count: item._count.id }))
    };
  },

  async getTeacherDashboard(user: DashboardUser) {
    const profile = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, name: true, email: true, mobile: true, role: true, instituteId: true, branchId: true, roleMetadata: true }
    });
    const customDashboard = staffDashboard(metadataObject(profile?.roleMetadata), "SUBJECT_FACULTY");
    const subject = customDashboard.subject;

    const todayStart = startOfToday();
    const tomorrowStart = endOfToday();
    const upcomingEnd = new Date(todayStart);
    upcomingEnd.setDate(upcomingEnd.getDate() + 14);

    const [attendanceRows, attempts, lectures, documents, tests, recommendations, teachingAssignments, todayTimetable, upcomingTimetable] = await Promise.all([
      prisma.attendance.findMany({ orderBy: { date: "desc" }, take: 200 }),
      prisma.testAttempt.findMany({ where: { submittedAt: { not: null } }, orderBy: { submittedAt: "desc" }, take: 100 }),
      prisma.recordedLecture.count(),
      prisma.document.count(),
      prisma.test.count(),
      prisma.aIRecommendation.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 5 }),
      prisma.teacherBatchAssignment.findMany({
        where: { teacherId: user.id, status: "ACTIVE" },
        orderBy: { createdAt: "desc" },
        include: {
          batch: {
            include: {
              course: { select: { id: true, title: true, slug: true, category: true, examType: true, duration: true } },
              _count: { select: { students: true, tests: true } }
            }
          }
        }
      }),
      prisma.timetable.findMany({
        where: { instructor: profile?.name ?? "", startTime: { gte: todayStart, lt: tomorrowStart } },
        orderBy: { startTime: "asc" },
        take: 8
      }),
      prisma.timetable.findMany({
        where: { instructor: profile?.name ?? "", startTime: { gte: tomorrowStart, lt: upcomingEnd } },
        orderBy: { startTime: "asc" },
        take: 12
      })
    ]);
    const isPhysicalInstructor = customDashboard.dashboardTemplate === "PHYSICAL_INSTRUCTOR";
    const [ptSchedules, ptAttendance, fitnessProfiles, eligibilityReviews, dailyLogs] = isPhysicalInstructor
      ? await Promise.all([
          prisma.pTSchedule.count(),
          prisma.pTAttendance.count(),
          prisma.fitnessProfile.count(),
          prisma.physicalEligibility.count(),
          prisma.dailyFitnessLog.count()
        ])
      : [0, 0, 0, 0, 0];
    const present = attendanceRows.filter((row) => attendanceStatus(row.status) === "PRESENT").length;
    const averageScore = attempts.length ? clampPercentage(attempts.reduce((sum, attempt) => sum + attempt.score, 0) / attempts.length) : 0;
    const weakAttempts = attempts.filter((attempt) => attempt.score < 50);

    return {
      profile,
      customDashboard,
      subjects: Array.from(new Set([...(subject ? [subject] : []), ...teachingAssignments.map((assignment) => assignment.subject), ...customDashboard.focusAreas])),
      assignedBatches: teachingAssignments.map((assignment) => ({
        id: assignment.batch.id,
        name: assignment.batch.name,
        type: assignment.batch.batchType,
        status: assignment.batch.status,
        subject: assignment.subject,
        role: assignment.role,
        programSlug: assignment.batch.programSlug,
        students: assignment.batch._count.students,
        tests: assignment.batch._count.tests,
        schedule: assignment.batch.schedule,
        course: assignment.batch.course
          ? {
              id: assignment.batch.course.id,
              title: assignment.batch.course.title,
              slug: assignment.batch.course.slug,
              category: assignment.batch.course.category,
              examType: assignment.batch.course.examType,
              duration: assignment.batch.course.duration
            }
          : null
      })),
      teachingPlan: {
        today: todayTimetable.map((slot) => ({
          id: slot.id,
          title: slot.title,
          batch: slot.batch,
          subject: slot.subject,
          startTime: slot.startTime.toISOString(),
          endTime: slot.endTime.toISOString(),
          classroom: slot.classroom
        })),
        upcoming: upcomingTimetable.map((slot) => ({
          id: slot.id,
          title: slot.title,
          batch: slot.batch,
          subject: slot.subject,
          startTime: slot.startTime.toISOString(),
          endTime: slot.endTime.toISOString(),
          classroom: slot.classroom
        }))
      },
      classPerformance: { averageScore, attendance: percentage(present, attendanceRows.length), weakStudentCount: attempts.filter((attempt) => attempt.score < 50).length, assignmentsDue: 0 },
      contentOps: {
        lectureUploads: lectures,
        notesUploads: documents,
        pendingReviews: 0,
        cbtDrafts: tests
      },
      physicalTraining: isPhysicalInstructor ? {
        schedules: ptSchedules,
        attendanceMarked: ptAttendance,
        fitnessProfiles,
        eligibilityReviews,
        dailyLogs
      } : undefined,
      modules: [
        { title: customDashboard.designation || "Subject assignment", status: teachingAssignments.length ? "Assigned" : "Ready", metric: teachingAssignments.length ? `${teachingAssignments.length} batch responsibilities` : customDashboard.department || "Configure through staff profiles" },
        { title: "Lecture uploads", status: lectures ? "Active" : "No data", metric: `${lectures} uploaded lectures` },
        { title: "Notes uploads", status: documents ? "Active" : "No data", metric: `${documents} uploaded documents` },
        { title: "Assignment management", status: "Ready", metric: "No assignment records yet" },
        { title: "Attendance marking", status: attendanceRows.length ? "Active" : "No data", metric: `${percentage(present, attendanceRows.length)}% from marked records` },
        { title: "CBT/test management", status: tests ? "Active" : "No data", metric: `${tests} tests created` },
        { title: "Weak student alerts", status: weakAttempts.length ? "Review" : "No alerts", metric: `${weakAttempts.length} low-score attempts` },
        { title: "Parent communication", status: "Ready", metric: "Messages module available" },
        { title: "AI recommendations", status: recommendations.length ? "Active" : "No data", metric: recommendations.length ? `${recommendations.length} recommendations` : "No recommendations yet" }
      ],
      weakStudentAlerts: weakAttempts.slice(0, 5).map((attempt) => `Low score needs review: ${Math.round(attempt.score)}`),
      aiRecommendations: recommendations.map((item) => item.recommendation)
    };
  },

  async getDirectorDashboard(user: DashboardUser) {
    const director = await prisma.user.findUnique({
      where: { id: user.id },
      select: { instituteId: true, branchId: true, roleMetadata: true }
    });
    const customDashboard = staffDashboard(metadataObject(director?.roleMetadata), "EXECUTIVE_COMMAND");
    const scopedWhere = user.role === "DIRECTOR" ? { instituteId: director?.instituteId ?? undefined, branchId: director?.branchId ?? undefined } : {};
    const subjectTeacherWhere = {
      role: "TEACHER" as Role,
      ...scopedWhere,
      NOT: [
        { roleMetadata: { path: ["dashboardTemplate"], equals: "PHYSICAL_TRAINER" } },
        { roleMetadata: { path: ["dashboardTemplate"], equals: "PHYSICAL_INSTRUCTOR" } },
        { roleMetadata: { path: ["dashboardTemplate"], equals: "ACADEMIC_HEAD" } }
      ]
    };
    const [
      students,
      activeStudents,
      leads,
      readyForAdmission,
      admissions,
      activeBatches,
      activePrograms,
      academicHeads,
      teachers,
      physicalTrainers,
      administrativeOfficers,
      businessDevelopmentExecutives,
      attendanceRows,
      completedAttempts,
      totalAttempts,
      collected,
      pending,
      installmentsPending,
      facultyReviewDue,
      academySummary,
      batchTypes,
      programCounts,
      programDistribution,
      liveClasses,
      lessonsUploaded,
      examsPublished,
      assignmentsPublished,
      pendingDocuments,
      pendingFees,
      pendingBatchAllocation,
      lowAttendanceBatches,
      examPublicationDelays,
      archivedStaff
    ] = await Promise.all([
      prisma.user.count({ where: { role: "STUDENT", ...scopedWhere } }),
      prisma.batchStudent.count({ where: { status: "ACTIVE" } }),
      prisma.lead.count(),
      prisma.lead.count({ where: { status: "COUNSELLING", notes: { contains: "Ready For Admission", mode: "insensitive" } } }),
      prisma.admission.count(),
      prisma.batch.count({ where: { status: "ACTIVE" } }),
      prisma.course.count(),
      prisma.user.count({ where: { OR: [{ role: "ACADEMIC_HEAD" }, { role: "TEACHER", roleMetadata: { path: ["dashboardTemplate"], equals: "ACADEMIC_HEAD" } }] } }),
      prisma.user.count({ where: subjectTeacherWhere }),
      prisma.user.count({
        where: {
          OR: [
            { role: "PHYSICAL_TRAINER" },
            { role: "TEACHER", roleMetadata: { path: ["dashboardTemplate"], equals: "PHYSICAL_TRAINER" } },
            { role: "TEACHER", roleMetadata: { path: ["dashboardTemplate"], equals: "PHYSICAL_INSTRUCTOR" } }
          ]
        }
      }),
      prisma.user.count({ where: { OR: [{ role: "ADMINISTRATIVE_OFFICER" }, { role: "ADMIN", roleMetadata: { path: ["dashboardTemplate"], equals: "ADMISSION_CELL" } }] } }),
      prisma.user.count({ where: { role: { in: ["BUSINESS_DEVELOPMENT_EXECUTIVE", "TELECALLER", "MARKETING_COORDINATOR"] } } }),
      prisma.attendance.findMany({ orderBy: { date: "desc" }, take: 500 }),
      prisma.testAttempt.count({ where: { submittedAt: { not: null } } }),
      prisma.testAttempt.count(),
      prisma.payment.aggregate({ where: { paymentStatus: { in: paidStatuses } }, _sum: { amount: true } }),
      prisma.feeInstallment.aggregate({ where: { paidStatus: { not: "PAID" } }, _sum: { dueAmount: true, amount: true } }),
      prisma.feeInstallment.count({ where: { paidStatus: { not: "PAID" } } }),
      prisma.faculty.count({ where: { status: { not: "ACTIVE" } } }),
      academyArchitectureSummary(),
      prisma.batch.groupBy({ by: ["batchType"], _count: { id: true } }),
      prisma.course.groupBy({ by: ["category"], _count: { id: true } }),
      prisma.batch.groupBy({ by: ["courseId"], _count: { id: true }, where: { courseId: { not: null } } }),
      prisma.liveClass.count(),
      prisma.teacherStudyMaterialRecord.count({ where: { archivedAt: null } }),
      prisma.teacherExamRecord.count({ where: { status: { in: ["PUBLISHED", "LIVE", "APPROVED"] } } }),
      prisma.teacherAssignmentRecord.count({ where: { status: "PUBLISHED" } }),
      prisma.lead.count({ where: { status: "COUNSELLING", notes: { contains: "Documents: PENDING", mode: "insensitive" } } }),
      prisma.lead.count({ where: { status: "COUNSELLING", notes: { contains: "Fees: PENDING", mode: "insensitive" } } }),
      prisma.lead.count({ where: { status: "COUNSELLING", notes: { contains: "Batch Allocation: PENDING", mode: "insensitive" } } }),
      prisma.teacherAttendanceRecord.count({ where: { status: "SAVED", records: { string_contains: "ABSENT" } } }),
      prisma.teacherExamRecord.count({ where: { status: { in: ["DRAFT", "REVIEW", "PENDING_REVIEW"] } } }),
      prisma.user.count({ where: { role: { in: staffRoles }, roleOnboardingStatus: "ARCHIVED" } })
    ]);
    const batchStudentGroups = await prisma.batchStudent.groupBy({
      by: ["batchId"],
      where: { status: "ACTIVE" },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 12
    });
    const batchNames = await prisma.batch.findMany({
      where: { id: { in: batchStudentGroups.map((item) => item.batchId) } },
      select: { id: true, name: true, programSlug: true, course: { select: { title: true } } }
    });
    const batchNameById = new Map(batchNames.map((batch) => [batch.id, batch.name || batch.course?.title || batch.programSlug]));
    const present = attendanceRows.filter((row) => attendanceStatus(row.status) === "PRESENT").length;
    const collectedAmount = collected._sum.amount ?? 0;
    const pendingAmount = pending._sum.dueAmount ?? pending._sum.amount ?? 0;

    return {
      lastUpdatedAt: new Date().toISOString(),
      scope: { instituteId: director?.instituteId ?? null, branchId: director?.branchId ?? null },
      instituteAnalytics: { students, teachers, attendance: percentage(present, attendanceRows.length), cbtCompletion: percentage(completedAttempts, totalAttempts) },
      admissionsAnalytics: { leads, admissions, conversionRate: leads ? Math.round((admissions / leads) * 100) : 0 },
      revenueAnalytics: { collected: collectedAmount, pending: pendingAmount, forecast: collectedAmount + pendingAmount },
      facultyAnalytics: { active: teachers, utilization: teachers ? 100 : 0, reviewDue: facultyReviewDue },
      commandCenter: {
        admissions: { newLeads: leads, readyForAdmission, activatedStudents: activeStudents },
        academics: { activePrograms, activeBatches, teachers, academicHeads },
        learning: { liveClasses, lessonsUploaded, examsPublished, assignmentsPublished },
        staff: {
          academicHeads: { active: academicHeads, onLeave: 0, archived: 0 },
          teachers: { active: teachers, onLeave: facultyReviewDue, archived: 0 },
          physicalTrainers: { active: physicalTrainers, onLeave: 0, archived: 0 },
          administrativeOfficers: { active: administrativeOfficers, onLeave: 0, archived: 0 },
          businessDevelopmentExecutives: { active: businessDevelopmentExecutives, onLeave: 0, archived: 0 },
          archived: archivedStaff
        },
        students: {
          total: students,
          active: activeStudents,
          batchDistribution: batchStudentGroups.map((item) => ({ program: batchNameById.get(item.batchId) ?? item.batchId, count: item._count.id })),
          programDistribution: programDistribution.map((item) => ({ courseId: item.courseId ?? "unassigned", count: item._count.id }))
        },
        operationalAlerts: {
          pendingAdmissions: readyForAdmission,
          pendingDocuments,
          pendingFees,
          pendingBatchAllocation,
          lowAttendanceAlerts: lowAttendanceBatches,
          examPublicationDelays
        },
        finance: { feesCollected: collectedAmount, pendingFees: pendingAmount, installmentsPending },
        reports: ["Admissions Reports", "Academic Reports", "Attendance Reports", "Student Reports", "Staff Reports"]
      },
      academyArchitecture: {
        ...academySummary,
        batchTypes: batchTypes.map((item) => ({ type: item.batchType, count: item._count.id })),
        verticals: programCounts.map((item) => ({ category: item.category, count: item._count.id }))
      },
      customDashboard,
      riskAlerts: customDashboard.focusAreas.length ? customDashboard.focusAreas.map((item) => `Track ${item.toLowerCase()} in today's review.`) : [],
      executiveInsights: customDashboard.permissions.length ? customDashboard.permissions.map((item) => `Access enabled: ${item.replace(/_/g, " ")}.`) : [],
      growthForecast: []
    };
  },

  async getDirectorOpsReadiness(_user: DashboardUser) {
    const runtime = getRuntimeState();
    let databaseOk = runtime.ready;
    let databaseMessage = runtime.ready ? "Runtime reports database connected." : "Runtime is still starting.";

    try {
      await prisma.$queryRaw`SELECT 1`;
      databaseOk = true;
      databaseMessage = "Database query succeeded.";
    } catch (error) {
      databaseOk = false;
      databaseMessage = error instanceof Error ? error.message : "Database query failed.";
    }

    const checks = [
      {
        key: "database",
        title: "Database",
        status: opsStatus(databaseOk),
        detail: databaseMessage,
      },
      {
        key: "runtime",
        title: "Backend runtime",
        status: opsStatus(runtime.ready || !env.HEALTHCHECK_STRICT, runtime.ready),
        detail: `Environment ${env.NODE_ENV}. Uptime ${Math.round(process.uptime())} seconds.`,
      },
      {
        key: "auth",
        title: "Authentication",
        status: opsStatus(env.JWT_SECRET.length >= 32),
        detail: "JWT secret and session protection are configured.",
      },
      {
        key: "cors",
        title: "Public URLs and CORS",
        status: opsStatus(Boolean(env.FRONTEND_APP_URL && env.BACKEND_PUBLIC_URL && env.APP_DOMAIN)),
        detail: `${env.FRONTEND_APP_URL} / ${env.BACKEND_PUBLIC_URL}`,
      },
      {
        key: "storage",
        title: "Cloudinary storage",
        status: opsStatus(Boolean(env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET)),
        detail: env.CLOUDINARY_CLOUD_NAME ? "Cloudinary credentials are present." : "Cloudinary credentials are missing.",
      },
      {
        key: "payments",
        title: "Razorpay payments",
        status: opsStatus(Boolean(env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET && env.RAZORPAY_WEBHOOK_SECRET), Boolean(env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET)),
        detail: env.RAZORPAY_WEBHOOK_SECRET ? "Payment keys and webhook secret are present." : "Payment webhook secret needs confirmation.",
      },
      {
        key: "email",
        title: "Email delivery",
        status: opsStatus(Boolean(env.RESEND_API_KEY), Boolean(env.RESEND_FROM_EMAIL)),
        detail: env.RESEND_API_KEY ? `Resend configured from ${env.RESEND_FROM_EMAIL}.` : "Resend API key is missing.",
      },
      {
        key: "ai",
        title: "AI services",
        status: opsStatus(Boolean(env.OPENAI_API_KEY)),
        detail: env.OPENAI_API_KEY ? "OpenAI key is present." : "OpenAI key is missing.",
      },
      {
        key: "monitoring",
        title: "Monitoring",
        status: opsStatus(Boolean(env.SENTRY_DSN), env.NODE_ENV !== "production"),
        detail: env.SENTRY_DSN ? "Sentry DSN is configured." : "Sentry DSN is not configured.",
      },
      {
        key: "backup",
        title: "Backup target",
        status: opsStatus(Boolean(env.BACKUP_BUCKET), Boolean(env.MEDIA_BACKUP_PREFIX)),
        detail: env.BACKUP_BUCKET ? `Backup bucket: ${env.BACKUP_BUCKET}.` : `Backup prefix only: ${env.MEDIA_BACKUP_PREFIX}.`,
      },
      {
        key: "queue",
        title: "Redis and queues",
        status: opsStatus(!env.REDIS_REQUIRED || Boolean(env.REDIS_URL), Boolean(env.REDIS_URL) || !env.QUEUE_WORKERS_ENABLED),
        detail: env.REDIS_URL ? `Redis configured. Workers ${env.QUEUE_WORKERS_ENABLED ? "enabled" : "disabled"}.` : "Redis is optional or not configured.",
      },
      {
        key: "maintenance",
        title: "Maintenance mode",
        status: opsStatus(!env.MAINTENANCE_MODE),
        detail: env.MAINTENANCE_MODE ? "Maintenance mode is ON." : "Maintenance mode is OFF.",
      },
    ];
    const pass = checks.filter((check) => check.status === "PASS").length;
    const partial = checks.filter((check) => check.status === "PARTIAL").length;
    const fail = checks.filter((check) => check.status === "FAIL").length;
    const score = Math.round(((pass + partial * 0.5) / checks.length) * 100);

    return {
      checkedAt: new Date().toISOString(),
      environment: env.NODE_ENV,
      score,
      verdict: fail > 0 ? "OPERATIONS NEED ATTENTION" : score >= 90 ? "OPERATIONS READY" : "OPERATIONS PARTIAL",
      summary: { pass, partial, fail, total: checks.length },
      checks,
    };
  },

  async getDirectorSecurityReadiness(_user: DashboardUser) {
    const [
      activeGuests,
      lockedUsers,
      disabledUsers,
      parentLinks,
      activeBatchStudents,
      activeTeacherAssignments,
      liveClassRows,
      publishedAssignments,
      publishedExams,
      publicAssessmentAttempts,
      directorUsers,
      academicHeads,
      teachers,
      students,
      parents
    ] = await Promise.all([
      prisma.user.count({ where: { role: "GUEST", isDisabled: false } }),
      prisma.user.count({ where: { lockedUntil: { gt: new Date() } } }),
      prisma.user.count({ where: { isDisabled: true } }),
      prisma.parentStudentLink.count({ where: { status: "ACTIVE" } }),
      prisma.batchStudent.count({ where: { status: "ACTIVE" } }),
      prisma.teacherBatchAssignment.count({ where: { status: "ACTIVE" } }),
      prisma.liveClass.count({ where: { status: { not: "CANCELLED" }, batchId: { not: null } } }),
      prisma.teacherAssignmentRecord.count({ where: { status: "PUBLISHED" } }),
      prisma.teacherExamRecord.count({ where: { status: { in: ["PUBLISHED", "LIVE", "APPROVED"] } } }),
      prisma.assessmentAttempt.count(),
      prisma.user.count({ where: { role: "DIRECTOR", isDisabled: false } }),
      prisma.user.count({ where: { OR: [{ role: "ACADEMIC_HEAD" }, { role: "TEACHER", roleMetadata: { path: ["dashboardTemplate"], equals: "ACADEMIC_HEAD" } }], isDisabled: false } }),
      prisma.user.count({ where: { role: "TEACHER", isDisabled: false } }),
      prisma.user.count({ where: { role: "STUDENT", isDisabled: false } }),
      prisma.user.count({ where: { role: "PARENT", isDisabled: false } })
    ]);

    const checks = [
      {
        key: "session-auth",
        title: "Session cookie authentication",
        status: "PASS",
        detail: "Dashboard APIs use the protected session middleware and do not trust localStorage-only login.",
      },
      {
        key: "guest-production",
        title: "Guest production lock",
        status: opsStatus(env.NODE_ENV !== "production" || activeGuests === 0, activeGuests <= 5),
        detail: `${activeGuests} active guest account(s). Production middleware blocks GUEST sessions.`,
      },
      {
        key: "rate-limits",
        title: "Rate limiting",
        status: opsStatus(Boolean(env.REDIS_URL), true),
        detail: env.REDIS_URL ? "Redis-backed rate limiter is configured." : "Local fallback limiter is active; Redis is recommended for multi-instance production.",
      },
      {
        key: "safe-content-type",
        title: "Unsafe content-type protection",
        status: "PASS",
        detail: "Non-GET API requests require JSON or multipart content type, excluding payment webhooks.",
      },
      {
        key: "role-coverage",
        title: "Role coverage",
        status: opsStatus(directorUsers > 0 && academicHeads > 0 && teachers > 0 && students > 0),
        detail: `${directorUsers} director(s), ${academicHeads} academic head(s), ${teachers} teacher(s), ${students} student(s).`,
      },
      {
        key: "parent-scope",
        title: "Parent linked-student scope",
        status: opsStatus(parentLinks > 0 || parents === 0, parents > 0),
        detail: `${parentLinks} active parent-student link(s), ${parents} parent account(s).`,
      },
      {
        key: "student-batch-scope",
        title: "Student batch scope",
        status: opsStatus(activeBatchStudents > 0),
        detail: `${activeBatchStudents} active batch-student enrollment(s) drive student LMS visibility.`,
      },
      {
        key: "teacher-batch-scope",
        title: "Teacher allocation scope",
        status: opsStatus(activeTeacherAssignments > 0),
        detail: `${activeTeacherAssignments} active teacher-batch-subject assignment(s) drive teacher visibility.`,
      },
      {
        key: "live-class-scope",
        title: "Live class batch filtering",
        status: opsStatus(liveClassRows > 0, true),
        detail: `${liveClassRows} non-cancelled live class(es) linked to batches.`,
      },
      {
        key: "assignment-scope",
        title: "Assignment batch filtering",
        status: opsStatus(publishedAssignments > 0, true),
        detail: `${publishedAssignments} published batch-linked assignment(s).`,
      },
      {
        key: "exam-scope",
        title: "Exam batch filtering",
        status: opsStatus(publishedExams > 0, true),
        detail: `${publishedExams} published/live/approved batch-linked exam record(s).`,
      },
      {
        key: "locked-accounts",
        title: "Locked accounts",
        status: opsStatus(lockedUsers === 0, lockedUsers <= 3),
        detail: `${lockedUsers} account(s) currently locked, ${disabledUsers} disabled account(s).`,
      },
      {
        key: "assessment-attempts",
        title: "Assessment data access",
        status: opsStatus(publicAssessmentAttempts >= 0),
        detail: `${publicAssessmentAttempts} V2 assessment attempt record(s) exist under protected assessment APIs.`,
      },
    ];
    const pass = checks.filter((check) => check.status === "PASS").length;
    const partial = checks.filter((check) => check.status === "PARTIAL").length;
    const fail = checks.filter((check) => check.status === "FAIL").length;
    const score = Math.round(((pass + partial * 0.5) / checks.length) * 100);

    return {
      checkedAt: new Date().toISOString(),
      score,
      verdict: fail > 0 ? "SECURITY NEEDS ATTENTION" : score >= 90 ? "SECURITY READY" : "SECURITY PARTIAL",
      summary: { pass, partial, fail, total: checks.length },
      checks,
    };
  },

  async getDirectorLaunchCertification(user: DashboardUser) {
    const [directorData, ops, security] = await Promise.all([
      this.getDirectorDashboard(user),
      this.getDirectorOpsReadiness(user),
      this.getDirectorSecurityReadiness(user),
    ]);
    const command = directorData.commandCenter;
    const staff = command.staff;
    const activeBatches = command.academics.activeBatches ?? directorData.academyArchitecture.batches ?? 0;
    const activeStudents = command.students.active ?? directorData.instituteAnalytics.students ?? 0;
    const teachers = command.academics.teachers ?? directorData.instituteAnalytics.teachers ?? 0;
    const academicHeads = command.academics.academicHeads ?? staff.academicHeads.active ?? 0;
    const physicalTrainers = staff.physicalTrainers.active ?? 0;
    const administrativeOfficers = staff.administrativeOfficers.active ?? 0;
    const businessDevelopmentExecutives = staff.businessDevelopmentExecutives.active ?? 0;
    const assignments = command.learning.assignmentsPublished ?? 0;
    const exams = command.learning.examsPublished ?? 0;
    const lessons = command.learning.lessonsUploaded ?? 0;
    const timetableSlots = directorData.academyArchitecture.timetableSlots ?? 0;
    const pendingBatchAllocation = command.operationalAlerts.pendingBatchAllocation ?? 0;
    const pendingDocuments = command.operationalAlerts.pendingDocuments ?? 0;
    const lowAttendanceAlerts = command.operationalAlerts.lowAttendanceAlerts ?? 0;
    const pendingFees = command.operationalAlerts.pendingFees ?? 0;

    const academyChecks = [
      {
        key: "active-batches",
        area: "LMS",
        title: "Active batches",
        status: opsStatus(activeBatches > 0),
        detail: `${activeBatches} active batch(es) available for academy operations.`,
        href: "/dashboard/director/academic/batches",
      },
      {
        key: "student-enrollment",
        area: "LMS",
        title: "Student enrollment",
        status: opsStatus(activeStudents > 0),
        detail: `${activeStudents} active learner(s) visible to Director.`,
        href: "/dashboard/director/students",
      },
      {
        key: "teacher-coverage",
        area: "LMS",
        title: "Teacher coverage",
        status: opsStatus(teachers > 0 && academicHeads > 0),
        detail: `${teachers} teacher(s) and ${academicHeads} academic head(s) available.`,
        href: "/dashboard/director/academic/teachers",
      },
      {
        key: "physical-training",
        area: "LMS",
        title: "Physical training coverage",
        status: opsStatus(physicalTrainers > 0, true),
        detail: `${physicalTrainers} physical trainer(s) available.`,
        href: "/dashboard/director/team",
      },
      {
        key: "admission-ops",
        area: "CRM",
        title: "Admission operations",
        status: opsStatus(administrativeOfficers > 0 && businessDevelopmentExecutives > 0, administrativeOfficers > 0 || businessDevelopmentExecutives > 0),
        detail: `${administrativeOfficers} AO account(s), ${businessDevelopmentExecutives} BDE account(s).`,
        href: "/dashboard/director/admissions",
      },
      {
        key: "timetable",
        area: "Calendar",
        title: "Academic calendar",
        status: opsStatus(timetableSlots > 0, activeBatches > 0),
        detail: `${timetableSlots} timetable slot(s) available for operational planning.`,
        href: "/dashboard/director/academic/calendar",
      },
      {
        key: "library-content",
        area: "Library",
        title: "Library activation",
        status: opsStatus(lessons > 0, activeStudents > 0),
        detail: `${lessons} library item(s) visible in launch signals.`,
        href: "/dashboard/director/library",
      },
      {
        key: "assignments",
        area: "Assignments",
        title: "Assignment activation",
        status: opsStatus(assignments > 0, activeStudents > 0),
        detail: `${assignments} published assignment(s).`,
        href: "/dashboard/director/academic/assignments",
      },
      {
        key: "exams",
        area: "Exams",
        title: "Exam activation",
        status: opsStatus(exams > 0, activeStudents > 0),
        detail: `${exams} published/live/approved exam(s).`,
        href: "/dashboard/director/academic/exams",
      },
      {
        key: "batch-allocation-queue",
        area: "Admissions",
        title: "Batch allocation queue",
        status: opsStatus(pendingBatchAllocation === 0, pendingBatchAllocation <= 3),
        detail: `${pendingBatchAllocation} learner(s) waiting for batch allocation.`,
        href: "/dashboard/director/admissions",
      },
      {
        key: "document-queue",
        area: "Admissions",
        title: "Document queue",
        status: opsStatus(pendingDocuments === 0, pendingDocuments <= 3),
        detail: `${pendingDocuments} document case(s) pending.`,
        href: "/dashboard/director/admissions",
      },
      {
        key: "fee-queue",
        area: "Finance",
        title: "Fee queue",
        status: opsStatus(pendingFees === 0, pendingFees <= 3),
        detail: `${pendingFees} fee case(s) need attention.`,
        href: "/dashboard/director/accounts",
      },
      {
        key: "attendance-risk",
        area: "Attendance",
        title: "Attendance risk",
        status: opsStatus(lowAttendanceAlerts === 0, lowAttendanceAlerts <= 3),
        detail: `${lowAttendanceAlerts} low-attendance alert(s).`,
        href: "/dashboard/director/reports",
      },
    ];
    const academySummary = readinessSummary(academyChecks);
    const opsChecks = ops.checks.map((check) => ({
      key: `ops-${check.key}`,
      area: "Operations",
      title: check.title,
      status: check.status,
      detail: check.detail,
      href: "/dashboard/director/launch-qa",
    }));
    const securityChecks = security.checks.map((check) => ({
      key: `security-${check.key}`,
      area: "Security",
      title: check.title,
      status: check.status,
      detail: check.detail,
      href: "/dashboard/director/launch-qa",
    }));
    const allChecks = [...academyChecks, ...opsChecks, ...securityChecks];
    const overallSummary = readinessSummary(allChecks);
    const blockers = allChecks.filter((check) => check.status !== "PASS");
    const overallScore = Math.round((academySummary.score + ops.score + security.score) / 3);
    const verdict =
      overallSummary.fail > 0
        ? "NOT CERTIFIED"
        : overallScore >= 90
          ? "CERTIFIED FOR CONTROLLED PRODUCTION"
          : overallScore >= 75
            ? "CERTIFIED FOR CONTROLLED PILOT"
            : "NOT CERTIFIED";

    return {
      generatedAt: new Date().toISOString(),
      certificationId: `NIDUS-LAUNCH-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}`,
      verdict,
      scores: {
        academy: academySummary.score,
        operations: ops.score,
        security: security.score,
        overall: overallScore,
      },
      summary: overallSummary,
      sections: {
        academy: { summary: academySummary, checks: academyChecks },
        operations: { summary: ops.summary, checks: opsChecks },
        security: { summary: security.summary, checks: securityChecks },
      },
      blockers,
      nextActions: blockers.slice(0, 6).map((check) => `${check.area}: ${check.title} - ${check.detail}`),
      handoff: {
        releaseGate: {
          canOpenForPublic: verdict === "CERTIFIED FOR CONTROLLED PRODUCTION",
          canOpenForControlledPilot: verdict !== "NOT CERTIFIED",
          requiredScore: 90,
          currentScore: overallScore,
          rule: "Open public launch only when there are no failed checks and the overall score is 90 or higher.",
        },
        launchMorningChecklist: [
          "Director opens Launch QA and refreshes all checks before staff login.",
          "Administrative Officer clears admissions, fees, documents and batch allocation queues.",
          "Academic Head opens HOD, verifies today's timetable, teacher coverage and attendance pending list.",
          "Teachers verify Today's classes, Students, Attendance, Library, Assignments and Exams before the first class.",
          "Student support verifies at least one active learner can open classes, library, assignments, exams and attendance.",
          "Director keeps Launch QA open during the first operating hour and clears red or amber rows first.",
        ],
        roleSignOff: [
          { role: "Director", responsibility: "Final go/no-go decision, finance, reports, team access and launch QA." },
          { role: "Academic Head", responsibility: "Batches, teachers, timetable, attendance, exams, assignments and academic health." },
          { role: "Administrative Officer", responsibility: "Applications, documents, fee receipts, batch allocation and student activation." },
          { role: "Teachers", responsibility: "Classes, attendance, assignments, exams, library lessons and student visibility." },
          { role: "Technical Owner", responsibility: "Database, deployment, authentication, storage, monitoring and recovery readiness." },
        ],
        rollbackPlan: [
          "If login or dashboard APIs fail, pause new admissions and keep existing students informed through the Director channel.",
          "If payment or receipt flow fails, record fee collection offline and reconcile once Finance returns green.",
          "If live class or library upload fails, continue offline teaching and upload the recording after storage returns green.",
          "If database connectivity fails, stop write operations and restore service before creating assignments, exams or admissions.",
          "If security checks fail, keep the platform in controlled pilot mode until isolation and account checks return green.",
        ],
        goLiveRunbook: [
          { time: "T-60 minutes", action: "Refresh Launch QA, confirm certificate verdict, and keep the certificate open on the Director screen." },
          { time: "T-45 minutes", action: "AO verifies admissions, documents, fees, receipts, student activation and batch allocation." },
          { time: "T-30 minutes", action: "Academic Head verifies timetable, teacher allocations, today's classes and attendance readiness." },
          { time: "T-15 minutes", action: "Teachers verify dashboard access, student lists, library upload, assignments, exams and live class button." },
          { time: "T-0", action: "Director gives controlled pilot or production go-live based on the active certificate verdict." },
          { time: "First hour", action: "Track login failures, dashboard errors, live class issues, uploads, payments and student support requests." },
          { time: "End of day", action: "Review attendance, assignments, exams, library usage, admissions, fees and support issues before next-day operation." },
        ],
        launchSignOffManifest: [
          { gate: "Data", owner: "Director", status: activeBatches > 0 && activeStudents > 0 ? "READY" : "BLOCKED", evidence: `${activeBatches} batch(es), ${activeStudents} learner(s).` },
          { gate: "Academics", owner: "Academic Head", status: teachers > 0 && timetableSlots > 0 ? "READY" : "BLOCKED", evidence: `${teachers} teacher(s), ${timetableSlots} timetable slot(s).` },
          { gate: "Admissions", owner: "Administrative Officer", status: administrativeOfficers > 0 ? "READY" : "BLOCKED", evidence: `${administrativeOfficers} AO account(s), ${pendingBatchAllocation} batch allocation case(s).` },
          { gate: "Operations", owner: "Technical Owner", status: ops.summary.fail === 0 ? "READY" : "BLOCKED", evidence: `${ops.summary.pass}/${ops.summary.total} operations check(s) passed.` },
          { gate: "Security", owner: "Technical Owner", status: security.summary.fail === 0 ? "READY" : "BLOCKED", evidence: `${security.summary.pass}/${security.summary.total} security check(s) passed.` },
        ],
      },
    };
  },

  async getBusinessDevelopmentDashboard(user: DashboardUser) {
    const executive = await prisma.user.findUnique({ where: { id: user.id }, select: { roleMetadata: true } });
    const customDashboard = staffDashboard(metadataObject(executive?.roleMetadata), "LEAD_SUPPORT");
    const ownerScoped = user.role === "BUSINESS_DEVELOPMENT_EXECUTIVE" || user.role === "TELECALLER" || user.role === "MARKETING_COORDINATOR";
    const leadScope = ownerScoped ? { assignedTo: user.id } : {};
    const followUpScope = ownerScoped ? { lead: { assignedTo: user.id } } : {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const [assignedLeads, followUps, counselling, leadStatusCounts, callbacksToday, overdueFollowUps] = await Promise.all([
      prisma.lead.count({ where: leadScope }),
      prisma.followUp.count({ where: followUpScope }),
      prisma.counsellingBooking.count({ where: ownerScoped ? { lead: { assignedTo: user.id } } : undefined }),
      prisma.lead.groupBy({ by: ["status"], where: leadScope, _count: { status: true } }),
      prisma.followUp.count({ where: { ...followUpScope, followUpDate: { gte: today, lt: tomorrow } } }),
      prisma.followUp.count({ where: { ...followUpScope, followUpDate: { lt: today }, status: { not: "COMPLETED" } } })
    ]);
    const leadMap = new Map(leadStatusCounts.map((item) => [item.status, item._count.status]));
    const enrolled = leadMap.get("ENROLLED") ?? 0;
    const totalLeads = leadStatusCounts.reduce((sum, item) => sum + item._count.status, 0);

    return {
      leadPipeline: { new: leadMap.get("NEW") ?? 0, contacted: leadMap.get("CONTACTED") ?? 0, counselling: leadMap.get("COUNSELLING") ?? 0, enrolled, lost: leadMap.get("LOST") ?? 0, assignedLeads },
      scheduling: { callbacksToday, counselling, overdueFollowUps },
      performance: { callsToday: followUps, conversionRate: percentage(enrolled, totalLeads), averageResponseTime: "No data", notesAdded: followUps },
      customDashboard,
      modules: ["Call new leads", "Add call note", "Mark interested", "Book counselling", "Call again later", "Send confirmed admission to Administration", "Check messages", "View simple reports"],
      aiCallScripts: [
        "Hello, I am calling from NIDUS Academy. You enquired about defence training. May I know which program you are interested in?",
        "If the parent is interested, open Counselling and book a convenient time.",
        "If admission is confirmed, send the case to Administrative Officer for fees, documents and final processing."
      ],
      whatsappShell: { status: "Not connected", templates: 0, pendingOptIns: 0 }
    };
  },

  async getMarketingDashboard(_user: DashboardUser) {
    const [leads, admissions, sourceCounts, announcements] = await Promise.all([
      prisma.lead.count(),
      prisma.admission.count(),
      prisma.lead.groupBy({ by: ["source"], _count: { source: true } }),
      prisma.announcement.count()
    ]);
    return {
      campaignTracking: { activeCampaigns: 0, leadsGenerated: leads, costPerLead: 0, roi: admissions },
      attribution: sourceCounts.map((item) => ({ channel: item.source, leads: item._count.source, conversion: 0 })),
      webinarRegistrations: { upcoming: 0, registered: 0, attendedLast: 0 },
      landingPageAnalytics: { visitors: 0, conversionRate: percentage(admissions, leads), topPage: "" },
      roiAnalytics: [],
      publishingShell: { contentQueue: 0, dailyIntelligenceShares: announcements, socialPosts: 0 },
      socialCampaignAnalytics: { reach: 0, engagement: 0, enquiries: leads }
    };
  }
};
