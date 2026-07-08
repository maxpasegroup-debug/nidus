import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";

import { Prisma, Role } from "../../generated/prisma/client.js";
import { prisma } from "../../config/prisma.js";
import { deleteCloudinaryAsset, signedMediaUrl } from "../../config/cloudinary.js";
import { enqueuePDF } from "../../queues/pdf.queue.js";
import { testsService, validatePublishedQuestions, type TestPayload } from "../tests/tests.service.js";

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

type AcademicCalendarPlannerSession = {
  dayOfWeek?: number;
  subject?: string;
  topic?: string;
  classType?: string;
  startTime?: string;
  endTime?: string;
  teacherId?: string;
};

type AcademicCalendarPlannerInput = {
  batchId?: string;
  startDate?: string;
  endDate?: string;
  academicYear?: string;
  sessions?: AcademicCalendarPlannerSession[];
};

type NormalizedPlannerSession = {
  dayOfWeek: number;
  subject: string;
  topic: string;
  classType: string;
  startTime: string;
  endTime?: string;
  teacherId?: string;
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

type StudentAttendanceInput = {
  batchId?: string;
  subject?: string;
  studentId?: string;
  status?: string;
  remarks?: string;
  date?: string;
};

type LeaveRequestInput = {
  fromDate?: string;
  toDate?: string;
  reason?: string;
  attachmentName?: string;
  attachmentUrl?: string;
  batchId?: string;
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
  targetTeacherId?: string;
  targetTeacherName?: string;
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
  publishDate?: string;
  publishTime?: string;
  publishAt?: string;
  draft?: unknown;
  status?: string;
};

type TodayActionInput = {
  action?: string;
  taskId?: string;
  calendarId?: string;
  batchId?: string;
  subject?: string;
  topic?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  completionStatus?: string;
  teacherLog?: string;
  nextAction?: string;
  homeworkGiven?: string;
  supportNeeded?: string;
  meetingLink?: string;
  recordingUrl?: string;
  records?: AttendanceInput["records"];
};

type ApproveAdmissionInput = StudentInput & {
  batchId: string;
  batchIds?: string[];
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

function isVideoEditor(user: Requester) {
  return staffTemplate(user) === "VIDEO_EDITOR";
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

function materialMimeType(type?: unknown, fileName?: unknown) {
  const normalized = String(type || "").toUpperCase();
  const normalizedName = String(fileName || "").toLowerCase();
  if (normalized.includes("VIDEO") || /\.(mp4|webm|mov)$/.test(normalizedName)) return "video/mp4";
  if (normalized.includes("PDF") || normalizedName.endsWith(".pdf")) return "application/pdf";
  if (normalized.includes("PPT") || /\.(ppt|pptx)$/.test(normalizedName)) return "application/vnd.openxmlformats-officedocument.presentationml.presentation";
  if (normalized.includes("DOC") || normalized.includes("WORD") || /\.(doc|docx)$/.test(normalizedName)) return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  if (normalized.includes("IMAGE") || /\.(png|jpe?g|webp|gif)$/.test(normalizedName)) return "image/jpeg";
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

function withSignedMaterialUrls<T extends Record<string, any>>(rows: T[]) {
  return normalizeRows(rows).map((row) => {
    if (!row.cloudinaryPublicId) return row;
    try {
      return {
        ...row,
        url: signedMediaUrl(String(row.cloudinaryPublicId), materialMimeType(row.type, row.fileName)),
      };
    } catch {
      return row;
    }
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
  if (isAcademicManager(user) || isVideoEditor(user)) {
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

async function resolveMaterialTeacher(user: Requester, input: StudyMaterialInput) {
  if (!isVideoEditor(user)) return { id: user.id, name: user.name || user.email || null };
  if (!input.targetTeacherId || !input.batchId || !input.subject) {
    throw Object.assign(new Error("Batch, subject and faculty are required for editor uploads"), { statusCode: 400 });
  }
  const assignment = await prisma.teacherBatchAssignment.findFirst({
    where: {
      batchId: input.batchId,
      teacherId: input.targetTeacherId,
      subject: { equals: input.subject, mode: "insensitive" },
      status: "ACTIVE",
    },
    include: { teacher: { select: { id: true, name: true, email: true } } },
  });
  if (!assignment) {
    throw Object.assign(new Error("Selected faculty is not allocated to this batch and subject"), { statusCode: 400 });
  }
  return { id: assignment.teacher.id, name: assignment.teacher.name || assignment.teacher.email };
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

function attendanceRecordList(row: Record<string, any>): Array<{ studentId?: string; studentName?: string; status?: string; remarks?: string }> {
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

function isTemporaryActivationCalendarRow(row: AcademicCalendarRow) {
  const topic = String(row.topic || "").trim().toLowerCase();
  const nextAction = String(row.nextAction || "").trim().toLowerCase();
  return (
    nextAction === "conduct class and mark attendance" ||
    ["number system basics", "modern india basics", "motion basics", "indian geography basics", "grammar foundation"].includes(topic)
  );
}

function academyDateKey(value = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(value);
  const year = parts.find((part) => part.type === "year")?.value ?? String(value.getFullYear());
  const month = parts.find((part) => part.type === "month")?.value ?? String(value.getMonth() + 1).padStart(2, "0");
  const day = parts.find((part) => part.type === "day")?.value ?? String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function dateKeyToUtcDate(key: string) {
  return new Date(`${key}T00:00:00.000Z`);
}

function addUtcDays(date: Date, days: number) {
  const value = new Date(date);
  value.setUTCDate(value.getUTCDate() + days);
  return value;
}

function calendarRowDateKey(row: AcademicCalendarRow) {
  return row.plannedDate.toISOString().slice(0, 10);
}

function normalizedSubjectKey(value?: string | null) {
  return String(value || "").trim().toLowerCase();
}

function calendarTaskType(row: AcademicCalendarRow) {
  const type = String(row.classType || "CLASS").toUpperCase();
  if (type.includes("RECORD")) return "COURSE_RECORDING";
  if (type.includes("ASSIGN")) return "ASSIGNMENT";
  if (type.includes("EXAM") || type.includes("TEST") || type.includes("MOCK")) return "EXAMINATION";
  if (type.includes("MEETING") || type.includes("PTA")) return "MEETING";
  if (type.includes("ATTENDANCE")) return "ATTENDANCE";
  if (type.includes("LIVE")) return "LIVE_CLASS";
  return "CLASS";
}

function todayTaskStatus(row: AcademicCalendarRow) {
  const status = String(row.completionStatus || row.status || "PENDING").toUpperCase();
  if (status === "COMPLETED") return "DONE";
  if (status === "CANCELLED") return "CANCELLED";
  if (status === "PARTIAL" || status === "PARTIALLY_COMPLETED") return "PARTIAL";
  return "TODO";
}

function calendarTodayTask(row: AcademicCalendarRow, source: "TODAY_CALENDAR" | "UPCOMING_CALENDAR") {
  const status = todayTaskStatus(row);
  const type = calendarTaskType(row);
  const actions = [
    { key: "OPEN_CLASS", label: "Open Class" },
    { key: "COMPLETE", label: type === "MEETING" ? "Mark Done" : "Complete Class" },
  ];
  if (type === "CLASS" || type === "LIVE_CLASS" || type === "COURSE_RECORDING") {
    actions.push(
      { key: "ATTENDANCE", label: "Attendance" },
      { key: "LIVE_CLASS", label: "Go Live" },
      { key: "ASSIGNMENT", label: "Assignment" },
      { key: "EXAM", label: "Exam" },
      { key: "LIBRARY", label: type === "COURSE_RECORDING" ? "Upload Recording" : "Library" },
    );
  } else if (type === "ASSIGNMENT") {
    actions.push({ key: "ASSIGNMENT", label: "Create Assignment" });
  } else if (type === "EXAMINATION") {
    actions.push({ key: "EXAM", label: "Create Exam" });
  } else if (type === "ATTENDANCE") {
    actions.push({ key: "ATTENDANCE", label: "Mark Attendance" });
  }
  return {
    id: `calendar-${row.id}`,
    source,
    sourceId: row.id,
    type,
    date: calendarRowDateKey(row),
    time: row.startTime,
    endTime: row.endTime,
    title: `${row.batchName || "Batch"} / ${row.subject || "Subject"}`,
    detail: row.topic || "Topic pending",
    batchId: row.batchId,
    batchName: row.batchName,
    subject: row.subject,
    topic: row.topic,
    teacherId: row.teacherId,
    teacherName: row.teacherName,
    status,
    done: status === "DONE" || status === "CANCELLED",
    actions,
  };
}

function academicReviewTask(kind: "ASSIGNMENT_REVIEW" | "EXAM_REVIEW", item: Record<string, any>) {
  return {
    id: `${kind.toLowerCase()}-${item.id}`,
    source: kind,
    sourceId: item.id,
    type: kind,
    date: item.dueDate ? new Date(item.dueDate).toISOString().slice(0, 10) : academyDateKey(),
    time: null,
    endTime: null,
    title: item.title || (kind === "ASSIGNMENT_REVIEW" ? "Assignment review" : "Exam review"),
    detail: [item.batchName || "Batch", item.subject || "Subject", item.status || "Pending"].filter(Boolean).join(" / "),
    batchId: item.batchId || null,
    batchName: item.batchName || null,
    subject: item.subject || null,
    topic: item.topic || null,
    teacherId: item.teacherId || null,
    teacherName: item.teacherName || null,
    status: "TODO",
    done: false,
    actions: [{ key: "REVIEW", label: "Review" }],
  };
}

function parsePlannerDate(value: string, label: string) {
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    throw Object.assign(new Error(`${label} is invalid`), { statusCode: 400 });
  }
  return date;
}

function normalizePlannerSession(session: AcademicCalendarPlannerSession): NormalizedPlannerSession | null {
  const dayOfWeek = Number(session.dayOfWeek);
  const subject = String(session.subject || "").trim();
  const topic = String(session.topic || "").trim();
  const startTime = String(session.startTime || "").trim();
  if (!Number.isInteger(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6 || !subject || !topic || !startTime) {
    return null;
  }
  return {
    dayOfWeek,
    subject,
    topic,
    startTime,
    endTime: String(session.endTime || "").trim() || undefined,
    teacherId: String(session.teacherId || "").trim() || undefined,
    classType: String(session.classType || "").trim() || "LECTURE",
  };
}

function datesForDayOfWeek(startDate: Date, endDate: Date, dayOfWeek: number) {
  const dates: Date[] = [];
  const cursor = new Date(startDate);
  while (cursor.getUTCDay() !== dayOfWeek) {
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  while (cursor <= endDate) {
    dates.push(new Date(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 7);
  }
  return dates;
}

function isTemporaryActivationAcademicRecord(row: Record<string, any>) {
  const title = String(row.title || "").trim().toLowerCase();
  const topic = String(row.topic || "").trim().toLowerCase();
  const instructions = String(row.instructions || "").trim().toLowerCase();
  return (
    title.includes("launch homework") ||
    title.includes("launch test") ||
    title.includes("class test 1 -") ||
    title.includes("class test 2 -") ||
    title.includes("homework 1 -") ||
    title.includes("homework 2 -") ||
    instructions.includes("starter homework") ||
    ["number system basics", "modern india basics", "motion basics", "indian geography basics", "grammar foundation"].includes(topic)
  );
}

function isDemoAcademyUser(user?: { name?: string | null; email?: string | null; mobile?: string | null; roleMetadata?: unknown } | null) {
  if (!user) return false;
  const haystack = [
    user.name,
    user.email,
    user.mobile,
    JSON.stringify(user.roleMetadata ?? {}),
  ].join(" ").toLowerCase();
  return (
    haystack.includes("maj. vikram") ||
    haystack.includes("maj vikram") ||
    haystack.includes("faculty.ssb@nidusacademy") ||
    haystack.includes("ssb mentor")
  );
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

  const activeStudentsByBatch = new Map<string, any[]>(
    batches.map((batch: any) => [
      batch.id,
      (batch.students ?? []).filter((student: any) => student.status === "ACTIVE"),
    ]),
  );
  const studentIds = Array.from(
    new Set(
      batches
        .flatMap((batch: any) => activeStudentsByBatch.get(batch.id) ?? [])
        .map((student: any) => student.studentId)
        .filter(Boolean),
    ),
  );
  const users = studentIds.length
    ? await prisma.user.findMany({
        where: { id: { in: studentIds as string[] } },
        select: { id: true, name: true, email: true, mobile: true, role: true, roleMetadata: true },
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
        where: { id: { in: teacherIds }, isDisabled: false },
        select: { id: true, name: true, email: true, mobile: true, role: true, roleMetadata: true },
      })
    : [];
  const teacherMap = new Map(teacherUsers.filter((teacher) => !isDemoAcademyUser(teacher)).map((teacher) => [teacher.id, teacher]));
  const visibleTeacherAssignments = teacherAssignments.filter((assignment) => teacherMap.has(assignment.teacherId));

  const profileValue = (metadata: unknown, key: string) => {
    if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return null;
    const value = (metadata as Record<string, unknown>)[key];
    return typeof value === "string" && value.trim() ? value : null;
  };

  const hydrated = batches.map((batch: any) => {
    const activeStudents = activeStudentsByBatch.get(batch.id) ?? [];
    return {
      ...batch,
      students: activeStudents.map((student: any) => ({
        ...student,
        user: userMap.get(student.studentId) ?? null,
        student: userMap.has(student.studentId)
          ? {
              ...userMap.get(student.studentId),
              rollNumber: student.remarks || null,
              photoUrl: profileValue(userMap.get(student.studentId)?.roleMetadata, "photoUrl"),
              avatarUrl: profileValue(userMap.get(student.studentId)?.roleMetadata, "avatarUrl"),
            }
          : null,
      })),
      teachers: visibleTeacherAssignments
        .filter((assignment) => assignment.batchId === batch.id)
        .map((assignment) => ({
          ...assignment,
          teacher: teacherMap.get(assignment.teacherId) ?? null,
        })),
      _count: {
        ...(batch._count ?? {}),
        students: activeStudents.length,
        teachers: visibleTeacherAssignments.filter((assignment) => assignment.batchId === batch.id).length,
      },
    };
  });

  return normalized.batchId ? hydrated[0] : hydrated;
}

async function findStudentUserForAdmission(input: StudentInput) {
  if (input.userId) {
    return prisma.user.update({
      where: { id: input.userId },
      data: {
        role: Role.STUDENT,
        roleOnboardingStatus: "ACTIVE",
        roleActivatedAt: new Date(),
        isDisabled: false,
        lockedUntil: null,
        loginFailureCount: 0,
      },
    });
  }

  const email = input.email?.trim().toLowerCase();
  const mobile = input.phone?.trim();
  if (!email && !mobile) {
    throw Object.assign(new Error("Student email, mobile or user id is required"), { statusCode: 400 });
  }

  const existing = email
    ? await prisma.user.findUnique({ where: { email } })
    : mobile
      ? await prisma.user.findUnique({ where: { mobile } })
      : null;
  if (!existing) {
    throw Object.assign(new Error("Student account not found. Ask the applicant to sign up first, or create a guest account from BDE."), {
      statusCode: 404,
    });
  }

  return prisma.user.update({
    where: { id: existing.id },
    data: {
      name: input.name || existing.name,
      mobile: input.phone || existing.mobile,
      role: Role.STUDENT,
      roleOnboardingStatus: "ACTIVE",
      roleActivatedAt: new Date(),
      isDisabled: false,
      lockedUntil: null,
      loginFailureCount: 0,
    },
  });
}

export const academyService = {
  async batches(user: Requester, query: Record<string, unknown> = {}) {
    if (!isAdmissionCell(user)) {
      requireAcademic(user);
    }

    let where = batchWhereFromQuery(query);
    if (!isManagement(user) && !isAdmissionCell(user) && !isVideoEditor(user)) {
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
    const academicHeadWorkspace = isAcademicHeadWorkspace(user);
    const calendarWindowStart = new Date();
    calendarWindowStart.setHours(0, 0, 0, 0);
    calendarWindowStart.setDate(calendarWindowStart.getDate() - 45);
    const calendarWindowEnd = new Date();
    calendarWindowEnd.setHours(23, 59, 59, 999);
    calendarWindowEnd.setDate(calendarWindowEnd.getDate() + 120);
    const calendar = batchIds.length
      ? teacherWorkspace && !academicHeadWorkspace
        ? await prisma.$queryRaw<AcademicCalendarRow[]>`
            SELECT * FROM "AcademicCalendarItem"
            WHERE "batchId" IN (${Prisma.join(batchIds)})
            AND ("teacherId" = ${user.id} OR "teacherId" IS NULL)
            AND "plannedDate" >= ${calendarWindowStart}
            AND "plannedDate" <= ${calendarWindowEnd}
            ORDER BY "plannedDate" ASC, "startTime" ASC
          `
        : await prisma.$queryRaw<AcademicCalendarRow[]>`
            SELECT * FROM "AcademicCalendarItem"
            WHERE "batchId" IN (${Prisma.join(batchIds)})
            AND "plannedDate" >= ${calendarWindowStart}
            AND "plannedDate" <= ${calendarWindowEnd}
            ORDER BY "plannedDate" ASC, "startTime" ASC
          `
      : [];

    const subjects = Array.from(new Set(
      batches.flatMap((batch: any) => Array.isArray(batch.assignedSubjects) ? batch.assignedSubjects : []),
    ));
    const studentIds = new Set(
      batches.flatMap((batch: any) => (batch.students ?? []).map((entry: any) => entry.studentId).filter(Boolean)),
    );
    const visibleCalendar = calendar.filter((row) => !isTemporaryActivationCalendarRow(row)).map(sanitizeCalendarRow);

    return {
      version: 1,
      scope: {
        mode: "ASSIGNED_TEACHING",
        userId: user.id,
        role: user.role,
        academicHead: academicHeadWorkspace,
      },
      summary: {
        batchCount: batches.length,
        studentCount: studentIds.size,
        subjectCount: subjects.length,
        calendarCount: visibleCalendar.length,
      },
      assignments: batches,
      batches,
      calendar: visibleCalendar,
    };
  },

  async batchAnnouncements(user: Requester, batchId: string) {
    requireAcademic(user);
    await assertBatchAccess(user, batchId);
    const audience = `BATCH:${batchId}`;
    const announcements = await prisma.announcement.findMany({
      where: { OR: [{ audience }, { targetAudience: audience }] },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { creator: { select: { id: true, name: true } } },
    });
    return { announcements };
  },

  async createBatchAnnouncement(user: Requester, batchId: string, input: { title?: string; description?: string }) {
    requireAcademic(user);
    await assertBatchAccess(user, batchId);
    const title = input.title?.trim();
    const description = input.description?.trim();
    if (!title || !description) {
      throw Object.assign(new Error("Announcement title and message are required"), { statusCode: 400 });
    }
    const batch = await prisma.batch.findUnique({
      where: { id: batchId },
      select: { id: true, name: true, students: { where: { status: "ACTIVE" }, select: { studentId: true } } },
    });
    if (!batch) throw Object.assign(new Error("Batch not found"), { statusCode: 404 });
    const audience = `BATCH:${batchId}`;
    const announcement = await prisma.$transaction(async (transaction) => {
      const created = await transaction.announcement.create({
        data: { title, description, audience, targetAudience: audience, createdBy: user.id },
        include: { creator: { select: { id: true, name: true } } },
      });
      if (batch.students.length) {
        await transaction.notification.createMany({
          data: batch.students.map(({ studentId }) => ({
            userId: studentId,
            title,
            message: description,
            type: "BATCH_ANNOUNCEMENT",
          })),
        });
      }
      return created;
    });
    await auditAcademicAction(user, "BATCH_ANNOUNCEMENT_CREATED", "Batch", batchId, {
      announcementId: announcement.id,
      batchName: batch.name,
      recipients: batch.students.length,
    });
    return { announcement, recipientCount: batch.students.length };
  },

  async today(user: Requester, query: Record<string, unknown>) {
    requireAcademic(user);
    const todayKey = typeof query.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(query.date)
      ? query.date
      : academyDateKey();
    const todayStart = dateKeyToUtcDate(todayKey);
    const tomorrowStart = addUtcDays(todayStart, 1);
    const upcomingEnd = addUtcDays(todayStart, 15);
    const academicManager = isAcademicManager(user);

    let batches: any[] = [];
    let assignmentRows: BatchTeacherAssignmentRow[] = [];
    const subjectsByBatch = new Map<string, Set<string>>();

    if (academicManager) {
      const allBatches = await batchWithCounts({ where: { status: "ACTIVE" } });
      batches = Array.isArray(allBatches) ? allBatches : allBatches ? [allBatches] : [];
    } else {
      const [normalizedRows, legacyRows] = await Promise.all([
        prisma.$queryRaw<BatchTeacherAssignmentRow[]>`
          SELECT * FROM "TeacherBatchAssignment"
          WHERE "teacherId" = ${user.id}
          AND "status" = 'ACTIVE'
          ORDER BY "createdAt" DESC
        `,
        prisma.$queryRaw<BatchTeacherAssignmentRow[]>`
          SELECT * FROM "BatchTeacherAssignment"
          WHERE "teacherId" = ${user.id}
          AND "status" = 'ACTIVE'
          ORDER BY "createdAt" DESC
        `.catch(() => []),
      ]);
      assignmentRows = mergeAssignments(normalizedRows, legacyRows).filter((row) => isVisibleTeacherWorkspaceAllocation(row, user));
      batches = await hydrateTeachingPlanBatches(assignmentRows);
      for (const row of assignmentRows) {
        if (!row.batchId || !row.subject) continue;
        const subjects = subjectsByBatch.get(row.batchId) ?? new Set<string>();
        subjects.add(normalizedSubjectKey(row.subject));
        subjectsByBatch.set(row.batchId, subjects);
      }
    }

    const batchIds = batches.map((batch) => batch.id).filter(Boolean);
    const rawCalendarRows = batchIds.length
      ? await prisma.$queryRaw<AcademicCalendarRow[]>`
          SELECT * FROM "AcademicCalendarItem"
          WHERE "batchId" IN (${Prisma.join(batchIds)})
          AND "plannedDate" >= ${todayStart}
          AND "plannedDate" < ${upcomingEnd}
          ORDER BY "plannedDate" ASC, "startTime" ASC
        `
      : [];

    const productionCalendarRows = rawCalendarRows.filter((row) => !isTemporaryActivationCalendarRow(row));
    const visibleCalendarRows = academicManager
      ? productionCalendarRows
      : productionCalendarRows.filter((row) => {
          if (!row.batchId) return false;
          if (row.teacherId === user.id || !row.teacherId) return true;
          return subjectsByBatch.get(row.batchId)?.has(normalizedSubjectKey(row.subject)) ?? false;
        });

    const todayRows = visibleCalendarRows.filter((row) => row.plannedDate >= todayStart && row.plannedDate < tomorrowStart);
    const upcomingRows = visibleCalendarRows.filter((row) => row.plannedDate >= tomorrowStart && row.plannedDate < upcomingEnd).slice(0, 12);

    const [assignmentData, examData] = await Promise.all([
      this.assignmentSummary(user, {}),
      this.examSummary(user, {}),
    ]);
    const reviewStatuses = new Set(["DRAFT", "REVIEW", "PENDING_REVIEW", "REVISION_REQUIRED"]);
    const examReviewStatuses = new Set(["DRAFT", "REVIEW", "PENDING_REVIEW", "REVISION_REQUIRED", "APPROVED"]);
    const pendingAssignments = (assignmentData.assignments ?? [])
      .filter((item: any) => reviewStatuses.has(String(item.status || "").toUpperCase()))
      .slice(0, 10);
    const pendingExams = (examData.exams ?? [])
      .filter((item: any) => examReviewStatuses.has(String(item.status || "").toUpperCase()))
      .slice(0, 10);

    const attendanceRows = batchIds.length
      ? await prisma.$queryRaw<any[]>`
          SELECT * FROM "TeacherAttendanceRecord"
          WHERE "batchId" IN (${Prisma.join(batchIds)})
          AND DATE("date") = DATE(${todayStart})
          ORDER BY "updatedAt" DESC
        `
      : [];
    const attendedBatchSubjectKeys = new Set(attendanceRows.map((row) => `${row.batchId}:${normalizedSubjectKey(row.subject)}`));
    const attendancePendingCount = todayRows.filter((row) => {
      if (todayTaskStatus(row) === "CANCELLED") return false;
      return !attendedBatchSubjectKeys.has(`${row.batchId}:${normalizedSubjectKey(row.subject)}`);
    }).length;

    const todayTasks = [
      ...todayRows.map((row) => calendarTodayTask(row, "TODAY_CALENDAR")),
      ...pendingAssignments.map((item: any) => academicReviewTask("ASSIGNMENT_REVIEW", item)),
      ...pendingExams.map((item: any) => academicReviewTask("EXAM_REVIEW", item)),
      ...(attendancePendingCount > 0 ? [{
        id: "attendance-pending",
        source: "ATTENDANCE_PENDING",
        sourceId: null,
        type: "ATTENDANCE",
        date: todayKey,
        time: null,
        endTime: null,
        title: `${attendancePendingCount} attendance ${attendancePendingCount === 1 ? "entry" : "entries"} pending`,
        detail: "Complete today's class attendance.",
        batchId: null,
        batchName: null,
        subject: null,
        topic: null,
        teacherId: academicManager ? null : user.id,
        teacherName: academicManager ? null : user.name || user.email || null,
        status: "TODO",
        done: false,
        actions: [{ key: "ATTENDANCE", label: "Attendance" }],
      }] : []),
    ];

    const nextUpcomingTask = upcomingRows[0] ? calendarTodayTask(upcomingRows[0], "UPCOMING_CALENDAR") : null;
    const rawTodayRows = productionCalendarRows.filter((row) => row.plannedDate >= todayStart && row.plannedDate < tomorrowStart);
    const emptyReason = todayTasks.length
      ? null
      : !batchIds.length
        ? academicManager ? "NO_ACTIVE_BATCHES" : "NO_ASSIGNED_BATCHES"
        : rawTodayRows.length && !todayRows.length
          ? "CALENDAR_ROWS_NOT_VISIBLE_TO_USER"
          : upcomingRows.length
            ? "NO_CLASSES_TODAY"
            : "NO_CALENDAR_IN_RANGE";

    return {
      date: todayKey,
      generatedAt: new Date().toISOString(),
      roleMode: academicManager ? "ACADEMIC_MANAGER" : "TEACHER",
      todayTasks,
      upcomingTasks: upcomingRows.map((row) => calendarTodayTask(row, "UPCOMING_CALENDAR")),
      nextUpcomingTask,
      diagnostics: {
        emptyReason,
        batchCount: batchIds.length,
        assignmentCount: assignmentRows.length,
        rawCalendarRows: rawCalendarRows.length,
        productionCalendarRows: productionCalendarRows.length,
        rawTodayCalendarRows: rawTodayRows.length,
        visibleTodayCalendarRows: todayRows.length,
        visibleUpcomingCalendarRows: upcomingRows.length,
        pendingAssignmentReviews: pendingAssignments.length,
        pendingExamReviews: pendingExams.length,
        attendancePendingCount,
        window: {
          today: todayKey,
          from: todayStart.toISOString(),
          to: upcomingEnd.toISOString(),
        },
      },
    };
  },

  async todayAction(user: Requester, input: TodayActionInput) {
    requireAcademic(user);
    const action = String(input.action || "").trim().toUpperCase();
    if (!action) {
      throw Object.assign(new Error("Today action is required"), { statusCode: 400 });
    }
    const calendarId = String(input.calendarId || input.taskId || "").replace(/^calendar-/, "").trim();
    const calendarRows = calendarId
      ? await prisma.$queryRaw<AcademicCalendarRow[]>`
          SELECT * FROM "AcademicCalendarItem" WHERE "id" = ${calendarId} LIMIT 1
        `
      : [];
    const calendar = calendarRows[0] ?? null;
    const batchId = String(input.batchId || calendar?.batchId || "").trim();
    const subject = String(input.subject || calendar?.subject || "").trim();
    if ((calendarId || batchId) && batchId) {
      await assertBatchSubjectAccess(user, batchId, subject || null);
    }

    if (["COMPLETE", "COMPLETE_CLASS", "COMPLETE_MEETING"].includes(action)) {
      if (!calendar) throw Object.assign(new Error("Calendar item is required to complete a Today task"), { statusCode: 400 });
      const logParts = [
        input.teacherLog?.trim() || `Completed ${calendar.subject || "class"}${calendar.topic ? `: ${calendar.topic}` : ""}.`,
        input.homeworkGiven?.trim() ? `Homework: ${input.homeworkGiven.trim()}` : null,
        input.supportNeeded?.trim() ? `Support needed: ${input.supportNeeded.trim()}` : null,
      ].filter(Boolean);
      const item = await this.updateAcademicCalendarItem(user, calendar.id, {
        completionStatus: input.completionStatus || "COMPLETED",
        status: "COMPLETED",
        teacherLog: logParts.join("\n"),
        nextAction: input.nextAction || "Class log saved",
      });
      return { ok: true, action, item };
    }

    if (["MARK_ATTENDANCE", "ATTENDANCE"].includes(action)) {
      if (!batchId || !subject) throw Object.assign(new Error("Batch and subject are required for attendance"), { statusCode: 400 });
      const batch = await db.batch.findUnique({ where: { id: batchId }, select: { id: true, name: true } });
      if (!batch) throw Object.assign(new Error("Batch not found"), { statusCode: 404 });
      const students = await db.batchStudent.findMany({
        where: { batchId, status: "ACTIVE" },
        include: { student: { select: { id: true, name: true } } },
        orderBy: { joinedAt: "asc" },
      });
      const records = Array.isArray(input.records) && input.records.length
        ? input.records
        : students.map((enrollment: any) => ({
            studentId: enrollment.studentId,
            studentName: enrollment.student?.name || "Student",
            status: "PRESENT",
            remarks: "",
          }));
      if (!records.length) throw Object.assign(new Error("No active students found for attendance"), { statusCode: 400 });
      const attendance = await this.saveAttendance(user, {
        batchId,
        batchName: batch.name,
        subject,
        date: input.date || calendarRowDateKey(calendar ?? { plannedDate: new Date() } as AcademicCalendarRow),
        records,
        status: "SAVED",
      });
      if (calendar) {
        await this.updateAcademicCalendarItem(user, calendar.id, {
          nextAction: "Attendance marked",
          teacherLog: calendar.teacherLog || `Attendance marked for ${records.length} students.`,
        });
      }
      return { ok: true, action, attendance };
    }

    if (["START_LIVE_CLASS", "LIVE_CLASS"].includes(action)) {
      if (!batchId || !subject) throw Object.assign(new Error("Batch and subject are required for live class"), { statusCode: 400 });
      const batch = await db.batch.findUnique({ where: { id: batchId }, select: { id: true, name: true, programSlug: true } });
      if (!batch) throw Object.assign(new Error("Batch not found"), { statusCode: 404 });
      const dateKey = input.date || (calendar ? calendarRowDateKey(calendar) : academyDateKey());
      const startTime = input.startTime || calendar?.startTime || "09:00";
      const scheduledAt = new Date(`${dateKey}T${startTime}:00.000+05:30`);
      const title = `${batch.name} - ${subject}${(input.topic || calendar?.topic) ? ` - ${input.topic || calendar?.topic}` : ""}`;
      const existing = await prisma.liveClass.findFirst({
        where: {
          batchId,
          subject,
          scheduledAt,
          status: { not: "CANCELLED" },
        },
        orderBy: { createdAt: "desc" },
      });
      const liveClass = existing ?? await prisma.liveClass.create({
        data: {
          title,
          description: input.teacherLog || calendar?.topic || "Scheduled from Today workspace",
          examType: batch.programSlug || calendar?.programSlug || "NIDUS",
          instructorName: user.name || user.email || "Teacher",
          scheduledAt,
          duration: 60,
          meetingLink: input.meetingLink || "https://zoom.us/start/videomeeting",
          thumbnail: "",
          isLive: true,
          batchId,
          programSlug: batch.programSlug || calendar?.programSlug || null,
          subject,
          topic: input.topic || calendar?.topic || null,
          teacherId: user.id,
          status: "LIVE",
        },
      });
      if (calendar) {
        await this.updateAcademicCalendarItem(user, calendar.id, {
          status: "LIVE",
          nextAction: "Live class started",
          teacherLog: calendar.teacherLog || `Live class started: ${liveClass.meetingLink}`,
        });
      }
      await auditAcademicAction(user, "TODAY_LIVE_CLASS_STARTED", "LiveClass", liveClass.id, { batchId, subject, calendarId: calendar?.id ?? null });
      return { ok: true, action, liveClass };
    }

    if (["RECORDING_UPLOADED", "UPLOAD_RECORDING"].includes(action)) {
      if (!batchId || !subject) throw Object.assign(new Error("Batch and subject are required for recording upload"), { statusCode: 400 });
      if (!input.recordingUrl) throw Object.assign(new Error("Recording URL is required"), { statusCode: 400 });
      const material = await this.publishStudyMaterial(user, {
        batchId,
        batchName: calendar?.batchName || undefined,
        subject,
        topic: input.topic || calendar?.topic || "General Lessons",
        title: input.teacherLog || calendar?.topic || `${subject} recorded class`,
        description: "Recorded class uploaded from Today workspace.",
        type: "VIDEO",
        url: input.recordingUrl,
        status: "PUBLISHED",
        reviewStatus: "APPROVED",
      });
      if (calendar) {
        await this.updateAcademicCalendarItem(user, calendar.id, {
          completionStatus: "COMPLETED",
          status: "COMPLETED",
          nextAction: "Recording uploaded",
          teacherLog: calendar.teacherLog || `Recording uploaded: ${input.recordingUrl}`,
        });
      }
      return { ok: true, action, material };
    }

    if (["CREATE_ASSIGNMENT", "ASSIGNMENT"].includes(action)) {
      if (!batchId || !subject) throw Object.assign(new Error("Batch and subject are required for assignment"), { statusCode: 400 });
      const assignment = await this.createAssignment(user, {
        batchId,
        batchName: calendar?.batchName || undefined,
        subject,
        title: input.teacherLog || `${subject} Homework - ${input.topic || calendar?.topic || academyDateKey()}`,
        topic: input.topic || calendar?.topic || subject,
        instructions: input.nextAction || "Complete the homework based on today's class.",
        dueDate: addUtcDays(new Date(), 2).toISOString(),
        status: "PENDING_REVIEW",
      });
      if (calendar) await this.updateAcademicCalendarItem(user, calendar.id, { nextAction: "Assignment created for review" });
      return { ok: true, action, assignment };
    }

    if (["CREATE_EXAM", "EXAM"].includes(action)) {
      if (!batchId || !subject) throw Object.assign(new Error("Batch and subject are required for exam"), { statusCode: 400 });
      const exam = await this.publishExam(user, {
        batchId,
        batchName: calendar?.batchName || undefined,
        subject,
        course: calendar?.programSlug || undefined,
        title: input.teacherLog || `${subject} Test - ${input.topic || calendar?.topic || academyDateKey()}`,
        topic: input.topic || calendar?.topic || subject,
        questionCount: 0,
        durationMinutes: 60,
        difficulty: "MEDIUM",
        instructions: input.nextAction || "Teacher-created exam from Today workspace.",
        publishDate: input.date || academyDateKey(),
        publishTime: input.startTime || "09:00",
        status: "PENDING_REVIEW",
      });
      if (calendar) await this.updateAcademicCalendarItem(user, calendar.id, { nextAction: "Exam created for review" });
      return { ok: true, action, exam };
    }

    throw Object.assign(new Error(`Unsupported Today action: ${action}`), { statusCode: 400 });
  },

  async myAcademicPlan(user: Requester) {
    const enrollments = await db.batchStudent.findMany({
      where: { studentId: user.id, status: "ACTIVE" },
      orderBy: { joinedAt: "desc" },
    });

    const enrollmentBatchIds = enrollments.map((enrollment: any) => enrollment.batchId);
    const batches = enrollmentBatchIds.length ? await batchWithCounts() : [];
    const assignedBatches = Array.isArray(batches) ? batches.filter((batch: any) => enrollmentBatchIds.includes(batch.id) && batch.status === "ACTIVE") : [];
    const batchIds = assignedBatches.map((batch: any) => batch.id).filter(Boolean);
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
    const [feeRows, paymentRows, receiptRows] = await Promise.all([
      prisma.feeInstallment.findMany({
        where: { studentId: user.id },
        orderBy: { dueDate: "asc" },
        take: 12,
      }),
      prisma.payment.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 8,
      }),
      prisma.financeDocument.findMany({
        where: { ownerId: user.id, documentType: "PAYMENT_RECEIPT" },
        orderBy: { createdAt: "desc" },
        take: 8,
      }),
    ]);
    const dueFees = feeRows.filter((fee) => fee.paidStatus !== "PAID");
    const successfulPayments = paymentRows.filter((payment) => payment.paymentStatus === "SUCCESS");
    const totalPaid = successfulPayments.reduce((sum, payment) => sum + payment.amount, 0);
    const totalDue = dueFees.reduce((sum, fee) => sum + (fee.dueAmount || Math.max(fee.amount - fee.paidAmount, 0)), 0);

    return {
      enrollments: enrollments.filter((enrollment: any) => batchIds.includes(enrollment.batchId)),
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
      materials: withSignedMaterialUrls(materialRows),
      liveClasses: normalizeRows(liveClassRows),
      finance: {
        status: totalDue > 0 ? "PENDING" : successfulPayments.length ? "PAID" : feeRows.length ? "PLAN_CREATED" : "NO_FEE_PLAN",
        totalPaid,
        totalDue,
        latestReceiptNumber: successfulPayments[0]?.receiptNumber ?? receiptRows[0]?.documentNumber ?? null,
        payments: successfulPayments.map((payment) => ({
          id: payment.id,
          amount: payment.amount,
          currency: payment.currency,
          method: payment.paymentMethod ?? payment.paymentMode,
          receiptNumber: payment.receiptNumber,
          receiptUrl: payment.receiptUrl ?? payment.receiptUploadUrl,
          paidAt: payment.verifiedAt ?? payment.createdAt,
          status: payment.paymentStatus,
        })),
        receipts: receiptRows.map((receipt) => ({
          id: receipt.id,
          documentNumber: receipt.documentNumber,
          fileUrl: receipt.fileUrl,
          status: receipt.status,
          createdAt: receipt.createdAt,
        })),
        installments: feeRows.map((fee) => ({
          id: fee.id,
          title: fee.title,
          amount: fee.amount,
          paidAmount: fee.paidAmount,
          dueAmount: fee.dueAmount,
          dueDate: fee.dueDate,
          paidStatus: fee.paidStatus,
        })),
      },
    };
  },

  async teachers() {
    const teachers = await prisma.user.findMany({
      where: { role: { in: [Role.TEACHER, Role.ACADEMIC_HEAD, Role.PHYSICAL_TRAINER] }, isDisabled: false },
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
    return teachers.filter((teacher) => !isDemoAcademyUser(teacher));
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
        isDisabled: true,
        loginFailureCount: true,
        lockedUntil: true,
        lastLoginAt: true,
        roleOnboardingStatus: true,
        batchEnrollments: {
          where: { status: "ACTIVE" },
          select: {
            id: true,
            status: true,
            batch: {
              select: {
                id: true,
                name: true,
                programSlug: true,
                batchType: true,
                status: true,
              },
            },
          },
        },
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return users.filter((employee) => {
      const metadata = (employee.roleMetadata ?? {}) as Record<string, unknown>;
      return !isDemoAcademyUser(employee) && (includeArchived || metadata.status !== "ARCHIVED");
    });
  },

  async createEmployee(user: Requester, input: EmployeeInput) {
    requireEmployeeCreationAccess(user, input);
    if (!input.name || !input.email || !input.role) {
      throw Object.assign(new Error("Name, email and role are required"), { statusCode: 400 });
    }

    if (![Role.ADMIN, Role.DIRECTOR, Role.TEACHER, Role.TELECALLER, Role.BUSINESS_DEVELOPMENT_EXECUTIVE, Role.MARKETING_COORDINATOR].includes(input.role as any)) {
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
      defaultPassword: true,
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
        isDisabled: false,
        disabledAt: null,
        loginFailureCount: 0,
        lockedUntil: null,
        roleMetadata: toJsonObject({
          ...existingMetadata,
          defaultPassword: true,
          passwordResetBy: user.id,
          passwordResetAt: new Date().toISOString(),
        }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        mobile: true,
        role: true,
        isDisabled: true,
        loginFailureCount: true,
        lockedUntil: true,
        lastLoginAt: true,
        roleOnboardingStatus: true,
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

  async unlockEmployeeAccount(user: Requester, employeeId: string) {
    requireManagement(user);
    const employee = await prisma.user.findUnique({ where: { id: employeeId } });
    if (!employee) {
      throw Object.assign(new Error("Employee not found"), { statusCode: 404 });
    }
    const existingMetadata = (employee.roleMetadata ?? {}) as Record<string, unknown>;
    return prisma.user.update({
      where: { id: employeeId },
      data: {
        isDisabled: false,
        disabledAt: null,
        loginFailureCount: 0,
        lockedUntil: null,
        roleMetadata: toJsonObject({
          ...existingMetadata,
          accountUnlockedBy: user.id,
          accountUnlockedAt: new Date().toISOString(),
        }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        mobile: true,
        role: true,
        isDisabled: true,
        loginFailureCount: true,
        lockedUntil: true,
        lastLoginAt: true,
        roleOnboardingStatus: true,
        roleMetadata: true,
      },
    });
  },

  async academicCalendar(user: Requester, query: Record<string, unknown>) {
    requireAcademic(user);
    const batchId = typeof query.batchId === "string" ? query.batchId : undefined;
    if (batchId) await assertBatchAccess(user, batchId);
    const teacherId = user.role === Role.TEACHER && !isAcademicHeadWorkspace(user)
      ? user.id
      : typeof query.teacherId === "string" && query.teacherId.trim()
        ? query.teacherId.trim()
        : undefined;
    const from = typeof query.from === "string" && !Number.isNaN(Date.parse(query.from)) ? new Date(query.from) : null;
    const to = typeof query.to === "string" && !Number.isNaN(Date.parse(query.to)) ? new Date(query.to) : null;

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

    return rows
      .filter((row) => !from || row.plannedDate >= from)
      .filter((row) => !to || row.plannedDate < to)
      .filter((row) => !isTemporaryActivationCalendarRow(row))
      .map(sanitizeCalendarRow);
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

  async generateAcademicCalendarPlan(user: Requester, input: AcademicCalendarPlannerInput) {
    requireAcademicManagement(user);
    if (!input.batchId || !input.startDate || !input.endDate) {
      throw Object.assign(new Error("Batch, start date and end date are required"), { statusCode: 400 });
    }
    if (!Array.isArray(input.sessions) || !input.sessions.length) {
      throw Object.assign(new Error("At least one weekly session is required"), { statusCode: 400 });
    }

    const startDate = parsePlannerDate(input.startDate, "Start date");
    const endDate = parsePlannerDate(input.endDate, "End date");
    if (endDate < startDate) {
      throw Object.assign(new Error("End date must be after start date"), { statusCode: 400 });
    }

    const batch = await db.batch.findUnique({
      where: { id: input.batchId },
      include: { course: true },
    });
    if (!batch) {
      throw Object.assign(new Error("Batch not found"), { statusCode: 404 });
    }
    await assertBatchAccess(user, batch.id);

    const normalizedSessions: NormalizedPlannerSession[] = input.sessions
      .map(normalizePlannerSession)
      .filter((session): session is NormalizedPlannerSession => Boolean(session));

    if (!normalizedSessions.length) {
      throw Object.assign(new Error("No valid sessions found. Add day, subject, topic and start time."), { statusCode: 400 });
    }

    const teacherIds = Array.from(new Set(normalizedSessions.map((session) => session.teacherId).filter(Boolean))) as string[];
    const teachers = teacherIds.length
      ? await prisma.user.findMany({
          where: { id: { in: teacherIds } },
          select: { id: true, name: true, email: true, mobile: true, roleMetadata: true },
        })
      : [];
    const teacherMap = new Map(teachers.filter((teacher) => !isDemoAcademyUser(teacher)).map((teacher) => [teacher.id, teacher]));
    const created = [];
    const skipped = [];
    const conflicts = [];

    for (const session of normalizedSessions) {
      if (session.teacherId && !teacherMap.has(session.teacherId)) {
        conflicts.push({
          reason: "Teacher not found",
          subject: session.subject,
          teacherId: session.teacherId,
        });
        continue;
      }

      if (session.teacherId) {
        await this.assignTeacher(user, batch.id, {
          teacherId: session.teacherId,
          subject: session.subject,
          role: session.classType === "Physical Training" ? "Physical Trainer" : "Subject Teacher",
        });
      }

      for (const plannedDate of datesForDayOfWeek(startDate, endDate, session.dayOfWeek)) {
        const existingRows = await prisma.$queryRaw<AcademicCalendarRow[]>`
          SELECT * FROM "AcademicCalendarItem"
          WHERE "batchId" = ${batch.id}
          AND "plannedDate" = ${plannedDate}
          AND "startTime" = ${session.startTime}
          AND LOWER("subject") = LOWER(${session.subject})
          LIMIT 1
        `;
        if (existingRows[0]) {
          skipped.push({
            date: plannedDate.toISOString(),
            subject: session.subject,
            startTime: session.startTime,
            reason: "Already exists for this batch, subject and time",
          });
          continue;
        }

        if (session.teacherId) {
          const teacherConflict = await prisma.$queryRaw<AcademicCalendarRow[]>`
            SELECT * FROM "AcademicCalendarItem"
            WHERE "teacherId" = ${session.teacherId}
            AND "plannedDate" = ${plannedDate}
            AND "startTime" = ${session.startTime}
            LIMIT 1
          `;
          if (teacherConflict[0]) {
            conflicts.push({
              date: plannedDate.toISOString(),
              subject: session.subject,
              startTime: session.startTime,
              teacherId: session.teacherId,
              reason: "Teacher already has a class at this time",
            });
            continue;
          }
        }

        const id = randomUUID();
        const now = new Date();
        const teacher = session.teacherId ? teacherMap.get(session.teacherId) : null;
        await prisma.$executeRaw`
          INSERT INTO "AcademicCalendarItem"
          ("id", "batchId", "batchName", "programSlug", "subject", "topic", "classType", "plannedDate", "startTime", "endTime", "teacherId", "teacherName", "status", "completionStatus", "teacherLog", "nextAction", "createdAt", "updatedAt")
          VALUES
          (${id}, ${batch.id}, ${batch.name}, ${batch.programSlug || batch.course?.slug || null}, ${session.subject}, ${session.topic}, ${session.classType || "LECTURE"}, ${plannedDate}, ${session.startTime}, ${session.endTime || null}, ${session.teacherId || null}, ${teacher?.name || teacher?.email || null}, 'SCHEDULED', 'PENDING', null, null, ${now}, ${now})
        `;
        created.push({
          id,
          date: plannedDate.toISOString(),
          batchId: batch.id,
          batchName: batch.name,
          subject: session.subject,
          topic: session.topic,
          startTime: session.startTime,
          endTime: session.endTime || null,
          teacherId: session.teacherId || null,
          teacherName: teacher?.name || teacher?.email || null,
        });
      }
    }

    const result = {
      batch: { id: batch.id, name: batch.name },
      createdCount: created.length,
      skippedCount: skipped.length,
      conflictCount: conflicts.length,
      created,
      skipped,
      conflicts,
    };
    await auditAcademicAction(user, "ACADEMIC_CALENDAR_PLAN_GENERATED", "AcademicCalendarItem", batch.id, result);
    return result;
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

  async updateAttendance(user: Requester, attendanceId: string, input: AttendanceInput) {
    requireAcademic(user);
    const rows = await prisma.$queryRaw<any[]>`
      SELECT * FROM "TeacherAttendanceRecord" WHERE "id" = ${attendanceId} LIMIT 1
    `;
    const current = rows[0];
    if (!current) {
      throw Object.assign(new Error("Attendance record not found"), { statusCode: 404 });
    }
    await assertBatchSubjectAccess(user, current.batchId, input.subject ?? current.subject);
    if (user.role === Role.TEACHER && current.teacherId !== user.id && !isAcademicManager(user)) {
      throw Object.assign(new Error("Only the marking teacher can edit this attendance record"), { statusCode: 403 });
    }
    if (!Array.isArray(input.records) || !input.records.length) {
      throw Object.assign(new Error("Attendance records are required"), { statusCode: 400 });
    }
    await prisma.$executeRaw`
      UPDATE "TeacherAttendanceRecord"
      SET "subject" = ${input.subject ?? current.subject},
          "date" = ${input.date ? new Date(input.date) : current.date},
          "records" = ${JSON.stringify(input.records)}::jsonb,
          "status" = ${input.status ?? current.status},
          "updatedAt" = ${new Date()}
      WHERE "id" = ${attendanceId}
    `;
    const updated = await prisma.$queryRaw<any[]>`
      SELECT * FROM "TeacherAttendanceRecord" WHERE "id" = ${attendanceId} LIMIT 1
    `;
    const attendance = normalizeRows(updated)[0];
    await auditAcademicAction(user, "ATTENDANCE_UPDATED", "TeacherAttendanceRecord", attendanceId, attendance);
    return { ok: true, attendance };
  },

  async markStudentAttendance(user: Requester, input: StudentAttendanceInput) {
    const batchId = String(input.batchId || "").trim();
    const subject = String(input.subject || "").trim();
    const studentId = String(input.studentId || "").trim();
    const attendanceStatus = String(input.status || "").trim().toUpperCase();
    if (!batchId || !subject || !studentId) {
      throw Object.assign(new Error("Batch, subject and student are required"), { statusCode: 400 });
    }
    if (!["PRESENT", "ABSENT", "HALF_DAY", "LEAVE"].includes(attendanceStatus)) {
      throw Object.assign(new Error("Attendance status is invalid"), { statusCode: 400 });
    }
    await assertBatchSubjectAccess(user, batchId, subject);

    const enrollment = await db.batchStudent.findFirst({
      where: { batchId, studentId, status: "ACTIVE" },
    });
    if (!enrollment) {
      throw Object.assign(new Error("Student is not enrolled in this assigned batch"), { statusCode: 403 });
    }
    const [batch, student] = await Promise.all([
      db.batch.findUnique({ where: { id: batchId }, select: { id: true, name: true } }),
      prisma.user.findUnique({ where: { id: studentId }, select: { id: true, name: true } }),
    ]);
    if (!batch || !student) {
      throw Object.assign(new Error("Batch or student not found"), { statusCode: 404 });
    }

    const attendanceDate = input.date && !Number.isNaN(Date.parse(input.date)) ? new Date(input.date) : new Date();
    attendanceDate.setHours(0, 0, 0, 0);
    const existingRows = await prisma.$queryRaw<any[]>`
      SELECT * FROM "TeacherAttendanceRecord"
      WHERE "batchId" = ${batchId}
      AND "teacherId" = ${user.id}
      AND LOWER(COALESCE("subject", '')) = LOWER(${subject})
      AND DATE("date") = DATE(${attendanceDate})
      ORDER BY "updatedAt" DESC
      LIMIT 1
    `;
    const existing = existingRows[0];
    const records = Array.isArray(existing?.records) ? [...existing.records] : [];
    const markedAt = new Date().toISOString();
    const nextRecord = {
      studentId,
      studentName: student.name,
      status: attendanceStatus,
      remarks: String(input.remarks || "").trim() || null,
      markedAt,
    };
    const recordIndex = records.findIndex((record: any) => record?.studentId === studentId);
    if (recordIndex >= 0) records[recordIndex] = { ...records[recordIndex], ...nextRecord };
    else records.push(nextRecord);

    const now = new Date();
    const attendanceId = existing?.id || randomUUID();
    if (existing) {
      await prisma.$executeRaw`
        UPDATE "TeacherAttendanceRecord"
        SET "records" = ${JSON.stringify(records)}::jsonb,
            "status" = 'SAVED',
            "updatedAt" = ${now}
        WHERE "id" = ${attendanceId}
      `;
    } else {
      await prisma.$executeRaw`
        INSERT INTO "TeacherAttendanceRecord"
        ("id", "batchId", "batchName", "subject", "teacherId", "teacherName", "date", "records", "status", "createdAt", "updatedAt")
        VALUES
        (${attendanceId}, ${batchId}, ${batch.name}, ${subject}, ${user.id}, ${user.name || user.email || null}, ${attendanceDate}, ${JSON.stringify(records)}::jsonb, 'SAVED', ${now}, ${now})
      `;
    }

    const savedRows = await prisma.$queryRaw<any[]>`
      SELECT * FROM "TeacherAttendanceRecord" WHERE "id" = ${attendanceId} LIMIT 1
    `;
    const attendance = normalizeRows(savedRows)[0];
    await auditAcademicAction(user, "STUDENT_ATTENDANCE_MARKED", "TeacherAttendanceRecord", attendanceId, {
      batchId,
      subject,
      studentId,
      attendanceStatus,
      markedAt,
    });
    return { ok: true, attendance, student: nextRecord };
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

  async createLeaveRequest(user: Requester, input: LeaveRequestInput) {
    if (!input.fromDate || !input.toDate || !input.reason?.trim()) {
      throw Object.assign(new Error("From date, to date and reason are required"), { statusCode: 400 });
    }
    const fromDate = new Date(input.fromDate);
    const toDate = new Date(input.toDate);
    if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime()) || toDate < fromDate) {
      throw Object.assign(new Error("Enter a valid leave date range"), { statusCode: 400 });
    }
    const isStudent = user.role === Role.STUDENT;
    const enrollment = isStudent
      ? await prisma.batchStudent.findFirst({
          where: {
            studentId: user.id,
            status: "ACTIVE",
            ...(input.batchId ? { batchId: input.batchId } : {}),
          },
          include: { batch: true },
          orderBy: { joinedAt: "desc" },
        })
      : null;
    if (isStudent && !enrollment) {
      throw Object.assign(new Error("An active batch is required before applying for leave"), { statusCode: 400 });
    }
    const leave = await db.academicLeaveRequest.create({
      data: {
        studentId: user.id,
        studentName: user.name || user.email || (isStudent ? "Student" : "Faculty"),
        batchId: enrollment?.batchId || input.batchId || null,
        batchName: enrollment?.batch?.name || null,
        fromDate,
        toDate,
        reason: input.reason.trim(),
        attachmentName: input.attachmentName || null,
        attachmentUrl: input.attachmentUrl || null,
        status: "PENDING",
      },
    });
    await auditAcademicAction(user, "LEAVE_REQUESTED", "AcademicLeaveRequest", leave.id, leave);
    return { ok: true, leave: normalizeRows([leave])[0] };
  },

  async leaveRequests(user: Requester, query: Record<string, unknown>) {
    const status = typeof query.status === "string" ? query.status.toUpperCase() : undefined;
    const batchId = typeof query.batchId === "string" ? query.batchId : undefined;
    if (user.role === Role.STUDENT) {
      const leaves = await db.academicLeaveRequest.findMany({
        where: { studentId: user.id, ...(status ? { status } : {}) },
        orderBy: { createdAt: "desc" },
      });
      return { leaves: normalizeRows(leaves) };
    }
    requireAcademic(user);
    if (!isAcademicManager(user)) {
      const leaves = await db.academicLeaveRequest.findMany({
        where: { studentId: user.id, ...(status ? { status } : {}) },
        orderBy: { createdAt: "desc" },
      });
      return { leaves: normalizeRows(leaves) };
    }
    if (batchId) await assertBatchAccess(user, batchId);
    const leaves = await db.academicLeaveRequest.findMany({
      where: {
        ...(batchId ? { batchId } : {}),
        ...(status ? { status } : {}),
      },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    });
    return { leaves: normalizeRows(leaves) };
  },

  async reviewLeaveRequest(user: Requester, leaveId: string, input: { status?: string; reviewNote?: string }) {
    requireAcademic(user);
    if (!isAcademicManager(user)) {
      throw Object.assign(new Error("Academic Head access required"), { statusCode: 403 });
    }
    const status = String(input.status || "").toUpperCase();
    if (!["APPROVED", "REJECTED"].includes(status)) {
      throw Object.assign(new Error("Leave status must be APPROVED or REJECTED"), { statusCode: 400 });
    }
    const existing = await db.academicLeaveRequest.findUnique({ where: { id: leaveId } });
    if (!existing) {
      throw Object.assign(new Error("Leave request not found"), { statusCode: 404 });
    }
    if (existing.batchId) await assertBatchAccess(user, existing.batchId);
    const leave = await db.academicLeaveRequest.update({
      where: { id: leaveId },
      data: {
        status,
        reviewedById: user.id,
        reviewedByName: user.name || user.email || "Academic Head",
        reviewedAt: new Date(),
        reviewNote: input.reviewNote || null,
      },
    });

    if (status === "APPROVED" && existing.batchId) {
      const attendanceRows = await prisma.$queryRaw<any[]>`
        SELECT * FROM "TeacherAttendanceRecord"
        WHERE "batchId" = ${existing.batchId}
          AND "date" >= ${existing.fromDate}
          AND "date" <= ${existing.toDate}
      `;
      for (const row of attendanceRows) {
        const records = attendanceRecordList(row);
        const nextRecords = records.map((record) =>
          record.studentId === existing.studentId
            ? { ...record, status: "LEAVE", remarks: record.remarks || existing.reason }
            : record,
        );
        await prisma.$executeRaw`
          UPDATE "TeacherAttendanceRecord"
          SET "records" = ${JSON.stringify(nextRecords)}::jsonb,
              "updatedAt" = ${new Date()}
          WHERE "id" = ${row.id}
        `;
      }
    }

    await auditAcademicAction(user, `LEAVE_${status}`, "AcademicLeaveRequest", leaveId, leave);
    return { ok: true, leave: normalizeRows([leave])[0] };
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

  async updateAssignment(user: Requester, assignmentId: string, input: AssignmentInput) {
    requireAcademic(user);
    const rows = await prisma.$queryRaw<any[]>`
      SELECT * FROM "TeacherAssignmentRecord" WHERE "id" = ${assignmentId} LIMIT 1
    `;
    const current = rows[0];
    if (!current) {
      throw Object.assign(new Error("Assignment not found"), { statusCode: 404 });
    }
    await assertBatchAccess(user, current.batchId);
    await assertBatchSubjectAccess(user, current.batchId, input.subject ?? current.subject);
    if (user.role === Role.TEACHER && current.teacherId !== user.id && !isAcademicManager(user)) {
      throw Object.assign(new Error("Only the publishing teacher can edit this assignment"), { statusCode: 403 });
    }

    await prisma.$executeRaw`
      UPDATE "TeacherAssignmentRecord"
      SET "subject" = ${input.subject ?? current.subject},
          "title" = ${input.title ?? current.title},
          "topic" = ${input.topic ?? current.topic},
          "instructions" = ${input.instructions ?? current.instructions},
          "dueDate" = ${input.dueDate ? new Date(input.dueDate) : current.dueDate},
          "attachmentName" = ${input.attachmentName ?? current.attachmentName},
          "link" = ${input.link ?? current.link},
          "status" = ${input.status ?? current.status},
          "updatedAt" = ${new Date()}
      WHERE "id" = ${assignmentId}
    `;
    const updated = await prisma.$queryRaw<any[]>`
      SELECT * FROM "TeacherAssignmentRecord" WHERE "id" = ${assignmentId} LIMIT 1
    `;
    const assignment = normalizeRows(updated)[0];
    await auditAcademicAction(user, "ASSIGNMENT_UPDATED", "TeacherAssignmentRecord", assignmentId, assignment);
    return { ok: true, assignment };
  },

  async archiveAssignment(user: Requester, assignmentId: string) {
    return this.updateAssignment(user, assignmentId, { status: "ARCHIVED" });
  },

  async publishAssignmentChanges(user: Requester, assignmentId: string) {
    return this.updateAssignment(user, assignmentId, { status: "PUBLISHED" });
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
    const rows = (await filterRowsToAssignedSubjects(user, batchId, queriedRows))
      .filter((row) => String(row.status || "").toUpperCase() !== "ARCHIVED")
      .filter((row) => !isTemporaryActivationAcademicRecord(row));
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
    const materialTeacher = await resolveMaterialTeacher(user, input);
    await prisma.$executeRaw`
      INSERT INTO "TeacherStudyMaterialRecord"
      ("id", "batchId", "batchName", "course", "folder", "subject", "topic", "teacherId", "teacherName", "title", "description", "type", "url", "fileName", "cloudinaryPublicId", "thumbnailUrl", "thumbnailPublicId", "fileSize", "durationSeconds", "lessonName", "status", "reviewStatus", "createdAt", "updatedAt")
      VALUES
      (${id}, ${input.batchId}, ${input.batchName || null}, ${input.course || null}, ${input.folder || null}, ${input.subject || null}, ${input.topic || null}, ${materialTeacher.id}, ${materialTeacher.name}, ${input.title}, ${input.description || null}, ${input.type || "PDF"}, ${input.url || null}, ${input.fileName || null}, ${input.cloudinaryPublicId || null}, ${input.thumbnailUrl || null}, ${input.thumbnailPublicId || null}, ${typeof input.fileSize === "number" ? input.fileSize : null}, ${typeof input.durationSeconds === "number" ? input.durationSeconds : null}, ${input.lessonName || input.title || null}, ${input.status || "PUBLISHED"}, ${input.reviewStatus || "PENDING_REVIEW"}, ${now}, ${now})
    `;
    const rows = await prisma.$queryRaw<any[]>`
      SELECT * FROM "TeacherStudyMaterialRecord" WHERE "id" = ${id} LIMIT 1
    `;
    const material = normalizeRows(rows)[0];
    await auditAcademicAction(user, "MATERIAL_PUBLISHED", "TeacherStudyMaterialRecord", id, {
      ...material,
      uploadedByUserId: user.id,
      uploadedByName: user.name || user.email || null,
      uploadedOnBehalfOf: materialTeacher.name,
    });
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
    if (!batchId && user.role === Role.TEACHER && !isAcademicManager(user) && !isVideoEditor(user)) where.teacherId = user.id;
    if (batchId && user.role === Role.TEACHER && !isAcademicManager(user) && !isVideoEditor(user)) {
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
    return { materials: withSignedMaterialUrls(rows), pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) } };
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
    // Browser clients send an ISO instant. The explicit IST fallback keeps older
    // clients correct even though Railway runs in UTC.
    const publishAt = input.publishAt
      ? new Date(input.publishAt)
      : input.publishDate
        ? new Date(`${input.publishDate}T${input.publishTime || "00:00"}:00+05:30`)
        : null;
    if (publishAt && Number.isNaN(publishAt.getTime())) {
      throw Object.assign(new Error("Exam date or time is invalid"), { statusCode: 400 });
    }
    const testPayload: TestPayload = {
      title: input.title,
      description: input.instructions || `Teacher-created exam on ${input.topic}`,
      examType: generatedDraft.examType || "NIDUS",
      category: generatedDraft.category || "Teacher Generated",
      subject: input.subject || generatedDraft.subject,
      topic: input.topic || generatedDraft.topic,
      batchId: input.batchId,
      teacherId: user.id,
      publishAt: publishAt?.toISOString(),
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

  async updateExam(user: Requester, examId: string, input: ExamInput) {
    requireAcademic(user);
    const rows = await prisma.$queryRaw<any[]>`
      SELECT * FROM "TeacherExamRecord" WHERE "id" = ${examId} LIMIT 1
    `;
    const current = rows[0];
    if (!current) {
      throw Object.assign(new Error("Exam not found"), { statusCode: 404 });
    }
    await assertBatchAccess(user, current.batchId);
    await assertBatchSubjectAccess(user, current.batchId, input.subject ?? current.subject);
    if (user.role === Role.TEACHER && current.teacherId !== user.id && !isAcademicManager(user)) {
      throw Object.assign(new Error("Only the publishing teacher can edit this exam"), { statusCode: 403 });
    }

    const replacementDraft = asDraftPayload(input);
    const replacementQuestions = replacementDraft?.questions;
    if (replacementQuestions?.length) {
      validatePublishedQuestions(replacementQuestions);
      if (!current.testId) throw Object.assign(new Error("This legacy exam has no editable question paper."), { statusCode: 409 });
      const attemptCount = await prisma.testAttempt.count({ where: { testId: current.testId } });
      if (attemptCount > 0) {
        throw Object.assign(new Error("Question paper changes are locked because a student has already started this exam."), { statusCode: 409 });
      }
      await prisma.$transaction([
        prisma.question.deleteMany({ where: { testId: current.testId } }),
        prisma.question.createMany({ data: replacementQuestions.map((question) => ({ ...question, testId: current.testId })) }),
        prisma.test.update({
          where: { id: current.testId },
          data: {
            totalMarks: replacementQuestions.reduce((sum, question) => sum + Number(question.marks || 0), 0),
            title: input.title ?? current.title,
            subject: input.subject ?? current.subject,
            topic: input.topic ?? current.topic,
            duration: typeof input.durationMinutes === "number" ? input.durationMinutes : current.durationMinutes,
          },
        }),
      ]);
    }

    await prisma.$executeRaw`
      UPDATE "TeacherExamRecord"
      SET "subject" = ${input.subject ?? current.subject},
          "title" = ${input.title ?? current.title},
          "topic" = ${input.topic ?? current.topic},
          "questionCount" = ${typeof input.questionCount === "number" ? input.questionCount : current.questionCount},
          "durationMinutes" = ${typeof input.durationMinutes === "number" ? input.durationMinutes : typeof input.duration === "number" ? input.duration : current.durationMinutes},
          "difficulty" = ${input.difficulty ?? current.difficulty},
          "instructions" = ${input.instructions ?? current.instructions},
          "draft" = ${replacementDraft ? JSON.stringify(replacementDraft) : JSON.stringify(current.draft)}::jsonb,
          "status" = ${input.status ?? current.status},
          "updatedAt" = ${new Date()}
      WHERE "id" = ${examId}
    `;
    if (current.testId) {
      await prisma.test.update({
        where: { id: current.testId },
        data: {
          title: input.title ?? current.title,
          subject: input.subject ?? current.subject,
          topic: input.topic ?? current.topic,
          duration: typeof input.durationMinutes === "number" ? input.durationMinutes : typeof input.duration === "number" ? input.duration : current.durationMinutes,
          status: input.status === "ARCHIVED" ? "ARCHIVED" : input.status === "CANCELLED" ? "CANCELLED" : undefined,
        },
      }).catch(() => undefined);
    }
    const updated = await prisma.$queryRaw<any[]>`
      SELECT * FROM "TeacherExamRecord" WHERE "id" = ${examId} LIMIT 1
    `;
    const exam = (await attachExamStats(updated))[0];
    await auditAcademicAction(user, "EXAM_UPDATED", "TeacherExamRecord", examId, exam);
    return { ok: true, exam };
  },

  async archiveExam(user: Requester, examId: string) {
    return this.updateExam(user, examId, { status: "ARCHIVED" });
  },

  async publishExamChanges(user: Requester, examId: string) {
    return this.updateExam(user, examId, { status: "PUBLISHED" });
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
    const rows = (await filterRowsToAssignedSubjects(user, batchId, queriedRows))
      .filter((row) => String(row.status || "").toUpperCase() !== "ARCHIVED")
      .filter((row) => !isTemporaryActivationAcademicRecord(row));
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

  async examResults(user: Requester, examId: string) {
    requireAcademic(user);
    const rows = await prisma.$queryRaw<any[]>`
      SELECT * FROM "TeacherExamRecord" WHERE "id" = ${examId} LIMIT 1
    `;
    const exam = rows[0];
    if (!exam) throw Object.assign(new Error("Exam not found"), { statusCode: 404 });
    await assertBatchSubjectAccess(user, exam.batchId, exam.subject);
    if (user.role === Role.TEACHER && exam.teacherId !== user.id && !isAcademicManager(user)) {
      throw Object.assign(new Error("Only the creating teacher can review these results"), { statusCode: 403 });
    }
    if (!exam.testId) return { exam: normalizeRows(rows)[0], results: [], released: exam.status === "RESULTS_RELEASED" };

    const test = await prisma.test.findUnique({ where: { id: exam.testId }, select: { totalMarks: true } });
    const attempts = await prisma.testAttempt.findMany({
      where: { testId: exam.testId, status: "SUBMITTED", submittedAt: { not: null } },
      orderBy: [{ score: "desc" }, { totalCorrect: "desc" }, { timeTaken: "asc" }, { submittedAt: "asc" }],
      include: { user: { select: { id: true, name: true, email: true } } },
    });
    return {
      exam: normalizeRows(rows)[0],
      released: exam.status === "RESULTS_RELEASED",
      results: attempts.map((attempt, index) => ({
        rank: index + 1,
        attemptId: attempt.id,
        studentId: attempt.userId,
        studentName: attempt.user.name,
        studentEmail: attempt.user.email,
        score: attempt.score,
        totalMarks: test?.totalMarks ?? 0,
        percentage: test?.totalMarks ? Math.round((attempt.score / test.totalMarks) * 100) : 0,
        correct: attempt.totalCorrect,
        wrong: attempt.totalWrong,
        timeTaken: attempt.timeTaken,
        submittedAt: attempt.submittedAt?.toISOString() ?? null,
      })),
    };
  },

  async releaseExamResults(user: Requester, examId: string) {
    const result = await this.examResults(user, examId);
    const releasedAt = new Date();
    await prisma.$executeRaw`
      UPDATE "TeacherExamRecord"
      SET "status" = 'RESULTS_RELEASED',
          "analytics" = ${JSON.stringify({ releasedAt: releasedAt.toISOString(), releasedBy: user.id, rankedStudents: result.results.length })}::jsonb,
          "updatedAt" = ${releasedAt}
      WHERE "id" = ${examId}
    `;
    await auditAcademicAction(user, "EXAM_RESULTS_RELEASED", "TeacherExamRecord", examId, {
      releasedAt: releasedAt.toISOString(),
      rankedStudents: result.results.length,
    });
    return { ...result, released: true, releasedAt: releasedAt.toISOString() };
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

    const cards = teacherIds.filter((teacherId) => teacherMap.has(teacherId)).map((teacherId) => {
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
    for (const item of rows.filter((row) => !isTemporaryActivationCalendarRow(row))) {
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

  async expenseClaims(user: Requester) {
    requireAcademic(user);
    const rows = isAcademicManager(user)
      ? await prisma.$queryRaw<any[]>`
          SELECT * FROM "DirectorExpenseRecord"
          WHERE "status" <> 'ARCHIVED'
          ORDER BY "createdAt" DESC
        `
      : await prisma.$queryRaw<any[]>`
          SELECT * FROM "DirectorExpenseRecord"
          WHERE "createdBy" = ${user.id}
          ORDER BY "createdAt" DESC
        `;
    const expenses = normalizeRows(rows);
    return {
      summary: {
        total: expenses.reduce((sum: number, item: any) => sum + Number(item.amount || 0), 0),
        pending: expenses.filter((item: any) => item.status === "PENDING").length,
        approved: expenses.filter((item: any) => item.status === "APPROVED" || item.status === "ACTIVE").length,
        paid: expenses.filter((item: any) => item.status === "PAID").length,
      },
      expenses,
    };
  },

  async createExpenseClaim(user: Requester, input: DirectorExpenseInput) {
    requireAcademic(user);
    if (!input.title || !input.amount || Number(input.amount) <= 0) {
      throw Object.assign(new Error("Expense title and amount are required"), { statusCode: 400 });
    }
    const id = randomUUID();
    const now = new Date();
    await prisma.$executeRaw`
      INSERT INTO "DirectorExpenseRecord"
      ("id", "title", "category", "amount", "currency", "note", "status", "createdBy", "createdAt", "updatedAt")
      VALUES
      (${id}, ${input.title}, ${input.category || "Staff Claim"}, ${Number(input.amount)}, ${input.currency || "INR"}, ${input.note || null}, 'PENDING', ${user.id}, ${now}, ${now})
    `;
    const rows = await prisma.$queryRaw<any[]>`
      SELECT * FROM "DirectorExpenseRecord" WHERE "id" = ${id} LIMIT 1
    `;
    const expense = normalizeRows(rows)[0];
    await auditAcademicAction(user, "EXPENSE_CLAIM_CREATED", "DirectorExpenseRecord", id, expense);
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
    const requestedBatchIds = Array.from(new Set([...(input.batchIds || []), input.batchId].filter(Boolean)));
    if (!requestedBatchIds.length) {
      throw Object.assign(new Error("Batch is required"), { statusCode: 400 });
    }

    const batches = await db.batch.findMany({
      where: { id: { in: requestedBatchIds } },
      include: { course: true },
    });
    if (batches.length !== requestedBatchIds.length) {
      throw Object.assign(new Error("Batch not found"), { statusCode: 404 });
    }
    const batch = batches[0];
    const batchNames = batches.map((item: any) => item.name).join(", ");

    const student = await findStudentUserForAdmission(input);
    const enrollments = [];
    for (const activeBatch of batches) {
      enrollments.push(await this.addStudent(user, activeBatch.id, input));
    }
    const enrollment = enrollments[0];
    const now = new Date();
    const totalFee = Number(input.totalFee || 0);
    const amountPaid = Math.max(0, Number(input.amountPaid || 0));
    const paymentStatus = input.paymentStatus || (amountPaid >= totalFee && totalFee > 0 ? "PAID" : amountPaid > 0 ? "PARTIAL" : "PENDING");
    const approvalNotes = [
      input.notes || "",
      amountPaid > 0 ? `Payment confirmed: INR ${amountPaid} via ${input.paymentMethod || "MANUAL"}.` : "",
      input.transactionRef ? `Transaction reference: ${input.transactionRef}.` : "",
      `Batch allocation: ${batchNames}.`,
    ].filter(Boolean).join("\n");
    let admission: Record<string, unknown> | null = null;
    let payment: Record<string, unknown> | null = null;
    let feePlan: Record<string, unknown> | null = null;
    let feeInstallment: Record<string, unknown> | null = null;

    if (batch.courseId) {
      const existingAdmission = input.leadId
        ? await prisma.admission.findFirst({ where: { leadId: input.leadId, studentId: student.id, courseId: batch.courseId } })
        : await prisma.admission.findFirst({ where: { studentId: student.id, courseId: batch.courseId, batch: { in: [batch.name, batchNames] } } });

      admission = existingAdmission
        ? await prisma.admission.update({
            where: { id: existingAdmission.id },
            data: {
              batch: batchNames,
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
              batch: batchNames,
              totalFee,
              paidAmount: amountPaid,
              dueAmount: Math.max(totalFee - amountPaid, 0),
              remarks: approvalNotes || null,
            },
          });
    }

    if (totalFee > 0) {
      feePlan = await prisma.feePlan.create({
        data: {
          studentId: student.id,
          admissionId: typeof admission?.id === "string" ? admission.id : undefined,
          courseId: batch.courseId || undefined,
          title: `Admission fee - ${batchNames}`,
          totalAmount: totalFee,
          netAmount: totalFee,
          paidAmount: amountPaid,
          dueAmount: Math.max(totalFee - amountPaid, 0),
          status: Math.max(totalFee - amountPaid, 0) > 0 ? "ACTIVE" : "PAID",
          createdBy: user.id,
        },
      });
      feeInstallment = await prisma.feeInstallment.create({
        data: {
          studentId: student.id,
          feePlanId: feePlan.id as string,
          title: "Admission fee",
          amount: totalFee,
          paidAmount: amountPaid,
          dueAmount: Math.max(totalFee - amountPaid, 0),
          dueDate: now,
          paidStatus: Math.max(totalFee - amountPaid, 0) > 0 ? (amountPaid > 0 ? "PARTIAL" : "PENDING") : "PAID",
          paidAt: amountPaid > 0 ? now : undefined,
          sequence: 1,
        },
      });
    }

    if (amountPaid > 0) {
      const method = (input.paymentMethod || "OFFICE_COLLECTION").toUpperCase();
      const receiptNumber = `NIDUS-ADMISSION-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
      payment = await prisma.payment.create({
        data: {
          userId: student.id,
          courseId: batch.courseId || undefined,
          admissionId: typeof admission?.id === "string" ? admission.id : undefined,
          feeInstallmentId: typeof feeInstallment?.id === "string" ? feeInstallment.id : undefined,
          collectorId: user.id,
          amount: amountPaid,
          currency: "INR",
          razorpayOrderId: `admission_manual_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          paymentStatus: "SUCCESS",
          paymentMethod: method,
          paymentMode: method === "RAZORPAY_LINK" ? "ONLINE" : "MANUAL",
          transactionRef: input.transactionRef || undefined,
          receiptNumber,
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

      const receiptDocument = await prisma.financeDocument.create({
        data: {
          ownerId: student.id,
          documentType: "PAYMENT_RECEIPT",
          targetType: "Payment",
          targetId: payment.id as string,
          documentNumber: receiptNumber,
          status: "QUEUED",
          metadata: {
            admissionId: admission?.id || null,
            batchIds: requestedBatchIds,
            batchName: batchNames,
            amount: amountPaid,
            currency: "INR",
            method,
          },
        },
      });
      await enqueuePDF({
        title: "NIDUS Academy Admission Receipt",
        lines: [
          `Receipt: ${receiptNumber}`,
          `Student: ${student.name || student.email}`,
          `Batch: ${batchNames}`,
          `Amount: INR ${amountPaid}`,
          `Method: ${method}`,
          input.transactionRef ? `Reference: ${input.transactionRef}` : "",
        ].filter(Boolean),
        storageKey: `payment_receipt/${receiptDocument.id}.pdf`,
      }).catch(async () => {
        await prisma.financeDocument.update({
          where: { id: receiptDocument.id },
          data: { status: "FAILED" },
        }).catch(() => undefined);
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
            notes: `${existingNotes}[${now.toISOString()}] Admission approved into ${batchNames}.${approvalNotes ? `\n${approvalNotes}` : ""}`,
          },
        });
      }
    }

    await auditAcademicAction(user, "ADMISSION_APPROVED_AND_ACTIVATED", "BatchStudent", enrollment.id, {
      batchId: input.batchId,
      batchIds: requestedBatchIds,
      batchName: batchNames,
      studentId: student.id,
      studentEmail: student.email,
      leadId: input.leadId || null,
      admissionId: admission?.id || null,
      paymentId: payment?.id || null,
      feePlanId: feePlan?.id || null,
      paymentStatus,
      amountPaid,
    });

    return {
      status: "APPROVED",
      message: "Admission approved and student dashboard activated.",
      applicationId: input.applicationId || null,
      leadId: input.leadId || null,
      student: {
        id: student.id,
        name: student.name,
        email: student.email,
        mobile: student.mobile,
      },
      enrollment,
      enrollments,
      admission,
      payment,
      feePlan,
      feeInstallment,
    };
  },
};
