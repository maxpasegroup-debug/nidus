import { prisma } from "../../config/prisma.js";
import type { Role } from "../../generated/prisma/client.js";
import { fitnessAIService } from "./fitness-ai.service.js";

const userSelect = { id: true, name: true, email: true, role: true } as const;

function scopedUser(requester: { id: string; role: Role }, userId?: string) {
  return requester.role === "ADMIN" && userId ? userId : requester.id;
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
  profile(requester: { id: string; role: Role }) {
    return prisma.fitnessProfile.findUnique({ where: { userId: requester.id }, include: { user: { select: userSelect } } });
  },
  upsertProfile(requester: { id: string; role: Role }, input: { userId?: string; height: number; weight: number; runningTime: number; pushups: number; pullups: number; situps: number }) {
    const userId = scopedUser(requester, input.userId);
    const calculated = metrics(input);
    return prisma.fitnessProfile.upsert({
      where: { userId },
      update: { ...input, userId, ...calculated },
      create: { ...input, userId, ...calculated },
      include: { user: { select: userSelect } }
    });
  },
  ptSchedules() {
    return prisma.pTSchedule.findMany({ orderBy: { scheduledDate: "asc" }, include: { attendances: true } });
  },
  createPTSchedule(input: { title: string; description: string; scheduledDate: string; trainerName: string; activityType: string; duration: number }) {
    return prisma.pTSchedule.create({ data: { ...input, scheduledDate: new Date(input.scheduledDate) } });
  },
  markAttendance(input: { studentId: string; ptScheduleId: string; attendanceStatus: string; remarks?: string }) {
    return prisma.pTAttendance.create({ data: input, include: { student: { select: userSelect }, ptSchedule: true } });
  },
  attendance(studentId: string, requester: { id: string; role: Role }) {
    const scoped = requester.role === "STUDENT" ? requester.id : studentId;
    return prisma.pTAttendance.findMany({ where: { studentId: scoped }, orderBy: { markedAt: "desc" }, include: { ptSchedule: true, student: { select: userSelect } } });
  },
  eligibility(requester: { id: string; role: Role }) {
    return prisma.physicalEligibility.findMany({ where: { userId: requester.id }, orderBy: { updatedAt: "desc" } });
  },
  async checkEligibility(requester: { id: string; role: Role }, input: { userId?: string; examType: string }) {
    const userId = scopedUser(requester, input.userId);
    const profile = await prisma.fitnessProfile.findUnique({ where: { userId } });
    if (!profile) throw new Error("Fitness profile required before eligibility check");
    const result = eligibility(profile, input.examType);
    return prisma.physicalEligibility.upsert({
      where: { userId_examType: { userId, examType: input.examType } },
      update: result,
      create: { userId, examType: input.examType, ...result }
    });
  },
  createLog(requester: { id: string; role: Role }, input: { userId?: string; runningDistance: number; caloriesBurned: number; waterIntake: number; workoutDuration: number; notes?: string }) {
    return prisma.dailyFitnessLog.create({ data: { ...input, userId: scopedUser(requester, input.userId) } });
  },
  logs(requester: { id: string; role: Role }) {
    return prisma.dailyFitnessLog.findMany({ where: { userId: requester.id }, orderBy: { createdAt: "desc" } });
  },
  suggestionsForProfile(profile: { bmi: number; runningTime: number; pushups: number; pullups: number; staminaScore: number }) {
    return fitnessAIService.generateFitnessSuggestions(profile);
  }
};
