import { prisma } from "../../config/prisma.js";

type TenantScope = { id: string; instituteId: string | null };

function requireTenant(scope: TenantScope) {
  if (!scope.instituteId) throw Object.assign(new Error("Institution scope is required"), { statusCode: 403 });
  return scope.instituteId;
}

export const erpService = {
  async markAttendance(marker: TenantScope, input: { userId: string; date: string; status: string }) {
    const instituteId = requireTenant(marker);
    const user = await prisma.user.findFirst({ where: { id: input.userId, instituteId }, select: { id: true } });
    if (!user) throw Object.assign(new Error("Attendance user is outside the institution"), { statusCode: 403 });
    return prisma.attendance.create({
      data: { userId: input.userId, date: new Date(input.date), status: input.status, markedBy: marker.id },
      include: { user: { select: { id: true, name: true, role: true } } }
    });
  },
  async studentAttendance(scope: TenantScope, userId: string) {
    const instituteId = requireTenant(scope);
    return prisma.attendance.findMany({ where: { userId, user: { instituteId } }, orderBy: { date: "desc" } });
  },
  async classAttendance(scope: TenantScope) {
    const instituteId = requireTenant(scope);
    return prisma.attendance.findMany({
      where: { user: { instituteId } },
      orderBy: { date: "desc" },
      include: { user: { select: { id: true, name: true, role: true } } }
    });
  },
  timetable() {
    return prisma.timetable.findMany({ orderBy: { startTime: "asc" } });
  },
  createTimetable(input: { title: string; batch: string; subject: string; instructor: string; startTime: string; endTime: string; classroom: string }) {
    return prisma.timetable.create({ data: { ...input, startTime: new Date(input.startTime), endTime: new Date(input.endTime) } });
  },
  updateTimetable(id: string, input: Partial<{ title: string; batch: string; subject: string; instructor: string; startTime: string; endTime: string; classroom: string }>) {
    return prisma.timetable.update({
      where: { id },
      data: { ...input, startTime: input.startTime ? new Date(input.startTime) : undefined, endTime: input.endTime ? new Date(input.endTime) : undefined }
    });
  },
  async deleteTimetable(id: string) {
    await prisma.timetable.delete({ where: { id } });
    return { message: "Timetable deleted successfully" };
  },
  async faculty(scope: TenantScope) {
    const instituteId = requireTenant(scope);
    return prisma.faculty.findMany({ where: { user: { instituteId } }, include: { user: { select: { id: true, name: true, email: true } }, payrolls: true } });
  },
  createFaculty(input: { userId: string; department: string; designation: string; joiningDate: string; salary: number; status: string }) {
    return prisma.faculty.create({ data: { ...input, joiningDate: new Date(input.joiningDate) }, include: { user: true } });
  },
  async payroll(scope: TenantScope) {
    const instituteId = requireTenant(scope);
    return prisma.payroll.findMany({ where: { faculty: { user: { instituteId } } }, include: { faculty: { include: { user: { select: { name: true, email: true } } } } } });
  },
  createPayroll(input: { facultyId: string; month: string; basicSalary: number; incentives: number; deductions: number; paidStatus: string }) {
    return prisma.payroll.create({ data: { ...input, totalSalary: input.basicSalary + input.incentives - input.deductions } });
  },
  async operationsShell() {
    const [hostelAdmissions, roomAllocations, leaveRequests, payrollPending, timetableSlots, facultyCount] = await Promise.all([
      prisma.hostelAllocation.count(),
      prisma.room.count({ where: { status: { not: "AVAILABLE" } } }),
      prisma.hostelLeave.count({ where: { status: "PENDING" } }),
      prisma.payroll.count({ where: { paidStatus: { not: "PAID" } } }),
      prisma.timetable.count(),
      prisma.faculty.count()
    ]);
    return {
      hostelAdmissionShell: { activeAllocations: hostelAdmissions, status: "READY" },
      roomAllocationShell: { occupiedRooms: roomAllocations, status: "READY" },
      leaveManagementShell: { pendingLeaves: leaveRequests, status: "READY" },
      payrollWorkflowShell: { pendingPayroll: payrollPending, status: "READY" },
      timetableAutomationShell: { scheduledSlots: timetableSlots, status: "READY" },
      facultyAssignmentWorkflow: { facultyCount, status: "READY" }
    };
  },
  async announcements(scope: TenantScope) {
    const instituteId = requireTenant(scope);
    return prisma.announcement.findMany({ where: { creator: { instituteId } }, orderBy: { createdAt: "desc" } });
  },
  createAnnouncement(scope: TenantScope, input: { title: string; description: string; targetAudience: string }) {
    requireTenant(scope);
    return prisma.announcement.create({ data: { ...input, createdBy: scope.id } });
  }
};
