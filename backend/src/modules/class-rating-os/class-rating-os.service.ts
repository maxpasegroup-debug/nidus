import { Prisma, Role } from "../../generated/prisma/client.js";
import { prisma } from "../../config/prisma.js";
import { emitDomainEvent } from "../event-engine/event-engine.service.js";

type ClassRatingActor = {
  id: string;
  name?: string | null;
  email?: string | null;
  role: Role;
  roleMetadata?: Record<string, unknown> | null;
};

type CalendarRow = {
  id: string;
  batchId: string | null;
  batchName: string | null;
  subject: string | null;
  topic: string | null;
  plannedDate: Date;
  startTime: string | Date | null;
  endTime: string | Date | null;
  teacherId: string | null;
  teacherName: string | null;
  status: string | null;
  completionStatus: string | null;
};

type ClassFeedbackPayload = {
  calendarId: string;
  starRating: number;
  liked?: string[];
  unclear?: string[];
  teacherExplanation: number;
  doubtClearing: number;
  pace: number;
  materialQuality: number;
  comment?: string;
};

type StoredFeedback = {
  calendarId: string;
  studentId: string;
  studentName: string | null;
  batchId: string | null;
  batchName: string | null;
  subject: string | null;
  topic: string | null;
  teacherId: string | null;
  teacherName: string | null;
  starRating: number;
  liked: string[];
  unclear: string[];
  teacherExplanation: number;
  doubtClearing: number;
  pace: number;
  materialQuality: number;
  comment: string | null;
  submittedAt: string;
};

const viewRoles = new Set<Role>([Role.ADMIN, Role.DIRECTOR, Role.ACADEMIC_HEAD, Role.TEACHER, Role.STUDENT, Role.PARENT]);
const managementRoles = new Set<Role>([Role.ADMIN, Role.DIRECTOR, Role.ACADEMIC_HEAD, Role.TEACHER]);

const framework = [
  { key: "STAR_RATING", label: "Star Rating", source: "Structured AuditLog class feedback payload" },
  { key: "LIKED", label: "What was good", source: "Student selectable feedback tags" },
  { key: "UNCLEAR", label: "What was unclear", source: "Student selectable feedback tags" },
  { key: "TEACHER_EXPLANATION", label: "Teacher explanation", source: "1 to 10 student score" },
  { key: "DOUBT_CLEARING", label: "Doubt clearing", source: "1 to 10 student score" },
  { key: "PACE", label: "Class pace", source: "1 to 10 student score" },
  { key: "MATERIAL_QUALITY", label: "Notes and material quality", source: "1 to 10 student score" },
  { key: "OPTIONAL_COMMENT", label: "Optional comment", source: "Short student comment" }
] as const;

function requireAccess(actor: ClassRatingActor) {
  if (!viewRoles.has(actor.role)) throw Object.assign(new Error("Class Rating OS access required"), { statusCode: 403 });
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, Math.round(Number.isFinite(value) ? value : 0)));
}

function cleanTags(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 8);
}

function cleanComment(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, 500) : null;
}

function avg(values: number[]) {
  const real = values.filter((value) => Number.isFinite(value));
  return real.length ? Math.round((real.reduce((sum, value) => sum + value, 0) / real.length) * 10) / 10 : 0;
}

function parseFeedback(description: string): StoredFeedback | null {
  try {
    const parsed = JSON.parse(description) as { feedback?: StoredFeedback };
    return parsed.feedback && typeof parsed.feedback.calendarId === "string" ? parsed.feedback : null;
  } catch {
    return null;
  }
}

function normalizeCalendar(row: CalendarRow) {
  return {
    ...row,
    plannedDate: row.plannedDate.toISOString(),
    startTime: row.startTime instanceof Date ? row.startTime.toISOString() : row.startTime,
    endTime: row.endTime instanceof Date ? row.endTime.toISOString() : row.endTime
  };
}

async function calendarItem(calendarId: string) {
  const rows = await prisma.$queryRaw<CalendarRow[]>`
    SELECT "id", "batchId", "batchName", "subject", "topic", "plannedDate", "startTime", "endTime", "teacherId", "teacherName", "status", "completionStatus"
    FROM "AcademicCalendarItem"
    WHERE "id" = ${calendarId}
    LIMIT 1
  `;
  return rows[0] ?? null;
}

async function hasStudentAccess(studentId: string, row: CalendarRow) {
  if (!row.batchId && !row.batchName) return false;
  const enrollment = await prisma.batchStudent.findFirst({
    where: {
      studentId,
      status: "ACTIVE",
      OR: [
        row.batchId ? { batchId: row.batchId } : undefined,
        row.batchName ? { batch: { name: row.batchName } } : undefined
      ].filter((item): item is NonNullable<typeof item> => Boolean(item))
    },
    select: { id: true }
  });
  return Boolean(enrollment);
}

async function audit(actor: ClassRatingActor, action: string, metadata: Record<string, unknown>, feedback?: StoredFeedback) {
  const log = await prisma.auditLog.create({
    data: {
      userId: actor.id,
      module: "class-rating-os",
      action,
      description: JSON.stringify({ description: action, actorRole: actor.role, metadata, feedback })
    }
  });
  emitDomainEvent({
    category: "STUDENT_FEEDBACK",
    eventName: action,
    title: action.replaceAll("_", " ").toLowerCase(),
    description: "Class Rating OS feedback activity occurred.",
    actor,
    entityType: "ClassRatingOS",
    severity: action === "CLASS_FEEDBACK_SUBMITTED" ? "SUCCESS" : "INFO",
    source: "API",
    metadata
  });
  return log;
}

export const classRatingOsService = {
  framework() {
    return {
      name: "NIDUS Class Rating Operating System",
      principle: "Every completed class should receive simple student feedback that helps teachers improve without making the student workflow heavy.",
      framework
    };
  },

  async pendingForStudent(actor: ClassRatingActor) {
    requireAccess(actor);
    if (actor.role !== Role.STUDENT) throw Object.assign(new Error("Student login required"), { statusCode: 403 });
    const enrollments = await prisma.batchStudent.findMany({ where: { studentId: actor.id, status: "ACTIVE" }, include: { batch: { select: { id: true, name: true } } } });
    const batchIds = enrollments.map((item) => item.batchId);
    const batchNames = enrollments.map((item) => item.batch.name);
    const classes = batchIds.length || batchNames.length
      ? await prisma.$queryRaw<CalendarRow[]>`
          SELECT "id", "batchId", "batchName", "subject", "topic", "plannedDate", "startTime", "endTime", "teacherId", "teacherName", "status", "completionStatus"
          FROM "AcademicCalendarItem"
          WHERE ("batchId" IN (${Prisma.join(batchIds.length ? batchIds : ["__none__"])}) OR "batchName" IN (${Prisma.join(batchNames.length ? batchNames : ["__none__"])}))
          AND "plannedDate" <= ${new Date()}
          ORDER BY "plannedDate" DESC, "startTime" DESC
          LIMIT 30
        `
      : [];
    const logs = await prisma.auditLog.findMany({ where: { userId: actor.id, module: "class-rating-os", action: "CLASS_FEEDBACK_SUBMITTED" }, orderBy: { createdAt: "desc" }, take: 200 });
    const submittedIds = new Set(logs.map((log) => parseFeedback(log.description)?.calendarId).filter((id): id is string => Boolean(id)));
    const pending = classes.filter((row) => !submittedIds.has(row.id)).map(normalizeCalendar);
    await audit(actor, "CLASS_RATING_PENDING_VIEWED", { pending: pending.length });
    return { name: "NIDUS Class Rating Pending Classes", pending };
  },

  async submit(actor: ClassRatingActor, input: ClassFeedbackPayload) {
    requireAccess(actor);
    if (actor.role !== Role.STUDENT) throw Object.assign(new Error("Only students can submit class feedback"), { statusCode: 403 });
    if (!input.calendarId) throw Object.assign(new Error("Class id is required"), { statusCode: 400 });
    const row = await calendarItem(input.calendarId);
    if (!row) throw Object.assign(new Error("Class not found"), { statusCode: 404 });
    const allowed = await hasStudentAccess(actor.id, row);
    if (!allowed) throw Object.assign(new Error("Student is not enrolled in this class batch"), { statusCode: 403 });
    const duplicate = await prisma.auditLog.findFirst({
      where: {
        userId: actor.id,
        module: "class-rating-os",
        action: "CLASS_FEEDBACK_SUBMITTED",
        description: { contains: input.calendarId }
      },
      select: { id: true }
    });
    if (duplicate) throw Object.assign(new Error("Feedback already submitted for this class"), { statusCode: 409 });
    const feedback: StoredFeedback = {
      calendarId: row.id,
      studentId: actor.id,
      studentName: actor.name ?? null,
      batchId: row.batchId,
      batchName: row.batchName,
      subject: row.subject,
      topic: row.topic,
      teacherId: row.teacherId,
      teacherName: row.teacherName,
      starRating: clamp(input.starRating, 1, 5),
      liked: cleanTags(input.liked),
      unclear: cleanTags(input.unclear),
      teacherExplanation: clamp(input.teacherExplanation, 1, 10),
      doubtClearing: clamp(input.doubtClearing, 1, 10),
      pace: clamp(input.pace, 1, 10),
      materialQuality: clamp(input.materialQuality, 1, 10),
      comment: cleanComment(input.comment),
      submittedAt: new Date().toISOString()
    };
    await audit(actor, "CLASS_FEEDBACK_SUBMITTED", { calendarId: row.id, teacherId: row.teacherId, batchId: row.batchId }, feedback);
    return { message: "Class feedback submitted", feedback };
  },

  async summary(actor: ClassRatingActor, filters: { calendarId?: string; teacherId?: string; batchId?: string }) {
    requireAccess(actor);
    if (!managementRoles.has(actor.role) && actor.role !== Role.PARENT && actor.role !== Role.STUDENT) {
      throw Object.assign(new Error("Class feedback summary access required"), { statusCode: 403 });
    }
    const logs = await prisma.auditLog.findMany({
      where: { module: "class-rating-os", action: "CLASS_FEEDBACK_SUBMITTED" },
      orderBy: { createdAt: "desc" },
      take: 1000
    });
    const feedback = logs
      .map((log) => parseFeedback(log.description))
      .filter((item): item is StoredFeedback => Boolean(item))
      .filter((item) => !filters.calendarId || item.calendarId === filters.calendarId)
      .filter((item) => !filters.teacherId || item.teacherId === filters.teacherId)
      .filter((item) => !filters.batchId || item.batchId === filters.batchId);
    const liked = new Map<string, number>();
    const unclear = new Map<string, number>();
    for (const item of feedback) {
      for (const tag of item.liked) liked.set(tag, (liked.get(tag) ?? 0) + 1);
      for (const tag of item.unclear) unclear.set(tag, (unclear.get(tag) ?? 0) + 1);
    }
    const topTags = (map: Map<string, number>) => Array.from(map.entries()).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([label, count]) => ({ label, count }));
    await audit(actor, "CLASS_RATING_SUMMARY_VIEWED", { ...filters, feedbackCount: feedback.length });
    return {
      name: "NIDUS Class Rating Summary",
      filters,
      summary: {
        feedbackCount: feedback.length,
        averageStarRating: avg(feedback.map((item) => item.starRating)),
        teacherExplanation: avg(feedback.map((item) => item.teacherExplanation)),
        doubtClearing: avg(feedback.map((item) => item.doubtClearing)),
        pace: avg(feedback.map((item) => item.pace)),
        materialQuality: avg(feedback.map((item) => item.materialQuality)),
        liked: topTags(liked),
        unclear: topTags(unclear)
      },
      comments: feedback.filter((item) => item.comment).slice(0, 25).map((item) => ({
        calendarId: item.calendarId,
        subject: item.subject,
        topic: item.topic,
        teacherName: item.teacherName,
        comment: item.comment,
        submittedAt: item.submittedAt
      }))
    };
  }
};
