import { prisma } from "../../config/prisma.js";
import type { Role } from "../../generated/prisma/client.js";

type DashboardUser = {
  id: string;
  role: Role;
};

const paidStatuses = ["SUCCESS", "PAID", "VERIFIED", "CAPTURED"];
const staffRoles: Role[] = ["ADMIN", "DIRECTOR", "TEACHER", "TELECALLER", "MARKETING_COORDINATOR"];

function percentage(part: number, total: number) {
  return total > 0 ? Math.round((part / total) * 100) : 0;
}

function monthLabel(date: Date) {
  return date.toLocaleString("en-US", { month: "short" });
}

function attendanceStatus(status: string) {
  return status.trim().toUpperCase();
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

export const dashboardService = {
  async getStudentDashboard(user: DashboardUser) {
    const profile = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, name: true, email: true, mobile: true, role: true }
    });

    const [enrollments, liveTests, attendanceRows, leaderboard, studentCount, recommendations, fitness, lectureProgress, attempts, psychometricAttempts] = await Promise.all([
      prisma.enrollment.findMany({
        where: { userId: user.id },
        orderBy: { enrolledAt: "desc" },
        include: { course: { include: { modules: { orderBy: { order: "asc" }, include: { lessons: { orderBy: { order: "asc" }, take: 1 } } } } } }
      }),
      prisma.test.findMany({ where: { isLive: true }, orderBy: { createdAt: "desc" }, take: 5, include: { _count: { select: { questions: true } } } }),
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
        batch: "No batch assigned"
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
    const [attempts, attendanceRows, fees, notifications, discipline, psychometricAttempts] = await Promise.all([
      studentId ? prisma.testAttempt.findMany({ where: { userId: studentId, submittedAt: { not: null } }, orderBy: { submittedAt: "asc" }, take: 12 }) : [],
      studentId ? prisma.attendance.findMany({ where: { userId: studentId }, orderBy: { date: "asc" } }) : [],
      studentId ? prisma.feeInstallment.findMany({ where: { studentId }, orderBy: { dueDate: "asc" } }) : [],
      prisma.notification.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 5 }),
      studentId ? prisma.disciplineRecord.findMany({ where: { studentId }, orderBy: { createdAt: "desc" }, take: 5 }) : [],
      studentId
        ? prisma.psychometricAttempt.findMany({
            where: { userId: studentId, completedAt: { not: null } },
            orderBy: { completedAt: "desc" },
            include: { test: { select: { id: true, title: true, type: true } } }
          })
        : []
    ]);
    const present = attendanceRows.filter((row) => attendanceStatus(row.status) === "PRESENT").length;
    const averageScore = attempts.length ? Math.round(attempts.reduce((sum, attempt) => sum + attempt.score, 0) / attempts.length) : 0;
    const firstScore = attempts[0]?.score ?? 0;
    const lastScore = attempts.at(-1)?.score ?? 0;
    const dueFees = fees.filter((fee) => fee.paidStatus !== "PAID");

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
        percentage: percentage(present, attendanceRows.length),
        present,
        total: attendanceRows.length
      },
      feeStatus: {
        status: dueFees.length ? "PENDING" : fees.length ? "PAID" : "NO_FEE_PLAN",
        dueAmount: dueFees.reduce((sum, fee) => sum + (fee.dueAmount || fee.amount - fee.paidAmount), 0),
        nextDueDate: dueFees[0]?.dueDate.toISOString() ?? ""
      },
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
    const [totalStudents, recentAdmissions, revenue, attendanceToday, staffCounts, hostelRooms] = await Promise.all([
      prisma.user.count({ where: { role: "STUDENT" } }),
      prisma.admission.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: { student: { select: { id: true, name: true, email: true, mobile: true, role: true, createdAt: true } } }
      }),
      prisma.payment.aggregate({ where: { paymentStatus: { in: paidStatuses } }, _sum: { amount: true } }),
      prisma.attendance.findMany({ where: { date: { gte: today } } }),
      prisma.user.groupBy({ by: ["role"], where: { role: { in: staffRoles } }, _count: { role: true } }),
      prisma.room.aggregate({ _sum: { occupiedCount: true, capacity: true } })
    ]);
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
      customDashboard
    };
  },

  async getGuestDashboard() {
    const [courses, tests, announcements] = await Promise.all([
      prisma.course.findMany({ orderBy: { createdAt: "desc" }, take: 4 }),
      prisma.test.findMany({ where: { isLive: true }, orderBy: { createdAt: "desc" }, take: 3, include: { _count: { select: { questions: true } } } }),
      prisma.announcement.findMany({ orderBy: { createdAt: "desc" }, take: 5 })
    ]);
    return {
      featuredCourses: courses.map((course) => ({ id: course.id, title: course.title, duration: course.duration, level: course.category })),
      freeTests: tests.map((test) => ({ id: test.id, title: test.title, questions: test._count.questions })),
      latestNews: announcements.map((announcement) => announcement.title)
    };
  },

  async getTeacherDashboard(user: DashboardUser) {
    const profile = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, name: true, email: true, mobile: true, role: true, instituteId: true, branchId: true, roleMetadata: true }
    });
    const customDashboard = staffDashboard(metadataObject(profile?.roleMetadata), "SUBJECT_FACULTY");
    const subject = customDashboard.subject;

    const [attendanceRows, attempts, lectures, documents, tests, recommendations] = await Promise.all([
      prisma.attendance.findMany({ orderBy: { date: "desc" }, take: 200 }),
      prisma.testAttempt.findMany({ where: { submittedAt: { not: null } }, orderBy: { submittedAt: "desc" }, take: 100 }),
      prisma.recordedLecture.count(),
      prisma.document.count(),
      prisma.test.count(),
      prisma.aIRecommendation.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 5 })
    ]);
    const present = attendanceRows.filter((row) => attendanceStatus(row.status) === "PRESENT").length;
    const averageScore = attempts.length ? Math.round(attempts.reduce((sum, attempt) => sum + attempt.score, 0) / attempts.length) : 0;
    const weakAttempts = attempts.filter((attempt) => attempt.score < 50);

    return {
      profile,
      customDashboard,
      subjects: subject ? [subject] : customDashboard.focusAreas,
      classPerformance: { averageScore, attendance: percentage(present, attendanceRows.length), weakStudentCount: attempts.filter((attempt) => attempt.score < 50).length, assignmentsDue: 0 },
      contentOps: {
        lectureUploads: lectures,
        notesUploads: documents,
        pendingReviews: 0,
        cbtDrafts: tests
      },
      modules: [
        { title: customDashboard.designation || "Subject assignment", status: "Ready", metric: customDashboard.department || "Configure through staff profiles" },
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
    const [students, leads, admissions, teachers, attendanceRows, completedAttempts, totalAttempts, collected, pending, facultyReviewDue] = await Promise.all([
      prisma.user.count({ where: { role: "STUDENT", ...scopedWhere } }),
      prisma.lead.count(),
      prisma.admission.count(),
      prisma.user.count({ where: { role: "TEACHER", ...scopedWhere } }),
      prisma.attendance.findMany({ orderBy: { date: "desc" }, take: 500 }),
      prisma.testAttempt.count({ where: { submittedAt: { not: null } } }),
      prisma.testAttempt.count(),
      prisma.payment.aggregate({ where: { paymentStatus: { in: paidStatuses } }, _sum: { amount: true } }),
      prisma.feeInstallment.aggregate({ where: { paidStatus: { not: "PAID" } }, _sum: { dueAmount: true, amount: true } }),
      prisma.faculty.count({ where: { status: { not: "ACTIVE" } } })
    ]);
    const present = attendanceRows.filter((row) => attendanceStatus(row.status) === "PRESENT").length;
    const collectedAmount = collected._sum.amount ?? 0;
    const pendingAmount = pending._sum.dueAmount ?? pending._sum.amount ?? 0;

    return {
      scope: { instituteId: director?.instituteId ?? null, branchId: director?.branchId ?? null },
      instituteAnalytics: { students, teachers, attendance: percentage(present, attendanceRows.length), cbtCompletion: percentage(completedAttempts, totalAttempts) },
      admissionsAnalytics: { leads, admissions, conversionRate: leads ? Math.round((admissions / leads) * 100) : 0 },
      revenueAnalytics: { collected: collectedAmount, pending: pendingAmount, forecast: collectedAmount + pendingAmount },
      facultyAnalytics: { active: teachers, utilization: teachers ? 100 : 0, reviewDue: facultyReviewDue },
      customDashboard,
      riskAlerts: customDashboard.focusAreas.length ? customDashboard.focusAreas.map((item) => `Track ${item.toLowerCase()} in today's review.`) : [],
      executiveInsights: customDashboard.permissions.length ? customDashboard.permissions.map((item) => `Access enabled: ${item.replace(/_/g, " ")}.`) : [],
      growthForecast: []
    };
  },

  async getTelecallerDashboard(user: DashboardUser) {
    const telecaller = await prisma.user.findUnique({ where: { id: user.id }, select: { roleMetadata: true } });
    const customDashboard = staffDashboard(metadataObject(telecaller?.roleMetadata), "LEAD_SUPPORT");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const [assignedLeads, followUps, counselling, leadStatusCounts, callbacksToday, overdueFollowUps] = await Promise.all([
      prisma.lead.count({ where: { assignedTo: user.role === "TELECALLER" ? user.id : undefined } }),
      prisma.followUp.count({ where: { createdBy: user.role === "TELECALLER" ? user.id : undefined } }),
      prisma.counsellingBooking.count(),
      prisma.lead.groupBy({ by: ["status"], _count: { status: true } }),
      prisma.followUp.count({ where: { followUpDate: { gte: today, lt: tomorrow }, createdBy: user.role === "TELECALLER" ? user.id : undefined } }),
      prisma.followUp.count({ where: { followUpDate: { lt: today }, status: { not: "COMPLETED" }, createdBy: user.role === "TELECALLER" ? user.id : undefined } })
    ]);
    const leadMap = new Map(leadStatusCounts.map((item) => [item.status, item._count.status]));
    const enrolled = leadMap.get("ENROLLED") ?? 0;
    const totalLeads = leadStatusCounts.reduce((sum, item) => sum + item._count.status, 0);

    return {
      leadPipeline: { new: leadMap.get("NEW") ?? 0, contacted: leadMap.get("CONTACTED") ?? 0, counselling: leadMap.get("COUNSELLING") ?? 0, enrolled, lost: leadMap.get("LOST") ?? 0, assignedLeads },
      scheduling: { callbacksToday, counselling, overdueFollowUps },
      performance: { callsToday: followUps, conversionRate: percentage(enrolled, totalLeads), averageResponseTime: "No data", notesAdded: followUps },
      customDashboard,
      modules: ["Lead pipeline", "Enquiry tracking", "Callback scheduling", "Counselling scheduling", "Follow-up tracking", "Lead notes", "Conversion analytics", "AI call-script suggestions", "WhatsApp integration"],
      aiCallScripts: [],
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
