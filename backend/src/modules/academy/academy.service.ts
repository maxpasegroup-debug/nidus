import { Prisma, Role } from "../../generated/prisma/client.js";
import { prisma } from "../../config/prisma.js";

type Requester = {
  id: string;
  role: Role;
  instituteId?: string | null;
  branchId?: string | null;
};

type BatchInput = {
  name: string;
  batchType: string;
  programSlug: string;
  courseId?: string;
  startDate?: string;
  endDate?: string;
  schedule?: Prisma.InputJsonValue;
};

type StudentInput = {
  studentId: string;
  status?: string;
  remarks?: string;
};

type TeacherInput = {
  teacherId: string;
  subject: string;
  role?: string;
  status?: string;
};

const batchInclude = {
  course: { select: { id: true, title: true, slug: true, examType: true, category: true } },
  students: {
    include: { student: { select: { id: true, name: true, email: true, mobile: true, role: true } } },
    orderBy: { joinedAt: "desc" as const }
  },
  teachers: {
    include: { teacher: { select: { id: true, name: true, email: true, mobile: true, role: true } } },
    orderBy: { createdAt: "desc" as const }
  },
  _count: { select: { students: true, teachers: true, tests: true } }
} as const;

function canManage(role: Role) {
  return role === Role.ADMIN || role === Role.DIRECTOR;
}

function batchScope(requester: Requester) {
  if (requester.role === Role.TEACHER) {
    return { teachers: { some: { teacherId: requester.id } } };
  }
  return {};
}

export const academyService = {
  async batches(requester: Requester, filters: { programSlug?: string; batchType?: string; status?: string } = {}) {
    return prisma.batch.findMany({
      where: {
        ...batchScope(requester),
        ...(filters.programSlug ? { programSlug: filters.programSlug } : {}),
        ...(filters.batchType ? { batchType: filters.batchType } : {}),
        ...(filters.status ? { status: filters.status } : {})
      },
      orderBy: [{ status: "asc" }, { startDate: "desc" }, { createdAt: "desc" }],
      include: batchInclude
    });
  },

  async createBatch(requester: Requester, input: BatchInput) {
    if (!canManage(requester.role)) throw new Error("Only administration or directors can create batches.");
    return prisma.batch.create({
      data: {
        name: input.name,
        batchType: input.batchType,
        programSlug: input.programSlug,
        courseId: input.courseId || undefined,
        instituteId: requester.instituteId ?? undefined,
        branchId: requester.branchId ?? undefined,
        startDate: input.startDate ? new Date(input.startDate) : undefined,
        endDate: input.endDate ? new Date(input.endDate) : undefined,
        schedule: input.schedule ?? undefined
      },
      include: batchInclude
    });
  },

  async addStudent(requester: Requester, batchId: string, input: StudentInput) {
    if (!canManage(requester.role)) throw new Error("Only administration or directors can assign students.");
    await prisma.batch.findUniqueOrThrow({ where: { id: batchId } });
    return prisma.batchStudent.upsert({
      where: { batchId_studentId: { batchId, studentId: input.studentId } },
      update: {
        status: input.status ?? "ACTIVE",
        remarks: input.remarks
      },
      create: {
        batchId,
        studentId: input.studentId,
        status: input.status ?? "ACTIVE",
        remarks: input.remarks
      },
      include: { student: { select: { id: true, name: true, email: true, mobile: true, role: true } }, batch: true }
    });
  },

  async assignTeacher(requester: Requester, batchId: string, input: TeacherInput) {
    if (!canManage(requester.role)) throw new Error("Only administration or directors can assign teachers.");
    await prisma.batch.findUniqueOrThrow({ where: { id: batchId } });
    return prisma.teacherBatchAssignment.upsert({
      where: { batchId_teacherId_subject: { batchId, teacherId: input.teacherId, subject: input.subject } },
      update: {
        role: input.role ?? "FACULTY",
        status: input.status ?? "ACTIVE"
      },
      create: {
        batchId,
        teacherId: input.teacherId,
        subject: input.subject,
        role: input.role ?? "FACULTY",
        status: input.status ?? "ACTIVE"
      },
      include: { teacher: { select: { id: true, name: true, email: true, mobile: true, role: true } }, batch: true }
    });
  },

  async teacherAssignments(requester: Requester) {
    return prisma.teacherBatchAssignment.findMany({
      where: requester.role === Role.TEACHER ? { teacherId: requester.id } : {},
      orderBy: { createdAt: "desc" },
      include: {
        batch: { include: { course: { select: { id: true, title: true, slug: true } }, _count: { select: { students: true, tests: true } } } },
        teacher: { select: { id: true, name: true, email: true, role: true } }
      }
    });
  }
};
