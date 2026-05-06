import { prisma } from "../../config/prisma.js";

export const erpService = {
  markAttendance(markerId: string, input: { userId: string; date: string; status: string }) {
    return prisma.attendance.create({
      data: { userId: input.userId, date: new Date(input.date), status: input.status, markedBy: markerId },
      include: { user: { select: { id: true, name: true, role: true } } }
    });
  },
  studentAttendance(userId: string) {
    return prisma.attendance.findMany({ where: { userId }, orderBy: { date: "desc" } });
  },
  classAttendance() {
    return prisma.attendance.findMany({
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
  faculty() {
    return prisma.faculty.findMany({ include: { user: { select: { id: true, name: true, email: true } }, payrolls: true } });
  },
  createFaculty(input: { userId: string; department: string; designation: string; joiningDate: string; salary: number; status: string }) {
    return prisma.faculty.create({ data: { ...input, joiningDate: new Date(input.joiningDate) }, include: { user: true } });
  },
  payroll() {
    return prisma.payroll.findMany({ include: { faculty: { include: { user: { select: { name: true, email: true } } } } } });
  },
  createPayroll(input: { facultyId: string; month: string; basicSalary: number; incentives: number; deductions: number; paidStatus: string }) {
    return prisma.payroll.create({ data: { ...input, totalSalary: input.basicSalary + input.incentives - input.deductions } });
  },
  announcements() {
    return prisma.announcement.findMany({ orderBy: { createdAt: "desc" } });
  },
  createAnnouncement(input: { title: string; description: string; targetAudience: string }) {
    return prisma.announcement.create({ data: input });
  }
};
