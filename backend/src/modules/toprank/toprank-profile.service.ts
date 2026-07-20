import { prisma } from "../../config/prisma.js";

type ProfileInput = {
  age?: number;
  gender?: string;
  heightCm?: number;
  weightKg?: number;
  education?: string;
  currentOccupation?: string;
  preferredLanguage?: string;
  previousAgniveerAttempts?: number;
  runningExperience?: string;
  pushUpExperience?: string;
  sitUpExperience?: string;
  currentPreparationLevel?: string;
  dailyStudyHours?: number;
  internetAvailability?: string;
  deviceType?: string;
  learningPreference?: string;
  careerGoal?: string;
};

function percent(input: ProfileInput) {
  const keys = Object.keys(input) as Array<keyof ProfileInput>;
  const complete = keys.filter((key) => input[key] !== undefined && input[key] !== null && String(input[key]).trim() !== "").length;
  return Math.round((complete / 17) * 100);
}

export const topRankProfileService = {
  async upsert(userId: string, input: ProfileInput) {
    return prisma.topRankStudentProfile.upsert({
      where: { userId },
      create: { userId, ...input, completionPercentage: percent(input) },
      update: { ...input, completionPercentage: percent(input) }
    });
  },

  async get(userId: string) {
    return prisma.topRankStudentProfile.findUnique({ where: { userId } });
  }
};

