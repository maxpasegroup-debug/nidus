import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";

import { Prisma, Role } from "../../generated/prisma/client.js";
import { prisma } from "../../config/prisma.js";
import { deleteCloudinaryAsset } from "../../config/cloudinary.js";
import { testsService, type TestPayload } from "../tests/tests.service.js";

const db = prisma as any;

type Requester = {
  id: string;
  name?: string | null;
  role: Role;
  email?: string | null;
  roleMetadata?: Record<string, unknown> | null;
};

type BatchInput = {
  name?: string;
  courseId?: string;
  programSlug?: string;
  programName?: string;
  programType?: string;
  learningMode?: string;
  batchType?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
};

type StudentInput = {
  userId?: string;
  email?: string;
  name?: string;
  phone?: string;
  rollNumber?: string;
  notes?: string;
};

type TeacherInput = {
  teacherId: string;
  subject?: string;
  subjects?: string[];
  role?: string;
};

type AcademicCalendarInput = {
  batchId?: string;
  batchName?: string;
  programSlug?: string;
  subject?: string;
  topic?: string;
  classType?: string;
  plannedDate?: string;
  startTime?: string;
  endTime?: string;
  teacherId?: string;
  teacherName?: string;
  status?: string;
  completionStatus?: string;
  teacherLog?: string;
  nextAction?: string;
};

type AttendanceInput = {
  batchId?: string;
  batchName?: string;
  subject?: string;
  date?: string;
  records?: Array<{
    studentId?: string;
    studentName?: string;
    status?: string;
    remarks?: string;
  }>;
  status?: string;
};

type AssignmentInput = {
  batchId?: string;
  batchName?: string;
  subject?: string;
  course?: string;
  title?: string;
  topic?: string;
  instructions?: string;
  dueDate?: string;
  attachmentName?: string;
  link?: string;
  status?: string;
};

type AssignmentSubmissionInput = {
  answerText?: string;
  attachmentName?: string;
  link?: string;
  status?: string;
};

type AssignmentReviewInput = {
  reviewStatus?: string;
  feedback?: string;
  score?: number;
};

type StudyMaterialInput = {
  id?: string;
  batchId?: string;
  batchName?: string;
  course?: string;
  folder?: string;
  subject?: string;
  topic?: string;
  title?: string;
  description?: string;
  type?: string;
  url?: string;
  fileName?: string;
  cloudinaryPublicId?: string;
  thumbnailUrl?: string;
  thumbnailPublicId?: string;
  fileSize?: number;
  durationSeconds?: number;
  lessonName?: string;
  status?: string;
  reviewStatus?: string;
  reviewNote?: string;
};

type MaterialReviewInput = {
  reviewStatus?: string;
  reviewNote?: string;
};

type DirectorExpenseInput = {
  title?: string;
  category?: string;
  amount?: number;
  currency?: string;
  note?: string;
};

type ExamInput = {
  batchId?: string;
  batchName?: string;
  subject?: string;
  course?: string;
  title?: string;
  topic?: string;
  questionCount?: number;
  durationMinutes?: number;
  duration?: number;
  difficulty?: string;
  instructions?: string;
  draft?: unknown;
  status?: string;
};

type ApproveAdmissionInput = StudentInput & {
  batchId: string;
  applicationId?: string;
  leadId?: string;
  totalFee?: number;
  amountPaid?: number;
  paymentStatus?: string;
  paymentMethod?: string;
  transactionRef?: string;
  receiptUploadUrl?: string;
};

type EmployeeInput = {
  name: string;
  email: string;
  phone?: string;
  role: Role;
  designation?: string;
  department?: string;
  employmentType?: "FULL_TIME" | "PART_TIME" | "HOURLY" | "CONTRACT";
  hourlyRate?: number;
  subjects?: string[];
  dashboardTemplate?: string;
  password?: string;
};

type EmployeeUpdateInput = Partial<EmployeeInput> & {
  status?: string;
};

type AcademicCalendarRow = {
  id: string;
  batchId: string | null;
  batchName: string | null;
  programSlug: string | null;
  subject: string;
  topic: string;
  classType?: string | null;
  plannedDate: Date;
  startTime: string | null;
  endTime: string | null;
  teacherId: string | null;
  teacherName: string | null;
  status: string;
  completionStatus: string;
  teacherLog: string | null;
  nextAction: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type BatchTeacherAssignmentRow = {
  id: string;
  batchId: string;
  teacherId: string;
  subject: string;
  role: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
};

type BatchWithCountsOptions = string | {
  batchId?: string;
  batchIds?: string[];
  where?: Prisma.BatchWhereInput;
};

function requireManagement(user: Requester) {
  if ((user.role !== Role.ADMIN && user.role !== Role.DIRECTOR) || isRestrictedAdminTemplate(user)) {
    throw Object.assign(new Error("Management access required"), { statusCode: 403 });
  }
}

function requireAcademicManagement(user: Requester) {
  const template = staffTemplate(user);
  if ((user.role !== Role.ADMIN && user.role !== Role.DIRECTOR && user.role !== Role.ACADEMIC_HEAD && template !== "ACADEMIC_HEAD") || isNonAcademicStaffTemplate(user)) {
    throw Object.assign(new Error("Academic management access required"), { statusCode: 403 });
  }
}

function requireAcademic(user: Requester) {
  const template = staffTemplate(user);
  if ((user.role !== Role.ADMIN && user.role !== Role.DIRECTOR && user.role !== Role.TEACHER && user.role !== Role.ACADEMIC_HEAD && user.role !== Role.PHYSICAL_TRAINER && template !== "ACADEMIC_HEAD") || isNonAcademicStaffTemplate(user)) {
    throw Object.assign(new Error("Academic access required"), { statusCode: 403 });
  }
}

function isManagement(user: Requester) {
  return (user.role === Role.ADMIN || user.role === Role.DIRECTOR) && !isRestrictedAdminTemplate(user);
}

function staffTemplate(user: Requester) {
  return typeof user.roleMetadata?.dashboardTemplate === "string" ? user.roleMetadata.dashboardTemplate.toUpperCase() : "";
}

function isRestrictedAdminTemplate(user: Requester) {
  const template = staffTemplate(user);
  return user.role === Role.ADMIN && ["ADMISSION_CELL", "MARKETING", "SALES_BOOSTER", "ADMINISTRATION"].includes(template);
}

function isNonAcademicStaffTemplate(user: Requester) {
  const template = staffTemplate(user);
  return user.role === Role.ADMIN && ["ADMISSION_CELL", "MARKETING", "SALES_BOOSTER"].includes(template);
}

function isAdmissionCell(user: Requester) {
  const template = staffTemplate(user);
  const designation = typeof user.roleMetadata?.designation === "string" ? user.roleMetadata.designation : "";
  return user.role === Role.ADMINISTRATIVE_OFFICER || (user.role === Role.ADMIN && (template === "ADMISSION_CELL" || designation.toLowerCase().includes("admission")));
}

function requireAdmissionAccess(user: Requester) {
  if (!isManagement(user) && !isAdmissionCell(user)) {
    throw Object.assign(new Error("Administrative Officer access required"), { statusCode: 403 });
  }
}

function requireStudentEnrollmentAccess(user: Requester) {
  const template = staffTemplate(user);
  if (
    (user.role !== Role.ADMIN && user.role !== Role.DIRECTOR && user.role !== Role.ACADEMIC_HEAD && template !== "ACADEMIC_HEAD" && !isAdmissionCell(user)) ||
    isNonAcademicStaffTemplate(user)
  ) {
    throw Object.assign(new Error("Student enrollment access required"), { statusCode: 403 });
  }
}

function isAcademicManager(user: Requester) {
  const template = staffTemplate(user);
  const designation = typeof user.roleMetadata?.designation === "string" ? user.roleMetadata.designation : "";
  const permissions = Array.isArray(user.roleMetadata?.permissions) ? user.roleMetadata.permissions : [];
  return (
    isManagement(user) ||
    user.role === Role.ACADEMIC_HEAD ||
    template === "ACADEMIC_HEAD" ||
    designation.toLowerCase().includes("academic head") ||
    permissions.includes("review_attendance")
  );
}

function isAcademicHeadWorkspace(user: Requester) {
  const template = staffTemplate(user);
  const designation = typeof user.roleMetadata?.designation === "string" ? user.roleMetadata.designation : "";
  return user.role === Role.ACADEMIC_HEAD || template === "ACADEMIC_HEAD" || designation.toLowerCase().includes("academic head");
}

function requireEmployeeCreationAccess(user: Requester, input: EmployeeInput) {
  if (isManagement(user)) return;
  if (!isAcademicManager(user)) {
    throw Object.assign(new Error("Management access required"), { statusCode: 403 });
  }
  if (input.role !== Role.TEACHER || input.dashboardTemplate === "ACADEMIC_HEAD") {
    throw Object.assign(new Error("Academic Head can create teacher accounts only"), { statusCode: 403 });
  }
}

function usesTeacherWorkspace(user: Requester) {
  return user.role === Role.TEACHER || user.role === Role.PHYSICAL_TRAINER || isAcademicHeadWorkspace(user);
}

function isTeacherClassAllocation(row: BatchTeacherAssignmentRow) {
  return row.status === "ACTIVE" && !(row.role === "ACADEMIC_HEAD" && row.subject === "Academic Coordination");
}

function isVisibleTeacherWorkspaceAllocation(row: BatchTeacherAssignmentRow, user: Requester) {
  if (isAcademicHeadWorkspace(user)) {
    return row.status === "ACTIVE" && (row.role === "Subject Teacher" || (row.role === "ACADEMIC_HEAD" && row.subject === "Academic Coordination"));
  }
  if (!isTeacherClassAllocation(row)) return false;
  return true;
}

function materialMimeType(type?: string | null) {
  const normalized = (type || "").toUpperCase();
  if (normalized.includes("VIDEO")) return "video/mp4";
  if (normalized.includes("PDF")) return "application/pdf";
  if (normalized.includes("PPT")) return "application/vnd.openxmlformats-officedocument.presentationml.presentation";
  if (normalized.includes("DOC") || normalized.includes("WORD")) return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  return "image/jpeg";
}

function percentage(part: number, total: number) {
  return total > 0 ? Math.round((part / total) * 100) : 0;
}

function average(values: number[]) {
  const realValues = values.filter((value) => Number.isFinite(value));
  return realValues.length ? Math.round(realValues.reduce((sum, value) => sum + value, 0) / realValues.length) : null;
}

function trafficStatus(value: number | null, total = 100) {
  if (value === null || total === 0) return "RED";
  if (value >= 75) return "GREEN";
  if (value >= 50) return "ORANGE";
  return "RED";
}

function academicHealthStatus(score: number | null) {
  if (score === null) return "No Data";
  if (score >= 75) return "Healthy";
  if (score >= 50) return "Attention Needed";
  return "Critical";
}

function toDate(value?: string) {
  return value ? new Date(value) : undefined;
}

function toJsonObject(value: Record<string, unknown>) {
  return value as Prisma.InputJsonObject;
}

function academyBatchSchedule(input: BatchInput) {
  const schedule: Record<string, unknown> = {};
  if (input.programName) schedule.programName = input.programName;
  if (input.programType) schedule.programType = input.programType;
  if (input.learningMode || input.batchType) schedule.learningMode = input.learningMode || input.batchType;
  return Object.keys(schedule).length ? toJsonObject(schedule) : undefined;
}

function normalizeRows<T extends Record<string, any>>(rows: T[]) {
  return rows.map((row) => {
    const normalized: Record<string, unknown> = { ...row };
    for (const [key, value] of Object.entries(normalized)) {
      if (value instanceof Date) {
        normalized[key] = value.toISOString();
      }
    }
    return normalized;
  });
}

async function auditAcademicAction(user: Requester, action: string, entityType: string, entityId: string | null, payload: Record<string, unknown>) {
  await prisma.$executeRaw`
    INSERT INTO "AcademicActivityAuditRecord"
    ("id", "actorId", "actorName", "actorRole", "action", "entityType", "entityId", "payload", "createdAt")
    VALUES
    (${randomUUID()}, ${user.id}, ${user.name || user.email || null}, ${user.role}, ${action}, ${entityType}, ${entityId}, ${JSON.stringify(payload)}::jsonb, ${new Date()})
  `;
}

function examPrompt(input: ExamInput) {
  return [input.title, input.subject, input.topic, input.instructions].filter(Boolean).join(" - ") || "Create a class test";
}

function asDraftPayload(input: ExamInput) {
  if (!input.draft) return null;
  if (typeof input.draft === "object") return input.draft as Partial<TestPayload>;
  if (typeof input.draft !== "string") return null;
  try {
    return JSON.parse(input.draft) as Partial<TestPayload>;
  } catch {
    return null;
  }
}

async function buildExamDraft(user: Requester, input: ExamInput) {
  return testsService.generateDraft(user, {
    prompt: examPrompt(input),
    examType: "NIDUS",
    subject: input.subject,
    topic: input.topic,
    questionCount: Number(input.questionCount || 10),
    difficultyLevel: input.difficulty || "MEDIUM",
    batchId: input.batchId,
  });
}

function summarizeExamAttempts(attempts: Array<{ testId: string; status: string; submittedAt: Date | null; score: number | null }>) {
  const stats = new Map<string, { attempts: number; submitted: number; scoreTotal: number; scored: number; averageScore: number }>();
  for (const attempt of attempts) {
    const current = stats.get(attempt.testId) ?? { attempts: 0, submitted: 0, scoreTotal: 0, scored: 0, averageScore: 0 };
    current.attempts += 1;
    if (attempt.submittedAt || attempt.status === "SUBMITTED") current.submitted += 1;
    if (typeof attempt.score === "number") {
      current.scoreTotal += attempt.score;
      current.scored += 1;
    }
    current.averageScore = current.scored ? Math.round(current.scoreTotal / current.scored) : 0;
    stats.set(attempt.testId, current);
  }
  return stats;
}

function summarizeSyllabusProgress(rows: Array<Record<string, any>>) {
  return rows.reduce(
    (summary, row) => {
      summary.total += 1;
      const color = String(row.progressColor || progressColor(row.completionStatus)).toUpperCase();
      const status = String(row.completionStatus || "PENDING").toUpperCase();
      if (color === "GREEN") summary.green += 1;
      if (color === "ORANGE") summary.orange += 1;
      if (color === "RED") summary.red += 1;
      if (status === "COMPLETED") summary.completed += 1;
      if (status === "PARTIAL" || status === "RESCHEDULED") summary.partial += 1;
      if (status === "PENDING") summary.pending += 1;
      summary.completionPercentage = percentage(summary.completed, summary.total);
      return summary;
    },
    { total: 0, green: 0, orange: 0, red: 0, completed: 0, partial: 0, pending: 0, completionPercentage: 0 },
  );
}

async function attachExamStats(rows: Array<Record<string, any>>) {
  const exams = normalizeRows(rows);
  const testIds = exams.map((exam) => (typeof exam.testId === "string" ? exam.testId : null)).filter(Boolean) as string[];
  if (!testIds.length) {
    return exams.map((exam) => ({ ...exam, attemptStats: { attempts: 0, submitted: 0, averageScore: 0 } }));
  }
  const attempts = await prisma.testAttempt.findMany({
    where: { testId: { in: testIds } },
    select: { testId: true, status: true, submittedAt: true, score: true },
  });
  const stats = summarizeExamAttempts(attempts);
  return exams.map((exam) => ({
    ...exam,
    attemptStats:
      typeof exam.testId === "string"
        ? stats.get(exam.testId) ?? { attempts: 0, submitted: 0, averageScore: 0 }
        : { attempts: 0, submitted: 0, averageScore: 0 },
  }));
}

async function assertBatchAccess(user: Requester, batchId?: string) {
  requireAcademic(user);
  if (!batchId) {
    throw Object.assign(new Error("Batch is required"), { statusCode: 400 });
  }
  if (isAcademicManager(user)) {
    return;
  }

  const assignment = await prisma.teacherBatchAssignment.findFirst({
    where: { batchId, teacherId: user.id, status: "ACTIVE" },
    select: { id: true },
  });
  if (assignment) {
    return;
  }

  const legacyRows = await prisma.$queryRaw<Array<{ id: string }>>`
    SELECT "id" FROM "BatchTeacherAssignment"
    WHERE "batchId" = ${batchId}
    AND "teacherId" = ${user.id}
    AND "status" = 'ACTIVE'
    LIMIT 1
  `;
  if (legacyRows[0]) {
    return;
  }

  throw Object.assign(new Error("This class is not assigned to the teacher"), { statusCode: 403 });
}

async function assertBatchSubjectAccess(user: Requester, batchId?: string, subject?: string | null) {
  await assertBatchAccess(user, batchId);
  if (!batchId || !subject || isAcademicManager(user)) return;
  const normalizedSubject = subject.trim();
  if (!normalizedSubject) return;

  const assignment = await prisma.teacherBatchAssignment.findFirst({
    where: {
      batchId,
      teacherId: user.id,
      status: "ACTIVE",
      subject: { equals: normalizedSubject, mode: "insensitive" },
    },
    select: { id: true },
  });
  if (assignment) return;

  const legacyRows = await prisma.$queryRaw<Array<{ id: string }>>`
    SELECT "id" FROM "BatchTeacherAssignment"
    WHERE "batchId" = ${batchId}
    AND "teacherId" = ${user.id}
    AND LOWER("subject") = LOWER(${normalizedSubject})
    AND "status" = 'ACTIVE'
    LIMIT 1
  `;
  if (legacyRows[0]) return;

  throw Object.assign(new Error("This subject is not assigned to this teacher for the selected batch"), { statusCode: 403 });
}

async function assertStudentBatchAccess(user: Requester, batchId?: string) {
  if (!batchId) {
    throw Object.assign(new Error("Batch is required"), { statusCode: 400 });
  }
  if (user.role !== Role.STUDENT) {
    await assertBatchAccess(user, batchId);
    return;
  }

  const enrollment = await db.batchStudent.findFirst({
    where: { batchId, studentId: user.id, status: "ACTIVE" },
    select: { id: true },
  });
  if (!enrollment) {
    throw Object.assign(new Error("This assignment is not assigned to the student"), { statusCode: 403 });
  }
}

async function hydrateBatchesForAssignments(assignments: BatchTeacherAssignmentRow[]) {
  const batchIds = Array.from(new Set(assignments.map((assignment) => assignment.batchId)));
  if (!batchIds.length) {
    return [];
  }

  const batches = await prisma.batch.findMany({
    where: { id: { in: batchIds } },
    include: {
      course: { select: { id: true, title: true, slug: true, category: true, examType: true, duration: true } },
      students: {
        where: { status: "ACTIVE" },
        include: { student: { select: { id: true, name: true, email: true, mobile: true, role: true } } },
        orderBy: { joinedAt: "asc" },
      },
      _count: { select: { students: true, teachers: true, tests: true } },
    },
  });
  const batchMap = new Map(batches.map((batch) => [batch.id, batch]));

  return assignments
    .map((assignment) => {
      const batch = batchMap.get(assignment.batchId);
      if (!batch) return null;
      return {
        ...batch,
        subject: assignment.subject,
        role: assignment.role,
        assignmentId: assignment.id,
      };
    })
    .filter(Boolean);
}

async function hydrateTeachingPlanBatches(assignments: BatchTeacherAssignmentRow[]) {
  const batchIds = Array.from(new Set(assignments.map((assignment) => assignment.batchId)));
  if (!batchIds.length) {
    return [];
  }

  const batches = await batchWithCounts({ where: { id: { in: batchIds }, status: "ACTIVE" } });
  const batchList = Array.isArray(batches) ? batches : batches ? [batches] : [];
  const assignmentMap = new Map<string, BatchTeacherAssignmentRow[]>();
  for (const assignment of assignments) {
    const batchAssignments = assignmentMap.get(assignment.batchId) ?? [];
    batchAssignments.push(assignment);
    assignmentMap.set(assignment.batchId, batchAssignments);
  }

  return batchList.map((batch: any) => {
    const batchAssignments = assignmentMap.get(batch.id) ?? [];
    const teachingAssignments = batchAssignments.filter((assignment) => isTeacherClassAllocation(assignment));
    const assignedSubjects = Array.from(new Set(teachingAssignments.map((assignment) => assignment.subject).filter(Boolean)));
    const primaryAssignment = teachingAssignments[0] ?? batchAssignments[0] ?? null;

    return {
      ...batch,
      subject: assignedSubjects.join(", ") || primaryAssignment?.subject || null,
      assignedSubjects,
      role: batchAssignments.some((assignment) => assignment.role === "ACADEMIC_HEAD") ? "ACADEMIC_HEAD" : primaryAssignment?.role,
      assignmentId: primaryAssignment?.id,
    };
  });
}

function progressColor(completionStatus?: string) {
  const status = (completionStatus || "PENDING").toUpperCase();
  if (status === "COMPLETED") return "GREEN";
  if (status === "PARTIAL") return "ORANGE";
  return "RED";
}

function batchWhereFromQuery(query: Record<string, unknown> = {}) {
  const where: Prisma.BatchWhereInput = {};
  if (typeof query.programSlug === "string" && query.programSlug.trim()) {
    where.programSlug = query.programSlug.trim();
  }
  if (typeof query.batchType === "string" && query.batchType.trim()) {
    where.batchType = query.batchType.trim();
  }
  if (typeof query.status === "string" && query.status.trim()) {
    where.status = query.status.trim();
  }
  return where;
}

function mergeBatchWhere(left: Prisma.BatchWhereInput, right: Prisma.BatchWhereInput) {
  if (!Object.keys(left).length) return right;
  if (!Object.keys(right).length) return left;
  return { AND: [left, right] };
}

async function assignedBatchIdsForUser(userId: string) {
  const [officialRows, legacyRows] = await Promise.all([
    prisma.teacherBatchAssignment.findMany({
      where: { teacherId: userId, status: "ACTIVE" },
      select: { batchId: true },
    }),
    prisma.$queryRaw<Array<{ batchId: string }>>`
      SELECT DISTINCT "batchId" FROM "BatchTeacherAssignment"
      WHERE "teacherId" = ${userId}
      AND "status" = 'ACTIVE'
    `.catch(() => []),
  ]);
  return Array.from(new Set([...officialRows, ...legacyRows].map((row) => row.batchId).filter(Boolean)));
}

async function assignedSubjectsForUserBatch(userId: string, batchId: string) {
  const [officialRows, legacyRows] = await Promise.all([
    prisma.teacherBatchAssignment.findMany({
      where: { teacherId: userId, batchId, status: "ACTIVE" },
      select: { subject: true },
    }),
    prisma.$queryRaw<Array<{ subject: string }>>`
      SELECT DISTINCT "subject" FROM "BatchTeacherAssignment"
      WHERE "teacherId" = ${userId}
      AND "batchId" = ${batchId}
      AND "status" = 'ACTIVE'
    `.catch(() => []),
  ]);
  return Array.from(new Set([...officialRows, ...legacyRows].map((row) => row.subject?.trim().toLowerCase()).filter(Boolean)));
}

async function filterRowsToAssignedSubjects<T extends { subject?: string | null }>(user: Requester, batchId: string | undefined, rows: T[]) {
  if (!batchId || isAcademicManager(user) || user.role !== Role.TEACHER) return rows;
  const subjects = await assignedSubjectsForUserBatch(user.id, batchId);
  if (!subjects.length) return [];
  return rows.filter((row) => row.subject && subjects.includes(String(row.subject).trim().toLowerCase()));
}

function mergeAssignments(primary: BatchTeacherAssignmentRow[], secondary: BatchTeacherAssignmentRow[]) {
  const seen = new Set<string>();
  const merged: BatchTeacherAssignmentRow[] = [];
  for (const assignment of [...primary, ...secondary]) {
    const key = `${assignment.batchId}:${assignment.teacherId}:${assignment.subject}`;
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(assignment);
  }
  return merged;
}

function attendanceRecordList(row: Record<string, any>) {
  const records = row.records;
  if (Array.isArray(records)) return records as Array<{ studentId?: string; studentName?: string; status?: string }>;
  if (typeof records === "string") {
    try {
      const parsed = JSON.parse(records);
      return Array.isArray(parsed) ? parsed as Array<{ studentId?: string; studentName?: string; status?: string }> : [];
    } catch {
      return [];
    }
  }
  return [];
}

function summarizeAttendance(rows: Array<Record<string, any>>) {
  let present = 0;
  let absent = 0;
  let leave = 0;
  let total = 0;
  const batchMap = new Map<string, { batchId: string; batchName: string | null; sessions: number; present: number; absent: number; leave: number; total: number; percentage: number }>();
  const studentMap = new Map<string, { studentId: string; studentName: string | null; present: number; absent: number; leave: number; total: number; percentage: number }>();

  for (const row of rows) {
    const records = attendanceRecordList(row);
    const batchId = String(row.batchId ?? "");
    const batch = batchMap.get(batchId) ?? { batchId, batchName: row.batchName ?? null, sessions: 0, present: 0, absent: 0, leave: 0, total: 0, percentage: 0 };
    batch.sessions += 1;

    for (const record of records) {
      const status = (record.status || "").toUpperCase();
      total += 1;
      batch.total += 1;
      if (status === "PRESENT") {
        present += 1;
        batch.present += 1;
      } else if (status === "LEAVE") {
        leave += 1;
        batch.leave += 1;
      } else {
        absent += 1;
        batch.absent += 1;
      }

      if (record.studentId) {
        const student = studentMap.get(record.studentId) ?? { studentId: record.studentId, studentName: record.studentName ?? null, present: 0, absent: 0, leave: 0, total: 0, percentage: 0 };
        student.total += 1;
        if (status === "PRESENT") student.present += 1;
        else if (status === "LEAVE") student.leave += 1;
        else student.absent += 1;
        studentMap.set(record.studentId, student);
      }
    }
    batch.percentage = percentage(batch.present, batch.total);
    batchMap.set(batchId, batch);
  }

  const students = Array.from(studentMap.values()).map((student) => ({
    ...student,
    percentage: percentage(student.present, student.total),
  }));

  return {
    sessions: rows.length,
    records: total,
    present,
    absent,
    leave,
    percentage: percentage(present, total),
    batches: Array.from(batchMap.values()),
    students,
  };
}

function summarizeAssignments(assignments: Array<Record<string, any>>, submissions: Array<Record<string, any>>, batchStudentCounts: Map<string, number>) {
  const submissionMap = new Map<string, Record<string, any>[]>();
  for (const submission of submissions) {
    const list = submissionMap.get(submission.assignmentId) ?? [];
    list.push(submission);
    submissionMap.set(submission.assignmentId, list);
  }

  const enriched = assignments.map((assignment) => {
    const assignmentSubmissions = submissionMap.get(assignment.id) ?? [];
    const totalStudents = batchStudentCounts.get(assignment.batchId) ?? 0;
    const submitted = assignmentSubmissions.length;
    return {
      ...assignment,
      submissions: normalizeRows(assignmentSubmissions),
      submissionStats: {
        totalStudents,
        submitted,
        pending: Math.max(totalStudents - submitted, 0),
        reviewed: assignmentSubmissions.filter((item) => item.reviewStatus && item.reviewStatus !== "PENDING_REVIEW").length,
      },
    };
  });

  const totalExpected = enriched.reduce((sum, assignment) => sum + assignment.submissionStats.totalStudents, 0);
  const submitted = submissions.length;
  return {
    assignments: normalizeRows(enriched),
    summary: {
      assignments: assignments.length,
      totalExpected,
      submitted,
      pending: Math.max(totalExpected - submitted, 0),
      reviewed: submissions.filter((item) => item.reviewStatus && item.reviewStatus !== "PENDING_REVIEW").length,
    },
  };
}

async function batchStudentCountMap(batchIds: string[]) {
  if (!batchIds.length) return new Map<string, number>();
  const rows = await db.batchStudent.groupBy({
    by: ["batchId"],
    where: { batchId: { in: batchIds }, status: "ACTIVE" },
    _count: { id: true },
  }) as Array<{ batchId: string; _count: { id: number } }>;
  return new Map<string, number>(rows.map((row) => [row.batchId, row._count.id]));
}

function sanitizeCalendarRow(row: AcademicCalendarRow) {
  return {
    ...row,
    classType: row.classType || "Live Class",
    plannedDate: row.plannedDate.toISOString(),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function normalizeBatchWithCountsOptions(options?: BatchWithCountsOptions) {
  if (typeof options === "string") {
    return { batchId: options };
  }
  return options ?? {};
}

async function batchWithCounts(options?: BatchWithCountsOptions) {
  const normalized = normalizeBatchWithCountsOptions(options);
  const where = normalized.batchId
    ? { id: normalized.batchId }
    : normalized.batchIds
      ? { id: { in: normalized.batchIds } }
      : normalized.where;
  const batches = await db.batch.findMany({
    where,
    include: {
      course: true,
      students: true,
      _count: { select: { students: true } },
    },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });

  if (!batches.length) {
    return normalized.batchId ? null : [];
  }

  const studentIds = Array.from(
    new Set(
      batches
        .flatMap((batch: any) => batch.students ?? [])
        .map((student: any) => student.studentId)
        .filter(Boolean),
    ),
  );
  const users = studentIds.length
    ? await prisma.user.findMany({
        where: { id: { in: studentIds as string[] } },
        select: { id: true, name: true, email: true, mobile: true, role: true },
      })
    : [];
  const userMap = new Map(users.map((user) => [user.id, user]));
  const batchIds = batches.map((batch: any) => batch.id).filter(Boolean);
  const officialTeacherAssignments = batchIds.length
    ? (await prisma.teacherBatchAssignment.findMany({
        where: { batchId: { in: batchIds }, status: "ACTIVE" },
        orderBy: { createdAt: "desc" },
      })).map((assignment) => ({
        id: assignment.id,
        batchId: assignment.batchId,
        teacherId: assignment.teacherId,
        subject: assignment.subject,
        role: assignment.role,
        status: assignment.status,
        createdAt: assignment.createdAt,
        updatedAt: assignment.createdAt,
      }))
    : [];
  const legacyTeacherAssignments = batchIds.length
    ? await prisma.$queryRaw<BatchTeacherAssignmentRow[]>`
        SELECT * FROM "BatchTeacherAssignment"
        WHERE "batchId" IN (${Prisma.join(batchIds)})
        AND "status" = 'ACTIVE'
        ORDER BY "createdAt" DESC
      `.catch(() => [])
    : [];
  const teacherAssignments = mergeAssignments(officialTeacherAssignments, legacyTeacherAssignments);
  const teacherIds = Array.from(new Set(teacherAssignments.map((assignment) => assignment.teacherId)));
  const teacherUsers = teacherIds.length
    ? await prisma.user.findMany({
        where: { id: { in: teacherIds } },
        select: { id: true, name: true, email: true, mobile: true, role: true },
      })
    : [];
  const teacherMap = new Map(teacherUsers.map((teacher) => [teacher.id, teacher]));

  const hydrated = batches.map((batch: any) => ({
    ...batch,
    students: (batch.students ?? []).map((student: any) => ({
      ...student,
      user: userMap.get(student.studentId) ?? null,
      student: userMap.get(student.studentId) ?? null,
    })),
    teachers: teacherAssignments
      .filter((assignment) => assignment.batchId === batch.id)
      .map((assignment) => ({
        ...assignment,
        teacher: teacherMap.get(assignment.teacherId) ?? null,
      })),
    _count: {
      ...(batch._count ?? {}),
      teachers: teacherAssignments.filter((assignment) => assignment.batchId === batch.id).length,
    },
  }));

  return normalized.batchId ? hydrated[0] : hydrated;
}

async function findStudentUserForAdmission(input: StudentInput) {
  if (input.userId) {
    return prisma.user.update({
      where: { id: input.userId },
      data: { role: Role.STUDENT },
    });
  }

  if (!input.email) {
    throw Object.assign(new Error("Student email or user id is required"), { statusCode: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email: input.email.toLowerCase() } });
  if (!existing) {
    throw Object.assign(new Error("Student account not found. Ask the applicant to create a free account first."), {
      statusCode: 404,
    });
  }

  return prisma.user.update({
    where: { id: existing.id },
    data: {
      name: input.name || existing.name,
      mobile: input.phone || existing.mobile,
      role: Role.STUDENT,
    },
  });
}

export const academyService = {
  async batches(user: Requester, query: Record<string, unknown> = {}) {
    if (!isAdmissionCell(user)) {
      requireAcademic(user);
    }

    let where = batchWhereFromQuery(query);
    if (!isManagement(user) && !isAdmissionCell(user)) {
      const assignedBatchIds = await assignedBatchIdsForUser(user.id);
      if (!assignedBatchIds.length) return [];
      where = mergeBatchWhere(where, { id: { in: assignedBatchIds } });
    }

    return batchWithCounts({ where });
  },

  async createBatch(user: Requester, input: BatchInput) {
    requireAcademicManagement(user);
    if (!input.name) {
      throw Object.assign(new Error("Batch name is required"), { statusCode: 400 });
    }

    const created = await db.batch.create({
      data: {
        name: input.name,
        courseId: input.courseId || null,
        programSlug: input.programSlug || input.courseId || null,
        batchType: input.learningMode || input.batchType || "OFFLINE",
        startDate: toDate(input.startDate),
        endDate: toDate(input.endDate),
        schedule: academyBatchSchedule(input),
        status: input.status || "ACTIVE",
      },
    });

    return batchWithCounts(created.id);
  },

  async updateBatch(user: Requester, batchId: string, input: BatchInput) {
    requireAcademicManagement(user);
    await db.batch.update({
      where: { id: batchId },
      data: {
        name: input.name,
        courseId: input.courseId,
        programSlug: input.programSlug,
        batchType: input.learningMode || input.batchType,
        startDate: toDate(input.startDate),
        endDate: toDate(input.endDate),
        schedule: academyBatchSchedule(input),
        status: input.status,
      },
    });

    return batchWithCounts(batchId);
  },

  async addStudent(user: Requester, batchId: string, input: StudentInput) {
    requireStudentEnrollmentAccess(user);
    const student = await findStudentUserForAdmission(input);
    const existing = await db.batchStudent.findFirst({
      where: { batchId, studentId: student.id },
    });

    if (existing) {
      return db.batchStudent.update({
        where: { id: existing.id },
        data: {
          status: "ACTIVE",
          remarks: input.notes || input.rollNumber || existing.remarks,
        },
      });
    }

    return db.batchStudent.create({
      data: {
        batchId,
        studentId: student.id,
        status: "ACTIVE",
        remarks: input.notes || input.rollNumber || null,
      },
    });
  },

  async assignTeacher(user: Requester, batchId: string, input: TeacherInput) {
    requireAcademic(user);
    if (!input.teacherId) {
      throw Object.assign(new Error("Teacher is required"), { statusCode: 400 });
    }

    const teacher = await prisma.user.findUnique({
      where: { id: input.teacherId },
      select: { id: true, name: true, email: true, role: true },
    });
    const batch = await db.batch.findUnique({ where: { id: batchId }, include: { course: true } });
    if (!teacher || !batch) {
      throw Object.assign(new Error("Teacher or batch not found"), { statusCode: 404 });
    }

    const subjects = (input.subjects?.length ? input.subjects : [input.subject || "General"])
      .map((subject) => subject.trim())
      .filter(Boolean);
    const savedAssignments = [];

    for (const subject of Array.from(new Set(subjects.length ? subjects : ["General"]))) {
      const existing = await prisma.$queryRaw<BatchTeacherAssignmentRow[]>`
        SELECT * FROM "BatchTeacherAssignment"
        WHERE "batchId" = ${batchId}
        AND "teacherId" = ${teacher.id}
        AND "subject" = ${subject}
        LIMIT 1
      `;

      if (existing[0]) {
        await prisma.$executeRaw`
          UPDATE "BatchTeacherAssignment"
          SET "role" = ${input.role || "Subject Teacher"},
              "status" = 'ACTIVE',
              "updatedAt" = ${new Date()}
          WHERE "id" = ${existing[0].id}
        `;
        await prisma.teacherBatchAssignment
          .upsert({
            where: {
              batchId_teacherId_subject: {
                batchId,
                teacherId: teacher.id,
                subject,
              },
            },
            create: {
              batchId,
              teacherId: teacher.id,
              subject,
              role: input.role || "Subject Teacher",
              status: "ACTIVE",
            },
            update: {
              role: input.role || "Subject Teacher",
              status: "ACTIVE",
            },
          })
          .catch(() => undefined);
        savedAssignments.push({
          ...existing[0],
          role: input.role || "Subject Teacher",
          status: "ACTIVE",
          batch,
          teacher,
        });
        continue;
      }

      const id = randomUUID();
      await prisma.$executeRaw`
        INSERT INTO "BatchTeacherAssignment"
        ("id", "batchId", "teacherId", "subject", "role", "status", "createdAt", "updatedAt")
        VALUES
        (${id}, ${batchId}, ${teacher.id}, ${subject}, ${input.role || "Subject Teacher"}, 'ACTIVE', ${new Date()}, ${new Date()})
      `;
      await prisma.teacherBatchAssignment
        .upsert({
          where: {
            batchId_teacherId_subject: {
              batchId,
              teacherId: teacher.id,
              subject,
            },
          },
          create: {
            batchId,
            teacherId: teacher.id,
            subject,
            role: input.role || "Subject Teacher",
            status: "ACTIVE",
          },
          update: {
            role: input.role || "Subject Teacher",
            status: "ACTIVE",
          },
        })
        .catch(() => undefined);
      savedAssignments.push({
        id,
        batchId,
        teacherId: teacher.id,
        subject,
        role: input.role || "Subject Teacher",
        status: "ACTIVE",
        batch,
        teacher,
      });
    }

    return savedAssignments.length === 1 ? savedAssignments[0] : { assignments: savedAssignments, batch, teacher };
  },

  async teacherAssignments(user: Requester) {
    requireAcademic(user);
    const teacherWorkspace = usesTeacherWorkspace(user);
    const rows = teacherWorkspace
      ? await prisma.$queryRaw<BatchTeacherAssignmentRow[]>`
          SELECT * FROM "BatchTeacherAssignment"
          WHERE "teacherId" = ${user.id}
          AND "status" = 'ACTIVE'
          ORDER BY "createdAt" DESC
        `
      : await prisma.$queryRaw<BatchTeacherAssignmentRow[]>`
          SELECT * FROM "BatchTeacherAssignment"
          WHERE "status" = 'ACTIVE'
          ORDER BY "createdAt" DESC
        `;
    const visibleRows = teacherWorkspace ? rows.filter((row) => isVisibleTeacherWorkspaceAllocation(row, user)) : rows;

    const batchIds = Array.from(new Set(visibleRows.map((row) => row.batchId)));
    const allBatches = await batchWithCounts();
    const batches = Array.isArray(allBatches) ? allBatches.filter((batch: any) => batchIds.includes(batch.id)) : [];
    const batchMap = new Map(batches.map((batch) => [batch.id, batch]));

    return visibleRows.map((row) => ({
      ...row,
      batch: batchMap.get(row.batchId) ?? null,
    }));
  },

  async teacherTeachingPlan(user: Requester) {
    requireAcademic(user);
    const teacherWorkspace = usesTeacherWorkspace(user);
    const normalizedRows = teacherWorkspace
      ? await prisma.$queryRaw<BatchTeacherAssignmentRow[]>`
          SELECT * FROM "TeacherBatchAssignment"
          WHERE "teacherId" = ${user.id}
          AND "status" = 'ACTIVE'
          ORDER BY "createdAt" DESC
        `
      : await prisma.$queryRaw<BatchTeacherAssignmentRow[]>`
          SELECT * FROM "TeacherBatchAssignment"
          WHERE "status" = 'ACTIVE'
          ORDER BY "createdAt" DESC
        `;
    const legacyRows = teacherWorkspace
      ? await prisma.$queryRaw<BatchTeacherAssignmentRow[]>`
          SELECT * FROM "BatchTeacherAssignment"
          WHERE "teacherId" = ${user.id}
          AND "status" = 'ACTIVE'
          ORDER BY "createdAt" DESC
        `
      : await prisma.$queryRaw<BatchTeacherAssignmentRow[]>`
          SELECT * FROM "BatchTeacherAssignment"
          WHERE "status" = 'ACTIVE'
          ORDER BY "createdAt" DESC
        `;
    const rows = mergeAssignments(normalizedRows, legacyRows).filter((row) => (teacherWorkspace ? isVisibleTeacherWorkspaceAllocation(row, user) : true));

    const batches = await hydrateTeachingPlanBatches(rows);
    const batchIds = batches.map((batch: any) => batch.id).filter(Boolean);
    const calendar = batchIds.length
      ? teacherWorkspace
        ? await prisma.$queryRaw<AcademicCalendarRow[]>`
            SELECT * FROM "AcademicCalendarItem"
            WHERE "batchId" IN (${Prisma.join(batchIds)})
            AND ("teacherId" = ${user.id} OR "teacherId" IS NULL)
            ORDER BY "plannedDate" ASC, "startTime" ASC
          `
        : await prisma.$queryRaw<AcademicCalendarRow[]>`
            SELECT * FROM "AcademicCalendarItem"
            WHERE "batchId" IN (${Prisma.join(batchIds)})
            ORDER BY "plannedDate" ASC, "startTime" ASC
          `
      : [];

    return {
      assignments: batches,
      batches,
      calendar: calendar.map(sanitizeCalendarRow),
    };
  },

  async myAcademicPlan(user: Requester) {
    const enrollments = await db.batchStudent.findMany({
      where: { studentId: user.id, status: "ACTIVE" },
      orderBy: { joinedAt: "desc" },
    });

    const batchIds = enrollments.map((enrollment: any) => enrollment.batchId);
    const batches = batchIds.length ? await batchWithCounts() : [];
    const assignedBatches = Array.isArray(batches) ? batches.filter((batch: any) => batchIds.includes(batch.id)) : [];
    const calendar = batchIds.length
      ? await prisma.$queryRaw<AcademicCalendarRow[]>`
          SELECT * FROM "AcademicCalendarItem"
          WHERE "batchId" IN (${Prisma.join(batchIds)})
          ORDER BY "plannedDate" ASC, "startTime" ASC
        `
      : [];
    const attendanceRows = batchIds.length
      ? await prisma.$queryRaw<any[]>`
          SELECT * FROM "TeacherAttendanceRecord"
          WHERE "batchId" IN (${Prisma.join(batchIds)})
          ORDER BY "date" DESC, "createdAt" DESC
        `
      : [];
    const studentAttendanceRows = attendanceRows
      .map((row) => ({
        ...row,
        records: attendanceRecordList(row).filter((record) => record.studentId === user.id),
      }))
      .filter((row) => row.records.length);
    const assignmentRows = batchIds.length
      ? await prisma.$queryRaw<any[]>`
          SELECT * FROM "TeacherAssignmentRecord"
          WHERE "batchId" IN (${Prisma.join(batchIds)})
          AND "status" != 'ARCHIVED'
          ORDER BY "createdAt" DESC
        `
      : [];
    const assignmentIds = assignmentRows.map((assignment) => assignment.id);
    const submissionRows = assignmentIds.length
      ? await prisma.$queryRaw<any[]>`
          SELECT * FROM "AssignmentSubmissionRecord"
          WHERE "assignmentId" IN (${Prisma.join(assignmentIds)})
          AND "studentId" = ${user.id}
          ORDER BY "submittedAt" DESC
        `
      : [];
    const submissionMap = new Map(submissionRows.map((submission) => [submission.assignmentId, submission]));
    const materialRows = batchIds.length
      ? await prisma.$queryRaw<any[]>`
          SELECT * FROM "TeacherStudyMaterialRecord"
          WHERE "batchId" IN (${Prisma.join(batchIds)})
          AND "status" = 'PUBLISHED'
          AND "reviewStatus" != 'REJECTED'
          ORDER BY "createdAt" DESC
        `
      : [];
    const liveClassRows = batchIds.length
      ? await prisma.$queryRaw<any[]>`
          SELECT * FROM "LiveClass"
          WHERE "batchId" IN (${Prisma.join(batchIds)})
          AND "status" != 'CANCELLED'
          ORDER BY "scheduledAt" ASC
        `
      : [];

    return {
      enrollments,
      batches: assignedBatches,
      calendar: calendar.map(sanitizeCalendarRow),
      attendance: {
        summary: summarizeAttendance(studentAttendanceRows).students[0] ?? {
          studentId: user.id,
          studentName: user.name ?? null,
          present: 0,
          absent: 0,
          leave: 0,
          total: 0,
          percentage: 0,
        },
        sessions: normalizeRows(studentAttendanceRows),
      },
      assignments: normalizeRows(assignmentRows).map((assignment) => ({
        ...assignment,
        submission: submissionMap.get(assignment.id) ? normalizeRows([submissionMap.get(assignment.id) as any])[0] : null,
        submissionStatus: submissionMap.has(assignment.id) ? "SUBMITTED" : "PENDING",
      })),
      materials: normalizeRows(materialRows),
      liveClasses: normalizeRows(liveClassRows),
    };
  },

  async teachers() {
    return prisma.user.findMany({
      where: { role: { in: [Role.TEACHER, Role.DIRECTOR] } },
      select: {
        id: true,
        name: true,
        email: true,
        mobile: true,
        role: true,
        roleMetadata: true,
      },
      orderBy: { name: "asc" },
    });
  },

  async employees(user: Requester, includeArchived = false) {
    requireManagement(user);
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        mobile: true,
        role: true,
        roleMetadata: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return users.filter((employee) => {
      const metadata = (employee.roleMetadata ?? {}) as Record<string, unknown>;
      return includeArchived || metadata.status !== "ARCHIVED";
    });
  },

  async createEmployee(user: Requester, input: EmployeeInput) {
    requireEmployeeCreationAccess(user, input);
    if (!input.name || !input.email || !input.role) {
      throw Object.assign(new Error("Name, email and role are required"), { statusCode: 400 });
    }

    if (![Role.ADMIN, Role.DIRECTOR, Role.TEACHER, Role.TELECALLER].includes(input.role as any)) {
      throw Object.assign(new Error("Only employee roles can be created here"), { statusCode: 400 });
    }

    const temporaryPassword = input.password || "123456789";
    const password = await bcrypt.hash(temporaryPassword, 10);
    const roleMetadata = toJsonObject({
      designation: input.designation || "Employee",
      department: input.department || "Academy",
      employmentType: input.employmentType || "FULL_TIME",
      hourlyRate: input.hourlyRate ?? null,
      subjects: input.subjects || [],
      dashboardTemplate: input.dashboardTemplate || (input.designation?.toLowerCase().includes("academic head") ? "ACADEMIC_HEAD" : null),
      status: "ACTIVE",
      createdBy: user.id,
      credentialGeneratedAt: new Date().toISOString(),
    });

    const created = await prisma.user.create({
      data: {
        name: input.name,
        email: input.email.toLowerCase(),
        mobile: input.phone || "",
        role: input.role,
        password,
        mustChangePassword: true,
        roleMetadata,
      },
      select: {
        id: true,
        name: true,
        email: true,
        mobile: true,
        role: true,
        roleMetadata: true,
      },
    });

    return {
      employee: created,
      credentials: {
        email: created.email,
        temporaryPassword,
        mustChangePassword: true,
      },
    };
  },

  async updateEmployee(user: Requester, employeeId: string, input: EmployeeUpdateInput) {
    requireManagement(user);
    const employee = await prisma.user.findUnique({ where: { id: employeeId } });
    if (!employee) {
      throw Object.assign(new Error("Employee not found"), { statusCode: 404 });
    }

    const existingMetadata = (employee.roleMetadata ?? {}) as Record<string, unknown>;
    const roleMetadata = toJsonObject({
      ...existingMetadata,
      designation: input.designation ?? existingMetadata.designation ?? null,
      department: input.department ?? existingMetadata.department ?? null,
      employmentType: input.employmentType ?? existingMetadata.employmentType ?? null,
      hourlyRate: input.hourlyRate ?? existingMetadata.hourlyRate ?? null,
      subjects: input.subjects ?? existingMetadata.subjects ?? [],
      dashboardTemplate: input.dashboardTemplate ?? existingMetadata.dashboardTemplate ?? null,
      status: input.status ?? existingMetadata.status ?? "ACTIVE",
      updatedBy: user.id,
      updatedAt: new Date().toISOString(),
    });

    return prisma.user.update({
      where: { id: employeeId },
      data: {
        name: input.name,
        email: input.email?.toLowerCase(),
        mobile: input.phone,
        role: input.role,
        roleMetadata,
      },
      select: {
        id: true,
        name: true,
        email: true,
        mobile: true,
        role: true,
        roleMetadata: true,
      },
    });
  },

  async archiveEmployee(user: Requester, employeeId: string) {
    requireManagement(user);
    return this.updateEmployee(user, employeeId, { status: "ARCHIVED" });
  },

  async resetEmployeePassword(user: Requester, employeeId: string, passwordValue = "123456789") {
    requireManagement(user);
    const password = await bcrypt.hash(passwordValue, 10);
    const employee = await prisma.user.findUnique({ where: { id: employeeId } });
    if (!employee) {
      throw Object.assign(new Error("Employee not found"), { statusCode: 404 });
    }
    const existingMetadata = (employee.roleMetadata ?? {}) as Record<string, unknown>;
    const updated = await prisma.user.update({
      where: { id: employeeId },
      data: {
        password,
        mustChangePassword: true,
        roleMetadata: toJsonObject({
          ...existingMetadata,
          passwordResetBy: user.id,
          passwordResetAt: new Date().toISOString(),
        }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        roleMetadata: true,
      },
    });

    return {
      employee: updated,
      credentials: {
        email: updated.email,
        temporaryPassword: passwordValue,
        mustChangePassword: true,
      },
    };
  },

  async academicCalendar(user: Requester, query: Record<string, unknown>) {
    requireAcademic(user);
    const batchId = typeof query.batchId === "string" ? query.batchId : undefined;
    const teacherId = user.role === Role.TEACHER ? user.id : typeof query.teacherId === "string" ? query.teacherId : undefined;

    const rows = batchId
      ? await prisma.$queryRaw<AcademicCalendarRow[]>`
          SELECT * FROM "AcademicCalendarItem"
          WHERE "batchId" = ${batchId}
          ORDER BY "plannedDate" ASC, "startTime" ASC
        `
      : teacherId
        ? await prisma.$queryRaw<AcademicCalendarRow[]>`
            SELECT * FROM "AcademicCalendarItem"
            WHERE "teacherId" = ${teacherId}
            ORDER BY "plannedDate" ASC, "startTime" ASC
          `
        : await prisma.$queryRaw<AcademicCalendarRow[]>`
            SELECT * FROM "AcademicCalendarItem"
            ORDER BY "plannedDate" ASC, "startTime" ASC
          `;

    return rows.map(sanitizeCalendarRow);
  },

  async createAcademicCalendarItem(user: Requester, input: AcademicCalendarInput) {
    requireAcademic(user);
    if (!input.subject || !input.topic || !input.plannedDate) {
      throw Object.assign(new Error("Subject, topic and planned date are required"), { statusCode: 400 });
    }
    if (input.batchId) {
      await assertBatchSubjectAccess(user, input.batchId, input.subject);
    }
    const assignedTeacher = input.teacherId
      ? await prisma.user.findUnique({ where: { id: input.teacherId }, select: { id: true, name: true, email: true } })
      : null;

    const id = randomUUID();
    const now = new Date();
    await prisma.$executeRaw`
      INSERT INTO "AcademicCalendarItem"
      ("id", "batchId", "batchName", "programSlug", "subject", "topic", "classType", "plannedDate", "startTime", "endTime", "teacherId", "teacherName", "status", "completionStatus", "teacherLog", "nextAction", "createdAt", "updatedAt")
      VALUES
      (${id}, ${input.batchId || null}, ${input.batchName || null}, ${input.programSlug || null}, ${input.subject}, ${input.topic}, ${input.classType || "Live Class"}, ${new Date(input.plannedDate)}, ${input.startTime || null}, ${input.endTime || null}, ${input.teacherId || null}, ${input.teacherName || assignedTeacher?.name || assignedTeacher?.email || null}, ${input.status || "PLANNED"}, ${input.completionStatus || "PENDING"}, ${input.teacherLog || null}, ${input.nextAction || null}, ${now}, ${now})
    `;

    const rows = await prisma.$queryRaw<AcademicCalendarRow[]>`
      SELECT * FROM "AcademicCalendarItem" WHERE "id" = ${id} LIMIT 1
    `;
    const item = sanitizeCalendarRow(rows[0]);
    await auditAcademicAction(user, "ACADEMIC_CALENDAR_CREATED", "AcademicCalendarItem", id, item);
    return item;
  },

  async updateAcademicCalendarItem(user: Requester, id: string, input: AcademicCalendarInput) {
    requireAcademic(user);
    const rows = await prisma.$queryRaw<AcademicCalendarRow[]>`
      SELECT * FROM "AcademicCalendarItem" WHERE "id" = ${id} LIMIT 1
    `;
    const current = rows[0];
    if (!current) {
      throw Object.assign(new Error("Calendar item not found"), { statusCode: 404 });
    }
    if (current.batchId) {
      await assertBatchAccess(user, current.batchId);
    }

    await prisma.$executeRaw`
      UPDATE "AcademicCalendarItem"
      SET
        "subject" = ${input.subject ?? current.subject},
        "topic" = ${input.topic ?? current.topic},
        "classType" = ${input.classType ?? current.classType ?? "Live Class"},
        "plannedDate" = ${input.plannedDate ? new Date(input.plannedDate) : current.plannedDate},
        "startTime" = ${input.startTime ?? current.startTime},
        "endTime" = ${input.endTime ?? current.endTime},
        "teacherId" = ${input.teacherId ?? current.teacherId},
        "teacherName" = ${input.teacherName ?? current.teacherName},
        "status" = ${input.status ?? current.status},
        "completionStatus" = ${input.completionStatus ?? current.completionStatus},
        "teacherLog" = ${input.teacherLog ?? current.teacherLog},
        "nextAction" = ${input.nextAction ?? current.nextAction},
        "updatedAt" = ${new Date()}
      WHERE "id" = ${id}
    `;

    const updated = await prisma.$queryRaw<AcademicCalendarRow[]>`
      SELECT * FROM "AcademicCalendarItem" WHERE "id" = ${id} LIMIT 1
    `;
    const saved = sanitizeCalendarRow(updated[0]);

    await prisma.$executeRaw`
      INSERT INTO "TeacherCalendarLogRecord"
      ("id", "calendarId", "batchId", "batchName", "subject", "topic", "classType", "teacherId", "teacherName", "completionStatus", "teacherLog", "nextAction", "status", "createdAt", "updatedAt")
      VALUES
      (${randomUUID()}, ${id}, ${updated[0].batchId}, ${updated[0].batchName}, ${updated[0].subject}, ${updated[0].topic}, ${updated[0].classType || "Live Class"}, ${user.id}, ${user.name || user.email || null}, ${updated[0].completionStatus}, ${updated[0].teacherLog}, ${updated[0].nextAction}, ${updated[0].status}, ${new Date()}, ${new Date()})
    `;
    if (updated[0].batchId && updated[0].subject && updated[0].topic) {
      const progressRows = await prisma.$queryRaw<any[]>`
        SELECT "id" FROM "TeacherSyllabusProgressRecord"
        WHERE "batchId" = ${updated[0].batchId}
        AND "subject" = ${updated[0].subject}
        AND "topic" = ${updated[0].topic}
        AND (("teacherId" = ${user.id}) OR ("teacherId" IS NULL AND ${user.id} IS NULL))
        LIMIT 1
      `;
      const progressId = progressRows[0]?.id || randomUUID();
      if (progressRows[0]?.id) {
        await prisma.$executeRaw`
          UPDATE "TeacherSyllabusProgressRecord"
          SET "batchName" = ${updated[0].batchName},
              "teacherId" = ${user.id},
              "teacherName" = ${user.name || user.email || null},
              "completionStatus" = ${updated[0].completionStatus},
              "progressColor" = ${progressColor(updated[0].completionStatus)},
              "remarks" = ${updated[0].teacherLog},
              "updatedAt" = ${new Date()}
          WHERE "id" = ${progressId}
        `;
      } else {
      await prisma.$executeRaw`
        INSERT INTO "TeacherSyllabusProgressRecord"
        ("id", "batchId", "batchName", "subject", "topic", "teacherId", "teacherName", "completionStatus", "progressColor", "remarks", "createdAt", "updatedAt")
        VALUES
        (${progressId}, ${updated[0].batchId}, ${updated[0].batchName}, ${updated[0].subject}, ${updated[0].topic}, ${user.id}, ${user.name || user.email || null}, ${updated[0].completionStatus}, ${progressColor(updated[0].completionStatus)}, ${updated[0].teacherLog}, ${new Date()}, ${new Date()})
      `;
      }
    }
    await auditAcademicAction(user, "CALENDAR_LOG_UPDATED", "AcademicCalendarItem", id, saved);
    return saved;
  },

  async saveAttendance(user: Requester, input: AttendanceInput) {
    await assertBatchSubjectAccess(user, input.batchId, input.subject);
    if (!input.date) {
      throw Object.assign(new Error("Attendance date is required"), { statusCode: 400 });
    }
    if (!Array.isArray(input.records) || !input.records.length) {
      throw Object.assign(new Error("Attendance records are required"), { statusCode: 400 });
    }

    const id = randomUUID();
    const now = new Date();
    await prisma.$executeRaw`
      INSERT INTO "TeacherAttendanceRecord"
      ("id", "batchId", "batchName", "subject", "teacherId", "teacherName", "date", "records", "status", "createdAt", "updatedAt")
      VALUES
      (${id}, ${input.batchId}, ${input.batchName || null}, ${input.subject || null}, ${user.id}, ${user.name || user.email || null}, ${new Date(input.date)}, ${JSON.stringify(input.records)}::jsonb, ${input.status || "SAVED"}, ${now}, ${now})
    `;
    const rows = await prisma.$queryRaw<any[]>`
      SELECT * FROM "TeacherAttendanceRecord" WHERE "id" = ${id} LIMIT 1
    `;
    const attendance = normalizeRows(rows)[0];
    await auditAcademicAction(user, "ATTENDANCE_SAVED", "TeacherAttendanceRecord", id, {
      batchId: input.batchId,
      date: input.date,
      total: input.records.length,
    });
    return { ok: true, attendance };
  },

  async attendanceHistory(user: Requester, query: Record<string, unknown>) {
    requireAcademic(user);
    const batchId = typeof query.batchId === "string" ? query.batchId : undefined;
    if (batchId) {
      await assertBatchAccess(user, batchId);
    }
    const rows = batchId
      ? await prisma.$queryRaw<any[]>`
          SELECT * FROM "TeacherAttendanceRecord"
          WHERE "batchId" = ${batchId}
          ORDER BY "date" DESC, "createdAt" DESC
        `
      : user.role === Role.TEACHER && !isAcademicManager(user)
        ? await prisma.$queryRaw<any[]>`
            SELECT * FROM "TeacherAttendanceRecord"
            WHERE "teacherId" = ${user.id}
            ORDER BY "date" DESC, "createdAt" DESC
          `
        : await prisma.$queryRaw<any[]>`
            SELECT * FROM "TeacherAttendanceRecord"
            ORDER BY "date" DESC, "createdAt" DESC
          `;
    return { attendance: normalizeRows(rows) };
  },

  async attendanceSummary(user: Requester, query: Record<string, unknown>) {
    requireAcademic(user);
    const batchId = typeof query.batchId === "string" ? query.batchId : undefined;
    if (batchId) {
      await assertBatchAccess(user, batchId);
    }

    const rows = batchId
      ? await prisma.$queryRaw<any[]>`
          SELECT * FROM "TeacherAttendanceRecord"
          WHERE "batchId" = ${batchId}
          ORDER BY "date" DESC, "createdAt" DESC
        `
      : user.role === Role.TEACHER && !isAcademicManager(user)
        ? await prisma.$queryRaw<any[]>`
            SELECT * FROM "TeacherAttendanceRecord"
            WHERE "teacherId" = ${user.id}
            ORDER BY "date" DESC, "createdAt" DESC
          `
        : await prisma.$queryRaw<any[]>`
            SELECT * FROM "TeacherAttendanceRecord"
            ORDER BY "date" DESC, "createdAt" DESC
          `;

    return {
      summary: summarizeAttendance(rows),
      attendance: normalizeRows(rows),
    };
  },

  async createAssignment(user: Requester, input: AssignmentInput) {
    await assertBatchSubjectAccess(user, input.batchId, input.subject);
    if (!input.title || !input.instructions) {
      throw Object.assign(new Error("Assignment title and instructions are required"), { statusCode: 400 });
    }
    const id = randomUUID();
    const now = new Date();
    await prisma.$executeRaw`
      INSERT INTO "TeacherAssignmentRecord"
      ("id", "batchId", "batchName", "subject", "course", "teacherId", "teacherName", "title", "topic", "instructions", "dueDate", "attachmentName", "link", "status", "createdAt", "updatedAt")
      VALUES
      (${id}, ${input.batchId}, ${input.batchName || null}, ${input.subject || null}, ${input.course || null}, ${user.id}, ${user.name || user.email || null}, ${input.title}, ${input.topic || null}, ${input.instructions}, ${input.dueDate ? new Date(input.dueDate) : null}, ${input.attachmentName || null}, ${input.link || null}, ${input.status || "PUBLISHED"}, ${now}, ${now})
    `;
    const rows = await prisma.$queryRaw<any[]>`
      SELECT * FROM "TeacherAssignmentRecord" WHERE "id" = ${id} LIMIT 1
    `;
    const assignment = normalizeRows(rows)[0];
    await auditAcademicAction(user, "ASSIGNMENT_PUBLISHED", "TeacherAssignmentRecord", id, assignment);
    return { ok: true, assignment };
  },

  async assignments(user: Requester, query: Record<string, unknown>) {
    requireAcademic(user);
    const batchId = typeof query.batchId === "string" ? query.batchId : undefined;
    if (batchId) await assertBatchAccess(user, batchId);
    const queriedRows = batchId
      ? await prisma.$queryRaw<any[]>`
          SELECT * FROM "TeacherAssignmentRecord" WHERE "batchId" = ${batchId} ORDER BY "createdAt" DESC
        `
      : user.role === Role.TEACHER
        ? await prisma.$queryRaw<any[]>`
            SELECT * FROM "TeacherAssignmentRecord" WHERE "teacherId" = ${user.id} ORDER BY "createdAt" DESC
          `
        : await prisma.$queryRaw<any[]>`
            SELECT * FROM "TeacherAssignmentRecord" ORDER BY "createdAt" DESC
          `;
    const rows = await filterRowsToAssignedSubjects(user, batchId, queriedRows);
    const assignmentIds = rows.map((row) => row.id);
    const submissions = assignmentIds.length
      ? await prisma.$queryRaw<any[]>`
          SELECT * FROM "AssignmentSubmissionRecord"
          WHERE "assignmentId" IN (${Prisma.join(assignmentIds)})
          ORDER BY "submittedAt" DESC
        `
      : [];
    const counts = await batchStudentCountMap(Array.from(new Set(rows.map((row) => row.batchId))));
    return summarizeAssignments(rows, submissions, counts);
  },

  async assignmentSummary(user: Requester, query: Record<string, unknown>) {
    requireAcademic(user);
    return this.assignments(user, query);
  },

  async submitAssignment(user: Requester, assignmentId: string, input: AssignmentSubmissionInput) {
    if (user.role !== Role.STUDENT) {
      throw Object.assign(new Error("Student access required"), { statusCode: 403 });
    }
    const assignments = await prisma.$queryRaw<any[]>`
      SELECT * FROM "TeacherAssignmentRecord"
      WHERE "id" = ${assignmentId}
      AND "status" != 'ARCHIVED'
      LIMIT 1
    `;
    const assignment = assignments[0];
    if (!assignment) {
      throw Object.assign(new Error("Assignment not found"), { statusCode: 404 });
    }
    await assertStudentBatchAccess(user, assignment.batchId);
    if (!input.answerText && !input.attachmentName && !input.link) {
      throw Object.assign(new Error("Submission text, file name or link is required"), { statusCode: 400 });
    }

    const existing = await prisma.$queryRaw<any[]>`
      SELECT * FROM "AssignmentSubmissionRecord"
      WHERE "assignmentId" = ${assignmentId}
      AND "studentId" = ${user.id}
      LIMIT 1
    `;
    const now = new Date();
    const id = existing[0]?.id ?? randomUUID();
    if (existing[0]) {
      await prisma.$executeRaw`
        UPDATE "AssignmentSubmissionRecord"
        SET "answerText" = ${input.answerText || null},
            "attachmentName" = ${input.attachmentName || null},
            "link" = ${input.link || null},
            "status" = ${input.status || "SUBMITTED"},
            "submittedAt" = ${now},
            "reviewStatus" = 'PENDING_REVIEW',
            "updatedAt" = ${now}
        WHERE "id" = ${id}
      `;
    } else {
      await prisma.$executeRaw`
        INSERT INTO "AssignmentSubmissionRecord"
        ("id", "assignmentId", "batchId", "studentId", "studentName", "answerText", "attachmentName", "link", "status", "submittedAt", "reviewStatus", "createdAt", "updatedAt")
        VALUES
        (${id}, ${assignmentId}, ${assignment.batchId}, ${user.id}, ${user.name || user.email || null}, ${input.answerText || null}, ${input.attachmentName || null}, ${input.link || null}, ${input.status || "SUBMITTED"}, ${now}, 'PENDING_REVIEW', ${now}, ${now})
      `;
    }
    const rows = await prisma.$queryRaw<any[]>`
      SELECT * FROM "AssignmentSubmissionRecord" WHERE "id" = ${id} LIMIT 1
    `;
    const submission = normalizeRows(rows)[0];
    await auditAcademicAction(user, "ASSIGNMENT_SUBMITTED", "AssignmentSubmissionRecord", id, {
      assignmentId,
      batchId: assignment.batchId,
    });
    return { ok: true, submission };
  },

  async reviewAssignmentSubmission(user: Requester, submissionId: string, input: AssignmentReviewInput) {
    requireAcademic(user);
    const rows = await prisma.$queryRaw<any[]>`
      SELECT * FROM "AssignmentSubmissionRecord" WHERE "id" = ${submissionId} LIMIT 1
    `;
    const current = rows[0];
    if (!current) {
      throw Object.assign(new Error("Submission not found"), { statusCode: 404 });
    }
    await assertBatchAccess(user, current.batchId);
    await prisma.$executeRaw`
      UPDATE "AssignmentSubmissionRecord"
      SET "reviewedBy" = ${user.id},
          "reviewStatus" = ${input.reviewStatus || "REVIEWED"},
          "feedback" = ${input.feedback || null},
          "score" = ${typeof input.score === "number" ? input.score : null},
          "updatedAt" = ${new Date()}
      WHERE "id" = ${submissionId}
    `;
    const updated = await prisma.$queryRaw<any[]>`
      SELECT * FROM "AssignmentSubmissionRecord" WHERE "id" = ${submissionId} LIMIT 1
    `;
    const submission = normalizeRows(updated)[0];
    await auditAcademicAction(user, "ASSIGNMENT_SUBMISSION_REVIEWED", "AssignmentSubmissionRecord", submissionId, submission);
    return { ok: true, submission };
  },

  async publishStudyMaterial(user: Requester, input: StudyMaterialInput) {
    await assertBatchSubjectAccess(user, input.batchId, input.subject);
    if (!input.title) {
      throw Object.assign(new Error("Material title is required"), { statusCode: 400 });
    }
    const id = randomUUID();
    const now = new Date();
    await prisma.$executeRaw`
      INSERT INTO "TeacherStudyMaterialRecord"
      ("id", "batchId", "batchName", "course", "folder", "subject", "topic", "teacherId", "teacherName", "title", "description", "type", "url", "fileName", "cloudinaryPublicId", "thumbnailUrl", "thumbnailPublicId", "fileSize", "durationSeconds", "lessonName", "status", "reviewStatus", "createdAt", "updatedAt")
      VALUES
      (${id}, ${input.batchId}, ${input.batchName || null}, ${input.course || null}, ${input.folder || null}, ${input.subject || null}, ${input.topic || null}, ${user.id}, ${user.name || user.email || null}, ${input.title}, ${input.description || null}, ${input.type || "PDF"}, ${input.url || null}, ${input.fileName || null}, ${input.cloudinaryPublicId || null}, ${input.thumbnailUrl || null}, ${input.thumbnailPublicId || null}, ${typeof input.fileSize === "number" ? input.fileSize : null}, ${typeof input.durationSeconds === "number" ? input.durationSeconds : null}, ${input.lessonName || input.title || null}, ${input.status || "PUBLISHED"}, ${input.reviewStatus || "PENDING_REVIEW"}, ${now}, ${now})
    `;
    const rows = await prisma.$queryRaw<any[]>`
      SELECT * FROM "TeacherStudyMaterialRecord" WHERE "id" = ${id} LIMIT 1
    `;
    const material = normalizeRows(rows)[0];
    await auditAcademicAction(user, "MATERIAL_PUBLISHED", "TeacherStudyMaterialRecord", id, material);
    return { ok: true, material };
  },

  async studyMaterials(user: Requester, query: Record<string, unknown>) {
    requireAcademic(user);
    const batchId = typeof query.batchId === "string" ? query.batchId : undefined;
    const includeArchived = query.includeArchived === "true" || query.includeArchived === true;
    const search = typeof query.search === "string" ? query.search.trim() : "";
    const page = Math.max(1, Number(query.page ?? 1) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit ?? 50) || 50));
    const skip = (page - 1) * limit;
    if (batchId) await assertBatchAccess(user, batchId);
    const where: Prisma.TeacherStudyMaterialRecordWhereInput = {};
    if (batchId) where.batchId = batchId;
    if (!batchId && user.role === Role.TEACHER && !isAcademicManager(user)) where.teacherId = user.id;
    if (batchId && user.role === Role.TEACHER && !isAcademicManager(user)) {
      const subjects = await assignedSubjectsForUserBatch(user.id, batchId);
      if (!subjects.length) return { materials: [], pagination: { page, limit, total: 0, totalPages: 1 } };
      where.OR = subjects.map((subject) => ({ subject: { equals: subject, mode: "insensitive" as const } }));
    }
    if (!includeArchived) where.status = { not: "ARCHIVED" };
    if (search) {
      const searchOr: Prisma.TeacherStudyMaterialRecordWhereInput[] = [
        { title: { contains: search, mode: "insensitive" as const } },
        { lessonName: { contains: search, mode: "insensitive" as const } },
        { subject: { contains: search, mode: "insensitive" as const } },
        { topic: { contains: search, mode: "insensitive" as const } },
        { fileName: { contains: search, mode: "insensitive" as const } }
      ];
      where.AND = [...(Array.isArray(where.AND) ? where.AND : []), { OR: searchOr }];
    }
    const [rows, total] = await Promise.all([
      prisma.teacherStudyMaterialRecord.findMany({ where, orderBy: { createdAt: "desc" }, skip, take: limit }),
      prisma.teacherStudyMaterialRecord.count({ where })
    ]);
    return { materials: normalizeRows(rows), pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) } };
  },

  async materialSummary(user: Requester, query: Record<string, unknown>) {
    requireAcademic(user);
    const data = await this.studyMaterials(user, query);
    const materials = data.materials as Array<Record<string, any>>;
    return {
      materials,
      summary: {
        total: materials.length,
        published: materials.filter((item) => item.status === "PUBLISHED").length,
        pendingReview: materials.filter((item) => item.reviewStatus === "PENDING_REVIEW").length,
        approved: materials.filter((item) => item.reviewStatus === "APPROVED").length,
        rejected: materials.filter((item) => item.reviewStatus === "REJECTED").length,
        links: materials.filter((item) => item.url).length,
        files: materials.filter((item) => item.fileName).length,
        byType: materials.reduce<Record<string, number>>((counts, item) => {
          const type = String(item.type || "UNKNOWN").toUpperCase();
          counts[type] = (counts[type] ?? 0) + 1;
          return counts;
        }, {}),
      },
    };
  },

  async updateStudyMaterial(user: Requester, materialId: string, input: StudyMaterialInput) {
    requireAcademic(user);
    const rows = await prisma.$queryRaw<any[]>`
      SELECT * FROM "TeacherStudyMaterialRecord" WHERE "id" = ${materialId} LIMIT 1
    `;
    const current = rows[0];
    if (!current) {
      throw Object.assign(new Error("Material not found"), { statusCode: 404 });
    }
    await assertBatchAccess(user, current.batchId);
    await assertBatchSubjectAccess(user, current.batchId, input.subject ?? current.subject);
    if (user.role === Role.TEACHER && current.teacherId !== user.id && !isAcademicManager(user)) {
      throw Object.assign(new Error("Only the publishing teacher can edit this material"), { statusCode: 403 });
    }

    await prisma.$executeRaw`
      UPDATE "TeacherStudyMaterialRecord"
      SET "folder" = ${input.folder ?? current.folder},
          "subject" = ${input.subject ?? current.subject},
          "topic" = ${input.topic ?? current.topic},
          "title" = ${input.title ?? current.title},
          "type" = ${input.type ?? current.type},
          "url" = ${input.url ?? current.url},
          "fileName" = ${input.fileName ?? current.fileName},
          "status" = ${input.status ?? current.status},
          "reviewStatus" = ${input.reviewStatus ?? current.reviewStatus},
          "reviewNote" = ${input.reviewNote ?? current.reviewNote},
          "updatedAt" = ${new Date()}
      WHERE "id" = ${materialId}
    `;
    const updated = await prisma.$queryRaw<any[]>`
      SELECT * FROM "TeacherStudyMaterialRecord" WHERE "id" = ${materialId} LIMIT 1
    `;
    const material = normalizeRows(updated)[0];
    await auditAcademicAction(user, "MATERIAL_UPDATED", "TeacherStudyMaterialRecord", materialId, material);
    return { ok: true, material };
  },

  async archiveStudyMaterial(user: Requester, materialId: string) {
    const rows = await prisma.$queryRaw<any[]>`
      SELECT * FROM "TeacherStudyMaterialRecord" WHERE "id" = ${materialId} LIMIT 1
    `;
    const current = rows[0];
    if (!current) {
      throw Object.assign(new Error("Material not found"), { statusCode: 404 });
    }
    return this.updateStudyMaterial(user, materialId, { status: "ARCHIVED" }).then(async (result) => {
      await prisma.$executeRaw`
        UPDATE "TeacherStudyMaterialRecord"
        SET "archivedAt" = ${new Date()},
            "updatedAt" = ${new Date()}
        WHERE "id" = ${materialId}
      `;
      return result;
    });
  },

  async restoreStudyMaterial(user: Requester, materialId: string) {
    requireAcademic(user);
    const rows = await prisma.$queryRaw<any[]>`
      SELECT * FROM "TeacherStudyMaterialRecord" WHERE "id" = ${materialId} LIMIT 1
    `;
    const current = rows[0];
    if (!current) {
      throw Object.assign(new Error("Material not found"), { statusCode: 404 });
    }
    await assertBatchAccess(user, current.batchId);
    if (user.role === Role.TEACHER && current.teacherId !== user.id && !isAcademicManager(user)) {
      throw Object.assign(new Error("Only the publishing teacher can restore this material"), { statusCode: 403 });
    }
    await prisma.$executeRaw`
      UPDATE "TeacherStudyMaterialRecord"
      SET "status" = 'PUBLISHED',
          "archivedAt" = NULL,
          "updatedAt" = ${new Date()}
      WHERE "id" = ${materialId}
    `;
    const updated = await prisma.$queryRaw<any[]>`
      SELECT * FROM "TeacherStudyMaterialRecord" WHERE "id" = ${materialId} LIMIT 1
    `;
    const material = normalizeRows(updated)[0];
    await auditAcademicAction(user, "MATERIAL_RESTORED", "TeacherStudyMaterialRecord", materialId, material);
    return { ok: true, material };
  },

  async deleteStudyMaterial(user: Requester, materialId: string) {
    requireAcademic(user);
    const rows = await prisma.$queryRaw<any[]>`
      SELECT * FROM "TeacherStudyMaterialRecord" WHERE "id" = ${materialId} LIMIT 1
    `;
    const current = rows[0];
    if (!current) {
      throw Object.assign(new Error("Material not found"), { statusCode: 404 });
    }
    await assertBatchAccess(user, current.batchId);
    if (user.role === Role.TEACHER && current.teacherId !== user.id && !isAcademicManager(user)) {
      throw Object.assign(new Error("Only the publishing teacher can delete this material"), { statusCode: 403 });
    }
    if (current.cloudinaryPublicId) {
      await deleteCloudinaryAsset(current.cloudinaryPublicId, materialMimeType(current.type)).catch(() => undefined);
    }
    if (current.thumbnailPublicId) {
      await deleteCloudinaryAsset(current.thumbnailPublicId, "image/jpeg").catch(() => undefined);
    }
    await prisma.$executeRaw`
      DELETE FROM "TeacherStudyMaterialRecord" WHERE "id" = ${materialId}
    `;
    await auditAcademicAction(user, "MATERIAL_DELETED", "TeacherStudyMaterialRecord", materialId, {
      title: current.title,
      cloudinaryPublicId: current.cloudinaryPublicId,
      thumbnailPublicId: current.thumbnailPublicId,
    });
    return { ok: true, message: "Material deleted permanently" };
  },

  async reviewStudyMaterial(user: Requester, materialId: string, input: MaterialReviewInput) {
    if (!isAcademicManager(user)) {
      throw Object.assign(new Error("Academic manager access required"), { statusCode: 403 });
    }
    const rows = await prisma.$queryRaw<any[]>`
      SELECT * FROM "TeacherStudyMaterialRecord" WHERE "id" = ${materialId} LIMIT 1
    `;
    const current = rows[0];
    if (!current) {
      throw Object.assign(new Error("Material not found"), { statusCode: 404 });
    }
    await prisma.$executeRaw`
      UPDATE "TeacherStudyMaterialRecord"
      SET "reviewStatus" = ${input.reviewStatus || "APPROVED"},
          "reviewedBy" = ${user.id},
          "reviewedAt" = ${new Date()},
          "reviewNote" = ${input.reviewNote || null},
          "updatedAt" = ${new Date()}
      WHERE "id" = ${materialId}
    `;
    const updated = await prisma.$queryRaw<any[]>`
      SELECT * FROM "TeacherStudyMaterialRecord" WHERE "id" = ${materialId} LIMIT 1
    `;
    const material = normalizeRows(updated)[0];
    await auditAcademicAction(user, "MATERIAL_REVIEWED", "TeacherStudyMaterialRecord", materialId, material);
    return { ok: true, material };
  },

  async createExamDraft(user: Requester, input: ExamInput) {
    await assertBatchSubjectAccess(user, input.batchId, input.subject);
    if (!input.topic) {
      throw Object.assign(new Error("Exam topic is required"), { statusCode: 400 });
    }
    const draftPayload = await buildExamDraft(user, input);
    const draft = `NIDUS AI draft prepared for ${draftPayload.questions?.length ?? 0} ${draftPayload.questions?.[0]?.difficultyLevel?.toLowerCase() || "medium"} questions on ${draftPayload.topic}.`;
    await auditAcademicAction(user, "EXAM_AI_DRAFT_REQUESTED", "TeacherExamRecord", null, {
      batchId: input.batchId,
      subject: input.subject,
      topic: input.topic,
      questionCount: draftPayload.questions?.length ?? 0,
    });
    return { ...draftPayload, draft };
  },

  async publishExam(user: Requester, input: ExamInput) {
    await assertBatchSubjectAccess(user, input.batchId, input.subject);
    if (!input.title || !input.topic) {
      throw Object.assign(new Error("Exam title and topic are required"), { statusCode: 400 });
    }
    const providedDraft = asDraftPayload(input);
    const generatedDraft = providedDraft?.questions?.length ? providedDraft : await buildExamDraft(user, input);
    const questions = generatedDraft.questions ?? [];
    const testPayload: TestPayload = {
      title: input.title,
      description: input.instructions || `Teacher-created exam on ${input.topic}`,
      examType: generatedDraft.examType || "NIDUS",
      category: generatedDraft.category || "Teacher Generated",
      subject: input.subject || generatedDraft.subject,
      topic: input.topic || generatedDraft.topic,
      batchId: input.batchId,
      teacherId: user.id,
      duration: Number(input.durationMinutes || input.duration || generatedDraft.duration || 20),
      totalMarks: questions.reduce((sum, question) => sum + Number(question.marks || 1), 0),
      isMockTest: true,
      isLive: true,
      status: "PUBLISHED",
      questions,
    };
    const test = await testsService.publishDraft(user, testPayload);
    const id = randomUUID();
    const now = new Date();
    await prisma.$executeRaw`
      INSERT INTO "TeacherExamRecord"
      ("id", "batchId", "batchName", "testId", "subject", "course", "teacherId", "teacherName", "title", "topic", "questionCount", "durationMinutes", "difficulty", "instructions", "draft", "status", "approvedBy", "approvedAt", "createdAt", "updatedAt")
      VALUES
      (${id}, ${input.batchId}, ${input.batchName || null}, ${test.id}, ${input.subject || null}, ${input.course || null}, ${user.id}, ${user.name || user.email || null}, ${input.title}, ${input.topic}, ${questions.length}, ${testPayload.duration}, ${input.difficulty || "MEDIUM"}, ${input.instructions || null}, ${JSON.stringify(generatedDraft)}::jsonb, ${input.status || "PUBLISHED"}, ${user.id}, ${now}, ${now}, ${now})
    `;
    const rows = await prisma.$queryRaw<any[]>`
      SELECT * FROM "TeacherExamRecord" WHERE "id" = ${id} LIMIT 1
    `;
    const exam = (await attachExamStats(rows))[0];
    await auditAcademicAction(user, "EXAM_PUBLISHED", "TeacherExamRecord", id, { ...exam, testId: test.id });
    return { ok: true, exam, test };
  },

  async exams(user: Requester, query: Record<string, unknown>) {
    requireAcademic(user);
    const batchId = typeof query.batchId === "string" ? query.batchId : undefined;
    if (batchId) await assertBatchAccess(user, batchId);
    const queriedRows = batchId
      ? await prisma.$queryRaw<any[]>`
          SELECT * FROM "TeacherExamRecord" WHERE "batchId" = ${batchId} ORDER BY "createdAt" DESC
        `
      : user.role === Role.TEACHER && !isAcademicManager(user)
        ? await prisma.$queryRaw<any[]>`
            SELECT * FROM "TeacherExamRecord" WHERE "teacherId" = ${user.id} ORDER BY "createdAt" DESC
          `
        : await prisma.$queryRaw<any[]>`
            SELECT * FROM "TeacherExamRecord" ORDER BY "createdAt" DESC
          `;
    const rows = await filterRowsToAssignedSubjects(user, batchId, queriedRows);
    return { exams: await attachExamStats(rows) };
  },

  async examSummary(user: Requester, query: Record<string, unknown>) {
    const { exams } = await this.exams(user, query);
    const summary = exams.reduce(
      (total, exam: any) => {
        total.exams += 1;
        if (exam.testId) total.liveTests += 1;
        total.attempts += Number(exam.attemptStats?.attempts || 0);
        total.submitted += Number(exam.attemptStats?.submitted || 0);
        total.scoreTotal += Number(exam.attemptStats?.averageScore || 0) * Number(exam.attemptStats?.submitted || 0);
        total.scored += Number(exam.attemptStats?.submitted || 0);
        total.averageScore = total.scored ? Math.round(total.scoreTotal / total.scored) : 0;
        return total;
      },
      { exams: 0, liveTests: 0, attempts: 0, submitted: 0, scoreTotal: 0, scored: 0, averageScore: 0 },
    );
    return { summary, exams };
  },

  async syllabusProgress(user: Requester, query: Record<string, unknown>) {
    requireAcademic(user);
    const batchId = typeof query.batchId === "string" ? query.batchId : undefined;
    if (batchId) await assertBatchAccess(user, batchId);
    const rows = batchId
      ? await prisma.$queryRaw<any[]>`
          SELECT * FROM "TeacherSyllabusProgressRecord" WHERE "batchId" = ${batchId} ORDER BY "updatedAt" DESC
        `
      : user.role === Role.TEACHER && !isAcademicManager(user)
        ? await prisma.$queryRaw<any[]>`
            SELECT * FROM "TeacherSyllabusProgressRecord" WHERE "teacherId" = ${user.id} ORDER BY "updatedAt" DESC
          `
        : await prisma.$queryRaw<any[]>`
            SELECT * FROM "TeacherSyllabusProgressRecord" ORDER BY "updatedAt" DESC
          `;
    return { progress: normalizeRows(rows) };
  },

  async syllabusSummary(user: Requester, query: Record<string, unknown>) {
    const { progress } = await this.syllabusProgress(user, query);
    const batches = new Map<string, any>();
    for (const item of progress as any[]) {
      const key = item.batchId || "unknown";
      const current = batches.get(key) ?? {
        batchId: item.batchId,
        batchName: item.batchName,
        total: 0,
        green: 0,
        orange: 0,
        red: 0,
        completed: 0,
        partial: 0,
        pending: 0,
        completionPercentage: 0,
      };
      const one = summarizeSyllabusProgress([item]);
      current.total += one.total;
      current.green += one.green;
      current.orange += one.orange;
      current.red += one.red;
      current.completed += one.completed;
      current.partial += one.partial;
      current.pending += one.pending;
      current.completionPercentage = percentage(current.completed, current.total);
      batches.set(key, current);
    }
    return {
      summary: summarizeSyllabusProgress(progress as any[]),
      batches: Array.from(batches.values()).sort((a, b) => a.completionPercentage - b.completionPercentage),
      progress,
    };
  },

  async teacherPerformanceSummary(user: Requester) {
    requireAcademic(user);
    const assignments = await prisma.$queryRaw<any[]>`
      SELECT * FROM "BatchTeacherAssignment"
      WHERE "status" = 'ACTIVE'
      ORDER BY "createdAt" DESC
    `;
    const teacherIds = Array.from(new Set(assignments.map((assignment) => assignment.teacherId).filter(Boolean)));
    const teachers = teacherIds.length
      ? await prisma.user.findMany({
          where: { id: { in: teacherIds } },
          select: { id: true, name: true, email: true },
        })
      : [];
    const teacherMap = new Map(teachers.map((teacher) => [teacher.id, teacher]));
    const [calendarRows, attendanceRows, assignmentRows, examRows, materialRows, progressRows] = await Promise.all([
      prisma.$queryRaw<any[]>`SELECT * FROM "TeacherCalendarLogRecord"`,
      prisma.$queryRaw<any[]>`SELECT * FROM "TeacherAttendanceRecord"`,
      prisma.$queryRaw<any[]>`SELECT * FROM "TeacherAssignmentRecord" WHERE "status" != 'ARCHIVED'`,
      prisma.$queryRaw<any[]>`SELECT * FROM "TeacherExamRecord" WHERE "status" != 'ARCHIVED'`,
      prisma.$queryRaw<any[]>`SELECT * FROM "TeacherStudyMaterialRecord" WHERE "status" != 'ARCHIVED'`,
      prisma.$queryRaw<any[]>`SELECT * FROM "TeacherSyllabusProgressRecord"`,
    ]);

    const cards = teacherIds.map((teacherId) => {
      const teacherAssignments = assignments.filter((assignment) => assignment.teacherId === teacherId);
      const teacherProgress = progressRows.filter((item) => item.teacherId === teacherId);
      const completedProgress = teacherProgress.filter((item) => String(item.completionStatus).toUpperCase() === "COMPLETED").length;
      const plannedClasses = calendarRows.filter((item) => item.teacherId === teacherId).length;
      const conductedClasses = calendarRows.filter((item) => item.teacherId === teacherId && String(item.completionStatus).toUpperCase() === "COMPLETED").length;
      const attendanceMarked = attendanceRows.filter((item) => item.teacherId === teacherId).length;
      const syllabusCompletionPercentage = teacherProgress.length ? percentage(completedProgress, teacherProgress.length) : null;
      const attendanceMarkingPercentage = plannedClasses ? percentage(attendanceMarked, plannedClasses) : null;
      const status = trafficStatus(average([syllabusCompletionPercentage ?? NaN, attendanceMarkingPercentage ?? NaN]));
      const teacher = teacherMap.get(teacherId);

      return {
        teacherId,
        teacherName: teacher?.name || teacher?.email || "Teacher",
        assignedBatches: new Set(teacherAssignments.map((assignment) => assignment.batchId)).size,
        assignedSubjects: Array.from(new Set(teacherAssignments.map((assignment) => assignment.subject).filter(Boolean))),
        classesConducted: conductedClasses,
        syllabusCompletionPercentage,
        attendanceMarkingPercentage,
        assignmentsPublished: assignmentRows.filter((item) => item.teacherId === teacherId).length,
        examsPublished: examRows.filter((item) => item.teacherId === teacherId).length,
        libraryMaterialsUploaded: materialRows.filter((item) => item.teacherId === teacherId).length,
        status,
      };
    });

    return { teachers: cards };
  },

  async academicCalendarMonitor(user: Requester) {
    requireAcademic(user);
    const rows = await prisma.$queryRaw<AcademicCalendarRow[]>`
      SELECT * FROM "AcademicCalendarItem"
      ORDER BY "plannedDate" ASC, "startTime" ASC
    `;
    const today = new Date();
    const groups = new Map<string, any>();
    for (const item of rows) {
      const key = `${item.batchId || "none"}:${item.teacherId || "none"}:${item.subject}`;
      const current = groups.get(key) ?? {
        batchId: item.batchId,
        batchName: item.batchName,
        teacherId: item.teacherId,
        teacherName: item.teacherName,
        subject: item.subject,
        plannedClasses: 0,
        completedClasses: 0,
        delayedClasses: 0,
        missedClasses: 0,
        completionPercentage: 0,
        status: "RED",
      };
      const completion = String(item.completionStatus || "").toUpperCase();
      current.plannedClasses += 1;
      if (completion === "COMPLETED") current.completedClasses += 1;
      else if (item.plannedDate < today && completion === "PARTIAL") current.delayedClasses += 1;
      else if (item.plannedDate < today) current.missedClasses += 1;
      current.completionPercentage = percentage(current.completedClasses, current.plannedClasses);
      current.status = trafficStatus(current.completionPercentage, current.plannedClasses);
      groups.set(key, current);
    }

    return { items: Array.from(groups.values()).sort((a, b) => a.completionPercentage - b.completionPercentage) };
  },

  async studentProgressSummary(user: Requester) {
    requireAcademic(user);
    const batches = (await batchWithCounts()) as any[];
    const batchIds = batches.map((batch) => batch.id).filter(Boolean);
    const [attendanceRows, assignmentsData, examsData, materialsData] = await Promise.all([
      batchIds.length
        ? prisma.$queryRaw<any[]>`
            SELECT * FROM "TeacherAttendanceRecord"
            WHERE "batchId" IN (${Prisma.join(batchIds)})
          `
        : Promise.resolve([]),
      this.assignmentSummary(user, {}),
      this.examSummary(user, {}),
      this.materialSummary(user, {}),
    ]);

    const attendance = summarizeAttendance(attendanceRows);
    const attendanceByBatch = new Map(attendance.batches.map((item) => [item.batchId, item]));
    const assignmentRows = assignmentsData.assignments as any[];
    const examRows = examsData.exams as any[];
    const materialRows = materialsData.materials as any[];
    const riskByBatch = new Map<string, number>();
    for (const batch of attendance.batches) {
      const studentStats = new Map<string, { present: number; total: number }>();
      for (const row of attendanceRows.filter((item) => item.batchId === batch.batchId)) {
        for (const record of attendanceRecordList(row)) {
          if (!record.studentId) continue;
          const current = studentStats.get(record.studentId) ?? { present: 0, total: 0 };
          current.total += 1;
          if (String(record.status).toUpperCase() === "PRESENT") current.present += 1;
          studentStats.set(record.studentId, current);
        }
      }
      riskByBatch.set(
        batch.batchId,
        Array.from(studentStats.values()).filter((student) => student.total > 0 && percentage(student.present, student.total) < 60).length,
      );
    }

    const cards = batches.map((batch) => {
      const batchAssignments = assignmentRows.filter((assignment) => assignment.batchId === batch.id);
      const assignmentExpected = batchAssignments.reduce((sum, assignment) => sum + Number(assignment.submissionStats?.totalStudents || 0), 0);
      const assignmentSubmitted = batchAssignments.reduce((sum, assignment) => sum + Number(assignment.submissionStats?.submitted || 0), 0);
      const batchExams = examRows.filter((exam) => exam.batchId === batch.id);
      const examSubmitted = batchExams.reduce((sum, exam) => sum + Number(exam.attemptStats?.submitted || 0), 0);
      const examScoreTotal = batchExams.reduce((sum, exam) => sum + Number(exam.attemptStats?.averageScore || 0) * Number(exam.attemptStats?.submitted || 0), 0);
      const attendancePercentage = attendanceByBatch.get(batch.id)?.percentage ?? null;
      const assignmentCompletionPercentage = assignmentExpected ? percentage(assignmentSubmitted, assignmentExpected) : null;
      const examAveragePercentage = examSubmitted ? Math.round(examScoreTotal / examSubmitted) : null;
      const materialCount = materialRows.filter((material) => material.batchId === batch.id).length;
      const batchHealthScore = average([
        attendancePercentage ?? NaN,
        assignmentCompletionPercentage ?? NaN,
        examAveragePercentage ?? NaN,
      ]);

      return {
        batchId: batch.id,
        batchName: batch.name,
        programSlug: batch.programSlug,
        studentCount: batch._count?.students ?? 0,
        batchHealthScore,
        attendancePercentage,
        assignmentCompletionPercentage,
        examAveragePercentage,
        libraryUsagePercentage: null,
        materialCount,
        riskStudentCount: riskByBatch.get(batch.id) ?? 0,
        overallStatus: academicHealthStatus(batchHealthScore),
      };
    });

    return { batches: cards };
  },

  async academicAssessmentEcosystem(user: Requester) {
    requireAcademic(user);
    const [exams, assignments, questionBanks, aiGenerated] = await Promise.all([
      prisma.$queryRaw<any[]>`SELECT "id" FROM "TeacherExamRecord" WHERE "status" != 'ARCHIVED'`,
      prisma.$queryRaw<any[]>`SELECT "id" FROM "TeacherAssignmentRecord" WHERE "status" != 'ARCHIVED'`,
      prisma.questionBankItem.count().catch(() => 0),
      prisma.$queryRaw<any[]>`
        SELECT "id" FROM "ai_workflow_requests"
        WHERE "agentType" = 'EXAM_CREATOR'
        AND "deletedAt" IS NULL
      `.catch(() => []),
    ]);
    return {
      summary: {
        exams: exams.length,
        mockTests: exams.length,
        assignments: assignments.length,
        questionBanks,
        aiGeneratedAssessments: Array.isArray(aiGenerated) ? aiGenerated.length : 0,
      },
    };
  },

  async academicAuditTrail(user: Requester, query: Record<string, unknown>) {
    requireManagement(user);
    const limit = Math.min(Number(query.limit || 100), 250);
    const rows = await prisma.$queryRaw<any[]>`
      SELECT * FROM "AcademicActivityAuditRecord"
      ORDER BY "createdAt" DESC
      LIMIT ${limit}
    `;
    return { audit: normalizeRows(rows) };
  },

  async directorExpenses(user: Requester) {
    requireManagement(user);
    const rows = await prisma.$queryRaw<any[]>`
      SELECT * FROM "DirectorExpenseRecord"
      ORDER BY "createdAt" DESC
    `;
    const expenses = normalizeRows(rows);
    const active = expenses.filter((item: any) => item.status !== "ARCHIVED");
    const archived = expenses.filter((item: any) => item.status === "ARCHIVED");
    const byCategory = active.reduce<Record<string, number>>((total, item: any) => {
      const category = item.category || "Office";
      total[category] = (total[category] || 0) + Number(item.amount || 0);
      return total;
    }, {});
    return {
      summary: {
        total: active.reduce((sum: number, item: any) => sum + Number(item.amount || 0), 0),
        active: active.length,
        archived: archived.length,
        byCategory,
      },
      expenses,
    };
  },

  async createDirectorExpense(user: Requester, input: DirectorExpenseInput) {
    requireManagement(user);
    if (!input.title || !input.amount || Number(input.amount) <= 0) {
      throw Object.assign(new Error("Expense title and amount are required"), { statusCode: 400 });
    }
    const id = randomUUID();
    const now = new Date();
    await prisma.$executeRaw`
      INSERT INTO "DirectorExpenseRecord"
      ("id", "title", "category", "amount", "currency", "note", "status", "createdBy", "createdAt", "updatedAt")
      VALUES
      (${id}, ${input.title}, ${input.category || "Office"}, ${Number(input.amount)}, ${input.currency || "INR"}, ${input.note || null}, 'ACTIVE', ${user.id}, ${now}, ${now})
    `;
    const rows = await prisma.$queryRaw<any[]>`
      SELECT * FROM "DirectorExpenseRecord" WHERE "id" = ${id} LIMIT 1
    `;
    const expense = normalizeRows(rows)[0];
    await auditAcademicAction(user, "DIRECTOR_EXPENSE_CREATED", "DirectorExpenseRecord", id, expense);
    return { expense };
  },

  async archiveDirectorExpense(user: Requester, id: string) {
    requireManagement(user);
    await prisma.$executeRaw`
      UPDATE "DirectorExpenseRecord"
      SET "status" = 'ARCHIVED',
          "archivedBy" = ${user.id},
          "archivedAt" = ${new Date()},
          "updatedAt" = ${new Date()}
      WHERE "id" = ${id}
    `;
    const rows = await prisma.$queryRaw<any[]>`
      SELECT * FROM "DirectorExpenseRecord" WHERE "id" = ${id} LIMIT 1
    `;
    const expense = normalizeRows(rows)[0];
    await auditAcademicAction(user, "DIRECTOR_EXPENSE_ARCHIVED", "DirectorExpenseRecord", id, expense);
    return { expense };
  },

  async approveAdmissionToBatch(user: Requester, input: ApproveAdmissionInput) {
    requireAdmissionAccess(user);
    if (!input.batchId) {
      throw Object.assign(new Error("Batch is required"), { statusCode: 400 });
    }

    const batch = await db.batch.findUnique({ where: { id: input.batchId }, include: { course: true } });
    if (!batch) {
      throw Object.assign(new Error("Batch not found"), { statusCode: 404 });
    }

    const student = await findStudentUserForAdmission(input);
    const enrollment = await this.addStudent(user, input.batchId, input);
    const now = new Date();
    const totalFee = Number(input.totalFee || 0);
    const amountPaid = Math.max(0, Number(input.amountPaid || 0));
    const paymentStatus = input.paymentStatus || (amountPaid >= totalFee && totalFee > 0 ? "PAID" : amountPaid > 0 ? "PARTIAL" : "PENDING");
    const approvalNotes = [
      input.notes || "",
      amountPaid > 0 ? `Payment confirmed: INR ${amountPaid} via ${input.paymentMethod || "MANUAL"}.` : "",
      input.transactionRef ? `Transaction reference: ${input.transactionRef}.` : "",
    ].filter(Boolean).join("\n");
    let admission: Record<string, unknown> | null = null;
    let payment: Record<string, unknown> | null = null;

    if (batch.courseId) {
      const existingAdmission = input.leadId
        ? await prisma.admission.findFirst({ where: { leadId: input.leadId, studentId: student.id, courseId: batch.courseId } })
        : await prisma.admission.findFirst({ where: { studentId: student.id, courseId: batch.courseId, batch: batch.name } });

      admission = existingAdmission
        ? await prisma.admission.update({
            where: { id: existingAdmission.id },
            data: {
              batch: batch.name,
              status: "ENROLLED",
              approvalStatus: "APPROVED",
              approvedBy: user.id,
              approvedAt: now,
              onboardingStatus: "ACTIVE",
              paymentStatus,
              totalFee,
              paidAmount: amountPaid,
              dueAmount: Math.max(totalFee - amountPaid, 0),
              remarks: approvalNotes || existingAdmission.remarks,
            },
          })
        : await prisma.admission.create({
            data: {
              leadId: input.leadId || undefined,
              studentId: student.id,
              courseId: batch.courseId,
              admissionDate: now,
              paymentStatus,
              status: "ENROLLED",
              admissionMode: input.paymentMethod === "RAZORPAY_LINK" ? "ONLINE" : "MANUAL",
              approvalStatus: "APPROVED",
              approvedBy: user.id,
              approvedAt: now,
              onboardingStatus: "ACTIVE",
              batch: batch.name,
              totalFee,
              paidAmount: amountPaid,
              dueAmount: Math.max(totalFee - amountPaid, 0),
              remarks: approvalNotes || null,
            },
          });
    }

    if (amountPaid > 0) {
      const method = (input.paymentMethod || "OFFICE_COLLECTION").toUpperCase();
      payment = await prisma.payment.create({
        data: {
          userId: student.id,
          courseId: batch.courseId || undefined,
          admissionId: typeof admission?.id === "string" ? admission.id : undefined,
          collectorId: user.id,
          amount: amountPaid,
          currency: "INR",
          razorpayOrderId: `admission_manual_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          paymentStatus: "SUCCESS",
          paymentMethod: method,
          paymentMode: method === "RAZORPAY_LINK" ? "ONLINE" : "MANUAL",
          transactionRef: input.transactionRef || undefined,
          receiptUploadUrl: input.receiptUploadUrl || undefined,
          remarks: approvalNotes || undefined,
          verifiedBy: user.id,
          verifiedAt: now,
        },
      });

      await prisma.paymentTransactionLog.create({
        data: {
          paymentId: payment.id as string,
          event: "ADMISSION_PAYMENT_CONFIRMED",
          actorId: user.id,
          statusTo: "SUCCESS",
          metadata: { batchId: input.batchId, leadId: input.leadId || null, method },
        },
      });
    }

    if (input.leadId) {
      const lead = await prisma.lead.findUnique({ where: { id: input.leadId } });
      if (lead) {
        const existingNotes = lead.notes ? `${lead.notes}\n\n` : "";
        await prisma.lead.update({
          where: { id: input.leadId },
          data: {
            status: "ENROLLED",
            notes: `${existingNotes}[${now.toISOString()}] Admission approved into ${batch.name}.${approvalNotes ? `\n${approvalNotes}` : ""}`,
          },
        });
      }
    }

    await auditAcademicAction(user, "ADMISSION_APPROVED_AND_ACTIVATED", "BatchStudent", enrollment.id, {
      batchId: input.batchId,
      batchName: batch.name,
      studentId: student.id,
      studentEmail: student.email,
      leadId: input.leadId || null,
      admissionId: admission?.id || null,
      paymentId: payment?.id || null,
      paymentStatus,
      amountPaid,
    });

    return {
      status: "APPROVED",
      message: "Admission approved and student dashboard activated.",
      applicationId: input.applicationId || null,
      leadId: input.leadId || null,
      enrollment,
      admission,
      payment,
    };
  },
};
