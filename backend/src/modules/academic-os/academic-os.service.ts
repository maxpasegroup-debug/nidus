import { Prisma, Role } from "../../generated/prisma/client.js";
import { prisma } from "../../config/prisma.js";
import { emitDomainEvent } from "../event-engine/event-engine.service.js";

type AcademicActor = {
  id: string;
  name?: string | null;
  email?: string | null;
  role: Role;
  instituteId?: string | null;
  branchId?: string | null;
  roleMetadata?: Record<string, unknown> | null;
};

type CalendarRow = {
  id: string;
  batchId: string | null;
  batchName: string | null;
  programSlug: string | null;
  subject: string;
  topic: string;
  classType?: string | null;
  plannedDate: Date;
  startTime: string | Date | null;
  endTime: string | Date | null;
  teacherId: string | null;
  teacherName: string | null;
  status: string;
  completionStatus: string;
  teacherLog: string | null;
  nextAction: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type AttendanceRow = {
  id: string;
  batchId: string;
  batchName: string | null;
  subject: string | null;
  teacherId: string | null;
  teacherName: string | null;
  date: Date;
  records: unknown;
  status: string;
  createdAt: Date;
  updatedAt: Date;
};

type BatchSummary = {
  batchId: string;
  batchName: string;
  programSlug: string;
  students: number;
  teachers: number;
  plannedClasses: number;
  completedClasses: number;
  pendingClasses: number;
  missedClasses: number;
  attendanceSessions: number;
  assignments: number;
  exams: number;
  materials: number;
  syllabusItems: number;
  syllabusCompleted: number;
  completionPercentage: number;
  attendanceCoveragePercentage: number;
  syllabusCompletionPercentage: number;
  health: "GREEN" | "ORANGE" | "RED";
};

const academicRoles = new Set<Role>([Role.ADMIN, Role.DIRECTOR, Role.ACADEMIC_HEAD, Role.TEACHER, Role.PHYSICAL_TRAINER]);

const flow = [
  { key: "PROGRAM", label: "Program", existingSource: "Course + Batch programSlug", actionRoute: "/api/academy/batches" },
  { key: "BATCH", label: "Batch", existingSource: "Batch, BatchStudent, TeacherBatchAssignment", actionRoute: "/api/academy/batches" },
  { key: "CURRICULUM", label: "Curriculum", existingSource: "Course, Module, Lesson, Academic Planner JSON", actionRoute: "/api/academy/batches" },
  { key: "TIMETABLE", label: "Timetable", existingSource: "AcademicCalendarItem + Timetable", actionRoute: "/api/academy/academic-calendar" },
  { key: "CLASS", label: "Class", existingSource: "AcademicCalendarItem", actionRoute: "/api/academy/today" },
  { key: "ATTENDANCE", label: "Attendance", existingSource: "TeacherAttendanceRecord + Attendance", actionRoute: "/api/academy/attendance" },
  { key: "COMPLETION", label: "Completion", existingSource: "TeacherCalendarLogRecord", actionRoute: "/api/academy/today/actions" },
  { key: "MATERIAL", label: "Study Material", existingSource: "TeacherStudyMaterialRecord", actionRoute: "/api/academy/study-materials" },
  { key: "ASSIGNMENT", label: "Assignment", existingSource: "TeacherAssignmentRecord + AssignmentSubmissionRecord", actionRoute: "/api/academy/assignments" },
  { key: "DAILY_EXAM", label: "Daily Exam", existingSource: "TeacherExamRecord + Test", actionRoute: "/api/academy/exams" },
  { key: "PROGRESS", label: "Progress", existingSource: "TeacherSyllabusProgressRecord + summaries", actionRoute: "/api/academy/student-progress-summary" }
] as const;

function requireAcademic(actor: AcademicActor) {
  const template = typeof actor.roleMetadata?.dashboardTemplate === "string" ? actor.roleMetadata.dashboardTemplate.toUpperCase() : "";
  if (!academicRoles.has(actor.role) && template !== "ACADEMIC_HEAD") {
    throw Object.assign(new Error("Academic OS access required"), { statusCode: 403 });
  }
}

function dayWindow(value = new Date()) {
  const start = new Date(value);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
}

function monthWindow(value = new Date()) {
  const start = new Date(value);
  start.setDate(1);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setMonth(end.getMonth() + 1);
  return { start, end };
}

function pct(part: number, total: number) {
  return total > 0 ? Math.round((part / total) * 100) : 0;
}

function average(values: number[]) {
  const real = values.filter((value) => Number.isFinite(value));
  return real.length ? Math.round(real.reduce((sum, value) => sum + value, 0) / real.length) : 0;
}

function health(score: number): "GREEN" | "ORANGE" | "RED" {
  if (score >= 75) return "GREEN";
  if (score >= 50) return "ORANGE";
  return "RED";
}

function completionStatus(row: CalendarRow) {
  return String(row.completionStatus || row.status || "PENDING").toUpperCase();
}

function isCompleted(row: CalendarRow) {
  return completionStatus(row) === "COMPLETED";
}

function attendanceRecords(row: AttendanceRow) {
  if (Array.isArray(row.records)) return row.records as Array<Record<string, unknown>>;
  if (typeof row.records === "string") {
    try {
      const parsed = JSON.parse(row.records);
      return Array.isArray(parsed) ? parsed as Array<Record<string, unknown>> : [];
    } catch {
      return [];
    }
  }
  return [];
}

function normalizeDate(value: Date | string | null) {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : value;
}

function normalizeCalendar(row: CalendarRow) {
  return {
    ...row,
    plannedDate: row.plannedDate.toISOString(),
    startTime: normalizeDate(row.startTime),
    endTime: normalizeDate(row.endTime),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  };
}

function batchRisk(summary: BatchSummary) {
  const risks: string[] = [];
  if (summary.completionPercentage < 65 && summary.plannedClasses > 0) risks.push("Class completion is behind plan.");
  if (summary.attendanceCoveragePercentage < 70 && summary.completedClasses > 0) risks.push("Attendance is not marked for enough completed classes.");
  if (summary.syllabusCompletionPercentage < 60 && summary.syllabusItems > 0) risks.push("Syllabus progress is weak.");
  if (summary.assignments === 0 && summary.completedClasses >= 3) risks.push("Classes are happening without assignments.");
  if (summary.exams === 0 && summary.completedClasses >= 5) risks.push("No exam or daily test has been published for this batch.");
  return risks;
}

async function scopedBatchIds(actor: AcademicActor) {
  if (actor.role !== Role.TEACHER && actor.role !== Role.PHYSICAL_TRAINER) return null;
  const assignments = await prisma.teacherBatchAssignment.findMany({
    where: { teacherId: actor.id, status: "ACTIVE" },
    select: { batchId: true }
  });
  return assignments.map((item) => item.batchId);
}

async function auditView(actor: AcademicActor, action: string, metadata: Record<string, unknown>) {
  await prisma.auditLog.create({
    data: {
      userId: actor.id,
      module: "academic-os",
      action,
      description: JSON.stringify({ description: action, actorRole: actor.role, metadata })
    }
  }).catch(() => undefined);
  emitDomainEvent({
    category: "ACADEMIC",
    eventName: action,
    title: action.replaceAll("_", " ").toLowerCase(),
    description: "Academic OS operating view was used.",
    actor,
    entityType: "AcademicOS",
    severity: "INFO",
    source: "API",
    metadata
  });
}

export const academicOsService = {
  flow() {
    return {
      name: "NIDUS Academic Operating System",
      principle: "Every academic activity should start from planner visibility and flow into class, attendance, completion, material, assignment, exam and progress.",
      flow
    };
  },

  async dashboard(actor: AcademicActor) {
    requireAcademic(actor);
    const scopedIds = await scopedBatchIds(actor);
    const { start, end } = dayWindow();
    const month = monthWindow();
    const batchWhere = scopedIds ? { id: { in: scopedIds } } : {};

    const [
      batches,
      calendarToday,
      calendarMonth,
      attendanceToday,
      attendanceMonth,
      assignmentMonth,
      examMonth,
      materialMonth,
      progressRows,
      auditRows
    ] = await Promise.all([
      prisma.batch.findMany({
        where: batchWhere,
        include: {
          _count: { select: { students: true, teachers: true } },
          course: { select: { id: true, title: true, slug: true } }
        },
        orderBy: { createdAt: "desc" },
        take: 100
      }),
      scopedIds?.length === 0 ? Promise.resolve([]) : scopedIds
        ? prisma.$queryRaw<CalendarRow[]>`SELECT * FROM "AcademicCalendarItem" WHERE "batchId" IN (${Prisma.join(scopedIds)}) AND "plannedDate" >= ${start} AND "plannedDate" < ${end} ORDER BY "plannedDate" ASC, "startTime" ASC`
        : prisma.$queryRaw<CalendarRow[]>`SELECT * FROM "AcademicCalendarItem" WHERE "plannedDate" >= ${start} AND "plannedDate" < ${end} ORDER BY "plannedDate" ASC, "startTime" ASC`,
      scopedIds?.length === 0 ? Promise.resolve([]) : scopedIds
        ? prisma.$queryRaw<CalendarRow[]>`SELECT * FROM "AcademicCalendarItem" WHERE "batchId" IN (${Prisma.join(scopedIds)}) AND "plannedDate" >= ${month.start} AND "plannedDate" < ${month.end}`
        : prisma.$queryRaw<CalendarRow[]>`SELECT * FROM "AcademicCalendarItem" WHERE "plannedDate" >= ${month.start} AND "plannedDate" < ${month.end}`,
      scopedIds?.length === 0 ? Promise.resolve([]) : scopedIds
        ? prisma.$queryRaw<AttendanceRow[]>`SELECT * FROM "TeacherAttendanceRecord" WHERE "batchId" IN (${Prisma.join(scopedIds)}) AND "date" >= ${start} AND "date" < ${end}`
        : prisma.$queryRaw<AttendanceRow[]>`SELECT * FROM "TeacherAttendanceRecord" WHERE "date" >= ${start} AND "date" < ${end}`,
      scopedIds?.length === 0 ? Promise.resolve([]) : scopedIds
        ? prisma.$queryRaw<AttendanceRow[]>`SELECT * FROM "TeacherAttendanceRecord" WHERE "batchId" IN (${Prisma.join(scopedIds)}) AND "date" >= ${month.start} AND "date" < ${month.end}`
        : prisma.$queryRaw<AttendanceRow[]>`SELECT * FROM "TeacherAttendanceRecord" WHERE "date" >= ${month.start} AND "date" < ${month.end}`,
      scopedIds?.length === 0 ? Promise.resolve([]) : scopedIds
        ? prisma.teacherAssignmentRecord.findMany({ where: { batchId: { in: scopedIds }, status: { not: "ARCHIVED" }, createdAt: { gte: month.start, lt: month.end } } })
        : prisma.teacherAssignmentRecord.findMany({ where: { status: { not: "ARCHIVED" }, createdAt: { gte: month.start, lt: month.end } } }),
      scopedIds?.length === 0 ? Promise.resolve([]) : scopedIds
        ? prisma.teacherExamRecord.findMany({ where: { batchId: { in: scopedIds }, status: { not: "ARCHIVED" }, createdAt: { gte: month.start, lt: month.end } } })
        : prisma.teacherExamRecord.findMany({ where: { status: { not: "ARCHIVED" }, createdAt: { gte: month.start, lt: month.end } } }),
      scopedIds?.length === 0 ? Promise.resolve([]) : scopedIds
        ? prisma.teacherStudyMaterialRecord.findMany({ where: { batchId: { in: scopedIds }, status: { not: "ARCHIVED" }, createdAt: { gte: month.start, lt: month.end } } })
        : prisma.teacherStudyMaterialRecord.findMany({ where: { status: { not: "ARCHIVED" }, createdAt: { gte: month.start, lt: month.end } } }),
      scopedIds?.length === 0 ? Promise.resolve([]) : scopedIds
        ? prisma.teacherSyllabusProgressRecord.findMany({ where: { batchId: { in: scopedIds } } })
        : prisma.teacherSyllabusProgressRecord.findMany(),
      prisma.academicActivityAuditRecord.findMany({ orderBy: { createdAt: "desc" }, take: 12 })
    ]);

    const batchSummaries = batches.map((batch) => {
      const byBatch = (item: { batchId?: string | null }) => item.batchId === batch.id;
      const planned = calendarMonth.filter(byBatch);
      const completed = planned.filter(isCompleted);
      const attendance = attendanceMonth.filter(byBatch);
      const assignments = assignmentMonth.filter(byBatch);
      const exams = examMonth.filter(byBatch);
      const materials = materialMonth.filter(byBatch);
      const progress = progressRows.filter(byBatch);
      const syllabusCompleted = progress.filter((item) => String(item.completionStatus).toUpperCase() === "COMPLETED").length;
      const completionPercentage = pct(completed.length, planned.length);
      const attendanceCoveragePercentage = pct(attendance.length, completed.length || planned.length);
      const syllabusCompletionPercentage = pct(syllabusCompleted, progress.length);
      const score = average([completionPercentage, attendanceCoveragePercentage, syllabusCompletionPercentage || completionPercentage]);
      return {
        batchId: batch.id,
        batchName: batch.name,
        programSlug: batch.programSlug,
        courseTitle: batch.course?.title ?? null,
        students: batch._count.students,
        teachers: batch._count.teachers,
        plannedClasses: planned.length,
        completedClasses: completed.length,
        pendingClasses: planned.filter((item) => !isCompleted(item) && item.plannedDate >= start).length,
        missedClasses: planned.filter((item) => !isCompleted(item) && item.plannedDate < start).length,
        attendanceSessions: attendance.length,
        assignments: assignments.length,
        exams: exams.length,
        materials: materials.length,
        syllabusItems: progress.length,
        syllabusCompleted,
        completionPercentage,
        attendanceCoveragePercentage,
        syllabusCompletionPercentage,
        health: health(score)
      } satisfies BatchSummary & { courseTitle: string | null };
    });

    const plannedToday = calendarToday.length;
    const completedToday = calendarToday.filter(isCompleted).length;
    const attendanceCoverageToday = pct(attendanceToday.length, completedToday || plannedToday);
    const academyScore = average([
      pct(completedToday, plannedToday),
      attendanceCoverageToday,
      pct(batchSummaries.filter((item) => item.health === "GREEN").length, batchSummaries.length)
    ]);

    const alerts = batchSummaries
      .flatMap((summary) => batchRisk(summary).map((risk) => ({ batchId: summary.batchId, batchName: summary.batchName, severity: summary.health, message: risk })))
      .slice(0, 8);

    const result = {
      name: "NIDUS Academic Operating System",
      generatedAt: new Date().toISOString(),
      academyHealth: academyScore,
      health: health(academyScore),
      today: {
        plannedClasses: plannedToday,
        completedClasses: completedToday,
        pendingClasses: plannedToday - completedToday,
        attendanceMarked: attendanceToday.length,
        attendanceCoveragePercentage: attendanceCoverageToday,
        classes: calendarToday.map(normalizeCalendar).slice(0, 12)
      },
      month: {
        plannedClasses: calendarMonth.length,
        completedClasses: calendarMonth.filter(isCompleted).length,
        attendanceSessions: attendanceMonth.length,
        assignments: assignmentMonth.length,
        exams: examMonth.length,
        materials: materialMonth.length,
        syllabusItems: progressRows.length,
        syllabusCompleted: progressRows.filter((item) => String(item.completionStatus).toUpperCase() === "COMPLETED").length
      },
      batches: batchSummaries,
      alerts,
      operatingFlow: flow,
      recentActivity: auditRows.map((row) => ({
        id: row.id,
        actorName: row.actorName,
        actorRole: row.actorRole,
        action: row.action,
        entityType: row.entityType,
        entityId: row.entityId,
        createdAt: row.createdAt.toISOString()
      })),
      roleWorkflow: this.roleWorkflow(actor.role)
    };

    await auditView(actor, "ACADEMIC_OS_VIEWED", { academyHealth: result.academyHealth, batches: result.batches.length });
    return result;
  },

  async batch(actor: AcademicActor, batchId: string) {
    requireAcademic(actor);
    const scopedIds = await scopedBatchIds(actor);
    if (scopedIds && !scopedIds.includes(batchId)) {
      throw Object.assign(new Error("Batch access denied"), { statusCode: 403 });
    }
    const batch = await prisma.batch.findUnique({
      where: { id: batchId },
      include: {
        course: { include: { modules: { include: { lessons: true }, orderBy: { order: "asc" } } } },
        students: { include: { student: { select: { id: true, name: true, email: true } } } },
        teachers: { include: { teacher: { select: { id: true, name: true, email: true } } } }
      }
    });
    if (!batch) throw Object.assign(new Error("Batch not found"), { statusCode: 404 });

    const [calendar, attendance, assignments, submissions, exams, materials, progress] = await Promise.all([
      prisma.$queryRaw<CalendarRow[]>`SELECT * FROM "AcademicCalendarItem" WHERE "batchId" = ${batchId} ORDER BY "plannedDate" ASC, "startTime" ASC`,
      prisma.$queryRaw<AttendanceRow[]>`SELECT * FROM "TeacherAttendanceRecord" WHERE "batchId" = ${batchId} ORDER BY "date" DESC`,
      prisma.teacherAssignmentRecord.findMany({ where: { batchId, status: { not: "ARCHIVED" } }, orderBy: { createdAt: "desc" } }),
      prisma.assignmentSubmissionRecord.findMany({ where: { batchId }, orderBy: { submittedAt: "desc" } }),
      prisma.teacherExamRecord.findMany({ where: { batchId, status: { not: "ARCHIVED" } }, orderBy: { createdAt: "desc" } }),
      prisma.teacherStudyMaterialRecord.findMany({ where: { batchId, status: { not: "ARCHIVED" } }, orderBy: { createdAt: "desc" } }),
      prisma.teacherSyllabusProgressRecord.findMany({ where: { batchId }, orderBy: { updatedAt: "desc" } })
    ]);

    const completed = calendar.filter(isCompleted);
    const attendanceRecordsCount = attendance.reduce((sum, row) => sum + attendanceRecords(row).length, 0);
    const submittedAssignments = submissions.filter((item) => String(item.status).toUpperCase() === "SUBMITTED").length;
    const syllabusCompleted = progress.filter((item) => String(item.completionStatus).toUpperCase() === "COMPLETED").length;
    const completionPercentage = pct(completed.length, calendar.length);
    const attendanceCoveragePercentage = pct(attendance.length, completed.length || calendar.length);
    const syllabusCompletionPercentage = pct(syllabusCompleted, progress.length);
    const score = average([completionPercentage, attendanceCoveragePercentage, syllabusCompletionPercentage || completionPercentage]);

    const result = {
      batch: {
        id: batch.id,
        name: batch.name,
        programSlug: batch.programSlug,
        batchType: batch.batchType,
        status: batch.status,
        course: batch.course ? { id: batch.course.id, title: batch.course.title, slug: batch.course.slug } : null,
        students: batch.students.length,
        teachers: batch.teachers.map((item) => ({ teacherId: item.teacherId, teacherName: item.teacher.name || item.teacher.email, subject: item.subject, role: item.role }))
      },
      curriculum: batch.course?.modules.map((module) => ({
        moduleId: module.id,
        title: module.title,
        order: module.order,
        lessons: module.lessons.map((lesson) => ({ lessonId: lesson.id, title: lesson.title, order: lesson.order, duration: lesson.duration }))
      })) ?? [],
      health: {
        score,
        status: health(score),
        completionPercentage,
        attendanceCoveragePercentage,
        syllabusCompletionPercentage,
        risks: batchRisk({
          batchId,
          batchName: batch.name,
          programSlug: batch.programSlug,
          students: batch.students.length,
          teachers: batch.teachers.length,
          plannedClasses: calendar.length,
          completedClasses: completed.length,
          pendingClasses: calendar.filter((item) => !isCompleted(item) && item.plannedDate >= new Date()).length,
          missedClasses: calendar.filter((item) => !isCompleted(item) && item.plannedDate < new Date()).length,
          attendanceSessions: attendance.length,
          assignments: assignments.length,
          exams: exams.length,
          materials: materials.length,
          syllabusItems: progress.length,
          syllabusCompleted,
          completionPercentage,
          attendanceCoveragePercentage,
          syllabusCompletionPercentage,
          health: health(score)
        })
      },
      plannerToProgress: {
        plannedClasses: calendar.length,
        completedClasses: completed.length,
        attendanceSessions: attendance.length,
        attendanceRecords: attendanceRecordsCount,
        studyMaterials: materials.length,
        assignments: assignments.length,
        assignmentSubmissions: submittedAssignments,
        exams: exams.length,
        syllabusItems: progress.length,
        syllabusCompleted
      },
      nextClasses: calendar.filter((item) => !isCompleted(item) && item.plannedDate >= new Date()).slice(0, 10).map(normalizeCalendar),
      recentProgress: progress.slice(0, 20).map((item) => ({ ...item, createdAt: item.createdAt.toISOString(), updatedAt: item.updatedAt.toISOString() }))
    };
    await auditView(actor, "ACADEMIC_OS_BATCH_VIEWED", { batchId, score });
    return result;
  },

  roleWorkflow(role: Role) {
    if (role === Role.TEACHER || role === Role.PHYSICAL_TRAINER) {
      return [
        "Open today's classes",
        "Mark attendance",
        "Complete lesson log",
        "Upload material or recording",
        "Give assignment",
        "Publish daily quiz or exam",
        "Review weak students"
      ];
    }
    if (role === Role.ACADEMIC_HEAD) {
      return [
        "Review today's classes",
        "Check missing attendance",
        "Review syllabus completion",
        "Track faculty progress",
        "Check weak batches",
        "Approve pending reviews"
      ];
    }
    return [
      "Review academic health",
      "Check planner progress",
      "Check batch progress",
      "Check faculty progress",
      "Review academic alerts",
      "Ask NIDUS AI Director for risks"
    ];
  }
};
