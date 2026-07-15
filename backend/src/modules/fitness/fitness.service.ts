import { prisma } from "../../config/prisma.js";
import type { Role } from "../../generated/prisma/client.js";
import { fitnessAIService } from "./fitness-ai.service.js";

const userSelect = { id: true, name: true, email: true, role: true } as const;
type FitnessRequester = { id: string; name?: string | null; email?: string | null; role: Role };

function isFitnessManager(requester: FitnessRequester) {
  return requester.role === "ADMIN" || requester.role === "DIRECTOR" || requester.role === "ACADEMIC_HEAD";
}

function isTrainer(requester: FitnessRequester) {
  return requester.role === "TEACHER" || requester.role === "PHYSICAL_TRAINER";
}

async function canAccessStudent(requester: FitnessRequester, studentId: string) {
  if (requester.id === studentId) return true;
  if (requester.role === "STUDENT") return requester.id === studentId;
  if (isFitnessManager(requester)) return true;
  if (!isTrainer(requester)) return false;
  const enrollment = await prisma.batchStudent.findFirst({
    where: {
      studentId,
      status: "ACTIVE",
      batch: {
        teachers: {
          some: {
            teacherId: requester.id,
            status: "ACTIVE"
          }
        }
      }
    },
    select: { id: true }
  });
  return Boolean(enrollment);
}

async function canAccessStudentInBatch(requester: FitnessRequester, studentId: string, batchId?: string | null) {
  if (!batchId) return canAccessStudent(requester, studentId);
  if (isFitnessManager(requester)) return true;
  const enrollment = await prisma.batchStudent.findFirst({
    where: {
      studentId,
      batchId,
      status: "ACTIVE",
      batch: {
        teachers: {
          some: {
            teacherId: requester.id,
            status: "ACTIVE"
          }
        }
      }
    },
    select: { id: true }
  });
  return Boolean(enrollment);
}

async function scopedUser(requester: FitnessRequester, userId?: string) {
  const targetUserId = userId || requester.id;
  if (!(await canAccessStudent(requester, targetUserId))) {
    throw Object.assign(new Error("Student fitness record is not assigned to this user"), { statusCode: 403 });
  }
  return targetUserId;
}

function metrics(input: { height: number; weight: number; runningTime: number; pushups: number; pullups: number; situps: number }) {
  const heightMeters = input.height / 100;
  const bmi = Number((input.weight / (heightMeters * heightMeters)).toFixed(1));
  const staminaScore = Math.max(0, Math.min(100, Math.round(100 - input.runningTime * 6 + input.pushups * 0.7 + input.pullups * 2 + input.situps * 0.4)));
  const fitnessLevel = staminaScore >= 85 ? "ELITE" : staminaScore >= 70 ? "READY" : staminaScore >= 55 ? "BUILDING" : "NEEDS_ATTENTION";
  return { bmi, staminaScore, fitnessLevel };
}

function eligibility(profile: { height: number; weight: number; bmi: number; staminaScore: number }, examType: string) {
  const minHeight = examType === "AFCAT" ? 162.5 : 157;
  const heightEligible = profile.height >= minHeight;
  const weightEligible = profile.weight >= 45 && profile.weight <= 95;
  const bmiEligible = profile.bmi >= 18.5 && profile.bmi <= 25;
  const staminaEligible = profile.staminaScore >= 65;
  const eligibilityStatus = heightEligible && weightEligible && bmiEligible && staminaEligible ? "ELIGIBLE" : "IMPROVEMENT_REQUIRED";
  const overallRemark = fitnessAIService.predictEligibilityImprovement({ eligibilityStatus, staminaEligible, bmiEligible });
  return { eligibilityStatus, heightEligible, weightEligible, bmiEligible, staminaEligible, overallRemark };
}

export const fitnessService = {
  profile(requester: FitnessRequester) {
    return prisma.fitnessProfile.findUnique({ where: { userId: requester.id }, include: { user: { select: userSelect } } });
  },
  async upsertProfile(requester: FitnessRequester, input: { userId?: string; height: number; weight: number; runningTime: number; pushups: number; pullups: number; situps: number }) {
    const userId = await scopedUser(requester, input.userId);
    const calculated = metrics(input);
    return prisma.fitnessProfile.upsert({
      where: { userId },
      update: { ...input, userId, ...calculated },
      create: { ...input, userId, ...calculated },
      include: { user: { select: userSelect } }
    });
  },
  ptSchedules(requester: FitnessRequester) {
    const where = isFitnessManager(requester)
      ? {}
      : {
          OR: [
            { trainerId: requester.id },
            { trainerId: null, trainerName: requester.name || requester.email || requester.id }
          ]
        };
    return prisma.pTSchedule.findMany({ where, orderBy: { scheduledDate: "asc" }, include: { attendances: true } });
  },
  async createPTSchedule(requester: FitnessRequester, input: { title: string; description: string; scheduledDate: string; trainerName: string; activityType: string; duration: number; batchId?: string }) {
    if (input.batchId && !isFitnessManager(requester)) {
      const assignment = await prisma.teacherBatchAssignment.findFirst({
        where: { batchId: input.batchId, teacherId: requester.id, status: "ACTIVE" },
        select: { id: true }
      });
      if (!assignment) throw Object.assign(new Error("This PT batch is not assigned to this trainer"), { statusCode: 403 });
    }
    return prisma.pTSchedule.create({
      data: {
        ...input,
        trainerId: requester.id,
        trainerName: input.trainerName || requester.name || requester.email || requester.id,
        scheduledDate: new Date(input.scheduledDate)
      }
    });
  },
  async markAttendance(requester: FitnessRequester, input: { studentId: string; ptScheduleId: string; attendanceStatus: string; remarks?: string }) {
    const schedule = await prisma.pTSchedule.findUnique({ where: { id: input.ptScheduleId } });
    if (!schedule) throw Object.assign(new Error("PT register not found"), { statusCode: 404 });
    if (schedule.trainerId && !isFitnessManager(requester) && schedule.trainerId !== requester.id) {
      throw Object.assign(new Error("This PT register is not assigned to this trainer"), { statusCode: 403 });
    }
    if (!(await canAccessStudentInBatch(requester, input.studentId, schedule.batchId))) {
      throw Object.assign(new Error("Student is not assigned to this trainer"), { statusCode: 403 });
    }
    const existing = await prisma.pTAttendance.findFirst({
      where: { studentId: input.studentId, ptScheduleId: input.ptScheduleId },
      orderBy: { markedAt: "desc" },
      select: { id: true }
    });
    if (existing) {
      return prisma.pTAttendance.update({
        where: { id: existing.id },
        data: { attendanceStatus: input.attendanceStatus, remarks: input.remarks, markedAt: new Date() },
        include: { student: { select: userSelect }, ptSchedule: true }
      });
    }
    return prisma.pTAttendance.create({ data: input, include: { student: { select: userSelect }, ptSchedule: true } });
  },
  async attendance(studentId: string, requester: FitnessRequester) {
    const scoped = requester.role === "STUDENT" ? requester.id : studentId;
    if (!(await canAccessStudent(requester, scoped))) {
      throw Object.assign(new Error("Student attendance is not assigned to this user"), { statusCode: 403 });
    }
    const rows = await prisma.pTAttendance.findMany({ where: { studentId: scoped }, orderBy: { markedAt: "desc" }, include: { ptSchedule: true, student: { select: userSelect } } });
    const latestBySchedule = new Map<string, (typeof rows)[number]>();
    for (const row of rows) {
      if (!latestBySchedule.has(row.ptScheduleId)) latestBySchedule.set(row.ptScheduleId, row);
    }
    return Array.from(latestBySchedule.values());
  },
  eligibility(requester: FitnessRequester) {
    return prisma.physicalEligibility.findMany({ where: { userId: requester.id }, orderBy: { updatedAt: "desc" } });
  },
  async checkEligibility(requester: FitnessRequester, input: { userId?: string; examType: string }) {
    const userId = await scopedUser(requester, input.userId);
    const profile = await prisma.fitnessProfile.findUnique({ where: { userId } });
    if (!profile) throw new Error("Fitness profile required before eligibility check");
    const result = eligibility(profile, input.examType);
    return prisma.physicalEligibility.upsert({
      where: { userId_examType: { userId, examType: input.examType } },
      update: result,
      create: { userId, examType: input.examType, ...result }
    });
  },
  async createLog(requester: FitnessRequester, input: { userId?: string; runningDistance: number; caloriesBurned: number; waterIntake: number; workoutDuration: number; notes?: string }) {
    return prisma.dailyFitnessLog.create({ data: { ...input, userId: await scopedUser(requester, input.userId) } });
  },
  logs(requester: FitnessRequester) {
    return prisma.dailyFitnessLog.findMany({ where: { userId: requester.id }, orderBy: { createdAt: "desc" } });
  },
  suggestionsForProfile(profile: { bmi: number; runningTime: number; pushups: number; pullups: number; staminaScore: number }) {
    return fitnessAIService.generateFitnessSuggestions(profile);
  }
};
