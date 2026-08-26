import { Role } from "../../generated/prisma/client.js";
import { prisma } from "../../config/prisma.js";
import { emitDomainEvent } from "../event-engine/event-engine.service.js";

type PerformanceActor = {
  id: string;
  name?: string | null;
  email?: string | null;
  role: Role;
  instituteId?: string | null;
  branchId?: string | null;
  roleMetadata?: Record<string, unknown> | null;
};

type StaffScore = {
  userId: string;
  name: string;
  email: string;
  role: Role;
  designation: string | null;
  department: string | null;
  assignedBatches: number;
  assignedSubjects: string[];
  plannedClasses: number;
  completedClasses: number;
  attendanceLogs: number;
  assignmentsPublished: number;
  examsPublished: number;
  materialsUploaded: number;
  syllabusItems: number;
  syllabusCompleted: number;
  workLogs: number;
  attendanceDays: number;
  payrollPending: number;
  classCompletionPercentage: number;
  attendanceMarkingPercentage: number;
  syllabusCompletionPercentage: number;
  productivityScore: number;
  hrScore: number;
  overallScore: number;
  status: "GREEN" | "ORANGE" | "RED";
  reviewReason: string | null;
};

const performanceRoles = new Set<Role>([Role.ADMIN, Role.DIRECTOR, Role.ACADEMIC_HEAD, Role.ADMINISTRATIVE_OFFICER]);
const staffRoles = [
  Role.TEACHER,
  Role.ACADEMIC_HEAD,
  Role.PHYSICAL_TRAINER,
  Role.ADMINISTRATIVE_OFFICER,
  Role.BUSINESS_DEVELOPMENT_EXECUTIVE,
  Role.TELECALLER,
  Role.MARKETING_COORDINATOR
];

const framework = [
  { key: "ATTENDANCE", label: "Attendance", source: "Attendance + TeacherAttendanceRecord" },
  { key: "WORK_LOGS", label: "Work Logs", source: "AcademicActivityAuditRecord + RoleActivity" },
  { key: "CLASS_PUNCTUALITY", label: "Class Punctuality", source: "AcademicCalendarItem + TeacherCalendarLogRecord" },
  { key: "SYLLABUS_COMPLETION", label: "Syllabus Completion", source: "TeacherSyllabusProgressRecord" },
  { key: "ASSIGNMENTS", label: "Assignments", source: "TeacherAssignmentRecord" },
  { key: "EXAMS", label: "Tests and Exams", source: "TeacherExamRecord" },
  { key: "MATERIALS", label: "Study Materials", source: "TeacherStudyMaterialRecord" },
  { key: "STUDENT_FEEDBACK", label: "Student Feedback", source: "Class Rating OS structured AuditLog feedback" },
  { key: "APPRAISAL", label: "Appraisal", source: "Computed performance score; Director approval required" },
  { key: "AWARDS", label: "Awards", source: "Monthly/yearly score ranking; Director approval required" }
] as const;

function requirePerformance(actor: PerformanceActor) {
  const template = typeof actor.roleMetadata?.dashboardTemplate === "string" ? actor.roleMetadata.dashboardTemplate.toUpperCase() : "";
  if (!performanceRoles.has(actor.role) && template !== "ACADEMIC_HEAD" && template !== "ADMINISTRATION") {
    throw Object.assign(new Error("Performance OS access required"), { statusCode: 403 });
  }
}

function periodWindow(period: "MONTH" | "YEAR" = "MONTH") {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  if (period === "YEAR") {
    start.setMonth(0, 1);
  } else {
    start.setDate(1);
  }
  const end = new Date();
  return { start, end, period };
}

function pct(part: number, total: number) {
  return total > 0 ? Math.round((part / total) * 100) : 0;
}

function average(values: number[]) {
  const real = values.filter((value) => Number.isFinite(value));
  return real.length ? Math.round(real.reduce((sum, value) => sum + value, 0) / real.length) : 0;
}

function status(score: number): "GREEN" | "ORANGE" | "RED" {
  if (score >= 75) return "GREEN";
  if (score >= 50) return "ORANGE";
  return "RED";
}

function reviewReason(score: StaffScore) {
  if (score.plannedClasses >= 4 && score.classCompletionPercentage < 60) return "Class completion below expected level.";
  if (score.completedClasses >= 4 && score.attendanceMarkingPercentage < 70) return "Attendance marking is not consistent.";
  if (score.syllabusItems >= 3 && score.syllabusCompletionPercentage < 60) return "Syllabus progress needs Academic Head review.";
  if (score.overallScore < 55) return "Overall performance needs support and review.";
  return null;
}

async function auditView(actor: PerformanceActor, action: string, metadata: Record<string, unknown>) {
  await prisma.auditLog.create({
    data: {
      userId: actor.id,
      module: "performance-os",
      action,
      description: JSON.stringify({ description: action, actorRole: actor.role, metadata })
    }
  }).catch(() => undefined);
  emitDomainEvent({
    category: "TEACHER_PERFORMANCE",
    eventName: action,
    title: action.replaceAll("_", " ").toLowerCase(),
    description: "Performance OS operating view was used.",
    actor,
    entityType: "PerformanceOS",
    severity: "INFO",
    source: "API",
    metadata
  });
}

export const performanceOsService = {
  framework() {
    return {
      name: "NIDUS Teacher and HR Performance Operating System",
      principle: "Performance must be measured from actual work signals and used for support, appraisal readiness and awards. HR decisions require human approval.",
      framework
    };
  },

  async dashboard(actor: PerformanceActor, period: "MONTH" | "YEAR" = "MONTH") {
    requirePerformance(actor);
    const window = periodWindow(period);
    if (actor.role !== Role.ADMIN && !actor.instituteId) {
      throw Object.assign(new Error("Institution scope is required for Performance OS"), { statusCode: 403 });
    }
    const scopedUserIds = actor.instituteId
      ? (await prisma.user.findMany({ where: { instituteId: actor.instituteId }, select: { id: true } })).map((item) => item.id)
      : null;
    const staffIds = scopedUserIds ?? undefined;
    const [
      users,
      faculty,
      batchAssignments,
      calendarLogs,
      attendanceRows,
      assignments,
      exams,
      materials,
      progress,
      workLogs,
      roleActivity,
      payroll
    ] = await Promise.all([
      prisma.user.findMany({
        where: { id: staffIds ? { in: staffIds } : undefined, role: { in: staffRoles }, isDisabled: false },
        select: { id: true, name: true, email: true, role: true, roleMetadata: true, lastLoginAt: true, lastRoleActivityAt: true },
        orderBy: { name: "asc" }
      }),
      prisma.faculty.findMany({ where: { user: { id: staffIds ? { in: staffIds } : undefined } }, include: { user: { select: { id: true, name: true, email: true, role: true } } } }),
      prisma.teacherBatchAssignment.findMany({ where: { status: "ACTIVE", teacherId: staffIds ? { in: staffIds } : undefined } }),
      prisma.teacherCalendarLogRecord.findMany({ where: { teacherId: staffIds ? { in: staffIds } : undefined, createdAt: { gte: window.start, lte: window.end } } }),
      prisma.teacherAttendanceRecord.findMany({ where: { teacherId: staffIds ? { in: staffIds } : undefined, createdAt: { gte: window.start, lte: window.end } } }),
      prisma.teacherAssignmentRecord.findMany({ where: { teacherId: staffIds ? { in: staffIds } : undefined, status: { not: "ARCHIVED" }, createdAt: { gte: window.start, lte: window.end } } }),
      prisma.teacherExamRecord.findMany({ where: { teacherId: staffIds ? { in: staffIds } : undefined, status: { not: "ARCHIVED" }, createdAt: { gte: window.start, lte: window.end } } }),
      prisma.teacherStudyMaterialRecord.findMany({ where: { teacherId: staffIds ? { in: staffIds } : undefined, status: { not: "ARCHIVED" }, createdAt: { gte: window.start, lte: window.end } } }),
      prisma.teacherSyllabusProgressRecord.findMany({ where: { teacherId: staffIds ? { in: staffIds } : undefined, updatedAt: { gte: window.start, lte: window.end } } }),
      prisma.academicActivityAuditRecord.findMany({ where: { actorId: staffIds ? { in: staffIds } : undefined, createdAt: { gte: window.start, lte: window.end } } }),
      prisma.roleActivity.findMany({ where: { userId: staffIds ? { in: staffIds } : undefined, createdAt: { gte: window.start, lte: window.end }, role: { in: staffRoles } } }),
      prisma.payroll.findMany({ where: { faculty: { user: { id: staffIds ? { in: staffIds } : undefined } } }, include: { faculty: true } })
    ]);

    const facultyByUser = new Map(faculty.map((item) => [item.userId, item]));
    const pendingPayrollByUser = new Map<string, number>();
    for (const item of payroll.filter((entry) => entry.paidStatus !== "PAID")) {
      pendingPayrollByUser.set(item.faculty.userId, (pendingPayrollByUser.get(item.faculty.userId) ?? 0) + 1);
    }

    const staff: StaffScore[] = users.map((user) => {
      const userAssignments = batchAssignments.filter((item) => item.teacherId === user.id);
      const userCalendar = calendarLogs.filter((item) => item.teacherId === user.id);
      const completedClasses = userCalendar.filter((item) => String(item.completionStatus).toUpperCase() === "COMPLETED").length;
      const userAttendance = attendanceRows.filter((item) => item.teacherId === user.id);
      const userAssignmentsPublished = assignments.filter((item) => item.teacherId === user.id);
      const userExams = exams.filter((item) => item.teacherId === user.id);
      const userMaterials = materials.filter((item) => item.teacherId === user.id);
      const userProgress = progress.filter((item) => item.teacherId === user.id);
      const syllabusCompleted = userProgress.filter((item) => String(item.completionStatus).toUpperCase() === "COMPLETED").length;
      const userWorkLogs = workLogs.filter((item) => item.actorId === user.id);
      const userRoleActivity = roleActivity.filter((item) => item.userId === user.id);
      const facultyProfile = facultyByUser.get(user.id);
      const plannedClasses = userCalendar.length || userAssignments.length;
      const classCompletionPercentage = pct(completedClasses, plannedClasses);
      const attendanceMarkingPercentage = pct(userAttendance.length, completedClasses || plannedClasses);
      const syllabusCompletionPercentage = pct(syllabusCompleted, userProgress.length);
      const academicProductivity = average([
        classCompletionPercentage,
        attendanceMarkingPercentage,
        syllabusCompletionPercentage,
        pct(userAssignmentsPublished.length, Math.max(completedClasses, 1)),
        pct(userMaterials.length, Math.max(completedClasses, 1)),
        pct(userExams.length, Math.max(Math.floor(completedClasses / 4), 1))
      ]);
      const hrScore = average([
        user.lastLoginAt ? 100 : 60,
        user.lastRoleActivityAt ? 100 : 60,
        pendingPayrollByUser.get(user.id) ? 60 : 100,
        facultyProfile?.status === "ACTIVE" || !facultyProfile ? 100 : 50
      ]);
      const overallScore = user.role === Role.TEACHER || user.role === Role.ACADEMIC_HEAD || user.role === Role.PHYSICAL_TRAINER
        ? average([academicProductivity, hrScore])
        : average([hrScore, pct(userRoleActivity.length, 5)]);

      const score: StaffScore = {
        userId: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        designation: facultyProfile?.designation ?? (typeof user.roleMetadata === "object" && user.roleMetadata && !Array.isArray(user.roleMetadata) ? String((user.roleMetadata as Record<string, unknown>).designation ?? "") || null : null),
        department: facultyProfile?.department ?? null,
        assignedBatches: new Set(userAssignments.map((item) => item.batchId)).size,
        assignedSubjects: Array.from(new Set(userAssignments.map((item) => item.subject).filter(Boolean))),
        plannedClasses,
        completedClasses,
        attendanceLogs: userAttendance.length,
        assignmentsPublished: userAssignmentsPublished.length,
        examsPublished: userExams.length,
        materialsUploaded: userMaterials.length,
        syllabusItems: userProgress.length,
        syllabusCompleted,
        workLogs: userWorkLogs.length + userRoleActivity.length,
        attendanceDays: userAttendance.length,
        payrollPending: pendingPayrollByUser.get(user.id) ?? 0,
        classCompletionPercentage,
        attendanceMarkingPercentage,
        syllabusCompletionPercentage,
        productivityScore: academicProductivity,
        hrScore,
        overallScore,
        status: status(overallScore),
        reviewReason: null
      };
      score.reviewReason = reviewReason(score);
      return score;
    }).sort((a, b) => b.overallScore - a.overallScore || a.name.localeCompare(b.name));

    const teachers = staff.filter((item) => item.role === Role.TEACHER || item.role === Role.ACADEMIC_HEAD || item.role === Role.PHYSICAL_TRAINER);
    const needsReview = staff.filter((item) => item.reviewReason).slice(0, 12);
    const awards = {
      period,
      bestTeacherCandidates: teachers.filter((item) => item.completedClasses || item.syllabusItems || item.assignmentsPublished).slice(0, 5),
      bestStaffCandidates: staff.slice(0, 5),
      approvalRequired: true,
      note: "Awards are recommendations only. Director approval is required before publishing Best Teacher or Best Staff awards."
    };

    const result = {
      name: "NIDUS Teacher and HR Performance Operating System",
      generatedAt: new Date().toISOString(),
      period,
      health: status(average(staff.map((item) => item.overallScore))),
      summary: {
        staff: staff.length,
        teachers: teachers.length,
        green: staff.filter((item) => item.status === "GREEN").length,
        orange: staff.filter((item) => item.status === "ORANGE").length,
        red: staff.filter((item) => item.status === "RED").length,
        needsReview: needsReview.length,
        averageScore: average(staff.map((item) => item.overallScore)),
        feedbackSystemStatus: "CLASS_RATING_OS_READY"
      },
      staff,
      needsReview,
      awards,
      roleWorkflow: this.roleWorkflow(actor.role),
      framework
    };

    await auditView(actor, "PERFORMANCE_OS_VIEWED", { period, averageScore: result.summary.averageScore, needsReview: needsReview.length });
    return result;
  },

  async staffMember(actor: PerformanceActor, userId: string, period: "MONTH" | "YEAR" = "MONTH") {
    const dashboard = await this.dashboard(actor, period);
    const staff = dashboard.staff.find((item) => item.userId === userId);
    if (!staff) throw Object.assign(new Error("Staff member not found"), { statusCode: 404 });
    await auditView(actor, "PERFORMANCE_OS_STAFF_VIEWED", { userId, period, score: staff.overallScore });
    return {
      staff,
      appraisalReadiness: {
        readyForAppraisal: staff.overallScore >= 70 || Boolean(staff.reviewReason),
        approvalRequired: true,
        suggestedAppraisalType: staff.overallScore >= 85 ? "RECOGNITION" : staff.overallScore < 55 ? "SUPPORT_REVIEW" : "MONTHLY_REVIEW",
        note: "This is a computed recommendation. HR or Director must complete the actual appraisal decision."
      },
      evidence: {
        classCompletion: staff.classCompletionPercentage,
        attendanceMarking: staff.attendanceMarkingPercentage,
        syllabusCompletion: staff.syllabusCompletionPercentage,
        assignments: staff.assignmentsPublished,
        exams: staff.examsPublished,
        materials: staff.materialsUploaded,
        workLogs: staff.workLogs,
        payrollPending: staff.payrollPending
      }
    };
  },

  roleWorkflow(role: Role) {
    if (role === Role.ACADEMIC_HEAD) {
      return [
        "Review teacher score",
        "Check class completion",
        "Check attendance marking",
        "Check syllabus completion",
        "Identify support-needed teachers",
        "Recommend award candidates"
      ];
    }
    if (role === Role.ADMINISTRATIVE_OFFICER) {
      return [
        "Review staff records",
        "Check payroll pending",
        "Check onboarding status",
        "Prepare appraisal queue",
        "Send HR items for Director approval"
      ];
    }
    return [
      "Review performance health",
      "Check best teacher candidates",
      "Check review-needed employees",
      "Approve awards only after review",
      "Ask NIDUS AI Director for staff risks"
    ];
  }
};
