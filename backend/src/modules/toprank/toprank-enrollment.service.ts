import { prisma } from "../../config/prisma.js";
import { topRankBatchService } from "./toprank-batch.service.js";

export const topRankEnrollmentService = {
  async ensureEnrollment(userId: string) {
    const program = await topRankBatchService.ensureAgniveerFoundation();
    const enrollment = await prisma.topRankEnrollment.findFirst({ where: { userId, programId: program.id }, orderBy: { enrollmentDate: "desc" } });
    if (enrollment) return enrollment;
    return prisma.topRankEnrollment.create({ data: { userId, programId: program.id, status: "ONBOARDING", currentStep: "WELCOME" } });
  },

  async selectBatch(userId: string, batchId: string) {
    const enrollment = await this.ensureEnrollment(userId);
    const batch = await prisma.topRankBatch.findUnique({ where: { id: batchId } });
    if (!batch) throw new Error("Selected TopRank batch was not found");
    const updated = await prisma.topRankEnrollment.update({
      where: { id: enrollment.id },
      data: { batchId, currentStep: "TERMS", status: "BATCH_SELECTED" }
    });
    await prisma.topRankBatchAssignment.upsert({
      where: { userId_batchId: { userId, batchId } },
      create: { userId, batchId, enrollmentId: enrollment.id, status: "ASSIGNED" },
      update: { enrollmentId: enrollment.id, status: "ASSIGNED" }
    });
    return updated;
  },

  async acceptAgreement(userId: string, context: { ip?: string; userAgent?: string }) {
    const enrollment = await this.ensureEnrollment(userId);
    const agreement = await prisma.topRankProgramAgreement.create({
      data: {
        userId,
        programId: enrollment.programId,
        enrollmentId: enrollment.id,
        accepted: true,
        acceptedAt: new Date(),
        ipAddress: context.ip,
        userAgent: context.userAgent
      }
    });
    await prisma.topRankEnrollment.update({ where: { id: enrollment.id }, data: { currentStep: "CONFIRMATION", status: "AGREEMENT_ACCEPTED" } });
    return agreement;
  },

  async complete(userId: string) {
    const enrollment = await this.ensureEnrollment(userId);
    return prisma.topRankEnrollment.update({ where: { id: enrollment.id }, data: { currentStep: "WELCOME", status: "ENROLLED", completedAt: new Date() } });
  },

  async getStatus(userId: string) {
    const enrollment = await this.ensureEnrollment(userId);
    const [profile, selectedBatch, agreement] = await Promise.all([
      prisma.topRankStudentProfile.findUnique({ where: { userId } }),
      enrollment.batchId ? prisma.topRankBatch.findUnique({ where: { id: enrollment.batchId } }) : Promise.resolve(null),
      prisma.topRankProgramAgreement.findFirst({ where: { userId, enrollmentId: enrollment.id, accepted: true }, orderBy: { acceptedAt: "desc" } })
    ]);
    return { enrollment, profile, selectedBatch, agreement };
  }
};
