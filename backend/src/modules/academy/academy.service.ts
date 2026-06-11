import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";

import { Prisma, Role } from "../../generated/prisma/client.js";
import { prisma } from "../../config/prisma.js";

type Requester = {
  id: string;
  role: Role;
  email?: string | null;
};

type BatchInput = {
  name?: string;
  courseId?: string;
  batchType?: string;
  startDate?: string;
  endDate?: string;
  capacity?: number;
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
  role?: string;
};

type AcademicCalendarInput = {
  batchId?: string;
  batchName?: string;
  programSlug?: string;
  subject?: string;
  topic?: string;
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

type ApproveAdmissionInput = StudentInput & {
  batchId: string;
  applicationId?: string;
  leadId?: string;
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

const batchInclude = {
  course: true,
  students: {
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
        },
      },
    },
  },
  teachers: {
    include: {
      teacher: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
  },
  _count: {
    select: {
      students: true,
      teachers: true,
    },
  },
} satisfies Prisma.BatchInclude;

function requireManagement(user: Requester) {
  if (user.role !== Role.ADMIN && user.role !== Role.DIRECTOR) {
    throw Object.assign(new Error("Management access required"), { statusCode: 403 });
  }
}

function requireAcademic(user: Requester) {
  if (user.role !== Role.ADMIN && user.role !== Role.DIRECTOR && user.role !== Role.TEACHER) {
    throw Object.assign(new Error("Academic access required"), { statusCode: 403 });
  }
}

function toDate(value?: string) {
  return value ? new Date(value) : undefined;
}

function sanitizeCalendarRow(row: AcademicCalendarRow) {
  return {
    ...row,
    plannedDate: row.plannedDate.toISOString(),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

async function findStudentUserForAdmission(input: StudentInput) {
  if (input.userId) {
    return prisma.user.update({
      where: { id: input.userId },
      data: { role: Role.STUDENT, mustChangePassword: false },
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
      phone: input.phone || existing.phone,
      role: Role.STUDENT,
      mustChangePassword: false,
    },
  });
}

export const academyService = {
  async batches() {
    return prisma.batch.findMany({
      include: batchInclude,
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    });
  },

  async createBatch(user: Requester, input: BatchInput) {
    requireManagement(user);
    if (!input.name) {
      throw Object.assign(new Error("Batch name is required"), { statusCode: 400 });
    }

    return prisma.batch.create({
      data: {
        name: input.name,
        courseId: input.courseId || null,
        batchType: input.batchType || "OFFLINE",
        startDate: toDate(input.startDate),
        endDate: toDate(input.endDate),
        capacity: input.capacity,
        status: input.status || "ACTIVE",
      },
      include: batchInclude,
    });
  },

  async updateBatch(user: Requester, batchId: string, input: BatchInput) {
    requireManagement(user);
    return prisma.batch.update({
      where: { id: batchId },
      data: {
        name: input.name,
        courseId: input.courseId,
        batchType: input.batchType,
        startDate: toDate(input.startDate),
        endDate: toDate(input.endDate),
        capacity: input.capacity,
        status: input.status,
      },
      include: batchInclude,
    });
  },

  async addStudent(user: Requester, batchId: string, input: StudentInput) {
    requireManagement(user);
    const student = await findStudentUserForAdmission(input);

    return prisma.batchStudent.upsert({
      where: {
        batchId_userId: {
          batchId,
          userId: student.id,
        },
      },
      update: {
        rollNumber: input.rollNumber,
        notes: input.notes,
        status: "ACTIVE",
      },
      create: {
        batchId,
        userId: student.id,
        rollNumber: input.rollNumber,
        notes: input.notes,
        status: "ACTIVE",
      },
      include: {
        batch: { include: { course: true } },
        user: { select: { id: true, name: true, email: true, phone: true, role: true } },
      },
    });
  },

  async assignTeacher(user: Requester, batchId: string, input: TeacherInput) {
    requireAcademic(user);
    if (!input.teacherId) {
      throw Object.assign(new Error("Teacher is required"), { statusCode: 400 });
    }

    return prisma.batchTeacher.upsert({
      where: {
        batchId_teacherId_subject: {
          batchId,
          teacherId: input.teacherId,
          subject: input.subject || "General",
        },
      },
      update: {
        role: input.role || "Subject Teacher",
        status: "ACTIVE",
      },
      create: {
        batchId,
        teacherId: input.teacherId,
        subject: input.subject || "General",
        role: input.role || "Subject Teacher",
        status: "ACTIVE",
      },
      include: {
        batch: { include: { course: true } },
        teacher: { select: { id: true, name: true, email: true, role: true } },
      },
    });
  },

  async teacherAssignments(user: Requester) {
    requireAcademic(user);
    if (user.role === Role.ADMIN || user.role === Role.DIRECTOR) {
      return prisma.batchTeacher.findMany({
        include: {
          batch: { include: batchInclude },
          teacher: { select: { id: true, name: true, email: true, role: true } },
        },
        orderBy: { createdAt: "desc" },
      });
    }

    return prisma.batchTeacher.findMany({
      where: { teacherId: user.id, status: "ACTIVE" },
      include: {
        batch: { include: batchInclude },
        teacher: { select: { id: true, name: true, email: true, role: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  },

  async myAcademicPlan(user: Requester) {
    const enrollments = await prisma.batchStudent.findMany({
      where: { userId: user.id, status: "ACTIVE" },
      include: {
        batch: {
          include: batchInclude,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const batchIds = enrollments.map((enrollment) => enrollment.batchId);
    const calendar = batchIds.length
      ? await prisma.$queryRaw<AcademicCalendarRow[]>`
          SELECT * FROM "AcademicCalendarItem"
          WHERE "batchId" IN (${Prisma.join(batchIds)})
          ORDER BY "plannedDate" ASC, "startTime" ASC
        `
      : [];

    return {
      enrollments,
      batches: enrollments.map((enrollment) => enrollment.batch),
      calendar: calendar.map(sanitizeCalendarRow),
    };
  },

  async teachers() {
    return prisma.user.findMany({
      where: { role: { in: [Role.TEACHER, Role.DIRECTOR] } },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        roleMetadata: true,
      },
      orderBy: { name: "asc" },
    });
  },

  async employees(user: Requester, includeArchived = false) {
    requireManagement(user);
    const users = await prisma.user.findMany({
      where: {
        role: {
          in: [Role.ADMIN, Role.DIRECTOR, Role.TEACHER, Role.STUDENT],
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
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
    requireManagement(user);
    if (!input.name || !input.email || !input.role) {
      throw Object.assign(new Error("Name, email and role are required"), { statusCode: 400 });
    }

    const allowedRoles = [Role.ADMIN, Role.DIRECTOR, Role.TEACHER];
    if (!allowedRoles.includes(input.role)) {
      throw Object.assign(new Error("Only employee roles can be created here"), { statusCode: 400 });
    }

    const temporaryPassword = input.password || "123456789";
    const passwordHash = await bcrypt.hash(temporaryPassword, 10);
    const roleMetadata = {
      designation: input.designation || "Employee",
      department: input.department || "Academy",
      employmentType: input.employmentType || "FULL_TIME",
      hourlyRate: input.hourlyRate || null,
      subjects: input.subjects || [],
      dashboardTemplate: input.dashboardTemplate || (input.designation?.toLowerCase().includes("academic head") ? "ACADEMIC_HEAD" : undefined),
      status: "ACTIVE",
      createdBy: user.id,
      credentialGeneratedAt: new Date().toISOString(),
    };

    const created = await prisma.user.create({
      data: {
        name: input.name,
        email: input.email.toLowerCase(),
        phone: input.phone,
        role: input.role,
        passwordHash,
        mustChangePassword: true,
        roleMetadata,
      } as Prisma.UserUncheckedCreateInput,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
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
    const roleMetadata = {
      ...existingMetadata,
      designation: input.designation ?? existingMetadata.designation,
      department: input.department ?? existingMetadata.department,
      employmentType: input.employmentType ?? existingMetadata.employmentType,
      hourlyRate: input.hourlyRate ?? existingMetadata.hourlyRate,
      subjects: input.subjects ?? existingMetadata.subjects,
      dashboardTemplate: input.dashboardTemplate ?? existingMetadata.dashboardTemplate,
      status: input.status ?? existingMetadata.status ?? "ACTIVE",
      updatedBy: user.id,
      updatedAt: new Date().toISOString(),
    };

    return prisma.user.update({
      where: { id: employeeId },
      data: {
        name: input.name,
        email: input.email?.toLowerCase(),
        phone: input.phone,
        role: input.role,
        roleMetadata,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        roleMetadata: true,
      },
    });
  },

  async archiveEmployee(user: Requester, employeeId: string) {
    requireManagement(user);
    return this.updateEmployee(user, employeeId, { status: "ARCHIVED" });
  },

  async resetEmployeePassword(user: Requester, employeeId: string, password = "123456789") {
    requireManagement(user);
    const passwordHash = await bcrypt.hash(password, 10);
    const employee = await prisma.user.findUnique({ where: { id: employeeId } });
    if (!employee) {
      throw Object.assign(new Error("Employee not found"), { statusCode: 404 });
    }
    const existingMetadata = (employee.roleMetadata ?? {}) as Record<string, unknown>;
    const updated = await prisma.user.update({
      where: { id: employeeId },
      data: {
        passwordHash,
        mustChangePassword: true,
        roleMetadata: {
          ...existingMetadata,
          passwordResetBy: user.id,
          passwordResetAt: new Date().toISOString(),
        },
      } as Prisma.UserUncheckedUpdateInput,
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
        temporaryPassword: password,
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

    const id = randomUUID();
    const now = new Date();
    await prisma.$executeRaw`
      INSERT INTO "AcademicCalendarItem"
      ("id", "batchId", "batchName", "programSlug", "subject", "topic", "plannedDate", "startTime", "endTime", "teacherId", "teacherName", "status", "completionStatus", "teacherLog", "nextAction", "createdAt", "updatedAt")
      VALUES
      (${id}, ${input.batchId || null}, ${input.batchName || null}, ${input.programSlug || null}, ${input.subject}, ${input.topic}, ${new Date(input.plannedDate)}, ${input.startTime || null}, ${input.endTime || null}, ${input.teacherId || null}, ${input.teacherName || null}, ${input.status || "PLANNED"}, ${input.completionStatus || "PENDING"}, ${input.teacherLog || null}, ${input.nextAction || null}, ${now}, ${now})
    `;

    const rows = await prisma.$queryRaw<AcademicCalendarRow[]>`
      SELECT * FROM "AcademicCalendarItem" WHERE "id" = ${id} LIMIT 1
    `;
    return sanitizeCalendarRow(rows[0]);
  },

  async updateAcademicCalendarItem(id: string, input: AcademicCalendarInput) {
    const rows = await prisma.$queryRaw<AcademicCalendarRow[]>`
      SELECT * FROM "AcademicCalendarItem" WHERE "id" = ${id} LIMIT 1
    `;
    const current = rows[0];
    if (!current) {
      throw Object.assign(new Error("Calendar item not found"), { statusCode: 404 });
    }

    await prisma.$executeRaw`
      UPDATE "AcademicCalendarItem"
      SET
        "subject" = ${input.subject ?? current.subject},
        "topic" = ${input.topic ?? current.topic},
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
    return sanitizeCalendarRow(updated[0]);
  },

  async approveAdmissionToBatch(user: Requester, input: ApproveAdmissionInput) {
    requireManagement(user);
    if (!input.batchId) {
      throw Object.assign(new Error("Batch is required"), { statusCode: 400 });
    }

    const enrollment = await this.addStudent(user, input.batchId, input);
    return {
      status: "APPROVED",
      message: "Admission approved and student dashboard activated.",
      applicationId: input.applicationId || null,
      leadId: input.leadId || null,
      enrollment,
    };
  },
};
