import { prisma } from "../../config/prisma.js";
import { InOutType, type Role } from "../../generated/prisma/client.js";

const studentSelect = { id: true, name: true, email: true, role: true } as const;
const roomInclude = { hostel: true } as const;
const allocationInclude = { student: { select: studentSelect }, hostel: true, room: true } as const;

function isStudent(role: Role) {
  return role === "STUDENT";
}

function assertStudentAccess(requester: { id: string; role: Role }, studentId: string) {
  if (isStudent(requester.role) && requester.id !== studentId) {
    throw new Error("Students can access only their own hostel records");
  }
}

export const hostelService = {
  hostels() {
    return prisma.hostel.findMany({ orderBy: { createdAt: "desc" }, include: { rooms: true } });
  },
  createHostel(input: { name: string; type: "BOYS" | "GIRLS"; totalRooms: number; wardenName: string }) {
    return prisma.hostel.create({ data: input });
  },
  rooms(hostelId?: string) {
    return prisma.room.findMany({ where: hostelId ? { hostelId } : undefined, orderBy: [{ floor: "asc" }, { roomNumber: "asc" }], include: roomInclude });
  },
  createRoom(input: { hostelId: string; roomNumber: string; floor: number; capacity: number; status?: string }) {
    return prisma.room.create({ data: { ...input, occupiedCount: 0, status: input.status ?? "AVAILABLE" }, include: roomInclude });
  },
  async allocate(input: { studentId: string; hostelId: string; roomId: string; status?: string }) {
    return prisma.$transaction(async (tx) => {
      const room = await tx.room.findUnique({ where: { id: input.roomId } });
      if (!room || room.hostelId !== input.hostelId) throw new Error("Room does not belong to selected hostel");
      if (room.occupiedCount >= room.capacity) throw new Error("Room is already at full capacity");

      const allocation = await tx.hostelAllocation.create({
        data: { ...input, status: input.status ?? "ACTIVE" },
        include: allocationInclude
      });

      const occupiedCount = room.occupiedCount + 1;
      await tx.room.update({
        where: { id: room.id },
        data: { occupiedCount, status: occupiedCount >= room.capacity ? "FULL" : "AVAILABLE" }
      });

      return allocation;
    });
  },
  studentProfile(studentId: string, requester: { id: string; role: Role }) {
    assertStudentAccess(requester, studentId);
    return prisma.user.findUnique({
      where: { id: studentId },
      select: {
        id: true,
        name: true,
        email: true,
        hostelAllocations: { include: { hostel: true, room: true }, orderBy: { allocatedAt: "desc" } },
        inOutEntries: { orderBy: { entryTime: "desc" }, take: 20 },
        hostelLeaves: { orderBy: { fromDate: "desc" } },
        disciplineRecords: { orderBy: { createdAt: "desc" } },
        paradePerformances: { orderBy: { createdAt: "desc" } }
      }
    });
  },
  createInOut(input: { studentId: string; type: InOutType; entryTime?: string; remarks?: string }, requester: { id: string; role: Role }) {
    assertStudentAccess(requester, input.studentId);
    return prisma.inOutEntry.create({
      data: { studentId: input.studentId, type: input.type, entryTime: input.entryTime ? new Date(input.entryTime) : undefined, remarks: input.remarks },
      include: { student: { select: studentSelect } }
    });
  },
  inOutHistory(requester: { id: string; role: Role }, studentId?: string) {
    const scopedStudentId = isStudent(requester.role) ? requester.id : studentId;
    return prisma.inOutEntry.findMany({
      where: scopedStudentId ? { studentId: scopedStudentId } : undefined,
      orderBy: { entryTime: "desc" },
      include: { student: { select: studentSelect } }
    });
  },
  createLeave(input: { studentId: string; reason: string; fromDate: string; toDate: string }, requester: { id: string; role: Role }) {
    assertStudentAccess(requester, input.studentId);
    return prisma.hostelLeave.create({
      data: { studentId: input.studentId, reason: input.reason, fromDate: new Date(input.fromDate), toDate: new Date(input.toDate), status: "PENDING" },
      include: { student: { select: studentSelect }, approver: { select: studentSelect } }
    });
  },
  leaves(requester: { id: string; role: Role }) {
    return prisma.hostelLeave.findMany({
      where: isStudent(requester.role) ? { studentId: requester.id } : undefined,
      orderBy: { fromDate: "desc" },
      include: { student: { select: studentSelect }, approver: { select: studentSelect } }
    });
  },
  updateLeave(id: string, input: { status: string }, requester: { id: string; role: Role }) {
    return prisma.hostelLeave.update({
      where: { id },
      data: { status: input.status, approvedBy: requester.id },
      include: { student: { select: studentSelect }, approver: { select: studentSelect } }
    });
  },
  messMenu() {
    return prisma.messMenu.findMany({ orderBy: { date: "asc" } });
  },
  upsertMessMenu(input: { date: string; breakfast: string; lunch: string; snacks: string; dinner: string }) {
    const date = new Date(input.date);
    return prisma.messMenu.upsert({
      where: { date },
      update: { breakfast: input.breakfast, lunch: input.lunch, snacks: input.snacks, dinner: input.dinner },
      create: { ...input, date }
    });
  },
  createDiscipline(input: { studentId: string; category: string; description: string; severity: string; actionTaken: string }, recordedBy: string) {
    return prisma.disciplineRecord.create({
      data: { ...input, recordedBy },
      include: { student: { select: studentSelect }, recorder: { select: studentSelect } }
    });
  },
  disciplineByStudent(studentId: string, requester: { id: string; role: Role }) {
    assertStudentAccess(requester, studentId);
    return prisma.disciplineRecord.findMany({ where: { studentId }, orderBy: { createdAt: "desc" }, include: { student: { select: studentSelect } } });
  },
  createParade(input: { studentId: string; attendance: number; discipline: number; leadership: number; fitness: number; remarks?: string }) {
    return prisma.paradePerformance.create({ data: input, include: { student: { select: studentSelect } } });
  },
  paradeByStudent(studentId: string, requester: { id: string; role: Role }) {
    assertStudentAccess(requester, studentId);
    return prisma.paradePerformance.findMany({ where: { studentId }, orderBy: { createdAt: "desc" }, include: { student: { select: studentSelect } } });
  }
};
